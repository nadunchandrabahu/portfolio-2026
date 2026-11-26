"use client";

import { Cog } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { site } from "@/content/site";
import { openChat, useChatOpen } from "@/lib/chat/open";

/**
 * Entry points to the workshop assistant (CLAUDE.md 4, 8.5). Only these small
 * buttons ship with the page: the panel, the executor and the chat chunk load
 * the first time someone opens it.
 */

const ChatRoot = dynamic(() => import("./ChatRoot"), { ssr: false });

const variants = {
  nav: "min-h-9 gap-2 px-3 text-mono-label",
  hero: "min-h-11 gap-2 px-6 text-small",
} as const;

export function AskAiButton({ variant, className = "" }: { variant: keyof typeof variants; className?: string }) {
  if (!site.features.chat) return null;
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      onClick={(e) => openChat(e.currentTarget)}
      className={`inline-flex items-center rounded-sm border border-brass font-mono font-medium uppercase tracking-[0.08em] text-brass transition-colors hover:bg-brass hover:text-graphite ${variants[variant]} ${className}`}
    >
      <Cog aria-hidden="true" className="size-4" />
      Digital twin
    </button>
  );
}

/** Mobile floating button, and the lazily loaded chat itself once it's been opened. */
export function ChatLauncher() {
  const open = useChatOpen();
  const [loaded, setLoaded] = useState(false);
  if (open && !loaded) setLoaded(true);
  if (!site.features.chat) return null;

  return (
    <>
      {/* Stays mounted while the sheet is open (just hidden), so focus can return to it. */}
      <button
        type="button"
        aria-haspopup="dialog"
        hidden={open}
        onClick={(e) => openChat(e.currentTarget)}
        className="chain-fab fixed right-2 bottom-4 z-40 inline-flex size-14 items-center justify-center rounded-full border border-brass bg-cast text-brass shadow-machined lg:hidden"
      >
        <Cog aria-hidden="true" className="size-6" />
        <span className="sr-only">Open the Digital twin chat</span>
      </button>
      {loaded ? <ChatRoot open={open} /> : null}
    </>
  );
}
