import { Vec2 } from './Vec2.js';

/**
 * Spatial hash grid for efficient broad-phase collision detection and spatial queries.
 * Divides space into a grid of cells and tracks which entities occupy each cell.
 * This reduces the number of collision checks from O(n²) to approximately O(n).
 */
class SpatialHashGrid {
  /**
   * @param {number} cellSize - Size of each grid cell (default: 50 pixels)
   */
  constructor(cellSize = 50) {
    this.cellSize = cellSize;
    this.grid = new Map(); // Map of "x,y" -> Set of entities
  }

  /**
   * Converts world coordinates to grid cell coordinates
   * @param {number} x - World x coordinate
   * @param {number} y - World y coordinate
   * @returns {{x: number, y: number}} Grid cell coordinates
   */
  _getCellCoords(x, y) {
    return {
      x: Math.floor(x / this.cellSize),
      y: Math.floor(y / this.cellSize)
    };
  }

  /**
   * Converts grid cell coordinates to a string key
   * @param {number} cellX - Grid cell x coordinate
   * @param {number} cellY - Grid cell y coordinate
   * @returns {string} Cell key
   */
  _getCellKey(cellX, cellY) {
    return `${cellX},${cellY}`;
  }

  /**
   * Inserts an entity into the grid based on its bounding box
   * @param {Object} entity - Entity with bounds property {min: Vec2, max: Vec2}
   */
  insert(entity) {
    if (!entity.bounds) {
      console.warn('Entity missing bounds property:', entity);
      return;
    }

    const minCell = this._getCellCoords(entity.bounds.min.x, entity.bounds.min.y);
    const maxCell = this._getCellCoords(entity.bounds.max.x, entity.bounds.max.y);

    // Insert entity into all cells it overlaps
    for (let x = minCell.x; x <= maxCell.x; x++) {
      for (let y = minCell.y; y <= maxCell.y; y++) {
        const key = this._getCellKey(x, y);
        
        if (!this.grid.has(key)) {
          this.grid.set(key, new Set());
        }
        
        this.grid.get(key).add(entity);
      }
    }
  }

  /**
   * Queries the grid for entities near the given bounds
   * @param {Object} bounds - Bounding box {min: Vec2, max: Vec2}
   * @returns {Array} Array of nearby entities (may contain duplicates)
   */
  query(bounds) {
    const minCell = this._getCellCoords(bounds.min.x, bounds.min.y);
    const maxCell = this._getCellCoords(bounds.max.x, bounds.max.y);

    const results = new Set();

    // Query all cells that overlap the bounds
    for (let x = minCell.x; x <= maxCell.x; x++) {
      for (let y = minCell.y; y <= maxCell.y; y++) {
        const key = this._getCellKey(x, y);
        const cell = this.grid.get(key);
        
        if (cell) {
          cell.forEach(entity => results.add(entity));
        }
      }
    }

    return Array.from(results);
  }

  /**
   * Clears all entities from the grid
   */
  clear() {
    this.grid.clear();
  }

  /**
   * Gets the number of occupied cells in the grid
   * @returns {number} Number of occupied cells
   */
  getCellCount() {
    return this.grid.size;
  }

  /**
   * Gets all entities in the grid (with duplicates removed)
   * @returns {Array} Array of all entities
   */
  getAllEntities() {
    const allEntities = new Set();
    
    for (const cell of this.grid.values()) {
      cell.forEach(entity => allEntities.add(entity));
    }
    
    return Array.from(allEntities);
  }
}

export default SpatialHashGrid;
