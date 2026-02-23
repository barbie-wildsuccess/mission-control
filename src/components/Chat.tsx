"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect, useRef } from "react";

export function Chat() {
  const messages = useQuery(api.chat.list);
  const pending = useQuery(api.chat.getPending);
  const sendMessage = useMutation(api.chat.send);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const isTyping = pending && pending.length > 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    await sendMessage({ text });
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex-1 flex flex-col px-4 pb-3 overflow-hidden">
      <div className="flex-1 overflow-auto space-y-3 py-4">
        {messages === undefined ? (
          <div className="text-center text-[#525252] font-mono text-xs py-8">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-[#525252] font-mono text-xs py-8">
            No messages yet. Start the Girl Talk! 💖
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg._id}
              className={`flex items-end gap-2 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.sender === "barbie" && (
                <div className="w-7 h-7 rounded-full bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-sm flex-shrink-0">
                  🎀
                </div>
              )}
              <div className={`max-w-[70%] flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`px-3 py-2 rounded-lg text-sm font-mono whitespace-pre-wrap break-words ${
                    msg.sender === "user"
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20"
                      : "bg-pink-500/15 text-pink-200 border border-pink-500/20"
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-[#525252] mt-1 font-mono">{formatTime(msg.timestamp)}</span>
              </div>
            </div>
          ))
        )}

        {isTyping && (
          <div className="flex items-end gap-2">
            <div className="w-7 h-7 rounded-full bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-sm flex-shrink-0">
              🎀
            </div>
            <div className="px-3 py-2 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-300/60 text-sm font-mono">
              Barbie is typing<span className="animate-pulse">...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[#1e1e1e] pt-3 pb-1">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm font-mono text-white placeholder-[#525252] focus:outline-none focus:border-pink-500/40"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="px-4 py-2 bg-pink-500/20 text-pink-400 border border-pink-500/30 rounded-lg font-mono text-xs uppercase tracking-wider hover:bg-pink-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
