'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Activity,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Bell,
  Boxes,
  CheckCircle2,
  Code,
  Cpu,
  Download,
  Eye,
  FileText,
  GitBranch,
  Layers,
  Network,
  Pause,
  TrendingUp,
  Trophy,
  XCircle,
  Zap,
} from 'lucide-react';
import { client } from '@/lib/orpc';
import { EIPsPageHeader } from './_components/eips-page-header';
import HomeFAQs from './_components/home-faqs';
import SocialCommunityUpdates from '../landing/_components/social-community-updates';

const FEB_2026 = '2026-02';

type Dimension = 'status' | 'category' | 'repo';
type SortBy = 'github' | 'eip' | 'title' | 'author' | 'type' | 'category' | 'status' | 'updated_at';
type SortDir = 'asc' | 'desc';

type ColumnSearch = {
  github: string;
  eip: string;
  title: string;
  author: string;
  type: string;
  status: string;
  category: string;
  updatedAt: string;
};

const STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-slate-500',
  Review: 'bg-amber-500',
  'Last Call': 'bg-orange-500',
  Final: 'bg-emerald-500',
  Living: 'bg-cyan-500',
  Stagnant: 'bg-gray-500',
  Withdrawn: 'bg-red-500',
  Unknown: 'bg-slate-400',
  EIPs: 'bg-cyan-500',
  ERCs: 'bg-emerald-500',
  RIPs: 'bg-violet-500',
};

const BADGE_COLORS: Record<string, string> = {
  Draft: 'bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-500/30',
  Review: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30',
  'Last Call': 'bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30',
  Final: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  Living: 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
  Stagnant: 'bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/30',
  Withdrawn: 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30',
  Unknown: 'bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-500/30',
};

const statusIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Draft: FileText,
  Review: Eye,
  'Last Call': Bell,
  Final: CheckCircle2,
  Living: Zap,
  Stagnant: Pause,
  Withdrawn: XCircle,
  Unknown: Layers,
};

const categoryIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Core: Cpu,
  Networking: Network,
  Interface: Code,
  ERC: Boxes,
  RIP: GitBranch,
  RRC: GitBranch,
  Meta: Layers,
  Informational: FileText,
  Other: Layers,
};

const repoIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  EIPs: FileText,
  ERCs: Boxes,
  RIPs: GitBranch,
};

function monthLabel(monthYear: string) {
  const [y, m] = monthYear.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function proposalUrl(repo: string, kind: string, number: number) {
  if (kind === 'ERC' || repo.toLowerCase().includes('erc')) return `/erc/${number}`;
  if (kind === 'RIP' || repo.toLowerCase().includes('rip')) return `/rip/${number}`;
  return `/eip/${number}`;
}

function githubProposalUrl(kind: string, number: number) {
  const k = kind.toUpperCase();
  if (k === 'ERC') {
    return `https://github.com/ethereum/ERCs/blob/master/ERCS/erc-${number}.md`;
  }
  if (k === 'RIP') {
    return `https://github.com/ethereum/RIPs/blob/master/RIPS/rip-${number}.md`;
  }
  return `https://github.com/ethereum/EIPs/blob/master/EIPS/eip-${number}.md`;
}

function githubRepoLabel(repo: string, kind: string) {
  const repoLower = repo.toLowerCase();
  const kindUpper = kind.toUpperCase();
  if (kindUpper === 'RIP' || repoLower.includes('/rips')) return '/RIPs';
  if (kindUpper === 'ERC' || repoLower.includes('/ercs')) return '/ERCs';
  return '/EIPs';
}

function peopleUrl(actor: string) {
  return `/people/${encodeURIComponent(actor)}`;
}

function extractGithubUsername(author: string): string | null {
  const raw = author.trim();
  if (!raw) return null;

  // github.com/<username>
  const githubUrl = raw.match(/github\.com\/([A-Za-z0-9-]{1,39})/i);
  if (githubUrl?.[1]) return githubUrl[1];

  // @<username>
  const atHandle = raw.match(/@([A-Za-z0-9-]{1,39})/);
  if (atHandle?.[1]) return atHandle[1];

  // (<username>) pattern, common in author fields
  const paren = raw.match(/\(([A-Za-z0-9-]{1,39})\)/);
  if (paren?.[1]) return paren[1];

  return null;
}

function parseAuthorTokens(author: string): Array<{ label: string; username: string | null }> {
  return author
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((label) => ({ label, username: extractGithubUsername(label) }));
}

function editorAvatar(actor: string) {
  return `https://avatars.githubusercontent.com/${encodeURIComponent(actor)}?s=96&d=identicon`;
}

export default function EIPsHomePage() {
  const [dimension, setDimension] = useState<Dimension>('status');
  const [sortBy, setSortBy] = useState<SortBy>('updated_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [activeBucket, setActiveBucket] = useState<string | null>(null);
  const [columnSearch, setColumnSearch] = useState<ColumnSearch>({
    github: '',
    eip: '',
    title: '',
    author: '',
    type: '',
    status: '',
    category: '',
    updatedAt: '',
  });

  const [distribution, setDistribution] = useState<Array<{ bucket: string; count: number }>>([]);
  const [faqCategoryBreakdown, setFaqCategoryBreakdown] = useState<Array<{ category: string; count: number }>>([]);
  const [faqStatusDist, setFaqStatusDist] = useState<Array<{ status: string; count: number }>>([]);
  const [tableData, setTableData] = useState<{
    total: number;
      totalPages: number;
      rows: Array<{
        number: number;
        title: string | null;
        author: string | null;
        type: string;
        status: string;
        category: string;
        repo: string;
        kind: string;
        updatedAt: string;
    }>;
  } | null>(null);
  const [febDelta, setFebDelta] = useState<Array<{ status: string; count: number }>>([]);
  const [febEditors, setFebEditors] = useState<Array<{ actor: string; totalActions: number; prsTouched: number }>>([]);
  const [recentChanges, setRecentChanges] = useState<Array<{
    eip: string;
    eip_type: string;
    title: string;
    from: string;
    to: string;
    days: number;
    changed_at: Date;
  }> | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadingLeaderboard, setDownloadingLeaderboard] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [dimension, activeBucket, sortBy, sortDir, columnSearch]);

  useEffect(() => {
    setActiveBucket(null);
  }, [dimension]);

  useEffect(() => {
    (async () => {
      try {
        const [categoryRes, statusRes] = await Promise.all([
          client.standards.getCategoryBreakdown({}),
          client.standards.getStatusDistribution({}),
        ]);

        const statusMap = new Map<string, number>();
        statusRes.forEach((r: { status: string; count: number }) => {
          statusMap.set(r.status, (statusMap.get(r.status) || 0) + r.count);
        });

        setFaqCategoryBreakdown(categoryRes);
        setFaqStatusDist(Array.from(statusMap.entries()).map(([status, count]) => ({ status, count })));
      } catch (err) {
        console.error('Failed to load FAQ reference data:', err);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [distRes, tableRes, deltaRes, editorRes, recentRes] = await Promise.all([
          client.standards.getUnifiedDistribution({ dimension }),
          client.standards.getUnifiedProposals({
            page,
            pageSize: 10,
            sortBy,
            sortDir,
            dimension,
            bucket: activeBucket ?? undefined,
            columnSearch: {
              github: columnSearch.github || undefined,
              eip: columnSearch.eip || undefined,
              title: columnSearch.title || undefined,
              author: columnSearch.author || undefined,
              type: columnSearch.type || undefined,
              status: columnSearch.status || undefined,
              category: columnSearch.category || undefined,
              updatedAt: columnSearch.updatedAt || undefined,
            },
          }),
          client.standards.getMonthlyDelta({ monthYear: FEB_2026 }),
          client.analytics.getMonthlyEditorLeaderboard({ monthYear: FEB_2026, limit: 10 }),
          client.analytics.getRecentChanges({ limit: 8 }),
        ]);

        setDistribution(distRes);
        setTableData({ total: tableRes.total, totalPages: tableRes.totalPages, rows: tableRes.rows });
        setFebDelta(deltaRes);
        setFebEditors(editorRes);
        setRecentChanges(recentRes as typeof recentChanges);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [dimension, page, sortBy, sortDir, activeBucket, columnSearch]);

  const totalCount = useMemo(
    () => distribution.reduce((acc, row) => acc + row.count, 0),
    [distribution]
  );

  const maxCardCount = useMemo(
    () => Math.max(1, ...distribution.map((d) => d.count)),
    [distribution]
  );

  const maxInsight = useMemo(
    () => Math.max(1, ...febDelta.map((d) => d.count)),
    [febDelta]
  );

  const maxEditor = useMemo(
    () => Math.max(1, ...febEditors.map((e) => e.prsTouched)),
    [febEditors]
  );

  const toggleSort = (field: SortBy) => {
    if (sortBy === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortBy(field);
    setSortDir('desc');
  };

  const handleColumnSearch = (key: keyof ColumnSearch, value: string) => {
    setColumnSearch((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setActiveBucket(null);
    setColumnSearch({
      github: '',
      eip: '',
      title: '',
      author: '',
      type: '',
      status: '',
      category: '',
      updatedAt: '',
    });
  };

  const downloadDetailedCSV = async () => {
    try {
      setDownloading(true);
      const res = await client.standards.exportUnifiedDetailedCSV({
        dimension,
        bucket: activeBucket ?? undefined,
        search: undefined,
      });

      const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export CSV:', err);
    } finally {
      setDownloading(false);
    }
  };

  const downloadLeaderboardDetailedCSV = async () => {
    try {
      setDownloadingLeaderboard(true);
      const res = await client.analytics.exportMonthlyEditorLeaderboardDetailedCSV({
        monthYear: FEB_2026,
        limit: 10,
      });
      const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export editor leaderboard CSV:', err);
    } finally {
      setDownloadingLeaderboard(false);
    }
  };

  return (
    <div className="w-full px-4 py-8 sm:px-6 lg:px-8 xl:px-12">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-6">
        <EIPsPageHeader />
      </motion.div>

      <hr className="mb-6 border-slate-200 dark:border-slate-800/50" />

      <div className="mb-4 flex items-center justify-start">
        <motion.div
          layout
          className="inline-flex items-center rounded-xl border border-slate-300/70 bg-white/85 p-1 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/60"
        >
          <button
            onClick={() => setDimension('status')}
            className={`relative inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${dimension === 'status' ? 'text-cyan-700 dark:text-cyan-200' : 'text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
          >
            <Activity className="h-4 w-4" /> Status
            {dimension === 'status' && (
              <motion.span
                layoutId="dimension-pill"
                className="absolute inset-0 -z-10 rounded-lg bg-cyan-500/15 ring-1 ring-cyan-400/40"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </button>
          <button
            onClick={() => setDimension('category')}
            className={`relative inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${dimension === 'category' ? 'text-cyan-700 dark:text-cyan-200' : 'text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
          >
            <Layers className="h-4 w-4" /> Category
            {dimension === 'category' && (
              <motion.span
                layoutId="dimension-pill"
                className="absolute inset-0 -z-10 rounded-lg bg-cyan-500/15 ring-1 ring-cyan-400/40"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </button>
          <button
            onClick={() => setDimension('repo')}
            className={`relative inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${dimension === 'repo' ? 'text-cyan-700 dark:text-cyan-200' : 'text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
          >
            <GitBranch className="h-4 w-4" /> Repo
            {dimension === 'repo' && (
              <motion.span
                layoutId="dimension-pill"
                className="absolute inset-0 -z-10 rounded-lg bg-cyan-500/15 ring-1 ring-cyan-400/40"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        </motion.div>
      </div>

      <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <motion.button
          whileHover={{ y: -1 }}
          onClick={() => setActiveBucket(null)}
          className={`rounded-lg border px-3 py-2.5 text-left transition ${activeBucket === null ? 'border-cyan-400/60 bg-cyan-500/12 shadow-[0_0_0_1px_rgba(34,211,238,0.16)]' : 'border-slate-200/80 bg-white/85 hover:border-slate-300 dark:border-slate-700/50 dark:bg-slate-900/55 dark:hover:border-slate-600'}`}
        >
          <div className="mb-1.5 inline-flex h-7 w-7 items-center justify-center rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-300">
            <Layers className="h-3.5 w-3.5" />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total</p>
          <p className="mt-0.5 text-xl font-semibold leading-none text-slate-900 dark:text-slate-100">{totalCount.toLocaleString()}</p>
        </motion.button>

        {distribution.map((row) => {
          const pct = totalCount > 0 ? Math.round((row.count / totalCount) * 100) : 0;
          const selected = activeBucket === row.bucket;
          const barColor = STATUS_COLORS[row.bucket] || 'bg-cyan-500';
          const StatusIcon = statusIconMap[row.bucket] ?? Layers;
          const CategoryIcon = categoryIconMap[row.bucket] ?? Layers;
          const RepoIcon = repoIconMap[row.bucket] ?? Layers;
          const Icon = dimension === 'status' ? StatusIcon : dimension === 'category' ? CategoryIcon : RepoIcon;

          return (
            <motion.button
              key={row.bucket}
              whileHover={{ y: -1 }}
              onClick={() => setActiveBucket((prev) => (prev === row.bucket ? null : row.bucket))}
              className={`rounded-lg border px-3 py-2.5 text-left transition ${selected ? 'border-cyan-400/60 bg-cyan-500/12 shadow-[0_0_0_1px_rgba(34,211,238,0.16)]' : 'border-slate-200/80 bg-white/85 hover:border-slate-300 dark:border-slate-700/50 dark:bg-slate-900/55 dark:hover:border-slate-600'}`}
            >
              <div className="mb-1.5 inline-flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="mb-0.5 flex items-center justify-between gap-2">
                <p className="truncate text-[15px] font-medium leading-tight text-slate-900 dark:text-slate-100">{row.bucket}</p>
                <span className="text-[11px] text-slate-500">{pct}%</span>
              </div>
              <p className="text-2xl font-semibold leading-none tracking-tight text-slate-900 dark:text-slate-100">{row.count.toLocaleString()}</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200/90 dark:bg-slate-800">
                <div className={`h-full ${barColor}`} style={{ width: `${Math.max(8, (row.count / maxCardCount) * 100)}%` }} />
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="mb-6 overflow-hidden rounded-xl border border-slate-200/80 bg-white/90 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/55">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-600 dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-400">
                {[
                  ['github', 'GitHub'],
                  ['eip', 'EIP'],
                  ['title', 'Title'],
                  ['author', 'Author'],
                  ['type', 'Type'],
                  ['category', 'Category'],
                  ['status', 'Status'],
                ].map(([key, label]) => (
                  <th key={key} className="px-2 py-2">
                    <button onClick={() => toggleSort(key as SortBy)} className="inline-flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200">
                      {label}
                      {sortBy === key ? (sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3" />}
                    </button>
                  </th>
                ))}
              </tr>
              <tr className="border-b border-slate-200/70 bg-slate-50/70 dark:border-slate-700/50 dark:bg-slate-900/50">
                <th className="px-2 py-2"><input value={columnSearch.github} onChange={(e) => handleColumnSearch('github', e.target.value)} placeholder="/EIPs" className="h-8 w-full rounded-md border border-slate-300/70 bg-white px-2 text-xs text-slate-700 outline-none focus:border-cyan-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" /></th>
                <th className="px-2 py-2"><input value={columnSearch.eip} onChange={(e) => handleColumnSearch('eip', e.target.value)} placeholder="EIP-1559 / 1559" className="h-8 w-full rounded-md border border-slate-300/70 bg-white px-2 text-xs text-slate-700 outline-none focus:border-cyan-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" /></th>
                <th className="px-2 py-2"><input value={columnSearch.title} onChange={(e) => handleColumnSearch('title', e.target.value)} placeholder="Title" className="h-8 w-full rounded-md border border-slate-300/70 bg-white px-2 text-xs text-slate-700 outline-none focus:border-cyan-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" /></th>
                <th className="px-2 py-2"><input value={columnSearch.author} onChange={(e) => handleColumnSearch('author', e.target.value)} placeholder="Author" className="h-8 w-full rounded-md border border-slate-300/70 bg-white px-2 text-xs text-slate-700 outline-none focus:border-cyan-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" /></th>
                <th className="px-2 py-2"><input value={columnSearch.type} onChange={(e) => handleColumnSearch('type', e.target.value)} placeholder="Type" className="h-8 w-full rounded-md border border-slate-300/70 bg-white px-2 text-xs text-slate-700 outline-none focus:border-cyan-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" /></th>
                <th className="px-2 py-2"><input value={columnSearch.category} onChange={(e) => handleColumnSearch('category', e.target.value)} placeholder="Category" className="h-8 w-full rounded-md border border-slate-300/70 bg-white px-2 text-xs text-slate-700 outline-none focus:border-cyan-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" /></th>
                <th className="px-2 py-2"><input value={columnSearch.status} onChange={(e) => handleColumnSearch('status', e.target.value)} placeholder="Status" className="h-8 w-full rounded-md border border-slate-300/70 bg-white px-2 text-xs text-slate-700 outline-none focus:border-cyan-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" /></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                    <td colSpan={7} className="px-2 py-3">
                      <div className="h-5 animate-pulse rounded bg-slate-200 dark:bg-slate-800/70" />
                    </td>
                  </tr>
                ))
              ) : (
                (tableData?.rows || []).map((row) => (
                  <tr key={`${row.repo}-${row.kind}-${row.number}`} className="border-b border-slate-100 text-slate-700 hover:bg-slate-50/80 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900/60">
                    <td className="px-2 py-2">
                      <a
                        href={githubProposalUrl(row.kind, row.number)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-700 hover:underline dark:text-cyan-300"
                      >
                        {githubRepoLabel(row.repo, row.kind)}
                      </a>
                    </td>
                    <td className="px-2 py-2 font-medium text-cyan-700 dark:text-cyan-300">
                      <Link href={proposalUrl(row.repo, row.kind, row.number)} className="hover:underline">{row.kind}-{row.number}</Link>
                    </td>
                    <td className="max-w-[420px] px-2 py-2 text-slate-900 dark:text-slate-100">{row.title || `${row.kind}-${row.number}`}</td>
                    <td className="px-2 py-2 text-slate-600 dark:text-slate-300">
                      {(() => {
                        const author = row.author?.trim() || '';
                        if (!author) return '-';
                        const tokens = parseAuthorTokens(author);
                        return (
                          <>
                            {tokens.map((token, idx) => (
                              <React.Fragment key={`${token.label}-${idx}`}>
                                {idx > 0 ? ', ' : ''}
                                {token.username ? (
                                  <Link href={peopleUrl(token.username)} className="text-cyan-700 hover:underline dark:text-cyan-300">
                                    {token.label}
                                  </Link>
                                ) : (
                                  token.label
                                )}
                              </React.Fragment>
                            ))}
                          </>
                        );
                      })()}
                    </td>
                    <td className="px-2 py-2 text-slate-600 dark:text-slate-300">{row.type || '-'}</td>
                    <td className="px-2 py-2">{row.category}</td>
                    <td className="px-2 py-2"><span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] ${BADGE_COLORS[row.status] || BADGE_COLORS.Unknown}`}>{row.status}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:border-slate-700/50 dark:bg-slate-900/70 dark:text-slate-400">
          <span>{tableData?.total.toLocaleString() || 0} results</span>
          <div className="flex items-center gap-2">
            <button
              onClick={clearFilters}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              Reset Filters
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900"
            >
              Prev
            </button>
            <span>Page {page} / {tableData?.totalPages || 1}</span>
            <button
              onClick={() => setPage((p) => Math.min(tableData?.totalPages || 1, p + 1))}
              disabled={page >= (tableData?.totalPages || 1)}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200/80 bg-white/90 p-4 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/55">
          <div className="mb-3 flex items-center justify-between">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <Activity className="h-4 w-4 text-cyan-500 dark:text-cyan-300" />
              {monthLabel(FEB_2026)} Insight (Status Changes)
            </div>
            <button
              onClick={downloadDetailedCSV}
              disabled={downloading}
              className="inline-flex items-center gap-1 rounded-md border border-emerald-400/40 bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300 disabled:opacity-60"
            >
              <Download className="h-3.5 w-3.5" /> {downloading ? 'Exporting...' : 'Detailed CSV'}
            </button>
          </div>

          <div className="space-y-2">
            {febDelta.map((row) => (
              <div key={row.status} className="rounded-lg bg-slate-50 p-2.5 ring-1 ring-slate-200/80 dark:bg-slate-900/60 dark:ring-slate-700/50">
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-slate-900 dark:text-slate-100">{row.status}</span>
                  <span className="font-semibold text-cyan-700 dark:text-cyan-300">{row.count}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div className={`h-full ${STATUS_COLORS[row.status] || 'bg-cyan-500'}`} style={{ width: `${Math.max(8, (row.count / maxInsight) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white/90 p-4 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/55">
          <div className="mb-3 flex items-center justify-between">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <Trophy className="h-4 w-4 text-emerald-500 dark:text-emerald-300" />
              Editor Leaderboard ({monthLabel(FEB_2026)})
            </div>
            <button
              onClick={downloadLeaderboardDetailedCSV}
              disabled={downloadingLeaderboard}
              className="inline-flex items-center gap-1 rounded-md border border-emerald-400/40 bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300 disabled:opacity-60"
            >
              <Download className="h-3.5 w-3.5" /> {downloadingLeaderboard ? 'Exporting...' : 'Detailed CSV'}
            </button>
          </div>

          <div className="space-y-2">
            {febEditors.map((row, idx) => (
              <div key={row.actor} className={`rounded-lg p-2.5 ring-1 ${idx === 0 ? 'bg-amber-50 ring-amber-300/60 dark:bg-amber-500/10 dark:ring-amber-400/30' : 'bg-slate-50 ring-slate-200/80 dark:bg-slate-900/60 dark:ring-slate-700/50'}`}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="h-8 w-8 overflow-hidden rounded-full ring-1 ring-slate-300/80 dark:ring-slate-700/60">
                      <Image src={editorAvatar(row.actor)} alt={row.actor} width={32} height={32} className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">#{idx + 1} {row.actor}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{row.totalActions} actions across {row.prsTouched} PRs</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{row.prsTouched}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div className="h-full bg-emerald-500" style={{ width: `${Math.max(8, (row.prsTouched / maxEditor) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <hr className="my-6 border-slate-200 dark:border-slate-800/50" />

      <section className="mb-6 rounded-xl border border-slate-200/80 bg-white/90 p-4 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/55">
        <div className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <TrendingUp className="h-4 w-4 text-cyan-500 dark:text-cyan-300" />
          Recent Governance Activity
        </div>
        {!recentChanges ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-5 animate-pulse rounded bg-slate-200 dark:bg-slate-800/70" />)}
          </div>
        ) : recentChanges.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-400">No recent status changes.</p>
        ) : (
          <div className="space-y-2">
            {recentChanges.map((change) => (
              <div key={`${change.eip_type}-${change.eip}-${change.changed_at}`} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-900/60">
                <span className={`h-2 w-2 rounded-full ${STATUS_COLORS[change.to] || 'bg-cyan-500'}`} />
                <Link href={`/${change.eip_type === 'RIP' ? 'rip' : change.eip_type === 'ERC' ? 'erc' : 'eip'}/${change.eip}`} className="text-sm font-semibold text-cyan-700 hover:underline dark:text-cyan-300">
                  {change.eip_type}-{change.eip}
                </Link>
                <span className="text-sm text-slate-600 dark:text-slate-400">{change.from ? `${change.from} -> ${change.to}` : `to ${change.to}`}</span>
                <span className="ml-auto text-xs tabular-nums text-slate-500 dark:text-slate-400">{change.days === 0 ? 'today' : `${change.days}d ago`}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <hr className="my-6 border-slate-200 dark:border-slate-800/50" />

      <section className="mb-6">
        <SocialCommunityUpdates />
      </section>

      <hr className="my-6 border-slate-200 dark:border-slate-800/50" />

      <section>
        <HomeFAQs categoryBreakdown={faqCategoryBreakdown} statusDist={faqStatusDist} />
      </section>
    </div>
  );
}
