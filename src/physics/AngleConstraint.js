/**
 * AngleConstraint class
 * Limits the angle between three body parts (like a joint with rotation limits)
 * Used for elbows, knees, and other joints that shouldn't hyperextend
 */
import { Constraint } from './Constraint.js';

export class AngleConstraint extends Constraint {
  /**
   * Create a new angle constraint
   * @param {BodyPart} bodyA - First body part (e.g., upper arm)
   * @param {BodyPart} bodyB - Middle body part (e.g., elbow joint)
   * @param {BodyPart} bodyC - Third body part (e.g., forearm)
   * @param {number} minAngle - Minimum allowed angle in radians
   * @param {number} maxAngle - Maximum allowed angle in radians
   * @param {number} stiffness - Constraint stiffness (0-1, default 1.0)
   */
  constructor(bodyA, bodyB, bodyC, minAngle, maxAngle, stiffness = 1.0) {
    // Use bodyB as the primary body for the base class
    super(bodyB, bodyC);
    
    this.bodyA = bodyA;
    this.bodyB = bodyB; // This is the joint/pivot point
    this.bodyC = bodyC;
    
    // Store angle limits in radians
    this.minAngle = minAngle;
    this.maxAngle = maxAngle;
    
    // Stiffness controls how strongly the constraint is enforced
    this.stiffness = Math.max(0, Math.min(1, stiffness));
  }

  /**
   * Calculate the current angle between three body parts
   * @returns {number} Current angle in radians
   */
  getCurrentAngle() {
    // Vector from B to A
    const vectorBA = this.bodyA.position.sub(this.bodyB.position);
    // Vector from B to C
    const vectorBC = this.bodyC.position.sub(this.bodyB.position);
    
    // Calculate angle using dot product
    // angle = acos((BA · BC) / (|BA| * |BC|))
    const dotProduct = vectorBA.dot(vectorBC);
    const magnitudeBA = vectorBA.magnitude();
    const magnitudeBC = vectorBC.magnitude();
    
    // Avoid division by zero
    if (magnitudeBA < 0.0001 || magnitudeBC < 0.0001) {
      return 0;
    }
    
    const cosAngle = dotProduct / (magnitudeBA * magnitudeBC);
    // Clamp to [-1, 1] to avoid NaN from floating point errors
    const clampedCos = Math.max(-1, Math.min(1, cosAngle));
    
    return Math.acos(clampedCos);
  }

  /**
   * Solve the angle constraint
   * Adjusts positions to keep the angle within limits
   */
  solve() {
    if (!this.enabled) return;

    const currentAngle = this.getCurrentAngle();
    
    // Check if angle is within limits
    if (currentAngle >= this.minAngle && currentAngle <= this.maxAngle) {
      return; // Constraint satisfied
    }

    // Determine target angle (clamp to nearest limit)
    let targetAngle;
    if (currentAngle < this.minAngle) {
      targetAngle = this.minAngle;
    } else {
      targetAngle = this.maxAngle;
    }

    // Calculate correction needed
    const angleDifference = targetAngle - currentAngle;
    
    // Get vectors from joint (B) to endpoints
    const vectorBA = this.bodyA.position.sub(this.bodyB.position);
    const vectorBC = this.bodyC.position.sub(this.bodyB.position);
    
    const lengthBA = vectorBA.magnitude();
    const lengthBC = vectorBC.magnitude();
    
    if (lengthBA < 0.0001 || lengthBC < 0.0001) return;

    // Calculate rotation correction
    // We'll rotate C around B to satisfy the constraint
    // This is a simplified approach that works well for small corrections
    const correctionFactor = angleDifference * this.stiffness * 0.5;
    
    // Calculate perpendicular vector for rotation
    // Cross product in 2D: perpendicular to BC
    const perpBC = vectorBC.perpendicular().normalize();
    
    // Apply correction based on which bodies are dynamic
    const correction = perpBC.mul(lengthBC * correctionFactor);
    
    if (this.bodyA.isDynamic && this.bodyC.isDynamic) {
      // Both endpoints dynamic: split correction
      this.bodyA.position = this.bodyA.position.sub(correction.mul(0.5));
      this.bodyC.position = this.bodyC.position.add(correction.mul(0.5));
    } else if (this.bodyA.isDynamic) {
      // Only A is dynamic
      this.bodyA.position = this.bodyA.position.sub(correction);
    } else if (this.bodyC.isDynamic) {
      // Only C is dynamic
      this.bodyC.position = this.bodyC.position.add(correction);
    }
    
    // If the middle joint (B) is dynamic, we could also adjust it,
    // but typically the joint is constrained by distance constraints
  }

  /**
   * Set the angle limits
   * @param {number} minAngle - Minimum angle in radians
   * @param {number} maxAngle - Maximum angle in radians
   */
  setAngleLimits(minAngle, maxAngle) {
    this.minAngle = minAngle;
    this.maxAngle = maxAngle;
  }

  /**
   * Get the angle limits
   * @returns {Object} Object with minAngle and maxAngle
   */
  getAngleLimits() {
    return {
      minAngle: this.minAngle,
      maxAngle: this.maxAngle
    };
  }

  /**
   * Set the stiffness
   * @param {number} stiffness - New stiffness (0-1)
   */
  setStiffness(stiffness) {
    this.stiffness = Math.max(0, Math.min(1, stiffness));
  }

  /**
   * Get the stiffness
   * @returns {number} Current stiffness
   */
  getStiffness() {
    return this.stiffness;
  }

  /**
   * Check if the current angle is within limits
   * @returns {boolean} True if angle is within limits
   */
  isWithinLimits() {
    const angle = this.getCurrentAngle();
    return angle >= this.minAngle && angle <= this.maxAngle;
  }
}
