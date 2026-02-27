/**
 * BodyPart class for Verlet integration physics
 * Represents a physical body part with position-based dynamics
 */
import { Vec2 } from './Vec2.js';

export class BodyPart {
  /**
   * Create a new body part
   * @param {Vec2} position - Initial position
   * @param {number} mass - Mass of the body part (kg)
   * @param {number} radius - Radius for collision (pixels)
   * @param {string} type - Type of body part (e.g., 'head', 'torso', 'hand')
   */
  constructor(position, mass = 1, radius = 10, type = 'generic') {
    this.position = position.clone();
    this.oldPosition = position.clone();
    this.mass = mass;
    this.radius = radius;
    this.type = type;
    
    // Accumulated forces for this frame
    this.force = Vec2.zero();
    
    // Whether this body part is affected by physics
    this.isDynamic = true;
    
    // Damping factor (0-1, where 1 = no damping)
    this.damping = 0.99;
  }

  /**
   * Get the current velocity (derived from position history)
   * @returns {Vec2} Current velocity
   */
  get velocity() {
    return this.position.sub(this.oldPosition);
  }

  /**
   * Set the velocity directly
   * @param {Vec2} v - New velocity
   */
  set velocity(v) {
    this.oldPosition = this.position.sub(v);
  }

  /**
   * Apply a force to this body part
   * @param {Vec2} force - Force vector to apply
   */
  applyForce(force) {
    this.force = this.force.add(force);
  }

  /**
   * Apply an impulse (instant velocity change)
   * @param {Vec2} impulse - Impulse vector to apply
   */
  applyImpulse(impulse) {
    if (!this.isDynamic) return;
    
    // Impulse directly modifies velocity
    const velocityChange = impulse.div(this.mass);
    this.oldPosition = this.oldPosition.sub(velocityChange);
  }

  /**
   * Update position using Verlet integration
   * @param {number} dt - Time step in seconds
   */
  update(dt) {
    if (!this.isDynamic) {
      this.force = Vec2.zero();
      return;
    }

    // Calculate acceleration from accumulated forces
    const acceleration = this.force.div(this.mass);
    
    // Verlet integration: x(t+dt) = x(t) + [x(t) - x(t-dt)] * damping + a * dt^2
    const velocity = this.position.sub(this.oldPosition).mul(this.damping);
    const newPosition = this.position.add(velocity).add(acceleration.mul(dt * dt));
    
    // Update positions
    this.oldPosition = this.position.clone();
    this.position = newPosition;
    
    // Clear forces for next frame
    this.force = Vec2.zero();
  }

  /**
   * Set position directly (useful for constraints)
   * @param {Vec2} pos - New position
   */
  setPosition(pos) {
    this.position = pos.clone();
  }

  /**
   * Move the body part by a delta
   * @param {Vec2} delta - Movement delta
   */
  move(delta) {
    this.position = this.position.add(delta);
  }

  /**
   * Pin this body part in place (make it static)
   */
  pin() {
    this.isDynamic = false;
  }

  /**
   * Unpin this body part (make it dynamic)
   */
  unpin() {
    this.isDynamic = true;
  }

  /**
   * Clone this body part
   * @returns {BodyPart} New body part with same properties
   */
  clone() {
    const part = new BodyPart(this.position, this.mass, this.radius, this.type);
    part.oldPosition = this.oldPosition.clone();
    part.isDynamic = this.isDynamic;
    part.damping = this.damping;
    return part;
  }
}
