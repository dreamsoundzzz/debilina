/**
 * Locomotion System Demo
 * Demonstrates walking animation with procedural leg movement
 */
import { Character } from '../src/physics/Character.js';
import { LocomotionSystem } from '../src/physics/LocomotionSystem.js';
import { Vec2 } from '../src/physics/Vec2.js';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Create character
const character = new Character(new Vec2(400, 300), 'Walker');

// Create locomotion system
const locomotion = new LocomotionSystem();

// Input state
const keys = {};
let isGrounded = true;

// Ground level
const groundY = 500;

// Setup controls
document.getElementById('walkSpeed').addEventListener('input', (e) => {
  const value = parseInt(e.target.value);
  locomotion.setWalkSpeed(value);
  document.getElementById('walkSpeedValue').textContent = value;
});

document.getElementById('stepHeight').addEventListener('input', (e) => {
  const value = parseInt(e.target.value);
  locomotion.setStepParameters({ stepHeight: value });
  document.getElementById('stepHeightValue').textContent = value;
});

document.getElementById('stepLength').addEventListener('input', (e) => {
  const value = parseInt(e.target.value);
  locomotion.setStepParameters({ stepLength: value });
  document.getElementById('stepLengthValue').textContent = value;
});

document.getElementById('stepFrequency').addEventListener('input', (e) => {
  const value = parseFloat(e.target.value);
  locomotion.setStepParameters({ stepFrequency: value });
  document.getElementById('stepFrequencyValue').textContent = value.toFixed(1);
});

// Keyboard input
window.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
  
  if (e.key === ' ') {
    e.preventDefault();
    isGrounded = !isGrounded;
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

// Simple physics update
function updatePhysics(dt) {
  const gravity = new Vec2(0, 980);
  
  // Update all body parts with gravity
  for (const part of character.bodyParts) {
    if (!isGrounded) {
      // Apply gravity when airborne
      const accel = gravity.mul(dt);
      const velocity = part.position.sub(part.oldPosition);
      part.oldPosition = part.position.clone();
      part.position = part.position.add(velocity).add(accel.mul(dt));
    }
  }
  
  // Simple ground collision
  if (isGrounded) {
    for (const part of character.bodyParts) {
      if (part.position.y > groundY) {
        part.position.y = groundY;
        part.oldPosition.y = groundY;
      }
    }
  }
  
  // Solve constraints
  for (let i = 0; i < 5; i++) {
    character.solveConstraints();
  }
}

// Render function
function render() {
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw ground
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(canvas.width, groundY);
  ctx.stroke();
  
  // Draw ground status
  ctx.fillStyle = isGrounded ? '#4a4' : '#a44';
  ctx.font = '16px Arial';
  ctx.fillText(isGrounded ? 'GROUNDED' : 'AIRBORNE', 10, 30);
  
  // Draw step cycle indicator
  const cyclePercent = ((locomotion.getStepCycle() / (Math.PI * 2)) * 100).toFixed(0);
  ctx.fillStyle = '#fff';
  ctx.fillText(`Step Cycle: ${cyclePercent}%`, 10, 55);
  
  // Draw character
  drawCharacter(character);
  
  // Draw foot targets (for visualization)
  const moveDir = (keys['d'] || keys['arrowright']) ? 1 : (keys['a'] || keys['arrowleft']) ? -1 : 0;
  if (moveDir !== 0 && isGrounded) {
    const leftTarget = locomotion.calculateFootTarget(character, 'left', locomotion.getStepCycle(), moveDir);
    const rightTarget = locomotion.calculateFootTarget(character, 'right', locomotion.getStepCycle() + Math.PI, moveDir);
    
    // Draw target positions
    ctx.fillStyle = 'rgba(255, 100, 100, 0.5)';
    ctx.beginPath();
    ctx.arc(leftTarget.x, leftTarget.y, 5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(100, 100, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(rightTarget.x, rightTarget.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCharacter(char) {
  // Draw constraints (bones)
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 3;
  for (const constraint of char.constraints) {
    if (constraint.partA && constraint.partB) {
      ctx.beginPath();
      ctx.moveTo(constraint.partA.position.x, constraint.partA.position.y);
      ctx.lineTo(constraint.partB.position.x, constraint.partB.position.y);
      ctx.stroke();
    }
  }
  
  // Draw body parts
  for (const part of char.bodyParts) {
    let color = '#888';
    
    // Color code different parts
    if (part.type === 'head') color = '#f88';
    else if (part.type === 'torso') color = '#88f';
    else if (part.type === 'hand') color = '#8f8';
    else if (part.type === 'foot') color = '#ff8';
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(part.position.x, part.position.y, part.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw outline
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

// Game loop
let lastTime = 0;
function gameLoop(currentTime) {
  const dt = Math.min((currentTime - lastTime) / 1000, 0.033); // Cap at 30 FPS
  lastTime = currentTime;
  
  if (dt > 0) {
    // Get movement direction
    const moveDir = (keys['d'] || keys['arrowright']) ? 1 : (keys['a'] || keys['arrowleft']) ? -1 : 0;
    
    // Update locomotion
    locomotion.update(character, moveDir, dt, isGrounded);
    
    // Update physics
    updatePhysics(dt);
    
    // Render
    render();
  }
  
  requestAnimationFrame(gameLoop);
}

// Start the game loop
requestAnimationFrame(gameLoop);
