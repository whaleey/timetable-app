let currentRole = null;
let globalAppointments = [];

// Populate standard 24H Hour/Minute fields at execution initialization
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('.hr-select').forEach(sel => {
        for(let i=0; i<24; i++) sel.innerHTML += `<option value="${String(i).padStart(2,'0')}">${String(i).padStart(2,'0')}</option>`;
    });
    document.querySelectorAll('.mn-select').forEach(sel => {
        for(let i=0; i<60; i++) sel.innerHTML += `<option value="${String(i).padStart(2,'0')}">${String(i).padStart(2,'0')}</option>`;
    });
});

async function attemptLogin() {
    const code = document.getElementById('passcode-input').value;
    const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: code })
    });
    const data = await res.json();
    
    if (data.success) {
        currentRole = data.role;
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('app-workspace').classList.remove('hidden');
        
        if (currentRole === 'admin') {
            document.getElementById('admin-controls').classList.remove('hidden');
        }
        switchView('overview');
    } else {
        const errorEl = document.getElementById('auth-error');
        errorEl.textContent = data.message;
        errorEl.classList.remove('hidden');
    }
}

function switchView(viewId) {
    // Structural Rule protection verification
    if (currentRole === 'public' && viewId !== 'overview') return;

    ['overview', 'input', 'modify', 'password'].forEach(v => {
        document.getElementById(`view-${v}`).classList.add('hidden');
    });
    document.getElementById(`view-${viewId}`).classList.remove('hidden');
    
    if (viewId === 'overview') loadOverviewData();
    if (viewId === 'modify') refreshModifyDropdown();
}

async function loadOverviewData() {
    const res = await fetch('/api/appointments');
    globalAppointments = await res.json();
    
    // Clear timetable structural content nodes
    for (let i = 0; i < 7; i++) document.getElementById(`day-${i}`).innerHTML = '';

    globalAppointments.forEach(app => {
        const appDate = new Date(app.Date);
        const dayOfWeek = appDate.getDay(); // 0 is Sunday, 6 is Saturday
        
        const targetContainer = document.getElementById(`day-${dayOfWeek}`);
        if (!targetContainer) return;

        const formattedID = String(app.AppointmentID).padStart(6, '0');
        const colorClass = app.Status === 'confirmed' ? 'bg-black text-white' : 'bg-yellow-400 text-black';

        let innerContent = `<div class="font-bold text-xs">ID: ${formattedID}</div><div class="text-[10px] uppercase font-semibold">Status: ${app.Status}</div>`;
        
        // Admin privilege access override
        if (currentRole === 'admin') {
            innerContent += `
                <div class="text-xs border-t border-gray-400/30 mt-1 pt-1 font-mono">${app.BeginHour}:${app.BeginMinute} - ${app.EndHour}:${app.EndMinute}</div>
                <div class="text-xs italic truncate mt-0.5" title="${app.Details}">${app.Details}</div>
                <div class="text-[9px] opacity-75">Cat: ${app.Category}</div>
            `;
        }

        const card = document.createElement('div');
        card.className = `p-2 rounded shadow-sm border text-left ${colorClass} text-xs space-y-0.5 break-words`;
        card.innerHTML = innerContent;
        targetContainer.appendChild(card);
    });
}

async function handleCreate(e) {
    e.preventDefault();
    const payload = {
        category: document.getElementById('in-category').value,
        status: document.getElementById('in-status').value,
        date: document.getElementById('in-date').value,
        beginHour: document.getElementById('in-b-hr').value,
        beginMinute: document.getElementById('in-b-mn').value,
        endHour: document.getElementById('in-e-hr').value,
        endMinute: document.getElementById('in-e-mn').value,
        details: document.getElementById('in-details').value
    };

    const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
        alert(`Appointment Created Successfully! Running Sequence ID: ${data.id}`);
        document.getElementById('appointment-form').reset();
        switchView('overview');
    }
}

function refreshModifyDropdown() {
    const selector = document.getElementById('mod-id-selector');
    selector.innerHTML = '<option value="">-- Choose ID --</option>';
    globalAppointments.forEach(app => {
        const fmtId = String(app.AppointmentID).padStart(6, '0');
        selector.innerHTML += `<option value="${app.AppointmentID}">${fmtId} (${app.Category})</option>`;
    });
    document.getElementById('modify-form').classList.add('hidden');
}

function populateModificationForm() {
    const selectId = document.getElementById('mod-id-selector').value;
    if (!selectId) {
        document.getElementById('modify-form').classList.add('hidden');
        return;
    }
    const app = globalAppointments.find(a => a.AppointmentID == selectId);
    if (!app) return;

    document.getElementById('mod-category').value = app.Category;
    document.getElementById('mod-status').value = app.Status;
    document.getElementById('mod-date').value = app.Date;
    document.getElementById('mod-b-hr').value = app.BeginHour;
    document.getElementById('mod-b-mn').value = app.BeginMinute;
    document.getElementById('mod-e-hr').value = app.EndHour;
    document.getElementById('mod-e-mn').value = app.EndMinute;
    document.getElementById('mod-details').value = app.Details;

    document.getElementById('modify-form').classList.remove('hidden');
}

async function handleModify(e) {
    e.preventDefault();
    const selectId = document.getElementById('mod-id-selector').value;
    const payload = {
        category: document.getElementById('mod-category').value,
        status: document.getElementById('mod-status').value,
        date: document.getElementById('mod-date').value,
        beginHour: document.getElementById('mod-b-hr').value,
        beginMinute: document.getElementById('mod-b-mn').value,
        endHour: document.getElementById('mod-e-hr').value,
        endMinute: document.getElementById('mod-e-mn').value,
        details: document.getElementById('mod-details').value
    };

    const res = await fetch(`/api/appointments/${selectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const data = await res.json();
    if(data.success) {
        alert("Data updated and synced successfully!");
        switchView('overview');
    }
}

async function handlePasswordUpdate(e) {
    e.preventDefault();
    const payload = {
        passType: document.getElementById('pw-type').value,
        oldValue: document.getElementById('pw-old').value,
        newValue: document.getElementById('pw-new').value,
        confirmNewValue: document.getElementById('pw-confirm').value
    };

    const res = await fetch('/api/password-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const data = await res.json();

    if(data.success) {
        alert(data.message);
        // Clear verification forms completely
        document.getElementById('pw-old').value = '';
        document.getElementById('pw-new').value = '';
        document.getElementById('pw-confirm').value = '';
        switchView('overview'); // Returns to function 1b automatically if admin, or 1a if public
    } else {
        alert(data.message);
    }
}

function logout() {
    currentRole = null;
    document.getElementById('passcode-input').value = '';
    document.getElementById('admin-controls').classList.add('hidden');
    document.getElementById('app-workspace').classList.add('hidden');
    document.getElementById('auth-screen').classList.remove('hidden');
}