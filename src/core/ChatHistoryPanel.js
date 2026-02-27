/**
 * ChatHistoryPanel displays recent chat messages between player and NPC
 * 
 * Requirements:
 * - 15.12: Display chat history panel showing recent messages from both Player and NPC
 */
export class ChatHistoryPanel {
  /**
   * Create a new chat history panel
   */
  constructor() {
    this.messages = [];
    this.maxMessages = 20; // Keep last 20 messages
    this.isVisible = true;
    
    // Panel dimensions and position
    this.panelWidth = 350;
    this.panelHeight = 300;
    this.padding = 10;
    this.lineHeight = 18;
    
    // Auto-scroll to latest
    this.autoScroll = true;
  }
  
  /**
   * Add a message to the history
   * Requirement 15.12: Display recent messages
   * @param {string} speaker - Speaker identifier ('player' or 'npc')
   * @param {string} playerName - Player name (for player messages)
   * @param {string} message - Message content
   * @param {number} timestamp - Message timestamp
   */
  addMessage(speaker, playerName, message, timestamp = Date.now()) {
    const messageData = {
      speaker,
      playerName: playerName || 'Player',
      message,
      timestamp
    };
    
    this.messages.push(messageData);
    
    // Keep only last N messages
    if (this.messages.length > this.maxMessages) {
      this.messages.shift();
    }
  }
  
  /**
   * Clear all messages
   */
  clear() {
    this.messages = [];
  }
  
  /**
   * Toggle panel visibility
   */
  toggle() {
    this.isVisible = !this.isVisible;
  }
  
  /**
   * Show the panel
   */
  show() {
    this.isVisible = true;
  }
  
  /**
   * Hide the panel
   */
  hide() {
    this.isVisible = false;
  }
  
  /**
   * Get all messages
   * @returns {Array} Array of message objects
   */
  getMessages() {
    return [...this.messages];
  }
  
  /**
   * Get recent messages
   * @param {number} count - Number of recent messages to retrieve
   * @returns {Array} Array of recent messages
   */
  getRecentMessages(count = 10) {
    return this.messages.slice(-count);
  }
  
  /**
   * Format timestamp for display
   * @param {number} timestamp - Unix timestamp in milliseconds
   * @returns {string} Formatted time string (HH:MM:SS)
   */
  formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }
  
  /**
   * Wrap text to fit within a maximum width
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {string} text - Text to wrap
   * @param {number} maxWidth - Maximum width in pixels
   * @returns {Array<string>} Array of wrapped text lines
   */
  wrapText(ctx, text, maxWidth) {
    if (!text || text.trim() === '') {
      return [''];
    }
    
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }
  
  /**
   * Render the chat history panel
   * Requirement 15.12: Display chat history panel with recent messages
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   */
  render(ctx) {
    if (!this.isVisible) return;
    
    const canvas = ctx.canvas;
    const panelX = this.padding;
    const panelY = canvas.height - this.panelHeight - this.padding;
    
    // Draw panel background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(panelX, panelY, this.panelWidth, this.panelHeight);
    
    // Draw panel border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, this.panelWidth, this.panelHeight);
    
    // Draw title
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Chat History', panelX + 10, panelY + 20);
    
    // Draw toggle hint
    ctx.font = '10px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText('[C] to toggle', panelX + this.panelWidth - 80, panelY + 20);
    
    // Calculate visible area for messages
    const messagesStartY = panelY + 30;
    const messagesHeight = this.panelHeight - 40;
    
    // Render messages
    this.renderMessages(ctx, panelX, messagesStartY, messagesHeight);
  }
  
  /**
   * Render messages in the panel
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {number} panelX - Panel X position
   * @param {number} startY - Start Y position for messages
   * @param {number} availableHeight - Available height for messages
   */
  renderMessages(ctx, panelX, startY, availableHeight) {
    ctx.font = '12px Arial';
    
    let currentY = startY;
    const maxTextWidth = this.panelWidth - 20;
    
    // Calculate which messages to show (auto-scroll to bottom)
    const messagesToShow = [];
    let totalHeight = 0;
    
    // Work backwards from most recent message
    for (let i = this.messages.length - 1; i >= 0; i--) {
      const msg = this.messages[i];
      const wrappedLines = this.wrapText(ctx, msg.message, maxTextWidth - 80);
      const messageHeight = (wrappedLines.length + 1) * this.lineHeight; // +1 for speaker line
      
      if (totalHeight + messageHeight > availableHeight) {
        break; // No more space
      }
      
      messagesToShow.unshift({ msg, wrappedLines, height: messageHeight });
      totalHeight += messageHeight;
    }
    
    // Render messages from top to bottom
    for (const { msg, wrappedLines } of messagesToShow) {
      if (currentY + this.lineHeight > startY + availableHeight) {
        break;
      }
      
      // Draw timestamp and speaker
      const timeStr = this.formatTimestamp(msg.timestamp);
      const speakerName = msg.speaker === 'player' ? msg.playerName : 'NPC';
      const speakerColor = msg.speaker === 'player' ? '#4CAF50' : '#2196F3';
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillText(`[${timeStr}]`, panelX + 10, currentY);
      
      ctx.fillStyle = speakerColor;
      ctx.font = 'bold 12px Arial';
      ctx.fillText(speakerName + ':', panelX + 80, currentY);
      
      currentY += this.lineHeight;
      
      // Draw message lines
      ctx.font = '12px Arial';
      ctx.fillStyle = 'white';
      
      for (const line of wrappedLines) {
        if (currentY + this.lineHeight > startY + availableHeight) {
          break;
        }
        
        ctx.fillText(line, panelX + 80, currentY);
        currentY += this.lineHeight;
      }
    }
    
    // Draw scroll indicator if there are more messages
    if (this.messages.length > messagesToShow.length) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('↑ More messages above', panelX + this.panelWidth / 2, startY + 10);
    }
  }
}
