import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from PIL import Image, ImageTk
import os
import json
from tkinterdnd2 import DND_FILES, TkinterDnD
import re
from bs4 import BeautifulSoup

class SkinManager:
    def __init__(self, root):
        self.root = root
        self.root.title("Skin Manager")
        self.root.geometry("1600x900")
        
        # Update base path to point directly to ProjectFighters folder
        self.base_path = "E:/Új mappa/ProjectFighters"
        
        # Initialize skin data
        self.characters = {}
        self.current_character = None
        self.load_existing_skins()
        
        self.setup_ui()
        
    def setup_ui(self):
        # Create main container with 3 panels
        self.main_container = ttk.PanedWindow(self.root, orient=tk.HORIZONTAL)
        self.main_container.pack(fill="both", expand=True, padx=5, pady=5)
        
        # Left panel - Character List
        self.setup_character_panel()
        
        # Middle panel - Skin List
        self.setup_skin_panel()
        
        # Right panel - Skin Editor
        self.setup_editor_panel()
        
        # Style configuration
        style = ttk.Style()
        style.configure("Card.TFrame", background="#f0f0f0", relief="raised")
        
    def setup_character_panel(self):
        left_panel = ttk.Frame(self.main_container, padding="5")
        self.main_container.add(left_panel, weight=1)
        
        # Character list header
        header = ttk.Frame(left_panel)
        header.pack(fill="x", pady=(0, 5))
        
        ttk.Label(header, text="Characters", font=("", 12, "bold")).pack(side="left")
        ttk.Button(header, text="+ New Character", command=self.add_character).pack(side="right")
        
        # Searchable character list
        search_frame = ttk.Frame(left_panel)
        search_frame.pack(fill="x", pady=(0, 5))
        
        self.char_search = ttk.Entry(search_frame)
        self.char_search.pack(fill="x", side="left", expand=True)
        self.char_search.bind("<KeyRelease>", self.filter_characters)
        
        # Character listbox
        self.char_listbox = tk.Listbox(left_panel, selectmode="single")
        self.char_listbox.pack(fill="both", expand=True)
        self.char_listbox.bind("<<ListboxSelect>>", self.on_character_select)
        
        # Populate character list
        self.update_character_list()
        
    def setup_skin_panel(self):
        middle_panel = ttk.Frame(self.main_container, padding="5")
        self.main_container.add(middle_panel, weight=2)
        
        # Skin list header
        header = ttk.Frame(middle_panel)
        header.pack(fill="x", pady=(0, 5))
        
        ttk.Label(header, text="Skins", font=("", 12, "bold")).pack(side="left")
        ttk.Button(header, text="+ Add Skin", command=self.add_skin).pack(side="right")
        
        # Create canvas for scrollable skin cards
        self.canvas = tk.Canvas(middle_panel)
        scrollbar = ttk.Scrollbar(middle_panel, orient="vertical", command=self.canvas.yview)
        self.skin_container = ttk.Frame(self.canvas)
        
        self.skin_container.bind(
            "<Configure>",
            lambda e: self.canvas.configure(scrollregion=self.canvas.bbox("all"))
        )
        
        self.canvas.create_window((0, 0), window=self.skin_container, anchor="nw")
        self.canvas.configure(yscrollcommand=scrollbar.set)
        
        scrollbar.pack(side="right", fill="y")
        self.canvas.pack(side="left", fill="both", expand=True)
        
    def setup_editor_panel(self):
        right_panel = ttk.Frame(self.main_container, padding="5")
        self.main_container.add(right_panel, weight=2)
        
        # Editor header
        ttk.Label(right_panel, text="Skin Editor", font=("", 12, "bold")).pack(fill="x", pady=(0, 10))
        
        # Skin editor form
        self.editor_form = ttk.Frame(right_panel)
        self.editor_form.pack(fill="both", expand=True)
        
        # Image preview
        self.preview_frame = ttk.LabelFrame(self.editor_form, text="Skin Preview", padding="10")
        self.preview_frame.pack(fill="x", pady=(0, 10))
        
        self.preview_label = ttk.Label(self.preview_frame, text="Drag image here or click Browse")
        self.preview_label.pack(expand=True, pady=20)
        
        # Configure drag and drop
        self.preview_label.drop_target_register(DND_FILES)
        self.preview_label.dnd_bind('<<Drop>>', self.handle_drop)
        
        ttk.Button(self.preview_frame, text="Browse", command=self.browse_image).pack()
        
        # Form fields
        fields_frame = ttk.Frame(self.editor_form)
        fields_frame.pack(fill="both", expand=True)
        
        # Skin name
        ttk.Label(fields_frame, text="Skin Name:").pack(anchor="w")
        self.skin_name_var = tk.StringVar()
        ttk.Entry(fields_frame, textvariable=self.skin_name_var).pack(fill="x", pady=(0, 10))
        
        # Price
        ttk.Label(fields_frame, text="Price:").pack(anchor="w")
        self.price_var = tk.StringVar()
        price_frame = ttk.Frame(fields_frame)
        price_frame.pack(fill="x", pady=(0, 10))
        
        ttk.Entry(price_frame, textvariable=self.price_var).pack(side="left", expand=True)
        ttk.Label(price_frame, text="FM").pack(side="left", padx=5)
        
        # Special availability
        ttk.Label(fields_frame, text="Special Availability:").pack(anchor="w")
        self.availability_var = tk.StringVar()
        availability_frame = ttk.Frame(fields_frame)
        availability_frame.pack(fill="x", pady=(0, 10))
        
        ttk.Radiobutton(availability_frame, text="Normal", variable=self.availability_var, 
                       value="normal").pack(side="left")
        ttk.Radiobutton(availability_frame, text="Unavailable", variable=self.availability_var,
                       value="unavailable").pack(side="left")
        ttk.Radiobutton(availability_frame, text="Free", variable=self.availability_var,
                       value="free").pack(side="left")
        
        self.availability_var.set("normal")
        
        # Action buttons
        button_frame = ttk.Frame(self.editor_form)
        button_frame.pack(fill="x", pady=10)
        
        ttk.Button(button_frame, text="Save", command=self.save_skin).pack(side="left", padx=5)
        ttk.Button(button_frame, text="Delete", command=self.delete_skin).pack(side="left", padx=5)
        ttk.Button(button_frame, text="Generate HTML", command=self.generate_html).pack(side="right", padx=5)

    def load_existing_skins(self):
        """Load existing skins from Skins.html using BeautifulSoup"""
        try:
            html_path = os.path.join(self.base_path, "Skins.html")
            if not os.path.exists(html_path):
                print(f"Skins.html not found at: {html_path}")
                return

            with open(html_path, 'r', encoding='utf-8') as f:
                soup = BeautifulSoup(f, 'html.parser')

            print("Parsing HTML content...")

            # Find all character divs
            character_divs = soup.find_all('div', class_='character')

            print(f"Found {len(character_divs)} character sections")

            for char_div in character_divs:
                char_id = char_div.get('id')
                char_name_tag = char_div.find('h2')
                char_name = char_name_tag.text.strip() if char_name_tag else "Unknown"

                print(f"\nProcessing character: {char_name} (ID: {char_id})")

                skins_div = char_div.find('div', class_='skins')
                if not skins_div:
                    print("No skins div found for this character.")
                    continue

                skin_divs = skins_div.find_all('div', class_='skin')
                print(f"Found {len(skin_divs)} skin matches")

                skins = []
                for skin_div in skin_divs:
                    img_tag = skin_div.find('img', class_='scaled-image')
                    skin_name_tag = skin_div.find('div', class_='skin-name')
                    skin_price_tag = skin_div.find('div', class_='skin-price')

                    img_src = img_tag['src'] if img_tag and img_tag.has_attr('src') else ""
                    skin_name = skin_name_tag.text.strip() if skin_name_tag else "Unknown"
                    price_text = skin_price_tag.text.strip() if skin_price_tag else "0"

                    print(f"\nProcessing skin:")
                    print(f"  Image: {img_src}")
                    print(f"  Name: {skin_name}")
                    print(f"  Price text: {price_text}")

                    # Determine availability and price
                    if price_text.upper() == "FREE":
                        availability = "free"
                        price = 0
                    elif price_text.upper() == "UNAVAILABLE":
                        availability = "unavailable"
                        price = 0
                    else:
                        availability = "normal"
                        try:
                            price = int(re.findall(r'\d+', price_text)[0])
                        except (IndexError, ValueError):
                            print(f"Warning: Invalid price format for {skin_name}: '{price_text}'")
                            price = 0

                    skins.append({
                        "name": skin_name,
                        "image": img_src,
                        "price": price,
                        "availability": availability
                    })

                # Clean up character name if it contains '/'
                char_name_clean = char_name.split('/')[0].strip()

                self.characters[char_name_clean] = {
                    "id": char_id,
                    "skins": skins
                }

                print(f"Successfully loaded {len(skins)} skins for {char_name_clean}")
                if skins:
                    print(f"First skin: {skins[0]}")

        except Exception as e:
            import traceback
            print("Error details:")
            print(traceback.format_exc())
            messagebox.showerror("Error", f"Failed to load existing skins: {str(e)}")
            self.characters = {}

    def generate_html(self):
        """Generate the Skins.html file"""
        try:
            # Start with the template
            with open("Skins.html", "r", encoding="utf-8") as f:
                template = f.read()
            
            # Generate character sections
            char_sections = []
            for char_name, char_data in self.characters.items():
                skins_html = []
                for skin in char_data["skins"]:
                    price_display = "FREE" if skin["availability"] == "free" else \
                                  "UNAVAILABLE" if skin["availability"] == "unavailable" else \
                                  str(skin["price"])
                    
                    onclick = f"openLightbox('{skin['image']}', '{skin['name']}', " + \
                             (f"'{price_display}')" if skin["availability"] != "normal" else f"{skin['price']})")
                    
                    skins_html.append(f'''            <div class="skin" data-src="{skin['image']}" onclick="{onclick}">
                <img src="{skin['image']}" alt="{skin['name']}" class="scaled-image">
                <div class="skin-name">{skin['name']}</div>
                <div class="skin-price"><img src="res/img/fm.png" alt="Coin Icon">{price_display}</div>
            </div>''')
                
                char_section = f'''    <div class="character" id="{char_data['id']}">
        <h2>{char_name}</h2>
        <div class="skins">
            {''.join(skins_html)}
        </div>
    </div>'''
                char_sections.append(char_section)
            
            # Insert character sections into template
            content = template.replace("<!-- CHARACTER_SECTIONS -->", "\n".join(char_sections))
            
            # Save the file
            with open(os.path.join(self.base_path, "Skins.html"), "w", encoding="utf-8") as f:
                f.write(content)
                
            messagebox.showinfo("Success", "HTML generated successfully")
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to generate HTML: {str(e)}")

    def update_character_list(self, filter_text=""):
        """Update the character listbox with filtered results"""
        self.char_listbox.delete(0, tk.END)
        
        for char_name in sorted(self.characters.keys()):
            if filter_text.lower() in char_name.lower():
                self.char_listbox.insert(tk.END, char_name)

    def filter_characters(self, event):
        """Filter character list based on search input"""
        self.update_character_list(self.char_search.get())

    def on_character_select(self, event):
        """Handle character selection"""
        selection = self.char_listbox.curselection()
        if selection:
            char_name = self.char_listbox.get(selection[0])
            self.current_character = char_name
            self.update_skin_list()
            
    def update_skin_list(self):
        """Update the skin cards display"""
        # Clear existing skin cards
        for widget in self.skin_container.winfo_children():
            widget.destroy()
            
        if not self.current_character:
            return
            
        # Create skin cards
        for i, skin in enumerate(self.characters[self.current_character]["skins"]):
            self.create_skin_card(skin, i)
            
    def create_skin_card(self, skin, index):
        """Create a visual card for a skin"""
        card = ttk.Frame(self.skin_container, style="Card.TFrame")
        card.pack(fill="x", pady=5, padx=5)
        
        try:
            # Get image path and try multiple extensions if needed
            base_image_path = os.path.join(self.base_path, skin["image"].lstrip('/'))
            image_path = None
            
            # Try the original extension first
            if os.path.exists(base_image_path):
                image_path = base_image_path
            else:
                # Try other extensions
                base_path_without_ext = os.path.splitext(base_image_path)[0]
                for ext in ['.png', '.jpg', '.jpeg', '.jfif']:
                    test_path = base_path_without_ext + ext
                    if os.path.exists(test_path):
                        image_path = test_path
                        break
            
            if image_path:
                print(f"Loading image from: {image_path}")  # Debug print
                img = Image.open(image_path)
                # Maintain aspect ratio while fitting in 100x100
                img.thumbnail((100, 100), Image.Resampling.LANCZOS)
                photo = ImageTk.PhotoImage(img)
                
                img_label = ttk.Label(card, image=photo)
                img_label.image = photo  # Keep a reference
                img_label.pack(side="left", padx=5, pady=5)
            else:
                print(f"Failed to find image: {base_image_path}")  # Debug print
                # Create a placeholder for missing images
                placeholder = ttk.Label(card, text="No Image", width=15)
                placeholder.pack(side="left", padx=5, pady=5)
                
        except Exception as e:
            print(f"Error loading image: {str(e)}")  # Debug print
            # Create a placeholder for error cases
            placeholder = ttk.Label(card, text="Error", width=15)
            placeholder.pack(side="left", padx=5, pady=5)

        # Skin info
        info_frame = ttk.Frame(card)
        info_frame.pack(side="left", fill="both", expand=True, padx=5)
        
        ttk.Label(info_frame, text=skin["name"]).pack(anchor="w")
        
        price_frame = ttk.Frame(info_frame)
        price_frame.pack(fill="x")
        
        if skin["availability"] == "free":
            price_text = "FREE"
        elif skin["availability"] == "unavailable":
            price_text = "UNAVAILABLE"
        else:
            price_text = f"{skin['price']} FM"
        
        ttk.Label(price_frame, text=price_text).pack(side="left")
        
        # Edit button
        ttk.Button(card, text="Edit", 
                  command=lambda s=skin: self.edit_skin(s)).pack(side="right", padx=5)

    def add_character(self):
        """Add a new character"""
        name = tk.simpledialog.askstring("New Character", "Enter character name:")
        if name:
            char_id = name.replace(" ", "")  # Simple ID generation
            self.characters[name] = {
                "id": char_id,
                "skins": []
            }
            self.update_character_list()
            
    def add_skin(self):
        """Add a new skin to current character"""
        if not self.current_character:
            messagebox.showwarning("Warning", "Please select a character first")
            return
            
        # Clear editor form
        self.skin_name_var.set("")
        self.price_var.set("")
        self.availability_var.set("normal")
        self.preview_label.configure(image="", text="Drag image here or click Browse")
        self.preview_label.image = None

    def edit_skin(self, skin):
        """Load skin data into editor"""
        self.skin_name_var.set(skin["name"])
        self.price_var.set(skin["price"])
        self.availability_var.set(skin["availability"])
        
        # Load image preview
        try:
            image_path = os.path.join(self.base_path, skin["image"])
            if os.path.exists(image_path):
                self.update_image_preview(image_path)
        except Exception as e:
            print(f"Error loading skin image: {e}")

    def handle_drop(self, event):
        """Handle image drop onto preview area"""
        file_path = event.data
        if isinstance(file_path, str) and file_path.startswith('{') and file_path.endswith('}'):
            file_path = file_path[1:-1]
            
        if os.path.isfile(file_path) and file_path.lower().endswith(('.png', '.jpg', '.jpeg', '.jfif')):
            self.update_image_preview(file_path)
            
            # Auto-fill skin name if empty
            if not self.skin_name_var.get():
                skin_name = os.path.splitext(os.path.basename(file_path))[0]
                if self.current_character and skin_name.startswith(self.current_character):
                    skin_name = skin_name[len(self.current_character):].strip()
                self.skin_name_var.set(skin_name)

    def update_image_preview(self, file_path):
        """Update the image preview with the selected file"""
        try:
            img = Image.open(file_path)
            # Maintain aspect ratio while fitting in preview area
            img.thumbnail((200, 200), Image.Resampling.LANCZOS)
            photo = ImageTk.PhotoImage(img)
            
            self.preview_label.configure(image=photo)
            self.preview_label.image = photo  # Keep a reference
            self.current_image_path = file_path
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to load image: {str(e)}")
            self.preview_label.configure(image="")
            self.current_image_path = None

    def browse_image(self):
        """Open file browser for image selection"""
        file_path = filedialog.askopenfilename(
            initialdir=os.path.join(self.base_path, "Skins"),  # Points to E:/Új mappa/ProjectFighters/Skins
            title="Select Skin Image",
            filetypes=(
                ("Image files", "*.png *.jpg *.jpeg *.jfif"),
                ("All files", "*.*")
            )
        )
        
        if file_path:
            self.update_image_preview(file_path)

    def save_skin(self):
        """Save current skin data"""
        if not self.current_character:
            messagebox.showwarning("Warning", "Please select a character first")
            return
            
        # Validate inputs
        name = self.skin_name_var.get().strip()
        price = self.price_var.get().strip()
        availability = self.availability_var.get()
        
        if not name:
            messagebox.showwarning("Warning", "Please enter a skin name")
            return
            
        if availability == "normal" and (not price or not price.isdigit()):
            messagebox.showwarning("Warning", "Please enter a valid price")
            return
            
        # Create skin data
        skin_data = {
            "name": name,
            "price": price if availability == "normal" else "0",
            "availability": availability,
            "image": os.path.relpath(self.current_image_path, self.base_path) if hasattr(self, 'current_image_path') else ""
        }
        
        # Add or update skin
        char_data = self.characters[self.current_character]
        existing_skin = next((s for s in char_data["skins"] if s["name"] == name), None)
        
        if existing_skin:
            existing_skin.update(skin_data)
        else:
            char_data["skins"].append(skin_data)
            
        self.update_skin_list()
        messagebox.showinfo("Success", "Skin saved successfully")

    def delete_skin(self):
        """Delete current skin"""
        if not self.current_character:
            return
            
        name = self.skin_name_var.get().strip()
        if not name:
            return
            
        if messagebox.askyesno("Confirm Delete", f"Delete skin '{name}'?"):
            char_data = self.characters[self.current_character]
            char_data["skins"] = [s for s in char_data["skins"] if s["name"] != name]
            self.update_skin_list()
            
            # Clear editor
            self.skin_name_var.set("")
            self.price_var.set("")
            self.availability_var.set("normal")
            self.preview_label.configure(image="", text="Drag image here or click Browse")
            self.preview_label.image = None

if __name__ == "__main__":
    root = TkinterDnD.Tk()
    app = SkinManager(root)
    root.mainloop() 