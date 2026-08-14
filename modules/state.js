export let currentAccess = { value: null };
export let currentWeekStart = new Date();

export let appointments = JSON.parse(localStorage.getItem('tbl_appointment') || '[]');
export let passwords = JSON.parse(localStorage.getItem('tbl_password') || '{"admin": "admin", "public": "public"}');
// Replace the old students definition row line inside modules/state.js with this configuration block:
export let students = JSON.parse(localStorage.getItem('tbl_student') || '[]');

// If local storage is empty, initialize default mock data arrays instantly
if (students.length === 0) {
    students = [
        { StudentID: 101, StudentName: "Test" }
    ];
}




export function saveToStorage() {
    localStorage.setItem('tbl_appointment', JSON.stringify(appointments));
    localStorage.setItem('tbl_password', JSON.stringify(passwords));
    localStorage.setItem('tbl_student', JSON.stringify(students));
}

export function setSundayOfWeek(date) {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay());
    currentWeekStart.setTime(d.getTime());
}

export function generateBaseGrid(gridContainerId) {
    const container = document.getElementById(gridContainerId);
    if (!container) return;
    container.innerHTML = '';
    container.appendChild(Object.assign(document.createElement('div'), { className: 'grid-cell grid-header', innerText: 'Time' }));
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for(let i=0; i<7; i++) {
        let d = new Date(currentWeekStart);
        d.setDate(d.getDate() + i);
        container.appendChild(Object.assign(document.createElement('div'), { className: 'grid-cell grid-header', innerText: `${weekdays[i]} (${d.getMonth()+1}/${d.getDate()})` }));
    }

    for(let hour=0; hour<24; hour++) {
        container.appendChild(Object.assign(document.createElement('div'), { className: 'grid-cell time-col', innerText: String(hour).padStart(2, '0') + ":00" }));
        for(let day=0; day<7; day++) {
            container.appendChild(Object.assign(document.createElement('div'), { id: `${gridContainerId}-cell-${hour}-${day}`, className: 'grid-cell' }));
        }
    }
}

export function getFormattedWeekLabel() {
    let end = new Date(currentWeekStart);
    end.setDate(end.getDate() + 6);
    return `${currentWeekStart.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`;
}



