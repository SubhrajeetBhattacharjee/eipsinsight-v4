"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, FileText, Loader2, Plus, Pencil } from "lucide-react";
import { client } from "@/lib/orpc";
import { cn } from "@/lib/utils";

export default function BlogsPage() {
  const [posts, setPosts] = useState<Array<{
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    coverImage: string | null;
    published: boolean;
    createdAt: Date | string;
    author: { id: string; name: string; image: string | null };
  }>>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      client.blog.list({ publishedOnly: true, limit: 50 }),
      client.account.getMe().then((u) => u.role === "admin").catch(() => false),
    ])
      .then(([res, admin]) => {
        if (!cancelled) {
          setPosts(res.posts);
          setTotal(res.total);
          setIsAdmin(admin);
        }
      })
      .catch(() => {
        if (!cancelled) setPosts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950">
      <section className="border-b border-slate-800/50 bg-slate-900/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <Link
            href="/resources"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Resources
          </Link>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Blogs
              </h1>
              <p className="text-slate-400">
                Deep dives and explainers about Ethereum standards.
              </p>
            </div>
            {isAdmin && (
              <Link
                href="/admin/blogs"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-cyan-500/20 border border-cyan-500/40 rounded-lg hover:bg-cyan-500/30 hover:border-cyan-400 transition-colors"
              >
                <Pencil className="h-4 w-4" />
                Manage Blogs
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center max-w-lg mx-auto py-24">
            <div className="rounded-full bg-emerald-500/20 p-6 inline-flex mb-6">
              <FileText className="h-12 w-12 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              No blog posts yet
            </h2>
            <p className="text-slate-400 mb-8">
              We&apos;re working on bringing you insightful blog posts about EIPs, ERCs, RIPs, and the Ethereum ecosystem. Check back soon!
            </p>
            {isAdmin && (
              <Link
                href="/admin/blogs/new"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-cyan-500/20 border border-cyan-500/40 rounded-lg hover:bg-cyan-500/30 hover:border-cyan-400 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create first post
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/resources/blogs/${post.slug}`}
                className="group rounded-xl border border-slate-700/50 bg-slate-900/40 overflow-hidden hover:border-cyan-500/40 transition-all"
              >
                <div className="relative h-40 bg-slate-800/50">
                  {post.coverImage ? (
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FileText className="h-12 w-12 text-slate-600" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-transparent to-transparent" />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-cyan-300 transition-colors">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-sm text-slate-400 line-clamp-2 mb-3">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{post.author.name}</span>
                    <span>·</span>
                    <span>
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
