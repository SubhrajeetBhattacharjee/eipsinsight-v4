"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { client } from "@/lib/orpc";
import { MarkdownRenderer } from "@/components/markdown-renderer";

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<{
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    content: string;
    coverImage: string | null;
    published: boolean;
    createdAt: Date | string;
    author: { id: string; name: string; image: string | null };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    client.blog
      .getBySlug({ slug })
      .then((p) => {
        if (!cancelled) setPost(p);
      })
      .catch(() => {
        if (!cancelled) setError("Post not found");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Post not found</h1>
          <Link
            href="/resources/blogs"
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blogs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950">
      <article className="container mx-auto px-4 py-8 max-w-3xl">
        <Link
          href="/resources/blogs"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blogs
        </Link>

        {post.coverImage && (
          <div className="relative h-64 md:h-80 rounded-xl overflow-hidden mb-8">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="text-lg text-slate-400 mb-6">{post.excerpt}</p>
          )}
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span>{post.author.name}</span>
            <span>·</span>
            <time dateTime={new Date(post.createdAt).toISOString()}>
              {new Date(post.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          </div>
        </header>

        <div className="prose prose-invert max-w-none">
          <MarkdownRenderer content={post.content} skipPreamble />
        </div>
      </article>
    </div>
  );
}
