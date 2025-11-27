"use client";
import { useState, useRef, useEffect } from "react";
import { Loader } from "@/components/ai-elements/loader";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";

function Bubble({ role, children }: { role: string; children: React.ReactNode }) {
  if (role === "user") {
    return (
      <div className="flex justify-end mb-2">
        <div className="bg-purple-600 text-white px-5 py-3 rounded-2xl rounded-br-sm max-w-sm break-words shadow font-medium">
          {children}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start mb-2">
      <div className="bg-white border border-purple-100 text-gray-900 px-5 py-3 rounded-2xl rounded-bl-sm max-w-[90vw] md:max-w-md break-words shadow-sm font-normal prose prose-zinc">
        {children}
      </div>
    </div>
  );
}

export default function ChatBox({
  conversationId,
  setConversationId,
  chatTitle,
}: {
  conversationId: string | null;
  setConversationId: (id: string | null) => void;
  chatTitle?: string | null;
}) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const scrollRootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function loadHistory(id: string) {
      const res = await fetch(`/api/messages?conversationId=${id}`, {
        credentials: "include",
      });
      const data = await res.json();
      setMessages(
        data.messages?.length
          ? data.messages
          : [{ role: "assistant", content: chatTitle || "Chat started." }],
      );
    }

    if (!conversationId) {
      setMessages([{ role: "assistant", content: "Hi there! How can I help you today?" }]);
      return;
    }
    loadHistory(conversationId);
  }, [conversationId, chatTitle]);

  useEffect(() => {
    if (scrollRootRef.current) {
      scrollRootRef.current.scrollTop = scrollRootRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setLoading(true);

    const body: any = { message: trimmed };
    if (conversationId) body.conversationId = conversationId;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      // new conversation -> fetch latest id
      if (!conversationId) {
        const convRes = await fetch("/api/conversations", {
          credentials: "include",
        });
        if (convRes.ok) {
          const convData = await convRes.json();
          const list = convData.conversations || [];
          if (list.length) {
            const newest = list[list.length - 1];
            setConversationId(newest.id);
          }
        }
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let full = "";
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          full += chunk;
          setMessages((prev) => {
            const updated = [...prev];
            if (updated.length && updated[updated.length - 1].role === "assistant") {
              updated[updated.length - 1].content = full;
            } else {
              updated.push({ role: "assistant", content: full });
            }
            return updated;
          });
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error connecting to AI." },
      ]);
    }
    setLoading(false);
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <ScrollArea.Root type="scroll" className="flex-1 min-h-0 w-full">
        <ScrollArea.Viewport
          ref={scrollRootRef as any}
          className="h-full w-full px-0 py-8 md:px-12 bg-purple-50"
          style={{ maxHeight: "calc(100vh - 170px)", minHeight: 0 }}
        >
          {messages.map((m, i) => (
            <Bubble key={i} role={m.role}>
              {m.role === "assistant" ? (
                <ReactMarkdown
                  components={{
                    h1: ({ node, ...props }) => (
                      <h1 {...props} className="text-xl font-bold mt-2 mb-1 text-purple-700" />
                    ),
                    h2: ({ node, ...props }) => (
                      <h2 {...props} className="text-lg font-semibold mt-2 mb-1 text-purple-700" />
                    ),
                    h3: ({ node, ...props }) => (
                      <h3 {...props} className="font-semibold mt-1 mb-1 text-purple-700" />
                    ),
                    li: ({ node, ...props }) => (
                      <li className="mb-1 list-disc ml-4" {...props} />
                    ),
                  }}
                >
                  {m.content}
                </ReactMarkdown>
              ) : (
                m.content
              )}
            </Bubble>
          ))}
          {loading && (
            <div className="flex items-center py-4 text-gray-400 justify-start">
              <Loader className="mr-2" /> AI is typing...
            </div>
          )}
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar orientation="vertical">
          <ScrollArea.Thumb className="bg-purple-400 rounded-md" />
        </ScrollArea.Scrollbar>
        <ScrollArea.Corner />
      </ScrollArea.Root>
      <form className="flex-shrink-0 flex p-4 border-t bg-white gap-2" onSubmit={sendMessage}>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 rounded-lg"
          placeholder="Type a message..."
        />
        <Button
          type="submit"
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-7 py-2 font-bold"
        >
          Send
        </Button>
      </form>
    </div>
  );
}
