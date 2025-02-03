import pygame
import random
import math
from typing import List, Dict, Optional

class ModifierSelector:
    def __init__(self, screen: pygame.Surface, modifier_manager):
        self.screen = screen
        self.modifier_manager = modifier_manager
        self.clock = pygame.time.Clock()
        
        # UI properties
        self.card_width = 300
        self.card_height = 400
        self.padding = 40
        self.selected_modifier = None
        self.hover_modifier = None
        self.hover_start = 0
        self.hover_duration = 200
        
        # Colors
        self.colors = {
            "common": (160, 160, 160),  # Gray
            "rare": (65, 105, 225),     # Royal Blue
            "epic": (153, 50, 204),     # Purple
            "legendary": (255, 215, 0)   # Gold
        }
        
        # Animation properties
        self.animation_progress = 0
        self.animation_speed = 0.05
        self.cards_visible = False
        
    def get_color_transition(self, base_color: tuple, progress: float) -> tuple:
        """Create a glowing effect by transitioning colors"""
        glow_color = (255, 255, 255)
        return tuple(int(base + (glow - base) * progress) 
                    for base, glow in zip(base_color, glow_color))
    
    def draw_card(self, modifier: Dict, x: int, y: int, hover_progress: float = 0):
        # Card background with rarity color
        base_color = self.colors.get(modifier["rarity"], (100, 100, 100))
        current_color = self.get_color_transition(base_color, hover_progress * 0.3)
        
        # Draw card with glow effect
        glow_size = int(hover_progress * 10)
        if glow_size > 0:
            glow_surface = pygame.Surface((self.card_width + glow_size*2, self.card_height + glow_size*2), pygame.SRCALPHA)
            pygame.draw.rect(glow_surface, (*current_color, 100),
                           (0, 0, self.card_width + glow_size*2, self.card_height + glow_size*2),
                           border_radius=15)
            self.screen.blit(glow_surface, (x - glow_size, y - glow_size))
        
        # Main card body
        pygame.draw.rect(self.screen, (30, 30, 40),
                        (x, y, self.card_width, self.card_height),
                        border_radius=15)
        
        # Try to load and draw icon
        try:
            icon = pygame.image.load(modifier["icon_path"])
            icon = pygame.transform.scale(icon, (64, 64))
            icon_rect = icon.get_rect(centerx=x + self.card_width//2, top=y + 20)
            self.screen.blit(icon, icon_rect)
        except:
            # Fallback if icon loading fails
            pygame.draw.rect(self.screen, current_color,
                           (x + self.card_width//2 - 32, y + 20, 64, 64))
        
        # Draw modifier name with rarity color
        font_large = pygame.font.Font(None, 36)
        name_text = font_large.render(modifier["name"], True, current_color)
        name_rect = name_text.get_rect(centerx=x + self.card_width//2, top=y + 100)
        self.screen.blit(name_text, name_rect)
        
        # Draw rarity with matching color
        font_small = pygame.font.Font(None, 24)
        rarity_text = font_small.render(modifier["rarity"].capitalize(), True, current_color)
        rarity_rect = rarity_text.get_rect(centerx=x + self.card_width//2, top=y + 140)
        self.screen.blit(rarity_text, rarity_rect)
        
        # Draw description with word wrap
        desc_font = pygame.font.Font(None, 24)
        words = modifier["description"].split()
        lines = []
        current_line = []
        
        for word in words:
            test_line = " ".join(current_line + [word])
            if desc_font.size(test_line)[0] <= self.card_width - 40:
                current_line.append(word)
            else:
                lines.append(" ".join(current_line))
                current_line = [word]
        if current_line:
            lines.append(" ".join(current_line))
        
        y_offset = 180
        for line in lines:
            desc_text = desc_font.render(line, True, (200, 200, 200))
            desc_rect = desc_text.get_rect(centerx=x + self.card_width//2, top=y + y_offset)
            self.screen.blit(desc_text, desc_rect)
            y_offset += 25
        
        # Draw border with rarity color
        pygame.draw.rect(self.screen, current_color,
                        (x, y, self.card_width, self.card_height),
                        width=2, border_radius=15)
    
    def draw(self):
        # Draw dark semi-transparent background
        overlay = pygame.Surface(self.screen.get_size(), pygame.SRCALPHA)
        overlay.fill((20, 20, 30, int(255 * self.animation_progress)))
        self.screen.blit(overlay, (0, 0))
        
        if not self.cards_visible:
            return
        
        # Draw title with fade-in effect
        font_large = pygame.font.Font(None, 64)
        title = font_large.render("Choose a Modifier", True, (255, 255, 255))
        title.set_alpha(int(255 * self.animation_progress))
        title_rect = title.get_rect(centerx=self.screen.get_width()//2, top=50)
        self.screen.blit(title, title_rect)
        
        # Get available modifiers
        modifiers = self.modifier_manager.get_available_modifiers(3)
        
        # Calculate positions for modifier cards
        total_width = len(modifiers) * (self.card_width + self.padding) - self.padding
        start_x = (self.screen.get_width() - total_width) // 2
        base_y = (self.screen.get_height() - self.card_height) // 2
        
        current_time = pygame.time.get_ticks()
        
        # Draw each modifier card
        for i, modifier in enumerate(modifiers):
            # Calculate card position with staggered animation
            card_progress = max(0, min(1, (self.animation_progress - i * 0.2) * 2))
            if card_progress == 0:
                continue
                
            x = start_x + i * (self.card_width + self.padding)
            y = base_y + (1 - card_progress) * 100  # Slide up animation
            
            # Handle hover effect
            card_rect = pygame.Rect(x, y, self.card_width, self.card_height)
            is_hovered = card_rect.collidepoint(pygame.mouse.get_pos())
            
            if is_hovered:
                if self.hover_modifier != modifier:
                    self.hover_modifier = modifier
                    self.hover_start = current_time
                hover_progress = min(1.0, (current_time - self.hover_start) / self.hover_duration)
                y -= 20 * hover_progress
            elif self.hover_modifier == modifier:
                hover_progress = 1.0 - min(1.0, (current_time - self.hover_start) / self.hover_duration)
                y -= 20 * hover_progress
                if hover_progress == 0:
                    self.hover_modifier = None
            else:
                hover_progress = 0
            
            # Draw the card with current animation progress
            self.draw_card(modifier, x, y, hover_progress)
    
    def handle_click(self, pos) -> Optional[Dict]:
        """Handle click events and return the selected modifier if one was chosen"""
        if not self.cards_visible:
            return None
            
        modifiers = self.modifier_manager.get_available_modifiers(3)
        total_width = len(modifiers) * (self.card_width + self.padding) - self.padding
        start_x = (self.screen.get_width() - total_width) // 2
        start_y = (self.screen.get_height() - self.card_height) // 2
        
        for i, modifier in enumerate(modifiers):
            x = start_x + i * (self.card_width + self.padding)
            card_rect = pygame.Rect(x, start_y, self.card_width, self.card_height)
            if card_rect.collidepoint(pos):
                return modifier
        return None
    
    def show(self) -> Optional[Dict]:
        """Show the modifier selection screen and return the chosen modifier"""
        self.animation_progress = 0
        self.cards_visible = False
        
        while True:
            self.clock.tick(60)
            
            # Handle animation
            if self.animation_progress < 1:
                self.animation_progress = min(1, self.animation_progress + self.animation_speed)
                if self.animation_progress >= 0.5 and not self.cards_visible:
                    self.cards_visible = True
            
            # Handle events
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    return None
                elif event.type == pygame.MOUSEBUTTONDOWN:
                    modifier = self.handle_click(event.pos)
                    if modifier:
                        return modifier
                elif event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_ESCAPE:
                        return None
            
            # Draw the UI
            self.draw()
            pygame.display.flip() 