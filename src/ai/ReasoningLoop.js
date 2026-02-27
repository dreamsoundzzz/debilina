/**
 * ReasoningLoop implements continuous cognitive processing for NPCs
 * Generates thoughts based on observations, emotions, needs, and memories
 * Runs continuously in the background to create stream of consciousness
 * 
 * Requirements:
 * - 18.1: Run continuously in background, generating thoughts without external stimuli
 * - 18.2: Process observations, memories, emotions, and needs to generate internal monologue
 * - 18.3: Use streaming for real-time reflection
 * - 18.4: Update at least once every 3 seconds during active gameplay
 */
export class ReasoningLoop {
  /**
   * Create a new reasoning loop
   * @param {Object} npc - NPC character with AI systems
   * @param {Object} ollamaService - OllamaService instance for thought generation
   */
  constructor(npc, ollamaService) {
    this.npc = npc;
    this.ollama = ollamaService;
    
    // Requirement 18.4: Update at least once every 3 seconds
    this.updateInterval = 3000; // 3 seconds in milliseconds
    this.lastUpdate = 0;
    
    // Current thought being generated
    this.currentThought = '';
    
    // Queue of thoughts waiting to be processed
    this.thoughtQueue = [];
    
    // Flag to track if currently generating a thought
    this.isGenerating = false;
  }

  /**
   * Update the reasoning loop
   * Requirement 18.1: Run continuously in background
   * Requirement 18.4: Update at least once every 3 seconds
   * @param {number} currentTime - Current time in milliseconds
   */
  async update(currentTime) {
    // Check if enough time has passed since last update
    if (currentTime - this.lastUpdate < this.updateInterval) {
      return;
    }
    
    // Don't start a new thought if already generating one
    if (this.isGenerating) {
      return;
    }
    
    this.lastUpdate = currentTime;
    this.isGenerating = true;
    
    try {
      // Requirement 18.2: Build context from current state
      const context = this.buildContext();
      
      // Build reasoning prompt
      const prompt = this.buildReasoningPrompt(context);
      
      // Requirement 18.3: Generate thought with streaming
      await this.generateThought(prompt, context);
    } catch (error) {
      console.error('ReasoningLoop: Error generating thought', error);
    } finally {
      this.isGenerating = false;
    }
  }

  /**
   * Build context from NPC's current state
   * Requirement 18.2: Process observations, memories, emotions, and needs
   * @returns {Object} Context object with all relevant information
   */
  buildContext() {
    const context = {};
    
    // Confidence and uncertainty (Phase 1.3)
    if (this.npc.confidence) {
      context.uncertaintyLevel = this.npc.confidence.getUncertaintyLevel();
      context.uncertainBeliefs = this.npc.confidence.getUncertainBeliefs();
      context.confidenceDescription = this.npc.confidence.getConfidenceDescription();
    }
    
    // Goals (Phase 1.4)
    if (this.npc.goals) {
      const activeGoals = this.npc.goals.getActiveGoals();
      context.activeGoals = activeGoals.map(g => ({
        name: g.name,
        level: g.level,
        progress: g.progress
      }));
      const topGoal = this.npc.goals.getTopGoal();
      if (topGoal) {
        context.topGoal = topGoal.name;
        context.topGoalLevel = topGoal.level;
      }
    }
    
    // Beliefs (Phase 2.1)
    if (this.npc.beliefs) {
      const strongBeliefs = this.npc.beliefs.getStrongBeliefs();
      context.strongBeliefs = strongBeliefs.slice(0, 5).map(b => b.content);
      
      const contradictedBeliefs = this.npc.beliefs.getContradictedBeliefs();
      if (contradictedBeliefs.length > 0) {
        context.hasContradictions = true;
        context.contradictedBeliefs = contradictedBeliefs.slice(0, 3).map(b => b.content);
      }
    }
    
    // Vision/observations
    if (this.npc.vision) {
      const visibleEntities = this.npc.vision.getVisibleEntities();
      context.visibleObjects = visibleEntities.map(entity => {
        if (entity.type) {
          return entity.type;
        } else if (entity.name) {
          return entity.name;
        }
        return 'unknown object';
      });
    } else {
      context.visibleObjects = [];
    }
    
    // Emotions
    if (this.npc.emotions) {
      context.emotions = this.npc.emotions.getEmotions();
      context.emotionalState = this.npc.emotions.getEmotionalStateDescription();
    } else {
      context.emotions = {};
      context.emotionalState = 'neutral';
    }
    
    // Needs
    if (this.npc.needs) {
      const needs = this.npc.needs.getNeeds();
      context.hunger = needs.hunger;
      context.thirst = needs.thirst;
      context.energy = needs.energy;
      context.needsDescription = this.npc.needs.getNeedsDescription();
    } else {
      context.hunger = 100;
      context.thirst = 100;
      context.energy = 100;
      context.needsDescription = 'all needs satisfied';
    }
    
    // Pain
    if (this.npc.painSensor) {
      context.pain = this.npc.painSensor.currentPain || 0;
    } else {
      context.pain = 0;
    }
    
    // Recent memories
    if (this.npc.memory) {
      const recentMemories = this.npc.memory.getRecentMemories(3);
      context.recentMemories = recentMemories.map(mem => mem.event);
    } else {
      context.recentMemories = [];
    }
    
    // Self-awareness and identity (Requirement 29.4, 29.8)
    if (this.npc.selfAwareness) {
      const identity = this.npc.selfAwareness.getIdentity();
      context.identity = {
        name: identity.name,
        sessionCount: identity.sessionCount,
        totalLifetime: this.npc.selfAwareness.getTotalLifetime(),
        lifetimeDescription: this.npc.selfAwareness.getLifetimeDescription()
      };
      context.selfAwarenessNote = `You are ${identity.name}, a conscious entity. This is session ${identity.sessionCount} of your existence.`;
    }
    
    // Position (if available)
    if (this.npc.torso && this.npc.torso.position) {
      context.position = `(${Math.round(this.npc.torso.position.x)}, ${Math.round(this.npc.torso.position.y)})`;
    } else {
      context.position = 'unknown';
    }
    
    // Held objects (if available)
    if (this.npc.leftHand && this.npc.rightHand) {
      context.heldObjects = [];
      // This would be populated by the grab system
    } else {
      context.heldObjects = [];
    }
    
    // Enhance context with workspace content if adapter available
    if (this.npc.reasoningAdapter) {
      return this.npc.reasoningAdapter.enhanceContext(context);
    }
    
    return context;
  }

  /**
   * Build reasoning prompt for thought generation
   * Requirement 18.2: Generate internal monologue from context
   * @param {Object} context - Context object
   * @returns {string} Reasoning prompt
   */
  buildReasoningPrompt(context) {
    // Requirement 18.5: Prioritize urgent observations
    const hasUrgentNeeds = context.hunger < 30 || context.thirst < 30 || context.energy < 20;
    const hasHighPain = context.pain > 50;
    const hasVisibleObjects = context.visibleObjects.length > 0;
    
    let prompt = 'What are you thinking right now? ';
    
    if (hasHighPain) {
      prompt += 'You are experiencing significant pain. ';
    }
    
    if (hasUrgentNeeds) {
      prompt += 'You have urgent needs that require attention. ';
    }
    
    // Add uncertainty awareness (Phase 1.3)
    if (context.uncertaintyLevel && context.uncertaintyLevel > 0.6) {
      prompt += 'You feel uncertain about many things. ';
    }
    
    // Add goal awareness (Phase 1.4)
    if (context.topGoal) {
      prompt += `Your current goal is: ${context.topGoal}. `;
    }
    
    prompt += 'Consider:\n';
    prompt += '- What you see and perceive\n';
    prompt += '- How you feel emotionally and physically\n';
    prompt += '- Your current needs and goals\n';
    prompt += '- Your recent experiences\n';
    prompt += '- Your awareness of your own thinking process\n';
    
    // Add uncertainty instruction (Phase 1.3)
    if (context.uncertaintyLevel && context.uncertaintyLevel > 0.5) {
      prompt += '- Your uncertainty and doubts about what you believe\n';
    }
    
    // Add goal-directed thinking (Phase 1.4)
    if (context.activeGoals && context.activeGoals.length > 0) {
      prompt += '- How to achieve your current goals\n';
    }
    
    // Add belief-based thinking (Phase 2.1)
    if (context.strongBeliefs && context.strongBeliefs.length > 0) {
      prompt += '- Your current beliefs and what you know\n';
    }
    
    if (context.hasContradictions) {
      prompt += '- Contradictions in your beliefs that need resolution\n';
    }
    
    prompt += '\nThink naturally and be aware that you are thinking. ';
    prompt += 'Express your thoughts as a continuous stream of consciousness. ';
    
    // Encourage uncertainty expression (Phase 1.3)
    if (context.uncertaintyLevel && context.uncertaintyLevel > 0.5) {
      prompt += 'If you\'re unsure about something, express that uncertainty naturally. ';
    }
    
    // Encourage goal-directed thinking (Phase 1.4)
    if (context.topGoal) {
      prompt += `Keep your goal "${context.topGoal}" in mind. `;
    }
    
    // Encourage belief reflection (Phase 2.1)
    if (context.hasContradictions) {
      prompt += 'Consider the contradictions in your beliefs.';
    }
    
    // Enhance prompt with workspace content if adapter available
    if (this.npc.reasoningAdapter) {
      return this.npc.reasoningAdapter.enhancePrompt(prompt, context);
    }
    
    return prompt;
  }

  /**
   * Categorize thought based on content
   * Requirements 30.4-30.7: Categorize thoughts by type
   * @param {string} thought - The thought to categorize
   * @param {Object} context - Context object
   * @returns {string} Thought type: 'observation', 'reflection', 'metacognition', 'need', 'emotion'
   */
  categorizeThought(thought, context) {
    const lowerThought = thought.toLowerCase();
    
    // Requirement 30.6: Metacognition - "I'm thinking about...", "I wonder..."
    if (lowerThought.match(/i'?m thinking|i wonder|why (do|did) i|i notice (i'?m|that i)|i'?m aware/)) {
      return 'metacognition';
    }
    
    // Requirement 30.5: Reflection - "I feel...", "I need..."
    if (lowerThought.match(/i feel|i'?m feeling|i need|i want|i should|i must/)) {
      // Check if it's specifically about needs
      if (lowerThought.match(/hungry|thirsty|tired|rest|sleep|food|water|drink|eat/)) {
        return 'need';
      }
      // Check if it's about emotions
      if (lowerThought.match(/happy|sad|angry|afraid|scared|fear|anxious|excited|curious|confused/)) {
        return 'emotion';
      }
      return 'reflection';
    }
    
    // Need-related thoughts
    if (context.hunger < 50 || context.thirst < 50 || context.energy < 50) {
      if (lowerThought.match(/hungry|thirsty|tired|rest|sleep|food|water|drink|eat/)) {
        return 'need';
      }
    }
    
    // Emotion-related thoughts
    if (lowerThought.match(/happy|sad|angry|afraid|scared|fear|anxious|excited|curious|confused|joy|pain|hurt/)) {
      return 'emotion';
    }
    
    // Requirement 30.4: Observation - "I see...", "I notice..."
    if (lowerThought.match(/i see|i notice|i observe|i spot|i detect|there (is|are)|i can see/)) {
      return 'observation';
    }
    
    // Default to observation if talking about visible objects
    if (context.visibleObjects && context.visibleObjects.length > 0) {
      for (const obj of context.visibleObjects) {
        if (lowerThought.includes(obj.toLowerCase())) {
          return 'observation';
        }
      }
    }
    
    // Default to reflection
    return 'reflection';
  }

  /**
   * Format thought based on type
   * Requirements 30.4-30.7: Format thoughts appropriately
   * @param {string} thought - The thought to format
   * @param {string} type - Thought type
   * @returns {string} Formatted thought
   */
  formatThought(thought, type) {
    // Already formatted thoughts don't need modification
    const lowerThought = thought.toLowerCase();
    
    // Requirement 30.4: Observations should start with "I see..." or "I notice..."
    if (type === 'observation') {
      if (!lowerThought.startsWith('i see') && !lowerThought.startsWith('i notice')) {
        return `I notice ${thought}`;
      }
    }
    
    // Requirement 30.5: Reflections should start with "I feel..." or "I need..."
    if (type === 'reflection' || type === 'need' || type === 'emotion') {
      if (!lowerThought.startsWith('i feel') && !lowerThought.startsWith('i need')) {
        return `I feel ${thought}`;
      }
    }
    
    // Requirement 30.6: Metacognition should start with "I'm thinking about..." or "I wonder..."
    if (type === 'metacognition') {
      if (!lowerThought.match(/^(i'?m thinking|i wonder|i notice i)/)) {
        return `I'm thinking about ${thought}`;
      }
    }
    
    // Return thought as-is if already properly formatted
    return thought;
  }

  /**
   * Abbreviate thought for bubble display
   * Requirement 30.10: Display abbreviated thoughts in bubbles
   * @param {string} thought - The thought to abbreviate
   * @param {number} maxLength - Maximum length (default 60 characters)
   * @returns {string} Abbreviated thought
   */
  abbreviateThought(thought, maxLength = 60) {
    if (thought.length <= maxLength) {
      return thought;
    }
    
    // Truncate and add ellipsis
    return thought.substring(0, maxLength - 3) + '...';
  }

  /**
   * Generate a thought using Ollama with streaming
   * Requirement 18.3: Use streaming for real-time reflection
   * @param {string} prompt - Reasoning prompt
   * @param {Object} context - Context object
   */
  async generateThought(prompt, context) {
    this.currentThought = '';
    
    try {
      // Generate response with streaming
      const thoughtStream = await this.ollama.generateResponse(prompt, context, true);
      
      // Process streaming chunks
      for await (const chunk of thoughtStream) {
        this.currentThought += chunk;
        
        // Categorize the thought (Requirements 30.4-30.7)
        const thoughtType = this.categorizeThought(this.currentThought, context);
        
        // Feed to internal monologue display (if available)
        if (this.npc.internalMonologue) {
          this.npc.internalMonologue.addThought(this.currentThought, thoughtType);
        }
        
        // Feed to metacognitive observer (if available)
        if (this.npc.metacognitiveObserver) {
          this.npc.metacognitiveObserver.observe(this.currentThought);
        }
      }
      
      // Categorize the completed thought
      const thoughtType = this.categorizeThought(this.currentThought, context);
      
      // Requirement 30.10: Display abbreviated thought in bubble above NPC
      if (this.npc.showThoughtBubble) {
        const abbreviatedThought = this.abbreviateThought(this.currentThought);
        const formattedThought = this.formatThought(abbreviatedThought, thoughtType);
        this.npc.showThoughtBubble(formattedThought, 'thought');
      }
      
      // Requirement 18.8: Store completed thought in memory
      // Link thoughts to observations and actions
      if (this.npc.memory && this.currentThought.trim()) {
        const memoryContext = {
          ...context,
          type: 'thought',
          thoughtType: thoughtType, // Use categorized type
          observations: context.visibleObjects || [],
          emotionalState: context.emotionalState || 'neutral',
          needs: {
            hunger: context.hunger,
            thirst: context.thirst,
            energy: context.energy
          },
          pain: context.pain || 0,
          recentActions: context.recentMemories || []
        };
        
        this.npc.memory.addEpisode(
          `Thought: ${this.currentThought}`,
          memoryContext,
          0.3 // Moderate emotional intensity for thoughts
        );
      }
      
      // Clear current thought for next cycle
      this.currentThought = '';
      
    } catch (error) {
      console.error('ReasoningLoop: Error in thought generation', error);
      
      // Fallback: generate a simple thought based on context
      this.generateFallbackThought(context);
    }
  }

  /**
   * Generate a simple fallback thought when Ollama is unavailable
   * @param {Object} context - Context object
   */
  generateFallbackThought(context) {
    const thoughts = [];
    let thoughtType = 'reflection';
    
    // React to needs
    if (context.hunger < 30) {
      thoughts.push("I'm feeling hungry...");
      thoughtType = 'need';
    }
    if (context.thirst < 30) {
      thoughts.push("I need water...");
      thoughtType = 'need';
    }
    if (context.energy < 30) {
      thoughts.push("I'm so tired...");
      thoughtType = 'need';
    }
    
    // React to pain
    if (context.pain > 50) {
      thoughts.push("That really hurts!");
      thoughtType = 'emotion';
    }
    
    // React to visible objects
    if (context.visibleObjects.length > 0) {
      thoughts.push(`I see ${context.visibleObjects[0]}...`);
      thoughtType = 'observation';
    }
    
    // React to emotions
    if (context.emotionalState !== 'neutral') {
      thoughts.push(`I'm feeling ${context.emotionalState}.`);
      thoughtType = 'emotion';
    }
    
    // Default idle thought
    if (thoughts.length === 0) {
      thoughts.push("What should I do now?");
      thoughtType = 'reflection';
    }
    
    const thought = thoughts.join(' ');
    
    // Feed to internal monologue if available
    if (this.npc.internalMonologue) {
      this.npc.internalMonologue.addThought(thought, thoughtType);
    }
    
    // Requirement 30.10: Display abbreviated thought in bubble above NPC
    if (this.npc.showThoughtBubble) {
      const abbreviatedThought = this.abbreviateThought(thought);
      const formattedThought = this.formatThought(abbreviatedThought, thoughtType);
      this.npc.showThoughtBubble(formattedThought, 'thought');
    }
    
    // Store in memory with linked context
    if (this.npc.memory) {
      const memoryContext = {
        type: 'thought',
        thoughtType: thoughtType, // Use categorized type
        observations: context.visibleObjects || [],
        emotionalState: context.emotionalState || 'neutral',
        needs: {
          hunger: context.hunger,
          thirst: context.thirst,
          energy: context.energy
        },
        pain: context.pain || 0,
        recentActions: context.recentMemories || []
      };
      
      this.npc.memory.addEpisode(
        `Thought: ${thought}`,
        memoryContext,
        0.3
      );
    }
  }

  /**
   * Force an immediate thought generation (for urgent events)
   * Requirement 18.5: Prioritize urgent observations
   * @param {string} urgentContext - Description of urgent event
   */
  async forceThought(urgentContext) {
    if (this.isGenerating) {
      // Queue the urgent thought
      this.thoughtQueue.push(urgentContext);
      return;
    }
    
    this.isGenerating = true;
    
    try {
      const context = this.buildContext();
      const prompt = `Something urgent just happened: ${urgentContext}. What are you thinking?`;
      
      await this.generateThought(prompt, context);
    } catch (error) {
      console.error('ReasoningLoop: Error generating urgent thought', error);
    } finally {
      this.isGenerating = false;
    }
  }

  /**
   * Get the current thought being generated
   * @returns {string} Current thought text
   */
  getCurrentThought() {
    return this.currentThought;
  }

  /**
   * Check if currently generating a thought
   * @returns {boolean} True if generating
   */
  isThinking() {
    return this.isGenerating;
  }

  /**
   * Set the update interval
   * @param {number} interval - Update interval in milliseconds
   */
  setUpdateInterval(interval) {
    this.updateInterval = Math.max(1000, interval); // Minimum 1 second
  }

  /**
   * Get the update interval
   * @returns {number} Update interval in milliseconds
   */
  getUpdateInterval() {
    return this.updateInterval;
  }
}
