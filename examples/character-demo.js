/**
 * Character Demo
 * Demonstrates the Character class with body parts
 */
import { Character } from '../src/physics/Character.js';
import { Vec2 } from '../src/physics/Vec2.js';

// Create a character at position (200, 100)
const character = new Character(new Vec2(200, 100), 'Demo Character');

console.log('=== Character Demo ===\n');
console.log(`Character Name: ${character.name}`);
console.log(`Position: (${character.position.x}, ${character.position.y})`);
console.log(`Total Body Parts: ${character.bodyParts.length}\n`);

console.log('=== Body Parts ===');
character.bodyParts.forEach((part, index) => {
  console.log(`${index + 1}. ${part.type.padEnd(12)} - Mass: ${part.mass}kg, Radius: ${part.radius}px, Position: (${Math.round(part.position.x)}, ${Math.round(part.position.y)})`);
});

console.log('\n=== Body Part Structure ===');
console.log('Head:', character.head.type, '- Above torso');
console.log('Torso:', character.torso.type, '- Center of character');
console.log('Arms:');
console.log('  Left: Upper Arm → Forearm → Hand');
console.log('  Right: Upper Arm → Forearm → Hand');
console.log('Legs:');
console.log('  Left: Thigh → Shin → Foot');
console.log('  Right: Thigh → Shin → Foot');

console.log('\n=== Physics Properties ===');
const totalMass = character.bodyParts.reduce((sum, part) => sum + part.mass, 0);
console.log(`Total Mass: ${totalMass}kg`);
console.log(`All parts are dynamic: ${character.bodyParts.every(part => part.isDynamic)}`);
console.log(`All parts have damping: ${character.bodyParts.every(part => part.damping === 0.99)}`);

console.log('\n=== Requirement 2.1 Validation ===');
console.log(`✓ Has at least 10 body parts: ${character.bodyParts.length >= 10}`);
const requiredTypes = ['head', 'torso', 'upperArm', 'forearm', 'hand', 'thigh', 'shin', 'foot'];
const hasAllTypes = requiredTypes.every(type => 
  character.bodyParts.some(part => part.type === type)
);
console.log(`✓ Has all required body part types: ${hasAllTypes}`);

console.log('\n=== Update Simulation ===');
console.log('Applying gravity and updating for 1 frame...');
const gravity = new Vec2(0, 9.8);
character.bodyParts.forEach(part => {
  part.applyForce(gravity.mul(part.mass));
});
character.update(1/60);
console.log('✓ Character updated successfully');
console.log(`New torso position: (${Math.round(character.torso.position.x)}, ${Math.round(character.torso.position.y)})`);
