/**
 * Demo showing how to use the physics primitives
 */
import { Vec2, Circle, Rectangle, BoundingBox } from '../src/physics/index.js';

// Vector operations demo
console.log('=== Vector Operations Demo ===');

const v1 = new Vec2(3, 4);
const v2 = new Vec2(1, 2);

console.log('v1:', v1.toString());
console.log('v2:', v2.toString());
console.log('v1 + v2:', v1.add(v2).toString());
console.log('v1 - v2:', v1.sub(v2).toString());
console.log('v1 * 2:', v1.mul(2).toString());
console.log('v1 magnitude:', v1.magnitude());
console.log('v1 normalized:', v1.normalize().toString());
console.log('v1 dot v2:', v1.dot(v2));
console.log('Distance between v1 and v2:', v1.distanceTo(v2));

// Circle demo
console.log('\n=== Circle Demo ===');

const circle = new Circle(new Vec2(10, 10), 5);
console.log('Circle at', circle.position.toString(), 'with radius', circle.radius);
console.log('Circle area:', circle.getArea());
console.log('Circle bounding box:', circle.getBoundingBox());
console.log('Point (12, 10) inside circle?', circle.containsPoint(new Vec2(12, 10)));
console.log('Point (20, 10) inside circle?', circle.containsPoint(new Vec2(20, 10)));

// Rectangle demo
console.log('\n=== Rectangle Demo ===');

const rect = new Rectangle(new Vec2(0, 0), 20, 30, 0);
console.log('Rectangle at', rect.position.toString(), 'with size', rect.width, 'x', rect.height);
console.log('Rectangle area:', rect.getArea());
console.log('Rectangle bounding box:', rect.getBoundingBox());
console.log('Point (5, 5) inside rectangle?', rect.containsPoint(new Vec2(5, 5)));
console.log('Point (50, 50) inside rectangle?', rect.containsPoint(new Vec2(50, 50)));

// Rotated rectangle demo
const rotatedRect = new Rectangle(new Vec2(0, 0), 20, 30, Math.PI / 4);
console.log('\nRotated rectangle (45 degrees):');
console.log('Corners:', rotatedRect.getCorners().map(c => c.toString()));
console.log('Bounding box:', rotatedRect.getBoundingBox());

// Bounding box demo
console.log('\n=== Bounding Box Demo ===');

const bbox1 = new BoundingBox(0, 0, 10, 10);
const bbox2 = new BoundingBox(5, 5, 10, 10);
const bbox3 = new BoundingBox(20, 20, 10, 10);

console.log('bbox1:', bbox1);
console.log('bbox2:', bbox2);
console.log('bbox3:', bbox3);
console.log('bbox1 intersects bbox2?', bbox1.intersects(bbox2));
console.log('bbox1 intersects bbox3?', bbox1.intersects(bbox3));
console.log('bbox1 contains point (5, 5)?', bbox1.containsPoint(new Vec2(5, 5)));

// Practical example: collision detection
console.log('\n=== Collision Detection Example ===');

const player = new Circle(new Vec2(100, 100), 20);
const obstacle = new Rectangle(new Vec2(150, 100), 40, 40, 0);

const playerBBox = player.getBoundingBox();
const obstacleBBox = obstacle.getBoundingBox();

console.log('Player position:', player.position.toString());
console.log('Obstacle position:', obstacle.position.toString());
console.log('Bounding boxes intersect?', playerBBox.intersects(obstacleBBox));

// Move player towards obstacle
const direction = obstacle.position.sub(player.position).normalize();
const newPlayerPos = player.position.add(direction.mul(30));
const movedPlayer = new Circle(newPlayerPos, 20);
const movedPlayerBBox = movedPlayer.getBoundingBox();

console.log('\nAfter moving player towards obstacle:');
console.log('New player position:', movedPlayer.position.toString());
console.log('Bounding boxes intersect?', movedPlayerBBox.intersects(obstacleBBox));
