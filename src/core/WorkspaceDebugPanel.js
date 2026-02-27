/**
 * WorkspaceDebugPanel - Visualizes Global Workspace contents
 * Shows current conscious content, salience levels, and metrics
 */

export class WorkspaceDebugPanel {
  constructor() {
    this.visible = false;
    this.workspace = null;
    
    // Panel dimensions
    this.x = 10;
    this.y = 100;
    this.width = 350;
    this.maxHeight = 500;
    
    // Colors
    this.bgColor = 'rgba(0, 0, 0, 0.85)';
    this.textColor = '#ffffff';
    this.focusColor = '#ffff00';
    this.salienceColors = {
      critical: '#ff0000',
      high: '#ff8800',
      medium: '#ffff00',
      low: '#88ff88'
    };
  }

  /**
   * Set the workspace to visualize
   * @param {GlobalWorkspace} workspace - Workspace instance
   */
  setWorkspace(workspace) {
    this.workspace = workspace;
  }

  /**
   * Set the attention system to visualize
   * @param {AttentionSystem} attentionSystem - Attention system instance
   */
  setAttentionSystem(attentionSystem) {
    this.attentionSystem = attentionSystem;
  }

  /**
   * Set the confidence system to visualize
   * @param {ConfidenceSystem} confidenceSystem - Confidence system instance
   */
  setConfidenceSystem(confidenceSystem) {
    this.confidenceSystem = confidenceSystem;
  }

  /**
   * Toggle panel visibility
   */
  toggle() {
    this.visible = !this.visible;
  }

  /**
   * Show the panel
   */
  show() {
    this.visible = true;
  }

  /**
   * Hide the panel
   */
  hide() {
    this.visible = false;
  }

  /**
   * Check if panel is visible
   * @returns {boolean}
   */
  isVisible() {
    return this.visible;
  }

  /**
   * Render the workspace debug panel
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  render(ctx) {
    if (!this.visible || !this.workspace) {
      return;
    }

    ctx.save();

    // Get workspace data
    const contents = this.workspace.getContents();
    const focus = this.workspace.getFocus();
    const stats = this.workspace.getStatistics();
    const metrics = this.workspace.exportMetrics();
    
    // Get attention data (Phase 1.2)
    const attentionFocus = this.attentionSystem ? this.attentionSystem.getFocus() : null;
    const attentionMetrics = this.attentionSystem ? this.attentionSystem.getMetrics() : null;
    
    // Get confidence data (Phase 1.3)
    const confidenceStats = this.confidenceSystem ? this.confidenceSystem.getStatistics() : null;

    // Calculate panel height based on content
    const headerHeight = 100; // Increased for attention/confidence info
    const itemHeight = 60;
    const metricsHeight = 140; // Increased for attention/confidence metrics
    const contentHeight = contents.length * itemHeight;
    const totalHeight = Math.min(
      headerHeight + contentHeight + metricsHeight,
      this.maxHeight
    );

    // Draw background
    ctx.fillStyle = this.bgColor;
    ctx.fillRect(this.x, this.y, this.width, totalHeight);

    // Draw border
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.width, totalHeight);

    // Draw header
    ctx.fillStyle = this.textColor;
    ctx.font = 'bold 16px monospace';
    ctx.fillText('GLOBAL WORKSPACE', this.x + 10, this.y + 25);

    ctx.font = '12px monospace';
    ctx.fillText(`Capacity: ${stats.currentCount}/${stats.capacity}`, this.x + 10, this.y + 45);
    ctx.fillText(`Occupancy: ${(stats.occupancy * 100).toFixed(0)}%`, this.x + 10, this.y + 60);
    
    // Show attention focus (Phase 1.2)
    if (attentionFocus) {
      ctx.fillStyle = this.focusColor;
      ctx.fillText(`Focus: ${attentionFocus.source}`, this.x + 10, this.y + 75);
    }
    
    // Show uncertainty level (Phase 1.3)
    if (confidenceStats) {
      const uncertaintyColor = confidenceStats.uncertaintyLevel > 0.7 ? '#ff8800' : '#88ff88';
      ctx.fillStyle = uncertaintyColor;
      ctx.fillText(`Uncertainty: ${(confidenceStats.uncertaintyLevel * 100).toFixed(0)}%`, this.x + 180, this.y + 75);
    }

    // Draw contents
    let yOffset = this.y + headerHeight;
    
    if (contents.length === 0) {
      ctx.fillStyle = '#888888';
      ctx.font = 'italic 12px monospace';
      ctx.fillText('(empty)', this.x + 10, yOffset + 20);
    } else {
      for (let i = 0; i < contents.length && yOffset < this.y + totalHeight - metricsHeight; i++) {
        const item = contents[i];
        this.renderWorkspaceItem(ctx, item, yOffset, i === 0 && focus);
        yOffset += itemHeight;
      }
    }

    // Draw metrics at bottom
    const metricsY = this.y + totalHeight - metricsHeight + 10;
    this.renderMetrics(ctx, metrics, metricsY);

    ctx.restore();
  }

  /**
   * Render a single workspace item
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} item - Workspace item
   * @param {number} y - Y position
   * @param {boolean} isFocus - Whether this is the focus item
   */
  renderWorkspaceItem(ctx, item, y, isFocus) {
    const itemX = this.x + 10;
    const itemWidth = this.width - 20;
    
    // Check if this is the attention focus (Phase 1.2)
    const isAttentionFocus = this.attentionSystem && 
                             this.attentionSystem.getFocus() && 
                             this.attentionSystem.getFocus().id === item.id;

    // Highlight focus item or attention focus
    if (isFocus || isAttentionFocus) {
      ctx.fillStyle = isAttentionFocus ? 'rgba(255, 255, 0, 0.3)' : 'rgba(255, 255, 0, 0.2)';
      ctx.fillRect(this.x + 5, y, this.width - 10, 55);
    }

    // Draw source
    ctx.fillStyle = (isFocus || isAttentionFocus) ? this.focusColor : '#00ff00';
    ctx.font = 'bold 11px monospace';
    let sourceText = `[${item.source}]`;
    if (isAttentionFocus) {
      sourceText += ' ★'; // Star for attention focus
    }
    ctx.fillText(sourceText, itemX, y + 15);

    // Draw type
    ctx.fillStyle = this.textColor;
    ctx.font = '10px monospace';
    const typeText = this.getItemTypeText(item);
    ctx.fillText(typeText, itemX, y + 30);

    // Draw salience bar
    const barY = y + 38;
    const barHeight = 8;
    const barWidth = itemWidth - 60;
    
    // Background bar
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(itemX, barY, barWidth, barHeight);
    
    // Salience bar
    const salienceWidth = barWidth * item.salience;
    ctx.fillStyle = this.getSalienceColor(item.salience);
    ctx.fillRect(itemX, barY, salienceWidth, barHeight);
    
    // Salience value
    ctx.fillStyle = this.textColor;
    ctx.font = '10px monospace';
    ctx.fillText(item.salience.toFixed(2), itemX + barWidth + 5, barY + 7);
  }

  /**
   * Get display text for item type
   * @param {Object} item - Workspace item
   * @returns {string}
   */
  getItemTypeText(item) {
    const content = item.content;
    
    if (content.type === 'hazard_detected') {
      return `Hazard: ${content.hazardType} (${content.threatLevel})`;
    } else if (content.type === 'weapon_detected') {
      return `Weapon: ${content.weaponType}`;
    } else if (content.type === 'novel_entity') {
      return `Novel: ${content.entityType}`;
    } else if (content.type === 'strong_emotion' || content.type === 'emotion_change') {
      return `Emotion: ${content.emotion} (${(content.intensity * 100).toFixed(0)}%)`;
    } else if (content.type === 'high_fear') {
      return `HIGH FEAR (${(content.intensity * 100).toFixed(0)}%)`;
    } else if (content.type === 'need_urgent' || content.type === 'critical_need') {
      return `Need: ${content.needType} (${content.currentValue.toFixed(0)}%)`;
    } else if (content.type === 'relevant_memory') {
      return `Memory: ${content.event.substring(0, 30)}...`;
    } else if (content.type === 'hazard_situation') {
      return `Hazard: ${content.hazardType}`;
    } else if (content.description) {
      return content.description.substring(0, 35);
    } else {
      return `${item.type}`;
    }
  }

  /**
   * Get color for salience level
   * @param {number} salience - Salience value (0-1)
   * @returns {string}
   */
  getSalienceColor(salience) {
    if (salience >= 0.9) return this.salienceColors.critical;
    if (salience >= 0.7) return this.salienceColors.high;
    if (salience >= 0.5) return this.salienceColors.medium;
    return this.salienceColors.low;
  }

  /**
   * Render metrics section
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} metrics - Metrics data
   * @param {number} y - Y position
   */
  renderMetrics(ctx, metrics, y) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(this.x + 5, y - 5, this.width - 10, 130);

    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('METRICS', this.x + 10, y + 10);

    ctx.fillStyle = this.textColor;
    ctx.font = '10px monospace';
    
    ctx.fillText(`Submissions: ${metrics.totalSubmissions}`, this.x + 10, y + 25);
    ctx.fillText(`Broadcasts: ${metrics.totalBroadcasts}`, this.x + 10, y + 40);
    ctx.fillText(`Avg Occupancy: ${(metrics.averageOccupancy * 100).toFixed(0)}%`, this.x + 10, y + 55);
    ctx.fillText(`Attention Shifts: ${metrics.attentionShifts}`, this.x + 10, y + 70);
    
    // Attention metrics (Phase 1.2)
    if (this.attentionSystem) {
      const attentionMetrics = this.attentionSystem.getMetrics();
      ctx.fillText(`Voluntary: ${attentionMetrics.voluntaryShifts}`, this.x + 10, y + 85);
      ctx.fillText(`Involuntary: ${attentionMetrics.involuntaryShifts}`, this.x + 10, y + 100);
    }
    
    // Confidence metrics (Phase 1.3)
    if (this.confidenceSystem) {
      const confidenceStats = this.confidenceSystem.getStatistics();
      ctx.fillText(`Beliefs: ${confidenceStats.totalBeliefs}`, this.x + 180, y + 85);
      ctx.fillText(`Uncertain: ${confidenceStats.lowConfidenceCount}`, this.x + 180, y + 100);
    }
    
    // Performance
    const perf = metrics.performance;
    ctx.fillText(`Avg Update: ${perf.averageUpdateTime.toFixed(2)}ms`, this.x + 180, y + 25);
    ctx.fillText(`P99 Update: ${perf.p99UpdateTime.toFixed(2)}ms`, this.x + 180, y + 40);
  }

  /**
   * Update panel (if needed for animations)
   * @param {number} dt - Delta time
   */
  update(dt) {
    // Could add animations here if desired
  }
}
