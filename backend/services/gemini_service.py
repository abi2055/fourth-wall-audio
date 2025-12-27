from google import genai
from google.genai import types
from pathlib import Path
import json
import time
import os
from dotenv import load_dotenv
from google.cloud import firestore

load_dotenv(override=True)

client = genai.Client()

db = firestore.Client(project=os.getenv("GOOGLE_CLOUD_PROJECT"))

VOICE_ARCHETYPES = [
    {"id": "2mltbVQP21Fq8XgIfRQJ", "type": "Axell (Young/Energetic)", "desc": "Young, Confident, Energetic, Male, British"}, 
    {"id": "NmpxQl3ZUbfh8HgoNCGM", "type": "William (Refined)", "desc": "Neutral, Professional, Clear, Male, British"},
    {"id": "6sFKzaJr574YWVu4UuJF", "type": "Axell (Young/Energetic)", "desc": "Deep, Strong, Wise, Male, British"},
    {"id": "goT3UYdM9bhm0n2lmKQx", "type": "Edward (Dark)", "desc": "Deep, Raspy, Dark, Low, Male, British"},
    {"id": "2ajXGJNYBR0iNHpS4VZb", "type": "Rob (Tough)", "desc": "Tough, gritty, Experienced, middle-aged, Male, British"},
    {"id": "rfkTsdZrVWEVhDycUYn9", "type": "Shelby (Witty)", "desc": "Witty, Sharp-tongued, Young, Female, British"},
    {"id": "rCmVtv8cYU60uhlsOo1M", "type": "Ana (Young/Soft)", "desc": "Soft, British, Young, Warm, Female, British"},
    {"id": "rWArYo7a2NWuBYf5BE4V", "type": "Annabel (Elegant)", "desc": "Elegant, poised, calm, Female, British"},
    {"id": "RILOU7YmBhvwJGDGjNmP", "type": "Jane (Mature)", "desc": "Strong, old, commanding, mature, Female, British"},
    {"id": "GsjQ0ydx7QzhDLqInGtT", "type": "Olivia (Suspenseful)", "desc": "Suspensful, dark, steady, Female, British"}
]

# 1. soft, british, young, female voice -> voice ID: rCmVtv8cYU60uhlsOo1M
# 2. Witty, sharp-tongued, young, female, british voice -> voice ID:rfkTsdZrVWEVhDycUYn9
# 3. Deep, raspy, authoritative, british/european voice -> voice ID: goT3UYdM9bhm0n2lmKQx
# 4. Old, wise, slow, shaky, european voice -> voice ID: 6sFKzaJr574YWVu4UuJF
# 5. Neutral, professional, clear, british voice -> voice ID: NmpxQl3ZUbfh8HgoNCGM
# 6. Loud, energetic, young, british male voice -> voice ID: 2mltbVQP21Fq8XgIfRQJ
# 7. Elegant, poised, calm, british woman voice -> voice ID: rWArYo7a2NWuBYf5BE4V
# 8. Tough, gritty, Experienced, middle-aged, british male voice -> voice ID: 2ajXGJNYBR0iNHpS4VZb
# 9. Strong, old, commanding, mature, british woman voice -> voice ID: RILOU7YmBhvwJGDGjNmP
# 10. Suspensful, dark, steady, british woman voice -> voice ID: GsjQ0ydx7QzhDLqInGtT

def save_book_to_db(book_title, characters_data, book_text):
    doc_ref = db.collection("books").document(book_title)
    doc_ref.set({
        "book_title": book_title,
        "characters": characters_data
        # "book_text": book_text
    })
    print(f"Book '{book_title}' saved to Firestore.")

def extract_characters(book_filename, book_text):

    base_book_title = os.path.splitext(book_filename)[0]

    # checking cloud
    doc_ref = db.collection("books").document(base_book_title)
    doc = doc_ref.get()

    if doc.exists:
        data = doc.to_dict()
        if data.get("characters"):
            print(f"Found existing book '{base_book_title}' in Firestore. Returning cached characters.")
            return {"book_title": base_book_title, "characters": data.get("characters")}

    sample_text = book_text[:30000]  # Use the first 30,000 characters as a sample
    
    prompt_text = f"""
    Analyze the following text from a book.
    
    CRITICAL INSTRUCTION:
    The provided text may contain a Title Page, Preface, Introduction, or Copyright notices. 
    COMPLETELY IGNORE these sections. Do NOT list the author (e.g., Jane Austen), editors, or critics.
    
    Only extract **fictional characters** who act as MAJOR or KEY SUPPORTING roles in the **story itself**.
    
    SELECTION RULES (STRICT):
    1. **Proper Names Only:** Characters MUST have a proper name (e.g., "Elizabeth Bennet"). Do NOT include generic descriptions like "The Boy", "The Servant", "A Soldier", or "Boy with pitchfork".
    2. **Significance:** The character must have dialogue or drive the plot. Exclude background "extras" or named characters who only appear once.
    3. **Limit:** Identify the top 4-8 most significant characters found in this text chunk.

    Task:
    For each selected character:
    1. Write a 'system_prompt' that defines their personality, speech style, and hidden motivations.
    2. Assign them the BEST matching 'voice_id' from the list of Available Voices below.
    
    Available Voices:
    {json.dumps(VOICE_ARCHETYPES, indent=2)}

    Return the result strictly as a JSON object with this structure:
    {{
        "book_title": "Title detected",
        "characters": [
            {{
                "name": "Character Name",
                "description": "Short bio",
                "system_prompt": "You are [Name]. You speak with...",
                "assigned_voice_id": "The ID from the list above"
            }}
        ]
    }}

    Text to analyze:
    {sample_text}
    """

    max_retries = 5
    attempt = 0

    while attempt < max_retries - 1:
        try:
            print(f"DEBUG: Attempt {attempt + 1} of {max_retries}...")
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt_text,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    safety_settings=[
                        types.SafetySetting(
                            category="HARM_CATEGORY_HATE_SPEECH",
                            threshold="BLOCK_NONE"
                        ),
                        types.SafetySetting(
                            category="HARM_CATEGORY_HARASSMENT",
                            threshold="BLOCK_NONE"
                        ),
                        types.SafetySetting(
                            category="HARM_CATEGORY_SEXUALLY_EXPLICIT",
                            threshold="BLOCK_NONE"
                        ),
                        types.SafetySetting(
                            category="HARM_CATEGORY_DANGEROUS_CONTENT",
                            threshold="BLOCK_NONE"
                        )
                    ]
                )
                
            )

            raw_text = response.text
            print(f"DEBUG LOG: Gemini Response Text: {raw_text}")

            # Handle Safety Blocks (If text is None)
            if not raw_text:
                print("Error: Gemini returned empty text. Likely a Safety Filter trigger.")
                return {"error": "Content blocked by safety filters"}

            # Clean Markdown (Remove ```json and ```)
            clean_text = raw_text.strip()
            if clean_text.startswith("```"):
                clean_text = "\n".join(clean_text.split("\n")[1:-1])
            
            result_json = json.loads(clean_text)

            if not result_json.get("characters"):
                attempt += 1
                print(f"Error: No characters found in the response. Attempting Retry...")
                wait_time = 2 * (2 ** (attempt - 1))  # Exponential backoff
                print(f"Waiting for {wait_time} seconds before retrying...")
                time.sleep(wait_time)
                continue
            else:
                # Save to cache
                save_book_to_db(book_title=base_book_title, characters_data=result_json.get("characters", []), book_text=book_text)
                return result_json

        except Exception as e:
            print(f"Error occurred: {e}")
            return {"error": str(e)}
