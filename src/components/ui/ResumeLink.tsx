"use client";

import type { ReactNode } from "react";
import { site } from "@/content/site";

/**
 * Opens the resume PDF in a new tab and also saves a copy. The link itself
 * opens the tab (so it still works without JavaScript); the click handler
 * starts the download alongside it.
 */
export function ResumeLink({
  className,
  title,
  children,
}: {
  className?: string;
  title?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={site.resume.href}
      target="_blank"
      rel="noopener"
      className={className}
      title={title}
      onClick={(e) => {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        const save = document.createElement("a");
        save.href = site.resume.href;
        save.download = site.resume.fileName;
        save.hidden = true;
        document.body.append(save);
        save.click();
        save.remove();
      }}
    >
      {children}
      <span className="sr-only"> (PDF, opens in a new tab and downloads)</span>
    </a>
  );
}
