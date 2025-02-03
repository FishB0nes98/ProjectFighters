import json
import random
from typing import Dict, List, Optional, Union
from engine.buff import Buff
from engine.modifier_effect import ModifierEffect

class ModifierManager:
    def __init__(self, firebase_manager=None):
        self.firebase = firebase_manager
        self.modifiers = []
        self.cached_modifiers = None
        self.load_modifiers()
        
        # Rarity weights
        self.rarity_weights = {
            "common": 100,
            "rare": 60,
            "epic": 30,
            "legendary": 10
        }

    def load_modifiers(self):
        """Load modifiers from JSON file"""
        try:
            with open("Raidpy/data/modifiers.json", "r") as f:
                data = json.load(f)
                # Combine both regular and character-specific modifiers
                self.modifiers = data.get("modifiers", []) + data.get("chamChamModifiers", [])
        except Exception as e:
            print(f"Error loading modifiers: {e}")
            self.modifiers = []

    def get_available_modifiers(self, count=3) -> List[Dict]:
        """Get random available modifiers based on rarity weights"""
        # Return cached modifiers if available
        if self.cached_modifiers is not None:
            return self.cached_modifiers
            
        # Filter out disabled modifiers
        available = [m for m in self.modifiers if not m.get("disabled", False)]
        
        if not available:
            return []
            
        selected = []
        remaining = available.copy()
        
        for _ in range(min(count, len(available))):
            # Calculate total weight of remaining modifiers
            total_weight = sum(self.rarity_weights[m["rarity"]] for m in remaining)
            
            if total_weight == 0:
                break
                
            # Random selection based on weights
            r = random.uniform(0, total_weight)
            cumulative_weight = 0
            
            for modifier in remaining:
                cumulative_weight += self.rarity_weights[modifier["rarity"]]
                if r <= cumulative_weight:
                    selected.append(modifier)
                    remaining.remove(modifier)
                    break
        
        # Cache the selected modifiers
        self.cached_modifiers = selected
        return selected

    def reset_cached_modifiers(self):
        """Reset the cached modifiers"""
        self.cached_modifiers = None

    def get_stage_modifier(self, stage_id):
        """Get saved modifier for a stage"""
        if not self.firebase:
            return None
            
        try:
            user_id = self.firebase.current_user['localId']
            modifier_ref = f"users/{user_id}/modifiers/{stage_id}"
            saved = self.firebase.db.child(modifier_ref).get().val()
            
            if saved and saved.get("modifier_id"):
                return next(
                    (m for m in self.modifiers if m["id"] == saved["modifier_id"]), 
                    None
                )
            return None
        except Exception as e:
            print(f"Error getting modifier: {e}")
            return None

    def save_stage_modifier(self, stage_id, modifier_id):
        """Save modifier selection for a stage"""
        if not self.firebase:
            return False
            
        try:
            user_id = self.firebase.current_user['localId']
            modifier_ref = f"users/{user_id}/modifiers/{stage_id}"
            self.firebase.db.child(modifier_ref).set({
                "modifier_id": modifier_id,
                "selected": True
            })
            return True
        except Exception as e:
            print(f"Error saving modifier: {e}")
            return False

    def reset_stage_modifiers(self):
        """Reset all stage modifiers"""
        if not self.firebase:
            return False
            
        try:
            user_id = self.firebase.current_user['localId']
            self.firebase.db.child(f"users/{user_id}/modifiers").remove()
            return True
        except Exception as e:
            print(f"Error resetting modifiers: {e}")
            return False
            
    def apply_modifier_effects(self, character, modifier_data: Dict, battle_log) -> None:
        """Apply modifier effects to a character"""
        if not modifier_data:
            return
            
        # Create ModifierEffect instance
        effect = ModifierEffect(modifier_data.get("effects", {}))
        
        # Store the effect on the character
        character.modifier_effect = effect
        
        # Apply passive effects first
        effect.apply_passive(character)
        
        # Apply battle start effects
        effect.on_battle_start(character, battle_log)
        
        # Store modifier data for reference
        character.current_modifier = modifier_data

    def handle_turn_effects(self, character, turn_counter: int, battle_log) -> int:
        """Handle turn-based modifier effects"""
        if not hasattr(character, 'modifier_effect'):
            return 0
            
        effect = character.modifier_effect
        
        # Apply turn start effects
        effect.apply_turn_start(character, turn_counter, battle_log)
        
        # Apply turn check effects
        effect.apply_turn_check(character, turn_counter, battle_log)
        
        return 0  # No direct damage from effects in this system
        
    def modify_damage(self, damage: int, character) -> int:
        """Modify damage based on character's modifier effects"""
        if not hasattr(character, 'modifier_effect'):
            return damage
            
        return character.modifier_effect.modify_damage(damage, character)

    def apply_pre_ability_effects(self, character, ability) -> List[str]:
        """Apply modifier effects before ability execution"""
        if not hasattr(character, 'modifier'):
            return []

        messages = []
        effects = character.modifier.get("effects", {})
        
        # Handle shield chance
        if "shield_chance" in effects and "shield_amount" in effects:
            if random.random() < effects["shield_chance"]:
                shield_amount = effects["shield_amount"]
                # Scale shield with character's max HP if specified
                if effects.get("shield_scales_with_hp", False):
                    shield_amount = int(character.max_hp * effects["shield_amount"])
                
                shield_buff = Buff(
                    name="Barrier",
                    icon_path="Raidpy/res/img/shield_buff.webp",
                    duration=effects.get("shield_duration", 3),
                    effect_type="shield",
                    effect_value=shield_amount
                )
                character.add_buff(shield_buff)
                messages.append(f"Barrier Master activates! {character.name} gains {shield_amount} shield!")

        # Handle pre-ability stat boosts
        if "pre_ability_effects" in effects:
            for effect in effects["pre_ability_effects"]:
                if effect["type"] == "temp_damage_boost":
                    boost = effect["value"]
                    duration = effect["duration"]
                    damage_buff = Buff(
                        name="Temporary Power",
                        icon_path="Raidpy/res/img/damage_buff.webp",
                        duration=duration,
                        effect_type="damage_multiplier",
                        effect_value=boost
                    )
                    character.add_buff(damage_buff)
                    messages.append(f"{character.name} gains {boost*100}% damage for {duration} turns!")

        # Handle ability preparation effects
        if ability.name in effects.get("ability_prep_effects", {}):
            prep_effects = effects["ability_prep_effects"][ability.name]
            for effect in prep_effects:
                if effect["type"] == "reduce_cooldown":
                    for other_ability in character.abilities:
                        if other_ability.name == effect["target_ability"]:
                            reduction = min(other_ability.current_cooldown, effect["value"])
                            if reduction > 0:
                                other_ability.current_cooldown -= reduction
                                messages.append(f"{ability.name} reduces {other_ability.name}'s cooldown by {reduction}!")

        return messages

    def get_damage_multiplier(self, character):
        """Get total damage multiplier from modifiers"""
        if not hasattr(character, 'modifier'):
            return 1.0

        effects = character.modifier.get("effects", {})
        multiplier = 1.0

        # Apply general damage multiplier
        if "damage_multiplier" in effects:
            multiplier *= (1 + effects["damage_multiplier"])

        # Apply conditional multipliers
        if "conditional_damage" in effects:
            for condition in effects["conditional_damage"]:
                if self._check_condition(character, condition["condition"]):
                    multiplier *= (1 + condition["value"])

        # Apply combo point multiplier if available
        if hasattr(character, 'combo_points') and character.combo_points > 0:
            if "combo_system" in effects:
                combo = effects["combo_system"]
                multiplier *= (1 + (combo["damage_multiplier_per_point"] * character.combo_points))

        return multiplier

    def get_lifesteal_multiplier(self, character):
        """Get lifesteal multiplier from modifiers"""
        if not hasattr(character, 'modifier'):
            return 0.0

        effects = character.modifier.get("effects", {})
        lifesteal = effects.get("lifesteal", 0.0)

        # Apply conditional lifesteal bonuses
        if "conditional_lifesteal" in effects:
            for condition in effects["conditional_lifesteal"]:
                if self._check_condition(character, condition["condition"]):
                    lifesteal += condition["value"]

        return lifesteal

    def get_additional_hits(self, character, ability):
        """Get additional hits for multi-hit abilities"""
        if not hasattr(character, 'modifier'):
            return 0

        effects = character.modifier.get("effects", {})
        additional_hits = 0

        # Base additional hits
        if "additional_hits" in effects and ability.name in effects["additional_hits"]:
            additional_hits += effects["additional_hits"][ability.name]

        # Combo point additional hits
        if hasattr(character, 'combo_points') and character.combo_points > 0:
            if "combo_system" in effects and ability.name in effects["combo_system"].get("multi_hit_abilities", []):
                additional_hits += character.combo_points

        return additional_hits

    def apply_post_ability_effects(self, character, ability) -> List[str]:
        """Apply modifier effects after ability execution"""
        if not hasattr(character, 'modifier'):
            return []

        messages = []
        effects = character.modifier.get("effects", {})

        # Handle cooldown reduction
        if "cooldown_reduction" in effects and ability.current_cooldown > 0:
            reduction = min(ability.current_cooldown, effects["cooldown_reduction"])
            ability.current_cooldown -= reduction
            messages.append(f"Modifier reduces {ability.name} cooldown by {reduction}!")

        # Handle ability-specific effects
        if ability.name in effects.get("ability_effects", {}):
            ability_effects = effects["ability_effects"][ability.name]
            for effect in ability_effects:
                if effect["type"] == "bonus_damage":
                    character.damage_multiplier *= (1 + effect["value"])
                    messages.append(f"{ability.name} deals {effect['value']*100}% bonus damage!")
                elif effect["type"] == "bonus_healing":
                    character.healing_multiplier *= (1 + effect["value"])
                    messages.append(f"{ability.name} healing increased by {effect['value']*100}%!")
                elif effect["type"] == "chain_ability":
                    # Chain another ability after this one
                    for chain_ability in character.abilities:
                        if chain_ability.name == effect["chain_ability_name"]:
                            chain_ability.current_cooldown = 0
                            messages.append(f"{ability.name} allows instant use of {chain_ability.name}!")

        # Handle combo point system
        if "combo_system" in effects:
            combo = effects["combo_system"]
            if not hasattr(character, 'combo_points'):
                character.combo_points = 0
            
            # Add combo points
            if ability.name in combo.get("generators", []):
                character.combo_points = min(character.combo_points + 1, combo["max_points"])
                messages.append(f"Gained 1 combo point! (Current: {character.combo_points})")
            
            # Spend combo points for bonus effects
            elif ability.name in combo.get("spenders", []):
                if character.combo_points > 0:
                    bonus = combo["bonus_per_point"] * character.combo_points
                    character.damage_multiplier *= (1 + bonus)
                    messages.append(f"Spent {character.combo_points} combo points for {bonus*100}% bonus damage!")
                    character.combo_points = 0

        return messages

    def _check_condition(self, character, condition: str) -> bool:
        """Check if a condition is met for conditional effects"""
        if condition == "below_50_percent_hp":
            return character.current_hp < (character.max_hp * 0.5)
        elif condition == "above_80_percent_hp":
            return character.current_hp > (character.max_hp * 0.8)
        elif condition == "has_shield":
            return hasattr(character, 'shield') and character.shield > 0
        elif condition == "max_combo_points":
            return hasattr(character, 'combo_points') and character.combo_points >= 5
        elif condition == "no_buffs":
            return len(character.buffs) == 0
        return False

    def check_second_chance(self, character, damage, used_second_chance, battle_log):
        """Check and apply second chance healing"""
        if not hasattr(character, 'modifier'):
            return

        effects = character.modifier.get("effects", {})
        if "heal_threshold" in effects and character not in used_second_chance:
            threshold = effects["heal_threshold"]
            if (character.current_hp - damage) / character.max_hp <= threshold:
                heal_percent = effects["heal_percent"]
                heal_amount = int(character.max_hp * heal_percent)
                character.heal(heal_amount)
                used_second_chance.add(character)
                battle_log.add_message(
                    f"{character.name}'s Second Chance activates! Heals for {heal_amount} HP!",
                    "heal"
                )

    def get_modifier_by_id(self, modifier_id):
        """Get a modifier by its ID"""
        for modifier in self.modifiers["modifiers"]:
            if modifier["id"] == modifier_id:
                return {
                    "id": modifier["id"],
                    "name": modifier["name"],
                    "description": modifier["description"],
                    "rarity": modifier["rarity"],
                    "icon_path": modifier["icon_path"],
                    "effects": modifier["effects"]  # Pass the entire effects object
                }