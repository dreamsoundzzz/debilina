/**
 * EmotionSystem manages NPC emotional states and their evolution over time
 * Emotions influence AI behavior, dialogue tone, and decision-making
 * 
 * Requirements:
 * - 16.1: Maintain emotional state values for at least 5 emotions
 * - 16.2: Update emotional states based on events
 * - 16.3: Decay emotional intensities over time toward neutral states
 */
export class EmotionSystem {
  /**
   * Create a new emotion system
   * Requirement 16.1: Maintain at least 5 emotions (happy, sad, angry, fearful, curious)
   */
  constructor() {
    // Requirement 16.1: Emotional state values for 5 emotions
    // Values range from 0.0 to 1.0, with 0.5 being neutral
    this.emotions = {
      happy: 0.5,      // Positive emotion, increases with pleasant experiences
      sad: 0.0,        // Negative emotion, increases with loss or disappointment
      angry: 0.0,      // Negative emotion, increases with frustration or pain
      fearful: 0.0,    // Negative emotion, increases with threats or danger
      curious: 0.5     // Neutral/positive emotion, increases with novel stimuli
    };
    
    // Requirement 16.3: Decay rate toward neutral (0.5) per second
    this.decayRate = 0.01; // 1% per second
  }

  /**
   * Update emotion decay toward neutral state
   * Requirement 16.3: Decay emotional intensities over time toward neutral states
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    const target = 0.5; // Neutral state
    const decay = this.decayRate * dt;

    // Decay each emotion toward neutral (0.5)
    for (const emotion in this.emotions) {
      const current = this.emotions[emotion];
      
      if (current > target) {
        // Decay down toward neutral
        this.emotions[emotion] = Math.max(target, current - decay);
      } else if (current < target) {
        // Decay up toward neutral
        this.emotions[emotion] = Math.min(target, current + decay);
      }
    }
  }

  /**
   * Trigger an emotional response to an event
   * Requirement 16.2: Update emotional states based on event type and intensity
   * @param {string} emotion - Emotion to trigger (happy, sad, angry, fearful, curious)
   * @param {number} intensity - Intensity of the emotion change (-1.0 to 1.0)
   * @param {string} event - Description of the triggering event (for logging/memory)
   */
  trigger(emotion, intensity, event) {
    if (!this.emotions.hasOwnProperty(emotion)) {
      console.warn(`EmotionSystem: Unknown emotion "${emotion}"`);
      return;
    }

    // Apply intensity change and clamp to [0, 1]
    this.emotions[emotion] = Math.max(0, Math.min(1, 
      this.emotions[emotion] + intensity
    ));

    // Requirement 16.2: Handle emotion interactions
    // Fear reduces happiness
    if (emotion === 'fearful' && intensity > 0.3) {
      this.emotions.happy = Math.max(0, this.emotions.happy - 0.2);
    }
    
    // Happiness reduces sadness
    if (emotion === 'happy' && intensity > 0.3) {
      this.emotions.sad = Math.max(0, this.emotions.sad - 0.2);
    }
    
    // Anger can reduce fear (fight response)
    if (emotion === 'angry' && intensity > 0.4) {
      this.emotions.fearful = Math.max(0, this.emotions.fearful - 0.15);
    }
    
    // Sadness reduces happiness
    if (emotion === 'sad' && intensity > 0.3) {
      this.emotions.happy = Math.max(0, this.emotions.happy - 0.2);
    }
  }

  /**
   * Get the dominant emotion (highest intensity)
   * @returns {Object} Object with emotion name and intensity {emotion: string, intensity: number}
   */
  getDominantEmotion() {
    let max = 0;
    let dominant = 'neutral';

    for (const [emotion, value] of Object.entries(this.emotions)) {
      if (value > max) {
        max = value;
        dominant = emotion;
      }
    }

    // If all emotions are at neutral (0.5), return neutral
    if (max <= 0.5) {
      return { emotion: 'neutral', intensity: 0.5 };
    }

    return { emotion: dominant, intensity: max };
  }

  /**
   * Get all current emotion values
   * @returns {Object} Copy of emotions object
   */
  getEmotions() {
    return { ...this.emotions };
  }

  /**
   * Get a specific emotion value
   * @param {string} emotion - Emotion name
   * @returns {number} Emotion value (0.0 to 1.0)
   */
  getEmotion(emotion) {
    return this.emotions[emotion] ?? 0.5;
  }

  /**
   * Set a specific emotion value directly (for testing or special events)
   * @param {string} emotion - Emotion name
   * @param {number} value - Emotion value (0.0 to 1.0)
   */
  setEmotion(emotion, value) {
    if (!this.emotions.hasOwnProperty(emotion)) {
      console.warn(`EmotionSystem: Unknown emotion "${emotion}"`);
      return;
    }
    this.emotions[emotion] = Math.max(0, Math.min(1, value));
  }

  /**
   * Reset all emotions to neutral state
   */
  reset() {
    this.emotions.happy = 0.5;
    this.emotions.sad = 0.0;
    this.emotions.angry = 0.0;
    this.emotions.fearful = 0.0;
    this.emotions.curious = 0.5;
  }

  /**
   * Respond emotionally to weapon threats
   * Requirement 25.2: Increase fear when player holds weapon
   * @param {string} weaponType - Type of weapon (melee, ranged, special)
   * @param {string} damageType - Damage type (slash, blunt, bullet, fire, etc.)
   * @param {string} threatLevel - Threat level (low, medium, high)
   * @param {boolean} pointedAtNPC - Whether weapon is pointed/aimed at NPC
   */
  respondToWeaponThreat(weaponType, damageType, threatLevel = 'medium', pointedAtNPC = false) {
    // Requirement 25.2: Increase fear when player holds weapon
    let fearIntensity = 0;
    
    // Base fear based on threat level
    if (threatLevel === 'high') {
      fearIntensity = 0.4; // Ranged weapons, special weapons
    } else if (threatLevel === 'medium') {
      fearIntensity = 0.25; // Melee weapons
    } else {
      fearIntensity = 0.15; // Low threat weapons
    }
    
    // Increase fear if weapon is pointed at NPC
    if (pointedAtNPC) {
      fearIntensity += 0.2;
    }
    
    // Special cases for particularly threatening weapons
    if (damageType === 'fire' || weaponType === 'special') {
      fearIntensity += 0.15; // Flamethrower, chainsaw are extra scary
    }
    
    if (damageType === 'bullet' || weaponType === 'ranged') {
      fearIntensity += 0.1; // Guns are particularly threatening
    }
    
    // Trigger fear emotion
    this.trigger('fearful', fearIntensity, `weapon_threat_${weaponType}`);
    
    // Reduce curiosity when threatened
    if (fearIntensity > 0.3) {
      this.emotions.curious = Math.max(0, this.emotions.curious - 0.2);
    }
    
    // Reduce happiness when threatened (any weapon threat reduces happiness)
    if (fearIntensity > 0) {
      this.emotions.happy = Math.max(0, this.emotions.happy - 0.15);
    }
  }

  /**
   * Get emotional state as a descriptive string for AI context
   * @returns {string} Human-readable emotion description
   */
  getEmotionalStateDescription() {
    const dominant = this.getDominantEmotion();
    const emotions = this.getEmotions();
    
    // Build description
    const parts = [];
    
    if (dominant.emotion !== 'neutral') {
      const intensityDesc = dominant.intensity > 0.8 ? 'very' : 
                           dominant.intensity > 0.6 ? 'quite' : 'somewhat';
      parts.push(`${intensityDesc} ${dominant.emotion}`);
    } else {
      parts.push('emotionally neutral');
    }
    
    // Add secondary emotions if significant
    const secondary = Object.entries(emotions)
      .filter(([name, value]) => name !== dominant.emotion && value > 0.6)
      .map(([name, value]) => name);
    
    if (secondary.length > 0) {
      parts.push(`with hints of ${secondary.join(' and ')}`);
    }
    
    return parts.join(' ');
  }
}
