// components/QuickQuestions.tsx
"use client";

import React from 'react';
import { useChatContext } from '../context/ChatContext';

const QuickQuestions = () => {
  const { setInputMessage } = useChatContext();

  return (
    <div className="p-3 border-t border-slate-200 flex flex-wrap gap-2">
      <button
        onClick={() => setInputMessage("What's the market like in this area?")}
        className="px-4 py-2 text-sm font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200"
      >
        Market trends?
      </button>
      <button
        onClick={() => setInputMessage("What are property taxes like here?")}
        className="px-4 py-2 text-sm font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200"
      >
        Property taxes?
      </button>
      <button
        onClick={() => setInputMessage("Are home prices rising or falling here?")}
        className="px-4 py-2 text-sm font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200"
      >
        Price trends?
      </button>
    </div>
  );
};

export default QuickQuestions;
