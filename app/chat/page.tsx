"use client";

import React, { useState } from 'react';
import Link from 'next/link';

interface Message {
    id: number;
    type: 'user' | 'bot';
    content: string;
}

const Chat = () => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            type: 'bot',
            content: 'I can help you search properties, track market trends, set preferences, and answer legal questions. What would you like to know?'
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputMessage.trim()) return;

        const userMessage: Message = {
            id: messages.length + 1,
            type: 'user',
            content: inputMessage
        };
        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);

        // Simulate bot response (replace with actual API call)
        setTimeout(() => {
            const botMessage: Message = {
                id: messages.length + 2,
                type: 'bot',
                content: 'This is a sample response. Property Detail in LA - 3 bed, 2 bath, 1,500 sqft, $1.2M. Would you like to see more details?'
            };
            setMessages(prev => [...prev, botMessage]);
            setIsLoading(false);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="container mx-auto p-6 flex gap-6">
                {/* Left Panel: Chat UI */}
                <div className="w-1/2">
                    <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-slate-200 flex flex-col h-[600px]">
                        {/* Messages Container */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] p-4 rounded-2xl ${message.type === 'user'
                                            ? 'bg-slate-900 text-white rounded-tr-none'
                                            : 'bg-white/95 text-slate-800 border border-slate-200 rounded-tl-none'
                                            }`}
                                    >
                                        {message.content}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white/95 border border-slate-200 p-4 rounded-2xl rounded-tl-none">
                                        <div className="flex space-x-2">
                                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Message Input */}
                        <div className="p-4 border-t border-slate-200">
                            <form onSubmit={handleSendMessage} className="relative">
                                <input
                                    type="text"
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    placeholder="Type your question here..."
                                    className="w-full p-4 pr-16 bg-white text-slate-800 placeholder:text-slate-400 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-200 focus:border-slate-400 outline-none transition-all duration-200"
                                />
                                <button
                                    type="submit"
                                    disabled={!inputMessage.trim() || isLoading}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors duration-200 disabled:bg-slate-300"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Dynamic Content */}
                <div className="w-1/2">
                    <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-slate-200">
                        <h2 className="text-2xl font-semibold text-slate-800 mb-6">Market Overview</h2>
                        <div className="space-y-6">
                            <div className="p-6 bg-white rounded-xl border border-slate-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-slate-800">Boston, MA</h3>
                                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm">
                                        Updated today
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600">Median Home Price</span>
                                        <div>
                                            <span className="font-medium text-slate-800">$785,000</span>
                                            <span className="ml-2 text-emerald-600 text-sm">+3.2%</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600">Days on Market</span>
                                        <div>
                                            <span className="font-medium text-slate-800">24 days</span>
                                            <span className="ml-2 text-rose-600 text-sm">-5%</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600">Buyer Demand</span>
                                        <span className="font-medium text-slate-800">High</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <span className="px-4 py-2 bg-white text-slate-700 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors duration-200 cursor-pointer">
                                    🔥 Hottest Listings
                                </span>
                                <span className="px-4 py-2 bg-white text-slate-700 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors duration-200 cursor-pointer">
                                    💎 Best Value Homes
                                </span>
                                <span className="px-4 py-2 bg-white text-slate-700 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors duration-200 cursor-pointer">
                                    🆕 New to Market
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chat;
