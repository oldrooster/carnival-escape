// === API Helper ===
async function api(endpoint, data) {
    try {
        const res = await fetch('/api/' + endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json().catch(() => ({}));
    } catch (err) {
        console.error(`API call to /api/${endpoint} failed:`, err);
        showToast(`Failed to reach Node-RED (${endpoint})`);
    }
}

// === Toast Notifications ===
function showToast(message) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.style.cssText = `
            position: fixed; bottom: 24px; right: 24px; background: rgba(139,26,26,0.95);
            color: #e8dcc8; padding: 12px 20px; border-radius: 8px; font-size: 0.9rem;
            z-index: 1000; opacity: 0; transition: opacity 0.3s; pointer-events: none;
            box-shadow: 0 4px 16px rgba(0,0,0,0.5);
        `;
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = '1';
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => { toast.style.opacity = '0'; }, 3000);
}

// =====================
// TIMER
// =====================
let timerInterval = null;
let timerSeconds = 60 * 60; // default 60 minutes
let timerRunning = false;

const timerDisplay = document.getElementById('timerDisplay');
const timerDurationInput = document.getElementById('timerDuration');
const btnStart = document.getElementById('btnStart');
const btnStop = document.getElementById('btnStop');

function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function updateTimerDisplay() {
    timerDisplay.textContent = formatTime(timerSeconds);

    timerDisplay.classList.remove('warning', 'critical');
    if (timerRunning && timerSeconds <= 300) {
        timerDisplay.classList.add('critical');
    } else if (timerRunning && timerSeconds <= 600) {
        timerDisplay.classList.add('warning');
    }
}

function timerStart() {
    if (timerRunning) return;
    timerRunning = true;
    btnStart.disabled = true;
    btnStop.disabled = false;
    timerDurationInput.disabled = true;

    timerInterval = setInterval(() => {
        if (timerSeconds <= 0) {
            timerStop();
            timerDisplay.classList.add('critical');
            return;
        }
        timerSeconds--;
        updateTimerDisplay();
    }, 1000);

    api('timer', { action: 'start', duration: timerSeconds });
    showToast('Timer started');
}

function timerStop() {
    timerRunning = false;
    clearInterval(timerInterval);
    btnStart.disabled = false;
    btnStop.disabled = true;

    api('timer', { action: 'stop', remaining: timerSeconds });
    showToast('Timer stopped');
}

function timerReset() {
    timerStop();
    const mins = parseInt(timerDurationInput.value) || 60;
    timerSeconds = mins * 60;
    timerDurationInput.disabled = false;
    timerDisplay.classList.remove('warning', 'critical');
    updateTimerDisplay();

    api('timer', { action: 'reset', duration: timerSeconds });
    showToast('Timer reset');
}

// Update timer when duration input changes
timerDurationInput.addEventListener('change', () => {
    if (!timerRunning) {
        const mins = parseInt(timerDurationInput.value) || 60;
        timerSeconds = mins * 60;
        updateTimerDisplay();
    }
});

// =====================
// HINT / MESSAGE
// =====================
function sendHint() {
    const msg = document.getElementById('hintMessage').value.trim();
    if (!msg) {
        showToast('Please type a message first');
        return;
    }
    const duration = parseInt(document.getElementById('hintDuration').value) || 30;
    const flash = document.getElementById('hintFlash').checked;
    api('hint', { message: msg, duration, flash });
    showToast(`Message sent (${duration}s${flash ? ', flashing' : ''})`);
}

function clearHint() {
    document.getElementById('hintMessage').value = '';
    api('hint', { message: '' });
    showToast('Room display cleared');
}

// =====================
// DISPLAY SETTINGS
// =====================
const brightnessSlider = document.getElementById('brightness');
const brightnessValue = document.getElementById('brightnessValue');
const colorPicker = document.getElementById('displayColor');
const colorValue = document.getElementById('colorValue');

let displayDebounce = null;

function sendDisplaySettings() {
    clearTimeout(displayDebounce);
    displayDebounce = setTimeout(() => {
        api('display', {
            brightness: parseInt(brightnessSlider.value),
            color: colorPicker.value
        });
        showToast('Display settings applied');
    }, 300);
}

brightnessSlider.addEventListener('input', () => {
    brightnessValue.textContent = brightnessSlider.value;
    sendDisplaySettings();
});

colorPicker.addEventListener('input', () => {
    colorValue.textContent = colorPicker.value;
    sendDisplaySettings();
});

// =====================
// PROPS
// =====================
const NUM_PROPS = 4;
const propsGrid = document.getElementById('propsGrid');
let propStates = [];

function loadPropNames() {
    const saved = localStorage.getItem('propNames');
    return saved ? JSON.parse(saved) : null;
}

function savePropNames() {
    const names = propStates.map(p => p.name);
    localStorage.setItem('propNames', JSON.stringify(names));
}

function initProps() {
    const savedNames = loadPropNames();
    for (let i = 0; i < NUM_PROPS; i++) {
        propStates.push({
            id: i + 1,
            name: savedNames ? savedNames[i] : `Prop ${i + 1}`,
            locked: true
        });
    }
    renderProps();
}

function renderProps() {
    propsGrid.innerHTML = '';
    propStates.forEach((prop) => {
        const card = document.createElement('div');
        card.className = `prop-card ${prop.locked ? '' : 'unlocked'}`;
        card.innerHTML = `
            <input class="prop-name" type="text" value="${prop.name}"
                   onchange="renameProp(${prop.id}, this.value)">
            <div class="prop-status ${prop.locked ? 'locked' : 'unlocked-text'}">
                ${prop.locked ? 'LOCKED' : 'UNLOCKED'}
            </div>
            <div class="prop-actions">
                <button class="btn ${prop.locked ? 'btn-unlock' : 'btn-lock'}"
                        onclick="toggleProp(${prop.id})">
                    ${prop.locked ? 'Unlock' : 'Lock'}
                </button>
                <button class="btn btn-prop-reset" onclick="resetProp(${prop.id})">Reset</button>
            </div>
        `;
        propsGrid.appendChild(card);
    });
}

function renameProp(id, newName) {
    const prop = propStates.find(p => p.id === id);
    if (prop) {
        prop.name = newName;
        savePropNames();
    }
}

function toggleProp(id) {
    const prop = propStates.find(p => p.id === id);
    if (!prop) return;
    prop.locked = !prop.locked;
    const action = prop.locked ? 'lock' : 'unlock';
    api('prop', { id: prop.id, action });
    renderProps();
    showToast(`${prop.name}: ${action}`);
}

function resetProp(id) {
    const prop = propStates.find(p => p.id === id);
    if (!prop) return;
    prop.locked = true;
    api('prop', { id: prop.id, action: 'reset' });
    renderProps();
    showToast(`${prop.name}: reset`);
}

// =====================
// INIT
// =====================
updateTimerDisplay();
initProps();
