import { Conversation } from '@elevenlabs/client'

const API_URL = "http://127.0.0.1:8000";
const AGENT_ID = "agent_0801kcqmscywerh8vppp1zya3zdq";

window.loadCharacters = loadCharacters
window.startChat = startChat

let conversation = null;

async function loadCharacters(filename) {
    const grid = document.getElementById('character-grid');
    const loading = document.getElementById('loading');
    const title = document.getElementById('stage-title');

    grid.innerHTML = '';
    loading.classList.remove('hidden');
    title.innerText = "Casting characters...";

    try {
        const res = await fetch(`${API_URL}/books/${filename}/characters`);
        const data = await res.json();

        console.log("Character data received:", data);

        if (!data.characters || !Array.isArray(data.characters)) {
            throw new Error("Invalid Data: 'characters' list is missing!");
        }

        loading.classList.add('hidden');
        title.innerText = `Cast of ${data.book_title || "the Book"}`;

        data.characters.forEach(char => {
            const card = document.createElement('div');
            card.className = 'card';

            const safePrompt = encodeURIComponent(char.system_prompt);
            
            card.innerHTML = `
                <div class="meta">Voice: ${char.assigned_voice_id}</div>
                <h3>${char.name}</h3>
                <p>${char.description}</p>
                <button class="chat-btn" onclick="window.startChat(this, '${char.assigned_voice_id}', '${safePrompt}', '${char.name}')">
                    Talk to ${char.name}
                </button>
            `;
            grid.appendChild(card);
        });

    } catch (err) {
        console.error(err);
        loading.classList.add('hidden');
        title.innerText = "Error loading characters. Is the backend running?";
    }
}

function openElevenLabs(voiceId, encodedPrompt) {
    const systemPrompt = decodeURIComponent(encodedPrompt);
    console.log("Opening chat with:", voiceId);
    console.log("Prompt:", systemPrompt);
    
    alert("Next Step: This button will trigger the ElevenLabs widget!\n\nVoice ID: " + voiceId);
}

async function startChat(btnElement, voiceId, encodedPrompt, charName) {
    const systemPrompt = decodeURIComponent(encodedPrompt);
    const btn = btnElement; 
    const originalText = `Talk to ${charName}`;

    if (conversation) {
        btn.innerText = "Disconnecting...";
        await conversation.endSession();
        conversation = null;
        return;
    }

    btn.innerText = "Requesting Mic...";
    btn.disabled = true;

    try {
        // 1. Get Microphone Access
        await navigator.mediaDevices.getUserMedia({ audio: true });

        btn.innerText = "Connecting...";

        console.log(`Starting conversation with ${charName}, Voice ID: ${voiceId}`);
        console.log("System Prompt:", systemPrompt);
        conversation = await Conversation.startSession({
            agentId: AGENT_ID,
            overrides: {
                tts: { 
                    voiceId: voiceId // We force the agent to use the Gemini-selected voice
                },
                agent: { 
                    prompt: { 
                        prompt: systemPrompt // We force the agent to become the character
                    },
                    firstMessage: `(In character) I am listening` 
                }
            },
            onConnect: () => {
                // Connection successful!
                btn.innerText = `Listening to ${charName}... (Click to Stop)`;
                btn.disabled = false;
                btn.style.backgroundColor = "#d63031"; // Red
                btn.style.color = "white";
            },
            onDisconnect: () => {
                console.log("Disconnected.");
                btn.innerText = originalText; 
                btn.disabled = false;
                btn.style.backgroundColor = ""; 
                btn.style.color = "";
                conversation = null; 
            },
            onError: (err) => {
                console.error("Conversation Error:", err);
                btn.innerText = "Error";
                conversation = null;
            },
            onModeChange: (mode) => {
                // Optional: You can see if the AI is 'speaking' or 'listening'
                if (mode.mode === 'speaking') {
                    btn.innerText = `${charName} is speaking...`;
                } else {
                    btn.innerText = `Listening to ${charName}...`;
                }
            }
        });

    } catch (error) {
        console.error("Failed to start conversation:", error);
        btn.innerText = "Connection Failed";
        alert("Check console for errors. (Did you set the Agent ID?)");
        btn.disabled = false;
    }
}