// components/layout/ChatPanel.tsx
"use client";

import React from 'react';
import MessageBubble from '../MessageBubble';
import MessageInput from '../MessageInput';
import QuickQuestions from '../QuickQuestions';
import { useChatContext } from 'context/ChatContext';

const ChatPanel = () => {
    const { messages, isLoading, isTranslating, messagesEndRef } = useChatContext();

    return (
        <div className="w-1/2 flex flex-col h-full bg-white rounded-2xl shadow-emerald-900 shadow-xl">
            <div className="flex-1 overflow-y-auto p-6 space-y-4 rounded-2xl" id="chat-container">
                {messages.map((message: any) => (
                    <MessageBubble key={message.id} message={message} />
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

                {isTranslating && (
                    <div className="text-center text-sm text-slate-500 mt-2">
                        <div className="inline-flex items-center">
                            <span>Translating</span>
                            <span className="ml-1 flex space-x-1">
                                <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"></span>
                                <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                            </span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 py-3">
                <QuickQuestions />
            </div>

            <div className="px-4 py-3">
                <MessageInput messagesEndRef={messagesEndRef} />
            </div>
        </div>
    );
};

export default ChatPanel;



// // components/layout/ChatPanel.tsx
// "use client";

// import React from 'react';
// import MessageBubble from '../MessageBubble';
// import MessageInput from '../MessageInput';
// import LanguageSelector from '../LanguageSelector';
// import QuickQuestions from '../QuickQuestions';
// import { useChatContext } from 'context/ChatContext';

// const ChatPanel = () => {
//     const { messages, isLoading, isTranslating, messagesEndRef } = useChatContext();

//     return (
//         <div className="w-2/5">
//             <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-slate-200 flex flex-col h-[600px]">
//                 <div id="chat-container" className="flex-1 overflow-y-auto p-6 space-y-4 chat-scroll">
//                     {messages.map((message) => (
//                         <MessageBubble key={message.id} message={message} />
//                     ))}
//                     {isLoading && (
//                         <div className="flex justify-start">
//                             <div className="bg-white/95 border border-slate-200 p-4 rounded-2xl rounded-tl-none">
//                                 <div className="flex space-x-2">
//                                     <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
//                                     <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
//                                     <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
//                                 </div>
//                             </div>
//                         </div>
//                     )}
//                     {isTranslating && (
//                         <div className="text-center text-sm text-slate-500 mt-2">
//                             <div className="inline-flex items-center">
//                                 <span>Translating</span>
//                                 <span className="ml-1 flex space-x-1">
//                                     <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"></span>
//                                     <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
//                                     <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
//                                 </span>
//                             </div>
//                         </div>
//                     )}
//                     <div ref={messagesEndRef} />
//                 </div>

//                 <LanguageSelector />
//                 <QuickQuestions />
//                 <MessageInput />
//             </div>
//         </div>
//     );
// };

// export default ChatPanel;
