import tkinter as tk
from tkinter import ttk, filedialog, messagebox, simpledialog
from PIL import Image, ImageTk
import os
from bs4 import BeautifulSoup
import shutil
import re

class StoreManager:
    def __init__(self, root):
        self.root = root
        self.root.title("Store Manager")
        self.root.geometry("2000x1000")

        # Initialize attributes
        self.bundles = []
        self.selected_bundle = None
        self.bundle_items = []
        self.selected_bundle_item = None

        # Path to Store.html
        self.html_path = os.path.abspath("Store.html")
        if not os.path.exists(self.html_path):
            messagebox.showerror("Error", f"Store.html not found at {self.html_path}")
            self.root.destroy()
            return

        # Load HTML content
        with open(self.html_path, 'r', encoding='utf-8') as file:
            self.soup = BeautifulSoup(file, 'html.parser')

        # Load existing bundles and bundle items
        self.load_bundles()

        # Setup UI
        self.setup_ui()

    def setup_ui(self):
        # Create Notebook for Tabs
        self.notebook = ttk.Notebook(self.root)
        self.notebook.pack(fill="both", expand=True, padx=10, pady=10)

        # Bundles Tab
        self.bundles_tab = ttk.Frame(self.notebook)
        self.notebook.add(self.bundles_tab, text="Bundles")

        # Bundle Items Tab
        self.bundle_items_tab = ttk.Frame(self.notebook)
        self.notebook.add(self.bundle_items_tab, text="Bundle Items")

        self.setup_bundles_tab()
        self.setup_bundle_items_tab()

    def setup_bundles_tab(self):
        # Frames for Bundles Management
        left_frame = ttk.Frame(self.bundles_tab)
        left_frame.pack(side="left", fill="y", padx=(0, 10))

        right_frame = ttk.Frame(self.bundles_tab)
        right_frame.pack(side="left", fill="both", expand=True)

        # Bundles List
        ttk.Label(left_frame, text="Bundles", font=("Arial", 14, "bold")).pack(pady=5)

        self.bundles_listbox = tk.Listbox(left_frame, width=40, selectmode=tk.SINGLE)
        self.bundles_listbox.pack(fill="y", expand=True)
        self.bundles_listbox.bind("<<ListboxSelect>>", self.on_bundle_select)

        # Buttons for Bundles
        bundles_button_frame = ttk.Frame(left_frame)
        bundles_button_frame.pack(pady=10)

        ttk.Button(bundles_button_frame, text="Add Bundle", command=self.add_bundle).pack(fill="x", pady=2)
        ttk.Button(bundles_button_frame, text="Delete Bundle", command=self.delete_bundle).pack(fill="x", pady=2)
        ttk.Button(bundles_button_frame, text="Save Changes", command=self.save_changes).pack(fill="x", pady=2)

        # Populate the listbox
        self.update_bundles_listbox()

        # Bundle Details in Right Frame
        self.bundle_details_frame = ttk.Frame(right_frame)
        self.bundle_details_frame.pack(fill="both", expand=True)

        self.display_bundle_details()

    def setup_bundle_items_tab(self):
        # Frames for Bundle Items Management
        left_frame = ttk.Frame(self.bundle_items_tab)
        left_frame.pack(side="left", fill="y", padx=(0, 10))

        right_frame = ttk.Frame(self.bundle_items_tab)
        right_frame.pack(side="left", fill="both", expand=True)

        # Bundles List to select for editing items
        ttk.Label(left_frame, text="Select Bundle", font=("Arial", 14, "bold")).pack(pady=5)

        self.bundles_combo = ttk.Combobox(left_frame, values=[bundle['name'] for bundle in self.bundles], state="readonly", width=38)
        self.bundles_combo.pack(pady=5)
        self.bundles_combo.bind("<<ComboboxSelected>>", self.on_bundle_combo_select)

        # Bundle Items List
        ttk.Label(left_frame, text="Bundle Items", font=("Arial", 14, "bold")).pack(pady=5)

        self.bundle_items_listbox = tk.Listbox(left_frame, width=40, selectmode=tk.SINGLE)
        self.bundle_items_listbox.pack(fill="y", expand=True)
        self.bundle_items_listbox.bind("<<ListboxSelect>>", self.on_bundle_item_select)

        # Buttons for Bundle Items
        bundle_items_button_frame = ttk.Frame(left_frame)
        bundle_items_button_frame.pack(pady=10)

        ttk.Button(bundle_items_button_frame, text="Add Item", command=self.add_bundle_item).pack(fill="x", pady=2)
        ttk.Button(bundle_items_button_frame, text="Edit Item", command=self.edit_bundle_item).pack(fill="x", pady=2)
        ttk.Button(bundle_items_button_frame, text="Delete Item", command=self.delete_bundle_item).pack(fill="x", pady=2)

        # Bundle Item Details in Right Frame
        self.bundle_item_details_frame = ttk.Frame(right_frame)
        self.bundle_item_details_frame.pack(fill="both", expand=True)

        self.display_bundle_item_details()

    def load_bundles(self):
        self.bundles = []
        bundle_container = self.soup.find('div', class_='bundle-container')
        if not bundle_container:
            messagebox.showerror("Error", "No bundle-container found in Store.html")
            self.root.destroy()
            return

        bundle_items = bundle_container.find_all('div', class_='bundle-item')
        for item in bundle_items:
            bundle = {}
            bundle['data_bundle_name'] = item.get('data-bundle-name', 'Unnamed Bundle')
            name_tag = item.find('div', class_='bundle-name')
            bundle['name'] = name_tag.text.strip() if name_tag else 'Unnamed Bundle'

            # Determine bundle type and load items
            images_grid = item.find('div', class_='images-grid')
            image_container = item.find('div', class_='image-container')
            script_tag = item.find('script')

            if script_tag:
                # Fixed bundle with items defined in script
                bundle['type'] = 'fixed'
                bundle['items'] = self.parse_fixed_bundle_script(script_tag.string)
            elif images_grid:
                # Bundle with multiple images
                bundle['type'] = 'multiple_images'
                bundle['images'] = []
                img_tags = images_grid.find_all('img')
                for img in img_tags:
                    if img.get('src'):
                        bundle['images'].append({
                            'src': img['src'],
                            'alt': img.get('alt', os.path.basename(img['src']))
                        })
            elif image_container:
                # Bundle with a single image
                bundle['type'] = 'single_image'
                img_tag = image_container.find('img')
                if img_tag and img_tag.get('src'):
                    bundle['images'] = [{
                        'src': img_tag['src'],
                        'alt': img_tag.get('alt', os.path.basename(img_tag['src']))
                    }]
                else:
                    bundle['images'] = []
            else:
                bundle['type'] = 'unknown'
                bundle['images'] = []

            # Price and Currency
            price_tag = item.find('div', class_='price')
            if price_tag:
                price_img = price_tag.find('img')
                price_icon = price_img['src'] if price_img else ''
                price_text = price_tag.find('span').text.strip() if price_tag.find('span') else '0'
                currency = os.path.splitext(os.path.basename(price_icon))[0].upper() if price_icon else 'FM'
                bundle['currency'] = 'FM' if 'fm' in currency.lower() else 'CM'
                bundle['price'] = price_text
            else:
                bundle['currency'] = 'FM'
                bundle['price'] = '0'

            self.bundles.append(bundle)

    def parse_fixed_bundle_script(self, script_content):
        # Extract items from the script content using regex or other parsing methods
        # Assuming the script defines an array of items like:
        # var bundleItems = [{ name: "Item1", image: "path1.png" }, ...];
        items = []
        pattern = r'\{[\s]*name\s*:\s*"([^"]+)"\s*,\s*image\s*:\s*"([^"]+)"\s*\}'
        matches = re.findall(pattern, script_content)
        for match in matches:
            item = {'name': match[0], 'image': match[1]}
            items.append(item)
        return items

    def update_bundles_listbox(self):
        """Update only the bundles listbox"""
        self.bundles_listbox.delete(0, tk.END)
        for bundle in self.bundles:
            self.bundles_listbox.insert(tk.END, f"{bundle['name']} ({bundle['type']})")

    def update_bundles_combo(self):
        """Update only the bundles combobox"""
        if hasattr(self, 'bundles_combo'):  # Check if combobox exists
            bundle_names = [bundle['name'] for bundle in self.bundles]
            self.bundles_combo['values'] = bundle_names

    def on_bundle_select(self, event):
        selection = self.bundles_listbox.curselection()
        if selection:
            index = selection[0]
            self.selected_bundle = self.bundles[index]
            self.display_bundle_details()

    def display_bundle_details(self):
        self.clear_frame(self.bundle_details_frame)
        if not self.selected_bundle:
            return

        # Bundle Name
        ttk.Label(self.bundle_details_frame, text="Bundle Name:", font=("Arial", 12, "bold")).grid(row=0, column=0, sticky='w', pady=5)
        self.bundle_name_var = tk.StringVar(value=self.selected_bundle['name'])
        name_entry = ttk.Entry(self.bundle_details_frame, textvariable=self.bundle_name_var, width=50)
        name_entry.grid(row=0, column=1, sticky='w', pady=5)

        # Currency
        ttk.Label(self.bundle_details_frame, text="Currency:", font=("Arial", 12, "bold")).grid(row=1, column=0, sticky='w', pady=5)
        self.bundle_currency_var = tk.StringVar(value=self.selected_bundle['currency'])
        currency_combo = ttk.Combobox(self.bundle_details_frame, textvariable=self.bundle_currency_var, values=["FM", "CM"], state="readonly", width=47)
        currency_combo.grid(row=1, column=1, sticky='w', pady=5)

        # Price
        ttk.Label(self.bundle_details_frame, text="Price:", font=("Arial", 12, "bold")).grid(row=2, column=0, sticky='w', pady=5)
        self.bundle_price_var = tk.StringVar(value=self.selected_bundle['price'])
        price_entry = ttk.Entry(self.bundle_details_frame, textvariable=self.bundle_price_var, width=50)
        price_entry.grid(row=2, column=1, sticky='w', pady=5)

        # Bundle Type
        ttk.Label(self.bundle_details_frame, text="Type:", font=("Arial", 12, "bold")).grid(row=3, column=0, sticky='w', pady=5)
        self.bundle_type_var = tk.StringVar(value=self.selected_bundle['type'])
        type_combo = ttk.Combobox(self.bundle_details_frame, textvariable=self.bundle_type_var, values=["single_image", "multiple_images", "fixed"], state="readonly", width=47)
        type_combo.grid(row=3, column=1, sticky='w', pady=5)

        # Save Bundle Details Button
        ttk.Button(self.bundle_details_frame, text="Save Bundle", command=self.save_bundle_details).grid(row=4, column=1, sticky='e', pady=10)

    def save_bundle_details(self):
        if not self.selected_bundle:
            return

        # Update bundle attributes
        self.selected_bundle['name'] = self.bundle_name_var.get()
        self.selected_bundle['currency'] = self.bundle_currency_var.get()
        self.selected_bundle['price'] = self.bundle_price_var.get()
        self.selected_bundle['type'] = self.bundle_type_var.get()

        self.update_bundles_listbox()
        self.display_bundle_details()

    def add_bundle(self):
        # Prompt for bundle name
        bundle_name = simpledialog.askstring("Input", "Enter the new bundle name:", parent=self.root)
        if not bundle_name:
            messagebox.showwarning("Warning", "Bundle name cannot be empty.")
            return

        # Prompt for bundle type
        bundle_type = simpledialog.askstring("Input", "Enter the bundle type ('single_image', 'multiple_images', 'fixed'):", parent=self.root)
        if bundle_type not in ['single_image', 'multiple_images', 'fixed']:
            messagebox.showwarning("Warning", "Invalid bundle type.")
            return

        # Prompt for currency
        currency = simpledialog.askstring("Input", "Enter the currency ('FM' or 'CM'):", parent=self.root)
        if currency not in ['FM', 'CM']:
            messagebox.showwarning("Warning", "Invalid currency type.")
            return

        # Prompt for price
        price = simpledialog.askstring("Input", "Enter the bundle price:", parent=self.root)
        if not price or not price.isdigit():
            messagebox.showwarning("Warning", "Invalid price.")
            return

        # Create new bundle
        new_bundle = {
            'data_bundle_name': bundle_name.replace(" ", "") + "Bundle",
            'name': bundle_name,
            'currency': currency,
            'price': price,
            'type': bundle_type
        }

        if bundle_type in ['single_image', 'multiple_images']:
            new_bundle['images'] = []
        elif bundle_type == 'fixed':
            new_bundle['items'] = []

        self.bundles.append(new_bundle)
        self.update_bundles_listbox()

    def delete_bundle(self):
        if not self.selected_bundle:
            messagebox.showwarning("Warning", "Please select a bundle to delete.")
            return

        if messagebox.askyesno("Confirm Delete", f"Are you sure you want to delete the bundle '{self.selected_bundle['name']}'?"):
            self.bundles.remove(self.selected_bundle)
            self.update_bundles_listbox()
            self.clear_frame(self.bundle_details_frame)
            self.selected_bundle = None

    def clear_frame(self, frame):
        for widget in frame.winfo_children():
            widget.destroy()

    def on_bundle_combo_select(self, event):
        selected_bundle_name = self.bundles_combo.get()
        self.selected_bundle_item = None

        # Find the selected bundle
        for bundle in self.bundles:
            if bundle['name'] == selected_bundle_name:
                self.selected_bundle = bundle
                break

        # Populate the bundle items listbox
        self.bundle_items_listbox.delete(0, tk.END)
        
        # Handle different bundle types
        if self.selected_bundle:
            if self.selected_bundle['type'] == 'fixed':
                # For fixed bundles, use the items list
                self.bundle_items = self.selected_bundle.get('items', [])
                for item in self.bundle_items:
                    self.bundle_items_listbox.insert(tk.END, f"{item['name']} - {item['image']}")
            elif self.selected_bundle['type'] in ['single_image', 'multiple_images']:
                # For image-based bundles, use the images list
                self.bundle_items = self.selected_bundle.get('images', [])
                for item in self.bundle_items:
                    self.bundle_items_listbox.insert(tk.END, f"{item['alt']} - {item['src']}")
            else:
                self.bundle_items = []
                messagebox.showinfo("Info", f"Unknown bundle type: {self.selected_bundle['type']}")

    def on_bundle_item_select(self, event):
        selection = self.bundle_items_listbox.curselection()
        if selection:
            index = selection[0]
            self.selected_bundle_item = self.bundle_items[index]
            self.display_bundle_item_details()

    def display_bundle_item_details(self):
        self.clear_frame(self.bundle_item_details_frame)
        if not self.selected_bundle_item:
            return

        # Item Name
        ttk.Label(self.bundle_item_details_frame, text="Item Name:", font=("Arial", 12, "bold")).grid(row=0, column=0, sticky='w', pady=5)
        self.item_name_var = tk.StringVar(value=self.selected_bundle_item['name'])
        name_entry = ttk.Entry(self.bundle_item_details_frame, textvariable=self.item_name_var, width=50)
        name_entry.grid(row=0, column=1, sticky='w', pady=5)

        # Item Image
        ttk.Label(self.bundle_item_details_frame, text="Item Image:", font=("Arial", 12, "bold")).grid(row=1, column=0, sticky='w', pady=5)
        self.item_image_path = self.selected_bundle_item['image']
        image_label = ttk.Label(self.bundle_item_details_frame, text=self.item_image_path)
        image_label.grid(row=1, column=1, sticky='w', pady=5)
        ttk.Button(self.bundle_item_details_frame, text="Change Image", command=self.change_bundle_item_image).grid(row=1, column=2, sticky='w', padx=5, pady=5)

        # Save Bundle Item Details Button
        ttk.Button(self.bundle_item_details_frame, text="Save Item", command=self.save_bundle_item_details).grid(row=2, column=1, sticky='e', pady=10)

    def save_bundle_item_details(self):
        if not self.selected_bundle_item:
            return

        # Update item attributes
        self.selected_bundle_item['name'] = self.item_name_var.get()
        self.selected_bundle_item['image'] = self.item_image_path

        self.on_bundle_combo_select(None)
        self.display_bundle_item_details()

    def add_bundle_item(self):
        if not self.selected_bundle:
            messagebox.showwarning("Warning", "Please select a bundle to add items.")
            return

        if self.selected_bundle['type'] != 'fixed':
            messagebox.showwarning("Warning", "Only fixed bundles can have bundle items.")
            return

        # Prompt for item name
        item_name = simpledialog.askstring("Input", "Enter the item name:", parent=self.root)
        if not item_name:
            messagebox.showwarning("Warning", "Item name cannot be empty.")
            return

        # Open file dialog to select item image
        file_path = filedialog.askopenfilename(title="Select Item Image", filetypes=[("Image Files", "*.png *.jpg *.jpeg *.gif")])
        if not file_path:
            return

        # Copy the image to the appropriate directory
        relative_dir = "FixedItems"  # You can customize this directory
        dest_dir = os.path.join(os.path.dirname(self.html_path), relative_dir)
        os.makedirs(dest_dir, exist_ok=True)
        filename = os.path.basename(file_path)
        dest_path = os.path.join(dest_dir, filename)

        try:
            shutil.copy(file_path, dest_path)
        except Exception as e:
            messagebox.showerror("Error", f"Failed to copy image: {e}")
            return

        # Add to items list
        relative_path = os.path.relpath(dest_path, os.path.dirname(self.html_path)).replace('\\', '/')
        new_item = {'name': item_name, 'image': relative_path}
        self.bundle_items.append(new_item)
        self.selected_bundle['items'].append(new_item)

        # Refresh the bundle items listbox
        self.bundle_items_listbox.insert(tk.END, f"{new_item['name']} - {new_item['image']}")

    def edit_bundle_item(self):
        if not self.selected_bundle_item:
            messagebox.showwarning("Warning", "Please select a bundle item to edit.")
            return

        self.display_bundle_item_details()

    def delete_bundle_item(self):
        if not self.selected_bundle_item:
            messagebox.showwarning("Warning", "Please select a bundle item to delete.")
            return

        if messagebox.askyesno("Confirm Delete", f"Are you sure you want to delete the item '{self.selected_bundle_item['name']}'?"):
            index = self.bundle_items.index(self.selected_bundle_item)
            del self.bundle_items[index]
            del self.selected_bundle['items'][index]
            self.bundle_items_listbox.delete(index)
            self.clear_frame(self.bundle_item_details_frame)
            self.selected_bundle_item = None

    def change_bundle_item_image(self):
        if not self.selected_bundle_item:
            return

        # Open file dialog to select new image
        file_path = filedialog.askopenfilename(title="Select New Image for Item", filetypes=[("Image Files", "*.png *.jpg *.jpeg *.gif")])
        if not file_path:
            return

        # Copy the image to the appropriate directory
        relative_dir = os.path.dirname(self.selected_bundle_item['image'])
        dest_dir = os.path.join(os.path.dirname(self.html_path), relative_dir)
        os.makedirs(dest_dir, exist_ok=True)
        filename = os.path.basename(file_path)
        dest_path = os.path.join(dest_dir, filename)

        try:
            shutil.copy(file_path, dest_path)
        except Exception as e:
            messagebox.showerror("Error", f"Failed to copy image: {e}")
            return

        # Update the item's image path
        relative_path = os.path.relpath(dest_path, os.path.dirname(self.html_path)).replace('\\', '/')
        self.selected_bundle_item['image'] = relative_path

        # Refresh the bundle item details display
        self.display_bundle_item_details()

    def save_changes(self):
        if not self.bundles:
            messagebox.showwarning("Warning", "No bundles to save.")
            return

        try:
            bundle_container = self.soup.find('div', class_='bundle-container')
            if not bundle_container:
                messagebox.showerror("Error", "No bundle-container found in Store.html")
                return

            # Clear existing bundle items
            bundle_container.clear()

            # Reconstruct bundle items from self.bundles
            for bundle in self.bundles:
                bundle_div = self.soup.new_tag('div', attrs={'class': 'bundle-item', 'data-bundle-name': bundle['data_bundle_name']})

                # Bundle Name
                name_div = self.soup.new_tag('div', attrs={'class': 'bundle-name', 'style': 'color: white; font-weight: bold;'})
                name_div.string = bundle['name']
                bundle_div.append(name_div)

                # Bundle Type Handling
                if bundle['type'] == 'multiple_images' and bundle.get('images'):
                    images_grid = self.soup.new_tag('div', attrs={'class': 'images-grid'})
                    for img in bundle['images']:
                        img_tag = self.soup.new_tag('img', src=img['src'], alt=img['alt'], style="width: 100px; height: 100px; display: block; margin: 0 auto;")
                        images_grid.append(img_tag)
                    bundle_div.append(images_grid)
                elif bundle['type'] == 'single_image' and bundle.get('images'):
                    image_container = self.soup.new_tag('div', attrs={'class': 'image-container'})
                    img_tag = self.soup.new_tag('img', src=bundle['images'][0]['src'], alt=bundle['images'][0]['alt'], style="width: 100%; height: 100%; object-fit: cover; margin-top: 10px;")
                    image_container.append(img_tag)
                    bundle_div.append(image_container)
                elif bundle['type'] == 'fixed' and bundle.get('items'):
                    # Create a script tag defining the items
                    script_content = self.generate_fixed_bundle_script(bundle['items'])
                    script_tag = self.soup.new_tag('script')
                    script_tag.string = script_content
                    bundle_div.append(script_tag)
                else:
                    # Handle other types or empty
                    pass  # You can add handling for 'unknown' types if necessary

                # Price
                price_div = self.soup.new_tag('div', attrs={'class': 'price'})
                price_img_src = f"res/img/{bundle['currency'].lower()}.png"
                price_img = self.soup.new_tag('img', src=price_img_src, alt=bundle['currency'], style="margin-top: 10px;")
                price_span = self.soup.new_tag('span', style="color: white; font-weight: bold;")
                price_span.string = bundle['price']
                price_div.append(price_img)
                price_div.append(price_span)
                bundle_div.append(price_div)

                # Buy Button
                buy_button = self.soup.new_tag('button', onclick="purchaseBundle(this)")
                buy_button.string = "Buy"
                bundle_div.append(buy_button)

                # Append to container
                bundle_container.append(bundle_div)

            # Update the HTML file
            with open(self.html_path, 'w', encoding='utf-8') as file:
                file.write(self.soup.prettify())

            messagebox.showinfo("Success", "Store.html has been updated successfully.")

        except Exception as e:
            messagebox.showerror("Error", f"Failed to save changes: {e}")

    def generate_fixed_bundle_script(self, items):
        # Generate JavaScript code to define the bundle items
        # Example format:
        # var bundleItems = [
        #     { name: "Item1", image: "path1.png" },
        #     { name: "Item2", image: "path2.png" },
        # ];
        script = "var bundleItems = [\n"
        for item in items:
            script += f'    {{ name: "{item["name"]}", image: "{item["image"]}" }},\n'
        script += "];\n"
        script += "// Add additional management scripts here if necessary."
        return script

if __name__ == "__main__":
        root = tk.Tk()
        app = StoreManager(root)
        root.mainloop()