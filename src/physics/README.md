# Physics Module

This module provides vector math utilities and physics primitives for the AI Playground game engine.

## Components

### Vec2 - 2D Vector Class

A comprehensive 2D vector class with all essential operations for physics calculations.

**Basic Operations:**
- `add(v)` - Vector addition
- `sub(v)` - Vector subtraction
- `mul(scalar)` - Scalar multiplication
- `div(scalar)` - Scalar division

**Magnitude and Normalization:**
- `magnitude()` - Calculate vector length
- `magnitudeSquared()` - Calculate squared length (faster, no sqrt)
- `normalize()` - Create unit vector

**Vector Products:**
- `dot(v)` - Dot product
- `cross(v)` - Cross product (z-component for 2D)

**Distance:**
- `distanceTo(v)` - Calculate distance to another vector
- `distanceSquaredTo(v)` - Calculate squared distance (faster)

**Transformations:**
- `rotate(angle)` - Rotate vector by angle (radians)
- `angle()` - Get vector angle
- `lerp(v, t)` - Linear interpolation

**Utilities:**
- `clone()` - Create independent copy
- `equals(v, epsilon)` - Compare with tolerance
- `toString()` - String representation

**Static Constructors:**
- `Vec2.zero()` - (0, 0)
- `Vec2.right()` - (1, 0)
- `Vec2.up()` - (0, -1)
- `Vec2.left()` - (-1, 0)
- `Vec2.down()` - (0, 1)
- `Vec2.fromAngle(angle, length)` - Create from angle

### Circle - Circle Shape

Represents a circular collision shape.

**Properties:**
- `position` - Center position (Vec2)
- `radius` - Circle radius

**Methods:**
- `getBoundingBox()` - Get axis-aligned bounding box
- `containsPoint(point)` - Check if point is inside
- `getArea()` - Calculate area
- `clone()` - Create independent copy

### Rectangle - Rectangle Shape

Represents a rectangular collision shape with optional rotation.

**Properties:**
- `position` - Center position (Vec2)
- `width` - Rectangle width
- `height` - Rectangle height
- `rotation` - Rotation angle in radians (default 0)

**Methods:**
- `getBoundingBox()` - Get axis-aligned bounding box
- `getCorners()` - Get four corner positions
- `containsPoint(point)` - Check if point is inside (handles rotation)
- `getArea()` - Calculate area
- `clone()` - Create independent copy

### BoundingBox - Axis-Aligned Bounding Box

Represents an axis-aligned bounding box for efficient collision detection.

**Properties:**
- `x` - Left edge x coordinate
- `y` - Top edge y coordinate
- `width` - Box width
- `height` - Box height

**Getters:**
- `minX`, `minY` - Minimum coordinates
- `maxX`, `maxY` - Maximum coordinates

**Methods:**
- `getCenter()` - Get center position
- `intersects(other)` - Check intersection with another box
- `containsPoint(point)` - Check if point is inside
- `contains(other)` - Check if fully contains another box
- `expandToInclude(point)` - Expand to include a point
- `expandToIncludeBox(other)` - Expand to include another box
- `getArea()` - Calculate area
- `clone()` - Create independent copy

**Static Constructors:**
- `BoundingBox.fromPoints(p1, p2)` - Create from two points
- `BoundingBox.fromCenter(center, width, height)` - Create from center

### BodyPart - Verlet Physics Body Part

Represents a physical body part using Verlet integration for position-based dynamics.

**Properties:**
- `position` - Current position (Vec2)
- `oldPosition` - Previous position for Verlet integration (Vec2)
- `mass` - Mass in kilograms
- `radius` - Collision radius in pixels
- `type` - Body part type (e.g., 'head', 'torso', 'hand')
- `isDynamic` - Whether affected by physics (default: true)
- `damping` - Velocity damping factor 0-1 (default: 0.99)

**Getters/Setters:**
- `velocity` - Get/set velocity (derived from position history)

**Methods:**
- `applyForce(force)` - Accumulate force for this frame
- `applyImpulse(impulse)` - Apply instant velocity change
- `update(dt)` - Update position using Verlet integration
- `setPosition(pos)` - Set position directly
- `move(delta)` - Move by delta vector
- `pin()` - Make static (unaffected by physics)
- `unpin()` - Make dynamic (affected by physics)
- `clone()` - Create independent copy

### VerletPhysics - Verlet Integration Physics System

Manages the physics simulation using Verlet integration for stable, constraint-based dynamics.

**Properties:**
- `gravity` - Gravity vector (default: Vec2(0, 980) = 9.8 m/s²)
- `substeps` - Constraint solving iterations (default: 5)

**Methods:**
- `addBodyPart(bodyPart)` - Add body part to simulation
- `removeBodyPart(bodyPart)` - Remove body part from simulation
- `applyGravity()` - Apply gravity to all dynamic body parts
- `updateBodyParts(dt)` - Update all body parts using Verlet integration
- `solveConstraints()` - Solve constraints (placeholder for future)
- `update(dt)` - Main physics update loop
- `setGravity(gravity)` - Set gravity vector
- `getGravity()` - Get current gravity vector
- `clear()` - Remove all body parts and constraints
- `getBodyPartCount()` - Get number of body parts
- `getBodyParts()` - Get array of all body parts

## Usage Examples

### Basic Vector Math

```javascript
import { Vec2 } from './physics/Vec2.js';

const velocity = new Vec2(10, 5);
const acceleration = new Vec2(0, 9.8);

// Update velocity
const newVelocity = velocity.add(acceleration.mul(deltaTime));

// Calculate distance
const distance = velocity.magnitude();

// Normalize for direction
const direction = velocity.normalize();
```

### Verlet Physics Simulation

```javascript
import { VerletPhysics, BodyPart, Vec2 } from './physics/index.js';

// Create physics system
const physics = new VerletPhysics({
  gravity: new Vec2(0, 980), // 9.8 m/s² downward
  substeps: 5
});

// Create body parts
const head = new BodyPart(new Vec2(100, 50), 5, 20, 'head');
const torso = new BodyPart(new Vec2(100, 100), 40, 30, 'torso');

// Add to simulation
physics.addBodyPart(head);
physics.addBodyPart(torso);

// Game loop
function update(dt) {
  physics.update(dt); // Apply gravity and update positions
}

// Pin a body part (make it static)
head.pin();

// Apply impulse (instant velocity change)
torso.applyImpulse(new Vec2(500, 0));
```

### Collision Detection

```javascript
import { Circle, Rectangle, BoundingBox } from './physics/shapes.js';

// Create shapes
const player = new Circle(new Vec2(100, 100), 20);
const wall = new Rectangle(new Vec2(200, 100), 40, 100, 0);

// Broad-phase collision (bounding boxes)
const playerBBox = player.getBoundingBox();
const wallBBox = wall.getBoundingBox();

if (playerBBox.intersects(wallBBox)) {
  // Narrow-phase collision
  // ... detailed collision detection
}
```

### Point Testing

```javascript
import { Vec2, Circle } from './physics/index.js';

const circle = new Circle(new Vec2(0, 0), 50);
const mousePos = new Vec2(30, 20);

if (circle.containsPoint(mousePos)) {
  console.log('Mouse is inside circle!');
}
```

### Rotated Rectangles

```javascript
import { Vec2, Rectangle } from './physics/index.js';

// Create rotated rectangle (45 degrees)
const rect = new Rectangle(
  new Vec2(100, 100),
  50,
  30,
  Math.PI / 4
);

// Get corners in world space
const corners = rect.getCorners();

// Check if point is inside (handles rotation)
const point = new Vec2(110, 105);
const inside = rect.containsPoint(point);
```

## Performance Notes

- Use `magnitudeSquared()` and `distanceSquaredTo()` when you only need to compare distances (avoids expensive sqrt)
- Bounding boxes are axis-aligned for fast intersection tests
- Rotated rectangles calculate corners on-demand; cache if needed
- Vector operations create new instances; reuse vectors when possible for performance-critical code

## Testing

Run the test suite:

```bash
npm test
```

Run the physics demo:

```bash
node examples/physics-demo.js
```

Run the Verlet physics demo:

```bash
node examples/verlet-demo.js
```

## Requirements Satisfied

This implementation satisfies the following requirements from the AI Playground specification:

**Requirement 2.3**: "THE Physics_Engine SHALL apply gravity to all Body_Parts"
- The `VerletPhysics` class applies gravity to all dynamic body parts in the `applyGravity()` method
- Gravity is configurable and defaults to 9.8 m/s² (980 pixels/s²)

**Requirement 11.7**: "THE Physics_Engine SHALL apply realistic gravity (default 9.8 m/s²) to all dynamic entities"
- Gravity is applied as a force proportional to mass (F = m * g)
- Static (pinned) body parts are not affected by gravity
- The Verlet integration accurately simulates gravitational acceleration

**Requirement 11.1**: "THE Collision_System SHALL detect collisions between all Body_Parts and Game_Objects using appropriate shapes"
- The physics primitives provide the foundation for collision detection
- Shape representations (Circle, Rectangle) for collision detection
- Bounding box calculations for broad-phase collision detection
- Point-in-shape tests for precise collision detection
