/**
 * GameEngine - Core game loop with fixed timestep
 * Validates: Requirements 1.1, 1.5, 14.1
 */
import { Renderer } from './Renderer.js';
import { EventSystem } from './EventSystem.js';

export class GameEngine {
    constructor(canvas) {
        // Core systems
        this.renderer = new Renderer(canvas);
        this.events = new EventSystem();
        
        // Game loop timing
        this.FIXED_TIMESTEP = 1000 / 60; // 16.67ms for 60 FPS
        this.lastTime = 0;
        this.accumulator = 0;
        this.running = false;
        
        // FPS tracking
        this.fps = 0;
        this.frameCount = 0;
        this.fpsUpdateTime = 0;
        
        // Systems registry
        this.systems = [];
        
        // Bind the game loop
        this.gameLoop = this.gameLoop.bind(this);
    }

    /**
     * Register a system to be updated each frame
     * @param {Object} system - System with update(dt) method
     */
    registerSystem(system) {
        this.systems.push(system);
    }

    /**
     * Start the game loop
     * Validates: Requirement 1.5
     */
    start() {
        if (this.running) return;
        
        this.running = true;
        this.lastTime = performance.now();
        this.fpsUpdateTime = this.lastTime;
        
        this.events.emit('game:start');
        requestAnimationFrame(this.gameLoop);
    }

    /**
     * Stop the game loop
     */
    stop() {
        this.running = false;
        this.events.emit('game:stop');
    }

    /**
     * Main game loop with fixed timestep
     * Validates: Requirements 1.1, 1.5
     */
    gameLoop(currentTime) {
        if (!this.running) return;

        // Calculate delta time
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        this.accumulator += deltaTime;

        // Fixed timestep updates
        while (this.accumulator >= this.FIXED_TIMESTEP) {
            this.update(this.FIXED_TIMESTEP / 1000); // Convert to seconds
            this.accumulator -= this.FIXED_TIMESTEP;
        }

        // Variable timestep rendering
        this.render();

        // Update FPS counter
        this.updateFPS(currentTime);

        // Continue loop
        requestAnimationFrame(this.gameLoop);
    }

    /**
     * Update all game systems
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
        this.events.emit('game:update:before', dt);
        
        // Update all registered systems
        for (const system of this.systems) {
            if (system.update) {
                system.update(dt);
            }
        }
        
        this.events.emit('game:update:after', dt);
    }

    /**
     * Render the game
     * Validates: Requirement 1.1
     */
    render() {
        this.events.emit('game:render:before');
        
        this.renderer.beginFrame();
        
        // Render all registered systems
        for (const system of this.systems) {
            if (system.render) {
                system.render(this.renderer.getContext());
            }
        }
        
        this.renderer.endFrame();
        
        this.events.emit('game:render:after');
    }

    /**
     * Update FPS counter
     * @param {number} currentTime - Current timestamp
     */
    updateFPS(currentTime) {
        this.frameCount++;
        
        // Update FPS display every second
        if (currentTime - this.fpsUpdateTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsUpdateTime = currentTime;
            
            this.events.emit('fps:update', this.fps);
            
            // Update UI
            const fpsElement = document.getElementById('fps-counter');
            if (fpsElement) {
                fpsElement.textContent = `FPS: ${this.fps}`;
            }
        }
    }

    /**
     * Get the current FPS
     * @returns {number}
     */
    getFPS() {
        return this.fps;
    }
}
