"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { type ReactNode, useEffect, useRef } from "react";

const WINDOW_SCROLL_KEY = "admin-transaction-review-window-scroll";
const LIST_SCROLL_KEY = "admin-transaction-review-list-scroll";
const LIST_NAVIGATION_SCROLL_KEY = "admin-transaction-review-list-navigation-scroll";

function readScroll(key: string) {
  const value = Number(sessionStorage.getItem(key) || 0);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

export function ReviewScrollMemory() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;

  useEffect(() => {
    const restoreWindowScroll = () => {
      window.scrollTo({ top: readScroll(WINDOW_SCROLL_KEY), behavior: "instant" });
    };
    const saveWindowScroll = () => {
      sessionStorage.setItem(WINDOW_SCROLL_KEY, String(window.scrollY));
    };
    const saveBeforeNavigation = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("a[href*='/admin/transactions/review'], form")) {
        saveWindowScroll();
      }
    };

    const frame = requestAnimationFrame(restoreWindowScroll);
    const timer = window.setTimeout(restoreWindowScroll, 150);
    window.addEventListener("pagehide", saveWindowScroll);
    document.addEventListener("click", saveBeforeNavigation, true);
    document.addEventListener("submit", saveBeforeNavigation, true);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      window.removeEventListener("pagehide", saveWindowScroll);
      document.removeEventListener("click", saveBeforeNavigation, true);
      document.removeEventListener("submit", saveBeforeNavigation, true);
    };
  }, [routeKey]);

  return null;
}

export function ReviewTransactionList({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const restoreListScroll = () => {
      element.scrollTop = readScroll(LIST_NAVIGATION_SCROLL_KEY) || readScroll(LIST_SCROLL_KEY);
    };
    const frame = requestAnimationFrame(restoreListScroll);
    const timer = window.setTimeout(restoreListScroll, 150);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [routeKey]);

  return (
    <div
      ref={ref}
      className="max-h-[calc(100vh-230px)] space-y-2 overflow-y-auto pr-1"
      data-testid="review-transaction-list"
      onClickCapture={() => {
        if (ref.current) {
          const value = String(ref.current.scrollTop);
          sessionStorage.setItem(LIST_SCROLL_KEY, value);
          sessionStorage.setItem(LIST_NAVIGATION_SCROLL_KEY, value);
        }
      }}
      onScroll={(event) => {
        sessionStorage.setItem(LIST_SCROLL_KEY, String(event.currentTarget.scrollTop));
      }}
    >
      {children}
    </div>
  );
}
