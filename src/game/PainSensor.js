/**
 * PainSensor detects and responds to physical damage on body parts.
 * Manages pain intensity, triggers emotional responses, and generates vocalizations.
 */
export class PainSensor {
  constructor(character) {
    this.character = character;
    this.currentPain = 0;
    this.painDecayRate = 10; // Pain decreases by 10 per second
    this.painHistory = [];
  }
  
  /**
   * Register pain from a damage event
   * Requirement 25.6: Record weapon type and associate it with danger when injured
   */
  registerPain(bodyPart, intensity, damageType = 'generic', weaponType = null) {
    // Add to current pain (clamped to 100)
    this.currentPain = Math.min(100, this.currentPain + intensity * 100);
    
    // Record pain event
    const painEvent = {
      bodyPart: bodyPart.type,
      intensity,
      damageType,
      timestamp: Date.now()
    };
    
    // Requirement 25.6: Track weapon type if pain was caused by a weapon
    if (weaponType) {
      painEvent.weaponType = weaponType;
      painEvent.weaponCaused = true;
    }
    
    this.painHistory.push(painEvent);
    
    // Requirement 25.6: Record weapon-danger association in memory
    if (weaponType && this.character.memory) {
      const emotionalIntensity = Math.min(1.0, 0.6 + intensity * 0.4);
      this.character.memory.addEpisode(
        `Injured by ${weaponType} (${damageType} damage) - ${bodyPart.type} hurt`,
        {
          weaponType,
          damageType,
          bodyPart: bodyPart.type,
          intensity,
          dangerous: true
        },
        emotionalIntensity
      );
      
      // Update weapon danger tracking in memory system
      if (this.character.memory.recordWeaponDanger) {
        this.character.memory.recordWeaponDanger(weaponType, intensity);
      }
    }
    
    // Trigger emotional response if character has emotion system
    if (this.character.emotions) {
      this.character.emotions.trigger('fearful', intensity * 0.5, 'pain');
      if (intensity > 0.5) {
        this.character.emotions.trigger('angry', intensity * 0.3, 'pain');
      }
    }
    
    // Generate pain vocalization
    if (intensity > 0.3 && this.character.speak) {
      const vocalizations = ['Ow!', 'That hurts!', 'Stop!', 'Ahhh!'];
      const vocalization = vocalizations[Math.floor(Math.random() * vocalizations.length)];
      this.character.speak(vocalization, 'speech');
    }
  }
  
  /**
   * Update pain decay over time
   */
  update(dt) {
    // Decay pain over time
    this.currentPain = Math.max(0, this.currentPain - this.painDecayRate * dt);
  }
  
  /**
   * Get current pain level (0-100)
   */
  getPainLevel() {
    return this.currentPain;
  }
  
  /**
   * Get recent pain events
   */
  getRecentPain(timeWindow = 5000) {
    const now = Date.now();
    return this.painHistory.filter(event => now - event.timestamp < timeWindow);
  }
  
  /**
   * Get the most painful body part
   */
  getMostPainfulPart() {
    const recent = this.getRecentPain();
    if (recent.length === 0) return null;
    
    // Find the most intense recent pain
    return recent.reduce((max, event) => 
      event.intensity > max.intensity ? event : max
    );
  }
  
  /**
   * Get weapon-caused pain events
   * Requirement 25.6: Track weapon-caused pain for learning
   * @param {number} timeWindow - Time window in milliseconds (default: all time)
   * @returns {Array} Array of weapon-caused pain events
   */
  getWeaponPainHistory(timeWindow = null) {
    let events = this.painHistory.filter(event => event.weaponCaused);
    
    if (timeWindow !== null) {
      const now = Date.now();
      events = events.filter(event => now - event.timestamp < timeWindow);
    }
    
    return events;
  }
  
  /**
   * Get dangerous weapons based on pain history
   * Requirement 25.8: Identify weapons that previously caused pain
   * @returns {Object} Map of weapon types to danger scores
   */
  getDangerousWeapons() {
    const weaponDanger = {};
    const weaponPain = this.getWeaponPainHistory();
    
    for (const event of weaponPain) {
      if (!weaponDanger[event.weaponType]) {
        weaponDanger[event.weaponType] = {
          totalPain: 0,
          count: 0,
          lastEncounter: 0,
          damageTypes: new Set()
        };
      }
      
      weaponDanger[event.weaponType].totalPain += event.intensity;
      weaponDanger[event.weaponType].count++;
      weaponDanger[event.weaponType].lastEncounter = Math.max(
        weaponDanger[event.weaponType].lastEncounter,
        event.timestamp
      );
      weaponDanger[event.weaponType].damageTypes.add(event.damageType);
    }
    
    // Calculate danger scores (0-1 scale)
    for (const weaponType in weaponDanger) {
      const data = weaponDanger[weaponType];
      const avgPain = data.totalPain / data.count;
      const recencyFactor = Math.max(0, 1 - (Date.now() - data.lastEncounter) / (1000 * 60 * 5)); // Decay over 5 minutes
      
      weaponDanger[weaponType].dangerScore = Math.min(1.0, avgPain * 0.7 + recencyFactor * 0.3);
      weaponDanger[weaponType].damageTypes = Array.from(data.damageTypes);
    }
    
    return weaponDanger;
  }
}
