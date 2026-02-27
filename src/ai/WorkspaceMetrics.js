/**
 * WorkspaceMetrics tracks performance and behavior metrics for the Global Workspace
 * Provides insights into consciousness emergence and system performance
 * 
 * Requirements: 15.1, 15.2, 15.3, 15.4, 11.2
 */

export class WorkspaceMetrics {
  constructor() {
    // Submission tracking (Requirement 15.1)
    this.submissionsByModule = new Map(); // moduleId -> count
    this.totalSubmissions = 0;
    
    // Broadcast tracking
    this.totalBroadcasts = 0;
    
    // Occupancy tracking (Requirement 15.2)
    this.averageOccupancy = 0;
    this.occupancySamples = 0;
    
    // Attention tracking (Requirement 15.4)
    this.attentionShifts = 0;
    this.lastFocus = null;
    
    // Performance tracking (Requirement 11.2)
    this.updateHistory = []; // Last 100 update durations
    this.maxUpdateHistory = 100;
  }

  /**
   * Record a content submission
   * @param {string} moduleId - Source module identifier
   * 
   * Requirements: 15.1
   */
  recordSubmission(moduleId) {
    this.totalSubmissions++;
    
    const count = this.submissionsByModule.get(moduleId) || 0;
    this.submissionsByModule.set(moduleId, count + 1);
  }

  /**
   * Record a workspace broadcast
   * @param {Object} payload - Broadcast payload
   * 
   * Requirements: 15.2, 15.4
   */
  recordBroadcast(payload) {
    this.totalBroadcasts++;
    
    // Update average occupancy (Requirement 15.2)
    // Use exponential moving average for smooth tracking
    this.averageOccupancy = (this.averageOccupancy * 0.9) + (payload.occupancy * 0.1);
    this.occupancySamples++;
    
    // Track attention shifts (Requirement 15.4)
    if (payload.focus) {
      if (this.lastFocus && payload.focus.id !== this.lastFocus.id) {
        this.attentionShifts++;
      }
      this.lastFocus = payload.focus;
    }
  }

  /**
   * Record update cycle duration
   * @param {number} duration - Duration in milliseconds
   * 
   * Requirements: 11.2
   */
  recordUpdateTime(duration) {
    this.updateHistory.push({
      timestamp: Date.now(),
      duration
    });
    
    // Keep last N updates
    if (this.updateHistory.length > this.maxUpdateHistory) {
      this.updateHistory.shift();
    }
  }

  /**
   * Calculate content diversity (number of unique source modules)
   * @param {Array} buffer - Current workspace buffer
   * @returns {number} Number of unique sources
   * 
   * Requirements: 15.3
   */
  getContentDiversity(buffer) {
    const sources = new Set(buffer.map(item => item.source));
    return sources.size;
  }

  /**
   * Get average update time
   * @returns {number} Average duration in milliseconds
   * 
   * Requirements: 11.2
   */
  getAverageUpdateTime() {
    if (this.updateHistory.length === 0) {
      return 0;
    }
    
    const sum = this.updateHistory.reduce((acc, item) => acc + item.duration, 0);
    return sum / this.updateHistory.length;
  }

  /**
   * Get 99th percentile update time
   * @returns {number} 99th percentile duration in milliseconds
   * 
   * Requirements: 11.2
   */
  get99thPercentileUpdateTime() {
    if (this.updateHistory.length === 0) {
      return 0;
    }
    
    const sorted = [...this.updateHistory]
      .map(item => item.duration)
      .sort((a, b) => a - b);
    
    const index = Math.floor(sorted.length * 0.99);
    return sorted[index];
  }

  /**
   * Get maximum update time
   * @returns {number} Maximum duration in milliseconds
   * 
   * Requirements: 11.2
   */
  getMaxUpdateTime() {
    if (this.updateHistory.length === 0) {
      return 0;
    }
    
    return Math.max(...this.updateHistory.map(item => item.duration));
  }

  /**
   * Export all metrics for analysis
   * @returns {Object} Metrics data
   * 
   * Requirements: 15.1, 15.2, 15.3, 15.4, 11.2
   */
  export() {
    return {
      totalSubmissions: this.totalSubmissions,
      totalBroadcasts: this.totalBroadcasts,
      averageOccupancy: this.averageOccupancy,
      attentionShifts: this.attentionShifts,
      submissionsByModule: Object.fromEntries(this.submissionsByModule),
      performance: {
        averageUpdateTime: this.getAverageUpdateTime(),
        p99UpdateTime: this.get99thPercentileUpdateTime(),
        maxUpdateTime: this.getMaxUpdateTime(),
        sampleCount: this.updateHistory.length
      }
    };
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.submissionsByModule.clear();
    this.totalSubmissions = 0;
    this.totalBroadcasts = 0;
    this.averageOccupancy = 0;
    this.occupancySamples = 0;
    this.attentionShifts = 0;
    this.lastFocus = null;
    this.updateHistory = [];
  }
}
