/**
 * CollisionSystem - Optimized collision detection and resolution
 * 
 * Optimizations:
 * - Spatial hash grid for broad-phase collision detection
 * - Sleeping for static objects
 * - Distance-based culling for distant objects
 * 
 * Validates: Requirement 13.2 - Performance optimization
 */

import SpatialHashGrid from './SpatialHashGrid.js';
import { testCollision, resolveCollision } from './shapes.js';

export class CollisionSystem {
  /**
   * Create a new collision system
   * @param {Object} options - Configuration options
   * @param {number} options.cellSize - Spatial hash grid cell size (default: 100)
   * @param {number} options.maxCheckDistance - Maximum distance to check collisions (default: 1000)
   * @param {boolean} options.enableSleeping - Enable sleeping for static objects (default: true)
   * @param {number} options.sleepThreshold - Velocity threshold for sleeping (default: 0.1)
   */
  constructor(options = {}) {
    this.cellSize = options.cellSize || 100;
    this.maxCheckDistance = options.maxCheckDistance || 1000;
    this.enableSleeping = options.enableSleeping !== false;
    this.sleepThreshold = options.sleepThreshold || 0.1;
    
    this.spatialGrid = new SpatialHashGrid(this.cellSize);
    this.entities = [];
    this.staticEntities = [];
    this.dynamicEntities = [];
    
    // Performance tracking
    this.stats = {
      totalChecks: 0,
      actualCollisions: 0,
      skippedChecks: 0,
      sleepingEntities: 0
    };
  }

  /**
   * Add an entity to the collision system
   * @param {Object} entity - Entity with bounds, position, velocity, and isStatic properties
   */
  addEntity(entity) {
    if (this.entities.includes(entity)) return;
    
    this.entities.push(entity);
    
    if (entity.isStatic) {
      this.staticEntities.push(entity);
    } else {
      this.dynamicEntities.push(entity);
      entity.isSleeping = false;
      entity.sleepTimer = 0;
    }
  }

  /**
   * Remove an entity from the collision system
   * @param {Object} entity - Entity to remove
   */
  removeEntity(entity) {
    const index = this.entities.indexOf(entity);
    if (index !== -1) {
      this.entities.splice(index, 1);
    }
    
    const staticIndex = this.staticEntities.indexOf(entity);
    if (staticIndex !== -1) {
      this.staticEntities.splice(staticIndex, 1);
    }
    
    const dynamicIndex = this.dynamicEntities.indexOf(entity);
    if (dynamicIndex !== -1) {
      this.dynamicEntities.splice(dynamicIndex, 1);
    }
  }

  /**
   * Update sleeping state for dynamic entities
   * @param {number} dt - Delta time in seconds
   */
  updateSleeping(dt) {
    if (!this.enableSleeping) return;
    
    let sleepingCount = 0;
    
    for (const entity of this.dynamicEntities) {
      if (!entity.velocity) continue;
      
      // Calculate speed (magnitude of velocity vector)
      const speed = Math.sqrt(entity.velocity.x * entity.velocity.x + entity.velocity.y * entity.velocity.y);
      
      if (speed < this.sleepThreshold) {
        entity.sleepTimer = (entity.sleepTimer || 0) + dt;
        
        // Put to sleep after 1 second of low velocity
        if (entity.sleepTimer > 1.0) {
          entity.isSleeping = true;
          sleepingCount++;
        }
      } else {
        entity.sleepTimer = 0;
        entity.isSleeping = false;
      }
    }
    
    this.stats.sleepingEntities = sleepingCount;
  }

  /**
   * Wake up a sleeping entity
   * @param {Object} entity - Entity to wake up
   */
  wakeUp(entity) {
    if (entity.isSleeping) {
      entity.isSleeping = false;
      entity.sleepTimer = 0;
    }
  }

  /**
   * Check if two entities are too far apart to collide
   * @param {Object} entityA - First entity
   * @param {Object} entityB - Second entity
   * @returns {boolean} True if entities are too far apart
   */
  isTooFarApart(entityA, entityB) {
    if (!entityA.position || !entityB.position) return false;
    
    const dx = entityA.position.x - entityB.position.x;
    const dy = entityA.position.y - entityB.position.y;
    const distanceSquared = dx * dx + dy * dy;
    const maxDistSquared = this.maxCheckDistance * this.maxCheckDistance;
    
    return distanceSquared > maxDistSquared;
  }

  /**
   * Detect and resolve all collisions
   * @param {number} dt - Delta time in seconds
   */
  detectAndResolve(dt) {
    // Reset stats
    this.stats.totalChecks = 0;
    this.stats.actualCollisions = 0;
    this.stats.skippedChecks = 0;
    
    // Update sleeping states
    this.updateSleeping(dt);
    
    // Rebuild spatial grid
    this.spatialGrid.clear();
    
    // Insert all non-sleeping entities into spatial grid
    for (const entity of this.entities) {
      if (!entity.isSleeping && entity.bounds) {
        this.spatialGrid.insert(entity);
      }
    }
    
    // Check collisions for dynamic entities
    for (const entityA of this.dynamicEntities) {
      // Skip sleeping entities
      if (entityA.isSleeping) continue;
      
      if (!entityA.bounds || !entityA.shape) continue;
      
      // Query nearby entities from spatial grid
      const nearbyEntities = this.spatialGrid.query(entityA.bounds);
      
      for (const entityB of nearbyEntities) {
        // Skip self-collision
        if (entityA === entityB) continue;
        
        // Skip if both are sleeping
        if (entityA.isSleeping && entityB.isSleeping) {
          this.stats.skippedChecks++;
          continue;
        }
        
        // Skip if entityB is sleeping (entityA is already not sleeping from outer loop)
        if (entityB.isSleeping) {
          this.stats.skippedChecks++;
          continue;
        }
        
        // Skip if too far apart (additional distance check)
        if (this.isTooFarApart(entityA, entityB)) {
          this.stats.skippedChecks++;
          continue;
        }
        
        this.stats.totalChecks++;
        
        // Narrow-phase collision detection
        const collision = testCollision(entityA.shape, entityB.shape);
        
        if (collision) {
          this.stats.actualCollisions++;
          
          // Wake up sleeping entities on collision
          this.wakeUp(entityA);
          this.wakeUp(entityB);
          
          // Resolve collision only if entities have required properties
          if (entityA.velocity && entityB.velocity && entityA.mass && entityB.mass) {
            resolveCollision(entityA, entityB, collision);
          }
        }
      }
    }
  }

  /**
   * Get collision statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Set the spatial grid cell size
   * @param {number} cellSize - New cell size
   */
  setCellSize(cellSize) {
    this.cellSize = cellSize;
    this.spatialGrid = new SpatialHashGrid(cellSize);
  }

  /**
   * Set the maximum collision check distance
   * @param {number} distance - Maximum distance
   */
  setMaxCheckDistance(distance) {
    this.maxCheckDistance = distance;
  }

  /**
   * Enable or disable sleeping
   * @param {boolean} enabled - Whether sleeping is enabled
   */
  setSleepingEnabled(enabled) {
    this.enableSleeping = enabled;
    
    // Wake up all entities if disabling
    if (!enabled) {
      for (const entity of this.dynamicEntities) {
        entity.isSleeping = false;
        entity.sleepTimer = 0;
      }
    }
  }

  /**
   * Clear all entities
   */
  clear() {
    this.entities = [];
    this.staticEntities = [];
    this.dynamicEntities = [];
    this.spatialGrid.clear();
  }

  /**
   * Get the number of entities
   * @returns {number} Entity count
   */
  getEntityCount() {
    return this.entities.length;
  }

  /**
   * Get the number of active (non-sleeping) entities
   * @returns {number} Active entity count
   */
  getActiveEntityCount() {
    return this.entities.filter(e => !e.isSleeping).length;
  }
}
