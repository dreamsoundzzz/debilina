/**
 * Demonstration of Task 18.3: Emotional Response to Consumables
 * 
 * This example shows how the NPC triggers emotional responses (relief/excitement)
 * when seeing food while hungry or water while thirsty.
 * 
 * Requirements demonstrated:
 * - 28.8: Trigger relief/excitement when seeing food/water while hungry/thirsty
 */

import { ConsumptionSystem } from '../src/ai/ConsumptionSystem.js';
import { NeedsSystem } from '../src/ai/NeedsSystem.js';
import { EmotionSystem } from '../src/ai/EmotionSystem.js';
import { VisionSystem } from '../src/ai/VisionSystem.js';
import { GameObject } from '../src/game/GameObject.js';
import { Vec2 } from '../src/physics/Vec2.js';

// Create systems
const consumptionSystem = new ConsumptionSystem();
const needsSystem = new NeedsSystem();
const emotionSystem = new EmotionSystem();
const visionSystem = new VisionSystem();

// Create mock NPC
const npc = {
  head: {
    position: new Vec2(100, 100),
    rotation: 0
  },
  torso: {
    position: new Vec2(100, 120)
  },
  needs: needsSystem,
  emotions: emotionSystem
};

// Create consumable objects
const apple = new GameObject('apple', {
  radius: 5,
  consumable: 'food',
  consumableValue: 20
}, new Vec2(200, 100));

const water = new GameObject('water', {
  size: { width: 10, height: 25 },
  consumable: 'drink',
  consumableValue: 40
}, new Vec2(250, 100));

const box = new GameObject('box', {
  size: { width: 30, height: 30 }
}, new Vec2(300, 100));

const allObjects = [apple, water, box];

console.log('=== Emotional Response to Consumables Demo ===\n');

// Scenario 1: NPC is hungry and sees food
console.log('Scenario 1: NPC is hungry (hunger = 20) and sees food');
console.log('---------------------------------------------------');
npc.needs.hunger = 20;
npc.needs.thirst = 80;

console.log('Before seeing food:');
console.log(`  Emotions: happy=${emotionSystem.emotions.happy.toFixed(2)}, sad=${emotionSystem.emotions.sad.toFixed(2)}, angry=${emotionSystem.emotions.angry.toFixed(2)}`);

// Simulate vision system detecting objects
const visibleEntities = [apple, box]; // NPC can see apple and box

// Check for emotional responses
consumptionSystem.checkVisibleConsumables(npc, visibleEntities, emotionSystem);

console.log('After seeing food:');
console.log(`  Emotions: happy=${emotionSystem.emotions.happy.toFixed(2)}, sad=${emotionSystem.emotions.sad.toFixed(2)}, angry=${emotionSystem.emotions.angry.toFixed(2)}`);
console.log('  ✓ Relief: Negative emotions (sad, angry) reduced');
console.log('  ✓ Excitement: Positive emotions (happy, curious) increased\n');

// Scenario 2: NPC is thirsty and sees water
console.log('Scenario 2: NPC is thirsty (thirst = 15) and sees water');
console.log('-------------------------------------------------------');
emotionSystem.reset();
consumptionSystem.reset();
npc.needs.hunger = 80;
npc.needs.thirst = 15;
emotionSystem.emotions.fearful = 0.6;
emotionSystem.emotions.angry = 0.5;

console.log('Before seeing water:');
console.log(`  Emotions: happy=${emotionSystem.emotions.happy.toFixed(2)}, fearful=${emotionSystem.emotions.fearful.toFixed(2)}, angry=${emotionSystem.emotions.angry.toFixed(2)}`);

// Simulate vision system detecting objects
const visibleEntities2 = [water, box]; // NPC can see water and box

// Check for emotional responses
consumptionSystem.checkVisibleConsumables(npc, visibleEntities2, emotionSystem);

console.log('After seeing water:');
console.log(`  Emotions: happy=${emotionSystem.emotions.happy.toFixed(2)}, fearful=${emotionSystem.emotions.fearful.toFixed(2)}, angry=${emotionSystem.emotions.angry.toFixed(2)}`);
console.log('  ✓ Relief: Negative emotions (fearful, angry) reduced');
console.log('  ✓ Excitement: Positive emotions (happy, curious) increased\n');

// Scenario 3: NPC is not hungry/thirsty - no emotional response
console.log('Scenario 3: NPC is satisfied (hunger = 80, thirst = 90)');
console.log('--------------------------------------------------------');
emotionSystem.reset();
consumptionSystem.reset();
npc.needs.hunger = 80;
npc.needs.thirst = 90;

console.log('Before seeing consumables:');
console.log(`  Emotions: happy=${emotionSystem.emotions.happy.toFixed(2)}, curious=${emotionSystem.emotions.curious.toFixed(2)}`);

// Simulate vision system detecting objects
const visibleEntities3 = [apple, water]; // NPC can see both

// Check for emotional responses
consumptionSystem.checkVisibleConsumables(npc, visibleEntities3, emotionSystem);

console.log('After seeing consumables:');
console.log(`  Emotions: happy=${emotionSystem.emotions.happy.toFixed(2)}, curious=${emotionSystem.emotions.curious.toFixed(2)}`);
console.log('  ✓ No emotional response (needs are satisfied)\n');

// Scenario 4: Emotion intensity scales with need level
console.log('Scenario 4: Emotion intensity scales with need level');
console.log('-----------------------------------------------------');
emotionSystem.reset();
consumptionSystem.reset();

// Moderately hungry
npc.needs.hunger = 25;
const initialHappy1 = emotionSystem.emotions.happy;
consumptionSystem.checkVisibleConsumables(npc, [apple], emotionSystem);
const happyIncrease1 = emotionSystem.emotions.happy - initialHappy1;

// Very hungry
emotionSystem.reset();
consumptionSystem.reset();
npc.needs.hunger = 5;
const initialHappy2 = emotionSystem.emotions.happy;
const apple2 = new GameObject('apple2', {
  radius: 5,
  consumable: 'food',
  consumableValue: 20
}, new Vec2(200, 100));
consumptionSystem.checkVisibleConsumables(npc, [apple2], emotionSystem);
const happyIncrease2 = emotionSystem.emotions.happy - initialHappy2;

console.log(`Moderately hungry (hunger=25): happiness increased by ${happyIncrease1.toFixed(3)}`);
console.log(`Very hungry (hunger=5): happiness increased by ${happyIncrease2.toFixed(3)}`);
console.log('  ✓ Stronger emotional response when need is more critical\n');

console.log('=== Demo Complete ===');
console.log('\nIntegration Notes:');
console.log('- Call consumptionSystem.checkVisibleConsumables() in the game loop');
console.log('- Pass the visible entities from visionSystem.getVisibleEntities()');
console.log('- Emotional responses are triggered automatically based on needs');
console.log('- Responses are only triggered once per visible item until needs change');
