import pygame
import os

class LootNotification:
    RARITY_COLORS = {
        "common": (100, 100, 100),      # Dark Grey
        "uncommon": (50, 200, 50),      # Vibrant Green
        "rare": (50, 100, 255),         # Bright Blue
        "epic": (150, 50, 250),         # Deep Purple
        "legendary": (255, 165, 0)      # Golden/Orange
    }
    
    def __init__(self, screen):
        self.screen = screen
        self.notifications = []
        self.display_time = 5000
        self.title_font = pygame.font.Font(None, 48)
        self.item_font = pygame.font.Font(None, 36)
        
        # Window properties
        self.window_width = 600
        self.window_height = 400
        self.window_pos = ((screen.get_width() - self.window_width) // 2, 
                           (screen.get_height() - self.window_height) // 2)
        
        # Close button
        self.close_button = pygame.Rect(
            self.window_pos[0] + self.window_width - 50, 
            self.window_pos[1] + 10, 
            40, 40
        )
        
        # Project root for loading icons
        self.project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    def add_notification(self, item_name, count, rarity, icon_path):
        # Load item icon
        try:
            full_icon_path = os.path.join(self.project_root, icon_path)
            icon = pygame.image.load(full_icon_path)
            icon = pygame.transform.scale(icon, (80, 80))
        except Exception as e:
            print(f"Failed to load icon for {item_name}: {e}")
            icon = None
        
        notification = {
            "items": [{
                "name": item_name,
                "count": count,
                "rarity": rarity.lower(),
                "icon": icon
            }],
            "start_time": pygame.time.get_ticks(),
            "active": True
        }
        
        self.notifications.append(notification)
    
    def draw_notification_window(self):
        if not self.notifications:
            return
        
        # Create window surface
        window_surface = pygame.Surface((self.window_width, self.window_height), pygame.SRCALPHA)
        
        # Semi-transparent background
        window_surface.fill((20, 20, 30, 230))
        
        # Draw border
        pygame.draw.rect(window_surface, (50, 50, 70), 
                         (0, 0, self.window_width, self.window_height), 
                         border_radius=15)
        
        # Title
        title = self.title_font.render("Loot Received", True, (255, 255, 255))
        title_rect = title.get_rect(centerx=self.window_width//2, top=20)
        window_surface.blit(title, title_rect)
        
        # Close button (×)
        close_font = pygame.font.Font(None, 48)
        close_text = close_font.render("×", True, (255, 50, 50))
        close_rect = pygame.Rect(self.window_width - 40, 10, 30, 30)
        pygame.draw.rect(window_surface, (50, 50, 50), close_rect, border_radius=5)
        window_surface.blit(close_text, (close_rect.x + 8, close_rect.y))
        
        # Store close button position relative to window
        self.close_button = pygame.Rect(
            self.window_pos[0] + self.window_width - 40,
            self.window_pos[1] + 10,
            30, 30
        )
    
        # Draw items
        for i, item in enumerate(self.notifications[0]["items"]):
            # Item background with rarity color
            item_bg_color = self.RARITY_COLORS.get(item["rarity"], (100, 100, 100, 100))
            item_rect = pygame.Rect(50, 100 + i*100, self.window_width - 100, 90)
            pygame.draw.rect(window_surface, item_bg_color, item_rect, border_radius=10)
            
            # Item icon
            if item["icon"]:
                window_surface.blit(item["icon"], (60, 105 + i*100))
            
            # Item name and count
            name_text = self.item_font.render(f"{item['name']} x{item['count']}", True, (255, 255, 255))
            window_surface.blit(name_text, (150, 120 + i*100))
        
        # Blit the window surface to screen
        self.screen.blit(window_surface, self.window_pos)
    
    def update_and_draw(self, screen):
        # Update notifications (remove expired ones)
        current_time = pygame.time.get_ticks()
        self.notifications = [
            notif for notif in self.notifications 
            if current_time - notif["start_time"] < self.display_time
        ]
        
        # Draw the notification window if there are notifications
        if self.notifications:
            self.draw_notification_window()
    
    def handle_event(self, event):
        if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            # Check if close button is clicked
            if hasattr(self, 'close_button') and self.close_button.collidepoint(event.pos):
                if self.notifications:
                    self.notifications.pop(0)
                return True
        return False