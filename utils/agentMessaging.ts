// utils/agentMessaging.ts
import { Agent, Message } from "../types/chat";

/**
 * Formats agent name for display in messages
 * @param agent The agent object
 * @returns Formatted name string
 */
export function formatAgentName(agent: Agent): string {
  return `${agent.fullName}${agent.isTopAgent ? ' ⭐' : ''}`;
}

/**
 * Gets the most recent message for an agent
 * @param agentId The agent's ID
 * @param messages The messages object
 * @returns The most recent message or null
 */
export function getLastMessage(agentId: string, messages: { [agentId: string]: Message[] }): Message | null {
  const agentMessages = messages[agentId] || [];
  if (agentMessages.length === 0) return null;
  
  return agentMessages[agentMessages.length - 1];
}

/**
 * Creates a mock agent for testing
 * @returns A mock agent object
 */
export function createMockAgent(index: number = 0): Agent {
  return {
    businessName: `Golden Real Estate ${index}`,
    encodedZuid: `agent-${index}`,
    fullName: `John Doe ${index}`,
    isTeamLead: index % 3 === 0,
    isTopAgent: index % 2 === 0,
    location: "Chicago, IL",
    numTotalReviews: 25 + index,
    phoneNumber: `(555) 123-${1000 + index}`,
    profileLink: `/agent/${index}`,
    profilePhotoSrc: `https://randomuser.me/api/portraits/${index % 2 ? 'men' : 'women'}/${index % 10}.jpg`,
    reviewExcerpt: "Great agent, very professional and responsive!",
    reviewExcerptDate: "2025-01-15",
    reviewLink: "/reviews/123",
    reviewStarsRating: 4.5,
    reviews: "25 reviews",
    saleCountAllTime: 120 + index,
    saleCountLastYear: 15 + index,
    salePriceRangeThreeYearMax: 1200000,
    salePriceRangeThreeYearMin: 350000,
    username: `johndoe${index}`
  };
}

/**
 * Tests the agent messaging system by creating mock data
 * @param addAgentToContacts The function to add an agent to contacts
 * @param sendMessageToAgent The function to send a message
 */
export function testAgentMessaging(
  addAgentToContacts: (agent: Agent) => void,
  sendMessageToAgent: (agentId: string, message: string) => void
): void {
  // Create three mock agents
  const agents = [
    createMockAgent(1),
    createMockAgent(2),
    createMockAgent(3)
  ];
  
  // Add them to contacts
  agents.forEach(agent => {
    addAgentToContacts(agent);
    
    // Send test messages for each agent
    sendMessageToAgent(agent.encodedZuid, `Hello ${agent.fullName}, I'm interested in buying a home in Chicago.`);
  });
  
  console.log("Agent messaging test complete - added 3 agents with initial messages");
}