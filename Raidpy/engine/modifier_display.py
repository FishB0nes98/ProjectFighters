import pygame
import math

class ModifierDisplay:
    def __init__(self, screen, position):
        self.screen = screen
        self.position = position
        self.width = 300
        self.height = 100
        self.padding = 15
        self.hover_progress = 0
        self.hover_speed = 0.1
        self.is_hovered = False
        self.hover_start = 0
        
        # Colors
        self.colors = {
            "common": (160, 160, 160),     # Gray
            "rare": (65, 105, 225),        # Royal Blue
            "epic": (153, 50, 204),        # Purple
            "legendary": (255, 215, 0),    # Gold
            "background": (30, 30, 40),    # Dark background
            "text": (255, 255, 255),       # White text
            "tooltip_bg": (40, 40, 50, 230) # Semi-transparent dark
        }
        
        # Tooltip properties
        self.tooltip_padding = 10
        self.tooltip_width = 250
        self.tooltip_font = pygame.font.Font(None, 20)
        
    def get_glow_color(self, base_color, progress):
        """Create a glowing effect by transitioning colors"""
        glow_color = (255, 255, 255)
        return tuple(int(base + (glow - base) * progress) 
                    for base, glow in zip(base_color, glow_color))
    
    def draw_tooltip(self, modifier):
        """Draw a detailed tooltip when hovering"""
        if not self.is_hovered or not modifier:
            return
            
        # Calculate tooltip position (above the modifier box)
        mouse_pos = pygame.mouse.get_pos()
        tooltip_x = min(mouse_pos[0], self.screen.get_width() - self.tooltip_width - self.tooltip_padding)
        tooltip_y = self.position[1] - 120  # Above the modifier box
        
        # Split description into lines
        words = modifier["description"].split()
        lines = []
        current_line = []
        
        for word in words:
            test_line = " ".join(current_line + [word])
            if self.tooltip_font.size(test_line)[0] <= self.tooltip_width - 2 * self.tooltip_padding:
                current_line.append(word)
            else:
                lines.append(" ".join(current_line))
                current_line = [word]
        if current_line:
            lines.append(" ".join(current_line))
            
        # Calculate tooltip height based on content
        line_height = self.tooltip_font.get_linesize()
        tooltip_height = (len(lines) + 3) * line_height + 2 * self.tooltip_padding
        
        # Draw tooltip background with animation
        alpha = int(255 * self.hover_progress)
        tooltip_surface = pygame.Surface((self.tooltip_width, tooltip_height), pygame.SRCALPHA)
        tooltip_surface.fill((*self.colors["tooltip_bg"][:3], int(self.colors["tooltip_bg"][3] * self.hover_progress)))
        
        # Draw tooltip content
        y_offset = self.tooltip_padding
        
        # Draw name with rarity color
        name_color = self.colors.get(modifier["rarity"], self.colors["common"])
        name_text = self.tooltip_font.render(modifier["name"], True, name_color)
        name_rect = name_text.get_rect(topleft=(self.tooltip_padding, y_offset))
        tooltip_surface.blit(name_text, name_rect)
        y_offset += line_height * 1.5
        
        # Draw rarity
        rarity_text = self.tooltip_font.render(modifier["rarity"].capitalize(), True, name_color)
        tooltip_surface.blit(rarity_text, (self.tooltip_padding, y_offset))
        y_offset += line_height * 1.5
        
        # Draw description
        for line in lines:
            text = self.tooltip_font.render(line, True, self.colors["text"])
            tooltip_surface.blit(text, (self.tooltip_padding, y_offset))
            y_offset += line_height
        
        # Draw border with rarity color
        pygame.draw.rect(tooltip_surface, name_color, 
                        tooltip_surface.get_rect(), 2, border_radius=5)
        
        # Blit tooltip to screen
        self.screen.blit(tooltip_surface, (tooltip_x, tooltip_y))
    
    def draw(self, character):
        """Draw the modifier display with animations"""
        if not hasattr(character, 'modifier_effect') or not character.modifier_effect:
            return
            
        current_time = pygame.time.get_ticks()
        
        # Check if mouse is hovering
        mouse_pos = pygame.mouse.get_pos()
        box_rect = pygame.Rect(self.position[0], self.position[1], self.width, self.height)
        
        if box_rect.collidepoint(mouse_pos):
            if not self.is_hovered:
                self.is_hovered = True
                self.hover_start = current_time
        else:
            if self.is_hovered:
                self.is_hovered = False
                self.hover_start = current_time
        
        # Update hover progress
        if self.is_hovered:
            self.hover_progress = min(1.0, self.hover_progress + self.hover_speed)
        else:
            self.hover_progress = max(0.0, self.hover_progress - self.hover_speed)
        
        # Get modifier info
        modifier = character.modifier_effect.modifier if hasattr(character.modifier_effect, 'modifier') else None
        if not modifier:
            return
            
        # Draw main box with glow effect
        base_color = self.colors.get(modifier["rarity"], self.colors["common"])
        current_color = self.get_glow_color(base_color, self.hover_progress * 0.3)
        
        # Draw glow effect
        glow_size = int(self.hover_progress * 10)
        if glow_size > 0:
            glow_surface = pygame.Surface((self.width + glow_size*2, self.height + glow_size*2), pygame.SRCALPHA)
            pygame.draw.rect(glow_surface, (*current_color, 100),
                           (0, 0, self.width + glow_size*2, self.height + glow_size*2),
                           border_radius=10)
            self.screen.blit(glow_surface, 
                           (self.position[0] - glow_size, self.position[1] - glow_size))
        
        # Draw main box
        box_surface = pygame.Surface((self.width, self.height), pygame.SRCALPHA)
        pygame.draw.rect(box_surface, self.colors["background"],
                        (0, 0, self.width, self.height),
                        border_radius=10)
        
        # Draw icon
        try:
            icon = pygame.image.load(modifier["icon_path"])
            icon = pygame.transform.scale(icon, (64, 64))
            icon_rect = icon.get_rect(midleft=(self.padding, self.height//2))
            box_surface.blit(icon, icon_rect)
        except:
            # Fallback if icon loading fails
            pygame.draw.rect(box_surface, current_color,
                           (self.padding, self.height//2 - 32, 64, 64))
        
        # Draw modifier name
        font = pygame.font.Font(None, 28)
        name_text = font.render(modifier["name"], True, current_color)
        name_rect = name_text.get_rect(
            midleft=(self.padding * 2 + 64, self.height//2)
        )
        box_surface.blit(name_text, name_rect)
        
        # Draw border with rarity color
        pygame.draw.rect(box_surface, current_color,
                        (0, 0, self.width, self.height),
                        width=2, border_radius=10)
        
        # Blit the box to screen
        self.screen.blit(box_surface, self.position)
        
        # Draw tooltip if hovered
        self.draw_tooltip(modifier) 