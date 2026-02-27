# AI Playground

A 2D physics-based game featuring articulated ragdoll characters with advanced AI capabilities powered by local LLM (Ollama).

## Project Structure

```
ai-playground/
├── src/                    # Source code
│   ├── core/              # Core engine systems
│   │   ├── GameEngine.js  # Main game loop with fixed timestep
│   │   ├── Renderer.js    # HTML5 Canvas rendering
│   │   └── EventSystem.js # Event-driven communication
│   ├── physics/           # Physics systems (to be implemented)
│   ├── ai/                # AI systems (to be implemented)
│   ├── game/              # Game systems (to be implemented)
│   └── main.js            # Entry point
├── tests/                 # Test files
├── assets/                # Game assets (images, sounds)
├── styles/                # CSS styles
│   └── main.css
└── index.html             # Main HTML file
```

## Features

### Implemented (Task 1)
- ✅ Project structure with modular architecture
- ✅ HTML5 Canvas rendering with 2D side-view
- ✅ Fixed timestep game loop (60 FPS target)
- ✅ Event system for inter-module communication
- ✅ Automatic viewport resizing
- ✅ FPS counter

### Planned
- Articulated ragdoll physics with Verlet integration
- Inverse kinematics for natural limb movement
- Player hand control with mouse
- Grab and pickup system
- Locomotion and walking
- AI-controlled NPC with Ollama integration
- Raycast vision system
- Emotion and memory systems
- Continuous reasoning loop with metacognition
- Text bubble communication
- Weapon system and combat
- Health, pain, and survival needs
- And much more...

## Getting Started

1. Open `index.html` in a modern web browser
2. The game will start automatically
3. You should see a bouncing ball demonstrating the game loop

## Requirements

- Modern web browser with ES6 module support
- No build step required - uses native ES6 modules

## Architecture

### Game Loop
The game uses a fixed timestep update loop with variable rendering:
- **Fixed timestep**: 16.67ms (60 FPS) for consistent physics
- **Variable rendering**: Renders as fast as possible
- **Accumulator pattern**: Ensures deterministic updates

### Event System
Modules communicate via publish-subscribe pattern:
- `game:start` - Emitted when game starts
- `game:stop` - Emitted when game stops
- `game:update:before` - Before update cycle
- `game:update:after` - After update cycle
- `game:render:before` - Before render cycle
- `game:render:after` - After render cycle
- `fps:update` - FPS counter update (every second)

### Module System
Clean separation of concerns:
- **Core**: Game engine, rendering, events
- **Physics**: Ragdoll, collision, IK, locomotion
- **AI**: Ollama service, vision, memory, emotions, reasoning
- **Game**: Spawn menu, weapons, health, needs, chat

## Development

To add a new system:

1. Create a system object with `update(dt)` and/or `render(ctx)` methods
2. Register it with `game.registerSystem(system)`
3. The system will be automatically updated and rendered each frame

Example:
```javascript
const mySystem = {
    update(dt) {
        // Update logic here
    },
    render(ctx) {
        // Rendering logic here
    }
};

game.registerSystem(mySystem);
```

## Testing

Tests will be located in the `tests/` directory using a testing framework (to be set up in future tasks).

## License

MIT
