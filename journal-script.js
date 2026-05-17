// ============================================================================
// 1. NEURAL NETWORK BACKGROUND CANVAS ENGINE
// ============================================================================
const canvas = document.getElementById('canvas-stars');
const ctx = canvas.getContext('2d');
let nodes = [];

const networkConfig = {
    bgColor: '#03030a',
    nodeCount: 85,           
    maxVelocity: 0.14,       
    synapseRange: 130,      
    minSize: 1.5,           
    maxSize: 4.5
};

const networkPalette = ['226, 232, 240', '122, 162, 247', '187, 154, 247', '245, 158, 11', '255, 255, 255'];

window.onresize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };

class NeuralNode {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * (networkConfig.maxSize - networkConfig.minSize) + networkConfig.minSize;
        this.vx = Math.random() * (networkConfig.maxVelocity * 2) - networkConfig.maxVelocity;
        this.vy = Math.random() * (networkConfig.maxVelocity * 2) - networkConfig.maxVelocity;
        this.biasPhase = Math.random() * Math.PI;
        this.pulseSpeed = Math.random() * 0.02 + 0.008;
        this.color = networkPalette[Math.floor(Math.random() * networkPalette.length)];
    }
    update() {
        if (this.x > canvas.width || this.x < 0) this.vx *= -1;
        if (this.y > canvas.height || this.y < 0) this.vy *= -1;
        this.x += this.vx;
        this.y += this.vy;
        this.biasPhase += this.pulseSpeed;
    }
    draw() {
        let activation = 0.25 + (Math.sin(this.biasPhase) * 0.75);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color}, ${activation})`;
        ctx.fill();

        if (this.size > 3.8) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.color}, ${activation * 0.15})`;
            ctx.fill();
        }
    }
}

function initNetwork() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    nodes = [];
    for (let i = 0; i < networkConfig.nodeCount; i++) nodes.push(new NeuralNode());
    animateNetwork();
}

function animateNetwork() {
    ctx.fillStyle = networkConfig.bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < nodes.length; i++) {
        nodes[i].update();
        nodes[i].draw();
        
        for (let j = i + 1; j < nodes.length; j++) {
            let dx = nodes[i].x - nodes[j].x;
            let dy = nodes[i].y - nodes[j].y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < networkConfig.synapseRange) {
                let weight = (1 - distance / networkConfig.synapseRange);
                let alpha = weight * 0.35; 
                
                ctx.strokeStyle = `rgba(226, 232, 240, ${alpha})`;
                ctx.lineWidth = weight * 0.8; 
                ctx.beginPath();
                ctx.moveTo(nodes[i].x, nodes[i].y);
                ctx.lineTo(nodes[j].x, nodes[j].y);
                ctx.stroke();
            }
        }
    }
    requestAnimationFrame(animateNetwork);
}

initNetwork();

// ============================================================================
// 2. FIREBASE INTEGRATION & ARCHITECTURE HOOKS
// ============================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, push, onValue, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

import { firebaseConfig } from './config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

function getStardate() {
    const now = new Date();
    return `SOL_INDEX: [ ${now.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' }).toUpperCase()} ]`;
}

function updateClock() {
    const clockEl = document.getElementById('liveClock');
    if (clockEl) clockEl.innerText = getStardate();
}
setInterval(updateClock, 1000);

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.assign("./index.html");
    } else {
        updateClock();
        initializeWorkspace(user.uid);
    }
});

function initializeWorkspace(uid) {
    const titleField = document.getElementById('entryTitle');
    const inputField = document.getElementById('entryInput');
    const saveBtn = document.getElementById('saveBtn');
    const searchInput = document.getElementById('searchInput');

    if (titleField && !titleField.value) {
        titleField.value = "RECON_LOG_" + Math.floor(Math.random() * 9000 + 1000);
    }

    if (inputField) {
        inputField.addEventListener('input', function() {
            this.style.height = ''; this.style.height = this.scrollHeight + 'px';
        });
    }

    if (saveBtn) {
        const newSaveBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);

        newSaveBtn.addEventListener('click', async () => {
            const content = inputField.value.trim();
            const title = titleField.value.trim() || "UNTITLED_TRANSMISSION";
            if (!content) return;

            newSaveBtn.innerText = "COMMITTING...";
            newSaveBtn.style.pointerEvents = "none";

            // Capture precise local timing snapshot
            const timeSnapshot = new Date();
            const savedDateStr = timeSnapshot.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
            const savedTimeStr = timeSnapshot.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

            // Dynamically bake the timestamp directly into the string title parameter
            const finalizedTitle = `${title.toUpperCase()} [ ${savedDateStr} @ ${savedTimeStr} ]`;

            try {
                await push(ref(db, `journals/${uid}`), {
                    title: finalizedTitle,
                    content: content,
                    timestamp: Date.now(),
                    creationDate: savedDateStr,
                    creationTime: savedTimeStr
                });

                inputField.value = ''; 
                inputField.style.height = '70px';
                titleField.value = "RECON_LOG_" + Math.floor(Math.random() * 9000 + 1000);
            } catch (err) {
                console.error("Cloud write failed:", err);
            } finally {
                newSaveBtn.innerText = "COMMIT_LOG";
                newSaveBtn.style.pointerEvents = "auto";
            }
        });
    }

    let rawEntriesCache = [];
    onValue(ref(db, `journals/${uid}`), (snapshot) => {
        const data = snapshot.val();
        rawEntriesCache = data ? Object.entries(data) : [];
        renderEntriesList(rawEntriesCache);
    });

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const keyword = e.target.value.toLowerCase();
            const filtered = rawEntriesCache.filter(([id, item]) => {
                return item.title.toLowerCase().includes(keyword) || item.content.toLowerCase().includes(keyword);
            });
            renderEntriesList(filtered);
        });
    }
}

// ============================================================================
// 5. RENDER CHANNELS & UNIVERSAL PURGE LISTENERS
// ============================================================================
function renderEntriesList(entriesArray) {
    const container = document.getElementById('entriesList');
    if (!container) return;
    container.innerHTML = '';

    if (entriesArray.length === 0) {
        container.innerHTML = `<div class="entry" style="text-align:center; color:#44475a; font-family:monospace;">ARCHIVE_VACUUM: NO TRANSMISSIONS LOGGED</div>`;
        return;
    }

    entriesArray.sort((a, b) => b[1].timestamp - a[1].timestamp).forEach(([id, item]) => {
        // Fallback layout check: if legacy data has no creation keys, convert timestamp instantly
        let displayDate = "";
        if (item.creationDate && item.creationTime) {
            displayDate = `${item.creationDate} @ ${item.creationTime}`;
        } else {
            displayDate = new Date(item.timestamp).toLocaleString('en-GB', { 
                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
            });
        }
        
        const card = document.createElement('div');
        card.className = 'entry';
        card.innerHTML = `
            <div class="entry-header">
                <strong class="entry-title">${item.title}</strong>
                <span class="entry-time">${displayDate}</span>
            </div>
            <p class="entry-content">${item.content}</p>
            <div style="text-align: right; margin-top: 15px;">
                <button data-id="${id}" class="purge-trigger-btn" style="background:none; border:none; color:#f7768e; font-family:monospace; font-size:0.75rem; cursor:pointer; padding: 4px 8px;">
                    [ PURGE_DATA ]
                </button>
            </div>
        `;
        container.appendChild(card);
    });

    // Safely apply click observers on legacy and fresh nodes alike
    document.querySelectorAll('.purge-trigger-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const currentUserID = auth.currentUser ? auth.currentUser.uid : null;
            if (currentUserID && confirm("Authorize absolute data purge of this log index?")) {
                remove(ref(db, `journals/${currentUserID}/${id}`));
            }
        });
    });
}

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => window.location.assign("./index.html"));
    });
}