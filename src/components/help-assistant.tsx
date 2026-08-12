"use client";

import { useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { UserRole } from "@/lib/types";

type Msg = { role: "user" | "assistant"; text: string };

export function HelpAssistant({ role }: { role: UserRole }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text: "Hi — I can help you navigate CampusResolve, explain ticket statuses, or draft clear complaint wording. Ask anything.",
    },
  ]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setBusy(true);
    try {
      const res = await fetch("/api/ai/help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          role,
          page: typeof window !== "undefined" ? window.location.pathname : "",
        }),
      });
      const data = (await res.json()) as { answer?: string };
      setMessages((m) => [
        ...m,
        { role: "assistant", text: data.answer ?? "Sorry, I could not answer that." },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Network error. Try again, or use the in-app menus." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-teal-700 text-white shadow-lg shadow-teal-900/30 transition hover:bg-teal-600"
        aria-label="Open help assistant"
      >
        <MessageCircle className="h-5 w-5" />
      </button>
      {open ? (
        <div className="fixed bottom-20 right-5 z-50 flex h-[28rem] w-[min(100vw-2rem,22rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-teal-800 px-4 py-3 text-white">
            <div>
              <p className="text-sm font-semibold">Help Assistant</p>
              <p className="text-xs text-teal-100/80">Navigation · drafting · statuses</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {messages.map((m, i) => (
              <div
                key={`${i}-${m.role}`}
                className={
                  m.role === "user"
                    ? "ml-8 rounded-xl bg-teal-700 px-3 py-2 text-sm text-white"
                    : "mr-6 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-800"
                }
              >
                {m.text}
              </div>
            ))}
          </div>
          <div className="border-t border-slate-200 p-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="How do I track my ticket?"
              className="min-h-16 resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <Button
              className="mt-2 w-full bg-teal-700 hover:bg-teal-600"
              onClick={() => void send()}
              disabled={busy}
            >
              <Send className="mr-2 h-4 w-4" />
              {busy ? "Thinking…" : "Send"}
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
