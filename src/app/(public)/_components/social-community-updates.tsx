'use client';

import React from 'react';
import { motion } from 'motion/react';
import {
  Calendar,
  ExternalLink,
  Github,
  Hash,
  MessageCircle,
  MessageSquare,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const communityDiscussions = [
  {
    id: 1,
    title: 'EIP-7702: Set EOA account code for one transaction',
    platform: 'Ethereum Magicians',
    category: 'Core',
    replies: 87,
    views: 2340,
    lastActive: '2 hours ago',
    url: 'https://ethereum-magicians.org/t/eip-7702-set-eoa-account-code-for-one-transaction/19923',
    isHot: true,
  },
  {
    id: 2,
    title: 'Account Abstraction roadmap discussion',
    platform: 'Ethereum Research',
    category: 'ERC',
    replies: 156,
    views: 4820,
    lastActive: '5 hours ago',
    url: 'https://ethresear.ch/t/account-abstraction-roadmap/',
    isHot: true,
  },
  {
    id: 3,
    title: 'EIP Review Process Improvements',
    platform: 'AllCoreDevs',
    category: 'Meta',
    replies: 43,
    views: 1230,
    lastActive: '1 day ago',
    url: 'https://github.com/ethereum/pm/issues/',
    isHot: false,
  },
];

const upcomingEvents = [
  {
    id: 1,
    title: 'All Core Devs Call #184',
    date: 'Feb 27, 2026',
    time: '14:00 UTC',
    url: 'https://github.com/ethereum/pm/issues/',
    icon: Users,
  },
  {
    id: 2,
    title: 'EIP Editors Meeting',
    date: 'Feb 28, 2026',
    time: '15:00 UTC',
    url: 'https://github.com/ethereum/pm/issues/',
    icon: MessageSquare,
  },
  {
    id: 3,
    title: 'Community Office Hours',
    date: 'Mar 1, 2026',
    time: '16:00 UTC',
    url: 'https://ethereum-magicians.org/',
    icon: Calendar,
  },
];

const communityChannels = [
  {
    name: 'Discord',
    description: 'Real-time governance and standards discussions',
    members: '12.5k',
    url: 'https://discord.gg/ethereum',
    icon: MessageCircle,
    color: 'indigo',
  },
  {
    name: 'GitHub Discussions',
    description: 'Proposal feedback and technical design debate',
    members: '8.3k',
    url: 'https://github.com/ethereum/EIPs/discussions',
    icon: Github,
    color: 'slate',
  },
  {
    name: 'Ethereum Magicians',
    description: 'Long-form EIP and governance conversations',
    members: '15.2k',
    url: 'https://ethereum-magicians.org/',
    icon: Hash,
    color: 'violet',
  },
];

const communityStats = [
  { label: 'Active Contributors', value: '1,247', trend: '+12%', icon: Users, color: 'emerald' },
  { label: 'Monthly Discussions', value: '856', trend: '+24%', icon: MessageSquare, color: 'cyan' },
  { label: 'Community Events', value: '32', trend: '+8%', icon: Calendar, color: 'violet' },
];

const getColorClasses = (color: string) => {
  const colors: Record<string, { border: string; bg: string; icon: string }> = {
    emerald: { border: 'border-emerald-400/30', bg: 'bg-emerald-500/10', icon: 'text-emerald-500' },
    cyan: { border: 'border-cyan-400/30', bg: 'bg-cyan-500/10', icon: 'text-cyan-500' },
    violet: { border: 'border-violet-400/30', bg: 'bg-violet-500/10', icon: 'text-violet-500' },
    indigo: { border: 'border-indigo-400/30', bg: 'bg-indigo-500/10', icon: 'text-indigo-500' },
    slate: { border: 'border-slate-400/30', bg: 'bg-slate-500/10', icon: 'text-slate-500' },
  };
  return colors[color] || colors.cyan;
};

export default function SocialCommunityUpdates() {
  return (
    <section className="rounded-xl border border-slate-200/80 bg-white/90 p-4 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/55">
      <div className="mb-4">
        <h2 className="dec-title text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
          Social & Community Updates
        </h2>
        <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
          Discussions, channels, and events across the Ethereum standards ecosystem.
        </p>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {communityStats.map((stat) => {
          const Icon = stat.icon;
          const colors = getColorClasses(stat.color);
          return (
            <div key={stat.label} className="flex items-center gap-3 rounded-lg border border-slate-200/80 bg-slate-50/80 p-3 dark:border-slate-700/50 dark:bg-slate-900/50">
              <div className={cn('rounded-lg border p-2', colors.bg, colors.border)}>
                <Icon className={cn('h-4 w-4', colors.icon)} />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold leading-none text-slate-900 dark:text-slate-100">{stat.value}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">{stat.label}</p>
              </div>
              <span className="ml-auto text-xs font-semibold text-emerald-600 dark:text-emerald-300">{stat.trend}</span>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Discussions</h3>
          {communityDiscussions.map((discussion) => (
            <motion.a
              key={discussion.id}
              href={discussion.url}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ y: -1 }}
              className="group flex flex-col rounded-lg border border-slate-200/80 bg-slate-50/70 p-3 transition hover:border-cyan-400/40 dark:border-slate-700/50 dark:bg-slate-900/50"
            >
              <div className="mb-1 flex items-center gap-2">
                {discussion.isHot && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-orange-400/30 bg-orange-500/10 px-2 py-0.5 text-[10px] font-semibold text-orange-700 dark:text-orange-300">
                    <Zap className="h-3 w-3" /> Hot
                  </span>
                )}
                <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-700 dark:text-cyan-300">
                  {discussion.category}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-900 transition group-hover:text-cyan-700 dark:text-slate-100 dark:group-hover:text-cyan-300">
                {discussion.title}
              </p>
              <div className="mt-2 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1"><MessageCircle className="h-3 w-3" />{discussion.replies}</span>
                <span className="inline-flex items-center gap-1"><TrendingUp className="h-3 w-3" />{discussion.views}</span>
                <span className="ml-auto">{discussion.lastActive}</span>
              </div>
            </motion.a>
          ))}
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Channels & Events</h3>
          {communityChannels.map((channel) => {
            const Icon = channel.icon;
            const colors = getColorClasses(channel.color);
            return (
              <a key={channel.name} href={channel.url} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-3 rounded-lg border border-slate-200/80 bg-slate-50/70 p-3 transition hover:border-cyan-400/40 dark:border-slate-700/50 dark:bg-slate-900/50">
                <div className={cn('rounded-lg border p-2', colors.bg, colors.border)}>
                  <Icon className={cn('h-4 w-4', colors.icon)} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{channel.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{channel.description}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{channel.members}</p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400 opacity-0 transition group-hover:opacity-100" />
              </a>
            );
          })}
          {upcomingEvents.map((event) => {
            const Icon = event.icon;
            return (
              <a key={event.id} href={event.url} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-3 rounded-lg border border-slate-200/80 bg-slate-50/70 p-3 transition hover:border-cyan-400/40 dark:border-slate-700/50 dark:bg-slate-900/50">
                <div className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-2">
                  <Icon className="h-4 w-4 text-cyan-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{event.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{event.date} · {event.time}</p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400 opacity-0 transition group-hover:opacity-100" />
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
