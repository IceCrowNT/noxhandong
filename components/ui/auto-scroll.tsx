"use client";

import { useEffect, useRef } from "react";

export function AutoScroll() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      // Scroll the parent container so this element is visible
      ref.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, []);

  return <div ref={ref} />;
}
