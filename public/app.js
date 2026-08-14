let currentAccess = null;
let globalAppointments = [];
let currentWeekOffset = 0; // Pagination tracks week offset index step increments

// Determine absolute date range context markers boundaries
function getStartOfWeek(offsetWeeks = 0) {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (offsetWeeks * 7);
    const startOfWeek = new Date(d.setDate(diff));
    startOfWeek.setHours(0,0,0,0);
    return startOfWeek;
}

function initTimeDropdowns(prefix) {
    const hrB = document.getElementById(`${prefix}-b-hr`);
    const minB = document.getElementById(`${prefix}-b-min`);
    const hrE = document.getElementById(`${prefix}-e-hr`);
    const minE = document.getElementById(`${prefix}-e-min`);

    const hrs = Array.from({length: 24}, (_, i) => `<option value="${String(i).padStart(2,'0')}">${String(i).padStart(2,'0')}</option>`).join('');
    const mins = Array.from({length: 60}, (_, i) => `<option value="${String(i).padStart(2,'0')}">${String(i).padStart(2,'0')}</option>`).join('');
    
    hrB.innerHTML = hrE.innerHTML = hrs;
    minB.innerHTML = minE.innerHTML = mins;
    minB.value = minE.value = "00";

    // Enforce requirements logic constraints handlers mapping cascades
    hrB.addEventListener('change', () => {
        let val = parseInt(hrB.value, 10);
        hrE.value = String(val === 23 ? 23 : val + 1).padStart(2, '0');
    });
    minB.addEventListener('change', () => {
        minE.value = minB.value;
    });
}
initTimeDropdowns('in');
initTimeDropdowns('mod');

function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function returnToDashboard() {
    switchScreen(currentAccess === 'admin' ? 'screen-overview-admin' : 'screen-overview-public');
}

function handleSignOut() {
    location.reload();
}

// Security login lookup
async function handleLogin() {
    const passcode = document.getElementById('login-passcode').value;
    const res = await fetch('/api/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ passcode })
    });

    if (res.ok) {
        const data = await res.json();
        currentAccess = data.access;
        document.getElementById('user-display-badge').innerText = `Role: ${currentAccess.toUpperCase()}`;
        document.getElementById('screen-login').classList.remove('active');

        if (currentAccess === 'admin') {
            document.getElementById('admin-nav').style.display = 'flex';
            switchScreen('screen-overview-admin');
            loadAdminTimetable();
        } else {
            document.getElementById('public-nav').style.display = 'flex';
            switchScreen('screen-overview-public');
            loadPublicTimetable();
        }
    } else {
        alert("Access Denied");
    }
}

// 6-Month Pagination navigation logic handlers tracking
function changeWeek(direction) {
    const targetOffset = currentWeekOffset + direction;
    if (targetOffset < 0 || targetOffset > 26) { // Block running past sysdate or past 6 months limits
        return alert("View selection restricted within current week up to 6 months ahead maximum.");
    }
    currentWeekOffset = targetOffset;
    if (currentAccess === 'admin') {
        loadAdminTimetable();
    } else {
        loadPublicTimetable();
    }
}

// Generate the 24-Hour Schedule Calendar View Matrix
function drawHourlyGrid(gridContainerId, appointments, showDetails, labelSpanId) {
    const container = document.getElementById(gridContainerId);
    container.innerHTML = '';

    const startOfWeek = getStartOfWeek(currentWeekOffset);
    const endOfWeek = new Date(startOfWeek.getTime() + (6 * 24 * 60 * 60 * 1000));
    
    // Label header range representation dates matching spec
    document.getElementById(labelSpanId).innerText = `${startOfWeek.toLocaleDateString()} to ${endOfWeek.toLocaleDateString()}`;

    // 1. Render Top Header row cells
    const emptyCorner = document.createElement('div');
    emptyCorner.className = 'grid-header';
    emptyCorner.innerText = 'Time';
    container.appendChild(emptyCorner);

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 0; i < 7; i++) {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'grid-header';
        const dayDate = new Date(startOfWeek.getTime() + (i * 24 * 60 * 60 * 1000));
        dayHeader.innerHTML = `${days[i]}<br><span style="font-size:10px;">${dayDate.getMonth()+1}/${dayDate.getDate()}</span>`;
        container.appendChild(dayHeader);
    }

    // 2. Build 24-Hour horizontal loop row sections sequence grid blocks layout mapping
    for (let hour = 0; hour < 24; hour++) {
        const timeCell = document.createElement('div');
        timeCell.className = 'grid-cell time-label-cell';
        timeCell.innerText = `${String(hour).padStart(2,'0')}:00`;
        container.appendChild(timeCell);

        for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            
            const targetDateStr = new Date(startOfWeek.getTime() + (dayIdx * 24 * 60 * 60 * 1000)).toISOString().slice(0,10);

            // Filter appointments active in this cell interval
            appointments.forEach(app => {
                if (app.Date === targetDateStr && parseInt(app.BeginHour,10) === hour) {
                    const card = document.createElement('div');
                    card.className = `appointment-card status-${app.Status}`;
                    
                    // Style structural heights relative block offsets interval
                    const spanHours = Math.max(1, parseInt(app.EndHour,10) - parseInt(app.BeginHour,10));
                    card.style.height = `${(spanHours * 50) - 8}px`;
                    
                    if (showDetails) {
                        card.innerHTML = `<b>${app.AppointmentID}</b><br>${app.Details}`;
                    } else {
                        card.innerHTML = `Status: ${app.Status}`;
                    }
                    cell.appendChild(card);
                }
            });
            container.appendChild(cell);
        }
    }
}

async function loadPublicTimetable() {
    const res = await fetch('/api/appointments?access=public');
    const data = await res.json();
    drawHourlyGrid('grid-public', data, false, 'public-week-range');
}

async function loadAdminTimetable() {
    const cat = document.getElementById('admin-filter-cat').value;
    const res = await fetch(`/api/appointments?access=admin&category=${cat}`);
    globalAppointments = await res.json();
    drawHourlyGrid('grid-admin', globalAppointments, true, 'admin-week-range');
}

function openInputScreen() {
    switchScreen('screen-input');
    document.getElementById('in-date').value = new Date().toISOString().slice(0,10);
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

    if(!payload.date) return alert("Select a date string value entry.");

    const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
    });
    if (res.ok) {
        alert("Appointment created successfully!");
        switchScreen('screen-overview-admin');
        loadAdminTimetable();
    }
}

function openModifyScreen() {
    switchScreen('screen-modify');
    const select = document.getElementById('mod-select');
    select.innerHTML = '<option value="">-- Choose Entry ID --</option>' + globalAppointments.map(app => 
        `<option value="${app.AppointmentID}">${app.AppointmentID} [${app.Date}]</option>`).join('');
}

function populateModifyFields() {
    const id = document.getElementById('mod-select').value;
    const app = globalAppointments.find(a => a.AppointmentID === id);
    if (!app) return;

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
    if (!id) return alert("Select target edit item selection reference first.");

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
        method: 'PUT',headers: {'Content-Type': 'application/json'},body: JSON.stringify(payload)});if (res.ok) {alert("Changes Saved!");switchScreen('screen-overview-admin');loadAdminTimetable();}}async function updatePassword() {const payload = {passType: document.getElementById('pw-type').value,oldValue: document.getElementById('pw-old').value,newValue: document.getElementById('pw-new').value,confirmNewValue: document.getElementById('pw-confirm').value};const res = await fetch('/api/password/update', {method: 'POST',headers: {'Content-Type': 'application/json'},body: JSON.stringify(payload)});if (res.ok) {alert("Password updated!");returnToDashboard();} else {alert("Please check again");}}