/**
 * NeedsWorkspaceAdapter integrates NeedsSystem with GlobalWorkspace
 * Submits urgent survival needs to workspace for conscious awareness
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

export class NeedsWorkspaceAdapter {
  /**
   * Create a new needs workspace adapter
   * @param {NeedsSystem} needsSystem - Needs system instance
   * @param {GlobalWorkspace} workspace - Global workspace instance
   */
  constructor(needsSystem, workspace) {
    this.needsSystem = needsSystem;
    this.workspace = workspace;
  }

  /**
   * Update adapter - check needs and submit to workspace
   * @param {number} currentTime - Current time in milliseconds
   */
  update(currentTime = Date.now()) {
    const needs = this.needsSystem.getNeeds();
    
    // Check each need and submit if urgent
    for (const [needType, value] of Object.entries(needs)) {
      this.processNeed(needType, value, currentTime);
    }
    
    // Submit most critical need if multiple are low (Requirement 7.4)
    const criticalNeed = this.needsSystem.getCriticalNeed();
    if (criticalNeed) {
      this.submitCriticalNeed(criticalNeed, currentTime);
    }
  }

  /**
   * Process a single need and submit if urgent
   * @param {string} needType - Type of need (hunger, thirst, energy)
   * @param {number} value - Current need value (0-100)
   * @param {number} currentTime - Current time
   * 
   * Requirements: 7.1, 7.2, 7.5
   */
  processNeed(needType, value, currentTime) {
    // Skip satisfied needs (Requirement 7.5)
    if (value > 50) {
      return;
    }
    
    // Determine salience based on urgency
    let salience;
    let urgencyLevel;
    
    if (value < 10) {
      // Critical need (Requirement 7.2)
      salience = 1.0;
      urgencyLevel = 'critical';
    } else if (value < 30) {
      // Urgent need (Requirement 7.1)
      salience = 0.9;
      urgencyLevel = 'urgent';
    } else {
      // Low need (below 50)
      salience = 0.6;
      urgencyLevel = 'low';
    }
    
    // Submit to workspace (Requirement 7.3)
    this.workspace.submit(
      {
        type: 'need_urgent',
        needType: needType,
        currentValue: value,
        urgencyLevel: urgencyLevel,
        description: this.getNeedDescription(needType, value, urgencyLevel)
      },
      {
        source: 'NeedsSystem',
        type: 'urgent_need',
        urgency: salience,
        emotionalIntensity: this.getEmotionalIntensity(value)
      }
    );
  }

  /**
   * Submit the most critical need to workspace
   * @param {Object} criticalNeed - Critical need info {type, value}
   * @param {number} currentTime - Current time
   * 
   * Requirement 7.4: Submit most critical need first when multiple are low
   */
  submitCriticalNeed(criticalNeed, currentTime) {
    const salience = criticalNeed.value < 10 ? 1.0 : 0.9;
    
    this.workspace.submit(
      {
        type: 'critical_need',
        needType: criticalNeed.type,
        currentValue: criticalNeed.value,
        urgencyLevel: criticalNeed.value < 10 ? 'critical' : 'urgent',
        description: `${this.getNeedName(criticalNeed.type)} is critically low (${criticalNeed.value.toFixed(0)}%)`,
        priority: 'highest'
      },
      {
        source: 'NeedsSystem',
        type: 'urgent_need',
        urgency: salience,
        emotionalIntensity: this.getEmotionalIntensity(criticalNeed.value),
        persistent: criticalNeed.value < 10 // Keep critical needs in workspace
      }
    );
  }

  /**
   * Get human-readable need description
   * @param {string} needType - Type of need
   * @param {number} value - Current value
   * @param {string} urgencyLevel - Urgency level
   * @returns {string} Description
   */
  getNeedDescription(needType, value, urgencyLevel) {
    const needName = this.getNeedName(needType);
    const percentage = value.toFixed(0);
    
    if (urgencyLevel === 'critical') {
      if (needType === 'hunger') {
        return `Starving! Hunger at ${percentage}%`;
      } else if (needType === 'thirst') {
        return `Severely dehydrated! Thirst at ${percentage}%`;
      } else if (needType === 'energy') {
        return `Completely exhausted! Energy at ${percentage}%`;
      }
    } else if (urgencyLevel === 'urgent') {
      if (needType === 'hunger') {
        return `Very hungry. Hunger at ${percentage}%`;
      } else if (needType === 'thirst') {
        return `Very thirsty. Thirst at ${percentage}%`;
      } else if (needType === 'energy') {
        return `Very tired. Energy at ${percentage}%`;
      }
    } else {
      return `${needName} is getting low (${percentage}%)`;
    }
    
    return `${needName} at ${percentage}%`;
  }

  /**
   * Get capitalized need name
   * @param {string} needType - Type of need
   * @returns {string} Capitalized name
   */
  getNeedName(needType) {
    return needType.charAt(0).toUpperCase() + needType.slice(1);
  }

  /**
   * Calculate emotional intensity based on need value
   * @param {number} value - Need value (0-100)
   * @returns {number} Emotional intensity (0-1)
   */
  getEmotionalIntensity(value) {
    if (value < 10) return 0.9;
    if (value < 20) return 0.7;
    if (value < 30) return 0.5;
    if (value < 50) return 0.3;
    return 0.1;
  }

  /**
   * Reset adapter state
   */
  reset() {
    // No state to reset
  }
}
