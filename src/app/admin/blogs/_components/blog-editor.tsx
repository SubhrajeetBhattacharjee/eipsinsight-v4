"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Loader2, Save, Upload } from "lucide-react";
import { client } from "@/lib/orpc";
import { cn } from "@/lib/utils";

interface BlogEditorProps {
  mode: "create" | "edit";
  postId?: string;
  initialData: {
    slug: string;
    title: string;
    excerpt: string;
    content: string;
    coverImage: string | null;
    published: boolean;
  };
}

export function BlogEditor({
  mode,
  postId,
  initialData,
}: BlogEditorProps) {
  const [slug, setSlug] = useState(initialData.slug);
  const [title, setTitle] = useState(initialData.title);
  const [excerpt, setExcerpt] = useState(initialData.excerpt);
  const [content, setContent] = useState(initialData.content);
  const [coverImage, setCoverImage] = useState<string | null>(
    initialData.coverImage
  );
  const [published, setPublished] = useState(initialData.published);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSlugFromTitle = () => {
    const s = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    setSlug(s);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setUploading(true);
    setError(null);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(",")[1];
        if (!base64) return;
        const { url } = await client.blog.uploadCoverImage({
          fileName: file.name,
          base64Data: base64,
        });
        setCoverImage(url);
      } catch {
        setError("Upload failed");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      if (mode === "create") {
        await client.blog.create({
          slug,
          title,
          excerpt: excerpt || undefined,
          content,
          coverImage: coverImage ?? undefined,
          published,
        });
        window.location.href = "/admin/blogs";
      } else if (postId) {
        await client.blog.update({
          id: postId,
          slug,
          title,
          excerpt: excerpt || null,
          content,
          coverImage,
          published,
        });
        window.location.href = "/admin/blogs";
      }
    } catch (err: unknown) {
      setError(
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Failed to save"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950">
      <section className="border-b border-slate-800/50 bg-slate-900/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <Link
            href="/admin/blogs"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Manage Blogs
          </Link>
          <h1 className="text-2xl font-bold text-white">
            {mode === "create" ? "New Blog Post" : "Edit Blog Post"}
          </h1>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Blog post title"
              className="w-full px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Slug
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="url-friendly-slug"
                className="flex-1 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 font-mono text-sm"
              />
              <button
                type="button"
                onClick={handleSlugFromTitle}
                className="px-3 py-2 text-xs text-slate-400 hover:text-cyan-400 border border-slate-700/50 rounded-lg hover:border-cyan-500/30"
              >
                From title
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Lowercase, hyphens only. Will be /resources/blogs/{slug || "..."}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Excerpt
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Short summary for listing cards"
              rows={2}
              className="w-full px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 resize-y"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Cover Image
            </label>
            <div className="flex items-start gap-4">
              {coverImage && (
                <div className="relative h-24 w-32 shrink-0 rounded-lg overflow-hidden bg-slate-800">
                  <Image
                    src={coverImage}
                    alt="Cover"
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setCoverImage(null)}
                    className="absolute top-1 right-1 p-1 rounded bg-red-500/80 text-white text-xs hover:bg-red-500"
                  >
                    Remove
                  </button>
                </div>
              )}
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700/50 bg-slate-800/50 text-slate-300 hover:border-cyan-500/30 cursor-pointer">
                <Upload className="h-4 w-4" />
                {uploading ? "Uploading..." : "Upload image"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  disabled={uploading}
                  className="sr-only"
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Content (Markdown)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your blog post in Markdown..."
              rows={16}
              className="w-full px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 font-mono text-sm resize-y"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500/30"
              />
              <span className="text-sm text-slate-300">Publish immediately</span>
            </label>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={handleSave}
              disabled={saving || !slug || !title || !content}
              className={cn(
                "inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors",
                "bg-cyan-500/20 border border-cyan-500/40 text-white",
                "hover:bg-cyan-500/30 hover:border-cyan-400",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Saving..." : "Save"}
            </button>
            <Link
              href="/admin/blogs"
              className="px-6 py-2.5 rounded-lg border border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
