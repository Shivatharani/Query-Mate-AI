"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ChatSidebar from "@/components/ChatSidebar";
import ChatBox from "@/components/ChatBox";
import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/toastify";

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);
  const [chatTitle, setChatTitle] = useState<string | null>(null);
  const router = useRouter();

  function handleLogout() {
    localStorage.removeItem("token");
    showToast("info", "Logged out successfully.");
    router.push("/auth/login");
  }

  return (
    <div className="h-screen w-screen flex bg-purple-50 overflow-hidden">
      <ChatSidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        onSelectConversation={(id, title) => {
          setConvId(id);
          setChatTitle(title);
          setSidebarOpen(false);
        }}
      />
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="flex w-full items-center justify-between px-8 py-6 border-b bg-white sticky top-0 z-20">
          <Button
            variant="ghost"
            size="icon"
            className="mr-4"
            onClick={() => setSidebarOpen(o => !o)}
            aria-label={sidebarOpen ? "Close Sidebar" : "Open Sidebar"}
          >
            <svg width={26} height={26}>
              <rect y="4" width="26" height="3" rx="1.5" fill="#a21caf" />
              <rect y="12" width="26" height="3" rx="1.5" fill="#a21caf" />
              <rect y="20" width="26" height="3" rx="1.5" fill="#a21caf" />
            </svg>
          </Button>
          <div className="flex-1 flex justify-center items-center">
            <h1 className="text-2xl font-bold select-none tracking-tight text-purple-600">
              QUERY MATE AI
            </h1>
          </div>
          <Button
            variant="default"
            className="ml-auto bg-purple-600 hover:bg-purple-700"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </header>
        <div className="flex-1 h-0 flex flex-col">
          <ChatBox
            conversationId={convId}
            setConversationId={setConvId}
            chatTitle={chatTitle}
          />
        </div>
      </div>
    </div>
  );
}
