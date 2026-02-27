/**
 * Main entry point for AI Playground
 * Initializes all game systems and starts the game loop
 * Validates: Requirements 14.1, 14.6, 6.6, 12.6
 */
import { GameEngine } from './core/GameEngine.js';
import { InputHandler } from './core/InputHandler.js';
import { HandControlSystem } from './core/HandControlSystem.js';
import { ChatSystem } from './core/ChatSystem.js';
import { ChatHistoryPanel } from './core/ChatHistoryPanel.js';
import { HelpOverlay } from './core/HelpOverlay.js';
import { DebugUI } from './core/DebugUI.js';
import { BubbleManager } from './core/BubbleManager.js';
import { InternalMonologuePanel } from './core/InternalMonologuePanel.js';
import { PlayerIdentity } from './core/PlayerIdentity.js';
import { WorkspaceDebugPanel } from './core/WorkspaceDebugPanel.js';
import { errorHandler } from './core/ErrorHandler.js';

import { Character } from './physics/Character.js';
import { CollisionSystem } from './physics/CollisionSystem.js';
import { GrabSystem } from './physics/GrabSystem.js';
import { LocomotionSystem } from './physics/LocomotionSystem.js';
import { IKSystem } from './physics/IKSystem.js';
import { Vec2 } from './physics/Vec2.js';

import { VisionSystem } from './ai/VisionSystem.js';
import { EmotionSystem } from './ai/EmotionSystem.js';
import { MemorySystem } from './ai/MemorySystem.js';
import { NeedsSystem } from './ai/NeedsSystem.js';
import { OllamaService } from './ai/OllamaService.js';
import { ReasoningLoop } from './ai/ReasoningLoop.js';
import { MetacognitiveObserver } from './ai/MetacognitiveObserver.js';
import { SelfAwarenessLayer } from './ai/SelfAwarenessLayer.js';
import { NPCResponseSystem } from './ai/NPCResponseSystem.js';
import { NPCActionSystem } from './ai/NPCActionSystem.js';
import { ConsumptionSystem } from './ai/ConsumptionSystem.js';
import { GlobalWorkspace } from './ai/GlobalWorkspace.js';
import { AttentionSystem } from './ai/AttentionSystem.js';
import { ConfidenceSystem } from './ai/ConfidenceSystem.js';
import { BeliefSystem } from './ai/BeliefSystem.js';
import { GoalHierarchy } from './ai/GoalHierarchy.js';
import { WorldModel } from './ai/WorldModel.js';
import { ExecutiveControl } from './ai/ExecutiveControl.js';
import { ConsistencyEngine } from './ai/ConsistencyEngine.js';
import { TemporalReasoning } from './ai/TemporalReasoning.js';
import { TheoryOfMind } from './ai/TheoryOfMind.js';
import { ValueCore } from './ai/ValueCore.js';
import { CuriositySystem } from './ai/CuriositySystem.js';
import {
    VisionWorkspaceAdapter,
    EmotionWorkspaceAdapter,
    NeedsWorkspaceAdapter,
    MemoryWorkspaceAdapter,
    ReasoningWorkspaceAdapter,
    WorldModelWorkspaceAdapter
} from './ai/adapters/index.js';

import { ObjectManager } from './game/ObjectManager.js';
import { SpawnMenu } from './game/SpawnMenu.js';
import { WeaponSystem } from './game/WeaponSystem.js';
import { HealthSystem } from './game/HealthSystem.js';
import { PainSensor } from './game/PainSensor.js';
import { BloodSystem } from './game/BloodSystem.js';

/**
 * Main game class that coordinates all systems
 */
class AIPlayground {
    constructor(canvas) {
        this.canvas = canvas;
        this.engine = new GameEngine(canvas);
        this.paused = false;
        
        // Initialize all systems
        this.initializeSystems();
        this.wireSystemDependencies();
        this.setupEventListeners();
    }

    /**
     * Initialize all game systems
     */
    initializeSystems() {
        try {
            // Core systems
            this.inputHandler = new InputHandler(this.canvas);
            this.debugUI = new DebugUI();
            this.helpOverlay = new HelpOverlay();
            this.playerIdentity = new PlayerIdentity();
            
            // Create player character
            this.player = new Character(400, 300, 'player');
            
            // Create NPC character
            this.npc = new Character(600, 300, 'npc');
            
            // Physics systems
            this.collisionSystem = new CollisionSystem();
            this.ikSystem = new IKSystem();
            this.grabSystem = new GrabSystem();
            this.locomotionSystem = new LocomotionSystem();
            
            // Player control systems
            this.handControlSystem = new HandControlSystem(
                this.player,
                this.ikSystem,
                this.inputHandler
            );
            
            // Game object systems
            this.objectManager = new ObjectManager(this.collisionSystem);
            this.spawnMenu = new SpawnMenu(this.objectManager, this.inputHandler);
            this.weaponSystem = new WeaponSystem(this.objectManager);
            
            // Health and damage systems
            this.playerHealth = new HealthSystem(this.player);
            this.npcHealth = new HealthSystem(this.npc);
            this.playerPain = new PainSensor(this.player, this.playerHealth);
            this.npcPain = new PainSensor(this.npc, this.npcHealth);
            this.bloodSystem = new BloodSystem();
            
            // AI systems for NPC
            this.ollamaService = new OllamaService();
            this.visionSystem = new VisionSystem();
            this.emotionSystem = new EmotionSystem();
            this.memorySystem = new MemorySystem();
            this.needsSystem = new NeedsSystem();
            this.consumptionSystem = new ConsumptionSystem(
                this.needsSystem,
                this.emotionSystem,
                this.memorySystem
            );
            
            // Global Workspace for unified consciousness
            this.globalWorkspace = new GlobalWorkspace({
                capacity: 7,
                decayRate: 0.1,
                updateFrequency: 10,
                eventSystem: this.engine.events
            });
            
            // Attention System for selective focus (Phase 1.2)
            this.attentionSystem = new AttentionSystem(this.globalWorkspace);
            
            // Confidence System for uncertainty tracking (Phase 1.3)
            this.confidenceSystem = new ConfidenceSystem();
            
            // Belief System for explicit beliefs (Phase 2.1)
            this.beliefSystem = new BeliefSystem(this.confidenceSystem);
            
            // Goal Hierarchy for structured goals (Phase 1.4)
            this.goalHierarchy = new GoalHierarchy();
            
            // World Model for predictive reasoning (Phase 2.2)
            this.worldModel = new WorldModel();
            
            // Executive Control for self-control (Phase 2.3)
            this.executiveControl = new ExecutiveControl();
            
            // Consistency Engine for mental state coherence (Phase 2.4)
            this.consistencyEngine = new ConsistencyEngine();
            
            // Temporal Reasoning for time-aware planning (Phase 2.5)
            this.temporalReasoning = new TemporalReasoning();
            
            // Theory of Mind for social cognition (Phase 3.1)
            this.theoryOfMind = new TheoryOfMind();
            
            // Value Core for stable values (Phase 3.2)
            this.valueCore = new ValueCore();
            
            // Curiosity System for exploration motivation (Phase 3.3)
            this.curiositySystem = new CuriositySystem();
            
            // AI cognitive systems
            this.metacognitiveObserver = new MetacognitiveObserver();
            this.selfAwarenessLayer = new SelfAwarenessLayer(this.memorySystem);
            this.reasoningLoop = new ReasoningLoop(
                this.ollamaService,
                this.visionSystem,
                this.emotionSystem,
                this.memorySystem,
                this.needsSystem,
                this.metacognitiveObserver,
                this.selfAwarenessLayer
            );
            
            // Workspace integration adapters
            this.visionAdapter = new VisionWorkspaceAdapter(this.visionSystem, this.globalWorkspace);
            this.emotionAdapter = new EmotionWorkspaceAdapter(this.emotionSystem, this.globalWorkspace);
            this.needsAdapter = new NeedsWorkspaceAdapter(this.needsSystem, this.globalWorkspace);
            this.memoryAdapter = new MemoryWorkspaceAdapter(this.memorySystem, this.globalWorkspace);
            this.reasoningAdapter = new ReasoningWorkspaceAdapter(this.reasoningLoop, this.globalWorkspace);
            this.worldModelAdapter = new WorldModelWorkspaceAdapter(this.worldModel, this.globalWorkspace);
            
            // Wire adapters to NPC for access by AI systems
            this.npc.workspace = this.globalWorkspace;
            this.npc.visionAdapter = this.visionAdapter;
            this.npc.emotionAdapter = this.emotionAdapter;
            this.npc.needsAdapter = this.needsAdapter;
            this.npc.memoryAdapter = this.memoryAdapter;
            this.npc.reasoningAdapter = this.reasoningAdapter;
            this.npc.worldModelAdapter = this.worldModelAdapter;
            
            // Wire consciousness systems to NPC
            this.npc.attention = this.attentionSystem;
            this.npc.confidence = this.confidenceSystem;
            this.npc.beliefs = this.beliefSystem;
            this.npc.goals = this.goalHierarchy;
            this.npc.worldModel = this.worldModel;
            this.npc.executiveControl = this.executiveControl;
            this.npc.consistencyEngine = this.consistencyEngine;
            this.npc.temporalReasoning = this.temporalReasoning;
            this.npc.theoryOfMind = this.theoryOfMind;
            this.npc.valueCore = this.valueCore;
            this.npc.curiositySystem = this.curiositySystem;
            
            // Wire AI systems to NPC for access by adapters
            this.npc.vision = this.visionSystem;
            this.npc.emotions = this.emotionSystem;
            this.npc.memory = this.memorySystem;
            this.npc.needs = this.needsSystem;
            this.npc.reasoningLoop = this.reasoningLoop;
            
            // NPC action and response systems
            this.npcActionSystem = new NPCActionSystem(
                this.npc,
                this.grabSystem,
                this.ikSystem,
                this.weaponSystem
            );
            this.npcResponseSystem = new NPCResponseSystem(
                this.ollamaService,
                this.emotionSystem,
                this.memorySystem,
                this.needsSystem,
                this.visionSystem
            );
            
            // UI systems
            this.bubbleManager = new BubbleManager();
            this.internalMonologuePanel = new InternalMonologuePanel();
            this.chatHistoryPanel = new ChatHistoryPanel();
            this.workspaceDebugPanel = new WorkspaceDebugPanel();
            this.workspaceDebugPanel.setWorkspace(this.globalWorkspace);
            this.workspaceDebugPanel.setAttentionSystem(this.attentionSystem);
            this.workspaceDebugPanel.setConfidenceSystem(this.confidenceSystem);
            this.chatSystem = new ChatSystem(
                this.inputHandler,
                this.bubbleManager,
                this.chatHistoryPanel,
                this.npcResponseSystem,
                this.playerIdentity
            );
        } catch (error) {
            errorHandler.logError(error, 'AIPlayground:initializeSystems');
            errorHandler.displayError('Failed to initialize game systems. Please refresh the page.');
            throw error;
        }
    }

    /**
     * Wire up dependencies between systems
     */
    wireSystemDependencies() {
        // Connect pain sensors to blood system
        this.engine.events.on('damage:applied', (data) => {
            this.bloodSystem.onDamage(data.character, data.bodyPart, data.damage, data.position);
        });
        
        // Connect health systems to emotion systems
        this.engine.events.on('health:critical', (data) => {
            if (data.character === this.npc) {
                this.emotionSystem.trigger('fear', 0.8);
            }
        });
        
        // Connect reasoning loop to internal monologue
        this.engine.events.on('thought:generated', (thought) => {
            this.internalMonologuePanel.addThought(thought);
        });
        
        // Connect chat to NPC memory
        this.engine.events.on('chat:message', (data) => {
            if (data.sender === 'player') {
                this.memorySystem.record({
                    type: 'conversation',
                    content: data.message,
                    speaker: this.playerIdentity.getName(),
                    emotion: 'neutral',
                    importance: 0.8
                });
            }
        });
        
        // Connect weapon hits to pain sensors
        this.engine.events.on('weapon:hit', (data) => {
            if (data.target === this.player) {
                this.playerPain.registerPain(data.damage, data.bodyPart, data.damageType);
            } else if (data.target === this.npc) {
                this.npcPain.registerPain(data.damage, data.bodyPart, data.damageType);
            }
        });
        
        // Connect consumption to needs
        this.engine.events.on('consumable:eaten', (data) => {
            this.consumptionSystem.consume(data.consumable, this.npc);
        });
    }

    /**
     * Setup event listeners for user input
     */
    setupEventListeners() {
        // Pause/resume
        this.inputHandler.onKeyPress('KeyP', () => {
            this.togglePause();
        });
        
        // Help overlay
        this.inputHandler.onKeyPress('F1', () => {
            this.helpOverlay.toggle();
        });
        
        // Debug UI
        this.inputHandler.onKeyPress('F3', () => {
            this.debugUI.toggle();
        });
        
        // Internal monologue panel
        this.inputHandler.onKeyPress('KeyM', () => {
            this.internalMonologuePanel.toggle();
        });
        
        // Workspace debug panel
        this.inputHandler.onKeyPress('KeyW', () => {
            this.workspaceDebugPanel.toggle();
        });
    }

    /**
     * Toggle pause state
     */
    togglePause() {
        this.paused = !this.paused;
        if (this.paused) {
            this.engine.stop();
        } else {
            this.engine.start();
        }
    }

    /**
     * Update all systems (called by game engine)
     */
    update(dt) {
        if (this.paused) return;
        
        const currentTime = Date.now();
        
        // Update input
        this.inputHandler.update(dt);
        
        // Update player control
        this.handControlSystem.update(dt);
        this.locomotionSystem.update(this.player, this.inputHandler, dt);
        
        // Update physics
        this.player.update(dt);
        this.npc.update(dt);
        this.objectManager.update(dt);
        
        // Update collision detection
        this.collisionSystem.update(dt);
        
        // Update grab system
        this.grabSystem.update(dt);
        
        // Update weapon system
        this.weaponSystem.update(dt);
        
        // Update health and pain
        this.playerHealth.update(dt);
        this.npcHealth.update(dt);
        this.playerPain.update(dt);
        this.npcPain.update(dt);
        this.bloodSystem.update(dt);
        
        // Update AI systems (NPC only) - with error handling
        try {
            this.visionSystem.update(this.npc, this.getAllEntities(), currentTime);
            this.emotionSystem.update(dt);
            this.needsSystem.update(dt);
            this.consumptionSystem.update(this.npc, this.objectManager.getObjects(), dt);
            
            // Update workspace adapters (submit content to workspace)
            this.visionAdapter.update(currentTime);
            this.emotionAdapter.update(currentTime);
            this.needsAdapter.update(currentTime);
            
            // Build context for memory adapter
            const memoryContext = {
                visibleObjects: this.visionSystem.getVisibleEntities().map(e => e.type || e.name || 'unknown'),
                emotionalState: this.emotionSystem.getEmotionalStateDescription(),
                needsDescription: this.needsSystem.getNeedsDescription()
            };
            this.memoryAdapter.update(memoryContext, currentTime);
            
            // Update global workspace (apply decay, broadcast)
            this.globalWorkspace.update(currentTime, dt);
            
            // Update attention system (Phase 1.2)
            this.attentionSystem.update(currentTime, dt);
            
            // Update confidence system (Phase 1.3)
            this.confidenceSystem.update(dt);
            
            // Update goal hierarchy (Phase 1.4)
            this.goalHierarchy.update(dt);
            this.updateGoalsFromNeeds();
            
            // Update belief system (Phase 2.1)
            this.beliefSystem.update(dt);
            this.updateBeliefsFromObservations();
            
            // Update world model (Phase 2.2)
            this.worldModel.update(dt);
            this.updateWorldModelPredictions(currentTime);
            
            // Update executive control (Phase 2.3)
            this.executiveControl.update(dt, currentTime);
            this.updateExecutiveControl(currentTime);
            
            // Update consistency engine (Phase 2.4)
            this.consistencyEngine.update(dt);
            this.updateConsistencyEngine();
            
            // Update temporal reasoning (Phase 2.5)
            this.temporalReasoning.update(dt);
            this.updateTemporalReasoning();
            
            // Update theory of mind (Phase 3.1)
            this.theoryOfMind.update(dt);
            this.updateTheoryOfMind();
            
            // Update value core (Phase 3.2)
            this.valueCore.update(dt);
            
            // Update curiosity system (Phase 3.3)
            this.curiositySystem.update(dt);
            this.updateCuriositySystem();
            
            // Update AI cognitive systems
            this.reasoningLoop.update(this.npc, currentTime);
            this.npcActionSystem.update(dt);
        } catch (aiError) {
            errorHandler.logError(aiError, 'AIPlayground:update:ai-systems');
            // AI systems can fail gracefully - game continues
        }
        
        // Update UI systems
        this.bubbleManager.update(dt);
        this.chatSystem.update(dt);
        this.spawnMenu.update(dt);
        this.internalMonologuePanel.update(dt);
        this.workspaceDebugPanel.update(dt);
    }

    /**
     * Render all systems (called by game engine)
     */
    render(ctx) {
        try {
            // Render game objects
            this.objectManager.render(ctx);
            
            // Render blood
            this.bloodSystem.render(ctx);
            
            // Render characters
            this.player.render(ctx);
            this.npc.render(ctx);
            
            // Render health indicators
            this.playerHealth.render(ctx, this.player);
            this.npcHealth.render(ctx, this.npc);
            
            // Render weapon effects
            this.weaponSystem.render(ctx);
            
            // Render vision debug (if enabled)
            if (this.debugUI.isEnabled()) {
                this.visionSystem.renderDebug(ctx, this.npc);
            }
            
            // Render UI
            this.bubbleManager.render(ctx);
            this.spawnMenu.render(ctx);
            this.chatSystem.render(ctx);
            this.internalMonologuePanel.render(ctx);
            this.chatHistoryPanel.render(ctx);
            this.workspaceDebugPanel.render(ctx);
            this.helpOverlay.render(ctx);
            this.debugUI.render(ctx, this.engine.getFPS());
        } catch (error) {
            errorHandler.logError(error, 'AIPlayground:render');
            // Rendering error - try to continue
        }
    }

    /**
     * Update executive control system
     * Monitors conflicts and selects strategies
     */
    updateExecutiveControl(currentTime) {
        // Build context for executive control
        const context = {
            health: this.npcHealth.getHealth(),
            hunger: this.needsSystem.getNeeds().hunger,
            thirst: this.needsSystem.getNeeds().thirst,
            energy: this.needsSystem.getNeeds().energy,
            threatLevel: this.calculateThreatLevel(),
            socialContext: this.determineSocialContext(),
            socialOpportunity: this.hasSocialOpportunity(),
            goals: this.goalHierarchy.getActiveGoals(),
            beliefs: this.beliefSystem.getAllBeliefs(),
            plannedAction: this.npcActionSystem.getCurrentAction()
        };
        
        // Select appropriate strategy
        this.executiveControl.selectStrategy(context);
        
        // Monitor for conflicts
        const conflicts = this.executiveControl.monitorConflicts(context);
        
        // Resolve conflicts if any
        for (const conflict of conflicts) {
            const resolution = this.executiveControl.resolveConflict(conflict, context);
            
            // Apply resolution
            if (resolution.resolution === 'switch_strategy') {
                this.executiveControl.selectStrategy(context);
            }
        }
    }

    /**
     * Update consistency engine system
     * Checks and repairs inconsistencies in mental state
     */
    updateConsistencyEngine() {
        // Build mental state for consistency checking
        const state = {
            beliefs: this.beliefSystem.getAllBeliefs(),
            goals: this.goalHierarchy.getActiveGoals(),
            plannedAction: this.npcActionSystem.getCurrentAction()
        };
        
        // Check for inconsistencies
        const result = this.consistencyEngine.checkConsistency(state);
        
        // Repair if needed
        if (result.needsRepair || result.inconsistencies.length > 0) {
            this.consistencyEngine.repairInconsistencies(state);
        }
    }

    /**
     * Update temporal reasoning system
     * Records events and manages temporal sequences
     */
    updateTemporalReasoning() {
        // Record significant events
        const currentAction = this.npcActionSystem.getCurrentAction();
        if (currentAction && !this.lastRecordedAction) {
            this.temporalReasoning.recordEvent({
                type: 'action_start',
                action: currentAction,
                context: {
                    health: this.npcHealth.getHealth(),
                    needs: this.needsSystem.getNeeds()
                }
            });
            this.lastRecordedAction = currentAction;
        } else if (!currentAction && this.lastRecordedAction) {
            this.temporalReasoning.recordEvent({
                type: 'action_end',
                action: this.lastRecordedAction
            });
            this.lastRecordedAction = null;
        }
        
        // Check temporal consistency of beliefs
        const beliefs = this.beliefSystem.getAllBeliefs();
        const temporalCheck = this.temporalReasoning.checkTemporalConsistency(beliefs);
        
        if (!temporalCheck.consistent) {
            // Log temporal inconsistencies for awareness
            for (const inconsistency of temporalCheck.inconsistencies) {
                console.log('Temporal inconsistency detected:', inconsistency.reason);
            }
        }
    }

    /**
     * Update Theory of Mind system (Phase 3.1)
     */
    updateTheoryOfMind() {
        const visibleEntities = this.visionSystem.getVisibleEntities();
        
        // Model visible agents
        for (const entity of visibleEntities) {
            if (entity.name === 'player' || entity.type === 'character') {
                this.theoryOfMind.modelAgent(entity.id || entity.name, {
                    position: entity.position,
                    type: entity.type
                });
                
                // Infer intentions from behavior
                if (entity.velocity && entity.velocity.length() > 0.1) {
                    const intention = this.theoryOfMind.inferIntention(
                        entity.id || entity.name,
                        'moving'
                    );
                }
            }
        }
        
        // Record interactions
        const recentMemories = this.memorySystem.getRecentMemories(1);
        if (recentMemories.length > 0) {
            const memory = recentMemories[0];
            if (memory.type === 'conversation' || memory.type === 'interaction') {
                this.theoryOfMind.recordInteraction('player', {
                    type: memory.type,
                    outcome: memory.emotion || 'neutral'
                });
            }
        }
    }

    /**
     * Update Curiosity System (Phase 3.3)
     */
    updateCuriositySystem() {
        const visibleEntities = this.visionSystem.getVisibleEntities();
        
        // Observe visible entities
        const recentObservations = [];
        for (const entity of visibleEntities) {
            const entityId = entity.id || entity.name || entity.type;
            const result = this.curiositySystem.observe(entityId, {
                type: entity.type,
                position: entity.position
            });
            recentObservations.push({ entityId });
        }
        
        // Calculate boredom
        const boredom = this.curiositySystem.calculateBoredom(recentObservations);
        
        // Generate exploration goals if bored
        if (boredom > 0.7) {
            const environment = {
                entities: visibleEntities.map(e => ({
                    id: e.id || e.name || e.type,
                    position: e.position
                })),
                locations: []
            };
            
            const explorationGoal = this.curiositySystem.generateExplorationGoal(environment);
            if (explorationGoal) {
                // Add to goal hierarchy
                this.goalHierarchy.addGoal({
                    id: explorationGoal.id,
                    type: 'EXPLORATION',
                    description: `Explore ${explorationGoal.target.id}`,
                    priority: 0.5,
                    level: 'EXPLORATION'
                });
            }
        }
    }

    /**
     * Calculate current threat level
     * @returns {number} Threat level (0-1)
     */
    calculateThreatLevel() {
        const threats = this.identifyThreats();
        
        if (threats.length === 0) return 0;
        
        // Calculate based on closest threat
        const closestThreat = threats.reduce((closest, threat) =>
            threat.distance < closest.distance ? threat : closest
        );
        
        // Threat level increases as distance decreases
        const maxDistance = 200;
        const distanceFactor = 1.0 - Math.min(closestThreat.distance / maxDistance, 1.0);
        
        // Hazards are more threatening
        const typeFactor = closestThreat.type === 'weapon' ? 0.7 : 1.0;
        
        return distanceFactor * typeFactor;
    }

    /**
     * Determine social context
     * @returns {string} Social context
     */
    determineSocialContext() {
        const visibleEntities = this.visionSystem.getVisibleEntities();
        const player = visibleEntities.find(e => e.name === 'player');
        
        if (!player) return 'alone';
        
        // Check relationship based on recent interactions
        const recentMemories = this.memorySystem.getRecentMemories(5);
        const hostileMemories = recentMemories.filter(m => 
            m.type === 'damage' || m.emotion === 'fear' || m.emotion === 'anger'
        );
        
        if (hostileMemories.length > 2) return 'hostile';
        
        const friendlyMemories = recentMemories.filter(m =>
            m.type === 'conversation' || m.emotion === 'joy'
        );
        
        if (friendlyMemories.length > 2) return 'friendly';
        
        return 'neutral';
    }

    /**
     * Check if social opportunity exists
     * @returns {boolean} True if opportunity exists
     */
    hasSocialOpportunity() {
        const visibleEntities = this.visionSystem.getVisibleEntities();
        const player = visibleEntities.find(e => e.name === 'player');
        
        if (!player) return false;
        
        // Opportunity exists if player is nearby and not threatening
        const distance = this.calculateDistance(this.npc, player);
        const threatLevel = this.calculateThreatLevel();
        
        return distance < 150 && threatLevel < 0.3;
    }

    /**
     * Update world model predictions
     * Submits predictions to workspace based on current context
     */
    updateWorldModelPredictions(currentTime) {
        // Build context for world model
        const context = {
            activeGoals: this.goalHierarchy.getActiveGoals(),
            threats: this.identifyThreats(),
            opportunities: this.identifyOpportunities(),
            currentState: this.buildCurrentState()
        };
        
        // Update world model adapter
        this.worldModelAdapter.update(context, currentTime);
        
        // Clean old predictions
        this.worldModelAdapter.clearOldPredictions();
    }

    /**
     * Identify threats in environment
     * @returns {Array} List of threats
     */
    identifyThreats() {
        const threats = [];
        const visibleEntities = this.visionSystem.getVisibleEntities();
        
        for (const entity of visibleEntities) {
            // Check for hazards
            if (entity.hazardType) {
                threats.push({
                    type: entity.hazardType,
                    entity: entity,
                    distance: this.calculateDistance(this.npc, entity)
                });
            }
            
            // Check for weapons
            if (entity.isWeapon && entity.heldBy && entity.heldBy !== this.npc) {
                threats.push({
                    type: 'weapon',
                    entity: entity,
                    distance: this.calculateDistance(this.npc, entity)
                });
            }
            
            // Check for hostile entities
            if (entity.name === 'player' && this.npcHealth.getHealth() < 50) {
                threats.push({
                    type: 'entity',
                    entity: entity,
                    distance: this.calculateDistance(this.npc, entity)
                });
            }
        }
        
        return threats;
    }

    /**
     * Identify opportunities in environment
     * @returns {Array} List of opportunities
     */
    identifyOpportunities() {
        const opportunities = [];
        const visibleEntities = this.visionSystem.getVisibleEntities();
        const needs = this.needsSystem.getNeeds();
        
        for (const entity of visibleEntities) {
            // Check for food if hungry
            if (needs.hunger < 50 && entity.type === 'food') {
                opportunities.push({
                    type: 'food',
                    entity: entity,
                    distance: this.calculateDistance(this.npc, entity),
                    priority: 1.0 - (needs.hunger / 100)
                });
            }
            
            // Check for water if thirsty
            if (needs.thirst < 50 && entity.type === 'water') {
                opportunities.push({
                    type: 'water',
                    entity: entity,
                    distance: this.calculateDistance(this.npc, entity),
                    priority: 1.0 - (needs.thirst / 100)
                });
            }
            
            // Check for useful objects
            if (entity.type && !entity.isWeapon && !entity.hazardType) {
                opportunities.push({
                    type: entity.type,
                    entity: entity,
                    distance: this.calculateDistance(this.npc, entity),
                    priority: 0.3
                });
            }
        }
        
        return opportunities;
    }

    /**
     * Build current state for world model
     * @returns {Object} Current state
     */
    buildCurrentState() {
        const needs = this.needsSystem.getNeeds();
        const visibleEntities = this.visionSystem.getVisibleEntities();
        
        return {
            hunger: needs.hunger,
            thirst: needs.thirst,
            energy: needs.energy,
            health: this.npcHealth.getHealth(),
            heldObject: this.npc.heldObject || null,
            nearbyObjects: visibleEntities.filter(e => e.type && !e.name),
            nearbyEntities: visibleEntities.filter(e => e.name),
            nearbyHazards: visibleEntities.filter(e => e.hazardType),
            visibleEntities: visibleEntities,
            threats: this.identifyThreats(),
            uncertainty: this.confidenceSystem.getOverallUncertainty()
        };
    }

    /**
     * Calculate distance between two entities
     * @param {Object} entity1 - First entity
     * @param {Object} entity2 - Second entity
     * @returns {number} Distance
     */
    calculateDistance(entity1, entity2) {
        if (!entity1.position || !entity2.position) return Infinity;
        
        const dx = entity1.position.x - entity2.position.x;
        const dy = entity1.position.y - entity2.position.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Update beliefs based on observations
     * Creates beliefs from vision, emotions, and needs
     */
    updateBeliefsFromObservations() {
        // Create beliefs from vision
        const visibleEntities = this.visionSystem.getVisibleEntities();
        for (const entity of visibleEntities) {
            const entityType = entity.type || entity.name || 'unknown';
            const beliefContent = `I see a ${entityType}`;
            
            this.beliefSystem.addBelief({
                content: beliefContent,
                category: this.beliefSystem.categories.PERCEPTION,
                strength: 0.9,
                evidence: ['direct observation'],
                context: { entity, timestamp: Date.now() }
            });
        }
        
        // Create beliefs from emotions
        const emotions = this.emotionSystem.getEmotions();
        for (const [emotion, intensity] of Object.entries(emotions)) {
            if (intensity > 0.5) {
                const beliefContent = `I am feeling ${emotion}`;
                
                this.beliefSystem.addBelief({
                    content: beliefContent,
                    category: this.beliefSystem.categories.PERCEPTION,
                    strength: intensity,
                    evidence: ['emotional state'],
                    context: { emotion, intensity }
                });
            }
        }
        
        // Create beliefs from needs
        const needs = this.needsSystem.getNeeds();
        if (needs.hunger < 50) {
            this.beliefSystem.addBelief({
                content: 'I am hungry',
                category: this.beliefSystem.categories.PERCEPTION,
                strength: 1.0 - (needs.hunger / 100),
                evidence: ['internal state'],
                context: { need: 'hunger', value: needs.hunger }
            });
        }
        
        if (needs.thirst < 50) {
            this.beliefSystem.addBelief({
                content: 'I am thirsty',
                category: this.beliefSystem.categories.PERCEPTION,
                strength: 1.0 - (needs.thirst / 100),
                evidence: ['internal state'],
                context: { need: 'thirst', value: needs.thirst }
            });
        }
    }

    /**
     * Update goals based on current needs
     * Creates survival goals when needs are low
     */
    updateGoalsFromNeeds() {
        const needs = this.needsSystem.getNeeds();
        
        // Create hunger goal if needed
        if (needs.hunger < 50 && !this.hasActiveGoal('satisfy_hunger')) {
            this.goalHierarchy.createGoal({
                name: 'Satisfy Hunger',
                level: 'SURVIVAL',
                priority: 1.0 - (needs.hunger / 100),
                condition: () => this.needsSystem.getNeeds().hunger > 70,
                context: {
                    type: 'satisfy_hunger',
                    needType: 'hunger',
                    currentValue: needs.hunger,
                    action: 'seek_food'
                }
            });
        }
        
        // Create thirst goal if needed
        if (needs.thirst < 50 && !this.hasActiveGoal('satisfy_thirst')) {
            this.goalHierarchy.createGoal({
                name: 'Satisfy Thirst',
                level: 'SURVIVAL',
                priority: 1.0 - (needs.thirst / 100),
                condition: () => this.needsSystem.getNeeds().thirst > 70,
                context: {
                    type: 'satisfy_thirst',
                    needType: 'thirst',
                    currentValue: needs.thirst,
                    action: 'seek_water'
                }
            });
        }
        
        // Create rest goal if needed
        if (needs.energy < 30 && !this.hasActiveGoal('rest')) {
            this.goalHierarchy.createGoal({
                name: 'Rest',
                level: 'SURVIVAL',
                priority: 1.0 - (needs.energy / 100),
                condition: () => this.needsSystem.getNeeds().energy > 60,
                context: {
                    type: 'rest',
                    needType: 'energy',
                    currentValue: needs.energy,
                    action: 'rest'
                }
            });
        }
        
        // Sync active goals with attention system
        const activeGoals = this.goalHierarchy.getActiveGoals();
        const attentionGoals = activeGoals.map(goal => ({
            type: goal.context.type,
            priority: goal.importance,
            keywords: [goal.context.needType, goal.context.action]
        }));
        
        this.attentionSystem.setGoals(attentionGoals);
    }

    /**
     * Check if a goal type is active
     * @param {string} goalType - Goal type to check
     * @returns {boolean} True if active
     */
    hasActiveGoal(goalType) {
        const activeGoals = this.goalHierarchy.getActiveGoals();
        return activeGoals.some(goal => goal.context.type === goalType);
    }

    /**
     * Get all entities for collision/vision detection
     */
    getAllEntities() {
        return [
            ...this.objectManager.getObjects(),
            this.player,
            this.npc
        ];
    }

    /**
     * Start the game
     */
    start() {
        try {
            // Register this as the main system
            this.engine.registerSystem(this);
            
            // Show help overlay on start
            this.helpOverlay.show();
            
            // Prompt for player name
            this.playerIdentity.promptForName();
            
            // Start the engine
            this.engine.start();
            
            console.log('AI Playground initialized successfully!');
            console.log('All systems wired and running');
        } catch (error) {
            errorHandler.logError(error, 'AIPlayground:start');
            errorHandler.displayError('Failed to start game. Please refresh the page.');
        }
    }
}

// Initialize game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    try {
        const canvas = document.getElementById('gameCanvas');
        
        if (!canvas) {
            errorHandler.displayError('Canvas element not found! Please check your HTML.');
            console.error('Canvas element not found!');
            return;
        }

        // Create and start the game
        const game = new AIPlayground(canvas);
        game.start();
    } catch (error) {
        errorHandler.logError(error, 'main:initialization');
        errorHandler.displayError('Failed to initialize game. Please refresh the page.');
    }
});
