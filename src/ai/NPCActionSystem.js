/**
 * NPCActionSystem - Executes actions for NPCs
 * Handles weapon usage, grabbing, reaching, and movement
 * 
 * Requirements:
 * - 25.4: NPC can grab and use weapons following same mechanics as player
 * - 25.5: NPC generates appropriate weapon action commands
 * - 9.3: NPC can reach for and manipulate objects using IK
 */
import { IKSystem } from '../physics/IKSystem.js';
import { Vec2 } from '../physics/Vec2.js';

export class NPCActionSystem {
  /**
   * Create a new NPC action system
   * @param {Object} npc - NPC character
   * @param {GrabSystem} grabSystem - Grab system for object manipulation
   * @param {WeaponSystem} weaponSystem - Weapon system for weapon usage
   * @param {Array} gameObjects - Array of game objects in the world
   */
  constructor(npc, grabSystem, weaponSystem, gameObjects = []) {
    this.npc = npc;
    this.grabSystem = grabSystem;
    this.weaponSystem = weaponSystem;
    this.gameObjects = gameObjects;
    
    // Action state
    this.currentAction = null;
    this.reachTarget = null;
    this.aimTarget = null;
  }

  /**
   * Execute an action parsed from Ollama response
   * @param {Object} action - Action object with type and parameters
   * @returns {boolean} True if action was executed successfully
   */
  executeAction(action) {
    if (!action || !action.type) {
      return false;
    }

    switch (action.type) {
      case 'grab':
        return this.executeGrab(action.object);
      
      case 'release':
        return this.executeRelease();
      
      case 'reach':
        return this.executeReach(action.target);
      
      case 'swing':
        return this.executeSwing();
      
      case 'fire':
        return this.executeFire();
      
      case 'aim':
        return this.executeAim(action.target);
      
      default:
        console.warn(`NPCActionSystem: Unknown action type: ${action.type}`);
        return false;
    }
  }

  /**
   * Execute grab action
   * Attempts to grab a specific object with the NPC's right hand
   * @param {string} objectName - Name or type of object to grab
   * @returns {boolean} True if grab was successful
   */
  executeGrab(objectName) {
    if (!this.npc.rightHand) {
      return false;
    }

    // Check if already holding something
    if (this.grabSystem.isGrabbing(this.npc.rightHand)) {
      console.log('NPCActionSystem: Already holding an object');
      return false;
    }

    // Find matching object
    const target = this.findObjectByName(objectName);
    if (!target) {
      console.log(`NPCActionSystem: Could not find object: ${objectName}`);
      return false;
    }

    // Check if object is within grab radius
    const distance = this.npc.rightHand.position.distanceTo(target.position);
    if (distance > this.grabSystem.getGrabRadius()) {
      console.log(`NPCActionSystem: Object too far to grab: ${distance} > ${this.grabSystem.getGrabRadius()}`);
      return false;
    }

    // Attempt grab - filter to only the target object
    const grabbed = this.grabSystem.tryGrab(this.npc.rightHand, [target]);
    if (grabbed) {
      console.log(`NPCActionSystem: Successfully grabbed ${objectName}`);
      return true;
    }

    return false;
  }

  /**
   * Execute release action
   * Releases any object held by the NPC's right hand
   * @returns {boolean} True if release was successful
   */
  executeRelease() {
    if (!this.npc.rightHand) {
      return false;
    }

    const released = this.grabSystem.release(this.npc.rightHand);
    if (released) {
      console.log('NPCActionSystem: Released object');
      return true;
    }

    return false;
  }

  /**
   * Execute reach action
   * Uses IK to reach toward a target object or position
   * @param {string} targetName - Name of target object or position description
   * @returns {boolean} True if reach was initiated
   */
  executeReach(targetName) {
    if (!this.npc.rightUpperArm || !this.npc.rightForearm || !this.npc.rightHand) {
      return false;
    }

    // Find target object
    const target = this.findObjectByName(targetName);
    if (!target) {
      console.log(`NPCActionSystem: Could not find reach target: ${targetName}`);
      return false;
    }

    // Set reach target for update loop
    this.reachTarget = target.position.clone();
    console.log(`NPCActionSystem: Reaching toward ${targetName}`);
    return true;
  }

  /**
   * Execute swing action
   * Swings a held melee weapon
   * @returns {boolean} True if swing was executed
   */
  executeSwing() {
    if (!this.npc.rightHand) {
      return false;
    }

    // Check if holding a weapon
    const heldObject = this.grabSystem.getGrabbedObject(this.npc.rightHand);
    if (!heldObject || !heldObject.weapon) {
      console.log('NPCActionSystem: Not holding a weapon to swing');
      return false;
    }

    // Check if it's a melee weapon
    const weaponData = this.weaponSystem.getWeaponData(heldObject.type);
    if (!weaponData || weaponData.category !== 'melee') {
      console.log('NPCActionSystem: Held weapon is not a melee weapon');
      return false;
    }

    // Execute melee swing
    this.weaponSystem.handleMeleeSwing(heldObject, this.npc.rightHand);
    console.log(`NPCActionSystem: Swung ${heldObject.type}`);
    return true;
  }

  /**
   * Execute fire action
   * Fires a held gun
   * @returns {boolean} True if fire was executed
   */
  executeFire() {
    if (!this.npc.rightHand) {
      return false;
    }

    // Check if holding a weapon
    const heldObject = this.grabSystem.getGrabbedObject(this.npc.rightHand);
    if (!heldObject || !heldObject.weapon) {
      console.log('NPCActionSystem: Not holding a weapon to fire');
      return false;
    }

    // Check if it's a ranged weapon
    const weaponData = this.weaponSystem.getWeaponData(heldObject.type);
    if (!weaponData || weaponData.category !== 'ranged') {
      console.log('NPCActionSystem: Held weapon is not a ranged weapon');
      return false;
    }

    // Determine fire direction (use aim target if set, otherwise right)
    let direction = new Vec2(1, 0); // Default: fire right
    if (this.aimTarget) {
      direction = this.aimTarget.sub(this.npc.rightHand.position).normalize();
    }

    // Execute gun fire
    this.weaponSystem.fireGun(heldObject, this.npc.rightHand, direction);
    console.log(`NPCActionSystem: Fired ${heldObject.type}`);
    return true;
  }

  /**
   * Execute aim action
   * Sets aim target for weapon firing
   * @param {string} targetName - Name of target to aim at
   * @returns {boolean} True if aim was set
   */
  executeAim(targetName) {
    // Find target object
    const target = this.findObjectByName(targetName);
    if (!target) {
      console.log(`NPCActionSystem: Could not find aim target: ${targetName}`);
      return false;
    }

    this.aimTarget = target.position.clone();
    console.log(`NPCActionSystem: Aiming at ${targetName}`);
    return true;
  }

  /**
   * Update action system
   * Handles continuous actions like reaching
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    // Update reach action
    if (this.reachTarget && this.npc.rightUpperArm && this.npc.rightForearm && this.npc.rightHand) {
      // Check if reached target (within grab radius)
      const distance = this.npc.rightHand.position.distanceTo(this.reachTarget);
      if (distance < this.grabSystem.getGrabRadius()) {
        console.log('NPCActionSystem: Reached target');
        this.reachTarget = null;
        return;
      }
      
      // Use IK to reach toward target
      IKSystem.solveArm(
        this.npc.rightUpperArm,
        this.npc.rightForearm,
        this.npc.rightHand,
        this.reachTarget
      );
    }
  }

  /**
   * Find an object by name or type
   * @param {string} name - Object name or type to search for
   * @returns {Object|null} Found object or null
   */
  findObjectByName(name) {
    if (!name || !this.gameObjects) {
      return null;
    }

    const searchTerm = name.toLowerCase();
    
    // Search by exact type match first
    let found = this.gameObjects.find(obj => 
      obj.type && obj.type.toLowerCase() === searchTerm
    );
    
    if (found) {
      return found;
    }
    
    // Search by partial type match
    found = this.gameObjects.find(obj => 
      obj.type && obj.type.toLowerCase().includes(searchTerm)
    );
    
    if (found) {
      return found;
    }
    
    // Search by name if objects have names
    found = this.gameObjects.find(obj => 
      obj.name && obj.name.toLowerCase().includes(searchTerm)
    );
    
    return found || null;
  }

  /**
   * Set game objects array
   * @param {Array} objects - Array of game objects
   */
  setGameObjects(objects) {
    this.gameObjects = objects;
  }

  /**
   * Clear current action state
   */
  clearActions() {
    this.currentAction = null;
    this.reachTarget = null;
    this.aimTarget = null;
  }

  /**
   * Get currently held weapon
   * @returns {Object|null} Held weapon or null
   */
  getHeldWeapon() {
    if (!this.npc.rightHand) {
      return null;
    }
    
    const heldObject = this.grabSystem.getGrabbedObject(this.npc.rightHand);
    if (heldObject && heldObject.weapon) {
      return heldObject;
    }
    
    return null;
  }

  /**
   * Check if NPC is holding a weapon
   * @returns {boolean} True if holding a weapon
   */
  isHoldingWeapon() {
    return this.getHeldWeapon() !== null;
  }
}
