'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Users, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { title: 'PR Analytics', href: '/analytics/prs', icon: BarChart3 },
  { title: 'Contributors', href: '/analytics/contributors', icon: Users },
  { title: 'Editors & Reviewers', href: '/analytics/editors', icon: UserCheck },
];

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-20 border-b border-cyan-400/20 bg-slate-950/90 backdrop-blur-xl">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 py-2">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                pathname.startsWith(item.href + '/') ||
                pathname.startsWith(item.href + '?');
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
