import pygame
from engine.character import Character
from engine.ability import Ability
from engine.buff import Buff

class ChamCham(Character):
    def __init__(self, position):
        super().__init__("Farmer Cham Cham", 8725, "Loading Screen/Farmer Cham Cham.png", position)
        self.passive_bonus_damage = 0  # Tracks passive damage increase
        self.setup_abilities()

    def setup_abilities(self):
        abilities = [
            ("Scratch", "Raids/Farm Raid/res/Cham_A1.jpeg", 340, 0, 0, True),
            ("Fertilizer Heal", "Raids/Farm Raid/res/Cham_A2.jpeg", 0, 0, 14, False),
            ("Seed Boomerang", "Raids/Farm Raid/res/Cham_A3.jpeg", 100, 0, 8, True),
            ("Rapid Claws", "Raids/Farm Raid/res/Cham_A4.jpeg", 340, 0, 26, True)
        ]

        for name, icon, damage, healing, cooldown, ends_turn in abilities:
            ability = Ability(name, icon, damage, healing, cooldown, ends_turn)
            
            # Add descriptions
            if name == "Scratch":
                ability.description = f"Deal {damage} damage\nPermanently increase damage by 10\nNo cooldown"
            elif name == "Fertilizer Heal":
                ability.description = "Gain 35% lifesteal for 4 turns\nCooldown: 14 turns"
            elif name == "Seed Boomerang":
                ability.description = f"Deal {damage} damage twice\nEach hit reduces Fertilizer Heal cooldown by 2\nCooldown: 8 turns"
            elif name == "Rapid Claws":
                ability.description = f"Strike 6 times for {damage} damage\nEach hit increases passive damage by 10\nCooldown: 26 turns"
            
            self.add_ability(ability)

    def get_passive_description(self):
        return {
            "name": "Growing Strength",
            "description": f"Scratch damage permanently increases by 10\nCurrent bonus damage: +{self.passive_bonus_damage}"
        }

    def execute_ability(self, ability_name, target):
        if ability_name == "Scratch":
            self.passive_bonus_damage += 10
            total_damage = self.abilities[0].damage + self.passive_bonus_damage
            return {
                "type": "damage",
                "damage": total_damage,
                "message": f"Scratch deals {total_damage} damage! (Passive increased by 10)"
            }

        elif ability_name == "Fertilizer Heal":
            buff = Buff("Fertilizer", self.abilities[1].icon_path, 4, "lifesteal", 0.35)
            return {
                "buff": buff,
                "type": "buff",
                "message": "Gained 35% lifesteal for 4 turns!"
            }

        elif ability_name == "Seed Boomerang":
            total_damage = self.abilities[2].damage + self.passive_bonus_damage
            return {
                "damage": total_damage,
                "type": "boomerang",
                "message": f"Seed Boomerang hits for {total_damage} damage and will return next turn!"
            }

        elif ability_name == "Rapid Claws":
            hits = []
            for i in range(6):
                self.passive_bonus_damage += 10
                total_damage = self.abilities[3].damage + self.passive_bonus_damage
                hits.append(total_damage)
            return {
                "damage": hits,
                "type": "multi_hit",
                "message": f"Rapid Claws hits 6 times! Passive increased by 60!"
            } 