import pygame
import sys
from stages.farm_raid.stage_1 import FarmStage1
from stages.farm_raid.stage_2 import FarmStage2
from stages.farm_raid.stage_3 import FarmStage3
from stages.farm_raid.stage_4 import FarmStage4
from stages.farm_raid.stage_5 import FarmStage5
from engine.firebase_manager import FirebaseManager
from engine.login_screen import LoginScreen
from engine.tooltip import TooltipManager
from engine.modifier_manager import ModifierManager
from engine.modifier_selector import ModifierSelector

class StageSelector:
    def __init__(self, screen, firebase_manager):
        self.screen = screen
        self.firebase = firebase_manager
        self.stages = [
            {
                "id": "farm_1",
                "name": "Farm Raid - Stage 1",
                "description": "Face off against the Angry Carrot!",
                "image_path": "Raidpy/res/img/Stage_1_BG.jpeg",
                "class": FarmStage1,
                "unlocked": True
            },
            {
                "id": "farm_2",
                "name": "Farm Raid - Stage 2",
                "description": "Battle the Angry Pig, Bull, and Chicken!",
                "image_path": "Raidpy/res/img/Stage_2_BG.jpeg",
                "class": FarmStage2,
                "unlocked": True
            },
            {
                "id": "farm_3",
                "name": "Farm Raid - Stage 3",
                "description": "Survive 60 turns against endless waves of apples!\nBeware the Rotten Apple's explosion!",
                "image_path": "Raidpy/res/img/Stage_3_BG.webp",
                "class": FarmStage3,
                "unlocked": True
            },
            {
                "id": "farm_4",
                "name": "Farm Raid - Stage 4",
                "description": "Team up with Farmer Alice to defeat the Monster Bull!\nUnlock powerful duo combinations!",
                "image_path": "Raidpy/res/img/Stage_4_BG.webp",
                "class": FarmStage4,
                "unlocked": True
            },
            {
                "id": "farm_5",
                "name": "Farm Raid - Stage 5",
                "description": "Face off against the Scarecrow Abomination!\nA true test of skill in this epic 1v1 battle!",
                "image_path": "Raidpy/res/img/Stage_5_BG.webp",
                "class": FarmStage5,
                "unlocked": True
            }
        ]
        
        # UI properties
        self.card_width = 300
        self.card_height = 400
        self.padding = 40
        self.selected_stage = None
        self.hover_stage = None
        self.hover_start = 0
        self.hover_duration = 200
        
        # Load and scale stage previews
        for stage in self.stages:
            try:
                image = pygame.image.load(stage["image_path"])
                stage["preview"] = pygame.transform.scale(image, (self.card_width - 40, 200))
            except:
                # Create placeholder if image not found
                surface = pygame.Surface((self.card_width - 40, 200))
                surface.fill((50, 50, 50))
                stage["preview"] = surface

        # Add logout button
        self.logout_button = pygame.Rect(
            screen.get_width() - 120, 20, 100, 40
        )

    def draw(self):
        # Draw dark semi-transparent background
        overlay = pygame.Surface(self.screen.get_size())
        overlay.fill((20, 20, 30))
        self.screen.blit(overlay, (0, 0))

        # Draw title
        font_large = pygame.font.Font(None, 64)
        title = font_large.render("Select Stage", True, (255, 255, 255))
        title_rect = title.get_rect(centerx=self.screen.get_width()//2, top=50)
        self.screen.blit(title, title_rect)

        # Calculate positions for stage cards
        total_width = len(self.stages) * (self.card_width + self.padding) - self.padding
        start_x = (self.screen.get_width() - total_width) // 2
        start_y = (self.screen.get_height() - self.card_height) // 2

        current_time = pygame.time.get_ticks()

        for i, stage in enumerate(self.stages):
            x = start_x + i * (self.card_width + self.padding)
            y = start_y
            
            # Create card rectangle
            card_rect = pygame.Rect(x, y, self.card_width, self.card_height)
            
            # Check if card is being hovered
            is_hovered = card_rect.collidepoint(pygame.mouse.get_pos())
            if is_hovered and stage["unlocked"]:
                if self.hover_stage != stage:
                    self.hover_stage = stage
                    self.hover_start = current_time
                hover_progress = min(1.0, (current_time - self.hover_start) / self.hover_duration)
                y -= 20 * hover_progress
            elif not is_hovered and self.hover_stage == stage:
                hover_progress = 1.0 - min(1.0, (current_time - self.hover_start) / self.hover_duration)
                y -= 20 * hover_progress
                if hover_progress == 0:
                    self.hover_stage = None

            # Draw card background
            if stage["unlocked"]:
                bg_color = (40, 40, 50) if not is_hovered else (50, 50, 60)
            else:
                bg_color = (30, 30, 35)
            
            pygame.draw.rect(self.screen, bg_color, (x, y, self.card_width, self.card_height), border_radius=15)
            
            # Draw stage preview
            preview_rect = stage["preview"].get_rect(
                centerx=x + self.card_width//2,
                top=y + 20
            )
            self.screen.blit(stage["preview"], preview_rect)

            # Draw stage info
            font = pygame.font.Font(None, 36)
            font_small = pygame.font.Font(None, 24)

            # Draw stage name
            name_text = font.render(stage["name"], True, (255, 255, 255))
            name_rect = name_text.get_rect(
                centerx=x + self.card_width//2,
                top=y + 240
            )
            self.screen.blit(name_text, name_rect)

            # Draw description (word-wrapped)
            words = stage["description"].split()
            lines = []
            current_line = []
            for word in words:
                test_line = " ".join(current_line + [word])
                if font_small.size(test_line)[0] <= self.card_width - 40:
                    current_line.append(word)
                else:
                    lines.append(" ".join(current_line))
                    current_line = [word]
            if current_line:
                lines.append(" ".join(current_line))

            for j, line in enumerate(lines):
                desc_text = font_small.render(line, True, (200, 200, 200))
                desc_rect = desc_text.get_rect(
                    centerx=x + self.card_width//2,
                    top=y + 290 + j*25
                )
                self.screen.blit(desc_text, desc_rect)

            # Draw lock overlay for locked stages
            if not stage["unlocked"]:
                lock_overlay = pygame.Surface((self.card_width, self.card_height), pygame.SRCALPHA)
                lock_overlay.fill((0, 0, 0, 180))
                self.screen.blit(lock_overlay, (x, y))
                
                lock_text = font.render("🔒 Locked", True, (255, 255, 255))
                lock_rect = lock_text.get_rect(center=(x + self.card_width//2, y + self.card_height//2))
                self.screen.blit(lock_text, lock_rect)

            # Draw border
            border_color = (100, 100, 255) if is_hovered and stage["unlocked"] else (60, 60, 80)
            pygame.draw.rect(self.screen, border_color, 
                           (x, y, self.card_width, self.card_height), 
                           width=2, border_radius=15)

        # Draw logout button
        pygame.draw.rect(self.screen, (200, 50, 50), self.logout_button, border_radius=5)
        logout_text = pygame.font.Font(None, 32).render("Logout", True, (255, 255, 255))
        text_rect = logout_text.get_rect(center=self.logout_button.center)
        self.screen.blit(logout_text, text_rect)

    def handle_click(self, pos):
        # Handle logout button
        if self.logout_button.collidepoint(pos):
            self.firebase.logout()
            return "logout"
        
        # Calculate positions for stage cards
        total_width = len(self.stages) * (self.card_width + self.padding) - self.padding
        start_x = (self.screen.get_width() - total_width) // 2
        start_y = (self.screen.get_height() - self.card_height) // 2
        
        # Handle stage selection
        for i, stage in enumerate(self.stages):
            x = start_x + i * (self.card_width + self.padding)
            card_rect = pygame.Rect(x, start_y, self.card_width, self.card_height)
            if card_rect.collidepoint(pos) and stage["unlocked"]:
                # Check if stage has saved modifier
                modifier = ModifierManager(self.firebase).get_stage_modifier(stage["id"])
                if modifier:
                    # Show dialog to choose between continuing with modifier or resetting
                    choice = self.show_modifier_dialog()
                    if choice == "reset":
                        ModifierManager(self.firebase).reset_stage_modifiers()
                return stage
        return None

    def show_modifier_dialog(self):
        """Show dialog to choose between continuing with modifier or resetting"""
        dialog_width = 400
        dialog_height = 200
        dialog_x = (self.screen.get_width() - dialog_width) // 2
        dialog_y = (self.screen.get_height() - dialog_height) // 2
        
        continue_button = pygame.Rect(dialog_x + 50, dialog_y + 120, 140, 40)
        reset_button = pygame.Rect(dialog_x + 210, dialog_y + 120, 140, 40)
        
        while True:
            for event in pygame.event.get():
                if event.type == pygame.MOUSEBUTTONDOWN:
                    if continue_button.collidepoint(event.pos):
                        return "continue"
                    if reset_button.collidepoint(event.pos):
                        return "reset"
                    
            # Draw dialog
            pygame.draw.rect(self.screen, (40, 40, 50), 
                            (dialog_x, dialog_y, dialog_width, dialog_height),
                            border_radius=10)
            
            font = pygame.font.Font(None, 32)
            text = font.render("Continue with saved modifier or start fresh?", True, (255, 255, 255))
            self.screen.blit(text, (dialog_x + 20, dialog_y + 40))
            
            # Draw buttons
            for button, text in [(continue_button, "Continue"), (reset_button, "Reset")]:
                pygame.draw.rect(self.screen, (60, 60, 70), button, border_radius=5)
                text_surf = font.render(text, True, (255, 255, 255))
                text_rect = text_surf.get_rect(center=button.center)
                self.screen.blit(text_surf, text_rect)
            
            pygame.display.flip()

class GameManager:
    def __init__(self):
        pygame.init()
        try:
            # Single display initialization with all flags
            self.screen = pygame.display.set_mode(
                (1920, 1080),
                pygame.DOUBLEBUF | pygame.HWSURFACE | pygame.SCALED,
                vsync=1  # Enable vsync for better performance
            )
            pygame.display.set_caption("2D Raid Game")
        except pygame.error as e:
            # Fallback to a simpler display mode if the first attempt fails
            print("Warning: Failed to create hardware-accelerated display. Falling back to software mode.")
            self.screen = pygame.display.set_mode((1920, 1080))
            pygame.display.set_caption("2D Raid Game")
        
        self.firebase = FirebaseManager()
        self.login_screen = LoginScreen(self.screen, self.firebase)
        self.stage_selector = StageSelector(self.screen, self.firebase)
        self.modifier_manager = ModifierManager(self.firebase)
        self.clock = pygame.time.Clock()
        
    def run_game(self):
        # Try auto-login first
        logged_in = self.firebase.try_auto_login()
        
        # Handle manual login if auto-login failed
        while not logged_in:
            self.clock.tick(60)  # Limit login screen to 60 FPS
            events = pygame.event.get()
            for event in events:
                if event.type == pygame.QUIT:
                    pygame.quit()
                    sys.exit()
                if self.login_screen.handle_event(event):
                    logged_in = True
            
            self.login_screen.draw()
            pygame.display.flip()
        
        while True:  # Main game loop
            # Show stage selector
            selected_stage = None
            while selected_stage is None:
                self.clock.tick(60)
                events = pygame.event.get()
                for event in events:
                    if event.type == pygame.QUIT:
                        pygame.quit()
                        sys.exit()
                    elif event.type == pygame.MOUSEBUTTONDOWN:
                        selected_stage = self.stage_selector.handle_click(event.pos)
                        if selected_stage == "logout":
                            # Handle logout
                            logged_in = False
                            return self.run_game()  # Restart game loop
                
                self.stage_selector.draw()
                pygame.display.flip()
                
            # Run the selected stage
            stage = selected_stage["class"](self.screen, self.firebase)
            
            # Check for existing modifier
            existing_modifier = self.modifier_manager.get_stage_modifier(selected_stage["id"])
            selected_modifier = None
            
            if not existing_modifier:
                # Only show modifier selection if there's no existing modifier
                self.modifier_manager.reset_cached_modifiers()  # Reset cache before showing selector
                modifier_selector = ModifierSelector(self.screen, self.modifier_manager)
                selected_modifier = modifier_selector.show()
                
                if selected_modifier:
                    # Save the selected modifier
                    self.modifier_manager.save_stage_modifier(selected_stage["id"], selected_modifier["id"])
            else:
                selected_modifier = existing_modifier
            
            if selected_modifier:
                # Apply the modifier to the stage
                stage.modifier = selected_modifier
            
            stage_completed = stage.run()
            
            # Reset cache after stage completion
            self.modifier_manager.reset_cached_modifiers()
            
            if stage_completed:
                # Move to next stage or show victory screen
                pass
            # If not completed, loop back to stage selector

if __name__ == "__main__":
    game = GameManager()
    game.run_game() 