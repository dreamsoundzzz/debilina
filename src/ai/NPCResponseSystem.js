/**
 * NPCResponseSystem - Handles NPC response generation using OllamaService
 * 
 * Requirements:
 * - 31.2: Generate responses that reference previous conversation topics
 * - 31.3: Provide relevant answers based on knowledge and observations
 * - 31.4: Acknowledge statements and ask follow-up questions
 * - 31.5: Maintain conversational coherence across multiple exchanges
 * - 31.7: Reflect current emotional state and needs in dialogue
 * - 31.8: Reflect urgency or discomfort when in pain or distress
 * - 31.9: Include mentions of needs or requests for help when hungry/thirsty
 */
import { TextBubble } from '../core/TextBubble.js';

export class NPCResponseSystem {
  /**
   * Create a new NPC response system
   * @param {Object} npc - NPC character
   * @param {OllamaService} ollamaService - Ollama service for AI responses
   * @param {MemorySystem} memorySystem - Memory system for storing conversations
   * @param {EmotionSystem} emotionSystem - Emotion system for emotional context
   * @param {NeedsSystem} needsSystem - Needs system for survival needs
   * @param {PlayerIdentity} playerIdentity - Player identity system for name recognition
   */
  constructor(npc, ollamaService, memorySystem = null, emotionSystem = null, needsSystem = null, playerIdentity = null) {
    this.npc = npc;
    this.ollamaService = ollamaService;
    this.memorySystem = memorySystem;
    this.emotionSystem = emotionSystem;
    this.needsSystem = needsSystem;
    this.playerIdentity = playerIdentity;
    
    // Response state
    this.isGenerating = false;
    this.lastResponseTime = 0;
    this.responseDelay = 1000; // Minimum 1 second between responses
    
    // Text bubbles
    this.currentBubble = null;
    
    // Bind the message handler
    this.handleMessage = this.handleMessage.bind(this);
    
    // Set up NPC to receive messages
    if (this.npc) {
      this.npc.onReceiveMessage = this.handleMessage;
    }
  }
  
  /**
   * Handle incoming message to NPC
   * Requirement 10.12: Process player messages as high-priority observations
   * @param {Object} npc - NPC character
   * @param {string} message - Message text
   * @param {Object} sender - Character who sent the message
   */
  async handleMessage(npc, message, sender) {
    // Check if we're already generating a response
    if (this.isGenerating) {
      console.log('NPCResponseSystem: Already generating response, queuing message');
      return;
    }
    
    // Check response delay
    const now = Date.now();
    if (now - this.lastResponseTime < this.responseDelay) {
      console.log('NPCResponseSystem: Response delay not met, waiting');
      return;
    }
    
    // Generate response
    await this.generateResponse(message, sender);
  }
  
  /**
   * Generate NPC response to a message
   * Requirements:
   * - 31.2: Include conversation history in context
   * - 31.3: Generate contextually appropriate responses
   * - 31.7: Reflect emotional state and needs
   * - 31.8: Reflect pain/distress
   * - 31.9: Mention needs when critical
   * @param {string} message - Message to respond to
   * @param {Object} sender - Character who sent the message
   */
  async generateResponse(message, sender) {
    this.isGenerating = true;
    
    try {
      // Build context for response generation
      const context = this.buildContext(message, sender);
      
      // Create prompt for response generation
      const prompt = this.buildResponsePrompt(message, sender);
      
      // Generate response using Ollama
      const response = await this.ollamaService.generateResponse(
        prompt,
        context,
        false, // Non-streaming for simpler implementation
        5000 // 5 second timeout
      );
      
      // Parse response
      const parsed = this.ollamaService.parseResponse(response);
      
      // Display response in text bubble
      if (parsed.dialogue) {
        this.displayResponse(parsed.dialogue);
      }
      
      // Store conversation in memory
      // Requirement 10.13: Record all conversations
      // Requirement 32.5: Associate player identity with actions
      if (this.memorySystem) {
        const playerName = this.getPlayerName(sender);
        this.memorySystem.addEpisode(
          `Responded to ${playerName}: "${parsed.dialogue}"`,
          {
            type: 'conversation',
            speaker: 'npc',
            message: parsed.dialogue,
            inResponseTo: message,
            playerName: playerName,
            timestamp: Date.now()
          },
          0.6 // Moderate emotional intensity for conversations
        );
      }
      
      this.lastResponseTime = Date.now();
      
    } catch (error) {
      console.error('NPCResponseSystem: Error generating response:', error);
      
      // Fallback response
      this.displayResponse("I'm having trouble thinking right now...");
      
    } finally {
      this.isGenerating = false;
    }
  }
  
  /**
   * Build context for response generation
   * Requirement 31.2: Include conversation history
   * Requirement 31.7: Include emotional state and needs
   * Requirement 32.3: Include player name for recognition
   * Requirement 32.4: Enable NPC to use player name in dialogue
   * @param {string} message - Current message
   * @param {Object} sender - Message sender
   * @returns {Object} Context object
   */
  buildContext(message, sender) {
    const context = {
      // Physical state
      position: this.npc.torso ? this.npc.torso.position : { x: 0, y: 0 },
      
      // Player identity (Requirement 32.3, 32.4)
      playerName: this.getPlayerName(sender),
      
      // Conversation history
      recentMessages: [],
      
      // Emotional state (Requirement 31.7)
      emotions: {},
      dominantEmotion: null,
      
      // Needs (Requirement 31.9)
      hunger: 100,
      thirst: 100,
      energy: 100,
      criticalNeed: null,
      
      // Pain (Requirement 31.8)
      pain: 0,
      painLocation: null,
      
      // Visible objects
      visibleObjects: [],
      
      // Recent memories
      recentMemories: []
    };
    
    // Add conversation history
    // Requirement 31.2: Include last 10 messages for context
    if (this.ollamaService && this.ollamaService.conversationHistory) {
      const history = this.ollamaService.conversationHistory.slice(-10);
      context.recentMessages = history.map(msg => ({
        speaker: msg.role === 'user' ? (sender ? sender.name : 'Player') : 'NPC',
        message: msg.content
      }));
    }
    
    // Add current message to context
    context.recentMessages.push({
      speaker: sender ? sender.name : 'Player',
      message: message
    });
    
    // Add emotional state (Requirement 31.7)
    if (this.emotionSystem) {
      context.emotions = this.emotionSystem.emotions || {};
      context.dominantEmotion = this.emotionSystem.getDominantEmotion();
    }
    
    // Add needs (Requirement 31.9)
    if (this.needsSystem) {
      context.hunger = this.needsSystem.hunger || 100;
      context.thirst = this.needsSystem.thirst || 100;
      context.energy = this.needsSystem.energy || 100;
      context.criticalNeed = this.needsSystem.getCriticalNeed();
    }
    
    // Add pain state (Requirement 31.8)
    if (this.npc.painSensor) {
      context.pain = this.npc.painSensor.currentPain || 0;
      if (this.npc.painSensor.painHistory && this.npc.painSensor.painHistory.length > 0) {
        const recentPain = this.npc.painSensor.painHistory[this.npc.painSensor.painHistory.length - 1];
        context.painLocation = recentPain.bodyPart;
      }
    }
    
    // Add recent memories
    if (this.memorySystem) {
      const memories = this.memorySystem.getRecentMemories(3);
      context.recentMemories = memories.map(mem => mem.event);
    }
    
    return context;
  }
  
  /**
   * Build prompt for response generation
   * Requirements:
   * - 31.3: Provide relevant answers
   * - 31.4: Acknowledge and ask follow-ups
   * - 31.5: Maintain coherence
   * - 32.4: Use player name in dialogue when appropriate
   * @param {string} message - Message to respond to
   * @param {Object} sender - Message sender
   * @returns {string} Prompt for LLM
   */
  buildResponsePrompt(message, sender) {
    const senderName = this.getPlayerName(sender);
    
    let prompt = `${senderName} just said to you: "${message}"\n\n`;
    
    // Requirement 32.4: Inform NPC about player's name
    if (senderName !== 'someone') {
      prompt += `Remember: The player's name is ${senderName}. You can use their name naturally in conversation.\n\n`;
    }
    
    // Requirement 31.3: Provide relevant answers based on knowledge
    prompt += `How do you respond? Consider:\n`;
    prompt += `- What they said and what they might be asking or telling you\n`;
    prompt += `- Your current physical and emotional state\n`;
    prompt += `- Your past interactions and memories\n`;
    prompt += `- Whether you should ask a follow-up question or make a statement\n\n`;
    
    // Requirement 31.4: Acknowledge and potentially ask follow-ups
    prompt += `Guidelines:\n`;
    prompt += `- Acknowledge what they said\n`;
    prompt += `- Be natural and conversational\n`;
    prompt += `- Ask follow-up questions if appropriate\n`;
    prompt += `- Express your current feelings and needs if relevant\n`;
    prompt += `- Keep your response concise (1-3 sentences)\n\n`;
    
    // Requirement 31.8: Reflect urgency if in pain
    if (this.npc.painSensor && this.npc.painSensor.currentPain > 50) {
      prompt += `IMPORTANT: You are in significant pain right now. Your response should reflect this urgency and discomfort.\n\n`;
    }
    
    // Requirement 31.9: Mention needs if critical
    if (this.needsSystem) {
      const criticalNeed = this.needsSystem.getCriticalNeed();
      if (criticalNeed) {
        prompt += `IMPORTANT: Your ${criticalNeed.type} is critically low (${criticalNeed.value.toFixed(0)}/100). You should mention this need or ask for help.\n\n`;
      }
    }
    
    prompt += `Respond naturally as yourself:`;
    
    return prompt;
  }
  
  /**
   * Get player name from sender or PlayerIdentity system
   * Requirement 32.3: NPC remembers player name
   * @param {Object} sender - Message sender
   * @returns {string} Player name or 'someone'
   */
  getPlayerName(sender) {
    // Try to get name from sender object
    if (sender && sender.name) {
      return sender.name;
    }
    
    // Try to get name from PlayerIdentity system
    if (this.playerIdentity && this.playerIdentity.getPlayerName()) {
      return this.playerIdentity.getPlayerName();
    }
    
    // Default fallback
    return 'someone';
  }
  
  /**
   * Display response in text bubble above NPC
   * Requirement 10.1: Display in text bubble above NPC head
   * @param {string} text - Response text to display
   */
  displayResponse(text) {
    if (!this.npc) return;
    
    // Remove old bubble if exists
    if (this.currentBubble) {
      this.currentBubble = null;
    }
    
    // Create new text bubble
    // Requirement 10.1: Text bubble appears above character head
    this.currentBubble = new TextBubble(this.npc, text, 'speech');
  }
  
  /**
   * Update the response system
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    // Update current text bubble
    if (this.currentBubble) {
      const alive = this.currentBubble.update(dt);
      if (!alive) {
        this.currentBubble = null;
      }
    }
  }
  
  /**
   * Render the response system
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   */
  render(ctx) {
    // Render current text bubble
    if (this.currentBubble) {
      this.currentBubble.render(ctx);
    }
  }
  
  /**
   * Get current text bubble
   * @returns {TextBubble|null} Current bubble or null
   */
  getCurrentBubble() {
    return this.currentBubble;
  }
  
  /**
   * Check if currently generating a response
   * @returns {boolean} True if generating
   */
  isGeneratingResponse() {
    return this.isGenerating;
  }
}
