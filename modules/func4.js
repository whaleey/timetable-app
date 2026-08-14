import { passwords, saveToStorage } from './state.js';

export function updatePassword(callback) {
    const type = document.getElementById('pw-passtype').value;
    const oldV = document.getElementById('pw-old').value;
    const newV = document.getElementById('pw-new').value;
    const confV = document.getElementById('pw-confirm').value;

    if (newV !== confV || passwords[type] !== oldV) {
        alert("Please check again");
        return;
    }

    passwords[type] = newV;
    saveToStorage();
    alert("Password updated!");
    if (callback) callback();
}
