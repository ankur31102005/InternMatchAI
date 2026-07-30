"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { MessageCircle, X, Send, Sparkles, Building2, Loader2 } from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import { apiFetch } from "@/services/api"
import { Avatar } from "@/components/ui/Avatar"
import { companyAccent } from "@/lib/format"

interface RefInternship {
  id: string
  title: string
  company: string
  match?: number | null
}

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  internships?: RefInternship[]
}

interface ChatResponse {
  reply: string
  internships: RefInternship[]
}

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I'm your AI career assistant. Ask me to find internships, check your fit, or review your applications. Try: “Find me remote data analyst internships”.",
}

const SUGGESTIONS = [
  "Find internships that fit my resume",
  "Which of my applications are pending?",
  "Suggest remote tech internships",
]

export function ChatWidget() {
  const { isAuthenticated } = useAuthStore()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, sending])

  if (!isAuthenticated) return null

  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setInput("")
    const nextMessages = [...messages, { role: "user" as const, content: trimmed }]
    setMessages(nextMessages)
    setSending(true)
    try {
      const history = nextMessages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: m.content }))
      const res = await apiFetch<ChatResponse>("/chat/", {
        method: "POST",
        json: { messages: history },
      })
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.reply,
          internships: res.internships,
        },
      ])
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            err.message ||
            "Sorry, I couldn't reach the assistant. Please try again in a moment.",
        },
      ])
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Launcher */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open AI assistant"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-card-hover transition-colors hover:bg-brand-blue-dark"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="h-6 w-6" />
            </motion.span>
          ) : (
            <motion.span key="c" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageCircle className="h-6 w-6" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 flex h-[70vh] max-h-[560px] w-[calc(100vw-3rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card-hover"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border bg-primary px-4 py-3 text-primary-foreground">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <p className="font-heading text-sm font-semibold">AI Career Assistant</p>
                <p className="text-xs text-primary-foreground/70">Grounded in your data</p>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
                  <div
                    className={
                      m.role === "user"
                        ? "max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground"
                        : "max-w-[90%] rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2 text-sm text-foreground"
                    }
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                    {m.internships && m.internships.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {m.internships.map((it) => (
                          <Link
                            key={it.id}
                            href={`/internships/${it.id}`}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-2 rounded-lg border border-border bg-card p-2 transition-colors hover:border-primary/40"
                          >
                            <Avatar name={it.company} size={26} color={companyAccent(it.company)} />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-xs font-semibold text-foreground">
                                {it.title}
                              </span>
                              <span className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                                <Building2 className="h-2.5 w-2.5" />
                                {it.company}
                              </span>
                            </span>
                            {typeof it.match === "number" && (
                              <span className="shrink-0 rounded-full bg-success/10 px-1.5 py-0.5 text-[10px] font-bold text-success">
                                {it.match}%
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {sending && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
                </div>
              )}

              {messages.length === 1 && !sending && (
                <div className="space-y-1.5 pt-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="block w-full rounded-lg border border-border bg-surface px-3 py-2 text-left text-xs text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                send(input)
              }}
              className="flex items-center gap-2 border-t border-border p-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about internships…"
                aria-label="Message the assistant"
                className="h-10 flex-1 rounded-xl border border-input bg-surface px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                aria-label="Send"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-brand-blue-dark disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
