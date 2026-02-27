/**
 * Constraint base class
 * Base class for all physics constraints that maintain relationships between body parts
 */

export class Constraint {
  /**
   * Create a new constraint
   * @param {BodyPart} bodyA - First body part
   * @param {BodyPart} bodyB - Second body part
   */
  constructor(bodyA, bodyB) {
    this.bodyA = bodyA;
    this.bodyB = bodyB;
    this.enabled = true;
  }

  /**
   * Solve the constraint
   * This method should be overridden by subclasses
   */
  solve() {
    throw new Error('Constraint.solve() must be implemented by subclass');
  }

  /**
   * Enable this constraint
   */
  enable() {
    this.enabled = true;
  }

  /**
   * Disable this constraint
   */
  disable() {
    this.enabled = false;
  }
}
