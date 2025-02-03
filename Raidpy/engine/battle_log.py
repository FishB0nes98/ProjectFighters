import pygame

class BattleLog:
    def __init__(self, screen, initial_pos=(10, 800)):
        self.screen = screen
        self.position = list(initial_pos)
        self.size = [400, 300]
        self.visible = True
        self.dragging = False
        self.resizing = False
        self.drag_offset = (0, 0)
        self.messages = []
        self.scroll_offset = 0
        self.max_messages = 100
        self.resize_handle_size = 15
        self.min_size = [200, 150]  # Minimum size for the battle log
        
        # Visual settings
        self.bg_color = (30, 30, 30, 200)
        self.text_color = (220, 220, 220)  # Slightly off-white
        self.border_color = (100, 100, 100)
        try:
            self.font = pygame.font.SysFont("segoeuiemoji", 16)  # Smaller font
        except:
            self.font = pygame.font.SysFont("arial", 16)
            
        # Message colors
        self.colors = {
            "damage": (255, 80, 80),      # Bright red
            "heal": (100, 255, 100),      # Bright green
            "system": (100, 180, 255),    # Bright blue
            "warning": (255, 200, 0),     # Bright yellow
            "turn": (200, 130, 255),      # Purple
            "item": (255, 160, 100)       # Orange
        }
        
    def is_point_in_close_button(self, point):
        close_btn = pygame.Rect(
            self.position[0] + self.size[0] - 25,
            self.position[1] + 5,
            20, 20
        )
        return close_btn.collidepoint(point)
    
    def is_point_in_header(self, point):
        header = pygame.Rect(
            self.position[0],
            self.position[1],
            self.size[0],
            30
        )
        return header.collidepoint(point)
    
    def is_point_in_resize_area(self, point):
        resize_area = pygame.Rect(
            self.position[0] + self.size[0] - 15,
            self.position[1] + self.size[1] - 15,
            15, 15
        )
        return resize_area.collidepoint(point)
    
    def is_point_in_log_area(self, point):
        log_area = pygame.Rect(
            self.position[0],
            self.position[1] + 30,
            self.size[0],
            self.size[1] - 30
        )
        return log_area.collidepoint(point)
    
    def is_point_in_scroll_area(self, point):
        scroll_area = pygame.Rect(
            self.position[0] + self.size[0] - 15,  # Right side of log
            self.position[1] + 30,                 # Below header
            15,                                    # Width of scroll area
            self.size[1] - 30                      # Height minus header
        )
        return scroll_area.collidepoint(point)
    
    def handle_scroll(self, mouse_y):
        total_height = len(self.messages) * 25
        visible_height = self.size[1] - 40
        if total_height > visible_height:
            scroll_ratio = (mouse_y - (self.position[1] + 30)) / (self.size[1] - 40)
            self.scroll_offset = int(scroll_ratio * (len(self.messages) - self.visible_lines))
            self.scroll_offset = max(0, min(self.scroll_offset, len(self.messages) - self.visible_lines))

    @property
    def visible_lines(self):
        return (self.size[1] - 40) // 25
        
    def add_message(self, message, type="system"):
        # Add emojis and colors based on message type
        if type == "damage":
            prefix = "🗡 "
            color = self.colors["damage"]
        elif type == "heal":
            prefix = "❤ "
            color = self.colors["heal"]
        elif type == "warning":
            prefix = "☠ "
            color = self.colors["warning"]
        elif type == "turn":
            prefix = "⭕ "
            color = self.colors["turn"]
        elif type == "item":
            prefix = "🎒 "
            color = self.colors["item"]
        else:
            prefix = "• "
            color = self.colors["system"]
            
        formatted_message = {
            "text": f"{prefix}{message}",
            "color": color,
            "time": pygame.time.get_ticks()
        }
        
        self.messages.append(formatted_message)
        if len(self.messages) > self.max_messages:
            self.messages.pop(0)
        self.scroll_offset = max(0, len(self.messages) - self.visible_lines)
        self.needs_update = True  # Mark that we need to update the cache

    def draw(self):
        # Use the same cached surface mechanism for normal drawing
        if not hasattr(self, 'cached_surface') or self.needs_update:
            self.cached_surface = pygame.Surface((self.size[0], self.size[1]), pygame.SRCALPHA)
            
            # Draw background
            pygame.draw.rect(self.cached_surface, (30, 30, 30, 200), 
                            (0, 0, self.size[0], self.size[1]),
                            border_radius=10)
            pygame.draw.rect(self.cached_surface, (100, 100, 100), 
                            (0, 0, self.size[0], self.size[1]),
                            width=2, border_radius=10)
            
            # Draw messages
            content_y = 35
            for i in range(self.scroll_offset, min(len(self.messages), 
                                                 self.scroll_offset + self.visible_lines)):
                msg = self.messages[i]
                msg_surface = self.font.render(msg["text"], True, msg["color"])
                self.cached_surface.blit(msg_surface, (10, content_y))
                content_y += 25
            
            self.needs_update = False
        
        # Blit the cached surface to the screen
        self.screen.blit(self.cached_surface, self.position)
        
        # Draw resize handle
        resize_handle_pos = (
            self.position[0] + self.size[0] - self.resize_handle_size,
            self.position[1] + self.size[1] - self.resize_handle_size
        )
        pygame.draw.rect(self.screen, (100, 100, 100), 
                        (*resize_handle_pos, self.resize_handle_size, self.resize_handle_size))

    def handle_event(self, event):
        if not self.visible:
            if event.type == pygame.KEYDOWN and event.key == pygame.K_l:
                self.visible = True
                return True
            return False

        if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            mouse_pos = pygame.mouse.get_pos()
            
            # Check for resize area first
            resize_rect = pygame.Rect(
                self.position[0] + self.size[0] - self.resize_handle_size,
                self.position[1] + self.size[1] - self.resize_handle_size,
                self.resize_handle_size,
                self.resize_handle_size
            )
            if resize_rect.collidepoint(mouse_pos):
                self.resizing = True
                return True
            
            # Check for header drag
            if self.is_point_in_header(mouse_pos):
                self.dragging = True
                self.drag_offset = (mouse_pos[0] - self.position[0], 
                                  mouse_pos[1] - self.position[1])
                return True
            
            # Check close button
            if self.is_point_in_close_button(mouse_pos):
                self.visible = False
                return True
            
        elif event.type == pygame.MOUSEBUTTONUP:
            self.dragging = False
            self.resizing = False
            
        elif event.type == pygame.MOUSEMOTION:
            if self.resizing:
                return self.handle_resize(event)
            elif self.dragging:
                # Update position while dragging
                new_x = event.pos[0] - self.drag_offset[0]
                new_y = event.pos[1] - self.drag_offset[1]
                
                # Keep window within screen bounds
                self.position[0] = max(0, min(new_x, self.screen.get_width() - self.size[0]))
                self.position[1] = max(0, min(new_y, self.screen.get_height() - self.size[1]))
                return True
            
            elif self.resizing:
                return self.handle_resize(event)
        
        return False
    
    def handle_resize(self, event):
        """Handle resizing of the battle log"""
        if self.resizing:
            # Calculate new size based on mouse position
            new_width = max(self.min_size[0], event.pos[0] - self.position[0])
            new_height = max(self.min_size[1], event.pos[1] - self.position[1])
            
            # Keep window within screen bounds
            new_width = min(new_width, self.screen.get_width() - self.position[0])
            new_height = min(new_height, self.screen.get_height() - self.position[1])
            
            # Update size
            if new_width != self.size[0] or new_height != self.size[1]:
                self.size = [new_width, new_height]
                self.needs_update = True  # Force redraw
            return True
        return False
    
    def handle_scroll(self, event):
        if self.is_point_in_log_area(pygame.mouse.get_pos()):
            self.scroll_offset = max(0, min(
                self.scroll_offset - event.y,
                len(self.messages) - self.visible_lines
            ))

    def get_rect(self):
        """Return the rectangle representing the battle log's position and size"""
        return pygame.Rect(self.position[0], self.position[1], self.size[0], self.size[1])

    def set_position(self, pos):
        """Update the battle log's position"""
        self.position[0], self.position[1] = pos

    def draw_to_surface(self, surface):
        """Optimized battle log drawing to a specific surface"""
        # Create a cached surface if it doesn't exist or needs update
        if not hasattr(self, 'cached_surface') or self.needs_update:
            self.cached_surface = pygame.Surface((self.size[0], self.size[1]), pygame.SRCALPHA)
            
            # Draw background
            pygame.draw.rect(self.cached_surface, (30, 30, 30, 200), 
                            (0, 0, self.size[0], self.size[1]),
                            border_radius=10)
            pygame.draw.rect(self.cached_surface, (100, 100, 100), 
                            (0, 0, self.size[0], self.size[1]),
                            width=2, border_radius=10)
            
            # Draw messages
            content_y = 35
            for i in range(self.scroll_offset, min(len(self.messages), 
                                                 self.scroll_offset + self.visible_lines)):
                msg = self.messages[i]
                msg_surface = self.font.render(msg["text"], True, msg["color"])
                self.cached_surface.blit(msg_surface, (10, content_y))
                content_y += 25
            
            self.needs_update = False
        
        # Blit the cached surface to the target surface
        surface.blit(self.cached_surface, self.position)