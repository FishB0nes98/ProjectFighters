import pygame
from engine.character import Character
from engine.ability import Ability
from engine.buff import Buff

class Nina(Character):
    def __init__(self, position):
        super().__init__("Farmer Nina", 6800, "Loading Screen/Farmer Nina.png", position)
        self.setup_abilities()
        self.buff_effects = {
            "lifesteal": 0,
            "damage_multiplier": 1.0,
            "dodge_chance": 0.0
        }

    def setup_abilities(self):
        abilities = [
            ("Quick Shot", "Raids/Farm Raid/res/Nina_A1.jpeg", 375, 0, 0, True),
            ("Targeted", "Raids/Farm Raid/res/Nina_A2.jpeg", 0, 0, 10, False),
            ("Hide", "Raids/Farm Raid/res/Nina_A3.jpeg", 0, 300, 14, True),
            ("Rain of Arrows", "Raids/Farm Raid/res/Nina_A4.jpeg", 800, 0, 20, True)
        ]

        for name, icon, damage, healing, cooldown, ends_turn in abilities:
            ability = Ability(name, icon, damage, healing, cooldown, ends_turn)
            
            if name == "Quick Shot":
                ability.description = "Deal 375 damage\nDeals 50% more damage to marked targets\nNo cooldown"
            elif name == "Targeted":
                ability.description = "Mark an enemy to take 50% more damage from Nina for 10 turns\nDoesn't end turn\nCooldown: 10 turns"
            elif name == "Hide":
                ability.description = "Become untargetable by enemies\nHeal 300 HP each turn\nBreaks when using Quick Shot\nCooldown: 14 turns"
            elif name == "Rain of Arrows":
                ability.description = "Deal 800 damage to all enemies\nDeals triple damage to enemies below 50% HP\nBreaks stealth\nScales with Mark\nCooldown: 20 turns"
            
            self.add_ability(ability)

    def get_passive_description(self):
        return {
            "name": "None",
            "description": "Nina has no passive ability"
        }

    def execute_ability(self, ability_name, target):
        if ability_name == "Quick Shot":
            # Remove hide buff if exists
            hide_buff = next((buff for buff in self.buffs if buff.effect_type == "hide"), None)
            if hide_buff:
                self.buffs.remove(hide_buff)
                return {
                    "type": "system",
                    "message": f"{self.name} breaks stealth to attack!"
                }
            
            damage = self.abilities[0].damage
            # Check if target is marked
            is_marked = any(buff.effect_type == "nina_mark" for buff in target.buffs)
            if is_marked:
                damage *= 1.5
            
            # Apply damage multiplier from buffs
            final_damage = int(damage * self.buff_effects.get("damage_multiplier", 1.0))
            
            return {
                "type": "damage",
                "damage": final_damage,
                "message": f"Quick Shot deals {final_damage} damage!" + (" (Marked +50%)" if is_marked else "")
            }

        elif ability_name == "Targeted":
            mark_buff = Buff(
                "Nina's Mark",
                self.abilities[1].icon_path,
                10,  # 10 turns duration
                "nina_mark",
                0.5  # 50% damage increase
            )
            mark_buff.description = "Takes 50% more damage from Nina\nDuration: 10 turns"
            
            return {
                "type": "mark",
                "buff": mark_buff,
                "message": f"Target marked to take 50% more damage from Nina for 10 turns!",
                "ends_turn": False
            }

        elif ability_name == "Hide":
            hide_buff = Buff(
                "Hide",
                self.abilities[2].icon_path,
                -1,  # -1 for infinite duration until broken
                "hide",
                self.abilities[2].healing  # Healing per turn
            )
            hide_buff.description = "Untargetable by enemies\nHeal 300 HP each turn\nBreaks when using Quick Shot"
            
            return {
                "type": "hide",
                "buff": hide_buff,
                "message": f"Entered stealth! Healing {hide_buff.effect_value} HP each turn until attacking."
            }

        elif ability_name == "Rain of Arrows":
            # Remove hide buff if exists
            hide_buff = next((buff for buff in self.buffs if buff.effect_type == "hide"), None)
            if hide_buff:
                self.buffs.remove(hide_buff)
                return {
                    "type": "system",
                    "message": f"{self.name} breaks stealth to unleash Rain of Arrows!"
                }

            damage = self.abilities[3].damage
            # Triple damage if enemy is below 50% HP
            if target.current_hp < (target.max_hp / 2):
                damage *= 3
            
            # Check for mark
            is_marked = any(buff.effect_type == "nina_mark" for buff in target.buffs)
            if is_marked:
                damage *= 1.5

            # Apply damage multiplier from buffs
            final_damage = int(damage * self.buff_effects.get("damage_multiplier", 1.0))
            
            return {
                "type": "aoe_damage",
                "damage": final_damage,
                "message": f"Rain of Arrows deals {final_damage} damage!" + 
                          (" (Triple damage - Low HP)" if target.current_hp < (target.max_hp / 2) else "") +
                          (" (Marked +50%)" if is_marked else "")
            }

    def update_buffs(self):
        """Update Nina's buffs and effects"""
        buffs_to_remove = []
        for buff in self.buffs:
            if buff.duration != -1:  # Skip infinite duration buffs (like Hide)
                buff.duration -= 1
                if buff.duration <= 0:
                    buffs_to_remove.append(buff)
                    # Reset buff effects when expired
                    if buff.effect_type == "teamwork":
                        self.buff_effects["damage_multiplier"] = 1.0
                        self.buff_effects["dodge_chance"] = 0.0
                    elif buff.effect_type == "damage_multiplier":
                        self.buff_effects["damage_multiplier"] = 1.0
                    elif buff.effect_type == "dodge_chance":
                        self.buff_effects["dodge_chance"] = 0.0

        # Remove expired buffs
        for buff in buffs_to_remove:
            self.buffs.remove(buff)

    def process_turn_start(self):
        """Process effects at the start of Nina's turn"""
        # Handle Hide healing
        hide_buff = next((buff for buff in self.buffs if buff.effect_type == "hide"), None)
        if hide_buff and self.current_hp > 0:
            healing = hide_buff.effect_value
            actual_healing = self.heal(healing)
            if actual_healing > 0:
                return {
                    "type": "heal",
                    "healing": actual_healing,
                    "message": f"{self.name} heals for {actual_healing} HP while hidden!"
                }
        return None