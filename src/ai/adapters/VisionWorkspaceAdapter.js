/**
 * VisionWorkspaceAdapter integrates VisionSystem with GlobalWorkspace
 * Submits salient visual percepts to workspace for conscious awareness
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

export class VisionWorkspaceAdapter {
  /**
   * Create a new vision workspace adapter
   * @param {VisionSystem} visionSystem - Vision system instance
   * @param {GlobalWorkspace} workspace - Global workspace instance
   */
  constructor(visionSystem, workspace) {
    this.visionSystem = visionSystem;
    this.workspace = workspace;
    
    // Track submitted entities to avoid duplicate submissions (Requirement 5.5)
    this.submittedEntities = new Map(); // entityId -> {position, timestamp}
    this.routineFilterWindow = 5000; // 5 seconds
  }

  /**
   * Update adapter - check vision and submit salient content to workspace
   * @param {number} currentTime - Current time in milliseconds
   */
  update(currentTime = Date.now()) {
    // Get visible entities with details
    const visibleEntities = this.visionSystem.getVisibleEntitiesWithDetails();
    
    // Submit salient entities to workspace
    for (const entityInfo of visibleEntities) {
      this.processEntity(entityInfo, currentTime);
    }
    
    // Detect and submit hazards
    const hazards = this.visionSystem.detectHazards();
    for (const hazard of hazards) {
      this.processHazard(hazard, currentTime);
    }
    
    // Clean up old submissions
    this.cleanupSubmissionHistory(currentTime);
  }

  /**
   * Process a visible entity and submit to workspace if salient
   * @param {Object} entityInfo - Entity information from vision system
   * @param {number} currentTime - Current time in milliseconds
   */
  processEntity(entityInfo, currentTime) {
    const entity = entityInfo.entity;
    
    // Skip if routine observation (Requirement 5.5)
    if (this.isRoutineObservation(entity, entityInfo.position, currentTime)) {
      return;
    }
    
    // Determine salience and submit based on entity type
    
    // Hazardous objects (Requirement 5.2)
    if (entityInfo.isHazardous) {
      const salience = entityInfo.threatLevel === 'high' ? 0.9 : 0.8;
      
      this.workspace.submit(
        {
          type: 'hazard_detected',
          entity: entity,
          position: entityInfo.position,
          hazardType: entity.type,
          threatLevel: entityInfo.threatLevel,
          explosive: entity.explosive || false,
          onFire: entity.onFire || false
        },
        {
          source: 'VisionSystem',
          type: 'hazard',
          urgency: salience,
          emotionalIntensity: 0.7 // Hazards trigger fear
        }
      );
      
      this.markAsSubmitted(entity, entityInfo.position, currentTime);
      return;
    }
    
    // Weapons (Requirement 5.3)
    if (entityInfo.isWeapon) {
      this.workspace.submit(
        {
          type: 'weapon_detected',
          entity: entity,
          position: entityInfo.position,
          weaponType: entityInfo.weaponType,
          damageType: entityInfo.damageType,
          threatLevel: entityInfo.threatLevel,
          heldBy: entity.heldBy || null
        },
        {
          source: 'VisionSystem',
          type: 'weapon',
          urgency: 0.8,
          emotionalIntensity: entity.heldBy ? 0.8 : 0.5 // Higher if held
        }
      );
      
      this.markAsSubmitted(entity, entityInfo.position, currentTime);
      return;
    }
    
    // Novel entities (Requirement 5.1)
    if (this.isNovelEntity(entity, currentTime)) {
      this.workspace.submit(
        {
          type: 'novel_entity',
          entity: entity,
          position: entityInfo.position,
          entityType: entityInfo.type
        },
        {
          source: 'VisionSystem',
          type: 'novel_percept',
          urgency: 0.5,
          emotionalIntensity: 0.3 // Mild curiosity
        }
      );
      
      this.markAsSubmitted(entity, entityInfo.position, currentTime);
    }
  }

  /**
   * Process a detected hazard and submit to workspace
   * @param {Object} hazard - Hazard information
   * @param {number} currentTime - Current time in milliseconds
   */
  processHazard(hazard, currentTime) {
    const salience = hazard.severity === 'critical' ? 1.0 : 0.9;
    
    this.workspace.submit(
      {
        type: 'hazard_situation',
        hazardType: hazard.type,
        severity: hazard.severity,
        message: hazard.message,
        details: hazard
      },
      {
        source: 'VisionSystem',
        type: 'hazard',
        urgency: salience,
        emotionalIntensity: 0.9 // High fear response
      }
    );
  }

  /**
   * Check if entity observation is routine (already seen recently)
   * @param {Object} entity - Entity to check
   * @param {Vec2} position - Current position
   * @param {number} currentTime - Current time
   * @returns {boolean} True if routine observation
   * 
   * Requirement 5.5: Don't submit routine observations
   */
  isRoutineObservation(entity, position, currentTime) {
    if (!entity.id) {
      return false; // Can't track without ID
    }
    
    const submission = this.submittedEntities.get(entity.id);
    if (!submission) {
      return false; // Never submitted before
    }
    
    // Check if recently submitted
    const timeSinceSubmission = currentTime - submission.timestamp;
    if (timeSinceSubmission > this.routineFilterWindow) {
      return false; // Old submission, not routine anymore
    }
    
    // Check if position changed significantly
    if (position && submission.position) {
      const distance = position.distanceTo(submission.position);
      if (distance > 50) {
        return false; // Moved significantly, not routine
      }
    }
    
    return true; // Same entity, same location, recently submitted = routine
  }

  /**
   * Check if entity is novel (not seen before)
   * @param {Object} entity - Entity to check
   * @param {number} currentTime - Current time
   * @returns {boolean} True if novel
   */
  isNovelEntity(entity, currentTime) {
    if (!entity.id) {
      return true; // No ID = treat as novel
    }
    
    const submission = this.submittedEntities.get(entity.id);
    if (!submission) {
      return true; // Never seen before
    }
    
    // Check if seen recently
    const timeSinceSubmission = currentTime - submission.timestamp;
    return timeSinceSubmission > this.routineFilterWindow;
  }

  /**
   * Mark entity as submitted to workspace
   * @param {Object} entity - Entity that was submitted
   * @param {Vec2} position - Entity position
   * @param {number} currentTime - Current time
   */
  markAsSubmitted(entity, position, currentTime) {
    if (!entity.id) {
      return; // Can't track without ID
    }
    
    this.submittedEntities.set(entity.id, {
      position: position ? position.clone() : null,
      timestamp: currentTime
    });
  }

  /**
   * Clean up old submission history
   * @param {number} currentTime - Current time
   */
  cleanupSubmissionHistory(currentTime) {
    const maxAge = this.routineFilterWindow * 2; // Keep history for 2x filter window
    
    for (const [entityId, submission] of this.submittedEntities.entries()) {
      if (currentTime - submission.timestamp > maxAge) {
        this.submittedEntities.delete(entityId);
      }
    }
  }

  /**
   * Reset adapter state
   */
  reset() {
    this.submittedEntities.clear();
  }
}
