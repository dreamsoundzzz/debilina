/**
 * InternalMonologuePanel displays the AI's stream of consciousness
 * 
 * Requirements:
 * - 30.1: Dedicated UI panel for displaying Internal_Monologue stream
 * - 30.2: Scrolling feed of AI's thoughts in real-time
 * - 30.3: Distinguish between different thought types
 * - 30.8: Toggle panel visibility with hotkey
 * - 30.9: Persist recent thoughts (last 50 entries)
 */
export class InternalMonologuePanel {
  /**
   * Create a new internal monologue panel
   */
  constructor() {
    this.thoughts = [];
    this.maxThoughts = 50; // Requirement 30.9: Persist last 50 entries
    this.isVisible = true;
    this.scrollPosition = 0;
    
    // Panel dimensions and position
    this.panelWidth = 300;
    this.panelHeight = 400;
    this.panelPadding = 10;
    
    // Thought type colors (Requirement 30.3)
    this.typeColors = {
      observation: '#FFFFFF',    // White - "I see...", "I notice..."
      reflection: '#AAAAFF',     // Light blue - "I feel...", "I need..."
      metacognition: '#FFAAFF',  // Light purple - "I'm thinking about..."
      need: '#FFAAAA',           // Light red - Need-related thoughts
      emotion: '#FFFFAA'         // Light yellow - Emotion-related thoughts
    };
  }
  
  /**
   * Add a thought to the stream
   * Requirement 30.2: Show scrolling feed in real-time
   * @param {string} text - The thought text
   * @param {string} type - Thought type: 'observation', 'reflection', 'metacognition', 'need', 'emotion'
   */
  addThought(text, type = 'observation') {
    const thought = {
      text,
      type,
      timestamp: Date.now()
    };
    
    this.thoughts.push(thought);
    
    // Requirement 30.9: Keep only last 50 thoughts
    if (this.thoughts.length > this.maxThoughts) {
      this.thoughts.shift();
    }
    
    // Auto-scroll to bottom to show latest thought
    this.scrollPosition = this.thoughts.length;
  }
  
  /**
   * Add a metacognitive thought
   * Convenience method for adding metacognition type thoughts
   * @param {string} text - The meta-thought text
   */
  addMetaThought(text) {
    this.addThought(text, 'metacognition');
  }
  
  /**
   * Add an observation thought
   * Requirement 30.4: Show "I see [object]" or "I notice [event]"
   * @param {string} text - The observation text
   */
  addObservation(text) {
    this.addThought(text, 'observation');
  }
  
  /**
   * Add a reflection thought
   * Requirement 30.5: Show "I feel [emotion]" or "I need [resource]"
   * @param {string} text - The reflection text
   */
  addReflection(text) {
    this.addThought(text, 'reflection');
  }
  
  /**
   * Add a need-related thought
   * @param {string} text - The need thought text
   */
  addNeedThought(text) {
    this.addThought(text, 'need');
  }
  
  /**
   * Add an emotion-related thought
   * @param {string} text - The emotion thought text
   */
  addEmotionThought(text) {
    this.addThought(text, 'emotion');
  }
  
  /**
   * Toggle panel visibility
   * Requirement 30.8: Allow toggling panel on/off via hotkey
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
   * Get all thoughts
   * @returns {Array} Array of thought objects
   */
  getThoughts() {
    return this.thoughts;
  }
  
  /**
   * Clear all thoughts
   */
  clear() {
    this.thoughts = [];
    this.scrollPosition = 0;
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
   * Render the internal monologue panel
   * Requirements:
   * - 30.1: Dedicated UI panel
   * - 30.2: Scrolling feed in real-time
   * - 30.3: Color-code by thought type
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   */
  render(ctx) {
    if (!this.isVisible) return;
    
    const canvas = ctx.canvas;
    const panelX = canvas.width - this.panelWidth - this.panelPadding;
    const panelY = this.panelPadding;
    
    // Draw panel background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(panelX, panelY, this.panelWidth, this.panelHeight);
    
    // Draw panel border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, this.panelWidth, this.panelHeight);
    
    // Draw title
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Stream of Consciousness', panelX + 10, panelY + 25);
    
    // Draw visibility hint
    ctx.font = '10px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText('[M] to toggle', panelX + this.panelWidth - 80, panelY + 25);
    
    // Calculate visible area for thoughts
    const thoughtsStartY = panelY + 40;
    const thoughtsHeight = this.panelHeight - 50;
    const lineHeight = 18;
    const maxVisibleLines = Math.floor(thoughtsHeight / lineHeight);
    
    // Render thoughts
    ctx.font = '12px Arial';
    let currentY = thoughtsStartY;
    let linesRendered = 0;
    
    // Calculate which thoughts to show (scroll from bottom)
    const startIndex = Math.max(0, this.thoughts.length - maxVisibleLines);
    
    for (let i = startIndex; i < this.thoughts.length; i++) {
      const thought = this.thoughts[i];
      
      // Set color based on thought type (Requirement 30.3)
      ctx.fillStyle = this.typeColors[thought.type] || this.typeColors.observation;
      
      // Wrap text to fit panel width
      const maxTextWidth = this.panelWidth - 20;
      const wrappedLines = this.wrapText(ctx, thought.text, maxTextWidth);
      
      // Render each line of the wrapped thought
      for (let j = 0; j < wrappedLines.length; j++) {
        if (currentY + lineHeight > panelY + this.panelHeight) {
          break; // Stop if we've run out of space
        }
        
        // Add timestamp prefix to first line
        if (j === 0) {
          const timeStr = this.formatTimestamp(thought.timestamp);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.fillText(`[${timeStr}]`, panelX + 10, currentY);
          
          // Reset color for thought text
          ctx.fillStyle = this.typeColors[thought.type] || this.typeColors.observation;
          ctx.fillText(wrappedLines[j], panelX + 80, currentY);
        } else {
          // Indent continuation lines
          ctx.fillText(wrappedLines[j], panelX + 80, currentY);
        }
        
        currentY += lineHeight;
        linesRendered++;
        
        if (linesRendered >= maxVisibleLines) {
          break;
        }
      }
      
      if (linesRendered >= maxVisibleLines) {
        break;
      }
    }
    
    // Draw legend at bottom
    this.renderLegend(ctx, panelX, panelY + this.panelHeight - 5);
  }
  
  /**
   * Render the color legend for thought types
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {number} x - Legend X position
   * @param {number} y - Legend Y position
   */
  renderLegend(ctx, x, y) {
    ctx.font = '9px Arial';
    ctx.textAlign = 'left';
    
    const legendItems = [
      { type: 'observation', label: 'Obs' },
      { type: 'reflection', label: 'Ref' },
      { type: 'metacognition', label: 'Meta' },
      { type: 'need', label: 'Need' },
      { type: 'emotion', label: 'Emo' }
    ];
    
    let currentX = x + 10;
    
    legendItems.forEach(item => {
      // Draw color box
      ctx.fillStyle = this.typeColors[item.type];
      ctx.fillRect(currentX, y - 8, 8, 8);
      
      // Draw label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillText(item.label, currentX + 10, y);
      
      currentX += 50;
    });
  }
}
