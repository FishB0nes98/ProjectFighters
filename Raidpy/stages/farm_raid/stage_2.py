import pygame
from ..stage_base import Stage
from engine.character import Character
from engine.ability import Ability
from engine.inventory import Inventory, Item
from engine.battle_log import BattleLog
from engine.buff import Buff
from engine.target import Target
from engine.loot_notification import LootNotification
from engine.tooltip import TooltipManager
import random
from random import random as random_float, randint
import os
import math
import json

# Get the project root directory
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ITEMS_PATH = os.path.join(PROJECT_ROOT, 'data', 'items.json')

class FarmStage2(Stage):
    def __init__(self, screen, firebase_manager):
        super().__init__(screen)
        self.firebase = firebase_manager
        self.ai_thinking = False
        self.ai_think_start = 0
        self.ai_think_duration = 2000
        self.damage_flash = {"player1": 0, "player2": 0, "enemies": 0}
        self.damage_flash_duration = 500
        self.attacking = False
        self.attack_start = 0
        self.attack_duration = 500
        self.attacker = None
        self.original_pos = None
        self.targeting_mode = False
        self.current_ability = None
        self.targets = []
        self.loot_notification = LootNotification(screen)
        
        # Load items data
        try:
            with open(ITEMS_PATH, 'r') as f:
                self.items_data = json.load(f)
        except FileNotFoundError:
            print(f"Could not find items.json at {ITEMS_PATH}")
            self.items_data = {"items": []}  # Fallback empty items list
        
        # Add missing attributes
        self.healing_particles = []
        self.boomerang_active = False
        self.boomerang_damage = 0
        self.dragging_inventory = False
        self.inventory_drag_offset = (0, 0)
        self.dragging_battle_log = False
        self.battle_log_drag_offset = (0, 0)
        self.victory_screen_shown = False
        self.show_victory_screen = False
        self.next_stage_button = None
        self.clock = pygame.time.Clock()

        # Pre-render surfaces for performance
        self.target_surface = pygame.Surface((50, 50), pygame.SRCALPHA)
        pygame.draw.circle(self.target_surface, (255, 0, 0, 128), (25, 25), 25)  # Red circle
        pygame.draw.circle(self.target_surface, (255, 0, 0, 255), (25, 25), 25, 2)  # Red border
        
        # Pre-create HP bar colors
        self.hp_colors = {
            'high': (46, 204, 113),    # Green
            'medium': (241, 196, 15),   # Yellow
            'low': (231, 76, 60)        # Red
        }
        
        # Cache fonts
        self.hp_font = pygame.font.Font(None, 24)
        self.battle_font = pygame.font.Font(None, 36)

        # Pre-render common surfaces and cache them
        self.hp_bar_bg = pygame.Surface((254, 24), pygame.SRCALPHA)
        pygame.draw.rect(self.hp_bar_bg, (0, 0, 0, 180), (0, 0, 254, 24), border_radius=10)
        
        # Pre-create common surfaces for particles
        self.particle_surfaces = {}
        for size in range(3, 9):
            surface = pygame.Surface((size, size), pygame.SRCALPHA)
            pygame.draw.circle(surface, (50, 255, 50, 255), (size//2, size//2), size//2)
            self.particle_surfaces[size] = surface

    def load_resources(self):
        # Load and scale background first
        self.background = pygame.image.load("Raids/Farm Raid/res/Stage_2_BG.jpeg").convert_alpha()
        self.scaled_bg = pygame.transform.scale(self.background, (1920, 1080))
        self.background = None  # Free up original memory

        # Pre-render static text
        font = pygame.font.Font(None, 36)
        self.stage_text_surface = font.render("Farm Raid - Stage 2", True, (255, 255, 255))

        screen_width = self.screen.get_width()
        screen_height = self.screen.get_height()

        # Create players (Farmer Shoma and Farmer Nina)
        shoma_x = (screen_width // 3) - 125
        nina_x = (screen_width * 2 // 3) - 125
        player_y = screen_height - 450

        # Create characters and load their images immediately
        self.shoma = Character("Farmer Shoma", 7500, "Loading Screen/Farmer Shoma.png", (shoma_x, player_y))
        self.shoma.image = pygame.image.load("Loading Screen/Farmer Shoma.png").convert_alpha()
        self.shoma.image = pygame.transform.scale(self.shoma.image, (250, 350))

        self.nina = Character("Farmer Nina", 6800, "Loading Screen/Farmer Nina.png", (nina_x, player_y))
        self.nina.image = pygame.image.load("Loading Screen/Farmer Nina.png").convert_alpha()
        self.nina.image = pygame.transform.scale(self.nina.image, (250, 350))

        # Create enemies
        self.enemies = []
        enemy_y = 50
        
        # Angry Pig (Left)
        pig_x = (screen_width // 4) - 125
        self.pig = Character("Angry Pig", 8000, "Raids/Farm Raid/res/Monster_Pig.jpeg", (pig_x, enemy_y))
        self.pig.image = pygame.image.load("Raids/Farm Raid/res/Monster_Pig.jpeg").convert_alpha()
        self.pig.image = pygame.transform.scale(self.pig.image, (250, 350))
        self.enemies.append(self.pig)
        
        # Angry Bull (Middle)
        bull_x = (screen_width // 2) - 125
        self.bull = Character("Angry Bull", 12000, "Raids/Farm Raid/res/Monster_Bull.jpeg", (bull_x, enemy_y))
        self.bull.image = pygame.image.load("Raids/Farm Raid/res/Monster_Bull.jpeg").convert_alpha()
        self.bull.image = pygame.transform.scale(self.bull.image, (250, 350))
        self.enemies.append(self.bull)
        
        # Angry Chicken (Right)
        chicken_x = (screen_width * 3 // 4) - 125
        self.chicken = Character("Angry Chicken", 6000, "Raids/Farm Raid/res/Monster_Chicken.jpeg", (chicken_x, enemy_y))
        self.chicken.image = pygame.image.load("Raids/Farm Raid/res/Monster_Chicken.jpeg").convert_alpha()
        self.chicken.image = pygame.transform.scale(self.chicken.image, (250, 350))
        self.enemies.append(self.chicken)

        # Initialize enemy passives
        self.pig.passive_heal = 0  # Track last heal amount
        self.bull.passive_damage_boost = 0  # Track damage increase percentage
        self.chicken.base_dodge = 10  # Base dodge chance
        self.chicken.passive_dodge = 0  # Passive dodge gain per turn
        self.chicken.dodge_chance = self.chicken.base_dodge  # Total dodge chance

        # Add passive display to enemies
        self.pig.passive_display = {
            "icon": "❤",
            "color": (50, 255, 50),  # Green
            "value": "0"
        }
        
        self.bull.passive_display = {
            "icon": "⚔",
            "color": (255, 50, 50),  # Red
            "value": "0%"
        }
        
        self.chicken.passive_display = {
            "icon": "💨",
            "color": (200, 200, 255),  # Light blue
            "value": "10%"
        }

        # Create inventory
        self.inventory = Inventory((20, screen_height // 2 - 150))
        self.inventory.load_items(self.firebase)

        # Add battle log
        self.battle_log = BattleLog(self.screen)

        # Set up abilities
        self.setup_abilities()

        # Randomly decide who goes first
        self.current_turn = random.choice(["player", "enemy"])
        self.battle_log.add_message(f"⚔️ Battle Start! {self.current_turn.capitalize()} goes first!", "system")

        if self.current_turn == "enemy":
            self.waiting_for_turn = True

    def setup_abilities(self):
        # Farmer Shoma's abilities
        shoma_abilities = [
            ("Boink", "Raids/Farm Raid/res/Shoma_A1.jpeg", 320, 0, 0, True),  # Base damage 320, 50% crit chance
            ("Apple Toss", "Raids/Farm Raid/res/Shoma_A2.jpeg", 300, 1000, 8, True),  # Damage OR heal + debuff
            ("Catch!", "Raids/Farm Raid/res/Shoma_A3.jpeg", 0, 0, 9, True),  # 75% dodge chance buff for 4 turns
            ("Teamwork", "Raidpy/res/img/Shoma_A4.webp", 0, 0, 20, True),  # Team buff ability
        ]

        # Farmer Nina's abilities
        nina_abilities = [
            ("Quick Shot", "Raids/Farm Raid/res/Nina_A1.jpeg", 375, 0, 0, True),
            ("Targeted", "Raids/Farm Raid/res/Nina_A2.jpeg", 0, 0, 10, False),
            ("Hide", "Raids/Farm Raid/res/Nina_A3.jpeg", 0, 300, 14, True),
            ("Rain of Arrows", "Raids/Farm Raid/res/Nina_A4.jpeg", 800, 0, 20, True),
        ]

        # Add abilities to characters with descriptions
        for name, icon, damage, healing, cooldown, ends_turn in shoma_abilities:
            ability = Ability(name, icon, damage, healing, cooldown, ends_turn)
            # Add descriptions
            if name == "Boink":
                ability.description = "Deal 320 damage\n50% chance to deal double damage\nNo cooldown"
            elif name == "Apple Toss":
                ability.description = "If used on ally: Heal for 1000 HP\nIf used on enemy: Deal 300 damage and reduce their damage by 85% for 4 turns\nCooldown: 8 turns"
            elif name == "Catch!":
                ability.description = "Grant target ally 75% dodge chance for 4 turns\nCooldown: 9 turns"
            elif name == "Teamwork":
                ability.description = "Grant all allies 10% increased damage and dodge chance for 10 turns\nCooldown: 20 turns"
            self.shoma.add_ability(ability)

        for name, icon, damage, healing, cooldown, ends_turn in nina_abilities:
            ability = Ability(name, icon, damage, healing, cooldown, ends_turn)
            # Add descriptions
            if name == "Quick Shot":
                ability.description = "Deal 375 damage\nDeals 50% more damage to marked targets\nNo cooldown"
            elif name == "Targeted":
                ability.description = "Mark an enemy to take 50% more damage from Nina for 10 turns\nDoesn't end turn\nCooldown: 10 turns"
            elif name == "Hide":
                ability.description = "Become untargetable by enemies\nHeal 300 HP each turn\nBreaks when using Quick Shot\nCooldown: 14 turns"
            elif name == "Rain of Arrows":
                ability.description = "Deal 800 damage to all enemies\nDeals triple damage to enemies below 50% HP\nBreaks stealth\nScales with Mark\nCooldown: 20 turns"
            self.nina.add_ability(ability)

        # Monster Chicken's abilities
        chicken_abilities = [
            ("Double Stab", "Raidpy/res/img/double_stab.webp", 410, 0, 0, True),
            ("Fly-by", "Raidpy/res/img/fly_by.webp", 0, 0, 9, False)
        ]

        for name, icon, damage, healing, cooldown, ends_turn in chicken_abilities:
            ability = Ability(name, icon, damage, healing, cooldown, ends_turn)
            if name == "Double Stab":
                base_damage = damage
                actual_damage = base_damage
                if self.chicken.buff_effects.get("damage_multiplier", 1.0) != 1.0:
                    actual_damage = int(base_damage * self.chicken.buff_effects["damage_multiplier"])
                ability.description = f"Deal {actual_damage} damage to two enemies"
            elif name == "Fly-by":
                ability.description = "Gain 30% additional dodge chance for 5 turns"
            self.chicken.add_ability(ability)

        # Bull's abilities
        bull_abilities = [
            ("Tackle", "Raidpy/res/img/tackle.webp", 400, 0, 0, True),
            ("Horn Drill", "Raidpy/res/img/horn_drill.webp", 300, 0, 13, True)
        ]

        for name, icon, damage, healing, cooldown, ends_turn in bull_abilities:
            ability = Ability(name, icon, damage, healing, cooldown, ends_turn)
            if name == "Tackle":
                ability.description = "Deal 400 damage\n50% chance to crit for 800 damage\nNo cooldown"
            elif name == "Horn Drill":
                ability.description = "Deal 300 damage\nReduces target's damage by 50% for 4 turns\nCooldown: 13 turns"
            self.bull.add_ability(ability)

        # Pig's abilities
        pig_abilities = [
            ("Pitchfork", "Raidpy/res/img/pitchfork.webp", 0, 0, 0, True),  # No cooldown
            ("Feed of Feast", "Raidpy/res/img/feed_of_feast.webp", 0, 0, 10, True)  # 10 turn cooldown
        ]

        for name, icon, damage, healing, cooldown, ends_turn in pig_abilities:
            ability = Ability(name, icon, damage, healing, cooldown, ends_turn)
            if name == "Pitchfork":
                ability.description = "Deal 5% of target's maximum HP as damage"
            elif name == "Feed of Feast":
                ability.description = "Deal triple the amount of last received healing as damage"
            self.pig.add_ability(ability)

    def draw(self):
        # Use pre-scaled background
        self.screen.blit(self.scaled_bg, (0, 0))
        
        current_time = pygame.time.get_ticks()
        
        # Cache common calculations
        damage_flash_active = {
            "player1": current_time - self.damage_flash["player1"] < self.damage_flash_duration,
            "player2": current_time - self.damage_flash["player2"] < self.damage_flash_duration,
            "enemies": current_time - self.damage_flash["enemies"] < self.damage_flash_duration
        }
        
        # Pre-render common surfaces
        flash_surface = pygame.Surface((250, 350), pygame.SRCALPHA)
        flash_surface.fill((255, 0, 0, 128))
        
        # Draw characters with optimized flash effect
        if damage_flash_active["player1"]:
            self.screen.blit(self.shoma.image, self.shoma.position)
            self.screen.blit(flash_surface, self.shoma.position)
        else:
            self.screen.blit(self.shoma.image, self.shoma.position)
        # Draw Shoma's HP bar
        self.draw_hp_bar(self.shoma)
        # Draw Shoma's buffs
        if self.shoma.buffs:
            buff_start_x = self.shoma.position[0] + 10
            buff_start_y = self.shoma.position[1] + 10
            for i, buff in enumerate(self.shoma.buffs):
                buff.draw(self.screen, (buff_start_x, buff_start_y + i * 45))
        
        # Draw Nina with optimized transparency
        is_hidden = any(buff.effect_type == "hide" for buff in self.nina.buffs)
        if is_hidden:
            # Only create hidden surface once when needed
            if not hasattr(self, 'hidden_nina_surface'):
                self.hidden_nina_surface = self.nina.image.copy()
                self.hidden_nina_surface.set_alpha(128)
            self.screen.blit(self.hidden_nina_surface, self.nina.position)
        else:
            self.screen.blit(self.nina.image, self.nina.position)
        # Draw Nina's HP bar
        self.draw_hp_bar(self.nina)
        # Draw Nina's buffs
        if self.nina.buffs:
            buff_start_x = self.nina.position[0] + 10
            buff_start_y = self.nina.position[1] + 10
            for i, buff in enumerate(self.nina.buffs):
                buff.draw(self.screen, (buff_start_x, buff_start_y + i * 45))

        # Draw enemies with batch processing
        for enemy in self.enemies:
            if enemy.current_hp > 0:
                if damage_flash_active["enemies"]:
                    self.screen.blit(enemy.image, enemy.position)
                    self.screen.blit(flash_surface, enemy.position)
                else:
                    self.screen.blit(enemy.image, enemy.position)
                # Draw enemy HP bar
                self.draw_hp_bar(enemy)
                # Draw enemy buffs
                if enemy.buffs:
                    buff_start_x = enemy.position[0] + 10
                    buff_start_y = enemy.position[1] + 10
                    for i, buff in enumerate(enemy.buffs):
                        buff.draw(self.screen, (buff_start_x, buff_start_y + i * 45))
                
                # Draw enemy abilities
                ability_y = enemy.position[1] + enemy.image.get_height() + 35
                ability_start_x = enemy.position[0] + (enemy.image.get_width() // 2) - (len(enemy.abilities) * 30)  # Center abilities
                for i, ability in enumerate(enemy.abilities):
                    ability_pos = (ability_start_x + i * 60, ability_y)
                    ability.draw_icon(self.screen, ability_pos)
                    ability.draw_tooltip(self.screen, ability_pos)
                
                # Draw enemy passive display
                if enemy == self.pig and enemy.current_hp > 0:
                    self.draw_passive_bonus(
                        enemy,
                        f"❤ +{enemy.passive_heal}",
                        (50, 255, 50)  # Green
                    )
                
                if enemy == self.bull and enemy.current_hp > 0:
                    self.draw_passive_bonus(
                        enemy,
                        f"⚔ +{enemy.passive_damage_boost}%",
                        (255, 50, 50)  # Red
                    )
                
                if enemy == self.chicken and enemy.current_hp > 0:
                    self.draw_passive_bonus(
                        enemy,
                        f"💨 {enemy.dodge_chance}%",  # Fixed wind emoji
                        (200, 200, 255)  # Light blue
                    )

        # Draw abilities for both characters (removed turn condition)
        # Draw Shoma's abilities
        shoma_ability_y = self.shoma.position[1] + self.shoma.image.get_height() + 35
        shoma_ability_start_x = self.shoma.position[0] + (self.shoma.image.get_width() // 2) - (240 // 2)
        for i, ability in enumerate(self.shoma.abilities):
            ability_pos = (shoma_ability_start_x + i * 60, shoma_ability_y)
            ability.draw_icon(self.screen, ability_pos)
        
        # Draw Nina's abilities
        nina_ability_y = self.nina.position[1] + self.nina.image.get_height() + 35
        nina_ability_start_x = self.nina.position[0] + (self.nina.image.get_width() // 2) - (240 // 2)
        for i, ability in enumerate(self.nina.abilities):
            ability_pos = (nina_ability_start_x + i * 60, nina_ability_y)
            ability.draw_icon(self.screen, ability_pos)

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
        
        # Draw healing particles in a more optimized manner
        for particle in self.healing_particles:
            # Reuse a single surface if possible
            particle_surface = pygame.Surface((particle['size'], particle['size']), pygame.SRCALPHA)
            
            # Get color with current alpha
            current_color = (
                particle['color'][0],
                particle['color'][1],
                particle['color'][2],
                particle['alpha']
            )
            
            # Draw the particle
            pygame.draw.circle(
                particle_surface,
                current_color,
                (particle['size']//2, particle['size']//2),
                particle['size']//2
            )
            self.screen.blit(particle_surface, (int(particle['x']), int(particle['y'])))
            
        # Draw loot notifications
        self.loot_notification.update_and_draw(self.screen)

        # Draw tooltips last (on top of everything)
        # Draw Shoma's ability tooltips
        for i, ability in enumerate(self.shoma.abilities):
            ability_pos = (shoma_ability_start_x + i * 60, shoma_ability_y)
            ability.draw_tooltip(self.screen, ability_pos)
        
        # Draw Nina's ability tooltips
        for i, ability in enumerate(self.nina.abilities):
            ability_pos = (nina_ability_start_x + i * 60, nina_ability_y)
            ability.draw_tooltip(self.screen, ability_pos)

        # Draw all tooltips from TooltipManager
        TooltipManager().draw_all(self.screen)

        # Draw victory screen if showing
        if hasattr(self, 'show_victory_screen') and self.show_victory_screen:
            # Create semi-transparent overlay
            overlay = pygame.Surface((self.screen.get_width(), self.screen.get_height()))
            overlay.fill((0, 0, 0))
            overlay.set_alpha(128)
            self.screen.blit(overlay, (0, 0))
            
            # Create victory panel
            panel_width = 400
            panel_height = 300  # Increased height to accommodate Stage 3 button
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
            
            # Draw "Start Stage 3" button
            if hasattr(self, 'next_stage_button'):
                pygame.draw.rect(self.screen, (0, 100, 200), self.next_stage_button)
                pygame.draw.rect(self.screen, (100, 200, 255), self.next_stage_button, 2)
                
                button_text = font.render("Start Stage 3", True, (255, 255, 255))
                text_rect = button_text.get_rect(center=self.next_stage_button.center)
                self.screen.blit(button_text, text_rect)

        # Draw info window if active
        if hasattr(self, 'info_window'):
            # Draw the window surface
            self.screen.blit(self.info_window['surface'], self.info_window['position'])
            
            # Draw resize handle if window exists
            window_rect = pygame.Rect(self.info_window['position'], self.info_window['size'])
            pygame.draw.lines(self.screen, (150, 150, 150), False, [
                (window_rect.right - 20, window_rect.bottom - 5),
                (window_rect.right - 5, window_rect.bottom - 20)
            ], 2)

    def handle_events(self, events):
        for event in events:
            # Handle loot notification clicks first
            if event.type == pygame.MOUSEBUTTONDOWN:
                if self.loot_notification.handle_event(event):
                    return True

            if event.type == pygame.MOUSEBUTTONDOWN and self.paused:
                menu_items = self.draw_menu()
                if self.menu_state == "debug":
                    if menu_items.get("damage_enemies") and menu_items["damage_enemies"].collidepoint(event.pos):
                        # Set all enemies HP to 1
                        for enemy in self.enemies:
                            if enemy.current_hp > 1:
                                enemy.current_hp = 1
                        self.battle_log.add_message("Debug: Set all enemies HP to 1!", "system")
                        return True

            # Check for victory screen button click
            if hasattr(self, 'show_victory_screen') and self.show_victory_screen:
                if event.type == pygame.MOUSEBUTTONDOWN:
                    if hasattr(self, 'next_stage_button') and self.next_stage_button.collidepoint(event.pos):
                        self.completed = True
                        self.running = False
                        return True

            # Handle battle log events first
            if not (self.dragging_inventory or self.dragging_battle_log):
                if self.battle_log.handle_event(event):
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

            # Handle right-click for character info
            if event.type == pygame.MOUSEBUTTONDOWN and event.button == 3:  # Right click
                mouse_pos = event.pos
                
                # Check if clicked on any character
                characters = [self.shoma, self.nina, self.pig, self.bull, self.chicken]
                for character in characters:
                    char_rect = pygame.Rect(character.position[0], character.position[1], 
                                          character.image.get_width(), character.image.get_height())
                    if char_rect.collidepoint(mouse_pos):
                        self.show_character_info(character)
                        return True

            # Handle dragging
            if event.type == pygame.MOUSEBUTTONDOWN:
                mouse_pos = event.pos
                
                # Check inventory header
                inventory_header = pygame.Rect(
                    self.inventory.position[0],
                    self.inventory.position[1],
                    self.inventory.size[0],
                    40  # Header height
                )
                
                # Check battle log header
                battle_log_header = pygame.Rect(
                    self.battle_log.position[0],
                    self.battle_log.position[1],
                    self.battle_log.size[0],
                    30  # Header height
                )
                
                if inventory_header.collidepoint(mouse_pos):
                    self.dragging_inventory = True
                    self.dragging_battle_log = False  # Ensure only one is dragged
                    self.inventory_drag_offset = (
                        self.inventory.position[0] - mouse_pos[0],
                        self.inventory.position[1] - mouse_pos[1]
                    )
                    return True

                elif battle_log_header.collidepoint(mouse_pos):
                    self.dragging_battle_log = True
                    self.dragging_inventory = False  # Ensure only one is dragged
                    self.battle_log_drag_offset = (
                        self.battle_log.position[0] - mouse_pos[0],
                        self.battle_log.position[1] - mouse_pos[1]
                    )
                    return True
            
            elif event.type == pygame.MOUSEBUTTONUP:
                if self.dragging_inventory or self.dragging_battle_log:
                    self.dragging_inventory = False
                    self.dragging_battle_log = False
                    # Force a full redraw when drag ends
                    self.draw()
                    pygame.display.flip()
                    return True
            
            elif event.type == pygame.MOUSEMOTION:
                if self.dragging_inventory or self.dragging_battle_log:
                    mouse_pos = event.pos
                    screen_width = self.screen.get_width()
                    screen_height = self.screen.get_height()
                    
                    if self.dragging_inventory:
                        new_x = mouse_pos[0] + self.inventory_drag_offset[0]
                        new_y = mouse_pos[1] + self.inventory_drag_offset[1]
                        
                        # Keep inventory within screen bounds
                        new_x = max(0, min(new_x, screen_width - self.inventory.size[0]))
                        new_y = max(0, min(new_y, screen_height - self.inventory.size[1]))
                        
                        # Only update if position changed
                        if new_x != self.inventory.position[0] or new_y != self.inventory.position[1]:
                            self.inventory.position = [new_x, new_y]
                            # Redraw only when position changes
                            self.draw()
                            pygame.display.flip()
                    
                    elif self.dragging_battle_log:
                        new_x = mouse_pos[0] + self.battle_log_drag_offset[0]
                        new_y = mouse_pos[1] + self.battle_log_drag_offset[1]
                        
                        # Keep battle log within screen bounds
                        new_x = max(0, min(new_x, screen_width - self.battle_log.size[0]))
                        new_y = max(0, min(new_y, screen_height - self.battle_log.size[1]))
                        
                        # Only update if position changed
                        if new_x != self.battle_log.position[0] or new_y != self.battle_log.position[1]:
                            self.battle_log.position = [new_x, new_y]
                            # Redraw only when position changes
                            self.draw()
                            pygame.display.flip()
                    
                    return True

            # Handle inventory item clicks AFTER checking for dragging
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
            
            # Handle targeting clicks
            if event.type == pygame.MOUSEBUTTONDOWN:
                if self.targeting_mode:
                    if self.handle_targeting_click(event.pos):
                        return True
                else:
                    # Handle ability clicks
                    self.handle_ability_clicks(event.pos)
            
            # Handle parent class events
            if super().handle_events([event]):
                return True
        
        return False

    def draw_dragged_elements(self):
        """Optimized drawing of dragged elements"""
        # Create a single surface for dragging
        drag_surface = pygame.Surface(self.screen.get_size(), pygame.SRCALPHA)
        
        # Draw only what's necessary during drag
        if self.dragging_inventory:
            # Draw inventory to the drag surface
            self.inventory.draw(drag_surface)
        
        if self.dragging_battle_log:
            # Draw battle log to the drag surface
            self.battle_log.draw_to_surface(drag_surface)  # We'll need to add this method to BattleLog
        
        # Blit the drag surface to the screen
        self.screen.blit(drag_surface, (0, 0))

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

            # Check win/lose conditions
            if all(enemy.current_hp <= 0 for enemy in self.enemies):
                # Make sure all enemies have their drops handled first
                all_drops_handled = all(hasattr(enemy, 'drops_handled') and enemy.drops_handled 
                                      for enemy in self.enemies)
                
                if all_drops_handled and not self.victory_screen_shown:  # Changed from hasattr check
                    print("Showing victory screen")  # Debug print
                    self.victory_screen_shown = True
                    self.show_victory_screen = True
                    self.completed = True
                    self.battle_log.add_message("Congratulations! You've defeated all enemies!")
                    
                    # Create Stage 3 button
                    button_width = 200
                    button_height = 50
                    self.next_stage_button = pygame.Rect(
                        (self.screen.get_width() - button_width) // 2,
                        (self.screen.get_height() + 100) // 2,  # Positioned below center
                        button_width,
                        button_height
                    )
                    
            elif self.shoma.current_hp <= 0 and self.nina.current_hp <= 0:
                self.completed = False
                self.running = False
                self.battle_log.add_message("Oh no! Both heroes were defeated. Try again!")

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
        """Modified take_damage to handle enemy death drops"""
        if target is None or amount <= 0:
            return 0

        # Check for dodge from all sources
        total_dodge_chance = 0
        total_dodge_chance += target.buff_effects.get("dodge_chance", 0)
        
        dodge_buff = next((buff for buff in target.buffs if buff.effect_type == "dodge_chance"), None)
        if dodge_buff:
            total_dodge_chance += dodge_buff.effect_value / 100

        if total_dodge_chance > 0 and random.random() < total_dodge_chance:
            self.create_dodge_effect(target)
            self.battle_log.add_message(
                f"{target.name} dodged the attack! (Dodge chance: {int(total_dodge_chance * 100)}%)",
                "system"
            )
            return 0

        # Apply damage and handle passives
        damage_dealt = target.take_damage(amount)
        if damage_dealt > 0:
            # Set damage flash
            if target == self.shoma:
                self.damage_flash["player1"] = pygame.time.get_ticks()
            elif target == self.nina:
                self.damage_flash["player2"] = pygame.time.get_ticks()
            else:
                self.damage_flash["enemies"] = pygame.time.get_ticks()

            # Handle enemy death and drops
            if target.current_hp <= 0 and target in self.enemies:
                self.handle_enemy_death(target)

            # Handle Pig's healing passive
            if target == self.pig and target.current_hp > 0:
                heal_amount = int(damage_dealt * 0.35)
                target.current_hp = min(target.max_hp, target.current_hp + heal_amount)
                target.passive_heal = heal_amount
                self.create_healing_effect(target.position)
                self.battle_log.add_message(
                    f"{target.name} heals for {heal_amount} HP from passive!",
                    "heal"
                )

            # Handle Bull's damage increase passive
            if target == self.bull and target.current_hp > 0:
                target.passive_damage_boost += 1
                self.battle_log.add_message(
                    f"{target.name}'s damage increased by 1%! (Total: {target.passive_damage_boost}%)",
                    "system"
                )
        
        return damage_dealt

    def create_healing_effect(self, position):
        for _ in range(20):  # Create 20 particles
            particle = {
                'x': position[0] + random.randint(0, 250),  # Spread across character width
                'y': position[1] + random.randint(0, 350),  # Spread across character height
                'dx': random.uniform(-2, 2),
                'dy': random.uniform(-5, -2),  # Faster upward movement
                'lifetime': random.randint(45, 75),  # Varied lifetime
                'size': random.randint(3, 8),  # Varied sizes
                'alpha': 255,  # Start fully opaque
                'color': (
                    random.randint(0, 100),     # R - dark to medium
                    random.randint(200, 255),   # G - bright
                    random.randint(0, 100),     # B - dark to medium
                    255                          # A - fully opaque
                )
            }
            self.healing_particles.append(particle)

    def handle_targeting_click(self, mouse_pos):
        """Handle clicks while in targeting mode"""
        if not self.targeting_mode:
            return False
        
        for target in self.targets:
            if target.rect.collidepoint(mouse_pos):
                self.targeting_mode = False
                
                if hasattr(self, 'is_item_targeting') and self.is_item_targeting:
                    # Handle item use
                    if hasattr(self, 'current_item') and self.current_item:
                        if self.current_item['id'] == 'health_potion':
                            # Find the slot that contains this item
                            slot = next((slot for slot in self.inventory.slots 
                                       if slot.item and slot.item['id'] == self.current_item['id']), None)
                            
                            if slot and slot.cooldown <= 0:
                                healing = self.current_item['effect']['value']
                                actual_healing = target.character.heal(healing)
                                if actual_healing > 0:
                                    self.battle_log.add_message(
                                        f"Used Health Potion on {target.character.name}! Restored {actual_healing} HP",
                                        "heal"
                                    )
                                    # Create healing particles
                                    self.create_healing_effect(target.character.position)
                                    # Start cooldown
                                    slot.start_cooldown()
                                    # Update Firebase inventory
                                    self.firebase.update_inventory(self.current_item['id'], -1)
                                    # Reload inventory to reflect changes
                                    self.inventory.load_items(self.firebase)
                    
                    self.current_item = None
                    self.is_item_targeting = False
                else:
                    # Handle ability use
                    if self.current_ability and self.current_ability.use():
                        self.execute_ability(self.current_ability, target.character)
                
                self.current_ability = None
                self.targets.clear()
                return True
        
        # Click outside targets - cancel targeting
        self.targeting_mode = False
        self.current_ability = None
        self.current_item = None
        self.is_item_targeting = False
        self.targets.clear()
        return True

    def handle_ability_clicks(self, pos):
        if self.current_turn != "player" or self.waiting_for_turn:
            return
        
        # Check Shoma's abilities
        shoma_ability_y = self.shoma.position[1] + self.shoma.image.get_height() + 35
        shoma_ability_start_x = self.shoma.position[0] + (self.shoma.image.get_width() // 2) - (240 // 2)
        
        for i, ability in enumerate(self.shoma.abilities):
            ability_rect = pygame.Rect(shoma_ability_start_x + i * 60, shoma_ability_y, 50, 50)
            if ability_rect.collidepoint(pos):
                if ability.name == "Teamwork":
                    if ability.use():  # Check if ability can be used (not on cooldown)
                        self.current_character = self.shoma
                        self.execute_ability(ability, None)  # Execute immediately without targeting
                elif ability.name == "Apple Toss" or ability.name == "Boink":
                    self.current_ability = ability
                    self.current_character = self.shoma
                    self.setup_targeting(i)
                elif ability.name == "Catch!":
                    # Only target allies with Catch!
                    self.current_ability = ability
                    self.current_character = self.shoma
                    self.setup_targeting(i, allies_only=True)
                return

        # Check Nina's abilities
        nina_ability_y = self.nina.position[1] + self.nina.image.get_height() + 35
        nina_ability_start_x = self.nina.position[0] + (self.nina.image.get_width() // 2) - (240 // 2)
        
        for i, ability in enumerate(self.nina.abilities):
            ability_rect = pygame.Rect(nina_ability_start_x + i * 60, nina_ability_y, 50, 50)
            if ability_rect.collidepoint(pos):
                if ability.name == "Rain of Arrows":
                    if ability.use():  # Check if ability can be used (not on cooldown)
                        self.current_character = self.nina
                        self.execute_ability(ability, None)  # Execute immediately without targeting
                elif ability.name == "Hide":
                    if ability.use():
                        self.current_character = self.nina
                        self.execute_ability(ability, self.nina)  # Pass Nina as target for Hide
                elif ability.name == "Targeted" or ability.name == "Quick Shot":
                    self.current_ability = ability
                    self.current_character = self.nina
                    self.setup_targeting(i)
                return

    def setup_targeting(self, ability_index, allies_only=False):
        """Set up targeting mode for an ability"""
        self.targeting_mode = True
        if self.current_character == self.shoma:
            self.current_ability = self.shoma.abilities[ability_index]
        else:
            self.current_ability = self.nina.abilities[ability_index]
        self.targets = []
        
        # Clear existing targets
        self.targets.clear()
        
        if self.current_ability.name == "Catch!" or allies_only:
            # Add Shoma and Nina as targets for Catch!
            if self.shoma.current_hp > 0:
                self.targets.append(Target(
                    self.shoma,
                    "Loading Screen/Farmer Shoma.png",
                    (self.shoma.position[0] + 100, self.shoma.position[1] + 200)
                ))
            if self.nina.current_hp > 0:
                self.targets.append(Target(
                    self.nina,
                    "Loading Screen/Farmer Nina.png",
                    (self.nina.position[0] + 100, self.nina.position[1] + 200)
                ))
        elif self.current_ability.name == "Apple Toss":
            # Add both allies and enemies as targets for Apple Toss
            # Add allies
            if self.shoma.current_hp > 0:
                self.targets.append(Target(
                    self.shoma,
                    "Loading Screen/Farmer Shoma.png",
                    (self.shoma.position[0] + 100, self.shoma.position[1] + 200)
                ))
            if self.nina.current_hp > 0:
                self.targets.append(Target(
                    self.nina,
                    "Loading Screen/Farmer Nina.png",
                    (self.nina.position[0] + 100, self.nina.position[1] + 200)
                ))
            # Add enemies
            for enemy in self.enemies:
                if enemy.current_hp > 0:
                    target_x = enemy.position[0] + 100
                    target_y = enemy.position[1] + 200
                    self.targets.append(Target(
                        enemy,
                        "Raids/Farm Raid/res/Monster_Pig.jpeg",  # Use appropriate enemy icon
                        (target_x, target_y)
                    ))
        else:
            # For other abilities that target enemies only
            for enemy in self.enemies:
                if enemy.current_hp > 0:
                    target_x = enemy.position[0] + 100
                    target_y = enemy.position[1] + 200
                    self.targets.append(Target(
                        enemy,
                        "Raids/Farm Raid/res/Monster_Pig.jpeg",  # Use appropriate enemy icon
                        (target_x, target_y)
                    ))
        
        if not self.targets:
            self.targeting_mode = False
            self.current_ability = None
            self.battle_log.add_message("No valid targets available!", "warning")

    def setup_healing_targeting(self, is_item=False):
        """Set up targeting mode for healing abilities or items"""
        self.targeting_mode = True
        self.targets = []
        self.is_item_targeting = is_item  # Track if we're targeting for an item
        
        # Add both characters as potential healing targets if they're not at full HP
        if self.shoma.current_hp > 0 and self.shoma.current_hp < self.shoma.max_hp:
            self.targets.append(Target(
                self.shoma,
                "Loading Screen/Farmer Shoma.png",
                (self.shoma.position[0] + 100, self.shoma.position[1] + 200)
            ))
        
        if self.nina.current_hp > 0 and self.nina.current_hp < self.nina.max_hp:
            self.targets.append(Target(
                self.nina,
                "Loading Screen/Farmer Nina.png",
                (self.nina.position[0] + 100, self.nina.position[1] + 200)
            ))
        
        if not self.targets:
            self.targeting_mode = False
            self.current_ability = None
            self.current_item = None
            self.is_item_targeting = False
            self.battle_log.add_message("No valid healing targets!", "warning")

    def enemy_turn(self):
        """Handle enemy turn logic"""
        # Update buffs for all characters at the start of enemy turn
        self.update_buffs()
        
        # Choose one random active enemy to act
        active_enemies = []
        if self.chicken.current_hp > 0 and not any(buff.effect_type == "dormant" for buff in self.chicken.buffs):
            active_enemies.append(self.chicken)
        if self.bull.current_hp > 0 and not any(buff.effect_type == "dormant" for buff in self.bull.buffs):
            active_enemies.append(self.bull)
        if self.pig.current_hp > 0 and not any(buff.effect_type == "dormant" for buff in self.pig.buffs):
            active_enemies.append(self.pig)

        if active_enemies:
            acting_enemy = random.choice(active_enemies)
            
            # Handle enemy actions
            if acting_enemy == self.bull:
                # Get available abilities (not on cooldown)
                available_abilities = [a for a in self.bull.abilities if a.current_cooldown == 0]
                
                # Always use Horn Drill if it's available
                horn_drill = next((a for a in available_abilities if a.name == "Horn Drill"), None)
                if horn_drill and horn_drill.use():
                    self.handle_horn_drill(horn_drill)
                else:
                    # Use Tackle if Horn Drill wasn't available
                    tackle = next((a for a in available_abilities if a.name == "Tackle"), None)
                    if tackle and tackle.use():
                        self.handle_tackle(tackle)
            elif acting_enemy == self.chicken:
                # Get available abilities (not on cooldown)
                available_abilities = [a for a in self.chicken.abilities if a.current_cooldown == 0]
                
                # Try to use Fly-by first if available
                fly_by = next((a for a in available_abilities if a.name == "Fly-by"), None)
                if fly_by:
                    if fly_by.use():
                        # Add dodge chance buff
                        dodge_buff = Buff(
                            name="Fly-by",
                            icon_path=fly_by.icon_path,
                            duration=5,
                            effect_type="additional_dodge",
                            effect_value=30
                        )
                        dodge_buff.description = "Additional 30% dodge chance\nDuration: 5 turns"
                        
                        self.chicken.buffs = [b for b in self.chicken.buffs if b.effect_type != "additional_dodge"]
                        self.chicken.add_buff(dodge_buff)
                        
                        self.chicken.dodge_chance += 30
                        
                        self.battle_log.add_message(
                            f"{self.chicken.name} uses Fly-by! Gains 30% additional dodge chance for 5 turns!",
                            "system"
                        )

                # After Fly-by, try to use Double Stab
                double_stab = next((a for a in available_abilities if a.name == "Double Stab"), None)
                if double_stab:
                    if double_stab.use():
                        self.handle_double_stab(double_stab)
            elif acting_enemy == self.pig:
                # Get available abilities (not on cooldown)
                available_abilities = [a for a in self.pig.abilities if a.current_cooldown == 0]
                
                # Try to use Feed of Feast if conditions are met
                feed_of_feast = next((a for a in available_abilities if a.name == "Feed of Feast"), None)
                if feed_of_feast and self.pig.passive_heal > 0:
                    if feed_of_feast.use():
                        # Choose a random non-hidden target
                        valid_targets = []
                        if self.shoma.current_hp > 0:
                            valid_targets.append(self.shoma)
                        if self.nina.current_hp > 0 and not any(buff.effect_type == "hide" for buff in self.nina.buffs):
                            valid_targets.append(self.nina)
                        
                        if valid_targets:
                            target = random.choice(valid_targets)
                            self.handle_feed_of_feast(target)
                else:
                    # Use Pitchfork if Feed of Feast isn't available or conditions aren't met
                    pitchfork = next((a for a in available_abilities if a.name == "Pitchfork"), None)
                    if pitchfork and pitchfork.use():
                        # Choose a random non-hidden target
                        valid_targets = []
                        if self.shoma.current_hp > 0:
                            valid_targets.append(self.shoma)
                        if self.nina.current_hp > 0 and not any(buff.effect_type == "hide" for buff in self.nina.buffs):
                            valid_targets.append(self.nina)
                        
                        if valid_targets:
                            target = random.choice(valid_targets)
                            self.handle_pitchfork(target)

            # Log the end of enemy turn and increment turn counter
            self.battle_log.add_message(f"{acting_enemy.name} ends its turn.", "system")
            self.turn_counter += 1  # Increment counter after enemy turn
            self.start_player_turn()
        else:
            # If no enemies can act, increment turn and start player turn
            self.turn_counter += 1
            self.start_player_turn()

    def handle_horn_drill(self, horn_drill):
        """Handle Bull's Horn Drill ability"""
        # Choose target (prefer non-hidden targets)
        valid_targets = []
        if self.shoma.current_hp > 0:
            valid_targets.append(self.shoma)
        if self.nina.current_hp > 0 and not any(buff.effect_type == "hide" for buff in self.nina.buffs):
            valid_targets.append(self.nina)

        if valid_targets:
            target = random.choice(valid_targets)
            # Start attack animation
            self.start_attack_animation(self.bull, target)
            
            # Calculate damage with passive bonus
            base_damage = horn_drill.damage
            damage_multiplier = 1 + (self.bull.passive_damage_boost / 100)  # Convert percentage to multiplier
            final_damage = int(base_damage * damage_multiplier)
            
            damage_dealt = self.take_damage(target, final_damage)
            if damage_dealt:
                # Apply damage reduction debuff with description
                damage_debuff = Buff(
                    "Horn Drill Debuff",
                    horn_drill.icon_path,
                    4,  # 4 turns duration
                    "damage_reduction",
                    0.5  # 50% damage reduction
                )
                damage_debuff.description = "Damage reduced by 50%\nDuration: 4 turns"
                
                # Remove any existing damage reduction debuff
                target.buffs = [b for b in target.buffs if b.effect_type != "damage_reduction"]
                target.add_buff(damage_debuff)
                target.buff_effects["damage_multiplier"] = 0.5
                
                self.battle_log.add_message(
                    f"{self.bull.name} uses Horn Drill on {target.name}! Deals {damage_dealt} damage and reduces their damage by 50%!",
                    "damage"
                )

    def handle_tackle(self, tackle):
        """Handle Bull's Tackle ability"""
        # Choose target
        valid_targets = []
        if self.shoma.current_hp > 0:
            valid_targets.append(self.shoma)
        if self.nina.current_hp > 0 and not any(buff.effect_type == "hide" for buff in self.nina.buffs):
            valid_targets.append(self.nina)

        if valid_targets:
            target = random.choice(valid_targets)
            # Start attack animation
            self.start_attack_animation(self.bull, target)
            
            # Calculate damage with crit chance and passive bonus
            base_damage = tackle.damage  # Should be 400 from setup_abilities
            damage_multiplier = 1 + (self.bull.passive_damage_boost / 100)  # Convert percentage to multiplier
            is_crit = random.random() < 0.5  # 50% crit chance
            
            # Apply crit first, then passive bonus
            if is_crit:
                base_damage *= 2  # Double damage on crit
            
            final_damage = int(base_damage * damage_multiplier)
            damage_dealt = self.take_damage(target, final_damage)
            
            if damage_dealt:
                if is_crit:
                    self.battle_log.add_message(
                        f"{self.bull.name} uses Tackle on {target.name}! CRITICAL HIT for {damage_dealt} damage!",
                        "damage"
                    )
                else:
                    self.battle_log.add_message(
                        f"{self.bull.name} uses Tackle on {target.name}! Deals {damage_dealt} damage!",
                        "damage"
                    )

    def handle_double_stab(self, double_stab):
        """Handle Chicken's Double Stab ability"""
        # Get all valid targets
        valid_targets = []
        if self.shoma.current_hp > 0:
            valid_targets.append(self.shoma)
        if self.nina.current_hp > 0 and not any(buff.effect_type == "hide" for buff in self.nina.buffs):
            valid_targets.append(self.nina)

        # Hit up to two targets
        targets_hit = min(len(valid_targets), 2)
        for _ in range(targets_hit):
            if not valid_targets:  # Break if no more valid targets
                break
            
            target = random.choice(valid_targets)
            valid_targets.remove(target)  # Remove target so it can't be hit twice
            
            # Start attack animation
            self.start_attack_animation(self.chicken, target)
            
            # Calculate damage with passive bonus
            base_damage = 410
            actual_damage = base_damage
            if target.buff_effects.get("damage_multiplier", 1.0) != 1.0:
                actual_damage = int(base_damage * target.buff_effects["damage_multiplier"])
            final_damage = int(actual_damage * self.chicken.buff_effects.get("damage_multiplier", 1.0))
            
            damage_dealt = self.take_damage(target, final_damage)
            if damage_dealt:
                self.battle_log.add_message(
                    f"{self.chicken.name} uses Double Stab on {target.name}! Deals {damage_dealt} damage!",
                    "damage"
                )

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

    def draw_passive_bonus(self, character, text, color):
        try:
            font = pygame.font.SysFont("segoeuiemoji", 20)
        except:
            font = pygame.font.Font(None, 20)
        
        bonus_text = font.render(text, True, color)
        
        # Position at bottom right with padding
        padding = 20
        bonus_pos = (
            character.position[0] + character.image.get_width() - bonus_text.get_width() - padding,
            character.position[1] + character.image.get_height() - bonus_text.get_height() - padding
        )
        
        # Create box rect
        box_padding = 8
        box_rect = pygame.Rect(
            bonus_pos[0] - box_padding,
            bonus_pos[1] - box_padding,
            bonus_text.get_width() + box_padding * 2,
            bonus_text.get_height() + box_padding * 2
        )
        
        # Check for hover
        mouse_pos = pygame.mouse.get_pos()
        is_hovered = box_rect.collidepoint(mouse_pos)
        current_time = pygame.time.get_ticks()

        # Track hover start time
        if is_hovered:
            if not hasattr(self, 'passive_hover_start'):
                self.passive_hover_start = {}
            if id(character) not in self.passive_hover_start:
                self.passive_hover_start[id(character)] = current_time
        else:
            if hasattr(self, 'passive_hover_start'):
                self.passive_hover_start.pop(id(character), None)

        # Draw visual hover effects immediately
        glow_intensity = 15 if is_hovered else 8
        for i in range(glow_intensity):
            alpha = int(120 * (1 - i/glow_intensity))
            glow_surface = pygame.Surface((box_rect.width + i*2, box_rect.height + i*2), pygame.SRCALPHA)
            glow_color = (*color, alpha)
            if is_hovered:
                # Make glow brighter on hover
                glow_color = tuple(min(255, c + 50) for c in color[:3]) + (alpha,)
            pygame.draw.rect(glow_surface, glow_color, 
                           (0, 0, glow_surface.get_width(), glow_surface.get_height()), 
                           border_radius=10)
            self.screen.blit(glow_surface, 
                           (box_rect.x - i, box_rect.y - i))
        
        # Draw main box with hover effect
        box_surface = pygame.Surface((box_rect.width, box_rect.height), pygame.SRCALPHA)
        bg_color = (40, 40, 40, 230) if is_hovered else (30, 30, 30, 230)
        pygame.draw.rect(box_surface, bg_color, 
                        (0, 0, box_rect.width, box_rect.height), 
                        border_radius=10)
        self.screen.blit(box_surface, box_rect)
        
        # Draw text
        self.screen.blit(bonus_text, bonus_pos)
        
        # Handle tooltip with delay
        if is_hovered and hasattr(self, 'passive_hover_start'):
            hover_duration = current_time - self.passive_hover_start.get(id(character), current_time)
            if hover_duration >= 500:  # 500ms hover delay
                tooltip_text = ""
                if character == self.pig:
                    tooltip_text = (
                        "Healing Passive\n"
                        "───────────────\n"
                        f"• Heals for 35% of damage taken\n"
                        f"• Current stored healing: {character.passive_heal}"
                    )
                elif character == self.bull:
                    tooltip_text = (
                        "Rage Passive\n"
                        "───────────────\n"
                        f"• Gains 1% increased damage when hit\n"
                        f"• Current damage bonus: {character.passive_damage_boost}%"
                    )
                elif character == self.chicken:
                    tooltip_text = (
                        "Evasion Passive\n"
                        "──────���────────\n"
                        f"• Base dodge chance: {character.base_dodge}%\n"
                        f"• Passive dodge bonus: {character.passive_dodge}%\n"
                        f"• Total dodge chance: {character.dodge_chance}%"
                    )
                
                if tooltip_text:
                    TooltipManager().start_hover(id(character), tooltip_text, mouse_pos)
        else:
            TooltipManager().stop_hover(id(character))

    def use_item(self, item):
        if item['id'] == 'health_potion':
            if self.current_turn == "player" and not self.waiting_for_turn:
                # Set up targeting for healing potion
                self.setup_healing_targeting(is_item=True)
                self.current_item = item
                return True  # Changed to True to indicate successful targeting setup
        return False

    def execute_ability(self, ability, target):
        if target is None:
            # Handle targetless abilities
            if ability.name == "Teamwork":
                # Apply buff to both Shoma and Nina
                for ally in [self.shoma, self.nina]:
                    if ally.current_hp > 0:
                        teamwork_buff = Buff(
                            name="Teamwork",
                            icon_path=ability.icon_path,
                            duration=10,
                            effect_type="teamwork",
                            effect_value=0.1
                        )
                        teamwork_buff.description = "10% increased damage and dodge chance\nDuration: 10 turns"
                        
                        ally.buffs = [b for b in ally.buffs if b.effect_type != "teamwork"]
                        ally.add_buff(teamwork_buff)
                        
                        ally.buff_effects["damage_multiplier"] = 1.1
                        ally.buff_effects["dodge_chance"] = 0.1
                        
                        self.battle_log.add_message(
                            f"{ally.name} gains 10% damage and dodge chance for 10 turns!",
                            "system"
                        )
                
                if ability.ends_turn:
                    self.end_player_turn()
                return

            elif ability.name == "Rain of Arrows":
                # Remove hide buff if exists
                hide_buff = next((buff for buff in self.nina.buffs if buff.effect_type == "hide"), None)
                if hide_buff:
                    self.nina.buffs.remove(hide_buff)
                    self.battle_log.add_message(
                        f"{self.nina.name} breaks stealth to unleash Rain of Arrows!",
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

                        final_damage = int(base_damage * self.nina.buff_effects.get("damage_multiplier", 1.0))
                        damage_dealt = self.take_damage(enemy, final_damage)
                        
                        if damage_dealt > 0:
                            total_damage += damage_dealt
                            self.battle_log.add_message(
                                f"Rain of Arrows hits {enemy.name} for {damage_dealt} damage! ({damage_multiplier})",
                                "damage"
                            )

                if total_damage > 0:
                    self.battle_log.add_message(
                        f"{self.nina.name}'s Rain of Arrows dealt a total of {total_damage} damage!",
                        "system"
                    )

                if ability.ends_turn:
                    self.end_player_turn()
                return

            return

        # Handle targeted abilities
        if ability.name == "Quick Shot":
            # Remove hide buff if exists
            nina_hide_buff = next((buff for buff in self.nina.buffs if buff.effect_type == "hide"), None)
            if nina_hide_buff:
                self.nina.buffs.remove(nina_hide_buff)
                self.battle_log.add_message(
                    f"{self.nina.name} breaks stealth to attack!",
                    "system"
                )
            
            # Start attack animation
            self.start_attack_animation(self.nina, target)
            
            # Calculate damage including mark
            base_damage = ability.damage
            if any(buff.effect_type == "nina_mark" for buff in target.buffs):
                base_damage = int(base_damage * 1.5)
            
            # Apply damage multiplier from buffs
            final_damage = int(base_damage * self.nina.buff_effects.get("damage_multiplier", 1.0))
            damage_dealt = self.take_damage(target, final_damage)
            
            if damage_dealt:
                if any(buff.effect_type == "nina_mark" for buff in target.buffs):
                    self.battle_log.add_message(
                        f"{self.nina.name} uses Quick Shot on marked target! Deals {damage_dealt} damage!",
                        "damage"
                    )
                else:
                    self.battle_log.add_message(
                        f"{self.nina.name} uses Quick Shot! Deals {damage_dealt} damage!",
                        "damage"
                    )

        elif ability.name == "Boink":
            # Start attack animation
            self.start_attack_animation(self.shoma, target)
            
            # Calculate damage with 50% crit chance
            base_damage = ability.damage
            is_crit = random.random() < 0.5
            
            if is_crit:
                base_damage *= 2
            
            final_damage = int(base_damage * self.shoma.buff_effects.get("damage_multiplier", 1.0))
            damage_dealt = self.take_damage(target, final_damage)
            
            if damage_dealt:
                if is_crit:
                    self.battle_log.add_message(
                        f"{self.shoma.name} uses Boink! CRITICAL HIT for {damage_dealt} damage!",
                        "damage"
                    )
                else:
                    self.battle_log.add_message(
                        f"{self.shoma.name} uses Boink! Deals {damage_dealt} damage!",
                        "damage"
                    )

        # Add these ability handlers:
        elif ability.name == "Apple Toss":
            # Start attack animation
            self.start_attack_animation(self.shoma, target)
            
            # Check if target is ally or enemy
            is_ally = target in [self.shoma, self.nina]
            
            if is_ally:
                # Healing effect
                healing_done = target.heal(ability.healing)
                if healing_done:
                    self.battle_log.add_message(
                        f"{self.shoma.name} tosses a healing apple to {target.name}! Heals for {healing_done} HP!",
                        "heal"
                    )
                    self.create_healing_effect(target.position)
            else:
                # Damage and debuff effect
                damage_dealt = self.take_damage(target, ability.damage)
                if damage_dealt:
                    # Apply damage reduction debuff
                    damage_debuff = Buff(
                        "Apple Debuff",
                        ability.icon_path,
                        4,  # 4 turns duration
                        "damage_reduction",
                        0.85  # 85% damage reduction
                    )
                    # Remove any existing damage reduction debuff
                    target.buffs = [b for b in target.buffs if b.effect_type != "damage_reduction"]
                    target.add_buff(damage_debuff)
                    # Set the damage multiplier effect
                    target.buff_effects["damage_multiplier"] = 0.15  # Reduce to 15% of normal damage
                    
                    self.battle_log.add_message(
                        f"{self.shoma.name} uses Apple Toss! Deals {damage_dealt} damage and reduces {target.name}'s damage by 85%!",
                        "damage"
                    )

        elif ability.name == "Catch!":
            dodge_buff = Buff(
                "Catch",
                ability.icon_path,
                4,  # 4 turns duration
                "dodge_chance",
                0.75  # 75% dodge chance
            )
            dodge_buff.description = "75% chance to dodge attacks\nDuration: 4 turns"
            
            # Remove any existing dodge buffs
            target.buffs = [b for b in target.buffs if b.effect_type != "dodge_chance"]
            target.add_buff(dodge_buff)
            target.buff_effects["dodge_chance"] = 0.75
            
            self.battle_log.add_message(
                f"{self.shoma.name} uses Catch on {target.name}! Grants 75% dodge chance for 4 turns!",
                "system"
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
                f"{self.nina.name} marks {target.name}! Target will take 50% more damage from Nina for 10 turns!",
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
            self.nina.buffs = [b for b in self.nina.buffs if b.effect_type != "hide"]
            self.nina.add_buff(hide_buff)
            
            self.battle_log.add_message(
                f"{self.nina.name} enters stealth! Will heal {hide_buff.effect_value} HP each turn until attacking.",
                "system"
            )

        if ability.ends_turn:
            self.end_player_turn()

    def draw_hp_bar(self, character):
        # Calculate HP percentage
        hp_percentage = character.current_hp / character.max_hp
        
        # HP bar position (just below character sprite)
        bar_x = character.position[0]
        bar_y = character.position[1] + character.image.get_height() + 10
        
        # Draw background using pre-rendered surface
        self.screen.blit(self.hp_bar_bg, (bar_x - 2, bar_y - 2))
        
        # Calculate HP bar color based on percentage
        if hp_percentage > 0.6:
            main_color = self.hp_colors['high']
        elif hp_percentage > 0.3:
            main_color = self.hp_colors['medium']
        else:
            main_color = self.hp_colors['low']
        
        # Draw main HP bar
        current_hp_width = max(250 * hp_percentage, 0)
        if current_hp_width > 0:
            pygame.draw.rect(self.screen, main_color,
                            (bar_x, bar_y, current_hp_width, 20),
                            border_radius=8)
        
        # Draw HP text with shadow
        hp_text = f"{character.current_hp}/{character.max_hp}"
        text_surface = self.hp_font.render(hp_text, True, (255, 255, 255))
        text_pos = (bar_x + 125 - text_surface.get_width()//2,
                    bar_y + 10 - text_surface.get_height()//2)
        
        # Draw text shadow
        shadow_surface = self.hp_font.render(hp_text, True, (0, 0, 0))
        self.screen.blit(shadow_surface, (text_pos[0] + 1, text_pos[1] + 1))
        self.screen.blit(text_surface, text_pos)

    def update_buffs(self):
        """Update buffs for each character"""
        # Update buffs for each character
        for character in [self.shoma, self.nina]:
            buffs_to_remove = []
            for buff in character.buffs:
                # Skip infinite duration buffs (like Hide)
                if buff.duration != -1:
                    buff.duration -= 1
                    if buff.duration <= 0:
                        buffs_to_remove.append(buff)
                        # Reset buff effects when expired
                        if buff.effect_type == "teamwork":
                            character.buff_effects["damage_multiplier"] = 1.0
                            character.buff_effects["dodge_chance"] = 0.0
                        elif buff.effect_type == "damage_multiplier":
                            character.buff_effects["damage_multiplier"] = 1.0
                        elif buff.effect_type == "dodge_chance":
                            character.buff_effects["dodge_chance"] = 0.0
                        
                        self.battle_log.add_message(
                            f"{character.name}'s {buff.effect_type} buff expired!",
                            "system"
                        )

            # Remove expired buffs
            for buff in buffs_to_remove:
                character.buffs.remove(buff)

        # Update enemy buffs with dynamic tooltip update
        for enemy in self.enemies:
            if enemy.current_hp > 0:
                buffs_to_remove = []
                
                # Special handling for chicken's dodge
                if enemy == self.chicken:
                    enemy.passive_dodge += 1  # Increase passive dodge by 1% each turn
                    additional_dodge = 0  # Track additional dodge from buffs
                    
                    # Calculate total dodge from base + passive + buffs
                    for buff in enemy.buffs:
                        if buff.effect_type == "additional_dodge":
                            additional_dodge += buff.effect_value
                    
                    # Update total dodge chance (base + passive + buffs)
                    enemy.dodge_chance = min(100, enemy.base_dodge + enemy.passive_dodge + additional_dodge)

                    # Update Double Stab tooltip with actual damage
                    for ability in enemy.abilities:
                        if ability.name == "Double Stab":
                            base_damage = 410
                            actual_damage = base_damage
                            if enemy.buff_effects.get("damage_multiplier", 1.0) != 1.0:
                                actual_damage = int(base_damage * enemy.buff_effects["damage_multiplier"])
                            ability.description = f"Deal {actual_damage} damage to two enemies"
                
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
                            elif enemy == self.chicken and buff.effect_type == "additional_dodge":
                                # Only remove the buff's dodge contribution
                                enemy.dodge_chance = min(100, enemy.base_dodge + enemy.passive_dodge)

                # Remove expired buffs
                for buff in buffs_to_remove:
                    enemy.buffs.remove(buff)
                    if enemy == self.chicken and buff.effect_type == "additional_dodge":
                        self.battle_log.add_message(
                            f"{enemy.name}'s dodge chance buff expired! Current dodge chance: {enemy.dodge_chance}%",
                            "system"
                        )

    def update_cooldowns(self):
        """Update cooldowns for all abilities"""
        # Update Shoma's ability cooldowns
        for ability in self.shoma.abilities:
            if ability.current_cooldown > 0:
                ability.current_cooldown -= 1
                print(f"Updated {self.shoma.name}'s {ability.name} cooldown: {ability.current_cooldown}")

        # Update Nina's ability cooldowns
        for ability in self.nina.abilities:
            if ability.current_cooldown > 0:
                ability.current_cooldown -= 1
                print(f"Updated {self.nina.name}'s {ability.name} cooldown: {ability.current_cooldown}")

        # Update Chicken's ability cooldowns
        if self.chicken.current_hp > 0:
            for ability in self.chicken.abilities:
                if ability.current_cooldown > 0:
                    ability.current_cooldown -= 1
                    print(f"Updated {self.chicken.name}'s {ability.name} cooldown: {ability.current_cooldown}")

        # Update Bull's ability cooldowns (when implemented)
        if self.bull.current_hp > 0:
            for ability in self.bull.abilities:
                if ability.current_cooldown > 0:
                    ability.current_cooldown -= 1

        # Update Pig's ability cooldowns (when implemented)
        if self.pig.current_hp > 0:
            for ability in self.pig.abilities:
                if ability.current_cooldown > 0:
                    ability.current_cooldown -= 1

        # Update inventory item cooldowns
        for slot in self.inventory.slots:
            if slot.cooldown > 0:
                slot.cooldown -= 1
                print(f"Updated inventory slot cooldown: {slot.cooldown}")

    def enable_abilities(self):
        """Enable abilities that are not on cooldown"""
        # Enable Shoma's abilities
        for ability in self.shoma.abilities:
            if ability.current_cooldown <= 0:
                ability.enabled = True
            else:
                ability.enabled = False

        # Enable Nina's abilities
        for ability in self.nina.abilities:
            if ability.current_cooldown <= 0:
                ability.enabled = True
            else:
                ability.enabled = False

        # Update ability display
        for character in [self.shoma, self.nina]:
            for ability in character.abilities:
                if hasattr(ability, 'enabled'):
                    if ability.enabled:
                        ability.icon.set_alpha(255)  # Full opacity for enabled abilities
                    else:
                        ability.icon.set_alpha(128)  # Semi-transparent for disabled abilities

    def start_player_turn(self):
        """Start the player's turn"""
        self.current_turn = "player"
        self.waiting_for_turn = False
        
        # Handle Nina's hide healing at the start of turn
        hide_buff = next((buff for buff in self.nina.buffs if buff.effect_type == "hide"), None)
        if hide_buff and self.nina.current_hp > 0:
            healing = hide_buff.effect_value  # This is the 300 HP we set in the buff
            actual_healing = self.nina.heal(healing)
            if actual_healing > 0:
                self.battle_log.add_message(
                    f"{self.nina.name} heals for {actual_healing} HP while hidden!",
                    "heal"
                )
                self.create_healing_effect(self.nina.position)
        
        # Update cooldowns only (remove buff updates from here)
        self.update_cooldowns()
        
        # Enable abilities
        self.enable_abilities()
        
        self.battle_log.add_message(
            f"Turn {self.turn_counter} - Player's turn!",
            "turn"
        )

    def end_player_turn(self):
        """End the player's turn and start enemy turn"""
        self.current_turn = "enemy"
        self.waiting_for_turn = True
        self.ai_thinking = False
        
        # Update turn counter message based on active enemies
        enemies_alive = [e for e in self.enemies if e.current_hp > 0]
        if enemies_alive:
            enemy_names = ", ".join(e.name for e in enemies_alive)
            self.battle_log.add_message(
                f"Turn {self.turn_counter} complete - Starting Enemy Turn!",
                "turn"
            )

    def handle_pitchfork(self, target):
        """Handle Pig's Pitchfork attack"""
        # Start attack animation
        self.start_attack_animation(self.pig, target)
        
        # Calculate 5% of target's max HP
        damage = int(target.max_hp * 0.05)
        damage_dealt = self.take_damage(target, damage)
        
        if damage_dealt:
            self.battle_log.add_message(
                f"{self.pig.name} uses Pitchfork! Deals {damage_dealt} damage (5% max HP)!",
                "damage"
            )

    def handle_feed_of_feast(self, target):
        """Handle Pig's Feed of Feast ability"""
        if self.pig.passive_heal > 0:  # Only if there's a recorded heal amount
            # Start attack animation
            self.start_attack_animation(self.pig, target)
            
            damage = self.pig.passive_heal * 3
            damage_dealt = self.take_damage(target, damage)
            
            if damage_dealt:
                self.battle_log.add_message(
                    f"{self.pig.name} uses Feed of Feast! Converts {self.pig.passive_heal} healing into {damage_dealt} damage!",
                    "damage"
                )
                # Reset the passive heal after using it
                self.pig.passive_heal = 0

    def show_character_info(self, character):
        # Initial window setup with larger dimensions
        window_width = 800  # Increased from 600
        window_height = 600  # Increased from 400
        
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
        char_image = pygame.transform.scale(character.image, (300, 420))  # Increased from 200x280
        info_window.blit(char_image, (30, 60))  # Adjusted position
        
        # Draw character name at the top
        font = pygame.font.Font(None, 48)  # Increased font size
        name_text = font.render(character.name, True, (255, 255, 255))
        info_window.blit(name_text, (30, 10))
        
        # Draw close button
        close_text = font.render("×", True, (255, 255, 255))
        close_rect = close_text.get_rect(topright=(window_width - 20, 10))
        info_window.blit(close_text, close_rect)
        
        # Right side content with adjusted positioning
        content_x = 360  # Adjusted for larger image
        content_y = 60
        content_width = window_width - content_x - 30
        
        # Draw passive ability if character has one
        if any(hasattr(character, attr) for attr in ['passive_heal', 'passive_damage_boost', 'passive_dodge']):
            content_y = self.draw_passive_section(info_window, character, content_x, content_y, content_width)
            content_y += 30  # Increased spacing
        
        # Draw abilities section
        font = pygame.font.Font(None, 36)  # Slightly smaller than title
        small_font = pygame.font.Font(None, 28)  # Increased from 24
        
        # Draw "Abilities" header
        abilities_text = font.render("Abilities", True, (255, 200, 100))
        info_window.blit(abilities_text, (content_x, content_y))
        content_y += 40
        
        for ability in character.abilities:
            # Draw ability icon (using the actual ability icon)
            icon_size = 50  # Increased from 40
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
                if content_y + 35 + i * 25 > window_height - 20:  # Adjusted spacing
                    break
                desc_text = small_font.render(line, True, (200, 200, 200))
                info_window.blit(desc_text, (content_x + icon_size + 15, content_y + 35 + i * 25))
            
            content_y += max(len(desc_lines) * 25 + 45, icon_size + 20)  # Adjusted spacing
            
            # Break if we're running out of space
            if content_y > window_height - 40:
                break
        
        # Draw active buffs/debuffs if there's space
        if character.buffs and content_y < window_height - 80:  # Adjusted spacing
            buffs_text = font.render("Active Effects", True, (255, 200, 100))
            info_window.blit(buffs_text, (content_x, content_y))
            content_y += 40
            
            for buff in character.buffs:
                if content_y > window_height - 30:
                    break
                buff_text = small_font.render(f"• {buff.name} ({buff.duration} turns)", True, (200, 200, 200))
                info_window.blit(buff_text, (content_x + 15, content_y))
                content_y += 30  # Increased spacing
        
        # Update window surface
        self.info_window['surface'] = info_window

    def draw_passive_section(self, surface, character, x, y, max_width):
        font = pygame.font.Font(None, 36)  # Consistent with other headers
        small_font = pygame.font.Font(None, 28)  # Increased from 24
        
        # Draw passive header
        passive_text = font.render("Passive Ability", True, (255, 200, 100))
        surface.blit(passive_text, (x, y))
        y += 40  # Increased spacing
        
        # Get passive description based on character type
        if hasattr(character, 'passive_heal'):
            desc = f"Healing Passive: Heals for 35% of damage taken"
            stored = f"Current stored healing: {character.passive_heal}"
        elif hasattr(character, 'passive_damage_boost'):
            desc = f"Rage Passive: Gains 1% increased damage when hit"
            stored = f"Current damage bonus: {character.passive_damage_boost}%"
        elif hasattr(character, 'passive_dodge'):
            desc = f"Evasion Passive: Gains 1% dodge chance each turn"
            stored = f"Current dodge chance: {character.dodge_chance}%"
        
        # Word wrap description
        words = desc.split()
        lines = []
        current_line = []
        
        for word in words:
            current_line.append(word)
            if small_font.size(" ".join(current_line))[0] > max_width:
                lines.append(" ".join(current_line[:-1]))
                current_line = [word]
        
        if current_line:
            lines.append(" ".join(current_line))
        
        # Draw description lines
        for line in lines:
            desc_text = small_font.render(line, True, (200, 200, 200))
            surface.blit(desc_text, (x, y))
            y += 25  # Increased spacing
        
        # Draw stored value
        stored_text = small_font.render(stored, True, (200, 200, 200))
        surface.blit(stored_text, (x, y + 10))  # Added extra padding
        
        return y + 35  # Increased return spacing

    def handle_enemy_death(self, enemy):
        """Handle drops when an enemy dies"""
        if not hasattr(enemy, 'drops_handled'):
            drops = self.generate_enemy_drops(enemy)
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
                            f"{enemy.name} dropped {drop['quantity']}x {item['name']}!",
                            "loot"
                        )
            enemy.drops_handled = True

    def generate_enemy_drops(self, enemy):
        """Generate drops for a specific enemy"""
        drops = []
        
        # Each enemy drops 1-3 health potions
        potion_quantity = random.randint(1, 3)
        drops.append({
            "id": "health_potion",
            "quantity": potion_quantity
        })
        
        # Debug print to verify drops
        print(f"{enemy.name} Drops:", drops)
        
        return drops