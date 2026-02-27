/**
 * Verlet Physics Demo
 * Demonstrates the Verlet integration physics system with falling body parts
 */
import { VerletPhysics, BodyPart, Vec2 } from '../src/physics/index.js';

console.log('=== Verlet Physics Demo ===\n');

// Create physics system with default gravity (9.8 m/s² = 980 pixels/s²)
const physics = new VerletPhysics();
console.log(`Gravity: ${physics.getGravity()}`);

// Create some body parts at different positions
const head = new BodyPart(new Vec2(100, 50), 5, 20, 'head');
const torso = new BodyPart(new Vec2(100, 100), 40, 30, 'torso');
const leftHand = new BodyPart(new Vec2(70, 120), 0.5, 8, 'hand');
const rightHand = new BodyPart(new Vec2(130, 120), 0.5, 8, 'hand');

// Add them to the physics simulation
physics.addBodyPart(head);
physics.addBodyPart(torso);
physics.addBodyPart(leftHand);
physics.addBodyPart(rightHand);

console.log(`\nAdded ${physics.getBodyPartCount()} body parts to simulation\n`);

// Simulate falling for 1 second (60 frames at 60 FPS)
console.log('Simulating 1 second of falling (60 frames):\n');

const dt = 1 / 60; // 60 FPS
const frames = 60;

// Record initial positions
const initialPositions = {
  head: head.position.clone(),
  torso: torso.position.clone(),
  leftHand: leftHand.position.clone(),
  rightHand: rightHand.position.clone()
};

// Simulate
for (let i = 0; i < frames; i++) {
  physics.update(dt);
  
  // Print every 15 frames (4 times per second)
  if (i % 15 === 0) {
    console.log(`Frame ${i}:`);
    console.log(`  Head:      ${head.position} (velocity: ${head.velocity.magnitude().toFixed(2)} px/s)`);
    console.log(`  Torso:     ${torso.position} (velocity: ${torso.velocity.magnitude().toFixed(2)} px/s)`);
    console.log(`  Left Hand: ${leftHand.position} (velocity: ${leftHand.velocity.magnitude().toFixed(2)} px/s)`);
    console.log(`  Right Hand: ${rightHand.position} (velocity: ${rightHand.velocity.magnitude().toFixed(2)} px/s)`);
    console.log('');
  }
}

// Calculate final distances fallen
console.log('Final Results:');
console.log(`  Head fell:       ${(head.position.y - initialPositions.head.y).toFixed(2)} pixels`);
console.log(`  Torso fell:      ${(torso.position.y - initialPositions.torso.y).toFixed(2)} pixels`);
console.log(`  Left Hand fell:  ${(leftHand.position.y - initialPositions.leftHand.y).toFixed(2)} pixels`);
console.log(`  Right Hand fell: ${(rightHand.position.y - initialPositions.rightHand.y).toFixed(2)} pixels`);

// Demonstrate pinning (static body parts)
console.log('\n=== Pinning Demo ===\n');

// Reset positions
head.setPosition(new Vec2(100, 50));
head.velocity = Vec2.zero();
torso.setPosition(new Vec2(100, 100));
torso.velocity = Vec2.zero();

// Pin the head (make it static)
head.pin();
console.log('Pinned the head (made it static)');

// Simulate again
console.log('\nSimulating 30 frames with pinned head:\n');
for (let i = 0; i < 30; i++) {
  physics.update(dt);
}

console.log('Results:');
console.log(`  Head position:  ${head.position} (should not have moved)`);
console.log(`  Torso position: ${torso.position} (should have fallen)`);

// Demonstrate impulse
console.log('\n=== Impulse Demo ===\n');

// Reset torso
torso.setPosition(new Vec2(100, 100));
torso.velocity = Vec2.zero();

console.log('Applying horizontal impulse to torso...');
torso.applyImpulse(new Vec2(2000, 0)); // Strong horizontal push

console.log(`Initial velocity: ${torso.velocity}`);

// Simulate a few frames
for (let i = 0; i < 10; i++) {
  physics.update(dt);
}

console.log(`Position after 10 frames: ${torso.position}`);
console.log(`Velocity after 10 frames: ${torso.velocity}`);

console.log('\n=== Demo Complete ===');
