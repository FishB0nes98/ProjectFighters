import pygame
from engine.tooltip import TooltipManager

class CharacterSelect:
    def __init__(self, screen):
        self.screen = screen
        self.selected_character = None
        
        # Load character portraits
        self.portraits = {
            "Cham Cham": {
                "image": pygame.image.load("Raidpy/res/img/Cham_Cham_portrait.png"),
                "description": (
                    "Farmer Cham Cham\n"
                    "───────────────\n"
                    "• Passive: Scratch damage increases permanently\n"
                    "• Excels at single target damage\n"
                    "• Strong lifesteal potential\n"
                    "• Abilities scale with fights"
                ),
                "abilities": [
                    ("Scratch", "Basic attack that permanently increases in damage"),
                    ("Fertilizer Heal", "Gain lifesteal for 4 turns"),
                    ("Seed Boomerang", "Double-hitting attack that reduces cooldowns"),
                    ("Rapid Claws", "Six rapid strikes with increasing damage")
                ]
            },
            "Shoma": {
                "image": pygame.image.load("Raidpy/res/img/Shoma_portrait.png"),
                "description": (
                    "Farmer Shoma\n"
                    "───────────────\n"
                    "• Passive: None\n"
                    "• Versatile toolkit\n"
                    "• Can support allies\n"
                    "• Strong critical hits"
                ),
                "abilities": [
                    ("Boink", "50% chance to deal double damage"),
                    ("Apple Toss", "Heal ally or damage and debuff enemy"),
                    ("Catch!", "Grant ally high dodge chance"),
                    ("Teamwork", "Buff all allies' damage and dodge")
                ]
            },
            "Nina": {
                "image": pygame.image.load("Raidpy/res/img/Nina_portrait.png"),
                "description": (
                    "Farmer Nina\n"
                    "───────────────\n"
                    "• Passive: None\n"
                    "• High burst damage\n"
                    "• Can become untargetable\n"
                    "• Strong execute potential"
                ),
                "abilities": [
                    ("Quick Shot", "Basic attack that deals bonus damage to marked targets"),
                    ("Targeted", "Mark enemy to take increased damage"),
                    ("Hide", "Become untargetable and heal each turn"),
                    ("Rain of Arrows", "AoE damage that triples on low HP targets")
                ]
            }
        }
        
        # Scale portraits
        portrait_size = (300, 400)
        for char_data in self.portraits.values():
            char_data["image"] = pygame.transform.scale(char_data["image"], portrait_size)
            
        # Calculate positions
        screen_width = screen.get_width()
        screen_height = screen.get_height()
        spacing = 100
        total_width = (len(self.portraits) * portrait_size[0]) + ((len(self.portraits) - 1) * spacing)
        start_x = (screen_width - total_width) // 2
        
        # Create character cards
        self.character_cards = {}
        for i, (name, data) in enumerate(self.portraits.items()):
            x = start_x + (i * (portrait_size[0] + spacing))
            y = (screen_height - portrait_size[1]) // 2 - 50
            self.character_cards[name] = {
                "rect": pygame.Rect(x, y, portrait_size[0], portrait_size[1]),
                "hover": False,
                "hover_start": 0
            }
        
        # Fonts
        self.title_font = pygame.font.Font(None, 72)
        self.char_font = pygame.font.Font(None, 48)
        self.desc_font = pygame.font.Font(None, 24)
        
        # Pre-render title
        self.title = self.title_font.render("Select Your Character", True, (255, 255, 255))
        self.title_rect = self.title.get_rect(centerx=screen_width//2, top=50)

    def draw(self):
        # Draw dark semi-transparent background
        overlay = pygame.Surface(self.screen.get_size())
        overlay.fill((20, 20, 30))
        self.screen.blit(overlay, (0, 0))
        
        # Draw title
        self.screen.blit(self.title, self.title_rect)
        
        # Draw character cards
        current_time = pygame.time.get_ticks()
        mouse_pos = pygame.mouse.get_pos()
        
        for name, card in self.character_cards.items():
            # Check hover
            is_hovered = card["rect"].collidepoint(mouse_pos)
            if is_hovered and not card["hover"]:
                card["hover"] = True
                card["hover_start"] = current_time
            elif not is_hovered:
                card["hover"] = False
            
            # Calculate hover effect
            if card["hover"]:
                hover_progress = min(1.0, (current_time - card["hover_start"]) / 200)
                y_offset = -20 * hover_progress
            else:
                y_offset = 0
            
            # Draw card background
            card_color = (50, 50, 60) if is_hovered else (40, 40, 50)
            pygame.draw.rect(self.screen, card_color, 
                           (card["rect"].x - 10, card["rect"].y - 10 + y_offset,
                            card["rect"].width + 20, card["rect"].height + 20),
                           border_radius=15)
            
            # Draw portrait
            self.screen.blit(self.portraits[name]["image"], 
                           (card["rect"].x, card["rect"].y + y_offset))
            
            # Draw name
            name_text = self.char_font.render(name, True, (255, 255, 255))
            name_rect = name_text.get_rect(centerx=card["rect"].centerx,
                                         top=card["rect"].bottom + 20 + y_offset)
            self.screen.blit(name_text, name_rect)
            
            # Show tooltip on hover
            if is_hovered:
                TooltipManager().start_hover(
                    id(card),
                    self.portraits[name]["description"] + "\n\nAbilities:\n" +
                    "\n".join(f"• {name}: {desc}" for name, desc in self.portraits[name]["abilities"]),
                    mouse_pos
                )
            else:
                TooltipManager().stop_hover(id(card))
        
        # Draw tooltips
        TooltipManager().draw_all(self.screen)

    def handle_events(self, events):
        for event in events:
            if event.type == pygame.MOUSEBUTTONDOWN:
                for name, card in self.character_cards.items():
                    if card["rect"].collidepoint(event.pos):
                        self.selected_character = name
                        return True
        return False

    def get_selected_character(self):
        return self.selected_character 