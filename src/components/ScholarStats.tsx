"use client";

import { useEffect, useState, useCallback } from "react";
import { config } from "../config";
import "./styles/ScholarStats.css";

function RollingNumber({ value, duration = 800 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const [prevTarget, setPrevTarget] = useState(0);

  useEffect(() => {
    const from = prevTarget;
    const to = value;
    setPrevTarget(to);
    if (from === to) {
      setDisplay(to);
      return;
    }
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const curr = Math.round(from + (to - from) * easeOut);
      setDisplay(curr);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);

  return <span className="scholar-number">{display.toLocaleString()}</span>;
}

export function ScholarStats() {
  const [stats, setStats] = useState<{ citations: number; hIndex: number; i10Index: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    const fallback = config.scholar?.fallback ?? { citations: 0, hIndex: 0, i10Index: 0 };
    const scholarUrl = config.scholar?.url ?? "";

    try {
      const params = new URLSearchParams();
      if (scholarUrl) params.set("url", scholarUrl);
      params.set("fallback", JSON.stringify(fallback));

      const res = await fetch(`/api/scholar?${params.toString()}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setStats({
          citations: data.citations ?? fallback.citations,
          hIndex: data.hIndex ?? fallback.hIndex,
          i10Index: data.i10Index ?? fallback.i10Index,
        });
        setLoading(false);
        setRefreshing(false);
        return;
      }
    } catch {
      /* fall through to fallback */
    }

    setStats(fallback);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading || !stats) {
    return (
      <div className="scholar-stats">
        <span className="scholar-stats-loading">Loading…</span>
      </div>
    );
  }

  const handleRefresh = () => {
    setRefreshing(true);
    setStats(null);
    fetchStats();
  };

  const scholarUrl = config.scholar?.url ?? "https://scholar.google.com/citations?user=0YSmKi4AAAAJ&hl=en&oi=ao";

  return (
    <div className="scholar-stats-wrapper">
      <div
        className={`scholar-stats ${refreshing ? "scholar-stats-refreshing" : ""}`}
        onClick={handleRefresh}
        onKeyDown={(e) => e.key === "Enter" && handleRefresh()}
        role="button"
        tabIndex={0}
        title="Click to refresh"
        aria-label="Scholar statistics, click to refresh"
      >
        <div className="scholar-stat">
          <span className="scholar-stat-value">
            <RollingNumber value={stats.citations} />
          </span>
          <span className="scholar-stat-label">Citations</span>
        </div>
        <div className="scholar-stat">
          <span className="scholar-stat-value">
            <RollingNumber value={stats.hIndex} />
          </span>
          <span className="scholar-stat-label">h-index</span>
        </div>
        <div className="scholar-stat">
          <span className="scholar-stat-value">
            <RollingNumber value={stats.i10Index} />
          </span>
          <span className="scholar-stat-label">i10-index</span>
        </div>
      </div>
      <a
        href={scholarUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="scholar-profile-btn"
      >
        View Google Scholar Profile
      </a>
    </div>
  );
}
