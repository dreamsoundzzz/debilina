/**
 * NeedsSystem tracks survival requirements (hunger, thirst, energy)
 * Needs decay over time and influence NPC behavior and decision-making
 * 
 * Requirements:
 * - 27.1: Track hunger level (0-100, decreasing at 1 point per minute)
 * - 27.2: Track thirst level (0-100, decreasing at 1.5 points per minute)
 * - 27.3: Track rest/energy level (0-100, decreasing at 0.5 points per minute when active)
 */
export class NeedsSystem {
  /**
   * Create a new needs system
   * Requirements 27.1, 27.2, 27.3: Initialize need values at 100
   */
  constructor() {
    // Requirement 27.1: Hunger level (0-100)
    this.hunger = 100;
    
    // Requirement 27.2: Thirst level (0-100)
    this.thirst = 100;
    
    // Requirement 27.3: Energy/rest level (0-100)
    this.energy = 100;
    
    // Requirement 27.1: Decay rate of 1 point per minute = 1/60 per second
    this.hungerDecayRate = 1 / 60;
    
    // Requirement 27.2: Decay rate of 1.5 points per minute = 1.5/60 per second
    this.thirstDecayRate = 1.5 / 60;
    
    // Requirement 27.3: Decay rate of 0.5 points per minute = 0.5/60 per second
    this.energyDecayRate = 0.5 / 60;
  }

  /**
   * Update needs over time
   * Requirements 27.1, 27.2, 27.3: Implement need decay and energy regeneration
   * @param {number} dt - Delta time in seconds
   * @param {boolean} isActive - Whether the character is actively moving/working
   * @param {Object} emotionSystem - Optional EmotionSystem to trigger emotional responses
   * @returns {Object|null} Damage info if critical needs reached, null otherwise
   */
  update(dt, isActive = true, emotionSystem = null) {
    // Store previous values to detect threshold crossings
    const prevHunger = this.hunger;
    const prevThirst = this.thirst;
    const prevEnergy = this.energy;
    
    // Requirement 27.1: Decay hunger at 1 point per minute
    this.hunger = Math.max(0, this.hunger - this.hungerDecayRate * dt);
    
    // Requirement 27.2: Decay thirst at 1.5 points per minute
    this.thirst = Math.max(0, this.thirst - this.thirstDecayRate * dt);
    
    // Requirement 27.3: Decay energy when active, regenerate when resting
    if (isActive) {
      this.energy = Math.max(0, this.energy - this.energyDecayRate * dt);
    } else {
      // Regenerate energy at 2x the decay rate when resting
      this.energy = Math.min(100, this.energy + this.energyDecayRate * 2 * dt);
    }
    
    // Requirement 27.4: Trigger emotions when hunger drops below 30
    if (emotionSystem && prevHunger >= 30 && this.hunger < 30) {
      emotionSystem.trigger('sad', 0.3, 'hunger_low');
      emotionSystem.trigger('angry', 0.2, 'hunger_low');
    }
    
    // Requirement 27.5: Trigger emotions when thirst drops below 30
    if (emotionSystem && prevThirst >= 30 && this.thirst < 30) {
      emotionSystem.trigger('fearful', 0.3, 'thirst_low');
      emotionSystem.trigger('angry', 0.25, 'thirst_low');
    }
    
    // Apply damage if critical (requirements 27.8, 27.9)
    if (this.hunger === 0) {
      return { type: 'starvation', damage: 0.1 * dt };
    }
    if (this.thirst === 0) {
      return { type: 'dehydration', damage: 0.3 * dt };
    }
    
    return null;
  }

  /**
   * Consume a food or drink item to restore needs
   * @param {string} itemType - Type of item ('food' or 'drink')
   * @param {number} value - Amount to restore (0-100)
   */
  consume(itemType, value) {
    if (itemType === 'food') {
      this.hunger = Math.min(100, this.hunger + value);
    } else if (itemType === 'drink') {
      this.thirst = Math.min(100, this.thirst + value);
    }
  }

  /**
   * Get the most critical need (lowest value)
   * @returns {Object|null} Object with type and value, or null if all needs above 30
   */
  getCriticalNeed() {
    const needs = [
      { type: 'hunger', value: this.hunger },
      { type: 'thirst', value: this.thirst },
      { type: 'energy', value: this.energy }
    ];
    
    // Sort by value (lowest first)
    needs.sort((a, b) => a.value - b.value);
    
    // Return lowest need if below 30
    if (needs[0].value < 30) {
      return needs[0];
    }
    
    return null;
  }

  /**
   * Get all current need values
   * @returns {Object} Object with hunger, thirst, and energy values
   */
  getNeeds() {
    return {
      hunger: this.hunger,
      thirst: this.thirst,
      energy: this.energy
    };
  }

  /**
   * Get needs state as a descriptive string for AI context
   * @returns {string} Human-readable needs description
   */
  getNeedsDescription() {
    const parts = [];
    
    if (this.hunger < 30) {
      parts.push(this.hunger < 10 ? 'starving' : 'very hungry');
    } else if (this.hunger < 50) {
      parts.push('hungry');
    }
    
    if (this.thirst < 30) {
      parts.push(this.thirst < 10 ? 'severely dehydrated' : 'very thirsty');
    } else if (this.thirst < 50) {
      parts.push('thirsty');
    }
    
    if (this.energy < 30) {
      parts.push(this.energy < 10 ? 'exhausted' : 'very tired');
    } else if (this.energy < 50) {
      parts.push('tired');
    }
    
    if (parts.length === 0) {
      return 'all needs satisfied';
    }
    
    return parts.join(', ');
  }

  /**
   * Check if any need is below a threshold
   * @param {number} threshold - Threshold value (0-100)
   * @returns {boolean} True if any need is below threshold
   */
  hasLowNeeds(threshold = 30) {
    return this.hunger < threshold || 
           this.thirst < threshold || 
           this.energy < threshold;
  }

  /**
   * Get movement speed multiplier based on energy level
   * Requirement 27.6: Reduce movement speed when energy below 20
   * @returns {number} Speed multiplier (0.5 when energy < 20, 1.0 otherwise)
   */
  getMovementSpeedMultiplier() {
    // Requirement 27.6: Reduce movement speed when energy below 20
    if (this.energy < 20) {
      return 0.5; // 50% speed reduction
    }
    return 1.0; // Normal speed
  }

  /**
   * Reset all needs to full (100)
   */
  reset() {
    this.hunger = 100;
    this.thirst = 100;
    this.energy = 100;
  }

  /**
   * Set a specific need value (for testing or special events)
   * @param {string} needType - Need type ('hunger', 'thirst', or 'energy')
   * @param {number} value - Value to set (0-100)
   */
  setNeed(needType, value) {
    const clampedValue = Math.max(0, Math.min(100, value));
    
    if (needType === 'hunger') {
      this.hunger = clampedValue;
    } else if (needType === 'thirst') {
      this.thirst = clampedValue;
    } else if (needType === 'energy') {
      this.energy = clampedValue;
    } else {
      console.warn(`NeedsSystem: Unknown need type "${needType}"`);
    }
  }
}
