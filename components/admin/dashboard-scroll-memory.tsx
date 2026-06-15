"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const SCROLL_KEY = "admin-dashboard-action-scroll";
const RESTORE_KEY = "admin-dashboard-restore-scroll";

function savedScroll() {
  const value = Number(sessionStorage.getItem(SCROLL_KEY) || 0);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

export function DashboardScrollMemory() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;

  useEffect(() => {
    const saveBeforeSubmit = (event: Event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || !form.matches("[data-preserve-scroll]")) return;
      sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
      sessionStorage.setItem(RESTORE_KEY, "1");
    };

    document.addEventListener("submit", saveBeforeSubmit, true);
    return () => document.removeEventListener("submit", saveBeforeSubmit, true);
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem(RESTORE_KEY) !== "1") return;

    const restore = () => window.scrollTo({ top: savedScroll(), behavior: "instant" });
    const frame = requestAnimationFrame(restore);
    const shortTimer = window.setTimeout(restore, 100);
    const finalTimer = window.setTimeout(() => {
      restore();
      sessionStorage.removeItem(RESTORE_KEY);
    }, 350);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(shortTimer);
      window.clearTimeout(finalTimer);
    };
  }, [routeKey]);

  return null;
}
