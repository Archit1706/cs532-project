// components/ChatDownloadButton.tsx
"use client";

import React, { useState } from 'react';
import { Message } from 'types/chat';
import { FaDownload, FaFileDownload, FaFilePdf, FaEllipsisV, FaEnvelope } from 'react-icons/fa';
import jsPDF from 'jspdf';

interface ChatDownloadButtonProps {
  messages: Message[];
}

const ChatDownloadButton: React.FC<ChatDownloadButtonProps> = ({ messages }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);

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

  // Generate PDF from chat messages
  const generatePDF = () => {
    // Create new PDF document
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Chat Export', 14, 22);
    
    // Add date
    doc.setFontSize(12);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Create a simpler PDF without using autoTable
    let yPos = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const textWidth = pageWidth - (margin * 2);
    
    // Add each message to the PDF
    messages.forEach((message, index) => {
      const sender = message.type === 'bot' ? 'Assistant' : 'You';
      
      // Add the sender with styling
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(`${sender}:`, margin, yPos);
      yPos += 7;
      
      // Add the message content with proper wrapping
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      
      // Split message into lines that fit the page width
      const contentLines = doc.splitTextToSize(message.content, textWidth);
      
      // Check if we need to add a new page
      if (yPos + (contentLines.length * 5) > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        yPos = margin;
      }
      
      // Add the content
      doc.text(contentLines, margin, yPos);
      
      // Update position for next message
      yPos += (contentLines.length * 5) + 10;
      
      // Add a separator line except for the last message
      if (index < messages.length - 1) {
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPos - 5, pageWidth - margin, yPos - 5);
        yPos += 5;
      }
      
      // Add a new page if needed for the next message
      if (yPos > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        yPos = margin;
      }
    });
    
    return doc;
  };

  // Handle download as PDF
  const handleDownloadPDF = () => {
    const doc = generatePDF();
    const exportName = `chat-export-${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(exportName);
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

  // Handle email sending preparation
  const handleEmailButtonClick = () => {
    setShowEmailForm(true);
    setShowDropdown(false);
  };

  // Create a mailto URL with PDF attachment
  const prepareEmailWithPDF = (e: React.FormEvent) => {
    e.preventDefault();
    
    // First, generate the PDF
    const doc = generatePDF();
    
    // Convert PDF to base64 data URL
    const pdfData = doc.output('datauristring');
    
    // Create email subject and body
    const subject = encodeURIComponent('Chat Export');
    const body = encodeURIComponent('Here is the chat export you requested.\n\nRegards,');
    
    // Create the mailto URL (note: attaching files via mailto is not widely supported)
    // As a fallback, we'll include a message about the attachment limitations
    const mailtoUrl = `mailto:${emailAddress}?subject=${subject}&body=${body}%0A%0ANote: Email clients typically cannot accept file attachments through browser links. The PDF has been generated and you can download it separately.`;
    
    // Open the email client
    window.open(mailtoUrl, '_blank');
    
    // Also trigger the download for the user to attach manually
    handleDownloadPDF();
    
    // Reset the email form
    setShowEmailForm(false);
    setEmailAddress('');
  };

  // Close the email form
  const handleCloseEmailForm = () => {
    setShowEmailForm(false);
    setEmailAddress('');
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
            <button
              onClick={handleEmailButtonClick}
              className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded flex items-center"
            >
              <FaEnvelope className="mr-2 text-green-500" />
              Email Chat
            </button>
          </div>
        </div>
      )}

      {showEmailForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-slate-800 mb-4">Email Chat Export</h3>
            <form onSubmit={prepareEmailWithPDF}>
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                  Recipient Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="email@example.com"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleCloseEmailForm}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  Send Email
                </button>
              </div>
              <p className="mt-4 text-xs text-slate-500">
                Note: This will open your default email client. You may need to attach the PDF manually 
                as browser security restrictions limit direct file attachments.
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatDownloadButton;