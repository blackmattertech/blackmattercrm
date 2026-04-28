import express from 'express';
import { authenticate, requireSales } from '../middleware/auth.middleware.js';
import { logger } from '../utils/logger.js';
import multer from 'multer';
import { supabase } from '../index.js';

const router = express.Router();
router.use(authenticate);
const marketingAssetUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
      return;
    }
    cb(new Error('Only image and video files are allowed'));
  },
});

type MailjetCampaign = Record<string, any>;
type MailjetStat = Record<string, any>;

const monthKey = (d: Date) => d.toLocaleString('en-US', { month: 'short' });
const monthKeys = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];

const num = (obj: Record<string, any>, keys: string[]) => {
  for (const key of keys) {
    const value = obj?.[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
  }
  return 0;
};

const pct = (v: number) => `${v.toFixed(2)}%`;

const fetchMailjet = async (
  path: string,
  options?: { method?: string; body?: Record<string, any> }
): Promise<any> => {
  const apiKey = process.env.MAILJET_API_KEY;
  const secretKey = process.env.MAILJET_SECRET_KEY;
  if (!apiKey || !secretKey) {
    throw new Error('Mailjet API keys are not configured');
  }
  const token = Buffer.from(`${apiKey}:${secretKey}`).toString('base64');
  const method = options?.method || 'GET';
  const response = await fetch(`https://api.mailjet.com${path}`, {
    method,
    headers: {
      Authorization: `Basic ${token}`,
      'Content-Type': 'application/json',
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Mailjet request failed (${response.status}): ${body}`);
  }
  return response.json();
};

const parseMailjetError = (error: any) => {
  const message = String(error?.message || '');
  const match = message.match(/Mailjet request failed \((\d+)\):\s*(.*)$/);
  if (!match) return { status: 500, message };
  const status = Number(match[1]) || 500;
  const body = match[2] || '';
  return {
    status,
    message: body || message,
  };
};

const isContactAlreadyExistsError = (msg: string) => {
  const lowered = msg.toLowerCase();
  return lowered.includes('already exists') || lowered.includes('mj18');
};

const normalizeCampaign = (campaign: Record<string, any>, source: 'campaign' | 'draft') => {
  const statusRaw = String(campaign?.Status || campaign?.status || '').toLowerCase();
  const mappedCampaignStatus =
    statusRaw.includes('schedule') ? 'scheduled' :
    statusRaw.includes('run') ? 'running' :
    statusRaw.includes('send') ? 'sent' :
    'sent';
  const status = source === 'draft' ? (statusRaw || 'draft') : mappedCampaignStatus;
  const sentCount = num(campaign, ['SentCount', 'DeliveredCount', 'MsgSent', 'ContactsCount']);
  const openedCount = num(campaign, ['OpenedCount', 'OpenCount', 'MessageOpenedCount']);
  const clickedCount = num(campaign, ['ClickedCount', 'ClickCount', 'MessageClickedCount']);
  const progress = sentCount > 0 ? Math.round((openedCount / sentCount) * 100) : 0;
  const createdAtRaw = campaign?.CreatedAt || campaign?.ArrivedAt || campaign?.SendStartAt || new Date().toISOString();
  return {
    id: campaign?.ID,
    active: ['sent', 'running', 'scheduled'].includes(status),
    name: campaign?.Title || campaign?.title || campaign?.Subject || 'Untitled Campaign',
    subject: campaign?.Subject || '-',
    status,
    source,
    progress: Math.max(0, Math.min(progress, 100)),
    leads: num(campaign, ['ContactsCount', 'ListCount', 'RecipientsCount']),
    delivered: sentCount,
    opened: openedCount || clickedCount,
    createdAt: new Date(createdAtRaw).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    }),
    createdAtRaw,
  };
};

router.get('/email-dashboard', requireSales, async (_req, res) => {
  try {
    const [campaignRes, campaignDraftRes, campaignStatsRes, messageStatsRes] = (await Promise.all([
      fetchMailjet('/v3/REST/campaign?Limit=200'),
      fetchMailjet('/v3/REST/campaigndraft?Limit=200'),
      fetchMailjet('/v3/REST/campaignstatistics?Limit=200'),
      fetchMailjet('/v3/REST/messagestatistics'),
    ])) as Array<{ Data?: Array<Record<string, any>> }>;

    const campaigns = (campaignRes?.Data || []) as MailjetCampaign[];
    const campaignDrafts = (campaignDraftRes?.Data || []) as MailjetCampaign[];
    const campaignStats = (campaignStatsRes?.Data || []) as MailjetStat[];
    const messageStats = (messageStatsRes?.Data || []) as MailjetStat[];

    const sent = campaignStats.reduce((sum, stat) => sum + num(stat, ['MessageSentCount', 'SentCount', 'Sent']), 0);
    const opened = campaignStats.reduce((sum, stat) => sum + num(stat, ['MessageOpenedCount', 'OpenedCount', 'Opened']), 0);
    const clicked = campaignStats.reduce((sum, stat) => sum + num(stat, ['MessageClickedCount', 'ClickedCount', 'Clicked']), 0);
    const spam = campaignStats.reduce((sum, stat) => sum + num(stat, ['MessageSpamCount', 'SpamCount', 'Spam']), 0);
    const bounce = campaignStats.reduce((sum, stat) => sum + num(stat, ['MessageHardBouncedCount', 'MessageSoftBouncedCount', 'BounceCount', 'BouncedCount']), 0);

    const reachRate = sent > 0 ? (opened / sent) * 100 : 0;
    const spamRate = sent > 0 ? (spam / sent) * 100 : 0;
    const bounceRate = sent > 0 ? (bounce / sent) * 100 : 0;
    const ctorRate = opened > 0 ? (clicked / opened) * 100 : 0;

    const engagementMap: Record<string, { opens: number; clicks: number; conversions: number }> = Object.fromEntries(
      monthKeys.map((k) => [k, { opens: 0, clicks: 0, conversions: 0 }])
    );
    const sourceForEngagement = campaignStats.length ? campaignStats : messageStats;
    sourceForEngagement.forEach((row) => {
      const rawDate = row?.CreatedAt || row?.ArrivedAt || row?.LastUpdateAt || row?.SendStartAt;
      if (!rawDate) return;
      const dt = new Date(rawDate);
      if (Number.isNaN(dt.getTime())) return;
      const mk = monthKey(dt);
      if (!engagementMap[mk]) return;
      engagementMap[mk].opens += num(row, ['MessageOpenedCount', 'OpenedCount', 'Opened']);
      engagementMap[mk].clicks += num(row, ['MessageClickedCount', 'ClickedCount', 'Clicked']);
      engagementMap[mk].conversions += num(row, ['MessageClickedCount', 'ClickedCount', 'Clicked']);
    });
    const engagement = monthKeys.map((m) => ({ month: m, ...engagementMap[m] }));

    const normalizedCampaigns = campaigns.map((c) => normalizeCampaign(c, 'campaign'));
    const normalizedDrafts = campaignDrafts.map((c) => normalizeCampaign(c, 'draft'));
    const combinedCampaigns = [...normalizedCampaigns, ...normalizedDrafts].sort(
      (a, b) => new Date(b.createdAtRaw).getTime() - new Date(a.createdAtRaw).getTime()
    );

    const totalCampaigns = combinedCampaigns.length;
    const activeCampaigns = combinedCampaigns.filter((campaign) => {
      const status = String(campaign?.status || '').toLowerCase();
      return ['sent', 'running', 'scheduled'].includes(status);
    }).length;
    const pendingCampaigns = combinedCampaigns.filter((campaign) => {
      const status = String(campaign?.status || '').toLowerCase();
      return ['draft', 'queued', 'processing', 'created'].includes(status);
    }).length;
    const repliedCampaigns = Math.max(totalCampaigns - activeCampaigns - pendingCampaigns, 0);
    const distributionTotal = Math.max(activeCampaigns + pendingCampaigns + repliedCampaigns, 1);
    const distribution = [
      { name: 'Active', value: Math.round((activeCampaigns / distributionTotal) * 100), color: '#1EC57A' },
      { name: 'Pending', value: Math.round((pendingCampaigns / distributionTotal) * 100), color: '#e5e7eb' },
      { name: 'Replied', value: Math.max(0, 100 - Math.round((activeCampaigns / distributionTotal) * 100) - Math.round((pendingCampaigns / distributionTotal) * 100)), color: '#9ca3af' },
    ];

    const tableCampaigns = combinedCampaigns.slice(0, 8);

    return res.json({
      success: true,
      data: {
        provider: 'Mailjet',
        connected: true,
        kpis: [
          { label: 'Campaign Reach Rate', value: pct(reachRate), delta: `${campaigns.length} campaigns`, positive: true },
          { label: 'Spam Complaint Rate', value: pct(spamRate), delta: `${spam} spam events`, positive: true },
          { label: 'Bounce Rate', value: pct(bounceRate), delta: `${bounce} bounce events`, positive: false },
          { label: 'Click-to-Open Rate (CTOR)', value: pct(ctorRate), delta: `${clicked} click events`, positive: true },
        ],
        engagement,
        distribution: {
          totalLeads: totalCampaigns,
          deltaText: `${activeCampaigns} active campaigns`,
          segments: distribution,
        },
        campaigns: tableCampaigns,
        defaults: {
          senderName: process.env.MAILJET_FROM_NAME || '',
          senderEmail: process.env.MAILJET_FROM_EMAIL || '',
        },
      },
    });
  } catch (error) {
    logger.error('Error in GET /marketing/email-dashboard:', error);
    const err = error as any;
    return res.status(500).json({
      success: false,
      error: err?.message || 'Failed to fetch Mailjet dashboard data',
    });
  }
});

router.get('/campaigns', requireSales, async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const [campaignData, campaignDraftData] = await Promise.all([
      fetchMailjet(`/v3/REST/campaign?Limit=${limit}&Offset=${offset}`),
      fetchMailjet(`/v3/REST/campaigndraft?Limit=${limit}&Offset=${offset}`),
    ]);
    const normalizedCampaigns = ((campaignData?.Data || []) as MailjetCampaign[]).map((c) => normalizeCampaign(c, 'campaign'));
    const normalizedDrafts = ((campaignDraftData?.Data || []) as MailjetCampaign[]).map((c) => normalizeCampaign(c, 'draft'));
    const combined = [...normalizedCampaigns, ...normalizedDrafts].sort(
      (a, b) => new Date(b.createdAtRaw).getTime() - new Date(a.createdAtRaw).getTime()
    );
    return res.json({
      success: true,
      data: combined,
      total: combined.length,
      meta: {
        campaignCount: normalizedCampaigns.length,
        draftCount: normalizedDrafts.length,
      },
    });
  } catch (error) {
    logger.error('Error in GET /marketing/campaigns:', error);
    const err = error as any;
    return res.status(500).json({ success: false, error: err?.message || 'Failed to fetch campaigns' });
  }
});

router.get('/contact-lists', requireSales, async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
    const data = await fetchMailjet(`/v3/REST/contactslist?Limit=${limit}&Sort=Name+ASC`);
    return res.json({ success: true, data: data?.Data || [] });
  } catch (error) {
    logger.error('Error in GET /marketing/contact-lists:', error);
    const err = error as any;
    return res.status(500).json({ success: false, error: err?.message || 'Failed to fetch contact lists' });
  }
});

router.post('/contact-lists', requireSales, async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    if (!name) {
      return res.status(400).json({ success: false, error: 'List name is required' });
    }
    const created = await fetchMailjet('/v3/REST/contactslist', {
      method: 'POST',
      body: { Name: name },
    });
    return res.status(201).json({ success: true, data: created?.Data?.[0] || null });
  } catch (error) {
    logger.error('Error in POST /marketing/contact-lists:', error);
    const err = error as any;
    return res.status(500).json({ success: false, error: err?.message || 'Failed to create contact list' });
  }
});

router.get('/contacts', requireSales, async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 500);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const data = await fetchMailjet(`/v3/REST/contact?Limit=${limit}&Offset=${offset}`);
    return res.json({ success: true, data: data?.Data || [], total: data?.Total || 0 });
  } catch (error) {
    logger.error('Error in GET /marketing/contacts:', error);
    const parsed = parseMailjetError(error);
    return res.status(parsed.status >= 400 && parsed.status < 500 ? parsed.status : 500).json({
      success: false,
      error: parsed.message || 'Failed to fetch contacts',
    });
  }
});

router.post('/contacts', requireSales, async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim();
    const name = String(req.body?.name || '').trim();
    const listId = req.body?.listId ? Number(req.body.listId) : null;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    let contact: any = null;
    try {
      const createdContact = await fetchMailjet('/v3/REST/contact', {
        method: 'POST',
        body: {
          Email: email,
          Name: name || undefined,
          IsExcludedFromCampaigns: false,
        },
      });
      contact = createdContact?.Data?.[0] || null;
    } catch (createError) {
      const parsed = parseMailjetError(createError);
      if (!isContactAlreadyExistsError(parsed.message)) {
        throw createError;
      }
      const existing = await fetchMailjet(`/v3/REST/contact/${encodeURIComponent(email)}`);
      contact = existing?.Data?.[0] || null;
    }

    if (listId) {
      try {
        await fetchMailjet(`/v3/REST/contactslist/${listId}/managecontact`, {
          method: 'POST',
          body: {
            Email: email,
            Name: name || undefined,
            Action: 'addnoforce',
          },
        });
      } catch (listError) {
        const parsed = parseMailjetError(listError);
        if (!isContactAlreadyExistsError(parsed.message)) {
          throw listError;
        }
      }
    }

    return res.status(201).json({ success: true, data: contact });
  } catch (error) {
    logger.error('Error in POST /marketing/contacts:', error);
    const parsed = parseMailjetError(error);
    return res.status(parsed.status >= 400 && parsed.status < 500 ? parsed.status : 500).json({
      success: false,
      error: parsed.message || 'Failed to create contact',
    });
  }
});

router.post('/campaigns', requireSales, async (req, res) => {
  try {
    const title = String(req.body?.title || '').trim();
    const subject = String(req.body?.subject || '').trim();
    const senderName = String(req.body?.senderName || process.env.MAILJET_FROM_NAME || '').trim();
    const senderEmail = String(req.body?.senderEmail || process.env.MAILJET_FROM_EMAIL || '').trim();
    const locale = String(req.body?.locale || 'en_US').trim();
    let contactsListId = req.body?.contactsListId ? Number(req.body.contactsListId) : null;
    const htmlPart = req.body?.htmlPart ? String(req.body.htmlPart) : '';
    const textPart = req.body?.textPart ? String(req.body.textPart) : '';

    if (!title || !subject || !senderName || !senderEmail) {
      return res.status(400).json({ success: false, error: 'Title, subject, sender name, and sender email are required' });
    }

    if (!contactsListId) {
      const lists = await fetchMailjet('/v3/REST/contactslist?Limit=1&Sort=ID+ASC');
      contactsListId = Number(lists?.Data?.[0]?.ID || 0);
    }
    if (!contactsListId) {
      return res.status(400).json({ success: false, error: 'At least one contact list is required before creating a campaign' });
    }

    const draftRes = await fetchMailjet('/v3/REST/campaigndraft', {
      method: 'POST',
      body: {
        Locale: locale,
        Sender: senderName,
        SenderEmail: senderEmail,
        Subject: subject,
        ContactsListID: contactsListId,
        Title: title,
      },
    });
    const draft = draftRes?.Data?.[0];
    if (!draft?.ID) {
      return res.status(500).json({ success: false, error: 'Campaign draft creation failed' });
    }

    if (htmlPart || textPart) {
      await fetchMailjet(`/v3/REST/campaigndraft/${draft.ID}/detailcontent`, {
        method: 'POST',
        body: {
          'Html-part': htmlPart || undefined,
          'Text-part': textPart || undefined,
        },
      });
    }

    return res.status(201).json({ success: true, data: normalizeCampaign(draft, 'draft') });
  } catch (error) {
    logger.error('Error in POST /marketing/campaigns:', error);
    const err = error as any;
    return res.status(500).json({ success: false, error: err?.message || 'Failed to create campaign draft' });
  }
});

router.post('/campaigns/:id/send', requireSales, async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) {
      return res.status(400).json({ success: false, error: 'Campaign draft id is required' });
    }
    const sent = await fetchMailjet(`/v3/REST/campaigndraft/${id}/send`, {
      method: 'POST',
      body: {},
    });
    return res.json({ success: true, data: sent?.Data?.[0] || sent || null });
  } catch (error) {
    logger.error('Error in POST /marketing/campaigns/:id/send:', error);
    const parsed = parseMailjetError(error);
    return res.status(parsed.status >= 400 && parsed.status < 500 ? parsed.status : 500).json({
      success: false,
      error: parsed.message || 'Failed to send campaign draft',
    });
  }
});

router.post('/campaign-assets', requireSales, marketingAssetUpload.single('asset'), async (req, res) => {
  try {
    const userId = (req as any)?.user?.id || 'unknown-user';
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const bucket = process.env.MARKETING_ASSETS_BUCKET || 'campaign-assets';
    const extension = (file.originalname.split('.').pop() || 'bin').toLowerCase();
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
    const filePath = `marketing/${userId}/${safeName}`;

    const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });
    if (uploadError) {
      return res.status(500).json({
        success: false,
        error: `Failed to upload asset to storage bucket "${bucket}". Ensure bucket exists and policies allow upload.`,
      });
    }

    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return res.status(201).json({
      success: true,
      data: {
        url: publicData.publicUrl,
        path: filePath,
        type: file.mimetype,
        name: file.originalname,
      },
    });
  } catch (error) {
    logger.error('Error in POST /marketing/campaign-assets:', error);
    const err = error as any;
    return res.status(500).json({ success: false, error: err?.message || 'Failed to upload campaign asset' });
  }
});

export default router;
