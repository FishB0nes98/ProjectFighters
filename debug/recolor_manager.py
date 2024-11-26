import os
import tkinter as tk
from tkinter import ttk, filedialog, messagebox, simpledialog
from PIL import Image, ImageTk
from tkinterdnd2 import DND_FILES, TkinterDnD
from bs4 import BeautifulSoup
import re
import traceback
import shutil

class RecolorManager:
    def __init__(self, root):
        self.root = root
        self.root.title("Recolor Manager")
        self.root.geometry("1600x900")
        
        # Set base path to the parent directory of debug/
        self.base_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
        
        # Initialize empty categories dictionary
        self.categories = {}
        self.current_category = None
        self.selected_image_path = None
        
        # Setup UI components
        self.setup_ui()
        
        # Load existing recolors after UI is set up
        self.load_existing_recolors()

    def setup_ui(self):
        """Setup the UI components"""
        # Create main container
        self.main_container = ttk.PanedWindow(self.root, orient=tk.HORIZONTAL)
        self.main_container.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # Left panel (Categories)
        left_panel = ttk.Frame(self.main_container, padding="5")
        self.main_container.add(left_panel, weight=1)
        
        # Category list header with Add button
        header = ttk.Frame(left_panel)
        header.pack(fill="x", pady=(0, 5))
        
        ttk.Label(header, text="Categories", font=("", 12, "bold")).pack(side="left")
        ttk.Button(header, text="Add Category", command=self.add_category).pack(side="right")
        ttk.Button(header, text="Delete Category", command=self.delete_category).pack(side="right", padx=(0, 5))
        
        # Category listbox
        self.category_listbox = tk.Listbox(left_panel, selectmode="single")
        self.category_listbox.pack(fill="both", expand=True)
        self.category_listbox.bind("<<ListboxSelect>>", self.on_category_select)
        
        # Middle panel - Recolor List
        self.setup_recolor_panel()
        
        # Right panel - Recolor Editor
        self.setup_editor_panel()
        
        # Style configuration
        style = ttk.Style()
        style.configure("Card.TFrame", background="#f0f0f0", relief="raised")

    def setup_category_panel(self):
        left_panel = ttk.Frame(self.main_container, padding="5")
        self.main_container.add(left_panel, weight=1)
        
        # Category list header
        header = ttk.Frame(left_panel)
        header.pack(fill="x", pady=(0, 5))
        
        ttk.Label(header, text="Categories", font=("", 12, "bold")).pack(side="left")
        
        # Category listbox
        self.category_listbox = tk.Listbox(left_panel, selectmode="single")
        self.category_listbox.pack(fill="both", expand=True)
        self.category_listbox.bind("<<ListboxSelect>>", self.on_category_select)
        
        # Populate category listbox
        self.update_category_list()

    def setup_recolor_panel(self):
        middle_panel = ttk.Frame(self.main_container, padding="5")
        self.main_container.add(middle_panel, weight=2)
        
        # Recolor list header
        header = ttk.Frame(middle_panel)
        header.pack(fill="x", pady=(0, 5))
        
        ttk.Label(header, text="Recolors", font=("", 12, "bold")).pack(side="left")
        ttk.Button(header, text="+ Add Recolor", command=self.add_recolor).pack(side="right")
        
        # Recolor listbox
        self.recolor_listbox = tk.Listbox(middle_panel, selectmode="single")
        self.recolor_listbox.pack(fill="both", expand=True)
        self.recolor_listbox.bind("<<ListboxSelect>>", self.on_recolor_select)

    def setup_editor_panel(self):
        right_panel = ttk.Frame(self.main_container, padding="5")
        self.main_container.add(right_panel, weight=1)
        
        # Editor Header
        header = ttk.Frame(right_panel)
        header.pack(fill="x", pady=(0, 5))
        ttk.Label(header, text="Recolor Editor", font=("", 12, "bold")).pack(side="left")
        
        # Recolor Name
        name_frame = ttk.Frame(right_panel)
        name_frame.pack(fill="x", pady=5)
        ttk.Label(name_frame, text="Recolor Name:").pack(side="left")
        self.recolor_name_var = tk.StringVar()
        self.recolor_name_entry = ttk.Entry(name_frame, textvariable=self.recolor_name_var)
        self.recolor_name_entry.pack(side="left", fill="x", expand=True)
        
        # Recolor Price
        price_frame = ttk.Frame(right_panel)
        price_frame.pack(fill="x", pady=5)
        ttk.Label(price_frame, text="Price (FM):").pack(side="left")
        self.recolor_price_var = tk.StringVar()
        self.recolor_price_entry = ttk.Entry(price_frame, textvariable=self.recolor_price_var)
        self.recolor_price_entry.pack(side="left", fill="x", expand=True)
        
        # Recolor Availability
        availability_frame = ttk.Frame(right_panel)
        availability_frame.pack(fill="x", pady=5)
        ttk.Label(availability_frame, text="Availability:").pack(side="left")
        self.recolor_availability_var = tk.StringVar()
        self.recolor_availability_combo = ttk.Combobox(
            availability_frame,
            textvariable=self.recolor_availability_var,
            values=["Normal", "Free", "Unavailable"],
            state="readonly"
        )
        self.recolor_availability_combo.pack(side="left", fill="x", expand=True)
        
        # Image Preview
        image_frame = ttk.Frame(right_panel)
        image_frame.pack(fill="both", expand=True, pady=5)
        ttk.Label(image_frame, text="Recolor Image:").pack(anchor="w")
        self.image_label = ttk.Label(image_frame)
        self.image_label.pack(fill="both", expand=True)
        
        # Image Drop Target
        self.image_label.drop_target_register(DND_FILES)
        self.image_label.dnd_bind('<<Drop>>', self.handle_drop)
        
        # Buttons
        button_frame = ttk.Frame(right_panel)
        button_frame.pack(fill="x", pady=5)
        self.save_button = ttk.Button(button_frame, text="Save Recolor", command=self.save_recolor, state="disabled")
        self.save_button.pack(side="left", expand=True, fill="x", padx=(0, 5))
        self.delete_button = ttk.Button(button_frame, text="Delete Recolor", command=self.delete_recolor, state="disabled")
        self.delete_button.pack(side="left", expand=True, fill="x")

    def add_recolor(self):
        """Initiate the process of adding a new recolor"""
        if not self.current_category:
            messagebox.showerror("Error", "Please select a category first.")
            return
        # Clear editor fields for new entry
        self.recolor_name_var.set("")
        self.recolor_price_var.set("")
        self.recolor_availability_var.set("")
        self.selected_image_path = None
        self.image_label.config(image='')
        self.save_button.config(state="disabled")
        self.delete_button.config(state="disabled")

    def browse_image(self):
        """Browse and select an image file"""
        file_path = filedialog.askopenfilename(title="Select Recolor Image", 
                                               filetypes=[("Image Files", "*.png *.jpg *.jpeg *.gif")])
        if file_path:
            self.selected_image_path = file_path
            self.display_image_preview(file_path)

    def handle_drop(self, event):
        """Handle image drop event"""
        file_path = event.data.strip('{}')  # Remove braces if present
        if os.path.isfile(file_path):
            self.selected_image_path = file_path
            self.display_image_preview(file_path)

    def display_image_preview(self, image_path):
        """Display a preview of the selected image"""
        try:
            image = Image.open(image_path)
            image.thumbnail((300, 300))
            self.photo = ImageTk.PhotoImage(image)
            self.image_label.config(image=self.photo)
            self.save_button.config(state="normal")
        except Exception as e:
            print("Error details:", e)
            messagebox.showerror("Error", f"Failed to load image: {str(e)}")

    def save_recolor(self):
        """Save the new or edited recolor"""
        try:
            name = self.recolor_name_var.get().strip()
            price = self.recolor_price_var.get().strip()
            availability = self.recolor_availability_var.get().strip()
            
            if not name:
                messagebox.showerror("Error", "Recolor name cannot be empty.")
                return
            if availability != "Free":
                if not price.isdigit():
                    messagebox.showerror("Error", "Price must be a number.")
                    return
                price = int(price)
            else:
                price = 0  # Free skins have price 0
            
            if not self.selected_image_path:
                messagebox.showerror("Error", "Please select an image for the recolor.")
                return
            
            # Copy image to Skins directory
            skin_filename = os.path.basename(self.selected_image_path)
            dest_image_path = os.path.join(self.base_path, "Skins", skin_filename)
            os.makedirs(os.path.dirname(dest_image_path), exist_ok=True)
            shutil.copy(self.selected_image_path, dest_image_path)
            
            # Update internal data
            new_skin = {
                "name": name,
                "image": os.path.join("Skins", skin_filename).replace('\\', '/'),
                "price": price,
                "availability": availability
            }
            
            self.categories[self.current_category]['recolors'].append(new_skin)
            self.update_recolor_list()
            self.generate_html()
            messagebox.showinfo("Success", f"Recolor '{name}' added successfully.")
        
        except Exception as e:
            print("Error details:")
            print(traceback.format_exc())
            messagebox.showerror("Error", f"Failed to save recolor: {str(e)}")

    def delete_recolor(self):
        """Delete an existing recolor"""
        try:
            if not self.current_category:
                messagebox.showerror("Error", "Please select a category first.")
                return
            selection = self.recolor_listbox.curselection()
            if not selection:
                messagebox.showerror("Error", "Please select a recolor to delete.")
                return
            index = selection[0]
            skin = self.categories[self.current_category]['recolors'][index]
            confirm = messagebox.askyesno("Confirm Delete", f"Are you sure you want to delete '{skin['name']}'?")
            if confirm:
                # Remove image file
                image_path = os.path.join(self.base_path, skin['image'])
                if os.path.exists(image_path):
                    os.remove(image_path)
                # Remove skin from data
                del self.categories[self.current_category]['recolors'][index]
                self.update_recolor_list()
                self.generate_html()
                messagebox.showinfo("Success", f"Recolor '{skin['name']}' deleted successfully.")
        except Exception as e:
            print("Error details:")
            print(traceback.format_exc())
            messagebox.showerror("Error", f"Failed to delete recolor: {str(e)}")

    def load_existing_recolors(self):
        """Load existing recolors from recolor.html"""
        try:
            html_path = os.path.join(self.base_path, "recolor.html")
            print(f"Attempting to load recolors from: {html_path}")
            
            if not os.path.exists(html_path):
                print(f"No recolor.html found at {html_path}. Starting with empty categories.")
                return
            
            with open(html_path, 'r', encoding='utf-8') as f:
                soup = BeautifulSoup(f, 'html.parser')
            
            # Find all container divs
            containers = soup.find_all('div', class_='container')
            print(f"Found {len(containers)} containers in recolor.html.")
            
            for container_div in containers:
                # Find all skins in this container
                skins = container_div.find_all('div', class_='skin')
                if not skins:
                    continue
                
                # Get the first skin's name to determine the container name
                first_skin = skins[0]
                first_skin_name = first_skin.find('div', class_='skin-name').text.strip()
                
                # Extract the base skin name (everything before the colon or first color indicator)
                container_name = first_skin_name.split(':')[0].split(' ', 1)[0]
                for skin_name in [s.find('div', class_='skin-name').text.strip() for s in skins]:
                    common_prefix = ''
                    for i, (c1, c2) in enumerate(zip(first_skin_name, skin_name)):
                        if c1 != c2:
                            break
                        common_prefix = first_skin_name[:i+1]
                    container_name = common_prefix.strip().rstrip(':').strip()
                
                container_id = container_name.lower().replace(' ', '_')
                
                # Initialize container in self.categories
                self.categories[container_name] = {
                    "id": container_id,
                    "recolors": []
                }
                
                print(f"Processing container: {container_name}")
                print(f"Found {len(skins)} skins in container: {container_name}")
                
                for skin in skins:
                    skin_name = skin.find('div', class_='skin-name').text.strip()
                    skin_price_tag = skin.find('div', class_='skin-price')
                    skin_image = skin.get('data-src', '').strip()
                    
                    # Parse price and availability from onclick attribute
                    onclick = skin.get('onclick', '')
                    price_match = re.search(r'openLightbox\([^,]+,[^,]+,\s*(\d+)\)', onclick)
                    price = int(price_match.group(1)) if price_match else 0
                    
                    # Determine availability based on price and other factors
                    if price == 0:
                        availability = "free"
                    elif "Unavailable" in skin_price_tag.text if skin_price_tag else False:
                        availability = "unavailable"
                    else:
                        availability = "normal"
                    
                    recolor_entry = {
                        "name": skin_name,
                        "image": skin_image,
                        "price": price,
                        "availability": availability
                    }
                    print(f"Adding skin to {container_name}: {recolor_entry}")
                    self.categories[container_name]['recolors'].append(recolor_entry)
            
            # Set default category if any were loaded
            if self.categories:
                self.current_category = next(iter(self.categories))
            
            self.update_category_list()
            print("Existing recolors loaded successfully.")
            messagebox.showinfo("Success", "Existing recolors loaded successfully.")
        except Exception as e:
            print("Error details:")
            print(traceback.format_exc())
            messagebox.showerror("Error", f"Failed to load existing recolors: {str(e)}")

    def generate_html(self):
        """Generate the recolor.html file"""
        try:
            html_path = os.path.join(self.base_path, "recolor.html")
            
            with open(html_path, 'w', encoding='utf-8') as f:
                # Write HTML header and style
                f.write('<!DOCTYPE html>\n<html lang="en">\n<head>\n')
                f.write('    <meta charset="UTF-8">\n')
                f.write('    <title>Skin Recolors</title>\n')
                f.write('    <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&display=swap" rel="stylesheet">\n')
                # Add any additional CSS or JS links here
                f.write('    <script>\n')  # Placeholder for JS
                # Add your JavaScript functions here
                f.write('        function openLightbox(src, name, price) {\n')
                f.write('            const lightbox = document.getElementById("lightbox");\n')
                f.write('            lightbox.style.display = "flex";\n')
                f.write('            const img = document.getElementById("lightbox-image");\n')
                f.write('            img.src = src;\n')
                f.write('            const purchaseButton = document.getElementById("purchase-button");\n')
                f.write('            purchaseButton.dataset.skinName = name;\n')
                f.write('            purchaseButton.dataset.skinPrice = price;\n')
                f.write('            purchaseButton.textContent = `Purchase for ${price} FM`;\n')
                f.write('            purchaseButton.className = window.userFM >= price ? "purchase-button enabled" : "purchase-button disabled";\n')
                f.write('            if (window.userSkins[name]) {\n')
                f.write('                purchaseButton.classList.add("disabled");\n')
                f.write('                purchaseButton.textContent = "Owned";\n')
                f.write('            }\n')
                f.write('            if (name === "Infernal Ibuki Greenfire" && !window.userSkins["Infernal Ibuki"]) {\n')
                f.write('                purchaseButton.classList.add("disabled");\n')
                f.write('                purchaseButton.textContent = "Requires Infernal Ibuki";\n')
                f.write('            }\n')
                f.write('        }\n')
                f.write('\n')
                f.write('        function closeLightbox() {\n')
                f.write('            const lightbox = document.getElementById("lightbox");\n')
                f.write('            lightbox.style.display = "none";\n')
                f.write('        }\n')
                f.write('\n')
                f.write('        function purchaseSkin() {\n')
                f.write('            alert("Purchase functionality not implemented.");\n')
                f.write('        }\n')
                # Add additional JS functionality here...
                f.write('    </script>\n')
                f.write('</head>\n<body>\n')
                
                # Write categories and their recolors
                for category_name, category_data in self.categories.items():
                    f.write(f'    <div class="category" id="{category_data["id"]}">\n')
                    f.write(f'        <h2>{category_name}</h2>\n')
                    f.write('        <div class="recolors">\n')
                    for recolor in category_data['recolors']:
                        # Handle price text
                        price_display = "FREE" if recolor['availability'] == "free" else f"{recolor['price']} FM"
                        f.write(f'            <div class="recolor" data-src="{recolor["image"]}" onclick="openLightbox(\'{recolor["image"]}\', \'{recolor["name"]}\', {recolor["price"]})">\n')
                        f.write(f'                <img src="{recolor["image"]}" alt="{recolor["name"]}" class="scaled-image">\n')
                        f.write(f'                <div class="recolor-name">{recolor["name"]}</div>\n')
                        f.write(f'                <div class="recolor-price">{price_display}</div>\n')
                        f.write('            </div>\n')
                    f.write('        </div>\n')
                    f.write('    </div>\n')
                
                # Add lightbox and other necessary HTML elements
                f.write('    <div id="lightbox" class="lightbox" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); justify-content:center; align-items:center;">\n')
                f.write('        <div class="lightbox-content" style="position:relative; background:#fff; padding:20px; border-radius:8px;">\n')
                f.write('            <img id="lightbox-image" src="" alt="Skin Image" style="max-width:500px; max-height:500px; border-radius:4px;">\n')
                f.write('            <button id="purchase-button" class="purchase-button" onclick="purchaseSkin()" style="position:absolute; bottom:20px; left:20px; padding:10px 20px; cursor:pointer;">Purchase</button>\n')
                f.write('            <button class="close-button" onclick="closeLightbox()" style="position:absolute; top:10px; right:10px; background:none; border:none; font-size:24px; cursor:pointer;">×</button>\n')
                f.write('        </div>\n')
                f.write('    </div>\n')
                f.write('</body>\n</html>')
            
            messagebox.showinfo("Success", "recolor.html generated successfully.")
        except Exception as e:
            print("Error details:")
            print(traceback.format_exc())
            messagebox.showerror("Error", f"Failed to generate HTML: {str(e)}")

    def on_recolor_select(self, event):
        """
        Event handler for when a recolor is selected from the recolor listbox.
        This method updates the Recolor Editor panel with the selected recolor's details.
        """
        try:
            # Get the widget that triggered the event
            widget = event.widget
            selection = widget.curselection()
            if not selection:
                return  # No selection made
            
            index = selection[0]
            selected_recolor = self.categories[self.current_category]['recolors'][index]
            
            # Update the editor panel with recolor details
            self.recolor_name_var.set(selected_recolor['name'])
            self.recolor_price_var.set(selected_recolor['price'] if selected_recolor['availability'] != "free" else "")
            self.recolor_availability_var.set(selected_recolor['availability'])
            self.selected_image_path = os.path.join(self.base_path, selected_recolor['image'])
            self.display_image_preview(self.selected_image_path)
            
            # Enable editing/deletion if needed
            self.save_button.config(state="normal")
            self.delete_button.config(state="normal")
        except Exception as e:
            print("Error details:")
            print(traceback.format_exc())
            messagebox.showerror("Error", f"Failed to select recolor: {str(e)}")

    def update_category_list(self):
        """Update the category listbox with current categories"""
        try:
            self.category_listbox.delete(0, tk.END)  # Clear existing entries
            for category in sorted(self.categories.keys()):
                self.category_listbox.insert(tk.END, category)
            
            # If we have a current category, select it
            if self.current_category and self.current_category in self.categories:
                index = sorted(self.categories.keys()).index(self.current_category)
                self.category_listbox.selection_set(index)
            
            print("Category listbox updated.")
        except Exception as e:
            print("Error details:")
            print(traceback.format_exc())
            messagebox.showerror("Error", f"Failed to update category list: {str(e)}")

    def on_category_select(self, event):
        """Handle category selection from the listbox"""
        try:
            selection = event.widget.curselection()
            if selection:
                index = selection[0]
                self.current_category = event.widget.get(index)
                print(f"Selected category: {self.current_category}")
                self.update_recolor_list()
        except Exception as e:
            print("Error details:")
            print(traceback.format_exc())
            messagebox.showerror("Error", f"Failed to select category: {str(e)}")

    def update_recolor_list(self):
        """Update the recolor listbox based on the selected category"""
        try:
            self.recolor_listbox.delete(0, tk.END)  # Clear existing entries
            for recolor in self.categories[self.current_category]['recolors']:
                self.recolor_listbox.insert(tk.END, recolor['name'])
            print(f"Recolor listbox updated for category: {self.current_category}")
        except Exception as e:
            print("Error details:")
            print(traceback.format_exc())
            messagebox.showerror("Error", f"Failed to update recolor list: {str(e)}")

    def add_category(self):
        """Add a new category"""
        try:
            # Prompt user for category name
            category_name = simpledialog.askstring("New Category", "Enter category name:")
            if not category_name:
                return  # User cancelled or entered empty string
            
            # Clean up the category name
            category_name = category_name.strip()
            
            # Check if category already exists
            if category_name in self.categories:
                messagebox.showerror("Error", "A category with this name already exists.")
                return
            
            # Add new category to self.categories
            category_id = category_name.lower().replace(' ', '_')
            self.categories[category_name] = {
                "id": category_id,
                "recolors": []
            }
            
            # Update the category list
            self.update_category_list()
            
            # Select the new category
            self.current_category = category_name
            index = list(self.categories.keys()).index(category_name)
            self.category_listbox.selection_clear(0, tk.END)
            self.category_listbox.selection_set(index)
            self.category_listbox.see(index)
            
            # Update the recolor list (will be empty for new category)
            self.update_recolor_list()
            
            print(f"Added new category: {category_name}")
            messagebox.showinfo("Success", f"Category '{category_name}' added successfully.")
        except Exception as e:
            print("Error details:")
            print(traceback.format_exc())
            messagebox.showerror("Error", f"Failed to add category: {str(e)}")

    def delete_category(self):
        """Delete the selected category"""
        try:
            if not self.current_category:
                messagebox.showerror("Error", "Please select a category to delete.")
                return
            
            # Confirm deletion
            confirm = messagebox.askyesno(
                "Confirm Delete",
                f"Are you sure you want to delete the category '{self.current_category}' and all its recolors?"
            )
            
            if confirm:
                # Delete all image files in this category
                for recolor in self.categories[self.current_category]['recolors']:
                    image_path = os.path.join(self.base_path, recolor['image'])
                    if os.path.exists(image_path):
                        os.remove(image_path)
                
                # Delete the category
                del self.categories[self.current_category]
                
                # Update UI
                self.current_category = next(iter(self.categories)) if self.categories else None
                self.update_category_list()
                self.update_recolor_list()
                
                # Generate new HTML to reflect changes
                self.generate_html()
                
                print(f"Deleted category: {self.current_category}")
                messagebox.showinfo("Success", "Category deleted successfully.")
        except Exception as e:
            print("Error details:")
            print(traceback.format_exc())
            messagebox.showerror("Error", f"Failed to delete category: {str(e)}")

if __name__ == "__main__":
    # Initialize Tkinter with drag-and-drop support
    root = TkinterDnD.Tk()
    root.geometry("1600x900")
    app = RecolorManager(root)
    root.mainloop()