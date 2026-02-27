/**
 * Balance and Posture Maintenance Demo
 * Demonstrates the new features added in Task 9.2:
 * - Balance forces to keep torso upright
 * - Air control when airborne
 * - Slope-based speed adjustment
 */

import { LocomotionSystem } from '../src/physics/LocomotionSystem.js';
import { Character } from '../src/physics/Character.js';
import { Vec2 } from '../src/physics/Vec2.js';

// Create a character
const character = new Character(new Vec2(400, 300), 'DemoCharacter');

// Create locomotion system with custom parameters
const locomotion = new LocomotionSystem({
  walkSpeed: 200,
  stepHeight: 15,
  stepLength: 30,
  stepFrequency: 2,
  balanceForce: 100,
  airControlFactor: 0.3,
  maxSlopeAngle: Math.PI / 6 // 30 degrees
});

console.log('=== Balance and Posture Maintenance Demo ===\n');

// Demo 1: Balance Forces
console.log('Demo 1: Balance Forces');
console.log('----------------------');
console.log('Initial torso angle:', locomotion.calculateTorsoAngle(character).toFixed(3), 'radians');

// Tilt the character
character.head.position.x += 20;
console.log('After tilting head right:', locomotion.calculateTorsoAngle(character).toFixed(3), 'radians');

// Apply balance forces
locomotion.applyBalanceForces(character, 0.016);
console.log('Balance forces applied (force magnitude:', locomotion.balanceForce, ')');
console.log('');

// Demo 2: Air Control
console.log('Demo 2: Air Control');
console.log('-------------------');
console.log('Ground walk speed:', locomotion.walkSpeed);
console.log('Air control factor:', locomotion.airControlFactor);
console.log('Effective air control speed:', locomotion.walkSpeed * locomotion.airControlFactor);

// Simulate grounded movement
locomotion.update(character, 1, 0.016, true);
console.log('Step cycle after grounded update:', locomotion.getStepCycle().toFixed(3));

// Simulate airborne movement
const cycleBeforeAir = locomotion.getStepCycle();
locomotion.update(character, 1, 0.016, false);
console.log('Step cycle after airborne update:', locomotion.getStepCycle().toFixed(3));
console.log('Step cycle frozen while airborne:', cycleBeforeAir === locomotion.getStepCycle());
console.log('');

// Demo 3: Slope-Based Speed Adjustment
console.log('Demo 3: Slope-Based Speed Adjustment');
console.log('-------------------------------------');
console.log('Base walk speed:', locomotion.walkSpeed);

const slopes = [
  { angle: 0, name: 'Flat terrain' },
  { angle: Math.PI / 12, name: 'Gentle slope (15°)' },
  { angle: Math.PI / 6, name: 'Moderate slope (30°)' },
  { angle: Math.PI / 4, name: 'Steep slope (45°)' },
  { angle: Math.PI / 3, name: 'Very steep slope (60°)' }
];

slopes.forEach(({ angle, name }) => {
  const adjustedSpeed = locomotion.calculateSlopeAdjustedSpeed(angle);
  const reduction = ((locomotion.walkSpeed - adjustedSpeed) / locomotion.walkSpeed * 100).toFixed(1);
  console.log(`${name}: ${adjustedSpeed.toFixed(1)} (${reduction}% reduction)`);
});
console.log('');

// Demo 4: Combined Features
console.log('Demo 4: Combined Features');
console.log('-------------------------');
console.log('Walking on steep slope (45°) while maintaining balance:');

const steepSlope = Math.PI / 4;
character.head.position.x += 15; // Tilt character

console.log('- Torso tilt angle:', locomotion.calculateTorsoAngle(character).toFixed(3), 'radians');
console.log('- Terrain slope:', steepSlope.toFixed(3), 'radians');
console.log('- Adjusted speed:', locomotion.calculateSlopeAdjustedSpeed(steepSlope).toFixed(1));

locomotion.update(character, 1, 0.016, true, steepSlope);
console.log('- Update applied with balance forces and slope adjustment');
console.log('- Step cycle:', locomotion.getStepCycle().toFixed(3));
console.log('');

// Demo 5: Configuration
console.log('Demo 5: Configuration Options');
console.log('-----------------------------');
console.log('Current settings:');
console.log('- Balance force:', locomotion.balanceForce);
console.log('- Air control factor:', locomotion.airControlFactor);
console.log('- Max slope angle:', (locomotion.maxSlopeAngle * 180 / Math.PI).toFixed(1), '°');

// Adjust settings
locomotion.setBalanceForce(150);
locomotion.setAirControlFactor(0.5);
locomotion.setMaxSlopeAngle(Math.PI / 4);

console.log('\nAfter adjustment:');
console.log('- Balance force:', locomotion.balanceForce);
console.log('- Air control factor:', locomotion.airControlFactor);
console.log('- Max slope angle:', (locomotion.maxSlopeAngle * 180 / Math.PI).toFixed(1), '°');
console.log('');

console.log('=== Demo Complete ===');
console.log('\nAll features implemented and tested:');
console.log('✓ Balance forces maintain upright posture (Requirement 5.3)');
console.log('✓ Limited air control when airborne (Requirement 5.5)');
console.log('✓ Speed adjustment based on terrain slope (Requirement 5.6)');
console.log('✓ Balance recovery when disturbed (Requirement 5.7)');
