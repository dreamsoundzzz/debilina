/**
 * ConfidenceSystem tracks uncertainty and confidence in beliefs
 * Enables meta-cognitive "I might be wrong" capability
 * 
 * Features:
 * - Belief confidence tracking
 * - Uncertainty quantification
 * - Confidence decay over time
 * - Confidence-based decision making
 */

export class ConfidenceSystem {
  /**
   * Create a new confidence system
   */
  constructor() {
    // Belief confidence map: beliefId -> {belief, confidence, timestamp, evidence}
    this.beliefs = new Map();
    
    // Confidence decay rate (per second)
    this.decayRate = 0.01; // 1% per second
    
    // Confidence thresholds
    this.highConfidence = 0.8;
    this.mediumConfidence = 0.5;
    this.lowConfidence = 0.3;
    
    // Uncertainty tracking
    this.uncertaintyLevel = 0.5; // Overall uncertainty (0 = certain, 1 = very uncertain)
    
    // Metrics
    this.totalBeliefs = 0;
    this.confidenceHistory = [];
    this.maxHistorySize = 100;
    
    // Next belief ID
    this.nextBeliefId = 0;
  }

  /**
   * Add or update a belief with confidence
   * @param {string} belief - Belief statement
   * @param {number} confidence - Initial confidence (0-1)
   * @param {Array} evidence - Supporting evidence
   * @returns {string} Belief ID
   */
  addBelief(belief, confidence = 0.5, evidence = []) {
    // Check if belief already exists
    const existingId = this.findBeliefId(belief);
    
    if (existingId) {
      return this.updateBelief(existingId, confidence, evidence);
    }
    
    // Create new belief
    const beliefId = `belief_${this.nextBeliefId++}`;
    
    this.beliefs.set(beliefId, {
      id: beliefId,
      belief,
      confidence: Math.max(0, Math.min(1, confidence)),
      timestamp: Date.now(),
      lastUpdate: Date.now(),
      evidence: [...evidence],
      contradictions: 0,
      confirmations: 0
    });
    
    this.totalBeliefs++;
    this.recordConfidence(confidence);
    
    return beliefId;
  }

  /**
   * Update existing belief confidence
   * @param {string} beliefId - Belief ID
   * @param {number} newConfidence - New confidence value
   * @param {Array} additionalEvidence - Additional evidence
   * @returns {string} Belief ID
   */
  updateBelief(beliefId, newConfidence, additionalEvidence = []) {
    const belief = this.beliefs.get(beliefId);
    
    if (!belief) {
      console.warn(`ConfidenceSystem: Belief ${beliefId} not found`);
      return null;
    }
    
    // Update confidence (weighted average with existing)
    const weight = 0.7; // Weight new evidence more
    belief.confidence = (newConfidence * weight) + (belief.confidence * (1 - weight));
    belief.confidence = Math.max(0, Math.min(1, belief.confidence));
    
    // Add evidence
    belief.evidence.push(...additionalEvidence);
    belief.lastUpdate = Date.now();
    
    // Track confirmation
    if (newConfidence > belief.confidence) {
      belief.confirmations++;
    }
    
    this.recordConfidence(belief.confidence);
    
    return beliefId;
  }

  /**
   * Find belief ID by belief text
   * @param {string} beliefText - Belief statement
   * @returns {string|null} Belief ID or null
   */
  findBeliefId(beliefText) {
    for (const [id, belief] of this.beliefs.entries()) {
      if (belief.belief.toLowerCase() === beliefText.toLowerCase()) {
        return id;
      }
    }
    return null;
  }

  /**
   * Register a contradiction to a belief
   * @param {string} beliefId - Belief ID
   * @param {string} contradiction - Contradicting evidence
   */
  addContradiction(beliefId, contradiction) {
    const belief = this.beliefs.get(beliefId);
    
    if (!belief) {
      return;
    }
    
    belief.contradictions++;
    belief.confidence = Math.max(0, belief.confidence - 0.2);
    belief.evidence.push({ type: 'contradiction', text: contradiction });
    belief.lastUpdate = Date.now();
    
    this.recordConfidence(belief.confidence);
  }

  /**
   * Get confidence for a belief
   * @param {string} beliefId - Belief ID
   * @returns {number} Confidence value (0-1)
   */
  getConfidence(beliefId) {
    const belief = this.beliefs.get(beliefId);
    return belief ? belief.confidence : 0;
  }

  /**
   * Get belief by ID
   * @param {string} beliefId - Belief ID
   * @returns {Object|null} Belief object
   */
  getBelief(beliefId) {
    return this.beliefs.get(beliefId);
  }

  /**
   * Get all beliefs
   * @returns {Array} Array of beliefs
   */
  getAllBeliefs() {
    return Array.from(this.beliefs.values());
  }

  /**
   * Get beliefs by confidence level
   * @param {string} level - 'high', 'medium', or 'low'
   * @returns {Array} Filtered beliefs
   */
  getBeliefsByConfidence(level) {
    const beliefs = this.getAllBeliefs();
    
    switch (level) {
      case 'high':
        return beliefs.filter(b => b.confidence >= this.highConfidence);
      case 'medium':
        return beliefs.filter(b => b.confidence >= this.mediumConfidence && b.confidence < this.highConfidence);
      case 'low':
        return beliefs.filter(b => b.confidence < this.mediumConfidence);
      default:
        return beliefs;
    }
  }

  /**
   * Get uncertain beliefs (low confidence)
   * @returns {Array} Uncertain beliefs
   */
  getUncertainBeliefs() {
    return this.getAllBeliefs().filter(b => b.confidence < this.lowConfidence);
  }

  /**
   * Check if should express uncertainty
   * @param {string} beliefId - Belief ID
   * @returns {boolean} True if should express uncertainty
   */
  shouldExpressUncertainty(beliefId) {
    const belief = this.beliefs.get(beliefId);
    
    if (!belief) {
      return true; // Unknown belief = uncertain
    }
    
    return belief.confidence < this.mediumConfidence;
  }

  /**
   * Get uncertainty phrase for belief
   * @param {string} beliefId - Belief ID
   * @returns {string} Uncertainty phrase
   */
  getUncertaintyPhrase(beliefId) {
    const confidence = this.getConfidence(beliefId);
    
    if (confidence >= this.highConfidence) {
      return "I'm quite certain";
    } else if (confidence >= this.mediumConfidence) {
      return "I think";
    } else if (confidence >= this.lowConfidence) {
      return "I'm not sure, but";
    } else {
      return "I might be wrong, but";
    }
  }

  /**
   * Update confidence system (apply decay)
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    const decayAmount = this.decayRate * dt;
    
    for (const belief of this.beliefs.values()) {
      // Decay confidence over time
      belief.confidence = Math.max(0, belief.confidence - decayAmount);
      
      // Remove very low confidence beliefs
      if (belief.confidence < 0.1) {
        this.beliefs.delete(belief.id);
      }
    }
    
    // Update overall uncertainty level
    this.updateUncertaintyLevel();
  }

  /**
   * Update overall uncertainty level
   */
  updateUncertaintyLevel() {
    const beliefs = this.getAllBeliefs();
    
    if (beliefs.length === 0) {
      this.uncertaintyLevel = 0.5;
      return;
    }
    
    // Calculate average confidence
    const avgConfidence = beliefs.reduce((sum, b) => sum + b.confidence, 0) / beliefs.length;
    
    // Uncertainty is inverse of confidence
    this.uncertaintyLevel = 1 - avgConfidence;
  }

  /**
   * Get overall uncertainty level
   * @returns {number} Uncertainty (0-1)
   */
  getUncertaintyLevel() {
    return this.uncertaintyLevel;
  }

  /**
   * Check if overall uncertainty is high
   * @returns {boolean} True if high uncertainty
   */
  isHighlyUncertain() {
    return this.uncertaintyLevel > 0.7;
  }

  /**
   * Record confidence value for history
   * @param {number} confidence - Confidence value
   */
  recordConfidence(confidence) {
    this.confidenceHistory.push({
      confidence,
      timestamp: Date.now()
    });
    
    if (this.confidenceHistory.length > this.maxHistorySize) {
      this.confidenceHistory.shift();
    }
  }

  /**
   * Get confidence statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    const beliefs = this.getAllBeliefs();
    
    if (beliefs.length === 0) {
      return {
        totalBeliefs: 0,
        averageConfidence: 0,
        highConfidenceCount: 0,
        lowConfidenceCount: 0,
        uncertaintyLevel: this.uncertaintyLevel
      };
    }
    
    const avgConfidence = beliefs.reduce((sum, b) => sum + b.confidence, 0) / beliefs.length;
    const highCount = beliefs.filter(b => b.confidence >= this.highConfidence).length;
    const lowCount = beliefs.filter(b => b.confidence < this.lowConfidence).length;
    
    return {
      totalBeliefs: beliefs.length,
      averageConfidence: avgConfidence,
      highConfidenceCount: highCount,
      lowConfidenceCount: lowCount,
      uncertaintyLevel: this.uncertaintyLevel
    };
  }

  /**
   * Get confidence description for context
   * @returns {string} Human-readable description
   */
  getConfidenceDescription() {
    const stats = this.getStatistics();
    
    if (stats.totalBeliefs === 0) {
      return "I don't have strong beliefs about anything right now";
    }
    
    const parts = [];
    
    if (stats.uncertaintyLevel > 0.7) {
      parts.push("I'm quite uncertain about many things");
    } else if (stats.uncertaintyLevel > 0.5) {
      parts.push("I have some uncertainty");
    } else {
      parts.push("I'm fairly confident in my understanding");
    }
    
    if (stats.lowConfidenceCount > 0) {
      parts.push(`${stats.lowConfidenceCount} beliefs I'm unsure about`);
    }
    
    return parts.join(', ');
  }

  /**
   * Reset confidence system
   */
  reset() {
    this.beliefs.clear();
    this.uncertaintyLevel = 0.5;
    this.confidenceHistory = [];
    this.totalBeliefs = 0;
    this.nextBeliefId = 0;
  }
}
