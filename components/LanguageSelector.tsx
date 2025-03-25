// components/LanguageSelector.tsx
"use client";

import React from 'react';
import { useChatContext } from 'context/ChatContext';
import { languageOptions } from 'utils/translation';

const LanguageSelector = () => {
    const { selectedLanguage, isTranslating, setSelectedLanguage } = useChatContext();

    return (
        <div className="p-3 border-t border-slate-200">
            <div className="flex items-center justify-between">
                <label htmlFor="language-select" className="block text-sm font-medium text-slate-700">
                    Chat Language:
                </label>
                {isTranslating && (
                    <div className="flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                        <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Translating...
                    </div>
                )}
            </div>
            <div className="relative mt-1">
                <select
                    id="language-select"
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    disabled={isTranslating}
                >
                    {languageOptions.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                            {lang.name}
                        </option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default LanguageSelector;
