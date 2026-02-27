/**
 * VerletPhysics class - manages Verlet integration physics simulation
 * Handles gravity application and physics updates for all dynamic entities
 */
import { Vec2 } from './Vec2.js';

export class VerletPhysics {
  /**
   * Create a new Verlet physics system
   * @param {Object} options - Configuration options
   * @param {Vec2} options.gravity - Gravity vector (default: 9.8 m/s² downward)
   * @param {number} options.substeps - Number of constraint solving iterations (default: 5)
   */
  constructor(options = {}) {
    // Default gravity: 9.8 m/s² downward (in pixels, assuming 1 pixel = 0.01m)
    // So 9.8 m/s² = 980 pixels/s²
    this.gravity = options.gravity || new Vec2(0, 980);
    
    // Number of constraint solving iterations per frame
    this.substeps = options.substeps || 5;
    
    // List of all body parts in the simulation
    this.bodyParts = [];
    
    // List of constraints (will be added in future tasks)
    this.constraints = [];
  }

  /**
   * Add a body part to the physics simulation
   * @param {BodyPart} bodyPart - Body part to add
   */
  addBodyPart(bodyPart) {
    if (!this.bodyParts.includes(bodyPart)) {
      this.bodyParts.push(bodyPart);
    }
  }

  /**
   * Remove a body part from the physics simulation
   * @param {BodyPart} bodyPart - Body part to remove
   */
  removeBodyPart(bodyPart) {
    const index = this.bodyParts.indexOf(bodyPart);
    if (index !== -1) {
      this.bodyParts.splice(index, 1);
    }
  }

  /**
   * Apply gravity to all dynamic body parts
   */
  applyGravity() {
    for (const part of this.bodyParts) {
      if (part.isDynamic) {
        // F = m * g
        const gravityForce = this.gravity.mul(part.mass);
        part.applyForce(gravityForce);
      }
    }
  }

  /**
   * Update all body parts using Verlet integration
   * @param {number} dt - Time step in seconds
   */
  updateBodyParts(dt) {
    for (const part of this.bodyParts) {
      part.update(dt);
    }
  }

  /**
   * Add a constraint to the physics simulation
   * @param {Constraint} constraint - Constraint to add
   */
  addConstraint(constraint) {
    if (!this.constraints.includes(constraint)) {
      this.constraints.push(constraint);
    }
  }

  /**
   * Remove a constraint from the physics simulation
   * @param {Constraint} constraint - Constraint to remove
   */
  removeConstraint(constraint) {
    const index = this.constraints.indexOf(constraint);
    if (index !== -1) {
      this.constraints.splice(index, 1);
    }
  }

  /**
   * Solve constraints using iterative method
   * Multiple iterations improve stability and convergence
   */
  solveConstraints() {
    // Iterate multiple times for stability
    for (let i = 0; i < this.substeps; i++) {
      for (const constraint of this.constraints) {
        if (constraint.enabled) {
          constraint.solve();
        }
      }
    }
  }

  /**
   * Main physics update loop
   * @param {number} dt - Time step in seconds
   */
  update(dt) {
    // Apply gravity to all dynamic entities
    this.applyGravity();
    
    // Update positions using Verlet integration
    this.updateBodyParts(dt);
    
    // Solve constraints (5 iterations for stability)
    this.solveConstraints();
  }

  /**
   * Set gravity vector
   * @param {Vec2} gravity - New gravity vector
   */
  setGravity(gravity) {
    this.gravity = gravity.clone();
  }

  /**
   * Get the current gravity vector
   * @returns {Vec2} Current gravity
   */
  getGravity() {
    return this.gravity.clone();
  }

  /**
   * Clear all body parts and constraints
   */
  clear() {
    this.bodyParts = [];
    this.constraints = [];
  }

  /**
   * Get the number of body parts in the simulation
   * @returns {number} Number of body parts
   */
  getBodyPartCount() {
    return this.bodyParts.length;
  }

  /**
   * Get all body parts
   * @returns {BodyPart[]} Array of body parts
   */
  getBodyParts() {
    return [...this.bodyParts];
  }

  /**
   * Get the number of constraints in the simulation
   * @returns {number} Number of constraints
   */
  getConstraintCount() {
    return this.constraints.length;
  }

  /**
   * Get all constraints
   * @returns {Constraint[]} Array of constraints
   */
  getConstraints() {
    return [...this.constraints];
  }
}
