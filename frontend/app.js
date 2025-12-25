import { Conversation } from '@elevenlabs/client'

const API_URL = "http://127.0.0.1:5000";
const AGENT_ID = "agent_9401kcq42qc0e4a8ys3pnty630rb";

window.loadCharacters = loadCharacters
window.startChat = startChat
window.endChat = endChat;
window.handleUpload = handleUpload;

let conversation = null;

const urlparams = new URLSearchParams(window.location.search);
const tokenFromUrl = urlparams.get('access');

if (tokenFromUrl) {
    localStorage.setItem('fourth_wall_token', tokenFromUrl);
    window.history.replaceState({}, document.title, "/");
}

const AUTH_TOKEN = localStorage.getItem('fourth_wall_token');

if (!AUTH_TOKEN) {
    console.warn("No Auth Token found. API calls might fail.");
}

async function handleUpload(inputElement) {
    const file = inputElement.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert("File too large! Please upload a file smaller than 5MB.");
        return;
    }

    const loading = document.getElementById('loading');
    const title = document.getElementById('stage-title');
    const grid = document.getElementById('character-grid');

    grid.innerHTML = '';
    loading.classList.remove('hidden');
    title.innerText = "Uploading book...";

    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const headers = {}
        if (AUTH_TOKEN) {
            headers['X-Access-Token'] = AUTH_TOKEN; // <--- Send the key!
        }

        const res = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            body: formData,
            headers: headers
        });
        
        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Upload failed: ${err}`);
        }
        
        const data = await res.json();
        console.log("Upload response:", data);

        renderCharacterCards(data);
        addToSidebar(data.book_title);

    } catch (err) {
        console.error(err);
        loading.classList.add('hidden');
        title.innerText = "Internal Error: Could not upload book.";
    } finally {
        inputElement.value = ''; // Reset file input
    }
}

function addToSidebar(bookId) {
    const list = document.getElementById('book-list');
    const existing = Array.from(list.children).find(btn => btn.innerText === formatTitle(bookId));
    if (existing) return;
    const btn = document.createElement('button');
    btn.className = 'book-btn';
    btn.innerText = formatTitle(bookId);
    btn.onclick = () => loadCharacters(bookId);
    if (list.children.length > 1) {
        list.insertBefore(btn, list.children[1]);
    } else {
        list.appendChild(btn);
    }
}

function renderCharacterCards(data) {
    const grid = document.getElementById('character-grid');
    const loading = document.getElementById('loading');
    const title = document.getElementById('stage-title');

    loading.classList.add('hidden');
    const bookTitle = formatTitle(data.book_title);
    title.innerText = `Cast of ${bookTitle}`;

    data.characters.forEach(char => {
        const card = document.createElement('div');
        card.className = 'card';

        // 1. Create the HTML *without* the complex onclick string
        card.innerHTML = `
            <button class="close-btn">×</button>
            <div class="meta">Voice: ${char.assigned_voice_id}</div>
            <h3>${char.name}</h3>
            <p>${char.description}</p>
            <div class="transcript"></div>
            <button class="chat-btn">Talk to ${char.name}</button>
        `;

        // 2. Attach the "Talk" logic safely using JavaScript
        // This method handles apostrophes, quotes, and newlines automatically.
        const chatBtn = card.querySelector('.chat-btn');
            
        chatBtn.addEventListener('click', () => {
            // We pass the raw data directly. No encoding needed here!
            window.startChat(
                chatBtn, 
                char.assigned_voice_id, 
                encodeURIComponent(char.system_prompt), 
                encodeURIComponent(char.name)
            );
        });

        // 3. Attach the "Close" logic
        card.querySelector('.close-btn').addEventListener('click', window.endChat);

        grid.appendChild(card);
    });
}

function formatTitle(filename) {
    if (!filename) return "Unknown Book";
    
    // 1. Remove file extension if present (e.g. .txt)
    let clean = filename.replace(/\.txt$/i, '');

    // Remove timestamp if present (e.g. gatsby_173515...)
    clean = clean.replace(/_\d+$/, '');
    
    // 2. Split by underscores OR hyphens
    let words = clean.split(/[_-]/);
    
    // 3. Capitalize first letter of each word and join them
    return words.map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

async function loadCharacters(filename) {
    const grid = document.getElementById('character-grid');
    const loading = document.getElementById('loading');
    const title = document.getElementById('stage-title');

    grid.innerHTML = '';
    loading.classList.remove('hidden');
    title.innerText = "Casting characters...";

    try {
        const headers = {}
        if (AUTH_TOKEN) {
            headers['X-Access-Token'] = AUTH_TOKEN; // <--- Send the key!
        }

        const res = await fetch(`${API_URL}/book/${filename}`, { headers: headers });
        const data = await res.json();
        console.log("Character data:", data);
        renderCharacterCards(data);   
    } catch (err) {
        console.error(err);
        loading.classList.add('hidden');
        title.innerText = "Internal Error: Could not load characters.";
    }
}

// function openElevenLabs(voiceId, encodedPrompt) {
//     const systemPrompt = decodeURIComponent(encodedPrompt);
//     console.log("Opening chat with:", voiceId);
//     console.log("Prompt:", systemPrompt);
    
//     alert("Next Step: This button will trigger the ElevenLabs widget!\n\nVoice ID: " + voiceId);
// }

async function startChat(btnElement, voiceId, encodedPrompt, encodedName) {
    let systemPrompt = decodeURIComponent(encodedPrompt);
    let charName = decodeURIComponent(encodedName);
    systemPrompt += " INSTRUCTION: Keep your responses conversational, brief, and under 3 sentences. Do not monologue.";
    const originalText = `Talk to ${charName}`;

    const btn = btnElement; 
    const card = btn.closest('.card'); 

    if (card.classList.contains('active')) {
        console.log("User requested disconnect.");
        if (conversation) {
            btn.innerText = "Disconnecting...";
            await conversation.endSession(); 
            conversation = null;
        }
        // CRITICAL: We return here so we don't accidentally restart the chat below.
        return; 
    }

    if (conversation) {
        console.log("Switching characters... ending previous session.");
        await conversation.endSession();
        conversation = null;
        // The onDisconnect callback of the OLD session will handle the UI cleanup 
        // for the old card automatically.
    }

    const transcriptBox = card.querySelector('.transcript');

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
                    voiceId: voiceId, // We force the agent to use the Gemini-selected voice
                    modelId: "eleven_turbo_v2"
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
                const source = message.source === 'user' ? 'user' : 'ai';
                const div = document.createElement('div');
                div.className = `msg ${source}`;
                const cleanText = message.message.replace(/<[^>]*>/g, '').trim();
                div.innerText = cleanText;
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