from google import genai
import os
from google.genai.types import HttpOptions

client = genai.Client()

try:
    print("Listing available models...\n")
    
    for model in client.models.list():
        
        actions = getattr(model, "supported_actions", [])
        
        if actions and "generateContent" in actions:
            print(f"- {model.name}")

except Exception as e:
    print(f"\nCRITICAL ERROR: {e}")