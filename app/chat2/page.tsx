
import React from "react";
import Sidebar from "../../components/chat2/Sidebar"; // Navigation menu
import ChatWindow from "../../components/chat2/ChatWindow"; // Middle panel chat area
import DetailsPanel from "../../components/chat2/DetailsPanel"; // Right panel for results (optional)

const ChatPage = () => {
    return (
        <div className="flex h-screen overflow-hidden">
            {/* Left Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
                <Sidebar />
            </aside>

            {/* Middle Panel */}
            <main className="flex-1 overflow-y-auto bg-gray-50">
                <ChatWindow />
            </main>

            {/* Right Panel */}
            <aside className="w-96 bg-white border-l border-gray-200 hidden lg:block">
                <DetailsPanel />
            </aside>
        </div>
    );
};

export default ChatPage;