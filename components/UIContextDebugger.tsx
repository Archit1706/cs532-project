// components/UIContextDebugger.tsx
"use client";

import React, { useState } from 'react';
import { useChatContext } from '../context/ChatContext';

const UIContextDebugger: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const context = useChatContext();
  
  // Extract only the relevant UI context properties
  const uiContext = {
    selectedProperty: context.selectedProperty ? {
      id: context.selectedProperty.id,
      address: context.selectedProperty.address,
      zpid: context.selectedProperty.zpid,
      price: context.selectedProperty.price,
      beds: context.selectedProperty.beds,
      baths: context.selectedProperty.baths,
      type: context.selectedProperty.type,
    } : null,
    propertyDetails: context.propertyDetails ? {
      address: context.propertyDetails.basic_info?.address?.full,
      price: context.propertyDetails.basic_info?.price,
      yearBuilt: context.propertyDetails.basic_info?.yearBuilt,
      taxHistory: context.propertyDetails.taxes?.length > 0 
        ? context.propertyDetails.taxes.slice(0, 2).map((tax: { time: string | number | Date; taxPaid: any; }) => ({ 
            year: new Date(tax.time).getFullYear(), 
            amount: tax.taxPaid 
          }))
        : [],
    } : null,
    isPropertyChat: context.isPropertyChat,
    zipCode: context.zipCode,
    activeTab: context.activeTab,
    propertiesCount: context.properties.length,
    restaurantCount: context.locationData?.restaurants?.length || 0,
    transitCount: context.locationData?.transit?.length || 0,
    hasMarketData: !!context.marketTrends,
    marketLocation: context.marketTrends?.location,
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded-md text-xs opacity-50 hover:opacity-100 z-50"
      >
        Debug UI Context
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-lg max-h-[80vh] overflow-auto z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold text-gray-800">UI Context Debug</h3>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-gray-600 hover:text-gray-800"
        >
          ✕
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-blue-50 p-2 rounded text-sm">
          <span className="font-semibold">ZIP Code:</span> {uiContext.zipCode || 'None'}
        </div>
        <div className="bg-blue-50 p-2 rounded text-sm">
          <span className="font-semibold">Active Tab:</span> {uiContext.activeTab}
        </div>
        <div className="bg-blue-50 p-2 rounded text-sm">
          <span className="font-semibold">Property Count:</span> {uiContext.propertiesCount}
        </div>
        <div className="bg-blue-50 p-2 rounded text-sm">
          <span className="font-semibold">Restaurant Count:</span> {uiContext.restaurantCount}
        </div>
        <div className="bg-blue-50 p-2 rounded text-sm">
          <span className="font-semibold">Transit Count:</span> {uiContext.transitCount}
        </div>
        <div className="bg-blue-50 p-2 rounded text-sm">
          <span className="font-semibold">Market Data:</span> {uiContext.hasMarketData ? 'Yes' : 'No'}
        </div>
      </div>
      
      {uiContext.selectedProperty && (
        <div className="mb-4">
          <h4 className="font-semibold text-gray-700 mb-2">Selected Property:</h4>
          <div className="bg-green-50 p-3 rounded text-sm">
            <div><span className="font-semibold">Address:</span> {uiContext.selectedProperty.address}</div>
            <div><span className="font-semibold">Price:</span> ${uiContext.selectedProperty.price?.toLocaleString()}</div>
            <div><span className="font-semibold">Type:</span> {uiContext.selectedProperty.type}</div>
            <div><span className="font-semibold">Beds/Baths:</span> {uiContext.selectedProperty.beds}bd/{uiContext.selectedProperty.baths}ba</div>
            <div><span className="font-semibold">ZPID:</span> {uiContext.selectedProperty.zpid}</div>
          </div>
        </div>
      )}
      
      {uiContext.propertyDetails && (
        <div className="mb-4">
          <h4 className="font-semibold text-gray-700 mb-2">Property Details:</h4>
          <div className="bg-yellow-50 p-3 rounded text-sm">
            <div><span className="font-semibold">Full Address:</span> {uiContext.propertyDetails.address}</div>
            <div><span className="font-semibold">Year Built:</span> {uiContext.propertyDetails.yearBuilt}</div>
            
            {uiContext.propertyDetails.taxHistory && uiContext.propertyDetails.taxHistory.length > 0 && (
              <div>
                <span className="font-semibold">Tax History:</span>
                <ul className="pl-5 list-disc">
                  {uiContext.propertyDetails.taxHistory.map((tax: { year: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; amount: { toLocaleString: () => string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; }; }, idx: React.Key | null | undefined) => (
                    <li key={idx}>{tax.year}: ${tax.amount?.toLocaleString()}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="text-xs text-gray-500 mt-2">
        This debug panel shows the current UI context available to the chat LLM.
      </div>
    </div>
  );
};

export default UIContextDebugger;