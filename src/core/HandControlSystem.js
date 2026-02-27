/**
 * HandControlSystem - Integrates InputHandler with IK for mouse-controlled hand reaching
 * 
 * Implements:
 * - Mouse-controlled hand reaching using IK solver
 * - Active hand switching (left/right)
 * - Visual highlighting of active hand
 * 
 * Requirements: 3.1, 3.5
 */
import { IKSystem } from '../physics/IKSystem.js';
import { Vec2 } from '../physics/Vec2.js';

export class HandControlSystem {
  /**
   * Create a new hand control system
   * @param {InputHandler} inputHandler - The input handler
   * @param {Character} character - The character to control
   */
  constructor(inputHandler, character) {
    this.inputHandler = inputHandler;
    this.character = character;
    
    // Active hand highlighting
    this.highlightColor = '#FFD700'; // Gold color for active hand
    this.highlightPulse = 0;
    this.highlightPulseSpeed = 3; // Radians per second
  }

  /**
   * Update hand control - apply IK to reach toward mouse cursor
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    // Get mouse position
    const mousePos = this.inputHandler.getMousePosition();
    const targetPos = new Vec2(mousePos.x, mousePos.y);
    
    // Get active hand
    const activeHand = this.inputHandler.getActiveHand();
    
    // Apply IK to move active hand toward mouse cursor
    if (activeHand === 'left') {
      IKSystem.solveArm(
        this.character.leftUpperArm,
        this.character.leftForearm,
        this.character.leftHand,
        targetPos
      );
    } else if (activeHand === 'right') {
      IKSystem.solveArm(
        this.character.rightUpperArm,
        this.character.rightForearm,
        this.character.rightHand,
        targetPos
      );
    }
    
    // Update highlight pulse animation
    this.highlightPulse += this.highlightPulseSpeed * dt;
  }

  /**
   * Render visual highlight for active hand
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   */
  render(ctx) {
    const activeHand = this.inputHandler.getActiveHand();
    
    // Get the active hand body part
    let hand = null;
    if (activeHand === 'left') {
      hand = this.character.leftHand;
    } else if (activeHand === 'right') {
      hand = this.character.rightHand;
    }
    
    if (!hand) return;
    
    // Draw pulsing highlight ring around active hand
    const pulseAlpha = 0.5 + 0.3 * Math.sin(this.highlightPulse);
    const pulseRadius = hand.radius + 3 + 2 * Math.sin(this.highlightPulse);
    
    ctx.save();
    ctx.strokeStyle = this.highlightColor;
    ctx.globalAlpha = pulseAlpha;
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    ctx.arc(hand.position.x, hand.position.y, pulseRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.restore();
    
    // Draw indicator text
    ctx.save();
    ctx.fillStyle = this.highlightColor;
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    
    const textY = hand.position.y - hand.radius - 15;
    ctx.strokeText(`${activeHand.toUpperCase()}`, hand.position.x, textY);
    ctx.fillText(`${activeHand.toUpperCase()}`, hand.position.x, textY);
    
    ctx.restore();
  }
}
