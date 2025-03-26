// components/MessageInput.tsx
"use client";

import React, { useState } from 'react';
import { useChatContext } from '../context/ChatContext';

interface Props {
    messagesEndRef: React.RefObject<HTMLDivElement>;
}

const MessageInput: React.FC<Props> = ({ messagesEndRef }) => {
    const { inputMessage, setInputMessage, isLoading, zipCode, setZipCode, handleSendMessage } = useChatContext();
    const handleZipCodeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        if (value.length <= 5) {
            setZipCode(value);
            if (value.length === 5) {
                // Optional zip fetch logic
            }
        }
    };

    return (
        <div className="p-4 border-t border-slate-200">
            <div className="flex gap-2 mb-2 justify-center items-center">
                <div className="relative flex-1">
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Type your question here..."
                        className="w-full p-4 pr-16 bg-white text-slate-800 placeholder:text-slate-400 border border-slate-200 rounded-xl"
                    />
                    <button
                        type="submit"
                        onClick={(e) => {
                            e.preventDefault();
                            handleSendMessage(inputMessage, setInputMessage);
                        }}
                        disabled={!inputMessage.trim() || isLoading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:bg-slate-300"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </div>

                <div className="w-36">
                    <div className="bg-teal-500 text-black rounded-xl overflow-hidden focus-within:bg-teal-400">
                        <input
                            id="zipCode"
                            type="text"
                            value={zipCode}
                            onChange={handleZipCodeInput}
                            placeholder="Enter Zip Code"
                            className="w-full p-3 bg-transparent placeholder-white/80 text-white border-transparent border-3 rounded-xl focus:border-teal-700 text-center outline-none"
                            maxLength={5}
                            inputMode="numeric"
                        />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default MessageInput;
