/**
 * 2D Vector class for physics calculations
 * Provides basic vector operations needed for the physics engine
 */
export class Vec2 {
  /**
   * Create a new 2D vector
   * @param {number} x - X component
   * @param {number} y - Y component
   */
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  /**
   * Add another vector to this vector
   * @param {Vec2} v - Vector to add
   * @returns {Vec2} New vector with the result
   */
  add(v) {
    return new Vec2(this.x + v.x, this.y + v.y);
  }

  /**
   * Subtract another vector from this vector
   * @param {Vec2} v - Vector to subtract
   * @returns {Vec2} New vector with the result
   */
  sub(v) {
    return new Vec2(this.x - v.x, this.y - v.y);
  }

  /**
   * Multiply this vector by a scalar
   * @param {number} scalar - Scalar value to multiply by
   * @returns {Vec2} New vector with the result
   */
  mul(scalar) {
    return new Vec2(this.x * scalar, this.y * scalar);
  }

  /**
   * Divide this vector by a scalar
   * @param {number} scalar - Scalar value to divide by
   * @returns {Vec2} New vector with the result
   */
  div(scalar) {
    if (scalar === 0) {
      throw new Error('Division by zero');
    }
    return new Vec2(this.x / scalar, this.y / scalar);
  }

  /**
   * Calculate the magnitude (length) of this vector
   * @returns {number} The magnitude
   */
  magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /**
   * Calculate the squared magnitude (avoids sqrt for performance)
   * @returns {number} The squared magnitude
   */
  magnitudeSquared() {
    return this.x * this.x + this.y * this.y;
  }

  /**
   * Normalize this vector (make it unit length)
   * @returns {Vec2} New normalized vector
   */
  normalize() {
    const mag = this.magnitude();
    if (mag === 0) {
      return new Vec2(0, 0);
    }
    return this.div(mag);
  }

  /**
   * Calculate the dot product with another vector
   * @param {Vec2} v - Vector to dot with
   * @returns {number} The dot product
   */
  dot(v) {
    return this.x * v.x + this.y * v.y;
  }

  /**
   * Calculate the cross product (z-component) with another vector
   * @param {Vec2} v - Vector to cross with
   * @returns {number} The z-component of the cross product
   */
  cross(v) {
    return this.x * v.y - this.y * v.x;
  }

  /**
   * Get a perpendicular vector (rotated 90 degrees counter-clockwise)
   * @returns {Vec2} Perpendicular vector
   */
  perpendicular() {
    return new Vec2(-this.y, this.x);
  }

  /**
   * Calculate the distance to another vector
   * @param {Vec2} v - Target vector
   * @returns {number} The distance
   */
  distanceTo(v) {
    return this.sub(v).magnitude();
  }

  /**
   * Calculate the squared distance to another vector (avoids sqrt)
   * @param {Vec2} v - Target vector
   * @returns {number} The squared distance
   */
  distanceSquaredTo(v) {
    return this.sub(v).magnitudeSquared();
  }

  /**
   * Create a copy of this vector
   * @returns {Vec2} New vector with the same values
   */
  clone() {
    return new Vec2(this.x, this.y);
  }

  /**
   * Rotate this vector by an angle (in radians)
   * @param {number} angle - Angle in radians
   * @returns {Vec2} New rotated vector
   */
  rotate(angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vec2(
      this.x * cos - this.y * sin,
      this.x * sin + this.y * cos
    );
  }

  /**
   * Get the angle of this vector (in radians)
   * @returns {number} Angle in radians
   */
  angle() {
    return Math.atan2(this.y, this.x);
  }

  /**
   * Linearly interpolate between this vector and another
   * @param {Vec2} v - Target vector
   * @param {number} t - Interpolation factor (0-1)
   * @returns {Vec2} Interpolated vector
   */
  lerp(v, t) {
    return new Vec2(
      this.x + (v.x - this.x) * t,
      this.y + (v.y - this.y) * t
    );
  }

  /**
   * Check if this vector equals another vector
   * @param {Vec2} v - Vector to compare
   * @param {number} epsilon - Tolerance for floating point comparison
   * @returns {boolean} True if vectors are equal within epsilon
   */
  equals(v, epsilon = 0.0001) {
    return Math.abs(this.x - v.x) < epsilon && Math.abs(this.y - v.y) < epsilon;
  }

  /**
   * Convert vector to string representation
   * @returns {string} String representation
   */
  toString() {
    return `Vec2(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`;
  }

  /**
   * Create a zero vector
   * @returns {Vec2} Zero vector
   */
  static zero() {
    return new Vec2(0, 0);
  }

  /**
   * Create a unit vector pointing right
   * @returns {Vec2} Unit vector (1, 0)
   */
  static right() {
    return new Vec2(1, 0);
  }

  /**
   * Create a unit vector pointing up
   * @returns {Vec2} Unit vector (0, -1)
   */
  static up() {
    return new Vec2(0, -1);
  }

  /**
   * Create a unit vector pointing left
   * @returns {Vec2} Unit vector (-1, 0)
   */
  static left() {
    return new Vec2(-1, 0);
  }

  /**
   * Create a unit vector pointing down
   * @returns {Vec2} Unit vector (0, 1)
   */
  static down() {
    return new Vec2(0, 1);
  }

  /**
   * Create a vector from an angle
   * @param {number} angle - Angle in radians
   * @param {number} length - Length of the vector (default 1)
   * @returns {Vec2} Vector pointing in the given direction
   */
  static fromAngle(angle, length = 1) {
    return new Vec2(Math.cos(angle) * length, Math.sin(angle) * length);
  }
}
