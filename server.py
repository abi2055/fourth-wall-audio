from flask import Flask, jsonify
from flask_cors import CORS
from google.cloud import firestore
import os

app = Flask(__name__)
CORS(app)

db = firestore.Client(os.getenv('GOOGLE_CLOUD_PROJECT'))

@app.route('/book/<book_id>', methods=['GET'])
def get_book(book_id):
    print(f"Fetching book with ID: {book_id}")
    doc_ref = db.collection('books').document(book_id)
    doc = doc_ref.get()

    if not doc.exists:
        return jsonify({"error": "Book not found"}), 404

    return jsonify(doc.to_dict())

if __name__ == '__main__':
    print("Starting Flask server...")
    app.run(port=5000, debug=True)