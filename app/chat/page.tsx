"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ChatSidebar from "@/components/ChatSidebar";
import ChatBox from "@/components/ChatBox";

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);
  const [chatTitle, setChatTitle] = useState<string | null>(null);
  const router = useRouter();

  function handleLogout() {
    localStorage.removeItem("token");
    router.push("/auth/login");
  }

  return (
    <div className="h-screen w-screen flex flex-row bg-purple-50">
      <ChatSidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        onSelectConversation={(id, title) => {
          setConvId(id);
          setChatTitle(title);
          setSidebarOpen(false);
        }}
      />
      <div className="flex-1 flex flex-col relative">
        <header className="flex w-full px-8 py-5 justify-between items-center border-b bg-white sticky top-0 z-10">
          <button
            className="btn-ghost text-2xl mr-4"
            style={{ minWidth: 42 }}
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            <svg width={26} height={26}>
              <rect y="4" width="26" height="3" rx="1.5" fill="#a21caf"/>
              <rect y="12" width="26" height="3" rx="1.5" fill="#a21caf"/>
              <rect y="20" width="26" height="3" rx="1.5" fill="#a21caf"/>
            </svg>
          </button>
          <h1 className="text-2xl font-bold mx-auto text-center select-none tracking-tight">Query-Mate-AI</h1>
          <button className="ml-auto bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-6 py-2 font-bold" onClick={handleLogout}>
            Logout
          </button>
        </header>
        <div className="flex-1 flex">
          <ChatBox conversationId={convId} chatTitle={chatTitle} />
        </div>
      </div>
    </div>
  );
}
