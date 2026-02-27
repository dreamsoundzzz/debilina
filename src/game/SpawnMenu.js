import { GameObject } from './GameObject.js';
import { Vec2 } from '../physics/Vec2.js';

/**
 * SpawnMenu provides a UI for spawning game objects
 * 
 * Requirements:
 * - 8.2: Display categories of Game_Objects
 * - 8.4: Support at least 20 different object types
 */
export class SpawnMenu {
  /**
   * Create a new spawn menu
   * @param {GameEngine} gameEngine - Reference to the game engine
   */
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.isOpen = false;
    this.categories = this.initializeCategories();
    this.selectedCategory = 'basic';
    this.selectedObject = null;
  }
  
  /**
   * Initialize object categories with type definitions
   * Requirement 8.4: Support at least 20 different object types
   * @returns {Object} Categories with object definitions
   */
  initializeCategories() {
    return {
      basic: [
        { 
          name: 'Box', 
          type: 'box', 
          size: { width: 40, height: 40 }, 
          mass: 10,
          grabbable: true,
          blocksVision: true
        },
        { 
          name: 'Ball', 
          type: 'ball', 
          radius: 20, 
          mass: 5,
          grabbable: true,
          blocksVision: false
        },
        { 
          name: 'Platform', 
          type: 'platform', 
          size: { width: 200, height: 20 }, 
          mass: 0, 
          static: true,
          grabbable: false,
          blocksVision: true
        },
        { 
          name: 'Ramp', 
          type: 'ramp', 
          size: { width: 100, height: 50 }, 
          mass: 0, 
          static: true,
          grabbable: false,
          blocksVision: true
        },
        { 
          name: 'Barrel', 
          type: 'barrel', 
          radius: 25, 
          mass: 15,
          grabbable: true,
          blocksVision: true
        }
      ],
      melee: [
        { 
          name: 'Sword', 
          type: 'sword', 
          size: { width: 10, height: 60 }, 
          mass: 2, 
          weapon: true,
          weaponType: 'melee',
          damageType: 'slash',
          damage: 30,
          grabbable: true,
          blocksVision: false
        },
        { 
          name: 'Axe', 
          type: 'axe', 
          size: { width: 15, height: 50 }, 
          mass: 3, 
          weapon: true,
          weaponType: 'melee',
          damageType: 'chop',
          damage: 35,
          grabbable: true,
          blocksVision: false
        },
        { 
          name: 'Mace', 
          type: 'mace', 
          radius: 15, 
          mass: 4, 
          weapon: true,
          weaponType: 'melee',
          damageType: 'blunt',
          damage: 25,
          grabbable: true,
          blocksVision: false
        },
        { 
          name: 'Stick', 
          type: 'stick', 
          size: { width: 8, height: 70 }, 
          mass: 1, 
          weapon: true,
          weaponType: 'melee',
          damageType: 'blunt',
          damage: 10,
          grabbable: true,
          blocksVision: false
        },
        { 
          name: 'Dagger', 
          type: 'dagger', 
          size: { width: 8, height: 30 }, 
          mass: 0.5, 
          weapon: true,
          weaponType: 'melee',
          damageType: 'pierce',
          damage: 20,
          grabbable: true,
          blocksVision: false
        }
      ],
      ranged: [
        { 
          name: 'Pistol', 
          type: 'pistol', 
          size: { width: 20, height: 15 }, 
          mass: 1, 
          weapon: true,
          weaponType: 'ranged',
          damageType: 'bullet',
          damage: 40,
          ammo: 10,
          grabbable: true,
          blocksVision: false
        },
        { 
          name: 'Rifle', 
          type: 'rifle', 
          size: { width: 60, height: 15 }, 
          mass: 3, 
          weapon: true,
          weaponType: 'ranged',
          damageType: 'bullet',
          damage: 60,
          ammo: 10,
          grabbable: true,
          blocksVision: false
        }
      ],
      special: [
        { 
          name: 'Flamethrower', 
          type: 'flamethrower', 
          size: { width: 40, height: 25 }, 
          mass: 5, 
          weapon: true,
          weaponType: 'special',
          damageType: 'fire',
          damage: 5,
          fuel: 30,
          grabbable: true,
          blocksVision: false
        },
        { 
          name: 'Chainsaw', 
          type: 'chainsaw', 
          size: { width: 50, height: 20 }, 
          mass: 6, 
          weapon: true,
          weaponType: 'special',
          damageType: 'cut',
          damage: 15,
          fuel: 30,
          grabbable: true,
          blocksVision: false
        }
      ],
      hazards: [
        { 
          name: 'Gasoline Canister', 
          type: 'gasoline', 
          radius: 20, 
          mass: 8, 
          flammable: true, 
          explosive: true,
          grabbable: true,
          blocksVision: false  // Small object, doesn't block vision
        }
      ],
      consumables: [
        { 
          name: 'Apple', 
          type: 'apple', 
          radius: 10, 
          mass: 0.2, 
          consumable: 'food', 
          consumableValue: 20,
          grabbable: true,
          blocksVision: false
        },
        { 
          name: 'Bread', 
          type: 'bread', 
          size: { width: 25, height: 15 }, 
          mass: 0.3, 
          consumable: 'food', 
          consumableValue: 30,
          grabbable: true,
          blocksVision: false
        },
        { 
          name: 'Water Bottle', 
          type: 'water', 
          size: { width: 10, height: 25 }, 
          mass: 0.5, 
          consumable: 'drink', 
          consumableValue: 40,
          grabbable: true,
          blocksVision: false
        },
        { 
          name: 'Soda', 
          type: 'soda', 
          size: { width: 10, height: 20 }, 
          mass: 0.4, 
          consumable: 'drink', 
          consumableValue: 25,
          grabbable: true,
          blocksVision: false
        },
        { 
          name: 'Meat', 
          type: 'meat', 
          size: { width: 30, height: 20 }, 
          mass: 0.5, 
          consumable: 'food', 
          consumableValue: 50,
          grabbable: true,
          blocksVision: false
        }
      ]
    };
  }
  
  /**
   * Toggle the spawn menu open/closed
   */
  toggle() {
    this.isOpen = !this.isOpen;
  }
  
  /**
   * Open the spawn menu
   */
  open() {
    this.isOpen = true;
  }
  
  /**
   * Close the spawn menu
   */
  close() {
    this.isOpen = false;
  }
  
  /**
   * Set the selected category
   * @param {string} category - Category name
   */
  selectCategory(category) {
    if (this.categories[category]) {
      this.selectedCategory = category;
      this.selectedObject = null;
    }
  }
  
  /**
   * Set the selected object type
   * @param {Object} objectData - Object definition
   */
  selectObject(objectData) {
    this.selectedObject = objectData;
  }
  
  /**
   * Spawn an object at the specified position
   * @param {string} type - Object type
   * @param {Vec2} position - Spawn position
   * @returns {GameObject|null} The spawned object or null if type not found
   */
  spawnObject(type, position) {
    const objectData = this.findObjectData(type);
    if (!objectData) return null;
    
    const gameObject = new GameObject(type, objectData, position);
    return gameObject;
  }
  
  /**
   * Find object data by type
   * @param {string} type - Object type
   * @returns {Object|null} Object data or null if not found
   */
  findObjectData(type) {
    for (const category in this.categories) {
      const objects = this.categories[category];
      const found = objects.find(obj => obj.type === type);
      if (found) return found;
    }
    return null;
  }
  
  /**
   * Get all object types in a category
   * @param {string} category - Category name
   * @returns {Array} Array of object definitions
   */
  getObjectsInCategory(category) {
    return this.categories[category] || [];
  }
  
  /**
   * Get all category names
   * @returns {Array<string>} Array of category names
   */
  getCategoryNames() {
    return Object.keys(this.categories);
  }
  
  /**
   * Get the total number of object types
   * @returns {number} Total object type count
   */
  getTotalObjectCount() {
    let count = 0;
    for (const category in this.categories) {
      count += this.categories[category].length;
    }
    return count;
  }
  
  /**
   * Render the spawn menu UI
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   */
  render(ctx) {
    if (!this.isOpen) return;
    
    const canvas = ctx.canvas;
    
    // Draw semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Menu panel dimensions
    const menuWidth = 600;
    const menuHeight = 400;
    const menuX = (canvas.width - menuWidth) / 2;
    const menuY = (canvas.height - menuHeight) / 2;
    
    // Draw menu panel background
    ctx.fillStyle = 'white';
    ctx.fillRect(menuX, menuY, menuWidth, menuHeight);
    
    // Draw border
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);
    
    // Draw title
    ctx.fillStyle = 'black';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Spawn Menu', menuX + menuWidth / 2, menuY + 30);
    
    // Draw categories
    this.renderCategories(ctx, menuX, menuY, menuWidth, menuHeight);
    
    // Draw objects in selected category
    this.renderObjects(ctx, menuX, menuY, menuWidth, menuHeight);
    
    // Draw instructions
    ctx.font = '14px Arial';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    ctx.fillText('Click an object to select, then click on the canvas to spawn', 
                 menuX + menuWidth / 2, menuY + menuHeight - 10);
  }
  
  /**
   * Render category tabs
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {number} menuX - Menu X position
   * @param {number} menuY - Menu Y position
   * @param {number} menuWidth - Menu width
   * @param {number} menuHeight - Menu height
   */
  renderCategories(ctx, menuX, menuY, menuWidth, menuHeight) {
    const categories = this.getCategoryNames();
    const tabWidth = menuWidth / categories.length;
    const tabHeight = 40;
    const tabY = menuY + 50;
    
    categories.forEach((category, index) => {
      const tabX = menuX + index * tabWidth;
      const isSelected = category === this.selectedCategory;
      
      // Draw tab background
      ctx.fillStyle = isSelected ? '#4CAF50' : '#ddd';
      ctx.fillRect(tabX, tabY, tabWidth, tabHeight);
      
      // Draw tab border
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 1;
      ctx.strokeRect(tabX, tabY, tabWidth, tabHeight);
      
      // Draw tab text
      ctx.fillStyle = isSelected ? 'white' : 'black';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(category.charAt(0).toUpperCase() + category.slice(1), 
                   tabX + tabWidth / 2, tabY + 25);
    });
  }
  
  /**
   * Render objects in the selected category
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {number} menuX - Menu X position
   * @param {number} menuY - Menu Y position
   * @param {number} menuWidth - Menu width
   * @param {number} menuHeight - Menu height
   */
  renderObjects(ctx, menuX, menuY, menuWidth, menuHeight) {
    const objects = this.getObjectsInCategory(this.selectedCategory);
    const contentY = menuY + 100;
    const contentHeight = menuHeight - 150;
    const itemsPerRow = 4;
    const itemWidth = (menuWidth - 40) / itemsPerRow;
    const itemHeight = 80;
    
    objects.forEach((obj, index) => {
      const row = Math.floor(index / itemsPerRow);
      const col = index % itemsPerRow;
      const itemX = menuX + 20 + col * itemWidth;
      const itemY = contentY + row * itemHeight;
      
      const isSelected = this.selectedObject === obj;
      
      // Draw item background
      ctx.fillStyle = isSelected ? '#E3F2FD' : '#f5f5f5';
      ctx.fillRect(itemX, itemY, itemWidth - 10, itemHeight - 10);
      
      // Draw item border
      ctx.strokeStyle = isSelected ? '#2196F3' : '#ccc';
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.strokeRect(itemX, itemY, itemWidth - 10, itemHeight - 10);
      
      // Draw item name
      ctx.fillStyle = 'black';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(obj.name, itemX + (itemWidth - 10) / 2, itemY + itemHeight - 20);
      
      // Draw simple icon representation
      this.renderObjectIcon(ctx, obj, itemX + (itemWidth - 10) / 2, itemY + 30);
    });
  }
  
  /**
   * Render a simple icon for an object
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {Object} objectData - Object definition
   * @param {number} x - Icon center X
   * @param {number} y - Icon center Y
   */
  renderObjectIcon(ctx, objectData, x, y) {
    const scale = 0.5;
    
    ctx.save();
    ctx.translate(x, y);
    
    if (objectData.radius) {
      // Draw circle
      ctx.beginPath();
      ctx.arc(0, 0, objectData.radius * scale, 0, Math.PI * 2);
      ctx.fillStyle = this.getObjectColor(objectData);
      ctx.fill();
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else if (objectData.size) {
      // Draw rectangle
      const w = objectData.size.width * scale;
      const h = objectData.size.height * scale;
      ctx.fillStyle = this.getObjectColor(objectData);
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 1;
      ctx.strokeRect(-w / 2, -h / 2, w, h);
    }
    
    ctx.restore();
  }
  
  /**
   * Get a color for an object based on its type
   * @param {Object} objectData - Object definition
   * @returns {string} CSS color string
   */
  getObjectColor(objectData) {
    if (objectData.weapon) {
      if (objectData.weaponType === 'melee') return '#FF5722';
      if (objectData.weaponType === 'ranged') return '#795548';
      if (objectData.weaponType === 'special') return '#9C27B0';
    }
    if (objectData.consumable === 'food') return '#4CAF50';
    if (objectData.consumable === 'drink') return '#2196F3';
    if (objectData.explosive) return '#FF9800';
    if (objectData.static) return '#9E9E9E';
    return '#607D8B';
  }
  
  /**
   * Handle mouse click on the menu
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   * @param {number} canvasWidth - Canvas width
   * @param {number} canvasHeight - Canvas height
   * @returns {boolean} True if click was handled by menu
   */
  handleClick(mouseX, mouseY, canvasWidth, canvasHeight) {
    if (!this.isOpen) return false;
    
    const menuWidth = 600;
    const menuHeight = 400;
    const menuX = (canvasWidth - menuWidth) / 2;
    const menuY = (canvasHeight - menuHeight) / 2;
    
    // Check if click is outside menu (close menu)
    if (mouseX < menuX || mouseX > menuX + menuWidth ||
        mouseY < menuY || mouseY > menuY + menuHeight) {
      return false;
    }
    
    // Check category tabs
    const categories = this.getCategoryNames();
    const tabWidth = menuWidth / categories.length;
    const tabHeight = 40;
    const tabY = menuY + 50;
    
    if (mouseY >= tabY && mouseY <= tabY + tabHeight) {
      const tabIndex = Math.floor((mouseX - menuX) / tabWidth);
      if (tabIndex >= 0 && tabIndex < categories.length) {
        this.selectCategory(categories[tabIndex]);
        return true;
      }
    }
    
    // Check object items
    const objects = this.getObjectsInCategory(this.selectedCategory);
    const contentY = menuY + 100;
    const itemsPerRow = 4;
    const itemWidth = (menuWidth - 40) / itemsPerRow;
    const itemHeight = 80;
    
    objects.forEach((obj, index) => {
      const row = Math.floor(index / itemsPerRow);
      const col = index % itemsPerRow;
      const itemX = menuX + 20 + col * itemWidth;
      const itemY = contentY + row * itemHeight;
      
      if (mouseX >= itemX && mouseX <= itemX + itemWidth - 10 &&
          mouseY >= itemY && mouseY <= itemY + itemHeight - 10) {
        this.selectObject(obj);
      }
    });
    
    return true;
  }
}
