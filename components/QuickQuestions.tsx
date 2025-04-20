// components/QuickQuestions.tsx
"use client";

import React from 'react';
import { useChatContext } from '../context/ChatContext';
import { motion, MotionValue } from 'framer-motion';

const QuickQuestions = () => {
  const { setInputMessage, dynamicQuestions } = useChatContext();

  if (!dynamicQuestions || dynamicQuestions.length === 0) {
    return null;
  }

  return (
    <div className="p-3 border-t border-slate-200">
      <div className="flex flex-wrap gap-2">
        {dynamicQuestions.map((question: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | MotionValue<number> | MotionValue<string> | null | undefined, index: React.Key | null | undefined) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (typeof index === 'number' ? index : 0) * 0.1 }}
            onClick={() => setInputMessage(question)}
            className="px-4 py-2 text-sm font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-all hover:scale-105"
          >
            {question}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default QuickQuestions;