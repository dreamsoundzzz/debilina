/**
 * CuriositySystem.js
 * 
 * Phase 3.3: Curiosity Drive
 * 
 * Provides intrinsic motivation for exploration and learning.
 * Calculates information gain, detects novelty, and generates curiosity-driven goals.
 * 
 * Based on:
 * - Curiosity-Driven Learning (Schmidhuber, 2010)
 * - Information Theory (Shannon, 1948)
 * - Intrinsic Motivation (Oudeyer & Kaplan, 2007)
 */

export class CuriositySystem {
    constructor() {
        // Familiarity tracking
        this.familiarityMap = new Map(); // entity/location -> familiarity score (0-1)
        this.maxFamiliarityEntries = 200;
        
        // Novelty detection
        this.noveltyThreshold = 0.7; // Above this = novel
        this.noveltyHistory = [];
        this.maxNoveltyHistory = 50;
        
        // Information gain tracking
        this.informationGainHistory = [];
        this.maxInfoGainHistory = 50;
        
        // Surprise detection
        this.surpriseEvents = [];
        this.maxSurpriseHistory = 30;
        this.surpriseThreshold = 0.6;
        
        // Exploration state
        this.explorationGoals = [];
        this.maxExplorationGoals = 5;
        this.boredomThreshold = 0.7;
        this.currentBoredom = 0;
        
        // Learning motivation
        this.learningRewards = [];
        this.maxLearningHistory = 50;
        
        // Statistics
        this.stats = {
            totalObservations: 0,
            novelObservations: 0,
            surpriseEvents: 0,
            explorationGoalsGenerated: 0,
            informationGained: 0
        };
    }
    
    /**
     * Observe entity or location and update familiarity
     */
    observe(entityId, properties = {}) {
        const currentFamiliarity = this.familiarityMap.get(entityId) || 0;
        
        // Increase familiarity with each observation (asymptotic approach to 1.0)
        const newFamiliarity = currentFamiliarity + (1 - currentFamiliarity) * 0.1;
        this.familiarityMap.set(entityId, newFamiliarity);
        
        // Trim map if too large
        if (this.familiarityMap.size > this.maxFamiliarityEntries) {
            const entries = Array.from(this.familiarityMap.entries());
            entries.sort((a, b) => b[1] - a[1]); // Sort by familiarity
            this.familiarityMap = new Map(entries.slice(0, this.maxFamiliarityEntries));
        }
        
        this.stats.totalObservations++;
        
        // Calculate novelty
        const novelty = 1 - currentFamiliarity;
        
        // Record if novel
        if (novelty >= this.noveltyThreshold) {
            this.recordNovelty(entityId, novelty, properties);
            this.stats.novelObservations++;
        }
        
        return {
            entityId,
            familiarity: newFamiliarity,
            novelty,
            isNovel: novelty >= this.noveltyThreshold
        };
    }
    
    /**
     * Calculate novelty of entity
     */
    calculateNovelty(entityId) {
        const familiarity = this.familiarityMap.get(entityId) || 0;
        return 1 - familiarity;
    }
    
    /**
     * Calculate information gain from observation
     */
    calculateInformationGain(observation, priorKnowledge = {}) {
        const { entityId, properties = {} } = observation;
        const { expectedProperties = {} } = priorKnowledge;
        
        // Count unexpected properties
        let unexpectedCount = 0;
        let totalProperties = 0;
        
        for (const [key, value] of Object.entries(properties)) {
            totalProperties++;
            if (!(key in expectedProperties) || expectedProperties[key] !== value) {
                unexpectedCount++;
            }
        }
        
        // Information gain is proportion of unexpected information
        const informationGain = totalProperties > 0 ? unexpectedCount / totalProperties : 0;
        
        // Record information gain
        this.recordInformationGain(entityId, informationGain);
        this.stats.informationGained += informationGain;
        
        return {
            informationGain,
            unexpectedProperties: unexpectedCount,
            totalProperties,
            isInformative: informationGain > 0.5
        };
    }
    
    /**
     * Detect surprise when prediction fails
     */
    detectSurprise(prediction, actualOutcome) {
        const { expectedState, confidence } = prediction;
        const { actualState } = actualOutcome;
        
        // Calculate prediction error
        let errorCount = 0;
        let totalPredictions = 0;
        
        for (const [key, expectedValue] of Object.entries(expectedState)) {
            totalPredictions++;
            if (actualState[key] !== expectedValue) {
                errorCount++;
            }
        }
        
        const predictionError = totalPredictions > 0 ? errorCount / totalPredictions : 0;
        
        // Surprise is high when confident prediction fails
        const surprise = predictionError * confidence;
        
        if (surprise >= this.surpriseThreshold) {
            this.recordSurprise(prediction, actualOutcome, surprise);
            this.stats.surpriseEvents++;
        }
        
        return {
            surprise,
            predictionError,
            confidence,
            isSurprising: surprise >= this.surpriseThreshold
        };
    }
    
    /**
     * Calculate current boredom level
     */
    calculateBoredom(recentObservations = []) {
        if (recentObservations.length === 0) {
            return 0.5; // Neutral
        }
        
        // Boredom increases with high familiarity
        const avgFamiliarity = recentObservations.reduce((sum, obs) => {
            const familiarity = this.familiarityMap.get(obs.entityId) || 0;
            return sum + familiarity;
        }, 0) / recentObservations.length;
        
        this.currentBoredom = avgFamiliarity;
        
        return this.currentBoredom;
    }
    
    /**
     * Generate exploration goal when bored
     */
    generateExplorationGoal(environment = {}) {
        if (this.currentBoredom < this.boredomThreshold) {
            return null; // Not bored enough
        }
        
        if (this.explorationGoals.length >= this.maxExplorationGoals) {
            return null; // Too many goals already
        }
        
        // Find least familiar area or entity
        const { entities = [], locations = [] } = environment;
        
        let leastFamiliar = null;
        let lowestFamiliarity = 1.0;
        
        // Check entities
        for (const entity of entities) {
            const familiarity = this.familiarityMap.get(entity.id) || 0;
            if (familiarity < lowestFamiliarity) {
                lowestFamiliarity = familiarity;
                leastFamiliar = { type: 'entity', target: entity };
            }
        }
        
        // Check locations
        for (const location of locations) {
            const familiarity = this.familiarityMap.get(location.id) || 0;
            if (familiarity < lowestFamiliarity) {
                lowestFamiliarity = familiarity;
                leastFamiliar = { type: 'location', target: location };
            }
        }
        
        if (leastFamiliar) {
            const goal = {
                id: `explore_${Date.now()}`,
                type: 'EXPLORATION',
                target: leastFamiliar.target,
                targetType: leastFamiliar.type,
                motivation: 'curiosity',
                expectedNovelty: 1 - lowestFamiliarity,
                createdAt: Date.now()
            };
            
            this.explorationGoals.push(goal);
            this.stats.explorationGoalsGenerated++;
            
            return goal;
        }
        
        return null;
    }
    
    /**
     * Calculate learning reward
     */
    calculateLearningReward(learningEvent) {
        const { informationGain = 0, novelty = 0, surprise = 0 } = learningEvent;
        
        // Reward is combination of information gain, novelty, and surprise
        const reward = (informationGain * 0.4) + (novelty * 0.3) + (surprise * 0.3);
        
        this.recordLearningReward(learningEvent, reward);
        
        return {
            reward,
            components: { informationGain, novelty, surprise },
            isRewarding: reward > 0.5
        };
    }
    
    /**
     * Get exploration motivation for entity
     */
    getExplorationMotivation(entityId) {
        const novelty = this.calculateNovelty(entityId);
        const hasExplorationGoal = this.explorationGoals.some(g => 
            g.target && g.target.id === entityId
        );
        
        // Motivation is higher for novel entities and active exploration goals
        let motivation = novelty * 0.7;
        if (hasExplorationGoal) {
            motivation += 0.3;
        }
        
        return Math.min(1.0, motivation);
    }
    
    /**
     * Record novelty observation
     */
    recordNovelty(entityId, novelty, properties) {
        this.noveltyHistory.push({
            entityId,
            novelty,
            properties,
            timestamp: Date.now()
        });
        
        if (this.noveltyHistory.length > this.maxNoveltyHistory) {
            this.noveltyHistory.shift();
        }
    }
    
    /**
     * Record information gain
     */
    recordInformationGain(entityId, gain) {
        this.informationGainHistory.push({
            entityId,
            gain,
            timestamp: Date.now()
        });
        
        if (this.informationGainHistory.length > this.maxInfoGainHistory) {
            this.informationGainHistory.shift();
        }
    }
    
    /**
     * Record surprise event
     */
    recordSurprise(prediction, outcome, surprise) {
        this.surpriseEvents.push({
            prediction,
            outcome,
            surprise,
            timestamp: Date.now()
        });
        
        if (this.surpriseEvents.length > this.maxSurpriseHistory) {
            this.surpriseEvents.shift();
        }
    }
    
    /**
     * Record learning reward
     */
    recordLearningReward(event, reward) {
        this.learningRewards.push({
            event,
            reward,
            timestamp: Date.now()
        });
        
        if (this.learningRewards.length > this.maxLearningHistory) {
            this.learningRewards.shift();
        }
    }
    
    /**
     * Get familiarity of entity
     */
    getFamiliarity(entityId) {
        return this.familiarityMap.get(entityId) || 0;
    }
    
    /**
     * Get all exploration goals
     */
    getExplorationGoals() {
        return [...this.explorationGoals];
    }
    
    /**
     * Complete exploration goal
     */
    completeExplorationGoal(goalId) {
        const index = this.explorationGoals.findIndex(g => g.id === goalId);
        if (index !== -1) {
            this.explorationGoals.splice(index, 1);
            return true;
        }
        return false;
    }
    
    /**
     * Get statistics
     */
    getStatistics() {
        const noveltyRate = this.stats.totalObservations > 0
            ? this.stats.novelObservations / this.stats.totalObservations
            : 0;
        
        const avgInformationGain = this.informationGainHistory.length > 0
            ? this.informationGainHistory.reduce((sum, h) => sum + h.gain, 0) / this.informationGainHistory.length
            : 0;
        
        return {
            ...this.stats,
            noveltyRate,
            avgInformationGain,
            currentBoredom: this.currentBoredom,
            activeExplorationGoals: this.explorationGoals.length,
            familiarEntities: this.familiarityMap.size
        };
    }
    
    /**
     * Update (called each frame)
     */
    update(dt) {
        // Decay boredom slightly over time
        this.currentBoredom = Math.max(0, this.currentBoredom - dt * 0.01);
        
        // Remove old exploration goals (older than 30 seconds)
        const now = Date.now();
        this.explorationGoals = this.explorationGoals.filter(g => 
            now - g.createdAt < 30000
        );
    }
}
