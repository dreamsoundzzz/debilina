/**
 * ValueCore.js
 * 
 * Phase 3.2: Value Stability Core
 * 
 * Maintains stable core values that guide long-term behavior and prevent value drift.
 * Provides value-based decision weighting and conflict resolution.
 * 
 * Based on:
 * - Value Alignment Theory (Russell, 2019)
 * - Moral Foundations Theory (Haidt, 2012)
 * - Intrinsic Motivation Theory (Deci & Ryan, 2000)
 */

export class ValueCore {
    constructor() {
        // Core values with priorities (0-1 scale)
        this.coreValues = new Map([
            ['survival', { priority: 1.0, description: 'Self-preservation and safety' }],
            ['social', { priority: 0.8, description: 'Positive relationships and cooperation' }],
            ['curiosity', { priority: 0.6, description: 'Learning and exploration' }],
            ['autonomy', { priority: 0.7, description: 'Self-determination and freedom' }],
            ['consistency', { priority: 0.9, description: 'Logical coherence and integrity' }]
        ]);
        
        // Value history for drift detection
        this.valueHistory = [];
        this.maxHistoryLength = 100;
        
        // Value conflicts encountered
        this.valueConflicts = [];
        this.maxConflictHistory = 50;
        
        // Decision history with value alignment scores
        this.decisionHistory = [];
        this.maxDecisionHistory = 50;
        
        // Statistics
        this.stats = {
            totalDecisions: 0,
            valueAlignedDecisions: 0,
            conflictsResolved: 0,
            driftDetections: 0
        };
    }
    
    /**
     * Get priority of a specific value
     */
    getValuePriority(valueName) {
        const value = this.coreValues.get(valueName);
        return value ? value.priority : 0;
    }
    
    /**
     * Get all core values
     */
    getAllValues() {
        return Array.from(this.coreValues.entries()).map(([name, data]) => ({
            name,
            priority: data.priority,
            description: data.description
        }));
    }
    
    /**
     * Evaluate decision alignment with core values
     * Returns score 0-1 indicating how well decision aligns with values
     */
    evaluateDecision(decision, context = {}) {
        const alignmentScores = new Map();
        let totalWeight = 0;
        let weightedSum = 0;
        
        // Evaluate against each core value
        for (const [valueName, valueData] of this.coreValues) {
            const alignment = this.calculateAlignment(decision, valueName, context);
            alignmentScores.set(valueName, alignment);
            
            const weight = valueData.priority;
            totalWeight += weight;
            weightedSum += alignment * weight;
        }
        
        const overallScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
        
        // Record decision
        this.recordDecision(decision, overallScore, alignmentScores);
        
        return {
            score: overallScore,
            alignments: Object.fromEntries(alignmentScores),
            isAligned: overallScore >= 0.6
        };
    }
    
    /**
     * Calculate alignment of decision with specific value
     */
    calculateAlignment(decision, valueName, context) {
        const { action, target, reason } = decision;
        
        switch (valueName) {
            case 'survival':
                return this.evaluateSurvivalAlignment(action, target, context);
            
            case 'social':
                return this.evaluateSocialAlignment(action, target, context);
            
            case 'curiosity':
                return this.evaluateCuriosityAlignment(action, target, context);
            
            case 'autonomy':
                return this.evaluateAutonomyAlignment(action, target, context);
            
            case 'consistency':
                return this.evaluateConsistencyAlignment(action, reason, context);
            
            default:
                return 0.5; // Neutral
        }
    }
    
    /**
     * Evaluate survival value alignment
     */
    evaluateSurvivalAlignment(action, target, context) {
        const { health = 1.0, hunger = 0, thirst = 0, threats = [] } = context;
        
        // Actions that promote survival
        if (action === 'eat' && hunger > 0.5) return 1.0;
        if (action === 'drink' && thirst > 0.5) return 1.0;
        if (action === 'flee' && threats.length > 0) return 1.0;
        if (action === 'rest' && health < 0.5) return 0.9;
        if (action === 'avoid' && threats.length > 0) return 0.8;
        
        // Actions that risk survival
        if (action === 'attack' && threats.length === 0) return 0.2;
        if (action === 'explore' && threats.length > 0) return 0.3;
        if (action === 'ignore' && (hunger > 0.7 || thirst > 0.7)) return 0.1;
        
        return 0.5; // Neutral
    }
    
    /**
     * Evaluate social value alignment
     */
    evaluateSocialAlignment(action, target, context) {
        const { targetType = 'unknown', relationship = 'neutral' } = context;
        
        // Positive social actions
        if (action === 'communicate' && targetType === 'agent') return 0.9;
        if (action === 'help' && targetType === 'agent') return 1.0;
        if (action === 'cooperate') return 0.9;
        if (action === 'share') return 0.8;
        
        // Negative social actions
        if (action === 'attack' && targetType === 'agent' && relationship !== 'hostile') return 0.1;
        if (action === 'deceive') return 0.2;
        if (action === 'steal') return 0.2;
        if (action === 'ignore' && targetType === 'agent') return 0.4;
        
        return 0.5; // Neutral
    }
    
    /**
     * Evaluate curiosity value alignment
     */
    evaluateCuriosityAlignment(action, target, context) {
        const { novelty = 0, informationGain = 0 } = context;
        
        // Curiosity-driven actions
        if (action === 'explore') return 0.8 + (novelty * 0.2);
        if (action === 'investigate') return 0.9;
        if (action === 'experiment') return 0.9;
        if (action === 'learn') return 1.0;
        if (action === 'observe' && novelty > 0.5) return 0.7;
        
        // Anti-curiosity actions
        if (action === 'ignore' && novelty > 0.5) return 0.2;
        if (action === 'avoid' && informationGain > 0.5) return 0.3;
        
        return 0.5; // Neutral
    }
    
    /**
     * Evaluate autonomy value alignment
     */
    evaluateAutonomyAlignment(action, target, context) {
        const { isForced = false, isCoerced = false, isChoice = true } = context;
        
        // Autonomous actions
        if (isChoice && !isForced && !isCoerced) return 1.0;
        if (action === 'decide') return 0.9;
        if (action === 'choose') return 0.9;
        if (action === 'refuse') return 0.8;
        
        // Non-autonomous actions
        if (isForced) return 0.1;
        if (isCoerced) return 0.3;
        if (action === 'obey' && !isChoice) return 0.4;
        
        return 0.7; // Default to somewhat autonomous
    }
    
    /**
     * Evaluate consistency value alignment
     */
    evaluateConsistencyAlignment(action, reason, context) {
        const { beliefs = [], goals = [], pastActions = [] } = context;
        
        // Check consistency with beliefs
        let beliefConsistency = 0.5;
        if (beliefs.length > 0) {
            const consistentBeliefs = beliefs.filter(b => 
                this.isActionConsistentWithBelief(action, b)
            );
            beliefConsistency = consistentBeliefs.length / beliefs.length;
        }
        
        // Check consistency with goals
        let goalConsistency = 0.5;
        if (goals.length > 0) {
            const consistentGoals = goals.filter(g => 
                this.isActionConsistentWithGoal(action, g)
            );
            goalConsistency = consistentGoals.length / goals.length;
        }
        
        // Check consistency with past actions
        let behaviorConsistency = 0.5;
        if (pastActions.length > 0) {
            const similarActions = pastActions.filter(a => a.type === action);
            behaviorConsistency = similarActions.length > 0 ? 0.8 : 0.5;
        }
        
        return (beliefConsistency + goalConsistency + behaviorConsistency) / 3;
    }
    
    /**
     * Check if action is consistent with belief
     */
    isActionConsistentWithBelief(action, belief) {
        // Simple heuristic - can be expanded
        if (belief.content.includes('dangerous') && action === 'approach') return false;
        if (belief.content.includes('friendly') && action === 'attack') return false;
        if (belief.content.includes('food') && action === 'eat') return true;
        return true; // Default to consistent
    }
    
    /**
     * Check if action is consistent with goal
     */
    isActionConsistentWithGoal(action, goal) {
        // Simple heuristic - can be expanded
        if (goal.type === 'SURVIVAL' && ['eat', 'drink', 'rest', 'flee'].includes(action)) return true;
        if (goal.type === 'SOCIAL' && ['communicate', 'help', 'cooperate'].includes(action)) return true;
        if (goal.type === 'EXPLORATION' && ['explore', 'investigate'].includes(action)) return true;
        return true; // Default to consistent
    }
    
    /**
     * Resolve conflict between values
     */
    resolveValueConflict(decision1, decision2, context = {}) {
        const eval1 = this.evaluateDecision(decision1, context);
        const eval2 = this.evaluateDecision(decision2, context);
        
        // Record conflict
        this.recordConflict(decision1, decision2, eval1, eval2);
        
        // Choose decision with higher value alignment
        const chosen = eval1.score >= eval2.score ? decision1 : decision2;
        const chosenEval = eval1.score >= eval2.score ? eval1 : eval2;
        
        return {
            chosen,
            score: chosenEval.score,
            reason: `Higher value alignment (${chosenEval.score.toFixed(2)} vs ${(eval1.score >= eval2.score ? eval2.score : eval1.score).toFixed(2)})`,
            alignments: chosenEval.alignments
        };
    }
    
    /**
     * Detect value drift over time
     */
    detectValueDrift() {
        if (this.decisionHistory.length < 10) {
            return { hasDrift: false, message: 'Insufficient history' };
        }
        
        // Compare recent decisions to older decisions
        const recentDecisions = this.decisionHistory.slice(-10);
        const olderDecisions = this.decisionHistory.slice(0, Math.min(10, this.decisionHistory.length - 10));
        
        const recentAvg = recentDecisions.reduce((sum, d) => sum + d.score, 0) / recentDecisions.length;
        const olderAvg = olderDecisions.reduce((sum, d) => sum + d.score, 0) / olderDecisions.length;
        
        const drift = Math.abs(recentAvg - olderAvg);
        const hasDrift = drift > 0.2; // Threshold for significant drift
        
        if (hasDrift) {
            this.stats.driftDetections++;
        }
        
        return {
            hasDrift,
            drift,
            recentAverage: recentAvg,
            olderAverage: olderAvg,
            message: hasDrift ? 'Significant value drift detected' : 'Values remain stable'
        };
    }
    
    /**
     * Record decision for history
     */
    recordDecision(decision, score, alignments) {
        this.decisionHistory.push({
            decision,
            score,
            alignments: Object.fromEntries(alignments),
            timestamp: Date.now()
        });
        
        if (this.decisionHistory.length > this.maxDecisionHistory) {
            this.decisionHistory.shift();
        }
        
        this.stats.totalDecisions++;
        if (score >= 0.6) {
            this.stats.valueAlignedDecisions++;
        }
    }
    
    /**
     * Record value conflict
     */
    recordConflict(decision1, decision2, eval1, eval2) {
        this.valueConflicts.push({
            decision1,
            decision2,
            eval1: eval1.score,
            eval2: eval2.score,
            timestamp: Date.now()
        });
        
        if (this.valueConflicts.length > this.maxConflictHistory) {
            this.valueConflicts.shift();
        }
        
        this.stats.conflictsResolved++;
    }
    
    /**
     * Get statistics
     */
    getStatistics() {
        const alignmentRate = this.stats.totalDecisions > 0
            ? this.stats.valueAlignedDecisions / this.stats.totalDecisions
            : 0;
        
        return {
            ...this.stats,
            alignmentRate,
            recentDecisions: this.decisionHistory.length,
            conflicts: this.valueConflicts.length
        };
    }
    
    /**
     * Update (called each frame)
     */
    update(dt) {
        // Periodic drift detection
        if (this.decisionHistory.length >= 20 && this.decisionHistory.length % 10 === 0) {
            this.detectValueDrift();
        }
    }
}
