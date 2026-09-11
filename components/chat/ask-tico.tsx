"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import { PixelLoader } from "@/components/chat/pixel-loader";

/* Chat panel adapted from Beautiful UI's "Chat" composer (beautifului.dev),
 * wired to a real streaming LLM via the AI SDK. */

const SUGGESTIONS: { label: string; prompt: string }[] = [
  { label: "Who is Tico?", prompt: "Who is Tico Hamphill, in a nutshell?" },
  { label: "Launchabl", prompt: "What is Launchabl and who is it for?" },
  { label: "Star Glide", prompt: "What is Star Glide and how do I play?" },
  { label: "Work together", prompt: "How can I work with Tico or Launchabl?" },
];

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end pl-14">
      <div
        className="rounded-xl bg-field px-3 py-1.5 text-[13px] leading-[1.4] text-ink"
        style={{ animation: "fade-up 300ms cubic-bezier(0.23,1,0.32,1) both" }}
      >
        {text}
      </div>
    </div>
  );
}

function AssistantReply({ text, streaming }: { text: string; streaming?: boolean }) {
  return (
    <div
      className="flex w-full flex-col gap-1.5 pr-8"
      style={{ animation: "fade-up 400ms cubic-bezier(0.23,1,0.32,1) both" }}
    >
      <div className="flex items-center gap-1 text-[12px] leading-[1.3]">
        <span className="font-medium text-ink">Ask Tico</span>
        <span className="text-ink-2">{streaming ? "answering…" : "answered"}</span>
      </div>
      <p className="whitespace-pre-wrap text-[13px] leading-normal text-ink">
        {text}
      </p>
    </div>
  );
}

export function AskTico({ className = "" }: { className?: string }) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const busy = status === "submitted" || status === "streaming";
  const canSend = draft.trim().length > 0 && !busy;

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, status]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    sendMessage({ text: trimmed });
    setDraft("");
  };

  const errorText =
    error && /503|isn't connected/i.test(error.message)
      ? "Ask Tico isn't connected to a model yet — check back soon."
      : error
        ? "Something went wrong. Try again in a moment."
        : null;

  return (
    <div
      className={`flex h-[440px] w-full max-w-[380px] flex-col overflow-hidden rounded-[14px] border border-line bg-surface shadow-card ${className}`}
    >
      {/* header — suggestion chips */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-line p-1.5">
        <div className="flex min-w-0 items-center gap-0.5 overflow-x-auto [scrollbar-width:none]">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.label}
              type="button"
              disabled={busy}
              onClick={() => send(s.prompt)}
              className="shrink-0 rounded-[6px] px-2 py-[3px] text-[13px] text-ink opacity-60 transition-[background-color,opacity] duration-100 hover:bg-field hover:opacity-100 disabled:opacity-30"
            >
              {s.label}
            </button>
          ))}
        </div>
        <span className="mr-1 shrink-0 rounded-full bg-brand-lime px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-ink">
          AI
        </span>
      </div>

      {/* conversation */}
      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 pt-3 pb-1"
      >
        {messages.length === 0 && (
          <div className="mt-auto mb-auto text-center">
            <p className="font-display text-base font-bold text-ink">
              Ask me anything about Tico.
            </p>
            <p className="mt-1 text-[13px] text-ink-3">
              His work, Launchabl, Star Glide, the blog — or pick a chip above.
            </p>
          </div>
        )}

        {messages.map((m) => {
          const text = m.parts
            .filter((p) => p.type === "text")
            .map((p) => (p.type === "text" ? p.text : ""))
            .join("");
          if (m.role === "user") return <UserBubble key={m.id} text={text} />;
          const isLast = m.id === messages[messages.length - 1]?.id;
          return (
            <AssistantReply
              key={m.id}
              text={text}
              streaming={isLast && status === "streaming"}
            />
          );
        })}

        {status === "submitted" && <PixelLoader label="Thinking" />}

        {errorText && (
          <p className="rounded-lg border border-brand-coral/30 bg-brand-coral/5 px-3 py-2 text-[12px] text-ink-2">
            {errorText}
          </p>
        )}
      </div>

      {/* composer */}
      <div className="mt-auto shrink-0 p-1.5">
        <div
          role="presentation"
          onClick={() => inputRef.current?.focus()}
          className="flex cursor-text flex-col gap-2 rounded-[12px] border border-line bg-field p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.035)] transition-[border-color,box-shadow] duration-150 focus-within:border-line-strong"
        >
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send(draft);
            }}
            placeholder="Ask about Tico, Launchabl, or the site…"
            aria-label="Chat prompt"
            className="min-h-4.5 bg-transparent text-[13px] leading-[1.4] text-ink outline-none placeholder:text-ink-3"
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-ink-3">
              Answers only from what Tico has shared.
            </span>
            <button
              type="button"
              aria-label="Send"
              disabled={!canSend}
              onClick={() => send(draft)}
              className="flex size-7 items-center justify-center rounded-[8px] transition-[background-color,color,transform] duration-200 enabled:active:scale-[0.96]"
              style={{
                background: canSend ? "var(--ink)" : "var(--line-strong)",
                color: canSend ? "var(--surface)" : "var(--ink-2)",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
