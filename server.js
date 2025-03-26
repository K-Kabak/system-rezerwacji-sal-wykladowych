const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

// 🔧 Połączenie z Twoją bazą danych
const db = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root', // ← PODMIEN
  password: 'xi*V#BFDAxRAgB4Td6', // ← PODMIEN
  database: 'rezerwacje_sali'
});

db.connect(err => {
  if (err) {
    console.error('❌ Błąd połączenia z MySQL:', err);
    process.exit();
  }
  console.log('✅ Połączono z MySQL');
});

// 📥 GET /sale — pobierz listę sal
app.get('/sale', (req, res) => {
  db.query('SELECT * FROM sala', (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// 📥 GET /rezerwacje — pobierz wszystkie rezerwacje
app.get('/rezerwacje', (req, res) => {
  db.query('SELECT * FROM rezerwacje', (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// 📝 POST /rezerwacje — dodaj rezerwację
app.post('/rezerwacje', (req, res) => {
  const { nr_sali, grupa, typ, termin, godzina_od, godzina_do } = req.body;

  if (!nr_sali || !grupa || !typ || !termin || !godzina_od || !godzina_do) {
    return res.status(400).json({ error: 'Brakuje danych.' });
  }

  const sql = `
    INSERT INTO rezerwacje (nr_sali, grupa, typ, termin, godzina_od, godzina_do)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [nr_sali, grupa, typ, termin, godzina_od, godzina_do], (err, result) => {
    if (err) return res.status(500).send(err);
    res.json({ success: true, id: result.insertId });
  });
});

app.listen(port, () => {
  console.log(`🚀 Serwer działa na http://213.73.1.69:${port}`);
});
