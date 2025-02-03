import pygame
from engine.tooltip import Tooltip, TooltipManager
import os

# Get the project root directory (Raidpy folder)
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ITEMS_PATH = os.path.join(PROJECT_ROOT, 'data', 'items.json')

class InventorySlot:
    def __init__(self, position):
        self.position = position
        self.item = None
        self.rect = pygame.Rect(position[0], position[1], 50, 50)
        self.tooltip = Tooltip()
        self.hover_start = pygame.time.get_ticks()
        self.cooldown = 0  # Add cooldown tracking
        self.cooldown_max = 3  # 3 turns cooldown for potions

    def draw(self, surface, base_color, hover_color):
        # Draw slot background
        mouse_pos = pygame.mouse.get_pos()
        adjusted_rect = pygame.Rect(
            self.rect.x + surface.get_offset()[0],
            self.rect.y + surface.get_offset()[1],
            self.rect.width,
            self.rect.height
        )
        
        color = hover_color if adjusted_rect.collidepoint(mouse_pos) else base_color
        pygame.draw.rect(surface, color, self.rect)
        pygame.draw.rect(surface, (100, 100, 100), self.rect, 2)

        if self.item:
            if self.cooldown > 0:
                # Draw darkened background and item
                dark_overlay = pygame.Surface((50, 50))
                dark_overlay.fill((0, 0, 0))
                dark_overlay.set_alpha(128)
                surface.blit(dark_overlay, self.position)
                
                temp_surface = self.item['image'].copy()
                temp_surface.set_alpha(128)
                surface.blit(temp_surface, self.position)
                
                # Draw cooldown number
                self.draw_cooldown(surface)
            else:
                surface.blit(self.item['image'], self.position)
            
            # Draw stack count if > 1
            if self.item.get('count', 1) > 1:
                self.draw_stack_count(surface)

    def draw_tooltip(self, screen):
        if not self.item:
            return
        
        mouse_pos = pygame.mouse.get_pos()
        adjusted_rect = pygame.Rect(
            self.rect.x + screen.get_offset()[0],
            self.rect.y + screen.get_offset()[1],
            self.rect.width,
            self.rect.height
        )
        
        if adjusted_rect.collidepoint(mouse_pos):
            tooltip_text = f"{self.item['name']}\n{self.item['description']}"
            if self.cooldown > 0:
                tooltip_text += f"\nCooldown: {self.cooldown} turns"
            TooltipManager().start_hover(id(self), tooltip_text, mouse_pos)
        else:
            TooltipManager().stop_hover(id(self))

    def draw_cooldown(self, surface):
        # Draw cooldown number with outline
        font = pygame.font.Font(None, 36)
        cooldown_text = font.render(str(self.cooldown), True, (255, 255, 255))
        text_pos = (
            self.position[0] + 25 - cooldown_text.get_width()//2,
            self.position[1] + 25 - cooldown_text.get_height()//2
        )
        
        # Draw text outline
        outline_color = (0, 0, 0)
        for dx, dy in [(-1,-1), (-1,1), (1,-1), (1,1)]:
            outline = font.render(str(self.cooldown), True, outline_color)
            surface.blit(outline, (text_pos[0]+dx, text_pos[1]+dy))
        
        # Draw main text
        surface.blit(cooldown_text, text_pos)

    def draw_stack_count(self, surface):
        # Draw stack count if > 1
        count_text = pygame.font.Font(None, 24).render(
            str(self.item['count']), True, (255, 255, 255)
        )
        text_pos = (
            self.position[0] + 40 - count_text.get_width(),
            self.position[1] + 35
        )
        # Draw text shadow
        shadow = pygame.font.Font(None, 24).render(
            str(self.item['count']), True, (0, 0, 0)
        )
        surface.blit(shadow, (text_pos[0] + 1, text_pos[1] + 1))
        surface.blit(count_text, text_pos)

    def handle_click(self):
        if self.item and self.cooldown <= 0:
            return self.item
        return None

    def start_cooldown(self):
        self.cooldown = self.cooldown_max

    def update_cooldown(self):
        if self.cooldown > 0:
            self.cooldown -= 1

    def handle_event(self, event):
        if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:  # Left click only
            mouse_pos = pygame.mouse.get_pos()
            # Check if click is within inventory bounds
            if not (self.position[0] <= mouse_pos[0] <= self.position[0] + self.size[0] and
                   self.position[1] <= mouse_pos[1] <= self.position[1] + self.size[1]):
                return False

            relative_pos = (mouse_pos[0] - self.position[0], 
                          mouse_pos[1] - self.position[1])
            
            # Check for header drag
            if relative_pos[1] <= 40:
                self.dragging = True
                self.drag_offset = relative_pos
                return False
            
            # Check for resize
            elif (self.size[0] - 15 <= relative_pos[0] <= self.size[0] and 
                  self.size[1] - 15 <= relative_pos[1] <= self.size[1]):
                self.resizing = True
                return False
            
            # Check slot clicks
            for slot in self.slots:
                slot_rect = pygame.Rect(
                    self.position[0] + slot.position[0],
                    self.position[1] + slot.position[1],
                    50, 50
                )
                if slot_rect.collidepoint(mouse_pos):
                    if slot.item:
                        return slot.item
                    return False
                
        elif event.type == pygame.MOUSEBUTTONUP and event.button == 1:  # Left click release
            self.dragging = False
            self.resizing = False
            
        elif event.type == pygame.MOUSEMOTION:
            if self.dragging:
                self.position[0] = event.pos[0] - self.drag_offset[0]
                self.position[1] = event.pos[1] - self.drag_offset[1]
                self.recalculate_slots()
            
            elif self.resizing:
                self.size[0] = max(300, event.pos[0] - self.position[0])
                self.size[1] = max(400, event.pos[1] - self.position[1])
                self.recalculate_slots()
        
        return False

class Item:
    def __init__(self, name, image_path):
        self.name = name
        self.image = pygame.image.load(image_path)
        self.image = pygame.transform.scale(self.image, (50, 50))

class Inventory:
    def __init__(self, position):
        self.position = list(position)
        self.size = [300, 400]
        self.slots = []
        self.dragging = False
        self.drag_offset = (0, 0)
        self.slot_size = 60
        self.padding = 10
        self.columns = 4
        
        self._rect = pygame.Rect(self.position[0], self.position[1], self.size[0], self.size[1])
        
        self.recalculate_slots()
        
        # Visual settings
        self.bg_color = (30, 30, 30, 230)
        self.border_color = (100, 100, 100)
        self.slot_color = (50, 50, 50)
        self.hover_color = (70, 70, 70)
        
        self.font = pygame.font.Font(None, 24)
        self.header_rect = pygame.Rect(position[0], position[1], self.size[0], 40)

    def recalculate_slots(self):
        self.slots.clear()
        rows = (self.size[1] - 50) // (self.slot_size + self.padding)
        
        for row in range(rows):
            for col in range(self.columns):
                x = col * (self.slot_size + self.padding) + self.padding
                y = row * (self.slot_size + self.padding) + 50  # Start below header
                self.slots.append(InventorySlot((x, y)))

    def draw(self, screen):
        # Draw inventory background and slots
        surface = pygame.Surface(self.size, pygame.SRCALPHA)
        pygame.draw.rect(surface, (30, 30, 30, 230), (0, 0, *self.size))
        pygame.draw.rect(surface, (100, 100, 100), (0, 0, *self.size), 2)
        
        # Draw header
        pygame.draw.rect(surface, (50, 50, 50, 255), (0, 0, self.size[0], 30))
        title = self.font.render("Inventory", True, (220, 220, 220))
        surface.blit(title, (10, 5))
        
        # Draw slots
        for slot in self.slots:
            slot.draw(surface, (45, 45, 45), (60, 60, 60))
        
        screen.blit(surface, self.position)
        
        # Draw tooltips last
        for slot in self.slots:
            slot.draw_tooltip(screen)

    def handle_event(self, event):
        if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            mouse_pos = pygame.mouse.get_pos()
            
            # Check if click is within header bounds
            header_rect = pygame.Rect(self.position[0], self.position[1], self.size[0], 40)
            if header_rect.collidepoint(mouse_pos):
                self.dragging = True
                self.drag_offset = (mouse_pos[0] - self.position[0], mouse_pos[1] - self.position[1])
                return False
            
            # Check slot clicks
            for slot in self.slots:
                slot_rect = pygame.Rect(
                    self.position[0] + slot.position[0],
                    self.position[1] + slot.position[1],
                    50, 50
                )
                if slot_rect.collidepoint(mouse_pos):
                    if slot.item:
                        return slot.item
                    return False
                
        elif event.type == pygame.MOUSEBUTTONUP and event.button == 1:
            self.dragging = False
            
        elif event.type == pygame.MOUSEMOTION and self.dragging:
            mouse_pos = pygame.mouse.get_pos()
            new_x = max(0, min(mouse_pos[0] - self.drag_offset[0], 
                             self.screen.get_width() - self.size[0]))
            new_y = max(0, min(mouse_pos[1] - self.drag_offset[1], 
                             self.screen.get_height() - self.size[1]))
            self.position = [new_x, new_y]
            self.recalculate_slots()
        
        return False

    def load_items(self, firebase_manager):
        # Clear existing items
        for slot in self.slots:
            slot.item = None
            
        # Load items from Firebase
        items = firebase_manager.load_inventory()
        for item in items:
            try:
                # Load and scale item image
                item['image'] = pygame.image.load(item['icon_path'])
                item['image'] = pygame.transform.scale(item['image'], (50, 50))
                
                # Add effect data for health potion
                if item['id'] == 'health_potion':
                    item['effect'] = {
                        'type': 'heal',
                        'value': 1000  # Healing amount
                    }
                
                # Find empty slot
                for slot in self.slots:
                    if not slot.item:
                        slot.item = item
                        break
            except Exception as e:
                print(f"Failed to load item image: {e}")
        
    @property
    def rect(self):
        """Get the current rect based on position and size"""
        self._rect.x = self.position[0]
        self._rect.y = self.position[1]
        self._rect.width = self.size[0]
        self._rect.height = self.size[1]
        return self._rect
    
    def set_position(self, pos):
        """Update the inventory position"""
        self.position[0], self.position[1] = pos
        # Rect will update automatically through the property
        
    def draw_to_surface(self, surface):
        """Draw inventory to a specific surface instead of the screen"""
        # Draw background
        pygame.draw.rect(surface, (30, 30, 30, 230), 
                        (self.position[0], self.position[1], self.size[0], self.size[1]),
                        border_radius=10)
        pygame.draw.rect(surface, (100, 100, 100), 
                        (self.position[0], self.position[1], self.size[0], self.size[1]),
                        width=2, border_radius=10)
        
        # Draw slots
        for slot in self.slots:
            slot.draw(surface, (45, 45, 45), (60, 60, 60))
        