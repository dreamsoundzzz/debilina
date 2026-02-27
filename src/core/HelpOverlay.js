/**
 * HelpOverlay displays game controls and instructions
 * 
 * Requirements:
 * - 15.1: Display basic instructions or help overlay when game starts
 */
export class HelpOverlay {
  /**
   * Create a new help overlay
   */
  constructor() {
    this.isVisible = true; // Show by default on game start
    
    // Overlay dimensions
    this.overlayWidth = 500;
    this.overlayHeight = 450;
    this.padding = 20;
    
    // Define controls and instructions
    this.controls = this.initializeControls();
  }
  
  /**
   * Initialize control definitions
   * @returns {Array} Array of control sections
   */
  initializeControls() {
    return [
      {
        title: 'Movement',
        items: [
          { key: 'A / Left Arrow', description: 'Walk left' },
          { key: 'D / Right Arrow', description: 'Walk right' }
        ]
      },
      {
        title: 'Hand Control',
        items: [
          { key: 'Mouse', description: 'Move active hand' },
          { key: 'Q', description: 'Switch hands (left/right)' },
          { key: 'E', description: 'Grab/Release object' }
        ]
      },
      {
        title: 'Communication',
        items: [
          { key: 'T', description: 'Open chat' },
          { key: 'Enter', description: 'Send message' },
          { key: 'Escape', description: 'Close chat' }
        ]
      },
      {
        title: 'Spawning',
        items: [
          { key: 'Space', description: 'Toggle spawn menu' },
          { key: 'Left Click', description: 'Spawn selected object' },
          { key: 'Right Click', description: 'Remove object' }
        ]
      },
      {
        title: 'UI',
        items: [
          { key: 'H', description: 'Toggle this help overlay' },
          { key: 'M', description: 'Toggle thought stream panel' },
          { key: 'W', description: 'Toggle workspace debug panel' },
          { key: 'F3', description: 'Toggle debug info' },
          { key: 'P', description: 'Pause/Resume game' }
        ]
      }
    ];
  }
  
  /**
   * Toggle overlay visibility
   */
  toggle() {
    this.isVisible = !this.isVisible;
  }
  
  /**
   * Show the overlay
   */
  show() {
    this.isVisible = true;
  }
  
  /**
   * Hide the overlay
   */
  hide() {
    this.isVisible = false;
  }
  
  /**
   * Render the help overlay
   * Requirement 15.1: Display basic instructions or help overlay
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   */
  render(ctx) {
    if (!this.isVisible) return;
    
    const canvas = ctx.canvas;
    const overlayX = (canvas.width - this.overlayWidth) / 2;
    const overlayY = (canvas.height - this.overlayHeight) / 2;
    
    // Draw semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(overlayX, overlayY, this.overlayWidth, this.overlayHeight);
    
    // Draw border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(overlayX, overlayY, this.overlayWidth, this.overlayHeight);
    
    // Draw title
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('AI Playground - Controls', overlayX + this.overlayWidth / 2, overlayY + 40);
    
    // Draw subtitle
    ctx.font = '14px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText('Press H to toggle this help overlay', overlayX + this.overlayWidth / 2, overlayY + 65);
    
    // Render control sections
    let currentY = overlayY + 90;
    const sectionSpacing = 15;
    const itemSpacing = 20;
    
    this.controls.forEach(section => {
      // Draw section title
      ctx.fillStyle = '#4CAF50';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(section.title, overlayX + this.padding, currentY);
      currentY += 25;
      
      // Draw section items
      ctx.font = '14px Arial';
      section.items.forEach(item => {
        // Draw key
        ctx.fillStyle = 'white';
        ctx.fillText(item.key, overlayX + this.padding + 10, currentY);
        
        // Draw description
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillText(item.description, overlayX + this.padding + 150, currentY);
        
        currentY += itemSpacing;
      });
      
      currentY += sectionSpacing;
    });
    
    // Draw footer
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Interact with the AI-controlled NPC and observe its consciousness!', 
                 overlayX + this.overlayWidth / 2, overlayY + this.overlayHeight - 20);
  }
}
