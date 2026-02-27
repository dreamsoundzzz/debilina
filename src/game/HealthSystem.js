/**
 * HealthSystem manages health points for each body part of a character.
 * Handles damage application, health regeneration, incapacitation, and death.
 */
export class HealthSystem {
  constructor(character) {
    this.character = character;
    this.bodyPartHealth = new Map();
    this.totalHealth = 0;
    
    // Initialize health for each body part
    for (const part of character.bodyParts) {
      const health = this.getDefaultHealth(part.type);
      this.bodyPartHealth.set(part, health);
      this.totalHealth += health;
    }
    
    this.regenRate = 1; // 1 HP per second
    this.timeSinceLastDamage = 0;
  }
  
  /**
   * Get default health value for a body part type
   */
  getDefaultHealth(partType) {
    const healthMap = {
      head: 100,
      torso: 150,
      upperArm: 80,
      forearm: 80,
      hand: 60,
      thigh: 100,
      shin: 100,
      foot: 70
    };
    return healthMap[partType] || 100;
  }
  
  /**
   * Apply damage to a specific body part
   */
  applyDamage(bodyPart, damage, damageType = 'generic') {
    const currentHealth = this.bodyPartHealth.get(bodyPart);
    if (currentHealth === undefined) {
      console.warn('Attempted to damage unknown body part:', bodyPart);
      return;
    }
    
    const newHealth = Math.max(0, currentHealth - damage);
    
    this.bodyPartHealth.set(bodyPart, newHealth);
    this.timeSinceLastDamage = 0;
    
    // Calculate pain intensity
    const painIntensity = damage / this.getDefaultHealth(bodyPart.type);
    
    // Trigger pain response if character has pain sensor
    if (this.character.painSensor) {
      this.character.painSensor.registerPain(bodyPart, painIntensity, damageType);
    }
    
    // Check for incapacitation
    if (newHealth === 0) {
      this.incapacitate(bodyPart);
    }
    
    // Check for death
    if ((bodyPart.type === 'head' || bodyPart.type === 'torso') && newHealth === 0) {
      this.die();
    }
    
    // Update total health
    this.updateTotalHealth();
  }
  
  /**
   * Mark a body part as incapacitated
   */
  incapacitate(bodyPart) {
    bodyPart.incapacitated = true;
    console.log(`Body part ${bodyPart.type} incapacitated`);
  }
  
  /**
   * Trigger character death
   */
  die() {
    this.character.isDead = true;
    console.log(`Character ${this.character.name} has died`);
    
    // Trigger death event if character has event system
    if (this.character.speak) {
      this.character.speak('...', 'death');
    }
  }
  
  /**
   * Update health regeneration
   */
  update(dt) {
    this.timeSinceLastDamage += dt;
    
    // Regenerate health after 5 seconds without damage
    if (this.timeSinceLastDamage > 5) {
      for (const [part, health] of this.bodyPartHealth) {
        const maxHealth = this.getDefaultHealth(part.type);
        if (health < maxHealth && health > 0) {
          const newHealth = Math.min(maxHealth, health + this.regenRate * dt);
          this.bodyPartHealth.set(part, newHealth);
        }
      }
      
      // Update total health
      this.updateTotalHealth();
    }
  }
  
  /**
   * Recalculate total character health
   */
  updateTotalHealth() {
    this.totalHealth = 0;
    for (const health of this.bodyPartHealth.values()) {
      this.totalHealth += health;
    }
  }
  
  /**
   * Get health of a specific body part
   */
  getHealth(bodyPart) {
    return this.bodyPartHealth.get(bodyPart) || 0;
  }
  
  /**
   * Get all damaged body parts (health < max)
   */
  getDamagedParts() {
    const damaged = [];
    for (const [part, health] of this.bodyPartHealth) {
      const maxHealth = this.getDefaultHealth(part.type);
      if (health < maxHealth) {
        damaged.push({
          part,
          health,
          maxHealth,
          percentage: (health / maxHealth) * 100
        });
      }
    }
    return damaged;
  }
  
  /**
   * Check if character is alive
   */
  isAlive() {
    return !this.character.isDead;
  }
}
