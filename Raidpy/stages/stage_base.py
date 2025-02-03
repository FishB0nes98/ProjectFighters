import pygame
import sys
import random
from engine.debug_window import DebugWindow
from engine.target import Target
from typing import List
from engine.character import Character
from engine.buff import Buff
from engine.battle_log import BattleLog
from engine.inventory import Inventory
from engine.modifier_manager import ModifierManager

class Stage:
    def __init__(self, screen):
        self.screen = screen
        self.running = True
        self.completed = False
        self.background = None
        self.player = None
        self.boss = None
        self.inventory = None
        self.turn_counter = 1
        self.paused = False
        self.clock = pygame.time.Clock()
        self.current_turn = "player"
        self.waiting_for_turn = False
        self.debug_window = DebugWindow(screen)
        self.show_fps = False
        self.menu_state = "main"
        
        # Pre-render common menu surfaces
        self.menu_overlay = pygame.Surface((screen.get_width(), screen.get_height()))
        self.menu_overlay.fill((0, 0, 0))
        self.menu_overlay.set_alpha(128)
        
        # Cache font
        self.menu_font = pygame.font.Font(None, 64)
        
        # Pre-render common menu text
        self.menu_texts = {
            'resume': self.menu_font.render("Resume", True, (255, 255, 255)),
            'options': self.menu_font.render("Options", True, (255, 255, 255)),
            'debug': self.menu_font.render("Debug", True, (255, 255, 255)),
            'quit': self.menu_font.render("Quit Game", True, (255, 255, 255)),
            'back': self.menu_font.render("Back", True, (255, 255, 255)),
            'fps': self.menu_font.render("Show FPS", True, (255, 255, 255))
        }
        
        # Cache menu positions
        screen_center_x = screen.get_width() // 2
        screen_center_y = screen.get_height() // 2
        self.menu_positions = {
            'resume': (screen_center_x, screen_center_y - 150),
            'options': (screen_center_x, screen_center_y - 50),
            'debug': (screen_center_x, screen_center_y + 50),
            'quit': (screen_center_x, screen_center_y + 150),
            'back': (screen_center_x, screen_center_y + 100),
            'fps': (screen_center_x, screen_center_y - 50)
        }

        self.turn_effects = []  # Track turn-based effects
        self.used_second_chance = set()  # Track which characters used second chance
        self.shield_buff = None  # Store shield buff reference

    def load_resources(self):
        """Load basic resources needed for all stages"""
        # Create battle log
        self.battle_log = BattleLog(self.screen)
        
        # Create inventory
        screen_height = self.screen.get_height()
        self.inventory = Inventory((20, screen_height // 2 - 150))
        
        # Load items
        if hasattr(self, 'firebase'):
            self.inventory.load_items(self.firebase)
        
        # Initialize particles list
        self.healing_particles = []
        
        # Initialize combat variables
        self.current_turn = "player"
        self.waiting_for_turn = False
        self.ai_thinking = False
        self.ai_think_duration = 1000  # 1 second
        self.turn_counter = 1
        
        # Initialize animation variables
        self.attacking = False
        self.attack_start = 0
        self.attack_duration = 500  # 0.5 seconds
        self.attacker = None
        self.target = None
        self.original_pos = None
        
        # Initialize damage flash effect
        self.damage_flash = {
            "player": 0,
            "boss": 0
        }
        self.damage_flash_duration = 200  # 0.2 seconds
        
        # Initialize targeting mode
        self.targeting_mode = False
        self.current_ability = None
        self.targets = []
        
    def draw_menu(self):
        """Optimized menu drawing using pre-rendered surfaces"""
        # Draw semi-transparent overlay
        self.screen.blit(self.menu_overlay, (0, 0))
        
        menu_items = {}
        
        if self.menu_state == "main":
            for text_key in ['resume', 'options', 'debug', 'stage_select', 'quit']:
                text_surface = self.menu_texts.get(text_key) or self.menu_font.render("Stage Select", True, (255, 255, 255))
                pos = self.menu_positions.get(text_key) or (
                    self.screen.get_width() // 2,
                    self.screen.get_height() // 2
                )
                text_rect = text_surface.get_rect(center=pos)
                self.screen.blit(text_surface, text_rect)
                menu_items[text_key] = text_rect
                
        elif self.menu_state == "debug":
            # Draw debug menu items
            debug_items = {
                'damage_enemies': "Set All Enemies HP to 1",
                'damage_boss': "Set Boss HP to 50%",
                'damage_boss_1hp': "Set Boss HP to 1",
                'damage_carrots': "Set Mini Carrots HP to 1",
                'chicken_dodge': "Set Chicken Dodge to 90%",
                'back': "Back"
            }
            
            y_pos = self.screen.get_height() // 2 - 100
            for key, text in debug_items.items():
                if key not in self.menu_texts:
                    self.menu_texts[key] = self.menu_font.render(text, True, (255, 255, 255))
                text_surface = self.menu_texts[key]
                text_rect = text_surface.get_rect(center=(self.screen.get_width() // 2, y_pos))
                self.screen.blit(text_surface, text_rect)
                menu_items[key] = text_rect
                y_pos += 50
                
        elif self.menu_state == "options":
            # Draw back button and FPS checkbox
            for text_key in ['back', 'fps']:
                text_surface = self.menu_texts[text_key]
                pos = self.menu_positions[text_key]
                text_rect = text_surface.get_rect(center=pos)
                self.screen.blit(text_surface, text_rect)
                menu_items[text_key] = text_rect
            
            # Draw FPS checkbox
            fps_rect = self.menu_texts['fps'].get_rect(center=self.menu_positions['fps'])
            checkbox_rect = pygame.Rect(fps_rect.right + 20, fps_rect.centery - 10, 20, 20)
            pygame.draw.rect(self.screen, (255, 255, 255), checkbox_rect, 2)
            if self.show_fps:
                pygame.draw.line(self.screen, (255, 255, 255), 
                               (checkbox_rect.left + 3, checkbox_rect.centery),
                               (checkbox_rect.centerx, checkbox_rect.bottom - 3), 2)
                pygame.draw.line(self.screen, (255, 255, 255),
                               (checkbox_rect.centerx, checkbox_rect.bottom - 3),
                               (checkbox_rect.right - 3, checkbox_rect.top + 3), 2)
            menu_items['fps_check'] = checkbox_rect
        
        return menu_items
        
    def handle_events(self, events):
        for event in events:
            if event.type == pygame.QUIT:
                self.running = False
                pygame.quit()
                sys.exit()
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    if self.menu_state in ["options", "debug"]:
                        self.menu_state = "main"
                    else:
                        self.paused = not self.paused
                        self.menu_state = "main"
                    return True
            elif event.type == pygame.MOUSEBUTTONDOWN and self.paused:
                menu_items = self.draw_menu()
                mouse_pos = event.pos
                
                if self.menu_state == "main":
                    if menu_items["resume"].collidepoint(mouse_pos):
                        self.paused = False
                    elif menu_items["options"].collidepoint(mouse_pos):
                        self.menu_state = "options"
                    elif menu_items["debug"].collidepoint(mouse_pos):
                        self.menu_state = "debug"
                    elif menu_items["stage_select"].collidepoint(mouse_pos):
                        # Return to stage selector
                        self.running = False
                        return True
                    elif menu_items["quit"].collidepoint(mouse_pos):
                        pygame.quit()
                        sys.exit()
                elif self.menu_state == "debug":
                    if menu_items["back"].collidepoint(mouse_pos):
                        self.menu_state = "main"
                    elif menu_items.get("damage_boss") and menu_items["damage_boss"].collidepoint(mouse_pos):
                        if hasattr(self, 'boss'):
                            self.boss.current_hp = self.boss.max_hp // 2
                    elif menu_items.get("damage_boss_1hp") and menu_items["damage_boss_1hp"].collidepoint(mouse_pos):
                        if hasattr(self, 'boss'):
                            self.boss.current_hp = 1
                    elif menu_items.get("damage_carrots") and menu_items["damage_carrots"].collidepoint(mouse_pos):
                        if hasattr(self, 'mini_carrots'):
                            for carrot in self.mini_carrots:
                                carrot.current_hp = 1
                    elif menu_items.get("chicken_dodge") and menu_items["chicken_dodge"].collidepoint(mouse_pos):
                        if hasattr(self, 'chicken'):
                            self.chicken.dodge_chance = 90
                            self.battle_log.add_message(
                                f"Debug: Set {self.chicken.name}'s dodge chance to 90%!",
                                "system"
                            )
                elif self.menu_state == "options":
                    if menu_items["back"].collidepoint(mouse_pos):
                        self.menu_state = "main"
                    elif menu_items["fps_check"].collidepoint(mouse_pos):
                        self.show_fps = not self.show_fps
        return False
        
    def update(self):
        """Update stage logic"""
        pass
        
    def draw(self):
        """Draw stage elements"""
        pass
        
    def draw_fps(self):
        if self.show_fps:
            fps = int(self.clock.get_fps())
            font = pygame.font.Font(None, 36)
            fps_text = font.render(f"FPS: {fps}", True, (255, 255, 255))
            self.screen.blit(fps_text, (10, 10))
        
    def draw_turn_counter(self):
        font = pygame.font.Font(None, 48)
        text = font.render(f"Turn: {self.turn_counter}", True, (255, 255, 255))
        text_rect = text.get_rect()
        text_rect.topright = (self.screen.get_width() - 20, 20)
        self.screen.blit(text, text_rect)
        
    def run(self):
        """Main stage loop with optimized rendering"""
        self.load_resources()
        
        while self.running:
            # Limit frame rate
            self.clock.tick(60)
            
            # Handle events in batch
            events = pygame.event.get()
            if self.handle_events(events):
                continue
            
            # Only update and draw if not paused
            if not self.paused:
                self.update()
                self.draw()
                if self.show_fps:
                    self.draw_fps()
            else:
                # Use pre-rendered menu surfaces
                self.screen.blit(self.menu_overlay, (0, 0))
                self.draw_menu()
            
            # Single flip per frame
            pygame.display.flip()
        
        return self.completed
        
    def use_item(self, item):
        """Base method for using items"""
        if not self.current_turn == "player" or self.waiting_for_turn:
            return False

        if item['effect']['type'] == 'heal':
            # Create target for healing
            target = Target(self.player, item['icon_path'], 
                           (self.player.position[0] + 100, self.player.position[1] + 100))
            self.targets = [target]
            self.targeting_mode = True
            self.current_item = item
            return True

        elif item['effect']['type'] == 'currency':
            # Handle currency items (CM/FM)
            if item['id'] in ['cm', 'fm']:
                self.firebase.update_currency(
                    item['id'].upper(),  # Convert to uppercase for database
                    item['effect']['value']
                )
                self.battle_log.add_message(
                    f"Added {item['effect']['value']} {item['id'].upper()}!",
                    "item"
                )
                return True

        elif item['effect']['type'] == 'skin':
            # Handle skin unlocks
            if item['id'] == 'farmer_fang_skin':
                if not self.firebase.has_skin(item['id']):
                    self.firebase.unlock_skin(item['id'])
                    self.battle_log.add_message(
                        f"Unlocked {item['name']}!",
                        "item"
                    )
                else:
                    # Convert to currency if already owned
                    self.firebase.update_currency(
                        item['effect']['duplicate_currency'],
                        item['effect']['duplicate_value']
                    )
                    self.battle_log.add_message(
                        f"Already owned {item['name']}! Converted to {item['effect']['duplicate_value']} {item['effect']['duplicate_currency']}",
                        "item"
                    )
                return True

        return False

    def apply_turn_effects(self):
        """Apply effects that trigger each turn"""
        if not hasattr(self, 'modifier'):
            return

        effects = self.modifier.get("effects", {})
        
        # Growing Power
        if "growing_power_per_turn" in effects:
            power = effects["growing_power_per_turn"]
            for char in self.get_player_characters():
                char.damage_multiplier *= (1 + power)
                char.defense_multiplier *= (1 + power)

        # Lucky Shield
        if "shield_chance_per_turn" in effects:
            chance = effects["shield_chance_per_turn"]
            amount = effects["shield_amount"]
            for char in self.get_player_characters():
                if random.random() < chance:
                    self.apply_shield(char, amount)

        # HP Regeneration
        if "hp_regen_percent" in effects:
            regen = effects["hp_regen_percent"]
            for char in self.get_player_characters():
                heal_amount = int(char.max_hp * regen)
                char.heal(heal_amount)
                self.battle_log.add_message(
                    f"{char.name} regenerates {heal_amount} HP!",
                    "heal"
                )

        # Timed Explosion
        if "explosion_turns" in effects:
            if self.turn_counter in effects["explosion_turns"]:
                damage = effects["explosion_damage"]
                for enemy in self.get_enemies():
                    enemy.take_damage(damage)
                    self.battle_log.add_message(
                        f"Timed Explosion deals {damage} damage to {enemy.name}!",
                        "damage"
                    )

        # Full Heal at turn 20
        if "full_heal_turn" in effects and self.turn_counter == effects["full_heal_turn"]:
            for char in self.get_player_characters():
                heal_amount = char.max_hp - char.current_hp
                if heal_amount > 0:
                    char.heal(heal_amount)
                    self.battle_log.add_message(
                        f"{char.name} is fully healed!",
                        "heal"
                    )

    def check_second_chance(self, character, damage):
        """Check and apply second chance healing"""
        if not hasattr(self, 'modifier'):
            return

        effects = self.modifier.get("effects", {})
        if "heal_threshold" in effects and character not in self.used_second_chance:
            threshold = effects["heal_threshold"]
            if (character.current_hp - damage) / character.max_hp <= threshold:
                heal_percent = effects["heal_percent"]
                heal_amount = int(character.max_hp * heal_percent)
                character.heal(heal_amount)
                self.used_second_chance.add(character)
                self.battle_log.add_message(
                    f"{character.name}'s Second Chance activates! Heals for {heal_amount} HP!",
                    "heal"
                )

    def apply_shield(self, character, amount):
        """Apply shield to character"""
        if not self.shield_buff:
            self.shield_buff = Buff(
                "Shield",
                "Raidpy/res/img/shield_buff.webp",
                3,  # Duration
                "shield",
                amount
            )
        character.add_buff(self.shield_buff)
        self.battle_log.add_message(
            f"{character.name} gains {amount} Shield!",
            "system"
        )

    def check_ability_shield(self, character):
        """Check for shield proc on ability use"""
        if not hasattr(self, 'modifier'):
            return

        effects = self.modifier.get("effects", {})
        if "shield_chance" in effects:
            if random.random() < effects["shield_chance"]:
                self.apply_shield(character, effects["shield_amount"])

    def get_player_characters(self) -> List[Character]:
        """Get list of all player characters"""
        chars = [self.player]
        if hasattr(self, 'player2'):
            chars.append(self.player2)
        return chars

    def get_enemies(self) -> List[Character]:
        """Get list of all enemies"""
        if hasattr(self, 'enemies'):
            return self.enemies
        return [self.boss] if hasattr(self, 'boss') else []

    def end_player_turn(self):
        """Handle end of player turn"""
        self.turn_counter += 1
        self.apply_turn_effects()
        # ... rest of turn end code ...