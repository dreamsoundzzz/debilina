/**
 * PlayerIdentity - Manages player character identity and name
 * 
 * Requirements:
 * - 32.1: Prompt player to enter character name on game start
 * - 32.2: Display player name above character or in UI
 * - 32.3: NPC remembers player name
 * - 32.4: NPC uses player name in dialogue when appropriate
 * - 32.5: Associate player identity with actions and statements
 */
export class PlayerIdentity {
  /**
   * Create a new PlayerIdentity system
   * @param {Object} player - Player character
   */
  constructor(player) {
    this.player = player;
    this.playerName = null;
    this.hasPrompted = false;
    this.namePromptElement = null;
  }
  
  /**
   * Initialize the player identity system
   * Requirement 32.1: Prompt for player name on game start
   */
  initialize() {
    // Check if name is already stored in localStorage
    const storedName = localStorage.getItem('playerName');
    if (storedName) {
      this.playerName = storedName;
      if (this.player) {
        this.player.name = this.playerName;
      }
      this.hasPrompted = true;
    } else {
      // Show name prompt
      this.showNamePrompt();
    }
  }
  
  /**
   * Show name prompt dialog
   * Requirement 32.1: Prompt player to enter character name
   */
  showNamePrompt() {
    if (this.hasPrompted) return;
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'name-prompt-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    `;
    
    // Create prompt container
    const container = document.createElement('div');
    container.className = 'name-prompt-container';
    container.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
      text-align: center;
      max-width: 400px;
    `;
    
    // Create title
    const title = document.createElement('h2');
    title.textContent = 'Welcome to AI Playground';
    title.style.cssText = `
      margin: 0 0 10px 0;
      color: #333;
      font-size: 24px;
    `;
    
    // Create description
    const description = document.createElement('p');
    description.textContent = 'What is your character\'s name?';
    description.style.cssText = `
      margin: 0 0 20px 0;
      color: #666;
      font-size: 16px;
    `;
    
    // Create input
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Enter your name';
    input.maxLength = 20;
    input.style.cssText = `
      width: 100%;
      padding: 10px;
      font-size: 16px;
      border: 2px solid #ddd;
      border-radius: 5px;
      box-sizing: border-box;
      margin-bottom: 20px;
    `;
    
    // Create button
    const button = document.createElement('button');
    button.textContent = 'Start Game';
    button.style.cssText = `
      padding: 10px 30px;
      font-size: 16px;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      transition: background 0.3s;
    `;
    
    button.addEventListener('mouseenter', () => {
      button.style.background = '#45a049';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.background = '#4CAF50';
    });
    
    // Handle submit
    const submitName = () => {
      const name = input.value.trim();
      if (name.length > 0) {
        this.setPlayerName(name);
        document.body.removeChild(overlay);
        this.hasPrompted = true;
      } else {
        input.style.borderColor = 'red';
        input.placeholder = 'Please enter a name';
      }
    };
    
    button.addEventListener('click', submitName);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        submitName();
      }
    });
    
    // Assemble elements
    container.appendChild(title);
    container.appendChild(description);
    container.appendChild(input);
    container.appendChild(button);
    overlay.appendChild(container);
    document.body.appendChild(overlay);
    
    // Focus input
    setTimeout(() => input.focus(), 100);
    
    this.namePromptElement = overlay;
  }
  
  /**
   * Set the player's name
   * Requirement 32.2: Display player name
   * Requirement 32.3: NPC remembers player name
   * @param {string} name - Player's character name
   */
  setPlayerName(name) {
    this.playerName = name;
    
    // Store in localStorage for persistence
    localStorage.setItem('playerName', name);
    
    // Set on player character
    if (this.player) {
      this.player.name = name;
    }
    
    // Emit event for other systems
    if (window.gameEngine && window.gameEngine.events) {
      window.gameEngine.events.emit('player:nameSet', name);
    }
  }
  
  /**
   * Get the player's name
   * @returns {string|null} Player name or null if not set
   */
  getPlayerName() {
    return this.playerName;
  }
  
  /**
   * Check if player has been prompted for name
   * @returns {boolean} True if prompted
   */
  hasBeenPrompted() {
    return this.hasPrompted;
  }
  
  /**
   * Clear stored player name (for testing or reset)
   */
  clearPlayerName() {
    this.playerName = null;
    this.hasPrompted = false;
    localStorage.removeItem('playerName');
    if (this.player) {
      this.player.name = null;
    }
  }
  
  /**
   * Update method (called each frame)
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    // No per-frame updates needed
  }
  
  /**
   * Render player name above character
   * Requirement 32.2: Display player name above character
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   */
  render(ctx) {
    if (!this.playerName || !this.player || !this.player.head || !this.player.head.position) {
      return;
    }
    
    const headPos = this.player.head.position;
    const nameOffset = { x: 0, y: -40 }; // Above head
    
    ctx.save();
    
    // Draw name background
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const textWidth = ctx.measureText(this.playerName).width;
    const padding = 6;
    const bgWidth = textWidth + padding * 2;
    const bgHeight = 20;
    
    const bgX = headPos.x - bgWidth / 2;
    const bgY = headPos.y + nameOffset.y - bgHeight / 2;
    
    // Background
    ctx.fillStyle = 'rgba(100, 150, 255, 0.8)';
    ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
    
    // Border
    ctx.strokeStyle = 'rgba(50, 100, 200, 1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(bgX, bgY, bgWidth, bgHeight);
    
    // Text
    ctx.fillStyle = 'white';
    ctx.fillText(this.playerName, headPos.x, headPos.y + nameOffset.y);
    
    ctx.restore();
  }
}
