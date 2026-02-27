import { ConsistencyEngine } from './src/ai/ConsistencyEngine.js';

const engine = new ConsistencyEngine();
console.log('ConsistencyEngine created successfully');
console.log('Rules:', engine.consistencyRules.size);
console.log('Coherence scores:', engine.coherenceScores);

// Test basic functionality
const state = {
    beliefs: [
        { content: 'Player is friendly', strength: 0.8, evidence: ['greeting'] },
        { content: 'Player is hostile', strength: 0.6, evidence: [] }
    ],
    goals: [],
    plannedAction: null
};

const result = engine.checkConsistency(state);
console.log('Consistency check result:', result.consistent);
console.log('Inconsistencies found:', result.inconsistencies.length);

if (result.inconsistencies.length > 0) {
    const repairs = engine.repairInconsistencies(state);
    console.log('Repairs applied:', repairs.repaired);
}

console.log('\n✓ ConsistencyEngine is working correctly!');
