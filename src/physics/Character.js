/**
 * Character class for articulated ragdoll characters
 * Creates a character with body parts, joints, and physics
 */
import { Vec2 } from './Vec2.js';
import { BodyPart } from './BodyPart.js';
import { DistanceConstraint } from './DistanceConstraint.js';
import { AngleConstraint } from './AngleConstraint.js';

export class Character {
  /**
   * Create a new character
   * @param {Vec2} position - Initial position (center of torso)
   * @param {string} name - Character name
   */
  constructor(position, name = 'Character') {
    this.name = name;
    this.position = position.clone();
    
    // Body parts
    this.bodyParts = [];
    this.head = null;
    this.torso = null;
    this.leftUpperArm = null;
    this.leftForearm = null;
    this.leftHand = null;
    this.rightUpperArm = null;
    this.rightForearm = null;
    this.rightHand = null;
    this.leftThigh = null;
    this.leftShin = null;
    this.leftFoot = null;
    this.rightThigh = null;
    this.rightShin = null;
    this.rightFoot = null;
    
    // Constraints (joints)
    this.constraints = [];
    
    // Create body parts in initial standing pose
    this.createBodyParts();
    
    // Create joints connecting body parts
    this.createJoints();
  }

  /**
   * Create all body parts with appropriate sizes and masses
   * Positions them in initial standing pose
   */
  createBodyParts() {
    const pos = this.position;
    
    // Torso (center of character)
    this.torso = new BodyPart(pos, 40, 15, 'torso');
    this.bodyParts.push(this.torso);
    
    // Head (above torso)
    this.head = new BodyPart(
      pos.add(new Vec2(0, -35)),
      5,
      20,
      'head'
    );
    this.bodyParts.push(this.head);
    
    // Left arm
    this.leftUpperArm = new BodyPart(
      pos.add(new Vec2(-20, -10)),
      3,
      6,
      'upperArm'
    );
    this.bodyParts.push(this.leftUpperArm);
    
    this.leftForearm = new BodyPart(
      pos.add(new Vec2(-20, 15)),
      2,
      5,
      'forearm'
    );
    this.bodyParts.push(this.leftForearm);
    
    this.leftHand = new BodyPart(
      pos.add(new Vec2(-20, 35)),
      0.5,
      8,
      'hand'
    );
    this.bodyParts.push(this.leftHand);
    
    // Right arm
    this.rightUpperArm = new BodyPart(
      pos.add(new Vec2(20, -10)),
      3,
      6,
      'upperArm'
    );
    this.bodyParts.push(this.rightUpperArm);
    
    this.rightForearm = new BodyPart(
      pos.add(new Vec2(20, 15)),
      2,
      5,
      'forearm'
    );
    this.bodyParts.push(this.rightForearm);
    
    this.rightHand = new BodyPart(
      pos.add(new Vec2(20, 35)),
      0.5,
      8,
      'hand'
    );
    this.bodyParts.push(this.rightHand);
    
    // Left leg
    this.leftThigh = new BodyPart(
      pos.add(new Vec2(-10, 30)),
      8,
      7,
      'thigh'
    );
    this.bodyParts.push(this.leftThigh);
    
    this.leftShin = new BodyPart(
      pos.add(new Vec2(-10, 60)),
      5,
      6,
      'shin'
    );
    this.bodyParts.push(this.leftShin);
    
    this.leftFoot = new BodyPart(
      pos.add(new Vec2(-10, 80)),
      1,
      8,
      'foot'
    );
    this.bodyParts.push(this.leftFoot);
    
    // Right leg
    this.rightThigh = new BodyPart(
      pos.add(new Vec2(10, 30)),
      8,
      7,
      'thigh'
    );
    this.bodyParts.push(this.rightThigh);
    
    this.rightShin = new BodyPart(
      pos.add(new Vec2(10, 60)),
      5,
      6,
      'shin'
    );
    this.bodyParts.push(this.rightShin);
    
    this.rightFoot = new BodyPart(
      pos.add(new Vec2(10, 80)),
      1,
      8,
      'foot'
    );
    this.bodyParts.push(this.rightFoot);
  }

  /**
   * Update all body parts
   * @param {number} dt - Time step in seconds
   */
  update(dt) {
    for (const part of this.bodyParts) {
      part.update(dt);
    }
  }

  /**
   * Get the center position of the character (torso position)
   * @returns {Vec2} Center position
   */
  getCenter() {
    return this.torso.position.clone();
  }

  /**
   * Get all body parts
   * @returns {BodyPart[]} Array of all body parts
   */
  getBodyParts() {
    return this.bodyParts;
  }

  /**
   * Create joints (constraints) connecting body parts
   * Defines joint connections with rotation limits
   */
  createJoints() {
    // Neck joint (head to torso)
    // Rotation limits: ±45° (±0.785 radians)
    this.constraints.push(
      new DistanceConstraint(this.torso, this.head, null, 1.0)
    );
    this.constraints.push(
      new AngleConstraint(
        this.torso,
        this.torso, // Pivot at torso top
        this.head,
        Math.PI - 0.785, // 135° (straight up - 45°)
        Math.PI + 0.785, // 225° (straight up + 45°)
        0.8
      )
    );

    // Left shoulder joint
    // Rotation limits: ±120° (±2.094 radians)
    this.constraints.push(
      new DistanceConstraint(this.torso, this.leftUpperArm, null, 1.0)
    );
    this.constraints.push(
      new AngleConstraint(
        this.torso,
        this.torso,
        this.leftUpperArm,
        0.524, // 30° minimum
        Math.PI - 0.524, // 150° maximum
        0.7
      )
    );

    // Left elbow joint
    // Rotation limits: 0° to 150° (0 to 2.618 radians) - no hyperextension
    this.constraints.push(
      new DistanceConstraint(this.leftUpperArm, this.leftForearm, null, 1.0)
    );
    this.constraints.push(
      new AngleConstraint(
        this.leftUpperArm,
        this.leftUpperArm,
        this.leftForearm,
        0.349, // 20° minimum (slight bend)
        2.618, // 150° maximum
        0.8
      )
    );

    // Left wrist joint
    this.constraints.push(
      new DistanceConstraint(this.leftForearm, this.leftHand, null, 1.0)
    );

    // Right shoulder joint
    // Rotation limits: ±120° (±2.094 radians)
    this.constraints.push(
      new DistanceConstraint(this.torso, this.rightUpperArm, null, 1.0)
    );
    this.constraints.push(
      new AngleConstraint(
        this.torso,
        this.torso,
        this.rightUpperArm,
        0.524, // 30° minimum
        Math.PI - 0.524, // 150° maximum
        0.7
      )
    );

    // Right elbow joint
    // Rotation limits: 0° to 150° (0 to 2.618 radians) - no hyperextension
    this.constraints.push(
      new DistanceConstraint(this.rightUpperArm, this.rightForearm, null, 1.0)
    );
    this.constraints.push(
      new AngleConstraint(
        this.rightUpperArm,
        this.rightUpperArm,
        this.rightForearm,
        0.349, // 20° minimum (slight bend)
        2.618, // 150° maximum
        0.8
      )
    );

    // Right wrist joint
    this.constraints.push(
      new DistanceConstraint(this.rightForearm, this.rightHand, null, 1.0)
    );

    // Left hip joint
    // Rotation limits: ±90° (±1.571 radians)
    this.constraints.push(
      new DistanceConstraint(this.torso, this.leftThigh, null, 1.0)
    );
    this.constraints.push(
      new AngleConstraint(
        this.torso,
        this.torso,
        this.leftThigh,
        0.524, // 30° minimum
        Math.PI - 0.524, // 150° maximum
        0.7
      )
    );

    // Left knee joint
    // Rotation limits: 0° to 150° (0 to 2.618 radians) - no hyperextension
    this.constraints.push(
      new DistanceConstraint(this.leftThigh, this.leftShin, null, 1.0)
    );
    this.constraints.push(
      new AngleConstraint(
        this.leftThigh,
        this.leftThigh,
        this.leftShin,
        0.349, // 20° minimum (slight bend)
        2.618, // 150° maximum
        0.8
      )
    );

    // Left ankle joint
    this.constraints.push(
      new DistanceConstraint(this.leftShin, this.leftFoot, null, 1.0)
    );

    // Right hip joint
    // Rotation limits: ±90° (±1.571 radians)
    this.constraints.push(
      new DistanceConstraint(this.torso, this.rightThigh, null, 1.0)
    );
    this.constraints.push(
      new AngleConstraint(
        this.torso,
        this.torso,
        this.rightThigh,
        0.524, // 30° minimum
        Math.PI - 0.524, // 150° maximum
        0.7
      )
    );

    // Right knee joint
    // Rotation limits: 0° to 150° (0 to 2.618 radians) - no hyperextension
    this.constraints.push(
      new DistanceConstraint(this.rightThigh, this.rightShin, null, 1.0)
    );
    this.constraints.push(
      new AngleConstraint(
        this.rightThigh,
        this.rightThigh,
        this.rightShin,
        0.349, // 20° minimum (slight bend)
        2.618, // 150° maximum
        0.8
      )
    );

    // Right ankle joint
    this.constraints.push(
      new DistanceConstraint(this.rightShin, this.rightFoot, null, 1.0)
    );
  }

  /**
   * Solve all constraints
   * Should be called multiple times per frame for stability
   */
  solveConstraints() {
    for (const constraint of this.constraints) {
      constraint.solve();
    }
  }

  /**
   * Get all constraints
   * @returns {Constraint[]} Array of all constraints
   */
  getConstraints() {
    return this.constraints;
  }
  
  /**
   * Make the character speak (display text bubble)
   * Requirement 10.11: Display message in text bubble above character
   * @param {string} message - Message to speak
   * @param {string} type - Bubble type ('speech', 'thought', 'meta-thought')
   */
  speak(message, type = 'speech') {
    // Emit event for text bubble system to handle
    // The actual TextBubble creation is handled by a manager system
    if (this.onSpeak) {
      this.onSpeak(this, message, type);
    }
  }
  
  /**
   * Receive a message from another character
   * Requirement 10.12: Receive player messages as high-priority observation
   * @param {string} message - Message received
   * @param {Character} sender - Character who sent the message
   */
  receiveMessage(message, sender) {
    // Emit event for AI system to process
    // The actual processing is handled by the AI reasoning system
    if (this.onReceiveMessage) {
      this.onReceiveMessage(this, message, sender);
    }
  }
}
