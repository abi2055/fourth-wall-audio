# Fourth Wall Audio
> **Interactive Audiobooks Powered by AI**

[![Live Demo](https://img.shields.io/badge/Live_Demo-Click_Here-FF5722?style=for-the-badge&logo=google-cloud)](YOUR_SHORTENED_URL_HERE)
[![Hackathon](https://img.shields.io/badge/Submission-AI_Partner_Catalyst-blue?style=flat)](https://ai-partner-catalyst.devpost.com/)
[![Google Gemini](https://img.shields.io/badge/AI-Google_Gemini-4285F4?style=flat&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![ElevenLabs](https://img.shields.io/badge/Audio-ElevenLabs-black?style=flat)](https://elevenlabs.io/)

## About
**Fourth Wall Audio** transforms standard text files into immersive, full-cast audio productions instantly.

Submitted for the **AI Partner Catalyst: Accelerate Innovation Hackathon**, this project directly addresses the **ElevenLabs & Google Cloud** challenge to "make apps conversational."

Instead of a single narrator reading a book, Fourth Wall Audio uses **Google Gemini** to analyze the story, identify unique characters, and understand their personalities. It then "casts" these characters using **ElevenLabs'** advanced voice synthesis, assigning a unique, emotionally resonant voice to each role. The result is an audiobook that feels like a radio drama, generated on the fly.

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

