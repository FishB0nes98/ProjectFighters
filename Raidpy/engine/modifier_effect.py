import random
from typing import Dict, Optional

class ModifierEffect:
    def __init__(self, effect_data: Dict):
        self.type = effect_data.get("type", "passive")
        self.data = effect_data
        self.applied_effects = {}  # Track which effects have been applied
        
        # Combat stats
        self.damage_multiplier = 1.0
        self.defense_multiplier = 1.0
        self.healing_multiplier = 1.0
        self.lifesteal_multiplier = 1.0
        
        # Status effects
        self.divine_shield_active = False
        self.divine_shield_turns_left = 0
        self.quick_learner_stacks = 0
        self.power_surge_active = False
        
        # Apply initial modifiers
        if "damage_dealt_multiplier" in self.data:
            self.damage_multiplier = self.data["damage_dealt_multiplier"]
        if "damage_taken_multiplier" in self.data:
            self.defense_multiplier = self.data["damage_taken_multiplier"]
        if "healing_received_multiplier" in self.data:
            self.healing_multiplier = self.data["healing_received_multiplier"]
        if "lifesteal_multiplier" in self.data:
            self.lifesteal_multiplier = self.data["lifesteal_multiplier"]
            
    @property
    def has_divine_shield(self) -> bool:
        """Compatibility property for divine shield status"""
        return self.divine_shield_active
        
    @has_divine_shield.setter
    def has_divine_shield(self, value: bool):
        """Setter for divine shield status"""
        self.divine_shield_active = value
        
    def apply_passive(self, character) -> None:
        """Apply passive effects that are always active"""
        if self.type != "passive":
            return
            
        # Apply damage multiplier to character
        if "damage_dealt_multiplier" in self.data:
            character.damage_multiplier = self.damage_multiplier  # Set instead of multiply
            
        # Apply defense multiplier to character
        if "damage_taken_multiplier" in self.data:
            character.defense_multiplier = self.defense_multiplier  # Set instead of multiply
            
        # Apply max HP multiplier
        if "max_hp_multiplier" in self.data and not self.applied_effects.get("max_hp_modified"):
            character.max_hp = int(character.max_hp * self.data["max_hp_multiplier"])
            character.current_hp = character.max_hp
            self.applied_effects["max_hp_modified"] = True
            
        # Apply lifesteal
        if "lifesteal" in self.data:
            character.lifesteal = self.data["lifesteal"]  # Set instead of add
            
        # Apply buff duration bonus
        if "buff_duration_bonus" in self.data:
            character.buff_duration_bonus = self.data["buff_duration_bonus"]  # Set instead of add
            
        # Apply cooldown reduction
        if "cooldown_reduction" in self.data and not self.applied_effects.get("cooldown_reduced"):
            for ability in character.abilities:
                ability.max_cooldown = self.modify_ability_cooldown(ability.max_cooldown)
                # Also reduce current cooldown if it's higher than new max
                if ability.current_cooldown > ability.max_cooldown:
                    ability.current_cooldown = ability.max_cooldown
            self.applied_effects["cooldown_reduced"] = True
        
    def modify_damage_dealt(self, amount: int) -> int:
        """Modify outgoing damage based on effects"""
        modified = amount
        
        # Apply base damage multiplier
        modified *= self.damage_multiplier
        
        # Quick Learner bonus
        if "quick_learner" in self.data:
            bonus = 1 + (self.quick_learner_stacks * 0.1)  # 10% per stack
            modified *= bonus
            
        # Power Surge bonus
        if self.power_surge_active and "power_surge_multiplier" in self.data:
            modified *= self.data["power_surge_multiplier"]
            
        # Critical hit check
        if "crit_chance" in self.data and "crit_multiplier" in self.data:
            if random.random() < self.data["crit_chance"]:
                modified *= self.data["crit_multiplier"]
                
        return int(modified)
        
    def modify_damage_taken(self, amount: int) -> int:
        """Modify incoming damage based on effects"""
        if self.divine_shield_active:
            return 0
            
        modified = amount * self.defense_multiplier
        return int(modified)
        
    def modify_healing(self, amount: int) -> int:
        """Modify healing based on effects"""
        modified = amount * self.healing_multiplier
        return int(modified)
        
    def modify_ability_cooldown(self, cooldown: int) -> int:
        """Modify ability cooldown based on effects"""
        if "cooldown_reduction" in self.data:
            cooldown = max(0, cooldown - self.data["cooldown_reduction"])
        return cooldown
        
    def modify_buff_duration(self, duration: int) -> int:
        """Modify buff duration based on effects"""
        if "buff_duration_bonus" in self.data:
            duration += self.data["buff_duration_bonus"]
        return max(1, duration)
        
    def on_damage_dealt(self, character, damage: int, battle_log) -> None:
        """Handle effects that trigger when dealing damage"""
        # Lifesteal effect
        if "lifesteal" in self.data:
            lifesteal_amount = int(damage * self.data["lifesteal"] * self.lifesteal_multiplier)
            if lifesteal_amount > 0:
                character.current_hp = min(character.max_hp, character.current_hp + lifesteal_amount)
                battle_log.add_message(f"{character.name} heals for {lifesteal_amount} HP from lifesteal!", "heal")
                
        # Power Surge activation
        if "power_surge_threshold" in self.data and damage >= self.data["power_surge_threshold"]:
            self.power_surge_active = True
            battle_log.add_message(f"{character.name}'s Power Surge activates!", "system")
        
    def on_damage_taken(self, character, damage: int, battle_log) -> None:
        """Handle effects that trigger when taking damage"""
        # Quick Learner effect
        if "quick_learner" in self.data:
            self.quick_learner_stacks += 1
            bonus = self.quick_learner_stacks * 10
            battle_log.add_message(f"Quick Learner stacks increased! (+{bonus}% damage)", "system")
            
        # Divine Shield break
        if self.divine_shield_active and damage > 0:
            self.divine_shield_active = False
            battle_log.add_message(f"{character.name}'s Divine Shield breaks!", "system")
            
    def on_turn_start(self, character, turn_counter: int, battle_log) -> None:
        """Handle effects that trigger at turn start"""
        # Growing Power effect
        if "growing_power_per_turn" in self.data:
            growth = self.data["growing_power_per_turn"] * turn_counter
            self.damage_multiplier *= (1 + growth)
            self.defense_multiplier *= (1 - growth/2)  # Less defensive growth
            battle_log.add_message(
                f"{character.name} grows stronger! (+{growth*100:.1f}% damage, -{growth*50:.1f}% damage taken)",
                "system"
            )
            
        # Divine Shield duration
        if self.divine_shield_active:
            self.divine_shield_turns_left -= 1
            if self.divine_shield_turns_left <= 0:
                self.divine_shield_active = False
                battle_log.add_message(f"{character.name}'s Divine Shield fades!", "system")
                
        # Reset Power Surge
        self.power_surge_active = False
        
    def on_battle_start(self, character, battle_log) -> None:
        """Handle effects that trigger at battle start"""
        # Blood Pact effect
        if "initial_hp_loss" in self.data:
            hp_loss = int(character.max_hp * self.data["initial_hp_loss"])
            character.current_hp = max(1, character.current_hp - hp_loss)
            battle_log.add_message(f"{character.name} sacrifices {hp_loss} HP!", "system")
            
        # Divine Shield activation
        if "divine_shield_duration" in self.data:
            self.divine_shield_active = True
            self.divine_shield_turns_left = self.data["divine_shield_duration"]
            battle_log.add_message(f"{character.name} gains Divine Shield for {self.divine_shield_turns_left} turns!", "system")
            
        # Max HP modification
        if "max_hp_multiplier" in self.data:
            old_max = character.max_hp
            character.max_hp = int(character.max_hp * self.data["max_hp_multiplier"])
            character.current_hp = character.max_hp
            battle_log.add_message(f"{character.name}'s max HP changed from {old_max} to {character.max_hp}!", "system")
            
    def has_effect(self, effect_name: str) -> bool:
        """Check if this modifier has a specific effect"""
        return effect_name in self.data