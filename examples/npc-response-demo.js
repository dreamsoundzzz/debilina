/**
 * NPC Response Generation Demo
 * 
 * Demonstrates how to set up and use the NPCResponseSystem for
 * generating contextual NPC responses to player messages.
 * 
 * This example shows:
 * - Setting up the NPC with all required systems
 * - Connecting ChatSystem to NPCResponseSystem
 * - Handling player messages and generating responses
 * - Displaying responses in text bubbles
 * - Storing conversations in memory
 */

import { Character } from '../src/physics/Character.js';
import { Vec2 } from '../src/physics/Vec2.js';
import { ChatSystem } from '../src/core/ChatSystem.js';
import { NPCResponseSystem } from '../src/ai/NPCResponseSystem.js';
import OllamaService from '../src/ai/OllamaService.js';
import { MemorySystem } from '../src/ai/MemorySystem.js';
import { EmotionSystem } from '../src/ai/EmotionSystem.js';
import { NeedsSystem } from '../src/ai/NeedsSystem.js';
import { GameEngine } from '../src/core/GameEngine.js';

// Example setup function
function setupNPCResponseDemo() {
  console.log('=== NPC Response Generation Demo ===\n');
  
  // 1. Create the game engine
  const canvas = document.getElementById('gameCanvas');
  const gameEngine = new GameEngine(canvas);
  
  // 2. Create player and NPC characters
  const player = new Character(new Vec2(200, 300), 'Player');
  const npc = new Character(new Vec2(600, 300), 'Alex');
  
  console.log('✓ Created player and NPC characters');
  
  // 3. Set up AI systems for the NPC
  const memorySystem = new MemorySystem(100);
  const emotionSystem = new EmotionSystem();
  const needsSystem = new NeedsSystem();
  
  console.log('✓ Initialized AI systems (Memory, Emotions, Needs)');
  
  // 4. Set up Ollama service
  const ollamaService = new OllamaService(
    'http://localhost:11434',
    'phi3',
    memorySystem
  );
  
  console.log('✓ Connected to Ollama service');
  
  // 5. Create NPC response system
  const npcResponseSystem = new NPCResponseSystem(
    npc,
    ollamaService,
    memorySystem,
    emotionSystem,
    needsSystem
  );
  
  console.log('✓ Created NPC response system');
  
  // 6. Set up chat system
  const chatSystem = new ChatSystem(gameEngine);
  chatSystem.initialize();
  
  console.log('✓ Initialized chat system');
  
  // 7. Connect chat system to NPC response system
  gameEngine.events.on('chat:message', (messageData) => {
    console.log(`\n[Player]: ${messageData.message}`);
    
    // Display player message in text bubble
    chatSystem.processPlayerMessage(player, npc, messageData.message);
    
    // Store in memory
    chatSystem.storeInMemory(memorySystem, 'player', messageData.message);
  });
  
  console.log('✓ Connected chat system to NPC response system');
  
  // 8. Register systems with game engine
  gameEngine.registerSystem({
    update(dt) {
      // Update AI systems
      emotionSystem.update(dt);
      needsSystem.update(dt, true);
      npcResponseSystem.update(dt);
      chatSystem.update(dt);
    },
    render(ctx) {
      // Render characters
      player.render(ctx);
      npc.render(ctx);
      
      // Render NPC responses
      npcResponseSystem.render(ctx);
      
      // Render chat UI
      chatSystem.render(ctx);
    }
  });
  
  console.log('✓ Registered systems with game engine');
  
  // 9. Start the game
  gameEngine.start();
  
  console.log('✓ Game engine started\n');
  console.log('=== Demo Ready ===');
  console.log('Press T to open chat and talk to the NPC!');
  console.log('The NPC will respond based on:');
  console.log('  - Conversation history');
  console.log('  - Current emotional state');
  console.log('  - Physical needs (hunger, thirst, energy)');
  console.log('  - Pain level');
  console.log('  - Recent memories\n');
  
  return {
    gameEngine,
    player,
    npc,
    chatSystem,
    npcResponseSystem,
    ollamaService,
    memorySystem,
    emotionSystem,
    needsSystem
  };
}

// Example: Simulating a conversation
async function simulateConversation() {
  console.log('\n=== Simulating Conversation ===\n');
  
  // Create mock systems for testing
  const mockNPC = {
    name: 'Alex',
    torso: { position: new Vec2(600, 300) },
    head: { position: new Vec2(600, 280) },
    painSensor: { currentPain: 0, painHistory: [] }
  };
  
  const memorySystem = new MemorySystem(100);
  const emotionSystem = new EmotionSystem();
  const needsSystem = new NeedsSystem();
  const ollamaService = new OllamaService('http://localhost:11434', 'phi3', memorySystem);
  
  const npcResponseSystem = new NPCResponseSystem(
    mockNPC,
    ollamaService,
    memorySystem,
    emotionSystem,
    needsSystem
  );
  
  // Simulate player messages
  const messages = [
    'Hello! What is your name?',
    'How are you feeling today?',
    'Are you hungry?'
  ];
  
  const player = { name: 'Player' };
  
  for (const message of messages) {
    console.log(`[Player]: ${message}`);
    
    try {
      await npcResponseSystem.generateResponse(message, player);
      
      const bubble = npcResponseSystem.getCurrentBubble();
      if (bubble) {
        console.log(`[Alex]: ${bubble.getText()}\n`);
      }
      
      // Wait a bit between messages
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error('Error:', error.message);
    }
  }
  
  console.log('=== Conversation Complete ===\n');
}

// Example: Testing different emotional states
async function testEmotionalResponses() {
  console.log('\n=== Testing Emotional Responses ===\n');
  
  const mockNPC = {
    name: 'Alex',
    torso: { position: new Vec2(600, 300) },
    head: { position: new Vec2(600, 280) },
    painSensor: { currentPain: 0, painHistory: [] }
  };
  
  const memorySystem = new MemorySystem(100);
  const emotionSystem = new EmotionSystem();
  const needsSystem = new NeedsSystem();
  const ollamaService = new OllamaService('http://localhost:11434', 'phi3', memorySystem);
  
  const npcResponseSystem = new NPCResponseSystem(
    mockNPC,
    ollamaService,
    memorySystem,
    emotionSystem,
    needsSystem
  );
  
  const player = { name: 'Player' };
  
  // Test 1: Happy state
  console.log('Test 1: Happy emotional state');
  emotionSystem.emotions.happy = 0.9;
  emotionSystem.emotions.curious = 0.7;
  
  await npcResponseSystem.generateResponse('How are you?', player);
  let bubble = npcResponseSystem.getCurrentBubble();
  console.log(`Response: ${bubble ? bubble.getText() : 'No response'}\n`);
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 2: Fearful state
  console.log('Test 2: Fearful emotional state');
  emotionSystem.emotions.happy = 0.2;
  emotionSystem.emotions.fearful = 0.8;
  
  await npcResponseSystem.generateResponse('What do you see?', player);
  bubble = npcResponseSystem.getCurrentBubble();
  console.log(`Response: ${bubble ? bubble.getText() : 'No response'}\n`);
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 3: In pain
  console.log('Test 3: In pain');
  mockNPC.painSensor.currentPain = 70;
  mockNPC.painSensor.painHistory = [
    { bodyPart: 'arm', intensity: 0.7, damageType: 'slash' }
  ];
  
  await npcResponseSystem.generateResponse('Are you okay?', player);
  bubble = npcResponseSystem.getCurrentBubble();
  console.log(`Response: ${bubble ? bubble.getText() : 'No response'}\n`);
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 4: Critical hunger
  console.log('Test 4: Critical hunger');
  mockNPC.painSensor.currentPain = 0;
  needsSystem.hunger = 10;
  
  await npcResponseSystem.generateResponse('What do you need?', player);
  bubble = npcResponseSystem.getCurrentBubble();
  console.log(`Response: ${bubble ? bubble.getText() : 'No response'}\n`);
  
  console.log('=== Emotional Response Tests Complete ===\n');
}

// Export for use in browser or Node.js
if (typeof window !== 'undefined') {
  window.setupNPCResponseDemo = setupNPCResponseDemo;
  window.simulateConversation = simulateConversation;
  window.testEmotionalResponses = testEmotionalResponses;
}

export {
  setupNPCResponseDemo,
  simulateConversation,
  testEmotionalResponses
};

// If running directly in Node.js
if (typeof process !== 'undefined' && process.argv[1] === new URL(import.meta.url).pathname) {
  console.log('Running NPC Response Demo...\n');
  console.log('Note: This demo requires Ollama to be running on localhost:11434');
  console.log('Install Ollama and run: ollama run phi3\n');
  
  // Run simulation
  simulateConversation().catch(console.error);
}
