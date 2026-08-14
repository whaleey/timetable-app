import { appointments, currentWeekStart, generateBaseGrid, getFormattedWeekLabel } from './state.js';

export function renderPublicGrid() {
    const label = document.getElementById('public-week-range');
    if (label) label.innerText = getFormattedWeekLabel();
    generateBaseGrid('public-grid');

    appointments.filter(a => a.Status !== 'cancelled').forEach(appt => {
        let apptDate = new Date(appt.Date + 'T00:00:00');
        let startGridDate = new Date(currentWeekStart);
        startGridDate.setHours(0,0,0,0);
        
        let diffDays = Math.floor((apptDate - startGridDate) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < 7) {
            let cell = document.getElementById(`public-grid-cell-${parseInt(appt.BeginHour, 10)}-${diffDays}`);
            if (cell) {
                cell.innerHTML += `<div class="appt-card status-${appt.Status}">Status: ${appt.Status.toUpperCase()}</div>`;
            }
        }
    });
}
