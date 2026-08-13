const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Database Connection
const db = new sqlite3.Database(':memory:', (err) => { // Replace ':memory:' with 'timetable.db' for persistent storage
    if (err) return console.error(err.message);
    console.log('Connected to the SQLite database.');
});

// Create Tables and Seed Default Data
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS tbl_appointment (
        AppointmentID INTEGER PRIMARY KEY AUTOINCREMENT,
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

    db.run(`CREATE TABLE IF NOT EXISTS tbl_password (
        PassType TEXT PRIMARY KEY,
        OldValue TEXT,
        NewValue TEXT
    )`);

    // Insert Default Credentials if table is empty
    db.get("SELECT COUNT(*) as count FROM tbl_password", [], (err, row) => {
        if (row.count === 0) {
            db.run("INSERT INTO tbl_password (PassType, OldValue, NewValue) VALUES ('admin', 'admin', '')");
            db.run("INSERT INTO tbl_password (PassType, OldValue, NewValue) VALUES ('public', 'public', '')");
        }
    });
});

// API 1: Authentication Gateway
app.post('/api/auth', (req, res) => {
    const { passcode } = req.body;
    db.get("SELECT PassType FROM tbl_password WHERE OldValue = ?", [passcode], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) {
            res.json({ success: true, role: row.PassType });
        } else {
            res.json({ success: false, message: "Access Denied" });
        }
    });
});

// API 2: Fetch Appoinments
app.get('/api/appointments', (req, res) => {
    db.all("SELECT * FROM tbl_appointment", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// API 3: Create Appointment (Function 2)
app.post('/api/appointments', (req, res) => {
    const { category, status, date, beginHour, beginMinute, endHour, endMinute, details } = req.body;
    const today = new Date().toISOString().slice(0,10).replace(/-/g,""); // yyyymmdd format

    db.run(`INSERT INTO tbl_appointment (Category, Status, Date, BeginHour, BeginMinute, EndHour, EndMinute, Details, UpdateDate) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [category, status, date, beginHour, beginMinute, endHour, endMinute, details, today],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: String(this.lastID).padStart(6, '0') });
        }
    );
});

// API 4: Update Appointment (Function 3)
app.put('/api/appointments/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { category, status, date, beginHour, beginMinute, endHour, endMinute, details } = req.body;
    const today = new Date().toISOString().slice(0,10).replace(/-/g,"");

    db.run(`UPDATE tbl_appointment SET Category=?, Status=?, Date=?, BeginHour=?, BeginMinute=?, EndHour=?, EndMinute=?, Details=?, UpdateDate=? 
            WHERE AppointmentID=?`,
        [category, status, date, beginHour, beginMinute, endHour, endMinute, details, today, id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

// API 5: Change Password (Function 4)
app.post('/api/password-update', (req, res) => {
    const { passType, oldValue, newValue, confirmNewValue } = req.body;

    if (newValue !== confirmNewValue) {
        return res.json({ success: false, message: "Please check again" });
    }

    db.get("SELECT OldValue FROM tbl_password WHERE PassType = ?", [passType], (err, row) => {
        if (err || !row || row.OldValue !== oldValue) {
            return res.json({ success: false, message: "Please check again" });
        }

        db.run("UPDATE tbl_password SET OldValue = ?, NewValue = '' WHERE PassType = ?", [newValue, passType], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: "Password updated!" });
        });
    });
});

app.listen(PORT, () => console.log(`Server executing live on port ${PORT}`));
