// components/FeatureDebug.tsx
"use client";

import React, { useState } from 'react';
import { useFeatureExtractor } from '../hooks/useFeatureExtractor';
import { FeatureExtraction } from '../types/chat';

const FeatureDebug: React.FC = () => {
  const [query, setQuery] = useState('');
  const [features, setFeatures] = useState<FeatureExtraction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { extract } = useFeatureExtractor();

  const handleExtract = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const extractedFeatures = await extract(query);
      setFeatures(extractedFeatures);
      console.log('Features extracted:', extractedFeatures);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Extraction error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderObjectAsTable = (obj: any, level = 0) => {
    if (obj === null || obj === undefined) return <span className="text-gray-400">null</span>;
    
    if (typeof obj !== 'object') {
      return <span>{String(obj)}</span>;
    }
    
    if (Array.isArray(obj)) {
      return (
        <div className="pl-4">
          {obj.length === 0 ? (
            <span className="text-gray-400">[]</span>
          ) : (
            obj.map((item, index) => (
              <div key={index} className="mb-1">
                <span className="text-gray-500">{index}:</span> {renderObjectAsTable(item, level + 1)}
              </div>
            ))
          )}
        </div>
      );
    }
    
    const entries = Object.entries(obj);
    if (entries.length === 0) return <span className="text-gray-400">{'{}'}</span>;
    
    return (
      <div className={level > 0 ? "pl-4" : ""}>
        {entries.map(([key, value]) => (
          <div key={key} className="mb-1">
            <span className="font-medium text-emerald-700">{key}:</span> {renderObjectAsTable(value, level + 1)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow border border-gray-200 max-w-3xl mx-auto my-8">
      <h2 className="text-xl font-bold mb-4 text-emerald-800">Feature Extractor Debug</h2>
      
      <div className="mb-4">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter a real estate query to extract features..."
          className="w-full p-3 border border-gray-300 rounded text-gray-800 min-h-[100px]"
        />
      </div>
      
      <button
        onClick={handleExtract}
        disabled={isLoading || !query.trim()}
        className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Extracting...' : 'Extract Features'}
      </button>
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}
      
      {features && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2 text-emerald-700">Extracted Features</h3>
          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            {renderObjectAsTable(features)}
          </div>
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-500">
        <p>This component helps debug the feature extraction functionality of the real estate AI application.</p>
        <p>Enter any real estate related query in the box above to see what features are extracted.</p>
        <p className="mt-2 text-xs">Results are also logged to the browser console in detail.</p>
      </div>
    </div>
  );
};

export default FeatureDebug;