"use client";

import { ArrowUp, Minus, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { MESSAGE_MAX } from "@/lib/chat/schema";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { MessageList, type ChatMessage } from "./MessageList";
import { Suggestions } from "./Suggestions";

const COUNTER_FROM = 400;
const INTRO = "Ask about Nadun's projects, background or how to reach him. I can also take the gearbox apart for you.";

const FOCUSABLE = 'button:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

/**
 * The workshop assistant panel (CLAUDE.md 8.5): docked bottom-right on
 * desktop, a bottom sheet on phones that stops short of the hero gearbox so
 * you can watch it move. A labelled dialog; Esc closes; focus is trapped on
 * phones (modal there); new replies are announced politely.
 */
export function ChatPanel({
  messages,
  pending,
  suggestions,
  announcement,
  minimised,
  onSend,
  onMinimise,
  onClose,
}: {
  messages: ChatMessage[];
  pending: boolean;
  suggestions: readonly string[];
  /** Latest reply text, for the polite live region. */
  announcement: string;
  minimised: boolean;
  onSend: (text: string) => void;
  onMinimise: (minimised: boolean) => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const inputId = useId();
  const panel = useRef<HTMLElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState("");
  // Modal (focus trap, aria-modal) only where it's a sheet: below lg.
  const modal = useMediaQuery("(max-width: 1023.98px)");

  // Straight into the text box on open. On phones the keyboard is already
  // up (openChat summons it during the tap), and focus hands over to here.
  // (16px text on phones, so iOS doesn't zoom in on focus.)
  useEffect(() => {
    if (!minimised) input.current?.focus({ preventScroll: true });
  }, [minimised]);

  // Phones: keep the sheet sitting on top of the on-screen keyboard, sized to
  // what's still visible, so the text box stays in view while typing. The
  // visual viewport shrinks when the keyboard opens; the layout one doesn't.
  useEffect(() => {
    const el = panel.current;
    const vv = window.visualViewport;
    if (!modal || minimised || !el || !vv) return;
    const update = () => {
      const keyboard = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      el.style.setProperty("--keyboard", `${Math.round(keyboard)}px`);
      // Keyboard up (not just a browser bar resizing): use all the space above it.
      if (keyboard > 80) el.style.setProperty("--keyboard-sheet", `${Math.round(vv.height)}px`);
      else el.style.removeProperty("--keyboard-sheet");
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      el.style.removeProperty("--keyboard");
      el.style.removeProperty("--keyboard-sheet");
    };
  }, [modal, minimised]);

  const send = (text: string) => {
    const message = text.trim();
    if (!message || pending) return;
    onSend(message);
    setDraft("");
    // A clicked chip disappears while waiting; keep focus in the panel.
    input.current?.focus({ preventScroll: true });
  };

  // Esc closes from anywhere while the panel is open, even if focus has
  // wandered back to the page.
  useEffect(() => {
    if (minimised) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [minimised, onClose]);

  const onPanelKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Escape") {
      // Handled here; the document listener sees defaultPrevented and skips.
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key !== "Tab" || !modal || !panel.current) return;
    const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    const first = items[0];
    const last = items[items.length - 1];
    if (!first || !last) return;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const onInputKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends; Shift+Enter (or composing with an IME) adds a newline.
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send(draft);
    }
  };

  if (minimised) {
    return (
      <div className="chat-minimised fixed right-4 bottom-4 z-40 hidden lg:block">
        <button
          type="button"
          onClick={() => onMinimise(false)}
          className="flex min-h-11 items-center gap-3 rounded-machined border border-steel-line bg-cast px-4 font-mono text-mono-label tracking-[0.08em] text-bone uppercase shadow-machined"
        >
          <span aria-hidden="true" className="status-lamp" />
          Workshop assistant
          <span className="sr-only">(expand)</span>
        </button>
      </div>
    );
  }

  const remaining = MESSAGE_MAX - draft.length;
  const showIntro = messages.length === 0;

  return (
    <section
      ref={panel}
      role="dialog"
      aria-modal={modal || undefined}
      aria-labelledby={titleId}
      onKeyDown={onPanelKeyDown}
      className="chat-panel fixed z-[60] flex flex-col border border-steel-line bg-cast text-bone shadow-machined"
    >
      <header className="flex items-center justify-between gap-3 border-b border-steel-line px-4 py-3">
        <h2 id={titleId} className="flex items-center gap-2.5 font-mono text-mono-label tracking-[0.12em] uppercase">
          <span aria-hidden="true" className="status-lamp" />
          Workshop assistant
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMinimise(true)}
            className="hidden size-9 items-center justify-center rounded-sm text-concrete hover:text-bone lg:inline-flex"
          >
            <Minus aria-hidden="true" className="size-4" />
            <span className="sr-only">Minimise</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 items-center justify-center rounded-sm text-concrete hover:text-bone"
          >
            <X aria-hidden="true" className="size-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        <MessageList messages={messages} pending={pending}>
          {showIntro ? <p className="text-small text-concrete">{INTRO}</p> : null}
          {!pending ? <Suggestions items={suggestions} disabled={pending} onPick={send} /> : null}
        </MessageList>
      </div>

      {/* New replies are read out without moving focus. */}
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <form
        className="border-t border-steel-line px-4 pt-3 pb-3"
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
      >
        <div className="flex items-baseline justify-between">
          <label htmlFor={inputId} className="font-mono text-[11px] tracking-[0.08em] text-concrete uppercase">
            Your question
          </label>
          {draft.length >= COUNTER_FROM ? (
            <span className={`font-mono text-[11px] ${remaining < 20 ? "text-brass" : "text-concrete"}`}>
              {draft.length}/{MESSAGE_MAX}
            </span>
          ) : null}
        </div>
        <div className="mt-1.5 flex items-end gap-2">
          <textarea
            id={inputId}
            ref={input}
            rows={2}
            maxLength={MESSAGE_MAX}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onInputKeyDown}
            className="min-h-11 flex-1 resize-none rounded-sm border border-steel-line bg-graphite px-3 py-2 text-[1rem] text-bone placeholder:text-concrete/70 focus-visible:border-brass lg:text-small"
            placeholder="Ask about a project, a skill, or the gearbox"
          />
          <button
            type="submit"
            disabled={pending || draft.trim() === ""}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-sm bg-brass text-graphite transition hover:brightness-110 disabled:opacity-40"
          >
            <ArrowUp aria-hidden="true" className="size-5" />
            <span className="sr-only">Send</span>
          </button>
        </div>
        {/* TODO(nadun): add "Chats aren't stored" once n8n execution saving is off (CHATBOT_SETUP.md). */}
        <p className="mt-2 text-[12px] text-concrete">AI assistant. It can be wrong; check anything important with Nadun.</p>
      </form>
    </section>
  );
}
