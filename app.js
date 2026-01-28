// Firebase references
const auth = firebase.auth();
const db = firebase.firestore();

// Update dashboard stats from Firestore
function updateDashboardStats() {
  // Total Students
  db.collection('students').get().then(snapshot => {
    document.getElementById('totalStudents').textContent = snapshot.size;
  });

  // Total Teachers
  db.collection('teachers').get().then(snapshot => {
    document.getElementById('totalTeachers').textContent = snapshot.size;
  });

  // Today's Attendance
  const today = new Date().toISOString().slice(0, 10);
  db.collection('attendance').where('date', '==', today).get().then(snapshot => {
    const total = snapshot.size;
    const presentCount = snapshot.docs.filter(doc => doc.data().status === 'present').length;
    const percentage = total ? Math.round((presentCount / total) * 100) : 0;
    document.getElementById('todayAttendance').textContent = percentage + '%';
  });

  // Fees Collected
  db.collection('fees').get().then(snapshot => {
    let totalFees = 0;
    snapshot.forEach(doc => {
      totalFees += doc.data().paid_amount;
    });
    document.getElementById('feesCollected').textContent = '$' + totalFees;
  });
}

// Show section
function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById(sectionId).classList.add('active');

  const sectionTitles = {
    dashboard: 'Madrasa Dashboard',
    students: 'Student Management',
    teachers: 'Teacher Management',
    attendance: 'Attendance Management',
    fees: 'Fee Management',
    notifications: 'Notifications'
  };
  document.getElementById('section-title').textContent = sectionTitles[sectionId];

  // Highlight nav
  document.querySelectorAll('.nav-links a').forEach(link => link.classList.remove('active'));
  const link = document.querySelector(`.nav-links a[onclick*="${sectionId}"]`);
  if (link) link.classList.add('active');

  if (sectionId === 'dashboard') updateDashboardStats();
  if (sectionId === 'students') loadStudents();
  if (sectionId === 'teachers') loadTeachers();
  if (sectionId === 'attendance') loadAttendance();
  if (sectionId === 'fees') loadFees();
  if (sectionId === 'notifications') loadNotifications();
}

// -------------------- Student --------------------
document.getElementById('studentForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('studentName').value;
  const cls = document.getElementById('studentClass').value;
  const guardian = document.getElementById('guardianName').value;
  const phone = document.getElementById('guardianPhone').value;
  const fee = Number(document.getElementById('monthlyFee').value);

  db.collection('students').add({
    name,
    class: cls,
    guardian_name: guardian,
    guardian_phone: phone,
    monthly_fee: fee,
    due_amount: fee,
    created_at: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    alert('Student added successfully!');
    document.getElementById('studentForm').reset();
    loadStudents();
    updateDashboardStats();
  });
});

function loadStudents() {
  const container = document.getElementById('studentsList');
  container.innerHTML = '';
  db.collection('students').orderBy('created_at', 'desc').get().then(snapshot => {
    if (snapshot.empty) {
      container.innerHTML = '<p>No students added yet.</p>';
      return;
    }
    let table = '<table><tr><th>Name</th><th>Class</th><th>Guardian</th><th>Phone</th><th>Fee</th></tr>';
    snapshot.forEach(doc => {
      const data = doc.data();
      table += `<tr>
        <td>${data.name}</td>
        <td>${data.class}</td>
        <td>${data.guardian_name}</td>
        <td>${data.guardian_phone}</td>
        <td>$${data.monthly_fee}</td>
      </tr>`;
    });
    table += '</table>';
    container.innerHTML = table;
  });
}

// -------------------- Teacher --------------------
document.getElementById('teacherForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('teacherName').value;
  const subject = document.getElementById('subject').value;
  const salary = Number(document.getElementById('teacherSalary').value);

  db.collection('teachers').add({
    name,
    subject,
    monthly_salary: salary,
    created_at: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    alert('Teacher added successfully!');
    document.getElementById('teacherForm').reset();
    loadTeachers();
    updateDashboardStats();
  });
});

function loadTeachers() {
  const container = document.getElementById('teachersList');
  container.innerHTML = '';
  db.collection('teachers').orderBy('created_at', 'desc').get().then(snapshot => {
    if (snapshot.empty) {
      container.innerHTML = '<p>No teachers added yet.</p>';
      return;
    }
    let table = '<table><tr><th>Name</th><th>Subject</th><th>Salary</th></tr>';
    snapshot.forEach(doc => {
      const data = doc.data();
      table += `<tr>
        <td>${data.name}</td>
        <td>${data.subject}</td>
        <td>$${data.monthly_salary}</td>
      </tr>`;
    });
    table += '</table>';
    container.innerHTML = table;
  });
}

// -------------------- Attendance --------------------
function markAttendance() {
  const userType = document.getElementById('attendanceUserType').value;
  const userId = document.getElementById('attendanceUserId').value;
  const status = document.getElementById('attendanceStatus').value;
  const today = new Date().toISOString().slice(0, 10);

  if (!userId) return alert('Enter user ID');

  db.collection('attendance').add({
    user_type: userType,
    user_id: userId,
    status,
    date: today,
    created_at: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    alert('Attendance marked!');
    document.getElementById('attendanceUserId').value = '';
    loadAttendance();
    updateDashboardStats();
  });
}

function loadAttendance() {
  const container = document.getElementById('attendanceList');
  container.innerHTML = '';
  db.collection('attendance').orderBy('created_at', 'desc').limit(20).get().then(snapshot => {
    if (snapshot.empty) return container.innerHTML = '<p>No attendance records yet.</p>';
    let table = '<table><tr><th>User Type</th><th>User ID</th><th>Status</th><th>Date</th></tr>';
    snapshot.forEach(doc => {
      const data = doc.data();
      const statusClass = data.status === 'present' ? 'status-present' : 'status-absent';
      table += `<tr>
        <td>${data.user_type}</td>
        <td>${data.user_id}</td>
        <td><span class="status-badge ${statusClass}">${data.status}</span></td>
        <td>${data.date}</td>
      </tr>`;
    });
    table += '</table>';
    container.innerHTML = table;
  });
}

// -------------------- Fees --------------------
function addFee() {
  const studentId = document.getElementById('feeStudentId').value;
  const amount = Number(document.getElementById('paidAmount').value);
  const month = document.getElementById('month').value;

  if (!studentId || !amount || !month) return alert('Fill all fields');

  db.collection('fees').doc(studentId + '_' + month).set({
    student_id: studentId,
    month,
    paid_amount: amount,
    created_at: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true }).then(() => {
    alert('Fee recorded!');
    document.getElementById('feeStudentId').value = '';
    document.getElementById('paidAmount').value = '';
    document.getElementById('month').value = '';
    loadFees();
    updateDashboardStats();
  });
}

function loadFees() {
  const container = document.getElementById('feesList');
  container.innerHTML = '';
  db.collection('fees').orderBy('created_at', 'desc').limit(20).get().then(snapshot => {
    if (snapshot.empty) return container.innerHTML = '<p>No fee records yet.</p>';
    let table = '<table><tr><th>Student ID</th><th>Month</th><th>Amount</th></tr>';
    snapshot.forEach(doc => {
      const data = doc.data();
      table += `<tr>
        <td>${data.student_id}</td>
        <td>${data.month}</td>
        <td>$${data.paid_amount}</td>
      </tr>`;
    });
    table += '</table>';
    container.innerHTML = table;
  });
}

// -------------------- Notifications --------------------
function sendNotification() {
  const userId = document.getElementById('notifyUserId').value.trim();
  const message = document.getElementById('notifyMessage').value.trim();
  if (!message) return alert('Enter a message');

  db.collection('notifications').add({
    user_id: userId || 'all',
    message,
    created_at: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    alert('Notification sent!');
    document.getElementById('notifyUserId').value = '';
    document.getElementById('notifyMessage').value = '';
    loadNotifications();
  });
}

function loadNotifications() {
  const container = document.getElementById('notificationsList');
  container.innerHTML = '';
  db.collection('notifications').orderBy('created_at', 'desc').limit(20).get().then(snapshot => {
    if (snapshot.empty) return container.innerHTML = '<p>No notifications sent yet.</p>';
    let table = '<table><tr><th>User ID</th><th>Message</th><th>Date</th></tr>';
    snapshot.forEach(doc => {
      const data = doc.data();
      const date = data.created_at ? data.created_at.toDate().toLocaleString() : '';
      table += `<tr>
        <td>${data.user_id}</td>
        <td>${data.message}</td>
        <td>${date}</td>
      </tr>`;
    });
    table += '</table>';
    container.innerHTML = table;
  });
}

// -------------------- Logout --------------------
function logout() {
  auth.signOut().then(() => {
    alert('Logged out!');
    window.location.href = 'login.html'; // Create a login page
  }).catch(err => alert(err.message));
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', options);
  showSection('dashboard');
});