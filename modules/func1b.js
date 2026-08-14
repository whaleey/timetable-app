import { appointments, currentWeekStart, generateBaseGrid, getFormattedWeekLabel } from './state.js';

export function renderAdminGrid() {
    const label = document.getElementById('admin-week-range');
    if (label) label.innerText = getFormattedWeekLabel();
    generateBaseGrid('admin-grid');

    const filterEl = document.getElementById('admin-filter-category');
    const catFilter = filterEl ? filterEl.value : 'all';
    
    appointments.filter(a => a.Status !== 'cancelled' && (catFilter === 'all' || a.Category === catFilter)).forEach(appt => {
        let apptDate = new Date(appt.Date + 'T00:00:00');
        let startGridDate = new Date(currentWeekStart);
        startGridDate.setHours(0,0,0,0);
        
        let diffDays = Math.floor((apptDate - startGridDate) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < 7) {
            let cell = document.getElementById(`admin-grid-cell-${parseInt(appt.BeginHour, 10)}-${diffDays}`);
            if (cell) {
                let displayTxt = appt.Student ? `${appt.Student}` : `${appt.Details}`;
                cell.innerHTML += `<div class="appt-card status-${appt.Status}">${appt.AppointmentID}: ${displayTxt}</div>`;
            }
        }
    });
}
