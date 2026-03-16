"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useAnalytics, useAnalyticsExport } from "../analytics-layout-client";
import { client } from "@/lib/orpc";
import { Loader2, UserCheck, Clock, FileText, Download, AlertCircle } from "lucide-react";
import { AnalyticsAnnotation } from "@/components/analytics/AnalyticsAnnotation";
import ReactECharts from "echarts-for-react";
import { LastUpdated } from "@/components/analytics/LastUpdated";

interface EditorLeaderboardRow {
  actor: string;
  totalActions: number;
  prsTouched: number;
  reviews: number;
  comments: number;
  medianResponseDays: number | null;
  updatedAt?: string | null;
}

interface CategoryCoverage {
  category: string;
  actors: string[];
}

interface RepoDistribution {
  actor: string;
  repo: string;
  count: number;
  pct: number;
}

interface MonthlyTrendPoint {
  month: string;
  [actor: string]: string | number;
}

interface DailyActivityData {
  date: string;
  count: number;
}

const categoryColors: Record<string, string> = {
  core: "#34d399",
  erc: "#60a5fa",
  networking: "#a78bfa",
  interface: "#f472b6",
  meta: "#fbbf24",
  informational: "#94a3b8",
  governance: "#ef4444",
};

const repoColors: Record<string, string> = {
  "ethereum/EIPs": "#22d3ee",
  "ethereum/ERCs": "#60a5fa",
  "ethereum/RIPs": "#94a3b8",
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const OFFICIAL_EDITOR_HANDLES = [
  "axic",
  "Pandapip1",
  "gcolvin",
  "lightclient",
  "SamWilsn",
  "xinbenlv",
  "nconsigny",
  "yoavw",
  "CarlBeek",
  "adietrichs",
  "jochem-brouwer",
  "abcoathup",
];

function getGitHubAvatarUrl(handle: string): string {
  return `https://github.com/${handle}.png?size=80`;
}

function getTimeWindow(timeRange: string): { from: string | undefined; to: string | undefined } {
  const now = new Date();
  const to = now.toISOString().split('T')[0];
  
  if (timeRange === "all") {
    return { from: undefined, to: undefined };
  }

  let from: Date;
  switch (timeRange) {
    case "this_month":
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "7d":
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "90d":
      from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case "1y":
      from = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      from = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  
  return { from: from.toISOString().split('T')[0], to };
}

function getMonthWindow(year: number, month: number): { from: string; to: string } {
  const from = new Date(Date.UTC(year, month - 1, 1));
  const to = new Date(Date.UTC(year, month, 0));
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}

export default function EditorsAnalyticsPage() {
  const { timeRange, repoFilter } = useAnalytics();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataUpdatedAt, setDataUpdatedAt] = useState<Date>(new Date());
  
  const [leaderboard, setLeaderboard] = useState<EditorLeaderboardRow[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrendPoint[]>([]);
  const [categoryCoverage, setCategoryCoverage] = useState<CategoryCoverage[]>([]);
  const [repoDistribution, setRepoDistribution] = useState<RepoDistribution[]>([]);
  const [dailyActivity, setDailyActivity] = useState<DailyActivityData[]>([]);
  const [membershipTier, setMembershipTier] = useState<string>('free');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [leaderboardMode, setLeaderboardMode] = useState<"all" | "monthly" | "range">("all");
  const [leaderboardYear, setLeaderboardYear] = useState<number>(() => new Date().getUTCFullYear());
  const [leaderboardMonth, setLeaderboardMonth] = useState<number>(() => new Date().getUTCMonth() + 1);
  const [downloadingEditor, setDownloadingEditor] = useState<string | null>(null);

  const repoParam = repoFilter === "all" ? undefined : repoFilter;
  const { from, to } = getTimeWindow(timeRange);
  const [exporting, setExporting] = useState(false);
  const isPaidMember = membershipTier !== 'free';
  const leaderboardWindow = useMemo(
    () => (
      leaderboardMode === "monthly"
        ? getMonthWindow(leaderboardYear, leaderboardMonth)
        : leaderboardMode === "range"
          ? { from, to }
          : { from: undefined, to: undefined }
    ),
    [leaderboardMode, leaderboardYear, leaderboardMonth, from, to]
  );
  const leaderboardLabel = useMemo(() => {
    if (leaderboardMode === "all") {
      return "All-Time Activity";
    }
    if (leaderboardMode === "monthly") {
      return `${MONTH_NAMES[leaderboardMonth - 1]} ${leaderboardYear}`;
    }
    if (!leaderboardWindow.from && !leaderboardWindow.to) return "All-Time Contributions";
    return "Selected Dashboard Range";
  }, [leaderboardMode, leaderboardMonth, leaderboardYear, leaderboardWindow.from, leaderboardWindow.to]);
  const currentYear = new Date().getUTCFullYear();
  const yearOptions = useMemo(() => {
    return Array.from({ length: 8 }, (_, idx) => currentYear - idx);
  }, [currentYear]);

  const downloadLeaderboardCSV = useCallback(async () => {
    if (!isPaidMember) {
      setShowUpgradeModal(true);
      return;
    }

    setExporting(true);
    try {
      const exportResult = leaderboardMode === "monthly"
        ? await client.analytics.exportMonthlyEditorLeaderboardDetailedCSV({
            repo: repoParam,
            monthYear: `${leaderboardYear}-${String(leaderboardMonth).padStart(2, "0")}`,
            limit: 30,
          })
        : await client.analytics.getEditorsLeaderboardExport({
            repo: repoParam,
            from,
            to,
          });
      const { csv, filename } = exportResult;
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CSV export failed:", err);
      setError("CSV export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  }, [repoParam, from, to, isPaidMember, leaderboardMode, leaderboardMonth, leaderboardYear]);

  const downloadEditorReport = useCallback(async (actor: string) => {
    if (!isPaidMember) {
      setShowUpgradeModal(true);
      return;
    }
    setDownloadingEditor(actor);
    try {
      const exportResult = leaderboardMode === "monthly"
        ? await client.analytics.exportMonthlyEditorLeaderboardDetailedCSV({
            repo: repoParam,
            monthYear: `${leaderboardYear}-${String(leaderboardMonth).padStart(2, "0")}`,
            limit: 30,
            actor,
          })
        : await client.analytics.getEditorsLeaderboardExport({
            repo: repoParam,
            from,
            to,
            actor,
          });

      const { csv, filename } = exportResult;
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Per-editor export failed:", err);
      setError(`Failed to export report for ${actor}. Please try again.`);
    } finally {
      setDownloadingEditor(null);
    }
  }, [from, isPaidMember, leaderboardMode, leaderboardMonth, leaderboardYear, repoParam, to]);

  // Fetch membership tier on mount
  useEffect(() => {
    fetch('/api/stripe/subscription')
      .then(res => res.json())
      .then(data => setMembershipTier(data?.tier || 'free'))
      .catch(() => setMembershipTier('free'));
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const months = timeRange === "7d" ? 3 : timeRange === "this_month" || timeRange === "30d" ? 6 : timeRange === "90d" ? 12 : 24;
        
        const [leaderboardData, trendData, categoryData, repoData, dailyActivityData] = await Promise.all([
          leaderboardMode === "monthly"
            ? client.analytics.getMonthlyEditorLeaderboard({
                repo: repoParam,
                monthYear: `${leaderboardYear}-${String(leaderboardMonth).padStart(2, "0")}`,
                limit: 30,
              }).then((res) => ({
                rows: res.items.map((item) => ({
                  actor: item.actor,
                  totalActions: item.totalActions,
                  prsTouched: item.prsTouched,
                  reviews: 0,
                  comments: 0,
                  medianResponseDays: null,
                  updatedAt: res.updatedAt,
                })),
                updatedAt: res.updatedAt,
              }))
            : client.analytics.getEditorsLeaderboard({
                repo: repoParam,
                from: leaderboardWindow.from,
                to: leaderboardWindow.to,
                limit: 30,
              }).then((rows) => ({
                rows,
                updatedAt: rows
                  .map((row) => row.updatedAt)
                  .filter((value): value is string => Boolean(value))
                  .sort()
                  .at(-1) ?? null,
              })),
          client.analytics.getEditorsMonthlyTrend({
            repo: repoParam,
            months,
          }),
          client.analytics.getEditorsByCategory({
            repo: repoParam,
          }),
          client.analytics.getEditorsRepoDistribution({
            repo: repoParam,
            from,
            to,
          }),
          client.analytics.getEditorDailyActivity({
            repo: repoParam,
            from,
            to,
          }),
        ]);

        setLeaderboard(leaderboardData.rows);
        setMonthlyTrend(trendData);
        setCategoryCoverage(categoryData);
        setRepoDistribution(repoData);
        setDailyActivity(dailyActivityData);
        if (leaderboardData.updatedAt) {
          setDataUpdatedAt(new Date(leaderboardData.updatedAt));
        } else if (dailyActivityData.length > 0) {
          setDataUpdatedAt(new Date(`${dailyActivityData[dailyActivityData.length - 1]!.date}T00:00:00.000Z`));
        } else {
          setDataUpdatedAt(new Date());
        }
      } catch (error) {
        console.error("Failed to fetch editors analytics:", error);
        setError("Failed to load editor analytics. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange, repoFilter, repoParam, from, to, leaderboardWindow.from, leaderboardWindow.to, leaderboardMode, leaderboardMonth, leaderboardYear]);

  // Aggregate repo distribution into cards
  const repoCards = useMemo(() => {
    const totals: Record<string, number> = {};
    repoDistribution.forEach(r => {
      const repoName = r.repo.split('/')[1] || r.repo;
      totals[repoName] = (totals[repoName] || 0) + r.count;
    });
    const total = Object.values(totals).reduce((s, v) => s + v, 0);
    return [
      { name: "EIPs", count: totals["EIPs"] || 0, pct: total > 0 ? ((totals["EIPs"] || 0) / total) * 100 : 0, color: repoColors["ethereum/EIPs"] },
      { name: "ERCs", count: totals["ERCs"] || 0, pct: total > 0 ? ((totals["ERCs"] || 0) / total) * 100 : 0, color: repoColors["ethereum/ERCs"] },
      { name: "RIPs", count: totals["RIPs"] || 0, pct: total > 0 ? ((totals["RIPs"] || 0) / total) * 100 : 0, color: repoColors["ethereum/RIPs"] },
    ];
  }, [repoDistribution]);

  // Prepare category coverage for stacked bars
  const categoryData = useMemo(() => {
    const categories = categoryCoverage.map(c => c.category);
    const allActors = new Set<string>();
    categoryCoverage.forEach(c => c.actors.forEach(a => allActors.add(a)));
    
    return categories.map(category => {
      const coverage = categoryCoverage.find(c => c.category === category);
      return {
        category: category.charAt(0).toUpperCase() + category.slice(1),
        count: coverage?.actors.length || 0,
        actors: coverage?.actors || [],
      };
    }).filter(c => c.count > 0);
  }, [categoryCoverage]);

  const categoriesByActor = useMemo(() => {
    const map: Record<string, string[]> = {};
    OFFICIAL_EDITOR_HANDLES.forEach((actor) => {
      map[actor] = [];
    });
    categoryCoverage.forEach((entry) => {
      entry.actors.forEach((actor) => {
        if (!map[actor]) map[actor] = [];
        map[actor].push(entry.category.charAt(0).toUpperCase() + entry.category.slice(1));
      });
    });
    return map;
  }, [categoryCoverage]);

  const reposByActor = useMemo(() => {
    const map: Record<string, string[]> = {};
    repoDistribution.forEach((row) => {
      const repoName = row.repo.split("/")[1] || row.repo;
      if (!map[row.actor]) map[row.actor] = [];
      if (!map[row.actor]!.includes(repoName)) map[row.actor]!.push(repoName);
    });
    return map;
  }, [repoDistribution]);

  const topEditorCards = useMemo(
    () => leaderboard.filter((e) => e.totalActions > 0).slice(0, 6),
    [leaderboard],
  );

  // Get unique actors from monthly trend for legend
  const trendActors = useMemo(() => {
    if (monthlyTrend.length === 0) return [];
    const actors = new Set<string>();
    monthlyTrend.forEach(point => {
      Object.keys(point).forEach(key => {
        if (key !== 'month' && typeof point[key] === 'number') {
          actors.add(key);
        }
      });
    });
    return Array.from(actors).slice(0, 8); // Limit to 8 for readability
  }, [monthlyTrend]);

  const totalActions = useMemo(() => leaderboard.reduce((sum, e) => sum + e.totalActions, 0), [leaderboard]);
  const activeEditors = useMemo(() => leaderboard.filter((e) => e.totalActions > 0).length, [leaderboard]);
  const inactiveEditors = OFFICIAL_EDITOR_HANDLES.length - activeEditors;
  const avgResponseDays = useMemo(() => {
    const medians = leaderboard.map(e => e.medianResponseDays).filter((d): d is number => d !== null);
    if (medians.length === 0) return null;
    return medians.reduce((a, b) => a + b, 0) / medians.length;
  }, [leaderboard]);

  const concentrationTop3Pct = useMemo(() => {
    if (totalActions === 0) return 0;
    const top3 = [...leaderboard]
      .sort((a, b) => b.totalActions - a.totalActions)
      .slice(0, 3)
      .reduce((sum, row) => sum + row.totalActions, 0);
    return (top3 / totalActions) * 100;
  }, [leaderboard, totalActions]);

  const thinCoverageCategories = useMemo(
    () => categoryData.filter((entry) => entry.count <= 1).map((entry) => entry.category),
    [categoryData],
  );

  const inactiveEditorList = useMemo(
    () => leaderboard.filter((row) => row.totalActions === 0).map((row) => row.actor),
    [leaderboard],
  );

  const trendOption = useMemo(() => ({
    backgroundColor: "transparent",
    tooltip: { trigger: "axis" },
    legend: {
      top: 0,
      textStyle: { color: "var(--muted-foreground)", fontSize: 11 },
      type: "scroll",
    },
    grid: { top: 36, left: 28, right: 20, bottom: 28 },
    xAxis: {
      type: "category",
      data: monthlyTrend.map((m) => m.month),
      axisLabel: { color: "var(--muted-foreground)", fontSize: 11 },
      axisLine: { lineStyle: { color: "rgba(148,163,184,0.25)" } },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "var(--muted-foreground)", fontSize: 11 },
      splitLine: { lineStyle: { color: "rgba(148,163,184,0.15)", type: "dashed" } },
    },
    series: trendActors.map((actor, idx) => ({
      name: actor,
      type: "line",
      smooth: true,
      symbol: "none",
      lineStyle: { width: 2, color: `hsl(${(idx * 360) / Math.max(trendActors.length, 1)}, 70%, 55%)` },
      data: monthlyTrend.map((p) => Number(p[actor] || 0)),
    })),
  }), [monthlyTrend, trendActors]);

  const categoryOption = useMemo(() => ({
    backgroundColor: "transparent",
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    grid: { top: 16, left: 90, right: 18, bottom: 24 },
    xAxis: {
      type: "value",
      axisLabel: { color: "var(--muted-foreground)", fontSize: 11 },
      splitLine: { lineStyle: { color: "rgba(148,163,184,0.15)", type: "dashed" } },
    },
    yAxis: {
      type: "category",
      data: categoryData.map((c) => c.category),
      axisLabel: { color: "var(--muted-foreground)", fontSize: 11 },
      axisLine: { lineStyle: { color: "rgba(148,163,184,0.25)" } },
    },
    series: [
      {
        type: "bar",
        data: categoryData.map((entry) => ({
          value: entry.count,
          itemStyle: { color: categoryColors[entry.category.toLowerCase()] || "#94a3b8", borderRadius: [0, 8, 8, 0] },
        })),
      },
    ],
  }), [categoryData]);

  const coverageMatrixOption = useMemo(() => {
    const categories = categoryData.map((c) => c.category);
    const editors = OFFICIAL_EDITOR_HANDLES;
    const points: [number, number, number][] = [];
    editors.forEach((editor, rowIndex) => {
      categories.forEach((category, colIndex) => {
        const isCovered = (categoriesByActor[editor] || []).includes(category) ? 1 : 0;
        points.push([colIndex, rowIndex, isCovered]);
      });
    });

    return {
      backgroundColor: "transparent",
      tooltip: {
        formatter: (params: { data: [number, number, number] }) => {
          const [x, y, value] = params.data;
          return `${editors[y]} × ${categories[x]}: ${value ? "Covered" : "Not covered"}`;
        },
      },
      grid: { top: 12, left: 110, right: 16, bottom: 40 },
      xAxis: {
        type: "category",
        data: categories,
        axisLabel: { color: "var(--muted-foreground)", fontSize: 10, interval: 0, rotate: 20 },
        axisLine: { lineStyle: { color: "rgba(148,163,184,0.25)" } },
      },
      yAxis: {
        type: "category",
        data: editors,
        axisLabel: { color: "var(--muted-foreground)", fontSize: 10 },
        axisLine: { lineStyle: { color: "rgba(148,163,184,0.25)" } },
      },
      visualMap: {
        show: false,
        min: 0,
        max: 1,
        inRange: {
          color: ["rgba(148,163,184,0.12)", "rgba(34,211,238,0.75)"],
        },
      },
      series: [
        {
          type: "heatmap",
          data: points,
          itemStyle: {
            borderColor: "rgba(148,163,184,0.22)",
            borderWidth: 1,
            borderRadius: 4,
          },
          label: {
            show: false,
          },
        },
      ],
    };
  }, [categoriesByActor, categoryData]);

  const repoOption = useMemo(() => ({
    backgroundColor: "transparent",
    tooltip: { trigger: "item" },
    legend: {
      orient: "vertical",
      right: 8,
      top: "middle",
      textStyle: { color: "var(--muted-foreground)", fontSize: 11 },
    },
    series: [
      {
        type: "pie",
        radius: ["52%", "72%"],
        center: ["34%", "50%"],
        label: { show: false },
        data: repoCards.map((r) => ({
          name: r.name,
          value: r.count,
          itemStyle: { color: r.color },
        })),
        itemStyle: { borderColor: "rgba(2,6,23,0.4)", borderWidth: 2 },
      },
    ],
    title: [
      {
        text: repoCards.reduce((s, r) => s + r.count, 0).toLocaleString(),
        subtext: "Total",
        left: "34%",
        top: "45%",
        textAlign: "center",
        textStyle: { color: "var(--foreground)", fontSize: 28, fontWeight: 700 },
        subtextStyle: { color: "var(--muted-foreground)", fontSize: 11 },
      },
    ],
  }), [repoCards]);

  const dailyActivityOption = useMemo(() => ({
    backgroundColor: "transparent",
    tooltip: { trigger: "axis" },
    grid: { top: 18, left: 28, right: 20, bottom: 24 },
    xAxis: {
      type: "category",
      data: dailyActivity.map((item) => item.date),
      axisLabel: { color: "var(--muted-foreground)", fontSize: 10, hideOverlap: true },
      axisLine: { lineStyle: { color: "rgba(148,163,184,0.25)" } },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "var(--muted-foreground)", fontSize: 11 },
      splitLine: { lineStyle: { color: "rgba(148,163,184,0.15)", type: "dashed" } },
    },
    series: [
      {
        name: "Actions",
        type: "bar",
        barWidth: "60%",
        data: dailyActivity.map((item) => item.count),
        itemStyle: { color: "#60a5fa", borderRadius: [6, 6, 0, 0] },
      },
    ],
  }), [dailyActivity]);

  // Export functionality
  useAnalyticsExport(() => {
    const combined: Record<string, unknown>[] = [];
    
    // Leaderboard data
    leaderboard.forEach(e => {
      combined.push({
        type: 'Leaderboard',
        editor: e.actor,
        totalActions: e.totalActions,
        totalReviews: e.reviews,
        totalComments: e.comments,
        prsTouched: e.prsTouched,
        medianResponseDays: e.medianResponseDays,
      });
    });
    
    // Category coverage
    categoryCoverage.forEach(c => {
      combined.push({
        type: 'Category Coverage',
        category: c.category,
        editorCount: c.actors.length,
        editors: c.actors.join(', '),
      });
    });
    
    // Repo distribution
    repoDistribution.forEach(r => {
      combined.push({
        type: 'Repo Distribution',
        editor: r.actor,
        repo: r.repo,
        count: r.count,
        pct: r.pct,
      });
    });
    
    return combined;
  }, `editors-analytics-${repoFilter}-${timeRange}`);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Hero KPIs */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-border/70 bg-card/60 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Editors</p>
              <p className="text-3xl font-bold text-foreground">{OFFICIAL_EDITOR_HANDLES.length}</p>
            </div>
            <div className="rounded-full bg-violet-500/20 p-3">
              <UserCheck className="h-6 w-6 text-violet-400" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-card/60 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Actions</p>
              <p className="text-3xl font-bold text-foreground">{totalActions.toLocaleString()}</p>
            </div>
            <div className="rounded-full bg-blue-500/20 p-3">
              <FileText className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-card/60 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Response Time</p>
              <p className="text-3xl font-bold text-foreground">{avgResponseDays != null ? `${Math.round(avgResponseDays)}d` : "–"}</p>
            </div>
            <div className="rounded-full bg-amber-500/20 p-3">
              <Clock className="h-6 w-6 text-amber-400" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-card/60 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
            <p className="text-sm text-muted-foreground">Category Coverage</p>
              <p className="text-3xl font-bold text-foreground">{categoryData.length}</p>
            </div>
            <div className="rounded-full bg-emerald-500/20 p-3">
              <UserCheck className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/70 bg-card/60 px-4 py-3 text-sm text-foreground">
        Coverage risk: {thinCoverageCategories.length} thin categories
        <span className="mx-2 text-muted-foreground">·</span>
        Top 3 editors: {concentrationTop3Pct.toFixed(1)}% of actions
        <span className="mx-2 text-muted-foreground">·</span>
        Inactive editors: {inactiveEditorList.length}
      </div>

      <div className="rounded-xl border border-border/70 bg-card/60 p-5 backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="dec-title text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Top Active Editors</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {topEditorCards.map((editor) => {
            const categories = (categoriesByActor[editor.actor] || []).slice(0, 2);
            const repos = (reposByActor[editor.actor] || []).slice(0, 2);
            const isActive = editor.totalActions > 0;
            return (
              <div key={editor.actor} className="rounded-lg border border-border/60 bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={getGitHubAvatarUrl(editor.actor)}
                      alt={`${editor.actor} avatar`}
                      className="h-10 w-10 rounded-full border border-border object-cover"
                      loading="lazy"
                    />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{editor.actor}</p>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${isActive ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-border bg-muted/40 text-muted-foreground"}`}>
                        {isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-semibold tabular-nums text-foreground">{editor.totalActions}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">actions</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {categories.map((category) => (
                    <span key={`${editor.actor}-${category}`} className="rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-[10px] text-foreground/85">
                      {category}
                    </span>
                  ))}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {repos.map((repo) => (
                    <span key={`${editor.actor}-${repo}`} className="rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-[10px] text-muted-foreground">
                      {repo}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
          {topEditorCards.length === 0 && (
            <p className="text-sm text-muted-foreground">No active editors found in current scope.</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border/70 bg-card/60 p-6 backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">Editor Activity Over Time</h2>
        </div>
        <div className="h-72 w-full">
          <ReactECharts option={trendOption} style={{ height: "100%", width: "100%" }} opts={{ renderer: "svg" }} notMerge />
        </div>
      </div>

      <div className="rounded-xl border border-border/70 bg-card/60 p-6 backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Category Coverage</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Coverage map showing who owns which standards categories, including special roles.</p>
          </div>
        </div>
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Covered Categories</p>
            <p className="mt-1 text-xl font-semibold text-foreground tabular-nums">{categoryData.length}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Thin Coverage</p>
            <p className="mt-1 text-xl font-semibold text-foreground tabular-nums">{thinCoverageCategories.length}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Active Editors</p>
            <p className="mt-1 text-xl font-semibold text-foreground tabular-nums">{activeEditors}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Editor × Category matrix (coverage visibility and concentration risk).</p>
            <div className="mt-2 h-80 w-full rounded-lg border border-border/60 bg-background/30 p-2">
              <ReactECharts option={coverageMatrixOption} style={{ height: "100%", width: "100%" }} opts={{ renderer: "svg" }} notMerge />
            </div>
          </div>
          <div>
            <div className="h-56 w-full">
              <ReactECharts option={categoryOption} style={{ height: "100%", width: "100%" }} opts={{ renderer: "svg" }} notMerge />
            </div>
          </div>
        </div>
      </div>

      {/* Editor Directory */}
      <div className="rounded-xl border border-border/70 bg-card/60 p-5 backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-foreground">
              Editor Activity Directory
              <span className="ml-2 text-sm font-normal text-muted-foreground">— {leaderboardLabel}</span>
            </h2>
            <p className="text-xs text-muted-foreground">Official handles only. Metrics derived from normalized PR event timestamps.</p>
          </div>
          <button
            onClick={downloadLeaderboardCSV}
            disabled={exporting || leaderboard.length === 0 || !isPaidMember}
            title={!isPaidMember ? 'Upgrade to Pro to download exports' : ''}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
              !isPaidMember
                ? 'border-amber-600/30 bg-amber-500/10 text-amber-600/70 cursor-not-allowed opacity-60'
                : 'border-border/60/50 bg-muted/40 text-foreground/85 hover:bg-muted/60 hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            {!isPaidMember ? 'Export (Pro+)' : 'Download Reports'}
          </button>
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-muted/30 p-2">
          <span className="text-xs font-medium text-muted-foreground">Leaderboard scope</span>
          <select
            value={leaderboardMode}
            onChange={(e) => setLeaderboardMode(e.target.value as "all" | "monthly" | "range")}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
            aria-label="Select leaderboard scope"
          >
            <option value="all">All-time</option>
            <option value="monthly">Monthly</option>
            <option value="range">Use dashboard range</option>
          </select>
          {leaderboardMode === "monthly" && (
            <>
              <select
                value={leaderboardYear}
                onChange={(e) => setLeaderboardYear(Number(e.target.value))}
                className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
                aria-label="Select leaderboard year"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <select
                value={leaderboardMonth}
                onChange={(e) => setLeaderboardMonth(Number(e.target.value))}
                className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
                aria-label="Select leaderboard month"
              >
                {MONTH_NAMES.map((month, index) => (
                  <option key={month} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/70">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Editor</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Reviews</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">PRs Touched</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Mix</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Report</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((editor) => {
                const categories = categoriesByActor[editor.actor] || [];
                const isActive = editor.totalActions > 0;
                const reviewsPct = editor.totalActions > 0 ? (editor.reviews / editor.totalActions) * 100 : 0;
                const commentsPct = editor.totalActions > 0 ? (editor.comments / editor.totalActions) * 100 : 0;
                const otherPct = Math.max(0, 100 - reviewsPct - commentsPct);
                return (
                <tr
                  key={editor.actor}
                  className="border-b border-border/60 hover:bg-muted/40 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={getGitHubAvatarUrl(editor.actor)}
                        alt={`${editor.actor} avatar`}
                        className="h-7 w-7 rounded-full border border-border object-cover"
                        loading="lazy"
                      />
                      <div>
                        <p className="font-medium text-foreground/90">{editor.actor}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {categories.length ? categories.slice(0, 3).join(", ") : "No categories"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 uppercase tracking-wide ${isActive ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-border bg-muted/40 text-muted-foreground"}`}>
                      {isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-foreground/85">
                    {editor.totalActions.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-foreground/85">
                    {editor.reviews.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-foreground/85">
                    {editor.prsTouched.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex h-2 w-28 overflow-hidden rounded-full border border-border/50 bg-muted/30">
                      <div className="h-full bg-blue-400" style={{ width: `${reviewsPct}%` }} />
                      <div className="h-full bg-purple-400" style={{ width: `${commentsPct}%` }} />
                      <div className="h-full bg-slate-500" style={{ width: `${otherPct}%` }} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => downloadEditorReport(editor.actor)}
                      disabled={!isPaidMember || downloadingEditor === editor.actor}
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-1 text-xs text-foreground/85 hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {downloadingEditor === editor.actor ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                      Report
                    </button>
                  </td>
                </tr>
              )})}
              {leaderboard.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-sm text-muted-foreground">
                    No editor data found for the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Repo Distribution + Daily Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-border/70 bg-card/60 p-4 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">Repo Distribution</h2>
          </div>
          <div className="h-64 w-full">
            <ReactECharts option={repoOption} style={{ height: "100%", width: "100%" }} opts={{ renderer: "svg" }} notMerge />
          </div>
        </div>

        <div className="lg:col-span-2 rounded-lg border border-border/70 bg-card/60 p-4 backdrop-blur-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">Daily Editorial Activity</h2>
          </div>
          <div className="h-64 w-full">
            <ReactECharts option={dailyActivityOption} style={{ height: "100%", width: "100%" }} opts={{ renderer: "svg" }} notMerge />
          </div>
          <AnalyticsAnnotation>
            Daily editor actions across the selected time range. Higher bars indicate more editorial activity.
          </AnalyticsAnnotation>
        </div>
      </div>

      <div className="rounded-xl border border-border/70 bg-card/60 p-4 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-2">
          <details className="group">
            <summary className="cursor-pointer rounded-md border border-border bg-muted/40 px-3 py-1.5 text-xs text-foreground/85 hover:bg-muted/60">
              Methodology
            </summary>
            <div className="mt-2 max-w-3xl rounded-md border border-border/60 bg-background/50 p-3 text-xs text-muted-foreground">
              Official editor handles only. Activity uses normalized PR event timestamps with late-ingest correction.
              Median response is measured from PR creation to first editor action in selected scope.
            </div>
          </details>
          <button
            onClick={downloadLeaderboardCSV}
            disabled={exporting || leaderboard.length === 0 || !isPaidMember}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-3 py-1.5 text-xs text-foreground/85 hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {exporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
            Download current scope
          </button>
          <span className="rounded-md border border-border bg-background/60 px-2 py-1 text-xs text-muted-foreground">
            Scope: {leaderboardLabel}
          </span>
          <LastUpdated timestamp={dataUpdatedAt} prefix="Updated" showAbsolute className="bg-muted/40 text-xs" />
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border/70 rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
            <div className="flex items-start gap-3 mb-4">
              <Download className="h-6 w-6 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-foreground">Unlock CSV Export</h3>
                <p className="text-sm text-muted-foreground mt-1">Upgrade to Pro or Enterprise to download analytics data</p>
              </div>
            </div>

            <div className="bg-muted/60 rounded p-3 mb-4 text-sm text-foreground/85">
              <p className="font-medium text-foreground mb-2">Pro features include:</p>
              <ul className="space-y-1 text-xs">
                <li>✓ CSV exports for all analytics</li>
                <li>✓ 50,000 API requests/month</li>
                <li>✓ Advanced analytics dashboards</li>
                <li>✓ Priority support</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-border/60 text-foreground/85 hover:bg-muted/60 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <Link
                href="/pricing"
                className="flex-1 px-4 py-2 rounded-lg bg-amber-600 text-foreground hover:bg-amber-700 transition-colors text-sm font-medium text-center"
              >
                View Plans
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
