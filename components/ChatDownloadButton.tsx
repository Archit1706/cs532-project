// components/ChatDownloadButton.tsx
"use client";

import React, { useState } from 'react';
import { Message } from 'types/chat';
import { FaDownload, FaFileDownload, FaFilePdf, FaEllipsisV } from 'react-icons/fa';

interface ChatDownloadButtonProps {
  messages: Message[];
}

const ChatDownloadButton: React.FC<ChatDownloadButtonProps> = ({ messages }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  // Convert messages to a downloadable format
  const formatMessagesForExport = () => {
    return {
      timestamp: new Date().toISOString(),
      messages: messages.map(msg => ({
        type: msg.type,
        content: msg.content,
        timestamp: new Date().toISOString()
      }))
    };
  };

  // Handle download as JSON
  const handleDownloadJSON = () => {
    const chatData = formatMessagesForExport();
    const dataStr = JSON.stringify(chatData, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportName = `chat-export-${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportName);
    linkElement.click();
    
    setShowDropdown(false);
  };

  // Handle download as PDF
  const handleDownloadPDF = () => {
    // This would normally use a PDF library, but for now we'll create a simple text version
    alert('PDF export functionality coming soon!');
    setShowDropdown(false);
  };

  // Handle export as markdown text
  const handleDownloadMarkdown = () => {
    let markdown = `# Chat Export\n\n`;
    markdown += `Date: ${new Date().toLocaleDateString()}\n\n`;
    
    messages.forEach((message, index) => {
      const sender = message.type === 'bot' ? 'Assistant' : 'You';
      markdown += `## ${sender} (${index + 1})\n\n${message.content}\n\n`;
    });
    
    const dataUri = `data:text/markdown;charset=utf-8,${encodeURIComponent(markdown)}`;
    const exportName = `chat-export-${new Date().toISOString().slice(0, 10)}.md`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportName);
    linkElement.click();
    
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
        title="Download chat"
      >
        <FaDownload />
      </button>
      
      {showDropdown && (
        <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg border border-slate-200 w-48 z-50">
          <div className="p-2 border-b border-slate-200">
            <h3 className="text-sm font-medium text-slate-700">Export Conversation</h3>
          </div>
          <div className="p-1">
            <button
              onClick={handleDownloadJSON}
              className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded flex items-center"
            >
              <FaFileDownload className="mr-2 text-blue-500" />
              JSON Format
            </button>
            <button
              onClick={handleDownloadMarkdown}
              className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded flex items-center"
            >
              <FaFileDownload className="mr-2 text-purple-500" />
              Markdown Format
            </button>
            <button
              onClick={handleDownloadPDF}
              className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded flex items-center"
            >
              <FaFilePdf className="mr-2 text-red-500" />
              PDF Format
            </button>
          </div>
        </div>
      )}



    </div>
  );
};

export default ChatDownloadButton;