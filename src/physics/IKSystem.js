/**
 * IKSystem - Inverse Kinematics solver for two-bone chains
 * Implements law of cosines for joint angle calculation
 * Validates: Requirements 3.1, 3.3, 3.4, 3.6
 */
import { Vec2 } from './Vec2.js';

export class IKSystem {
  /**
   * Solve two-bone IK for an arm (shoulder-elbow-hand chain)
   * @param {BodyPart} shoulder - Shoulder body part (root)
   * @param {BodyPart} elbow - Elbow body part (middle joint)
   * @param {BodyPart} hand - Hand body part (end effector)
   * @param {Vec2} targetPos - Target position for the hand
   * @param {Object} options - Optional parameters
   * @param {number} options.minElbowAngle - Minimum elbow angle in radians (default: 0.349)
   * @param {number} options.maxElbowAngle - Maximum elbow angle in radians (default: 2.618)
   * @returns {boolean} True if target was reachable, false if clamped to max reach
   */
  static solveArm(shoulder, elbow, hand, targetPos, options = {}) {
    const minElbowAngle = options.minElbowAngle || 0.349; // 20°
    const maxElbowAngle = options.maxElbowAngle || 2.618; // 150°
    
    // Calculate bone lengths
    const upperLength = shoulder.position.distanceTo(elbow.position);
    const lowerLength = elbow.position.distanceTo(hand.position);
    
    // Calculate distance to target
    const toTarget = targetPos.sub(shoulder.position);
    const targetDist = toTarget.magnitude();
    
    // Maximum reachable distance
    const maxReach = upperLength + lowerLength;
    
    // Clamp target to reachable distance
    let reachable = true;
    let effectiveTarget = targetPos;
    
    if (targetDist > maxReach) {
      // Target is out of reach - extend arm fully toward target
      effectiveTarget = shoulder.position.add(toTarget.normalize().mul(maxReach * 0.99));
      reachable = false;
    }
    
    // Recalculate distance with effective target
    const effectiveDist = shoulder.position.distanceTo(effectiveTarget);
    
    // Handle edge case: target too close
    if (effectiveDist < Math.abs(upperLength - lowerLength)) {
      // Target is too close - use minimum distance
      effectiveTarget = shoulder.position.add(toTarget.normalize().mul(Math.abs(upperLength - lowerLength) + 1));
    }
    
    const finalDist = shoulder.position.distanceTo(effectiveTarget);
    
    // Law of cosines to find elbow angle
    // c² = a² + b² - 2ab*cos(C)
    // cos(C) = (a² + b² - c²) / (2ab)
    const cosElbowAngle = (upperLength * upperLength + lowerLength * lowerLength - finalDist * finalDist) / 
                          (2 * upperLength * lowerLength);
    
    // Clamp to valid range [-1, 1] to avoid NaN from floating point errors
    const clampedCos = Math.max(-1, Math.min(1, cosElbowAngle));
    let elbowAngle = Math.acos(clampedCos);
    
    // Apply joint constraints
    elbowAngle = Math.max(minElbowAngle, Math.min(maxElbowAngle, elbowAngle));
    
    // Calculate shoulder angle
    // First, find the angle to the target
    const targetAngle = Math.atan2(effectiveTarget.y - shoulder.position.y, 
                                   effectiveTarget.x - shoulder.position.x);
    
    // Then, find the angle offset due to elbow bend
    // Using law of cosines again for the shoulder angle
    const cosShoulderOffset = (upperLength * upperLength + finalDist * finalDist - lowerLength * lowerLength) / 
                              (2 * upperLength * finalDist);
    const clampedShoulderCos = Math.max(-1, Math.min(1, cosShoulderOffset));
    const shoulderOffset = Math.acos(clampedShoulderCos);
    
    // Determine bend direction (we want elbow to bend downward/outward)
    // For right arm, bend right; for left arm, bend left
    const bendDirection = (hand.position.x > shoulder.position.x) ? -1 : 1;
    const shoulderAngle = targetAngle + shoulderOffset * bendDirection;
    
    // Apply IK solution by positioning the joints
    // Position elbow
    const elbowPos = shoulder.position.add(
      new Vec2(Math.cos(shoulderAngle), Math.sin(shoulderAngle)).mul(upperLength)
    );
    
    // Update elbow position while preserving velocity
    const elbowVelocity = elbow.velocity.clone();
    elbow.setPosition(elbowPos);
    elbow.oldPosition = elbowPos.sub(elbowVelocity);
    
    // Position hand
    const handAngle = shoulderAngle + (Math.PI - elbowAngle) * bendDirection;
    const handPos = elbowPos.add(
      new Vec2(Math.cos(handAngle), Math.sin(handAngle)).mul(lowerLength)
    );
    
    // Update hand position while preserving velocity
    const handVelocity = hand.velocity.clone();
    hand.setPosition(handPos);
    hand.oldPosition = handPos.sub(handVelocity);
    
    return reachable;
  }

  /**
   * Solve two-bone IK for a leg (hip-knee-foot chain)
   * @param {BodyPart} hip - Hip body part (root)
   * @param {BodyPart} knee - Knee body part (middle joint)
   * @param {BodyPart} foot - Foot body part (end effector)
   * @param {Vec2} targetPos - Target position for the foot
   * @param {Object} options - Optional parameters
   * @param {number} options.minKneeAngle - Minimum knee angle in radians (default: 0.349)
   * @param {number} options.maxKneeAngle - Maximum knee angle in radians (default: 2.618)
   * @returns {boolean} True if target was reachable, false if clamped to max reach
   */
  static solveLeg(hip, knee, foot, targetPos, options = {}) {
    const minKneeAngle = options.minKneeAngle || 0.349; // 20°
    const maxKneeAngle = options.maxKneeAngle || 2.618; // 150°
    
    // Calculate bone lengths
    const upperLength = hip.position.distanceTo(knee.position);
    const lowerLength = knee.position.distanceTo(foot.position);
    
    // Calculate distance to target
    const toTarget = targetPos.sub(hip.position);
    const targetDist = toTarget.magnitude();
    
    // Maximum reachable distance
    const maxReach = upperLength + lowerLength;
    
    // Clamp target to reachable distance
    let reachable = true;
    let effectiveTarget = targetPos;
    
    if (targetDist > maxReach) {
      // Target is out of reach - extend leg fully toward target
      effectiveTarget = hip.position.add(toTarget.normalize().mul(maxReach * 0.99));
      reachable = false;
    }
    
    // Recalculate distance with effective target
    const effectiveDist = hip.position.distanceTo(effectiveTarget);
    
    // Handle edge case: target too close
    if (effectiveDist < Math.abs(upperLength - lowerLength)) {
      effectiveTarget = hip.position.add(toTarget.normalize().mul(Math.abs(upperLength - lowerLength) + 1));
    }
    
    const finalDist = hip.position.distanceTo(effectiveTarget);
    
    // Law of cosines to find knee angle
    const cosKneeAngle = (upperLength * upperLength + lowerLength * lowerLength - finalDist * finalDist) / 
                         (2 * upperLength * lowerLength);
    
    const clampedCos = Math.max(-1, Math.min(1, cosKneeAngle));
    let kneeAngle = Math.acos(clampedCos);
    
    // Apply joint constraints
    kneeAngle = Math.max(minKneeAngle, Math.min(maxKneeAngle, kneeAngle));
    
    // Calculate hip angle
    const targetAngle = Math.atan2(effectiveTarget.y - hip.position.y, 
                                   effectiveTarget.x - hip.position.x);
    
    const cosHipOffset = (upperLength * upperLength + finalDist * finalDist - lowerLength * lowerLength) / 
                         (2 * upperLength * finalDist);
    const clampedHipCos = Math.max(-1, Math.min(1, cosHipOffset));
    const hipOffset = Math.acos(clampedHipCos);
    
    // For legs, knee bends forward (positive direction)
    const bendDirection = 1;
    const hipAngle = targetAngle + hipOffset * bendDirection;
    
    // Apply IK solution
    // Position knee
    const kneePos = hip.position.add(
      new Vec2(Math.cos(hipAngle), Math.sin(hipAngle)).mul(upperLength)
    );
    
    // Update knee position while preserving velocity
    const kneeVelocity = knee.velocity.clone();
    knee.setPosition(kneePos);
    knee.oldPosition = kneePos.sub(kneeVelocity);
    
    // Position foot
    const footAngle = hipAngle + (Math.PI - kneeAngle) * bendDirection;
    const footPos = kneePos.add(
      new Vec2(Math.cos(footAngle), Math.sin(footAngle)).mul(lowerLength)
    );
    
    // Update foot position while preserving velocity
    const footVelocity = foot.velocity.clone();
    foot.setPosition(footPos);
    foot.oldPosition = footPos.sub(footVelocity);
    
    return reachable;
  }

  /**
   * Calculate the maximum reach distance for a two-bone chain
   * @param {BodyPart} root - Root body part
   * @param {BodyPart} middle - Middle joint body part
   * @param {BodyPart} end - End effector body part
   * @returns {number} Maximum reach distance
   */
  static getMaxReach(root, middle, end) {
    const upperLength = root.position.distanceTo(middle.position);
    const lowerLength = middle.position.distanceTo(end.position);
    return upperLength + lowerLength;
  }

  /**
   * Check if a target position is within reach
   * @param {BodyPart} root - Root body part
   * @param {BodyPart} middle - Middle joint body part
   * @param {BodyPart} end - End effector body part
   * @param {Vec2} targetPos - Target position
   * @returns {boolean} True if target is within reach
   */
  static isWithinReach(root, middle, end, targetPos) {
    const maxReach = this.getMaxReach(root, middle, end);
    const distance = root.position.distanceTo(targetPos);
    return distance <= maxReach;
  }
}
