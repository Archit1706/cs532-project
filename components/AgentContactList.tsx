"use client";

import React from 'react';
import { useChatContext } from 'context/ChatContext';
import { FaUser } from 'react-icons/fa';

const AgentContactList = () => {
  const { agentContacts, selectedAgentContact, setSelectedAgentContact } = useChatContext();

  if (!agentContacts || agentContacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-full">
        <div className="bg-slate-100 p-4 rounded-full mb-4">
          <FaUser className="w-12 h-12 text-slate-400" />
        </div>
        <p className="text-lg font-medium text-slate-600">No agent conversations yet</p>
        <p className="text-sm text-slate-500 mt-2">
          Start a conversation by clicking "Send Message" on an agent's profile.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-200 h-full overflow-y-auto bg-white">
      {agentContacts.map((agent: { encodedZuid: React.Key | null | undefined; profilePhotoSrc: string | undefined; fullName: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; businessName: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; isTopAgent: any; }) => (
        <div 
          key={agent.encodedZuid} 
          className={`p-4 flex items-center cursor-pointer hover:bg-slate-50 transition-colors ${
            selectedAgentContact?.encodedZuid === agent.encodedZuid ? 'bg-slate-100' : ''
          }`}
          onClick={() => setSelectedAgentContact(agent)}
        >
          <img
            src={agent.profilePhotoSrc}
            alt={String(agent.fullName)}
            className="w-12 h-12 rounded-full object-cover mr-4"
          />
          <div className="flex-grow">
            <h3 className="font-medium text-slate-800">{agent.fullName}</h3>
            <p className="text-sm text-slate-500">{agent.businessName}</p>
          </div>
          <div className="text-xs text-slate-400">
            {agent.isTopAgent && (
              <span className="bg-teal-100 text-teal-700 px-2 py-0.5 rounded-md">
                Top Agent
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AgentContactList;