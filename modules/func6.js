import { students, saveToStorage } from './state.js';

export function renderStudentsTable() {
    const tbody = document.querySelector('#students-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    students.forEach(s => {
        tbody.innerHTML += `<tr>
            <td style="padding:8px; border-bottom:1px solid #ddd;">${s.StudentID}</td>
            <td style="padding:8px; border-bottom:1px solid #ddd;">${s.StudentName}</td>
        </tr>`;
    });
}

export function submitNewStudent(e, callback) {
    e.preventDefault();
    const nameInput = document.getElementById('stud-new-name');
    if (!nameInput) return;
    
    const nameStr = nameInput.value.trim();
    if (!nameStr) return;

    // Calculate safe sequential auto-increment running integer tracking logic ID values
    let maxId = 100;
    if (students.length > 0) {
        const ids = students.map(s => parseInt(s.StudentID, 10)).filter(num => !isNaN(num));
        if (ids.length > 0) {
            maxId = Math.max(...ids);
        }
    }
    const nextId = maxId + 1;

    // Append record to state array structure matrix mapping
    students.push({
        StudentID: nextId,
        StudentName: nameStr
    });

    saveToStorage();
    nameInput.value = ''; // Flush layout container values clean
    renderStudentsTable();
    
    if (callback) callback();
}
