// ── STATE ────────────────────────────────────────────────
const state = {
  students: [],
  rooms: [],
  exams: [],
  currentPage: "dashboard",
  deptChart: null,
  analyticsCharts: {},
};
const deptColors = {
  CSE: "cse",
  ECE: "ece",
  MECH: "mech",
  CIVIL: "civil",
  EEE: "eee",
};

// ── PARTICLES ────────────────────────────────────────────
function initParticles() {
  const c = document.getElementById("particles");
  for (let i = 0; i < 18; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    const s = Math.random() * 4 + 2;
    p.style.cssText = `width:${s}px;height:${s}px;left:${Math.random() * 100}%;
      animation-duration:${Math.random() * 20 + 15}s;animation-delay:-${Math.random() * 20}s;
      background:${Math.random() > 0.5 ? "rgba(124,106,255,0.6)" : "rgba(59,138,255,0.5)"};`;
    c.appendChild(p);
  }
}
initParticles();

// ── AUTH ─────────────────────────────────────────────────
function togglePwd() {
  const i = document.getElementById("login-pass");
  const ico = document.getElementById("eye-icon");

  if (i.type === "password") {
    i.type = "text";
    ico.className = "fa-regular fa-eye-slash";
  } else {
    i.type = "password";
    ico.className = "fa-regular fa-eye";
  }
}

async function doLogin() {
  const u = document.getElementById("login-user").value.trim();
  const p = document.getElementById("login-pass").value;

  if (!u || !p) {
    showAuthError();
    return;
  }

  const btn = document.getElementById("login-btn");

  btn.innerHTML = '<div class="spinner" style="margin:0 auto"></div>';

  btn.disabled = true;

  try {
    const r = await fetch("/api/login", {
      method: "POST",

      credentials: "include",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        username: u,
        password: p,
      }),
    });

    const d = await r.json();

    console.log("LOGIN RESPONSE:", d);

    if (d.success) {
      document.getElementById("sidebar-user-name").textContent = d.name;

      showApp();
    } else {
      showAuthError();
    }
  } catch (err) {
    console.log("LOGIN ERROR:", err);

    showAuthError();
  }

  btn.innerHTML = "<span>Sign In</span>";

  btn.disabled = false;
}

function showAuthError() {
  const e = document.getElementById("auth-error");

  e.style.display = "block";

  document.getElementById("login-btn").innerHTML = "<span>Sign In</span>";

  document.getElementById("login-btn").disabled = false;

  setTimeout(() => {
    e.style.display = "none";
  }, 3000);
}

function showApp() {
  const auth = document.getElementById("auth-screen");

  auth.style.opacity = "0";

  auth.style.transform = "scale(1.05)";

  setTimeout(() => {
    auth.style.display = "none";

    document.getElementById("app").style.display = "block";

    navigate("dashboard");

    loadDashboard();

    loadStudents();

    loadRooms();

    loadExams();
  }, 500);
}

async function doLogout() {
  try {
    await fetch("/api/logout", {
      method: "POST",

      credentials: "include",
    });
  } catch (err) {
    console.log(err);
  }

  location.reload();
}

// ── NAVIGATION ───────────────────────────────────────────
const pageNames = {
  dashboard: "Dashboard",
  students: "Students",
  rooms: "Rooms",
  exams: "Exams",
  seating: "Generate Seating",
  preview: "Preview & Export",
  analytics: "Analytics",
};
function navigate(page) {
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document
    .querySelectorAll(".nav-item")
    .forEach((n) => n.classList.remove("active"));
  document.getElementById("page-" + page)?.classList.add("active");
  document.querySelector(`[data-page="${page}"]`)?.classList.add("active");
  document.getElementById("topbar-title").textContent = pageNames[page] || page;
  state.currentPage = page;
  closeSidebar();
  if (page === "analytics") loadAnalytics();
  if (page === "seating") loadSeatingPage();
  if (page === "preview") loadPreviewPage();
}

// ── SIDEBAR MOBILE ───────────────────────────────────────
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
  document.getElementById("sidebar-overlay").style.display = document
    .getElementById("sidebar")
    .classList.contains("open")
    ? "block"
    : "none";
}
function closeSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebar-overlay").style.display = "none";
}

// ── MODALS ───────────────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.add("open");
}
function closeModal(id) {
  document.getElementById(id).classList.remove("open");
}

// ── TOAST ────────────────────────────────────────────────
function showToast(msg, type = "success") {
  const icons = {
    success: "fa-check-circle",
    error: "fa-circle-xmark",
    info: "fa-circle-info",
  };
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.innerHTML = `<i class="fa-solid ${icons[type]} toast-icon"></i><span>${msg}</span>`;
  document.getElementById("toast-container").appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// ── UTILS ────────────────────────────────────────────────
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function api(url, opts = {}) {
  try {
    const r = await fetch(url, {
      credentials: "include",

      headers: {
        "Content-Type": "application/json",
      },

      ...opts,
    });

    return await r.json();
  } catch (err) {
    console.log("API ERROR:", err);

    return null;
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// ── PDF HELPERS ──────────────────────────────────────────
function generateDemoArrangementPDF(examId) {
  const rooms = DEMO.rooms;
  const students = DEMO.students;

  const arr = [];
  let i = 0;

  students.forEach((s) => {
    const room = rooms[i % rooms.length];

    arr.push({
      ...s,
      room_number: room.room_number,
      seat_number: (i % room.capacity) + 1,
    });

    i++;
  });

  return arr;
}
// ── DEMO DATA ────────────────────────────────────────────
const DEMO = {
  students: [
    {
      id: 1,
      name: "Arjun Kumar",
      roll_number: "CS2401",
      department: "CSE",
      year: "2nd",
      subject: "Data Structures",
    },
    {
      id: 2,
      name: "Priya Sharma",
      roll_number: "EC2401",
      department: "ECE",
      year: "2nd",
      subject: "Signals",
    },
    {
      id: 3,
      name: "Rahul Mehta",
      roll_number: "ME2401",
      department: "MECH",
      year: "3rd",
      subject: "Thermodynamics",
    },
    {
      id: 4,
      name: "Sneha Patel",
      roll_number: "CS2402",
      department: "CSE",
      year: "2nd",
      subject: "DBMS",
    },
    {
      id: 5,
      name: "Vikram Singh",
      roll_number: "CE2401",
      department: "CIVIL",
      year: "2nd",
      subject: "Structures",
    },
    {
      id: 6,
      name: "Anjali Rao",
      roll_number: "EE2401",
      department: "EEE",
      year: "1st",
      subject: "Basic Electrical",
    },
    {
      id: 7,
      name: "Karthik Nair",
      roll_number: "CS2403",
      department: "CSE",
      year: "3rd",
      subject: "OS",
    },
    {
      id: 8,
      name: "Divya Reddy",
      roll_number: "EC2402",
      department: "ECE",
      year: "1st",
      subject: "Electronics",
    },
    {
      id: 9,
      name: "Suresh Yadav",
      roll_number: "ME2402",
      department: "MECH",
      year: "2nd",
      subject: "Fluid Mechanics",
    },
    {
      id: 10,
      name: "Meera Joshi",
      roll_number: "CS2404",
      department: "CSE",
      year: "4th",
      subject: "ML",
    },
  ],
  rooms: [
    { id: 1, room_number: "101", capacity: 40, floor: "Ground", block: "A" },
    { id: 2, room_number: "102", capacity: 35, floor: "Ground", block: "A" },
    { id: 3, room_number: "201", capacity: 30, floor: "First", block: "B" },
    { id: 4, room_number: "202", capacity: 45, floor: "First", block: "B" },
  ],
  exams: [
    {
      id: 1,
      name: "Semester Final 2024",
      subject: "Mathematics",
      exam_date: "2024-12-15",
      start_time: "09:00:00",
    },
    {
      id: 2,
      name: "Mid Term 2024",
      subject: "Physics",
      exam_date: "2024-11-10",
      start_time: "10:00:00",
    },
  ],
};

// ── DASHBOARD ────────────────────────────────────────────
async function loadDashboard() {
  let d;
  try {
    d = await api("/api/dashboard");
  } catch {}
  if (!d) {
    // Demo fallback
    d = {
      students: DEMO.students.length,
      rooms: DEMO.rooms.length,
      exams: DEMO.exams.length,
      arrangements: 8,
      empty_seats: 42,
      dept_data: [
        { department: "CSE", count: 4 },
        { department: "ECE", count: 2 },
        { department: "MECH", count: 2 },
        { department: "CIVIL", count: 1 },
        { department: "EEE", count: 1 },
      ],
    };
  }
  animateCount("stat-students", d.students);
  animateCount("stat-rooms", d.rooms);
  animateCount("stat-exams", d.exams);
  animateCount("stat-seats", d.empty_seats);
  renderDeptChart("dept-chart", d.dept_data);
}

function animateCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let current = 0;
  const step = target / 40;
  const interval = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = Math.round(current);
    if (current >= target) clearInterval(interval);
  }, 30);
}

function renderDeptChart(canvasId, data) {
  const ctx = document.getElementById(canvasId)?.getContext("2d");
  if (!ctx || !data?.length) return;
  if (state.deptChart) state.deptChart.destroy();
  state.deptChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: data.map((d) => d.department),
      datasets: [
        {
          data: data.map((d) => d.count),
          backgroundColor: [
            "rgba(124,106,255,0.8)",
            "rgba(59,138,255,0.8)",
            "rgba(45,186,122,0.8)",
            "rgba(240,160,48,0.8)",
            "rgba(255,90,90,0.8)",
          ],
          borderWidth: 0,
          hoverOffset: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: {
            color: "#9090b8",
            padding: 16,
            font: { size: 12 },
            boxWidth: 12,
            borderRadius: 6,
          },
        },
      },
      cutout: "65%",
    },
  });
}

// ── STUDENTS ─────────────────────────────────────────────
// ── STUDENTS ─────────────────────────────────────────────

async function loadStudents() {
  const search = document.getElementById("student-search")?.value || "";
  const dept = document.getElementById("dept-filter")?.value || "";

  let data;
  try {
    let url = "/api/students?";
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (dept) url += `dept=${encodeURIComponent(dept)}`;
    data = await api(url);
  } catch {}

  if (!data) {
    data = DEMO.students.filter(
      (s) =>
        (!search ||
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.roll_number.toLowerCase().includes(search.toLowerCase())) &&
        (!dept || s.department === dept),
    );
  }

  state.students = data;

  const tbody = document.getElementById("students-tbody");

  if (!data.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state">
            <i class="fa-solid fa-users-slash"></i>
            <p>No students found</p>
          </div>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = data
    .map(
      (s, i) => `
    <tr>
      <td style="color:var(--text3);font-size:0.8rem;">${i + 1}</td>
      <td><span style="font-weight:500;">${s.name}</span></td>
      <td><code style="font-size:0.82rem;color:var(--p2);">${s.roll_number}</code></td>
      <td><span class="badge badge-${deptBadge(s.department)}">${s.department}</span></td>
      <td><span style="color:var(--text2);">${s.year}</span></td>
      <td style="color:var(--text2);">${s.subject || "—"}</td>
      <td>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-icon btn-sm" onclick='editStudent(${JSON.stringify(s).replace(/"/g, "&quot;")})'>
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn btn-icon btn-sm btn-danger" onclick="deleteStudent(${s.id})">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>`,
    )
    .join("");
}

function deptBadge(d) {
  const m = {
    CSE: "purple",
    ECE: "blue",
    MECH: "green",
    CIVIL: "orange",
    EEE: "red",
  };
  return m[d] || "purple";
}

function searchStudents() {
  clearTimeout(state._search);
  state._search = setTimeout(loadStudents, 300);
}

function filterStudents() {
  loadStudents();
}

// ── MODAL ───────────────────────────────────────────────

function openStudentModal(data = null) {
  document.getElementById("student-modal-title").textContent = data
    ? "Edit Student"
    : "Add Student";

  document.getElementById("student-id").value = data?.id || "";
  document.getElementById("s-name").value = data?.name || "";
  document.getElementById("s-roll").value = data?.roll_number || "";
  document.getElementById("s-dept").value = data?.department || "CSE";
  document.getElementById("s-year").value = data?.year || "1st";
  document.getElementById("s-subject").value = data?.subject || "";

  openModal("student-modal");
}

function editStudent(s) {
  openStudentModal(s);
}

// ── SAVE STUDENT ─────────────────────────────────────────

async function saveStudent() {
  const id = document.getElementById("student-id").value;

  const payload = {
    name: document.getElementById("s-name").value,
    roll_number: document.getElementById("s-roll").value,
    department: document.getElementById("s-dept").value,
    year: document.getElementById("s-year").value,
    subject: document.getElementById("s-subject").value,
  };

  if (!payload.name || !payload.roll_number) {
    showToast("Name and Roll Number required", "error");
    return;
  }

  try {
    if (id) {
      await api(`/api/students/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    } else {
      await api("/api/students", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }
  } catch {}

  // ── DEMO UPDATE (LOCAL STATE)
  if (id) {
    const idx = DEMO.students.findIndex((s) => s.id == id);
    if (idx > -1) DEMO.students[idx] = { ...DEMO.students[idx], ...payload };
  } else {
    DEMO.students.push({ id: Date.now(), ...payload });
  }

  closeModal("student-modal");
  showToast(id ? "Student updated" : "Student added");

  // 🔥 IMPORTANT FIX: refresh everything
  loadStudents();
  loadDashboard();
}

// ── DELETE STUDENT ───────────────────────────────────────

async function deleteStudent(id) {
  if (!confirm("Delete this student?")) return;

  try {
    await api(`/api/students/${id}`, { method: "DELETE" });
  } catch {}

  const idx = DEMO.students.findIndex((s) => s.id === id);
  if (idx > -1) DEMO.students.splice(idx, 1);

  showToast("Student deleted", "info");

  // 🔥 IMPORTANT FIX: refresh everything
  loadStudents();
  loadDashboard();
}
// ── ROOMS ────────────────────────────────────────────────
// ── ROOMS ────────────────────────────────────────────────

async function loadRooms() {
  let data;

  try {
    data = await api("/api/rooms");
  } catch (err) {
    console.log("API error:", err);
  }

  if (!data) data = DEMO.rooms;

  state.rooms = data;

  const grid = document.getElementById("rooms-grid");

  if (!data.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-door-open"></i>
        <p>No rooms added yet</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = data
    .map(
      (r) => `
        <div class="room-card">
          <div class="room-number">Room ${r.room_number}</div>

          <div class="room-meta">
            <i class="fa-solid fa-building" style="font-size:11px;margin-right:4px;"></i>
            Block ${r.block} · Floor ${r.floor}
          </div>

          <div class="capacity-bar" style="margin-top:0.75rem;">
            <div class="capacity-fill" style="width:${Math.min(
              100,
              Math.random() * 80 + 10,
            )}%"></div>
          </div>

          <div style="display:flex;justify-content:space-between;margin-top:6px;font-size:0.78rem;color:var(--text3);">
            <span>Capacity</span>
            <span style="color:var(--p2);font-weight:600;">${r.capacity} seats</span>
          </div>

          <div class="room-actions">
            <button class="btn btn-icon btn-sm" onclick='editRoom(${JSON.stringify(
              r,
            ).replace(/"/g, "&quot;")})' title="Edit">
              <i class="fa-solid fa-pen"></i>
            </button>

            <button class="btn btn-icon btn-sm btn-danger" onclick="deleteRoom(${
              r.id
            })" title="Delete">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      `,
    )
    .join("");
}

// ── OPEN ROOM MODAL ───────────────────────────────────────

function openRoomModal(data = null) {
  document.getElementById("room-modal-title").textContent = data
    ? "Edit Room"
    : "Add Room";

  document.getElementById("room-id").value = data?.id || "";
  document.getElementById("r-num").value = data?.room_number || "";
  document.getElementById("r-cap").value = data?.capacity || "";
  document.getElementById("r-floor").value = data?.floor || "";
  document.getElementById("r-block").value = data?.block || "";

  openModal("room-modal");
}

function editRoom(r) {
  openRoomModal(r);
}

// ── SAVE ROOM ─────────────────────────────────────────────

async function saveRoom() {
  const id = document.getElementById("room-id").value;

  const payload = {
    room_number: document.getElementById("r-num").value.trim(),
    capacity: Number(document.getElementById("r-cap").value),
    floor: document.getElementById("r-floor").value,
    block: document.getElementById("r-block").value,
  };

  if (!payload.room_number || !payload.capacity || isNaN(payload.capacity)) {
    showToast("Room number and capacity required", "error");
    return;
  }

  try {
    const url = id ? `/api/rooms/${id}` : `/api/rooms`;
    const method = id ? "PUT" : "POST";

    await api(url, {
      method,
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.log("Save room API error:", err);
  }

  // Update local DEMO state (important for UI refresh)
  if (id) {
    const idx = DEMO.rooms.findIndex((r) => r.id == id);
    if (idx > -1) DEMO.rooms[idx] = { ...DEMO.rooms[idx], ...payload };
  } else {
    DEMO.rooms.push({ id: Date.now(), ...payload });
  }

  closeModal("room-modal");
  showToast(id ? "Room updated" : "Room added");

  loadRooms();
  loadDashboard(); // IMPORTANT FIX: dashboard update
}

// ── DELETE ROOM ───────────────────────────────────────────

async function deleteRoom(id) {
  if (!confirm("Delete this room?")) return;

  try {
    await api(`/api/rooms/${id}`, { method: "DELETE" });
  } catch (err) {
    console.log("Delete API error:", err);
  }

  const idx = DEMO.rooms.findIndex((r) => r.id === id);
  if (idx > -1) DEMO.rooms.splice(idx, 1);

  showToast("Room deleted", "info");

  loadRooms();
  loadDashboard(); // IMPORTANT FIX: dashboard update
}
// ── EXAMS ────────────────────────────────────────────────
async function loadExams() {
  let data;

  try {
    data = await api("/api/exams");
  } catch {}

  if (!data) data = DEMO.exams;

  state.exams = data;

  const tbody = document.getElementById("exams-tbody");

  if (!data.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <i class="fa-solid fa-file-pen"></i>
            <p>No exams yet</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = data
    .map(
      (e, i) => `
        <tr>
          <td style="color:var(--text3);font-size:0.8rem;">${i + 1}</td>
          <td style="font-weight:500;">${e.name}</td>
          <td><span class="badge badge-blue">${e.subject}</span></td>
          <td style="color:var(--text2);">${e.exam_date}</td>
          <td style="color:var(--text2);">${e.start_time}</td>
          <td>
            <button class="btn btn-sm btn-accent"
              onclick="navigate('seating');setTimeout(()=>{document.getElementById('seating-exam-select').value=${e.id}},200)">
              <i class="fa-solid fa-table-cells"></i> Seat
            </button>
          </td>
        </tr>
      `,
    )
    .join("");
}

// ── EXAM MODAL ───────────────────────────────────────────

function openExamModal() {
  openModal("exam-modal");
}

// ── SAVE EXAM (FIXED DASHBOARD UPDATE) ───────────────────

async function saveExam() {
  const payload = {
    name: document.getElementById("e-name").value,
    subject: document.getElementById("e-subject").value,
    exam_date: document.getElementById("e-date").value,
    start_time: document.getElementById("e-time").value,
  };

  if (!payload.name || !payload.exam_date) {
    showToast("Name and date required", "error");
    return;
  }

  try {
    await api("/api/exams", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.log("Exam API error:", err);
  }

  // local update (demo mode)
  DEMO.exams.push({ id: Date.now(), ...payload });

  closeModal("exam-modal");
  showToast("Exam created");

  loadExams();

  // 🔥 IMPORTANT FIX: refresh dashboard after adding exam
  loadDashboard();
}

// ── SEATING ──────────────────────────────────────────────
function loadSeatingPage() {
  const sel = document.getElementById("seating-exam-select");
  sel.innerHTML =
    '<option value="">Choose an exam…</option>' +
    state.exams
      .map((e) => `<option value="${e.id}">${e.name}</option>`)
      .join("");
  const rsel = document.getElementById("room-selector");
  rsel.innerHTML = state.rooms
    .map(
      (r) => `
    <label class="room-check" data-capacity="${r.capacity}">
      <input type="checkbox" value="${r.id}" onchange="updateSeatingInfo()"/>
      <div class="room-check-name">Room ${r.room_number}</div>
      <div class="room-check-cap">Block ${r.block} · ${r.capacity} seats</div>
    </label>`,
    )
    .join("");
  updateSeatingInfo();
}

function updateSeatingInfo() {
  const checked = document.querySelectorAll("#room-selector input:checked");
  const cap = Array.from(checked).reduce(
    (s, el) => s + parseInt(el.closest(".room-check").dataset.capacity),
    0,
  );
  const total = state.students.length || DEMO.students.length;
  document.getElementById("gen-student-count").textContent = total;
  document.getElementById("gen-capacity").textContent = cap || "—";
  const pct = cap ? Math.min(100, Math.round((total / cap) * 100)) : 0;
  document.getElementById("gen-progress").style.width = pct + "%";
}

async function generateSeating() {
  const examId = document.getElementById("seating-exam-select").value;
  if (!examId) {
    showToast("Please select an exam", "error");
    return;
  }
  const roomIds = Array.from(
    document.querySelectorAll("#room-selector input:checked"),
  ).map((el) => parseInt(el.value));
  if (!roomIds.length) {
    showToast("Please select at least one room", "error");
    return;
  }
  const btn = document.getElementById("generate-btn");
  btn.innerHTML = '<div class="spinner"></div> Generating…';
  btn.disabled = true;
  await sleep(1000);
  try {
    const r = await api("/api/seating/generate", {
      method: "POST",
      body: JSON.stringify({ exam_id: examId, room_ids: roomIds }),
    });
    if (r?.success) {
      showToast("Seating generated successfully!");
      navigate("preview");
      loadPreviewPage();
      return;
    }
  } catch {}
  // Demo generation
  showToast("Seating generated! (Demo mode)");
  navigate("preview");
  loadPreviewPage();
  btn.innerHTML = '<i class="fa-solid fa-shuffle"></i> Generate Smart Seating';
  btn.disabled = false;
}

// ── PREVIEW ──────────────────────────────────────────────
function loadPreviewPage() {
  const sel = document.getElementById("preview-exam-select");
  sel.innerHTML =
    '<option value="">Select exam to preview…</option>' +
    state.exams
      .map((e) => `<option value="${e.id}">${e.name}</option>`)
      .join("");
}

async function loadPreview(examId) {
  if (!examId) return;
  const content = document.getElementById("preview-content");
  content.innerHTML =
    '<div class="loader"><div class="spinner"></div> Loading arrangement…</div>';
  await sleep(600);
  let data;
  try {
    data = await api(`/api/seating/${examId}`);
  } catch {}
  if (!data || !data.length) {
    // Demo: generate fake arrangement
    data = generateDemoArrangement();
  }
  document.getElementById("pdf-btn").style.display = "flex";
  document.getElementById("seat-legend").style.display = "flex";
  renderPreview(data);
}

function generateDemoArrangement() {
  const arr = [];
  const rooms = [
    { room_number: "101", block: "A", floor: "Ground" },
    { room_number: "102", block: "A", floor: "Ground" },
  ];
  const depts = [
    "CSE",
    "ECE",
    "MECH",
    "CIVIL",
    "EEE",
    "CSE",
    "ECE",
    "MECH",
    "CSE",
    "ECE",
  ];
  DEMO.students.forEach((s, i) => {
    const room = rooms[Math.floor(i / 6) % rooms.length];
    arr.push({
      ...s,
      room_number: room.room_number,
      block: room.block,
      floor: room.floor,
      seat_number: (i % 6) + 1,
    });
  });
  return arr;
}

function renderPreview(data) {
  const byRoom = {};
  data.forEach((s) => {
    if (!byRoom[s.room_number]) byRoom[s.room_number] = [];
    byRoom[s.room_number].push(s);
  });
  const content = document.getElementById("preview-content");
  content.innerHTML = Object.entries(byRoom)
    .map(
      ([room, seats]) => `
    <div class="card" style="margin-bottom:1.25rem;">
      <div class="card-header">
        <div><div class="card-title">Room ${room}</div><div class="card-subtitle">Block ${seats[0].block} · Floor ${seats[0].floor} · ${seats.length} students</div></div>
        <span class="badge badge-purple">${seats.length} seated</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Seat</th><th>Name</th><th>Roll No.</th><th>Dept</th></tr></thead>
          <tbody>${seats
            .map(
              (s) => `
            <tr>
              <td><span class="badge badge-purple">${s.seat_number}</span></td>
              <td style="font-weight:500;">${s.name}</td>
              <td><code style="font-size:0.8rem;color:var(--p2);">${s.roll_number}</code></td>
              <td><span class="badge badge-${deptBadge(s.department)}">${s.department}</span></td>
            </tr>`,
            )
            .join("")}
          </tbody>
        </table>
      </div>
    </div>`,
    )
    .join("");
}

async function downloadPDF() {
  const examId = document.getElementById("preview-exam-select").value;

  if (!examId) {
    showToast("Select an exam first", "error");
    return;
  }

  // find exam
  const exam = state.exams.find((e) => String(e.id) === String(examId));

  if (!exam) {
    showToast("Invalid exam selected", "error");
    return;
  }

  showToast("Generating PDF…", "info");

  // try backend first (optional)
  try {
    const r = await fetch(`/api/seating/${examId}/pdf`);
    if (r.ok) {
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `seating_${examId}.pdf`;
      a.click();

      URL.revokeObjectURL(url);
      showToast("PDF downloaded");
      return;
    }
  } catch (err) {
    console.log("Backend not available, using frontend PDF");
  }

  // -----------------------------
  // CLIENT SIDE PDF GENERATION
  // -----------------------------

  // FIX: generate arrangement if not available
  let arrangement = generateDemoArrangementPDF(examId);

  if (!arrangement || arrangement.length === 0) {
    showToast("No seating data found. Generate seating first.", "error");
    return;
  }

  // load jsPDF if not present
  if (!window.jspdf) {
    await loadScript(
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
    );
    await loadScript(
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.6.0/jspdf.plugin.autotable.min.js",
    );
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Seating Arrangement", 14, 15);

  doc.setFontSize(11);
  doc.text(`Exam: ${exam.name}`, 14, 25);
  doc.text(`Subject: ${exam.subject}`, 14, 32);
  doc.text(`Date: ${exam.exam_date}`, 14, 39);

  let y = 50;

  const grouped = {};
  arrangement.forEach((s) => {
    if (!grouped[s.room_number]) grouped[s.room_number] = [];
    grouped[s.room_number].push(s);
  });

  Object.keys(grouped).forEach((room) => {
    const rows = grouped[room].map((s) => [
      s.seat_number,
      s.name,
      s.roll_number,
      s.department,
    ]);

    doc.setFontSize(13);
    doc.text(`Room ${room}`, 14, y);
    y += 5;

    doc.autoTable({
      startY: y,
      head: [["Seat", "Name", "Roll No", "Dept"]],
      body: rows,
    });

    y = doc.lastAutoTable.finalY + 10;
  });

  doc.save(`seating_exam_${examId}.pdf`);

  showToast("PDF generated successfully");
}
// ── ANALYTICS ────────────────────────────────────────────
async function loadAnalytics() {
  let d;
  try {
    d = await api("/api/analytics");
  } catch {}
  if (!d) {
    d = {
      dept_dist: [
        { department: "CSE", count: 4 },
        { department: "ECE", count: 2 },
        { department: "MECH", count: 2 },
        { department: "CIVIL", count: 1 },
        { department: "EEE", count: 1 },
      ],
      room_util: [
        { room_number: "101", capacity: 40, used: 32 },
        { room_number: "102", capacity: 35, used: 18 },
        { room_number: "201", capacity: 30, used: 10 },
        { room_number: "202", capacity: 45, used: 40 },
      ],
      year_dist: [
        { year: "1st", count: 2 },
        { year: "2nd", count: 4 },
        { year: "3rd", count: 3 },
        { year: "4th", count: 1 },
      ],
    };
  }
  renderAnalyticsCharts(d);
}

function destroyChart(id) {
  if (state.analyticsCharts[id]) {
    state.analyticsCharts[id].destroy();
    delete state.analyticsCharts[id];
  }
}

function renderAnalyticsCharts(d) {
  const colors = [
    "rgba(124,106,255,0.8)",
    "rgba(59,138,255,0.8)",
    "rgba(45,186,122,0.8)",
    "rgba(240,160,48,0.8)",
    "rgba(255,90,90,0.8)",
  ];
  const gridColor = "rgba(255,255,255,0.05)";
  const labelColor = "#9090b8";

  destroyChart("dept");
  const c1 = document.getElementById("analytics-dept-chart")?.getContext("2d");
  if (c1)
    state.analyticsCharts["dept"] = new Chart(c1, {
      type: "bar",
      data: {
        labels: d.dept_dist.map((x) => x.department),
        datasets: [
          {
            data: d.dept_dist.map((x) => x.count),
            backgroundColor: colors,
            borderRadius: 8,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: labelColor } },
          y: {
            grid: { color: gridColor },
            ticks: { color: labelColor, stepSize: 1 },
          },
        },
      },
    });

  destroyChart("room");
  const c2 = document.getElementById("analytics-room-chart")?.getContext("2d");
  if (c2)
    state.analyticsCharts["room"] = new Chart(c2, {
      type: "bar",
      data: {
        labels: d.room_util.map((x) => "Room " + x.room_number),
        datasets: [
          {
            label: "Used",
            data: d.room_util.map((x) => x.used),
            backgroundColor: "rgba(124,106,255,0.8)",
            borderRadius: 6,
            borderSkipped: false,
          },
          {
            label: "Capacity",
            data: d.room_util.map((x) => x.capacity),
            backgroundColor: "rgba(255,255,255,0.06)",
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: labelColor, font: { size: 11 } } },
        },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: labelColor } },
          y: { grid: { color: gridColor }, ticks: { color: labelColor } },
        },
      },
    });

  destroyChart("year");
  const c3 = document.getElementById("analytics-year-chart")?.getContext("2d");
  if (c3)
    state.analyticsCharts["year"] = new Chart(c3, {
      type: "doughnut",
      data: {
        labels: d.year_dist.map((x) => x.year + " Year"),
        datasets: [
          {
            data: d.year_dist.map((x) => x.count),
            backgroundColor: colors,
            borderWidth: 0,
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "60%",
        plugins: {
          legend: {
            position: "right",
            labels: {
              color: labelColor,
              font: { size: 11 },
              boxWidth: 10,
              borderRadius: 4,
              padding: 12,
            },
          },
        },
      },
    });
}

// ── EVENT LISTENERS ───────────────────────────────────────
document
  .getElementById("login-user")
  .addEventListener(
    "keydown",
    (e) => e.key === "Enter" && document.getElementById("login-pass").focus(),
  );
document
  .getElementById("login-pass")
  .addEventListener("keydown", (e) => e.key === "Enter" && doLogin());
