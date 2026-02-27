import { Vec2 } from '../physics/Vec2.js';

/**
 * VisionSystem implements raycast-based line-of-sight detection for NPCs
 * Casts rays in a field-of-view cone to detect visible entities
 * 
 * Requirements:
 * - 7.1: Cast rays from NPC head position
 * - 7.2: Line-of-sight occlusion (objects block vision)
 * - 7.3: Configurable field-of-view angle (default 120 degrees)
 * - 7.4: Configurable maximum vision range (default 400 pixels)
 * - 7.5: Update visible area when head rotates
 * - 7.7: Update at least 10 times per second (10 Hz)
 */
export class VisionSystem {
  /**
   * Create a new vision system
   * @param {number} fov - Field of view angle in degrees (default 120)
   * @param {number} range - Maximum vision range in pixels (default 400)
   * @param {number} rayCount - Number of rays to cast (default 15)
   */
  constructor(fov = 120, range = 400, rayCount = 15) {
    this.fov = fov * Math.PI / 180; // Convert to radians (Requirement 7.3)
    this.range = range; // Requirement 7.4
    this.rayCount = rayCount;
    this.visibleEntities = [];
    this.updateInterval = 100; // 100ms = 10 Hz (Requirement 7.7)
    this.lastUpdate = -1000; // Initialize to allow first update
    
    // Requirement 13.6: Cache vision results between updates
    this.cachedResults = null;
    this.cacheValid = false;
  }

  /**
   * Update the vision system to detect visible entities
   * @param {Object} character - Character with head property
   * @param {Array} entities - Array of entities to check (GameObjects and Characters)
   * @param {number} currentTime - Current time in milliseconds
   * @returns {Array} Array of visible entities
   */
  update(character, entities, currentTime = Date.now()) {
    // Update at 10 Hz (Requirement 7.7)
    if (currentTime - this.lastUpdate < this.updateInterval) {
      // Requirement 13.6: Return cached results between updates
      return this.visibleEntities;
    }
    this.lastUpdate = currentTime;

    this.visibleEntities = [];
    const visibleSet = new Set(); // Use set to avoid duplicates
    
    // Cast rays from NPC head position (Requirement 7.1)
    const headPos = character.head.position;
    const facingAngle = this.getHeadFacingAngle(character);

    // Cast rays in FOV cone (Requirement 7.3)
    const angleStep = this.fov / (this.rayCount - 1);
    const startAngle = facingAngle - this.fov / 2;

    for (let i = 0; i < this.rayCount; i++) {
      const angle = startAngle + angleStep * i;
      const rayDir = Vec2.fromAngle(angle);

      // Cast ray and get all hits along the ray
      const hits = this.castRayAll(headPos, rayDir, this.range, entities, character);
      
      // Add all non-blocking entities and the first blocking entity
      // Requirement 7.2: Objects block line-of-sight
      for (const hit of hits) {
        if (hit.entity.blocksVision !== false) {
          // Blocking entity - add it and stop processing this ray
          visibleSet.add(hit.entity);
          break;
        } else {
          // Non-blocking entity - add it and continue to check for blocking entities behind it
          visibleSet.add(hit.entity);
        }
      }
    }

    this.visibleEntities = Array.from(visibleSet);
    
    // Cache results for use between updates
    this.cachedResults = {
      entities: this.visibleEntities,
      timestamp: currentTime,
      headPos: { x: headPos.x, y: headPos.y },
      facingAngle
    };
    this.cacheValid = true;
    
    return this.visibleEntities;
  }

  /**
   * Cast a single ray and find all entities it hits, sorted by distance
   * @param {Vec2} origin - Ray origin point
   * @param {Vec2} direction - Ray direction (normalized)
   * @param {number} maxDist - Maximum ray distance
   * @param {Array} entities - Entities to test against
   * @param {Object} character - Character casting the ray (to exclude self)
   * @returns {Array} Array of hit results, sorted by distance
   */
  castRayAll(origin, direction, maxDist, entities, character) {
    const hits = [];

    for (const entity of entities) {
      // Skip the character itself
      if (entity === character) continue;

      // Test ray intersection with entity
      const hit = this.rayIntersect(origin, direction, maxDist, entity);
      
      if (hit) {
        hits.push({ entity, distance: hit.distance, point: hit.point });
      }
    }

    // Sort by distance (closest first)
    hits.sort((a, b) => a.distance - b.distance);

    return hits;
  }

  /**
   * Cast a single ray and find the closest blocking entity (for backward compatibility)
   * @param {Vec2} origin - Ray origin point
   * @param {Vec2} direction - Ray direction (normalized)
   * @param {number} maxDist - Maximum ray distance
   * @param {Array} entities - Entities to test against
   * @param {Object} character - Character casting the ray (to exclude self)
   * @returns {Object|null} Hit result with entity, distance, and point, or null
   */
  castRay(origin, direction, maxDist, entities, character) {
    const hits = this.castRayAll(origin, direction, maxDist, entities, character);

    // Return the first blocking entity, or the closest entity if no blocking ones
    for (const hit of hits) {
      if (hit.entity.blocksVision !== false) {
        return hit;
      }
    }

    return hits.length > 0 ? hits[0] : null;
  }

  /**
   * Test ray intersection with an entity
   * @param {Vec2} origin - Ray origin
   * @param {Vec2} direction - Ray direction (normalized)
   * @param {number} maxDist - Maximum ray distance
   * @param {Object} entity - Entity to test (GameObject or Character)
   * @returns {Object|null} Hit result with distance and point, or null
   */
  rayIntersect(origin, direction, maxDist, entity) {
    // Skip entities without position
    if (!entity.position) {
      return null;
    }
    
    // Handle GameObject entities
    if (entity.shape) {
      if (entity.shape === 'circle') {
        return this.rayCircleIntersect(origin, direction, maxDist, entity.position, entity.radius);
      } else if (entity.shape === 'rect') {
        return this.rayRectIntersect(origin, direction, maxDist, entity.position, entity.size);
      }
    }
    
    // Handle Character entities (test against body parts)
    if (entity.bodyParts) {
      let closestHit = null;
      let closestDist = maxDist;

      for (const part of entity.bodyParts) {
        if (!part.position) continue; // Skip parts without position
        
        const hit = this.rayCircleIntersect(origin, direction, maxDist, part.position, part.radius);
        if (hit && hit.distance < closestDist) {
          closestHit = hit;
          closestDist = hit.distance;
        }
      }

      return closestHit;
    }

    return null;
  }

  /**
   * Test ray-circle intersection
   * @param {Vec2} origin - Ray origin
   * @param {Vec2} direction - Ray direction (normalized)
   * @param {number} maxDist - Maximum ray distance
   * @param {Vec2} center - Circle center
   * @param {number} radius - Circle radius
   * @returns {Object|null} Hit result with distance and point, or null
   */
  rayCircleIntersect(origin, direction, maxDist, center, radius) {
    const oc = origin.sub(center);
    const a = direction.dot(direction);
    const b = 2.0 * oc.dot(direction);
    const c = oc.dot(oc) - radius * radius;
    const discriminant = b * b - 4 * a * c;

    if (discriminant < 0) {
      return null; // No intersection
    }

    // Calculate nearest intersection point
    const t = (-b - Math.sqrt(discriminant)) / (2.0 * a);

    if (t < 0 || t > maxDist) {
      return null; // Intersection behind ray or beyond max distance
    }

    const point = origin.add(direction.mul(t));
    return { distance: t, point };
  }

  /**
   * Test ray-rectangle intersection
   * @param {Vec2} origin - Ray origin
   * @param {Vec2} direction - Ray direction (normalized)
   * @param {number} maxDist - Maximum ray distance
   * @param {Vec2} center - Rectangle center
   * @param {Object} size - Rectangle size {width, height}
   * @returns {Object|null} Hit result with distance and point, or null
   */
  rayRectIntersect(origin, direction, maxDist, center, size) {
    const halfWidth = size.width / 2;
    const halfHeight = size.height / 2;

    // Calculate AABB bounds
    const min = new Vec2(center.x - halfWidth, center.y - halfHeight);
    const max = new Vec2(center.x + halfWidth, center.y + halfHeight);

    // Ray-AABB intersection using slab method
    const invDir = new Vec2(
      direction.x !== 0 ? 1 / direction.x : Infinity,
      direction.y !== 0 ? 1 / direction.y : Infinity
    );

    const t1 = (min.x - origin.x) * invDir.x;
    const t2 = (max.x - origin.x) * invDir.x;
    const t3 = (min.y - origin.y) * invDir.y;
    const t4 = (max.y - origin.y) * invDir.y;

    const tmin = Math.max(Math.min(t1, t2), Math.min(t3, t4));
    const tmax = Math.min(Math.max(t1, t2), Math.max(t3, t4));

    // No intersection if tmax < 0 or tmin > tmax
    if (tmax < 0 || tmin > tmax) {
      return null;
    }

    // Use tmin as the intersection distance (entry point)
    const t = tmin >= 0 ? tmin : tmax;

    if (t < 0 || t > maxDist) {
      return null; // Intersection behind ray or beyond max distance
    }

    const point = origin.add(direction.mul(t));
    return { distance: t, point };
  }

  /**
   * Get the facing angle of the character's head
   * Requirement 7.5: Update visible area when head rotates
   * @param {Object} character - Character with head and torso
   * @returns {number} Facing angle in radians
   */
  getHeadFacingAngle(character) {
    // Calculate the vector from torso to head
    const headToTorso = character.head.position.sub(character.torso.position);
    
    // For a 2D side-view game, we primarily care about horizontal facing direction
    // The head's horizontal offset determines left/right facing
    // The head's vertical offset can indicate looking up/down
    
    // Calculate the angle using atan2
    const angle = Math.atan2(headToTorso.y, headToTorso.x);
    
    // If the head is mostly above the torso (vertical), default to horizontal facing
    // This handles the default standing pose where head is directly above torso
    const absX = Math.abs(headToTorso.x);
    const absY = Math.abs(headToTorso.y);
    
    // If head is nearly vertical (small horizontal offset), face right by default
    if (absX < 5 && absY > 10) {
      return 0; // Face right (positive X direction)
    }
    
    // Otherwise, use the calculated angle
    // This allows the vision to follow head tilts and rotations naturally
    return angle;
  }

  /**
   * Get the list of currently visible entities
   * @returns {Array} Array of visible entities
   */
  getVisibleEntities() {
    return this.visibleEntities;
  }

  /**
   * Get visible entities with detailed information for AI context
   * Requirement 24.8, 25.1: Identify hazardous objects and weapons
   * @returns {Array} Array of entity descriptions with type, position, and threat level
   */
  getVisibleEntitiesWithDetails() {
    return this.visibleEntities.map(entity => {
      const description = {
        entity: entity,
        type: entity.type || 'unknown',
        position: entity.position ? entity.position.clone() : null,
        isHazardous: false,
        isWeapon: false,
        threatLevel: 'none'
      };

      // Identify hazardous objects (Requirement 24.8)
      if (entity.explosive || entity.flammable) {
        description.isHazardous = true;
        description.threatLevel = entity.explosive ? 'high' : 'medium';
        
        if (entity.type === 'gasoline') {
          description.specificType = 'gasoline_canister';
        }
      }

      // Identify weapons (Requirement 25.1)
      if (entity.weapon) {
        description.isWeapon = true;
        description.weaponType = entity.weaponType || 'unknown';
        description.damageType = entity.damageType || 'unknown';
        
        // Assess weapon threat level
        if (entity.weaponType === 'ranged' || entity.weaponType === 'special') {
          description.threatLevel = 'high';
        } else if (entity.weaponType === 'melee') {
          description.threatLevel = 'medium';
        }
      }

      // Check if object is on fire
      if (entity.onFire) {
        description.onFire = true;
        description.threatLevel = 'high';
      }

      return description;
    });
  }

  /**
   * Detect hazardous situations (gasoline near fire)
   * Requirement 24.8, 25.7: Detect when canister is near fire
   * @returns {Array} Array of hazard warnings
   */
  detectHazards() {
    const hazards = [];
    const detailedEntities = this.getVisibleEntitiesWithDetails();

    // Find gasoline canisters
    const gasolineCanisters = detailedEntities.filter(e => 
      (e.type === 'gasoline' || e.specificType === 'gasoline_canister') && e.entity.explosive
    );

    // Find fire sources (objects on fire or fire particles)
    const fireSources = detailedEntities.filter(e => 
      e.onFire === true || e.type === 'fire'
    );

    // Check for gasoline near fire (Requirement 24.8, 25.7)
    for (const canister of gasolineCanisters) {
      for (const fire of fireSources) {
        if (canister.position && fire.position) {
          const distance = canister.position.distanceTo(fire.position);
          const dangerRadius = 100; // pixels

          if (distance < dangerRadius) {
            hazards.push({
              type: 'gasoline_near_fire',
              severity: 'critical',
              canister: canister.entity,
              fireSource: fire.entity,
              distance: distance,
              message: `Gasoline canister is ${distance.toFixed(0)} pixels from fire! Explosion imminent!`
            });
          }
        }
      }
    }

    // Check for held weapons pointed at NPC
    const heldWeapons = detailedEntities.filter(e => 
      e.isWeapon && e.entity.heldBy && e.entity.heldBy !== 'npc'
    );

    for (const weapon of heldWeapons) {
      hazards.push({
        type: 'weapon_threat',
        severity: weapon.threatLevel === 'high' ? 'high' : 'medium',
        weapon: weapon.entity,
        weaponType: weapon.weaponType,
        message: `Someone is holding a ${weapon.weaponType} weapon!`
      });
    }

    return hazards;
  }

  /**
   * Check if a specific entity is visible
   * @param {Object} entity - Entity to check
   * @returns {boolean} True if entity is visible
   */
  isVisible(entity) {
    return this.visibleEntities.includes(entity);
  }

  /**
   * Get the field of view angle in degrees
   * @returns {number} FOV in degrees
   */
  getFOV() {
    return this.fov * 180 / Math.PI;
  }

  /**
   * Set the field of view angle
   * @param {number} fov - FOV in degrees
   */
  setFOV(fov) {
    this.fov = fov * Math.PI / 180;
  }

  /**
   * Get the vision range
   * @returns {number} Range in pixels
   */
  getRange() {
    return this.range;
  }

  /**
   * Set the vision range
   * @param {number} range - Range in pixels
   */
  setRange(range) {
    this.range = range;
  }

  /**
   * Get FOV cone data for visualization
   * Requirement 7.6: Display visual representation of FOV
   * @param {Object} character - Character with head property
   * @returns {Object} FOV cone data {origin, facingAngle, fov, range}
   */
  getFOVConeData(character) {
    const headPos = character.head.position;
    const facingAngle = this.getHeadFacingAngle(character);
    
    return {
      origin: headPos,
      facingAngle: facingAngle,
      fov: this.fov,
      range: this.range
    };
  }

  /**
   * Get cached vision results
   * Requirement 13.6: Cache vision system results between updates
   * @returns {Object|null} Cached results or null if cache invalid
   */
  getCachedResults() {
    if (!this.cacheValid || !this.cachedResults) {
      return null;
    }
    return this.cachedResults;
  }

  /**
   * Invalidate the cache (e.g., when character moves significantly)
   */
  invalidateCache() {
    this.cacheValid = false;
  }

  /**
   * Check if cache is valid
   * @returns {boolean} True if cache is valid
   */
  isCacheValid() {
    return this.cacheValid;
  }
}
