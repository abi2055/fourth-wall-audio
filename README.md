# Fourth Wall Audio
> **Interactive Audiobooks Powered by AI**

[![Live Demo](https://img.shields.io/badge/Live_Demo-Click_Here-FF5722?style=for-the-badge&logo=google-cloud)](YOUR_SHORTENED_URL_HERE)
[![Hackathon](https://img.shields.io/badge/Submission-AI_Partner_Catalyst-blue?style=flat)](https://ai-partner-catalyst.devpost.com/)
[![Google Gemini](https://img.shields.io/badge/AI-Google_Gemini-4285F4?style=flat&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![ElevenLabs](https://img.shields.io/badge/Audio-ElevenLabs-black?style=flat)](https://elevenlabs.io/)

> **Note:** The live demo requires an **Access Key** to prevent unauthorized API usage. Judges can find the access key in the submission details or use the specific "Judge Link" provided there.

## About
**Fourth Wall Audio** transforms standard text files into immersive, full-cast audio productions instantly.

Submitted for the **AI Partner Catalyst: Accelerate Innovation Hackathon**, this project directly addresses the **ElevenLabs & Google Cloud** challenge to "make apps conversational."

Instead of a single narrator reading a book, Fourth Wall Audio uses **Google Gemini** to analyze the story, identify unique characters, and understand their personalities. It then "casts" these characters using **ElevenLabs'** advanced voice synthesis, assigning a unique, emotionally resonant voice to each role. The result is a lifelike performance that transforms flat, 2D text into a fully 3D immersive experience, generated on the fly.

---

## The Challenge
This project integrates two key partner technologies to solve the problem of static, monotone text consumption:

1.  **Google Cloud (Gemini):** Used as the "Casting Director." It processes raw text, extracts character metadata, and determines the emotional tone of every line.
2.  **ElevenLabs:** Used as the "Voice Talent." It takes the metadata from Gemini and applies distinct voice IDs to each character, creating a fully conversational and immersive experience.

---

## Key Features
* **Intelligent Casting:** Uses Google Gemini (Pro/Flash) to read text, extract key characters, and generate personality profiles for them.
* **Dynamic Voice Assignment:** Automatically matches character personalities (e.g., "Gritty, Old") to the perfect ElevenLabs voice ID.
* **Real-Time Streaming:** Interactive frontend that loads character data instantly.
* **Cloud Native:** Fully serverless architecture running on Google Cloud Run with Firestore persistence, ensuring high availability and zero maintenance.

---

## Tech Stack
* **Backend:** Python, Flask, Gunicorn
* **AI Logic:** Google Gemini (via `google-genai` SDK)
* **Audio Synthesis:** ElevenLabs API
* **Database:** Google Cloud Firestore (NoSQL)
* **Hosting:** Google Cloud Run (Docker/Containerized)
* **Frontend:** HTML5, CSS3, Vanilla JavaScript

---

## How to Run Locally

### Prerequisites
* Python 3.10 or higher
* A Google Cloud Project with Firestore enabled
* An ElevenLabs API Key
* A Google Gemini API Key

### 1. Clone the Repository
```bash
git clone [https://github.com/yourusername/fourth-wall-audio.git](https://github.com/yourusername/fourth-wall-audio.git)
cd fourth-wall-audio
```

### 2. Clone the Repository
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
```bash
GOOGLE_CLOUD_LOCATION=closest_location
GOOGLE_CLOUD_PROJECT_NUMBER=your_project_ID
GOOGLE_CLOUD_PROJECT=your_project_name
GOOGLE_VERTEX_API_KEY=your_gemini_key_here
GOOGLE_GENAI_USE_VERTEXAI=True
ACCESS_TOKEN=your_access_token
```

### 5. Setup Google Cloud Credentials
Download your Service Account JSON key from Google Cloud IAM

Save it as service_account.json in the root folder.

### 6. Run the App
```bash
python main.py
```
Visit http://127.0.0.1:5000 in your browser.

---

## Deployment (Google Cloud Run)

### 1. Prepare for Cloud
Ensure Procfile exists: web: gunicorn --bind 0.0.0.0:$PORT --workers 1 --threads 8 --timeout 0 main:app

Ensure requirements.txt includes gunicorn.

### 2. Deploy via CLI (or connect GitHub in Console)
```bash
gcloud run deploy fourth-wall-live \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_VERTEX_API_KEY=...,ACCESS_TOKEN=...,GOOGLE_CLOUD_LOCATION=...,GOOGLE_CLOUD_PROJECT_NUMBER=...,GOOGLE_CLOUD_PROJECT=...,GOOGLE_GENAI_USE_VERTEXAI=...
```

### 3. Scaling Config
Min Instances: 1 (Prevents cold starts)

Max Instances: 5 (Prevents budget overrun)

---

## Architecture Overview
1. User uploads a book (.txt).
2. Flask Server sends a sample to Google Gemini.
3. Gemini returns a JSON list of characters with "System Prompts" (personalities) and "Voice IDs".
4. Backend caches this data in Firestore to save API costs on future reads.
5. Frontend displays the cast. When the user clicks "Play", the text is sent to ElevenLabs using the specific character's assigned Voice ID.

---

## Acknowledgements
Built for the AI Partner Catalyst: Accelerate Innovation Hackathon.

Voices provided by the ElevenLabs Community Library.

LLM reasoning powered by Google DeepMind.

