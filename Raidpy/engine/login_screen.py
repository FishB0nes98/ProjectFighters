import pygame
import pygame.freetype

class LoginScreen:
    def __init__(self, screen, firebase_manager):
        self.screen = screen
        self.firebase = firebase_manager
        self.font = pygame.font.Font(None, 36)
        
        # Input fields
        self.username = ""
        self.password = ""
        self.active_field = None  # 'username' or 'password'
        
        # Calculate positions
        screen_width = screen.get_width()
        screen_height = screen.get_height()
        
        # Center the login box
        box_width = 400
        box_height = 300
        self.box_rect = pygame.Rect(
            (screen_width - box_width) // 2,
            (screen_height - box_height) // 2,
            box_width,
            box_height
        )
        
        # Input fields
        field_width = 300
        field_height = 40
        self.username_rect = pygame.Rect(
            (screen_width - field_width) // 2,
            self.box_rect.y + 80,
            field_width,
            field_height
        )
        
        self.password_rect = pygame.Rect(
            (screen_width - field_width) // 2,
            self.username_rect.bottom + 30,
            field_width,
            field_height
        )
        
        # Login button
        button_width = 200
        button_height = 50
        self.login_button = pygame.Rect(
            (screen_width - button_width) // 2,
            self.password_rect.bottom + 30,
            button_width,
            button_height
        )
        
        self.error_message = ""
        self.error_timer = 0
        
    def handle_event(self, event):
        if event.type == pygame.MOUSEBUTTONDOWN:
            # Check which field was clicked
            if self.username_rect.collidepoint(event.pos):
                self.active_field = 'username'
            elif self.password_rect.collidepoint(event.pos):
                self.active_field = 'password'
            elif self.login_button.collidepoint(event.pos):
                return self.try_login()
            else:
                self.active_field = None
                
        elif event.type == pygame.KEYDOWN:
            if self.active_field:
                if event.key == pygame.K_RETURN:
                    return self.try_login()
                elif event.key == pygame.K_BACKSPACE:
                    if self.active_field == 'username':
                        self.username = self.username[:-1]
                    else:
                        self.password = self.password[:-1]
                elif event.key == pygame.K_TAB:
                    # Switch between fields
                    self.active_field = 'password' if self.active_field == 'username' else 'username'
                else:
                    # Add character to active field
                    if event.unicode.isprintable():
                        if self.active_field == 'username':
                            self.username += event.unicode
                        else:
                            self.password += event.unicode
        
        return False
    
    def try_login(self):
        if self.firebase.sign_in_with_username(self.username, self.password):
            return True
        else:
            self.error_message = "Login failed! Check your credentials."
            self.error_timer = pygame.time.get_ticks()
            return False
    
    def draw(self):
        # Draw semi-transparent background
        overlay = pygame.Surface((self.screen.get_width(), self.screen.get_height()))
        overlay.fill((0, 0, 0))
        overlay.set_alpha(128)
        self.screen.blit(overlay, (0, 0))
        
        # Draw login box
        pygame.draw.rect(self.screen, (30, 30, 30), self.box_rect)
        pygame.draw.rect(self.screen, (100, 100, 100), self.box_rect, 2)
        
        # Draw title
        title = self.font.render("Login", True, (255, 255, 255))
        title_rect = title.get_rect(centerx=self.box_rect.centerx, top=self.box_rect.top + 20)
        self.screen.blit(title, title_rect)
        
        # Draw input fields
        for field, text, rect in [
            ('username', self.username, self.username_rect),
            ('password', '*' * len(self.password), self.password_rect)
        ]:
            color = (60, 60, 60) if field == self.active_field else (45, 45, 45)
            pygame.draw.rect(self.screen, color, rect)
            pygame.draw.rect(self.screen, (100, 100, 100), rect, 2)
            
            # Draw field labels
            label = self.font.render(field.capitalize(), True, (200, 200, 200))
            self.screen.blit(label, (rect.left, rect.top - 25))
            
            # Draw text
            text_surface = self.font.render(text, True, (255, 255, 255))
            self.screen.blit(text_surface, (rect.left + 5, rect.top + 5))
        
        # Draw login button
        button_color = (0, 100, 200)
        pygame.draw.rect(self.screen, button_color, self.login_button)
        pygame.draw.rect(self.screen, (100, 100, 100), self.login_button, 2)
        
        button_text = self.font.render("Login", True, (255, 255, 255))
        button_text_rect = button_text.get_rect(center=self.login_button.center)
        self.screen.blit(button_text, button_text_rect)
        
        # Draw error message if needed
        if self.error_message and pygame.time.get_ticks() - self.error_timer < 3000:
            error_text = self.font.render(self.error_message, True, (255, 50, 50))
            error_rect = error_text.get_rect(centerx=self.box_rect.centerx, bottom=self.box_rect.bottom - 10)
            self.screen.blit(error_text, error_rect)
        
    def update(self):
        pass 