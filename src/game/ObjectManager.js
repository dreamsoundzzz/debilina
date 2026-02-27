import { Vec2 } from '../physics/Vec2.js';

/**
 * ObjectManager - Manages game object spawning, removal, and lifecycle
 * 
 * Integrates SpawnMenu and InputHandler to handle:
 * - Spawning objects at click position when menu item selected (Requirement 8.3)
 * - Removing objects on right-click (Requirement 8.6)
 * - Toggling menu with spacebar hotkey (Requirement 15.2)
 * 
 * Requirements: 8.1, 8.3, 8.6, 15.2
 */
export class ObjectManager {
  /**
   * Create a new object manager
   * @param {SpawnMenu} spawnMenu - The spawn menu instance
   * @param {InputHandler} inputHandler - The input handler instance
   */
  constructor(spawnMenu, inputHandler) {
    this.spawnMenu = spawnMenu;
    this.inputHandler = inputHandler;
    this.objects = [];
    
    // Track mouse button states for click detection
    this.leftButtonWasDown = false;
    this.rightButtonWasDown = false;
  }
  
  /**
   * Update the object manager
   * Handles input for spawning and removing objects
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    // Check for spacebar hotkey to toggle spawn menu (Requirement 15.2)
    const hotkeyEvent = this.inputHandler.pollHotkeyEvent();
    if (hotkeyEvent && hotkeyEvent.type === 'toggleSpawnMenu') {
      this.spawnMenu.toggle();
    }
    
    // Get current mouse state
    const mousePos = this.inputHandler.getMousePosition();
    const leftDown = this.inputHandler.isMouseButtonDown('left');
    const rightDown = this.inputHandler.isMouseButtonDown('right');
    
    // Handle left click (spawn or menu interaction)
    if (leftDown && !this.leftButtonWasDown) {
      this.handleLeftClick(mousePos);
    }
    
    // Handle right click (remove object) (Requirement 8.6)
    if (rightDown && !this.rightButtonWasDown) {
      this.handleRightClick(mousePos);
    }
    
    // Update button states for next frame
    this.leftButtonWasDown = leftDown;
    this.rightButtonWasDown = rightDown;
    
    // Update all game objects
    for (const obj of this.objects) {
      obj.update(dt);
    }
  }
  
  /**
   * Handle left mouse click
   * Either interacts with spawn menu or spawns selected object
   * @param {Object} mousePos - Mouse position {x, y}
   */
  handleLeftClick(mousePos) {
    const canvas = this.inputHandler.canvas;
    
    if (this.spawnMenu.isOpen) {
      // Let spawn menu handle the click
      const handled = this.spawnMenu.handleClick(
        mousePos.x, 
        mousePos.y, 
        canvas.width, 
        canvas.height
      );
      
      // If click was outside menu, try to spawn object
      if (!handled && this.spawnMenu.selectedObject) {
        this.spawnObjectAtPosition(mousePos);
        this.spawnMenu.close();
      }
    } else if (this.spawnMenu.selectedObject) {
      // Menu is closed but object is selected - spawn it (Requirement 8.3)
      this.spawnObjectAtPosition(mousePos);
    }
  }
  
  /**
   * Handle right mouse click
   * Removes the object at the click position
   * Requirement 8.6: Remove objects on right-click
   * @param {Object} mousePos - Mouse position {x, y}
   */
  handleRightClick(mousePos) {
    // Don't remove objects if spawn menu is open
    if (this.spawnMenu.isOpen) {
      return;
    }
    
    const clickPos = new Vec2(mousePos.x, mousePos.y);
    
    // Find object at click position (check in reverse order for top-most)
    for (let i = this.objects.length - 1; i >= 0; i--) {
      const obj = this.objects[i];
      if (obj.containsPoint(clickPos)) {
        this.removeObject(obj);
        break; // Only remove one object per click
      }
    }
  }
  
  /**
   * Spawn an object at the specified position
   * Requirement 8.3: Spawn objects at click position when menu item selected
   * @param {Object} mousePos - Mouse position {x, y}
   */
  spawnObjectAtPosition(mousePos) {
    const selectedObj = this.spawnMenu.selectedObject;
    if (!selectedObj) return;
    
    const position = new Vec2(mousePos.x, mousePos.y);
    const gameObject = this.spawnMenu.spawnObject(selectedObj.type, position);
    
    if (gameObject) {
      this.objects.push(gameObject);
      console.log(`Spawned ${selectedObj.name} at (${mousePos.x}, ${mousePos.y})`);
    }
  }
  
  /**
   * Remove an object from the world
   * Requirement 8.6: Remove objects on right-click
   * @param {GameObject} obj - Object to remove
   */
  removeObject(obj) {
    const index = this.objects.indexOf(obj);
    if (index !== -1) {
      this.objects.splice(index, 1);
      console.log(`Removed ${obj.type} (${obj.id})`);
    }
  }
  
  /**
   * Remove an object by ID
   * @param {string} id - Object ID
   * @returns {boolean} True if object was removed
   */
  removeObjectById(id) {
    const index = this.objects.findIndex(obj => obj.id === id);
    if (index !== -1) {
      const obj = this.objects[index];
      this.objects.splice(index, 1);
      console.log(`Removed ${obj.type} (${obj.id})`);
      return true;
    }
    return false;
  }
  
  /**
   * Get all objects in the world
   * @returns {Array<GameObject>} Array of game objects
   */
  getObjects() {
    return this.objects;
  }
  
  /**
   * Get objects at a specific position
   * @param {Vec2} position - Position to check
   * @param {number} radius - Search radius (default 0 for exact point)
   * @returns {Array<GameObject>} Objects at or near the position
   */
  getObjectsAtPosition(position, radius = 0) {
    return this.objects.filter(obj => {
      if (radius === 0) {
        return obj.containsPoint(position);
      } else {
        return obj.position.distanceTo(position) <= radius;
      }
    });
  }
  
  /**
   * Clear all objects from the world
   */
  clearAllObjects() {
    this.objects = [];
    console.log('Cleared all objects');
  }
  
  /**
   * Render all game objects and the spawn menu
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   */
  render(ctx) {
    // Render all game objects
    for (const obj of this.objects) {
      this.renderObject(ctx, obj);
    }
    
    // Render spawn menu on top
    this.spawnMenu.render(ctx);
  }
  
  /**
   * Render a single game object
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {GameObject} obj - Object to render
   */
  renderObject(ctx, obj) {
    ctx.save();
    ctx.translate(obj.position.x, obj.position.y);
    ctx.rotate(obj.rotation);
    
    // Get color based on object type
    const color = this.getObjectRenderColor(obj);
    
    if (obj.shape === 'circle') {
      // Draw circle
      ctx.beginPath();
      ctx.arc(0, 0, obj.radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      // Draw rectangle
      const w = obj.size.width;
      const h = obj.size.height;
      ctx.fillStyle = color;
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.strokeRect(-w / 2, -h / 2, w, h);
    }
    
    // Draw fire effect if object is on fire
    if (obj.onFire) {
      this.renderFireEffect(ctx, obj);
    }
    
    ctx.restore();
  }
  
  /**
   * Get render color for an object based on its properties
   * @param {GameObject} obj - Object to get color for
   * @returns {string} CSS color string
   */
  getObjectRenderColor(obj) {
    if (obj.onFire) return '#FF6B00';
    if (obj.weapon) {
      if (obj.weaponType === 'melee') return '#FF5722';
      if (obj.weaponType === 'ranged') return '#795548';
      if (obj.weaponType === 'special') return '#9C27B0';
    }
    if (obj.consumable === 'food') return '#4CAF50';
    if (obj.consumable === 'drink') return '#2196F3';
    if (obj.explosive) return '#FF9800';
    if (obj.static) return '#9E9E9E';
    return '#607D8B';
  }
  
  /**
   * Render fire effect on burning objects
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {GameObject} obj - Burning object
   */
  renderFireEffect(ctx, obj) {
    const size = obj.radius || Math.max(obj.size.width, obj.size.height) / 2;
    
    // Draw simple flame particles
    ctx.fillStyle = 'rgba(255, 100, 0, 0.6)';
    for (let i = 0; i < 3; i++) {
      const angle = (Math.PI * 2 * i) / 3 + obj.fireDuration * 5;
      const x = Math.cos(angle) * size * 0.5;
      const y = Math.sin(angle) * size * 0.5 - size * 0.3;
      ctx.beginPath();
      ctx.arc(x, y, size * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
