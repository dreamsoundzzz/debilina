/**
 * EmotionWorkspaceAdapter integrates EmotionSystem with GlobalWorkspace
 * Submits strong emotional states to workspace for conscious awareness
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

export class EmotionWorkspaceAdapter {
  /**
   * Create a new emotion workspace adapter
   * @param {EmotionSystem} emotionSystem - Emotion system instance
   * @param {GlobalWorkspace} workspace - Global workspace instance
   */
  constructor(emotionSystem, workspace) {
    this.emotionSystem = emotionSystem;
    this.workspace = workspace;
    
    // Track last dominant emotion to detect changes (Requirement 6.2)
    this.lastDominantEmotion = null;
    
    // Intensity threshold for submission (Requirement 6.1, 6.5)
    this.intensityThreshold = 0.6;
  }

  /**
   * Update adapter - check emotions and submit to workspace
   * @param {number} currentTime - Current time in milliseconds
   */
  update(currentTime = Date.now()) {
    const emotions = this.emotionSystem.getEmotions();
    const dominant = this.emotionSystem.getDominantEmotion();
    
    // Check for emotion changes (Requirement 6.2)
    if (this.hasEmotionChanged(dominant)) {
      this.submitEmotionChange(dominant, currentTime);
      this.lastDominantEmotion = dominant.emotion;
    }
    
    // Submit strong emotions (Requirement 6.1, 6.5)
    for (const [emotionName, intensity] of Object.entries(emotions)) {
      if (intensity >= this.intensityThreshold) {
        this.submitEmotion(emotionName, intensity, currentTime);
      }
    }
    
    // Special handling for high fear (Requirement 6.4)
    if (emotions.fearful > 0.8) {
      this.submitHighFear(emotions.fearful, currentTime);
    }
  }

  /**
   * Check if dominant emotion has changed
   * @param {Object} currentDominant - Current dominant emotion
   * @returns {boolean} True if emotion changed
   * 
   * Requirement 6.2: Submit when dominant emotion changes
   */
  hasEmotionChanged(currentDominant) {
    if (!this.lastDominantEmotion) {
      return true; // First check
    }
    
    if (currentDominant.emotion === 'neutral' && this.lastDominantEmotion === 'neutral') {
      return false; // Both neutral, no change
    }
    
    return currentDominant.emotion !== this.lastDominantEmotion;
  }

  /**
   * Submit emotion change to workspace
   * @param {Object} dominant - Dominant emotion info
   * @param {number} currentTime - Current time
   * 
   * Requirement 6.2: Submit emotion changes
   */
  submitEmotionChange(dominant, currentTime) {
    if (dominant.emotion === 'neutral') {
      return; // Don't submit neutral states (Requirement 6.5)
    }
    
    this.workspace.submit(
      {
        type: 'emotion_change',
        emotion: dominant.emotion,
        intensity: dominant.intensity,
        previousEmotion: this.lastDominantEmotion,
        description: this.emotionSystem.getEmotionalStateDescription()
      },
      {
        source: 'EmotionSystem',
        type: 'strong_emotion',
        urgency: dominant.intensity * 0.5, // Emotion changes are moderately urgent
        emotionalIntensity: dominant.intensity
      }
    );
  }

  /**
   * Submit strong emotion to workspace
   * @param {string} emotionName - Name of emotion
   * @param {number} intensity - Emotion intensity
   * @param {number} currentTime - Current time
   * 
   * Requirement 6.1: Submit emotions with intensity >= 0.6
   * Requirement 6.3: Include emotion type, intensity, and triggering event
   */
  submitEmotion(emotionName, intensity, currentTime) {
    // Skip neutral emotions (Requirement 6.5)
    if (emotionName === 'neutral' || intensity < this.intensityThreshold) {
      return;
    }
    
    // Use intensity as salience (Requirement 6.1)
    const salience = intensity;
    
    this.workspace.submit(
      {
        type: 'strong_emotion',
        emotion: emotionName,
        intensity: intensity,
        description: `Feeling ${this.getIntensityDescription(intensity)} ${emotionName}`,
        timestamp: currentTime
      },
      {
        source: 'EmotionSystem',
        type: 'strong_emotion',
        urgency: salience * 0.7, // Strong emotions are fairly urgent
        emotionalIntensity: intensity
      }
    );
  }

  /**
   * Submit high fear to workspace with maximum salience
   * @param {number} fearIntensity - Fear intensity
   * @param {number} currentTime - Current time
   * 
   * Requirement 6.4: Submit fear > 0.8 with salience 1.0
   */
  submitHighFear(fearIntensity, currentTime) {
    this.workspace.submit(
      {
        type: 'high_fear',
        emotion: 'fearful',
        intensity: fearIntensity,
        description: `Experiencing intense fear (${(fearIntensity * 100).toFixed(0)}%)`,
        timestamp: currentTime,
        urgent: true
      },
      {
        source: 'EmotionSystem',
        type: 'strong_emotion',
        urgency: 1.0, // Maximum salience (Requirement 6.4)
        emotionalIntensity: fearIntensity,
        persistent: true // Keep in workspace until fear subsides
      }
    );
  }

  /**
   * Get intensity description for human-readable output
   * @param {number} intensity - Emotion intensity (0-1)
   * @returns {string} Description
   */
  getIntensityDescription(intensity) {
    if (intensity > 0.9) return 'extremely';
    if (intensity > 0.8) return 'very';
    if (intensity > 0.7) return 'quite';
    if (intensity > 0.6) return 'somewhat';
    return 'mildly';
  }

  /**
   * Reset adapter state
   */
  reset() {
    this.lastDominantEmotion = null;
  }
}
