/**
 * MetacognitiveObserver implements self-awareness and thought analysis
 * Monitors the NPC's thinking process and generates meta-thoughts
 * Detects patterns, evaluates thought quality, and provides self-reflection
 * 
 * Requirements:
 * - 18.9: Allow AI to observe its own thought process in real-time
 * - 18.10: Evaluate quality and coherence of generated thoughts
 * - 29.1: Run in parallel with ReasoningLoop, analyzing each thought
 * - 29.2: Evaluate clarity, relevance, emotional tone, logical consistency
 * - 29.3: Generate meta-commentary about thinking process
 * - 29.6: Detect repetitive thought patterns and generate self-correction
 */
export class MetacognitiveObserver {
  /**
   * Create a new metacognitive observer
   * @param {Object} npc - NPC character with AI systems
   */
  constructor(npc) {
    this.npc = npc;
    
    // Track thought history for pattern detection
    // Requirement 29.1: Analyze each generated thought
    this.thoughtHistory = [];
    this.maxHistorySize = 20; // Keep last 20 thoughts
    
    // Track detected patterns
    this.patterns = [];
    
    // Track last meta-thought time to avoid spam
    this.lastMetaThoughtTime = 0;
    this.metaThoughtCooldown = 5000; // 5 seconds between meta-thoughts
    
    // Probability of generating meta-thought (30%)
    this.metaThoughtProbability = 0.3;
    
    // Pattern detection thresholds
    this.repetitionThreshold = 3; // Number of similar thoughts to trigger pattern detection
    this.similarityThreshold = 0.6; // Similarity score threshold (0-1)
  }

  /**
   * Observe and analyze a thought
   * Requirement 29.1: Run in parallel with ReasoningLoop
   * Requirement 29.2: Evaluate clarity, relevance, emotional tone, logical consistency
   * @param {string} thought - The thought to analyze
   */
  observe(thought) {
    if (!thought || thought.trim().length === 0) {
      return;
    }

    // Requirement 29.2: Analyze thought quality
    const analysis = this.analyzeThought(thought);
    
    // Store in history
    this.addToHistory(thought, analysis);
    
    // Requirement 29.6: Detect repetitive patterns
    if (this.isRepetitive(thought)) {
      this.generateSelfCorrectionMetaThought();
      return;
    }
    
    // Requirement 29.3: Generate meta-commentary (with probability and cooldown)
    const currentTime = Date.now();
    if (
      Math.random() < this.metaThoughtProbability &&
      currentTime - this.lastMetaThoughtTime > this.metaThoughtCooldown
    ) {
      this.generateMetaThought(thought, analysis);
      this.lastMetaThoughtTime = currentTime;
    }
  }

  /**
   * Analyze thought for quality metrics
   * Requirement 29.2: Evaluate clarity, relevance, emotional tone, logical consistency
   * @param {string} thought - The thought to analyze
   * @returns {Object} Analysis results
   */
  analyzeThought(thought) {
    const analysis = {
      clarity: this.assessClarity(thought),
      relevance: this.assessRelevance(thought),
      emotionalTone: this.detectEmotionalTone(thought),
      coherence: this.checkCoherence(thought),
      timestamp: Date.now()
    };
    
    return analysis;
  }

  /**
   * Assess clarity of thought (0-1 score)
   * Higher score = more clear and understandable
   * @param {string} thought - The thought to assess
   * @returns {number} Clarity score (0-1)
   */
  assessClarity(thought) {
    let score = 0.5; // Start neutral
    
    // Clear thoughts are not too short or too long
    const wordCount = thought.split(/\s+/).length;
    if (wordCount >= 5 && wordCount <= 50) {
      score += 0.2;
    } else if (wordCount < 3 || wordCount > 100) {
      score -= 0.2;
    }
    
    // Clear thoughts have proper sentence structure
    if (thought.includes('.') || thought.includes('?') || thought.includes('!')) {
      score += 0.1;
    }
    
    // Unclear thoughts have excessive repetition of words
    const words = thought.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    const repetitionRatio = uniqueWords.size / words.length;
    if (repetitionRatio < 0.5) {
      score -= 0.2; // Too repetitive
    }
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Assess relevance of thought to current context
   * @param {string} thought - The thought to assess
   * @returns {number} Relevance score (0-1)
   */
  assessRelevance(thought) {
    let score = 0.5; // Start neutral
    
    const lowerThought = thought.toLowerCase();
    
    // Check if thought relates to current needs
    if (this.npc.needs) {
      const needs = this.npc.needs.getNeeds();
      if (needs.hunger < 50 && (lowerThought.includes('hungry') || lowerThought.includes('food') || lowerThought.includes('eat'))) {
        score += 0.2;
      }
      if (needs.thirst < 50 && (lowerThought.includes('thirsty') || lowerThought.includes('water') || lowerThought.includes('drink'))) {
        score += 0.2;
      }
      if (needs.energy < 50 && (lowerThought.includes('tired') || lowerThought.includes('rest') || lowerThought.includes('sleep'))) {
        score += 0.2;
      }
    }
    
    // Check if thought relates to pain
    if (this.npc.painSensor && this.npc.painSensor.currentPain > 30) {
      if (lowerThought.includes('hurt') || lowerThought.includes('pain') || lowerThought.includes('ouch')) {
        score += 0.2;
      }
    }
    
    // Check if thought relates to visible objects
    if (this.npc.vision) {
      const visibleEntities = this.npc.vision.getVisibleEntities();
      if (visibleEntities.length > 0) {
        for (const entity of visibleEntities) {
          const entityName = entity.type || entity.name || '';
          if (lowerThought.includes(entityName.toLowerCase())) {
            score += 0.1;
            break;
          }
        }
      }
    }
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Detect emotional tone in thought
   * @param {string} thought - The thought to analyze
   * @returns {string} Detected emotional tone
   */
  detectEmotionalTone(thought) {
    const lowerThought = thought.toLowerCase();
    
    // Positive emotions
    if (lowerThought.match(/happy|joy|glad|excited|wonderful|great|good|love/)) {
      return 'positive';
    }
    
    // Negative emotions
    if (lowerThought.match(/sad|unhappy|depressed|miserable|terrible|awful|bad|hate/)) {
      return 'negative';
    }
    
    // Fear/anxiety
    if (lowerThought.match(/afraid|scared|fear|anxious|worried|nervous|panic/)) {
      return 'fearful';
    }
    
    // Anger
    if (lowerThought.match(/angry|mad|furious|annoyed|irritated|frustrated/)) {
      return 'angry';
    }
    
    // Curiosity
    if (lowerThought.match(/wonder|curious|interesting|what|why|how|question/)) {
      return 'curious';
    }
    
    // Confusion
    if (lowerThought.match(/confused|don't understand|unclear|puzzled|strange/)) {
      return 'confused';
    }
    
    return 'neutral';
  }

  /**
   * Check coherence of thought (logical consistency)
   * @param {string} thought - The thought to check
   * @returns {number} Coherence score (0-1)
   */
  checkCoherence(thought) {
    let score = 0.7; // Start with assumption of coherence
    
    // Incoherent thoughts often have contradictions
    const lowerThought = thought.toLowerCase();
    
    // Check for obvious contradictions
    if (
      (lowerThought.includes('happy') && lowerThought.includes('sad')) ||
      (lowerThought.includes('want') && lowerThought.includes("don't want")) ||
      (lowerThought.includes('yes') && lowerThought.includes('no'))
    ) {
      score -= 0.3;
    }
    
    // Check for incomplete thoughts (trailing off)
    if (thought.endsWith('...') || thought.endsWith('..')) {
      score -= 0.1;
    }
    
    // Check for excessive fragmentation
    const sentences = thought.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length > 5) {
      score -= 0.1; // Too fragmented
    }
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Add thought to history
   * @param {string} thought - The thought to add
   * @param {Object} analysis - Analysis results
   */
  addToHistory(thought, analysis) {
    this.thoughtHistory.push({
      thought,
      analysis,
      timestamp: Date.now()
    });
    
    // Maintain max history size
    if (this.thoughtHistory.length > this.maxHistorySize) {
      this.thoughtHistory.shift();
    }
  }

  /**
   * Check if thought is repetitive
   * Requirement 29.6: Detect repetitive thought patterns
   * @param {string} thought - The thought to check
   * @returns {boolean} True if repetitive
   */
  isRepetitive(thought) {
    if (this.thoughtHistory.length < this.repetitionThreshold) {
      return false;
    }
    
    // Get recent thoughts (last 5)
    const recentThoughts = this.thoughtHistory.slice(-5).map(entry => entry.thought);
    
    // Count similar thoughts
    let similarCount = 0;
    for (const recentThought of recentThoughts) {
      if (this.calculateSimilarity(thought, recentThought) > this.similarityThreshold) {
        similarCount++;
      }
    }
    
    // If 3 or more recent thoughts are similar, it's repetitive
    return similarCount >= this.repetitionThreshold;
  }

  /**
   * Calculate similarity between two thoughts (0-1)
   * @param {string} thought1 - First thought
   * @param {string} thought2 - Second thought
   * @returns {number} Similarity score (0-1)
   */
  calculateSimilarity(thought1, thought2) {
    // Simple word-based similarity
    const words1 = new Set(thought1.toLowerCase().split(/\s+/));
    const words2 = new Set(thought2.toLowerCase().split(/\s+/));
    
    // Calculate Jaccard similarity
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    if (union.size === 0) return 0;
    
    return intersection.size / union.size;
  }

  /**
   * Generate self-correction meta-thought for repetitive patterns
   * Requirement 29.6: Generate self-correction for repetitive patterns
   */
  generateSelfCorrectionMetaThought() {
    const metaThoughts = [
      "I notice I'm thinking in circles. Let me try a different approach.",
      "I keep coming back to the same thought. Maybe I should focus on something else.",
      "I'm repeating myself. What else should I consider?",
      "This thought pattern isn't helping. Let me think differently.",
      "I'm stuck on this idea. Time to shift my perspective."
    ];
    
    const metaThought = metaThoughts[Math.floor(Math.random() * metaThoughts.length)];
    
    // Send to internal monologue if available
    if (this.npc.internalMonologue) {
      this.npc.internalMonologue.addMetaThought(metaThought);
    }
    
    // Requirement 30.10: Display abbreviated meta-thought in bubble above NPC
    if (this.npc.showThoughtBubble) {
      // Abbreviate if needed
      const abbreviatedThought = metaThought.length > 60 ? 
        metaThought.substring(0, 57) + '...' : metaThought;
      this.npc.showThoughtBubble(abbreviatedThought, 'meta-thought');
    }
    
    // Store in memory with linked context
    if (this.npc.memory) {
      const memoryContext = {
        type: 'meta-thought',
        trigger: 'repetition_detection',
        thoughtType: 'metacognition',
        pattern: 'repetitive',
        observations: (this.npc.vision && this.npc.vision.getVisibleEntities) ? 
          this.npc.vision.getVisibleEntities().map(e => e.type || e.name || 'unknown') : [],
        recentThoughts: this.thoughtHistory.slice(-3).map(entry => entry.thought)
      };
      
      this.npc.memory.addEpisode(
        `Meta-thought: ${metaThought}`,
        memoryContext,
        0.4
      );
    }
  }

  /**
   * Generate meta-thought about thinking process
   * Requirement 29.3: Generate meta-commentary about thinking
   * @param {string} thought - The original thought
   * @param {Object} analysis - Analysis results
   */
  generateMetaThought(thought, analysis) {
    const metaThought = this.selectMetaThought(thought, analysis);
    
    if (!metaThought) return;
    
    // Send to internal monologue if available
    if (this.npc.internalMonologue) {
      this.npc.internalMonologue.addMetaThought(metaThought);
    }
    
    // Requirement 30.10: Display abbreviated meta-thought in bubble above NPC
    if (this.npc.showThoughtBubble) {
      // Abbreviate if needed
      const abbreviatedThought = metaThought.length > 60 ? 
        metaThought.substring(0, 57) + '...' : metaThought;
      this.npc.showThoughtBubble(abbreviatedThought, 'meta-thought');
    }
    
    // Store in memory with linked context
    if (this.npc.memory) {
      const memoryContext = {
        type: 'meta-thought',
        thoughtType: 'metacognition',
        originalThought: thought,
        analysis,
        observations: (this.npc.vision && this.npc.vision.getVisibleEntities) ? 
          this.npc.vision.getVisibleEntities().map(e => e.type || e.name || 'unknown') : [],
        emotionalState: (this.npc.emotions && this.npc.emotions.getEmotionalStateDescription) ? 
          this.npc.emotions.getEmotionalStateDescription() : 'neutral',
        needs: (this.npc.needs && this.npc.needs.getNeeds) ? 
          this.npc.needs.getNeeds() : { hunger: 100, thirst: 100, energy: 100 }
      };
      
      this.npc.memory.addEpisode(
        `Meta-thought: ${metaThought}`,
        memoryContext,
        0.4
      );
    }
  }

  /**
   * Select appropriate meta-thought based on analysis
   * @param {string} thought - The original thought
   * @param {Object} analysis - Analysis results
   * @returns {string} Meta-thought
   */
  selectMetaThought(thought, analysis) {
    const templates = [];
    
    // Meta-thoughts about clarity
    if (analysis.clarity < 0.4) {
      templates.push("That thought seems unclear to me.");
      templates.push("I'm not sure what I meant by that.");
    } else if (analysis.clarity > 0.7) {
      templates.push("That's a clear thought.");
    }
    
    // Meta-thoughts about relevance
    if (analysis.relevance > 0.7) {
      templates.push("I'm focused on what matters right now.");
      templates.push("This is relevant to my current situation.");
    } else if (analysis.relevance < 0.4) {
      templates.push("Why am I thinking about this?");
      templates.push("This doesn't seem relevant right now.");
    }
    
    // Meta-thoughts about emotional tone
    if (analysis.emotionalTone === 'fearful') {
      templates.push("I notice I'm feeling afraid.");
      templates.push("I'm aware of my fear.");
    } else if (analysis.emotionalTone === 'angry') {
      templates.push("I notice I'm feeling angry.");
      templates.push("I'm aware of my frustration.");
    } else if (analysis.emotionalTone === 'curious') {
      templates.push("I'm curious about this.");
      templates.push("I wonder about this...");
    } else if (analysis.emotionalTone === 'confused') {
      templates.push("I'm feeling confused.");
      templates.push("I don't fully understand this.");
    }
    
    // Meta-thoughts about coherence
    if (analysis.coherence < 0.5) {
      templates.push("That thought doesn't quite make sense.");
      templates.push("I'm thinking in a confused way.");
    }
    
    // General awareness meta-thoughts
    templates.push("I'm thinking about " + this.extractTopic(thought) + "...");
    templates.push("I'm aware that I'm thinking.");
    templates.push("I notice my thoughts flowing.");
    
    // Select random template
    if (templates.length === 0) return null;
    
    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Extract main topic from thought
   * @param {string} thought - The thought to analyze
   * @returns {string} Main topic
   */
  extractTopic(thought) {
    const lowerThought = thought.toLowerCase();
    
    // Check for common topics
    if (lowerThought.includes('food') || lowerThought.includes('hungry') || lowerThought.includes('eat')) {
      return 'food';
    }
    if (lowerThought.includes('water') || lowerThought.includes('thirsty') || lowerThought.includes('drink')) {
      return 'water';
    }
    if (lowerThought.includes('pain') || lowerThought.includes('hurt')) {
      return 'pain';
    }
    if (lowerThought.includes('tired') || lowerThought.includes('sleep') || lowerThought.includes('rest')) {
      return 'rest';
    }
    
    // Extract first significant noun (simple heuristic)
    const words = thought.split(/\s+/);
    for (const word of words) {
      if (word.length > 4 && !['that', 'this', 'what', 'when', 'where', 'which'].includes(word.toLowerCase())) {
        return word.toLowerCase();
      }
    }
    
    return 'this';
  }

  /**
   * Get thought history
   * @returns {Array} Thought history
   */
  getThoughtHistory() {
    return this.thoughtHistory;
  }

  /**
   * Get detected patterns
   * @returns {Array} Detected patterns
   */
  getPatterns() {
    return this.patterns;
  }

  /**
   * Clear thought history
   */
  clearHistory() {
    this.thoughtHistory = [];
    this.patterns = [];
  }

  /**
   * Set meta-thought probability
   * @param {number} probability - Probability (0-1)
   */
  setMetaThoughtProbability(probability) {
    this.metaThoughtProbability = Math.max(0, Math.min(1, probability));
  }

  /**
   * Set meta-thought cooldown
   * @param {number} cooldown - Cooldown in milliseconds
   */
  setMetaThoughtCooldown(cooldown) {
    this.metaThoughtCooldown = Math.max(0, cooldown);
  }
}
