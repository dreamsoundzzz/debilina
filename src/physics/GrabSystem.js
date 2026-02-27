/**
 * GrabSystem class
 * Manages hand-object interactions and gripping mechanics
 * Implements grab radius detection, nearest object finding, and constraint-based grabbing
 */
import { DistanceConstraint } from './DistanceConstraint.js';

export class GrabSystem {
  /**
   * Create a new grab system
   * @param {number} grabRadius - Detection radius for grabbable objects (default 30 pixels)
   */
  constructor(grabRadius = 30) {
    this.grabRadius = grabRadius;
    
    // Map of hand -> { object, constraint }
    this.activeGrabs = new Map();
  }

  /**
   * Attempt to grab an object with a hand
   * Finds the nearest grabbable object within radius and creates a constraint
   * @param {BodyPart} hand - The hand body part attempting to grab
   * @param {Array} objects - Array of game objects that could be grabbed
   * @returns {Object|null} The grabbed object, or null if no object was grabbed
   */
  tryGrab(hand, objects) {
    // Check if hand is already grabbing something
    if (this.activeGrabs.has(hand)) {
      return null;
    }

    // Filter to only grabbable objects within radius
    const nearby = objects.filter(obj => 
      obj.grabbable && hand.position.distanceTo(obj.position) < this.grabRadius
    );

    if (nearby.length === 0) {
      return null;
    }

    // Find nearest object
    const target = nearby.reduce((nearest, obj) => {
      const distToObj = hand.position.distanceTo(obj.position);
      const distToNearest = hand.position.distanceTo(nearest.position);
      return distToObj < distToNearest ? obj : nearest;
    });

    // Create distance constraint between hand and object (distance = 0 for tight grip)
    const constraint = new DistanceConstraint(hand, target, 0, 1.0);

    // Store the active grab
    this.activeGrabs.set(hand, { object: target, constraint });

    return target;
  }

  /**
   * Release an object from a hand
   * Removes the constraint and applies release velocity
   * @param {BodyPart} hand - The hand releasing the object
   * @returns {Object|null} The released object, or null if hand wasn't grabbing anything
   */
  release(hand) {
    const grab = this.activeGrabs.get(hand);
    if (!grab) {
      return null;
    }

    // Apply hand's velocity to the released object
    const velocity = hand.velocity.clone();
    grab.object.velocity = velocity;

    // Remove the grab
    this.activeGrabs.delete(hand);

    return grab.object;
  }

  /**
   * Check if a hand is currently grabbing an object
   * @param {BodyPart} hand - The hand to check
   * @returns {boolean} True if the hand is grabbing something
   */
  isGrabbing(hand) {
    return this.activeGrabs.has(hand);
  }

  /**
   * Get the object currently grabbed by a hand
   * @param {BodyPart} hand - The hand to check
   * @returns {Object|null} The grabbed object, or null if not grabbing
   */
  getGrabbedObject(hand) {
    const grab = this.activeGrabs.get(hand);
    return grab ? grab.object : null;
  }

  /**
   * Update all active grabs (solve constraints)
   * Should be called during the constraint solving phase
   */
  update() {
    // Solve all grab constraints
    for (const grab of this.activeGrabs.values()) {
      grab.constraint.solve();
    }
  }

  /**
   * Get all active grabs
   * @returns {Map} Map of hand -> {object, constraint}
   */
  getActiveGrabs() {
    return this.activeGrabs;
  }

  /**
   * Release all grabs (useful for cleanup or reset)
   */
  releaseAll() {
    // Apply velocities to all grabbed objects
    for (const [hand, grab] of this.activeGrabs.entries()) {
      grab.object.velocity = hand.velocity.clone();
    }
    
    // Clear all grabs
    this.activeGrabs.clear();
  }

  /**
   * Set the grab radius
   * @param {number} radius - New grab radius in pixels
   */
  setGrabRadius(radius) {
    this.grabRadius = Math.max(0, radius);
  }

  /**
   * Get the grab radius
   * @returns {number} Current grab radius in pixels
   */
  getGrabRadius() {
    return this.grabRadius;
  }
}
