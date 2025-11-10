// server.js
const express = require('express');
const cors = require('cors');
const { LowSync } = require('lowdb'); // Main lowdb class
const { JSONFileSync } = require('lowdb/node'); // Sync JSON adapter (replaces FileSync)
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname))); // Serve static files

// Database setup
const adapter = new JSONFileSync('db.json'); // Correct adapter
const db = new LowSync(adapter, { students: [], quickRegistrations: [] }); // Initialize with defaults

// Ensure defaults are set on first run
db.read(); // Read existing data (creates file if missing)

// === QUICK REGISTER ===
app.post('/api/quick-register', (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be 8+ characters' });
  }

  // Check for existing
  const exists = db.data.quickRegistrations?.find((reg) => reg.email === email);
  if (exists) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const record = {
    id: uuidv4(),
    email,
    password, // In production: hash this!
    registeredAt: new Date().toISOString()
  };

  db.data.quickRegistrations.push(record);
  db.write(); // Persist changes

  res.status(201).json({
    message: 'Quick registration successful!',
    redirect: '/#register'
  });
});

// === FULL REGISTRATION ===
app.post('/api/register', (req, res) => {
  const { firstname, lastname, email, password, course, terms } = req.body;

  // Validation
  if (!firstname || !lastname || !email || !password || terms !== true) {
    return res.status(400).json({ error: 'All required fields must be filled' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password too short' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  // Check for existing
  const exists = db.data.students?.find((student) => student.email === email);
  if (exists) {
    return res.status(409).json({ error: 'Student already exists' });
  }

  const student = {
    id: uuidv4(),
    firstname,
    lastname,
    email,
    password, // TODO: Use bcrypt
    course: course || null,
    termsAccepted: true,
    registeredAt: new Date().toISOString()
  };

  db.data.students.push(student);
  db.write(); // Persist changes

  res.status(201).json({
    message: 'Registration complete! Welcome to LearnFast.',
    student: { firstname, email }
  });
});

// === HEALTH CHECK ===
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser (serves index.html)`);
});