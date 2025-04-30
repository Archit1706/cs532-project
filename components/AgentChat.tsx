"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useChatContext } from 'context/ChatContext';
import { FaChevronLeft, FaStar, FaPhoneAlt, FaEnvelope } from 'react-icons/fa';
import { MdSend } from 'react-icons/md';

const AgentChat = () => {
  const { selectedAgentContact, setSelectedAgentContact, agentMessages, sendMessageToAgent } = useChatContext();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [agentMessages, selectedAgentContact]);

  if (!selectedAgentContact) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-full">
        <p className="text-lg font-medium text-slate-600">Select an agent to start chatting</p>
      </div>
    );
  }

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    sendMessageToAgent(selectedAgentContact.encodedZuid, message);
    setMessage('');
  };

  // Get messages for the selected agent
  const messages = agentMessages[selectedAgentContact.encodedZuid] || [];

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-teal-700 text-white p-4 flex items-center">
        <button 
          className="mr-3 text-white hover:text-teal-200"
          onClick={() => setSelectedAgentContact(null)}
        >
          <FaChevronLeft />
        </button>
        <img
          src={selectedAgentContact.profilePhotoSrc}
          alt={selectedAgentContact.fullName}
          className="w-10 h-10 rounded-full object-cover mr-3"
        />
        <div className="flex-grow">
          <div className="font-semibold">{selectedAgentContact.fullName}</div>
          <div className="text-xs flex items-center">
            <span className="flex items-center mr-2">
              <FaStar className="text-yellow-300 mr-1" />
              {selectedAgentContact.reviewStarsRating}
            </span>
            {selectedAgentContact.isTopAgent && (
              <span className="bg-teal-900 text-teal-100 px-2 py-0.5 rounded-md text-xs">
                Top Agent
              </span>
            )}
          </div>
        </div>
        <div className="flex">
          <button className="text-white hover:text-teal-200 mx-2">
            <FaPhoneAlt />
          </button>
          <button className="text-white hover:text-teal-200 mx-2">
            <FaEnvelope />
          </button>
        </div>
      </div>
      
      {/* Agent info card */}
      <div className="bg-gradient-to-r from-teal-50 to-blue-50 p-4 border-b border-slate-200">
        <div className="text-sm text-slate-700">
          <p><span className="font-medium">Business:</span> {selectedAgentContact.businessName}</p>
          <p><span className="font-medium">Phone:</span> {selectedAgentContact.phoneNumber}</p>
          <p><span className="font-medium">Sales (last year):</span> {selectedAgentContact.saleCountLastYear} | <span className="font-medium">All time:</span> {selectedAgentContact.saleCountAllTime}</p>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="bg-teal-100 rounded-full p-3 mb-3">
              <FaEnvelope className="text-teal-600 text-xl" />
            </div>
            <p className="text-slate-600">Start your conversation with {selectedAgentContact.fullName}</p>
            <p className="text-sm text-slate-500 mt-1">Messages are private and secure</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg: { id: React.Key | null | undefined; type: string; content: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; }) => (
              <div
                key={msg.id}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-3 ${
                    msg.type === 'user'
                      ? 'bg-teal-600 text-white rounded-br-none'
                      : 'bg-white text-slate-800 rounded-bl-none border border-slate-200'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-200">
        <div className="flex items-center">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border border-slate-300 rounded-l-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-teal-500"
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button
            onClick={handleSendMessage}
            className="bg-teal-600 text-white rounded-r-full py-2 px-4 hover:bg-teal-700 transition-colors"
          >
            <MdSend />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentChat;