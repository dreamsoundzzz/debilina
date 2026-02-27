/**
 * GoalHierarchy implements structured goal representation
 * Based on hierarchical goal systems in cognitive architectures
 * 
 * Features:
 * - Multi-level goal tree (5 levels)
 * - Goal conflict detection
 * - Priority resolution
 * - Goal activation/deactivation
 * - Goal satisfaction tracking
 */

export class GoalHierarchy {
  /**
   * Create a new goal hierarchy
   */
  constructor() {
    // Goal tree structure
    this.goals = new Map(); // goalId -> Goal
    this.rootGoals = []; // Top-level goals
    
    // Goal levels (priority order)
    this.levels = {
      SURVIVAL: 5,    // Hunger, thirst, energy, pain avoidance
      SAFETY: 4,      // Threat avoidance, shelter seeking
      SOCIAL: 3,      // Interaction, communication, relationships
      EXPLORATION: 2, // Curiosity, learning, discovery
      META: 1         // Self-improvement, reflection
    };
    
    // Active goals (currently being pursued)
    this.activeGoals = [];
    this.maxActiveGoals = 3;
    
    // Goal conflicts
    this.conflicts = [];
    
    // Metrics
    this.totalGoalsCreated = 0;
    this.goalsCompleted = 0;
    this.goalsAbandoned = 0;
    this.conflictsResolved = 0;
    
    // Next goal ID
    this.nextGoalId = 0;
  }

  /**
   * Create a new goal
   * @param {Object} config - Goal configuration
   * @param {string} config.name - Goal name
   * @param {string} config.level - Goal level (SURVIVAL, SAFETY, SOCIAL, EXPLORATION, META)
   * @param {number} config.priority - Priority within level (0-1)
   * @param {Function} config.condition - Satisfaction condition function
   * @param {Array} config.subgoals - Child goal IDs
   * @param {Object} config.context - Additional context
   * @returns {string} Goal ID
   */
  createGoal(config) {
    const goalId = `goal_${this.nextGoalId++}`;
    
    const goal = {
      id: goalId,
      name: config.name,
      level: config.level || 'EXPLORATION',
      priority: config.priority || 0.5,
      condition: config.condition || (() => false),
      subgoals: config.subgoals || [],
      parentGoal: config.parentGoal || null,
      
      // State
      status: 'inactive', // inactive, active, satisfied, abandoned
      activatedAt: null,
      satisfiedAt: null,
      abandonedAt: null,
      
      // Progress tracking
      progress: 0, // 0-1
      attempts: 0,
      lastAttempt: null,
      
      // Context
      context: config.context || {},
      
      // Metadata
      createdAt: Date.now(),
      importance: this.calculateImportance(config.level, config.priority)
    };
    
    this.goals.set(goalId, goal);
    this.totalGoalsCreated++;
    
    // Add to root goals if no parent
    if (!goal.parentGoal) {
      this.rootGoals.push(goalId);
    }
    
    return goalId;
  }

  /**
   * Calculate goal importance based on level and priority
   * @param {string} level - Goal level
   * @param {number} priority - Priority within level
   * @returns {number} Importance score (0-1)
   */
  calculateImportance(level, priority) {
    const levelWeight = this.levels[level] || 1;
    const maxLevel = Math.max(...Object.values(this.levels));
    
    // Combine level weight and priority
    const levelScore = levelWeight / maxLevel;
    const priorityScore = priority;
    
    // Weighted combination (level is more important)
    return (levelScore * 0.7) + (priorityScore * 0.3);
  }

  /**
   * Activate a goal
   * @param {string} goalId - Goal ID
   * @returns {boolean} True if activated
   */
  activateGoal(goalId) {
    const goal = this.goals.get(goalId);
    
    if (!goal) {
      console.warn(`GoalHierarchy: Goal ${goalId} not found`);
      return false;
    }
    
    if (goal.status === 'active') {
      return true; // Already active
    }
    
    if (goal.status === 'satisfied') {
      return false; // Already satisfied
    }
    
    // Check if we can add more active goals
    if (this.activeGoals.length >= this.maxActiveGoals) {
      // Try to replace lower-priority goal
      const lowestPriority = this.activeGoals.reduce((lowest, id) => {
        const g = this.goals.get(id);
        return (!lowest || g.importance < this.goals.get(lowest).importance) ? id : lowest;
      }, null);
      
      if (lowestPriority && this.goals.get(lowestPriority).importance < goal.importance) {
        this.deactivateGoal(lowestPriority);
      } else {
        return false; // Can't activate
      }
    }
    
    // Activate goal
    goal.status = 'active';
    goal.activatedAt = Date.now();
    goal.attempts++;
    goal.lastAttempt = Date.now();
    
    this.activeGoals.push(goalId);
    
    // Check for conflicts
    this.detectConflicts();
    
    return true;
  }

  /**
   * Deactivate a goal
   * @param {string} goalId - Goal ID
   */
  deactivateGoal(goalId) {
    const goal = this.goals.get(goalId);
    
    if (!goal) {
      return;
    }
    
    goal.status = 'inactive';
    
    const index = this.activeGoals.indexOf(goalId);
    if (index !== -1) {
      this.activeGoals.splice(index, 1);
    }
  }

  /**
   * Mark goal as satisfied
   * @param {string} goalId - Goal ID
   */
  satisfyGoal(goalId) {
    const goal = this.goals.get(goalId);
    
    if (!goal) {
      return;
    }
    
    goal.status = 'satisfied';
    goal.satisfiedAt = Date.now();
    goal.progress = 1.0;
    
    const index = this.activeGoals.indexOf(goalId);
    if (index !== -1) {
      this.activeGoals.splice(index, 1);
    }
    
    this.goalsCompleted++;
    
    // Check if parent goal can be satisfied
    if (goal.parentGoal) {
      this.checkParentGoal(goal.parentGoal);
    }
  }

  /**
   * Abandon a goal
   * @param {string} goalId - Goal ID
   * @param {string} reason - Reason for abandonment
   */
  abandonGoal(goalId, reason = 'unknown') {
    const goal = this.goals.get(goalId);
    
    if (!goal) {
      return;
    }
    
    goal.status = 'abandoned';
    goal.abandonedAt = Date.now();
    goal.context.abandonReason = reason;
    
    const index = this.activeGoals.indexOf(goalId);
    if (index !== -1) {
      this.activeGoals.splice(index, 1);
    }
    
    this.goalsAbandoned++;
  }

  /**
   * Check if parent goal can be satisfied
   * @param {string} parentGoalId - Parent goal ID
   */
  checkParentGoal(parentGoalId) {
    const parent = this.goals.get(parentGoalId);
    
    if (!parent) {
      return;
    }
    
    // Check if all subgoals are satisfied
    const allSatisfied = parent.subgoals.every(subgoalId => {
      const subgoal = this.goals.get(subgoalId);
      return subgoal && subgoal.status === 'satisfied';
    });
    
    if (allSatisfied) {
      this.satisfyGoal(parentGoalId);
    }
  }

  /**
   * Update goal progress
   * @param {string} goalId - Goal ID
   * @param {number} progress - Progress value (0-1)
   */
  updateProgress(goalId, progress) {
    const goal = this.goals.get(goalId);
    
    if (!goal) {
      return;
    }
    
    goal.progress = Math.max(0, Math.min(1, progress));
    
    // Auto-satisfy if progress reaches 1.0
    if (goal.progress >= 1.0) {
      this.satisfyGoal(goalId);
    }
  }

  /**
   * Detect conflicts between active goals
   */
  detectConflicts() {
    this.conflicts = [];
    
    // Check all pairs of active goals
    for (let i = 0; i < this.activeGoals.length; i++) {
      for (let j = i + 1; j < this.activeGoals.length; j++) {
        const goal1 = this.goals.get(this.activeGoals[i]);
        const goal2 = this.goals.get(this.activeGoals[j]);
        
        if (this.areGoalsConflicting(goal1, goal2)) {
          this.conflicts.push({
            goal1: goal1.id,
            goal2: goal2.id,
            type: this.getConflictType(goal1, goal2),
            severity: this.getConflictSeverity(goal1, goal2)
          });
        }
      }
    }
  }

  /**
   * Check if two goals are conflicting
   * @param {Object} goal1 - First goal
   * @param {Object} goal2 - Second goal
   * @returns {boolean} True if conflicting
   */
  areGoalsConflicting(goal1, goal2) {
    // Check for explicit conflicts in context
    if (goal1.context.conflictsWith && goal1.context.conflictsWith.includes(goal2.id)) {
      return true;
    }
    
    if (goal2.context.conflictsWith && goal2.context.conflictsWith.includes(goal1.id)) {
      return true;
    }
    
    // Check for resource conflicts
    if (goal1.context.requiredResources && goal2.context.requiredResources) {
      const resources1 = new Set(goal1.context.requiredResources);
      const resources2 = new Set(goal2.context.requiredResources);
      
      // Check for overlapping resources
      for (const resource of resources1) {
        if (resources2.has(resource)) {
          return true;
        }
      }
    }
    
    // Check for mutually exclusive actions
    if (goal1.context.action && goal2.context.action) {
      const mutuallyExclusive = [
        ['approach', 'flee'],
        ['grab', 'release'],
        ['attack', 'befriend']
      ];
      
      for (const [action1, action2] of mutuallyExclusive) {
        if ((goal1.context.action === action1 && goal2.context.action === action2) ||
            (goal1.context.action === action2 && goal2.context.action === action1)) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Get conflict type
   * @param {Object} goal1 - First goal
   * @param {Object} goal2 - Second goal
   * @returns {string} Conflict type
   */
  getConflictType(goal1, goal2) {
    if (goal1.context.requiredResources && goal2.context.requiredResources) {
      return 'resource';
    }
    
    if (goal1.context.action && goal2.context.action) {
      return 'action';
    }
    
    return 'general';
  }

  /**
   * Get conflict severity
   * @param {Object} goal1 - First goal
   * @param {Object} goal2 - Second goal
   * @returns {number} Severity (0-1)
   */
  getConflictSeverity(goal1, goal2) {
    // Higher severity if goals are at different levels
    const levelDiff = Math.abs(this.levels[goal1.level] - this.levels[goal2.level]);
    const maxLevelDiff = Math.max(...Object.values(this.levels)) - Math.min(...Object.values(this.levels));
    
    return levelDiff / maxLevelDiff;
  }

  /**
   * Resolve conflicts between goals
   */
  resolveConflicts() {
    for (const conflict of this.conflicts) {
      const goal1 = this.goals.get(conflict.goal1);
      const goal2 = this.goals.get(conflict.goal2);
      
      // Resolve by importance
      if (goal1.importance > goal2.importance) {
        this.deactivateGoal(goal2.id);
      } else {
        this.deactivateGoal(goal1.id);
      }
      
      this.conflictsResolved++;
    }
    
    this.conflicts = [];
  }

  /**
   * Update goal hierarchy
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    // Check satisfaction conditions for active goals
    for (const goalId of [...this.activeGoals]) {
      const goal = this.goals.get(goalId);
      
      if (!goal) {
        continue;
      }
      
      // Check if goal is satisfied
      if (goal.condition()) {
        this.satisfyGoal(goalId);
      }
    }
    
    // Resolve any conflicts
    if (this.conflicts.length > 0) {
      this.resolveConflicts();
    }
    
    // Auto-activate high-priority inactive goals
    this.autoActivateGoals();
  }

  /**
   * Auto-activate high-priority goals
   */
  autoActivateGoals() {
    if (this.activeGoals.length >= this.maxActiveGoals) {
      return;
    }
    
    // Get inactive goals sorted by importance
    const inactiveGoals = Array.from(this.goals.values())
      .filter(g => g.status === 'inactive')
      .sort((a, b) => b.importance - a.importance);
    
    // Activate highest-priority goals
    for (const goal of inactiveGoals) {
      if (this.activeGoals.length >= this.maxActiveGoals) {
        break;
      }
      
      this.activateGoal(goal.id);
    }
  }

  /**
   * Get active goals
   * @returns {Array} Active goals
   */
  getActiveGoals() {
    return this.activeGoals.map(id => this.goals.get(id)).filter(g => g);
  }

  /**
   * Get goals by level
   * @param {string} level - Goal level
   * @returns {Array} Goals at level
   */
  getGoalsByLevel(level) {
    return Array.from(this.goals.values()).filter(g => g.level === level);
  }

  /**
   * Get goals by status
   * @param {string} status - Goal status
   * @returns {Array} Goals with status
   */
  getGoalsByStatus(status) {
    return Array.from(this.goals.values()).filter(g => g.status === status);
  }

  /**
   * Get goal by ID
   * @param {string} goalId - Goal ID
   * @returns {Object|null} Goal or null
   */
  getGoal(goalId) {
    return this.goals.get(goalId) || null;
  }

  /**
   * Get current conflicts
   * @returns {Array} Conflicts
   */
  getConflicts() {
    return [...this.conflicts];
  }

  /**
   * Get goal tree for a goal
   * @param {string} goalId - Goal ID
   * @returns {Object} Goal tree
   */
  getGoalTree(goalId) {
    const goal = this.goals.get(goalId);
    
    if (!goal) {
      return null;
    }
    
    return {
      ...goal,
      subgoals: goal.subgoals.map(id => this.getGoalTree(id)).filter(g => g)
    };
  }

  /**
   * Get statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    return {
      totalGoals: this.goals.size,
      activeGoals: this.activeGoals.length,
      satisfiedGoals: this.goalsCompleted,
      abandonedGoals: this.goalsAbandoned,
      conflicts: this.conflicts.length,
      conflictsResolved: this.conflictsResolved,
      goalsByLevel: {
        survival: this.getGoalsByLevel('SURVIVAL').length,
        safety: this.getGoalsByLevel('SAFETY').length,
        social: this.getGoalsByLevel('SOCIAL').length,
        exploration: this.getGoalsByLevel('EXPLORATION').length,
        meta: this.getGoalsByLevel('META').length
      }
    };
  }

  /**
   * Get highest-priority active goal
   * @returns {Object|null} Highest-priority goal
   */
  getTopGoal() {
    if (this.activeGoals.length === 0) {
      return null;
    }
    
    return this.activeGoals
      .map(id => this.goals.get(id))
      .filter(g => g)
      .sort((a, b) => b.importance - a.importance)[0];
  }

  /**
   * Clear all goals
   */
  clear() {
    this.goals.clear();
    this.rootGoals = [];
    this.activeGoals = [];
    this.conflicts = [];
  }

  /**
   * Reset statistics
   */
  resetStatistics() {
    this.totalGoalsCreated = 0;
    this.goalsCompleted = 0;
    this.goalsAbandoned = 0;
    this.conflictsResolved = 0;
  }
}
