from google import genai
from google.genai import types
from pathlib import Path
import json
import time
import os
from dotenv import load_dotenv

load_dotenv()

client = genai.Client()

# Define your "Troupe" of available ElevenLabs Voice IDs
VOICE_ARCHETYPES = [
    {"id": "2mltbVQP21Fq8XgIfRQJ", "type": "Male Voice 1", "desc": "Young, Confident, Energetic, Male, British"}, 
    {"id": "NmpxQl3ZUbfh8HgoNCGM", "type": "Male Voice 2", "desc": "Neutral, Professional, Clear, Male, British"},
    {"id": "6sFKzaJr574YWVu4UuJF", "type": "Male Voice 3", "desc": "Deep, Strong, Wise, Male, British"},
    {"id": "goT3UYdM9bhm0n2lmKQx", "type": "Male Voice 4", "desc": "Deep, Raspy, Dark, Low, Male, British"},
    {"id": "rfkTsdZrVWEVhDycUYn9", "type": "Female Voice 1", "desc": "Witty, Sharp-tongued, Young, Female, British"},
    {"id": "rCmVtv8cYU60uhlsOo1M", "type": "Female Voice 2", "desc": "Soft, British, Young, Warm, Female, British"}
]

# 1. soft, british, young, female voice -> voice ID: rCmVtv8cYU60uhlsOo1M
# 2. Witty, sharp-tongued, young, female, british voice -> voice ID:rfkTsdZrVWEVhDycUYn9
# 3. Deep, raspy, authoritative, british/european voice -> voice ID: goT3UYdM9bhm0n2lmKQx
# 4. Old, wise, slow, shaky, european voice -> voice ID: 6sFKzaJr574YWVu4UuJF
# 5. Neutral, professional, clear, british voice -> voice ID: NmpxQl3ZUbfh8HgoNCGM
# 6. Loud, energetic, young, british male voice -> voice ID: 2mltbVQP21Fq8XgIfRQJ

def extract_characters(book_filename, book_text):

    base_dir = Path(__file__).resolve().parent.parent
    cache_path = base_dir / "data" / "character_cache" / f"{book_filename}.json"

    if cache_path.exists():
        print(f"DEBUG: Cache found for {book_filename}, Loading from disk...")
        with open(cache_path, "r") as f:
            return json.load(f)

    sample_text = book_text[:15000]  # Use the first 30,000 characters as a sample
    
    prompt_text = f"""
    Analyze the following text from a book.
    
    CRITICAL INSTRUCTION:
    The provided text may contain a Title Page, Preface, Introduction, or Copyright notices. 
    COMPLETELY IGNORE these sections. Do NOT list the author (e.g., Jane Austen), editors, or critics as characters.
    
    Only extract **fictional characters** who actually appear, speak, or are described in the **story itself**.
    
    Task:
    Identify the 3-4 most important fictional characters in the narrative section of this text.
    
    For each character:
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

    max_retries = 4
    attempt = 0

    while attempt < max_retries:
        try:
            print(f"DEBUG: Attempt {attempt + 1} of {max_retries}...")
            response = client.models.generate_content(
                model="gemini-2.0-flash",
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

            # 1. Handle Safety Blocks (If text is None)
            if not raw_text:
                print("Error: Gemini returned empty text. Likely a Safety Filter trigger.")
                return {"error": "Content blocked by safety filters"}

            # 2. Clean Markdown (Remove ```json and ```)
            clean_text = raw_text.strip()
            if clean_text.startswith("```"):
                # Remove first line (```json) and last line (```)
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
                cache_path.parent.mkdir(parents=True, exist_ok=True)
                with open(cache_path, "w") as f:
                    json.dump(result_json, f, indent=2)

                return result_json

        except Exception as e:
            print(f"Error occurred: {e}")
            return {"error": str(e)}
