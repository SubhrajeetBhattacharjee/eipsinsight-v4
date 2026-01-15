'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

interface BlogPost {
  image: string;
  title: string;
  content: string;
  link: string;
}

interface UpgradeBlogCarouselProps {
  posts: BlogPost[];
  upgradeName: string;
}

export function UpgradeBlogCarousel({ posts, upgradeName }: UpgradeBlogCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  if (!posts || posts.length === 0) return null;

  const visiblePosts = 3;
  const maxIndex = Math.max(0, posts.length - visiblePosts);

  const goNext = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
  };

  const goPrev = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const visibleItems = posts.slice(currentIndex, currentIndex + visiblePosts);

  return (
    <div className="relative w-full">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white mb-1">Related Articles</h3>
          <p className="text-xs text-slate-400">Latest updates and insights about {upgradeName}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className={cn(
              'p-1.5 rounded-lg border border-slate-700/40 bg-slate-900/50 text-slate-400',
              'hover:border-cyan-400/50 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all',
              'disabled:opacity-30 disabled:cursor-not-allowed'
            )}
            aria-label="Previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={goNext}
            disabled={currentIndex >= maxIndex}
            className={cn(
              'p-1.5 rounded-lg border border-slate-700/40 bg-slate-900/50 text-slate-400',
              'hover:border-cyan-400/50 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all',
              'disabled:opacity-30 disabled:cursor-not-allowed'
            )}
            aria-label="Next"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {visibleItems.map((post, idx) => (
          <motion.div
            key={`${post.link}-${idx}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.1 }}
            className="group relative rounded-lg border border-slate-700/40 bg-slate-950/50 overflow-hidden hover:border-cyan-400/50 transition-all"
          >
            <Link
              href={post.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <div className="relative h-28 sm:h-32 overflow-hidden bg-slate-900/50">
                {post.image.startsWith('http') ? (
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <Image
                    src={`/upgrade/${post.image}`}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
              </div>
              <div className="p-2.5">
                <h4 className="text-sm font-semibold text-white mb-2 line-clamp-2 group-hover:text-cyan-300 transition-colors">
                  {post.title}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-2">
                  {post.content}
                </p>
                <div className="flex items-center gap-1 text-xs text-cyan-400 group-hover:text-cyan-300 transition-colors">
                  <span>Read more</span>
                  <ExternalLink className="h-3 w-3" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {posts.length > visiblePosts && (
        <div className="flex items-center justify-center gap-1 mt-4">
          {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                'h-1.5 rounded-full transition-all',
                idx === currentIndex
                  ? 'w-6 bg-cyan-400'
                  : 'w-1.5 bg-slate-700/50 hover:bg-slate-600/50'
              )}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
