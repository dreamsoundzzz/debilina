/**
 * BeliefSystem implements explicit belief representation and revision
 * Based on belief revision theory and epistemic logic
 * 
 * Features:
 * - Explicit belief database
 * - Belief revision with new evidence
 * - Contradiction detection
 * - Justification tracking
 * - Belief-based reasoning
 */

export class BeliefSystem {
  /**
   * Create a new belief system
   * @param {ConfidenceSystem} confidenceSystem - Confidence system for tracking certainty
   */
  constructor(confidenceSystem = null) {
    this.confidenceSystem = confidenceSystem;
    
    // Belief database: beliefId -> Belief
    this.beliefs = new Map();
    
    // Belief categories
    this.categories = {
      PERCEPTION: 'perception',     // Beliefs from direct observation
      INFERENCE: 'inference',        // Beliefs from reasoning
      MEMORY: 'memory',              // Beliefs from past experience
      COMMUNICATION: 'communication', // Beliefs from being told
      ASSUMPTION: 'assumption'       // Default/assumed beliefs
    };
    
    // Justification graph: beliefId -> [supporting beliefIds]
    this.justifications = new Map();
    
    // Contradictions: pairs of conflicting beliefs
    this.contradictions = [];
    
    // Belief revision history
    this.revisionHistory = [];
    this.maxHistorySize = 50;
    
    // Metrics
    this.totalBeliefs = 0;
    this.revisionsCount = 0;
    this.contradictionsDetected = 0;
    this.contradictionsResolved = 0;
    
    // Next belief ID
    this.nextBeliefId = 0;
  }

  /**
   * Add a new belief
   * @param {Object} config - Belief configuration
   * @param {string} config.content - Belief content/statement
   * @param {string} config.category - Belief category
   * @param {number} config.strength - Initial strength (0-1)
   * @param {Array} config.evidence - Supporting evidence
   * @param {Array} config.justifiedBy - Belief IDs that justify this belief
   * @returns {string} Belief ID
   */
  addBelief(config) {
    // Check if similar belief exists
    const existingId = this.findSimilarBelief(config.content);
    if (existingId) {
      // Update existing belief instead
      return this.reviseBelief(existingId, {
        strength: config.strength,
        evidence: config.evidence,
        justifiedBy: config.justifiedBy
      });
    }
    
    const beliefId = `belief_${this.nextBeliefId++}`;
    
    const belief = {
      id: beliefId,
      content: config.content,
      category: config.category || this.categories.ASSUMPTION,
      strength: Math.max(0, Math.min(1, config.strength || 0.5)),
      
      // Evidence and justification
      evidence: config.evidence || [],
      justifiedBy: config.justifiedBy || [],
      supports: [], // Beliefs this belief supports
      
      // Metadata
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      revisionCount: 0,
      
      // Status
      active: true,
      contradicted: false,
      
      // Context
      context: config.context || {}
    };
    
    this.beliefs.set(beliefId, belief);
    this.totalBeliefs++;
    
    // Update justification graph
    if (belief.justifiedBy.length > 0) {
      this.justifications.set(beliefId, belief.justifiedBy);
      
      // Update supported beliefs
      for (const supportingId of belief.justifiedBy) {
        const supporting = this.beliefs.get(supportingId);
        if (supporting) {
          supporting.supports.push(beliefId);
        }
      }
    }
    
    // Integrate with confidence system
    if (this.confidenceSystem) {
      this.confidenceSystem.addBelief(config.content, belief.strength, belief.evidence);
    }
    
    // Check for contradictions
    this.detectContradictions(beliefId);
    
    return beliefId;
  }

  /**
   * Revise an existing belief
   * @param {string} beliefId - Belief ID
   * @param {Object} revision - Revision data
   * @returns {string} Belief ID
   */
  reviseBelief(beliefId, revision) {
    const belief = this.beliefs.get(beliefId);
    
    if (!belief) {
      console.warn(`BeliefSystem: Belief ${beliefId} not found`);
      return null;
    }
    
    // Record revision
    this.revisionHistory.push({
      beliefId,
      timestamp: Date.now(),
      oldStrength: belief.strength,
      newStrength: revision.strength,
      reason: revision.reason || 'update'
    });
    
    if (this.revisionHistory.length > this.maxHistorySize) {
      this.revisionHistory.shift();
    }
    
    // Update belief
    if (revision.strength !== undefined) {
      belief.strength = Math.max(0, Math.min(1, revision.strength));
    }
    
    if (revision.evidence) {
      belief.evidence.push(...revision.evidence);
    }
    
    if (revision.justifiedBy) {
      belief.justifiedBy.push(...revision.justifiedBy);
      this.justifications.set(beliefId, belief.justifiedBy);
    }
    
    belief.lastUpdated = Date.now();
    belief.revisionCount++;
    
    this.revisionsCount++;
    
    // Update confidence system
    if (this.confidenceSystem) {
      this.confidenceSystem.updateBelief(
        this.confidenceSystem.findBeliefId(belief.content),
        belief.strength,
        revision.evidence || []
      );
    }
    
    // Re-check contradictions
    this.detectContradictions(beliefId);
    
    return beliefId;
  }

  /**
   * Find similar belief by content
   * @param {string} content - Belief content
   * @returns {string|null} Belief ID or null
   */
  findSimilarBelief(content) {
    const normalized = content.toLowerCase().trim();
    
    for (const [id, belief] of this.beliefs.entries()) {
      if (belief.content.toLowerCase().trim() === normalized) {
        return id;
      }
    }
    
    return null;
  }

  /**
   * Detect contradictions with a belief
   * @param {string} beliefId - Belief ID to check
   */
  detectContradictions(beliefId) {
    const belief = this.beliefs.get(beliefId);
    
    if (!belief) {
      return;
    }
    
    // Check against all other active beliefs
    for (const [otherId, other] of this.beliefs.entries()) {
      if (otherId === beliefId || !other.active) {
        continue;
      }
      
      if (this.areContradictory(belief, other)) {
        // Record contradiction
        const contradiction = {
          belief1: beliefId,
          belief2: otherId,
          detected: Date.now(),
          severity: this.getContradictionSeverity(belief, other)
        };
        
        // Check if already recorded
        const exists = this.contradictions.some(c =>
          (c.belief1 === beliefId && c.belief2 === otherId) ||
          (c.belief1 === otherId && c.belief2 === beliefId)
        );
        
        if (!exists) {
          this.contradictions.push(contradiction);
          this.contradictionsDetected++;
          
          // Mark beliefs as contradicted
          belief.contradicted = true;
          other.contradicted = true;
        }
      }
    }
  }

  /**
   * Check if two beliefs are contradictory
   * @param {Object} belief1 - First belief
   * @param {Object} belief2 - Second belief
   * @returns {boolean} True if contradictory
   */
  areContradictory(belief1, belief2) {
    const content1 = belief1.content.toLowerCase();
    const content2 = belief2.content.toLowerCase();
    
    // Check for explicit negation patterns
    const negationPatterns = [
      [/is (.+)/, /is not \1/],
      [/has (.+)/, /has no \1/],
      [/can (.+)/, /cannot \1/],
      [/will (.+)/, /will not \1/],
      [/(.+) is true/, /\1 is false/],
      [/(.+) exists/, /\1 does not exist/]
    ];
    
    for (const [pattern1, pattern2] of negationPatterns) {
      if (pattern1.test(content1) && pattern2.test(content2)) {
        return true;
      }
      if (pattern2.test(content1) && pattern1.test(content2)) {
        return true;
      }
    }
    
    // Check for opposite values
    if (content1.includes('friendly') && content2.includes('hostile')) {
      return true;
    }
    if (content1.includes('safe') && content2.includes('dangerous')) {
      return true;
    }
    
    // Check context for contradictions
    if (belief1.context.contradicts && belief1.context.contradicts.includes(belief2.id)) {
      return true;
    }
    
    return false;
  }

  /**
   * Get contradiction severity
   * @param {Object} belief1 - First belief
   * @param {Object} belief2 - Second belief
   * @returns {number} Severity (0-1)
   */
  getContradictionSeverity(belief1, belief2) {
    // Higher severity if both beliefs are strong
    const strengthProduct = belief1.strength * belief2.strength;
    
    // Higher severity if beliefs are from reliable sources
    const categoryWeights = {
      [this.categories.PERCEPTION]: 1.0,
      [this.categories.MEMORY]: 0.8,
      [this.categories.INFERENCE]: 0.6,
      [this.categories.COMMUNICATION]: 0.5,
      [this.categories.ASSUMPTION]: 0.3
    };
    
    const weight1 = categoryWeights[belief1.category] || 0.5;
    const weight2 = categoryWeights[belief2.category] || 0.5;
    const avgWeight = (weight1 + weight2) / 2;
    
    return strengthProduct * avgWeight;
  }

  /**
   * Resolve contradictions
   */
  resolveContradictions() {
    for (const contradiction of [...this.contradictions]) {
      const belief1 = this.beliefs.get(contradiction.belief1);
      const belief2 = this.beliefs.get(contradiction.belief2);
      
      if (!belief1 || !belief2) {
        continue;
      }
      
      // Resolve by strength and category
      const score1 = this.getBeliefScore(belief1);
      const score2 = this.getBeliefScore(belief2);
      
      if (score1 > score2) {
        // Weaken or deactivate belief2
        this.weakenBelief(belief2.id, 'contradicted by stronger belief');
      } else {
        // Weaken or deactivate belief1
        this.weakenBelief(belief1.id, 'contradicted by stronger belief');
      }
      
      // Remove from contradictions list
      this.contradictions = this.contradictions.filter(c => c !== contradiction);
      this.contradictionsResolved++;
    }
  }

  /**
   * Get belief score for comparison
   * @param {Object} belief - Belief
   * @returns {number} Score
   */
  getBeliefScore(belief) {
    const categoryWeights = {
      [this.categories.PERCEPTION]: 1.0,
      [this.categories.MEMORY]: 0.8,
      [this.categories.INFERENCE]: 0.6,
      [this.categories.COMMUNICATION]: 0.5,
      [this.categories.ASSUMPTION]: 0.3
    };
    
    const categoryWeight = categoryWeights[belief.category] || 0.5;
    const evidenceBonus = Math.min(0.2, belief.evidence.length * 0.05);
    const justificationBonus = Math.min(0.2, belief.justifiedBy.length * 0.05);
    
    return belief.strength * categoryWeight + evidenceBonus + justificationBonus;
  }

  /**
   * Weaken a belief
   * @param {string} beliefId - Belief ID
   * @param {string} reason - Reason for weakening
   */
  weakenBelief(beliefId, reason) {
    const belief = this.beliefs.get(beliefId);
    
    if (!belief) {
      return;
    }
    
    // Reduce strength by 50%
    const newStrength = belief.strength * 0.5;
    
    this.reviseBelief(beliefId, {
      strength: newStrength,
      reason
    });
    
    // Deactivate if too weak
    if (newStrength < 0.2) {
      belief.active = false;
    }
    
    // Update confidence system
    if (this.confidenceSystem) {
      this.confidenceSystem.addContradiction(
        this.confidenceSystem.findBeliefId(belief.content),
        reason
      );
    }
  }

  /**
   * Get beliefs by category
   * @param {string} category - Category name
   * @returns {Array} Beliefs in category
   */
  getBeliefsByCategory(category) {
    return Array.from(this.beliefs.values())
      .filter(b => b.category === category && b.active);
  }

  /**
   * Get strong beliefs (strength > 0.7)
   * @returns {Array} Strong beliefs
   */
  getStrongBeliefs() {
    return Array.from(this.beliefs.values())
      .filter(b => b.strength > 0.7 && b.active);
  }

  /**
   * Get weak beliefs (strength < 0.3)
   * @returns {Array} Weak beliefs
   */
  getWeakBeliefs() {
    return Array.from(this.beliefs.values())
      .filter(b => b.strength < 0.3 && b.active);
  }

  /**
   * Get contradicted beliefs
   * @returns {Array} Contradicted beliefs
   */
  getContradictedBeliefs() {
    return Array.from(this.beliefs.values())
      .filter(b => b.contradicted && b.active);
  }

  /**
   * Get belief by ID
   * @param {string} beliefId - Belief ID
   * @returns {Object|null} Belief or null
   */
  getBelief(beliefId) {
    return this.beliefs.get(beliefId) || null;
  }

  /**
   * Get all active beliefs
   * @returns {Array} Active beliefs
   */
  getActiveBeliefs() {
    return Array.from(this.beliefs.values()).filter(b => b.active);
  }

  /**
   * Get beliefs that support a belief
   * @param {string} beliefId - Belief ID
   * @returns {Array} Supporting beliefs
   */
  getSupportingBeliefs(beliefId) {
    const belief = this.beliefs.get(beliefId);
    
    if (!belief) {
      return [];
    }
    
    return belief.justifiedBy
      .map(id => this.beliefs.get(id))
      .filter(b => b && b.active);
  }

  /**
   * Get beliefs supported by a belief
   * @param {string} beliefId - Belief ID
   * @returns {Array} Supported beliefs
   */
  getSupportedBeliefs(beliefId) {
    const belief = this.beliefs.get(beliefId);
    
    if (!belief) {
      return [];
    }
    
    return belief.supports
      .map(id => this.beliefs.get(id))
      .filter(b => b && b.active);
  }

  /**
   * Get belief justification chain
   * @param {string} beliefId - Belief ID
   * @param {number} maxDepth - Maximum depth (default 5)
   * @returns {Object} Justification tree
   */
  getJustificationChain(beliefId, maxDepth = 5) {
    const belief = this.beliefs.get(beliefId);
    
    if (!belief || maxDepth === 0) {
      return null;
    }
    
    return {
      belief: belief,
      justifiedBy: belief.justifiedBy.map(id =>
        this.getJustificationChain(id, maxDepth - 1)
      ).filter(j => j)
    };
  }

  /**
   * Update belief system
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    // Decay weak beliefs
    for (const belief of this.beliefs.values()) {
      if (!belief.active) {
        continue;
      }
      
      // Decay beliefs without justification
      if (belief.justifiedBy.length === 0 && belief.category === this.categories.ASSUMPTION) {
        belief.strength = Math.max(0, belief.strength - (0.01 * dt));
        
        if (belief.strength < 0.1) {
          belief.active = false;
        }
      }
    }
    
    // Resolve contradictions
    if (this.contradictions.length > 0) {
      this.resolveContradictions();
    }
  }

  /**
   * Get statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    const active = this.getActiveBeliefs();
    
    return {
      totalBeliefs: this.beliefs.size,
      activeBeliefs: active.length,
      strongBeliefs: this.getStrongBeliefs().length,
      weakBeliefs: this.getWeakBeliefs().length,
      contradictedBeliefs: this.getContradictedBeliefs().length,
      contradictions: this.contradictions.length,
      revisionsCount: this.revisionsCount,
      contradictionsDetected: this.contradictionsDetected,
      contradictionsResolved: this.contradictionsResolved,
      byCategory: {
        perception: this.getBeliefsByCategory(this.categories.PERCEPTION).length,
        inference: this.getBeliefsByCategory(this.categories.INFERENCE).length,
        memory: this.getBeliefsByCategory(this.categories.MEMORY).length,
        communication: this.getBeliefsByCategory(this.categories.COMMUNICATION).length,
        assumption: this.getBeliefsByCategory(this.categories.ASSUMPTION).length
      }
    };
  }

  /**
   * Clear all beliefs
   */
  clear() {
    this.beliefs.clear();
    this.justifications.clear();
    this.contradictions = [];
    this.revisionHistory = [];
  }

  /**
   * Reset statistics
   */
  resetStatistics() {
    this.totalBeliefs = 0;
    this.revisionsCount = 0;
    this.contradictionsDetected = 0;
    this.contradictionsResolved = 0;
  }
}
