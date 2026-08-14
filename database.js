const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:'); // Use a local file path like './timetable.db' if you want persistent storage

// Initialize Database Tables
db.serialize(() => {
    // Create Appointment Table
    db.run(`CREATE TABLE IF NOT EXISTS tbl_appointment (
        AppointmentID TEXT PRIMARY KEY,
        Category TEXT,
        Status TEXT,
        Date TEXT,
        BeginHour TEXT,
        BeginMinute TEXT,
        EndHour TEXT,
        EndMinute TEXT,
        Details TEXT,
        UpdateDate TEXT
    )`);

    // Create Password Table
    db.run(`CREATE TABLE IF NOT EXISTS tbl_password (
        PassType TEXT PRIMARY KEY,
        OldValue TEXT,
        NewValue TEXT
    )`);

    // Seed default passwords if empty
    db.get("SELECT COUNT(*) as count FROM tbl_password", [], (err, row) => {
        if (row.count === 0) {
            db.run("INSERT INTO tbl_password (PassType, OldValue, NewValue) VALUES ('admin', 'admin', '')");
            db.run("INSERT INTO tbl_password (PassType, OldValue, NewValue) VALUES ('public', 'public', '')");
        }
    });
});

// Helper function to generate custom sequential IDs
function generateNextID(category) {
    return new Promise((resolve, reject) => {
        const prefixMap = { 'music': 'M', 'work': 'W', 'personal': 'P', 'others': 'Z' };
        const prefix = prefixMap[category] || 'Z';
        
        db.get(
            `SELECT AppointmentID FROM tbl_appointment WHERE Category = ? ORDER BY AppointmentID DESC LIMIT 1`,
            [category],
            (err, row) => {
                if (err) return reject(err);
                if (!row) {
                    resolve(`${prefix}000000`); // Starting sequence
                } else {
                    const currentNum = parseInt(row.AppointmentID.substring(1), 10);
                    const nextNum = currentNum + 1;
                    const paddedNum = String(nextNum).padStart(6, '0');
                    resolve(`${prefix}${paddedNum}`);
                }
            }
        );
    });
}

module.exports = { db, generateNextID };
