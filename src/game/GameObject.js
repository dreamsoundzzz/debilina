import { Vec2 } from '../physics/Vec2.js';

/**
 * GameObject represents any interactive entity in the game world
 * Supports static and dynamic objects with various physical and interaction properties
 * 
 * Requirements:
 * - 8.5: Physical properties (mass, friction, bounciness)
 * - 8.7: Behavior properties (movable, grabbable, breakable, interactive, blocks_vision, weapon_type, damage_type, flammable)
 * - 11.6: Static and dynamic objects
 */
export class GameObject {
  /**
   * Create a new game object
   * @param {string} type - Object type identifier (e.g., 'box', 'ball', 'sword')
   * @param {Object} data - Configuration data for the object
   * @param {Vec2} position - Initial position in world space
   */
  constructor(type, data, position) {
    // Unique identifier
    this.id = this.generateId();
    
    // Basic properties
    this.type = type;
    this.position = position.clone();
    this.rotation = 0;
    this.velocity = new Vec2(0, 0);
    this.angularVelocity = 0;
    
    // Physical properties (Requirement 8.5)
    this.shape = data.radius ? 'circle' : 'rect';
    this.size = data.size || { width: 0, height: 0 };
    this.radius = data.radius || 0;
    this.mass = data.mass || 1;
    this.static = data.static || false; // Requirement 11.6
    this.friction = data.friction !== undefined ? data.friction : 0.5;
    this.restitution = data.restitution !== undefined ? data.restitution : 0.3;
    
    // Interaction properties (Requirement 8.7)
    this.grabbable = data.grabbable !== false;
    this.blocksVision = data.blocksVision !== false;
    this.breakable = data.breakable || false;
    this.interactive = data.interactive || false;
    
    // Special properties (Requirement 8.7)
    this.weapon = data.weapon || false;
    this.weaponType = data.weaponType || null;
    this.damageType = data.damageType || null;
    this.consumable = data.consumable || null; // 'food' or 'drink'
    this.consumableValue = data.consumableValue || 0;
    this.flammable = data.flammable || false;
    this.explosive = data.explosive || false;
    this.onFire = false;
    this.fireDuration = 0;
    
    // Weapon-specific state
    if (this.weapon) {
      this.ammo = data.ammo || 0;
      this.fuel = data.fuel || 0;
      this.damage = data.damage || 0;
    }
    
    // Explosive-specific state
    if (this.explosive) {
      this.fuelRemaining = data.explosionDelay || 2.0; // Time before explosion when on fire
    }
  }
  
  /**
   * Update the game object's physics and behavior
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    // Static objects don't move (Requirement 11.6)
    if (this.static) return;
    
    // Apply gravity to dynamic objects (Requirement 11.7)
    const gravity = 9.8;
    this.velocity.y += gravity * dt;
    
    // Apply friction (Requirement 11.3)
    const airFriction = 0.01;
    this.velocity.x *= (1 - this.friction * airFriction);
    this.velocity.y *= (1 - this.friction * airFriction * 0.1); // Less friction on vertical
    
    // Update position based on velocity
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    
    // Update rotation based on angular velocity
    this.rotation += this.angularVelocity * dt;
    
    // Fire behavior (Requirement 8.7 - flammable property)
    if (this.onFire) {
      this.updateFire(dt);
    }
  }
  
  /**
   * Update fire behavior for burning objects
   * @param {number} dt - Delta time in seconds
   */
  updateFire(dt) {
    this.fireDuration += dt;
    
    // Explosive objects explode after delay when on fire
    if (this.explosive) {
      this.fuelRemaining -= dt;
      if (this.fuelRemaining <= 0) {
        // Explosion will be handled by WeaponSystem
        this.shouldExplode = true;
      }
    }
    
    // Fire eventually burns out for non-explosive objects
    if (!this.explosive && this.fireDuration > 10) {
      this.onFire = false;
      this.fireDuration = 0;
    }
  }
  
  /**
   * Handle collision impact with this object
   * Detects high-force impacts for explosive objects (Requirement 24.2)
   * @param {Vec2} impactVelocity - Velocity of the impact
   * @param {number} impactMass - Mass of the impacting object
   * @returns {boolean} True if impact triggered an explosion
   */
  handleImpact(impactVelocity, impactMass) {
    // Only explosive objects can be triggered by impact
    if (!this.explosive) {
      return false;
    }
    
    // Calculate impact force (F = ma, approximating with velocity change)
    const impactSpeed = impactVelocity.magnitude();
    const impactForce = impactSpeed * impactMass;
    
    // High-force threshold for explosion (Requirement 24.2)
    // Threshold: 100 units (e.g., 10 kg object at 10 m/s)
    const explosionThreshold = 100;
    
    if (impactForce >= explosionThreshold) {
      this.shouldExplode = true;
      return true;
    }
    
    return false;
  }
  
  /**
   * Check if this object is near fire sources
   * Used for detecting fire exposure (Requirement 24.3)
   * @param {Array<GameObject>} nearbyObjects - Objects within detection range
   * @returns {boolean} True if near fire
   */
  isNearFire(nearbyObjects) {
    if (!this.flammable) {
      return false;
    }
    
    // Check if any nearby objects are on fire
    for (const obj of nearbyObjects) {
      if (obj.onFire && obj !== this) {
        const distance = this.position.distanceTo(obj.position);
        const fireRange = 50; // Fire spreads within 50 pixels
        
        if (distance <= fireRange) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Ignite this object if it's flammable
   * @returns {boolean} True if object was ignited
   */
  ignite() {
    if (this.flammable && !this.onFire) {
      this.onFire = true;
      this.fireDuration = 0;
      if (this.explosive) {
        this.fuelRemaining = 2.0; // Reset explosion timer
      }
      return true;
    }
    return false;
  }
  
  /**
   * Extinguish fire on this object
   */
  extinguish() {
    this.onFire = false;
    this.fireDuration = 0;
    if (this.explosive) {
      this.fuelRemaining = 2.0;
    }
  }
  
  /**
   * Apply an impulse to this object
   * @param {Vec2} impulse - Impulse vector to apply
   */
  applyImpulse(impulse) {
    if (this.static) return;
    
    // F = ma, so a = F/m
    const acceleration = impulse.div(this.mass);
    this.velocity = this.velocity.add(acceleration);
  }
  
  /**
   * Apply a force to this object over time
   * @param {Vec2} force - Force vector to apply
   * @param {number} dt - Delta time in seconds
   */
  applyForce(force, dt) {
    if (this.static) return;
    
    // F = ma, so a = F/m
    const acceleration = force.div(this.mass);
    this.velocity = this.velocity.add(acceleration.mul(dt));
  }
  
  /**
   * Get the bounding box for this object
   * @returns {Object} Bounding box with min and max Vec2 points
   */
  getBounds() {
    if (this.shape === 'circle') {
      return {
        min: new Vec2(this.position.x - this.radius, this.position.y - this.radius),
        max: new Vec2(this.position.x + this.radius, this.position.y + this.radius)
      };
    } else {
      const halfWidth = this.size.width / 2;
      const halfHeight = this.size.height / 2;
      return {
        min: new Vec2(this.position.x - halfWidth, this.position.y - halfHeight),
        max: new Vec2(this.position.x + halfWidth, this.position.y + halfHeight)
      };
    }
  }
  
  /**
   * Check if a point is inside this object
   * @param {Vec2} point - Point to test
   * @returns {boolean} True if point is inside
   */
  containsPoint(point) {
    if (this.shape === 'circle') {
      return this.position.distanceTo(point) <= this.radius;
    } else {
      const bounds = this.getBounds();
      return point.x >= bounds.min.x && point.x <= bounds.max.x &&
             point.y >= bounds.min.y && point.y <= bounds.max.y;
    }
  }
  
  /**
   * Generate a unique ID for this object
   * @returns {string} Unique identifier
   */
  generateId() {
    return `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Clone this game object
   * @returns {GameObject} New GameObject with same properties
   */
  clone() {
    const data = {
      radius: this.radius,
      size: this.size,
      mass: this.mass,
      static: this.static,
      friction: this.friction,
      restitution: this.restitution,
      grabbable: this.grabbable,
      blocksVision: this.blocksVision,
      breakable: this.breakable,
      interactive: this.interactive,
      weapon: this.weapon,
      weaponType: this.weaponType,
      damageType: this.damageType,
      consumable: this.consumable,
      consumableValue: this.consumableValue,
      flammable: this.flammable,
      explosive: this.explosive,
      ammo: this.ammo,
      fuel: this.fuel,
      damage: this.damage
    };
    
    return new GameObject(this.type, data, this.position);
  }
  
  /**
   * Serialize this object to JSON
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      position: { x: this.position.x, y: this.position.y },
      rotation: this.rotation,
      velocity: { x: this.velocity.x, y: this.velocity.y },
      angularVelocity: this.angularVelocity,
      shape: this.shape,
      size: this.size,
      radius: this.radius,
      mass: this.mass,
      static: this.static,
      friction: this.friction,
      restitution: this.restitution,
      grabbable: this.grabbable,
      blocksVision: this.blocksVision,
      breakable: this.breakable,
      interactive: this.interactive,
      weapon: this.weapon,
      weaponType: this.weaponType,
      damageType: this.damageType,
      consumable: this.consumable,
      consumableValue: this.consumableValue,
      flammable: this.flammable,
      explosive: this.explosive,
      onFire: this.onFire,
      fireDuration: this.fireDuration
    };
  }
  
  /**
   * Create a GameObject from JSON data
   * @param {Object} json - JSON representation
   * @returns {GameObject} New GameObject instance
   */
  static fromJSON(json) {
    const data = {
      radius: json.radius,
      size: json.size,
      mass: json.mass,
      static: json.static,
      friction: json.friction,
      restitution: json.restitution,
      grabbable: json.grabbable,
      blocksVision: json.blocksVision,
      breakable: json.breakable,
      interactive: json.interactive,
      weapon: json.weapon,
      weaponType: json.weaponType,
      damageType: json.damageType,
      consumable: json.consumable,
      consumableValue: json.consumableValue,
      flammable: json.flammable,
      explosive: json.explosive
    };
    
    const obj = new GameObject(json.type, data, new Vec2(json.position.x, json.position.y));
    obj.id = json.id;
    obj.rotation = json.rotation;
    obj.velocity = new Vec2(json.velocity.x, json.velocity.y);
    obj.angularVelocity = json.angularVelocity;
    obj.onFire = json.onFire;
    obj.fireDuration = json.fireDuration;
    
    return obj;
  }
}
