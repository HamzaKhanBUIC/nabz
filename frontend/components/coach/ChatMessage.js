"use client";

import Link from "next/link";
import Icon from "@/components/ui/Icon";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatTime } from "@/lib/utils/format";

export function TypingIndicator() {
  return (
    <div className="animate-message-in flex items-start gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-raised text-accent">
        <Icon name="smart_toy" size={18} />
      </span>
      <div className="rounded-lg border border-line bg-surface px-4 py-3 text-sm text-muted">
        Checking mission notes...
      </div>
    </div>
  );
}

export default function ChatMessage({ message }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="animate-message-in flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-accent px-4 py-3 text-sm text-on-status sm:max-w-[80%]">
          <p className="whitespace-pre-wrap leading-6">{message.content}</p>
          {message.createdAt ? (
            <p className="mt-1 text-right text-[11px] opacity-85">
              {formatTime(message.createdAt)}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-message-in flex items-start gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-raised text-accent">
        <Icon name="smart_toy" size={18} />
      </span>

      <div className="max-w-[88%] space-y-2.5 rounded-2xl rounded-tl-sm border border-line bg-surface p-4 text-sm text-primary">
        {message.banner ? (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-emergency bg-emergency/15 px-3 py-2 text-xs font-semibold text-primary"
          >
            <span className="flex items-center gap-1.5">
              <Icon name="emergency" filled size={16} className="shrink-0 text-emergency" />
              {message.banner.label}
            </span>
            <Link
              href="/emergency"
              className="rounded bg-emergency-solid px-2.5 py-1 text-white transition-colors hover:bg-emergency-hover"
            >
              Open Emergency
            </Link>
          </div>
        ) : null}

        <p className="whitespace-pre-wrap leading-6">{message.content}</p>

        {Array.isArray(message.citations) && message.citations.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 border-t border-line pt-2.5 text-xs">
            <span className="text-muted">Sources:</span>
            {message.citations.map((src) => (
              <a
                key={src.id}
                href={src.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-pill border border-line bg-raised px-2.5 py-0.5 text-accent transition-colors hover:bg-hover hover:underline"
              >
                {src.title}
              </a>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted">
          <div className="flex items-center gap-2">
            {message.grounded !== undefined ? (
              <StatusBadge
                tone={message.grounded ? "ok" : "warn"}
                dot={false}
                className="px-2 py-0.5 text-[10px]"
              >
                {message.grounded ? "Verified source" : "Outside handbook"}
              </StatusBadge>
            ) : null}
            {message.provider ? (
              <span className="tabular-nums">{message.provider}</span>
            ) : null}
          </div>
          {message.disclaimer ? <span>{message.disclaimer}</span> : null}
        </div>
      </div>
    </div>
  );
}
