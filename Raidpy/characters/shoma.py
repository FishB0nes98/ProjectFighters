import pygame
from engine.character import Character
from engine.ability import Ability
from engine.buff import Buff

class Shoma(Character):
    def __init__(self, position):
        super().__init__("Farmer Shoma", 7500, "Loading Screen/Farmer Shoma.png", position)
        self.setup_abilities()

    def setup_abilities(self):
        abilities = [
            ("Boink", "Raids/Farm Raid/res/Shoma_A1.jpeg", 320, 0, 0, True),
            ("Apple Toss", "Raids/Farm Raid/res/Shoma_A2.jpeg", 300, 1000, 8, True),
            ("Catch!", "Raids/Farm Raid/res/Shoma_A3.jpeg", 0, 0, 9, True),
            ("Teamwork", "Raids/Farm Raid/res/Shoma_A4.jpeg", 0, 0, 20, True)
        ]

        for name, icon, damage, healing, cooldown, ends_turn in abilities:
            ability = Ability(name, icon, damage, healing, cooldown, ends_turn)
            
            if name == "Boink":
                ability.description = "Deal 320 damage\n50% chance to deal double damage\nNo cooldown"
            elif name == "Apple Toss":
                ability.description = "If used on ally: Heal for 1000 HP\nIf used on enemy: Deal 300 damage and reduce their damage by 85% for 4 turns\nCooldown: 8 turns"
            elif name == "Catch!":
                ability.description = "Grant target ally 75% dodge chance for 4 turns\nCooldown: 9 turns"
            elif name == "Teamwork":
                ability.description = "Grant all allies 10% increased damage and dodge chance for 10 turns\nCooldown: 20 turns"
            
            self.add_ability(ability)

    def get_passive_description(self):
        return {
            "name": "None",
            "description": "Shoma has no passive ability"
        }

    def execute_ability(self, ability_name, target, is_ally=False):
        if ability_name == "Boink":
            import random
            is_crit = random.random() < 0.5
            damage = self.abilities[0].damage * (2 if is_crit else 1)
            return {
                "type": "damage",
                "damage": damage,
                "message": f"Boink {'CRITS' if is_crit else 'hits'} for {damage} damage!"
            }

        elif ability_name == "Apple Toss":
            if is_ally:
                return {
                    "healing": self.abilities[1].healing,
                    "type": "heal",
                    "message": f"Heals ally for {self.abilities[1].healing} HP!"
                }
            else:
                debuff = Buff("Apple Debuff", self.abilities[1].icon_path, 4, "damage_reduction", 0.85)
                return {
                    "damage": self.abilities[1].damage,
                    "debuff": debuff,
                    "type": "damage_debuff",
                    "message": f"Deals {self.abilities[1].damage} damage and reduces damage by 85% for 4 turns!"
                }

        elif ability_name == "Catch!":
            buff = Buff("Catch", self.abilities[2].icon_path, 4, "dodge_chance", 0.75)
            return {
                "buff": buff,
                "type": "buff",
                "message": "Grants 75% dodge chance for 4 turns!"
            }

        elif ability_name == "Teamwork":
            buff = Buff("Teamwork", self.abilities[3].icon_path, 10, "teamwork", 0.1)
            return {
                "buff": buff,
                "type": "team_buff",
                "message": "All allies gain 10% damage and dodge for 10 turns!"
            } 