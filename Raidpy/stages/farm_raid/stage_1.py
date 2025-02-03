import pygame
from ..stage_base import Stage
from engine.character import Character
from engine.ability import Ability
from engine.inventory import Inventory, Item
from engine.battle_log import BattleLog
from engine.buff import Buff
from engine.target import Target
from engine.modifier_manager import ModifierManager
from engine.modifier_selector import ModifierSelector
import random
import math
from random import random as random_float, randint
from typing import List, Dict, Any
import json
import os
from engine.loot_notification import LootNotification

# Get the project root directory (Raidpy folder)
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ITEMS_PATH = os.path.join(PROJECT_ROOT, 'data', 'items.json')

class FarmStage1(Stage):
    def __init__(self, screen, firebase_manager):
        super().__init__(screen)
        self.firebase = firebase_manager
        self.ai_thinking = False
        self.ai_think_start = 0
        self.ai_think_duration = 2000  # 2 seconds in milliseconds
        self.damage_flash = {"player": 0, "boss": 0}
        self.damage_flash_duration = 500  # 0.5 seconds in milliseconds
        # Add animation states
        self.attacking = False
        self.attack_start = 0
        self.attack_duration = 500  # 0.5 seconds for attack animation
        self.attacker = None
        self.original_pos = None
        self.all_sprites = pygame.sprite.Group()
        self.boomerang_active = False
        self.boomerang_damage = 0
        self.targeting_mode = False
        self.current_ability = None
        self.targets = []
        self.mini_bosses = []  # Add this line to track mini bosses
        # Add dragging state for battle log
        self.dragging_log = False
        self.log_drag_offset = (0, 0)
        self.dragging_inventory = False
        self.inventory_drag_offset = (0, 0)
        self.healing_particles = []  # Add particle system for healing effect
        self.loot_notification = LootNotification(screen)
        
        # Initialize ModifierManager and ModifierSelector
        self.modifier_manager = ModifierManager(firebase_manager)
        self.modifier_selector = ModifierSelector(self.screen, self.modifier_manager)
        self.selected_modifiers = []
        self.stage_started = False
        
        try:
            with open(ITEMS_PATH, 'r') as f:
                self.items_data = json.load(f)
        except FileNotFoundError:
            print(f"Could not find items.json at {ITEMS_PATH}")
            self.items_data = {"items": []}  # Fallback empty items list

    def load_resources(self):
        # Load and pre-scale background
        self.background = pygame.image.load(os.path.join(PROJECT_ROOT, "res", "img", "Stage_1_BG.jpeg"))
        self.scaled_bg = pygame.transform.scale(self.background, (1920, 1080))
        self.background = None  # Free up original memory
        
        # Pre-render static text
        font = pygame.font.Font(None, 36)
        self.stage_text_surface = font.render("Farm Raid - Stage 1", True, (255, 255, 255))
        
        # Calculate positions based on screen size
        screen_width = self.screen.get_width()
        screen_height = self.screen.get_height()
        
        # Player position (bottom middle)
        player_x = (screen_width // 2) - 125  # 125 is half of character width
        player_y = screen_height - 450  # Leave space for abilities
        
        # Boss position (top middle)
        boss_x = (screen_width // 2) - 125
        boss_y = 50
        
        # Create player (Farmer Cham Cham)
        self.player = Character("Farmer Cham Cham", 8725, os.path.join("Loading Screen", "Farmer Cham Cham.png"), (player_x, player_y))
        
        # Create boss (Angry Carrot)
        self.boss = Character("Angry Carrot", 12500, os.path.join(PROJECT_ROOT, "res", "img", "Angry_Carrot.jpeg"), (boss_x, boss_y))
        
        # Create inventory
        self.inventory = Inventory((20, screen_height // 2 - 150))
        # Load items separately
        self.inventory.load_items(self.firebase)
        
        # Add battle log
        self.battle_log = BattleLog(self.screen)
        
        # Set up abilities
        self.setup_abilities()
        
        # Show modifier selection and apply modifiers
        if not self.stage_started:
            selected_modifier = self.modifier_selector.show()
            if selected_modifier:
                self.selected_modifiers = [selected_modifier]
                # Apply selected modifiers after player and abilities are set up
                for modifier in self.selected_modifiers:
                    # Pass both the player and battle_log to apply_modifier_effects
                    self.modifier_manager.apply_modifier_effects(self.player, modifier, self.battle_log)
            else:
                self.selected_modifiers = []
            self.stage_started = True
        
        # Randomly decide who goes first
        self.current_turn = random.choice(["player", "boss"])
        self.battle_log.add_message(f"⚔️ Battle Start! {self.current_turn.capitalize()} goes first!", "system")
        
        # If boss goes first, set waiting_for_turn to True
        if self.current_turn == "boss":
            self.waiting_for_turn = True

    def setup_abilities(self):
        # Farmer Cham Cham's abilities - updated Fertilizer Heal
        cham_cham_abilities = [
            ("Scratch", os.path.join(PROJECT_ROOT, "res", "img", "Cham_A1.jpeg"), 340, 0, 0, True),
            ("Fertilizer Heal", os.path.join(PROJECT_ROOT, "res", "img", "Cham_A2.jpeg"), 0, 0, 14, False),
            ("Seed Boomerang", os.path.join(PROJECT_ROOT, "res", "img", "Cham_A3.jpeg"), 100, 0, 8, True),
            ("Rapid Claws", os.path.join(PROJECT_ROOT, "res", "img", "Cham_A4.jpeg"), 340, 0, 26, True)
        ]
        
        # Angry Carrot's abilities - updated cooldowns
        carrot_abilities = [
            ("Root Strike", os.path.join(PROJECT_ROOT, "res", "img", "Angry_Carrot_Icon.png"), 370, 0, 0, True),
            ("Go Dormant", os.path.join(PROJECT_ROOT, "res", "img", "Angry_Carrot_Dormant_Buff.jpeg"), 0, 3500, 8, False),
            ("Anger", os.path.join(PROJECT_ROOT, "res", "img", "Angry_Carrot_Anger_Buff.jpeg"), 0, 0, 8, False),
            ("Carrot Grenade", os.path.join(PROJECT_ROOT, "res", "img", "Angry_Carrot_Icon.png"), 430, 0, 5, True)
        ]
        
        # Add abilities to characters (unchanged)
        for name, icon, damage, healing, cooldown, ends_turn in cham_cham_abilities:
            ability = Ability(name, icon, damage, healing, cooldown, ends_turn)
            self.player.add_ability(ability)
        
        for name, icon, damage, healing, cooldown, ends_turn in carrot_abilities:
            ability = Ability(name, icon, damage, healing, cooldown, ends_turn)
            self.boss.add_ability(ability)

    def add_items_to_inventory(self):
        health_potion = Item("Health Potion", "Raidpy/res/img/Health_Potion.jpeg")
        self.inventory.add_item(health_potion)
        
    def setup_targeting(self, ability_index):
        """Set up targeting mode for an ability"""
        self.targeting_mode = True
        self.current_ability = self.player.abilities[ability_index]
        self.targets = []
        
        # Clear existing targets
        self.targets.clear()
        
        # Add targets based on what's currently active
        if self.boss:
            if self.boss.current_hp > 0:
                self.targets.append(Target(
                    self.boss,
                    "Raidpy/res/img/Angry_Carrot_Icon.png",
                    (self.boss.position[0] + 100, self.boss.position[1] + 200)  # Moved lower
                ))
        else:
            # Add targeting for each living mini boss with their own position
            for i, mini_boss in enumerate(self.mini_bosses):
                if mini_boss.current_hp > 0:
                    # Calculate position based on mini boss position
                    target_x = mini_boss.position[0] + 100
                    target_y = mini_boss.position[1] + 200  # Moved lower
                    self.targets.append(Target(
                        mini_boss,
                        "Raidpy/res/img/Angry_Carrot_Icon.png",  # You might want to create a mini carrot icon
                        (target_x, target_y)
                    ))
                    
    def spawn_mini_bosses(self):
        screen_width = self.screen.get_width()
        
        # Create 3 mini bosses with reduced stats
        for i in range(3):
            x_pos = (screen_width // 4) * (i + 1) - 125  # Distribute across screen
            mini_boss = Character(
                f"Mini Carrot {i+1}",
                self.boss.max_hp // 3,  # One third of original HP
                "Raidpy/res/img/Angry_Carrot.jpeg",
                (x_pos, 50)
            )

    def take_damage(self, target, amount):
        """Handle damage dealing with animation"""
        if target is None or amount <= 0:
            return 0

        # Apply modifier effects before damage if they exist
        if hasattr(target, 'modifier_effect') and target.modifier_effect:
            amount = target.modifier_effect.modify_damage_taken(amount)
            
            # Check for Divine Shield
            if target.modifier_effect.has_divine_shield:
                target.modifier_effect.has_divine_shield = False
                self.battle_log.add_message(f"{target.name}'s Divine Shield absorbed the damage!", "system")
                return 0

        # Determine the attacker based on whose turn it is
        attacker = None
        if self.current_turn == "player":
            attacker = self.player
        elif self.current_turn == "boss":
            if self.boss:
                attacker = self.boss
            elif self.mini_bosses:
                # For mini bosses, use the one that's currently attacking
                attacker = random.choice(self.mini_bosses)

        if attacker:
            self.start_attack_animation(attacker, target)
        
        # Apply damage and return amount dealt
        damage_dealt = target.take_damage(amount)
        if damage_dealt > 0:
            # Set damage flash
            flash_key = "player" if target == self.player else "boss"
            self.damage_flash[flash_key] = pygame.time.get_ticks()
            
            # Handle Quick Learner modifier if it exists
            if hasattr(target, 'modifier_effect') and target.modifier_effect:
                target.modifier_effect.on_damage_taken(target, damage_dealt, self.battle_log)
        
        return damage_dealt

    def draw(self):
        # Use pre-scaled background
        self.screen.blit(self.scaled_bg, (0, 0))
        
        # Draw characters with damage flash effect
        current_time = pygame.time.get_ticks()
        
        if current_time - self.damage_flash["player"] < self.damage_flash_duration:
            self.player.draw(self.screen, flash_color=(255, 0, 0, 128))
        else:
            self.player.draw(self.screen)
        
        # Calculate positions for player abilities
        player_ability_y = self.player.position[1] + self.player.image.get_height() + 35
        ability_start_x = (self.screen.get_width() // 2) - (240 // 2)
        
        # Draw player abilities icons first
        for i, ability in enumerate(self.player.abilities):
            ability.draw_icon(self.screen, (ability_start_x + i * 60, player_ability_y))
        
        # Draw either main boss or mini bosses and their abilities
        if self.boss:
            if pygame.time.get_ticks() - self.damage_flash["boss"] < self.damage_flash_duration:
                self.boss.draw(self.screen, flash_color=(255, 0, 0, 128))
            else:
                self.boss.draw(self.screen)
                
            # Draw boss abilities
            boss_ability_y = self.boss.position[1] + self.boss.image.get_height() + 35
            boss_ability_start_x = (self.screen.get_width() // 2) - (240 // 2)
            
            for i, ability in enumerate(self.boss.abilities):
                ability.draw_icon(self.screen, (boss_ability_start_x + i * 60, boss_ability_y))
                ability.draw_tooltip(self.screen, (boss_ability_start_x + i * 60, boss_ability_y))
        else:
            # Draw mini bosses
            for mini_boss in self.mini_bosses:
                if mini_boss.current_hp > 0:
                    mini_boss.draw(self.screen)
                    
                    # Draw mini boss abilities
                    mini_boss_ability_y = mini_boss.position[1] + mini_boss.image.get_height() + 35
                    mini_boss_ability_start_x = mini_boss.position[0]
                    
                    for i, ability in enumerate(mini_boss.abilities):
                        ability.draw_icon(self.screen, (mini_boss_ability_start_x + i * 60, mini_boss_ability_y))
                        ability.draw_tooltip(self.screen, (mini_boss_ability_start_x + i * 60, mini_boss_ability_y))
        
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
        
        # Draw tooltips last (on top of everything)
        for i, ability in enumerate(self.player.abilities):
            ability.draw_tooltip(self.screen, (ability_start_x + i * 60, player_ability_y))

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
            
            # Draw "Start Stage 2" button
            button_width = 200
            button_height = 50
            button_x = (self.screen.get_width() - button_width) // 2
            button_y = panel_y + panel_height - 70
            
            self.next_stage_button = pygame.Rect(button_x, button_y, button_width, button_height)
            pygame.draw.rect(self.screen, (0, 100, 200), self.next_stage_button)
            pygame.draw.rect(self.screen, (100, 200, 255), self.next_stage_button, 2)
            
            button_text = font.render("Start Stage 2", True, (255, 255, 255))
            text_rect = button_text.get_rect(center=self.next_stage_button.center)
            self.screen.blit(button_text, text_rect)
            
        # Update display
        pygame.display.flip()

    def handle_events(self, events):
        for event in events:
            if event.type == pygame.MOUSEBUTTONDOWN and self.paused:
                menu_items = self.draw_menu()
                if self.menu_state == "debug":
                    if menu_items["damage_carrots"].collidepoint(event.pos):
                        # Set all mini carrots HP to 1
                        if self.mini_bosses:
                            for mini_boss in self.mini_bosses:
                                if mini_boss.current_hp > 0:
                                    mini_boss.current_hp = 1
                            self.battle_log.add_message("Debug: Set all mini carrots HP to 1!", "system")
                        return True

            # Handle battle log events first
            if self.battle_log.handle_event(event):
                return True

            # Handle inventory dragging only from header
            if event.type == pygame.MOUSEBUTTONDOWN:
                mouse_pos = event.pos
                header_rect = pygame.Rect(
                    self.inventory.position[0],
                    self.inventory.position[1],
                    self.inventory.size[0],
                    40  # Header height
                )
                if header_rect.collidepoint(mouse_pos):
                    self.dragging_inventory = True
                    self.inventory_drag_offset = (
                        self.inventory.position[0] - mouse_pos[0],
                        self.inventory.position[1] - mouse_pos[1]
                    )
                    return True
                
            elif event.type == pygame.MOUSEBUTTONUP:
                if self.dragging_inventory:
                    self.dragging_inventory = False
                    return True
                
            elif event.type == pygame.MOUSEMOTION:
                if self.dragging_inventory:
                    mouse_pos = event.pos
                    new_x = mouse_pos[0] + self.inventory_drag_offset[0]
                    new_y = mouse_pos[1] + self.inventory_drag_offset[1]
                    
                    # Keep inventory within screen bounds
                    new_x = max(0, min(new_x, self.screen.get_width() - self.inventory.rect.width))
                    new_y = max(0, min(new_y, self.screen.get_height() - self.inventory.rect.height))
                    
                    self.inventory.set_position((new_x, new_y))
                    return True

            # Handle inventory item clicks AFTER checking for dragging
            inventory_result = self.inventory.handle_event(event)
            if isinstance(inventory_result, dict):  # Item was clicked
                if self.use_item(inventory_result):
                    self.inventory.load_items(self.firebase)
                    return True
            
            # Handle targeting clicks
            if event.type == pygame.MOUSEBUTTONDOWN:
                if self.targeting_mode:
                    if self.handle_targeting_click(event.pos):
                        return True
                else:
                    # Handle ability clicks
                    self.handle_ability_clicks(event.pos)
            
            # Check for victory screen button click
            if hasattr(self, 'show_victory_screen') and self.show_victory_screen:
                if event.type == pygame.MOUSEBUTTONDOWN:
                    if hasattr(self, 'next_stage_button') and self.next_stage_button.collidepoint(event.pos):
                        self.completed = True
                        self.running = False
                        return True
            
            # Handle parent class events
            if super().handle_events([event]):
                return True
        
        return False

    def update(self):
        if not self.paused:
            current_time = pygame.time.get_ticks()
            
            # Update attack animation
            self.update_attack_animation()
            
            # Boss turn with thinking delay
            if self.current_turn == "boss" and self.waiting_for_turn:
                if not self.ai_thinking:
                    self.ai_thinking = True
                    self.ai_think_start = current_time
                elif current_time - self.ai_think_start >= self.ai_think_duration:
                    if self.mini_bosses:
                        self.mini_boss_attack()
                    else:
                        self.boss_attack()
                    self.ai_thinking = False

            # Check win/lose conditions
            if self.boss and self.boss.current_hp <= 0 and not self.mini_bosses:
                self.handle_boss_death()
                self.spawn_mini_bosses()
            elif not self.boss and all(mb.current_hp <= 0 for mb in self.mini_bosses):
                # Handle drops for any remaining mini bosses that just died
                for mini_boss in self.mini_bosses:
                    if mini_boss.current_hp <= 0 and not getattr(mini_boss, 'drops_handled', False):
                        drops = self.generate_mini_boss_drops()
                        for drop in drops:
                            item = next((item for item in self.items_data["items"] 
                                       if item["id"] == drop["id"]), None)
                            if item:
                                if self.firebase.update_inventory(drop["id"], drop["quantity"]):
                                    self.loot_notification.add_notification(
                                        item["name"],
                                        drop["quantity"],
                                        item.get("rarity", "common"),
                                        item.get("icon_path", "res/img/default_icon.png")
                                    )
                                    self.battle_log.add_message(
                                        f"Obtained {drop['quantity']}x {item['name']}!",
                                        "loot"
                                    )
                        mini_boss.drops_handled = True
                
                if not hasattr(self, 'victory_screen_shown'):
                    self.victory_screen_shown = True
                    self.show_victory_screen = True
                    self.battle_log.add_message("Congratulations! You've defeated all the carrots!")
                
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
                    alpha = int((particle['lifetime'] / 75) * 255)
                    particle['color'] = (*particle['color'][:3], alpha)

    def start_attack_animation(self, attacker, target):
        """Start the attack animation"""
        if attacker and target:
            self.attacking = True
            self.attack_start = pygame.time.get_ticks()
            self.attacker = attacker
            self.target = target
            self.original_pos = list(attacker.position)  # Convert to list to avoid tuple issues

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

    def create_healing_effect(self, position):
        for _ in range(20):  # Create 20 particles
            particle = {
                'x': position[0] + random.randint(0, 250),  # Spread across character width
                'y': position[1] + random.randint(0, 350),  # Spread across character height
                'dx': random.uniform(-2, 2),
                'dy': random.uniform(-5, -2),  # Faster upward movement
                'lifetime': random.randint(45, 75),  # Varied lifetime
                'size': random.randint(3, 8),  # Varied sizes
                'color': (
                    random.randint(0, 100),  # Varied green shades
                    random.randint(200, 255),
                    random.randint(0, 100),
                    255
                )
            }
            self.healing_particles.append(particle)

    def handle_boss_death(self):
        drops = self.generate_boss_drops()
        
        for drop in drops:
            item = next((item for item in self.items_data["items"] 
                        if item["id"] == drop["id"]), None)
            
            if item:
                # Update Firebase inventory
                if self.firebase.update_inventory(drop["id"], drop["quantity"]):
                    # Add loot notification with rarity and icon
                    self.loot_notification.add_notification(
                        item["name"],
                        drop["quantity"],
                        item.get("rarity", "common"),
                        item.get("icon_path", "res/img/default_icon.png")
                    )
                    
                    # Add to battle log
                    self.battle_log.add_message(
                        f"Obtained {drop['quantity']}x {item['name']}!",
                        "loot"
                    )

    def generate_boss_drops(self):
        drops = []
        
        # Health Potion (65% chance)
        if random_float() < 0.65:
            drops.append({
                "id": "health_potion",
                "quantity": randint(1, 2)  # Randomize quantity
            })
        
        # CM Currency (20% chance)
        if random_float() < 0.20:
            drops.append({
                "id": "cm",
                "quantity": randint(1500, 5000)
            })
        
        # FM Currency (10% chance)
        if random_float() < 0.10:
            drops.append({
                "id": "fm",
                "quantity": randint(250, 750)
            })
        
        # Farmer Fang Skin (1% chance)
        if random_float() < 0.01:
            drops.append({
                "id": "farmer_fang_skin",
                "quantity": 1
            })
        
        # Julia's Pendant (10% chance)
        if random_float() < 0.10:
            drops.append({
                "id": "julia_pendant",
                "quantity": 1
            })
        
        # Debug print to verify drops
        print("Generated Drops:", drops)
        
        return drops

    def generate_mini_boss_drops(self):
        drops = []
        
        # Health Potion only (20% chance)
        if random_float() < 0.20:
            drops.append({
                "id": "health_potion",
                "quantity": randint(1, 3)  # 1-3 health potions
            })
        
        # Debug print to verify drops
        print("Generated Mini Boss Drops:", drops)
        
        return drops

    def spawn_mini_bosses(self):
        screen_width = self.screen.get_width()
        
        # Create 3 mini bosses with reduced stats
        for i in range(3):
            x_pos = (screen_width // 4) * (i + 1) - 125  # Distribute across screen
            mini_boss = Character(
                f"Mini Carrot {i+1}",
                self.boss.max_hp // 3,  # One third of original HP
                os.path.join(PROJECT_ROOT, "res", "img", "Angry_Carrot.jpeg"),
                (x_pos, 50)
            )
            
            # Add weaker versions of original abilities
            for ability in self.boss.abilities:
                mini_ability = Ability(
                    ability.name,
                    ability.icon_path,
                    damage=ability.damage // 3,  # One third of original damage
                    healing=ability.healing // 3,
                    cooldown=ability.max_cooldown,
                    ends_turn=ability.ends_turn
                )
                mini_boss.add_ability(mini_ability)
            
            self.mini_bosses.append(mini_boss)
        
        self.battle_log.add_message("The Angry Carrot splits into three Mini Carrots!", "system")
        self.boss = None  # Remove the original boss

    def mini_boss_attack(self):
        # Store original positions for all mini bosses
        original_positions = {mb: list(mb.position) for mb in self.mini_bosses if mb.current_hp > 0}
        
        for mini_boss in self.mini_bosses:
            if mini_boss.current_hp > 0:
                if mini_boss.buff_effects.get("dormant"):
                    self.battle_log.add_message(f"{mini_boss.name} is dormant and skips their turn!", "system")
                    continue

                # Get available abilities (not on cooldown)
                available_abilities = [a for a in mini_boss.abilities if a.current_cooldown == 0]
                
                if available_abilities:
                    ability = random.choice(available_abilities)
                    if ability.use():
                        # Start attack animation for this mini boss
                        self.attacking = True
                        self.attack_start = pygame.time.get_ticks()
                        self.attacker = mini_boss
                        self.target = self.player
                        self.original_pos = list(mini_boss.position)

                        # Wait for animation to complete
                        while self.attacking:
                            current_time = pygame.time.get_ticks()
                            elapsed = current_time - self.attack_start
                            
                            if elapsed >= self.attack_duration:
                                self.attacking = False
                                mini_boss.position = self.original_pos
                            else:
                                # Calculate animation progress
                                t = elapsed / self.attack_duration
                                if t < 0.5:  # Moving towards target
                                    progress = t * 2
                                    mini_boss.position = (
                                        self.original_pos[0] + (self.player.position[0] - self.original_pos[0]) * progress * 0.3,
                                        self.original_pos[1] + (self.player.position[1] - self.original_pos[1]) * progress * 0.3
                                    )
                                else:  # Moving back
                                    progress = (t - 0.5) * 2
                                    target_pos = (
                                        self.original_pos[0] + (self.player.position[0] - self.original_pos[0]) * 0.3,
                                        self.original_pos[1] + (self.player.position[1] - self.original_pos[1]) * 0.3
                                    )
                                    mini_boss.position = (
                                        target_pos[0] + (self.original_pos[0] - target_pos[0]) * progress,
                                        target_pos[1] + (self.original_pos[1] - target_pos[1]) * progress
                                    )
                                
                                # Update display during animation
                                self.draw()
                                pygame.display.flip()
                                self.clock.tick(60)

                        # Apply damage after animation
                        modified_damage = round(ability.damage * mini_boss.buff_effects.get("damage_multiplier", 1.0))
                        damage_dealt = self.take_damage(self.player, modified_damage)
                        
                        if damage_dealt:
                            self.battle_log.add_message(
                                f"{mini_boss.name} uses {ability.name}! Deals {damage_dealt} damage!",
                                "damage"
                            )
                            
                            # Handle lifesteal from Carrot Grenade
                            if ability.name == "Carrot Grenade":
                                lifesteal_amount = round(damage_dealt)  # Full damage healing
                                if lifesteal_amount > 0:
                                    healing_done = mini_boss.heal(lifesteal_amount)
                                    if healing_done:
                                        self.battle_log.add_message(
                                            f"{mini_boss.name} heals for {healing_done} HP from lifesteal!",
                                            "heal"
                                        )

        # Reset all positions after attacks
        for mini_boss, original_pos in original_positions.items():
            mini_boss.position = original_pos
        
        self.turn_counter += 1
        self.start_player_turn()

    def boss_attack(self):
        if self.boss.buff_effects["dormant"]:
            self.battle_log.add_message(f"{self.boss.name} is dormant and skips their turn!", "system")
            self.turn_counter += 1
            self.start_player_turn()
            return

        # Get available abilities (not on cooldown)
        available_abilities = [a for a in self.boss.abilities if a.current_cooldown == 0]
        
        if available_abilities:
            # Boss AI logic
            if self.boss.current_hp < self.boss.max_hp * 0.3 and \
               any(a.name == "Go Dormant" for a in available_abilities):
                ability = next(a for a in available_abilities if a.name == "Go Dormant")
            elif any(a.name == "Anger" for a in available_abilities) and \
                 self.boss.current_hp > self.boss.max_hp * 0.5:
                ability = next(a for a in available_abilities if a.name == "Anger")
            else:
                damage_abilities = [a for a in available_abilities if a.damage > 0]
                if damage_abilities:
                    ability = random.choice(damage_abilities)
                else:
                    ability = random.choice(available_abilities)
            
            # Use the chosen ability
            if ability.use():
                # Update all ability cooldowns at the start of turn
                for a in self.boss.abilities:
                    if a.current_cooldown > 0:
                        a.update_cooldown()
                        self.battle_log.add_message(
                            f"{a.name} cooldown: {a.current_cooldown} turns",
                            "system"
                        )

                if ability.name == "Go Dormant":
                    healing_done = self.boss.heal(ability.healing)
                    self.battle_log.add_message(
                        f"{self.boss.name} uses {ability.name}! Recovers {healing_done} HP!",
                        "heal"
                    )
                    buff = Buff("Dormant", ability.icon_path, 2, "dormant", True)
                    self.boss.add_buff(buff)
                    self.battle_log.add_message(
                        f"{self.boss.name} will skip the next 2 turns!",
                        "system"
                    )
                elif ability.name == "Anger":
                    self.battle_log.add_message(
                        f"{self.boss.name} uses {ability.name}!",
                        "system"
                    )
                    buff = Buff("Anger", ability.icon_path, 3, "damage_multiplier", 3.0)
                    self.boss.add_buff(buff)
                    self.battle_log.add_message(
                        f"{self.boss.name}'s damage is tripled for 3 turns!",
                        "system"
                    )
                else:
                    # Apply damage multiplier from buffs and round to nearest integer
                    modified_damage = round(ability.damage * self.boss.buff_effects["damage_multiplier"])
                    damage_dealt = self.take_damage(self.player, modified_damage)
                    
                    if damage_dealt:
                        self.battle_log.add_message(
                            f"{self.boss.name} uses {ability.name}! Deals {damage_dealt} damage!",
                            "damage"
                        )
                        
                        # Handle lifesteal from Carrot Grenade
                        if ability.name == "Carrot Grenade":
                            lifesteal_amount = round(damage_dealt)  # Full damage healing
                            if lifesteal_amount > 0:
                                healing_done = self.boss.heal(lifesteal_amount)
                                if healing_done:
                                    self.battle_log.add_message(
                                        f"{self.boss.name} heals for {healing_done} HP from lifesteal!",
                                        "heal"
                                    )
    
        self.turn_counter += 1
        self.start_player_turn()

    def use_item(self, item):
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

    def startCooldown(self, abilityId):
        # Map ability IDs to their indices
        ability_indices = {
            'ChamChamAbility1': 0,
            'ChamChamAbility2': 1,
            'ChamChamAbility3': 2,
            'ChamChamAbility4': 3
        }
        
        if abilityId in ability_indices:
            index = ability_indices[abilityId]
            if index < len(self.player.abilities):
                ability = self.player.abilities[index]
                ability.current_cooldown = ability.max_cooldown
                print(f"Started cooldown for {abilityId}: {ability.current_cooldown} turns")  # Debug log

    def start_player_turn(self):
        self.current_turn = "player"
        self.waiting_for_turn = False
        
        # Update cooldowns for inventory slots
        for slot in self.inventory.slots:
            slot.update_cooldown()
        
        # Update buffs for player and active enemies
        self.player.update_buffs()
        if self.boss:
            self.boss.update_buffs()
        else:
            # Update buffs for mini bosses
            for mini_boss in self.mini_bosses:
                if mini_boss.current_hp > 0:
                    mini_boss.update_buffs()
        
        # Handle returning boomerang before anything else
        if self.boomerang_active:
            if self.boss:
                damage_dealt = self.take_damage(self.boss, self.boomerang_damage)
            else:
                # Hit a random living mini boss with boomerang
                living_bosses = [mb for mb in self.mini_bosses if mb.current_hp > 0]
                if living_bosses:
                    target = random.choice(living_bosses)
                    damage_dealt = self.take_damage(target, self.boomerang_damage)
            
            if damage_dealt:
                self.battle_log.add_message(
                    f"The returning boomerang deals {damage_dealt} damage!",
                    "damage"
                )
                
                # Apply lifesteal on return hit too if buff is active
                if self.player.buff_effects["lifesteal"] > 0:
                    lifesteal_amount = int(damage_dealt * self.player.buff_effects["lifesteal"])
                    if lifesteal_amount > 0:
                        healing_done = self.player.heal(lifesteal_amount)
                        if healing_done:
                            self.battle_log.add_message(
                                f"{self.player.name} heals for {healing_done} HP from lifesteal!",
                                "heal"
                            )
                            # Create healing particles for visual feedback
                            self.create_healing_effect(self.player.position)
                
                # Reduce Ability2 cooldown by 2
                fertilizer_heal = self.player.abilities[1]
                if fertilizer_heal.current_cooldown > 0:
                    fertilizer_heal.current_cooldown = max(0, fertilizer_heal.current_cooldown - 2)
                    self.battle_log.add_message(
                        f"Boomerang hit reduces Fertilizer Heal cooldown by 2! (Current: {fertilizer_heal.current_cooldown})",
                        "system"
                    )
            
            self.boomerang_active = False
            self.boomerang_damage = 0

        # Update ability cooldowns
        for ability in self.player.abilities:
            if ability.current_cooldown > 0:
                ability.current_cooldown -= 1
        
        if self.boss:
            for ability in self.boss.abilities:
                if ability.current_cooldown > 0:
                    ability.current_cooldown -= 1
        else:
            for mini_boss in self.mini_bosses:
                for ability in mini_boss.abilities:
                    if ability.current_cooldown > 0:
                        ability.current_cooldown -= 1
        
        self.battle_log.add_message(
            f"Turn {self.turn_counter} - {self.player.name}'s turn!",
            "turn"
        )

    def end_player_turn(self):
        """End the player's turn and start enemy turn"""
        self.current_turn = "boss"
        self.waiting_for_turn = True
        self.ai_thinking = False
        
        # Update turn counter message based on active enemies
        if self.boss:
            turn_message = f"Turn {self.turn_counter + 1} - {self.boss.name}'s turn!"
        else:
            turn_message = f"Turn {self.turn_counter + 1} - Mini Carrots' turn!"
        
        self.battle_log.add_message(turn_message, "turn")

    def setup_targeting(self, ability_index):
        """Set up targeting mode for an ability"""
        self.targeting_mode = True
        self.current_ability = self.player.abilities[ability_index]
        self.targets = []
        
        # Clear existing targets
        self.targets.clear()
        
        # Add targets based on what's currently active
        if self.boss:
            if self.boss.current_hp > 0:
                self.targets.append(Target(
                    self.boss,
                    os.path.join(PROJECT_ROOT, "res", "img", "Angry_Carrot_Icon.png"),
                    (self.boss.position[0] + 100, self.boss.position[1] + 200)  # Moved lower
                ))
        else:
            # Add targeting for each living mini boss with their own position
            for i, mini_boss in enumerate(self.mini_bosses):
                if mini_boss.current_hp > 0:
                    # Calculate position based on mini boss position
                    target_x = mini_boss.position[0] + 100
                    target_y = mini_boss.position[1] + 200  # Moved lower
                    self.targets.append(Target(
                        mini_boss,
                        os.path.join(PROJECT_ROOT, "res", "img", "Angry_Carrot_Icon.png"),  # You might want to create a mini carrot icon
                        (target_x, target_y)
                    ))
        
        if not self.targets:
            self.targeting_mode = False
            self.current_ability = None
            self.battle_log.add_message("No valid targets available!", "warning")

    def handle_targeting_click(self, mouse_pos):
        """Handle clicks while in targeting mode"""
        if not self.targeting_mode:
            return False
        
        for target in self.targets:
            if target.rect.collidepoint(mouse_pos):
                self.targeting_mode = False
                ability = self.current_ability
                
                if ability.use():
                    self.execute_ability(ability, target.character)
                
                self.current_ability = None
                self.targets.clear()
                return True
        
        # Click outside targets - cancel targeting
        self.targeting_mode = False
        self.current_ability = None
        self.targets.clear()
        return True

    def execute_ability(self, ability, target):
        if target is None:
            return

        if ability.name == "Scratch":
            self.player.passive_bonus_damage += 10
            total_damage = ability.damage + self.player.passive_bonus_damage
            damage_dealt = self.take_damage(target, total_damage)
            if damage_dealt:
                self.battle_log.add_message(
                    f"{self.player.name} uses Scratch! Deals {damage_dealt} damage!",
                    "damage"
                )
                self.battle_log.add_message(
                    f"Passive damage increased by 10! (Current: +{self.player.passive_bonus_damage})",
                    "system"
                )
                
                # Add lifesteal for Scratch
                if self.player.buff_effects["lifesteal"] > 0:
                    lifesteal_amount = int(damage_dealt * self.player.buff_effects["lifesteal"])
                    if lifesteal_amount > 0:
                        healing_done = self.player.heal(lifesteal_amount)
                        if healing_done:
                            self.battle_log.add_message(
                                f"{self.player.name} heals for {healing_done} HP from lifesteal!",
                                "heal"
                            )
                            # Create healing particles for visual feedback
                            self.create_healing_effect(self.player.position)

        elif ability.name == "Seed Boomerang":
            total_damage = ability.damage + self.player.passive_bonus_damage
            damage_dealt = self.take_damage(target, total_damage)
            if damage_dealt:
                self.battle_log.add_message(
                    f"{self.player.name} throws Seed Boomerang! Deals {damage_dealt} damage!",
                    "damage"
                )
                
                # Apply lifesteal for initial hit
                if self.player.buff_effects["lifesteal"] > 0:
                    lifesteal_amount = int(damage_dealt * self.player.buff_effects["lifesteal"])
                    if lifesteal_amount > 0:
                        healing_done = self.player.heal(lifesteal_amount)
                        if healing_done:
                            self.battle_log.add_message(
                                f"{self.player.name} heals for {healing_done} HP from lifesteal!",
                                "heal"
                            )
                            # Create healing particles for visual feedback
                            self.create_healing_effect(self.player.position)
                
                # Reduce Ability2 cooldown by 2 on initial hit
                fertilizer_heal = self.player.abilities[1]
                if fertilizer_heal.current_cooldown > 0:
                    fertilizer_heal.current_cooldown = max(0, fertilizer_heal.current_cooldown - 2)
                    self.battle_log.add_message(
                        f"Boomerang hit reduces Fertilizer Heal cooldown by 2! (Current: {fertilizer_heal.current_cooldown})",
                        "system"
                    )
                
                # Set up return hit
                self.boomerang_active = True
                self.boomerang_damage = total_damage
                self.battle_log.add_message(
                    "The boomerang will return next turn!",
                    "system"
                )
    
        elif ability.name == "Rapid Claws":
            self.battle_log.add_message(
                f"{self.player.name} unleashes Rapid Claws!",
                "system"
            )
            for hit in range(6):
                self.player.passive_bonus_damage += 10
                total_damage = ability.damage + self.player.passive_bonus_damage
                damage_dealt = self.take_damage(target, total_damage)
                if damage_dealt:
                    self.battle_log.add_message(
                        f"Rapid Claws hits for {damage_dealt} damage!",
                        "damage"
                    )
                    self.battle_log.add_message(
                        f"Passive damage increased by 10! (Current: +{self.player.passive_bonus_damage})",
                        "system"
                    )
                    
                    # Apply lifesteal for each hit if Fertilizer buff is active
                    if self.player.buff_effects["lifesteal"] > 0:
                        lifesteal_amount = int(damage_dealt * self.player.buff_effects["lifesteal"])
                        if lifesteal_amount > 0:
                            healing_done = self.player.heal(lifesteal_amount)
                            if healing_done:
                                self.battle_log.add_message(
                                    f"{self.player.name} heals for {healing_done} HP from lifesteal!",
                                    "heal"
                                )
                                # Create healing particles for visual feedback
                                self.create_healing_effect(self.player.position)
    
        if ability.ends_turn:
            self.end_player_turn()

    def handle_ability_clicks(self, pos):
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
        for i, ability in enumerate(self.player.abilities):
            ability_x = (self.screen.get_width() // 2) - (240 // 2) + i * 60
            ability_rect = pygame.Rect(ability_x, self.player.position[1] + 380, 50, 50)
            
            if ability_rect.collidepoint(pos):
                if i == 1:  # Fertilizer Heal (no targeting needed)
                    if ability.use():  # Start cooldown only if successfully used
                        self.battle_log.add_message(
                            f"{self.player.name} uses Fertilizer Heal!",
                            "system"
                        )
                        buff = Buff("Fertilizer", ability.icon_path, 4, "lifesteal", 0.75)
                        self.player.add_buff(buff)
                        self.battle_log.add_message(
                            f"{self.player.name} gains Lifesteal for 4 turns!",
                            "system"
                        )
                else:  # Abilities that need targeting (1, 3, 4)
                    self.setup_targeting(i)  # Don't start cooldown yet