// server/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');

const app = express();
app.use(cors());
app.use(express.json());

// Datos simples en archivo (puedes migrar a DB luego)
const staff = require('./data/staff.json');

// --- Google OAuth2 por usuario (cada profesional) ---
function getOAuth2Client(worker) {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI // ej: http://localhost:3001/oauth2/callback
  );
  if (!worker.tokens) throw new Error('Faltan tokens OAuth del profesional');
  oAuth2Client.setCredentials(worker.tokens);
  return oAuth2Client;
}

// Disponibilidad simple (lee eventos ocupados del calendario)
app.get('/api/availability', async (req, res) => {
  try {
    const { workerId, timeMin, timeMax } = req.query;
    const worker = staff.find(s => s.id === workerId);
    if (!worker) return res.status(404).json({ error: 'Profesional no encontrado' });
    const auth = getOAuth2Client(worker);
    const calendar = google.calendar({ version: 'v3', auth });
    const resp = await calendar.events.list({
      calendarId: 'primary',
      timeMin, timeMax,
      singleEvents: true,
      orderBy: 'startTime'
    });
    res.json({ busy: resp.data.items });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Crear reserva (crea evento en el calendario del profesional)
app.post('/api/book', async (req, res) => {
  try {
    const { workerId, startISO, endISO, summary, description } = req.body;
    const worker = staff.find(s => s.id === workerId);
    if (!worker) return res.status(404).json({ error: 'Profesional no encontrado' });
    const auth = getOAuth2Client(worker);
    const calendar = google.calendar({ version: 'v3', auth });

    const event = {
      summary: summary || 'Reserva Neuroplus',
      description: description || '',
      start: { dateTime: startISO, timeZone: 'America/Santiago' },
      end:   { dateTime: endISO,   timeZone: 'America/Santiago' },
      reminders: { useDefault: true }
    };

    const created = await calendar.events.insert({
      calendarId: 'primary',
      resource: event
    });

    res.json({ ok: true, eventId: created.data.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// OAuth: URL para conectar la cuenta Google del profesional
app.get('/oauth2/url', (req, res) => {
  const { workerId } = req.query;
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI
  );
  const scopes = ['https://www.googleapis.com/auth/calendar'];
  const url = oAuth2Client.generateAuthUrl({ access_type: 'offline', prompt: 'consent', scope: scopes, state: workerId });
  res.json({ url });
});

// OAuth: callback para guardar tokens del profesional
app.get('/oauth2/callback', async (req, res) => {
  try {
    const { code, state: workerId } = req.query;
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI
    );
    const { tokens } = await oAuth2Client.getToken(code);

    // Guarda tokens en staff.json (demo). En producción: DB.
    const fs = require('fs');
    const idx = staff.findIndex(s => s.id === workerId);
    if (idx === -1) return res.status(404).send('Profesional no encontrado');
    staff[idx].tokens = tokens;
    fs.writeFileSync(__dirname + '/data/staff.json', JSON.stringify(staff, null, 2));
    res.send('Cuenta conectada. Ya puedes cerrar esta ventana.');
  } catch (e) {
    res.status(500).send(e.message);
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log('API on http://localhost:' + PORT));
