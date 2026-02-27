# Text Bubble Stacking System

## Overview

The bubble stacking system manages multiple text bubbles from different characters, ensuring they display properly without overlapping and with clear speaker identification.

## Components

### BubbleManager

The `BubbleManager` class is responsible for:
- Managing multiple active text bubbles
- Stacking bubbles vertically when multiple characters speak
- Displaying character name labels above each bubble
- Updating and removing expired bubbles

### Key Features

#### 1. Character Name Labels (Requirement 10.14)

Each bubble displays the character's name in a label above the bubble:
- Black background with white text for high contrast
- Bold 12px font for readability
- Automatically uses character name or "Unknown" as fallback

```javascript
const bubble = new TextBubble(character, "Hello!");
bubbleManager.addBubble(bubble, character);
// Renders with "Alice" label above the bubble
```

#### 2. Vertical Stacking (Requirement 10.15)

When multiple characters speak simultaneously, or when a character has multiple active bubbles, they stack vertically:
- Bubbles are offset vertically to prevent overlap
- 10px spacing between stacked bubbles
- Each character's bubbles stack independently
- Automatic height calculation based on text content

```javascript
// Both characters speak at once
const bubble1 = new TextBubble(alice, "Hello!");
const bubble2 = new TextBubble(bob, "Hi there!");
bubbleManager.addBubble(bubble1, alice);
bubbleManager.addBubble(bubble2, bob);
// Bubbles render side-by-side without overlap

// Same character speaks multiple times
const bubble3 = new TextBubble(alice, "How are you?");
bubbleManager.addBubble(bubble3, alice);
// This bubble stacks above the first one
```

## Usage

### Basic Setup

```javascript
import { BubbleManager } from './src/core/BubbleManager.js';
import { TextBubble } from './src/core/TextBubble.js';

// Create manager
const bubbleManager = new BubbleManager();

// Create character
const character = {
  name: 'Alice',
  head: {
    position: { x: 400, y: 300 }
  }
};

// Add bubble
const bubble = new TextBubble(character, "Hello world!", 'speech');
bubbleManager.addBubble(bubble, character);
```

### Game Loop Integration

```javascript
function gameLoop(dt) {
  // Update bubbles (removes expired ones)
  bubbleManager.update(dt);
  
  // Render bubbles
  bubbleManager.render(ctx);
}
```

### Managing Bubbles

```javascript
// Get all active bubbles
const allBubbles = bubbleManager.getBubbles();

// Get bubbles for specific character
const aliceBubbles = bubbleManager.getBubblesForCharacter(alice);

// Check if multiple characters are speaking
if (bubbleManager.hasSimultaneousSpeakers()) {
  console.log("Multiple characters speaking!");
}

// Clear all bubbles
bubbleManager.clear();
```

## API Reference

### BubbleManager

#### Constructor
```javascript
new BubbleManager()
```

#### Methods

**addBubble(bubble, character)**
- Adds a new bubble to the manager
- Parameters:
  - `bubble`: TextBubble instance
  - `character`: Character object with name and head.position

**update(dt)**
- Updates all bubbles and removes expired ones
- Parameters:
  - `dt`: Delta time in seconds

**render(ctx)**
- Renders all bubbles with stacking and name labels
- Parameters:
  - `ctx`: Canvas 2D rendering context

**getBubbles()**
- Returns array of all active bubble objects

**getBubblesForCharacter(character)**
- Returns array of bubbles for specific character
- Parameters:
  - `character`: Character object

**hasSimultaneousSpeakers()**
- Returns true if multiple characters have active bubbles

**clear()**
- Removes all bubbles

**groupBubblesByCharacter()**
- Returns Map of character ID to bubble arrays

**getCharacterId(character)**
- Returns unique identifier for character (uses name)

**calculateBubbleHeight(ctx, bubble)**
- Calculates total height of bubble including name label

## Implementation Details

### Stacking Algorithm

1. Group bubbles by character
2. For each bubble:
   - Calculate current vertical offset for that character
   - Render bubble at base position + offset
   - Update offset by bubble height + spacing

### Name Label Rendering

1. Measure character name text width
2. Draw black background rectangle
3. Draw white text centered in rectangle
4. Position above bubble

### Height Calculation

Total height = bubble content height + name label height (18px)
- Bubble content height = (line count × line height) + (padding × 2)
- Name label height = 18px (16px box + 2px margin)

## Testing

The system includes comprehensive tests covering:
- Basic bubble management (add, update, remove)
- Character name label display
- Vertical stacking without overlap
- Simultaneous speaker detection
- Bubble grouping by character
- Integration scenarios

Run tests:
```bash
npm test -- BubbleManager.test.js
```

## Demo

See `examples/bubble-stacking-demo.html` for an interactive demonstration of:
- Single character speaking
- Multiple characters speaking simultaneously
- Bubble stacking for same character
- Speech vs thought bubble styles
- Automatic expiration and fade-out

## Requirements Satisfied

- **10.14**: Character name labels displayed above bubbles
- **10.15**: Vertical stacking without overlap for simultaneous speakers

## Future Enhancements

Potential improvements:
- Configurable stacking direction (up vs down)
- Bubble positioning relative to screen edges
- Animation for bubble appearance
- Custom name label styling per character
- Bubble priority system for overlapping scenarios
