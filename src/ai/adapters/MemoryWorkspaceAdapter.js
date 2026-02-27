/**
 * MemoryWorkspaceAdapter integrates MemorySystem with GlobalWorkspace
 * Submits relevant memories to workspace for conscious awareness
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

export class MemoryWorkspaceAdapter {
  /**
   * Create a new memory workspace adapter
   * @param {MemorySystem} memorySystem - Memory system instance
   * @param {GlobalWorkspace} workspace - Global workspace instance
   */
  constructor(memorySystem, workspace) {
    this.memorySystem = memorySystem;
    this.workspace = workspace;
    
    // Track submissions per cycle (Requirement 8.4)
    this.submissionsThisCycle = 0;
    this.maxSubmissionsPerCycle = 2;
    this.lastCycleReset = Date.now();
    this.cycleResetInterval = 3000; // 3 seconds
  }

  /**
   * Update adapter - recall and submit relevant memories
   * @param {Object} context - Current context for memory recall
   * @param {number} currentTime - Current time in milliseconds
   */
  update(context = {}, currentTime = Date.now()) {
    // Reset submission counter if cycle elapsed
    if (currentTime - this.lastCycleReset > this.cycleResetInterval) {
      this.submissionsThisCycle = 0;
      this.lastCycleReset = currentTime;
    }
    
    // Check if we've hit submission limit (Requirement 8.4)
    if (this.submissionsThisCycle >= this.maxSubmissionsPerCycle) {
      return;
    }
    
    // Build query from context
    const query = this.buildMemoryQuery(context);
    
    // Recall relevant memories (Requirement 8.1)
    const memories = this.memorySystem.recall(query, 5);
    
    // Prioritize recent memories (Requirement 8.5)
    const recentMemories = memories.filter(mem => {
      const age = currentTime - mem.timestamp;
      return age < 60000; // Within last 60 seconds
    });
    
    // Submit memories to workspace
    const memoriesToSubmit = recentMemories.length > 0 ? recentMemories : memories;
    
    for (const memory of memoriesToSubmit) {
      if (this.submissionsThisCycle >= this.maxSubmissionsPerCycle) {
        break;
      }
      
      this.processMemory(memory, currentTime);
    }
  }

  /**
   * Build memory query from current context
   * @param {Object} context - Current context
   * @returns {Object} Memory query
   */
  buildMemoryQuery(context) {
    const query = {
      text: '',
      context: {}
    };
    
    // Add visible objects to query
    if (context.visibleObjects && context.visibleObjects.length > 0) {
      query.text = context.visibleObjects.join(' ');
    }
    
    // Add emotional state to query
    if (context.emotionalState) {
      query.text += ` ${context.emotionalState}`;
    }
    
    // Add needs to query
    if (context.needsDescription) {
      query.text += ` ${context.needsDescription}`;
    }
    
    return query;
  }

  /**
   * Process a memory and submit to workspace if relevant
   * @param {Object} memory - Memory object
   * @param {number} currentTime - Current time
   * 
   * Requirements: 8.1, 8.2, 8.3
   */
  processMemory(memory, currentTime) {
    // Calculate relevance (Requirement 8.1)
    const relevance = memory.importance;
    
    // Skip if relevance too low (Requirement 8.1)
    if (relevance < 0.7) {
      return;
    }
    
    // Calculate salience
    let salience = relevance;
    
    // Boost for high importance (Requirement 8.2)
    if (memory.importance > 0.8) {
      salience = Math.min(1.0, salience + 0.2);
    }
    
    // Submit to workspace (Requirement 8.3)
    this.workspace.submit(
      {
        type: 'relevant_memory',
        memory: memory,
        event: memory.event,
        emotionalContext: memory.emotionalIntensity,
        timestamp: memory.timestamp,
        age: currentTime - memory.timestamp,
        relevance: relevance
      },
      {
        source: 'MemorySystem',
        type: 'relevant_memory',
        urgency: salience * 0.6, // Memories are moderately urgent
        emotionalIntensity: memory.emotionalIntensity
      }
    );
    
    this.submissionsThisCycle++;
  }

  /**
   * Force submission of a specific memory (for urgent recalls)
   * @param {Object} memory - Memory to submit
   * @param {number} currentTime - Current time
   */
  forceSubmit(memory, currentTime = Date.now()) {
    const salience = Math.max(0.8, memory.importance);
    
    this.workspace.submit(
      {
        type: 'urgent_memory',
        memory: memory,
        event: memory.event,
        emotionalContext: memory.emotionalIntensity,
        timestamp: memory.timestamp,
        age: currentTime - memory.timestamp,
        relevance: 1.0
      },
      {
        source: 'MemorySystem',
        type: 'relevant_memory',
        urgency: salience,
        emotionalIntensity: memory.emotionalIntensity,
        persistent: true
      }
    );
  }

  /**
   * Reset adapter state
   */
  reset() {
    this.submissionsThisCycle = 0;
    this.lastCycleReset = Date.now();
  }
}
