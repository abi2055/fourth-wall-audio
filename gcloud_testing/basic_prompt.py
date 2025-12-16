from google import genai
from google.genai.types import HttpOptions

client = genai.Client()

print("sending request...")
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="How does AI work?",
)

print("response received:")
print(response.text)