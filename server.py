from flask import Flask, jsonify, render_template
from flask_cors import CORS
from firebase_admin import firestore, credentials, initialize_app
import os
from functools import wraps
from flask import request
from backend.services.gemini_service import extract_characters
from dotenv import load_dotenv

load_dotenv(override=True)

app = Flask(__name__)
CORS(app, resources={r"/*": {
    "origins": "*",  # Allow your frontend
    "allow_headers": ["Content-Type", "Authorization", "X-Access-Token"], # Allow your custom token
    "methods": ["GET", "POST", "OPTIONS"] # Allow these actions
}})

if os.path.exists("/etc/secrets/service_account.json"):
    print("Using service account from /etc/secrets/")
    cred = credentials.Certificate("/etc/secrets/service_account.json")
elif os.path.exists("service_account.json"):
    print("Using service account from local file.")
    cred = credentials.Certificate("service_account.json")
else:
    raise FileNotFoundError("Could not find service_account.json for Firestore authentication.")

try:
    initialize_app(cred)
except ValueError:
    pass

db = firestore.client()

ACCESS_TOKEN = os.getenv("ACCESS_TOKEN", "default_insecure_password")
print(f" DEBUG: Server is expecting this token: '{ACCESS_TOKEN}'")

def require_token(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if request.method == 'OPTIONS':
            return f(*args, **kwargs)
        token = request.headers.get('X-Access-Token')
        if not token or token != ACCESS_TOKEN:
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated_function

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/book/<book_id>', methods=['GET'])
@require_token
def get_book(book_id):
    print(f"Fetching book with ID: {book_id}")
    doc_ref = db.collection('books').document(book_id)
    doc = doc_ref.get()

    if not doc.exists:
        return jsonify({"error": "Book not found"}), 404

    return jsonify(doc.to_dict())

@app.route('/upload', methods=['POST'])
@require_token # If using magic link
def upload_book():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    # Sanitize and Unique-ify the filename
    original_id = os.path.splitext(file.filename)[0]
    # Append minimal timestamp to prevent overwrites
    import time
    book_id = f"{original_id}_{int(time.time())}"
    
    content = file.read().decode('utf-8')
    
    # Process
    result = extract_characters(book_id, content)
    
    # Ensure the ID is in the response so frontend can add it to sidebar
    result['book_title'] = book_id 
    
    return jsonify(result)

@app.route('/books', methods=['GET'])
@require_token
def list_books():
    try:
        # Query Firestore for all documents in 'books'
        books_ref = db.collection('books')
        docs = books_ref.stream()
        
        # Extract just the IDs (e.g., "pride_and_prejudice", "gatsby_1735...")
        book_list = [doc.id for doc in docs]
        
        return jsonify(book_list)
    except Exception as e:
        print(f"Error fetching library: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("Starting Flask server...")
    app.run(port=5000, debug=True)