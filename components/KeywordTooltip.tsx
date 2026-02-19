"use client";

import { useState, useRef, useEffect } from "react";
import type { AccessibilityMode } from "@/data/demoLesson";

interface KeywordTooltipProps {
  children: React.ReactNode;
  meaning: string;
  mode: AccessibilityMode;
  className?: string;
}

export function KeywordTooltip({ children, meaning, mode, className = "" }: KeywordTooltipProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPosition({
      top: rect.top - 8,
      left: rect.left + rect.width / 2,
    });
  }, [visible]);

  const modeTooltipClass = {
    normal: "keyword-tooltip-normal",
    dyslexia: "keyword-tooltip-dyslexia",
    adhd: "keyword-tooltip-adhd",
    "low-vision": "keyword-tooltip-lowvision",
  }[mode];

  return (
    <>
      <span
        ref={triggerRef}
        className={className}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
      >
        {children}
      </span>
      {visible && meaning && position && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className={`keyword-tooltip ${modeTooltipClass}`}
          style={{
            position: "fixed",
            top: position.top,
            left: position.left,
            transform: "translate(-50%, -100%)",
            zIndex: 9999,
          }}
        >
          <span className="keyword-tooltip-content">{meaning}</span>
        </div>
      )}
    </>
  );
}
