import { useEffect, useMemo, useRef, useState } from "react";
import { crmApi } from "../../../lib/api";

type Director = {
  name: string;
  din: string;
  designation: string;
  appointmentDate: string;
  pan: string;
  nationality: string;
};

type Office = {
  officeTypes: string[];
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pinCode: string;
  phoneNumber: string;
  faxNumber: string;
  officeTypeInput?: string;
};

type CompanyDocument = {
  id: string;
  name: string;
  fileName: string;
  mimeType: string;
  dataUrl: string;
  updatedAt: string;
};

type CompanySetupData = {
  companyName: string;
  cin: string;
  companyType: string;
  nicCode: string;
  incorporationDate: string;
  financialYearStart: string;
  registeredState: string;
  companyPan: string;
  companyTan: string;
  gstNumber: string;
  gstRegistrationState: string;
  tdsCircleCode: string;
  msmeNumber: string;
  iecNumber: string;
  professionalTaxNumber: string;
  shopsEstablishmentNumber: string;
  officialEmail: string;
  accountsEmail: string;
  hrEmail: string;
  legalEmail: string;
  websiteUrl: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountType: string;
  branchName: string;
  branchAddress: string;
  micrCode: string;
  swiftCode: string;
  isPublished: boolean;
  publishedAt: string | null;
  directors: Director[];
  offices: Office[];
  documents: CompanyDocument[];
};

const STORAGE_KEY = "company_setup_profile_v1";
const sectionNames = [
  "Company Identity",
  "Tax Registrations",
  "Offices",
  "Company Email & Communication",
  "Directors & Officers",
  "Bank Details",
  "Company Documents",
  "Compliance Calendar",
  "Export / Summary",
] as const;

const statesAndUT = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
  "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
  "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir",
  "Ladakh", "Lakshadweep", "Puducherry",
];

const stateCodeMap: Record<string, { short: string; gst: string }> = {
  "Andhra Pradesh": { short: "AP", gst: "37" },
  "Arunachal Pradesh": { short: "AR", gst: "12" },
  Assam: { short: "AS", gst: "18" },
  Bihar: { short: "BR", gst: "10" },
  Chhattisgarh: { short: "CG", gst: "22" },
  Goa: { short: "GA", gst: "30" },
  Gujarat: { short: "GJ", gst: "24" },
  Haryana: { short: "HR", gst: "06" },
  "Himachal Pradesh": { short: "HP", gst: "02" },
  Jharkhand: { short: "JH", gst: "20" },
  Karnataka: { short: "KA", gst: "29" },
  Kerala: { short: "KL", gst: "32" },
  "Madhya Pradesh": { short: "MP", gst: "23" },
  Maharashtra: { short: "MH", gst: "27" },
  Manipur: { short: "MN", gst: "14" },
  Meghalaya: { short: "ML", gst: "17" },
  Mizoram: { short: "MZ", gst: "15" },
  Nagaland: { short: "NL", gst: "13" },
  Odisha: { short: "OD", gst: "21" },
  Punjab: { short: "PB", gst: "03" },
  Rajasthan: { short: "RJ", gst: "08" },
  Sikkim: { short: "SK", gst: "11" },
  "Tamil Nadu": { short: "TN", gst: "33" },
  Telangana: { short: "TS", gst: "36" },
  Tripura: { short: "TR", gst: "16" },
  "Uttar Pradesh": { short: "UP", gst: "09" },
  Uttarakhand: { short: "UK", gst: "05" },
  "West Bengal": { short: "WB", gst: "19" },
  "Andaman and Nicobar Islands": { short: "AN", gst: "35" },
  Chandigarh: { short: "CH", gst: "04" },
  "Dadra and Nagar Haveli and Daman and Diu": { short: "DN", gst: "26" },
  Delhi: { short: "DL", gst: "07" },
  "Jammu and Kashmir": { short: "JK", gst: "01" },
  Ladakh: { short: "LA", gst: "38" },
  Lakshadweep: { short: "LD", gst: "31" },
  Puducherry: { short: "PY", gst: "34" },
};

const bankOptions = ["SBI", "HDFC", "ICICI", "Axis", "Kotak", "Yes Bank", "Punjab National Bank", "Bank of Baroda", "Canara Bank", "IndusInd", "Other"];

const emptyDirector = (): Director => ({
  name: "",
  din: "",
  designation: "",
  appointmentDate: "",
  pan: "",
  nationality: "Indian",
});

const emptyOffice = (state = "Maharashtra"): Office => ({
  officeTypes: [],
  addressLine1: "",
  addressLine2: "",
  city: "",
  state,
  pinCode: "",
  phoneNumber: "",
  faxNumber: "",
  officeTypeInput: "",
});

const defaultData: CompanySetupData = {
  companyName: "",
  cin: "",
  companyType: "Private Limited",
  nicCode: "",
  incorporationDate: "",
  financialYearStart: "April 1",
  registeredState: "Maharashtra",
  companyPan: "",
  companyTan: "",
  gstNumber: "",
  gstRegistrationState: "Maharashtra",
  tdsCircleCode: "",
  msmeNumber: "",
  iecNumber: "",
  professionalTaxNumber: "",
  shopsEstablishmentNumber: "",
  officialEmail: "",
  accountsEmail: "",
  hrEmail: "",
  legalEmail: "",
  websiteUrl: "",
  bankName: "SBI",
  accountNumber: "",
  ifscCode: "",
  accountType: "Current",
  branchName: "",
  branchAddress: "",
  micrCode: "",
  swiftCode: "",
  isPublished: true,
  publishedAt: new Date().toISOString(),
  directors: [emptyDirector()],
  offices: [emptyOffice()],
  documents: [],
};

const baseInputClass =
  "h-9 w-full rounded-lg border border-[#e0e0e0] bg-white px-3 text-[16px] outline-none focus:border-[#1a73e8]";

function randomDigits(length: number) {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");
}

function randomLetters(length: number) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function hashColor(text: string) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = text.charCodeAt(i) + ((hash << 5) - hash);
  const palette = ["#1a73e8", "#0b8043", "#c5221f", "#9334e6", "#f29900", "#00838f", "#5f6368"];
  return palette[Math.abs(hash) % palette.length];
}

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function downloadSvg(filename: string, svgText: string) {
  downloadBlob(filename, new Blob([svgText], { type: "image/svg+xml;charset=utf-8" }));
}

function downloadCanvasPng(filename: string, canvas: HTMLCanvasElement) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    downloadBlob(filename, blob);
  }, "image/png");
}

function drawSealCanvas(data: CompanySetupData) {
  const canvas = document.createElement("canvas");
  canvas.width = 200;
  canvas.height = 200;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.clearRect(0, 0, 200, 200);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 200, 200);
  ctx.strokeStyle = "#0d2e72";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(100, 100, 85, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(100, 100, 62, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#0d2e72";
  ctx.font = "bold 11px system-ui";
  ctx.textAlign = "center";
  ctx.fillText((data.companyName || "COMPANY").slice(0, 28).toUpperCase(), 100, 36);
  ctx.fillText("PRIVATE LIMITED", 100, 168);
  ctx.font = "10px system-ui";
  ctx.fillText(data.cin || "U74999MH2024PTC123456", 100, 100);
  ctx.font = "bold 28px system-ui";
  ctx.fillText("★", 100, 126);
  return canvas;
}

function drawLogoCanvas(data: CompanySetupData) {
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 400;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const initials = (data.companyName || "Indian Company")
    .split(" ")
    .filter(Boolean)
    .slice(0, 3)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  ctx.fillStyle = hashColor(data.companyName || "company");
  ctx.fillRect(0, 0, 400, 400);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 132px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(initials || "IC", 200, 210);
  return canvas;
}

function drawSignatureCanvas(data: CompanySetupData) {
  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 200;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const director = data.directors[0];
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 600, 200);
  ctx.fillStyle = "#1a1a1a";
  ctx.font = "42px cursive";
  ctx.fillText(director?.name || "Authorized Signatory", 18, 74);
  ctx.font = "16px system-ui";
  ctx.fillText(`Name: ${director?.name || "-"}`, 20, 112);
  ctx.fillText(`Designation: ${director?.designation || "-"}`, 20, 134);
  ctx.fillText(`Date: __________________`, 20, 156);
  ctx.fillText(`Company: ${data.companyName || "-"}`, 20, 178);
  ctx.strokeStyle = "#909090";
  ctx.strokeRect(460, 88, 120, 88);
  ctx.font = "12px system-ui";
  ctx.fillText("Seal", 510, 136);
  return canvas;
}

function drawLetterheadCanvas(data: CompanySetupData) {
  const primaryOffice = data.offices?.[0] || emptyOffice(data.registeredState || "Maharashtra");
  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 848;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const logo = drawLogoCanvas(data);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 600, 848);
  ctx.drawImage(logo, 24, 24, 78, 78);
  ctx.fillStyle = "#111111";
  ctx.font = "600 24px system-ui";
  ctx.fillText(data.companyName || "Company Name", 118, 58);
  ctx.font = "14px system-ui";
  ctx.fillText([primaryOffice.addressLine1, primaryOffice.city, primaryOffice.state, primaryOffice.pinCode].filter(Boolean).join(", ") || "Address", 118, 84);
  ctx.textAlign = "right";
  ctx.fillText(primaryOffice.phoneNumber || "+91 xxxxxxxxxx", 576, 50);
  ctx.fillText(data.officialEmail || "official@company.com", 576, 72);
  ctx.fillText(data.websiteUrl || "www.company.com", 576, 94);
  ctx.textAlign = "left";
  ctx.strokeStyle = "#1a73e8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(24, 124);
  ctx.lineTo(576, 124);
  ctx.stroke();
  ctx.font = "16px system-ui";
  ctx.fillText("Body content starts here...", 24, 170);
  ctx.font = "14px system-ui";
  ctx.fillText(`For: ${data.companyName || "Company Name"}`, 24, 760);
  const sign = drawSignatureCanvas(data);
  ctx.drawImage(sign, 24, 620, 420, 160);
  return canvas;
}

export function CompanySetupPanel() {
  const [data, setData] = useState<CompanySetupData>(defaultData);
  const [activeSection, setActiveSection] = useState<(typeof sectionNames)[number]>("Company Identity");
  const printRef = useRef<HTMLDivElement>(null);
  const [documentNameInput, setDocumentNameInput] = useState("");
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
  const [pendingDocumentFile, setPendingDocumentFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [manualSaveAt, setManualSaveAt] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as CompanySetupData;
      const migratedOffices = parsed.offices?.length
        ? parsed.offices
        : [
            emptyOffice(parsed.registeredState || "Maharashtra"),
          ];
      setData({
        ...defaultData,
        ...parsed,
        directors: parsed.directors?.length ? parsed.directors : [emptyDirector()],
        offices: migratedOffices.map((o) => ({ ...emptyOffice(parsed.registeredState || "Maharashtra"), ...o })),
      });
    } catch {
      // ignore malformed storage
    }
  }, []);

  useEffect(() => {
    const loadFromDb = async () => {
      const response = await crmApi.getCompanySetup();
      if (!response.success || !response.data) return;
      const row = response.data;
      const payload = (row.payload || {}) as Partial<CompanySetupData>;
      setData((prev) => ({
        ...prev,
        ...payload,
        directors: Array.isArray(payload.directors) && payload.directors.length ? payload.directors : prev.directors,
        offices: Array.isArray(payload.offices) && payload.offices.length ? payload.offices : prev.offices,
        documents: Array.isArray(payload.documents) ? payload.documents : prev.documents,
      }));
    };
    void loadFromDb();
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    setData((prev) => ({
      ...prev,
      gstRegistrationState: prev.registeredState,
      offices: prev.offices.map((o) => ({ ...o, state: prev.registeredState })),
    }));
  }, [data.registeredState]);

  const complianceRows = useMemo(() => {
    const incorporationDate = data.incorporationDate ? new Date(data.incorporationDate) : new Date();
    const fyEnd = data.financialYearStart === "January 1"
      ? new Date(`${incorporationDate.getFullYear()}-12-31`)
      : new Date(`${incorporationDate.getFullYear()}-03-31`);
    const agmDeadline = addMonths(fyEnd, 6);
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const monthStr = nextMonth.toLocaleString("en-IN", { month: "short", year: "numeric" });
    return [
      { filing: "AGM deadline", due: formatDate(agmDeadline), authority: "MCA" },
      { filing: "MGT-7 (Annual Return)", due: formatDate(addMonths(agmDeadline, 2)), authority: "MCA" },
      { filing: "AOC-4 (Financial Statements)", due: formatDate(addMonths(agmDeadline, 1)), authority: "MCA" },
      { filing: `GSTR-1 (${monthStr})`, due: "11th of next month", authority: "GST" },
      { filing: `GSTR-3B (${monthStr})`, due: "20th of next month", authority: "GST" },
      { filing: "TDS Return Q1/Q2/Q3/Q4", due: "31 Jul, 31 Oct, 31 Jan, 31 May", authority: "Income Tax" },
      { filing: "Advance Tax", due: "15 Jun, 15 Sep, 15 Dec, 15 Mar", authority: "Income Tax" },
      { filing: "Income Tax Return (audit cases)", due: "31 October", authority: "Income Tax" },
    ];
  }, [data.incorporationDate, data.financialYearStart]);

  const requiredPairs: Array<[keyof CompanySetupData, string]> = [
    ["companyName", "Company Name"], ["cin", "CIN"], ["incorporationDate", "Date of Incorporation"],
    ["registeredState", "Registered State"], ["companyPan", "Company PAN"], ["companyTan", "Company TAN"], ["gstNumber", "GST Number"],
    ["officialEmail", "Official Email"],
    ["bankName", "Bank Name"], ["accountNumber", "Account Number"], ["ifscCode", "IFSC"], ["branchName", "Branch Name"],
  ];

  const progressPercent = useMemo(() => {
    const filled = requiredPairs.filter(([key]) => String(data[key] || "").trim().length > 0).length;
    return Math.round((filled / requiredPairs.length) * 100);
  }, [data]);
  const isProfileComplete = progressPercent >= 100;

  const sectionCompletion = useMemo<Record<(typeof sectionNames)[number], boolean>>(
    () => ({
      "Company Identity":
        !!data.companyName && !!data.cin && !!data.companyPan && !!data.companyTan && !!data.registeredState,
      "Tax Registrations": !!data.gstNumber && !!data.msmmeNumber && !!data.iecNumber,
      Offices: data.offices.some((o) => !!o.addressLine1 && !!o.city && !!o.pinCode && !!o.phoneNumber),
      "Company Email & Communication": !!data.officialEmail && !!data.accountsEmail && !!data.hrEmail && !!data.legalEmail,
      "Directors & Officers": data.directors.some((d) => d.name && d.din && d.designation && d.pan),
      "Bank Details": !!data.bankName && !!data.accountNumber && !!data.ifscCode,
      "Company Documents": !!data.companyName,
      "Compliance Calendar": !!data.incorporationDate,
      "Export / Summary": progressPercent >= 60,
    }),
    [data, progressPercent]
  );

  const setField = <K extends keyof CompanySetupData>(key: K, value: CompanySetupData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const updateOffice = (idx: number, patch: Partial<Office>) => {
    setData((prev) => ({
      ...prev,
      offices: prev.offices.map((office, i) => (i === idx ? { ...office, ...patch } : office)),
    }));
  };

  const addOffice = () => {
    setData((prev) => ({ ...prev, offices: [...prev.offices, emptyOffice(prev.registeredState)] }));
  };

  const addOrUpdateDocument = async (file: File) => {
    const trimmedName = documentNameInput.trim();
    const effectiveName = trimmedName || file.name.replace(/\.[^/.]+$/, "");
    if (!effectiveName) return;
    const dataUrl = await fileToDataUrl(file);

    setData((prev) => {
      if (editingDocumentId) {
        return {
          ...prev,
          documents: prev.documents.map((doc) =>
            doc.id === editingDocumentId
              ? {
                  ...doc,
                  name: effectiveName,
                  fileName: file.name,
                  mimeType: file.type || "application/octet-stream",
                  dataUrl,
                  updatedAt: new Date().toISOString(),
                }
              : doc
          ),
        };
      }
      return {
        ...prev,
        documents: [
          ...prev.documents,
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: effectiveName,
            fileName: file.name,
            mimeType: file.type || "application/octet-stream",
            dataUrl,
            updatedAt: new Date().toISOString(),
          },
        ],
      };
    });
    setDocumentNameInput("");
    setEditingDocumentId(null);
  };

  const savePendingDocument = async () => {
    if (!documentNameInput.trim() || !pendingDocumentFile) return;
    await addOrUpdateDocument(pendingDocumentFile);
    setPendingDocumentFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const beginEditDocument = (doc: CompanyDocument) => {
    setEditingDocumentId(doc.id);
    setDocumentNameInput(doc.name);
  };

  const downloadDocument = (doc: CompanyDocument) => {
    const base64Data = doc.dataUrl.split(",")[1] || "";
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: doc.mimeType || "application/octet-stream" });
    downloadBlob(doc.fileName || `${doc.name}.bin`, blob);
  };

  const addOfficeTypeTag = (officeIdx: number) => {
    const office = data.offices[officeIdx];
    const value = (office.officeTypeInput || "").trim();
    if (!value) return;
    if (office.officeTypes.includes(value)) {
      updateOffice(officeIdx, { officeTypeInput: "" });
      return;
    }
    updateOffice(officeIdx, { officeTypes: [...office.officeTypes, value], officeTypeInput: "" });
  };

  const removeOfficeTypeTag = (officeIdx: number, tag: string) => {
    const office = data.offices[officeIdx];
    updateOffice(officeIdx, { officeTypes: office.officeTypes.filter((t) => t !== tag) });
  };

  const scrollToSection = (section: (typeof sectionNames)[number]) => {
    setActiveSection(section);
  };

  const updateDirector = (idx: number, patch: Partial<Director>) => {
    setData((prev) => ({
      ...prev,
      directors: prev.directors.map((d, i) => (i === idx ? { ...d, ...patch } : d)),
    }));
  };

  const addDirector = () => {
    setData((prev) => (prev.directors.length >= 5 ? prev : { ...prev, directors: [...prev.directors, emptyDirector()] }));
  };

  const copyAllDetails = async () => {
    const primaryOffice = data.offices?.[0] || emptyOffice(data.registeredState);
    const text = [
      `Company Name: ${data.companyName}`,
      `CIN: ${data.cin}`,
      `Company Type: ${data.companyType}`,
      `NIC Code: ${data.nicCode}`,
      `Incorporation Date: ${data.incorporationDate}`,
      `Registered State: ${data.registeredState}`,
      `PAN: ${data.companyPan}`,
      `TAN: ${data.companyTan}`,
      `GST: ${data.gstNumber}`,
      `Primary Office: ${[primaryOffice.addressLine1, primaryOffice.addressLine2, primaryOffice.city, primaryOffice.state, primaryOffice.pinCode].filter(Boolean).join(", ")}`,
      `Official Email: ${data.officialEmail}`,
      `Accounts Email: ${data.accountsEmail}`,
      `HR Email: ${data.hrEmail}`,
      `Legal Email: ${data.legalEmail}`,
      `Website: ${data.websiteUrl}`,
      `Bank: ${data.bankName}, A/C ${data.accountNumber}, IFSC ${data.ifscCode}`,
      `Directors:\n${data.directors.map((d, i) => `${i + 1}. ${d.name} | DIN: ${d.din} | ${d.designation}`).join("\n")}`,
    ].join("\n");
    await navigator.clipboard.writeText(text);
  };

  const downloadJSON = () => {
    downloadBlob("company-profile.json", new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  };

  const handleManualSaveProfile = () => {
    const persist = async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      const response = await crmApi.saveCompanySetup(data);
      if (!response.success) return;
      setManualSaveAt(new Date().toLocaleString("en-IN"));
    };
    void persist();
  };

  const generateProfilePdf = () => {
    const rows: Array<{ field: string; value: string }> = [];
    const addSection = (name: string) => rows.push({ field: `--- ${name} ---`, value: "" });
    const addRow = (field: string, value: string | number | null | undefined) =>
      rows.push({ field, value: value === null || value === undefined || value === "" ? "-" : String(value) });

    const primaryOffice = data.offices?.[0];

    addSection("Company Identity");
    addRow("Company Name", data.companyName);
    addRow("CIN", data.cin);
    addRow("Company Type", data.companyType);
    addRow("Date of Incorporation", data.incorporationDate);
    addRow("Financial Year Start", data.financialYearStart);
    addRow("Registered State", data.registeredState);
    addRow("Company PAN", data.companyPan);
    addRow("Company TAN", data.companyTan);

    addSection("Tax Registrations");
    addRow("GST Number", data.gstNumber);
    addRow("GST Registration State", data.gstRegistrationState);
    addRow("MSME/Udyam Registration Number", data.msmeNumber);
    addRow("Import Export Code (IEC)", data.iecNumber);
    addRow("Shops & Establishment Registration Number", data.shopsEstablishmentNumber);
    addRow("Professional Tax Registration Number", data.professionalTaxNumber);

    addSection("Offices");
    data.offices.forEach((office, idx) => {
      addRow(`Office ${idx + 1} Types`, office.officeTypes.length ? office.officeTypes.join(", ") : "-");
      addRow(`Office ${idx + 1} Address Line 1`, office.addressLine1);
      addRow(`Office ${idx + 1} Address Line 2`, office.addressLine2);
      addRow(`Office ${idx + 1} City`, office.city);
      addRow(`Office ${idx + 1} State`, office.state);
      addRow(`Office ${idx + 1} PIN Code`, office.pinCode);
      addRow(`Office ${idx + 1} Phone`, office.phoneNumber);
      addRow(`Office ${idx + 1} Fax`, office.faxNumber);
    });

    addSection("Company Email & Communication");
    addRow("Official Email", data.officialEmail);
    addRow("Accounts Email", data.accountsEmail);
    addRow("HR/Admin Email", data.hrEmail);
    addRow("Legal/Compliance Email", data.legalEmail);
    addRow("Website URL", data.websiteUrl);

    addSection("Directors & Officers");
    data.directors.forEach((director, idx) => {
      addRow(`Director ${idx + 1} Name`, director.name);
      addRow(`Director ${idx + 1} DIN`, director.din);
      addRow(`Director ${idx + 1} Designation`, director.designation);
      addRow(`Director ${idx + 1} Appointment Date`, director.appointmentDate);
      addRow(`Director ${idx + 1} PAN`, director.pan);
      addRow(`Director ${idx + 1} Nationality`, director.nationality);
    });

    addSection("Bank Details");
    addRow("Bank Name", data.bankName);
    addRow("Account Number", data.accountNumber);
    addRow("IFSC Code", data.ifscCode);
    addRow("Account Type", data.accountType);
    addRow("Branch Name", data.branchName);
    addRow("Branch Address", data.branchAddress);
    addRow("MICR Code", data.micrCode);
    addRow("Swift Code", data.swiftCode);

    addSection("Generated On");
    addRow("Generated At", new Date().toLocaleString("en-IN"));
    addRow("Primary Office", primaryOffice ? [primaryOffice.addressLine1, primaryOffice.city, primaryOffice.state].filter(Boolean).join(", ") : "-");

    const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Company Profile Report</title>
        <style>
          body { font-family: system-ui, Arial, sans-serif; margin: 24px; color: #111; }
          .header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
          .headerText { display: flex; flex-direction: column; }
          .brandName { font-size: 24px; font-weight: 800; color: #111; margin-bottom: 0; }
          .header img { width: 40px; height: 40px; object-fit: contain; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; vertical-align: top; font-size: 13px; }
          th { background: #f5f5f5; font-weight: 600; }
          tr.section td { background: #fafafa; font-weight: 700; }
          @media print { body { margin: 10mm; } }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/logo.svg" alt="Logo" />
          <div class="headerText">
            <div class="brandName">BlackMatter Technologies</div>
          </div>
        </div>
        <table>
          <thead>
            <tr><th style="width:38%">Field</th><th>Data</th></tr>
          </thead>
          <tbody>
            ${rows
              .map((row) =>
                row.field.startsWith("--- ")
                  ? `<tr class="section"><td colspan="2">${row.field.replace(/---/g, "").trim()}</td></tr>`
                  : `<tr><td>${row.field}</td><td>${row.value}</td></tr>`
              )
              .join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const frameDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!frameDoc) {
      document.body.removeChild(iframe);
      return;
    }

    frameDoc.open();
    frameDoc.write(html);
    frameDoc.close();

    const cleanup = () => {
      setTimeout(() => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      }, 500);
    };

    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      cleanup();
    };
  };

  return (
    <div className="w-full">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #company-print, #company-print * { visibility: visible; }
          #company-print { position: absolute; left: 0; top: 0; width: 100%; background: white; }
        }
      `}</style>
      <div className="mb-5">
        <h2 className="text-[28px] font-medium text-black">Company Setup</h2>
      </div>

      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
        <div className="w-full md:w-1/2 rounded-xl border border-black bg-black p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="w-[70%] h-3 rounded-full border border-white bg-white overflow-hidden">
              <div className="h-full bg-[#1EC57A]" style={{ width: `${progressPercent}%` }} />
            </div>
            <p className="text-sm text-white whitespace-nowrap">{progressPercent}% fields filled</p>
          </div>
          {manualSaveAt ? <p className="mt-2 text-xs text-white/80">Last saved: {manualSaveAt}</p> : null}
        </div>
        <button
          className="h-10 min-w-[132px] whitespace-nowrap px-5 rounded-lg border border-black bg-black text-white hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm self-end md:self-auto"
          disabled={!isProfileComplete}
          onClick={handleManualSaveProfile}
          title={isProfileComplete ? "Save completed profile" : "Complete all required fields to enable save"}
        >
          Save Profile
        </button>
      </div>

      <div className="flex gap-6 items-start">
        <aside className="w-[220px] shrink-0 rounded-xl border border-black bg-black p-3">
          {sectionNames.map((section) => (
            <button
              key={section}
              className={`w-full text-left px-2 py-2 rounded-md text-sm flex items-center justify-between ${
                activeSection === section
                  ? "bg-white text-black border border-[#1EC57A]"
                  : "text-white hover:bg-white hover:text-black"
              }`}
              onClick={() => scrollToSection(section)}
            >
              <span>{section}</span>
              <span
                className={
                  activeSection === section
                    ? "text-[#1EC57A]"
                    : sectionCompletion[section]
                    ? "text-[#1EC57A]"
                    : "text-white"
                }
              >
                {sectionCompletion[section] ? "✓" : "○"}
              </span>
            </button>
          ))}
        </aside>

        <div className="flex-1 space-y-4" id="company-print" ref={printRef}>
          <section className={activeSection === "Company Identity" ? "rounded-xl border border-[#e0e0e0] bg-white p-4" : "hidden"}>
            <h3 className="font-medium text-[18px] mb-3">1. Company Identity</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="text-sm">Company Name</label>
                <input className={baseInputClass} value={data.companyName} onChange={(e) => setField("companyName", e.target.value)} placeholder="Acme Technologies Private Limited" />
              </div>
              <div>
                <label className="text-sm">CIN</label>
                <input className={baseInputClass} value={data.cin} onChange={(e) => setField("cin", e.target.value.toUpperCase())} />
              </div>
              <div>
                <label className="text-sm">Company Type</label>
                <select className={baseInputClass} value={data.companyType} onChange={(e) => setField("companyType", e.target.value)}>
                  <option>Private Limited</option>
                  <option>OPC (One Person Company)</option>
                  <option>Section 8</option>
                </select>
              </div>
              <div>
                <label className="text-sm">Date of Incorporation</label>
                <input type="date" className={baseInputClass} value={data.incorporationDate} onChange={(e) => setField("incorporationDate", e.target.value)} />
              </div>
              <div>
                <label className="text-sm">Financial Year Start</label>
                <select className={baseInputClass} value={data.financialYearStart} onChange={(e) => setField("financialYearStart", e.target.value)}>
                  <option>April 1</option>
                  <option>January 1</option>
                </select>
              </div>
              <div>
                <label className="text-sm">Registered State</label>
                <select className={baseInputClass} value={data.registeredState} onChange={(e) => setField("registeredState", e.target.value)}>
                  {statesAndUT.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm">Company PAN</label>
                <input className={baseInputClass} value={data.companyPan} onChange={(e) => setField("companyPan", e.target.value.toUpperCase())} />
              </div>
              <div>
                <label className="text-sm">Company TAN</label>
                <input className={baseInputClass} value={data.companyTan} onChange={(e) => setField("companyTan", e.target.value.toUpperCase())} />
              </div>
            </div>
          </section>

          <section className={activeSection === "Tax Registrations" ? "rounded-xl border border-[#e0e0e0] bg-white p-4" : "hidden"}>
            <h3 className="font-medium text-[18px] mb-3">2. Tax Registrations</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-sm">GST Number</label>
                <input className={baseInputClass} value={data.gstNumber} onChange={(e) => setField("gstNumber", e.target.value.toUpperCase())} />
              </div>
              <div>
                <label className="text-sm">GST Registration State</label>
                <input className={baseInputClass} value={data.gstRegistrationState} readOnly />
              </div>
              <div>
                <label className="text-sm">MSME/Udyam Registration Number</label>
                <input className={baseInputClass} value={data.msmeNumber} onChange={(e) => setField("msmeNumber", e.target.value.toUpperCase())} />
              </div>
              <div>
                <label className="text-sm">Import Export Code (IEC)</label>
                <input className={baseInputClass} value={data.iecNumber} onChange={(e) => setField("iecNumber", e.target.value.replace(/\D/g, "").slice(0, 10))} />
              </div>
              <div>
                <label className="text-sm">Shops & Establishment Act Registration Number</label>
                <input className={baseInputClass} value={data.shopsEstablishmentNumber} onChange={(e) => setField("shopsEstablishmentNumber", e.target.value)} />
              </div>
              <div>
                <label className="text-sm">Professional Tax Registration Number</label>
                <input className={baseInputClass} value={data.professionalTaxNumber} onChange={(e) => setField("professionalTaxNumber", e.target.value)} />
              </div>
            </div>
          </section>

          <section className={activeSection === "Offices" ? "rounded-xl border border-[#e0e0e0] bg-white p-4" : "hidden"}>
            <h3 className="font-medium text-[18px] mb-3">3. Offices</h3>
            <div className="space-y-4">
              {data.offices.map((office, officeIdx) => (
                <div key={officeIdx} className="rounded-lg border border-[#e0e0e0] p-3">
                  <p className="text-sm font-medium mb-3">Office {officeIdx + 1}</p>
                  <div className="mb-3">
                    <label className="text-sm">Office Type</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {office.officeTypes.map((tag) => (
                        <button
                          key={tag}
                          className="px-2 py-1 rounded-full text-xs bg-[#1EC57A] text-white"
                          onClick={() => removeOfficeTypeTag(officeIdx, tag)}
                          title="Click to remove"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <input
                        className={baseInputClass}
                        placeholder="Type and press Add (e.g. Registered, Branch, Warehouse)"
                        value={office.officeTypeInput || ""}
                        onChange={(e) => updateOffice(officeIdx, { officeTypeInput: e.target.value })}
                      />
                      <button className="h-9 px-3 rounded-lg border border-[#e0e0e0] hover:bg-[#f5f5f5]" onClick={() => addOfficeTypeTag(officeIdx)}>
                        Add
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="md:col-span-2"><label className="text-sm">Address Line 1</label><input className={baseInputClass} value={office.addressLine1} onChange={(e) => updateOffice(officeIdx, { addressLine1: e.target.value })} /></div>
                    <div className="md:col-span-2"><label className="text-sm">Address Line 2</label><input className={baseInputClass} value={office.addressLine2} onChange={(e) => updateOffice(officeIdx, { addressLine2: e.target.value })} /></div>
                    <div><label className="text-sm">City</label><input className={baseInputClass} value={office.city} onChange={(e) => updateOffice(officeIdx, { city: e.target.value })} /></div>
                    <div><label className="text-sm">State</label><input className={baseInputClass} value={office.state} readOnly /></div>
                    <div><label className="text-sm">PIN Code</label><input className={baseInputClass} value={office.pinCode} onChange={(e) => updateOffice(officeIdx, { pinCode: e.target.value.replace(/\D/g, "").slice(0, 6) })} /></div>
                    <div><label className="text-sm">Phone Number (+91)</label><input className={baseInputClass} value={office.phoneNumber} onChange={(e) => updateOffice(officeIdx, { phoneNumber: e.target.value })} placeholder="+91 9876543210" /></div>
                    <div><label className="text-sm">Fax Number</label><input className={baseInputClass} value={office.faxNumber} onChange={(e) => updateOffice(officeIdx, { faxNumber: e.target.value })} /></div>
                  </div>
                </div>
              ))}
              <button className="h-9 px-3 rounded-lg border border-[#e0e0e0] hover:bg-[#f5f5f5]" onClick={addOffice}>
                Add Office
              </button>
            </div>
          </section>

          <section className={activeSection === "Company Email & Communication" ? "rounded-xl border border-[#e0e0e0] bg-white p-4" : "hidden"}>
            <h3 className="font-medium text-[18px] mb-3">4. Company Email & Communication</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><label className="text-sm">Official Email</label><input className={baseInputClass} value={data.officialEmail} onChange={(e) => setField("officialEmail", e.target.value)} /></div>
              <div><label className="text-sm">Accounts Email</label><input className={baseInputClass} value={data.accountsEmail} onChange={(e) => setField("accountsEmail", e.target.value)} /></div>
              <div><label className="text-sm">HR/Admin Email</label><input className={baseInputClass} value={data.hrEmail} onChange={(e) => setField("hrEmail", e.target.value)} /></div>
              <div><label className="text-sm">Legal/Compliance Email</label><input className={baseInputClass} value={data.legalEmail} onChange={(e) => setField("legalEmail", e.target.value)} /></div>
              <div className="md:col-span-2"><label className="text-sm">Website URL</label><input className={baseInputClass} value={data.websiteUrl} onChange={(e) => setField("websiteUrl", e.target.value)} /></div>
            </div>
          </section>

          <section className={activeSection === "Directors & Officers" ? "rounded-xl border border-[#e0e0e0] bg-white p-4" : "hidden"}>
            <h3 className="font-medium text-[18px] mb-3">5. Directors & Officers</h3>
            <div className="space-y-3">
              {data.directors.map((director, idx) => (
                <div key={idx} className="rounded-lg border border-[#e0e0e0] p-3">
                  <p className="text-sm font-medium mb-2">Director {idx + 1}</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input className={baseInputClass} placeholder="Name" value={director.name} onChange={(e) => updateDirector(idx, { name: e.target.value })} />
                    <input className={baseInputClass} placeholder="DIN (8 digits)" value={director.din} onChange={(e) => updateDirector(idx, { din: e.target.value.replace(/\D/g, "").slice(0, 8) })} />
                    <input className={baseInputClass} placeholder="Designation" value={director.designation} onChange={(e) => updateDirector(idx, { designation: e.target.value })} />
                    <input type="date" className={baseInputClass} value={director.appointmentDate} onChange={(e) => updateDirector(idx, { appointmentDate: e.target.value })} />
                    <input className={baseInputClass} placeholder="PAN" value={director.pan} onChange={(e) => updateDirector(idx, { pan: e.target.value.toUpperCase() })} />
                    <input className={baseInputClass} placeholder="Nationality" value={director.nationality} onChange={(e) => updateDirector(idx, { nationality: e.target.value })} />
                  </div>
                </div>
              ))}
              <button disabled={data.directors.length >= 5} className="h-9 px-3 rounded-lg border border-[#e0e0e0] hover:bg-[#f5f5f5] disabled:text-[#aaa]" onClick={addDirector}>
                Add Director
              </button>
            </div>
          </section>

          <section className={activeSection === "Bank Details" ? "rounded-xl border border-[#e0e0e0] bg-white p-4" : "hidden"}>
            <h3 className="font-medium text-[18px] mb-3">6. Bank Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><label className="text-sm">Bank Name</label><select className={baseInputClass} value={data.bankName} onChange={(e) => setField("bankName", e.target.value)}>{bankOptions.map((b) => <option key={b}>{b}</option>)}</select></div>
              <div><label className="text-sm">Account Number</label><input className={baseInputClass} value={data.accountNumber} onChange={(e) => setField("accountNumber", e.target.value)} /></div>
              <div><label className="text-sm">IFSC Code</label><input className={baseInputClass} value={data.ifscCode} onChange={(e) => setField("ifscCode", e.target.value.toUpperCase())} /></div>
              <div><label className="text-sm">Account Type</label><select className={baseInputClass} value={data.accountType} onChange={(e) => setField("accountType", e.target.value)}><option>Current</option><option>Savings</option><option>CC</option></select></div>
              <div><label className="text-sm">Branch Name</label><input className={baseInputClass} value={data.branchName} onChange={(e) => setField("branchName", e.target.value)} /></div>
              <div><label className="text-sm">MICR Code</label><input className={baseInputClass} value={data.micrCode} onChange={(e) => setField("micrCode", e.target.value)} /></div>
              <div className="md:col-span-2"><label className="text-sm">Branch Address</label><input className={baseInputClass} value={data.branchAddress} onChange={(e) => setField("branchAddress", e.target.value)} /></div>
              <div><label className="text-sm">Swift Code</label><input className={baseInputClass} value={data.swiftCode} onChange={(e) => setField("swiftCode", e.target.value.toUpperCase())} /></div>
            </div>
          </section>

          <section className={activeSection === "Company Documents" ? "rounded-xl border border-[#e0e0e0] bg-white p-4" : "hidden"}>
            <h3 className="font-medium text-[18px] mb-3">7. Company Documents</h3>
            <div className="rounded-lg border border-[#e0e0e0] p-4">
              <p className="text-sm text-[#555] mb-3">
                Upload company attachments here. Add a document name, upload a file, preview it, and download/replace later.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <div className="md:col-span-2">
                  <label className="text-sm">Document Name</label>
                  <input
                    className={baseInputClass}
                    placeholder="e.g. GST Certificate, PAN Card, Incorporation Proof"
                    value={documentNameInput}
                    onChange={(e) => setDocumentNameInput(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm">Upload / Replace File</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className={`${baseInputClass} pt-1`}
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setPendingDocumentFile(file);
                    }}
                  />
                </div>
                <div>
                  <button
                    className="h-9 w-full px-3 rounded-lg border border-[#e0e0e0] hover:bg-[#f5f5f5] disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => void savePendingDocument()}
                    disabled={!documentNameInput.trim() || !pendingDocumentFile}
                  >
                    Save
                  </button>
                </div>
              </div>
              {pendingDocumentFile ? (
                <p className="mt-2 text-xs text-[#555]">Selected file: {pendingDocumentFile.name}</p>
              ) : null}
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {data.documents.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#d9d9d9] p-8 text-center text-sm text-[#666] md:col-span-2 xl:col-span-3">
                  No documents uploaded yet.
                </div>
              ) : (
                data.documents.map((doc) => (
                  <div key={doc.id} className="group relative rounded-lg border border-[#e0e0e0] p-3">
                    <p className="font-medium text-sm mb-3">{doc.name}</p>

                    <div className="absolute right-3 top-3 flex items-center gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <button className="h-8 px-3 rounded-lg border border-[#e0e0e0] bg-white hover:bg-[#f5f5f5] text-sm" onClick={() => beginEditDocument(doc)}>
                        Edit / Replace
                      </button>
                      <button className="h-8 px-3 rounded-lg border border-[#e0e0e0] bg-white hover:bg-[#f5f5f5] text-sm" onClick={() => downloadDocument(doc)}>
                        Download
                      </button>
                      <button
                        className="h-8 px-3 rounded-lg border border-[#d32f2f] bg-white text-[#d32f2f] hover:bg-[#fff5f5] text-sm"
                        onClick={() => setData((prev) => ({ ...prev, documents: prev.documents.filter((d) => d.id !== doc.id) }))}
                      >
                        Remove
                      </button>
                    </div>

                    <div className="w-full h-[420px] rounded-lg border border-[#e0e0e0] bg-[#fafafa] overflow-hidden">
                      {doc.mimeType.startsWith("image/") ? (
                        <img src={doc.dataUrl} alt={doc.name} className="w-full h-full object-contain" />
                      ) : doc.mimeType === "application/pdf" ? (
                        <iframe src={doc.dataUrl} title={doc.name} className="w-full h-full" />
                      ) : (
                        <div className="text-sm text-[#666] h-full p-3">
                          Preview not available for this file type.
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className={activeSection === "Compliance Calendar" ? "rounded-xl border border-[#e0e0e0] bg-white p-4" : "hidden"}>
            <h3 className="font-medium text-[18px] mb-3">8. Compliance Calendar</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#e0e0e0]">
                    <th className="text-left py-2">Compliance</th>
                    <th className="text-left py-2">Due Date</th>
                    <th className="text-left py-2">Authority</th>
                  </tr>
                </thead>
                <tbody>
                  {complianceRows.map((r) => (
                    <tr key={r.filing} className="border-b border-[#f0f0f0]">
                      <td className="py-2">{r.filing}</td>
                      <td className="py-2">{r.due}</td>
                      <td className="py-2">{r.authority}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className={activeSection === "Export / Summary" ? "rounded-xl border border-[#e0e0e0] bg-white p-4" : "hidden"}>
            <h3 className="font-medium text-[18px] mb-3">9. Export / Summary</h3>
            <div className="flex flex-wrap gap-2">
              <button className="h-9 px-3 rounded-lg border border-[#e0e0e0] hover:bg-[#f5f5f5]" onClick={generateProfilePdf}>Generate Company Profile PDF</button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

