let currentAccess = null;
let globalAppointments = [];

// Initialize Time Pickers Dropdowns Options
function populateTimeDropdowns(prefix) {
    const hrSelectB = document.getElementById(`${prefix}-b-hr`);
    const minSelectB = document.getElementById(`${prefix}-b-min`);
    const hrSelectE = document.getElementById(`${prefix}-e-hr`);
    const minSelectE = document.getElementById(`${prefix}-e-min`);

    hrSelectB.innerHTML = hrSelectE.innerHTML = Array.from({length: 24}, (_, i) => 
        `<option value="${String(i).padStart(2,'0')}">${String(i).padStart(2,'0')}</option>`).join('');
    
    minSelectB.innerHTML = minSelectE.innerHTML = Array.from({length: 60}, (_, i) => 
        `<option value="${String(i).padStart(2,'0')}">${String(i).padStart(2,'0')}</option>`).join('');

    // Default minutes to '00'
    minSelectB.value = minSelectE.value = "00";

    // Event binding constraints logic rules matching spec
    hrSelectB.addEventListener('change', () => {
        let bHr = parseInt(hrSelectB.value, 10);
        let eHr = bHr === 23 ? 23 : bHr + 1;
        hrSelectE.value = String(eHr).padStart(2, '0');
    });

    minSelectB.addEventListener('change', () => {
        hrSelectE.dispatchEvent(new Event('change'));
        minSelectE.value = minSelectB.value;
    });
}

populateTimeDropdowns('in');
populateTimeDropdowns('mod');

function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function returnToDashboard() {
    switchScreen(currentAccess === 'admin' ? 'screen-overview-admin' : 'screen-overview-public');
}

// Flow Step 2: Handle Route Gate Logic Verify Checking
async function handleLogin() {
    const passcode = document.getElementById('login-passcode').value;
    const res = await fetch('/api/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ passcode })
    });

    if (res.ok) {
        const data = await res.ok ? await res.json() : {};
        currentAccess = data.access;
        document.getElementById('userBadge').innerText = `Logged in as: ${currentAccess.toUpperCase()}`;
        document.getElementById('screen-login').classList.remove('active');
        
        if (currentAccess === 'admin') {
            document.getElementById('admin-nav').style.display = 'flex';
            switchScreen('screen-overview-admin');
            loadAdminTimetable();
        } else {
            switchScreen('screen-overview-public');
            loadPublicTimetable();
        }
    } else {
        alert("Access Denied");
    }
}

// Build Layout Grid Starting at Sunday
function renderTimetableGrid(containerId, appointments, showDetails) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    days.forEach((dayName, index) => {
        const col = document.createElement('div');
        col.className = 'day-column';
        col.innerHTML = `<div class="day-header">${dayName}</div>`;

        // Filter and position events based on day of week match matching layout spec
        appointments.forEach(app => {
            const appDate = new Date(app.Date);
            if (!isNaN(appDate.getTime()) && appDate.getDay() === index) {
                const card = document.createElement('div');
                card.className = `card status-${app.Status}`;
                
                if (showDetails) {
                    card.innerHTML = `<b>[${app.AppointmentID}]</b><br>${app.BeginHour}:${app.BeginMinute} - ${app.EndHour}:${app.EndMinute}<br>${app.Details}`;
                } else {
                    card.innerHTML = `Status: ${app.Status}`;
                }
                col.appendChild(card);
            }
        });
        container.appendChild(col);
    });
}

async function loadPublicTimetable() {
    const res = await fetch('/api/appointments?access=public');
    const data = await res.json();
    renderTimetableGrid('timetable-public', data, false);
}

async function loadAdminTimetable() {
    const cat = document.getElementById('admin-filter-cat').value;
    const res = await fetch(`/api/appointments?access=admin&category=${cat}`);
    globalAppointments = await res.json();
    renderTimetableGrid('timetable-admin', globalAppointments, true);
}

function openInputScreen() {
    switchScreen('screen-input');
}

async function submitAppointment() {
    const payload = {
        category: document.getElementById('in-cat').value,
        status: document.getElementById('in-status').value,
        date: document.getElementById('in-date').value,
        beginHour: document.getElementById('in-b-hr').value,
        beginMinute: document.getElementById('in-b-min').value,
        endHour: document.getElementById('in-e-hr').value,
        endMinute: document.getElementById('in-e-min').value,
        details: document.getElementById('in-details').value
    };

    if(!payload.date) return alert("Please select a date");

    const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
    });
    if(res.ok) {
        alert("Appointment Created!");
        returnToDashboard();
        loadAdminTimetable();
    }
}

// Function 3 Setup logic helper hooks
function openModifyScreen() {
    switchScreen('screen-modify');
    const select = document.getElementById('mod-select');
    select.innerHTML = '<option value="">-- Choose --</option>' + globalAppointments.map(app => 
        `<option value="${app.AppointmentID}">${app.AppointmentID} - ${app.Date} (${app.Details.substring(0,15)}...)</option>`).join('');
}

function populateModifyFields() {
    const id = document.getElementById('mod-select').value;
    const app = globalAppointments.find(a => a.AppointmentID === id);
    if(!app) return;

    document.getElementById('mod-cat').value = app.Category;
    document.getElementById('mod-status').value = app.Status;
    document.getElementById('mod-date').value = app.Date;
    document.getElementById('mod-b-hr').value = app.BeginHour;
    document.getElementById('mod-b-min').value = app.BeginMinute;
    document.getElementById('mod-e-hr').value = app.EndHour;
    document.getElementById('mod-e-min').value = app.EndMinute;
    document.getElementById('mod-details').value = app.Details;
}

async function saveModification() {
    const id = document.getElementById('mod-select').value;
    if(!id) return alert("Select an item first");

    const payload = {
        category: document.getElementById('mod-cat').value,
        status: document.getElementById('mod-status').value,
        date: document.getElementById('mod-date').value,
        beginHour: document.getElementById('mod-b-hr').value,
        beginMinute: document.getElementById('mod-b-min').value,
        endHour: document.getElementById('mod-e-hr').value,
        endMinute: document.getElementById('mod-e-min').value,
        details: document.getElementById('mod-details').value
    };

    const res = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
    });

    if (res.ok) {
        alert("Changes Saved!");
        returnToDashboard();
        loadAdminTimetable();
    }
}

// Function 4 password change updates logic verification run
async function updatePassword() {
    const payload = {
        passType: document.getElementById('pw-type').value,
        oldValue: document.getElementById('pw-old').value,
        newValue: document.getElementById('pw-new').value,
        confirmNewValue: document.getElementById('pw-confirm').value
    };

    const res = await fetch('/api/password/update', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
    });

    if (res.ok) {
        alert("Password updated!");
        returnToDashboard();
    } else {
        alert("Please check again");
    }
}
