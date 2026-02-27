/**
 * ChatSystem - Manages player text input and conversation with NPC
 * 
 * Requirements:
 * - 10.10: Provide chat input box at bottom of screen for player text entry
 * - 15.8: Provide chat input box at bottom of screen for typing messages
 * - 15.9: Disable movement/action hotkeys when typing in chat box
 * - 15.10: Send message and clear input when Enter is pressed
 * - 15.11: Close chat box and return focus to game controls when Escape is pressed
 * - 15.13: Support text editing (cursor movement, backspace, delete, select all)
 * - 15.14: Provide hotkey (T) to open chat input box quickly
 */
export class ChatSystem {
  /**
   * Create a new ChatSystem
   * @param {GameEngine} gameEngine - Reference to the game engine
   * @param {PlayerIdentity} playerIdentity - Player identity system
   */
  constructor(gameEngine, playerIdentity = null) {
    this.gameEngine = gameEngine;
    this.playerIdentity = playerIdentity;
    this.conversationHistory = [];
    this.inputBox = null;
    this.isActive = false;
    this.inputEnabled = true; // Track if game input should be enabled
  }
  
  /**
   * Initialize the chat system
   * Requirement 10.10, 15.8: Create chat input box at bottom of screen
   */
  initialize() {
    // Create chat input box
    this.inputBox = document.createElement('input');
    this.inputBox.type = 'text';
    this.inputBox.className = 'chat-input';
    this.inputBox.placeholder = 'Press T to chat, Enter to send, Escape to close';
    this.inputBox.style.display = 'none';
    document.body.appendChild(this.inputBox);
    
    // Requirement 15.10, 15.11: Event listeners for Enter and Escape
    this.inputBox.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.sendMessage();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
      }
      // Requirement 15.13: Text editing is handled natively by input element
      // (cursor movement, backspace, delete, select all with Ctrl+A)
    });
    
    // Prevent input box from losing focus when clicking on canvas
    this.inputBox.addEventListener('blur', () => {
      if (this.isActive) {
        // Re-focus if chat is still active
        setTimeout(() => {
          if (this.isActive) {
            this.inputBox.focus();
          }
        }, 0);
      }
    });
  }
  
  /**
   * Open the chat input box
   * Requirement 15.14: Hotkey (T) to open chat input box
   * Requirement 15.9: Disable game controls when chat is active
   */
  open() {
    if (this.isActive) return; // Already open
    
    this.isActive = true;
    this.inputBox.style.display = 'block';
    this.inputBox.focus();
    
    // Requirement 15.9: Disable game controls when chat is active
    this.inputEnabled = false;
  }
  
  /**
   * Close the chat input box
   * Requirement 15.11: Close chat box and return focus to game controls
   */
  close() {
    this.isActive = false;
    this.inputBox.style.display = 'none';
    this.inputBox.value = '';
    
    // Requirement 15.11: Return focus to game controls
    this.inputEnabled = true;
  }
  
  /**
   * Send the current message
   * Requirement 15.10: Send message and clear input when Enter is pressed
   * Requirement 10.11: Display message in text bubble above player
   * Requirement 10.12: Send message to NPC as high-priority observation
   * Requirement 10.13: Record conversation in memory system
   * Requirement 31.1: Handle message validation and sanitization
   * Requirement 32.5: Associate player identity with actions
   */
  sendMessage() {
    const rawMessage = this.inputBox.value.trim();
    if (!rawMessage) return;
    
    // Requirement 31.1: Validate and sanitize message
    const sanitizedMessage = this.sanitizeMessage(rawMessage);
    if (!this.validateMessage(sanitizedMessage)) {
      console.warn('ChatSystem: Invalid message rejected');
      return;
    }
    
    // Get player name for conversation history
    const playerName = this.getPlayerName();
    
    // Add to conversation history (Requirement 10.13, 32.5)
    const messageData = {
      speaker: 'player',
      playerName: playerName,
      message: sanitizedMessage,
      timestamp: Date.now()
    };
    
    this.conversationHistory.push(messageData);
    
    // Emit event for other systems to handle
    // This allows the game to display the message and send it to NPC
    if (this.gameEngine && this.gameEngine.events) {
      this.gameEngine.events.emit('chat:message', messageData);
    }
    
    this.close();
  }
  
  /**
   * Get player name from PlayerIdentity system
   * Requirement 32.5: Associate player identity with actions
   * @returns {string} Player name or 'Player'
   */
  getPlayerName() {
    if (this.playerIdentity && this.playerIdentity.getPlayerName()) {
      return this.playerIdentity.getPlayerName();
    }
    return 'Player';
  }
  
  /**
   * Validate a message
   * Requirement 31.1: Message validation
   * @param {string} message - Message to validate
   * @returns {boolean} True if message is valid
   */
  validateMessage(message) {
    // Check if message is not empty after sanitization
    if (!message || message.length === 0) {
      return false;
    }
    
    // Check maximum length (prevent spam)
    const MAX_MESSAGE_LENGTH = 500;
    if (message.length > MAX_MESSAGE_LENGTH) {
      return false;
    }
    
    // Check minimum length
    const MIN_MESSAGE_LENGTH = 1;
    if (message.length < MIN_MESSAGE_LENGTH) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Sanitize a message
   * Requirement 31.1: Message sanitization
   * Removes potentially harmful content and normalizes whitespace
   * @param {string} message - Message to sanitize
   * @returns {string} Sanitized message
   */
  sanitizeMessage(message) {
    if (!message) return '';
    
    // Remove leading/trailing whitespace
    let sanitized = message.trim();
    
    // Normalize multiple spaces to single space
    sanitized = sanitized.replace(/\s+/g, ' ');
    
    // Remove control characters (except newlines and tabs)
    sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
    
    // Remove HTML tags (basic XSS prevention)
    sanitized = sanitized.replace(/<[^>]*>/g, '');
    
    // Limit consecutive special characters
    sanitized = sanitized.replace(/([!?.]){4,}/g, '$1$1$1');
    
    // Final trim to remove any trailing whitespace
    sanitized = sanitized.trim();
    
    return sanitized;
  }
  
  /**
   * Process a message from the player
   * Requirement 10.11: Display player message in text bubble
   * Requirement 10.12: Send message to NPC as high-priority observation
   * @param {Object} player - Player character
   * @param {Object} npc - NPC character
   * @param {string} message - Message to process
   */
  processPlayerMessage(player, npc, message) {
    // Requirement 10.11: Display message in text bubble above player
    if (player && player.speak) {
      player.speak(message);
    }
    
    // Requirement 10.12: Send message to NPC as high-priority observation
    if (npc && npc.receiveMessage) {
      npc.receiveMessage(message, player);
    }
  }
  
  /**
   * Store conversation in memory system
   * Requirement 10.13: Record all conversations in memory system
   * @param {Object} memorySystem - Memory system instance
   * @param {string} speaker - Speaker identifier ('player' or 'npc')
   * @param {string} message - Message content
   */
  storeInMemory(memorySystem, speaker, message) {
    if (!memorySystem || !memorySystem.addEpisode) {
      return;
    }
    
    // Requirement 10.13: Record conversation with context
    const event = `${speaker === 'player' ? 'Player' : 'NPC'} said: "${message}"`;
    const context = {
      type: 'conversation',
      speaker,
      message,
      timestamp: Date.now()
    };
    
    // Conversations are moderately important (0.6 emotional intensity)
    memorySystem.addEpisode(event, context, 0.6);
  }
  
  /**
   * Check if chat is currently active
   * @returns {boolean} True if chat input is active
   */
  isOpen() {
    return this.isActive;
  }
  
  /**
   * Check if game input should be enabled
   * Requirement 15.9: Disable game controls when chat is active
   * @returns {boolean} True if game input should be enabled
   */
  isInputEnabled() {
    return this.inputEnabled;
  }
  
  /**
   * Get conversation history
   * @returns {Array} Array of conversation messages
   */
  getConversationHistory() {
    return [...this.conversationHistory];
  }
  
  /**
   * Get recent messages
   * @param {number} count - Number of recent messages to retrieve
   * @returns {Array} Array of recent messages
   */
  getRecentMessages(count = 10) {
    return this.conversationHistory.slice(-count);
  }
  
  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
  }
  
  /**
   * Update method (called each frame)
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    // No per-frame updates needed for chat system
    // All interaction is event-driven
  }
  
  /**
   * Render method (if needed for debug visualization)
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   */
  render(ctx) {
    // No canvas rendering needed - chat input is HTML element
  }
}
