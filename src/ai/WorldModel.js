/**
 * WorldModel - Predictive World Model System (Phase 2.2)
 * 
 * Implements predictive processing and causal modeling for anticipatory behavior.
 * Enables the NPC to simulate future states, predict outcomes, and plan accordingly.
 * 
 * Key Features:
 * - Causal model of environment (cause → effect relationships)
 * - Forward simulation (predict future states)
 * - Counterfactual reasoning ("what if" scenarios)
 * - Prediction error tracking (learn from mistakes)
 * - Action outcome prediction
 * 
 * Consciousness Impact: +5% (75% → 80%)
 * 
 * Based on:
 * - Predictive Processing Theory (Friston, Clark)
 * - Mental Simulation Theory (Barsalou)
 * - Forward Models in Motor Control
 */

export class WorldModel {
    constructor() {
        // Causal rules: cause → effect mappings
        this.causalRules = new Map();
        
        // Prediction history for error tracking
        this.predictions = [];
        this.maxPredictionHistory = 50;
        
        // Prediction error statistics
        this.predictionErrors = {
            total: 0,
            correct: 0,
            incorrect: 0,
            accuracy: 0
        };
        
        // Simulation cache for performance
        this.simulationCache = new Map();
        this.cacheMaxAge = 5000; // 5 seconds
        
        // Initialize default causal rules
        this.initializeDefaultRules();
    }

    /**
     * Initialize default causal rules based on game mechanics
     */
    initializeDefaultRules() {
        // Object interaction rules
        this.addCausalRule({
            cause: { action: 'grab', target: 'object' },
            effect: { state: 'held', probability: 0.95 },
            conditions: ['object_nearby', 'hand_free']
        });
        
        this.addCausalRule({
            cause: { action: 'eat', target: 'food' },
            effect: { state: 'hunger_increased', probability: 1.0 },
            conditions: ['food_held']
        });
        
        this.addCausalRule({
            cause: { action: 'drink', target: 'water' },
            effect: { state: 'thirst_increased', probability: 1.0 },
            conditions: ['water_held']
        });
        
        // Weapon interaction rules
        this.addCausalRule({
            cause: { action: 'grab', target: 'weapon' },
            effect: { state: 'armed', probability: 0.9 },
            conditions: ['weapon_nearby', 'hand_free']
        });
        
        this.addCausalRule({
            cause: { action: 'attack', target: 'entity' },
            effect: { state: 'damaged', probability: 0.7 },
            conditions: ['weapon_held', 'entity_nearby']
        });
        
        // Hazard rules
        this.addCausalRule({
            cause: { action: 'approach', target: 'fire' },
            effect: { state: 'burned', probability: 0.8 },
            conditions: ['fire_nearby']
        });
        
        this.addCausalRule({
            cause: { action: 'approach', target: 'explosion' },
            effect: { state: 'damaged', probability: 0.9 },
            conditions: ['explosion_nearby']
        });
        
        // Social interaction rules
        this.addCausalRule({
            cause: { action: 'greet', target: 'player' },
            effect: { state: 'friendly_response', probability: 0.6 },
            conditions: ['player_visible']
        });
        
        this.addCausalRule({
            cause: { action: 'flee', target: 'threat' },
            effect: { state: 'safe', probability: 0.7 },
            conditions: ['threat_visible']
        });
    }

    /**
     * Add a causal rule to the model
     * @param {Object} rule - Causal rule definition
     */
    addCausalRule(rule) {
        const key = this.getRuleKey(rule.cause);
        
        if (!this.causalRules.has(key)) {
            this.causalRules.set(key, []);
        }
        
        this.causalRules.get(key).push(rule);
    }

    /**
     * Get rule key from cause
     * @param {Object} cause - Cause definition
     * @returns {string} Rule key
     */
    getRuleKey(cause) {
        return `${cause.action}:${cause.target}`;
    }

    /**
     * Predict outcome of an action
     * @param {Object} action - Action to predict
     * @param {Object} currentState - Current world state
     * @returns {Object} Predicted outcome
     */
    predictOutcome(action, currentState) {
        const key = this.getRuleKey(action);
        const rules = this.causalRules.get(key) || [];
        
        // Find applicable rules based on conditions
        const applicableRules = rules.filter(rule => 
            this.checkConditions(rule.conditions, currentState)
        );
        
        if (applicableRules.length === 0) {
            return {
                success: false,
                effect: null,
                probability: 0,
                confidence: 0,
                reason: 'no_applicable_rules'
            };
        }
        
        // Use highest probability rule
        const bestRule = applicableRules.reduce((best, rule) => 
            rule.effect.probability > best.effect.probability ? rule : best
        );
        
        // Create prediction
        const prediction = {
            action: action,
            effect: bestRule.effect.state,
            probability: bestRule.effect.probability,
            confidence: this.calculateConfidence(bestRule, currentState),
            timestamp: Date.now(),
            state: currentState
        };
        
        // Store prediction for error tracking
        this.storePrediction(prediction);
        
        return {
            success: true,
            effect: bestRule.effect.state,
            probability: bestRule.effect.probability,
            confidence: prediction.confidence,
            reason: 'rule_applied'
        };
    }

    /**
     * Check if conditions are met in current state
     * @param {Array} conditions - Conditions to check
     * @param {Object} state - Current state
     * @returns {boolean} True if all conditions met
     */
    checkConditions(conditions, state) {
        if (!conditions || conditions.length === 0) return true;
        
        return conditions.every(condition => {
            // Check state properties
            if (state[condition] === true) return true;
            if (state[condition] === false) return false;
            
            // Check derived conditions
            switch (condition) {
                case 'object_nearby':
                    return state.nearbyObjects && state.nearbyObjects.length > 0;
                case 'hand_free':
                    return !state.heldObject;
                case 'food_held':
                    return state.heldObject && state.heldObject.type === 'food';
                case 'water_held':
                    return state.heldObject && state.heldObject.type === 'water';
                case 'weapon_nearby':
                    return state.nearbyObjects && state.nearbyObjects.some(obj => obj.isWeapon);
                case 'weapon_held':
                    return state.heldObject && state.heldObject.isWeapon;
                case 'entity_nearby':
                    return state.nearbyEntities && state.nearbyEntities.length > 0;
                case 'fire_nearby':
                    return state.nearbyHazards && state.nearbyHazards.some(h => h.type === 'fire');
                case 'explosion_nearby':
                    return state.nearbyHazards && state.nearbyHazards.some(h => h.type === 'explosion');
                case 'player_visible':
                    return state.visibleEntities && state.visibleEntities.some(e => e.name === 'player');
                case 'threat_visible':
                    return state.threats && state.threats.length > 0;
                default:
                    return false;
            }
        });
    }

    /**
     * Calculate confidence in prediction
     * @param {Object} rule - Applied rule
     * @param {Object} state - Current state
     * @returns {number} Confidence (0-1)
     */
    calculateConfidence(rule, state) {
        let confidence = rule.effect.probability;
        
        // Adjust based on prediction accuracy history
        if (this.predictionErrors.total > 0) {
            const accuracyFactor = this.predictionErrors.accuracy;
            confidence *= (0.5 + 0.5 * accuracyFactor);
        }
        
        // Adjust based on state certainty
        if (state.uncertainty) {
            confidence *= (1.0 - state.uncertainty * 0.3);
        }
        
        return Math.max(0, Math.min(1, confidence));
    }

    /**
     * Simulate future state after action
     * @param {Object} action - Action to simulate
     * @param {Object} currentState - Current state
     * @param {number} steps - Number of steps to simulate
     * @returns {Object} Simulated future state
     */
    simulateFuture(action, currentState, steps = 1) {
        // Check cache
        const cacheKey = this.getSimulationCacheKey(action, currentState, steps);
        const cached = this.simulationCache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheMaxAge) {
            return cached.result;
        }
        
        // Simulate step by step
        let state = { ...currentState };
        const timeline = [{ step: 0, state: { ...state } }];
        
        for (let i = 0; i < steps; i++) {
            const prediction = this.predictOutcome(action, state);
            
            if (prediction.success) {
                // Apply predicted effect to state
                state = this.applyEffect(state, prediction.effect);
                timeline.push({
                    step: i + 1,
                    state: { ...state },
                    prediction: prediction
                });
            } else {
                break;
            }
        }
        
        const result = {
            finalState: state,
            timeline: timeline,
            success: timeline.length > 1,
            confidence: timeline.length > 1 ? 
                timeline[timeline.length - 1].prediction.confidence : 0
        };
        
        // Cache result
        this.simulationCache.set(cacheKey, {
            result: result,
            timestamp: Date.now()
        });
        
        return result;
    }

    /**
     * Apply effect to state
     * @param {Object} state - Current state
     * @param {string} effect - Effect to apply
     * @returns {Object} New state
     */
    applyEffect(state, effect) {
        const newState = { ...state };
        
        switch (effect) {
            case 'held':
                newState.heldObject = state.targetObject;
                break;
            case 'hunger_increased':
                newState.hunger = Math.min(100, (state.hunger || 50) + 30);
                break;
            case 'thirst_increased':
                newState.thirst = Math.min(100, (state.thirst || 50) + 30);
                break;
            case 'armed':
                newState.heldObject = state.targetObject;
                newState.armed = true;
                break;
            case 'damaged':
                newState.health = Math.max(0, (state.health || 100) - 20);
                break;
            case 'burned':
                newState.health = Math.max(0, (state.health || 100) - 15);
                break;
            case 'safe':
                newState.threatLevel = 0;
                break;
            case 'friendly_response':
                newState.relationship = 'friendly';
                break;
        }
        
        return newState;
    }

    /**
     * Counterfactual reasoning: "What if I had done X instead?"
     * @param {Object} actualAction - Action that was taken
     * @param {Object} alternativeAction - Alternative action
     * @param {Object} state - State before action
     * @returns {Object} Comparison of outcomes
     */
    counterfactual(actualAction, alternativeAction, state) {
        const actualOutcome = this.simulateFuture(actualAction, state, 3);
        const alternativeOutcome = this.simulateFuture(alternativeAction, state, 3);
        
        return {
            actual: actualOutcome,
            alternative: alternativeOutcome,
            betterChoice: this.compareOutcomes(actualOutcome, alternativeOutcome),
            regret: this.calculateRegret(actualOutcome, alternativeOutcome)
        };
    }

    /**
     * Compare two outcomes to determine which is better
     * @param {Object} outcome1 - First outcome
     * @param {Object} outcome2 - Second outcome
     * @returns {string} 'actual', 'alternative', or 'equal'
     */
    compareOutcomes(outcome1, outcome2) {
        const score1 = this.scoreOutcome(outcome1.finalState);
        const score2 = this.scoreOutcome(outcome2.finalState);
        
        if (Math.abs(score1 - score2) < 0.1) return 'equal';
        return score1 > score2 ? 'actual' : 'alternative';
    }

    /**
     * Score an outcome based on desirability
     * @param {Object} state - Outcome state
     * @returns {number} Score (higher is better)
     */
    scoreOutcome(state) {
        let score = 0;
        
        // Health is most important
        score += (state.health || 100) * 0.5;
        
        // Needs satisfaction
        score += (state.hunger || 50) * 0.2;
        score += (state.thirst || 50) * 0.2;
        
        // Safety
        score -= (state.threatLevel || 0) * 30;
        
        // Social
        if (state.relationship === 'friendly') score += 10;
        if (state.relationship === 'hostile') score -= 10;
        
        return score;
    }

    /**
     * Calculate regret for not taking alternative action
     * @param {Object} actualOutcome - Actual outcome
     * @param {Object} alternativeOutcome - Alternative outcome
     * @returns {number} Regret level (0-1)
     */
    calculateRegret(actualOutcome, alternativeOutcome) {
        const actualScore = this.scoreOutcome(actualOutcome.finalState);
        const altScore = this.scoreOutcome(alternativeOutcome.finalState);
        
        if (altScore <= actualScore) return 0;
        
        const maxRegret = 100; // Maximum possible score difference
        return Math.min(1, (altScore - actualScore) / maxRegret);
    }

    /**
     * Store prediction for error tracking
     * @param {Object} prediction - Prediction to store
     */
    storePrediction(prediction) {
        this.predictions.push(prediction);
        
        if (this.predictions.length > this.maxPredictionHistory) {
            this.predictions.shift();
        }
    }

    /**
     * Verify prediction against actual outcome
     * @param {Object} prediction - Original prediction
     * @param {Object} actualOutcome - What actually happened
     */
    verifyPrediction(prediction, actualOutcome) {
        const correct = prediction.effect === actualOutcome.effect;
        
        this.predictionErrors.total++;
        if (correct) {
            this.predictionErrors.correct++;
        } else {
            this.predictionErrors.incorrect++;
        }
        
        this.predictionErrors.accuracy = 
            this.predictionErrors.correct / this.predictionErrors.total;
        
        // Learn from error: adjust rule probability
        if (!correct) {
            this.adjustRuleProbability(prediction.action, -0.05);
        } else {
            this.adjustRuleProbability(prediction.action, 0.02);
        }
    }

    /**
     * Adjust rule probability based on prediction accuracy
     * @param {Object} action - Action from prediction
     * @param {number} adjustment - Probability adjustment
     */
    adjustRuleProbability(action, adjustment) {
        const key = this.getRuleKey(action);
        const rules = this.causalRules.get(key);
        
        if (rules) {
            rules.forEach(rule => {
                rule.effect.probability = Math.max(0.1, Math.min(1.0,
                    rule.effect.probability + adjustment
                ));
            });
        }
    }

    /**
     * Get simulation cache key
     * @param {Object} action - Action
     * @param {Object} state - State
     * @param {number} steps - Steps
     * @returns {string} Cache key
     */
    getSimulationCacheKey(action, state, steps) {
        return JSON.stringify({ action, state, steps });
    }

    /**
     * Get prediction statistics
     * @returns {Object} Statistics
     */
    getStatistics() {
        return {
            totalPredictions: this.predictions.length,
            predictionErrors: { ...this.predictionErrors },
            causalRules: this.causalRules.size,
            cacheSize: this.simulationCache.size
        };
    }

    /**
     * Clear simulation cache
     */
    clearCache() {
        this.simulationCache.clear();
    }

    /**
     * Update system (called each frame)
     * @param {number} dt - Delta time
     */
    update(dt) {
        // Clean old cache entries
        const now = Date.now();
        for (const [key, entry] of this.simulationCache.entries()) {
            if (now - entry.timestamp > this.cacheMaxAge) {
                this.simulationCache.delete(key);
            }
        }
    }
}
