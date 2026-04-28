import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { blogsApi } from "../../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

type BlogRow = Record<string, any>;
type BlogCategory = { id: string; name: string; slug?: string | null };

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function pickTitle(row: BlogRow): string {
  return row.title || row.name || row.heading || row.slug || "Untitled";
}

function pickExcerpt(row: BlogRow): string | null {
  return row.excerpt || row.summary || row.description || null;
}

function asYesNo(v: any) {
  return v ? "Yes" : "No";
}

function safeDate(v: any) {
  if (!v) return "-";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString();
}

export function Blogs() {
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<BlogRow[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [category, setCategory] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [authorName, setAuthorName] = useState("");
  const [readTime, setReadTime] = useState<number>(3);
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"draft" | "in_review" | "scheduled" | "published" | "archived">("draft");
  const [isPublished, setIsPublished] = useState(false);

  const effectiveSlug = useMemo(() => (slug ? slugify(slug) : slugify(title)), [slug, title]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setIsLoading(true);
      const [res, cats] = await Promise.all([blogsApi.list(), blogsApi.listCategories()]);
      if (!mounted) return;

      if (res.success) {
        setItems(Array.isArray(res.data) ? res.data : []);
      } else {
        toast.error(res.error || "Failed to load blogs");
      }
      if (cats.success) {
        setCategories(Array.isArray(cats.data) ? cats.data : []);
      }
      setIsLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const resetForm = () => {
    setTitle("");
    setSlug("");
    setExcerpt("");
    setCoverImageUrl("");
    setCategory("");
    setCategoryId("");
    setAuthorName("");
    setReadTime(3);
    setContent("");
    setStatus("draft");
    setIsPublished(false);
  };

  const reload = async () => {
    const res = await blogsApi.list();
    if (res.success) setItems(Array.isArray(res.data) ? res.data : []);
  };

  const handleCreate = async () => {
    if (!title || !excerpt || !coverImageUrl || !authorName) {
      toast.error("Me need title, excerpt, cover image, author name");
      return;
    }
    if (!category && !categoryId) {
      toast.error("Me need category (name or pick category)");
      return;
    }
    setSaving(true);
    const payload = {
      slug: effectiveSlug,
      title,
      excerpt,
      cover_image_url: coverImageUrl,
      category: category || categories.find((c) => c.id === categoryId)?.name || "General",
      category_id: categoryId || null,
      author_name: authorName,
      read_time_minutes: Number.isFinite(readTime) ? readTime : 3,
      content: content || null,
      content_json: [],
      tags: [],
      status,
      is_published: isPublished || status === "published",
    };
    const res = await blogsApi.create(payload);
    if (res.success) {
      toast.success("Blog created");
      setCreateOpen(false);
      resetForm();
      await reload();
    } else {
      toast.error(res.error || "Create blog failed");
    }
    setSaving(false);
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
        <h1 className="text-2xl font-semibold">Blogs</h1>
        <p className="text-sm text-muted-foreground">Latest posts from your Supabase `blogs` table.</p>
        </div>

        <Dialog open={createOpen} onOpenChange={(o) => (setCreateOpen(o), !o ? resetForm() : null)}>
          <DialogTrigger asChild>
            <Button className="rounded-xl">Add Blog</Button>
          </DialogTrigger>
          <DialogContent className="w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] h-[calc(100vh-2rem)] overflow-y-auto sm:rounded-2xl">
            <DialogHeader>
              <DialogTitle>Add blog</DialogTitle>
              <DialogDescription>Create draft or publish. Website can show published posts.</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="lg:col-span-2">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Blog title" />
              </div>

              <div className="lg:col-span-2">
                <Label>Slug</Label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="auto from title"
                />
                <div className="mt-1 text-xs text-muted-foreground">Me will use: {effectiveSlug || "-"}</div>
              </div>

              <div className="lg:col-span-2">
                <Label>Excerpt</Label>
                <Textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Short summary" />
              </div>

              <div className="lg:col-span-2">
                <Label>Cover image URL</Label>
                <Input
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label>Pick category</Label>
                <Select value={categoryId} onValueChange={(v) => setCategoryId(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Or type category name</Label>
                <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Business" />
              </div>

              <div>
                <Label>Author name</Label>
                <Input value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="Mukesh Ayudh" />
              </div>

              <div>
                <Label>Read time (minutes)</Label>
                <Input
                  type="number"
                  min={1}
                  value={readTime}
                  onChange={(e) => setReadTime(parseInt(e.target.value || "3", 10))}
                />
              </div>

              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">draft</SelectItem>
                    <SelectItem value="in_review">in_review</SelectItem>
                    <SelectItem value="scheduled">scheduled</SelectItem>
                    <SelectItem value="published">published</SelectItem>
                    <SelectItem value="archived">archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3 pt-6">
                <Switch checked={isPublished} onCheckedChange={(v) => setIsPublished(!!v)} />
                <div>
                  <div className="text-sm font-medium">Publish now</div>
                  <div className="text-xs text-muted-foreground">Set `is_published=true`</div>
                </div>
              </div>

              <div className="lg:col-span-2">
                <Label>Content (plain text)</Label>
                <Textarea
                  className="min-h-40"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste blog content here (content_json editor can come later)"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={saving}>
                {saving ? "Saving..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading blogs...</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
          No blogs found. Create rows in Supabase table `blogs` (or set backend `BLOGS_TABLE` env if table name differs).
        </div>
      ) : (
        <div className="rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Published</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Read(min)</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((row, idx) => {
                const key = row.id ?? row.slug ?? idx;
                const published = row.is_published === true || row.status === "published";
                return (
                  <TableRow key={key}>
                    <TableCell className="max-w-[340px] whitespace-normal">
                      <div className="font-medium">{pickTitle(row)}</div>
                      {pickExcerpt(row) ? (
                        <div className="mt-1 text-xs text-muted-foreground line-clamp-2">
                          {pickExcerpt(row)}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate">{row.slug || "-"}</TableCell>
                    <TableCell>{row.category || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={row.status === "published" ? "default" : "secondary"}>
                        {row.status || "draft"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={published ? "default" : "secondary"}>{asYesNo(published)}</Badge>
                    </TableCell>
                    <TableCell>{row.author_name || "-"}</TableCell>
                    <TableCell>{row.read_time_minutes ?? 3}</TableCell>
                    <TableCell>{safeDate(row.created_at)}</TableCell>
                    <TableCell>{safeDate(row.updated_at)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

