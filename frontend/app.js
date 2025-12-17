const API_URL = "http://127.0.0.1:8000";

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
                <button class="chat-btn" onclick="openElevenLabs('${char.assigned_voice_id}', '${safePrompt}')">
                    Talk to ${char.name.split(' ')[0]}
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