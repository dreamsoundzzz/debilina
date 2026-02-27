/**
 * ReasoningWorkspaceAdapter integrates ReasoningLoop with GlobalWorkspace
 * Consumes workspace content for thought generation
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

export class ReasoningWorkspaceAdapter {
  /**
   * Create a new reasoning workspace adapter
   * @param {ReasoningLoop} reasoningLoop - Reasoning loop instance
   * @param {GlobalWorkspace} workspace - Global workspace instance
   */
  constructor(reasoningLoop, workspace) {
    this.reasoningLoop = reasoningLoop;
    this.workspace = workspace;
    
    // Store current workspace state
    this.currentWorkspaceState = null;
    
    // Subscribe to workspace broadcasts (Requirement 9.1)
    this.unsubscribe = this.workspace.subscribe('ReasoningLoop', (payload) => {
      this.onWorkspaceBroadcast(payload);
    });
  }

  /**
   * Handle workspace broadcast
   * @param {Object} payload - Broadcast payload
   * 
   * Requirement 9.1: Subscribe to workspace broadcasts
   */
  onWorkspaceBroadcast(payload) {
    // Store current workspace state (Requirement 9.2)
    this.currentWorkspaceState = payload;
    
    // Check for urgent content (Requirement 9.4)
    const hasUrgentContent = payload.contents.some(item => item.salience > 0.8);
    
    if (hasUrgentContent && !this.reasoningLoop.isThinking()) {
      // Trigger immediate thought generation
      const urgentItems = payload.contents.filter(item => item.salience > 0.8);
      const urgentContext = this.formatUrgentContent(urgentItems);
      this.reasoningLoop.forceThought(urgentContext);
    }
  }

  /**
   * Format urgent content for thought generation
   * @param {Array} urgentItems - Urgent workspace items
   * @returns {string} Formatted context
   */
  formatUrgentContent(urgentItems) {
    const descriptions = urgentItems.map(item => {
      if (item.content.description) {
        return item.content.description;
      } else if (item.content.message) {
        return item.content.message;
      } else if (item.content.event) {
        return item.content.event;
      } else {
        return `${item.type} (salience: ${item.salience.toFixed(2)})`;
      }
    });
    
    return descriptions.join('. ');
  }

  /**
   * Get workspace content for thought generation context
   * @returns {Object} Workspace content formatted for reasoning
   * 
   * Requirement 9.2: Integrate workspace content into context building
   */
  getWorkspaceContext() {
    if (!this.currentWorkspaceState) {
      return null;
    }
    
    // Extract top 3 items (Requirement 9.3)
    const topItems = this.currentWorkspaceState.contents.slice(0, 3);
    
    // Format as natural language (Requirement 9.5)
    const formattedContent = this.formatWorkspaceContent(topItems);
    
    return {
      focus: this.currentWorkspaceState.focus,
      topItems: topItems,
      formattedContent: formattedContent,
      occupancy: this.currentWorkspaceState.occupancy
    };
  }

  /**
   * Format workspace content as natural language
   * @param {Array} items - Workspace items
   * @returns {string} Natural language description
   * 
   * Requirement 9.5: Format workspace content as natural language
   */
  formatWorkspaceContent(items) {
    if (!items || items.length === 0) {
      return 'Nothing particularly salient in consciousness right now.';
    }
    
    const descriptions = [];
    
    for (const item of items) {
      const content = item.content;
      
      // Format based on content type
      if (content.type === 'hazard_detected') {
        descriptions.push(`I'm aware of a ${content.hazardType} nearby (threat level: ${content.threatLevel})`);
      } else if (content.type === 'weapon_detected') {
        descriptions.push(`I notice a ${content.weaponType} weapon${content.heldBy ? ' being held' : ''}`);
      } else if (content.type === 'novel_entity') {
        descriptions.push(`I see a ${content.entityType} that I haven't noticed before`);
      } else if (content.type === 'strong_emotion' || content.type === 'emotion_change') {
        descriptions.push(`I'm feeling ${content.emotion} (intensity: ${(content.intensity * 100).toFixed(0)}%)`);
      } else if (content.type === 'high_fear') {
        descriptions.push(`I'm experiencing intense fear`);
      } else if (content.type === 'need_urgent' || content.type === 'critical_need') {
        descriptions.push(`My ${content.needType} is ${content.urgencyLevel} (${content.currentValue.toFixed(0)}%)`);
      } else if (content.type === 'relevant_memory') {
        descriptions.push(`I'm remembering: ${content.event}`);
      } else if (content.type === 'hazard_situation') {
        descriptions.push(`${content.message}`);
      } else if (content.description) {
        descriptions.push(content.description);
      } else if (content.message) {
        descriptions.push(content.message);
      } else {
        descriptions.push(`${item.type} from ${item.source}`);
      }
    }
    
    return descriptions.join('. ');
  }

  /**
   * Enhance reasoning context with workspace content
   * This method is called by ReasoningLoop.buildContext()
   * @param {Object} baseContext - Base context from reasoning loop
   * @returns {Object} Enhanced context with workspace content
   * 
   * Requirement 9.2: Prioritize workspace content over other sources
   */
  enhanceContext(baseContext) {
    const workspaceContext = this.getWorkspaceContext();
    
    if (!workspaceContext) {
      return baseContext;
    }
    
    // Add workspace content to context (Requirement 9.2)
    return {
      ...baseContext,
      workspace: {
        focus: workspaceContext.focus,
        consciousContent: workspaceContext.formattedContent,
        topItems: workspaceContext.topItems.map(item => ({
          type: item.type,
          source: item.source,
          salience: item.salience
        })),
        occupancy: workspaceContext.occupancy
      },
      // Workspace content takes priority in prompt
      workspaceNote: `Currently in your conscious awareness: ${workspaceContext.formattedContent}`
    };
  }

  /**
   * Build enhanced reasoning prompt with workspace content
   * @param {string} basePrompt - Base prompt from reasoning loop
   * @param {Object} context - Enhanced context
   * @returns {string} Enhanced prompt
   * 
   * Requirement 9.3: Include top 3 workspace items in prompts
   */
  enhancePrompt(basePrompt, context) {
    if (!context.workspace) {
      return basePrompt;
    }
    
    // Prepend workspace content to prompt (Requirement 9.2, 9.3)
    const workspacePrompt = `\n\nCurrently in your conscious awareness:\n${context.workspace.consciousContent}\n\n`;
    
    return workspacePrompt + basePrompt;
  }

  /**
   * Check if workspace has urgent content
   * @returns {boolean} True if urgent content present
   */
  hasUrgentContent() {
    if (!this.currentWorkspaceState) {
      return false;
    }
    
    return this.currentWorkspaceState.contents.some(item => item.salience > 0.8);
  }

  /**
   * Get current focus from workspace
   * @returns {Object|null} Current focus item
   */
  getCurrentFocus() {
    if (!this.currentWorkspaceState) {
      return null;
    }
    
    return this.currentWorkspaceState.focus;
  }

  /**
   * Cleanup - unsubscribe from workspace
   */
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  /**
   * Reset adapter state
   */
  reset() {
    this.currentWorkspaceState = null;
  }
}
