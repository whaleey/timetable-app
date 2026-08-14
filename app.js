import { currentAccess, currentWeekStart, setSundayOfWeek, passwords, students, saveToStorage } from './modules/state.js';
import { renderPublicGrid } from './modules/func1a.js';
import { renderAdminGrid } from './modules/func1b.js';
import { handleBeginTimeChange, toggleRecurring, submitAppointment } from './modules/func2.js';
import { populateModifySelect, populateModifyFields, saveModifiedAppointment, setRetrieveAllModify } from './modules/func3.js';
import { updatePassword } from './modules/func4.js';
import { handleListFilterChange, renderListViewTable, downloadExcel } from './modules/func5.js';

document.addEventListener("DOMContentLoaded", () => {
    populateTimeDropdowns('in-bhour', 'in-bmin', 'in-ehour', 'in-emin');
    populateTimeDropdowns('mod-bhour', 'mod-bmin', 'mod-ehour', 'mod-emin');
    setSundayOfWeek(new Date());
    saveToStorage();
    attachGlobalEvents();
});

function populateTimeDropdowns(bh, bm, eh, em) {
    const bHourSel = document.getElementById(bh);
    const bMinSel = document.getElementById(bm);
    const eHourSel = document.getElementById(eh);
    const eMinSel = document.getElementById(em);
    
    if (!bHourSel || !bMinSel || !eHourSel || !eMinSel) return;

    for(let i=0; i<24; i++) {
        let hStr = String(i).padStart(2, '0');
        bHourSel.options.add(new Option(hStr, hStr));
        eHourSel.options.add(new Option(hStr, hStr));
    }
    for(let i=0; i<60; i++) {
        let mStr = String(i).padStart(2, '0');
        bMinSel.options.add(new Option(mStr, mStr));
        eMinSel.options.add(new Option(mStr, mStr));
    }
    bMinSel.value = "00"; eMinSel.value = "00";
}

function switchScreen(screenId) {
    document.querySelectorAll('.main-container > .screen, #app-content > .screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(screenId);
    if (screen) screen.classList.add('active');
    
    if (screenId === 'view-overview-public') renderPublicGrid();
    if (screenId === 'view-overview-admin') renderAdminGrid();
}

function navigateWeek(direction) {
    let targetDate = new Date(currentWeekStart);
    targetDate.setDate(targetDate.getDate() + (direction * 7));
    
    let maxFutureDate = new Date();
    maxFutureDate.setMonth(maxFutureDate.getMonth() + 6);

    let minPastDate = new Date();
    minPastDate.setDate(minPastDate.getDate() - 7);

    if (targetDate < minPastDate) return;
    if (targetDate > maxFutureDate) {
        alert("Calendar view restricted to 6 months ahead.");
        return;
    }
    currentWeekStart.setTime(targetDate.getTime());
    if (currentAccess.value === 'admin') renderAdminGrid();
    else renderPublicGrid();
}

function handleLogin() {
    const passcodeEl = document.getElementById('passcode-input');
    if (!passcodeEl) return;

    const passcode = passcodeEl.value;
    if (passcode === passwords.admin) {
        currentAccess.value = 'admin';
    } else if (passcode === passwords.public) {
        currentAccess.value = 'public';
    } else {
        alert("Access Denied");
        return;
    }

    document.getElementById('auth-screen')?.classList.remove('active');
    document.getElementById('app-header')?.classList.remove('hidden');
    document.getElementById('app-content')?.classList.add('active');
    
    const dl = document.getElementById('students-datalist');
    const dlMod = document.getElementById('students-datalist-mod');
    if (dl && dlMod) {
        dl.innerHTML = ''; dlMod.innerHTML = '';
        students.forEach(s => {
            dl.options.add(new Option(s.StudentName, s.StudentName));
            dlMod.options.add(new Option(s.StudentName, s.StudentName));
        });
    }

    const adminMenu = document.getElementById('admin-menu');
    const bannerTitle = document.getElementById('banner-title');

    if (currentAccess.value === 'admin') {
        adminMenu?.classList.remove('hidden');
        if (bannerTitle) bannerTitle.innerText = "Timetable (Admin)";
        switchScreen('view-overview-admin');
    } else {
        adminMenu?.classList.add('hidden');
        if (bannerTitle) bannerTitle.innerText = "Timetable (Public)";
        switchScreen('view-overview-public');
    }
}

function attachGlobalEvents() {
    // Bind everything to window scope for HTML onclick bindings to read cleanly
    window.handleLogin = handleLogin;
    window.switchScreen = switchScreen;
    window.navigateWeek = navigateWeek;
    window.handleBeginTimeChange = handleBeginTimeChange;
    window.toggleRecurring = toggleRecurring;
    
    window.signOut = () => {
        currentAccess.value = null;
        const passcodeEl = document.getElementById('passcode-input');
        if (passcodeEl) passcodeEl.value = '';
        document.getElementById('app-header')?.classList.add('hidden');
        document.getElementById('app-content')?.classList.remove('active');
        document.getElementById('auth-screen')?.classList.add('active');
    };

    window.renderAdminGrid = renderAdminGrid;
    window.openInputScreen = () => {
        document.getElementById('input-form')?.reset();
        const dateInput = document.getElementById('in-date');
        if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
        toggleRecurring();
        switchScreen('view-input');
    };

    window.openModifyScreen = () => {
        setRetrieveAllModify(false);
        populateModifySelect();
        switchScreen('view-modify');
    };

    window.retrieveAllModifyRecords = () => {
        setRetrieveAllModify(true);
        populateModifySelect();
    };

    window.populateModifyFields = populateModifyFields;
    window.updatePassword = () => updatePassword(() => switchScreen('view-overview-admin'));
    window.openListView = () => {
        switchScreen('view-list');
        handleListFilterChange();
    };
    window.handleListFilterChange = handleListFilterChange;
    window.renderListViewTable = renderListViewTable;
    window.downloadExcel = downloadExcel;

    // Attach form submit events directly
    document.getElementById('input-form')?.addEventListener('submit', (e) => submitAppointment(e, () => switchScreen('view-overview-admin')));
    document.getElementById('modify-form')?.addEventListener('submit', (e) => saveModifiedAppointment(e, () => switchScreen('view-overview-admin')));
}
