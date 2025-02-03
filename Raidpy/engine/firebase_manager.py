import pyrebase
import json
import os

class FirebaseManager:
    def __init__(self):
        self.config = {
            "apiKey": "AIzaSyCqhxq6sPDU3EmuvvkBIIDJ-H6PsBc42Jg",
            "authDomain": "project-fighters-by-fishb0nes.firebaseapp.com",
            "databaseURL": "https://project-fighters-by-fishb0nes-default-rtdb.europe-west1.firebasedatabase.app",
            "projectId": "project-fighters-by-fishb0nes",
            "storageBucket": "project-fighters-by-fishb0nes.appspot.com",
            "messagingSenderId": "867339299995",
            "appId": "1:867339299995:web:99c379940014b9c05cea3e"
        }
        self.firebase = pyrebase.initialize_app(self.config)
        self.auth = self.firebase.auth()
        self.db = self.firebase.database()
        self.current_user = None
        self.credentials_file = "user_credentials.json"
        self.project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.items_path = os.path.join(self.project_root, 'data', 'items.json')
        
        # Try auto-login on initialization
        self.try_auto_login()

    def try_auto_login(self):
        """Attempt to automatically log in using saved credentials"""
        try:
            if os.path.exists(self.credentials_file):
                with open(self.credentials_file, 'r') as f:
                    credentials = json.load(f)
                    username = credentials.get('username')
                    password = credentials.get('password')
                    if username and password:
                        return self.sign_in_with_username(username, password)
            return False
        except Exception as e:
            print(f"Auto-login failed: {e}")
            return False

    def login(self, email, password):
        """Log in with email and password, save credentials if successful"""
        try:
            user = self.auth.sign_in_with_email_and_password(email, password)
            self.current_user = user
            
            # Save credentials for auto-login
            with open(self.credentials_file, 'w') as f:
                json.dump({
                    'email': email,
                    'password': password
                }, f)
                
            return True
        except Exception as e:
            print(f"Login failed: {e}")
            return False
    
    def load_credentials(self):
        try:
            if os.path.exists(self.credentials_file):
                with open(self.credentials_file, 'r') as f:
                    creds = json.load(f)
                    if creds.get('username') and creds.get('password'):
                        self.sign_in_with_username(creds['username'], creds['password'])
        except Exception as e:
            print(f"Error loading credentials: {e}")
    
    def save_credentials(self, username, password):
        try:
            with open(self.credentials_file, 'w') as f:
                json.dump({
                    'username': username,
                    'password': password
                }, f)
        except Exception as e:
            print(f"Error saving credentials: {e}")
    
    def sign_in_with_username(self, username, password):
        try:
            # Get all users
            users = self.db.child("users").get()
            
            # Find user with matching username
            user_email = None
            for user in users.each():
                if user.val().get('username') == username:
                    user_email = user.val().get('email')
                    break
            
            if not user_email:
                print("Username not found")
                return False
            
            # Sign in with email and password
            user = self.auth.sign_in_with_email_and_password(user_email, password)
            self.current_user = user
            self.save_credentials(username, password)
            return True
            
        except Exception as e:
            print(f"Login failed: {e}")
            return False
            
    def update_inventory(self, item_id, quantity):
        if not self.current_user:
            print("No current user for inventory update")
            return False
        
        try:
            user_id = self.current_user['localId']
            inventory_ref = f"users/{user_id}/RaidInventory/items/{item_id}"
            
            # Get current quantity
            current_quantity = self.db.child(inventory_ref).get().val() or 0
            
            # Update quantity
            new_quantity = current_quantity + quantity
            self.db.child(inventory_ref).set(new_quantity)
            
            print(f"Updated {item_id}: {current_quantity} + {quantity} = {new_quantity}")
            return True
        except Exception as e:
            print(f"Failed to update inventory for {item_id}: {e}")
            return False
    
    def logout(self):
        self.current_user = None
        if os.path.exists(self.credentials_file):
            os.remove(self.credentials_file)
    
    def load_inventory(self):
        if not self.current_user:
            return []
        
        try:
            user_id = self.current_user['localId']
            inventory_ref = f"users/{user_id}/RaidInventory/items"
            items = self.db.child(inventory_ref).get().val() or {}
            
            # Updated path to items.json
            with open(self.items_path) as f:
                item_database = json.load(f)
                
            inventory_items = []
            for item_id, count in items.items():
                item_data = next((item for item in item_database['items'] 
                                if item['id'] == item_id), None)
                if item_data and count > 0:
                    inventory_items.append({
                        **item_data,
                        'count': count
                    })
                    
            return inventory_items
        except Exception as e:
            print(f"Failed to load inventory: {e}")
            return []
    
    def update_currency(self, currency_type, amount):
        if not self.current_user:
            return False
        
        try:
            user_id = self.current_user['localId']
            currency_ref = f"users/{user_id}/currency/{currency_type}"
            current_amount = self.db.child(currency_ref).get().val() or 0
            self.db.child(currency_ref).set(current_amount + amount)
            return True
        except Exception as e:
            print(f"Failed to update currency: {e}")
            return False
    
    def add_skin(self, skin_id):
        if not self.current_user:
            return False
        
        try:
            user_id = self.current_user['localId']
            skin_ref = f"users/{user_id}/skins/{skin_id}"
            # Check if skin already owned
            if self.db.child(skin_ref).get().val():
                return False
            # Add new skin
            self.db.child(skin_ref).set(1)
            return True
        except Exception as e:
            print(f"Failed to add skin: {e}")
            return False