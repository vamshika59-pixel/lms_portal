let currentUser = null;

// Backend URL
const API_URL = "http://localhost:5000/api";

// ---------------- Authentication ----------------
async function registerUser() {
  const name = document.getElementById('regName').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  const role = document.getElementById('regRole').value;

  if (!name || !email || !password) {
    alert('Please fill all fields');
    return;
  }

  try {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });
    const data = await res.json();
    alert(data.msg);
    if (res.ok) showLogin();
  } catch (err) {
    alert('Server error');
  }
}

async function loginUser() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const role = document.getElementById('loginRole').value;

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role })
    });
    const data = await res.json();
    if (res.ok) {
      currentUser = data.user;
      currentUser.enrolledCourses = currentUser.enrolledCourses || [];
      currentUser.grades = currentUser.grades || {};

      document.getElementById('auth-pages').style.display = 'none';
      document.getElementById('dashboard').style.display = 'flex';
      document.getElementById('userName').textContent = currentUser.name;

      setupDashboard();
      showDashboard();
    } else alert(data.msg);
  } catch (err) {
    alert('Server error');
  }
}

// ---------------- Logout ----------------
function logout() {
  currentUser = null;

  // Hide dashboard, show login/register pages
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('auth-pages').style.display = 'block';

  // Reset login fields
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPassword').value = '';

  // Show login page by default
  showLogin();

  alert('You have been logged out successfully.');
}

// ---------------- Dark Mode ----------------
document.getElementById('darkModeToggle').addEventListener('click', () => {
  document.body.classList.toggle('dark');
});

// ---------------- Dashboard ----------------
async function setupDashboard() {
  try {
    const coursesRes = await fetch(`${API_URL}/courses`);
    const assignmentsRes = await fetch(`${API_URL}/assignments`);
    const forumRes = await fetch(`${API_URL}/forum`);
    const courses = await coursesRes.json();
    const assignments = await assignmentsRes.json();
    const forumPosts = await forumRes.json();

    document.getElementById('totalCourses').textContent = courses.length;
    document.getElementById('pendingAssignments').textContent = assignments.length;
    document.getElementById('totalNotifications').textContent = forumPosts.length;
  } catch (err) {
    console.error(err);
  }
}

// ---------------- Sections ----------------
function hideSections() {
  document.querySelectorAll('.dashboard-section').forEach(s => s.style.display = 'none');
}
function showDashboard() { hideSections(); document.getElementById('dashboardSection').style.display = 'block'; }
function showCourses() {
  hideSections();
  document.getElementById('coursesSection').style.display = 'block';
  renderCourses();
  document.getElementById('createCourseForm').style.display = currentUser.role === 'teacher' ? 'block' : 'none';
}
function showAssignments() {
  hideSections();
  document.getElementById('assignmentsSection').style.display = 'block';
  renderAssignments();
  document.getElementById('createAssignmentForm').style.display = currentUser.role === 'teacher' ? 'block' : 'none';
}
function showGrades() { hideSections(); document.getElementById('gradesSection').style.display = 'block'; renderGrades(); }
function showForum() { hideSections(); document.getElementById('forumSection').style.display = 'block'; renderForum(); }

// ---------------- Courses ----------------
async function createCourse() {
  const title = document.getElementById('courseTitle').value;
  const desc = document.getElementById('courseDesc').value;
  const duration = document.getElementById('courseDuration').value;

  if (!title || !desc || !duration) { alert('Fill all fields'); return; }

  try {
    await fetch(`${API_URL}/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, desc, duration, teacher: currentUser.name })
    });
    renderCourses();
    setupDashboard();
  } catch (err) { console.error(err); }
}

async function renderCourses() {
  try {
    const res = await fetch(`${API_URL}/courses`);
    const courses = await res.json();
    const container = document.getElementById('coursesContainer');
    container.innerHTML = '';

    courses.forEach((c, i) => {
      const div = document.createElement('div');
      div.className = 'course-card';
      div.innerHTML = `<h3>${c.title}</h3><p>${c.desc}</p><p>Duration: ${c.duration}</p>`;

      if (currentUser.role === 'student') {
        const btn = document.createElement('button');
        btn.textContent = currentUser.enrolledCourses.includes(i) ? 'Enrolled' : 'Enroll';
        btn.onclick = async () => {
          await fetch(`${API_URL}/courses/enroll`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userEmail: currentUser.email, courseIndex: i })
          });
          currentUser.enrolledCourses.push(i);
          renderCourses();
        };
        div.appendChild(btn);
      }

      container.appendChild(div);
    });
  } catch (err) { console.error(err); }
}

// ---------------- Assignments ----------------
async function createAssignment() {
  const title = document.getElementById('assignmentTitle').value;
  const desc = document.getElementById('assignmentDesc').value;
  const courseIndex = 0; // demo

  if (!title || !desc) { alert('Fill all fields'); return; }

  try {
    await fetch(`${API_URL}/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, desc, courseIndex })
    });
    renderAssignments();
    setupDashboard();
  } catch (err) { console.error(err); }
}

async function renderAssignments() {
  try {
    const res = await fetch(`${API_URL}/assignments`);
    const assignments = await res.json();
    const container = document.getElementById('assignmentsContainer');
    container.innerHTML = '';

    assignments.forEach((a, i) => {
      const div = document.createElement('div');
      div.className = 'assignment-card';
      div.innerHTML = `<h4>${a.title}</h4><p>${a.desc}</p>`;

      if (currentUser.role === 'student') {
        const btn = document.createElement('button');
        btn.textContent = a.submissions?.[currentUser.name] ? 'Submitted' : 'Submit';
        btn.onclick = async () => {
          await fetch(`${API_URL}/assignments/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assignmentIndex: i, studentName: currentUser.name })
          });
          renderAssignments();
        };
        div.appendChild(btn);
      }

      container.appendChild(div);
    });
  } catch (err) { console.error(err); }
}

// ---------------- Grades ----------------
async function renderGrades() {
  try {
    const container = document.getElementById('gradesContainer');
    container.innerHTML = '';
    const res = await fetch(`${API_URL}/courses`);
    const courses = await res.json();

    if (currentUser.role === 'student') {
      currentUser.enrolledCourses.forEach(ci => {
        const course = courses[ci];
        const div = document.createElement('div');
        div.className = 'grade-card';
        div.innerHTML = `<h4>${course.title}</h4><p>Grade: ${currentUser.grades[course.title] || 'N/A'}</p>`;
        container.appendChild(div);
      });
    } else {
      container.innerHTML = '<p>Teacher grading panel (to be implemented)</p>';
    }
  } catch (err) { console.error(err); }
}

// ---------------- Forum ----------------
async function addForumPost() {
  const content = document.getElementById('forumPost').value;
  if (!content) { alert('Post cannot be empty'); return; }

  try {
    await fetch(`${API_URL}/forum`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: currentUser.name, content })
    });
    document.getElementById('forumPost').value = '';
    renderForum();
    setupDashboard();
  } catch (err) { console.error(err); }
}

async function renderForum() {
  try {
    const res = await fetch(`${API_URL}/forum`);
    const forumPosts = await res.json();
    const container = document.getElementById('forumContainer');
    container.innerHTML = '';
    forumPosts.forEach(p => {
      const div = document.createElement('div');
      div.className = 'forum-post';
      div.innerHTML = `<strong>${p.user}:</strong><p>${p.content}</p>`;
      container.appendChild(div);
    });
  } catch (err) { console.error(err); }
}

// ---------------- Tab switching ----------------
function showLogin() {
  document.getElementById('registerPage').style.display = 'none';
  document.getElementById('loginPage').style.display = 'block';
}
function showRegister() {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('registerPage').style.display = 'block';
}
