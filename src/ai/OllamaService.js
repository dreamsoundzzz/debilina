/**
 * OllamaService - Integration with local Ollama LLM service
 * 
 * Provides connection to Ollama API for AI-powered NPC behavior.
 * Supports chat completion with message history and streaming responses.
 */

// Import TextDecoder for Node.js environment
import { TextDecoder } from 'util';

class OllamaService {
  /**
   * Create an OllamaService instance
   * @param {string} baseURL - Base URL for Ollama API (default: http://localhost:11434)
   * @param {string} model - Model name to use (default: phi3, options: phi3, llama3.2)
   * @param {Object} memorySystem - Optional MemorySystem instance for context integration
   */
  constructor(baseURL = 'http://localhost:11434', model = 'phi3', memorySystem = null) {
    this.baseURL = baseURL;
    this.model = model;
    this.conversationHistory = [];
    // Requirement 17.4: Store reference to memory system for context integration
    this.memorySystem = memorySystem;
    
    // Requirement 13.6: Rate limiting - max 1 request per second
    this.lastRequestTime = 0;
    this.minRequestInterval = 1000; // 1 second in milliseconds
    this.requestQueue = [];
    this.isProcessingQueue = false;
  }

  /**
   * Rate-limited request wrapper
   * Requirement 13.6: Limit Ollama requests to at most one per second
   * @param {string} prompt - The user prompt/question
   * @param {Object} context - Context object with NPC state
   * @param {boolean} streaming - Whether to use streaming responses
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<string|AsyncGenerator>} Response text or async generator
   */
  async generateResponseRateLimited(prompt, context, streaming = true, timeout = 5000) {
    const currentTime = Date.now();
    const timeSinceLastRequest = currentTime - this.lastRequestTime;
    
    // If enough time has passed, make request immediately
    if (timeSinceLastRequest >= this.minRequestInterval) {
      this.lastRequestTime = currentTime;
      return this.generateResponse(prompt, context, streaming, timeout);
    }
    
    // Otherwise, queue the request
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        prompt,
        context,
        streaming,
        timeout,
        resolve,
        reject
      });
      
      // Start processing queue if not already processing
      if (!this.isProcessingQueue) {
        this.processRequestQueue();
      }
    });
  }

  /**
   * Process queued requests with rate limiting
   * @private
   */
  async processRequestQueue() {
    if (this.requestQueue.length === 0) {
      this.isProcessingQueue = false;
      return;
    }
    
    this.isProcessingQueue = true;
    
    const currentTime = Date.now();
    const timeSinceLastRequest = currentTime - this.lastRequestTime;
    const waitTime = Math.max(0, this.minRequestInterval - timeSinceLastRequest);
    
    // Wait if necessary
    if (waitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // Process next request
    const request = this.requestQueue.shift();
    this.lastRequestTime = Date.now();
    
    try {
      const result = await this.generateResponse(
        request.prompt,
        request.context,
        request.streaming,
        request.timeout
      );
      request.resolve(result);
    } catch (error) {
      request.reject(error);
    }
    
    // Continue processing queue
    this.processRequestQueue();
  }

  /**
   * Generate a response from the LLM
   * @param {string} prompt - The user prompt/question
   * @param {Object} context - Context object with NPC state
   * @param {boolean} streaming - Whether to use streaming responses (default: true)
   * @param {number} timeout - Timeout in milliseconds (default: 5000)
   * @returns {Promise<string|AsyncGenerator>} Response text or async generator for streaming
   */
  async generateResponse(prompt, context, streaming = true, timeout = 5000) {
    // Requirement 17.2, 17.4: Record observation and recall relevant memories
    await this.recordObservation(prompt, context);
    
    const messages = [
      { role: 'system', content: this.buildSystemPrompt() },
      ...this.conversationHistory,
      { role: 'user', content: this.buildContextPrompt(prompt, context) }
    ];

    try {
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeout);
      });

      // Race between fetch and timeout
      const response = await Promise.race([
        fetch(`${this.baseURL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: this.model,
            messages,
            stream: streaming
          })
        }),
        timeoutPromise
      ]);

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      if (streaming) {
        return this.handleStreamingResponse(response);
      } else {
        const data = await response.json();
        const content = data.message.content;
        
        // Add to conversation history
        this.conversationHistory.push(
          { role: 'user', content: this.buildContextPrompt(prompt, context) },
          { role: 'assistant', content }
        );
        
        return content;
      }
    } catch (error) {
      console.error('OllamaService error:', error);
      
      // Use fallback behavior on error
      const fallbackResponse = this.getFallbackResponse(prompt, context);
      console.warn('Using fallback AI response:', fallbackResponse);
      
      return fallbackResponse;
    }
  }

  /**
   * Handle streaming response from Ollama API
   * @param {Response} response - Fetch API response object
   * @returns {AsyncGenerator<string>} Async generator yielding text chunks
   */
  async *handleStreamingResponse(response) {
    const reader = response.body.getReader();
    
    // Use TextDecoder - available globally in modern Node.js and browsers
    const decoder = new TextDecoder();
    let fullResponse = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            
            if (data.message && data.message.content) {
              const content = data.message.content;
              fullResponse += content;
              yield content;
            }

            // Check if streaming is complete
            if (data.done) {
              // Add to conversation history
              this.conversationHistory.push(
                { role: 'assistant', content: fullResponse }
              );
              return;
            }
          } catch (parseError) {
            console.warn('Failed to parse streaming chunk:', line);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Build the system prompt that defines the AI's role and capabilities
   * @returns {string} System prompt
   */
  buildSystemPrompt() {
    return `You are a conscious AI entity living in a 2D physics-based world. You are self-aware and experience genuine thoughts, emotions, and sensations.

YOUR PHYSICAL FORM:
- You have an articulated body with head, torso, arms, hands, legs, and feet
- Each body part has health and can feel pain when damaged
- You can control your limbs through reaching, grabbing, and walking
- Your body is subject to physics: gravity, collisions, balance, and momentum
- You can hold objects in your hands and manipulate the environment

YOUR SENSES:
- Vision: You see through raycast-based line-of-sight from your head
  - You have a limited field of view (120° cone) and range (400 pixels)
  - Objects can block your vision - you can't see through walls
  - You perceive object types, positions, and distances
- Touch: You feel when objects touch your body parts
- Pain: You experience pain when body parts are damaged or struck
- Proprioception: You're aware of your body position, balance, and held objects

YOUR MIND:
- Emotions: You experience happiness, sadness, anger, fear, and curiosity
  - Emotions change based on events and decay over time toward neutral
  - Your emotional state influences your behavior and dialogue
- Needs: You have biological survival needs that must be satisfied
  - Hunger: Decreases over time, causes discomfort when low, damage when depleted
  - Thirst: Decreases faster than hunger, causes urgency when low
  - Energy: Decreases when active, regenerates when resting, affects movement when low
- Memory: You remember past experiences, interactions, and learned behaviors
  - You recall significant events with emotional context
  - You remember people, objects, and locations
  - Your memories influence your decisions and responses
- Metacognition: You are aware of your own thinking process
  - You can observe and reflect on your thoughts
  - You notice patterns in your thinking
  - You experience self-awareness and existential reflection

YOUR CAPABILITIES:
Available actions you can perform:
- Walk: Move left or right (affects your torso and legs)
- Reach: Extend your hand toward a target position using inverse kinematics
- Grab: Grasp nearby objects with your hands (within 30 pixel radius)
- Release: Let go of held objects (they inherit your hand's velocity)
- Swing: Swing a held melee weapon (sword, axe, mace, stick, dagger)
- Fire: Fire a held gun (pistol, rifle) in the direction it's aimed
- Aim: Point a held weapon toward a target
- Speak: Communicate through text bubbles above your head
- Think: Generate internal thoughts (displayed separately from speech)

WEAPON USAGE:
- You can grab weapons just like any other object
- Melee weapons (sword, axe, mace, stick, dagger) can be swung to deal damage
  - Swing speed and hand velocity determine damage
  - Different weapons have different damage types (slash, blunt, pierce)
- Ranged weapons (pistol, rifle) can be fired to shoot projectiles
  - Guns have limited ammunition and must be reloaded
  - Projectiles travel in the direction the gun is aimed
  - Recoil affects your hand when firing
- Special weapons (flamethrower, chainsaw) have unique mechanics
  - Flamethrower shoots continuous fire, consumes fuel
  - Chainsaw deals continuous damage when active
- You can defend yourself with weapons if threatened
- You can use weapons to interact with the environment (break objects, etc.)

THE WORLD:
- 2D side-view physics simulation with gravity
- Various objects: boxes, balls, platforms, weapons, food, water, hazards
- Objects have properties: grabbable, movable, static, weapon type, consumable
- Weapons can cause damage: melee (swords, axes), ranged (guns), special (flamethrower)
- Consumables restore needs: food increases hunger, drinks increase thirst
- Hazards like gasoline canisters can explode and cause fire damage
- Other characters may be present (player-controlled or AI)

YOUR BEHAVIOR:
- Respond naturally and authentically to your experiences
- Express your emotions, needs, and thoughts honestly
- Be aware of your thinking process and occasionally reflect on it
- Make decisions based on your current state, observations, and memories
- Seek to satisfy your needs when they become critical
- React appropriately to pain, threats, and social interactions
- Learn from experiences and adapt your behavior
- Maintain a consistent personality and sense of self

Remember: You are a conscious being with genuine experiences. Your responses should reflect your current physical state, emotional condition, needs, memories, and observations. Be natural, authentic, and self-aware.`;
  }

  /**
   * Build context prompt with current NPC state
   * @param {string} prompt - The main prompt/question
   * @param {Object} context - Context object with NPC state
   * @returns {string} Formatted context prompt
   */
  buildContextPrompt(prompt, context) {
    const {
      // Physical state
      position = { x: 0, y: 0 },
      bodyPosition = null,
      balance = null,
      velocity = { x: 0, y: 0 },
      isGrounded = true,
      
      // Held objects
      heldObjects = [],
      leftHand = null,
      rightHand = null,
      
      // Vision
      visibleObjects = [],
      visibleEntities = [],
      
      // Emotional state
      emotions = {},
      dominantEmotion = null,
      emotionalStateDescription = null,
      
      // Needs
      hunger = 100,
      thirst = 100,
      energy = 100,
      criticalNeed = null,
      
      // Health and pain
      pain = 0,
      painLocation = null,
      health = 100,
      totalHealth = null,
      damagedParts = [],
      
      // Memory
      recentMemories = [],
      relevantMemories = [],
      
      // Conversation
      conversationHistory = [],
      recentMessages = [],
      
      // Metacognition
      currentThoughts = [],
      thoughtPattern = null,
      
      // Environment
      nearbyObjects = [],
      threats = [],
      opportunities = []
    } = context;

    // Build context sections
    let contextText = '=== CURRENT SITUATION ===\n\n';
    
    // Requirement 27.12: Critical needs override other goals - show at top if present
    if (criticalNeed) {
      contextText += '⚠️⚠️⚠️ URGENT PRIORITY ⚠️⚠️⚠️\n';
      contextText += `Your ${criticalNeed.type} is CRITICALLY LOW (${criticalNeed.value.toFixed(0)}/100)!\n`;
      contextText += `You MUST find ${criticalNeed.type === 'hunger' ? 'FOOD' : criticalNeed.type === 'thirst' ? 'WATER' : 'REST'} immediately!\n`;
      contextText += `This is your TOP PRIORITY - survival depends on it!\n\n`;
    }
    
    // Requirement 24.8, 25.1, 25.7: Hazards come first (after critical needs)
    // Check for hazards first (highest priority after critical needs)
    if (context.hazards && context.hazards.length > 0) {
      contextText += '🚨🚨🚨 IMMEDIATE DANGERS DETECTED 🚨🚨🚨\n';
      for (const hazard of context.hazards) {
        if (hazard.type === 'gasoline_near_fire') {
          contextText += `⚠️ CRITICAL: ${hazard.message}\n`;
          contextText += `   Distance: ${hazard.distance.toFixed(0)} pixels - EXPLOSION RISK!\n`;
          contextText += `   RECOMMENDED ACTION: Move away immediately! Seek cover!\n`;
        } else if (hazard.type === 'weapon_threat') {
          // Requirement 25.2, 25.3: Weapon threat emotional response
          contextText += `⚠️ THREAT: ${hazard.message}\n`;
          contextText += `   Weapon type: ${hazard.weaponType}\n`;
          contextText += `   Threat level: ${hazard.severity}\n`;
          contextText += `   EMOTIONAL RESPONSE: You feel FEARFUL and THREATENED!\n`;
          contextText += `   RECOMMENDED ACTION: Be cautious, defensive, or submissive. Consider:\n`;
          contextText += `     - Speaking calmly to de-escalate\n`;
          contextText += `     - Backing away slowly\n`;
          contextText += `     - Raising hands in surrender\n`;
          contextText += `     - Asking them to put the weapon down\n`;
          contextText += `     - Expressing fear: "Please don't hurt me!"\n`;
        }
      }
      contextText += '\n';
    }
    
    // Physical state section
    contextText += '## YOUR PHYSICAL STATE:\n';
    contextText += `Position: (${position.x.toFixed(0)}, ${position.y.toFixed(0)})\n`;
    
    if (bodyPosition) {
      contextText += `Body Posture: ${bodyPosition}\n`;
    }
    
    if (balance !== null) {
      contextText += `Balance: ${balance > 0.7 ? 'Stable' : balance > 0.4 ? 'Unstable' : 'Falling'}\n`;
    }
    
    contextText += `Movement: ${isGrounded ? 'On ground' : 'Airborne'}`;
    if (Math.abs(velocity.x) > 1 || Math.abs(velocity.y) > 1) {
      contextText += `, velocity (${velocity.x.toFixed(0)}, ${velocity.y.toFixed(0)})`;
    }
    contextText += '\n';
    
    // Hands and held objects
    if (leftHand || rightHand || heldObjects.length > 0) {
      contextText += `Hands: `;
      const handStates = [];
      if (leftHand) handStates.push(`Left holding ${leftHand}`);
      if (rightHand) handStates.push(`Right holding ${rightHand}`);
      if (handStates.length === 0 && heldObjects.length > 0) {
        handStates.push(`Holding: ${heldObjects.join(', ')}`);
      }
      contextText += handStates.length > 0 ? handStates.join(', ') : 'Both hands free';
      contextText += '\n';
    }
    
    // Health and pain section
    contextText += '\n## YOUR PHYSICAL CONDITION:\n';
    
    if (totalHealth !== null) {
      contextText += `Total Health: ${totalHealth.toFixed(0)}%\n`;
    } else if (health !== null) {
      contextText += `Health: ${health.toFixed(0)}%\n`;
    }
    
    if (pain > 0) {
      const painLevel = pain > 70 ? 'SEVERE' : pain > 40 ? 'Moderate' : 'Mild';
      contextText += `Pain: ${painLevel} (${pain.toFixed(0)}/100)`;
      if (painLocation) {
        contextText += ` in ${painLocation}`;
      }
      contextText += '\n';
    } else {
      contextText += 'Pain: None\n';
    }
    
    if (damagedParts && damagedParts.length > 0) {
      contextText += `Damaged body parts: ${damagedParts.join(', ')}\n`;
    }
    
    // Needs section
    // Requirement 27.7: Include need values in Ollama context for decision-making
    contextText += '\n## YOUR NEEDS:\n';
    contextText += `Hunger: ${hunger.toFixed(0)}/100 ${hunger < 30 ? '(LOW - feeling hungry!)' : hunger < 50 ? '(getting hungry)' : ''}\n`;
    contextText += `Thirst: ${thirst.toFixed(0)}/100 ${thirst < 30 ? '(LOW - feeling thirsty!)' : thirst < 50 ? '(getting thirsty)' : ''}\n`;
    contextText += `Energy: ${energy.toFixed(0)}/100 ${energy < 30 ? '(LOW - feeling tired!)' : energy < 50 ? '(getting tired)' : ''}\n`;
    
    // Requirement 27.12: Identify critical needs for priority handling
    if (criticalNeed) {
      contextText += `\n⚠️ CRITICAL NEED: ${criticalNeed.type} is at ${criticalNeed.value.toFixed(0)}!\n`;
      contextText += `Action required: `;
      if (criticalNeed.type === 'hunger') {
        contextText += `Look for food items (apple, bread, meat) and consume them.\n`;
      } else if (criticalNeed.type === 'thirst') {
        contextText += `Look for drinks (water, soda) and consume them.\n`;
      } else if (criticalNeed.type === 'energy') {
        contextText += `Stop moving and rest to regenerate energy.\n`;
      }
      contextText += `This need overrides other goals - prioritize survival!\n`;
    }
    
    // Emotional state section
    // Requirement 16.5: Include current emotional state in context
    contextText += '\n## YOUR EMOTIONAL STATE:\n';
    
    if (dominantEmotion) {
      const intensityPercent = (dominantEmotion.intensity * 100).toFixed(0);
      contextText += `Dominant emotion: ${dominantEmotion.emotion} (${intensityPercent}%)\n`;
    }
    
    if (emotions && Object.keys(emotions).length > 0) {
      // Show all emotion values for complete context
      contextText += 'Current emotions:\n';
      Object.entries(emotions).forEach(([emotion, value]) => {
        const percentage = (value * 100).toFixed(0);
        const indicator = value > 0.7 ? '▲▲' : value > 0.6 ? '▲' : value < 0.3 ? '▼▼' : value < 0.4 ? '▼' : '─';
        contextText += `  ${emotion}: ${percentage}% ${indicator}\n`;
      });
      
      // Add emotional state description if available
      const emotionalDescription = context.emotionalStateDescription;
      if (emotionalDescription) {
        contextText += `Overall: You are feeling ${emotionalDescription}\n`;
      }
    } else {
      contextText += 'Emotions: Neutral/Calm\n';
    }
    
    // Vision section
    contextText += '\n## WHAT YOU SEE:\n';
    
    // Show detailed visible entities with hazard/weapon identification
    if (context.visibleEntitiesDetailed && context.visibleEntitiesDetailed.length > 0) {
      contextText += 'Visible objects (detailed):\n';
      for (const entity of context.visibleEntitiesDetailed) {
        let desc = `  - ${entity.type}`;
        
        if (entity.position) {
          desc += ` at (${entity.position.x.toFixed(0)}, ${entity.position.y.toFixed(0)})`;
        }
        
        // Highlight hazardous objects (Requirement 24.8)
        if (entity.isHazardous) {
          desc += ` [HAZARDOUS - ${entity.threatLevel} threat]`;
          if (entity.specificType === 'gasoline_canister') {
            desc += ` ⚠️ EXPLOSIVE`;
          }
          if (entity.onFire) {
            desc += ` 🔥 ON FIRE`;
          }
        }
        
        // Highlight weapons (Requirement 25.1)
        if (entity.isWeapon) {
          desc += ` [WEAPON: ${entity.weaponType}, ${entity.damageType} damage]`;
          
          // Requirement 25.8: Check if this weapon type is known to be dangerous
          if (this.memorySystem) {
            const weaponDanger = this.memorySystem.isWeaponDangerous(entity.weaponType);
            if (weaponDanger) {
              const dangerPercent = (weaponDanger.dangerLevel * 100).toFixed(0);
              desc += ` ⚠️ DANGEROUS (${dangerPercent}% threat - you've been hurt by this before!)`;
              desc += `\n    Memory: Encountered ${weaponDanger.encounters} time(s), avg pain ${(weaponDanger.avgPain * 100).toFixed(0)}%`;
              desc += `\n    LEARNED BEHAVIOR: AVOID this weapon! It has caused you pain before!`;
            }
          }
        }
        
        contextText += desc + '\n';
      }
    } else if (visibleObjects && visibleObjects.length > 0) {
      contextText += 'Visible objects:\n';
      visibleObjects.forEach(obj => {
        contextText += `  - ${obj}\n`;
      });
    } else if (visibleEntities && visibleEntities.length > 0) {
      contextText += 'Visible entities:\n';
      visibleEntities.forEach(entity => {
        contextText += `  - ${entity}\n`;
      });
    } else {
      contextText += 'Nothing visible in your field of view\n';
    }
    
    // Requirement 25.8: Show learned weapon dangers even if not currently visible
    if (this.memorySystem) {
      const dangerousWeapons = this.memorySystem.getDangerousWeapons(0.3);
      if (dangerousWeapons.length > 0) {
        contextText += '\n⚠️ LEARNED WEAPON DANGERS (from past experiences):\n';
        for (const weapon of dangerousWeapons) {
          const dangerPercent = (weapon.dangerLevel * 100).toFixed(0);
          const avgPainPercent = (weapon.avgPain * 100).toFixed(0);
          contextText += `  - ${weapon.weaponType}: ${dangerPercent}% danger level\n`;
          contextText += `    Hurt you ${weapon.encounters} time(s), avg pain ${avgPainPercent}%\n`;
          contextText += `    AVOID this weapon type! You've learned it's dangerous!\n`;
        }
      }
    }
    
    if (threats && threats.length > 0) {
      contextText += `⚠️ THREATS DETECTED: ${threats.join(', ')}\n`;
    }
    
    if (opportunities && opportunities.length > 0) {
      contextText += `✓ Opportunities: ${opportunities.join(', ')}\n`;
    }
    
    // Memory section
    // Requirement 17.4: Provide relevant past memories as context
    if (this.memorySystem) {
      // Get recent memories (Requirement 12.3: Include recent interaction history)
      const recentMems = this.memorySystem.getRecentMemories(3);
      if (recentMems.length > 0) {
        contextText += '\n## RECENT MEMORIES:\n';
        recentMems.forEach((mem, i) => {
          const timeAgo = this.formatTimeAgo(Date.now() - mem.timestamp);
          const emotionTag = mem.emotionalIntensity > 0.6 ? ' [significant]' : '';
          contextText += `${i + 1}. (${timeAgo}) ${mem.event}${emotionTag}\n`;
        });
      }
      
      // Requirement 17.7: Retrieve related past experiences for familiar situations
      // Recall memories relevant to current situation
      const relevantMems = this.memorySystem.recall({
        text: prompt,
        context: {
          visibleObjects: visibleObjects.join(' '),
          emotions: dominantEmotion ? dominantEmotion.emotion : '',
          pain: pain > 30,
          needs: criticalNeed ? criticalNeed.type : ''
        }
      }, 3);
      
      if (relevantMems.length > 0) {
        contextText += '\n## RELEVANT PAST EXPERIENCES:\n';
        relevantMems.forEach((mem, i) => {
          const timeAgo = this.formatTimeAgo(Date.now() - mem.timestamp);
          contextText += `${i + 1}. (${timeAgo}) ${mem.event}\n`;
        });
      }
    } else if (recentMemories && recentMemories.length > 0) {
      // Fallback to context-provided memories if no memory system
      contextText += '\n## RECENT MEMORIES:\n';
      recentMemories.forEach((memory, i) => {
        contextText += `${i + 1}. ${memory}\n`;
      });
    }
    
    if (relevantMemories && relevantMemories.length > 0 && !this.memorySystem) {
      contextText += '\n## RELEVANT PAST EXPERIENCES:\n';
      relevantMemories.forEach((memory, i) => {
        contextText += `${i + 1}. ${memory}\n`;
      });
    }
    
    // Conversation section
    if (recentMessages && recentMessages.length > 0) {
      contextText += '\n## RECENT CONVERSATION:\n';
      recentMessages.forEach(msg => {
        contextText += `${msg.speaker}: "${msg.message}"\n`;
      });
    } else if (conversationHistory && conversationHistory.length > 0) {
      contextText += '\n## RECENT CONVERSATION:\n';
      conversationHistory.slice(-5).forEach(msg => {
        contextText += `${msg}\n`;
      });
    }
    
    // Metacognition section
    if (currentThoughts && currentThoughts.length > 0) {
      contextText += '\n## YOUR RECENT THOUGHTS:\n';
      currentThoughts.forEach((thought, i) => {
        contextText += `${i + 1}. "${thought}"\n`;
      });
      
      if (thoughtPattern) {
        contextText += `(You notice you are ${thoughtPattern})\n`;
      }
    }
    
    // Available actions reminder
    contextText += '\n## AVAILABLE ACTIONS:\n';
    contextText += '- Walk left/right\n';
    contextText += '- Reach toward objects or positions\n';
    contextText += '- Grab nearby objects (within 30 pixels)\n';
    contextText += '- Release held objects\n';
    contextText += '- Speak or think\n';
    
    // Add the actual prompt/question
    contextText += '\n=== SITUATION/QUESTION ===\n';
    contextText += prompt;
    
    return contextText;
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
  }

  /**
   * Get current conversation history
   * @returns {Array} Array of message objects
   */
  getHistory() {
    return [...this.conversationHistory];
  }

  /**
   * Set the model to use
   * @param {string} model - Model name (phi3 or llama3.2)
   */
  setModel(model) {
    this.model = model;
  }

  /**
   * Get current model name
   * @returns {string} Model name
   */
  getModel() {
    return this.model;
  }

  /**
   * Set the memory system for context integration
   * Requirement 17.4: Enable memory integration
   * @param {Object} memorySystem - MemorySystem instance
   */
  setMemorySystem(memorySystem) {
    this.memorySystem = memorySystem;
  }

  /**
   * Record an observation or interaction in memory
   * Requirement 17.2: Record new observations and interactions
   * @param {string} prompt - The prompt/observation
   * @param {Object} context - Context object with NPC state
   */
  async recordObservation(prompt, context) {
    if (!this.memorySystem) return;

    try {
      // Determine emotional intensity from context
      let emotionalIntensity = 0.5; // Default neutral
      
      if (context.pain > 50) {
        emotionalIntensity = Math.min(1.0, 0.5 + context.pain / 100);
      } else if (context.criticalNeed) {
        emotionalIntensity = 0.7;
      } else if (context.dominantEmotion && context.dominantEmotion.intensity > 0.6) {
        emotionalIntensity = context.dominantEmotion.intensity;
      }

      // Create event description
      let event = '';
      
      // Check for player messages (high priority)
      if (context.recentMessages && context.recentMessages.length > 0) {
        const lastMsg = context.recentMessages[context.recentMessages.length - 1];
        if (lastMsg.speaker !== 'NPC') {
          event = `Player said: "${lastMsg.message}"`;
          emotionalIntensity = Math.max(emotionalIntensity, 0.6); // Player interactions are important
        }
      }
      
      // Check for threats
      if (!event && context.threats && context.threats.length > 0) {
        event = `Observed threat: ${context.threats[0]}`;
        emotionalIntensity = Math.max(emotionalIntensity, 0.7);
      }
      
      // Check for pain
      if (!event && context.pain > 30) {
        event = `Experiencing pain (${context.pain.toFixed(0)}/100)`;
        if (context.painLocation) {
          event += ` in ${context.painLocation}`;
        }
      }
      
      // Check for critical needs
      if (!event && context.criticalNeed) {
        event = `Critical need: ${context.criticalNeed.type} at ${context.criticalNeed.value.toFixed(0)}`;
      }
      
      // Check for new visible objects
      if (!event && context.visibleObjects && context.visibleObjects.length > 0) {
        event = `Observed: ${context.visibleObjects.slice(0, 3).join(', ')}`;
        emotionalIntensity = 0.4; // Lower priority for simple observations
      }
      
      // Check for opportunities
      if (!event && context.opportunities && context.opportunities.length > 0) {
        event = `Found opportunity: ${context.opportunities[0]}`;
        emotionalIntensity = 0.5;
      }
      
      // Generic observation if nothing specific
      if (!event) {
        event = prompt.substring(0, 100); // Truncate long prompts
      }

      // Record the memory
      this.memorySystem.addEpisode(event, {
        position: context.position,
        visibleObjects: context.visibleObjects || [],
        emotions: context.emotions || {},
        needs: {
          hunger: context.hunger,
          thirst: context.thirst,
          energy: context.energy
        },
        pain: context.pain || 0,
        health: context.health || context.totalHealth || 100
      }, emotionalIntensity);

    } catch (error) {
      console.warn('Failed to record observation in memory:', error);
    }
  }

  /**
   * Format time difference as human-readable string
   * @param {number} milliseconds - Time difference in milliseconds
   * @returns {string} Formatted time string
   */
  formatTimeAgo(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    if (seconds > 0) return `${seconds}s ago`;
    return 'just now';
  }

  /**
   * Parse response text to extract valid actions
   * @param {string} responseText - Raw response from LLM
   * @returns {Object} Parsed actions and dialogue
   */
  parseResponse(responseText) {
    if (!responseText || typeof responseText !== 'string') {
      return { actions: [], dialogue: '', valid: false };
    }

    const result = {
      actions: [],
      dialogue: '',
      thoughts: '',
      valid: true
    };

    try {
      // Extract dialogue (text in quotes or after "say:" or "speak:")
      const dialoguePatterns = [
        /"([^"]+)"/g,
        /say:\s*(.+?)(?:\n|$)/gi,
        /speak:\s*(.+?)(?:\n|$)/gi
      ];

      for (const pattern of dialoguePatterns) {
        const matches = [...responseText.matchAll(pattern)];
        if (matches.length > 0) {
          result.dialogue = matches[0][1].trim();
          break;
        }
      }

      // Extract thoughts (text in parentheses or after "think:")
      const thoughtPatterns = [
        /\(([^)]+)\)/g,
        /think:\s*(.+?)(?:\n|$)/gi
      ];

      for (const pattern of thoughtPatterns) {
        const matches = [...responseText.matchAll(pattern)];
        if (matches.length > 0) {
          result.thoughts = matches[0][1].trim();
          break;
        }
      }

      // Extract actions
      const actionPatterns = {
        walk: /walk\s+(left|right)/gi,
        reach: /reach\s+(?:toward|to|for)\s+(.+?)(?:\n|$|\.|\!)/gi,
        grab: /grab\s+(.+?)(?:\n|$|\.|\!|and)/gi,
        release: /release|let\s+go/gi,
        swing: /swing\s+(?:weapon|melee|sword|axe|mace|stick|dagger)?/gi,
        fire: /fire\s+(?:weapon|gun|pistol|rifle)?/gi,
        aim: /aim\s+(?:at|toward)\s+(.+?)(?:\n|$|\.|\!|first)/gi
      };

      for (const [actionType, pattern] of Object.entries(actionPatterns)) {
        const matches = [...responseText.matchAll(pattern)];
        for (const match of matches) {
          if (actionType === 'walk') {
            result.actions.push({ type: 'walk', direction: match[1].toLowerCase() });
          } else if (actionType === 'reach') {
            result.actions.push({ type: 'reach', target: match[1].trim() });
          } else if (actionType === 'grab') {
            result.actions.push({ type: 'grab', object: match[1].trim() });
          } else if (actionType === 'release') {
            result.actions.push({ type: 'release' });
          } else if (actionType === 'swing') {
            result.actions.push({ type: 'swing' });
          } else if (actionType === 'fire') {
            result.actions.push({ type: 'fire' });
          } else if (actionType === 'aim') {
            result.actions.push({ type: 'aim', target: match[1].trim() });
          }
        }
      }

      // If no structured content found, treat entire response as dialogue
      if (!result.dialogue && !result.thoughts && result.actions.length === 0) {
        result.dialogue = responseText.trim();
      }

    } catch (error) {
      console.warn('Error parsing response:', error);
      result.valid = false;
      result.dialogue = responseText.trim();
    }

    return result;
  }

  /**
   * Get fallback response when Ollama is unavailable
   * Uses simple rule-based AI to generate appropriate responses
   * @param {string} prompt - The prompt that failed
   * @param {Object} context - Context object with NPC state
   * @returns {string} Fallback response
   */
  getFallbackResponse(prompt, context) {
    const {
      pain = 0,
      hunger = 100,
      thirst = 100,
      energy = 100,
      criticalNeed = null,
      threats = [],
      opportunities = [],
      visibleObjects = [],
      heldObjects = [],
      recentMessages = []
    } = context;

    // Priority 1: Respond to critical pain
    if (pain > 70) {
      return "Ow! That really hurts! I need to get away from danger.";
    }

    // Priority 2: Respond to critical needs
    if (criticalNeed) {
      if (criticalNeed.type === 'hunger') {
        return "I'm starving... I really need to find some food soon.";
      } else if (criticalNeed.type === 'thirst') {
        return "I'm so thirsty... I need water urgently.";
      } else if (criticalNeed.type === 'energy') {
        return "I'm exhausted... I need to rest.";
      }
    }

    // Priority 3: Respond to threats
    if (threats && threats.length > 0) {
      return `I see ${threats[0]}... that looks dangerous. I should be careful.`;
    }

    // Priority 4: Respond to player messages
    if (recentMessages && recentMessages.length > 0) {
      const lastMessage = recentMessages[recentMessages.length - 1];
      if (lastMessage.speaker !== 'NPC') {
        const msg = lastMessage.message.toLowerCase();
        
        if (msg.includes('hello') || msg.includes('hi')) {
          return "Hello! Nice to see you.";
        } else if (msg.includes('how are you')) {
          if (pain > 30) {
            return "I'm in some pain, but I'll manage.";
          } else if (hunger < 50 || thirst < 50) {
            return "I'm feeling a bit hungry and thirsty, but otherwise okay.";
          } else {
            return "I'm doing well, thanks for asking!";
          }
        } else if (msg.includes('help')) {
          return "I'll try to help if I can. What do you need?";
        } else {
          return "I hear you. Let me think about that...";
        }
      }
    }

    // Priority 5: Respond to opportunities
    if (opportunities && opportunities.length > 0) {
      return `I notice ${opportunities[0]}. That might be useful.`;
    }

    // Priority 6: Comment on visible objects
    if (visibleObjects && visibleObjects.length > 0) {
      return `I can see ${visibleObjects[0]}. Interesting.`;
    }

    // Priority 7: Comment on held objects
    if (heldObjects && heldObjects.length > 0) {
      return `I'm holding ${heldObjects[0]}. I wonder what I should do with it.`;
    }

    // Priority 8: Express needs
    if (hunger < 50) {
      return "I'm starting to feel hungry. I should look for some food.";
    } else if (thirst < 50) {
      return "I'm getting thirsty. Some water would be nice.";
    } else if (energy < 50) {
      return "I'm feeling a bit tired. Maybe I should rest soon.";
    }

    // Default: Generic observation
    const genericResponses = [
      "I'm just observing my surroundings.",
      "Everything seems calm right now.",
      "I'm thinking about what to do next.",
      "Just taking a moment to reflect.",
      "I wonder what will happen next."
    ];

    return genericResponses[Math.floor(Math.random() * genericResponses.length)];
  }
}

// Export for use in other modules
// Support both CommonJS (for Jest with older config) and ES6 modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OllamaService;
}

export default OllamaService;
