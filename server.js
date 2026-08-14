const express = require('express');
const path = require('path');
const xlsx = require('xlsx');
const { db, generateNextID } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 1. Password Verification (Flow Step 2)
app.post('/api/login', (req, res) => {
    const { passcode } = req.body;
    db.all("SELECT PassType FROM tbl_password WHERE OldValue = ?", [passcode], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        if (rows.length > 0) {
            return res.json({ access: rows[0].PassType }); // Returns 'admin' or 'public'
        }
        res.status(401).json({ error: "Access Denied" });
    });
});

// 2. Fetch Appointments (Functions 1a & 1b)
app.get('/api/appointments', (req, res) => {
    const { access, category } = queryStr = req.query;
    let query = "SELECT * FROM tbl_appointment WHERE Status != 'cancelled'";
    let params = [];

    if (access === 'admin' && category && category !== 'all') {
        query += " AND Category = ?";
        params.push(category);
    }

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Scrub detail context safely if user context is public
        if (access !== 'admin') {
            rows = rows.map(item => ({
                AppointmentID: item.AppointmentID,
                Category: item.Category,
                Status: item.Status,
                Date: item.Date,
                BeginHour: item.BeginHour,
                BeginMinute: item.BeginMinute,
                EndHour: item.EndHour,
                EndMinute: item.EndMinute,
                Details: "" // Obfuscate text field
            }));
        }
        res.json(rows);
    });
});

// 3. Input Appointment (Function 2)
app.post('/api/appointments', async (req, res) => {
    const { category, status, date, beginHour, beginMinute, endHour, endMinute, details } = req.body;
    try {
        const nextId = await generateNextID(category);
        const todayStr = new Date().toISOString().slice(0,10).replace(/-/g,""); // yyyymmdd

        db.run(`INSERT INTO tbl_appointment VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [nextId, category, status, date, beginHour, beginMinute, endHour, endMinute, details.substring(0, 500), todayStr],
            (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true, id: nextId });
            }
        );
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Modify Appointment (Function 3)
app.put('/api/appointments/:id', (req, res) => {
    const { id } = req.params;
    const { category, status, date, beginHour, beginMinute, endHour, endMinute, details } = req.body;
    const todayStr = new Date().toISOString().slice(0,10).replace(/-/g,"");

    db.run(`UPDATE tbl_appointment SET Category=?, Status=?, Date=?, BeginHour=?, BeginMinute=?, EndHour=?, EndMinute=?, Details=?, UpdateDate=? WHERE AppointmentID=?`,
        [category, status, date, beginHour, beginMinute, endHour, endMinute, details.substring(0, 500), todayStr, id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

// 5. Update Password Options (Function 4)
app.post('/api/password/update', (req, res) => {
    const { passType, oldValue, newValue, confirmNewValue } = req.body;
    
    if (newValue !== confirmNewValue || !newValue) {
        return res.status(400).json({ error: "Please check again" });
    }

    db.get("SELECT OldValue FROM tbl_password WHERE PassType = ?", [passType], (err, row) => {
        if (err || !row || row.OldValue !== oldValue) {
            return res.status(400).json({ error: "Please check again" });
        }

        db.run("UPDATE tbl_password SET OldValue = ?, NewValue = '' WHERE PassType = ?", [newValue, passType], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: "Password updated!" });
        });
    });
});

// 6. Export Database Table to Excel File (.xlsx) (Function 5)
app.get('/api/export', (req, res) => {
    db.all("SELECT * FROM tbl_appointment", [], (err, rows) => {
        if (err) return res.status(500).send("Export error");
        
        const worksheet = xlsx.utils.json_to_sheet(rows);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Appointments");
        
        const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Disposition', 'attachment; filename=tbl_appointment.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    });
});

app.listen(PORT, () => console.log(`App running on port ${PORT}`));
