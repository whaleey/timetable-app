import { appointments, saveToStorage } from './state.js';

let retrieveAllModify = false;

export function setRetrieveAllModify(val) {
    retrieveAllModify = val;
}

export function populateModifySelect() {
    const select = document.getElementById('mod-select');
    if (!select) return;
    select.innerHTML = '';
    const todayStr = new Date().toISOString().split('T')[0];

    appointments.forEach(a => {
        if (!retrieveAllModify && a.Date < todayStr) return;
        select.options.add(new Option(`[${a.AppointmentID}] ${a.Date} - ${a.Details.substring(0,15)}`, a.AppointmentID));
    });
    populateModifyFields();
}

export function populateModifyFields() {
    const select = document.getElementById('mod-select');
    if (!select) return;
    const id = select.value;
    if (!id) return;
    const appt = appointments.find(a => a.AppointmentID === id);
    if (!appt) return;

    document.getElementById('mod-category').value = appt.Category;
    document.getElementById('mod-status').value = appt.Status;
    document.getElementById('mod-student-search').value = appt.Student || '';
    document.getElementById('mod-date').value = appt.Date;
    document.getElementById('mod-bhour').value = appt.BeginHour;
    document.getElementById('mod-bmin').value = appt.BeginMinute;
    document.getElementById('mod-ehour').value = appt.EndHour;
    document.getElementById('mod-emin').value = appt.EndMinute;
    document.getElementById('mod-details').value = appt.Details;
}

export function saveModifiedAppointment(e, callback) {
    e.preventDefault();
    const id = document.getElementById('mod-select').value;
    const index = appointments.findIndex(a => a.AppointmentID === id);
    if (index === -1) return;

    appointments[index] = {
        AppointmentID: id,
        Category: document.getElementById('mod-category').value,
        Status: document.getElementById('mod-status').value,
        Student: document.getElementById('mod-student-search').value,
        Date: document.getElementById('mod-date').value,
        BeginHour: document.getElementById('mod-bhour').value,
        BeginMinute: document.getElementById('mod-bmin').value,
        EndHour: document.getElementById('mod-ehour').value,
        EndMinute: document.getElementById('mod-emin').value,
        Details: document.getElementById('mod-details').value,
        UpdateDate: new Date().toISOString().slice(0,10).replace(/-/g, "")
    };

    saveToStorage();
    if (callback) callback();
}
