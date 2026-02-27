/**
 * Shape classes for collision detection and physics
 */
import { Vec2 } from './Vec2.js';

/**
 * Base Shape class
 */
export class Shape {
  constructor(type) {
    this.type = type;
  }

  /**
   * Get the bounding box for this shape
   * @returns {BoundingBox} The bounding box
   */
  getBoundingBox() {
    throw new Error('getBoundingBox must be implemented by subclass');
  }
}

/**
 * Circle shape
 */
export class Circle extends Shape {
  /**
   * Create a circle shape
   * @param {Vec2} position - Center position
   * @param {number} radius - Circle radius
   */
  constructor(position, radius) {
    super('circle');
    this.position = position;
    this.radius = radius;
  }

  /**
   * Get the bounding box for this circle
   * @returns {BoundingBox} The bounding box
   */
  getBoundingBox() {
    return new BoundingBox(
      this.position.x - this.radius,
      this.position.y - this.radius,
      this.radius * 2,
      this.radius * 2
    );
  }

  /**
   * Check if a point is inside this circle
   * @param {Vec2} point - Point to test
   * @returns {boolean} True if point is inside
   */
  containsPoint(point) {
    return this.position.distanceSquaredTo(point) <= this.radius * this.radius;
  }

  /**
   * Get the area of this circle
   * @returns {number} The area
   */
  getArea() {
    return Math.PI * this.radius * this.radius;
  }

  /**
   * Clone this circle
   * @returns {Circle} New circle with same properties
   */
  clone() {
    return new Circle(this.position.clone(), this.radius);
  }
}

/**
 * Rectangle shape (axis-aligned)
 */
export class Rectangle extends Shape {
  /**
   * Create a rectangle shape
   * @param {Vec2} position - Center position
   * @param {number} width - Rectangle width
   * @param {number} height - Rectangle height
   * @param {number} rotation - Rotation angle in radians (default 0)
   */
  constructor(position, width, height, rotation = 0) {
    super('rectangle');
    this.position = position;
    this.width = width;
    this.height = height;
    this.rotation = rotation;
  }

  /**
   * Get the bounding box for this rectangle
   * @returns {BoundingBox} The bounding box
   */
  getBoundingBox() {
    if (this.rotation === 0) {
      // Simple case: axis-aligned
      return new BoundingBox(
        this.position.x - this.width / 2,
        this.position.y - this.height / 2,
        this.width,
        this.height
      );
    } else {
      // Rotated rectangle: calculate corners and find min/max
      const corners = this.getCorners();
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      for (const corner of corners) {
        minX = Math.min(minX, corner.x);
        minY = Math.min(minY, corner.y);
        maxX = Math.max(maxX, corner.x);
        maxY = Math.max(maxY, corner.y);
      }

      return new BoundingBox(minX, minY, maxX - minX, maxY - minY);
    }
  }

  /**
   * Get the four corners of this rectangle
   * @returns {Vec2[]} Array of corner positions
   */
  getCorners() {
    const halfWidth = this.width / 2;
    const halfHeight = this.height / 2;

    // Local corners (unrotated)
    const localCorners = [
      new Vec2(-halfWidth, -halfHeight),
      new Vec2(halfWidth, -halfHeight),
      new Vec2(halfWidth, halfHeight),
      new Vec2(-halfWidth, halfHeight)
    ];

    // Rotate and translate to world space
    return localCorners.map(corner => 
      corner.rotate(this.rotation).add(this.position)
    );
  }

  /**
   * Check if a point is inside this rectangle
   * @param {Vec2} point - Point to test
   * @returns {boolean} True if point is inside
   */
  containsPoint(point) {
    if (this.rotation === 0) {
      // Simple case: axis-aligned
      const halfWidth = this.width / 2;
      const halfHeight = this.height / 2;
      return (
        point.x >= this.position.x - halfWidth &&
        point.x <= this.position.x + halfWidth &&
        point.y >= this.position.y - halfHeight &&
        point.y <= this.position.y + halfHeight
      );
    } else {
      // Rotated rectangle: transform point to local space
      const localPoint = point.sub(this.position).rotate(-this.rotation);
      const halfWidth = this.width / 2;
      const halfHeight = this.height / 2;
      return (
        Math.abs(localPoint.x) <= halfWidth &&
        Math.abs(localPoint.y) <= halfHeight
      );
    }
  }

  /**
   * Get the area of this rectangle
   * @returns {number} The area
   */
  getArea() {
    return this.width * this.height;
  }

  /**
   * Clone this rectangle
   * @returns {Rectangle} New rectangle with same properties
   */
  clone() {
    return new Rectangle(this.position.clone(), this.width, this.height, this.rotation);
  }
}

/**
 * Axis-aligned bounding box (AABB)
 */
export class BoundingBox {
  /**
   * Create a bounding box
   * @param {number} x - Left edge x coordinate
   * @param {number} y - Top edge y coordinate
   * @param {number} width - Box width
   * @param {number} height - Box height
   */
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  /**
   * Get the minimum x coordinate
   * @returns {number} Min x
   */
  get minX() {
    return this.x;
  }

  /**
   * Get the minimum y coordinate
   * @returns {number} Min y
   */
  get minY() {
    return this.y;
  }

  /**
   * Get the maximum x coordinate
   * @returns {number} Max x
   */
  get maxX() {
    return this.x + this.width;
  }

  /**
   * Get the maximum y coordinate
   * @returns {number} Max y
   */
  get maxY() {
    return this.y + this.height;
  }

  /**
   * Get the center position of this bounding box
   * @returns {Vec2} Center position
   */
  getCenter() {
    return new Vec2(
      this.x + this.width / 2,
      this.y + this.height / 2
    );
  }

  /**
   * Check if this bounding box intersects another
   * @param {BoundingBox} other - Other bounding box
   * @returns {boolean} True if boxes intersect
   */
  intersects(other) {
    return (
      this.minX < other.maxX &&
      this.maxX > other.minX &&
      this.minY < other.maxY &&
      this.maxY > other.minY
    );
  }

  /**
   * Check if this bounding box contains a point
   * @param {Vec2} point - Point to test
   * @returns {boolean} True if point is inside
   */
  containsPoint(point) {
    return (
      point.x >= this.minX &&
      point.x <= this.maxX &&
      point.y >= this.minY &&
      point.y <= this.maxY
    );
  }

  /**
   * Check if this bounding box fully contains another
   * @param {BoundingBox} other - Other bounding box
   * @returns {boolean} True if other is fully contained
   */
  contains(other) {
    return (
      other.minX >= this.minX &&
      other.maxX <= this.maxX &&
      other.minY >= this.minY &&
      other.maxY <= this.maxY
    );
  }

  /**
   * Expand this bounding box to include a point
   * @param {Vec2} point - Point to include
   */
  expandToInclude(point) {
    const minX = Math.min(this.minX, point.x);
    const minY = Math.min(this.minY, point.y);
    const maxX = Math.max(this.maxX, point.x);
    const maxY = Math.max(this.maxY, point.y);

    this.x = minX;
    this.y = minY;
    this.width = maxX - minX;
    this.height = maxY - minY;
  }

  /**
   * Expand this bounding box to include another bounding box
   * @param {BoundingBox} other - Other bounding box
   */
  expandToIncludeBox(other) {
    const minX = Math.min(this.minX, other.minX);
    const minY = Math.min(this.minY, other.minY);
    const maxX = Math.max(this.maxX, other.maxX);
    const maxY = Math.max(this.maxY, other.maxY);

    this.x = minX;
    this.y = minY;
    this.width = maxX - minX;
    this.height = maxY - minY;
  }

  /**
   * Clone this bounding box
   * @returns {BoundingBox} New bounding box with same properties
   */
  clone() {
    return new BoundingBox(this.x, this.y, this.width, this.height);
  }

  /**
   * Get the area of this bounding box
   * @returns {number} The area
   */
  getArea() {
    return this.width * this.height;
  }

  /**
   * Create a bounding box from two points
   * @param {Vec2} p1 - First point
   * @param {Vec2} p2 - Second point
   * @returns {BoundingBox} Bounding box containing both points
   */
  static fromPoints(p1, p2) {
    const minX = Math.min(p1.x, p2.x);
    const minY = Math.min(p1.y, p2.y);
    const maxX = Math.max(p1.x, p2.x);
    const maxY = Math.max(p1.y, p2.y);
    return new BoundingBox(minX, minY, maxX - minX, maxY - minY);
  }

  /**
   * Create a bounding box from a center point and size
   * @param {Vec2} center - Center position
   * @param {number} width - Box width
   * @param {number} height - Box height
   * @returns {BoundingBox} Bounding box
   */
  static fromCenter(center, width, height) {
    return new BoundingBox(
      center.x - width / 2,
      center.y - height / 2,
      width,
      height
    );
  }
}

/**
 * Narrow-phase collision detection functions
 */

/**
 * Test collision between two circles
 * @param {Circle} circle1 - First circle
 * @param {Circle} circle2 - Second circle
 * @returns {Object|null} Collision info {normal, penetration} or null if no collision
 */
export function testCircleCircle(circle1, circle2) {
  const delta = circle2.position.sub(circle1.position);
  const distanceSquared = delta.magnitudeSquared();
  const radiusSum = circle1.radius + circle2.radius;
  const radiusSumSquared = radiusSum * radiusSum;

  // No collision if distance > sum of radii
  if (distanceSquared >= radiusSumSquared) {
    return null;
  }

  const distance = Math.sqrt(distanceSquared);
  
  // Handle overlapping circles at same position
  if (distance === 0) {
    return {
      normal: new Vec2(1, 0), // Arbitrary direction
      penetration: radiusSum
    };
  }

  return {
    normal: delta.div(distance), // Normalized direction from circle1 to circle2
    penetration: radiusSum - distance
  };
}

/**
 * Test collision between a circle and a rectangle
 * @param {Circle} circle - Circle shape
 * @param {Rectangle} rect - Rectangle shape
 * @returns {Object|null} Collision info {normal, penetration} or null if no collision
 */
export function testCircleRectangle(circle, rect) {
  // Transform circle center to rectangle's local space
  const localCirclePos = circle.position.sub(rect.position).rotate(-rect.rotation);
  
  const halfWidth = rect.width / 2;
  const halfHeight = rect.height / 2;

  // Find closest point on rectangle to circle center (clamped to rectangle bounds)
  const closestX = Math.max(-halfWidth, Math.min(halfWidth, localCirclePos.x));
  const closestY = Math.max(-halfHeight, Math.min(halfHeight, localCirclePos.y));
  const closestPoint = new Vec2(closestX, closestY);

  // Calculate distance from circle center to closest point
  const delta = localCirclePos.sub(closestPoint);
  const distanceSquared = delta.magnitudeSquared();

  // No collision if distance > radius
  if (distanceSquared > circle.radius * circle.radius) {
    return null;
  }

  const distance = Math.sqrt(distanceSquared);

  // Handle circle center inside rectangle (distance is 0 or very small)
  if (distance < 0.0001) {
    // Find closest edge
    const distToRight = halfWidth - localCirclePos.x;
    const distToLeft = halfWidth + localCirclePos.x;
    const distToTop = halfHeight + localCirclePos.y;
    const distToBottom = halfHeight - localCirclePos.y;

    const minDist = Math.min(distToRight, distToLeft, distToTop, distToBottom);

    let localNormal;
    if (minDist === distToRight) {
      localNormal = new Vec2(1, 0);
    } else if (minDist === distToLeft) {
      localNormal = new Vec2(-1, 0);
    } else if (minDist === distToTop) {
      localNormal = new Vec2(0, -1);
    } else {
      localNormal = new Vec2(0, 1);
    }

    return {
      normal: localNormal.rotate(rect.rotation),
      penetration: circle.radius + minDist
    };
  }

  // Normal collision - circle is outside or partially overlapping
  const localNormal = delta.div(distance);
  return {
    normal: localNormal.rotate(rect.rotation), // Transform back to world space
    penetration: circle.radius - distance
  };
}

/**
 * Test collision between two rectangles using Separating Axis Theorem (SAT)
 * @param {Rectangle} rect1 - First rectangle
 * @param {Rectangle} rect2 - Second rectangle
 * @returns {Object|null} Collision info {normal, penetration} or null if no collision
 */
export function testRectangleRectangle(rect1, rect2) {
  // Get corners for both rectangles
  const corners1 = rect1.getCorners();
  const corners2 = rect2.getCorners();

  // Get axes to test (perpendicular to edges)
  const axes = [
    ...getAxesFromCorners(corners1),
    ...getAxesFromCorners(corners2)
  ];

  let minOverlap = Infinity;
  let minAxis = null;

  // Test each axis
  for (const axis of axes) {
    const projection1 = projectOntoAxis(corners1, axis);
    const projection2 = projectOntoAxis(corners2, axis);

    // Check for separation
    if (projection1.max < projection2.min || projection2.max < projection1.min) {
      return null; // Separating axis found, no collision
    }

    // Calculate overlap
    const overlap = Math.min(projection1.max, projection2.max) - 
                   Math.max(projection1.min, projection2.min);

    if (overlap < minOverlap) {
      minOverlap = overlap;
      minAxis = axis;
    }
  }

  // All axes overlap, collision detected
  // Ensure normal points from rect1 to rect2
  const centerDelta = rect2.position.sub(rect1.position);
  if (centerDelta.dot(minAxis) < 0) {
    minAxis = minAxis.mul(-1);
  }

  return {
    normal: minAxis,
    penetration: minOverlap
  };
}

/**
 * Get perpendicular axes from rectangle corners
 * @param {Vec2[]} corners - Array of corner positions
 * @returns {Vec2[]} Array of normalized perpendicular axes
 */
function getAxesFromCorners(corners) {
  const axes = [];
  
  for (let i = 0; i < corners.length; i++) {
    const p1 = corners[i];
    const p2 = corners[(i + 1) % corners.length];
    
    // Get edge vector
    const edge = p2.sub(p1);
    
    // Get perpendicular (normal to edge)
    const perpendicular = new Vec2(-edge.y, edge.x).normalize();
    
    axes.push(perpendicular);
  }
  
  return axes;
}

/**
 * Project corners onto an axis
 * @param {Vec2[]} corners - Array of corner positions
 * @param {Vec2} axis - Axis to project onto (should be normalized)
 * @returns {Object} {min, max} projection range
 */
function projectOntoAxis(corners, axis) {
  let min = Infinity;
  let max = -Infinity;
  
  for (const corner of corners) {
    const projection = corner.dot(axis);
    min = Math.min(min, projection);
    max = Math.max(max, projection);
  }
  
  return { min, max };
}

/**
 * Generic collision test that dispatches to specific test functions
 * @param {Shape} shape1 - First shape
 * @param {Shape} shape2 - Second shape
 * @returns {Object|null} Collision info {normal, penetration} or null if no collision
 */
export function testCollision(shape1, shape2) {
  // Circle-Circle
  if (shape1.type === 'circle' && shape2.type === 'circle') {
    return testCircleCircle(shape1, shape2);
  }
  
  // Circle-Rectangle
  if (shape1.type === 'circle' && shape2.type === 'rectangle') {
    return testCircleRectangle(shape1, shape2);
  }
  
  // Rectangle-Circle (swap and invert normal)
  if (shape1.type === 'rectangle' && shape2.type === 'circle') {
    const result = testCircleRectangle(shape2, shape1);
    if (result) {
      result.normal = result.normal.mul(-1);
    }
    return result;
  }
  
  // Rectangle-Rectangle
  if (shape1.type === 'rectangle' && shape2.type === 'rectangle') {
    return testRectangleRectangle(shape1, shape2);
  }
  
  console.warn(`Unsupported collision test: ${shape1.type} vs ${shape2.type}`);
  return null;
}

/**
 * Resolve collision between two entities by separating them
 * @param {Object} entityA - First entity with position, mass, isDynamic properties
 * @param {Object} entityB - Second entity with position, mass, isDynamic properties
 * @param {Object} collision - Collision info with normal and penetration
 */
export function separateEntities(entityA, entityB, collision) {
  const { normal, penetration } = collision;
  
  // Calculate separation based on mass ratios
  const totalMass = entityA.mass + entityB.mass;
  
  if (entityA.isDynamic && entityB.isDynamic) {
    // Both dynamic: separate based on inverse mass ratio
    const ratioA = entityB.mass / totalMass;
    const ratioB = entityA.mass / totalMass;
    
    entityA.position = entityA.position.sub(normal.mul(penetration * ratioA));
    entityB.position = entityB.position.add(normal.mul(penetration * ratioB));
  } else if (entityA.isDynamic && !entityB.isDynamic) {
    // Only A is dynamic: move A entirely
    entityA.position = entityA.position.sub(normal.mul(penetration));
  } else if (!entityA.isDynamic && entityB.isDynamic) {
    // Only B is dynamic: move B entirely
    entityB.position = entityB.position.add(normal.mul(penetration));
  }
  // If both static, no separation needed
}

/**
 * Apply impulse response to resolve collision velocities
 * @param {Object} entityA - First entity with position, oldPosition, mass, isDynamic properties
 * @param {Object} entityB - Second entity with position, oldPosition, mass, isDynamic properties
 * @param {Object} collision - Collision info with normal and penetration
 * @param {number} restitution - Coefficient of restitution (bounciness), 0-1
 */
export function applyImpulseResponse(entityA, entityB, collision, restitution = 0.3) {
  const { normal } = collision;
  
  // Get velocities (Verlet: velocity = position - oldPosition)
  const velA = entityA.position.sub(entityA.oldPosition);
  const velB = entityB.position.sub(entityB.oldPosition);
  
  // Relative velocity
  const relativeVel = velA.sub(velB);
  
  // Velocity along the collision normal
  const velAlongNormal = relativeVel.dot(normal);
  
  // Don't resolve if velocities are separating
  // If velAlongNormal < 0, objects are moving apart along the normal
  if (velAlongNormal < 0) {
    return;
  }
  
  // Calculate impulse scalar
  const e = restitution;
  let j = -(1 + e) * velAlongNormal;
  j /= (1 / entityA.mass + 1 / entityB.mass);
  
  // Apply impulse
  const impulse = normal.mul(j);
  
  if (entityA.isDynamic && entityB.isDynamic) {
    // Update old positions to change velocity (Verlet integration)
    entityA.oldPosition = entityA.oldPosition.sub(impulse.div(entityA.mass));
    entityB.oldPosition = entityB.oldPosition.add(impulse.div(entityB.mass));
  } else if (entityA.isDynamic && !entityB.isDynamic) {
    // B is static, only affect A
    entityA.oldPosition = entityA.oldPosition.sub(impulse.div(entityA.mass));
  } else if (!entityA.isDynamic && entityB.isDynamic) {
    // A is static, only affect B
    entityB.oldPosition = entityB.oldPosition.add(impulse.div(entityB.mass));
  }
}

/**
 * Apply friction to contact points
 * @param {Object} entityA - First entity with position, oldPosition, mass, isDynamic properties
 * @param {Object} entityB - Second entity with position, oldPosition, mass, isDynamic properties
 * @param {Object} collision - Collision info with normal and penetration
 * @param {number} friction - Coefficient of friction, 0-1
 */
export function applyFriction(entityA, entityB, collision, friction = 0.5) {
  const { normal } = collision;
  
  // Get velocities
  const velA = entityA.position.sub(entityA.oldPosition);
  const velB = entityB.position.sub(entityB.oldPosition);
  
  // Relative velocity
  const relativeVel = velA.sub(velB);
  
  // Tangent vector (perpendicular to normal)
  const tangent = new Vec2(-normal.y, normal.x);
  
  // Velocity along the tangent (sliding velocity)
  const velAlongTangent = relativeVel.dot(tangent);
  
  // Calculate friction impulse
  let jt = -velAlongTangent;
  jt /= (1 / entityA.mass + 1 / entityB.mass);
  
  // Clamp friction impulse to not exceed static friction
  const frictionImpulse = tangent.mul(jt * friction);
  
  if (entityA.isDynamic && entityB.isDynamic) {
    // Apply friction impulse
    entityA.oldPosition = entityA.oldPosition.sub(frictionImpulse.div(entityA.mass));
    entityB.oldPosition = entityB.oldPosition.add(frictionImpulse.div(entityB.mass));
  } else if (entityA.isDynamic && !entityB.isDynamic) {
    // B is static, only affect A
    entityA.oldPosition = entityA.oldPosition.sub(frictionImpulse.div(entityA.mass));
  } else if (!entityA.isDynamic && entityB.isDynamic) {
    // A is static, only affect B
    entityB.oldPosition = entityB.oldPosition.add(frictionImpulse.div(entityB.mass));
  }
}

/**
 * Resolve collision between two entities (complete resolution)
 * @param {Object} entityA - First entity with position, oldPosition, mass, isDynamic properties
 * @param {Object} entityB - Second entity with position, oldPosition, mass, isDynamic properties
 * @param {Object} collision - Collision info with normal and penetration
 * @param {number} restitution - Coefficient of restitution (bounciness), 0-1
 * @param {number} friction - Coefficient of friction, 0-1
 */
export function resolveCollision(entityA, entityB, collision, restitution = 0.3, friction = 0.5) {
  // Step 1: Separate overlapping objects
  separateEntities(entityA, entityB, collision);
  
  // Step 2: Apply impulse response based on masses and restitution
  applyImpulseResponse(entityA, entityB, collision, restitution);
  
  // Step 3: Apply friction to contact points
  applyFriction(entityA, entityB, collision, friction);
}
