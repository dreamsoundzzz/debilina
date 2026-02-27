/**
 * LocomotionSystem - Handles character walking and procedural leg animation
 * Implements procedural walking with step cycles and IK-based foot placement
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
 */
import { Vec2 } from './Vec2.js';
import { IKSystem } from './IKSystem.js';

export class LocomotionSystem {
  /**
   * Create a new locomotion system
   * @param {Object} options - Configuration options
   * @param {number} options.walkSpeed - Walking speed multiplier (default: 200)
   * @param {number} options.stepHeight - How high feet lift during steps (default: 15)
   * @param {number} options.stepLength - How far forward feet step (default: 30)
   * @param {number} options.stepFrequency - Steps per second (default: 2)
   * @param {number} options.balanceForce - Force applied to maintain upright posture (default: 100)
   * @param {number} options.airControlFactor - Air control multiplier (default: 0.3)
   * @param {number} options.maxSlopeAngle - Maximum slope angle in radians before speed reduction (default: π/6)
   */
  constructor(options = {}) {
    this.walkSpeed = options.walkSpeed || 200;
    this.stepHeight = options.stepHeight || 15;
    this.stepLength = options.stepLength || 30;
    this.stepFrequency = options.stepFrequency || 2;
    this.balanceForce = options.balanceForce || 100;
    this.airControlFactor = options.airControlFactor || 0.3;
    this.maxSlopeAngle = options.maxSlopeAngle || Math.PI / 6; // 30 degrees
    
    // Step cycle tracking (0 to 2π)
    this.stepCycle = 0;
    
    // IK system for leg positioning
    this.ikSystem = IKSystem;
  }

  /**
   * Update character locomotion
   * @param {Character} character - The character to move
   * @param {number} moveDirection - Movement direction (-1 for left, 0 for none, 1 for right)
   * @param {number} dt - Time step in seconds
   * @param {boolean} isGrounded - Whether the character is on the ground
   * @param {number} terrainSlope - Terrain slope angle in radians (optional, default: 0)
   * @param {number} speedMultiplier - Speed multiplier for needs-based effects (optional, default: 1.0)
   */
  update(character, moveDirection, dt, isGrounded = true, terrainSlope = 0, speedMultiplier = 1.0) {
    // Apply balance forces to keep torso upright (Requirement 5.3, 5.7)
    this.applyBalanceForces(character, dt);
    
    // Calculate effective walk speed based on terrain slope (Requirement 5.6)
    let effectiveWalkSpeed = this.calculateSlopeAdjustedSpeed(terrainSlope);
    
    // Apply speed multiplier for needs-based effects (Requirement 27.6)
    effectiveWalkSpeed *= speedMultiplier;
    
    if (moveDirection !== 0) {
      if (isGrounded) {
        // Apply horizontal force to torso based on input
        const walkForce = new Vec2(moveDirection * effectiveWalkSpeed, 0);
        character.torso.applyForce(walkForce);
        
        // Update step cycle for procedural animation
        this.stepCycle += dt * this.stepFrequency * Math.PI * 2;
        
        // Keep step cycle in range [0, 2π)
        while (this.stepCycle >= Math.PI * 2) {
          this.stepCycle -= Math.PI * 2;
        }
        
        // Calculate target foot positions for walking
        const leftFootTarget = this.calculateFootTarget(
          character,
          'left',
          this.stepCycle,
          moveDirection
        );
        
        const rightFootTarget = this.calculateFootTarget(
          character,
          'right',
          this.stepCycle + Math.PI, // Offset by π for alternating steps
          moveDirection
        );
        
        // Use IK to move feet toward targets
        this.ikSystem.solveLeg(
          character.leftThigh,
          character.leftShin,
          character.leftFoot,
          leftFootTarget
        );
        
        this.ikSystem.solveLeg(
          character.rightThigh,
          character.rightShin,
          character.rightFoot,
          rightFootTarget
        );
      } else {
        // Limited air control when airborne (Requirement 5.5)
        const airControlForce = new Vec2(moveDirection * effectiveWalkSpeed * this.airControlFactor, 0);
        character.torso.applyForce(airControlForce);
      }
    } else if (moveDirection === 0) {
      // Reset step cycle when not moving
      this.stepCycle = 0;
    }
  }

  /**
   * Apply corrective forces to keep torso upright
   * Implements balance and posture maintenance (Requirements 5.3, 5.7)
   * @param {Character} character - The character
   * @param {number} dt - Time step in seconds
   */
  applyBalanceForces(character, dt) {
    const torso = character.torso;
    const head = character.head;
    
    // Calculate torso tilt angle (0 = upright, positive = leaning right, negative = leaning left)
    const torsoAngle = this.calculateTorsoAngle(character);
    
    // Apply corrective torque to straighten torso
    // The force is proportional to the tilt angle
    const correctionForce = -torsoAngle * this.balanceForce;
    
    // Apply force to head to help straighten the body
    // This creates a torque around the torso
    const headOffset = head.position.sub(torso.position);
    const perpendicular = new Vec2(-headOffset.y, headOffset.x).normalize();
    const balanceForce = perpendicular.mul(correctionForce);
    
    head.applyForce(balanceForce);
    
    // Also apply counter-force to torso for stability
    torso.applyForce(balanceForce.mul(-0.5));
  }

  /**
   * Calculate the torso tilt angle
   * @param {Character} character - The character
   * @returns {number} Tilt angle in radians (0 = upright)
   */
  calculateTorsoAngle(character) {
    const torso = character.torso;
    const head = character.head;
    
    // Vector from torso to head
    const spineVector = head.position.sub(torso.position);
    
    // Calculate angle from vertical (0 = straight up)
    // atan2(x, y) gives angle from vertical axis
    const angle = Math.atan2(spineVector.x, -spineVector.y);
    
    return angle;
  }

  /**
   * Calculate walk speed adjusted for terrain slope
   * Implements slope-based speed adjustment (Requirement 5.6)
   * @param {number} slopeAngle - Terrain slope angle in radians
   * @returns {number} Adjusted walk speed
   */
  calculateSlopeAdjustedSpeed(slopeAngle) {
    const absSlopeAngle = Math.abs(slopeAngle);
    
    // No adjustment for gentle slopes
    if (absSlopeAngle <= this.maxSlopeAngle) {
      return this.walkSpeed;
    }
    
    // Reduce speed for steep slopes
    // Speed reduction is proportional to how much the slope exceeds maxSlopeAngle
    const excessAngle = absSlopeAngle - this.maxSlopeAngle;
    const speedReduction = Math.min(0.7, excessAngle / (Math.PI / 4)); // Max 70% reduction
    
    return this.walkSpeed * (1 - speedReduction);
  }

  /**
   * Calculate target foot position for walking animation
   * @param {Character} character - The character
   * @param {string} side - 'left' or 'right'
   * @param {number} cycle - Current step cycle phase (0 to 2π)
   * @param {number} direction - Movement direction (-1 or 1)
   * @returns {Vec2} Target position for the foot
   */
  calculateFootTarget(character, side, cycle, direction) {
    const torsoPos = character.torso.position;
    
    // Base foot position (standing position)
    const baseOffsetX = side === 'left' ? -10 : 10;
    const baseOffsetY = 80; // Distance below torso
    
    // Horizontal offset during step (moves forward and backward)
    const horizontalOffset = Math.cos(cycle) * this.stepLength * direction;
    
    // Vertical offset during step (foot lifts up)
    // Use sine wave so foot is on ground at start and end of cycle
    const verticalOffset = -Math.abs(Math.sin(cycle)) * this.stepHeight;
    
    // Calculate final target position
    const targetX = torsoPos.x + baseOffsetX + horizontalOffset;
    const targetY = torsoPos.y + baseOffsetY + verticalOffset;
    
    return new Vec2(targetX, targetY);
  }

  /**
   * Get the current step cycle phase (0 to 2π)
   * @returns {number} Current step cycle
   */
  getStepCycle() {
    return this.stepCycle;
  }

  /**
   * Reset the step cycle to initial position
   */
  resetStepCycle() {
    this.stepCycle = 0;
  }

  /**
   * Set walk speed
   * @param {number} speed - New walk speed
   */
  setWalkSpeed(speed) {
    this.walkSpeed = speed;
  }

  /**
   * Set balance force
   * @param {number} force - New balance force
   */
  setBalanceForce(force) {
    this.balanceForce = force;
  }

  /**
   * Set air control factor
   * @param {number} factor - New air control factor (0-1)
   */
  setAirControlFactor(factor) {
    this.airControlFactor = Math.max(0, Math.min(1, factor));
  }

  /**
   * Set maximum slope angle before speed reduction
   * @param {number} angle - Angle in radians
   */
  setMaxSlopeAngle(angle) {
    this.maxSlopeAngle = angle;
  }

  /**
   * Set step parameters
   * @param {Object} params - Step parameters
   * @param {number} params.stepHeight - Step height
   * @param {number} params.stepLength - Step length
   * @param {number} params.stepFrequency - Step frequency
   */
  setStepParameters(params) {
    if (params.stepHeight !== undefined) {
      this.stepHeight = params.stepHeight;
    }
    if (params.stepLength !== undefined) {
      this.stepLength = params.stepLength;
    }
    if (params.stepFrequency !== undefined) {
      this.stepFrequency = params.stepFrequency;
    }
  }
}
