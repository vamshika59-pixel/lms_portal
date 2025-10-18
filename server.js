const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// ✅ Serve static files from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Serve index.html at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const DATA_FILE = path.join(__dirname, 'data.json');

let data = { users: [], courses: [], assignments: [], forumPosts: [] };
if (fs.existsSync(DATA_FILE)) {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    data = JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read/parse data file, using defaults:', err);
  }
}

function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save data file:', err);
  }
}

// --- API routes ---
app.get('/api/users', (req, res) => res.json(data.users));
app.get('/api/courses', (req, res) => res.json(data.courses));
app.get('/api/assignments', (req, res) => res.json(data.assignments));
app.get('/api/forum', (req, res) => res.json(data.forumPosts));

app.post('/api/register', (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role)
    return res.status(400).json({ msg: 'All fields required' });

  const exists = data.users.find(u => u.email === email);
  if (exists) return res.status(400).json({ msg: 'User already exists' });

  const user = { name, email, password, role, enrolledCourses: [], grades: {} };
  data.users.push(user);
  saveData();
  res.json({ msg: 'User registered successfully', user });
});

app.post('/api/login', (req, res) => {
  const { email, password, role } = req.body;
  const user = data.users.find(u => u.email === email && u.password === password && u.role === role);
  if (!user) return res.status(400).json({ msg: 'Invalid credentials' });
  res.json({ msg: 'Login successful', user });
});

app.post('/api/courses', (req, res) => {
  const { title, desc, duration, teacher } = req.body;
  if (!title || !desc || !duration || !teacher)
    return res.status(400).json({ msg: 'All fields required' });

  const course = { title, desc, duration, teacher, students: [] };
  data.courses.push(course);
  saveData();
  res.json(course);
});

app.post('/api/courses/enroll', (req, res) => {
  const { userEmail, courseIndex } = req.body;
  const user = data.users.find(u => u.email === userEmail);
  const course = data.courses[courseIndex];
  if (!user || !course) return res.status(400).json({ msg: 'User or course not found' });

  if (!user.enrolledCourses.includes(courseIndex)) user.enrolledCourses.push(courseIndex);
  if (!course.students.includes(user.name)) course.students.push(user.name);

  saveData();
  res.json({ msg: 'Enrolled successfully' });
});

app.post('/api/assignments', (req, res) => {
  const { title, desc, courseIndex } = req.body;
  if (!title || !desc || courseIndex === undefined)
    return res.status(400).json({ msg: 'All fields required' });

  const assignment = { title, desc, courseIndex, submissions: {} };
  data.assignments.push(assignment);
  saveData();
  res.json(assignment);
});

app.post('/api/assignments/submit', (req, res) => {
  const { assignmentIndex, studentName } = req.body;
  const assignment = data.assignments[assignmentIndex];
  if (!assignment) return res.status(400).json({ msg: 'Assignment not found' });

  assignment.submissions[studentName] = 'Submitted';
  saveData();
  res.json({ msg: 'Assignment submitted successfully' });
});

app.post('/api/forum', (req, res) => {
  const { user, content } = req.body;
  if (!user || !content) return res.status(400).json({ msg: 'All fields required' });

  data.forumPosts.push({ user, content, timestamp: new Date().toISOString() });
  saveData();
  res.json({ msg: 'Forum post added successfully' });
});

const PORT = process.env.PORT || 5000;
<<<<<<< HEAD
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
=======
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
>>>>>>> 83d955f6b7d0fd25c9c2595924e51600b56f49be
