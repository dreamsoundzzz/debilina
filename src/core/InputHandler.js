/**
 * InputHandler - Manages mouse and keyboard input for the game
 * 
 * Tracks:
 * - Mouse position and button states
 * - Keyboard key states
 * - Hotkey system for hand switching and other controls
 * 
 * Requirements: 3.2, 15.2
 */
export class InputHandler {
  constructor(canvas) {
    this.canvas = canvas;
    
    // Mouse state
    this.mousePosition = { x: 0, y: 0 };
    this.mouseButtons = {
      left: false,
      middle: false,
      right: false
    };
    
    // Keyboard state
    this.keys = new Map();
    
    // Active hand control (left or right)
    this.activeHand = 'right';
    
    // Hotkey bindings
    this.hotkeys = new Map();
    this.setupDefaultHotkeys();
    
    // Bind event listeners
    this.bindEvents();
  }
  
  /**
   * Set up default hotkey bindings
   */
  setupDefaultHotkeys() {
    // Hand switching (Tab key)
    this.hotkeys.set('Tab', () => {
      this.activeHand = this.activeHand === 'left' ? 'right' : 'left';
      return { type: 'handSwitch', hand: this.activeHand };
    });
    
    // Spawn menu (Space bar)
    this.hotkeys.set(' ', () => {
      return { type: 'toggleSpawnMenu' };
    });
    
    // Pause/Resume (P key)
    this.hotkeys.set('p', () => {
      return { type: 'togglePause' };
    });
    
    // Chat (T key)
    this.hotkeys.set('t', () => {
      return { type: 'openChat' };
    });
  }
  
  /**
   * Bind mouse and keyboard event listeners
   */
  bindEvents() {
    // Mouse move
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mousePosition.x = e.clientX - rect.left;
      this.mousePosition.y = e.clientY - rect.top;
    });
    
    // Mouse buttons
    this.canvas.addEventListener('mousedown', (e) => {
      e.preventDefault();
      switch (e.button) {
        case 0: this.mouseButtons.left = true; break;
        case 1: this.mouseButtons.middle = true; break;
        case 2: this.mouseButtons.right = true; break;
      }
    });
    
    this.canvas.addEventListener('mouseup', (e) => {
      e.preventDefault();
      switch (e.button) {
        case 0: this.mouseButtons.left = false; break;
        case 1: this.mouseButtons.middle = false; break;
        case 2: this.mouseButtons.right = false; break;
      }
    });
    
    // Prevent context menu on right-click
    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
    
    // Keyboard
    window.addEventListener('keydown', (e) => {
      // Don't process if already pressed (prevents key repeat)
      if (this.keys.get(e.key)) {
        return;
      }
      
      this.keys.set(e.key, true);
      
      // Check for hotkey
      const hotkey = this.hotkeys.get(e.key);
      if (hotkey) {
        e.preventDefault();
        const event = hotkey();
        if (event) {
          this.dispatchHotkeyEvent(event);
        }
      }
    });
    
    window.addEventListener('keyup', (e) => {
      this.keys.set(e.key, false);
    });
  }
  
  /**
   * Dispatch a hotkey event (can be overridden or listened to)
   */
  dispatchHotkeyEvent(event) {
    // This can be connected to the event system
    // For now, store the last hotkey event
    this.lastHotkeyEvent = event;
  }
  
  /**
   * Get the current mouse position in canvas coordinates
   */
  getMousePosition() {
    return { ...this.mousePosition };
  }
  
  /**
   * Check if a mouse button is currently pressed
   */
  isMouseButtonDown(button) {
    return this.mouseButtons[button] || false;
  }
  
  /**
   * Check if a key is currently pressed
   */
  isKeyDown(key) {
    return this.keys.get(key) || false;
  }
  
  /**
   * Get the currently active hand (left or right)
   */
  getActiveHand() {
    return this.activeHand;
  }
  
  /**
   * Set the active hand
   */
  setActiveHand(hand) {
    if (hand === 'left' || hand === 'right') {
      this.activeHand = hand;
    }
  }
  
  /**
   * Register a custom hotkey
   */
  registerHotkey(key, callback) {
    this.hotkeys.set(key, callback);
  }
  
  /**
   * Unregister a hotkey
   */
  unregisterHotkey(key) {
    this.hotkeys.delete(key);
  }
  
  /**
   * Get and clear the last hotkey event
   */
  pollHotkeyEvent() {
    const event = this.lastHotkeyEvent || null;
    this.lastHotkeyEvent = null;
    return event;
  }
  
  /**
   * Reset all input states
   */
  reset() {
    this.mouseButtons.left = false;
    this.mouseButtons.middle = false;
    this.mouseButtons.right = false;
    this.keys.clear();
    this.lastHotkeyEvent = null;
  }
}
