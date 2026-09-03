"use client";
import React, { useState, useRef, useEffect } from "react";
import "./ChatWidget.css";

const STARTERS = [
  "What's Sumit's experience with Rust?",
  "Where has he worked?",
  "Is he available for hire?",
];

function ChatWidget(props) {
  const theme = props.theme;
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Keep the transcript pinned to the newest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  async function send(text) {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const history = [...messages, { role: "user", content: trimmed }];
    // Add the empty assistant bubble up front so the typing indicator is
    // visible for the whole wait, not just once the response arrives.
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({}));
        setMessages([
          ...history,
          { role: "assistant", content: error || "Something went wrong. Please try again." },
        ]);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages([...history, { role: "assistant", content: acc }]);
      }

      // Never leave an empty bubble sitting there
      if (!acc.trim()) {
        setMessages([
          ...history,
          { role: "assistant", content: "Sorry — I didn't get a response. Please try again." },
        ]);
      }
    } catch {
      setMessages([
        ...history,
        { role: "assistant", content: "Could not reach the server. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    send(input);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  const isDark = theme.name === "dark";
  const panelBg = theme.body;
  const bubbleBg = isDark ? "#2A2B2E" : "#F0F2F5";

  return (
    <div className="chat-widget-wrapper">
      {isOpen && (
        <div
          className="chat-panel"
          style={{ backgroundColor: panelBg, border: `1px solid ${theme.accentColor}` }}
        >
          <div className="chat-header" style={{ backgroundColor: theme.accentColor }}>
            <span className="chat-header-title">Ask about Sumit</span>
            <button
              className="chat-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          <div className="chat-messages" ref={scrollRef}>
            {messages.length === 0 && (
              <div className="chat-empty">
                <p style={{ color: theme.secondaryText }}>
                  Hi! Ask me anything about Sumit&apos;s work and experience.
                </p>
                <div className="chat-starters">
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      className="chat-starter"
                      onClick={() => send(s)}
                      style={{ borderColor: theme.accentColor, color: theme.accentColor }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`chat-msg ${m.role === "user" ? "chat-msg-user" : "chat-msg-bot"}`}
                style={
                  m.role === "user"
                    ? { backgroundColor: theme.accentColor, color: "#fff" }
                    : { backgroundColor: bubbleBg, color: theme.text }
                }
              >
                {m.content}
                {m.role === "assistant" && !m.content && isLoading && (
                  <span className="chat-typing">
                    <span />
                    <span />
                    <span />
                  </span>
                )}
              </div>
            ))}
          </div>

          <form className="chat-input-row" onSubmit={handleSubmit}>
            <textarea
              ref={inputRef}
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question…"
              rows={1}
              maxLength={2000}
              disabled={isLoading}
              style={{ color: theme.text, borderColor: isDark ? "#3A3B3E" : "#DDD" }}
            />
            <button
              type="submit"
              className="chat-send"
              disabled={isLoading || !input.trim()}
              style={{ backgroundColor: theme.accentColor }}
              aria-label="Send message"
            >
              ➤
            </button>
          </form>
        </div>
      )}

      <button
        className="chat-bubble"
        onClick={() => setIsOpen(!isOpen)}
        style={{ backgroundColor: theme.accentColor }}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? "✕" : "💬"}
      </button>
    </div>
  );
}

export default ChatWidget;
