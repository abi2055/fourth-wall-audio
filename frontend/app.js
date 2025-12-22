import { Conversation } from '@elevenlabs/client'

const API_URL = "http://127.0.0.1:8000";
const AGENT_ID = "agent_0801kcqmscywerh8vppp1zya3zdq";

window.loadCharacters = loadCharacters
window.startChat = startChat
window.endChat = endChat;

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
                <button class="close-btn" onclick="window.endChat()">×</button>
                <div class="meta">Voice: ${char.assigned_voice_id}</div>
                <h3>${char.name}</h3>
                <p>${char.description}</p>
                <div class="transcript" id="transcript-${char.assigned_voice_id}"></div>
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
    let systemPrompt = decodeURIComponent(encodedPrompt);
    systemPrompt += " INSTRUCTION: Keep your responses conversational, brief, and under 3 sentences. Do not monologue.";
    const btn = btnElement; 
    const card = btn.closest('.card'); // Find the parent card
    const transcriptBox = card.querySelector('.transcript');
    const originalText = `Talk to ${charName}`;

    if (conversation) {
        btn.innerText = "Disconnecting...";
        await conversation.endSession();
        conversation = null;

        document.body.classList.remove('chat-active');
        card.classList.remove('active', 'speaking');
        btn.innerText = originalText;
        btn.style.backgroundColor = "";
        btn.style.color = "";
        return;
    }

    btn.innerText = "Requesting Mic...";
    btn.disabled = true;

    try {
        // 1. Get Microphone Access
        await navigator.mediaDevices.getUserMedia({ audio: true });

        btn.innerText = "Connecting...";

        // UI: Enter Focus Mode
        document.body.classList.add('chat-active');
        card.classList.add('active');
        transcriptBox.innerHTML = `<div class="msg ai">System: Connected to ${charName}</div>`;

        console.log(`Starting conversation with ${charName}, Voice ID: ${voiceId}`);
        console.log("System Prompt:", systemPrompt);
        conversation = await Conversation.startSession({
            agentId: AGENT_ID,
            overrides: {
                tts: { 
                    voiceId: "2mltbVQP21Fq8XgIfRQJ" // We force the agent to use the Gemini-selected voice
                },
                agent: { 
                    prompt: { 
                        prompt: systemPrompt // We force the agent to become the character
                    },
                    firstMessage: `I am listening` 
                }
            },
            onConnect: () => {
                // Connection successful!
                btn.innerText = `End Conversation With ${charName}`;
                btn.disabled = false;
                btn.style.backgroundColor = "#444"; 
                btn.style.color = "white";
            },
            onDisconnect: () => {
                conversation = null;
                document.body.classList.remove('chat-active');
                card.classList.remove('active', 'speaking');
                btn.innerText = originalText;
                btn.disabled = false;
                btn.style.backgroundColor = ""; 
                btn.style.color = "";
            },
            onError: (err) => {
                console.error("Conversation Error:", err);
                btn.innerText = "Error";
                conversation = null;
            },
            onModeChange: (mode) => {
                // Optional: You can see if the AI is 'speaking' or 'listening'
                if (mode.mode === 'speaking') {
                    card.classList.add('speaking'); // Trigger Pulse CSS
                } else {
                    card.classList.remove('speaking');
                }
            },
            onMessage: (message) => {
                // Determine if it's user or AI
                const source = message.source === 'user' ? 'user' : 'ai';
                const div = document.createElement('div');
                div.className = `msg ${source}`;
                div.innerText = message.message;
                transcriptBox.appendChild(div);
                transcriptBox.scrollTop = transcriptBox.scrollHeight; // Auto-scroll
            }
        });

    } catch (error) {
        console.error("Failed to start conversation:", error);
        btn.innerText = "Connection Failed";
        alert("Check console for errors. (Did you set the Agent ID?)");
        btn.disabled = false;
    }
}

async function endChat() {
    if (conversation) {
        console.log("X Button clicked. Ending session...");
        await conversation.endSession();
        // No need to remove classes here manually!
        // The 'onDisconnect' listener in startChat will catch this 
        // and do the UI cleanup for us.
    } else {
        // Fallback: If stuck on "Connecting..." and conversation is null, force close UI
        document.body.classList.remove('chat-active');
        document.querySelectorAll('.card.active').forEach(c => c.classList.remove('active', 'speaking'));
        // Re-enable buttons if needed (optional reset logic)
        document.querySelectorAll('.chat-btn').forEach(b => {
            b.disabled = false; 
            b.innerText = b.innerText.replace("Connecting...", "Talk to");
        });
    }
}