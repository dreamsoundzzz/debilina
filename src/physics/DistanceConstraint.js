/**
 * DistanceConstraint class
 * Maintains a fixed distance between two body parts (like a rigid rod or bone)
 * Used for connecting body parts in ragdoll systems
 */
import { Constraint } from './Constraint.js';

export class DistanceConstraint extends Constraint {
  /**
   * Create a new distance constraint
   * @param {BodyPart} bodyA - First body part
   * @param {BodyPart} bodyB - Second body part
   * @param {number} distance - Target distance to maintain (if null, uses current distance)
   * @param {number} stiffness - Constraint stiffness (0-1, default 1.0 for rigid)
   */
  constructor(bodyA, bodyB, distance = null, stiffness = 1.0) {
    super(bodyA, bodyB);
    
    // If distance not specified, use current distance between bodies
    if (distance === null) {
      this.distance = bodyA.position.distanceTo(bodyB.position);
    } else {
      this.distance = distance;
    }
    
    // Stiffness controls how strongly the constraint is enforced
    // 1.0 = fully rigid, 0.5 = half strength (more flexible)
    this.stiffness = Math.max(0, Math.min(1, stiffness));
  }

  /**
   * Solve the distance constraint
   * Moves both body parts to maintain the target distance
   */
  solve() {
    if (!this.enabled) return;

    // Calculate current vector between bodies
    const delta = this.bodyB.position.sub(this.bodyA.position);
    const currentDistance = delta.magnitude();

    // Avoid division by zero
    if (currentDistance < 0.0001) return;

    // Calculate how much we need to correct
    const difference = (currentDistance - this.distance) / currentDistance;
    const correction = delta.mul(difference * 0.5 * this.stiffness);

    // Apply correction to both bodies (unless pinned)
    // If both are dynamic, split the correction 50/50
    // If one is static, the dynamic one moves 100%
    if (this.bodyA.isDynamic && this.bodyB.isDynamic) {
      // Both dynamic: split correction
      this.bodyA.position = this.bodyA.position.add(correction);
      this.bodyB.position = this.bodyB.position.sub(correction);
    } else if (this.bodyA.isDynamic) {
      // Only A is dynamic
      this.bodyA.position = this.bodyA.position.add(correction.mul(2));
    } else if (this.bodyB.isDynamic) {
      // Only B is dynamic
      this.bodyB.position = this.bodyB.position.sub(correction.mul(2));
    }
    // If both are static, do nothing
  }

  /**
   * Get the current distance between the constrained bodies
   * @returns {number} Current distance
   */
  getCurrentDistance() {
    return this.bodyA.position.distanceTo(this.bodyB.position);
  }

  /**
   * Set the target distance
   * @param {number} distance - New target distance
   */
  setDistance(distance) {
    this.distance = Math.max(0, distance);
  }

  /**
   * Get the target distance
   * @returns {number} Target distance
   */
  getDistance() {
    return this.distance;
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
}
