"use client";
import { useState, useEffect } from "react";
import { MagnifyingGlassIcon, PlusIcon, Cross2Icon } from "@radix-ui/react-icons";

function titleFromMessages(messages: any[]) {
  const firstUserMsg = messages?.find(m => m.role === "user")?.content || "";
  return firstUserMsg.split(/\s+/).slice(0, 5).join(" ") || "New Chat";
}

export default function ChatSidebar({ open, setOpen, onSelectConversation }) {
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [messagesByConv, setMessagesByConv] = useState<Record<string, any[]>>({});
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    async function fetchProfile() {
      if (token) {
        const res = await fetch('/api/auth/sessions', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setUser(data.user || null);
        const chatRes = await fetch('/api/conversations', { headers: { Authorization: `Bearer ${token}` } });
        const chatData = await chatRes.json();
        setChats(chatData.conversations || []);

        // Fetch messages for all conversations
        const msgMap: Record<string, any[]> = {};
        await Promise.all(
          (chatData.conversations || []).map(async (chat: any) => {
            const r = await fetch(`/api/messages?conversationId=${chat.id}`, { headers: { Authorization: `Bearer ${token}` } });
            const d = await r.json();
            msgMap[chat.id] = d.messages || [];
          })
        );
        setMessagesByConv(msgMap);
      }
    }
    fetchProfile();
  }, []);

  const filteredChats = chats.filter(chat => {
    const chatTitle = titleFromMessages(messagesByConv[chat.id] || []);
    return !search || chatTitle.toLowerCase().includes(search.toLowerCase());
  });

  const closeSidebar = () => setOpen(false);

  return (
    <>
      <aside className={`fixed z-30 left-0 top-0 h-full w-80 transition-transform duration-300 ease-in-out border-r shadow-lg
        bg-white ${open ? "translate-x-0" : "-translate-x-80"}`}>
        {/* Close button for all screen sizes */}
        <button
          className="absolute top-5 right-4 text-gray-400"
          onClick={closeSidebar}
          aria-label="Close sidebar"
        >
          <Cross2Icon className="w-7 h-7" />
        </button>
        {/* Profile */}
        <div className="flex flex-col items-center py-6 border-b">
          <div className="rounded-full w-14 h-14 bg-gradient-to-br from-purple-400 to-fuchsia-400 flex items-center justify-center text-white text-2xl font-bold mb-2 uppercase">
            {user?.name?.[0] ?? "U"}
          </div>
          <div className="font-bold">{user?.name ?? "User"}</div>
          <div className="text-xs text-gray-400">{user?.email ?? "email"}</div>
        </div>
        {/* New chat */}
        <div className="flex flex-col px-5 pt-6 gap-3">
          <button
            title="New Chat"
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex gap-2 items-center justify-center font-bold"
            onClick={() => window.location.reload()}
          >
            <PlusIcon className="w-5 h-5" /> New Chat
          </button>
          {/* Search bar */}
          <div className="flex items-center rounded-lg border px-2 py-1">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search chats..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 px-2 py-1 outline-none bg-transparent text-sm"
            />
          </div>
        </div>
        {/* Previous chats */}
        <nav className="flex-1 overflow-y-auto px-5 py-2">
          <div className="mb-2 mt-6 font-semibold text-sm tracking-wide text-gray-600">Previous Chats</div>
          <div className="flex flex-col gap-2">
            {filteredChats.length > 0
              ? filteredChats.map(chat => {
                  const chatTitle = titleFromMessages(messagesByConv[chat.id] || []);
                  return (
                    <button
                      key={chat.id}
                      className={`w-full text-left px-3 py-2 rounded hover:bg-purple-100 font-medium text-xs truncate ${
                        activeId === chat.id ? "bg-purple-200" : ""
                      }`}
                      onClick={() => {
                        setActiveId(chat.id);
                        onSelectConversation?.(chat.id, chatTitle);
                        closeSidebar();
                      }}
                    >
                      {chatTitle}
                    </button>
                  );
                })
              : <div className="text-gray-400 text-xs py-2">No previous chats found.</div>}
          </div>
        </nav>
      </aside>
      {/* Overlay always covers when sidebar open */}
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

