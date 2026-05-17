// ============================================================================
// 1. STARDUST & METEOR ENGINE (UNTOUCHED VISUAL LOGIC)
// ============================================================================
const canvas = document.getElementById('canvas-stars');
const ctx = canvas.getContext('2d');
let stars = [];
let shootingStars = [];

const config = {
    bgColor: '#03030a',
    starCount: 100,          
    maxVelocity: 0.12,       
    lineLength: 120,        
    minSize: 1.5,           
    maxSize: 4.5,
    shootingStarChance: 0.008 
};

const stellarPalette = [
    '226, 232, 240', '122, 162, 247', '187, 154, 247', '245, 158, 11', '255, 255, 255'
];

window.onresize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };

class Star {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * (config.maxSize - config.minSize) + config.minSize;
        this.velocityX = Math.random() * (config.maxVelocity * 2) - config.maxVelocity;
        this.velocityY = Math.random() * (config.maxVelocity * 2) - config.maxVelocity;
        this.twinkleSpeed = Math.random() * 0.02 + 0.008;
        this.phase = Math.random() * Math.PI;
        this.color = stellarPalette[Math.floor(Math.random() * stellarPalette.length)];
    }
    update() {
        if (this.x > canvas.width || this.x < 0) this.velocityX *= -1;
        if (this.y > canvas.height || this.y < 0) this.velocityY *= -1;
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.phase += this.twinkleSpeed;
    }
    draw() {
        let alpha = 0.25 + (Math.sin(this.phase) * 0.75);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color}, ${alpha})`;
        ctx.fill();

        if (this.size > 3.8) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.color}, ${alpha * 0.15})`;
            ctx.fill();
        }
    }
}

class ShootingStar {
    constructor() { this.reset(); }
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * (canvas.height * 0.4); 
        this.length = Math.random() * 80 + 40; 
        this.speed = Math.random() * 12 + 6;   
        this.dx = (Math.random() > 0.5 ? 1 : -1) * this.speed;
        this.dy = Math.random() * 4 + this.speed; 
        this.active = true;
        this.opacity = 1.0;
        this.fadeSpeed = Math.random() * 0.02 + 0.015; 
    }
    update() {
        this.x += this.dx; this.y += this.dy; this.opacity -= this.fadeSpeed;
        if (this.opacity <= 0 || this.x < 0 || this.x > canvas.width || this.y > canvas.height) {
            this.active = false;
        }
    }
    draw() {
        if (!this.active) return;
        ctx.save();
        ctx.opacity = this.opacity;
        let gradient = ctx.createLinearGradient(this.x, this.y, this.x - this.dx, this.y - this.dy);
        gradient.addColorStop(0, `rgba(226, 232, 240, ${this.opacity})`); 
        gradient.addColorStop(1, `rgba(122, 162, 247, 0)`);               
        ctx.strokeStyle = gradient;
        ctx.lineWidth = Math.random() * 1.5 + 1.0; 
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - (this.dx * 1.5), this.y - (this.dy * 1.5)); 
        ctx.stroke();
        ctx.restore();
    }
}

function init() {
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    for (let i = 0; i < config.starCount; i++) stars.push(new Star());
    animate();
}

function animate() {
    ctx.fillStyle = config.bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i in stars) {
        stars[i].update(); stars[i].draw();
        for (let j in stars) {
            let dx = stars[i].x - stars[j].x;
            let dy = stars[i].y - stars[j].y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < config.lineLength) {
                let alpha = (1 - distance / config.lineLength) * 0.35; 
                ctx.strokeStyle = `rgba(226, 232, 240, ${alpha})`;
                ctx.lineWidth = 0.6; 
                ctx.beginPath(); ctx.moveTo(stars[i].x, stars[i].y); ctx.lineTo(stars[j].x, stars[j].y); ctx.stroke();
            }
        }
    }

    if (Math.random() < config.shootingStarChance) shootingStars.push(new ShootingStar());
    for (let k = shootingStars.length - 1; k >= 0; k--) {
        shootingStars[k].update(); shootingStars[k].draw();
        if (!shootingStars[k].active) shootingStars.splice(k, 1);
    }
    requestAnimationFrame(animate);
}

// Fire up the background stars instantly
init();


// ============================================================================
// 2. SECURE FIREBASE AUTHENTICATION MODULE
// ============================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { firebaseConfig } from './config.js';
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Session Verification: Auto-forward if already signed in
onAuthStateChanged(auth, (user) => {
    if (user) {
        window.location.assign("./journal.html");
    }
});

// Wait safely for the HTML structure to mount, then listen for click coordinates
document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('loginBtn');
    const errEl = document.getElementById('errorMessage');

    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            const email = document.getElementById('username').value.trim();
            const pass = document.getElementById('password').value;

            if (!email || !pass) {
                if (errEl) errEl.innerText = "COORDINATES INCOMPLETE";
                return;
            }

            // Interactive state change
            loginBtn.innerText = "COMPUTING...";
            loginBtn.style.pointerEvents = "none";
            if (errEl) errEl.innerText = ""; // Clear old errors

            signInWithEmailAndPassword(auth, email, pass)
                .then(() => {
                    // Success is handled automatically by the onAuthStateChanged observer above
                    console.log("Handshake successful.");
                })
                .catch((error) => {
                    console.error("Authentication Error Details:", error.code);
                    loginBtn.innerText = "ALIGN_OPTICS";
                    loginBtn.style.pointerEvents = "auto";
                    
                    // Custom user-facing dashboard messaging
                    if (errEl) {
                        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                            errEl.innerText = "INVALID IDENTITY SIGNAL";
                        } else {
                            errEl.innerText = "TRANSMISSION BLOCKED";
                        }
                    }
                });
        });
    }
});