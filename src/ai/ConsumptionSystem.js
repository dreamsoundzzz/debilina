/**
 * ConsumptionSystem handles eating and drinking mechanics
 * Detects when consumables are near the NPC's mouth and processes consumption
 * 
 * Requirements:
 * - 28.2: Detect when consumable is near NPC mouth and increase hunger when food consumed
 * - 28.3: Detect when consumable is near NPC mouth and increase thirst when drink consumed
 * - 28.4: Detect when consumable item is near NPC's head/mouth area
 * - 28.5: Remove consumable from world after consumption
 * - 28.7: Remember locations where food/water were found
 * - 28.8: Trigger relief/excitement when seeing food/water while hungry/thirsty
 */
export class ConsumptionSystem {
  /**
   * Create a new consumption system
   * @param {number} consumptionRadius - Distance from mouth to detect consumables (default 15 pixels)
   */
  constructor(consumptionRadius = 15) {
    // Requirement 28.4: Detection radius for consumables near mouth
    this.consumptionRadius = consumptionRadius;
    
    // Track recently consumed items to avoid double-consumption
    this.recentlyConsumed = new Set();
    
    // Requirement 28.8: Track which consumables have already triggered emotional responses
    // to avoid repeated triggers for the same visible item
    this.emotionallyRespondedTo = new Set();
  }

  /**
   * Update consumption system - check for consumables near NPC mouth
   * Requirements 28.2, 28.3, 28.4, 28.5, 28.7
   * @param {Object} npc - NPC character with head position and needs system
   * @param {Array} objects - Array of game objects to check
   * @param {Object} memorySystem - Memory system to record consumable locations
   * @param {Object} emotionSystem - Emotion system to trigger responses
   * @returns {Object|null} Consumed object info or null
   */
  update(npc, objects, memorySystem = null, emotionSystem = null) {
    if (!npc || !npc.head || !npc.needs) {
      return null;
    }

    const mouthPos = npc.head.position;
    
    // Requirement 28.4: Find consumables near NPC's head/mouth area
    for (const obj of objects) {
      // Skip if not consumable or already consumed
      if (!obj.consumable || this.recentlyConsumed.has(obj.id)) {
        continue;
      }

      // Check distance from mouth
      const distance = mouthPos.distanceTo(obj.position);
      
      if (distance <= this.consumptionRadius) {
        // Consume the item
        const result = this.consumeItem(obj, npc, memorySystem, emotionSystem);
        
        if (result) {
          // Mark as consumed to avoid double-consumption
          this.recentlyConsumed.add(obj.id);
          
          // Clean up consumed marker after a short delay
          setTimeout(() => {
            this.recentlyConsumed.delete(obj.id);
          }, 1000);
          
          return result;
        }
      }
    }

    return null;
  }

  /**
   * Consume a specific item
   * Requirements 28.2, 28.3, 28.5, 28.7
   * @param {Object} item - Game object to consume
   * @param {Object} npc - NPC character
   * @param {Object} memorySystem - Memory system to record event
   * @param {Object} emotionSystem - Emotion system to trigger responses
   * @returns {Object} Consumption result with item and type
   */
  consumeItem(item, npc, memorySystem = null, emotionSystem = null) {
    const consumableType = item.consumable; // 'food' or 'drink'
    const value = item.consumableValue || 0;

    // Check need value BEFORE consumption for emotional response
    const needValueBefore = consumableType === 'food' ? npc.needs.hunger : npc.needs.thirst;

    // Requirements 28.2, 28.3: Increase hunger/thirst when consumed
    if (consumableType === 'food') {
      npc.needs.consume('food', value);
    } else if (consumableType === 'drink') {
      npc.needs.consume('drink', value);
    } else {
      return null; // Invalid consumable type
    }

    // Requirement 28.7: Record consumable location in memory
    if (memorySystem) {
      const event = `Consumed ${item.type} (${consumableType}) at position (${Math.round(item.position.x)}, ${Math.round(item.position.y)})`;
      const context = {
        action: 'consumption',
        itemType: item.type,
        consumableType: consumableType,
        value: value,
        location: {
          x: item.position.x,
          y: item.position.y
        }
      };
      
      // Higher emotional intensity for consumption when needs were low
      const emotionalIntensity = needValueBefore < 50 ? 0.7 : 0.4;
      
      memorySystem.addEpisode(event, context, emotionalIntensity);
    }

    // Trigger positive emotional response
    if (emotionSystem) {
      // Reduce negative emotions when need was low (do this BEFORE triggering happiness)
      if (needValueBefore < 30) {
        emotionSystem.emotions.sad = Math.max(0, emotionSystem.emotions.sad - 0.3);
        emotionSystem.emotions.angry = Math.max(0, emotionSystem.emotions.angry - 0.2);
      }
      
      // Then trigger happiness (which may further reduce sadness)
      const emotionIntensity = needValueBefore < 50 ? 0.4 : 0.2;
      emotionSystem.trigger('happy', emotionIntensity, 'consumption');
    }

    // Return consumption result
    // Requirement 28.5: Caller should remove consumable from world
    return {
      item: item,
      type: consumableType,
      value: value,
      shouldRemove: true // Signal that item should be removed
    };
  }

  /**
   * Check if a specific object can be consumed by the NPC
   * @param {Object} obj - Game object to check
   * @param {Object} npc - NPC character
   * @returns {boolean} True if object is consumable and near mouth
   */
  canConsume(obj, npc) {
    if (!obj.consumable || !npc || !npc.head) {
      return false;
    }

    const distance = npc.head.position.distanceTo(obj.position);
    return distance <= this.consumptionRadius;
  }

  /**
   * Get all consumable objects within consumption range
   * @param {Object} npc - NPC character
   * @param {Array} objects - Array of game objects
   * @returns {Array} Array of consumable objects near mouth
   */
  getNearbyConsumables(npc, objects) {
    if (!npc || !npc.head) {
      return [];
    }

    const mouthPos = npc.head.position;
    const nearby = [];

    for (const obj of objects) {
      if (obj.consumable) {
        const distance = mouthPos.distanceTo(obj.position);
        if (distance <= this.consumptionRadius) {
          nearby.push({
            object: obj,
            distance: distance,
            type: obj.consumable
          });
        }
      }
    }

    // Sort by distance (closest first)
    nearby.sort((a, b) => a.distance - b.distance);

    return nearby;
  }

  /**
   * Reset the consumption system
   */
  reset() {
    this.recentlyConsumed.clear();
    this.emotionallyRespondedTo.clear();
  }

  /**
   * Check visible consumables and trigger emotional responses based on needs
   * Requirement 28.8: Trigger relief/excitement when seeing food/water while hungry/thirsty
   * @param {Object} npc - NPC character with needs system
   * @param {Array} visibleEntities - Array of visible entities from VisionSystem
   * @param {Object} emotionSystem - Emotion system to trigger responses
   */
  checkVisibleConsumables(npc, visibleEntities, emotionSystem) {
    if (!npc || !npc.needs || !emotionSystem || !visibleEntities) {
      return;
    }

    const needs = npc.needs.getNeeds();
    const isHungry = needs.hunger < 30;
    const isThirsty = needs.thirst < 30;

    // If not hungry or thirsty, no emotional response needed
    if (!isHungry && !isThirsty) {
      // Clear the tracking set when needs are satisfied
      this.emotionallyRespondedTo.clear();
      return;
    }

    // Check each visible entity for consumables
    for (const entity of visibleEntities) {
      // Skip if not a consumable
      if (!entity.consumable) {
        continue;
      }

      // Skip if already responded to this item
      if (this.emotionallyRespondedTo.has(entity.id)) {
        continue;
      }

      const consumableType = entity.consumable; // 'food' or 'drink'

      // Requirement 28.8: Trigger relief/excitement when seeing food while hungry
      if (consumableType === 'food' && isHungry) {
        // Calculate intensity based on how hungry the NPC is
        const hungerIntensity = (30 - needs.hunger) / 30; // 0.0 to 1.0
        const emotionIntensity = 0.2 + (hungerIntensity * 0.3); // 0.2 to 0.5

        // Trigger relief (reduce negative emotions)
        emotionSystem.emotions.sad = Math.max(0, emotionSystem.emotions.sad - 0.15);
        emotionSystem.emotions.angry = Math.max(0, emotionSystem.emotions.angry - 0.1);
        
        // Trigger excitement (increase happiness and curiosity)
        emotionSystem.trigger('happy', emotionIntensity, 'seeing_food_while_hungry');
        emotionSystem.trigger('curious', emotionIntensity * 0.5, 'seeing_food_while_hungry');

        // Mark as responded to
        this.emotionallyRespondedTo.add(entity.id);
      }

      // Requirement 28.8: Trigger relief/excitement when seeing water while thirsty
      if (consumableType === 'drink' && isThirsty) {
        // Calculate intensity based on how thirsty the NPC is
        const thirstIntensity = (30 - needs.thirst) / 30; // 0.0 to 1.0
        const emotionIntensity = 0.2 + (thirstIntensity * 0.3); // 0.2 to 0.5

        // Trigger relief (reduce negative emotions)
        emotionSystem.emotions.fearful = Math.max(0, emotionSystem.emotions.fearful - 0.15);
        emotionSystem.emotions.angry = Math.max(0, emotionSystem.emotions.angry - 0.1);
        
        // Trigger excitement (increase happiness and curiosity)
        emotionSystem.trigger('happy', emotionIntensity, 'seeing_water_while_thirsty');
        emotionSystem.trigger('curious', emotionIntensity * 0.5, 'seeing_water_while_thirsty');

        // Mark as responded to
        this.emotionallyRespondedTo.add(entity.id);
      }
    }
  }
}
