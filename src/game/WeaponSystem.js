import { Vec2 } from '../physics/Vec2.js';

/**
 * WeaponSystem manages all weapons and projectiles in the game world.
 * Handles weapon creation, melee swings, ranged weapon firing, and special weapon mechanics.
 * 
 * Requirements:
 * - 20.1: Support melee weapons (sword, axe, mace, stick, dagger)
 * - 20.2: Melee weapon swing mechanics with velocity-based damage
 * - 20.3: Damage calculation based on impact velocity and weapon type
 * - 20.4: Support ranged weapons (guns) that fire projectiles
 * - 20.5: Projectile spawning with velocity and trajectory
 * - 20.6: Ammunition system for guns
 * - 20.7: Bullet damage registration
 * - 20.8: Support special weapons (flamethrower, chainsaw)
 */
export class WeaponSystem {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.weapons = new Map();
    this.projectiles = [];
    this.activeWeapons = new Set(); // Weapons currently being used
    this.fireParticles = []; // Fire particles for flamethrower (Requirement 23.1)
    this.burningEntities = new Map(); // Track entities on fire (Requirement 23.2)
    this.screenShake = 0; // Screen shake intensity for chainsaw (Requirement 23.5)
  }
  
  /**
   * Create a new weapon at the specified position
   * @param {string} type - Weapon type identifier
   * @param {Vec2} position - Initial position
   * @returns {Object} Weapon object
   */
  createWeapon(type, position) {
    const weaponData = this.getWeaponData(type);
    
    if (!weaponData) {
      console.warn(`Unknown weapon type: ${type}`);
      return null;
    }
    
    const weapon = {
      id: this.generateId(),
      type,
      ...weaponData,
      position: position.clone(),
      rotation: 0,
      velocity: new Vec2(0, 0),
      heldBy: null, // Reference to hand holding this weapon
      lastSwingTime: 0
    };
    
    this.weapons.set(weapon.id, weapon);
    return weapon;
  }
  
  /**
   * Get weapon data for a specific weapon type
   * Defines properties for all weapon types in the game
   * @param {string} type - Weapon type identifier
   * @returns {Object} Weapon data object
   */
  getWeaponData(type) {
    const data = {
      // Melee weapons (Requirement 20.1)
      sword: { 
        damage: 30, 
        range: 40, 
        swingSpeed: 2, 
        damageType: 'slash',
        category: 'melee'
      },
      axe: { 
        damage: 35, 
        range: 35, 
        swingSpeed: 1.5, 
        damageType: 'chop', 
        knockback: 2,
        category: 'melee'
      },
      mace: { 
        damage: 25, 
        range: 30, 
        swingSpeed: 1.8, 
        damageType: 'blunt', 
        stun: 0.5,
        category: 'melee'
      },
      stick: { 
        damage: 10, 
        range: 35, 
        swingSpeed: 3, 
        damageType: 'blunt',
        category: 'melee'
      },
      dagger: { 
        damage: 20, 
        range: 20, 
        swingSpeed: 3, 
        damageType: 'pierce',
        category: 'melee'
      },
      
      // Ranged weapons (Requirement 20.4)
      pistol: { 
        damage: 40, 
        ammo: 10, 
        maxAmmo: 10,
        reloadTime: 1.5, 
        accuracy: 0.9, 
        recoil: 0.3,
        category: 'ranged',
        damageType: 'bullet'
      },
      rifle: { 
        damage: 60, 
        ammo: 10, 
        maxAmmo: 10,
        reloadTime: 2.5, 
        accuracy: 0.95, 
        recoil: 0.6,
        category: 'ranged',
        damageType: 'bullet'
      },
      
      // Special weapons (Requirement 20.8)
      flamethrower: { 
        damage: 5, 
        fuel: 30, 
        maxFuel: 30,
        range: 100, 
        damageType: 'fire',
        category: 'special',
        continuous: true
      },
      chainsaw: { 
        damage: 15, 
        fuel: 30, 
        maxFuel: 30,
        damageType: 'cut', 
        category: 'special',
        continuous: true
      }
    };
    
    return data[type] || null;
  }
  
  /**
   * Handle a melee weapon swing
   * Calculates damage based on swing velocity and checks for hits
   * Requirements 20.2, 20.3, 21.1-21.8
   * @param {Object} weapon - Weapon object
   * @param {Object} hand - Hand object holding the weapon
   * @returns {Array} Array of hit results
   */
  handleMeleeSwing(weapon, hand) {
    if (!weapon || !hand) return [];
    if (weapon.category !== 'melee') return [];
    
    // Calculate swing velocity (Requirement 20.2, 21.6)
    const swingVelocity = hand.velocity.magnitude();
    
    // Minimum velocity threshold to register as a swing
    // Different weapons have different swing speed requirements
    const minSwingVelocity = 5;
    if (swingVelocity < minSwingVelocity) return [];
    
    // Calculate damage based on swing speed (Requirement 20.3, 21.6)
    // Faster swings = more damage
    const velocityMultiplier = swingVelocity / 10;
    const totalDamage = weapon.damage * velocityMultiplier;
    
    // Check for hits on body parts
    const hits = this.checkMeleeHits(weapon, hand, weapon.range);
    
    // Apply damage to hit entities
    const results = [];
    for (const hit of hits) {
      // Apply damage with weapon-specific effects
      const damageResult = this.applyMeleeDamage(
        hit.entity,
        hit.character,
        totalDamage,
        weapon.damageType,
        hand.velocity,
        weapon
      );
      
      results.push({
        entity: hit.entity,
        character: hit.character,
        damage: damageResult.damage,
        damageType: weapon.damageType,
        knockback: damageResult.knockback,
        stunned: damageResult.stunned || false
      });
    }
    
    weapon.lastSwingTime = Date.now();
    return results;
  }
  
  /**
   * Check for melee weapon hits within range
   * @param {Object} weapon - Weapon object
   * @param {Object} hand - Hand holding the weapon
   * @param {number} range - Weapon range
   * @returns {Array} Array of hit entities
   */
  checkMeleeHits(weapon, hand, range) {
    const hits = [];
    const weaponPos = hand.position;
    
    // Check all characters in the game
    if (this.gameEngine.characters) {
      for (const character of this.gameEngine.characters) {
        // Don't hit the character holding the weapon
        if (character.hands && (character.hands.left === hand || character.hands.right === hand)) {
          continue;
        }
        
        // Check each body part
        for (const bodyPart of character.bodyParts) {
          const distance = weaponPos.distanceTo(bodyPart.position);
          
          if (distance <= range) {
            hits.push({
              entity: bodyPart,
              character: character,
              distance: distance
            });
          }
        }
      }
    }
    
    return hits;
  }
  
  /**
   * Fire a ranged weapon (gun)
   * Creates a projectile and applies recoil
   * @param {Object} weapon - Weapon object
   * @param {Object} hand - Hand holding the weapon
   * @param {Vec2} direction - Firing direction
   * @returns {Object|null} Created projectile or null if can't fire
   */
  fireGun(weapon, hand, direction) {
    if (!weapon || !hand) return null;
    
    // Check ammunition (Requirement 20.6)
    if (weapon.ammo <= 0) {
      console.log(`${weapon.type} is out of ammo`);
      return null;
    }
    
    weapon.ammo--;
    
    // Apply accuracy (slight random deviation)
    const accuracyDeviation = (1 - weapon.accuracy) * 0.2;
    const randomAngle = (Math.random() - 0.5) * accuracyDeviation;
    const accurateDirection = direction.normalize().rotate(randomAngle);
    
    // Create projectile (Requirement 20.5)
    const projectile = {
      id: this.generateId(),
      position: hand.position.clone(),
      velocity: accurateDirection.mul(1000), // 1000 px/s
      damage: weapon.damage,
      damageType: weapon.damageType,
      lifetime: 2000, // 2 seconds
      createdAt: Date.now()
    };
    
    this.projectiles.push(projectile);
    
    // Apply recoil to hand (Requirement 22.2)
    if (hand.applyImpulse) {
      hand.applyImpulse(accurateDirection.mul(-weapon.recoil * 100));
    }
    
    // Create muzzle flash effect (Requirement 22.8)
    weapon.muzzleFlash = {
      active: true,
      position: hand.position.clone(),
      direction: accurateDirection,
      lifetime: 0.1, // 100ms flash
      createdAt: Date.now()
    };
    
    // Create smoke particles (Requirement 22.8)
    for (let i = 0; i < 3; i++) {
      const smokeDir = accurateDirection.rotate((Math.random() - 0.5) * 0.3);
      const smokeParticle = {
        position: hand.position.clone(),
        velocity: smokeDir.mul(50 + Math.random() * 50),
        lifetime: 0.5 + Math.random() * 0.3,
        age: 0,
        size: 5 + Math.random() * 5,
        type: 'smoke'
      };
      this.fireParticles.push(smokeParticle);
    }
    
    return projectile;
  }
  
  /**
   * Reload a ranged weapon
   * @param {Object} weapon - Weapon object
   * @returns {boolean} True if reload started
   */
  reload(weapon) {
    if (!weapon || weapon.category !== 'ranged') return false;
    
    if (weapon.ammo >= weapon.maxAmmo) {
      console.log(`${weapon.type} is already fully loaded`);
      return false;
    }
    
    // Start reload (in a full implementation, this would be async)
    weapon.isReloading = true;
    weapon.reloadStartTime = Date.now();
    
    // Simulate reload completion
    setTimeout(() => {
      weapon.ammo = weapon.maxAmmo;
      weapon.isReloading = false;
      console.log(`${weapon.type} reloaded`);
    }, weapon.reloadTime * 1000);
    
    return true;
  }
  
  /**
   * Update all projectiles
   * Moves projectiles and checks for hits
   * @param {number} dt - Delta time in seconds
   */
  updateProjectiles(dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      
      // Apply gravity to projectiles (Requirement 22.3)
      const gravity = 9.8;
      proj.velocity.y += gravity * dt;
      
      // Update position
      proj.position = proj.position.add(proj.velocity.mul(dt));
      
      // Check lifetime
      const age = Date.now() - proj.createdAt;
      if (age >= proj.lifetime) {
        this.projectiles.splice(i, 1);
        continue;
      }
      
      // Check for hits (Requirement 22.4)
      const hit = this.checkProjectileHit(proj);
      if (hit) {
        // Apply damage (Requirement 20.7)
        this.applyDamage(hit.entity, proj.damage, proj.damageType, proj.velocity);
        
        // Remove projectile
        this.projectiles.splice(i, 1);
      }
    }
  }
  
  /**
   * Check if a projectile hit anything
   * @param {Object} projectile - Projectile object
   * @returns {Object|null} Hit result or null
   */
  checkProjectileHit(projectile) {
    // Check all characters
    if (this.gameEngine.characters) {
      for (const character of this.gameEngine.characters) {
        for (const bodyPart of character.bodyParts) {
          const distance = projectile.position.distanceTo(bodyPart.position);
          
          // Check if projectile is within body part radius
          const hitRadius = bodyPart.radius || 10;
          if (distance <= hitRadius) {
            return {
              entity: bodyPart,
              character: character,
              point: projectile.position.clone()
            };
          }
        }
      }
    }
    
    // Check solid objects (walls, obstacles)
    if (this.gameEngine.objects) {
      for (const obj of this.gameEngine.objects) {
        if (obj.static && obj.containsPoint && obj.containsPoint(projectile.position)) {
          return {
            entity: obj,
            point: projectile.position.clone()
          };
        }
      }
    }
    
    return null;
  }
  
  /**
   * Apply damage to an entity
   * @param {Object} entity - Entity to damage (body part or object)
   * @param {number} damage - Damage amount
   * @param {string} damageType - Type of damage
   * @param {Vec2} velocity - Impact velocity for knockback
   * @param {number} knockbackMultiplier - Additional knockback multiplier
   * @returns {number} Actual damage applied
   */
  applyDamage(entity, damage, damageType, velocity, knockbackMultiplier = 1) {
    // If entity is a body part with a character reference
    if (entity.character && entity.character.healthSystem) {
      entity.character.healthSystem.applyDamage(entity, damage, damageType);
    }
    
    // Apply knockback force
    if (entity.applyImpulse && velocity) {
      const knockbackForce = velocity.normalize().mul(damage * knockbackMultiplier * 0.5);
      entity.applyImpulse(knockbackForce);
    }
    
    return damage;
  }
  
  /**
   * Apply melee weapon damage with weapon-specific effects
   * Requirements 21.1-21.8: Different damage types and effects
   * @param {Object} bodyPart - Body part being hit
   * @param {Object} character - Character being hit
   * @param {number} baseDamage - Base damage amount
   * @param {string} damageType - Type of damage (slash, chop, blunt, pierce)
   * @param {Vec2} velocity - Impact velocity
   * @param {Object} weapon - Weapon object with special properties
   * @returns {Object} Damage result with effects
   */
  applyMeleeDamage(bodyPart, character, baseDamage, damageType, velocity, weapon) {
    let finalDamage = baseDamage;
    let knockbackMultiplier = 1;
    let stunned = false;
    
    // Apply damage type modifiers (Requirements 21.1-21.5)
    switch (damageType) {
      case 'slash': // Sword - high penetration (Requirement 21.1)
        finalDamage *= 1.2; // 20% bonus damage
        knockbackMultiplier = 0.8; // Less knockback, more cutting
        break;
        
      case 'chop': // Axe - knockback force (Requirement 21.2)
        knockbackMultiplier = weapon.knockback || 2;
        break;
        
      case 'blunt': // Mace/Stick - stun effect (Requirements 21.3, 21.4)
        if (weapon.stun && weapon.stun > 0) {
          // Mace has stun effect
          stunned = true;
          this.applyStunEffect(character, weapon.stun);
        }
        // Blunt damage is effective against armor (not implemented yet)
        break;
        
      case 'pierce': // Dagger - low knockback (Requirement 21.5)
        finalDamage *= 1.1; // Slight damage bonus for precision
        knockbackMultiplier = 0.5; // Very low knockback
        break;
    }
    
    // Apply damage to health system
    if (character && character.healthSystem) {
      character.healthSystem.applyDamage(bodyPart, finalDamage, damageType);
    }
    
    // Apply knockback force (Requirement 21.2)
    if (bodyPart.applyImpulse && velocity) {
      const knockbackForce = velocity.normalize().mul(finalDamage * knockbackMultiplier * 0.5);
      bodyPart.applyImpulse(knockbackForce);
    }
    
    return {
      damage: finalDamage,
      knockback: knockbackMultiplier,
      stunned: stunned
    };
  }
  
  /**
   * Apply stun effect to a character
   * Requirement 21.3: Mace applies stun effect
   * @param {Object} character - Character to stun
   * @param {number} duration - Stun duration in seconds
   */
  applyStunEffect(character, duration) {
    if (!character) return;
    
    // Mark character as stunned
    character.stunned = true;
    character.stunDuration = duration;
    character.stunStartTime = Date.now();
    
    // Clear stun after duration
    setTimeout(() => {
      character.stunned = false;
      character.stunDuration = 0;
    }, duration * 1000);
  }
  
  /**
   * Activate a special weapon (flamethrower, chainsaw)
   * Requirements 23.6, 23.7: Track fuel consumption and deactivate when depleted
   * @param {Object} weapon - Weapon object
   * @param {Object} hand - Hand holding the weapon
   * @returns {boolean} True if activated
   */
  activateSpecialWeapon(weapon, hand) {
    if (!weapon || weapon.category !== 'special') return false;
    
    // Check fuel (Requirement 23.7)
    if (weapon.fuel <= 0) {
      console.log(`${weapon.type} is out of fuel`);
      return false;
    }
    
    weapon.active = true;
    weapon.heldBy = hand; // Track which hand is holding the weapon
    this.activeWeapons.add(weapon);
    
    return true;
  }
  
  /**
   * Deactivate a special weapon
   * @param {Object} weapon - Weapon object
   */
  deactivateSpecialWeapon(weapon) {
    if (!weapon) return;
    
    weapon.active = false;
    this.activeWeapons.delete(weapon);
  }
  
  /**
   * Update active special weapons
   * Requirements 23.6, 23.7: Consume fuel and deactivate when depleted
   * @param {number} dt - Delta time in seconds
   */
  updateSpecialWeapons(dt) {
    let chainsawHitting = false;
    
    for (const weapon of this.activeWeapons) {
      if (!weapon.active) continue;
      
      // Consume fuel (Requirement 23.6: 30 seconds of use)
      weapon.fuel = Math.max(0, weapon.fuel - dt);
      
      // Deactivate when fuel depleted (Requirement 23.7)
      if (weapon.fuel <= 0) {
        this.deactivateSpecialWeapon(weapon);
        continue;
      }
      
      // Apply continuous damage based on weapon type
      if (weapon.type === 'flamethrower') {
        this.updateFlamethrower(weapon, dt);
      } else if (weapon.type === 'chainsaw') {
        const hadHits = this.updateChainsaw(weapon, dt);
        if (hadHits) chainsawHitting = true;
      }
    }
    
    // Update fire particles (Requirement 23.1)
    this.updateFireParticles(dt);
    
    // Update burning entities (Requirement 23.2, 23.3)
    this.updateBurningEntities(dt);
    
    // Decay screen shake only if no chainsaw is currently hitting (Requirement 23.5)
    if (this.screenShake > 0 && !chainsawHitting) {
      this.screenShake = Math.max(0, this.screenShake - dt * 5);
    }
  }
  
  /**
   * Update flamethrower behavior
   * Requirements 23.1, 23.2: Emit fire particles and apply burning damage
   * @param {Object} weapon - Flamethrower weapon
   * @param {number} dt - Delta time in seconds
   */
  updateFlamethrower(weapon, dt) {
    if (!weapon.heldBy) return;
    
    // Calculate flame direction based on weapon rotation
    const flameDirection = Vec2.fromAngle(weapon.rotation || 0);
    const handPos = weapon.heldBy.position;
    
    // Emit fire particles (Requirement 23.1)
    const particlesPerSecond = 30;
    const particlesToEmit = Math.floor(particlesPerSecond * dt);
    
    for (let i = 0; i < particlesToEmit; i++) {
      // Random spread for realistic flame effect
      const spreadAngle = (Math.random() - 0.5) * 0.4; // ±0.2 radians
      const particleDir = flameDirection.rotate(spreadAngle);
      const speed = 150 + Math.random() * 100; // 150-250 px/s
      
      const particle = {
        position: handPos.clone(),
        velocity: particleDir.mul(speed),
        lifetime: 0.5 + Math.random() * 0.3, // 0.5-0.8 seconds
        age: 0,
        size: 8 + Math.random() * 8, // 8-16 pixels
        damage: weapon.damage * dt // Damage per particle contact
      };
      
      this.fireParticles.push(particle);
    }
    
    // Check for entities in flame range and apply burning (Requirement 23.2)
    const flameEnd = handPos.add(flameDirection.mul(weapon.range));
    
    if (this.gameEngine.characters) {
      for (const character of this.gameEngine.characters) {
        // Don't burn the character holding the weapon
        if (character.hands && (character.hands.left === weapon.heldBy || character.hands.right === weapon.heldBy)) {
          continue;
        }
        
        // Check each body part
        for (const bodyPart of character.bodyParts) {
          // Check if body part is in flame cone
          const toBodyPart = bodyPart.position.sub(handPos);
          const distance = toBodyPart.magnitude();
          
          if (distance <= weapon.range) {
            // Check if within cone angle
            const angle = Math.acos(toBodyPart.normalize().dot(flameDirection));
            if (angle < 0.3) { // ~34 degree cone
              // Apply burning damage (Requirement 23.2)
              this.applyBurningDamage(bodyPart, character, weapon.damage * dt);
            }
          }
        }
      }
    }
  }
  
  /**
   * Apply burning damage to an entity and mark it as on fire
   * Requirements 23.2, 23.3: Burning damage over time with visual effects
   * @param {Object} bodyPart - Body part to burn
   * @param {Object} character - Character being burned
   * @param {number} damage - Immediate damage
   */
  applyBurningDamage(bodyPart, character, damage) {
    // Apply immediate damage
    if (character && character.healthSystem) {
      character.healthSystem.applyDamage(bodyPart, damage, 'fire');
    }
    
    // Mark entity as burning for continued damage (Requirement 23.2)
    const key = `${character.id || 'char'}_${bodyPart.type}`;
    
    if (!this.burningEntities.has(key)) {
      this.burningEntities.set(key, {
        bodyPart,
        character,
        burnDuration: 3, // Burn for 3 seconds after initial contact
        burnDamagePerSecond: 5, // Continued burn damage
        timeRemaining: 3
      });
    } else {
      // Refresh burn duration
      const burning = this.burningEntities.get(key);
      burning.timeRemaining = Math.min(burning.burnDuration, burning.timeRemaining + 0.5);
    }
  }
  
  /**
   * Update fire particles
   * Requirement 23.1: Fire particle movement and lifetime
   * @param {number} dt - Delta time in seconds
   */
  updateFireParticles(dt) {
    for (let i = this.fireParticles.length - 1; i >= 0; i--) {
      const particle = this.fireParticles[i];
      
      // Update age
      particle.age += dt;
      
      // Remove expired particles
      if (particle.age >= particle.lifetime) {
        this.fireParticles.splice(i, 1);
        continue;
      }
      
      // Update position
      particle.position = particle.position.add(particle.velocity.mul(dt));
      
      // Apply slight upward drift (fire rises)
      particle.velocity.y -= 50 * dt;
      
      // Slow down over time
      particle.velocity = particle.velocity.mul(0.98);
      
      // Shrink over time
      particle.size *= 0.98;
    }
  }
  
  /**
   * Update entities that are burning
   * Requirements 23.2, 23.3: Apply burning damage over time and register continuous pain
   * @param {number} dt - Delta time in seconds
   */
  updateBurningEntities(dt) {
    for (const [key, burning] of this.burningEntities.entries()) {
      burning.timeRemaining -= dt;
      
      // Apply burning damage over time (Requirement 23.2)
      if (burning.character && burning.character.healthSystem) {
        burning.character.healthSystem.applyDamage(
          burning.bodyPart,
          burning.burnDamagePerSecond * dt,
          'fire'
        );
      }
      
      // Remove if burn duration expired
      if (burning.timeRemaining <= 0) {
        this.burningEntities.delete(key);
      }
    }
  }
  
  /**
   * Update chainsaw behavior
   * Requirements 23.4, 23.5: Apply continuous cutting damage and vibration effects
   * @param {Object} weapon - Chainsaw weapon
   * @param {number} dt - Delta time in seconds
   * @returns {boolean} True if chainsaw hit something
   */
  updateChainsaw(weapon, dt) {
    if (!weapon.heldBy) return false;
    
    // Update weapon position to hand position
    weapon.position = weapon.heldBy.position.clone();
    
    // Check for entities in contact range (Requirement 23.4)
    const hits = this.checkMeleeHits(weapon, weapon.heldBy, 15); // Short range for chainsaw
    
    for (const hit of hits) {
      // Apply continuous cutting damage (Requirement 23.4)
      this.applyDamage(hit.entity, weapon.damage * dt, weapon.damageType, new Vec2(0, 0));
      
      // Create vibration/shake effect when contacting objects (Requirement 23.5)
      this.screenShake = Math.min(1, this.screenShake + 0.3);
    }
    
    return hits.length > 0;
  }
  
  /**
   * Main update loop for weapon system
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    this.updateProjectiles(dt);
    this.updateSpecialWeapons(dt);
    this.updateMuzzleFlashes();
    this.updateExplosions(dt);
  }
  
  /**
   * Update muzzle flash effects
   * Requirement 22.8: Display muzzle flash effects
   */
  updateMuzzleFlashes() {
    const now = Date.now();
    
    for (const weapon of this.weapons.values()) {
      if (weapon.muzzleFlash && weapon.muzzleFlash.active) {
        const age = now - weapon.muzzleFlash.createdAt;
        if (age >= weapon.muzzleFlash.lifetime * 1000) {
          weapon.muzzleFlash.active = false;
        }
      }
    }
  }
  
  /**
   * Get all active projectiles
   * @returns {Array} Array of projectile objects
   */
  getProjectiles() {
    return this.projectiles;
  }
  
  /**
   * Get all fire particles for rendering
   * Requirement 23.8: Render special effects (flames)
   * @returns {Array} Array of fire particle objects
   */
  getFireParticles() {
    return this.fireParticles;
  }
  
  /**
   * Get all burning entities for rendering flame effects
   * Requirement 23.3: Display flame effects on burning body parts
   * @returns {Map} Map of burning entities
   */
  getBurningEntities() {
    return this.burningEntities;
  }
  
  /**
   * Get current screen shake intensity
   * Requirement 23.5: Vibration/shake effects for chainsaw
   * @returns {number} Screen shake intensity (0-1)
   */
  getScreenShake() {
    return this.screenShake;
  }
  
  /**
   * Get fuel level for a weapon
   * Requirement 23.8: Display fuel gauge for special weapons
   * @param {Object} weapon - Weapon object
   * @returns {number} Fuel percentage (0-1)
   */
  getFuelPercentage(weapon) {
    if (!weapon || weapon.category !== 'special') return 0;
    return weapon.fuel / weapon.maxFuel;
  }
  
  /**
   * Get weapon by ID
   * @param {string} id - Weapon ID
   * @returns {Object|null} Weapon object or null
   */
  getWeapon(id) {
    return this.weapons.get(id) || null;
  }
  
  /**
   * Remove a weapon from the system
   * @param {string} id - Weapon ID
   */
  removeWeapon(id) {
    const weapon = this.weapons.get(id);
    if (weapon) {
      this.activeWeapons.delete(weapon);
      this.weapons.delete(id);
    }
  }
  
  /**
   * Generate a unique ID
   * @returns {string} Unique identifier
   */
  generateId() {
    return `weapon_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
  
  /**
   * Clear all weapons and projectiles
   */
  clear() {
    this.weapons.clear();
    this.projectiles = [];
    this.activeWeapons.clear();
    this.fireParticles = [];
    this.burningEntities.clear();
    this.screenShake = 0;
    this.explosions = [];
  }


    /**
     * Trigger an explosion at the specified position
     * Requirement 24.4: Apply explosive force and fire damage to nearby entities
     * Requirement 24.5: Display explosion effects
     * Requirement 24.6: Register severe damage from explosions
     * Requirement 24.7: Create fire patches on ground
     * @param {Vec2} position - Explosion center position
     * @param {number} radius - Explosion blast radius (default 150 pixels)
     * @param {number} force - Explosive force magnitude (default 500)
     * @param {number} damage - Fire damage amount (default 50)
     * @returns {Object} Explosion data for rendering
     */
    triggerExplosion(position, radius = 150, force = 500, damage = 50) {
      const explosion = {
        position: position.clone(),
        radius,
        force,
        damage,
        createdAt: Date.now(),
        lifetime: 0.5, // 0.5 seconds for visual effect
        active: true
      };

      // Apply explosive force to nearby entities (Requirement 24.4)
      this.applyExplosiveForce(position, radius, force);

      // Apply fire damage to entities in blast radius (Requirement 24.4)
      this.applyExplosionDamage(position, radius, damage);

      // Create fire patches on ground (Requirement 24.7)
      this.createFirePatches(position, radius);

      // Create screen shake effect (Requirement 24.5)
      this.screenShake = Math.min(1, this.screenShake + 0.8);

      // Store explosion for rendering
      if (!this.explosions) {
        this.explosions = [];
      }
      this.explosions.push(explosion);

      return explosion;
    }

    /**
     * Apply explosive force to nearby entities
     * @param {Vec2} position - Explosion center
     * @param {number} radius - Blast radius
     * @param {number} force - Force magnitude
     */
    applyExplosiveForce(position, radius, force) {
      // Get all characters and objects in the game
      const entities = [];

      // Add player character body parts
      if (this.gameEngine.player && this.gameEngine.player.bodyParts) {
        entities.push(...this.gameEngine.player.bodyParts.map(part => ({
          type: 'bodyPart',
          entity: part,
          character: this.gameEngine.player
        })));
      }

      // Add NPC character body parts
      if (this.gameEngine.npc && this.gameEngine.npc.bodyParts) {
        entities.push(...this.gameEngine.npc.bodyParts.map(part => ({
          type: 'bodyPart',
          entity: part,
          character: this.gameEngine.npc
        })));
      }

      // Add game objects
      if (this.gameEngine.objectManager && this.gameEngine.objectManager.objects) {
        entities.push(...this.gameEngine.objectManager.objects.map(obj => ({
          type: 'object',
          entity: obj
        })));
      }

      // Apply force to each entity based on distance
      for (const item of entities) {
        const entity = item.entity;
        const distance = position.distanceTo(entity.position);

        if (distance <= radius) {
          // Calculate force falloff (inverse square law)
          const falloff = 1 - (distance / radius);
          const actualForce = force * falloff * falloff;

          // Calculate direction from explosion center to entity
          const direction = entity.position.sub(position);
          if (direction.magnitude() > 0) {
            direction.normalize();
          } else {
            // If entity is exactly at explosion center, push upward
            direction.x = 0;
            direction.y = -1;
          }

          // Apply impulse
          const impulse = direction.mul(actualForce);
          entity.applyImpulse(impulse);
        }
      }
    }

    /**
     * Apply fire damage to entities in blast radius
     * Requirement 24.6: Register severe damage from explosions
     * @param {Vec2} position - Explosion center
     * @param {number} radius - Blast radius
     * @param {number} damage - Damage amount
     */
    applyExplosionDamage(position, radius, damage) {
      // Get all characters
      const characters = [];
      if (this.gameEngine.player) {
        characters.push(this.gameEngine.player);
      }
      if (this.gameEngine.npc) {
        characters.push(this.gameEngine.npc);
      }

      // Apply damage to body parts in blast radius
      for (const character of characters) {
        if (!character.bodyParts) continue;

        for (const bodyPart of character.bodyParts) {
          const distance = position.distanceTo(bodyPart.position);

          if (distance <= radius) {
            // Calculate damage falloff
            const falloff = 1 - (distance / radius);
            const actualDamage = damage * falloff;

            // Apply fire damage (Requirement 24.6)
            this.applyDamage(
              { type: 'bodyPart', entity: bodyPart, character },
              actualDamage,
              'fire',
              new Vec2(0, 0)
            );

            // Set body part on fire
            if (actualDamage > 10) {
              this.applyBurningDamage(bodyPart, character, 5); // 5 damage per second
            }
          }
        }
      }
    }

    /**
     * Create fire patches on the ground after explosion
     * Requirement 24.7: Create fire patches on ground
     * @param {Vec2} position - Explosion center
     * @param {number} radius - Area to create fire patches
     */
    createFirePatches(position, radius) {
      // Create 5-8 fire patches around the explosion
      const patchCount = 5 + Math.floor(Math.random() * 4);

      for (let i = 0; i < patchCount; i++) {
        // Random position within blast radius
        const angle = (Math.PI * 2 * i) / patchCount + (Math.random() - 0.5) * 0.5;
        const distance = radius * 0.3 + Math.random() * radius * 0.5;

        const patchPosition = new Vec2(
          position.x + Math.cos(angle) * distance,
          position.y + Math.sin(angle) * distance
        );

        // Create fire patch as a fire particle with longer lifetime
        const firePatch = {
          position: patchPosition,
          velocity: new Vec2(0, 0),
          lifetime: 5 + Math.random() * 5, // 5-10 seconds
          maxLifetime: 10,
          size: 20 + Math.random() * 20,
          damage: 3, // 3 damage per second
          createdAt: Date.now()
        };

        this.fireParticles.push(firePatch);
      }
    }

    /**
     * Update active explosions
     * @param {number} dt - Delta time in seconds
     */
    updateExplosions(dt) {
      if (!this.explosions) {
        this.explosions = [];
        return;
      }

      const now = Date.now();

      // Remove expired explosions
      this.explosions = this.explosions.filter(explosion => {
        const age = (now - explosion.createdAt) / 1000;
        return age < explosion.lifetime;
      });
    }

    /**
     * Get all active explosions for rendering
     * Requirement 24.5: Display explosion effects
     * @returns {Array} Array of explosion objects
     */
    getExplosions() {
      return this.explosions || [];
    }

    /**
     * Check if a game object should explode and trigger explosion
     * @param {GameObject} object - Game object to check
     * @returns {boolean} True if explosion was triggered
     */
    checkAndTriggerExplosion(object) {
      if (object.shouldExplode) {
        // Trigger explosion at object position
        this.triggerExplosion(object.position, 150, 500, 50);

        // Mark object for removal
        object.shouldExplode = false;
        object.exploded = true;

        return true;
      }
      return false;
    }

}
