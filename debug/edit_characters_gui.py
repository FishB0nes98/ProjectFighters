import os
import re
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from tkinterdnd2 import DND_FILES, TkinterDnD
from bs4 import BeautifulSoup

CH_FOLDER = 'ch'

class CharacterEditorApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Character Editor")
        self.root.geometry("1000x600")

        self.characters = []
        self.selected_character = None
        self.soup = None
        self.file_path = ""

        self.load_characters()
        self.setup_ui()

    def load_characters(self):
        """Load all HTML character files from the ch directory."""
        if not os.path.exists(CH_FOLDER):
            messagebox.showerror("Error", f"Directory '{CH_FOLDER}' does not exist.")
            self.root.destroy()
            return
        self.characters = [file for file in os.listdir(CH_FOLDER) if file.endswith('.html')]
        if not self.characters:
            messagebox.showwarning("Warning", f"No HTML files found in '{CH_FOLDER}' directory.")

    def setup_ui(self):
        """Set up the main UI components."""
        # Left Frame: Character List
        left_frame = ttk.Frame(self.root, padding=10)
        left_frame.pack(side=tk.LEFT, fill=tk.Y)

        ttk.Label(left_frame, text="Characters", font=("Arial", 14, "bold")).pack(pady=5)

        self.char_listbox = tk.Listbox(left_frame, width=30)
        self.char_listbox.pack(fill=tk.Y, expand=True)
        self.char_listbox.bind("<<ListboxSelect>>", self.on_character_select)

        for char in self.characters:
            self.char_listbox.insert(tk.END, char)

        # Right Frame: Editor
        right_frame = ttk.Frame(self.root, padding=10)
        right_frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True)

        # Story Editor
        story_frame = ttk.LabelFrame(right_frame, text="Edit Story", padding=10)
        story_frame.pack(fill=tk.BOTH, expand=True, pady=10)

        self.story_text = tk.Text(story_frame, wrap=tk.WORD, height=10)
        self.story_text.pack(fill=tk.BOTH, expand=True)

        # Skins Manager
        skins_frame = ttk.LabelFrame(right_frame, text="Manage Skins", padding=10)
        skins_frame.pack(fill=tk.BOTH, expand=True, pady=10)

        # Skins List with Drag-and-Drop
        self.skins_listbox = tk.Listbox(skins_frame)
        self.skins_listbox.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        self.skins_listbox.config(selectmode=tk.SINGLE)

        # Enable drag-and-drop on the skins listbox
        self.skins_listbox.drop_target_register(DND_FILES)
        self.skins_listbox.dnd_bind('<<Drop>>', self.drop_skin)

        # Add and Remove Skin Buttons
        buttons_frame = ttk.Frame(skins_frame)
        buttons_frame.pack(side=tk.RIGHT, fill=tk.Y, padx=10)

        add_skin_button = ttk.Button(buttons_frame, text="Add Skin", command=self.add_skin)
        add_skin_button.pack(pady=5)

        remove_skin_button = ttk.Button(buttons_frame, text="Remove Skin", command=self.remove_skin)
        remove_skin_button.pack(pady=5)

        # Save Changes Button
        save_button = ttk.Button(right_frame, text="Save Changes", command=self.save_changes)
        save_button.pack(pady=10)

    def on_character_select(self, event):
        """Handle character selection from the listbox."""
        selection = self.char_listbox.curselection()
        if selection:
            index = selection[0]
            self.selected_character = self.characters[index]
            self.file_path = os.path.join(CH_FOLDER, self.selected_character)
            with open(self.file_path, 'r', encoding='utf-8') as file:
                self.soup = BeautifulSoup(file, 'html.parser')
            self.load_story()
            self.display_skins()

    def load_story(self):
        """Load the story content from the selected character's HTML."""
        left_panel = self.soup.find('div', class_='left-panel')
        if left_panel:
            paragraphs = left_panel.find_all('p')
            story = "\n\n".join([p.get_text() for p in paragraphs])
            self.story_text.delete(1.0, tk.END)
            self.story_text.insert(tk.END, story)

    def display_skins(self):
        """Display the list of skins in the listbox."""
        self.skins_listbox.delete(0, tk.END)
        skins_container = self.soup.find('div', class_='skins-container')
        if not skins_container:
            messagebox.showerror("Error", "Skins container not found in HTML.")
            return
        skins = skins_container.find_all('img', class_='skin-image')
        for skin in skins:
            alt = skin.get('alt', 'No Alt Text')
            src = skin.get('src', 'No Source')
            is_recolor = 'Recolor' if 'recolor' in skin.get('class', []) else 'Original'
            self.skins_listbox.insert(tk.END, f"{alt} - {src} - {is_recolor}")

    def add_skin(self):
        """Add a new skin by selecting an image file."""
        if not self.soup:
            messagebox.showwarning("Warning", "Please select a character first.")
            return

        # Prompt the user to select an image file
        image_path = filedialog.askopenfilename(
            title="Select Skin Image",
            filetypes=[("Image Files", "*.png *.jpg *.jpeg *.gif *.jfif")]
        )

        if not image_path:
            return  # User cancelled

        # Generate alt text based on the image filename
        filename = os.path.basename(image_path)
        alt_text = os.path.splitext(filename)[0].replace('_', ' ').replace('-', ' ')

        # Prompt the user to specify if it's a recolor
        is_recolor = self.prompt_recolor()

        # Ensure the image path is relative to the HTML file
        html_dir = os.path.dirname(os.path.abspath(self.file_path))
        try:
            relative_path = os.path.relpath(image_path, html_dir).replace('\\', '/')
        except ValueError:
            messagebox.showerror("Error", "Cannot compute relative path for the image.")
            return

        # Add the <img> tag to the start of the skins-container
        skins_container = self.soup.find('div', class_='skins-container')
        if not skins_container:
            messagebox.showerror("Error", "Skins container not found in HTML.")
            return

        # Check if the image is already present
        existing_imgs = skins_container.find_all('img', class_='skin-image')
        if any(img.get('src') == relative_path for img in existing_imgs):
            messagebox.showwarning("Warning", f"The skin '{filename}' is already added.")
            return

        # Create new <img> tag
        classes = ['skin-image']
        if is_recolor:
            classes.append('recolor')
        new_img = self.soup.new_tag('img', src=relative_path, alt=alt_text, **{
            'class': ' '.join(classes),
            'onclick': ''  # Will set later
        })

        # Insert the new image at the beginning
        skins_container.insert(0, new_img)

        # Update the skins array in JavaScript
        script = self.soup.find('script', text=re.compile(r'const skins = \['))
        if script:
            # Insert the new skin at the beginning of the skins array
            match = re.search(r'const skins = \[(.*?)\];', script.string, re.DOTALL)
            if match:
                existing_skins = match.group(1).strip()
                updated_skins = f"'{relative_path}',\n                        " + existing_skins
                new_skins_code = f"const skins = [\n                        {updated_skins}\n            ];"
                script.string = new_skins_code
            else:
                messagebox.showwarning("Warning", "Skin entry not found in skins array.")
        else:
            messagebox.showwarning("Warning", "Script tag with skins array not found.")

        # Refresh the skins listbox and update lightbox indices
        self.display_skins()
        self.update_lightbox_indices()
        messagebox.showinfo("Success", f"Skin '{alt_text}' added successfully.")

    def prompt_recolor(self):
        """Prompt the user to specify if the skin is a recolor."""
        recolor_window = tk.Toplevel(self.root)
        recolor_window.title("Recolor Option")
        recolor_window.geometry("300x100")
        recolor_window.grab_set()

        recolor_var = tk.BooleanVar()

        ttk.Label(recolor_window, text="Is this a recolor?").pack(pady=10)
        recolor_check = ttk.Checkbutton(recolor_window, variable=recolor_var)
        recolor_check.pack()

        def confirm():
            recolor_window.destroy()

        confirm_button = ttk.Button(recolor_window, text="OK", command=confirm)
        confirm_button.pack(pady=10)

        self.root.wait_window(recolor_window)

        return recolor_var.get()

    def drop_skin(self, event):
        """Handle skin files dropped into the listbox."""
        if not self.soup:
            messagebox.showwarning("Warning", "Please select a character first.")
            return

        # event.data may contain multiple files separated by space
        files = self.root.tk.splitlist(event.data)
        for file_path in files:
            if os.path.isfile(file_path):
                # Generate alt text based on the image filename
                filename = os.path.basename(file_path)
                alt_text = os.path.splitext(filename)[0].replace('_', ' ').replace('-', ' ')

                # Prompt the user to specify if it's a recolor
                is_recolor = self.prompt_recolor()

                # Ensure the image path is relative to the HTML file
                html_dir = os.path.dirname(os.path.abspath(self.file_path))
                try:
                    relative_path = os.path.relpath(file_path, html_dir).replace('\\', '/')
                except ValueError:
                    messagebox.showerror("Error", f"Cannot compute relative path for the image '{filename}'.")
                    continue

                # Add the <img> tag to the start of the skins-container
                skins_container = self.soup.find('div', class_='skins-container')
                if not skins_container:
                    messagebox.showerror("Error", "Skins container not found in HTML.")
                    continue

                # Check if the image is already present
                existing_imgs = skins_container.find_all('img', class_='skin-image')
                if any(img.get('src') == relative_path for img in existing_imgs):
                    messagebox.showwarning("Warning", f"The skin '{filename}' is already added.")
                    continue

                # Create new <img> tag
                classes = ['skin-image']
                if is_recolor:
                    classes.append('recolor')
                new_img = self.soup.new_tag('img', src=relative_path, alt=alt_text, **{
                    'class': ' '.join(classes),
                    'onclick': ''  # Will set later
                })

                # Insert the new image at the beginning
                skins_container.insert(0, new_img)

                # Update the skins array in JavaScript
                script = self.soup.find('script', text=re.compile(r'const skins = \['))
                if script:
                    # Insert the new skin at the beginning of the skins array
                    match = re.search(r'const skins = \[(.*?)\];', script.string, re.DOTALL)
                    if match:
                        existing_skins = match.group(1).strip()
                        updated_skins = f"'{relative_path}',\n                        " + existing_skins
                        new_skins_code = f"const skins = [\n                        {updated_skins}\n            ];"
                        script.string = new_skins_code
                    else:
                        messagebox.showwarning("Warning", "Skin entry not found in skins array.")
                else:
                    messagebox.showwarning("Warning", "Script tag with skins array not found.")

                # Refresh the skins listbox and update lightbox indices
                self.display_skins()
                self.update_lightbox_indices()
                messagebox.showinfo("Success", f"Skin '{alt_text}' added successfully.")

    def remove_skin(self):
        """Remove the selected skin from the HTML."""
        if not self.soup:
            messagebox.showwarning("Warning", "Please select a character first.")
            return

        selection = self.skins_listbox.curselection()
        if not selection:
            messagebox.showwarning("Warning", "Please select a skin to remove.")
            return

        index = selection[0]
        skins_container = self.soup.find('div', class_='skins-container')
        if not skins_container:
            messagebox.showerror("Error", "Skins container not found in HTML.")
            return

        skins = skins_container.find_all('img', class_='skin-image')
        if index >= len(skins):
            messagebox.showerror("Error", "Selected skin index is out of range.")
            return

        skin_to_remove = skins[index]
        alt_text = skin_to_remove.get('alt', 'No Alt Text')
        src = skin_to_remove.get('src', 'No Source')

        # Remove the <img> tag
        skin_to_remove.decompose()

        # Update the skins array in JavaScript
        script = self.soup.find('script', text=re.compile(r'const skins = \['))
        if script:
            match = re.search(r'const skins = \[(.*?)\];', script.string, re.DOTALL)
            if match:
                skins_array = match.group(1).strip().split(",\n")
                if index < len(skins_array):
                    skins_array.pop(index)
                    updated_skins = ',\n                        '.join(skins_array)
                    new_skins_code = f"const skins = [\n                        {updated_skins}\n            ];"
                    script.string = new_skins_code
                else:
                    messagebox.showwarning("Warning", "Skin entry not found in skins array.")
            else:
                messagebox.showwarning("Warning", "Skin entry not found in skins array.")
        else:
            messagebox.showwarning("Warning", "Script tag with skins array not found.")

        # Refresh the skins listbox and update lightbox indices
        self.display_skins()
        self.update_lightbox_indices()
        messagebox.showinfo("Success", f"Skin '{alt_text}' removed successfully.")

    def update_lightbox_indices(self):
        """Update the onclick indices for all skins and ensure lightbox functions exist."""
        skins_container = self.soup.find('div', class_='skins-container')
        if not skins_container:
            messagebox.showerror("Error", "Skins container not found in HTML.")
            return

        # Update skin indices
        skins = skins_container.find_all('img', class_='skin-image')
        for idx, skin in enumerate(skins):
            skin['onclick'] = f'openLightbox({idx})'

        # Find or create script tag
        script = self.soup.find('script', text=re.compile(r'const skins = \['))
        if not script:
            script = self.soup.new_tag('script')
            self.soup.body.append(script)

        # Update skins array and ensure all necessary functions are present
        skins_list = ',\n                        '.join([f"'{skin.get('src', '')}'" for skin in skins])
        script_content = f"""
            const skins = [
                            {skins_list}
                ];
            let currentIndex = 0;

            function openLightbox(index) {{
                currentIndex = index;
                document.getElementById('lightbox-img').src = skins[currentIndex];
                document.getElementById('lightbox').style.display = 'flex';
            }}

            function closeLightbox() {{
                document.getElementById('lightbox').style.display = 'none';
            }}

            function prevImage() {{
                currentIndex = (currentIndex > 0) ? currentIndex - 1 : skins.length - 1;
                document.getElementById('lightbox-img').src = skins[currentIndex];
            }}

            function nextImage() {{
                currentIndex = (currentIndex < skins.length - 1) ? currentIndex + 1 : 0;
                document.getElementById('lightbox-img').src = skins[currentIndex];
            }}

            function toggleRecolors() {{
                const recolorSkins = document.querySelectorAll('.skin-image.recolor');
                const hideRecolors = document.getElementById('hide-recolors').checked;
                recolorSkins.forEach(skin => {{
                    skin.style.display = hideRecolors ? 'none' : 'block';
                }});
            }}

            document.querySelector('.skins-container').addEventListener('mousemove', function(e) {{
                const container = e.currentTarget;
                const containerWidth = container.offsetWidth;
                const scrollWidth = container.scrollWidth;
                const scrollLeft = container.scrollLeft;
                const mouseX = e.clientX - container.getBoundingClientRect().left;

                if (mouseX < containerWidth * 0.1) {{
                    container.scrollLeft = Math.max(0, scrollLeft - 10);
                }} else if (mouseX > containerWidth * 0.9) {{
                    container.scrollLeft = Math.min(scrollWidth - containerWidth, scrollLeft + 10);
                }}
            }});

            function toggleUI() {{
                const elementsToHide = document.querySelectorAll('.menu, .content, .skins-container, .lightbox, .play-button-container');
                const hideUIButton = document.querySelector('.hide-ui-button');
                elementsToHide.forEach(element => {{
                    element.classList.toggle('hidden');
                }});
                hideUIButton.textContent = hideUIButton.textContent === 'Hide UI' ? 'Show UI' : 'Hide UI';
            }}

            function toggleStory() {{
                const moreText = document.getElementById('more');
                const moreLink = document.getElementById('more-link');
                const leftPanel = document.querySelector('.left-panel');

                if (moreText.style.display === 'none' || moreText.style.display === '') {{
                    moreText.style.display = 'inline';
                    moreLink.textContent = 'less';
                    leftPanel.style.flex = '2';
                }} else {{
                    moreText.style.display = 'none';
                    moreLink.textContent = 'more';
                    leftPanel.style.flex = '1';
                }}
            }}

            function hideButton() {{
                document.querySelector('.hide-ui-button').classList.add('hidden');
            }}

            function showButton() {{
                document.querySelector('.hide-ui-button').classList.remove('hidden');
            }}

            document.addEventListener('mousemove', () => {{
                showButton();
                clearTimeout(mouseTimer);
                mouseTimer = setTimeout(hideButton, 5000);
            }});

            let mouseTimer = setTimeout(hideButton, 5000);
        """
        script.string = script_content

    def save_changes(self):
        """Save the modified HTML back to the file."""
        if not self.soup or not self.file_path:
            messagebox.showwarning("Warning", "No character selected or loaded.")
            return
        try:
            # Update the story content
            left_panel = self.soup.find('div', class_='left-panel')
            if left_panel:
                left_panel.clear()
                story_paragraphs = self.story_text.get(1.0, tk.END).strip().split('\n\n')
                for para in story_paragraphs:
                    p_tag = self.soup.new_tag('p')
                    p_tag.string = para.strip()
                    left_panel.append(p_tag)
            # Save the modified HTML
            with open(self.file_path, 'w', encoding='utf-8') as file:
                file.write(str(self.soup.prettify()))
            messagebox.showinfo("Success", f"Changes saved to {self.selected_character}.")
        except Exception as e:
            messagebox.showerror("Error", f"Failed to save changes.\nError: {e}")

if __name__ == "__main__":
    def main():
        # Initialize TkinterDnD
        root = TkinterDnD.Tk()
        app = CharacterEditorApp(root)
        root.mainloop()

    main()