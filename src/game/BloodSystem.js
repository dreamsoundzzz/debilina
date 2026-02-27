/**
 * BloodSystem - Manages blood particles, dripping, splashing, blood loss, and fainting
 * 
 * Features:
 * - Blood particle effects on damage
 * - Blood dripping from wounds
 * - Blood splashing on surfaces
 * - Blood loss tracking
 * - Fainting from blood loss
 * - Blood pool accumulation
 */

import { Vec2 } from '../physics/Vec2.js';

/**
 * Blood particle for visual effects
 */
class BloodParticle {
  constructor(position, velocity, size = 3) {
    this.position = position.clone ? position.clone() : new Vec2(position.x, position.y);
    this.velocity = velocity.clone ? velocity.clone() : new Vec2(velocity.x, velocity.y);
    this.size = size;
    this.lifetime = 2.0; // seconds
    this.age = 0;
    this.gravity = 980; // pixels/s²
    this.onGround = false;
    this.poolSize = 0; // Size when it becomes a pool
  }

  update(dt) {
    this.age += dt;

    if (!this.onGround) {
      // Apply gravity
      this.velocity.y += this.gravity * dt;

      // Update position
      this.position.x += this.velocity.x * dt;
      this.position.y += this.velocity.y * dt;

      // Simple ground check (y > 500 is ground level)
      if (this.position.y > 500) {
        this.position.y = 500;
        this.onGround = true;
        this.velocity.x = 0;
        this.velocity.y = 0;
        this.poolSize = this.size * 2; // Spread into a pool
      }
    }

    return this.age < this.lifetime;
  }

  render(ctx) {
    const alpha = Math.max(0, 1 - (this.age / this.lifetime));
    
    if (this.onGround) {
      // Draw as blood pool
      ctx.fillStyle = `rgba(139, 0, 0, ${alpha * 0.7})`;
      ctx.beginPath();
      ctx.ellipse(this.position.x, this.position.y, this.poolSize, this.poolSize * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Draw as flying particle
      ctx.fillStyle = `rgba(200, 0, 0, ${alpha})`;
      ctx.beginPath();
      ctx.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * Blood drip from a wound
 */
class BloodDrip {
  constructor(position, bodyPart) {
    this.position = position.clone ? position.clone() : new Vec2(position.x, position.y);
    this.bodyPart = bodyPart;
    this.velocity = new Vec2(0, 0);
    this.size = 2;
    this.gravity = 980;
    this.nextDripTime = 0;
    this.dripInterval = 0.5; // seconds between drips
    this.active = true;
  }

  update(dt) {
    // Update position to follow body part
    if (this.bodyPart && this.bodyPart.position) {
      this.position.x = this.bodyPart.position.x;
      this.position.y = this.bodyPart.position.y;
    }

    this.nextDripTime -= dt;
    return this.active;
  }

  shouldDrip() {
    if (this.nextDripTime <= 0) {
      this.nextDripTime = this.dripInterval;
      return true;
    }
    return false;
  }
}

export class BloodSystem {
  constructor() {
    this.particles = [];
    this.drips = [];
    this.bloodLoss = new Map(); // characterId -> blood loss amount
    this.faintingThreshold = 50; // Blood loss amount that causes fainting
    this.faintedCharacters = new Set();
    this.maxParticles = 500;
    
    // Blood loss rates
    this.bleedingRates = new Map(); // characterId -> bleeding rate per second
  }

  /**
   * Create blood splash effect from damage
   * @param {Vec2} position - Position of impact
   * @param {Vec2} direction - Direction of impact
   * @param {number} intensity - Damage intensity (affects particle count)
   */
  createSplash(position, direction, intensity = 10) {
    const particleCount = Math.min(Math.floor(intensity / 2), 20);
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.atan2(direction.y, direction.x) + (Math.random() - 0.5) * Math.PI / 2;
      const speed = 100 + Math.random() * 200;
      
      const velocity = new Vec2(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - 100 // Upward bias
      );
      
      const size = 2 + Math.random() * 3;
      this.addParticle(position, velocity, size);
    }
  }

  /**
   * Add a blood particle
   * @param {Vec2} position - Starting position
   * @param {Vec2} velocity - Initial velocity
   * @param {number} size - Particle size
   */
  addParticle(position, velocity, size = 3) {
    if (this.particles.length >= this.maxParticles) {
      // Remove oldest particle
      this.particles.shift();
    }
    
    this.particles.push(new BloodParticle(position, velocity, size));
  }

  /**
   * Start bleeding from a body part
   * @param {string} characterId - Character identifier
   * @param {Object} bodyPart - Body part that's bleeding
   * @param {number} severity - Bleeding severity (0-1)
   */
  startBleeding(characterId, bodyPart, severity = 0.5) {
    const drip = new BloodDrip(bodyPart.position, bodyPart);
    drip.dripInterval = Math.max(0.2, 1.0 - severity); // More severe = faster drips
    this.drips.push(drip);
    
    // Set bleeding rate
    const bleedingRate = severity * 5; // Blood loss per second
    const currentRate = this.bleedingRates.get(characterId) || 0;
    this.bleedingRates.set(characterId, currentRate + bleedingRate);
  }

  /**
   * Stop all bleeding for a character
   * @param {string} characterId - Character identifier
   */
  stopBleeding(characterId) {
    this.bleedingRates.delete(characterId);
    this.drips = this.drips.filter(drip => {
      // Remove drips for this character (would need character tracking in drip)
      return true; // For now, keep all drips
    });
  }

  /**
   * Apply blood loss to a character
   * @param {string} characterId - Character identifier
   * @param {number} amount - Amount of blood lost
   */
  applyBloodLoss(characterId, amount) {
    const current = this.bloodLoss.get(characterId) || 0;
    const newAmount = current + amount;
    this.bloodLoss.set(characterId, newAmount);
    
    // Check for fainting
    if (newAmount >= this.faintingThreshold && !this.faintedCharacters.has(characterId)) {
      this.faintCharacter(characterId);
    }
  }

  /**
   * Make a character faint from blood loss
   * @param {string} characterId - Character identifier
   */
  faintCharacter(characterId) {
    this.faintedCharacters.add(characterId);
    // Emit event for game systems to handle
    console.log(`Character ${characterId} has fainted from blood loss!`);
  }

  /**
   * Revive a fainted character
   * @param {string} characterId - Character identifier
   */
  reviveCharacter(characterId) {
    this.faintedCharacters.delete(characterId);
    // Reduce blood loss
    const current = this.bloodLoss.get(characterId) || 0;
    this.bloodLoss.set(characterId, Math.max(0, current - 20));
  }

  /**
   * Check if a character has fainted
   * @param {string} characterId - Character identifier
   * @returns {boolean} True if fainted
   */
  isFainted(characterId) {
    return this.faintedCharacters.has(characterId);
  }

  /**
   * Get blood loss amount for a character
   * @param {string} characterId - Character identifier
   * @returns {number} Blood loss amount
   */
  getBloodLoss(characterId) {
    return this.bloodLoss.get(characterId) || 0;
  }

  /**
   * Get blood loss percentage (0-1)
   * @param {string} characterId - Character identifier
   * @returns {number} Blood loss percentage
   */
  getBloodLossPercentage(characterId) {
    const loss = this.getBloodLoss(characterId);
    return Math.min(1, loss / this.faintingThreshold);
  }

  /**
   * Update blood system
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    // Update particles
    this.particles = this.particles.filter(particle => particle.update(dt));
    
    // Update drips and create new particles
    this.drips = this.drips.filter(drip => {
      const active = drip.update(dt);
      
      if (active && drip.shouldDrip()) {
        // Create a dripping particle
        const velocity = new Vec2(
          (Math.random() - 0.5) * 20,
          50 + Math.random() * 50
        );
        this.addParticle(drip.position, velocity, 2);
      }
      
      return active;
    });
    
    // Apply bleeding damage
    for (const [characterId, rate] of this.bleedingRates.entries()) {
      this.applyBloodLoss(characterId, rate * dt);
    }
  }

  /**
   * Render blood effects
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  render(ctx) {
    // Render all particles
    for (const particle of this.particles) {
      particle.render(ctx);
    }
  }

  /**
   * Render blood loss indicator for a character
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Vec2} position - Position to render at
   * @param {string} characterId - Character identifier
   */
  renderBloodLossIndicator(ctx, position, characterId) {
    const percentage = this.getBloodLossPercentage(characterId);
    
    if (percentage > 0) {
      const barWidth = 60;
      const barHeight = 6;
      const x = position.x - barWidth / 2;
      const y = position.y - 40;
      
      // Background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(x, y, barWidth, barHeight);
      
      // Blood loss bar (red)
      ctx.fillStyle = `rgba(200, 0, 0, 0.8)`;
      ctx.fillRect(x, y, barWidth * percentage, barHeight);
      
      // Border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, barWidth, barHeight);
      
      // Fainting warning
      if (percentage >= 0.8) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('CRITICAL', position.x, y - 5);
      }
    }
  }

  /**
   * Clear all blood effects
   */
  clear() {
    this.particles = [];
    this.drips = [];
    this.bloodLoss.clear();
    this.bleedingRates.clear();
    this.faintedCharacters.clear();
  }

  /**
   * Get particle count
   * @returns {number} Number of active particles
   */
  getParticleCount() {
    return this.particles.length;
  }

  /**
   * Get drip count
   * @returns {number} Number of active drips
   */
  getDripCount() {
    return this.drips.length;
  }

  /**
   * Set fainting threshold
   * @param {number} threshold - New threshold
   */
  setFaintingThreshold(threshold) {
    this.faintingThreshold = threshold;
  }

  /**
   * Set max particles
   * @param {number} max - Maximum particle count
   */
  setMaxParticles(max) {
    this.maxParticles = max;
  }
}
