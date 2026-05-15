import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, push, onValue, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDzp7JqZSjSpr_4rb_FNvYGTPE8cnLYnvM",
    authDomain: "journal-94c51.firebaseapp.com",
    projectId: "journal-94c51",
    storageBucket: "journal-94c51.firebasestorage.app",
    messagingSenderId: "213844260707",
    appId: "1:213844260707:web:ab5708d2cf72008e198556",
    databaseURL: "https://journal-94c51-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Helper to get current time string
function getNowString() {
    return new Date().toLocaleString('en-GB', { 
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
    });
}

// --- AUTH OBSERVER ---
onAuthStateChanged(auth, (user) => {
    const page = window.location.pathname.split("/").pop();
    if (user) {
        if (page === "index.html" || page === "") {
            window.location.assign("./journal.html");
        } else {
            const titleField = document.getElementById('entryTitle');
            if (titleField) titleField.value = getNowString();
            loadEntries(user.uid);
        }
    } else if (page === "journal.html") {
        window.location.assign("./index.html");
    }
});

// --- SAVE LOGIC ---
const saveBtn = document.getElementById('saveBtn');
if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
        console.log("Save button clicked"); // Debug log
        
        const titleField = document.getElementById('entryTitle');
        const inputField = document.getElementById('entryInput');
        
        const title = titleField.value.trim() || getNowString();
        const content = inputField.value.trim();

        if (!content) {
            alert("Please write something before saving!");
            return;
        }

        if (auth.currentUser) {
            try {
                const userRef = ref(db, 'journals/' + auth.currentUser.uid);
                await push(userRef, {
                    title: title,
                    content: content,
                    timestamp: Date.now()
                });
                
                console.log("Entry saved successfully!");
                
                // Reset UI
                inputField.value = '';
                inputField.style.height = '60px'; 
                titleField.value = getNowString();
            } catch (error) {
                console.error("Firebase Save Error:", error);
                alert("Error saving to database. Check console.");
            }
        } else {
            console.log("No user logged in.");
        }
    });
}

// --- LOAD ENTRIES ---
function loadEntries(uid) {
    const userRef = ref(db, 'journals/' + uid);
    onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        const container = document.getElementById('entriesList');
        if (!container) return;
        
        container.innerHTML = '';
        if (data) {
            const entries = Object.entries(data).map(([id, val]) => ({ id, ...val }));
            entries.sort((a, b) => b.timestamp - a.timestamp).forEach(e => {
                const div = document.createElement('div');
                div.className = 'entry';
                div.style = "background:white; padding:15px; border:1px solid #ddd; border-radius:8px; margin-bottom:15px;";
                div.innerHTML = `
                    <div style="display:flex; justify-content:space-between; border-bottom:1px solid #eee; padding-bottom:5px; margin-bottom:10px;">
                        <strong style="color:#007bff;">${e.title}</strong>
                        <button onclick="deleteEntry('${e.id}')" style="color:red; background:none; border:none; cursor:pointer;">Delete</button>
                    </div>
                    <p style="white-space: pre-wrap; margin:0;">${e.content}</p>
                `;
                container.appendChild(div);
            });
        }
    });
}

// Global functions for buttons
window.deleteEntry = (id) => {
    if(confirm("Delete this entry?")) {
        remove(ref(db, `journals/${auth.currentUser.uid}/${id}`));
    }
};

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) logoutBtn.addEventListener('click', () => signOut(auth));