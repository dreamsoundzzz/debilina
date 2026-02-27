/**
 * OllamaService Demo
 * 
 * This example demonstrates how to use the OllamaService class
 * to interact with a local Ollama LLM instance.
 * 
 * Prerequisites:
 * - Ollama must be installed and running on http://localhost:11434
 * - A model (phi3 or llama3.2) must be installed
 * 
 * To install Ollama and models:
 * 1. Download Ollama from https://ollama.ai
 * 2. Run: ollama pull phi3
 *    or: ollama pull llama3.2
 * 3. Start Ollama service (usually starts automatically)
 */

// In a browser environment, you would import like this:
// import OllamaService from '../src/ai/OllamaService.js';

// For Node.js testing:
const OllamaService = require('../src/ai/OllamaService.js');

// Example 1: Basic non-streaming response
async function basicExample() {
  console.log('=== Basic Example ===\n');
  
  const service = new OllamaService('http://localhost:11434', 'phi3');
  
  const context = {
    position: { x: 100, y: 200 },
    visibleObjects: ['box', 'ball', 'player'],
    heldObjects: [],
    emotions: { happy: 0.6, curious: 0.7, fearful: 0.1 },
    hunger: 85,
    thirst: 90,
    energy: 75,
    pain: 0,
    recentMemories: ['Spawned in the world', 'Saw a player approach']
  };
  
  try {
    const response = await service.generateResponse(
      'What do you see around you? How do you feel?',
      context,
      false // Non-streaming
    );
    
    console.log('AI Response:', response);
    console.log('\nConversation History:', service.getHistory().length, 'messages');
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\nMake sure Ollama is running and the model is installed!');
  }
}

// Example 2: Streaming response
async function streamingExample() {
  console.log('\n=== Streaming Example ===\n');
  
  const service = new OllamaService('http://localhost:11434', 'phi3');
  
  const context = {
    position: { x: 150, y: 180 },
    visibleObjects: ['sword', 'gasoline canister'],
    heldObjects: ['sword'],
    emotions: { fearful: 0.8, angry: 0.3 },
    hunger: 60,
    thirst: 55,
    energy: 80,
    pain: 25,
    recentMemories: ['Picked up sword', 'Got hit by player', 'Feeling threatened']
  };
  
  try {
    const stream = await service.generateResponse(
      'The player is approaching with a weapon. What should you do?',
      context,
      true // Streaming
    );
    
    process.stdout.write('AI Response (streaming): ');
    
    for await (const chunk of stream) {
      process.stdout.write(chunk);
    }
    
    console.log('\n\nConversation History:', service.getHistory().length, 'messages');
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\nMake sure Ollama is running and the model is installed!');
  }
}

// Example 3: Multi-turn conversation
async function conversationExample() {
  console.log('\n=== Multi-turn Conversation Example ===\n');
  
  const service = new OllamaService('http://localhost:11434', 'phi3');
  
  const baseContext = {
    position: { x: 200, y: 150 },
    visibleObjects: ['player'],
    heldObjects: [],
    emotions: { happy: 0.5, curious: 0.6 },
    hunger: 100,
    thirst: 100,
    energy: 100,
    pain: 0,
    recentMemories: []
  };
  
  try {
    // First message
    console.log('Player: Hello! What\'s your name?');
    let response = await service.generateResponse(
      'The player says: "Hello! What\'s your name?"',
      baseContext,
      false
    );
    console.log('AI:', response);
    
    // Second message
    console.log('\nPlayer: Can you help me find some food?');
    response = await service.generateResponse(
      'The player says: "Can you help me find some food?"',
      { ...baseContext, hunger: 40 },
      false
    );
    console.log('AI:', response);
    
    // Third message
    console.log('\nPlayer: Thanks! Let\'s work together.');
    response = await service.generateResponse(
      'The player says: "Thanks! Let\'s work together."',
      { ...baseContext, emotions: { happy: 0.8, curious: 0.5 } },
      false
    );
    console.log('AI:', response);
    
    console.log('\nTotal conversation history:', service.getHistory().length, 'messages');
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\nMake sure Ollama is running and the model is installed!');
  }
}

// Example 4: Model switching
async function modelSwitchingExample() {
  console.log('\n=== Model Switching Example ===\n');
  
  const service = new OllamaService();
  
  console.log('Current model:', service.getModel());
  
  // Switch to llama3.2
  service.setModel('llama3.2');
  console.log('Switched to:', service.getModel());
  
  // Clear history when switching models
  service.clearHistory();
  console.log('History cleared');
}

// Run examples
async function runAllExamples() {
  console.log('OllamaService Demo\n');
  console.log('Note: These examples require Ollama to be running locally.');
  console.log('If you see connection errors, make sure:');
  console.log('1. Ollama is installed and running');
  console.log('2. The phi3 or llama3.2 model is installed');
  console.log('3. The service is accessible at http://localhost:11434\n');
  
  // Uncomment the examples you want to run:
  
  // await basicExample();
  // await streamingExample();
  // await conversationExample();
  await modelSwitchingExample();
  
  console.log('\nDemo complete!');
}

// Run if executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}

module.exports = {
  basicExample,
  streamingExample,
  conversationExample,
  modelSwitchingExample
};
