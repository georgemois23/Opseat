import { useEffect, useMemo, useState } from "react";

export type DeliveryCountdownState = {
  /** Minute-level expectation, e.g. "Arrives in 1h 12m" or "15m past ETA" */
  primary: string;
  /** Secondary hint (estimate vs confirmed) */
  secondary?: string;
  /** Target time has passed while order still active */
  isOverdue: boolean;
};

/**
 * Formats minutes into "Xh Ym" or just "Ym"
 */
const formatDuration = (totalMin: number): string => {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;

  if (h > 0) {
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${m}m`;
};

/**
 * Minute-level countdown toward a delivery target (updates every ~60s).
 */
export function useDeliveryCountdown(target: Date | null, enabled: boolean): DeliveryCountdownState | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setNow(Date.now());
  }, [target, enabled]);

  useEffect(() => {
    if (!enabled || !target) return;
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, [enabled, target]);

  return useMemo(() => {
    if (!target || !enabled) return null;

    const ms = target.getTime() - now;
    const isOverdue = ms < 0;
    const absMs = Math.abs(ms);
    
    // Always round up to the nearest minute for consistency
    const totalMin = Math.max(1, Math.ceil(absMs / 60_000));

    let primary: string;

    if (!isOverdue) {
      if (totalMin <= 1) {
        primary = "Arriving soon";
      } else {
        primary = `Arrives in about ${formatDuration(totalMin)}`;
      }
    } else {
      if (totalMin < 2) {
        primary = "Just a moment — running slightly late";
      } else {
        primary = `About ${formatDuration(totalMin)} past estimated time — may still be on the way`;
      }
    }

    return { primary, isOverdue };
  }, [target, enabled, now]);
}