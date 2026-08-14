import { appointments } from './state.js';

export function handleListFilterChange() {
    const type = document.getElementById('list-filter-type').value;
    const valSelect = document.getElementById('list-filter-val');
    if (!valSelect) return;
    valSelect.innerHTML = '';

    if (type === 'all') {
        valSelect.options.add(new Option("all", "all"));
    } else if (type === 'student') {
        let names = [...new Set(appointments.map(a => a.Student).filter(Boolean))];
        if(names.length === 0) names = ["No Students Set"];
        names.forEach(n => valSelect.options.add(new Option(n, n)));
    } else if (type === 'month') {
        let months = [...new Set(appointments.map(a => a.Date.substring(0, 7)))].sort();
        if(months.length === 0) months = ["No Months Active"];
        months.forEach(m => valSelect.options.add(new Option(m, m)));
    }
    renderListViewTable();
}

export function renderListViewTable() {
    const type = document.getElementById('list-filter-type').value;
    const filterVal = document.getElementById('list-filter-val').value;
    const tbody = document.querySelector('#list-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    appointments.filter(a => {
        if (type === 'all' || filterVal === 'all' || filterVal === 'No Students Set' || filterVal === 'No Months Active') return true;
        if (type === 'student') return a.Student === filterVal;
        if (type === 'month') return a.Date.startsWith(filterVal);
        return true;
    }).forEach(a => {
        tbody.innerHTML += `<tr>
            <td style="padding:8px; border-bottom:1px solid #ddd;">${a.AppointmentID}</td>
            <td style="padding:8px; border-bottom:1px solid #ddd;">${a.Category}</td>
            <td style="padding:8px; border-bottom:1px solid #ddd;">${a.Student || '-'}</td>
            <td style="padding:8px; border-bottom:1px solid #ddd;">${a.Status}</td>
            <td style="padding:8px; border-bottom:1px solid #ddd;">${a.Date}</td>
            <td style="padding:8px; border-bottom:1px solid #ddd;">${a.BeginHour}:${a.BeginMinute} - ${a.EndHour}:${a.EndMinute}</td>
            <td style="padding:8px; border-bottom:1px solid #ddd;">${a.Details}</td>
        </tr>`;
    });
}

export function downloadExcel() {
    if(appointments.length === 0) {
        alert("No records to export.");
        return;
    }
    const globalXlsx = window.XLSX;
    if (!globalXlsx) {
        alert("Export library still loading. Please try again.");
        return;
    }
    const ws = globalXlsx.utils.json_to_sheet(appointments);
    const wb = globalXlsx.utils.book_new();
    globalXlsx.utils.book_append_sheet(wb, ws, "Appointments");
    globalXlsx.writeFile(wb, "tbl_appointment.xlsx");
}
