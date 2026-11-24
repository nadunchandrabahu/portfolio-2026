"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { sendMessage } from "@/lib/chat/client";
import { domDeps, isProgrammaticScroll } from "@/lib/chat/domActions";
import { formatReceipt, runActions } from "@/lib/chat/executor";
import { closeChat } from "@/lib/chat/open";
import { OPENING_SUGGESTIONS } from "@/lib/chat/schema";
import { useReducedMotion } from "@/lib/motion";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { useGearboxStore } from "@/three/gearboxStore";
import { ChatPanel } from "./ChatPanel";
import type { ChatMessage } from "./MessageList";
import { ControlChip, GearboxViewer } from "./GearboxViewer";

/** Scrolling this far (as a fraction of the viewport) hands the gearbox back to the page. */
const RELEASE_SCROLL = 0.4;

/** Whether the desktop scroll stage is running (it marks <html data-gearbox-stage>). */
function useStageActive() {
  return useSyncExternalStore(
    (onChange) => {
      const observer = new MutationObserver(onChange);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-gearbox-stage"] });
      return () => observer.disconnect();
    },
    () => document.documentElement.hasAttribute("data-gearbox-stage"),
    () => false,
  );
}

/**
 * The chat, loaded on first open and kept mounted after that so the
 * conversation survives closing the panel. Sends messages, shows replies and
 * runs their gearbox actions through the executor.
 */
export default function ChatRoot({ open }: { open: boolean }) {
  const reducedMotion = useReducedMotion();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState(false);
  const [suggestions, setSuggestions] = useState<readonly string[]>(OPENING_SUGGESTIONS);
  const [announcement, setAnnouncement] = useState("");
  const [minimised, setMinimised] = useState(false);
  const nextId = useRef(0);
  const request = useRef<AbortController | null>(null);
  const run = useRef<AbortController | null>(null);

  const chatInControl = useGearboxStore((s) => s.controlledBy === "chat");
  const releaseToScroll = useGearboxStore((s) => s.releaseToScroll);
  const stageActive = useStageActive();
  const wide = useMediaQuery("(min-width: 1024px)");
  const viewer = chatInControl && stageActive && wide;

  useEffect(
    () => () => {
      request.current?.abort();
      run.current?.abort();
    },
    [],
  );

  // Scrolling the page yourself (more than ~40% of a screen) hands the
  // gearbox back to the scroll choreography. The executor's own scrolls don't count.
  useEffect(() => {
    if (!chatInControl) return;
    let baseline = window.scrollY;
    const onScroll = () => {
      if (isProgrammaticScroll()) {
        baseline = window.scrollY;
        return;
      }
      if (Math.abs(window.scrollY - baseline) > window.innerHeight * RELEASE_SCROLL) releaseToScroll();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [chatInControl, releaseToScroll]);

  const send = async (text: string) => {
    request.current?.abort();
    run.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setMessages((m) => [...m, { id: nextId.current++, role: "visitor", text }]);
    setSuggestions([]);
    setPending(true);

    let reply;
    try {
      reply = await sendMessage(text, controller.signal);
    } catch {
      return; // superseded by a newer message
    }
    setPending(false);
    setMessages((m) => [
      ...m,
      { id: nextId.current++, role: "assistant", text: reply.reply, receipt: formatReceipt(reply.actions) },
    ]);
    setSuggestions(reply.suggestions);
    setAnnouncement(reply.reply);

    const actions = new AbortController();
    run.current = actions;
    void runActions(reply.actions, domDeps(reducedMotion), actions.signal);
  };

  return (
    <>
      {open ? (
        <ChatPanel
          messages={messages}
          pending={pending}
          suggestions={suggestions}
          announcement={announcement}
          minimised={minimised}
          onSend={send}
          onMinimise={setMinimised}
          onClose={closeChat}
        />
      ) : null}
      {viewer ? <GearboxViewer beside={open && !minimised} /> : null}
      {chatInControl && !viewer ? (
        // Phones and hero-only layouts: the chip floats under the nav.
        <ControlChip onRelease={releaseToScroll} className="fixed top-20 left-4 z-40" />
      ) : null}
    </>
  );
}
