import { useCallback, useEffect, useRef, useState } from "react";
import { ChatMessage, sendChatMessage } from "../lib/chatApi";
import "./styles/ChatWidget.css";

/** Parse text and render URLs + mailto links as clickable. */
function linkify(text: string): React.ReactNode[] {
  const urlRegex = /(https?:\/\/[^\s<>"']+|mailto:[^\s<>"']+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    const isWeb = part.startsWith("http://") || part.startsWith("https://");
    const isMailto = part.startsWith("mailto:");
    const isEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(part);
    if (isWeb) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="chat-link"
        >
          {part}
        </a>
      );
    }
    if (isMailto || isEmail) {
      const href = isMailto ? part : `mailto:${part}`;
      const label = isMailto
        ? part.replace(/^mailto:([^?]+).*/, "$1")
        : part;
      return (
        <a key={i} href={href} className="chat-link chat-link-email">
          {label}
        </a>
      );
    }
    return part;
  });
}

function Greeting({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="chat-bubble assistant">
      <p>Hi! I'm Vicente's AI assistant.</p>

      <p>People usually ask about:</p>

      <div className="chat-suggestions">
        <button
          disabled={disabled}
          onClick={() => onSend("What does Vicente research?")}
        >
          Vicente's research areas
        </button>

        <button
          disabled={disabled}
          onClick={() => onSend("What are Vicente's key publications?")}
        >
          Key publications
        </button>

        <button
          disabled={disabled}
          onClick={() =>
            onSend("How does Vicente use eye-tracking in his research?")
          }
        >
          Eye-tracking research
        </button>

        <button
          disabled={disabled}
          onClick={() =>
            onSend("What projects is Vicente currently working on?")
          }
        >
          Current projects
        </button>

        <button
          disabled={disabled}
          onClick={() => onSend("How can someone collaborate with Vicente?")}
        >
          Collaboration opportunities
        </button>
      </div>
    </div>
  );
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(scrollToBottom, [messages, loading, error, open, scrollToBottom]);

  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const delta = e.deltaY;
      const isScrollable = scrollHeight > clientHeight;

      if (!isScrollable) {
        e.preventDefault();
        return;
      }

      const atTop = scrollTop <= 0;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 1;

      const scrollingUpAtTop = delta < 0 && atTop;
      const scrollingDownAtBottom = delta > 0 && atBottom;

      // I stop the page behind from scrolling when the pointer is over the chat area.
      if (scrollingUpAtTop || scrollingDownAtBottom) {
        e.preventDefault();
      }

      e.stopPropagation();
    };

    let touchStartY = 0;

    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0]?.clientY ?? 0;
    };

    const onTouchMove = (e: TouchEvent) => {
      const currentY = e.touches[0]?.clientY ?? 0;
      const delta = touchStartY - currentY;

      const { scrollTop, scrollHeight, clientHeight } = el;
      const isScrollable = scrollHeight > clientHeight;

      if (!isScrollable) {
        e.preventDefault();
        return;
      }

      const atTop = scrollTop <= 0;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 1;

      const scrollingUpAtTop = delta < 0 && atTop;
      const scrollingDownAtBottom = delta > 0 && atBottom;

      if (scrollingUpAtTop || scrollingDownAtBottom) {
        e.preventDefault();
      }

      e.stopPropagation();
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, [open]);

  const sendText = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const userMsg: ChatMessage = { role: "user", content: trimmed };
      const history = [...messages, userMsg];

      setMessages(history);
      setInput("");
      setError(null);
      setLoading(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const reply = await sendChatMessage(history, controller.signal);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: reply },
        ]);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
        abortRef.current = null;
      }
    },
    [loading, messages]
  );

  const send = useCallback(() => sendText(input), [input, sendText]);

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  const abort = () => {
    abortRef.current?.abort();
    setLoading(false);
  };

  return (
    <>
      {open && (
        <div className="chat-panel">
          <div className="chat-header">
            <span>Chat with Vicente&apos;s AI</span>
            <button
              className="chat-close"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          <div ref={messagesRef} className="chat-messages">
           <Greeting onSend={sendText} disabled={loading} />

            {messages.map((m, i) => (
              <div key={i} className={`chat-bubble ${m.role}`}>
                {linkify(m.content)}
              </div>
            ))}

            {error && <div className="chat-bubble error">{error}</div>}

            {loading && (
              <div className="chat-typing">
                <span />
                <span />
                <span />
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="chat-input-row">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask something…"
              disabled={loading}
            />
            {loading ? (
              <button className="chat-send" onClick={abort}>
                Stop
              </button>
            ) : (
              <button
                className="chat-send"
                onClick={() => void send()}
                disabled={!input.trim()}
              >
                Send
              </button>
            )}
          </div>
        </div>
      )}

      <button
        className="chat-fab"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? "✕" : "💬"}
      </button>
    </>
  );
}