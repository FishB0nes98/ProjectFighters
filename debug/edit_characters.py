import os
import re
from bs4 import BeautifulSoup

CH_FOLDER = 'ch'

def list_characters():
    """List all HTML character files in the ch directory."""
    characters = []
    for file in os.listdir(CH_FOLDER):
        if file.endswith('.html'):
            characters.append(file)
    return characters

def select_character(characters):
    """Allow user to select a character from the list."""
    print("Available Characters:")
    for idx, char in enumerate(characters, 1):
        print(f"{idx}. {char}")
    choice = int(input("Select a character by number: "))
    if 1 <= choice <= len(characters):
        return characters[choice - 1]
    else:
        print("Invalid selection.")
        return None

def load_html(file_path):
    """Load and parse an HTML file."""
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()
    soup = BeautifulSoup(content, 'html.parser')
    return soup

def save_html(soup, file_path):
    """Save the modified HTML back to the file."""
    with open(file_path, 'w', encoding='utf-8') as file:
        file.write(str(soup))

def edit_story(soup):
    """Edit the story content in the left panel."""
    print("Editing Story Content.")
    left_panel = soup.find('div', class_='left-panel')
    if not left_panel:
        print("Left panel not found.")
        return
    paragraphs = left_panel.find_all('p')
    print("Current Story:")
    for idx, p in enumerate(paragraphs, 1):
        print(f"{idx}. {p.get_text()}")
    choice = int(input("Select a paragraph to edit (or 0 to add a new paragraph): "))
    if choice == 0:
        new_text = input("Enter new paragraph text: ")
        new_p = soup.new_tag('p')
        new_p.string = new_text
        left_panel.append(new_p)
        print("Paragraph added.")
    elif 1 <= choice <= len(paragraphs):
        new_text = input("Enter new text for the selected paragraph: ")
        paragraphs[choice - 1].string = new_text
        print("Paragraph updated.")
    else:
        print("Invalid selection.")

def view_skins(soup):
    """Display all current skins."""
    print("Current Skins:")
    skins_container = soup.find('div', class_='skins-container')
    if not skins_container:
        print("Skins container not found.")
        return []
    skins = skins_container.find_all('img', class_='skin-image')
    for idx, skin in enumerate(skins, 1):
        print(f"{idx}. {skin['alt']} - {skin['src']}")
    return skins

def add_skin(soup):
    """Add a new skin to the skins container and update the JavaScript array."""
    skins_container = soup.find('div', class_='skins-container')
    if not skins_container:
        print("Skins container not found.")
        return
    alt_text = input("Enter alt text for the new skin image: ")
    src_path = input("Enter source path for the new skin image: ")

    # Create new img tag
    new_img = soup.new_tag('img', src=src_path, alt=alt_text, **{'class': 'skin-image', 'onclick': f"openLightbox({len(skins_container.find_all('img', class_='skin-image') )})"})
    skins_container.append(new_img)
    print("New skin image added to skins container.")

    # Update the skins array in the script
    script = soup.find('script', text=re.compile(r'const skins = \['))
    if script:
        # Extract the current skins array
        skins_match = re.search(r'const skins = \[(.*?)\];', script.string, re.DOTALL)
        if skins_match:
            skins_list = skins_match.group(1).strip()
            # Add the new skin src
            new_skin_entry = f"'{src_path}'"
            if skins_list:
                updated_skins = skins_list + ',\n                        ' + new_skin_entry
            else:
                updated_skins = new_skin_entry
            # Replace the old skins array with the new one
            new_skins_code = f"const skins = [\n                        {updated_skins}\n            ];"
            updated_script = re.sub(r'const skins = \[(.*?)\];', new_skins_code, script.string, flags=re.DOTALL)
            script.string.replace_with(updated_script)
            print("Skins array in JavaScript updated.")
        else:
            print("Skins array not found in JavaScript.")
    else:
        print("Script tag with skins array not found.")

def remove_skin(soup):
    """Remove a skin from the skins container and update the JavaScript array."""
    skins = view_skins(soup)
    if not skins:
        return
    choice = int(input("Select a skin to remove by number: "))
    if 1 <= choice <= len(skins):
        skin_to_remove = skins[choice - 1]
        skins_container = skin_to_remove.parent
        skin_src = skin_to_remove['src']
        skins_container.decompose(skin_to_remove)
        print("Skin removed from skins container.")

        # Update the skins array in the script
        script = soup.find('script', text=re.compile(r'const skins = \['))
        if script:
            # Extract the current skins array
            skins_match = re.search(r'const skins = \[(.*?)\];', script.string, re.DOTALL)
            if skins_match:
                skins_list = skins_match.group(1).strip()
                # Remove the skin src
                skins_entries = [entry.strip() for entry in skins_list.split(',')]
                skin_src_formatted = f"'{skin_to_remove['src']}'"
                if skin_src_formatted in skins_entries:
                    skins_entries.remove(skin_src_formatted)
                updated_skins = ',\n                        '.join(skins_entries)
                # Replace the old skins array with the new one
                new_skins_code = f"const skins = [\n                        {updated_skins}\n            ];"
                updated_script = re.sub(r'const skins = \[(.*?)\];', new_skins_code, script.string, flags=re.DOTALL)
                script.string.replace_with(updated_script)
                print("Skins array in JavaScript updated.")
            else:
                print("Skins array not found in JavaScript.")
        else:
            print("Script tag with skins array not found.")
    else:
        print("Invalid selection.")

def manage_skins(soup):
    """Manage skins: view, add, or remove."""
    while True:
        print("\nManage Skins:")
        print("1. View Skins")
        print("2. Add a New Skin")
        print("3. Remove an Existing Skin")
        print("4. Go Back")
        choice = input("Select an option: ")
        if choice == '1':
            view_skins(soup)
        elif choice == '2':
            add_skin(soup)
        elif choice == '3':
            remove_skin(soup)
        elif choice == '4':
            break
        else:
            print("Invalid choice. Please try again.")

def main():
    """Main function to run the editor."""
    characters = list_characters()
    if not characters:
        print("No character HTML files found in the 'ch' directory.")
        return

    while True:
        selected_char = select_character(characters)
        if not selected_char:
            continue
        file_path = os.path.join(CH_FOLDER, selected_char)
        soup = load_html(file_path)

        while True:
            print(f"\nEditing {selected_char}:")
            print("1. Edit Story")
            print("2. Manage Skins")
            print("3. Save and Switch Character")
            print("4. Exit")
            main_choice = input("Select an option: ")

            if main_choice == '1':
                edit_story(soup)
            elif main_choice == '2':
                manage_skins(soup)
            elif main_choice == '3':
                save_html(soup, file_path)
                print(f"Changes saved to {selected_char}.")
                break
            elif main_choice == '4':
                save_html(soup, file_path)
                print(f"Changes saved to {selected_char}.")
                print("Exiting the editor.")
                return
            else:
                print("Invalid choice. Please try again.")

if __name__ == "__main__":
    main()