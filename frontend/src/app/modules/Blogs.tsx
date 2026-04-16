import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarClock,
  Eye,
  FileText,
  MoreVertical,
  PenSquare,
  Plus,
  Search,
  Trash2,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { formatISTDateTime } from "../utils/formatters";
import { crmApi } from "../../lib/api";

type BlogStatus = "draft" | "in_review" | "scheduled" | "published" | "archived";

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image_url: string;
  category_id: string;
  category_name: string;
  tags: string[];
  status: BlogStatus;
  scheduled_at?: string | null;
  published_at?: string | null;
  author_id: string;
  author_name: string;
  seo_title?: string;
  seo_description?: string;
  created_at: string;
  updated_at: string;
}

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
}

interface BlogFormState {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image_url: string;
  category_id: string;
  category_name: string;
  tags: string;
  status: BlogStatus;
  scheduled_at: string;
  seo_title: string;
  seo_description: string;
}

const DEFAULT_CATEGORIES: BlogCategory[] = [
  { id: "local-general", name: "General", slug: "general" },
];

const PAGE_SIZE = 6;

const statusLabels: Record<BlogStatus, string> = {
  draft: "Draft",
  in_review: "In Review",
  scheduled: "Scheduled",
  published: "Published",
  archived: "Archived",
};

const emptyBlogForm = (categoryId = ""): BlogFormState => ({
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  featured_image_url: "",
  category_id: categoryId,
  category_name: "",
  tags: "",
  status: "draft",
  scheduled_at: "",
  seo_title: "",
  seo_description: "",
});

function mapBlogFromApi(raw: any): Blog {
  const rawStatus = typeof raw?.status === "string" ? raw.status : "draft";
  const allowedStatuses: BlogStatus[] = ["draft", "in_review", "scheduled", "published", "archived"];
  const status: BlogStatus = allowedStatuses.includes(rawStatus as BlogStatus) ? (rawStatus as BlogStatus) : "draft";

  return {
    id: String(raw?.id ?? `blog_${Date.now()}`),
    title: raw?.title ?? "",
    slug: raw?.slug ?? "",
    excerpt: raw?.excerpt ?? "",
    content: raw?.content ?? "",
    featured_image_url: raw?.featured_image_url ?? raw?.cover_image_url ?? "",
    category_id: raw?.category_id ?? "general",
    category_name: raw?.category_name ?? raw?.category ?? "General",
    tags: Array.isArray(raw?.tags) ? raw.tags : [],
    status,
    scheduled_at: raw?.scheduled_at ?? null,
    published_at: raw?.published_at ?? null,
    author_id: raw?.author_id ?? "",
    author_name: raw?.author_name ?? raw?.author ?? "Unknown",
    seo_title: raw?.seo_title ?? "",
    seo_description: raw?.seo_description ?? "",
    created_at: raw?.created_at ?? new Date().toISOString(),
    updated_at: raw?.updated_at ?? new Date().toISOString(),
  };
}

function isUuid(value?: string | null): boolean {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function tagsToString(tags: string[]): string {
  return tags.join(", ");
}

function stringToTags(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function toDateTimeLocal(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function toISOFromDateTimeLocal(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function getStatusBadgeClasses(status: BlogStatus): string {
  switch (status) {
    case "published":
      return "bg-logo-pale text-logo-primary border border-logo-light/60";
    case "scheduled":
      return "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800";
    case "in_review":
      return "bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800";
    case "archived":
      return "bg-muted text-muted-foreground border border-border";
    default:
      return "bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800";
  }
}

export function Blogs() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<"all" | BlogStatus>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"updated_desc" | "updated_asc" | "created_desc">("updated_desc");
  const [currentPage, setCurrentPage] = useState(1);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Blog | null>(null);
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  const [previewBlog, setPreviewBlog] = useState<Blog | null>(null);
  const [form, setForm] = useState<BlogFormState>(emptyBlogForm());
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      const [blogsResponse, categoriesResponse] = await Promise.all([
        crmApi.getBlogs(),
        crmApi.getBlogCategories(),
      ]);

      const loadedCategories: BlogCategory[] =
        categoriesResponse.success && Array.isArray(categoriesResponse.data) && categoriesResponse.data.length > 0
          ? categoriesResponse.data.map((c: any) => ({
              id: String(c.id),
              name: c.name || "General",
              slug: c.slug || "general",
            }))
          : DEFAULT_CATEGORIES;

      const categoryNameById = new Map(loadedCategories.map((c) => [c.id, c.name]));
      const loadedBlogs: Blog[] =
        blogsResponse.success && Array.isArray(blogsResponse.data)
          ? blogsResponse.data.map((b: any) =>
              mapBlogFromApi({
                ...b,
                category_name: b.category_name || categoryNameById.get(String(b.category_id)) || "General",
              })
            )
          : [];

      setBlogs(loadedBlogs);
      setCategories(loadedCategories);
      setForm({
        ...emptyBlogForm(loadedCategories[0]?.id || "local-general"),
        category_name: loadedCategories[0]?.name || "General",
      });
      setIsLoading(false);
    })();
  }, []);

  const filteredBlogs = useMemo(() => {
    let list = [...blogs];

    if (statusTab !== "all") {
      list = list.filter((b) => b.status === statusTab);
    }
    if (categoryFilter !== "all") {
      list = list.filter((b) => b.category_id === categoryFilter);
    }
    if (search.trim()) {
      const query = search.trim().toLowerCase();
      list = list.filter((b) =>
        [b.title, b.author_name, b.category_name, b.tags.join(" "), b.slug]
          .join(" ")
          .toLowerCase()
          .includes(query)
      );
    }

    list.sort((a, b) => {
      if (sortBy === "updated_asc") {
        return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
      }
      if (sortBy === "created_desc") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    return list;
  }, [blogs, categoryFilter, search, sortBy, statusTab]);

  const totalPages = Math.max(1, Math.ceil(filteredBlogs.length / PAGE_SIZE));
  const paginatedBlogs = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredBlogs.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredBlogs]);

  const stats = useMemo(() => {
    const total = blogs.length;
    const drafts = blogs.filter((b) => b.status === "draft").length;
    const published = blogs.filter((b) => b.status === "published").length;
    const scheduled = blogs.filter((b) => b.status === "scheduled").length;
    return { total, drafts, published, scheduled };
  }, [blogs]);

  const openCreate = () => {
    setEditingBlogId(null);
    setForm({
      ...emptyBlogForm(categories[0]?.id || "local-general"),
      category_name: categories[0]?.name || "General",
    });
    setIsEditorOpen(true);
  };

  const openEdit = (blog: Blog) => {
    setEditingBlogId(blog.id);
    setForm({
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt,
      content: blog.content,
      featured_image_url: blog.featured_image_url,
      category_id: blog.category_id,
      category_name: blog.category_name || "",
      tags: tagsToString(blog.tags),
      status: blog.status,
      scheduled_at: toDateTimeLocal(blog.scheduled_at),
      seo_title: blog.seo_title || "",
      seo_description: blog.seo_description || "",
    });
    setIsEditorOpen(true);
  };

  const openPreview = (blog: Blog) => {
    setPreviewBlog(blog);
    setIsPreviewOpen(true);
  };

  const duplicateBlog = (blog: Blog) => {
    const now = new Date().toISOString();
    const duplicated: Blog = {
      ...blog,
      id: `blog_${Date.now()}`,
      title: `${blog.title} (Copy)`,
      slug: `${blog.slug}-copy-${Date.now().toString().slice(-4)}`,
      status: "draft",
      published_at: null,
      scheduled_at: null,
      created_at: now,
      updated_at: now,
    };
    setBlogs((prev) => [duplicated, ...prev]);
    toast.success("Blog duplicated as draft");
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    void (async () => {
      const response = await crmApi.deleteBlog(deleteTarget.id);
      if (!response.success) {
        toast.error(response.error || "Failed to delete blog");
        return;
      }
      setBlogs((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("Blog deleted");
    })();
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim())) {
      toast.error("Slug must be lowercase words separated by hyphens");
      return;
    }
    if (form.status === "scheduled" && !form.scheduled_at) {
      toast.error("Scheduled date/time is required");
      return;
    }

    let selectedCategory = categories.find((c) => c.id === form.category_id);
    let categoryName = form.category_name.trim();
    if (!categoryName && selectedCategory) categoryName = selectedCategory.name;
    if (!categoryName) {
      toast.error("Category is required");
      return;
    }

    if (!selectedCategory) {
      const existingByName = categories.find((c) => c.name.toLowerCase() === categoryName.toLowerCase());
      if (existingByName) {
        selectedCategory = existingByName;
      } else {
        const createdCategory = await crmApi.createBlogCategory(categoryName);
        if (!createdCategory.success || !createdCategory.data) {
          toast.error(createdCategory.error || "Failed to create category");
          return;
        }
        const newCategory: BlogCategory = {
          id: String(createdCategory.data.id),
          name: createdCategory.data.name || categoryName,
          slug: createdCategory.data.slug || slugify(categoryName),
        };
        setCategories((prev) => [newCategory, ...prev]);
        selectedCategory = newCategory;
      }
    }

    const now = new Date().toISOString();
    const scheduledAtIso = toISOFromDateTimeLocal(form.scheduled_at);

    const payload: Blog = {
      id: editingBlogId || `blog_${Date.now()}`,
      title: form.title.trim(),
      slug: form.slug.trim(),
      excerpt: form.excerpt.trim(),
      content: form.content.trim(),
      featured_image_url: form.featured_image_url.trim(),
      category_id: isUuid(selectedCategory?.id) ? selectedCategory!.id : "",
      category_name: selectedCategory?.name || categoryName || "Uncategorized",
      tags: stringToTags(form.tags),
      status: form.status,
      scheduled_at: form.status === "scheduled" ? scheduledAtIso : null,
      published_at: form.status === "published" ? now : null,
      author_id: "current_user",
      author_name: "Mukesh Ayudh",
      seo_title: form.seo_title.trim(),
      seo_description: form.seo_description.trim(),
      created_at: editingBlogId ? blogs.find((b) => b.id === editingBlogId)?.created_at || now : now,
      updated_at: now,
    };

    const apiPayload = {
      title: payload.title,
      slug: payload.slug,
      excerpt: payload.excerpt,
      content: payload.content,
      featured_image_url: payload.featured_image_url,
      cover_image_url: payload.featured_image_url,
      category_id: payload.category_id,
      category_name: payload.category_name,
      tags: payload.tags,
      status: payload.status,
      scheduled_at: payload.scheduled_at,
      published_at: payload.published_at,
      is_published: payload.status === "published",
      seo_title: payload.seo_title,
      seo_description: payload.seo_description,
    };

    const response = editingBlogId
      ? await crmApi.updateBlog(editingBlogId, apiPayload)
      : await crmApi.createBlog(apiPayload);

    if (!response.success || !response.data) {
      toast.error(response.error || "Failed to save blog");
      return;
    }

    const savedBlog = mapBlogFromApi({
      ...response.data,
      category_name:
        categories.find((c) => c.id === String(response.data.category_id))?.name ||
        response.data.category_name ||
        "General",
    });

    setBlogs((prev) => {
      if (!editingBlogId) return [savedBlog, ...prev];
      return prev.map((b) => (b.id === editingBlogId ? savedBlog : b));
    });

    setIsEditorOpen(false);
    toast.success(editingBlogId ? "Blog updated" : "Blog created");
  };

  const handlePublish = async (blogId: string) => {
    const response = await crmApi.publishBlog(blogId);
    if (!response.success || !response.data) {
      toast.error(response.error || "Failed to publish blog");
      return;
    }
    const updated = mapBlogFromApi({
      ...response.data,
      category_name:
        categories.find((c) => c.id === String(response.data.category_id))?.name || response.data.category_name || "General",
    });
    setBlogs((prev) => prev.map((b) => (b.id === blogId ? updated : b)));
    toast.success("Blog published");
  };

  const statusBuckets: Array<{ key: "all" | BlogStatus; label: string; count: number }> = [
    { key: "all", label: "All", count: blogs.length },
    { key: "draft", label: "Draft", count: blogs.filter((b) => b.status === "draft").length },
    { key: "in_review", label: "In Review", count: blogs.filter((b) => b.status === "in_review").length },
    { key: "scheduled", label: "Scheduled", count: blogs.filter((b) => b.status === "scheduled").length },
    { key: "published", label: "Published", count: blogs.filter((b) => b.status === "published").length },
    { key: "archived", label: "Archived", count: blogs.filter((b) => b.status === "archived").length },
  ];

  const handleFeaturedImageUpload = async (file: File) => {
    setIsUploadingImage(true);
    const response = await crmApi.uploadBlogImage(file);
    setIsUploadingImage(false);

    if (!response.success || !response.data?.url) {
      toast.error(response.error || "Failed to upload image");
      return;
    }

    setForm((prev) => ({ ...prev, featured_image_url: response.data.url }));
    toast.success("Image uploaded successfully");
  };

  if (isEditorOpen) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-xl" onClick={() => setIsEditorOpen(false)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blogs
            </Button>
            <div>
              <h1 className="text-2xl lg:text-3xl font-medium">{editingBlogId ? "Edit Blog" : "Create New Blog"}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {/* TODO(api): map this form payload to backend create/update endpoints once available */}
                Manage article content and publishing workflow.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setIsEditorOpen(false)}>
              Cancel
            </Button>
            {editingBlogId && form.status !== "published" && (
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => void handlePublish(editingBlogId)}
              >
                Publish
              </Button>
            )}
            <Button className="rounded-xl bg-logo-primary hover:bg-logo-primary/90 text-white" onClick={() => void handleSave()}>
              {editingBlogId ? "Update Blog" : "Create Blog"}
            </Button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 lg:p-6">
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="blog-title">Title *</Label>
              <Input
                id="blog-title"
                value={form.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    title,
                    slug: prev.slug === "" || prev.slug === slugify(prev.title) ? slugify(title) : prev.slug,
                  }));
                }}
                placeholder="Enter blog title"
                className="rounded-xl"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="blog-slug">Slug *</Label>
                <Input
                  id="blog-slug"
                  value={form.slug}
                  onChange={(e) => setForm((prev) => ({ ...prev, slug: slugify(e.target.value) }))}
                  placeholder="blog-slug"
                  className="rounded-xl"
                />
              </div>
              <div className="grid gap-2">
                <Label>Category</Label>
                <Input
                  list="blog-category-suggestions"
                  value={form.category_name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const matched = categories.find((c) => c.name.toLowerCase() === name.toLowerCase());
                    setForm((prev) => ({
                      ...prev,
                      category_name: name,
                      category_id: matched?.id || "",
                    }));
                  }}
                  placeholder="Type category (existing or new)"
                  className="rounded-xl"
                />
                <datalist id="blog-category-suggestions">
                  {categories.map((category) => (
                    <option key={category.id} value={category.name} />
                  ))}
                </datalist>
                <p className="text-xs text-muted-foreground">
                  Type to search existing categories. New category names are created automatically on save.
                </p>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="blog-excerpt">Excerpt</Label>
              <Textarea
                id="blog-excerpt"
                value={form.excerpt}
                onChange={(e) => setForm((prev) => ({ ...prev, excerpt: e.target.value }))}
                placeholder="Short summary for list cards and SEO snippets"
                className="rounded-xl"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="blog-content">Content</Label>
              <Textarea
                id="blog-content"
                value={form.content}
                onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                placeholder="Write blog content..."
                className="rounded-xl min-h-[240px]"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="blog-image">Featured Image URL</Label>
                <Input
                  id="blog-image"
                  value={form.featured_image_url}
                  onChange={(e) => setForm((prev) => ({ ...prev, featured_image_url: e.target.value }))}
                  placeholder="https://..."
                  className="rounded-xl"
                />
                <div className="flex items-center gap-3">
                  <Label
                    htmlFor="blog-image-upload"
                    className="inline-flex items-center px-3 py-2 rounded-lg border border-border cursor-pointer text-sm hover:bg-muted"
                  >
                    {isUploadingImage ? "Uploading..." : "Upload image"}
                  </Label>
                  <Input
                    id="blog-image-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    disabled={isUploadingImage}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        void handleFeaturedImageUpload(file);
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                  {form.featured_image_url ? (
                    <span className="text-xs text-muted-foreground truncate max-w-[250px]">
                      Uploaded
                    </span>
                  ) : null}
                </div>
                {form.featured_image_url ? (
                  <div className="mt-2 rounded-xl border border-border p-2 bg-muted/20">
                    <img
                      src={form.featured_image_url}
                      alt="Featured preview"
                      className="h-36 w-full object-cover rounded-lg"
                    />
                  </div>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="blog-tags">Tags</Label>
                <Input
                  id="blog-tags"
                  value={form.tags}
                  onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))}
                  placeholder="crm, leads, conversion"
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(value) => setForm((prev) => ({ ...prev, status: value as BlogStatus }))}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {form.status === "scheduled" && (
                <div className="grid gap-2">
                  <Label htmlFor="blog-scheduled">Scheduled Publish</Label>
                  <Input
                    id="blog-scheduled"
                    type="datetime-local"
                    value={form.scheduled_at}
                    onChange={(e) => setForm((prev) => ({ ...prev, scheduled_at: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="blog-seo-title">SEO Title</Label>
                <Input
                  id="blog-seo-title"
                  value={form.seo_title}
                  onChange={(e) => setForm((prev) => ({ ...prev, seo_title: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="blog-seo-description">SEO Description</Label>
                <Textarea
                  id="blog-seo-description"
                  value={form.seo_description}
                  onChange={(e) => setForm((prev) => ({ ...prev, seo_description: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-medium">Blogs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create, schedule, and manage website blog content from CRM.
          </p>
        </div>
        <Button className="rounded-xl bg-logo-primary hover:bg-logo-primary/90 text-white" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          New Blog
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Total Blogs</p>
          <p className="text-2xl font-semibold mt-1">{stats.total}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Drafts</p>
          <p className="text-2xl font-semibold mt-1">{stats.drafts}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Published</p>
          <p className="text-2xl font-semibold mt-1">{stats.published}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Scheduled</p>
          <p className="text-2xl font-semibold mt-1">{stats.scheduled}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 lg:p-6 space-y-4">
        <Tabs value={statusTab} onValueChange={(v) => { setStatusTab(v as "all" | BlogStatus); setCurrentPage(1); }}>
          <TabsList className="rounded-xl flex-wrap h-auto p-1">
            {statusBuckets.map((bucket) => (
              <TabsTrigger key={bucket.key} value={bucket.key} className="rounded-lg">
                {bucket.label} ({bucket.count})
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative xl:col-span-2">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search title, author, category, tags..."
              className="pl-9 rounded-xl"
            />
          </div>
          <Select value={categoryFilter} onValueChange={(value) => { setCategoryFilter(value); setCurrentPage(1); }}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as "updated_desc" | "updated_asc" | "created_desc")}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated_desc">Updated (newest)</SelectItem>
              <SelectItem value="updated_asc">Updated (oldest)</SelectItem>
              <SelectItem value="created_desc">Created (newest)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[1100px]">
            <thead className="bg-muted/60">
              <tr className="text-left">
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Title</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Author</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Category</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Tags</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Created At</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Updated At</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Scheduled At</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-14 text-center text-sm text-muted-foreground">
                    Loading blogs...
                  </td>
                </tr>
              ) : paginatedBlogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-14 text-center text-sm text-muted-foreground">
                    No blogs found for current filters.
                  </td>
                </tr>
              ) : (
                paginatedBlogs.map((blog) => (
                  <tr key={blog.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium">{blog.title}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{blog.author_name}</td>
                    <td className="px-4 py-3 text-sm">{blog.category_name}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {blog.tags.length === 0 ? (
                          <span className="text-xs text-muted-foreground">-</span>
                        ) : (
                          blog.tags.slice(0, 3).map((tag) => (
                            <Badge key={`${blog.id}-${tag}`} variant="outline" className="text-[11px]">
                              {tag}
                            </Badge>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={getStatusBadgeClasses(blog.status)}>{statusLabels[blog.status]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatISTDateTime(blog.created_at)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatISTDateTime(blog.updated_at)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {blog.scheduled_at ? formatISTDateTime(blog.scheduled_at) : "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-lg">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openPreview(blog)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          {blog.status !== "published" && (
                            <DropdownMenuItem onClick={() => void handlePublish(blog.id)}>
                              <Plus className="w-4 h-4 mr-2" />
                              Publish
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => openEdit(blog)}>
                            <PenSquare className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => duplicateBlog(blog)}>
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteTarget(blog)} className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Showing {paginatedBlogs.length} of {filteredBlogs.length} blogs
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="rounded-lg"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">Page {currentPage} / {totalPages}</span>
            <Button
              variant="outline"
              className="rounded-lg"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="pr-8">{previewBlog?.title || "Blog Preview"}</DialogTitle>
            <DialogDescription>Preview of blog details and metadata.</DialogDescription>
          </DialogHeader>
          {previewBlog && (
            <div className="space-y-4">
              {previewBlog.featured_image_url ? (
                <img
                  src={previewBlog.featured_image_url}
                  alt={previewBlog.title}
                  className="w-full h-52 object-cover rounded-xl border border-border"
                />
              ) : (
                <div className="w-full h-52 rounded-xl border border-border bg-muted/50 flex items-center justify-center text-muted-foreground">
                  <FileText className="w-6 h-6 mr-2" />
                  No featured image
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Badge className={getStatusBadgeClasses(previewBlog.status)}>{statusLabels[previewBlog.status]}</Badge>
                <Badge variant="outline">{previewBlog.category_name}</Badge>
                {previewBlog.tags.map((tag) => (
                  <Badge key={`preview-${tag}`} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <p><span className="text-muted-foreground">Author:</span> {previewBlog.author_name}</p>
                <p><span className="text-muted-foreground">Slug:</span> /{previewBlog.slug}</p>
                <p><span className="text-muted-foreground">Created:</span> {formatISTDateTime(previewBlog.created_at)}</p>
                <p><span className="text-muted-foreground">Updated:</span> {formatISTDateTime(previewBlog.updated_at)}</p>
                <p className="md:col-span-2">
                  <span className="text-muted-foreground">Scheduled:</span>{" "}
                  {previewBlog.scheduled_at ? formatISTDateTime(previewBlog.scheduled_at) : "-"}
                </p>
              </div>

              <div className="rounded-xl border border-border p-4 bg-muted/20">
                <p className="text-sm font-medium mb-2">Excerpt</p>
                <p className="text-sm text-muted-foreground">{previewBlog.excerpt || "-"}</p>
              </div>

              <div className="rounded-xl border border-border p-4">
                <p className="text-sm font-medium mb-2">Content</p>
                <p className="text-sm whitespace-pre-wrap leading-6">{previewBlog.content || "-"}</p>
              </div>

              <div className="rounded-xl border border-border p-4 bg-muted/20">
                <p className="text-sm font-medium mb-2">SEO</p>
                <p className="text-sm"><span className="text-muted-foreground">SEO Title:</span> {previewBlog.seo_title || "-"}</p>
                <p className="text-sm mt-1"><span className="text-muted-foreground">SEO Description:</span> {previewBlog.seo_description || "-"}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blog</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.title || "this blog"}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="text-xs text-muted-foreground flex items-center gap-2">
        <CalendarClock className="w-3.5 h-3.5" />
        All blog timestamps are shown in IST (`DD-MMM-YY HH:MM AM/PM`).
      </div>
    </div>
  );
}
