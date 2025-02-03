import pygame
from ..stage_base import Stage
from engine.character import Character
from engine.ability import Ability
from engine.inventory import Inventory
from engine.battle_log import BattleLog
from engine.buff import Buff
from engine.target import Target
from engine.loot_notification import LootNotification
from engine.tooltip import TooltipManager
import random
import math
import json
import os

# Get project root directory
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ITEMS_PATH = os.path.join(PROJECT_ROOT, 'data', 'items.json')

class FarmStage3(Stage):
    def __init__(self, screen, firebase_manager):
        super().__init__(screen)
        self.firebase = firebase_manager
        self.ai_thinking = False
        self.ai_think_start = 0
        self.ai_think_duration = 2000
        self.damage_flash = {"player": 0, "enemies": 0}
        self.damage_flash_duration = 500
        self.attacking = False
        self.attack_start = 0
        self.attack_duration = 500
        self.attacker = None
        self.original_pos = None
        self.targeting_mode = False
        self.current_ability = None
        self.targets = []
        self.healing_particles = []
        self.loot_notification = LootNotification(screen)
        
        # Add end turn button
        self.end_turn_button = {
            'rect': pygame.Rect(self.screen.get_width() - 200, self.screen.get_height() - 100, 180, 50),
            'color': (46, 204, 113),  # Green
            'hover_color': (39, 174, 96),  # Darker green
            'is_visible': False
        }
        
        # Add dragging state attributes
        self.dragging_inventory = False
        self.dragging_battle_log = False
        self.inventory_drag_offset = (0, 0)
        self.battle_log_drag_offset = (0, 0)
        
        # Available apple types with spawn weights
        self.apple_types = {
            "Healthy Apple": 10,   # 10%
            "Angry Apple": 25,     # 25%
            "Rotten Apple": 30,    # 30%
            "Leafy Apple": 15,     # 15%
            "Monster Apple": 20    # 20%
        }
        
        # Load items data
        try:
            with open(ITEMS_PATH, 'r') as f:
                self.items_data = json.load(f)
        except FileNotFoundError:
            print(f"Could not find items.json at {ITEMS_PATH}")
            self.items_data = {"items": []}
            
        # Initialize turn counter
        self.turn_counter = 1

    def load_resources(self):
        # Load and scale background
        self.background = pygame.image.load("Raidpy/res/img/Stage_3_BG.webp")
        self.scaled_bg = pygame.transform.scale(self.background, (1920, 1080))
        self.background = None  # Free up original memory

        # Pre-render static text
        font = pygame.font.Font(None, 36)
        self.stage_text_surface = font.render("Farm Raid - Stage 3", True, (255, 255, 255))

        screen_width = self.screen.get_width()
        screen_height = self.screen.get_height()

        # Create inventory first
        self.inventory = Inventory((20, screen_height // 2 - 150))
        self.inventory.load_items(self.firebase)

        # Add battle log before spawning enemies
        self.battle_log = BattleLog(self.screen)

        # Create Nina (player character)
        nina_x = (screen_width // 2) - 125
        nina_y = screen_height - 450
        nina_image_path = "Loading Screen/Farmer Nina.png"
        self.player = Character("Farmer Nina", 6800, nina_image_path, (nina_x, nina_y))
        # Store image path for reloading
        self.player.image_path = nina_image_path

        # Initialize enemies list
        self.enemies = []
        
        # Create HP bar surface
        self.hp_bar_surface = pygame.Surface((self.screen.get_width(), self.screen.get_height()), pygame.SRCALPHA)
        
        # Now spawn the apples after battle_log is created
        self.spawn_random_apples()

        # Set up abilities
        self.setup_abilities()

        # Randomly decide who goes first
        self.current_turn = random.choice(["player", "enemy"])
        self.battle_log.add_message(f"⚔️ Battle Start! {self.current_turn.capitalize()} goes first!", "system")

        if self.current_turn == "enemy":
            self.waiting_for_turn = True

    def spawn_random_apples(self):
        screen_width = self.screen.get_width()
        # Select 4 random apple types with weights, excluding Rotten Apple for initial spawn
        initial_weights = self.apple_types.copy()
        initial_weights.pop("Rotten Apple", None)
        # Redistribute Rotten Apple's weight among other types proportionally
        total_remaining = sum(initial_weights.values())
        rotten_weight = self.apple_types["Rotten Apple"]
        for apple_type in initial_weights:
            initial_weights[apple_type] += (initial_weights[apple_type] / total_remaining) * rotten_weight
        
        apple_types_list = list(initial_weights.keys())
        weights = list(initial_weights.values())
        selected_apples = random.choices(apple_types_list, weights=weights, k=4)
        
        # Map apple types to their image paths
        apple_images = {
            "Rotten Apple": "Raidpy/res/img/Rotten_Apple.webp",
            "Angry Apple": "Raidpy/res/img/Angry_Apple.webp",
            "Healthy Apple": "Raidpy/res/img/Healthy_Apple.webp",
            "Monster Apple": "Raidpy/res/img/Monster_Apple.webp",
            "Leafy Apple": "Raidpy/res/img/Leafy_Apple.webp"
        }
        
        for i, apple_type in enumerate(selected_apples):
            x_pos = (screen_width // 5) * (i + 1) - 125  # Distribute across screen
            image_path = apple_images[apple_type]
            apple = Character(
                apple_type,
                1100,  # Base HP reduced to 1100
                image_path,  # Use corresponding .webp image
                (x_pos, 50)
            )
            # Store image path for reloading
            apple.image_path = image_path
            
            # Add unique ability based on apple type
            if apple_type == "Angry Apple":
                ability = Ability(
                    "Rage",
                    image_path,
                    225,  # Base damage reduced to 225 (hits twice)
                    0,
                    0,
                    True
                )
                ability.description = "Deal 225 damage twice"
            elif apple_type == "Healthy Apple":
                ability = Ability(
                    "Self-Heal",
                    image_path,
                    0,
                    240,  # 20% of 1100 max HP
                    3,  # Add 3 turn cooldown
                    True
                )
                ability.description = "Heals 20% MAXHP back to itself"
            elif apple_type == "Leafy Apple":
                ability = Ability(
                    "Razor Leaf",
                    image_path,
                    350,
                    0,
                    0,
                    True
                )
                ability.description = "Deal 350 damage"
            elif apple_type == "Monster Apple":
                ability = Ability(
                    "Life Drain",
                    image_path,
                    285,
                    0,
                    0,
                    True
                )
                ability.description = "Deal 285 damage to all enemies and heal for 50% of damage dealt"
            else:  # Rotten Apple
                ability = Ability(
                    "Self Explosion",
                    image_path,
                    1000,
                    0,
                    0,
                    True
                )
                ability.description = "Deal 1000 damage and die"
            
            apple.add_ability(ability)
            self.enemies.append(apple)
            self.battle_log.add_message(f"{apple_type} appears!", "system")

    def setup_abilities(self):
        # Nina's abilities (same as Stage 2)
        nina_abilities = [
            ("Quick Shot", "Raids/Farm Raid/res/Nina_A1.jpeg", 375, 0, 0, True),
            ("Targeted", "Raids/Farm Raid/res/Nina_A2.jpeg", 0, 0, 10, False),
            ("Hide", "Raids/Farm Raid/res/Nina_A3.jpeg", 0, 300, 14, True),
            ("Rain of Arrows", "Raids/Farm Raid/res/Nina_A4.jpeg", 800, 0, 20, True),
        ]

        # Add abilities to Nina with descriptions
        for name, icon, damage, healing, cooldown, ends_turn in nina_abilities:
            ability = Ability(name, icon, damage, healing, cooldown, ends_turn)
            if name == "Quick Shot":
                ability.description = "Deal 375 damage\nDeals 50% more damage to marked targets\nNo cooldown"
            elif name == "Targeted":
                ability.description = "Mark an enemy to take 50% more damage from Nina for 10 turns\nDoesn't end turn\nCooldown: 10 turns"
            elif name == "Hide":
                ability.description = "Become untargetable by enemies\nHeal 300 HP each turn\nBreaks when using Quick Shot\nCooldown: 14 turns"
            elif name == "Rain of Arrows":
                ability.description = "Deal 800 damage to all enemies\nDeals triple damage to enemies below 50% HP\nBreaks stealth\nScales with Mark\nCooldown: 20 turns"
            self.player.add_ability(ability)


    def rearrange_apples(self):
        """Rearrange living apples to be centered on the screen"""
        screen_width = self.screen.get_width()
        living_apples = [enemy for enemy in self.enemies if enemy.current_hp > 0]
        
        if not living_apples:
            return
            
        # Calculate positions to center the apples
        total_apples = len(living_apples)
        if total_apples == 1:
            # Single apple goes in the middle
            living_apples[0].position = ((screen_width // 2) - 125, 50)
        else:
            # Multiple apples are distributed evenly
            spacing = screen_width // (total_apples + 1)
            for i, apple in enumerate(living_apples):
                apple.position = (spacing * (i + 1) - 125, 50)

    def spawn_random_apple(self):
        """Spawn a single random apple"""
        screen_width = self.screen.get_width()
        
        # Count active apples
        active_apples = len([enemy for enemy in self.enemies if enemy.current_hp > 0])
        
        # Force Rotten Apple spawn if 2 or more apples are alive
        if active_apples >= 2:
            apple_type = "Rotten Apple"
        else:
            # Adjust weights based on active apples
            current_weights = self.apple_types.copy()
            
            # Remove Rotten Apple from possible spawns if less than 2 active apples
            if "Rotten Apple" in current_weights:
                rotten_weight = current_weights.pop("Rotten Apple")
                # Redistribute Rotten Apple's weight proportionally among other types
                total_remaining = sum(current_weights.values())
                for apple_type in current_weights:
                    current_weights[apple_type] += (current_weights[apple_type] / total_remaining) * rotten_weight
            
            # Select a random apple type based on adjusted weights
            total_weight = sum(current_weights.values())
            r = random.uniform(0, total_weight)
            cumulative_weight = 0
            
            for apple_type, weight in current_weights.items():
                cumulative_weight += weight
                if r <= cumulative_weight:
                    break
        
        # Map apple type to image path
        apple_images = {
            "Rotten Apple": "Raidpy/res/img/Rotten_Apple.webp",
            "Angry Apple": "Raidpy/res/img/Angry_Apple.webp",
            "Healthy Apple": "Raidpy/res/img/Healthy_Apple.webp",
            "Monster Apple": "Raidpy/res/img/Monster_Apple.webp",
            "Leafy Apple": "Raidpy/res/img/Leafy_Apple.webp"
        }
        
        image_path = apple_images[apple_type]
        # Create new apple at a temporary position
        apple = Character(
            apple_type,
            1100,  # Base HP reduced to 1100
            image_path,
            (0, 50)  # Temporary position, will be adjusted by rearrange_apples
        )
        # Store image path for reloading
        apple.image_path = image_path
        
        # Add unique ability based on apple type
        if apple_type == "Angry Apple":
            ability = Ability(
                "Rage",
                image_path,
                225,  # Base damage reduced to 225 (hits twice)
                0,
                0,
                True
            )
            ability.description = "Deal 225 damage twice"
        elif apple_type == "Healthy Apple":
            ability = Ability(
                "Self-Heal",
                image_path,
                0,
                240,  # 20% of 1100 max HP
                3,  # Add 3 turn cooldown
                True
            )
            ability.description = "Heals 20% MAXHP back to itself"
        elif apple_type == "Leafy Apple":
            ability = Ability(
                "Razor Leaf",
                image_path,
                350,
                0,
                0,
                True
            )
            ability.description = "Deal 350 damage"
        elif apple_type == "Monster Apple":
            ability = Ability(
                "Life Drain",
                image_path,
                285,
                0,
                0,
                True
            )
            ability.description = "Deal 285 damage to all enemies and heal for 50% of damage dealt"
        else:  # Rotten Apple
            ability = Ability(
                "Self Explosion",
                image_path,
                1000,
                0,
                0,
                True
            )
            ability.description = "Deal 1000 damage and die"
        
        apple.add_ability(ability)
        self.enemies.append(apple)
        self.battle_log.add_message(f"A new {apple_type} appears!", "system")
        
        # Rearrange all apples after adding new one
        self.rearrange_apples()
        return True

    def enemy_turn(self):
        """Handle enemy turn logic"""
        # Update buffs at the start of enemy turn
        self.update_buffs()
        
        # Check if we should spawn a new apple (every 3rd turn until turn 60)
        if self.turn_counter <= 60 and self.turn_counter % 3 == 0:
            self.spawn_random_apple()
        
        # Check for turn 60 victory
        if self.turn_counter >= 60:
            # Kill all remaining apples
            for enemy in self.enemies:
                if enemy.current_hp > 0:
                    enemy.current_hp = 0
                    self.handle_enemy_death(enemy)
            # Show victory screen
            if not hasattr(self, 'victory_screen_shown'):
                self.victory_screen_shown = True
                self.show_victory_screen = True
                self.completed = True
                self.battle_log.add_message("Congratulations! You've survived 60 turns!")
            return

        # Get all active enemies
        active_enemies = [enemy for enemy in self.enemies 
                         if enemy.current_hp > 0 and not any(buff.effect_type == "dormant" 
                         for buff in enemy.buffs)]

        if active_enemies:
            # Select only one random enemy to attack
            enemy = random.choice(active_enemies)
            
            # Allow Rotten Apple to target Nina even when hidden
            is_hidden = any(buff.effect_type == "hide" for buff in self.player.buffs)
            if is_hidden and enemy.name != "Rotten Apple":
                self.battle_log.add_message(
                    f"{enemy.name} can't find Nina while she's hidden!",
                    "system"
                )
            else:
                # Get available abilities
                available_abilities = [a for a in enemy.abilities if a.current_cooldown == 0]
                
                if available_abilities:
                    ability = random.choice(available_abilities)
                    if ability.use():
                        if ability.name == "Self Explosion":
                            # Handle explosion targeting hidden Nina
                            self.start_attack_animation(enemy, self.player)
                            damage_dealt = self.take_damage(self.player, ability.damage)
                            if damage_dealt:
                                # Remove hide buff
                                hide_buff = next((buff for buff in self.player.buffs if buff.effect_type == "hide"), None)
                                if hide_buff:
                                    self.player.buffs.remove(hide_buff)
                                    self.battle_log.add_message(
                                        f"Self Explosion breaks {self.player.name}'s stealth!",
                                        "system"
                                    )
                                
                                self.battle_log.add_message(
                                    f"{enemy.name} uses Self Explosion! Deals {damage_dealt} damage!",
                                    "damage"
                                )
                            
                            # Kill the Rotten Apple
                            enemy.current_hp = 0
                            self.battle_log.add_message(
                                f"{enemy.name} dies from Self Explosion!",
                                "system"
                            )
                            # Handle death effects and rearrange apples
                            self.handle_enemy_death(enemy)
                            self.rearrange_apples()
                        else:
                            # Handle other abilities
                            if ability.name == "Rage":
                                # Handle double attack for Angry Apple
                                for _ in range(2):
                                    self.start_attack_animation(enemy, self.player)
                                    damage_dealt = self.take_damage(self.player, ability.damage)
                                    if damage_dealt:
                                        self.battle_log.add_message(
                                            f"{enemy.name} uses Rage! Deals {damage_dealt} damage!",
                                            "damage"
                                        )
                            
                            elif ability.name == "Self-Heal":
                                healing = ability.healing
                                actual_healing = enemy.heal(healing)
                                if actual_healing > 0:
                                    self.battle_log.add_message(
                                        f"{enemy.name} uses Self-Heal! Restores {actual_healing} HP!",
                                        "heal"
                                    )
                                    self.create_healing_effect(enemy.position)
                            
                            elif ability.name == "Razor Leaf":
                                self.start_attack_animation(enemy, self.player)
                                damage_dealt = self.take_damage(self.player, ability.damage)
                                if damage_dealt:
                                    self.battle_log.add_message(
                                        f"{enemy.name} uses Razor Leaf! Deals {damage_dealt} damage!",
                                        "damage"
                                    )
                            
                            elif ability.name == "Life Drain":
                                self.start_attack_animation(enemy, self.player)
                                damage_dealt = self.take_damage(self.player, ability.damage)
                                if damage_dealt:
                                    actual_healing = enemy.heal(damage_dealt // 2)
                                    self.battle_log.add_message(
                                        f"{enemy.name} uses Life Drain! Deals {damage_dealt} damage and heals for {actual_healing} HP!",
                                        "damage"
                                    )
                                    self.create_healing_effect(enemy.position)

        # Increment turn counter and start player turn
        self.turn_counter += 1
        self.start_player_turn()

    def update(self):
        if not self.paused:
            current_time = pygame.time.get_ticks()
            
            # Update attack animation
            self.update_attack_animation()
            
            # Handle enemy turn with thinking delay
            if self.current_turn == "enemy" and self.waiting_for_turn:
                if not self.ai_thinking:
                    self.ai_thinking = True
                    self.ai_think_start = current_time
                elif current_time - self.ai_think_start >= self.ai_think_duration:
                    self.enemy_turn()
                    self.ai_thinking = False

            # Check if all apples are dead
            if all(enemy.current_hp <= 0 for enemy in self.enemies):
                # Handle drops for any remaining enemies
                for enemy in self.enemies:
                    if enemy.current_hp <= 0 and not getattr(enemy, 'drops_handled', False):
                        self.handle_enemy_death(enemy)

                # Spawn a 1 HP Healthy Apple instead of showing victory screen
                image_path = "Raidpy/res/img/Healthy_Apple.webp"
                apple = Character(
                    "Healthy Apple",
                    1,  # 1 HP
                    image_path,
                    (0, 50)  # Position will be adjusted by rearrange_apples
                )
                apple.image_path = image_path
                
                # Add Healthy Apple ability
                ability = Ability(
                    "Self-Heal",
                    image_path,
                    0,
                    240,  # Normal healing amount (won't matter much with 1 HP)
                    3,  # 3 turn cooldown
                    True
                )
                ability.description = "Heals 20% MAXHP back to itself"
                apple.add_ability(ability)
                
                self.enemies.append(apple)
                self.battle_log.add_message("A desperate Healthy Apple appears!", "system")
                self.rearrange_apples()
                
            elif self.player.current_hp <= 0:
                self.completed = False
                self.running = False
                self.battle_log.add_message(f"Oh no! {self.player.name} was defeated. Try again!")

            # Update healing particles
            for particle in self.healing_particles[:]:
                particle['x'] += particle['dx']
                particle['y'] += particle['dy']
                particle['dy'] *= 0.95
                particle['lifetime'] -= 1
                
                if particle['lifetime'] <= 0:
                    self.healing_particles.remove(particle)
                else:
                    particle['alpha'] = int((particle['lifetime'] / 75) * 255)

    def handle_enemy_death(self, enemy):
        """Handle drops and death effects when an enemy dies"""
        if not hasattr(enemy, 'drops_handled'):
            # Reset enemy image and HP bar
            enemy.current_hp = 0
            enemy.image = pygame.image.load(enemy.image_path)  # Reload the image
            
            # Handle death effects first
            if enemy.name == "Rotten Apple":
                # Create debuff that deals damage over time
                dot_buff = Buff(
                    "Rotten",
                    "Raidpy/res/img/Rotten_Apple.webp",
                    3,  # 3 turns duration
                    "dot",  # damage over time
                    50  # 50 damage per turn
                )
                dot_buff.description = "Taking 50 damage each turn\nDuration: 3 turns"
                self.player.add_buff(dot_buff)
                self.battle_log.add_message(
                    f"{enemy.name}'s death inflicts Rot on {self.player.name}!",
                    "system"
                )

            elif enemy.name == "Healthy Apple":
                # Heal the killer (player)
                healing = 1800  # Increased healing on death
                actual_healing = self.player.heal(healing)
                if actual_healing > 0:
                    self.battle_log.add_message(
                        f"{enemy.name}'s death heals {self.player.name} for {actual_healing} HP!",
                        "heal"
                    )
                    self.create_healing_effect(self.player.position)

            elif enemy.name == "Monster Apple":
                # Create damage taken amplification debuff
                monster_buff = Buff(
                    "Monster's Curse",
                    "Raidpy/res/img/Monster_Apple.webp",
                    2,  # 2 turns duration
                    "damage_taken_multiplier",
                    2.0  # Double damage taken
                )
                monster_buff.description = "Taking double damage from all sources\nDuration: 2 turns"
                self.player.add_buff(monster_buff)
                self.battle_log.add_message(
                    f"{enemy.name}'s death curses {self.player.name} to take double damage!",
                    "system"
                )

            elif enemy.name == "Leafy Apple":
                # Create dodge chance buff
                dodge_buff = Buff(
                    "Leafy Protection",
                    "Raidpy/res/img/Leafy_Apple.webp",
                    2,  # 2 turns duration
                    "dodge_chance",
                    0.4  # 40% dodge chance
                )
                dodge_buff.description = "40% chance to dodge attacks\nDuration: 2 turns"
                self.player.add_buff(dodge_buff)
                self.battle_log.add_message(
                    f"{enemy.name}'s death grants {self.player.name} increased dodge chance!",
                    "system"
                )

            # Mark enemy as handled (no loot drops for apples)
            enemy.drops_handled = True
            
            # Rearrange remaining apples after one dies
            self.rearrange_apples()

    def generate_enemy_drops(self, enemy):
        """Generate drops for a specific enemy"""
        drops = []
        
        # Each apple has a chance to drop health potions
        if random.random() < 0.45:  # 45% chance
            drops.append({
                "id": "health_potion",
                "quantity": random.randint(1, 2)
            })
        
        # Special drops based on apple type
        if enemy.name == "Healthy Apple":
            # Higher chance for health potions
            if random.random() < 0.75:
                drops.append({
                    "id": "health_potion",
                    "quantity": random.randint(2, 3)
                })
        
        elif enemy.name == "Monster Apple":
            # Chance for CM currency
            if random.random() < 0.35:
                drops.append({
                    "id": "cm",
                    "quantity": random.randint(2000, 4000)
                })
        
        # Debug print to verify drops
        print(f"{enemy.name} Drops:", drops)
        
        return drops

    def update_attack_animation(self):
        """Update the attack animation with a simple forward and back motion"""
        if not self.attacking or not self.attacker or not self.target or not self.original_pos:
            return

        current_time = pygame.time.get_ticks()
        elapsed = current_time - self.attack_start
        
        if elapsed >= self.attack_duration:
            # Animation complete
            self.attacking = False
            self.attacker.position = self.original_pos
            self.attacker = None
            self.target = None
            self.original_pos = None
            return

        # Calculate progress (0 to 1)
        t = elapsed / self.attack_duration

        # Calculate movement
        if t < 0.5:  # Moving towards target
            progress = t * 2  # Scale to 0-1 for first half
            self.attacker.position = (
                self.original_pos[0] + (self.target.position[0] - self.original_pos[0]) * progress * 0.3,
                self.original_pos[1] + (self.target.position[1] - self.original_pos[1]) * progress * 0.3
            )
        else:  # Moving back
            progress = (t - 0.5) * 2  # Scale to 0-1 for second half
            target_pos = (
                self.original_pos[0] + (self.target.position[0] - self.original_pos[0]) * 0.3,
                self.original_pos[1] + (self.target.position[1] - self.original_pos[1]) * 0.3
            )
            self.attacker.position = (
                target_pos[0] + (self.original_pos[0] - target_pos[0]) * progress,
                target_pos[1] + (self.original_pos[1] - target_pos[1]) * progress
            )

    def start_attack_animation(self, attacker, target):
        """Start the attack animation"""
        if attacker and target:
            self.attacking = True
            self.attack_start = pygame.time.get_ticks()
            self.attacker = attacker
            self.target = target
            self.original_pos = list(attacker.position)

    def take_damage(self, target, amount):
        """Handle damage dealing with animation"""
        if target is None or amount <= 0:
            return 0

        # Store initial HP to check for death
        initial_hp = target.current_hp

        # Check for dodge from all sources
        total_dodge_chance = 0
        total_dodge_chance += target.buff_effects.get("dodge_chance", 0)
        
        dodge_buff = next((buff for buff in target.buffs if buff.effect_type == "dodge_chance"), None)
        if dodge_buff:
            total_dodge_chance += dodge_buff.effect_value

        # Check if target is hidden (Nina only)
        hide_buff = next((buff for buff in target.buffs if buff.effect_type == "hide"), None)
        if hide_buff and not any(enemy.name == "Rotten Apple" for enemy in self.enemies if enemy.current_hp > 0):
            # Only allow dodge check if damage is not from Rotten Apple explosion
            if total_dodge_chance > 0 and random.random() < total_dodge_chance:
                self.create_dodge_effect(target)
                self.battle_log.add_message(
                    f"{target.name} dodged the attack! (Dodge chance: {int(total_dodge_chance * 100)}%)",
                    "system"
                )
                return 0
        else:
            # Normal dodge check for non-hidden targets
            if total_dodge_chance > 0 and random.random() < total_dodge_chance:
                self.create_dodge_effect(target)
                self.battle_log.add_message(
                    f"{target.name} dodged the attack! (Dodge chance: {int(total_dodge_chance * 100)}%)",
                    "system"
                )
                return 0

        # Apply damage multiplier from Monster's Curse
        if any(buff.effect_type == "damage_taken_multiplier" for buff in target.buffs):
            amount *= 2
            self.battle_log.add_message(
                f"{target.name} takes double damage from Monster's Curse!",
                "system"
            )

        # Apply damage
        damage_dealt = target.take_damage(amount)
        if damage_dealt > 0:
            # Set damage flash
            if target == self.player:
                self.damage_flash["player"] = pygame.time.get_ticks()
            else:
                self.damage_flash["enemies"] = pygame.time.get_ticks()
        
        # Check if target died from this damage
        if initial_hp > 0 and target.current_hp <= 0:
            # Handle death effects for enemies
            if target in self.enemies:
                self.handle_enemy_death(target)
    
        return damage_dealt

    def create_dodge_effect(self, character):
        """Create dodge animation for character"""
        # Store the exact original position as immutable tuple
        original_x, original_y = character.position[0], character.position[1]
        
        shake_distance = 10
        shake_duration = 200  # milliseconds
        shake_start = pygame.time.get_ticks()
        
        try:
            while pygame.time.get_ticks() - shake_start < shake_duration:
                progress = (pygame.time.get_ticks() - shake_start) / shake_duration
                offset = math.sin(progress * math.pi * 4) * shake_distance * (1 - progress)
                
                # Set temporary position during animation
                character.position = (original_x + offset, original_y)
                
                # Redraw the screen
                self.draw()
                pygame.display.flip()
                self.clock.tick(60)
        except Exception as e:
            print(f"Error during dodge animation: {e}")
        finally:
            # ALWAYS restore the exact original position
            character.position = (original_x, original_y)
            
            # Force one final redraw to ensure correct position
            self.draw()
            pygame.display.flip()

    def create_healing_effect(self, position):
        """Create healing particle effect"""
        for _ in range(20):  # Create 20 particles
            particle = {
                'x': position[0] + random.randint(0, 250),  # Spread across character width
                'y': position[1] + random.randint(0, 350),  # Spread across character height
                'dx': random.uniform(-2, 2),
                'dy': random.uniform(-5, -2),  # Faster upward movement
                'lifetime': random.randint(45, 75),  # Varied lifetime
                'size': random.randint(3, 8),  # Varied sizes
                'color': (
                    random.randint(0, 100),     # R - dark to medium
                    random.randint(200, 255),   # G - bright
                    random.randint(0, 100),     # B - dark to medium
                    255                         # A - fully opaque
                )
            }
            self.healing_particles.append(particle)

    def setup_targeting(self, ability_index):
        """Set up targeting mode for an ability"""
        self.targeting_mode = True
        self.current_ability = self.player.abilities[ability_index]
        self.targets = []
        
        # Add targeting for each living enemy
        for enemy in self.enemies:
            if enemy.current_hp > 0:
                target_x = enemy.position[0] + 100
                target_y = enemy.position[1] + 200
                self.targets.append(Target(
                    enemy,
                    f"Raidpy/res/img/{enemy.name.replace(' ', '_')}.webp",
                    (target_x, target_y)
                ))
        
        if not self.targets:
            self.targeting_mode = False
            self.current_ability = None
            self.battle_log.add_message("No valid targets available!", "warning")

    def handle_targeting_click(self, mouse_pos):
        """Handle clicks while in targeting mode"""
        if not self.targeting_mode or not self.current_ability:
            return False
        
        for target in self.targets:
            if target.rect.collidepoint(mouse_pos):
                ability = self.current_ability
                self.targeting_mode = False
                self.current_ability = None
                
                if ability and ability.use():
                    self.execute_ability(ability, target.character)
                
                self.targets.clear()
                return True
        
        # Click outside targets - cancel targeting
        self.targeting_mode = False
        self.current_ability = None
        self.targets.clear()
        return True

    def update_buffs(self):
        """Update buffs for each character"""
        # Update player buffs
        buffs_to_remove = []
        for buff in self.player.buffs:
            # Skip infinite duration buffs (like Hide)
            if buff.duration != -1:
                # Handle damage over time from Rotten Apple
                if buff.effect_type == "dot":
                    damage = buff.effect_value
                    self.player.take_damage(damage)
                    self.battle_log.add_message(
                        f"{self.player.name} takes {damage} damage from {buff.name}!",
                        "damage"
                    )

                buff.duration -= 1
                if buff.duration <= 0:
                    buffs_to_remove.append(buff)
                    # Reset buff effects when expired
                    if buff.effect_type == "damage_taken_multiplier":
                        self.player.buff_effects["damage_taken_multiplier"] = 1.0
                    elif buff.effect_type == "dodge_chance":
                        self.player.buff_effects["dodge_chance"] = 0.0
                    
                    self.battle_log.add_message(
                        f"{self.player.name}'s {buff.name} expired!",
                        "system"
                    )

        # Remove expired buffs
        for buff in buffs_to_remove:
            self.player.buffs.remove(buff)

        # Update enemy buffs
        for enemy in self.enemies:
            if enemy.current_hp > 0:
                buffs_to_remove = []
                
                # Normal buff processing
                for buff in enemy.buffs:
                    if buff.duration > 0:
                        buff.duration -= 1
                        if buff.duration <= 0:
                            buffs_to_remove.append(buff)
                            # Reset buff effects
                            if buff.effect_type == "damage_multiplier":
                                enemy.buff_effects["damage_multiplier"] = 1.0
                            elif buff.effect_type == "damage_reduction":
                                enemy.buff_effects["damage_multiplier"] = 0.15  # Keep reduced damage

                # Remove expired buffs
                for buff in buffs_to_remove:
                    enemy.buffs.remove(buff)
                    self.battle_log.add_message(
                        f"{enemy.name}'s {buff.effect_type} buff expired!",
                        "system"
                    )

    def draw(self):
        # Use pre-scaled background
        self.screen.blit(self.scaled_bg, (0, 0))
        
        current_time = pygame.time.get_ticks()
        
        # Create HP bar surface once per frame
        self.hp_bar_surface.fill((0, 0, 0, 0))  # Clear previous frame
        
        # Draw Nina with flash effect and hide transparency
        is_hidden = any(buff.effect_type == "hide" for buff in self.player.buffs)
        if current_time - self.damage_flash["player"] < self.damage_flash_duration:
            self.player.draw(self.screen, flash_color=(255, 0, 0, 128))
        else:
            if is_hidden:
                # Create hidden surface with transparency
                hidden_surface = self.player.image.copy()
                hidden_surface.set_alpha(128)
                self.screen.blit(hidden_surface, self.player.position)
            else:
                # Draw character without HP bar
                self.screen.blit(self.player.image, self.player.position)
        
        # Draw Nina's buffs
        if self.player.buffs:
            buff_start_x = self.player.position[0] + 10
            buff_start_y = self.player.position[1] + 10
            for i, buff in enumerate(self.player.buffs):
                buff.draw(self.screen, (buff_start_x, buff_start_y + i * 45))

        # Draw enemies and their abilities (but not HP bars)
        for enemy in self.enemies:
            if enemy.current_hp > 0:
                if current_time - self.damage_flash["enemies"] < self.damage_flash_duration:
                    enemy.draw(self.screen, flash_color=(255, 0, 0, 128))
                else:
                    # Draw character without HP bar
                    self.screen.blit(enemy.image, enemy.position)
                
                # Draw enemy buffs
                if enemy.buffs:
                    buff_start_x = enemy.position[0] + 10
                    buff_start_y = enemy.position[1] + 10
                    for i, buff in enumerate(enemy.buffs):
                        buff.draw(self.screen, (buff_start_x, buff_start_y + i * 45))
                
                # Draw enemy abilities
                ability_y = enemy.position[1] + enemy.image.get_height() + 35
                ability_start_x = enemy.position[0] + (enemy.image.get_width() // 2) - (len(enemy.abilities) * 30)
                for i, ability in enumerate(enemy.abilities):
                    ability_pos = (ability_start_x + i * 60, ability_y)
                    ability.draw_icon(self.screen, ability_pos)
                    ability.draw_tooltip(self.screen, ability_pos)

        # Draw Nina's abilities
        ability_y = self.player.position[1] + self.player.image.get_height() + 35
        ability_start_x = (self.screen.get_width() // 2) - (240 // 2)
        
        # Draw ability icons first
        for i, ability in enumerate(self.player.abilities):
            ability_pos = (ability_start_x + i * 60, ability_y)
            ability.draw_icon(self.screen, ability_pos)
            ability.draw_tooltip(self.screen, ability_pos)

        # Draw inventory
        self.inventory.draw(self.screen)
        
        # Draw turn counter
        self.draw_turn_counter()
        
        # Draw stage name
        self.screen.blit(self.stage_text_surface, (10, 10))
        
        # Draw battle log
        self.battle_log.draw()
        
        # Draw targeting icons if in targeting mode
        if self.targeting_mode:
            for target in self.targets:
                target.draw(self.screen)
        
        # Draw healing particles
        for particle in self.healing_particles:
            particle_surface = pygame.Surface((particle['size'], particle['size']), pygame.SRCALPHA)
            pygame.draw.circle(
                particle_surface,
                particle['color'],
                (particle['size']//2, particle['size']//2),
                particle['size']//2
            )
            self.screen.blit(particle_surface, (int(particle['x']), int(particle['y'])))
            
        # Draw loot notifications
        self.loot_notification.update_and_draw(self.screen)

        # Draw end turn button if Nina is hidden
        if any(buff.effect_type == "hide" for buff in self.player.buffs) and self.current_turn == "player":
            # Get mouse position for hover effect
            mouse_pos = pygame.mouse.get_pos()
            button_color = self.end_turn_button['hover_color'] if self.end_turn_button['rect'].collidepoint(mouse_pos) else self.end_turn_button['color']
            
            # Draw button
            pygame.draw.rect(self.screen, button_color, self.end_turn_button['rect'], border_radius=10)
            
            # Draw button text
            font = pygame.font.Font(None, 36)
            text = font.render("End Turn", True, (255, 255, 255))
            text_rect = text.get_rect(center=self.end_turn_button['rect'].center)
            self.screen.blit(text, text_rect)

        # Draw victory screen if showing
        if hasattr(self, 'show_victory_screen') and self.show_victory_screen:
            # Create semi-transparent overlay
            overlay = pygame.Surface((self.screen.get_width(), self.screen.get_height()))
            overlay.fill((0, 0, 0))
            overlay.set_alpha(128)
            self.screen.blit(overlay, (0, 0))
            
            # Create victory panel
            panel_width = 400
            panel_height = 200
            panel_x = (self.screen.get_width() - panel_width) // 2
            panel_y = (self.screen.get_height() - panel_height) // 2
            
            # Draw panel background
            pygame.draw.rect(self.screen, (30, 30, 30), 
                            (panel_x, panel_y, panel_width, panel_height))
            pygame.draw.rect(self.screen, (100, 100, 100), 
                            (panel_x, panel_y, panel_width, panel_height), 2)
            
            # Draw victory text
            font = pygame.font.Font(None, 48)
            victory_text = font.render("Victory!", True, (255, 255, 255))
            text_rect = victory_text.get_rect(centerx=self.screen.get_width()//2, 
                                            centery=panel_y + 50)
            self.screen.blit(victory_text, text_rect)

        # Draw tooltips last (above everything else)
        TooltipManager().draw_all(self.screen)

        # Draw info window if active (should be above tooltips)
        if hasattr(self, 'info_window'):
            self.screen.blit(self.info_window['surface'], self.info_window['position'])

        # Draw all HP bars at the end
        # Draw Nina's HP bar on the surface
        self.draw_hp_bar(self.player, self.hp_bar_surface)
        
        # Draw enemy HP bars on the surface
        for enemy in self.enemies:
            if enemy.current_hp > 0:
                self.draw_hp_bar(enemy, self.hp_bar_surface)
        
        # Blit the HP bar surface onto the screen
        self.screen.blit(self.hp_bar_surface, (0, 0))

    def draw_hp_bar(self, character, surface):
        """Draw HP bar for a character"""
        # Calculate HP percentage
        hp_percentage = character.current_hp / character.max_hp
        
        # HP bar position (just below character sprite)
        if character == self.player:
            # Player HP bar position remains the same
            bar_x = character.position[0]
            bar_y = character.position[1] + character.image.get_height() + 10
        else:
            # For apples, calculate HP bar position based on character position
            bar_x = character.position[0]
            bar_y = character.position[1] + character.image.get_height() + 10
        
        # Draw background
        pygame.draw.rect(surface, (0, 0, 0, 180), 
                        (bar_x - 2, bar_y - 2, 254, 24), 
                        border_radius=10)
        
        # Calculate HP bar color based on percentage
        if hp_percentage > 0.6:
            main_color = (46, 204, 113)  # Green
        elif hp_percentage > 0.3:
            main_color = (241, 196, 15)  # Yellow
        else:
            main_color = (231, 76, 60)  # Red
        
        # Draw main HP bar
        current_hp_width = max(250 * hp_percentage, 0)
        if current_hp_width > 0:
            pygame.draw.rect(surface, main_color,
                            (bar_x, bar_y, current_hp_width, 20),
                            border_radius=8)
        
        # Draw HP text with shadow
        font = pygame.font.Font(None, 24)
        hp_text = f"{character.current_hp}/{character.max_hp}"
        text_surface = font.render(hp_text, True, (255, 255, 255))
        text_pos = (bar_x + 125 - text_surface.get_width()//2,
                    bar_y + 10 - text_surface.get_height()//2)
        
        # Draw text shadow
        shadow_surface = font.render(hp_text, True, (0, 0, 0))
        surface.blit(shadow_surface, (text_pos[0] + 1, text_pos[1] + 1))
        surface.blit(text_surface, text_pos)

    def start_player_turn(self):
        """Start the player's turn"""
        self.current_turn = "player"
        self.waiting_for_turn = False
        
        # Handle Nina's hide healing at the start of turn
        hide_buff = next((buff for buff in self.player.buffs if buff.effect_type == "hide"), None)
        if hide_buff and self.player.current_hp > 0:
            healing = hide_buff.effect_value  # This is the 300 HP we set in the buff
            actual_healing = self.player.heal(healing)
            if actual_healing > 0:
                self.battle_log.add_message(
                    f"{self.player.name} heals for {actual_healing} HP while hidden!",
                    "heal"
                )
                self.create_healing_effect(self.player.position)
        
        # Update cooldowns
        self.update_cooldowns()
        
        # Enable abilities
        self.enable_abilities()
        
        self.battle_log.add_message(
            f"Turn {self.turn_counter} - Player's turn!",
            "turn"
        )

    def update_cooldowns(self):
        """Update cooldowns for all abilities"""
        # Update Nina's ability cooldowns
        for ability in self.player.abilities:
            if ability.current_cooldown > 0:
                ability.current_cooldown -= 1
                print(f"Updated {self.player.name}'s {ability.name} cooldown: {ability.current_cooldown}")

        # Update enemy ability cooldowns
        for enemy in self.enemies:
            if enemy.current_hp > 0:
                for ability in enemy.abilities:
                    if ability.current_cooldown > 0:
                        ability.current_cooldown -= 1

        # Update inventory item cooldowns
        for slot in self.inventory.slots:
            if slot.cooldown > 0:
                slot.cooldown -= 1
                print(f"Updated inventory slot cooldown: {slot.cooldown}")

    def enable_abilities(self):
        """Enable abilities that are not on cooldown"""
        # Enable Nina's abilities
        for ability in self.player.abilities:
            if ability.current_cooldown <= 0:
                ability.enabled = True
            else:
                ability.enabled = False

        # Update ability display
        for ability in self.player.abilities:
            if hasattr(ability, 'enabled'):
                if ability.enabled:
                    ability.icon.set_alpha(255)  # Full opacity for enabled abilities
                else:
                    ability.icon.set_alpha(128)  # Semi-transparent for disabled abilities

    def end_player_turn(self):
        """End the player's turn and start enemy turn"""
        self.current_turn = "enemy"
        self.waiting_for_turn = True
        self.ai_thinking = False
        
        # Update turn counter message
        enemies_alive = [e for e in self.enemies if e.current_hp > 0]
        if enemies_alive:
            enemy_names = ", ".join(e.name for e in enemies_alive)
            self.battle_log.add_message(
                f"Turn {self.turn_counter} complete - Starting Enemy Turn!",
                "turn"
            )

    def execute_ability(self, ability, target):
        """Execute Nina's abilities"""
        if target is None:
            if ability.name == "Rain of Arrows":
                # Remove hide buff if exists
                hide_buff = next((buff for buff in self.player.buffs if buff.effect_type == "hide"), None)
                if hide_buff:
                    self.player.buffs.remove(hide_buff)
                    self.battle_log.add_message(
                        f"{self.player.name} breaks stealth to unleash Rain of Arrows!",
                        "system"
                    )

                # Deal damage to all enemies
                total_damage = 0
                for enemy in self.enemies:
                    if enemy.current_hp > 0:
                        base_damage = ability.damage
                        
                        # Triple damage if enemy is below 50% HP
                        if enemy.current_hp < (enemy.max_hp / 2):
                            base_damage *= 3
                            damage_multiplier = "triple damage (below 50% HP)"
                        else:
                            damage_multiplier = "normal damage"

                        # Check for mark
                        if any(buff.effect_type == "nina_mark" for buff in enemy.buffs):
                            base_damage *= 1.5
                            damage_multiplier += " (Marked +50%)"

                        final_damage = int(base_damage * self.player.buff_effects.get("damage_multiplier", 1.0))
                        damage_dealt = self.take_damage(enemy, final_damage)
                        
                        if damage_dealt > 0:
                            total_damage += damage_dealt
                            self.battle_log.add_message(
                                f"Rain of Arrows hits {enemy.name} for {damage_dealt} damage! ({damage_multiplier})",
                                "damage"
                            )

                if total_damage > 0:
                    self.battle_log.add_message(
                        f"{self.player.name}'s Rain of Arrows dealt a total of {total_damage} damage!",
                        "system"
                    )

                if ability.ends_turn:
                    self.end_player_turn()
                return

            return

        # Handle targeted abilities
        if ability.name == "Quick Shot":
            # Remove hide buff if exists
            hide_buff = next((buff for buff in self.player.buffs if buff.effect_type == "hide"), None)
            if hide_buff:
                self.player.buffs.remove(hide_buff)
                self.battle_log.add_message(
                    f"{self.player.name} breaks stealth to attack!",
                    "system"
                )
            
            # Start attack animation
            self.start_attack_animation(self.player, target)
            
            # Calculate damage including mark
            base_damage = ability.damage
            if any(buff.effect_type == "nina_mark" for buff in target.buffs):
                base_damage = int(base_damage * 1.5)
            
            # Apply damage multiplier from buffs
            final_damage = int(base_damage * self.player.buff_effects.get("damage_multiplier", 1.0))
            damage_dealt = self.take_damage(target, final_damage)
            
            if damage_dealt > 0:
                if any(buff.effect_type == "nina_mark" for buff in target.buffs):
                    self.battle_log.add_message(
                        f"{self.player.name} uses Quick Shot on marked target! Deals {damage_dealt} damage!",
                        "damage"
                    )
                else:
                    self.battle_log.add_message(
                        f"{self.player.name} uses Quick Shot! Deals {damage_dealt} damage!",
                        "damage"
                    )

        elif ability.name == "Targeted":
            mark_buff = Buff(
                "Nina's Mark",
                ability.icon_path,
                10,  # 10 turns duration
                "nina_mark",
                0.5  # 50% damage increase
            )
            mark_buff.description = "Takes 50% more damage from Nina\nDuration: 10 turns"
            
            # Remove any existing mark buffs
            target.buffs = [b for b in target.buffs if b.effect_type != "nina_mark"]
            target.add_buff(mark_buff)
            
            self.battle_log.add_message(
                f"{self.player.name} marks {target.name}! Target will take 50% more damage from Nina for 10 turns!",
                "system"
            )

        elif ability.name == "Hide":
            hide_buff = Buff(
                "Hide",
                ability.icon_path,
                -1,  # -1 for infinite duration until broken
                "hide",
                300  # Healing per turn
            )
            hide_buff.description = "Untargetable by enemies\nHeal 300 HP each turn\nBreaks when using Quick Shot"
            
            # Remove any existing hide buffs
            self.player.buffs = [b for b in self.player.buffs if b.effect_type != "hide"]
            self.player.add_buff(hide_buff)
            
            self.battle_log.add_message(
                f"{self.player.name} enters stealth! Will heal {hide_buff.effect_value} HP each turn until attacking.",
                "system"
            )

        if ability.ends_turn:
            self.end_player_turn()

    def handle_ability_clicks(self, pos):
        """Handle clicks on Nina's abilities"""
        if self.current_turn != "player" or self.waiting_for_turn:
            return
        
        # If in targeting mode, handle target selection
        if self.targeting_mode:
            for target in self.targets:
                if target.rect.collidepoint(pos):
                    if self.current_ability.use():  # Only start cooldown when actually used
                        self.execute_ability(self.current_ability, target.character)
                    self.targeting_mode = False
                    self.current_ability = None
                    return
            # Click outside targets cancels targeting
            self.targeting_mode = False
            self.current_ability = None
            return

        # Normal ability selection
        ability_y = self.player.position[1] + self.player.image.get_height() + 35
        ability_start_x = (self.screen.get_width() // 2) - (240 // 2)
        
        for i, ability in enumerate(self.player.abilities):
            ability_rect = pygame.Rect(ability_start_x + i * 60, ability_y, 50, 50)
            
            if ability_rect.collidepoint(pos):
                if ability.name == "Rain of Arrows":  # No targeting needed
                    if ability.use():
                        self.execute_ability(ability, None)
                elif ability.name == "Hide":  # Self-cast ability
                    if ability.use():
                        self.execute_ability(ability, self.player)
                else:  # Abilities that need targeting
                    self.setup_targeting(i)

    def handle_events(self, events):
        for event in events:
            # Handle end turn button click when Nina is hidden
            if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:  # Left click
                if any(buff.effect_type == "hide" for buff in self.player.buffs) and self.current_turn == "player":
                    if self.end_turn_button['rect'].collidepoint(event.pos):
                        self.end_player_turn()
                        return True

            # Add right-click handling for character info
            if event.type == pygame.MOUSEBUTTONDOWN and event.button == 3:  # Right click
                mouse_pos = event.pos
                
                # Check if clicked on any character
                characters = [self.player] + self.enemies
                for character in characters:
                    char_rect = pygame.Rect(character.position[0], character.position[1], 
                                          character.image.get_width(), character.image.get_height())
                    if char_rect.collidepoint(mouse_pos):
                        self.show_character_info(character)
                        return True

            # Handle info window interactions
            if hasattr(self, 'info_window'):
                if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:  # Left click
                    mouse_pos = event.pos
                    window_rect = pygame.Rect(self.info_window['position'], self.info_window['size'])
                    
                    # Check if clicked close button
                    close_rect = pygame.Rect(
                        self.info_window['position'][0] + window_rect.width - 40,
                        self.info_window['position'][1],
                        40, 40
                    )
                    if close_rect.collidepoint(mouse_pos):
                        delattr(self, 'info_window')
                        return True
                    
                    # Check if clicked resize handle
                    resize_rect = pygame.Rect(
                        window_rect.right - 20, window_rect.bottom - 20, 20, 20
                    )
                    if resize_rect.collidepoint(mouse_pos):
                        self.info_window['resizing'] = True
                        self.info_window['resize_offset'] = (
                            window_rect.right - mouse_pos[0],
                            window_rect.bottom - mouse_pos[1]
                        )
                        return True
                    
                    # Check if clicked title bar for dragging
                    title_bar_rect = pygame.Rect(
                        window_rect.x, window_rect.y, window_rect.width, 40
                    )
                    if title_bar_rect.collidepoint(mouse_pos):
                        self.info_window['dragging'] = True
                        self.info_window['drag_offset'] = (
                            window_rect.x - mouse_pos[0],
                            window_rect.y - mouse_pos[1]
                        )
                        return True
                
                elif event.type == pygame.MOUSEBUTTONUP and event.button == 1:
                    if self.info_window.get('dragging') or self.info_window.get('resizing'):
                        self.info_window['dragging'] = False
                        self.info_window['resizing'] = False
                        # Only update the window content when we stop dragging/resizing
                        self.update_info_window()
                
                elif event.type == pygame.MOUSEMOTION:
                    if self.info_window.get('dragging'):
                        mouse_pos = event.pos
                        new_x = mouse_pos[0] + self.info_window['drag_offset'][0]
                        new_y = mouse_pos[1] + self.info_window['drag_offset'][1]
                        
                        # Keep window within screen bounds
                        screen_rect = self.screen.get_rect()
                        new_x = max(0, min(new_x, screen_rect.width - self.info_window['size'][0]))
                        new_y = max(0, min(new_y, screen_rect.height - self.info_window['size'][1]))
                        
                        self.info_window['position'] = (new_x, new_y)
                        return True
                    
                    elif self.info_window.get('resizing'):
                        mouse_pos = event.pos
                        new_width = mouse_pos[0] - self.info_window['position'][0] + self.info_window['resize_offset'][0]
                        new_height = mouse_pos[1] - self.info_window['position'][1] + self.info_window['resize_offset'][1]
                        
                        # Minimum size constraints
                        new_width = max(400, min(new_width, self.screen.get_width() - self.info_window['position'][0]))
                        new_height = max(300, min(new_height, self.screen.get_height() - self.info_window['position'][1]))
                        
                        if new_width != self.info_window['size'][0] or new_height != self.info_window['size'][1]:
                            self.info_window['size'] = (new_width, new_height)
                            # Don't update window content while resizing, just store the new size
                        return True

            # Handle loot notification clicks first
            if event.type == pygame.MOUSEBUTTONDOWN:
                if self.loot_notification.handle_event(event):
                    return True

            # Handle battle log events first
            if not (self.dragging_inventory or self.dragging_battle_log):
                if self.battle_log.handle_event(event):
                    return True

            # Handle inventory item clicks
            if event.type == pygame.MOUSEBUTTONDOWN:
                for slot in self.inventory.slots:
                    slot_rect = pygame.Rect(
                        self.inventory.position[0] + slot.position[0],
                        self.inventory.position[1] + slot.position[1],
                        50, 50
                    )
                    if slot_rect.collidepoint(event.pos) and slot.item:
                        if self.use_item(slot.item):
                            self.inventory.load_items(self.firebase)
                            return True
            
            # Handle ability clicks
            if event.type == pygame.MOUSEBUTTONDOWN:
                if self.targeting_mode:
                    if self.handle_targeting_click(event.pos):
                        return True
                else:
                    self.handle_ability_clicks(event.pos)
            
            # Handle parent class events
            if super().handle_events([event]):
                return True
        
        return False

    def use_item(self, item):
        """Handle item usage"""
        if item['id'] == 'health_potion':
            if self.current_turn == "player" and not self.waiting_for_turn:
                # Find the slot that contains this item
                slot = next((slot for slot in self.inventory.slots 
                           if slot.item and slot.item['id'] == item['id']), None)
                
                if slot and slot.cooldown <= 0:
                    healing = item['effect']['value']
                    actual_healing = self.player.heal(healing)
                    if actual_healing > 0:
                        self.battle_log.add_message(
                            f"Used Health Potion! Restored {actual_healing} HP",
                            "heal"
                        )
                        # Create healing particles
                        self.create_healing_effect(self.player.position)
                        # Start cooldown
                        slot.start_cooldown()
                        # Update Firebase inventory
                        self.firebase.update_inventory(item['id'], -1)
                        # Reload inventory to reflect changes
                        self.inventory.load_items(self.firebase)
                        return True
        return False

    def show_character_info(self, character):
        # Initial window setup with larger dimensions
        window_width = 800
        window_height = 600
        
        # Store character reference and create initial window state
        self.info_window = {
            'character': character,
            'position': ((self.screen.get_width() - window_width) // 2,
                        (self.screen.get_height() - window_height) // 2),
            'size': (window_width, window_height),
            'dragging': False,
            'resizing': False
        }
        
        # Create initial window content
        self.update_info_window()

    def update_info_window(self):
        if not hasattr(self, 'info_window'):
            return
        
        character = self.info_window['character']
        window_width, window_height = self.info_window['size']
        
        # Create info window surface
        info_window = pygame.Surface((window_width, window_height))
        info_window.fill((40, 40, 40))  # Dark gray background
        
        # Add semi-transparent border
        pygame.draw.rect(info_window, (80, 80, 80), info_window.get_rect(), 2)
        
        # Draw title bar
        pygame.draw.rect(info_window, (60, 60, 60), (0, 0, window_width, 40))
        
        # Draw character image on the left (larger)
        char_image = pygame.transform.scale(character.image, (300, 420))
        info_window.blit(char_image, (30, 60))
        
        # Draw character name at the top
        font = pygame.font.Font(None, 48)
        name_text = font.render(character.name, True, (255, 255, 255))
        info_window.blit(name_text, (30, 10))
        
        # Draw close button
        close_text = font.render("×", True, (255, 255, 255))
        close_rect = close_text.get_rect(topright=(window_width - 20, 10))
        info_window.blit(close_text, close_rect)
        
        # Right side content with adjusted positioning
        content_x = 360
        content_y = 60
        content_width = window_width - content_x - 30
        
        # Draw abilities section
        font = pygame.font.Font(None, 36)
        small_font = pygame.font.Font(None, 28)
        
        # Draw "Abilities" header
        abilities_text = font.render("Abilities", True, (255, 200, 100))
        info_window.blit(abilities_text, (content_x, content_y))
        content_y += 40
        
        for ability in character.abilities:
            # Draw ability icon
            icon_size = 50
            try:
                icon_image = pygame.image.load(ability.icon_path)
                icon_image = pygame.transform.scale(icon_image, (icon_size, icon_size))
                info_window.blit(icon_image, (content_x, content_y))
            except (AttributeError, pygame.error):
                # Fallback if icon loading fails
                icon_surface = pygame.Surface((icon_size, icon_size))
                icon_surface.fill((60, 60, 60))
                pygame.draw.rect(icon_surface, (100, 100, 100), icon_surface.get_rect(), 1)
                info_window.blit(icon_surface, (content_x, content_y))
            
            # Draw ability name and description
            ability_name = font.render(ability.name, True, (255, 255, 255))
            info_window.blit(ability_name, (content_x + icon_size + 15, content_y))
            
            # Word wrap description
            desc_words = ability.description.split()
            desc_lines = []
            current_line = []
            
            for word in desc_words:
                current_line.append(word)
                test_line = " ".join(current_line)
                if small_font.size(test_line)[0] > content_width - icon_size - 15:
                    desc_lines.append(" ".join(current_line[:-1]))
                    current_line = [word]
            
            if current_line:
                desc_lines.append(" ".join(current_line))
            
            # Draw description lines
            for i, line in enumerate(desc_lines):
                if content_y + 35 + i * 25 > window_height - 20:
                    break
                desc_text = small_font.render(line, True, (200, 200, 200))
                info_window.blit(desc_text, (content_x + icon_size + 15, content_y + 35 + i * 25))
            
            content_y += max(len(desc_lines) * 25 + 45, icon_size + 20)
            
            # Break if we're running out of space
            if content_y > window_height - 40:
                break
        
        # Add death passive description for mini apples
        if "Mini Carrot" in character.name:
            passives_text = font.render("Death Passive", True, (255, 200, 100))
            info_window.blit(passives_text, (content_x, content_y))
            content_y += 40

            passive_desc = (
                "On death: Drops 1-3 Health Potions (20% chance)\n"
                "Weaker version of the original Angry Carrot\n"
                "Has 1/3 of the original HP and damage"
            )

            # Word wrap passive description
            desc_words = passive_desc.split()
            desc_lines = []
            current_line = []
            for word in desc_words:
                current_line.append(word)
                test_line = " ".join(current_line)
                if small_font.size(test_line)[0] > content_width - 30:
                    desc_lines.append(" ".join(current_line[:-1]))
                    current_line = [word]
            if current_line:
                desc_lines.append(" ".join(current_line))

            # Draw passive description
            for line in desc_lines:
                if content_y > window_height - 30:
                    break
                desc_text = small_font.render(line, True, (200, 200, 200))
                info_window.blit(desc_text, (content_x + 15, content_y))
                content_y += 30

            content_y += 20  # Add spacing after passive description

        # Draw active buffs/debuffs if there's space
        if character.buffs and content_y < window_height - 80:
            buffs_text = font.render("Active Effects", True, (255, 200, 100))
            info_window.blit(buffs_text, (content_x, content_y))
            content_y += 40
            
            for buff in character.buffs:
                if content_y > window_height - 30:
                    break
                buff_text = small_font.render(f"• {buff.name} ({buff.duration} turns)", True, (200, 200, 200))
                info_window.blit(buff_text, (content_x + 15, content_y))
                content_y += 30
        
        # Update window surface
        self.info_window['surface'] = info_window