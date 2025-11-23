// LifeDashboard — Purple Theme JS
// Fully corrected & complete

// --- Utilities
const qs = s => document.querySelector(s);
const qsa = s => document.querySelectorAll(s);
function uid(prefix = 'id') { return prefix + Math.random().toString(36).slice(2, 9); }

// --- Navigation
qsa('.nav-btn').forEach(b => {
    b.addEventListener('click', () => {
        qsa('.nav-btn').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        showView(b.dataset.view);
    });
});
document.querySelectorAll('[data-view]').forEach(btn => {
    btn.addEventListener('click', () => showView(btn.dataset.view));
});
function showView(name) {
    qsa('.view').forEach(v => v.classList.remove('active'));
    const el = qs(`#${name}`);
    if (el) el.classList.add('active');
    refreshAll();
}

// --- LocalStorage DB
const DB = {
    notes: JSON.parse(localStorage.getItem('ld_notes') || '[]'),
    tasks: JSON.parse(localStorage.getItem('ld_tasks') || '[]'),
    entries: JSON.parse(localStorage.getItem('ld_entries') || '[]'),
    habits: JSON.parse(localStorage.getItem('ld_habits') || '[]'),
    goals: JSON.parse(localStorage.getItem('ld_goals') || '[]')
};
function saveDB() {
    localStorage.setItem('ld_notes', JSON.stringify(DB.notes));
    localStorage.setItem('ld_tasks', JSON.stringify(DB.tasks));
    localStorage.setItem('ld_entries', JSON.stringify(DB.entries));
    localStorage.setItem('ld_habits', JSON.stringify(DB.habits));
    localStorage.setItem('ld_goals', JSON.stringify(DB.goals));
}

// --- Notes
const noteInput = qs('#noteInput');
const noteTag = qs('#noteTag');
const addNoteBtn = qs('#addNoteBtn');
const notesList = qs('#notesList');

addNoteBtn.addEventListener('click', () => {
    const text = noteInput.value.trim();
    if (!text) return alert('Write a note');

    DB.notes.unshift({ id: uid('note_'), text, tag: noteTag.value.trim(), created: Date.now() });
    noteInput.value = ''; noteTag.value = '';
    saveDB(); renderNotes(); refreshDashboard();
});

function renderNotes() {
    notesList.innerHTML = '';
    DB.notes.forEach(n => {
        const item = document.createElement('div'); item.className = 'list-item';
        item.innerHTML = `
      <div>
        <div style="font-weight:700;color:#fff">${escapeHtml(n.text).slice(0, 120)}</div>
        <div class="meta">${n.tag ? ('Tag: ' + escapeHtml(n.tag)) : 'No tag'} • ${new Date(n.created).toLocaleString()}</div>
      </div>
      <div style="display:flex;gap:6px">
        <button class="btn small" data-id="${n.id}" data-act="edit">Edit</button>
        <button class="btn ghost small" data-id="${n.id}" data-act="del">Delete</button>
      </div>
    `;
        notesList.appendChild(item);
    });
}

notesList.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id; const act = btn.dataset.act;
    const idx = DB.notes.findIndex(x => x.id === id);
    if (act === 'del' && idx > -1) { DB.notes.splice(idx, 1); saveDB(); renderNotes(); refreshDashboard(); }
    if (act === 'edit' && idx > -1) {
        const n = DB.notes[idx];
        const newText = prompt('Edit note', n.text);
        if (newText !== null) { DB.notes[idx].text = newText; saveDB(); renderNotes(); refreshDashboard(); }
    }
});

// --- Tasks
const taskTitle = qs('#taskTitle');
const taskDate = qs('#taskDate');
const addTaskBtn = qs('#addTaskBtn');
const tasksList = qs('#tasksList');
const taskFilter = qs('#taskFilter');

addTaskBtn.addEventListener('click', () => {
    const title = taskTitle.value.trim(); if (!title) return alert('Task title required');
    let date = taskDate.value;
    if (date) { const d = new Date(date); date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
    DB.tasks.unshift({ id: uid('task_'), title, date: date || null, done: false });
    taskTitle.value = ''; taskDate.value = '';
    saveDB(); renderTasks(taskFilter.value); renderCalendar(); refreshDashboard();
});

function renderTasks(filter = 'all') {
    tasksList.innerHTML = '';
    DB.tasks.filter(t => {
        if (filter === 'pending') return !t.done;
        if (filter === 'completed') return t.done;
        return true;
    }).forEach(t => {
        const li = document.createElement('div'); li.className = 'list-item';
        li.innerHTML = `
      <div>
        <div style="font-weight:700;color:#fff">${escapeHtml(t.title)}</div>
        <div class="meta">${t.date ? ('Due: ' + t.date) : 'No date'} • ${t.done ? 'Completed' : ''}</div>
      </div>
      <div style="display:flex;gap:6px">
        <button class="btn small" data-id="${t.id}" data-act="toggle">${t.done ? 'Undo' : 'Done'}</button>
        <button class="btn ghost small" data-id="${t.id}" data-act="del">Delete</button>
      </div>
    `;
        tasksList.appendChild(li);
    });
}

tasksList.addEventListener('click', e => {
    const btn = e.target.closest('button'); if (!btn) return;
    const id = btn.dataset.id; const act = btn.dataset.act;
    const idx = DB.tasks.findIndex(x => x.id === id); if (idx === -1) return;
    if (act === 'del') { DB.tasks.splice(idx, 1); saveDB(); renderTasks(taskFilter.value); renderCalendar(); refreshDashboard(); }
    if (act === 'toggle') { DB.tasks[idx].done = !DB.tasks[idx].done; saveDB(); renderTasks(taskFilter.value); renderCalendar(); refreshDashboard(); }
});
taskFilter.addEventListener('change', () => renderTasks(taskFilter.value));

// --- Budget
const entryTitle = qs('#entryTitle');
const entryAmount = qs('#entryAmount');
const entryType = qs('#entryType');
const addEntryBtn = qs('#addEntryBtn');
const entriesList = qs('#entriesList');
const balanceEl = qs('#balance');

addEntryBtn.addEventListener('click', () => {
    const t = entryTitle.value.trim(); const a = parseFloat(entryAmount.value);
    if (!t || isNaN(a)) return alert('Provide description and amount');
    DB.entries.unshift({ id: uid('entry_'), title: t, amount: a, type: entryType.value, created: Date.now() });
    entryTitle.value = ''; entryAmount.value = '';
    saveDB(); renderEntries(); refreshDashboard();
});
qs('#clearBudget').addEventListener('click', () => {
    if (confirm('Clear all budget entries?')) { DB.entries = []; saveDB(); renderEntries(); refreshDashboard(); }
});

function renderEntries() {
    entriesList.innerHTML = '';
    DB.entries.forEach(e => {
        const li = document.createElement('div'); li.className = 'list-item';
        li.innerHTML = `
      <div>
        <div style="font-weight:700;color:#fff">${escapeHtml(e.title)}</div>
        <div class="meta">${new Date(e.created).toLocaleString()}</div>
      </div>
      <div style="text-align:right">
        <div style="font-weight:800">${e.type === 'expense' ? ('-₹' + Math.abs(e.amount)) : ('₹' + e.amount)}</div>
        <button class="btn ghost small" data-id="${e.id}" data-act="del">Del</button>
      </div>
    `;
        entriesList.appendChild(li);
    });
    const bal = DB.entries.reduce((s, x) => x.type === 'expense' ? s - x.amount : s + x.amount, 0);
    balanceEl.textContent = `₹${bal.toFixed(2)}`;
}

entriesList.addEventListener('click', e => {
    const btn = e.target.closest('button'); if (!btn) return;
    const id = btn.dataset.id; const act = btn.dataset.act;
    if (act === 'del') { const idx = DB.entries.findIndex(x => x.id === id); if (idx > -1) { DB.entries.splice(idx, 1); saveDB(); renderEntries(); refreshDashboard(); } }
});

// --- Habits
const habitTitle = qs('#habitTitle');
const addHabitBtn = qs('#addHabitBtn');
const habitsList = qs('#habitsList');

addHabitBtn.addEventListener('click', () => {
    const t = habitTitle.value.trim(); if (!t) return alert('Enter habit');
    DB.habits.unshift({ id: uid('habit_'), title: t, streak: 0, lastChecked: null });
    habitTitle.value = ''; saveDB(); renderHabits(); refreshDashboard();
});

function renderHabits() {
    habitsList.innerHTML = '';
    DB.habits.forEach(h => {
        const li = document.createElement('div'); li.className = 'list-item';
        const checkedToday = isSameDate(h.lastChecked, new Date());
        li.innerHTML = `
      <div>
        <div style="font-weight:700;color:#fff">${escapeHtml(h.title)}</div>
        <div class="meta">Streak: ${h.streak} • Last: ${h.lastChecked ? new Date(h.lastChecked).toLocaleDateString() : 'never'}</div>
      </div>
      <div style="display:flex;gap:6px;flex-direction:column">
        <button class="btn small" data-id="${h.id}" data-act="${checkedToday ? 'undo' : 'check'}">${checkedToday ? 'Undo' : 'Check'}</button>
        <button class="btn ghost small" data-id="${h.id}" data-act="del">Del</button>
      </div>
    `;
        habitsList.appendChild(li);
    });
}

habitsList.addEventListener('click', e => {
    const btn = e.target.closest('button'); if (!btn) return;
    const id = btn.dataset.id; const act = btn.dataset.act;
    const idx = DB.habits.findIndex(x => x.id === id); if (idx === -1) return;
    const h = DB.habits[idx];
    if (act === 'del') { DB.habits.splice(idx, 1); saveDB(); renderHabits(); refreshDashboard(); }
    if (act === 'check' && !isSameDate(h.lastChecked, new Date())) {
        DB.habits[idx].streak = (h.lastChecked && isYesterday(h.lastChecked)) ? h.streak + 1 : 1;
        DB.habits[idx].lastChecked = new Date().toISOString(); saveDB(); renderHabits(); refreshDashboard();
    }
    if (act === 'undo') { DB.habits[idx].streak = Math.max(0, h.streak - 1); DB.habits[idx].lastChecked = null; saveDB(); renderHabits(); refreshDashboard(); }
});

// --- Goals
const goalTitle = qs('#goalTitle');
const goalTarget = qs('#goalTarget');
const addGoalBtn = qs('#addGoalBtn');
const goalsList = qs('#goalsList');

addGoalBtn.addEventListener('click', () => {
    const t = goalTitle.value.trim(); const target = parseInt(goalTarget.value) || 0;
    if (!t) return alert('Enter goal');
    DB.goals.unshift({ id: uid('goal_'), title: t, target, progress: 0 });
    goalTitle.value = ''; goalTarget.value = ''; saveDB(); renderGoals(); refreshDashboard();
});

function renderGoals() {
    goalsList.innerHTML = '';
    DB.goals.forEach(g => {
        const li = document.createElement('div'); li.className = 'list-item';
        li.innerHTML = `
      <div style="flex:1">
        <div style="font-weight:700;color:#fff">${escapeHtml(g.title)}</div>
        <div class="meta">Progress: ${g.progress}/${g.target || '∞'}</div>
        <div style="height:8px;background:rgba(255,255,255,0.05);border-radius:6px;margin-top:8px;overflow:hidden">
          <div style="height:100%;width:${g.target ? (g.progress / g.target * 100) : 0}%;background:linear-gradient(90deg,var(--accent),#7e4bff)"></div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px">
        <button class="btn small" data-id="${g.id}" data-act="inc">+1</button>
        <button class="btn ghost small" data-id="${g.id}" data-act="del">Del</button>
      </div>
    `;
        goalsList.appendChild(li);
    });
}

goalsList.addEventListener('click', e => {
    const btn = e.target.closest('button'); if (!btn) return;
    const id = btn.dataset.id; const act = btn.dataset.act; const idx = DB.goals.findIndex(x => x.id === id); if (idx === -1) return;
    if (act === 'del') { DB.goals.splice(idx, 1); saveDB(); renderGoals(); refreshDashboard(); }
    if (act === 'inc') { DB.goals[idx].progress = (DB.goals[idx].progress || 0) + 1; saveDB(); renderGoals(); refreshDashboard(); }
});

// --- Calendar
let current = new Date();
const calMonth = qs('#calMonth');
const calendarGrid = qs('#calendarGrid');
qs('#prevMonth').addEventListener('click', () => { current.setMonth(current.getMonth() - 1); renderCalendar(); });
qs('#nextMonth').addEventListener('click', () => { current.setMonth(current.getMonth() + 1); renderCalendar(); });

function renderCalendar() {
    calendarGrid.innerHTML = '';
    const year = current.getFullYear(), month = current.getMonth();
    calMonth.textContent = current.toLocaleString('default', { month: 'long', year: 'numeric' });
    const first = new Date(year, month, 1);
    const startDay = first.getDay();
    const days = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < startDay; i++) { const d = document.createElement('div'); d.className = 'cal-day'; d.style.opacity = 0.3; calendarGrid.appendChild(d); }
    // --- Calendar (inside renderCalendar loop for each day)
    for (let day = 1; day <= days; day++) {
        const d = document.createElement('div'); d.className = 'cal-day';
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        d.innerHTML = `<div class="date">${day}</div><div class="events"></div>`;

        // 1️⃣ Highlight today
        const today = new Date();
        if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            d.style.border = '2px solid #FFD700'; // gold border for today
            d.style.borderRadius = '6px';
        }

        // show tasks for this date
        const tasks = DB.tasks.filter(t => t.date === dateStr);
        const ev = d.querySelector('.events');

        // 1️⃣ Mark overdue tasks
        tasks.forEach(t => {
            const el = document.createElement('div');
            el.className = t.done ? 'badge' : (new Date(t.date) < today ? 'badge overdue' : 'badge');
            el.textContent = t.title.slice(0, 18);
            ev.appendChild(el);
        });

        calendarGrid.appendChild(d);
    }
}

// --- Helpers
function escapeHtml(s) { return String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;'); }
function isSameDate(a, b) { if (!a || !b) return false; const d1 = new Date(a), d2 = new Date(b); return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate(); }
function isYesterday(iso) { if (!iso) return false; const d = new Date(iso); const y = new Date(); y.setDate(y.getDate() - 1); return d.getFullYear() === y.getFullYear() && d.getMonth() === y.getMonth() && d.getDate() === y.getDate(); }

// --- Dashboard refresh
function refreshDashboard() {
    qs('#dashboardNotes').innerHTML = DB.notes.slice(0, 3).map(n => `<div class="item">${escapeHtml(n.text).slice(0, 40)}</div>`).join('') || '<div class="item">No notes</div>';
    qs('#dashboardTasks').innerHTML = DB.tasks.filter(t => !t.done).slice(0, 4).map(t => `<div class="item">${escapeHtml(t.title)}</div>`).join('') || '<div class="item">No pending tasks</div>';
    qs('#dashboardBalance').textContent = '₹' + DB.entries.reduce((s, x) => x.type === 'expense' ? s - x.amount : s + x.amount, 0).toFixed(2);
    qs('#dashboardHabits').innerHTML = DB.habits.slice(0, 3).map(h => `<div class="item">${escapeHtml(h.title)} • ${h.streak}</div>`).join('') || '<div class="item">No habits</div>';
}

// --- General refresh
function refreshAll() { renderNotes(); renderTasks(taskFilter.value); renderEntries(); renderHabits(); renderGoals(); renderCalendar(); refreshDashboard(); }

// --- Init
refreshAll();