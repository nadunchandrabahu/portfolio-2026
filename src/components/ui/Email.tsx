"use client";

import { Check, Copy, Mail } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { site } from "@/content/site";

/**
 * The address is assembled in the browser so it never appears whole in the
 * HTML. Before hydration (or with JS off) links point at #contact and the
 * text reads "user [at] domain".
 */
const subscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

const fullAddress = () => `${site.email.user}@${site.email.domain}`;

export function EmailIconLink({ className = "" }: { className?: string }) {
  const hydrated = useHydrated();
  return (
    <a href={hydrated ? `mailto:${fullAddress()}` : "#contact"} className={className}>
      <Mail aria-hidden="true" className="size-5" />
      <span className="sr-only">Email</span>
    </a>
  );
}

export function EmailBlock() {
  const hydrated = useHydrated();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(fullAddress());
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const display = hydrated ? (
    fullAddress()
  ) : (
    <>
      {site.email.user}
      <span className="text-concrete"> [at] </span>
      {site.email.domain}
    </>
  );

  return (
    <div className="flex flex-col items-start gap-4">
      <a
        href={hydrated ? `mailto:${fullAddress()}` : undefined}
        className="display-expanded break-all text-[clamp(1.5rem,1rem+2.6vw,3.25rem)] font-bold text-bone transition-colors hover:text-brass"
      >
        {display}
      </a>
      {hydrated ? (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={copy}
            className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-steel-line px-4 font-mono text-mono-label uppercase tracking-[0.08em] text-bone transition-colors hover:border-brass hover:text-brass"
          >
            {copied ? (
              <Check aria-hidden="true" className="size-4" />
            ) : (
              <Copy aria-hidden="true" className="size-4" />
            )}
            Copy email
          </button>
          <span role="status" aria-live="polite" className="font-mono text-mono-label text-concrete">
            {copied ? "Copied" : ""}
          </span>
        </div>
      ) : null}
    </div>
  );
}
