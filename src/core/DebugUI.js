/**
 * DebugUI displays debug information and controls
 * 
 * Requirements:
 * - 15.5: Display FPS counter in debug mode
 * - 15.6: Provide pause/resume function via hotkey (P)
 * - 15.7: Display current control mode (which hand is active)
 */
export class DebugUI {
  /**
   * Create a new debug UI
   */
  constructor() {
    this.isVisible = true; // Debug UI visible by default
    this.isPaused = false;
    this.showVisionFOV = false;
    
    // FPS tracking
    this.fps = 60;
    this.frameCount = 0;
    this.lastFpsUpdate = Date.now();
    this.fpsUpdateInterval = 500; // Update FPS display every 500ms
    
    // UI positioning
    this.padding = 10;
    this.lineHeight = 20;
  }
  
  /**
   * Update FPS counter
   * Requirement 15.5: Display FPS counter
   */
  updateFPS() {
    this.frameCount++;
    const now = Date.now();
    const elapsed = now - this.lastFpsUpdate;
    
    if (elapsed >= this.fpsUpdateInterval) {
      this.fps = Math.round((this.frameCount * 1000) / elapsed);
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
  }
  
  /**
   * Toggle pause state
   * Requirement 15.6: Provide pause/resume function
   */
  togglePause() {
    this.isPaused = !this.isPaused;
  }
  
  /**
   * Set pause state
   * @param {boolean} paused - Pause state
   */
  setPaused(paused) {
    this.isPaused = paused;
  }
  
  /**
   * Check if game is paused
   * @returns {boolean} True if paused
   */
  getPaused() {
    return this.isPaused;
  }
  
  /**
   * Toggle vision FOV visualization
   */
  toggleVisionFOV() {
    this.showVisionFOV = !this.showVisionFOV;
  }
  
  /**
   * Set vision FOV visibility
   * @param {boolean} visible - Vision FOV visibility
   */
  setVisionFOV(visible) {
    this.showVisionFOV = visible;
  }
  
  /**
   * Check if vision FOV should be shown
   * @returns {boolean} True if vision FOV should be shown
   */
  getShowVisionFOV() {
    return this.showVisionFOV;
  }
  
  /**
   * Toggle debug UI visibility
   */
  toggle() {
    this.isVisible = !this.isVisible;
  }
  
  /**
   * Show debug UI
   */
  show() {
    this.isVisible = true;
  }
  
  /**
   * Hide debug UI
   */
  hide() {
    this.isVisible = false;
  }
  
  /**
   * Get current FPS
   * @returns {number} Current FPS
   */
  getFPS() {
    return this.fps;
  }
  
  /**
   * Render the debug UI
   * Requirements:
   * - 15.5: Display FPS counter
   * - 15.6: Display pause state
   * - 15.7: Display active hand indicator
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {Object} gameState - Current game state
   */
  render(ctx, gameState = {}) {
    if (!this.isVisible) return;
    
    const canvas = ctx.canvas;
    let currentY = this.padding;
    
    // Set text style
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    
    // Draw background for better readability
    const bgWidth = 200;
    const bgHeight = this.lineHeight * 5 + this.padding;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(this.padding, this.padding, bgWidth, bgHeight);
    
    currentY += this.lineHeight;
    
    // Requirement 15.5: Display FPS counter
    ctx.fillStyle = this.fps >= 50 ? '#4CAF50' : (this.fps >= 30 ? '#FFC107' : '#F44336');
    ctx.fillText(`FPS: ${this.fps}`, this.padding + 10, currentY);
    currentY += this.lineHeight;
    
    // Requirement 15.6: Display pause state
    ctx.fillStyle = this.isPaused ? '#F44336' : '#4CAF50';
    ctx.fillText(`Status: ${this.isPaused ? 'PAUSED' : 'Running'}`, this.padding + 10, currentY);
    currentY += this.lineHeight;
    
    // Requirement 15.7: Display active hand indicator
    const activeHand = gameState.activeHand || 'right';
    ctx.fillStyle = 'white';
    ctx.fillText(`Active Hand: ${activeHand}`, this.padding + 10, currentY);
    currentY += this.lineHeight;
    
    // Display vision FOV toggle state
    ctx.fillStyle = this.showVisionFOV ? '#4CAF50' : '#666';
    ctx.fillText(`Vision FOV: ${this.showVisionFOV ? 'ON' : 'OFF'}`, this.padding + 10, currentY);
    currentY += this.lineHeight;
    
    // Display controls hint
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '10px monospace';
    ctx.fillText('[P] Pause [V] Vision [D] Debug', this.padding + 10, currentY);
  }
  
  /**
   * Render pause overlay
   * Shows a large "PAUSED" message in the center of the screen
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   */
  renderPauseOverlay(ctx) {
    if (!this.isPaused) return;
    
    const canvas = ctx.canvas;
    
    // Draw semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw "PAUSED" text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    
    // Draw instruction
    ctx.font = '20px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText('Press P to resume', canvas.width / 2, canvas.height / 2 + 40);
  }
}
