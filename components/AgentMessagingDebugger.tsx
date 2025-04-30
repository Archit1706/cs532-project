"use client";

import React, { useState } from 'react';
import { useChatContext } from 'context/ChatContext';
import { testAgentMessaging, createMockAgent } from '../utils/agentMessaging';
import { FaUser } from 'react-icons/fa';

const AgentMessagingDebugger = () => {
  const { 
    agentContacts, 
    selectedAgentContact, 
    agentMessages, 
    addAgentToContacts, 
    sendMessageToAgent,
    setActiveTab
  } = useChatContext();
  
  const [isOpen, setIsOpen] = useState(false);
  
  const runTest = () => {
    testAgentMessaging(addAgentToContacts, sendMessageToAgent);
    setActiveTab('updates');
  };
  
  const addSingleAgent = () => {
    // Create a random index for variety
    const randomIndex = Math.floor(Math.random() * 20) + 1;
    const agent = createMockAgent(randomIndex);
    addAgentToContacts(agent);
    setActiveTab('updates');
  };
  
  const clearAllAgents = () => {
    // This would need a function in ChatContext to clear agents
    // For now we can just display an alert
    alert("Debug feature: This would clear all agent contacts (not implemented yet)");
  };
  
  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-16 right-4 bg-purple-800 text-white p-2 rounded-md text-xs opacity-50 hover:opacity-100 z-50"
      >
        Debug Agent Messaging
      </button>
    );
  }

  return (
    <div className="fixed bottom-16 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold text-gray-800">Agent Messaging Debug</h3>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-gray-600 hover:text-gray-800"
        >
          ✕
        </button>
      </div>
      
      <div className="mb-4">
        <h4 className="font-semibold text-sm mb-1">Current State:</h4>
        <div className="bg-gray-100 p-2 rounded text-xs font-mono overflow-auto max-h-24">
          <div>Agent Contacts: {agentContacts.length}</div>
          <div>Selected Agent: {selectedAgentContact?.fullName || 'None'}</div>


          <div>Total Messages: {
  Object.values(agentMessages as Record<string, any[]>).reduce(
    (sum, msgs) => sum + msgs.length, 0
  )
}</div>


        </div>
      </div>
      
      <div className="space-y-2">
        <button 
          onClick={runTest}
          className="w-full bg-purple-700 text-white px-3 py-2 rounded hover:bg-purple-800"
        >
          Run Test (Add 3 Agents + Messages)
        </button>
        
        <button 
          onClick={addSingleAgent}
          className="w-full bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
        >
          Add Single Random Agent
        </button>
        
        <button 
          onClick={clearAllAgents}
          className="w-full bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700"
        >
          Clear All Agents (Debug)
        </button>
        
        <button 
          onClick={() => setActiveTab('updates')}
          className="w-full bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700"
        >
          Go To Updates Tab
        </button>
      </div>
      
      <div className="text-xs text-gray-500 mt-4">
        This debugger helps test the agent messaging functionality without requiring actual agents from the API.
      </div>
    </div>
  );
};

export default AgentMessagingDebugger;