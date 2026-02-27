/**
 * AttentionSystem implements selective focus and prioritization
 * Based on attention mechanisms in cognitive science
 * 
 * Features:
 * - Salience-based attention (bottom-up)
 * - Goal-driven attention (top-down)
 * - Attention shifting
 * - Focus maintenance
 * - Inhibition of return
 */

export class AttentionSystem {
  /**
   * Create a new attention system
   * @param {GlobalWorkspace} workspace - Global workspace instance
   */
  constructor(workspace) {
    this.workspace = workspace;
    
    // Current attention focus
    this.currentFocus = null;
    this.focusStartTime = 0;
    this.focusDuration = 0;
    
    // Attention spotlight parameters
    this.minFocusDuration = 500; // Minimum 500ms focus
    this.maxFocusDuration = 5000; // Maximum 5s focus
    this.shiftThreshold = 0.3; // Salience difference needed to shift
    
    // Inhibition of return
    this.inhibitedItems = new Map(); // itemId -> {timestamp, inhibitionStrength}
    this.inhibitionDuration = 3000; // 3 seconds
    this.inhibitionStrength = 0.3; // Reduce salience by 30%
    
    // Goal-driven attention
    this.currentGoals = []; // Array of {type, priority, keywords}
    
    // Attention history
    this.attentionHistory = []; // Last 10 focus items
    this.maxHistorySize = 10;
    
    // Metrics
    this.totalShifts = 0;
    this.voluntaryShifts = 0; // Goal-driven
    this.involuntaryShifts = 0; // Salience-driven
  }

  /**
   * Update attention system
   * @param {number} currentTime - Current time in milliseconds
   * @param {number} dt - Delta time in seconds
   */
  update(currentTime, dt) {
    // Get workspace contents
    const contents = this.workspace.getContents();
    
    if (contents.length === 0) {
      this.currentFocus = null;
      return;
    }
    
    // Apply inhibition of return
    const adjustedContents = this.applyInhibition(contents, currentTime);
    
    // Apply goal-driven modulation
    const modulatedContents = this.applyGoalModulation(adjustedContents);
    
    // Determine if attention should shift
    const shouldShift = this.shouldShiftAttention(modulatedContents, currentTime);
    
    if (shouldShift) {
      this.shiftAttention(modulatedContents[0], currentTime);
    } else if (this.currentFocus) {
      // Update focus duration
      this.focusDuration = currentTime - this.focusStartTime;
    }
    
    // Clean up old inhibitions
    this.cleanupInhibitions(currentTime);
  }

  /**
   * Apply inhibition of return to recently attended items
   * @param {Array} contents - Workspace contents
   * @param {number} currentTime - Current time
   * @returns {Array} Contents with adjusted salience
   */
  applyInhibition(contents, currentTime) {
    return contents.map(item => {
      const inhibition = this.inhibitedItems.get(item.id);
      
      if (!inhibition) {
        return item;
      }
      
      // Check if inhibition expired
      const age = currentTime - inhibition.timestamp;
      if (age > this.inhibitionDuration) {
        this.inhibitedItems.delete(item.id);
        return item;
      }
      
      // Apply inhibition (reduce salience)
      const inhibitionFactor = 1 - (inhibition.inhibitionStrength * (1 - age / this.inhibitionDuration));
      
      return {
        ...item,
        salience: item.salience * inhibitionFactor,
        inhibited: true
      };
    }).sort((a, b) => b.salience - a.salience);
  }

  /**
   * Apply goal-driven modulation to salience
   * @param {Array} contents - Workspace contents
   * @returns {Array} Contents with modulated salience
   */
  applyGoalModulation(contents) {
    if (this.currentGoals.length === 0) {
      return contents;
    }
    
    return contents.map(item => {
      let goalBoost = 0;
      
      // Check if item matches any current goals
      for (const goal of this.currentGoals) {
        if (this.matchesGoal(item, goal)) {
          goalBoost = Math.max(goalBoost, goal.priority * 0.2);
        }
      }
      
      return {
        ...item,
        salience: Math.min(1.0, item.salience + goalBoost),
        goalRelevant: goalBoost > 0
      };
    }).sort((a, b) => b.salience - a.salience);
  }

  /**
   * Check if item matches a goal
   * @param {Object} item - Workspace item
   * @param {Object} goal - Goal specification
   * @returns {boolean} True if matches
   */
  matchesGoal(item, goal) {
    // Match by type
    if (goal.type && item.type === goal.type) {
      return true;
    }
    
    // Match by keywords
    if (goal.keywords && goal.keywords.length > 0) {
      const itemText = JSON.stringify(item.content).toLowerCase();
      return goal.keywords.some(keyword => itemText.includes(keyword.toLowerCase()));
    }
    
    return false;
  }

  /**
   * Determine if attention should shift
   * @param {Array} contents - Modulated workspace contents
   * @param {number} currentTime - Current time
   * @returns {boolean} True if should shift
   */
  shouldShiftAttention(contents, currentTime) {
    if (contents.length === 0) {
      return false;
    }
    
    const topItem = contents[0];
    
    // No current focus - shift to top item
    if (!this.currentFocus) {
      return true;
    }
    
    // Check minimum focus duration
    const focusAge = currentTime - this.focusStartTime;
    if (focusAge < this.minFocusDuration) {
      return false; // Too soon to shift
    }
    
    // Check maximum focus duration
    if (focusAge > this.maxFocusDuration) {
      return true; // Force shift after max duration
    }
    
    // Check if top item is different and significantly more salient
    if (topItem.id !== this.currentFocus.id) {
      const salienceDiff = topItem.salience - this.currentFocus.salience;
      if (salienceDiff > this.shiftThreshold) {
        return true; // Shift to more salient item
      }
    }
    
    return false;
  }

  /**
   * Shift attention to new focus
   * @param {Object} newFocus - New focus item
   * @param {number} currentTime - Current time
   */
  shiftAttention(newFocus, currentTime) {
    // Add old focus to inhibition
    if (this.currentFocus) {
      this.inhibitedItems.set(this.currentFocus.id, {
        timestamp: currentTime,
        inhibitionStrength: this.inhibitionStrength
      });
      
      // Add to history
      this.attentionHistory.push({
        item: this.currentFocus,
        duration: currentTime - this.focusStartTime,
        timestamp: this.focusStartTime
      });
      
      if (this.attentionHistory.length > this.maxHistorySize) {
        this.attentionHistory.shift();
      }
    }
    
    // Update focus
    this.currentFocus = newFocus;
    this.focusStartTime = currentTime;
    this.focusDuration = 0;
    
    // Update metrics
    this.totalShifts++;
    if (newFocus.goalRelevant) {
      this.voluntaryShifts++;
    } else {
      this.involuntaryShifts++;
    }
  }

  /**
   * Clean up expired inhibitions
   * @param {number} currentTime - Current time
   */
  cleanupInhibitions(currentTime) {
    for (const [itemId, inhibition] of this.inhibitedItems.entries()) {
      if (currentTime - inhibition.timestamp > this.inhibitionDuration) {
        this.inhibitedItems.delete(itemId);
      }
    }
  }

  /**
   * Set current goals for top-down attention
   * @param {Array} goals - Array of goal objects
   */
  setGoals(goals) {
    this.currentGoals = goals;
  }

  /**
   * Add a goal
   * @param {Object} goal - Goal specification {type, priority, keywords}
   */
  addGoal(goal) {
    this.currentGoals.push(goal);
  }

  /**
   * Remove a goal
   * @param {string} goalType - Goal type to remove
   */
  removeGoal(goalType) {
    this.currentGoals = this.currentGoals.filter(g => g.type !== goalType);
  }

  /**
   * Clear all goals
   */
  clearGoals() {
    this.currentGoals = [];
  }

  /**
   * Get current attention focus
   * @returns {Object|null} Current focus item
   */
  getFocus() {
    return this.currentFocus;
  }

  /**
   * Get focus duration
   * @returns {number} Duration in milliseconds
   */
  getFocusDuration() {
    return this.focusDuration;
  }

  /**
   * Get attention history
   * @returns {Array} History of focus items
   */
  getHistory() {
    return [...this.attentionHistory];
  }

  /**
   * Get attention metrics
   * @returns {Object} Metrics data
   */
  getMetrics() {
    return {
      totalShifts: this.totalShifts,
      voluntaryShifts: this.voluntaryShifts,
      involuntaryShifts: this.involuntaryShifts,
      currentFocusDuration: this.focusDuration,
      inhibitedItemsCount: this.inhibitedItems.size,
      activeGoalsCount: this.currentGoals.length
    };
  }

  /**
   * Force attention shift to specific item
   * @param {Object} item - Item to focus on
   * @param {number} currentTime - Current time
   */
  forceAttention(item, currentTime) {
    this.shiftAttention(item, currentTime);
  }

  /**
   * Reset attention system
   */
  reset() {
    this.currentFocus = null;
    this.focusStartTime = 0;
    this.focusDuration = 0;
    this.inhibitedItems.clear();
    this.currentGoals = [];
    this.attentionHistory = [];
    this.totalShifts = 0;
    this.voluntaryShifts = 0;
    this.involuntaryShifts = 0;
  }
}
