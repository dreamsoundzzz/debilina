/**
 * Renderer - Handles HTML5 Canvas rendering
 * Validates: Requirements 1.2, 1.3, 1.4
 */
export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = 0;
        this.height = 0;
        
        // Viewport culling settings
        this.viewport = {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            padding: 100 // Extra padding to avoid pop-in
        };
        
        // Batching state
        this.batchedDrawCalls = {
            circles: [],
            rectangles: [],
            lines: []
        };
        
        // Initialize canvas size
        this.resize();
        
        // Handle window resize
        window.addEventListener('resize', () => this.resize());
    }

    /**
     * Resize canvas to match window size
     * Validates: Requirement 1.4
     */
    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        // Update viewport dimensions
        this.viewport.width = this.width;
        this.viewport.height = this.height;
    }

    /**
     * Clear the canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Draw sky background
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    /**
     * Begin a new frame
     */
    beginFrame() {
        this.clear();
        
        // Reset batched draw calls
        this.batchedDrawCalls.circles = [];
        this.batchedDrawCalls.rectangles = [];
        this.batchedDrawCalls.lines = [];
    }

    /**
     * End the current frame and flush batched draw calls
     */
    endFrame() {
        // Flush any remaining batched draw calls
        this.flushBatchedDrawCalls();
    }

    /**
     * Get the rendering context
     * @returns {CanvasRenderingContext2D}
     */
    getContext() {
        return this.ctx;
    }

    /**
     * Check if a point is within the viewport (with padding)
     * Validates: Requirement 13.1 - Viewport culling optimization
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} radius - Optional radius for bounds checking
     * @returns {boolean} True if visible
     */
    isInViewport(x, y, radius = 0) {
        const padding = this.viewport.padding;
        return (
            x + radius >= this.viewport.x - padding &&
            x - radius <= this.viewport.x + this.viewport.width + padding &&
            y + radius >= this.viewport.y - padding &&
            y - radius <= this.viewport.y + this.viewport.height + padding
        );
    }

    /**
     * Check if a rectangular area is within the viewport
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} width - Width
     * @param {number} height - Height
     * @returns {boolean} True if visible
     */
    isRectInViewport(x, y, width, height) {
        const padding = this.viewport.padding;
        return (
            x + width >= this.viewport.x - padding &&
            x <= this.viewport.x + this.viewport.width + padding &&
            y + height >= this.viewport.y - padding &&
            y <= this.viewport.y + this.viewport.height + padding
        );
    }

    /**
     * Batch a circle draw call for later rendering
     * Validates: Requirement 13.1 - Batch similar draw calls
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} radius - Circle radius
     * @param {string} fillStyle - Fill color
     * @param {string} strokeStyle - Stroke color
     * @param {number} lineWidth - Stroke width
     */
    batchCircle(x, y, radius, fillStyle, strokeStyle, lineWidth) {
        this.batchedDrawCalls.circles.push({
            x, y, radius, fillStyle, strokeStyle, lineWidth
        });
    }

    /**
     * Batch a line draw call for later rendering
     * @param {number} x1 - Start X
     * @param {number} y1 - Start Y
     * @param {number} x2 - End X
     * @param {number} y2 - End Y
     * @param {string} strokeStyle - Stroke color
     * @param {number} lineWidth - Stroke width
     */
    batchLine(x1, y1, x2, y2, strokeStyle, lineWidth) {
        this.batchedDrawCalls.lines.push({
            x1, y1, x2, y2, strokeStyle, lineWidth
        });
    }

    /**
     * Flush all batched draw calls
     * Groups similar draw calls to minimize state changes
     */
    flushBatchedDrawCalls() {
        const ctx = this.ctx;
        
        // Draw all lines grouped by style
        const linesByStyle = new Map();
        for (const line of this.batchedDrawCalls.lines) {
            const key = `${line.strokeStyle}-${line.lineWidth}`;
            if (!linesByStyle.has(key)) {
                linesByStyle.set(key, []);
            }
            linesByStyle.get(key).push(line);
        }
        
        for (const [key, lines] of linesByStyle) {
            const [strokeStyle, lineWidth] = key.split('-');
            ctx.strokeStyle = strokeStyle;
            ctx.lineWidth = parseFloat(lineWidth);
            
            ctx.beginPath();
            for (const line of lines) {
                ctx.moveTo(line.x1, line.y1);
                ctx.lineTo(line.x2, line.y2);
            }
            ctx.stroke();
        }
        
        // Draw all circles grouped by style
        const circlesByStyle = new Map();
        for (const circle of this.batchedDrawCalls.circles) {
            const key = `${circle.fillStyle}-${circle.strokeStyle}-${circle.lineWidth}`;
            if (!circlesByStyle.has(key)) {
                circlesByStyle.set(key, []);
            }
            circlesByStyle.get(key).push(circle);
        }
        
        for (const [key, circles] of circlesByStyle) {
            const [fillStyle, strokeStyle, lineWidth] = key.split('-');
            ctx.fillStyle = fillStyle;
            ctx.strokeStyle = strokeStyle;
            ctx.lineWidth = parseFloat(lineWidth);
            
            for (const circle of circles) {
                ctx.beginPath();
                ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
        }
    }

    /**
     * Render a character with all body parts and joints
     * Validates: Requirements 1.3, 1.6, 2.5, 13.1 (viewport culling)
     * @param {Character} character - The character to render
     */
    renderCharacter(character) {
        // Viewport culling: Check if character is visible
        const headPos = character.head.position;
        if (!this.isInViewport(headPos.x, headPos.y, 200)) {
            return; // Skip rendering if off-screen
        }
        
        const ctx = this.ctx;
        
        // First pass: Draw joints (lines connecting body parts)
        this.renderJoints(character);
        
        // Second pass: Draw body parts with z-ordering
        // Sort body parts by z-order (back to front)
        const sortedParts = this.sortBodyPartsByZOrder(character.bodyParts);
        
        for (const part of sortedParts) {
            this.renderBodyPart(part);
        }
        
        // Draw character name
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        
        const namePos = character.head.position;
        ctx.strokeText(character.name, namePos.x, namePos.y - 30);
        ctx.fillText(character.name, namePos.x, namePos.y - 30);
    }

    /**
     * Render joints as lines connecting body parts
     * @param {Character} character - The character
     */
    renderJoints(character) {
        const ctx = this.ctx;
        
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
        ctx.lineWidth = 2;
        
        // Draw lines for distance constraints (joints)
        for (const constraint of character.constraints) {
            if (constraint.bodyA && constraint.bodyB) {
                ctx.beginPath();
                ctx.moveTo(constraint.bodyA.position.x, constraint.bodyA.position.y);
                ctx.lineTo(constraint.bodyB.position.x, constraint.bodyB.position.y);
                ctx.stroke();
            }
        }
    }

    /**
     * Render a single body part
     * Validates: Requirement 13.1 - Viewport culling and batching
     * @param {BodyPart} part - The body part to render
     */
    renderBodyPart(part) {
        const pos = part.position;
        
        // Viewport culling: Skip if off-screen
        if (!this.isInViewport(pos.x, pos.y, part.radius)) {
            return;
        }
        
        const ctx = this.ctx;
        
        // Choose color based on body part type
        const color = this.getBodyPartColor(part.type);
        
        // Draw immediately (batching circles causes z-order issues with characters)
        ctx.fillStyle = color;
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, part.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }

    /**
     * Get color for a body part based on its type
     * @param {string} type - Body part type
     * @returns {string} CSS color
     */
    getBodyPartColor(type) {
        const colors = {
            head: '#FFD4A3',      // Skin tone
            torso: '#4A90E2',     // Blue shirt
            upperArm: '#FFD4A3',  // Skin tone
            forearm: '#FFD4A3',   // Skin tone
            hand: '#FFD4A3',      // Skin tone
            thigh: '#2C5F8D',     // Dark blue pants
            shin: '#2C5F8D',      // Dark blue pants
            foot: '#8B4513'       // Brown shoes
        };
        
        return colors[type] || '#CCCCCC';
    }

    /**
     * Sort body parts by z-order for proper layering
     * Back parts should be drawn first, front parts last
     * @param {BodyPart[]} bodyParts - Array of body parts
     * @returns {BodyPart[]} Sorted array
     */
    sortBodyPartsByZOrder(bodyParts) {
        // Define z-order priority (lower = drawn first/behind)
        const zOrder = {
            foot: 1,
            shin: 2,
            thigh: 3,
            torso: 4,
            upperArm: 5,
            forearm: 6,
            hand: 7,
            head: 8
        };
        
        return [...bodyParts].sort((a, b) => {
            const orderA = zOrder[a.type] || 0;
            const orderB = zOrder[b.type] || 0;
            return orderA - orderB;
        });
    }

    /**
     * Render FOV cone visualization for vision system
     * Requirement 7.6: Display visual representation of NPC's field of view
     * @param {Object} fovData - FOV cone data {origin, facingAngle, fov, range}
     * @param {string} color - Color for the FOV cone (default: semi-transparent yellow)
     */
    renderFOVCone(fovData, color = 'rgba(255, 255, 0, 0.15)') {
        const ctx = this.ctx;
        const { origin, facingAngle, fov, range } = fovData;
        
        // Calculate start and end angles of the FOV cone
        const startAngle = facingAngle - fov / 2;
        const endAngle = facingAngle + fov / 2;
        
        // Draw the FOV cone as a filled arc
        ctx.save();
        ctx.fillStyle = color;
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(origin.x, origin.y);
        ctx.arc(origin.x, origin.y, range, startAngle, endAngle);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Draw the center ray to show facing direction
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(origin.x, origin.y);
        const centerX = origin.x + Math.cos(facingAngle) * range;
        const centerY = origin.y + Math.sin(facingAngle) * range;
        ctx.lineTo(centerX, centerY);
        ctx.stroke();
        
        ctx.restore();
    }

    /**
     * Render need indicators (hunger, thirst, energy bars) near a character
     * Requirement 27.10: Display need indicators near the NPC
     * @param {Character} character - The character to render needs for
     * @param {Object} needs - Needs object with hunger, thirst, energy values (0-100)
     */
    renderNeedIndicators(character, needs) {
        const ctx = this.ctx;
        
        // Position indicators above character's head
        const headPos = character.head.position;
        const startX = headPos.x - 60; // Center the bars (3 bars * 40px width / 2)
        const startY = headPos.y - 60; // Position above name
        
        const barWidth = 35;
        const barHeight = 8;
        const barSpacing = 5;
        
        // Define bar configurations
        const bars = [
            { 
                label: 'H', 
                value: needs.hunger, 
                color: '#FF6B35',      // Orange for hunger
                bgColor: '#4A4A4A'     // Dark gray background
            },
            { 
                label: 'T', 
                value: needs.thirst, 
                color: '#4ECDC4',      // Cyan for thirst
                bgColor: '#4A4A4A'
            },
            { 
                label: 'E', 
                value: needs.energy, 
                color: '#FFE66D',      // Yellow for energy
                bgColor: '#4A4A4A'
            }
        ];
        
        ctx.save();
        
        // Draw each bar
        bars.forEach((bar, index) => {
            const x = startX + index * (barWidth + barSpacing);
            const y = startY;
            
            // Draw background (empty bar)
            ctx.fillStyle = bar.bgColor;
            ctx.fillRect(x, y, barWidth, barHeight);
            
            // Draw filled portion based on value (0-100)
            const fillWidth = (bar.value / 100) * barWidth;
            ctx.fillStyle = bar.color;
            ctx.fillRect(x, y, fillWidth, barHeight);
            
            // Draw border
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, barWidth, barHeight);
            
            // Draw label below bar
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.strokeText(bar.label, x + barWidth / 2, y + barHeight + 10);
            ctx.fillText(bar.label, x + barWidth / 2, y + barHeight + 10);
        });
        
        ctx.restore();
    }

    /**
     * Render health bar above a character
     * Requirement 26.4: Display health bars above characters
     * @param {Character} character - The character to render health for
     * @param {HealthSystem} healthSystem - The character's health system
     */
    renderHealthBar(character, healthSystem) {
        const ctx = this.ctx;
        
        // Position health bar above character's head
        const headPos = character.head.position;
        const barWidth = 100;
        const barHeight = 10;
        const x = headPos.x - barWidth / 2;
        const y = headPos.y - 45; // Position above name
        
        // Calculate health percentage
        const maxHealth = healthSystem.bodyPartHealth.size * 100; // Approximate max health
        const currentHealth = healthSystem.totalHealth;
        const healthPercentage = Math.max(0, Math.min(100, (currentHealth / maxHealth) * 100));
        
        ctx.save();
        
        // Draw background (empty bar)
        ctx.fillStyle = '#4A4A4A';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Draw filled portion based on health percentage
        const fillWidth = (healthPercentage / 100) * barWidth;
        
        // Color based on health level
        let healthColor;
        if (healthPercentage > 60) {
            healthColor = '#4CAF50'; // Green for healthy
        } else if (healthPercentage > 30) {
            healthColor = '#FFC107'; // Yellow for injured
        } else {
            healthColor = '#F44336'; // Red for critical
        }
        
        ctx.fillStyle = healthColor;
        ctx.fillRect(x, y, fillWidth, barHeight);
        
        // Draw border
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, barWidth, barHeight);
        
        // Draw health text
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        const healthText = `${Math.round(currentHealth)}/${Math.round(maxHealth)}`;
        ctx.strokeText(healthText, headPos.x, y + barHeight + 12);
        ctx.fillText(healthText, headPos.x, y + barHeight + 12);
        
        ctx.restore();
    }

    /**
     * Render pain indicators on damaged body parts
     * Requirement 19.7: Display visual indicators of pain (red highlights)
     * @param {Character} character - The character to render pain for
     * @param {HealthSystem} healthSystem - The character's health system
     * @param {PainSensor} painSensor - The character's pain sensor (optional)
     */
    renderPainIndicators(character, healthSystem, painSensor = null) {
        const ctx = this.ctx;
        
        ctx.save();
        
        // Get damaged body parts
        const damagedParts = healthSystem.getDamagedParts();
        
        // Render red highlights on damaged parts
        for (const { part, health, maxHealth, percentage } of damagedParts) {
            const pos = part.position;
            
            // Calculate pain intensity based on damage (0-1)
            const damageIntensity = 1 - (percentage / 100);
            
            // Red highlight with alpha based on damage
            const alpha = Math.min(0.6, damageIntensity * 0.8);
            ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
            ctx.strokeStyle = `rgba(200, 0, 0, ${alpha + 0.2})`;
            ctx.lineWidth = 3;
            
            // Draw red circle overlay on damaged part
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, part.radius + 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
        
        // If pain sensor exists and character is in active pain, add pulsing effect
        if (painSensor && painSensor.currentPain > 20) {
            const painIntensity = painSensor.currentPain / 100;
            const recentPain = painSensor.getRecentPain(2000); // Last 2 seconds
            
            // Highlight recently damaged parts with pulsing effect
            for (const painEvent of recentPain) {
                // Find the body part
                const part = character.bodyParts.find(p => p.type === painEvent.bodyPart);
                if (!part) continue;
                
                const pos = part.position;
                
                // Pulsing effect based on time since damage
                const timeSinceDamage = Date.now() - painEvent.timestamp;
                const pulseFrequency = 3; // Hz
                const pulse = Math.sin((timeSinceDamage / 1000) * pulseFrequency * Math.PI * 2);
                const pulseAlpha = 0.3 + (pulse * 0.2 * painEvent.intensity);
                
                ctx.fillStyle = `rgba(255, 50, 50, ${pulseAlpha})`;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, part.radius + 5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.restore();
    }

    /**
     * Render a game object with viewport culling
     * Validates: Requirement 13.1 - Viewport culling optimization
     * @param {GameObject} obj - The game object to render
     */
    renderGameObject(obj) {
        // Viewport culling: Skip if off-screen
        if (!this.isInViewport(obj.x, obj.y, obj.radius || 50)) {
            return;
        }
        
        const ctx = this.ctx;
        
        ctx.save();
        ctx.translate(obj.x, obj.y);
        if (obj.rotation) {
            ctx.rotate(obj.rotation);
        }
        
        // Render based on shape
        if (obj.shape === 'circle') {
            ctx.fillStyle = obj.color || '#888';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, obj.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        } else if (obj.shape === 'rectangle') {
            ctx.fillStyle = obj.color || '#888';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.fillRect(-obj.width / 2, -obj.height / 2, obj.width, obj.height);
            ctx.strokeRect(-obj.width / 2, -obj.height / 2, obj.width, obj.height);
        }
        
        ctx.restore();
    }

    /**
     * Render multiple game objects with viewport culling
     * Validates: Requirement 13.1 - Viewport culling optimization
     * @param {GameObject[]} objects - Array of game objects to render
     */
    renderGameObjects(objects) {
        for (const obj of objects) {
            this.renderGameObject(obj);
        }
    }
}
