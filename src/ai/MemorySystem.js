/**
 * MemorySystem manages long-term storage of experiences, interactions, and learned behaviors
 * Stores episodic memories with emotional context and provides relevance-based recall
 * 
 * Requirements:
 * - 6.4: Maintain memory of recent interactions and observations
 * - 17.1: Store significant events with timestamps and emotional context
 * - 17.5: Prioritize memories based on recency, emotional intensity, and relevance
 * - 17.6: Support at least 100 stored memories before pruning oldest low-priority entries
 */
export class MemorySystem {
  /**
   * Create a new memory system
   * Requirement 17.6: Support at least 100 stored memories
   * @param {number} maxMemories - Maximum number of memories to store (default 100)
   */
  constructor(maxMemories = 100) {
    // Requirement 17.1: Episodic memory stores specific events with metadata
    this.episodicMemory = []; // Array of memory objects
    
    // Semantic memory stores general knowledge (not implemented in this task)
    this.semanticMemory = {};
    
    // Procedural memory stores learned behaviors (not implemented in this task)
    this.proceduralMemory = {};
    
    // Requirement 25.6, 25.8: Track weapon danger associations
    this.weaponDanger = {}; // Map of weapon types to danger data
    
    // Requirement 17.6: Maximum memories before pruning
    this.maxMemories = maxMemories;
    
    // Counter for generating unique IDs
    this.nextId = 1;
  }

  /**
   * Add a new episodic memory
   * Requirement 17.1: Store significant events with timestamps and emotional context
   * @param {string} event - Description of the event
   * @param {Object} context - Context information (location, entities involved, etc.)
   * @param {number} emotionalIntensity - Emotional intensity (0.0 to 1.0)
   * @returns {Object} The created memory object
   */
  addEpisode(event, context = {}, emotionalIntensity = 0.5) {
    // Requirement 17.1: Create memory with timestamp and emotional context
    const memory = {
      id: this.generateId(),
      type: 'episodic',
      event,
      context,
      emotionalIntensity,
      timestamp: Date.now(),
      accessCount: 0,
      importance: this.calculateImportance(event, emotionalIntensity)
    };
    
    this.episodicMemory.push(memory);
    
    // Requirement 17.6: Prune if over limit
    if (this.episodicMemory.length > this.maxMemories) {
      this.pruneMemories();
    }
    
    return memory;
  }

  /**
   * Recall memories relevant to a query
   * Requirement 17.5: Prioritize memories based on recency, emotional intensity, and relevance
   * @param {string|Object} query - Query string or object with search parameters
   * @param {number} limit - Maximum number of memories to return (default 5)
   * @returns {Array} Array of relevant memories, sorted by priority
   */
  recall(query, limit = 5) {
    if (this.episodicMemory.length === 0) {
      return [];
    }

    // Requirement 17.5: Score memories by relevance
    const scored = this.episodicMemory.map(mem => ({
      memory: mem,
      score: this.calculateRelevance(mem, query)
    }));

    // Requirement 17.5: Sort by score (relevance) and recency
    // 70% weight on relevance, 30% weight on recency
    const scoreWeight = 0.7;
    const recencyWeight = 0.3;
    
    // Normalize timestamps to 0-1 range for fair comparison
    const now = Date.now();
    const oldestTime = Math.min(...this.episodicMemory.map(m => m.timestamp));
    const timeRange = now - oldestTime || 1; // Avoid division by zero
    
    scored.sort((a, b) => {
      const aRecency = (a.memory.timestamp - oldestTime) / timeRange;
      const bRecency = (b.memory.timestamp - oldestTime) / timeRange;
      
      const aPriority = a.score * scoreWeight + aRecency * recencyWeight;
      const bPriority = b.score * scoreWeight + bRecency * recencyWeight;
      
      return bPriority - aPriority;
    });

    // Update access count for recalled memories
    const recalled = scored.slice(0, limit).map(s => s.memory);
    recalled.forEach(mem => mem.accessCount++);

    return recalled;
  }

  /**
   * Prune low-priority memories to stay within maxMemories limit
   * Requirement 17.6: Prune oldest low-priority entries
   */
  pruneMemories() {
    // Requirement 17.5 & 17.6: Remove low-importance, rarely-accessed memories
    // Priority = importance + (accessCount * 0.1)
    this.episodicMemory.sort((a, b) => {
      const aPriority = a.importance + a.accessCount * 0.1;
      const bPriority = b.importance + b.accessCount * 0.1;
      return bPriority - aPriority;
    });
    
    // Keep only top maxMemories
    this.episodicMemory = this.episodicMemory.slice(0, this.maxMemories);
  }

  /**
   * Calculate importance score for a memory
   * Higher emotional intensity = higher importance
   * @param {string} event - Event description
   * @param {number} emotionalIntensity - Emotional intensity (0.0 to 1.0)
   * @returns {number} Importance score (0.0 to 1.0)
   */
  calculateImportance(event, emotionalIntensity) {
    // Base importance on emotional intensity
    let importance = emotionalIntensity;
    
    // Boost importance for certain keywords (pain, danger, player interaction)
    const highPriorityKeywords = ['pain', 'hurt', 'danger', 'player', 'weapon', 'attack', 'conversation'];
    const eventLower = event.toLowerCase();
    
    for (const keyword of highPriorityKeywords) {
      if (eventLower.includes(keyword)) {
        importance = Math.min(1.0, importance + 0.1);
      }
    }
    
    return importance;
  }

  /**
   * Calculate relevance score between a memory and a query
   * Requirement 17.5: Score memories by relevance
   * @param {Object} memory - Memory object
   * @param {string|Object} query - Query string or object
   * @returns {number} Relevance score (0.0 to 1.0)
   */
  calculateRelevance(memory, query) {
    // Handle different query types
    let queryString = '';
    let queryContext = {};
    
    if (typeof query === 'string') {
      queryString = query.toLowerCase();
    } else if (typeof query === 'object') {
      queryString = (query.text || '').toLowerCase();
      queryContext = query.context || {};
    }
    
    let relevance = 0.0;
    
    // Text matching in event description
    if (queryString) {
      const eventLower = memory.event.toLowerCase();
      const queryWords = queryString.split(/\s+/).filter(w => w.length > 2);
      
      for (const word of queryWords) {
        if (eventLower.includes(word)) {
          relevance += 0.3;
        }
      }
    }
    
    // Context matching (if query includes context)
    if (Object.keys(queryContext).length > 0) {
      for (const [key, value] of Object.entries(queryContext)) {
        if (memory.context[key] === value) {
          relevance += 0.2;
        }
      }
    }
    
    // Boost relevance for high emotional intensity memories
    relevance += memory.emotionalIntensity * 0.3;
    
    // Boost relevance for frequently accessed memories
    relevance += Math.min(0.2, memory.accessCount * 0.02);
    
    // Clamp to [0, 1]
    return Math.min(1.0, relevance);
  }

  /**
   * Generate a unique ID for a memory
   * @returns {string} Unique memory ID
   */
  generateId() {
    return `mem_${this.nextId++}_${Date.now()}`;
  }

  /**
   * Get all episodic memories
   * @returns {Array} Array of all episodic memories
   */
  getAllMemories() {
    return [...this.episodicMemory];
  }

  /**
   * Get memory count
   * @returns {number} Number of stored memories
   */
  getMemoryCount() {
    return this.episodicMemory.length;
  }

  /**
   * Clear all memories
   */
  clear() {
    this.episodicMemory = [];
    this.semanticMemory = {};
    this.proceduralMemory = {};
    this.weaponDanger = {}; // Requirement 25.6: Clear weapon danger associations
    this.nextId = 1;
  }

  /**
   * Get recent memories (most recent N memories)
   * Requirement 6.4: Maintain memory of recent interactions
   * @param {number} count - Number of recent memories to retrieve
   * @returns {Array} Array of recent memories, newest first
   */
  getRecentMemories(count = 5) {
    return [...this.episodicMemory]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, count);
  }

  /**
   * Persist memories to localStorage
   * Requirement 17.3: Persist memories across game sessions
   */
  persist() {
    try {
      const data = {
        episodic: this.episodicMemory,
        semantic: this.semanticMemory,
        procedural: this.proceduralMemory,
        weaponDanger: this.weaponDanger, // Requirement 25.6: Persist weapon danger associations
        nextId: this.nextId
      };
      localStorage.setItem('npc_memory', JSON.stringify(data));
    } catch (error) {
      console.error('MemorySystem: Failed to persist memories', error);
    }
  }

  /**
   * Load memories from localStorage
   * Requirement 17.3: Persist memories across game sessions
   */
  load() {
    try {
      const data = localStorage.getItem('npc_memory');
      if (data) {
        const parsed = JSON.parse(data);
        this.episodicMemory = parsed.episodic || [];
        this.semanticMemory = parsed.semantic || {};
        this.proceduralMemory = parsed.procedural || {};
        this.weaponDanger = parsed.weaponDanger || {}; // Requirement 25.6: Load weapon danger associations
        this.nextId = parsed.nextId || 1;
      }
    } catch (error) {
      console.error('MemorySystem: Failed to load memories', error);
      // Reset to empty state on error
      this.clear();
    }
  }
  
  /**
   * Record weapon danger association
   * Requirement 25.6: Record weapon type and associate it with danger when injured
   * @param {string} weaponType - Type of weapon that caused pain
   * @param {number} intensity - Pain intensity (0.0 to 1.0)
   */
  recordWeaponDanger(weaponType, intensity) {
    if (!this.weaponDanger[weaponType]) {
      this.weaponDanger[weaponType] = {
        encounters: 0,
        totalPain: 0,
        lastEncounter: 0,
        dangerLevel: 0
      };
    }
    
    const weapon = this.weaponDanger[weaponType];
    weapon.encounters++;
    weapon.totalPain += intensity;
    weapon.lastEncounter = Date.now();
    
    // Calculate danger level (0-1 scale)
    // Based on average pain and number of encounters
    const avgPain = weapon.totalPain / weapon.encounters;
    const encounterFactor = Math.min(1.0, weapon.encounters / 3); // Max out at 3 encounters
    weapon.dangerLevel = Math.min(1.0, avgPain * 0.7 + encounterFactor * 0.3);
  }
  
  /**
   * Get dangerous weapons based on learned associations
   * Requirement 25.8: Exhibit learned behavior avoiding weapons that previously caused pain
   * @param {number} minDangerLevel - Minimum danger level to include (default: 0.3)
   * @returns {Array} Array of dangerous weapon objects sorted by danger level
   */
  getDangerousWeapons(minDangerLevel = 0.3) {
    const dangerous = [];
    
    for (const [weaponType, data] of Object.entries(this.weaponDanger)) {
      if (data.dangerLevel >= minDangerLevel) {
        dangerous.push({
          weaponType,
          dangerLevel: data.dangerLevel,
          encounters: data.encounters,
          avgPain: data.totalPain / data.encounters,
          lastEncounter: data.lastEncounter
        });
      }
    }
    
    // Sort by danger level (highest first)
    dangerous.sort((a, b) => b.dangerLevel - a.dangerLevel);
    
    return dangerous;
  }
  
  /**
   * Check if a weapon type is known to be dangerous
   * Requirement 25.8: Identify weapons that previously caused pain
   * @param {string} weaponType - Type of weapon to check
   * @returns {Object|null} Weapon danger data or null if not dangerous
   */
  isWeaponDangerous(weaponType) {
    const weapon = this.weaponDanger[weaponType];
    if (!weapon || weapon.dangerLevel < 0.3) {
      return null;
    }
    
    return {
      weaponType,
      dangerLevel: weapon.dangerLevel,
      encounters: weapon.encounters,
      avgPain: weapon.totalPain / weapon.encounters,
      timeSinceLastEncounter: Date.now() - weapon.lastEncounter
    };
  }
  
  /**
   * Get weapon-related memories
   * Requirement 25.6: Recall weapon-danger associations
   * @param {string} weaponType - Optional weapon type to filter by
   * @returns {Array} Array of weapon-related memories
   */
  getWeaponMemories(weaponType = null) {
    return this.episodicMemory.filter(mem => {
      const hasWeapon = mem.context && mem.context.weaponType;
      if (!hasWeapon) return false;
      
      if (weaponType) {
        return mem.context.weaponType === weaponType;
      }
      
      return true;
    });
  }
}
