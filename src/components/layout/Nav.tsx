"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { sections, site, type SectionId } from "@/content/site";
import { SHOW_PLACEHOLDERS } from "@/content/types";
import { AskAiButton } from "@/components/chat/ChatLauncher";
import { KnurlDivider } from "./KnurlDivider";
import { ThemeSwitcher } from "./ThemeSwitcher";

const navItems = sections.filter((s) => s.nav);
const showResume = site.resume.available || SHOW_PLACEHOLDERS;

function useActiveSection(): SectionId | null {
  const [active, setActive] = useState<SectionId | null>(null);

  useEffect(() => {
    const targets = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);

    // A section is "active" when it crosses a line just under the nav.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id as SectionId);
        }
      },
      { rootMargin: "-30% 0px -65% 0px" },
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return active;
}

export function Nav() {
  const active = useActiveSection();
  const menuRef = useRef<HTMLDivElement>(null);
  const closeMenu = () => menuRef.current?.hidePopover();

  const resumeClass = site.resume.available
    ? "border-steel-line text-bone hover:border-brass hover:text-brass"
    : "border-dashed border-brass/60 text-brass";
  const resumeTitle = site.resume.available
    ? undefined
    : "TODO(nadun): resume PDF not supplied yet";

  return (
    <header className="sticky top-0 z-50 bg-cast/85 backdrop-blur-md">
      <nav
        aria-label="Primary"
        className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8"
      >
        <a
          href="#hero"
          className="grid size-11 place-items-center rounded-machined border border-steel-line bg-cast font-display text-base font-extrabold tracking-wide text-brass shadow-machined [font-stretch:120%]"
        >
          <span aria-hidden="true">{site.monogram}</span>
          <span className="sr-only">{site.name}, back to top</span>
        </a>

        <div className="flex items-center gap-2 lg:gap-3">
          <ul className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  aria-current={active === item.id ? "location" : undefined}
                  className="relative inline-flex min-h-11 items-center px-3 text-small text-concrete transition-colors hover:text-bone aria-[current=location]:text-brass"
                >
                  {item.nav}
                </a>
              </li>
            ))}
            {showResume ? (
              <li className="ml-2">
                <a
                  href={site.resume.href}
                  title={resumeTitle}
                  className={`inline-flex min-h-9 items-center rounded-sm border px-3 font-mono text-mono-label uppercase tracking-[0.08em] transition-colors ${resumeClass}`}
                >
                  Resume
                </a>
              </li>
            ) : null}
            <li className="ml-3">
              <AskAiButton variant="nav" />
            </li>
          </ul>

          <ThemeSwitcher />

          <button
            type="button"
            popoverTarget="site-menu"
            className="inline-flex size-11 items-center justify-center rounded-machined border border-steel-line text-bone lg:hidden"
          >
            <Menu aria-hidden="true" className="size-5" />
            <span className="sr-only">Open menu</span>
          </button>
        </div>
      </nav>
      <KnurlDivider />

      <div
        id="site-menu"
        ref={menuRef}
        popover="auto"
        aria-label="Site menu"
        className="sheet-menu m-0 ml-auto h-dvh max-h-none w-full max-w-sm flex-col border-0 border-l border-steel-line bg-cast p-0 text-bone [&:popover-open]:flex"
      >
        <div className="flex h-16 items-center justify-between px-4">
          <span className="eyebrow text-concrete">Menu</span>
          <button
            type="button"
            popoverTarget="site-menu"
            popoverTargetAction="hide"
            className="inline-flex size-11 items-center justify-center rounded-machined border border-steel-line"
          >
            <X aria-hidden="true" className="size-5" />
            <span className="sr-only">Close menu</span>
          </button>
        </div>
        <KnurlDivider />
        <ul className="flex flex-col gap-1 p-4">
          {navItems.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={closeMenu}
                aria-current={active === item.id ? "location" : undefined}
                className="flex min-h-12 items-center justify-between border-b border-steel-line font-display text-h3 font-semibold aria-[current=location]:text-brass"
              >
                {item.nav}
                <span className="font-mono text-mono-label text-concrete">
                  {sections.find((s) => s.id === item.id)?.number}
                </span>
              </a>
            </li>
          ))}
          {showResume ? (
            <li className="mt-4">
              <a
                href={site.resume.href}
                title={resumeTitle}
                className={`inline-flex min-h-11 items-center rounded-sm border px-4 font-mono text-mono-label uppercase tracking-[0.08em] ${resumeClass}`}
              >
                Resume
              </a>
            </li>
          ) : null}
        </ul>
      </div>
    </header>
  );
}
