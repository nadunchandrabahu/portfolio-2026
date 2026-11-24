"use client";

import { useEffect, useRef } from "react";
import { linkify, toParagraphs } from "@/lib/chat/linkify";

export type ChatMessage = {
  id: number;
  role: "visitor" | "assistant";
  text: string;
  /** "→ focus: ai · spin: 30 rpm" when the reply moved the gearbox. */
  receipt?: string | null;
};

/** Reply text as plain text with only allow-listed links. Never HTML. */
function ReplyText({ text }: { text: string }) {
  const host = window.location.host;
  return (
    <>
      {toParagraphs(text).map((paragraph, i) => (
        <p key={i} className={i > 0 ? "mt-3" : undefined}>
          {linkify(paragraph, host).map((segment, j) =>
            segment.href ? (
              <a
                key={j}
                href={segment.href}
                {...(segment.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="break-all text-brass underline underline-offset-2"
              >
                {segment.text}
                {segment.external ? <span className="sr-only"> (opens in a new tab)</span> : null}
              </a>
            ) : (
              <span key={j}>{segment.text}</span>
            ),
          )}
        </p>
      ))}
    </>
  );
}

export function MessageList({
  messages,
  pending,
  children,
}: {
  messages: ChatMessage[];
  pending: boolean;
  /** Intro and suggestions, shown after the messages. */
  children?: React.ReactNode;
}) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [messages.length, pending]);

  return (
    <div className="flex flex-col gap-5">
      {messages.map((m) =>
        m.role === "visitor" ? (
          <div key={m.id} className="ml-10 self-end rounded-machined bg-machined px-3.5 py-2.5 text-small text-bone">
            <span className="sr-only">You: </span>
            {m.text}
          </div>
        ) : (
          <div key={m.id} className="mr-4 border-l-2 border-brass pl-3.5 text-small leading-relaxed text-bone">
            <span className="sr-only">Assistant: </span>
            <ReplyText text={m.text} />
            {m.receipt ? <p className="mt-2 font-mono text-[11px] tracking-[0.04em] text-concrete">{m.receipt}</p> : null}
          </div>
        ),
      )}
      {pending ? (
        <p className="flex items-center gap-2 font-mono text-[12px] text-concrete">
          machining
          <span aria-hidden="true" className="machining-ticks">
            <i />
            <i />
            <i />
          </span>
        </p>
      ) : null}
      {children}
      <div ref={end} />
    </div>
  );
}
