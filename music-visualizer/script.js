const captureBtn = document.getElementById('capture-btn');
const stopBtn = document.getElementById('stop-btn');
const statusMessage = document.getElementById('status-message');
const canvas = document.getElementById('visualizer-canvas');
const ctx = canvas.getContext('2d');
const uiPanel = document.getElementById('ui-panel');
const autoHideToggle = document.getElementById('auto-hide-ui');
const backgroundGlow = document.getElementById('background-glow');

let audioContext;
let analyser;
let mediaStream;
let source;
let animationId;
let isVisualizing = false;

// Cyberpunk Colors
const COLOR_PRIMARY = '#ff2a6d'; // Pink Bass
const COLOR_SECONDARY = '#05d9e8'; // Cyan Treble

// Resize Canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function showStatus(msg, isError = false) {
    statusMessage.textContent = msg;
    statusMessage.className = 'status-message ' + (isError ? 'error' : 'success');
}

// Start Capture Process
captureBtn.addEventListener('click', async () => {
    try {
        // Request Display Media (Screen/Tab sharing)
        let stream;
        try {
            if (navigator.mediaDevices.getDisplayMedia) {
                stream = await navigator.mediaDevices.getDisplayMedia({
                    video: { displaySurface: "browser" }, 
                    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } 
                });
            } else {
                throw new Error("getDisplayMedia not supported");
            }
        } catch(e) {
            // Fallback to Microphone for mobile or if screen sharing fails
            stream = await navigator.mediaDevices.getUserMedia({ 
                audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } 
            });
        }
        mediaStream = stream;

        // Check if audio track exists
        const audioTracks = mediaStream.getAudioTracks();
        if (audioTracks.length === 0) {
            mediaStream.getTracks().forEach(track => track.stop());
            showStatus('Error: No audio shared. Did you check "Share tab audio"?', true);
            return;
        }

        // Setup Audio Context
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;

        source = audioContext.createMediaStreamSource(mediaStream);
        source.connect(analyser);
        // CRITICAL: Do NOT connect analyser to audioContext.destination 
        // because the browser is already playing the sound natively (e.g. Spotify tab)
        // If we connect it, it will echo.

        // Setup stream stop listener (if user clicks 'Stop sharing' in browser UI)
        mediaStream.getVideoTracks()[0].onended = () => {
            stopVisualizer();
        };

        isVisualizing = true;
        captureBtn.classList.add('hidden');
        stopBtn.classList.remove('hidden');
        showStatus('Connected! Playing visualizer...', false);

        if (autoHideToggle.checked) {
            setTimeout(() => { uiPanel.classList.add('hidden'); }, 1000);
        }

        renderFrame();

    } catch (err) {
        console.error(err);
        showStatus('Failed to capture audio. Permission denied.', true);
    }
});

// Stop Visualizer
stopBtn.addEventListener('click', stopVisualizer);

function stopVisualizer() {
    isVisualizing = false;
    cancelAnimationFrame(animationId);
    
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
    }
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    backgroundGlow.style.opacity = 0.1;
    backgroundGlow.style.transform = 'translate(-50%, -50%) scale(1)';

    captureBtn.classList.remove('hidden');
    stopBtn.classList.add('hidden');
    uiPanel.classList.remove('hidden');
    showStatus('');
}

// Show UI on mouse movement if hidden
let mouseTimeout;
document.addEventListener('mousemove', () => {
    if (isVisualizing && autoHideToggle.checked && uiPanel.classList.contains('hidden')) {
        uiPanel.classList.remove('hidden');
        clearTimeout(mouseTimeout);
        mouseTimeout = setTimeout(() => {
            if (isVisualizing) {
                uiPanel.classList.add('hidden');
            }
        }, 3000);
    }
});

// Rendering Loop
function renderFrame() {
    if (!isVisualizing) return;
    
    animationId = requestAnimationFrame(renderFrame);
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);
    
    ctx.fillStyle = 'rgba(10, 10, 15, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    let bassSum = 0;
    for(let i = 0; i < 10; i++) bassSum += dataArray[i];
    const bassAvg = bassSum / 10;
    
    const glowScale = 1 + (bassAvg / 255) * 0.5;
    const glowOpacity = 0.1 + (bassAvg / 255) * 0.3;
    backgroundGlow.style.transform = `translate(-50%, -50%) scale(${glowScale})`;
    backgroundGlow.style.opacity = glowOpacity;

    const usableDataLength = Math.floor(bufferLength * 0.7); 
    const radius = Math.min(centerX, centerY) * 0.4;
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 10 + (bassAvg * 0.1), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(20, 20, 30, 0.8)`;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = COLOR_PRIMARY;
    ctx.stroke();

    for (let i = 0; i < usableDataLength; i++) {
        const barHeight = (dataArray[i] / 255) * (Math.min(centerX, centerY) * 0.5);
        const angle = (i * (Math.PI * 2)) / usableDataLength;
        
        const startX = centerX + Math.cos(angle) * radius;
        const startY = centerY + Math.sin(angle) * radius;
        
        const endX = centerX + Math.cos(angle) * (radius + barHeight);
        const endY = centerY + Math.sin(angle) * (radius + barHeight);
        
        const r = parseInt(COLOR_PRIMARY.slice(1,3), 16);
        const g = parseInt(COLOR_PRIMARY.slice(3,5), 16);
        const b = parseInt(COLOR_PRIMARY.slice(5,7), 16);
        
        const r2 = parseInt(COLOR_SECONDARY.slice(1,3), 16);
        const g2 = parseInt(COLOR_SECONDARY.slice(3,5), 16);
        const b2 = parseInt(COLOR_SECONDARY.slice(5,7), 16);
        
        const blend = i / usableDataLength;
        const finalR = Math.round(r + (r2 - r) * blend);
        const finalG = Math.round(g + (g2 - g) * blend);
        const finalB = Math.round(b + (b2 - b) * blend);
        
        ctx.strokeStyle = `rgb(${finalR}, ${finalG}, ${finalB})`;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }
}
