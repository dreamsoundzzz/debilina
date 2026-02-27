/**
 * BubbleManager manages multiple text bubbles and handles stacking
 * 
 * Requirements:
 * - 10.14: Display character name labels to distinguish speakers
 * - 10.15: Stack bubbles vertically without overlapping when multiple characters speak
 */
export class BubbleManager {
  constructor() {
    this.bubbles = []; // Array of { bubble, character } objects
    this.verticalSpacing = 10; // Spacing between stacked bubbles
  }

  /**
   * Add a new bubble to the manager
   * @param {TextBubble} bubble - The text bubble to add
   * @param {Character} character - The character speaking
   */
  addBubble(bubble, character) {
    this.bubbles.push({ bubble, character });
  }

  /**
   * Update all bubbles and remove expired ones
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    // Update all bubbles and filter out expired ones
    this.bubbles = this.bubbles.filter(({ bubble }) => bubble.update(dt));
  }

  /**
   * Render all bubbles with stacking
   * Requirements:
   * - 10.14: Display character name labels
   * - 10.15: Stack vertically without overlapping
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   */
  render(ctx) {
    // Group bubbles by character to detect simultaneous speech
    const bubblesByCharacter = this.groupBubblesByCharacter();
    
    // Track vertical offsets for stacking
    const stackOffsets = new Map();
    
    // Render each bubble with appropriate stacking
    for (const { bubble, character } of this.bubbles) {
      // Get current stack offset for this character
      const characterId = this.getCharacterId(character);
      const currentOffset = stackOffsets.get(characterId) || 0;
      
      // Render the bubble with offset
      this.renderBubbleWithOffset(ctx, bubble, character, currentOffset);
      
      // Update stack offset for next bubble from this character
      const bubbleHeight = this.calculateBubbleHeight(ctx, bubble);
      stackOffsets.set(characterId, currentOffset + bubbleHeight + this.verticalSpacing);
    }
  }

  /**
   * Render a single bubble with vertical offset and character name
   * Requirement 10.14: Display character name labels
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {TextBubble} bubble - The bubble to render
   * @param {Character} character - The character speaking
   * @param {number} verticalOffset - Vertical offset for stacking
   */
  renderBubbleWithOffset(ctx, bubble, character, verticalOffset) {
    if (!character.head || !character.head.position) {
      return;
    }

    const headPos = character.head.position;
    const baseOffset = { x: 0, y: -50 };
    const bubbleX = headPos.x + baseOffset.x;
    const bubbleY = headPos.y + baseOffset.y - verticalOffset;

    // Get wrapped text lines
    const lines = bubble.wrapText(ctx, bubble.text, bubble.maxWidth);
    
    // Calculate bubble dimensions
    const bubbleWidth = bubble.maxWidth + bubble.padding * 2;
    const bubbleHeight = lines.length * bubble.lineHeight + bubble.padding * 2;
    
    // Add space for character name label
    const nameHeight = 18; // Height for name label
    const totalHeight = bubbleHeight + nameHeight;

    ctx.save();
    ctx.globalAlpha = bubble.alpha;

    // Render character name label (Requirement 10.14)
    this.renderCharacterName(ctx, character, bubbleX, bubbleY - totalHeight / 2);

    // Set bubble style
    if (bubble.type === 'speech') {
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
    }

    // Draw bubble background
    bubble.drawBubble(ctx, bubbleX, bubbleY, bubbleWidth, bubbleHeight);

    // Draw text
    ctx.fillStyle = 'black';
    if (bubble.type === 'thought' || bubble.type === 'meta-thought') {
      ctx.font = 'italic 14px Arial';
    } else {
      ctx.font = '14px Arial';
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const startY = bubbleY - bubbleHeight / 2 + bubble.padding + bubble.lineHeight / 2;
    for (let i = 0; i < lines.length; i++) {
      const lineY = startY + i * bubble.lineHeight;
      ctx.fillText(lines[i], bubbleX, lineY);
    }

    ctx.restore();
  }

  /**
   * Render character name label above bubble
   * Requirement 10.14: Display character name labels to distinguish speakers
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {Character} character - The character
   * @param {number} x - X position
   * @param {number} y - Y position (top of name label)
   */
  renderCharacterName(ctx, character, x, y) {
    const name = character.name || 'Unknown';
    
    ctx.save();
    
    // Draw name background
    ctx.font = 'bold 12px Arial';
    const nameWidth = ctx.measureText(name).width;
    const namePadding = 6;
    const nameBoxWidth = nameWidth + namePadding * 2;
    const nameBoxHeight = 16;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(
      x - nameBoxWidth / 2,
      y,
      nameBoxWidth,
      nameBoxHeight
    );
    
    // Draw name text
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, x, y + nameBoxHeight / 2);
    
    ctx.restore();
  }

  /**
   * Calculate the height of a bubble including padding
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {TextBubble} bubble - The bubble
   * @returns {number} Total height in pixels
   */
  calculateBubbleHeight(ctx, bubble) {
    const lines = bubble.wrapText(ctx, bubble.text, bubble.maxWidth);
    const bubbleHeight = lines.length * bubble.lineHeight + bubble.padding * 2;
    const nameHeight = 18;
    return bubbleHeight + nameHeight;
  }

  /**
   * Group bubbles by character
   * @returns {Map<string, Array>} Map of character ID to bubbles
   */
  groupBubblesByCharacter() {
    const groups = new Map();
    
    for (const { bubble, character } of this.bubbles) {
      const characterId = this.getCharacterId(character);
      if (!groups.has(characterId)) {
        groups.set(characterId, []);
      }
      groups.get(characterId).push({ bubble, character });
    }
    
    return groups;
  }

  /**
   * Get a unique identifier for a character
   * @param {Character} character - The character
   * @returns {string} Unique identifier
   */
  getCharacterId(character) {
    return character.name || 'unknown';
  }

  /**
   * Check if multiple characters are speaking simultaneously
   * @returns {boolean} True if multiple characters have active bubbles
   */
  hasSimultaneousSpeakers() {
    const groups = this.groupBubblesByCharacter();
    return groups.size > 1;
  }

  /**
   * Get all active bubbles
   * @returns {Array} Array of { bubble, character } objects
   */
  getBubbles() {
    return this.bubbles;
  }

  /**
   * Clear all bubbles
   */
  clear() {
    this.bubbles = [];
  }

  /**
   * Get bubbles for a specific character
   * @param {Character} character - The character
   * @returns {Array} Array of bubbles for this character
   */
  getBubblesForCharacter(character) {
    const characterId = this.getCharacterId(character);
    return this.bubbles
      .filter(({ character: c }) => this.getCharacterId(c) === characterId)
      .map(({ bubble }) => bubble);
  }
}
