/**
 * Hand Control Demo
 * Demonstrates mouse-controlled hand reaching with IK
 */
import { GameEngine } from '../src/core/GameEngine.js';
import { InputHandler } from '../src/core/InputHandler.js';
import { HandControlSystem } from '../src/core/HandControlSystem.js';
import { Character } from '../src/physics/Character.js';
import { Vec2 } from '../src/physics/Vec2.js';

// Initialize when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  
  if (!canvas) {
    console.error('Canvas element not found!');
    return;
  }

  // Create game engine
  const game = new GameEngine(canvas);
  
  // Create input handler
  const inputHandler = new InputHandler(canvas);
  
  // Create a character in the center of the screen
  const characterPos = new Vec2(canvas.width / 2, canvas.height / 2);
  const character = new Character(characterPos, 'Player');
  
  // Create hand control system
  const handControlSystem = new HandControlSystem(inputHandler, character);
  
  // Create a physics system to update character
  const physicsSystem = {
    update(dt) {
      // Update character physics
      character.update(dt);
      
      // Solve constraints multiple times for stability
      for (let i = 0; i < 5; i++) {
        character.solveConstraints();
      }
    },
    
    render(ctx) {
      // Render character
      game.renderer.renderCharacter(character);
    }
  };
  
  // Register systems
  game.registerSystem(physicsSystem);
  game.registerSystem(handControlSystem);
  
  // Listen for hand switch events
  game.events.on('game:update:before', () => {
    const hotkeyEvent = inputHandler.pollHotkeyEvent();
    if (hotkeyEvent && hotkeyEvent.type === 'handSwitch') {
      console.log(`Switched to ${hotkeyEvent.hand} hand`);
    }
  });
  
  // Listen for FPS updates
  game.events.on('fps:update', (fps) => {
    const fpsElement = document.getElementById('fps-counter');
    if (fpsElement) {
      fpsElement.textContent = `FPS: ${fps}`;
    }
  });

  // Start the game
  game.start();

  console.log('Hand Control Demo initialized!');
  console.log('Move your mouse to control the active hand');
  console.log('Press Tab to switch between left and right hand');
});
