/**
 * TextBubble displays text above a character's head
 * Supports different styles for speech, thoughts, and meta-thoughts
 * 
 * Requirements:
 * - 10.1: Text bubble appears above character head
 * - 10.3: Readable font size and high contrast
 * - 10.4: Fade out old text and display new text with smooth transition
 * - 10.5: Automatically dismiss after 8 seconds
 * - 10.6: Wrap text within maximum width
 * - 10.9: Different visual styles for speech vs thoughts
 * - 30.10: Display abbreviated thoughts in bubbles above NPC
 */
export class TextBubble {
  /**
   * Create a new text bubble
   * @param {Object} character - Character to attach bubble to
   * @param {string} text - Text to display
   * @param {string} type - Bubble type: 'speech', 'thought', 'meta-thought'
   */
  constructor(character, text, type = 'speech') {
    this.character = character;
    this.text = text;
    this.type = type; // 'speech', 'thought', 'meta-thought'
    
    // Requirement 10.5: Automatically dismiss after 8 seconds
    this.lifetime = 8000; // 8 seconds in milliseconds
    this.age = 0;
    this.alpha = 1.0;
    
    // Requirement 10.6: Maximum width for text wrapping
    this.maxWidth = 300;
    
    // Bubble styling
    this.padding = 10;
    this.lineHeight = 20;
  }
  
  /**
   * Update bubble state
   * Requirement 10.4: Fade out animation
   * Requirement 10.5: Automatic timeout
   * @param {number} dt - Delta time in seconds
   * @returns {boolean} True if bubble is still alive
   */
  update(dt) {
    this.age += dt * 1000; // Convert to milliseconds
    
    // Requirement 10.4: Fade out in last 2 seconds
    if (this.age > this.lifetime - 2000) {
      this.alpha = (this.lifetime - this.age) / 2000;
    }
    
    // Return true if still alive, false if expired
    return this.age < this.lifetime;
  }
  
  /**
   * Render the text bubble
   * Requirements:
   * - 10.1: Position above character head
   * - 10.3: Readable font and high contrast
   * - 10.6: Text wrapping
   * - 10.9: Different styles for speech vs thoughts
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   */
  render(ctx) {
    // Get character head position
    if (!this.character.head || !this.character.head.position) {
      return; // Can't render without head position
    }
    
    const headPos = this.character.head.position;
    
    // Requirement 10.1: Position above character head
    const offset = { x: 0, y: -50 };
    const bubbleX = headPos.x + offset.x;
    const bubbleY = headPos.y + offset.y;
    
    // Requirement 10.6: Wrap text to fit within max width
    const lines = this.wrapText(ctx, this.text, this.maxWidth);
    
    // Calculate bubble dimensions
    const bubbleWidth = this.maxWidth + this.padding * 2;
    const bubbleHeight = lines.length * this.lineHeight + this.padding * 2;
    
    ctx.save();
    ctx.globalAlpha = this.alpha;
    
    // Requirement 10.9: Different visual styles
    // Speech: solid bubble
    // Thoughts: dashed bubble with italics
    if (this.type === 'speech') {
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
    } else {
      // Thought or meta-thought
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]); // Dashed line for thoughts
    }
    
    // Draw bubble background
    this.drawBubble(ctx, bubbleX, bubbleY, bubbleWidth, bubbleHeight);
    
    // Requirement 10.3: Readable font size (14px) and high contrast
    ctx.fillStyle = 'black';
    
    // Requirement 10.9: Italic font for thoughts
    if (this.type === 'thought' || this.type === 'meta-thought') {
      ctx.font = 'italic 14px Arial';
    } else {
      ctx.font = '14px Arial';
    }
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw text lines
    const startY = bubbleY - bubbleHeight / 2 + this.padding + this.lineHeight / 2;
    for (let i = 0; i < lines.length; i++) {
      const lineY = startY + i * this.lineHeight;
      ctx.fillText(lines[i], bubbleX, lineY);
    }
    
    ctx.restore();
  }
  
  /**
   * Draw bubble shape with tail pointing to character
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {number} x - Bubble center X
   * @param {number} y - Bubble center Y
   * @param {number} width - Bubble width
   * @param {number} height - Bubble height
   */
  drawBubble(ctx, x, y, width, height) {
    const radius = 10; // Corner radius
    const tailSize = 10; // Size of tail pointing to character
    
    // Calculate bubble rectangle
    const left = x - width / 2;
    const right = x + width / 2;
    const top = y - height / 2;
    const bottom = y + height / 2;
    
    ctx.beginPath();
    
    // Top left corner
    ctx.moveTo(left + radius, top);
    
    // Top edge
    ctx.lineTo(right - radius, top);
    ctx.arcTo(right, top, right, top + radius, radius);
    
    // Right edge
    ctx.lineTo(right, bottom - radius);
    ctx.arcTo(right, bottom, right - radius, bottom, radius);
    
    // Bottom edge (with tail)
    ctx.lineTo(x + tailSize, bottom);
    ctx.lineTo(x, bottom + tailSize); // Tail point
    ctx.lineTo(x - tailSize, bottom);
    ctx.lineTo(left + radius, bottom);
    ctx.arcTo(left, bottom, left, bottom - radius, radius);
    
    // Left edge
    ctx.lineTo(left, top + radius);
    ctx.arcTo(left, top, left + radius, top, radius);
    
    ctx.closePath();
    
    // Fill and stroke
    ctx.fill();
    ctx.stroke();
  }
  
  /**
   * Wrap text to fit within maximum width
   * Requirement 10.6: Text wrapping
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
    
    // Save current font to measure text
    const savedFont = ctx.font;
    if (this.type === 'thought' || this.type === 'meta-thought') {
      ctx.font = 'italic 14px Arial';
    } else {
      ctx.font = '14px Arial';
    }
    
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
    
    // Restore font
    ctx.font = savedFont;
    
    return lines;
  }
  
  /**
   * Get bubble type
   * @returns {string} Bubble type
   */
  getType() {
    return this.type;
  }
  
  /**
   * Get bubble text
   * @returns {string} Bubble text
   */
  getText() {
    return this.text;
  }
  
  /**
   * Check if bubble is expired
   * @returns {boolean} True if expired
   */
  isExpired() {
    return this.age >= this.lifetime;
  }
  
  /**
   * Get remaining lifetime
   * @returns {number} Remaining lifetime in milliseconds
   */
  getRemainingLifetime() {
    return Math.max(0, this.lifetime - this.age);
  }
}
