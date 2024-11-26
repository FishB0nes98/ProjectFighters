import tkinter as tk
from tkinter import ttk, filedialog
from PIL import Image, ImageTk
import os
from tkinterdnd2 import DND_FILES, TkinterDnD

class CharacterProgressionMaker:
    def __init__(self, root):
        self.root = root
        self.root.title("Character Progression Maker")
        self.root.geometry("1280x720")  # Set window size
        
        # Get the parent directory (two levels up from debug folder)
        self.base_path = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        
        # Create main container
        main_container = ttk.Frame(root)
        main_container.pack(fill="both", expand=True)
        
        # Create left panel for output
        left_panel = ttk.Frame(main_container)
        left_panel.pack(side="left", fill="both", expand=True, padx=5, pady=5)
        
        # Output text on the left
        ttk.Label(left_panel, text="Generated Code:").pack(anchor="w")
        self.output_text = tk.Text(left_panel, height=40, width=60)
        self.output_text.pack(fill="both", expand=True)
        
        # Create right panel for inputs
        right_panel = ttk.Frame(main_container)
        right_panel.pack(side="right", fill="both", expand=True, padx=5, pady=5)
        
        # Create scrollable frame for inputs
        canvas = tk.Canvas(right_panel)
        scrollbar = ttk.Scrollbar(right_panel, orient="vertical", command=canvas.yview)
        scrollable_frame = ttk.Frame(canvas)
        
        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        
        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        # Character name input
        ttk.Label(scrollable_frame, text="Character Name:").grid(row=0, column=0, sticky=tk.W)
        self.char_name = tk.StringVar()
        ttk.Entry(scrollable_frame, textvariable=self.char_name).grid(row=0, column=1, sticky=(tk.W, tk.E))
        
        # Create reward inputs
        self.rewards_input = []
        
        # Add all the reward inputs as before...
        self.add_title_input(scrollable_frame, 1, 1000, "First Title")
        self.add_skin_input(scrollable_frame, 4, 8500, "First Skin")
        self.add_title_input(scrollable_frame, 6, 15000, "Second Title")
        self.add_skin_input(scrollable_frame, 7, 30000, "Second Skin")
        self.add_skin_input(scrollable_frame, 9, 50000, "Third Skin")
        
        # Button container
        button_container = ttk.Frame(scrollable_frame)
        button_container.grid(row=10, column=0, columnspan=2, pady=10)
        
        # Generate and Reset buttons side by side
        ttk.Button(button_container, text="Generate Code", 
                  command=self.generate_code).pack(side="left", padx=5)
        ttk.Button(button_container, text="Reset", 
                  command=self.reset_form).pack(side="left", padx=5)
        
        # Pack the canvas and scrollbar
        scrollbar.pack(side="right", fill="y")
        canvas.pack(side="left", fill="both", expand=True)

    def add_title_input(self, parent, row, xp, label):
        frame = ttk.LabelFrame(parent, text=f"{label} (XP: {xp})", padding="5")
        frame.grid(row=row, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=5)
        
        ttk.Label(frame, text="Title Name:").grid(row=0, column=0, sticky=tk.W)
        name_var = tk.StringVar()
        ttk.Entry(frame, textvariable=name_var).grid(row=0, column=1, sticky=(tk.W, tk.E))
        
        self.rewards_input.append({
            'type': 'title',
            'xp': xp,
            'name': name_var
        })

    def add_skin_input(self, parent, row, xp, label):
        frame = ttk.LabelFrame(parent, text=f"{label} (XP: {xp})", padding="5")
        frame.grid(row=row, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=5)
        
        ttk.Label(frame, text="Skin Name:").grid(row=0, column=0, sticky=tk.W)
        name_var = tk.StringVar()
        ttk.Entry(frame, textvariable=name_var).grid(row=0, column=1, sticky=(tk.W, tk.E))
        
        # Create a frame for the preview that can accept drops
        preview_frame = ttk.Frame(frame, width=100, height=100)
        preview_frame.grid(row=0, column=2, padx=5)
        preview_frame.grid_propagate(False)  # Keep the frame size fixed
        
        preview_label = ttk.Label(preview_frame, text="Drag image here\nor click Browse")
        preview_label.place(relx=0.5, rely=0.5, anchor="center")
        
        # Configure drag and drop
        preview_frame.drop_target_register('DND_Files')
        preview_frame.dnd_bind('<<Drop>>', lambda e: self.handle_drop(e, preview_label, name_var))
        
        ttk.Button(frame, text="Browse", 
                  command=lambda: self.browse_image(preview_label, name_var)).grid(row=0, column=3)
        
        self.rewards_input.append({
            'type': 'skin',
            'xp': xp,
            'name': name_var,
            'preview': preview_label
        })

    def handle_drop(self, event, preview_label, name_var):
        file_path = event.data
        # Convert TK DND file list to single path
        if isinstance(file_path, str) and file_path.startswith('{') and file_path.endswith('}'):
            file_path = file_path[1:-1]  # Remove curly braces
        
        if os.path.isfile(file_path) and file_path.lower().endswith(('.png', '.jpg', '.jpeg')):
            self.update_image_preview(file_path, preview_label, name_var)

    def update_image_preview(self, file_path, preview_label, name_var):
        try:
            image = Image.open(file_path)
            image.thumbnail((100, 100))
            photo = ImageTk.PhotoImage(image)
            preview_label.configure(image=photo)
            preview_label.image = photo
            
            if not name_var.get():
                # Get filename without extension
                skin_name = os.path.splitext(os.path.basename(file_path))[0]
                # Remove character name from skin name if it exists
                char_name = self.char_name.get()
                if char_name and skin_name.startswith(char_name):
                    skin_name = skin_name[len(char_name):].strip()
                name_var.set(skin_name)
        except Exception as e:
            print(f"Error loading image: {e}")

    def browse_image(self, preview_label, name_var):
        file_path = filedialog.askopenfilename(
            initialdir=os.path.join(self.base_path, "Skins"),
            title="Select Skin Image",
            filetypes=(("Image files", "*.png *.jpg *.jpeg"), ("All files", "*.*"))
        )
        
        if file_path:
            self.update_image_preview(file_path, preview_label, name_var)

    def generate_code(self):
        char_name = self.char_name.get()
        if not char_name:
            return
        
        rewards = []
        
        # First Title (1000 XP)
        first_title = self.rewards_input[0]
        rewards.append({
            "xpRequired": first_title['xp'],
            "rewardName": first_title['name'].get(),
            "rewardType": "title",
            "rewardImage": "titles/titleimage.jpeg",
            "databasePath": f"titles/{first_title['name'].get().lower().replace(' ', '_')}"
        })
        
        # Icon (2500 XP)
        rewards.append({
            "xpRequired": 2500,
            "rewardName": f"{char_name} Icon",
            "rewardType": "icon",
            "rewardImage": f"Icons/Profile/{char_name}_Icon.png",
            "databasePath": f"Icons/{char_name}_Icon"
        })
        
        # First Lootbox (5000 XP)
        rewards.append({
            "xpRequired": 5000,
            "rewardName": "Free Lootbox",
            "rewardType": "lootbox",
            "rewardImage": "res/img/basicbox.png",
            "databasePath": "freelootbox"
        })
        
        # First Skin (8500 XP)
        first_skin = self.rewards_input[1]
        skin_name = first_skin['name'].get()
        rewards.append({
            "xpRequired": first_skin['xp'],
            "rewardName": f"{char_name} {skin_name}",
            "rewardType": "skin",
            "rewardImage": f"Skins/{char_name} {skin_name}.jpeg",
            "databasePath": f"skins/{char_name} {skin_name}"
        })
        
        # Border (11500 XP)
        rewards.append({
            "xpRequired": 11500,
            "rewardName": f"{char_name} Loading Screen Border",
            "rewardType": "border",
            "rewardImage": f"borders/{char_name.lower()}_border.png",
            "databasePath": f"borders/{char_name.lower()}"
        })
        
        # Second Title (15000 XP)
        second_title = self.rewards_input[2]
        rewards.append({
            "xpRequired": second_title['xp'],
            "rewardName": second_title['name'].get(),
            "rewardType": "title",
            "rewardImage": "titles/titleimage.jpeg",
            "databasePath": f"titles/{second_title['name'].get().lower().replace(' ', '_')}"
        })
        
        # Second Skin (30000 XP)
        second_skin = self.rewards_input[3]
        skin_name = second_skin['name'].get()
        rewards.append({
            "xpRequired": second_skin['xp'],
            "rewardName": f"{char_name} {skin_name}",
            "rewardType": "skin",
            "rewardImage": f"Skins/{char_name} {skin_name}.jpeg",
            "databasePath": f"skins/{char_name} {skin_name}"
        })
        
        # Second Lootbox (45000 XP)
        rewards.append({
            "xpRequired": 45000,
            "rewardName": "Free Lootbox",
            "rewardType": "lootbox",
            "rewardImage": "res/img/basicbox.png",
            "databasePath": "freelootbox"
        })
        
        # Third Skin (50000 XP)
        third_skin = self.rewards_input[4]
        skin_name = third_skin['name'].get()
        rewards.append({
            "xpRequired": third_skin['xp'],
            "rewardName": f"{char_name} {skin_name}",
            "rewardType": "skin",
            "rewardImage": f"Skins/{char_name} {skin_name}.jpeg",
            "databasePath": f"skins/{char_name} {skin_name}"
        })
        
        # Master Title (60000 XP)
        rewards.append({
            "xpRequired": 60000,
            "rewardName": f"{char_name} Master",
            "rewardType": "title",
            "rewardImage": "titles/titleimage.jpeg",
            "databasePath": f"titles/{char_name.lower()}_master"
        })
        
        # Generate output
        output = f"export const {char_name.lower()}Rewards = [\n"
        for reward in rewards:
            output += "    {\n"
            for key, value in reward.items():
                output += f'        {key}: "{value}",\n'
            output += "    },\n"
        output += "];"
        
        # Display output
        self.output_text.delete(1.0, tk.END)
        self.output_text.insert(tk.END, output)

    def reset_form(self):
        """Reset all form inputs and output to their default state."""
        # Clear character name
        self.char_name.set("")
        
        # Clear all reward inputs
        for reward in self.rewards_input:
            reward['name'].set("")  # Clear the name field
            if 'preview' in reward:  # Reset image preview if it exists
                reward['preview'].configure(image="", text="Drag image here\nor click Browse")
                reward['preview'].image = None  # Clear the image reference
        
        # Clear output
        self.output_text.delete(1.0, tk.END)

if __name__ == "__main__":
    root = TkinterDnD.Tk()
    app = CharacterProgressionMaker(root)
    root.mainloop() 