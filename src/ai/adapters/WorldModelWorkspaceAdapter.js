/**
 * WorldModelWorkspaceAdapter - Connects WorldModel to Global Workspace
 * 
 * Submits predictions and simulations to the global workspace for conscious awareness.
 * Enables the NPC to be consciously aware of predicted futures and counterfactuals.
 */

export class WorldModelWorkspaceAdapter {
    constructor(worldModel, globalWorkspace) {
        this.worldModel = worldModel;
        this.workspace = globalWorkspace;
        
        // Track last prediction submission
        this.lastPredictionTime = 0;
        this.predictionInterval = 2000; // Submit predictions every 2 seconds
        
        // Track active predictions
        this.activePredictions = [];
    }

    /**
     * Update adapter - submit predictions to workspace
     * @param {Object} context - Current context (goals, threats, etc.)
     * @param {number} currentTime - Current timestamp
     */
    update(context, currentTime) {
        // Only submit predictions periodically
        if (currentTime - this.lastPredictionTime < this.predictionInterval) {
            return;
        }
        
        this.lastPredictionTime = currentTime;
        
        // Generate predictions based on context
        if (context.activeGoals && context.activeGoals.length > 0) {
            this.submitGoalPredictions(context, currentTime);
        }
        
        if (context.threats && context.threats.length > 0) {
            this.submitThreatPredictions(context, currentTime);
        }
        
        if (context.opportunities && context.opportunities.length > 0) {
            this.submitOpportunityPredictions(context, currentTime);
        }
    }

    /**
     * Submit predictions for active goals
     * @param {Object} context - Current context
     * @param {number} currentTime - Current timestamp
     */
    submitGoalPredictions(context, currentTime) {
        for (const goal of context.activeGoals) {
            const action = this.goalToAction(goal);
            if (!action) continue;
            
            const prediction = this.worldModel.predictOutcome(action, context.currentState);
            
            if (prediction.success) {
                const content = this.formatPrediction(goal.name, prediction);
                
                this.workspace.submit({
                    type: 'prediction',
                    source: 'world_model',
                    content: content,
                    salience: this.calculatePredictionSalience(prediction, goal),
                    data: {
                        goal: goal.name,
                        action: action,
                        prediction: prediction,
                        timestamp: currentTime
                    }
                });
                
                this.activePredictions.push({
                    goal: goal.name,
                    prediction: prediction,
                    timestamp: currentTime
                });
            }
        }
    }

    /**
     * Submit predictions for threats
     * @param {Object} context - Current context
     * @param {number} currentTime - Current timestamp
     */
    submitThreatPredictions(context, currentTime) {
        for (const threat of context.threats) {
            // Predict what happens if we approach the threat
            const approachAction = {
                action: 'approach',
                target: threat.type
            };
            
            const prediction = this.worldModel.predictOutcome(
                approachAction,
                context.currentState
            );
            
            if (prediction.success && prediction.effect === 'damaged') {
                const content = `If I approach the ${threat.type}, I will likely be ${prediction.effect}`;
                
                this.workspace.submit({
                    type: 'prediction',
                    source: 'world_model',
                    content: content,
                    salience: 0.9, // Threat predictions are highly salient
                    data: {
                        threat: threat.type,
                        action: approachAction,
                        prediction: prediction,
                        timestamp: currentTime
                    }
                });
            }
        }
    }

    /**
     * Submit predictions for opportunities
     * @param {Object} context - Current context
     * @param {number} currentTime - Current timestamp
     */
    submitOpportunityPredictions(context, currentTime) {
        for (const opportunity of context.opportunities) {
            const action = {
                action: 'grab',
                target: opportunity.type
            };
            
            const prediction = this.worldModel.predictOutcome(
                action,
                context.currentState
            );
            
            if (prediction.success) {
                const content = this.formatPrediction(
                    `Grab ${opportunity.type}`,
                    prediction
                );
                
                this.workspace.submit({
                    type: 'prediction',
                    source: 'world_model',
                    content: content,
                    salience: this.calculateOpportunitySalience(prediction, opportunity),
                    data: {
                        opportunity: opportunity.type,
                        action: action,
                        prediction: prediction,
                        timestamp: currentTime
                    }
                });
            }
        }
    }

    /**
     * Convert goal to action
     * @param {Object} goal - Goal object
     * @returns {Object|null} Action object
     */
    goalToAction(goal) {
        if (!goal.context) return null;
        
        switch (goal.context.type) {
            case 'satisfy_hunger':
                return { action: 'eat', target: 'food' };
            case 'satisfy_thirst':
                return { action: 'drink', target: 'water' };
            case 'rest':
                return { action: 'rest', target: 'self' };
            case 'explore':
                return { action: 'approach', target: 'unknown' };
            default:
                return null;
        }
    }

    /**
     * Format prediction for workspace
     * @param {string} actionName - Name of action
     * @param {Object} prediction - Prediction object
     * @returns {string} Formatted content
     */
    formatPrediction(actionName, prediction) {
        const confidence = Math.round(prediction.confidence * 100);
        
        if (prediction.confidence > 0.8) {
            return `If I ${actionName}, I will ${prediction.effect} (${confidence}% sure)`;
        } else if (prediction.confidence > 0.5) {
            return `If I ${actionName}, I might ${prediction.effect} (${confidence}% sure)`;
        } else {
            return `If I ${actionName}, I'm uncertain but might ${prediction.effect} (${confidence}% sure)`;
        }
    }

    /**
     * Calculate salience for prediction
     * @param {Object} prediction - Prediction object
     * @param {Object} goal - Related goal
     * @returns {number} Salience (0-1)
     */
    calculatePredictionSalience(prediction, goal) {
        let salience = prediction.confidence * 0.5; // Base on confidence
        
        // Boost for high-priority goals
        if (goal.priority > 0.7) {
            salience += 0.3;
        }
        
        // Boost for survival-related predictions
        if (goal.level === 'SURVIVAL') {
            salience += 0.2;
        }
        
        return Math.min(1.0, salience);
    }

    /**
     * Calculate salience for opportunity
     * @param {Object} prediction - Prediction object
     * @param {Object} opportunity - Opportunity object
     * @returns {number} Salience (0-1)
     */
    calculateOpportunitySalience(prediction, opportunity) {
        let salience = prediction.confidence * 0.4;
        
        // Boost for beneficial outcomes
        if (prediction.effect === 'hunger_increased' || 
            prediction.effect === 'thirst_increased') {
            salience += 0.4;
        }
        
        return Math.min(1.0, salience);
    }

    /**
     * Submit counterfactual reasoning to workspace
     * @param {Object} actualAction - Action that was taken
     * @param {Object} alternativeAction - Alternative action
     * @param {Object} state - State before action
     */
    submitCounterfactual(actualAction, alternativeAction, state) {
        const counterfactual = this.worldModel.counterfactual(
            actualAction,
            alternativeAction,
            state
        );
        
        if (counterfactual.regret > 0.3) {
            const content = `I should have ${alternativeAction.action} instead of ${actualAction.action}`;
            
            this.workspace.submit({
                type: 'counterfactual',
                source: 'world_model',
                content: content,
                salience: counterfactual.regret,
                data: {
                    actualAction: actualAction,
                    alternativeAction: alternativeAction,
                    counterfactual: counterfactual,
                    timestamp: Date.now()
                }
            });
        }
    }

    /**
     * Get active predictions
     * @returns {Array} Active predictions
     */
    getActivePredictions() {
        return this.activePredictions;
    }

    /**
     * Clear old predictions
     * @param {number} maxAge - Maximum age in milliseconds
     */
    clearOldPredictions(maxAge = 10000) {
        const now = Date.now();
        this.activePredictions = this.activePredictions.filter(
            pred => now - pred.timestamp < maxAge
        );
    }
}
