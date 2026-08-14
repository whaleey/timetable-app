import { appointments, saveToStorage } from './state.js';

function getNextSequenceID(category, offset = 0) {
    let prefix = category === 'music' ? 'M' : category === 'work' ? 'W' : category === 'personal' ? 'P' : 'Z';
    let matches = appointments.filter(a => a.AppointmentID.startsWith(prefix));
    
    let nextNum = 0;
    if (matches.length > 0) {
        let numericValues = matches.map(a => parseInt(a.AppointmentID.substring(1), 10));
        numericValues.sort((a, b) => b - a);
        nextNum = numericValues[0] + 1;
    }
    
    return prefix + String(nextNum + offset).padStart(6, '0');
}

export function handleBeginTimeChange() {
    const bHourEl = document.getElementById('in-bhour');
    const bMinEl = document.getElementById('in-bmin');
    const eHourEl = document.getElementById('in-ehour');
    const eMinEl = document.getElementById('in-emin');

    if (!bHourEl || !bMinEl || !eHourEl || !eMinEl) return;

    const bHour = parseInt(bHourEl.value, 10);
    const bMin = bMinEl.value;
    let nextHour = bHour === 23 ? 23 : bHour + 1;
    eHourEl.value = String(nextHour).padStart(2, '0');
    eMinEl.value = bMin;
}

export function toggleRecurring() {
    const recurringEl = document.getElementById('in-recurring');
    const timesGroup = document.getElementById('recurring-times-group');
    const timesInput = document.getElementById('in-times');

    if (!recurringEl || !timesGroup || !timesInput) return;

    const checked = recurringEl.checked;
    timesGroup.style.display = checked ? 'block' : 'none';
    if (checked) {
        timesInput.setAttribute('required', 'true');
    } else {
        timesInput.removeAttribute('required');
    }
}

export function submitAppointment(e, callback) {
    e.preventDefault();
    const cat = document.getElementById('in-category').value;
    const studName = document.getElementById('in-student-search').value;
    const recurring = document.getElementById('in-recurring').checked;
    const loops = recurring ? parseInt(document.getElementById('in-times').value, 10) || 1 : 1;
    
    let baseDateStr = document.getElementById('in-date').value;
    
    for (let i = 0; i < loops; i++) {
        let apptDate = new Date(baseDateStr + 'T00:00:00');
        apptDate.setDate(apptDate.getDate() + (i * 7));
        
        let newAppt = {
            AppointmentID: getNextSequenceID(cat, i),
            Category: cat,
            Student: studName,
            Status: document.getElementById('in-status').value,
            Date: apptDate.toISOString().split('T')[0],
            BeginHour: document.getElementById('in-bhour').value,
            BeginMinute: document.getElementById('in-bmin').value,
            EndHour: document.getElementById('in-ehour').value,
            EndMinute: document.getElementById('in-emin').value,
            Details: document.getElementById('in-details').value,
            UpdateDate: new Date().toISOString().slice(0,10).replace(/-/g, "")
        };
        appointments.push(newAppt);
    }
    
    saveToStorage();
    if (callback) callback();
}
