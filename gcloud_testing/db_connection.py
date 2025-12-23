from google.cloud import firestore
import os

db = firestore.Client(project=os.getenv("GOOGLE_CLOUD_PROJECT"))

def get_books_collection():
    doc = db.collection("books").document("Hc9F4YvSRFIdUXYH50YC").get()

    if not doc.exists:
        return None

    return {
        "id": doc.id,
        **doc.to_dict()
    }

result = get_books_collection()

if result:
    print("Book Document Data:", result["book_text"])