"use client";
import { useState, useRef, useEffect } from "react";
import { Loader } from "@/components/ai-elements/loader";

function Bubble({ role, children }: { role: string, children: React.ReactNode }) {
  if (role === "user") {
    return (
      <div className="flex justify-end mb-2">
        <div className="bg-purple-600 text-white px-5 py-3 rounded-2xl rounded-br-sm max-w-sm break-words shadow font-medium">
          {children}
        </div>
      </div>
    );
  }
  // AI/assistant bubble
  return (
    <div className="flex justify-start mb-2">
      <div className="bg-white border border-purple-100 text-gray-900 px-5 py-3 rounded-2xl rounded-bl-sm max-w-sm break-words shadow-sm font-normal">
        {children}
      </div>
    </div>
  );
}

export default function ChatBox({ conversationId, chatTitle }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi there! How can I help you today?" }
  ]);
  const [loading, setLoading] = useState(false);
  const [currentConvId, setCurrentConvId] = useState<string | null>(conversationId ?? null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!conversationId) {
      setMessages([{ role: "assistant", content: "Hi there! How can I help you today?" }]);
      setCurrentConvId(null);
      return;
    }
    async function loadHistory() {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/messages?conversationId=${conversationId}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setMessages(data.messages?.length > 0 ? data.messages : [{ role: "assistant", content: chatTitle || "Chat started." }]);
      setCurrentConvId(conversationId);
    }
    loadHistory();
  }, [conversationId, chatTitle]);

  async function sendMessage(event) {
    event.preventDefault();
    const input = inputRef.current?.value.trim();
    if (!input) return;

    setMessages(msgs => [...msgs, { role: "user", content: input }]);
    setLoading(true);
    inputRef.current.value = "";

    const token = localStorage.getItem("token");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: input,
          conversationId: currentConvId || undefined
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiResponse = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        aiResponse += chunk;
        setMessages(msgs => {
          const updated = [...msgs];
          if (updated.length && updated[updated.length - 1].role === "assistant") {
            updated[updated.length - 1].content = aiResponse;
          } else {
            updated.push({ role: "assistant", content: aiResponse });
          }
          return updated;
        });
      }
    } catch (err) {
      setMessages(msgs => [
        ...msgs,
        { role: "assistant", content: "Error connecting to AI." }
      ]);
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col w-full h-full justify-between">
      <div className="flex-1 px-0 py-6 md:px-12 overflow-y-auto bg-purple-50">
        {messages.map((msg, i) => (
          <Bubble role={msg.role} key={i}>
            {msg.content}
          </Bubble>
        ))}
        {loading && (
          <div className="flex items-center py-4 text-gray-400 justify-start">
            <Loader className="mr-2" /> AI is typing...
          </div>
        )}
      </div>
      <form className="flex p-4 border-t bg-white gap-2" onSubmit={sendMessage}>
        <input
          ref={inputRef}
          className="input flex-1 rounded-lg border px-4 py-2 focus:ring-1 focus:ring-purple-600"
          placeholder="Type a message..."
        />
        <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-7 py-2 font-bold">
          Send
        </button>
      </form>
    </div>
  );
}
