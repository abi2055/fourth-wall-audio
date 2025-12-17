from fastapi import FastAPI, HTTPException
from services.gemini_service import extract_characters
import os

app = FastAPI()

# Helper function to load books text from data folder
def load_book_text(book_filename):
    file_path = f"data/books/{book_filename}"
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Book file '{book_filename}' not found.")
    with open(file_path, 'r', encoding='utf-8') as file:
        return file.read()
    
@app.get("/")
def read_root():
    return {"message": "Fourth Wall Audio Backend is running."}

@app.get("/books/{book_filename}/characters")
def get_book_characters(book_filename: str):
    """
    Steps:
    1. Reads the book text file from the data/books/ directory.
    2. Calls the Gemini service to extract characters.
    3. Returns the character list with voice IDs
    """

    text = load_book_text(book_filename)
    if not text:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Call our Gemini Service
    character_list = extract_characters(book_filename, text)
    return character_list

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
