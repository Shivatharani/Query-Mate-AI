"use client";
import { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  Cross2Icon,
  DotsHorizontalIcon,
} from "@radix-ui/react-icons";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function titleFromMessages(messages: any[]) {
  const firstUserMsg = messages?.find((m) => m.role === "user")?.content || "";
  return firstUserMsg.split(/\s+/).slice(0, 5).join(" ") || "New Chat";
}

export default function ChatSidebar({
  open,
  setOpen,
  onSelectConversation,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  onSelectConversation: (id: string | null, title: string) => void;
}) {
  const [user, setUser] = useState<any>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [messagesByConv, setMessagesByConv] = useState<Record<string, any[]>>({});
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    console.log("[ChatSidebar] mounted - using cookies for auth");

    async function load() {
      try {
        // 1) session
        const sessionRes = await fetch("/api/auth/sessions", {
          credentials: "include",
        });
        console.log("[ChatSidebar] /api/auth/sessions", sessionRes.status);
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          setUser(sessionData.user || null);
        } else {
          console.error("[ChatSidebar] session failed:", await sessionRes.text());
          return;
        }

        // 2) conversations
        const convRes = await fetch("/api/conversations", {
          credentials: "include",
        });
        console.log("[ChatSidebar] /api/conversations", convRes.status);
        if (!convRes.ok) {
          console.error("[ChatSidebar] conversations failed:", await convRes.text());
          setChats([]);
          setMessagesByConv({});
          return;
        }
        const convData = await convRes.json();
        const list = convData.conversations || [];
        setChats(list);

        // 3) messages for titles
        const msgMap: Record<string, any[]> = {};
        for (const c of list) {
          try {
            const r = await fetch(`/api/messages?conversationId=${c.id}`, {
              credentials: "include",
            });
            if (!r.ok) continue;
            const d = await r.json();
            msgMap[c.id] = d.messages || [];
          } catch (e) {
            console.warn("[ChatSidebar] message fetch error", c.id, e);
          }
        }
        setMessagesByConv(msgMap);
      } catch (e) {
        console.error("[ChatSidebar] load error", e);
      }
    }

    load();
  }, []);

  const closeSidebar = () => setOpen(false);

  const getChatTitle = (chat: any) => {
    if (chat.title && chat.title !== "New Chat" && chat.title !== "New Conversation") {
      return chat.title.trim();
    }
    return titleFromMessages(messagesByConv[chat.id] || []);
  };

  const filteredChats = chats.filter((chat) => {
    const chatTitle = getChatTitle(chat);
    return !search || chatTitle.toLowerCase().includes(search.toLowerCase());
  });

  async function handleDelete(id: string) {
    if (!id) return;
    if (!confirm("Delete this conversation and all its messages?")) return;

    try {
      const res = await fetch("/api/conversations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        alert("Failed to delete conversation");
        return;
      }
      setChats((prev) => prev.filter((c) => c.id !== id));
      setMessagesByConv((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      if (activeId === id) setActiveId(null);
    } catch {
      alert("Error deleting conversation");
    }
  }

  async function handleEdit(id: string) {
    const current = chats.find((c) => c.id === id);
    const currentTitle = current ? getChatTitle(current) : "";
    const newTitle = prompt("Edit chat title", currentTitle);
    if (!newTitle?.trim()) return;

    try {
      const res = await fetch("/api/conversations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, title: newTitle.trim() }),
      });
      if (!res.ok) {
        alert("Failed to update title");
        return;
      }
      const data = await res.json();
      setChats((prev) => prev.map((c) => (c.id === id ? data.conversation : c)));
    } catch {
      alert("Error updating title");
    }
  }

  return (
    <>
      <aside
        className={`fixed z-30 left-0 top-0 h-full w-80 transition-transform duration-300 ease-in-out border-r shadow-lg bg-white
        ${open ? "translate-x-0" : "-translate-x-80"}`}
      >
        <Button
          variant="ghost"
          className="absolute top-4 right-4 rounded-full"
          onClick={closeSidebar}
          aria-label="Close sidebar"
          size="icon"
        >
          <Cross2Icon className="w-6 h-6" />
        </Button>

        <div className="flex flex-col items-center py-6 border-b">
          <div className="rounded-full w-14 h-14 bg-gradient-to-br from-purple-400 to-fuchsia-400 flex items-center justify-center text-white text-2xl font-bold mb-2 uppercase">
            {user?.name?.[0] ?? "U"}
          </div>
          <div className="font-bold">{user?.name ?? "User"}</div>
          <div className="text-xs text-gray-400">{user?.email ?? "email"}</div>
        </div>

        <div className="flex flex-col px-5 pt-6 gap-3">
          <Button
            variant="purple"
            onClick={() => {
              setActiveId(null);
              onSelectConversation(null, "New Chat");
            }}
            className="flex items-center gap-2 justify-center"
          >
            <PlusIcon className="w-5 h-5" /> New Chat
          </Button>
          <div className="flex items-center rounded-lg border px-2 py-1">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search chats..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-2 py-1 outline-none bg-transparent text-sm"
            />
          </div>
        </div>

        <nav className="flex-1 mt-2 mb-6 px-3">
          <div className="mb-2 mt-4 font-semibold text-sm tracking-wide text-gray-600">
            Previous Chats
          </div>
          <ScrollArea.Root className="h-[360px] w-full rounded-md border">
            <ScrollArea.Viewport className="w-full h-full py-1">
              <div className="flex flex-col gap-1 pr-3">
                {filteredChats.length > 0 ? (
                  filteredChats.map((chat) => {
                    const chatTitle = getChatTitle(chat);
                    return (
                      <div
                        key={chat.id}
                        className={`group flex items-center rounded hover:bg-purple-100 ${
                          activeId === chat.id ? "bg-purple-200" : ""
                        }`}
                      >
                        <button
                          className="text-left flex-1 px-3 py-2 font-medium text-xs truncate"
                          onClick={() => {
                            setActiveId(chat.id);
                            onSelectConversation(chat.id, chatTitle);
                            closeSidebar();
                          }}
                        >
                          {chatTitle}
                        </button>
                        <DropdownMenu.Root>
                          <DropdownMenu.Trigger asChild>
                            <button
                              className="p-1 mr-2 rounded-full hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label="Chat options"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <DotsHorizontalIcon className="w-5 h-5 text-gray-500" />
                            </button>
                          </DropdownMenu.Trigger>
                          <DropdownMenu.Content
                            side="right"
                            align="start"
                            className="z-[99] bg-white border rounded shadow text-sm"
                          >
                            <DropdownMenu.Item
                              onSelect={() => handleEdit(chat.id)}
                              className="px-3 py-1.5 cursor-pointer hover:bg-gray-100"
                            >
                              Edit
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                              onSelect={() => handleDelete(chat.id)}
                              className="px-3 py-1.5 text-red-600 cursor-pointer hover:bg-gray-100"
                            >
                              Delete
                            </DropdownMenu.Item>
                          </DropdownMenu.Content>
                        </DropdownMenu.Root>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-gray-400 text-xs py-2">
                    No previous chats found.
                  </div>
                )}
              </div>
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar orientation="vertical">
              <ScrollArea.Thumb className="bg-purple-400 rounded-md" />
            </ScrollArea.Scrollbar>
            <ScrollArea.Corner />
          </ScrollArea.Root>
        </nav>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-10"
          onClick={closeSidebar}
          aria-label="Close sidebar"
          tabIndex={-1}
        />
      )}
    </>
  );
}
