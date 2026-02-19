// ==================== index.js - COMPLETE, CLEAN & 100% MATCHING (Navbar Fully Working) ====================

let dbInstance = null;
let currentTopics = [];
let currentEditingTopic = null;
let currentTabIndex = 0;
let currentView = 'dashboard';

const DB_NAME = "DeepBeforeDoDB";
const STORE_NAME = "topics";

const masteryLevels = [
    { val: "Unknown", label: "❌ Unknown", color: "slate" },
    { val: "Surface Level", label: "⚠️ Surface Level", color: "yellow" },
    { val: "Practicing", label: "🟡 Practicing", color: "amber" },
    { val: "Comfortable", label: "🟢 Comfortable", color: "emerald" },
    { val: "Strong", label: "🔵 Strong", color: "sky" },
    { val: "Mastered", label: "🟣 Mastered", color: "violet" }
];

// ====================== DATABASE ======================
async function initDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = e => {
            dbInstance = e.target.result;
            if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
                dbInstance.createObjectStore(STORE_NAME, { keyPath: "id" });
            }
        };
        req.onsuccess = e => { dbInstance = e.target.result; resolve(); };
        req.onerror = e => reject(e.target.error);
    });
}

async function getAllTopics() {
    return new Promise(resolve => {
        const tx = dbInstance.transaction(STORE_NAME, "readonly");
        const req = tx.objectStore(STORE_NAME).getAll();
        req.onsuccess = () => resolve(req.result || []);
    });
}

async function saveTopicToDB(topic) {
    return new Promise(resolve => {
        const tx = dbInstance.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).put(topic);
        tx.oncomplete = () => resolve();
    });
}

async function deleteTopicFromDB(id) {
    return new Promise(resolve => {
        const tx = dbInstance.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).delete(id);
        tx.oncomplete = () => resolve();
    });
}

// ====================== NAVIGATION ======================
function switchView(view) {
    if (view === 'new') {
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('nav-active'));
        const newNav = document.getElementById('nav-new');
        if (newNav) newNav.classList.add('nav-active');
        showNewTopicModal();
        return;
    }

    currentView = view;
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('nav-active'));
    const activeNav = document.getElementById(`nav-${view}`);
    if (activeNav) activeNav.classList.add('nav-active');

    const content = document.getElementById('content');
    content.innerHTML = '';

    if (view === 'dashboard') renderDashboard(content);
    else if (view === 'topics') renderAllTopics(content);
    else if (view === 'focus') renderFocusMode(content);
    else if (view === 'analytics') renderAnalytics(content);
}

// ====================== INIT ======================
async function initApp() {
    await initDB();
    currentTopics = await getAllTopics();
    switchView('dashboard');
}

// ====================== RENDER FUNCTIONS ======================
function renderDashboard(container) {
    const started = currentTopics.length;
    const completed = currentTopics.filter(t => t.mastery && t.mastery.level !== "Unknown").length;
    const mastered = currentTopics.filter(t => t.mastery && t.mastery.level === "Mastered").length;

    container.innerHTML = `
        <div class="max-w-7xl mx-auto">
            <h1 class="text-4xl font-semibold mb-2">Welcome back, deep learner.</h1>
            <p class="text-slate-500 mb-10">Your cognitive integrity dashboard</p>
            <div class="grid grid-cols-4 gap-6">
                <div class="bg-white rounded-3xl p-8 shadow-sm">
                    <div class="text-sky-500 text-sm font-medium tracking-widest">STARTED</div>
                    <div class="text-7xl font-bold mt-4">${started}</div>
                </div>
                <div class="bg-white rounded-3xl p-8 shadow-sm">
                    <div class="text-emerald-500 text-sm font-medium tracking-widest">COMPLETED</div>
                    <div class="text-7xl font-bold mt-4">${completed}</div>
                </div>
                <div class="bg-white rounded-3xl p-8 shadow-sm">
                    <div class="text-violet-500 text-sm font-medium tracking-widest">MASTERED</div>
                    <div class="text-7xl font-bold mt-4">${mastered}</div>
                </div>
                <div class="bg-white rounded-3xl p-8 shadow-sm">
                    <div class="text-amber-500 text-sm font-medium tracking-widest">AVG CONFIDENCE</div>
                    <div class="text-7xl font-bold mt-4">${currentTopics.length ? Math.round(currentTopics.reduce((a,t) => a + (t.proof?.confidence || 3), 0) / currentTopics.length) : 0}</div>
                </div>
            </div>
            <div class="mt-12">
                <div class="flex justify-between items-end mb-6">
                    <h2 class="text-2xl font-semibold">Recent Activity</h2>
                    <button onclick="switchView('topics')" class="text-sky-600 text-sm font-medium">View all →</button>
                </div>
                <div class="bg-white rounded-3xl overflow-hidden shadow-sm">
                    <table class="w-full">
                        <thead><tr class="border-b">
                            <th class="py-5 px-8 text-left text-slate-500">TOPIC</th>
                            <th class="py-5 px-8 text-left text-slate-500">DISCIPLINE</th>
                            <th class="py-5 px-8 text-left text-slate-500">MASTERY</th>
                            <th class="w-20"></th>
                        </tr></thead>
                        <tbody id="recent-table"></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    const tbody = document.getElementById('recent-table');
    currentTopics.slice(0, 5).forEach(t => {
        const tr = document.createElement('tr');
        tr.className = 'border-b hover:bg-sky-50 cursor-pointer';
        tr.innerHTML = `
            <td onclick="openTopicDetail(\( {t.id})" class="py-6 px-8 font-medium"> \){t.title}</td>
            <td onclick="openTopicDetail(\( {t.id})" class="py-6 px-8 text-slate-500"> \){t.discipline}</td>
            <td onclick="openTopicDetail(${t.id})" class="py-6 px-8">
                <span class="mastery-badge bg-\( {getMasteryColor(t.mastery?.level || "Unknown")}-100 text- \){getMasteryColor(t.mastery?.level || "Unknown")}-700">
                    ${getMasteryEmoji(t.mastery?.level || "Unknown")} ${t.mastery?.level || "Unknown"}
                </span>
            </td>
            <td class="pr-8">
                <button onclick="event.stopImmediatePropagation();deleteTopic(${t.id});" class="text-red-400 hover:text-red-600">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderAllTopics(container) {
    container.innerHTML = `
        <div class="max-w-7xl mx-auto">
            <div class="flex justify-between items-center mb-8">
                <h1 class="text-4xl font-semibold">All Topics</h1>
                <div class="text-sm text-slate-400">${currentTopics.length} total</div>
            </div>
            <div class="bg-white rounded-3xl shadow-sm overflow-hidden">
                <table class="w-full">
                    <thead>
                        <tr class="border-b bg-slate-50">
                            <th class="py-5 px-8 text-left font-medium text-slate-500">TOPIC</th>
                            <th class="py-5 px-8 text-left font-medium text-slate-500">DISCIPLINE</th>
                            <th class="py-5 px-8 text-left font-medium text-slate-500">MASTERY LEVEL</th>
                            <th class="w-12"></th>
                        </tr>
                    </thead>
                    <tbody id="topics-tbody" class="divide-y"></tbody>
                </table>
            </div>
        </div>
    `;
    renderTopicsTable();
}

function renderTopicsTable(filtered = null) {
    const tbody = document.getElementById('topics-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    (filtered || currentTopics).forEach(t => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-sky-50 cursor-pointer group";
        tr.innerHTML = `
            <td onclick="openTopicDetail(\( {t.id})" class="px-8 py-7 font-medium group-hover:text-sky-600"> \){t.title}</td>
            <td onclick="openTopicDetail(\( {t.id})" class="px-8 py-7 text-slate-500"> \){t.discipline}</td>
            <td onclick="openTopicDetail(${t.id})" class="px-8 py-7">
                <span class="mastery-badge bg-\( {getMasteryColor(t.mastery?.level || "Unknown")}-100 text- \){getMasteryColor(t.mastery?.level || "Unknown")}-700">
                    ${getMasteryEmoji(t.mastery?.level || "Unknown")} ${t.mastery?.level || "Unknown"}
                </span>
            </td>
            <td class="pr-6">
                <button onclick="event.stopImmediatePropagation();deleteTopic(${t.id});" class="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function filterTopics() {
    const term = document.getElementById('search-input').value.toLowerCase().trim();
    if (!term) {
        if (currentView === 'topics') renderTopicsTable();
        return;
    }
    const filtered = currentTopics.filter(t => 
        t.title.toLowerCase().includes(term) || t.discipline.toLowerCase().includes(term)
    );
    if (currentView === 'topics') renderTopicsTable(filtered);
}

function getMasteryColor(l) {
    const m = masteryLevels.find(x => x.val === l);
    return m ? m.color : 'slate';
}

function getMasteryEmoji(l) {
    const m = masteryLevels.find(x => x.val === l);
    return m ? m.label.split(' ')[0] : '❌';
}

// ====================== MODALS & CRUD ======================
function showNewTopicModal() {
    document.getElementById('new-topic-modal').classList.remove('hidden');
    document.getElementById('new-title').focus();
}

function closeNewModal() {
    document.getElementById('new-topic-modal').classList.add('hidden');
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('nav-active'));
    const activeNav = document.getElementById(`nav-${currentView}`);
    if (activeNav) activeNav.classList.add('nav-active');
}

async function createNewTopic() {
    const discipline = document.getElementById('new-discipline').value;
    let title = document.getElementById('new-title').value.trim();
    if (!title) title = "Untitled Topic " + Date.now().toString().slice(-4);

    const newTopic = {
        id: Date.now(),
        title,
        discipline,
        createdAt: new Date().toISOString(),
        intent: { why: "", problem: "", applied: "", notUse: "", prior: "", related: "", predict: "" },
        active: { explanation: "", terms: "", principles: "", exceptions: "", comparison: "", examples: "", mistakes: "" },
        proof: { shortExplain: "", task: "", failures: "", teach: "", confidence: 3 },
        mastery: { level: "Unknown", checklist: { define: false, apply: false, solve: false, debug: false, explain: false, notUse: false } }
    };

    await saveTopicToDB(newTopic);
    currentTopics = await getAllTopics();
    closeNewModal();
    switchView('topics');
    setTimeout(() => openTopicDetail(newTopic.id), 300);
}

async function deleteTopic(id) {
    if (!confirm("Delete permanently?")) return;
    await deleteTopicFromDB(id);
    currentTopics = await getAllTopics();
    switchView(currentView);
}

function openTopicDetail(id) {
    currentEditingTopic = currentTopics.find(t => t.id === id);
    if (!currentEditingTopic) return;

    ['intent', 'active', 'proof', 'mastery'].forEach(k => {
        if (!currentEditingTopic[k]) {
            currentEditingTopic[k] = k === 'mastery' 
                ? { level: "Unknown", checklist: { define: false, apply: false, solve: false, debug: false, explain: false, notUse: false } }
                : {};
        }
    });

    document.getElementById('topic-modal').classList.remove('hidden');
    document.getElementById('modal-title').textContent = currentEditingTopic.title;
    document.getElementById('modal-discipline').textContent = currentEditingTopic.discipline;
    document.getElementById('modal-emoji').textContent = 
        currentEditingTopic.discipline === "Coding" ? "💻" : 
        currentEditingTopic.discipline === "Mathematics" ? "🧮" : 
        currentEditingTopic.discipline === "English" ? "📖" : "📚";

    currentTabIndex = 0;
    renderCurrentTabContent();
}

function closeModal() {
    document.getElementById('topic-modal').classList.add('hidden');
    currentEditingTopic = null;
}

function switchTab(tab) {
    saveCurrentTabData();
    currentTabIndex = tab;
    document.querySelectorAll('.tab-btn').forEach((btn, i) => {
        i === tab ? btn.classList.add('tab-active') : btn.classList.remove('tab-active');
    });
    renderCurrentTabContent();
}

function renderCurrentTabContent() {
    const container = document.getElementById('tab-content');
    let html = '';

    if (currentTabIndex === 0) {
        html = `<div class="grid grid-cols-2 gap-8">
            <div><label class="block text-xs font-medium text-slate-500 mb-2 tracking-widest">WHY AM I LEARNING THIS?</label><textarea id="i-why" class="w-full h-28 border border-slate-200 focus:border-sky-400 rounded-3xl p-6 text-sm">${currentEditingTopic.intent.why || ''}</textarea></div>
            <div><label class="block text-xs font-medium text-slate-500 mb-2 tracking-widest">REAL-WORLD PROBLEM</label><textarea id="i-problem" class="w-full h-28 border border-slate-200 focus:border-sky-400 rounded-3xl p-6 text-sm">${currentEditingTopic.intent.problem || ''}</textarea></div>
            <div><label class="block text-xs font-medium text-slate-500 mb-2 tracking-widest">WHERE APPLIED?</label><textarea id="i-applied" class="w-full h-28 border border-slate-200 focus:border-sky-400 rounded-3xl p-6 text-sm">${currentEditingTopic.intent.applied || ''}</textarea></div>
            <div><label class="block text-xs font-medium text-slate-500 mb-2 tracking-widest">WHEN NOT TO USE?</label><textarea id="i-notuse" class="w-full h-28 border border-slate-200 focus:border-sky-400 rounded-3xl p-6 text-sm">${currentEditingTopic.intent.notUse || ''}</textarea></div>
            <div><label class="block text-xs font-medium text-slate-500 mb-2 tracking-widest">WHAT I KNOW</label><textarea id="i-prior" class="w-full h-28 border border-slate-200 focus:border-sky-400 rounded-3xl p-6 text-sm">${currentEditingTopic.intent.prior || ''}</textarea></div>
            <div><label class="block text-xs font-medium text-slate-500 mb-2 tracking-widest">RELATED CONCEPTS</label><textarea id="i-related" class="w-full h-28 border border-slate-200 focus:border-sky-400 rounded-3xl p-6 text-sm">${currentEditingTopic.intent.related || ''}</textarea></div>
            <div class="col-span-2"><label class="block text-xs font-medium text-slate-500 mb-2 tracking-widest">WHAT WILL BE DIFFICULT?</label><textarea id="i-predict" class="w-full h-28 border border-slate-200 focus:border-sky-400 rounded-3xl p-6 text-sm">${currentEditingTopic.intent.predict || ''}</textarea></div>
        </div>`;
    } else if (currentTabIndex === 1) {
        html = `<div class="grid grid-cols-2 gap-8">
            <div class="col-span-2"><label class="block text-xs font-medium text-slate-500 mb-2 tracking-widest">EXPLANATION IN OWN WORDS</label><textarea id="a-explain" class="w-full h-40 border border-slate-200 focus:border-sky-400 rounded-3xl p-6 text-sm">${currentEditingTopic.active.explanation || ''}</textarea></div>
            <div><label class="block text-xs font-medium text-slate-500 mb-2 tracking-widest">KEY TERMS</label><textarea id="a-terms" class="w-full h-40 border border-slate-200 focus:border-sky-400 rounded-3xl p-6 text-sm">${currentEditingTopic.active.terms || ''}</textarea></div>
            <div><label class="block text-xs font-medium text-slate-500 mb-2 tracking-widest">PRINCIPLES</label><textarea id="a-principles" class="w-full h-40 border border-slate-200 focus:border-sky-400 rounded-3xl p-6 text-sm">${currentEditingTopic.active.principles || ''}</textarea></div>
            <div><label class="block text-xs font-medium text-slate-500 mb-2 tracking-widest">EXCEPTIONS</label><textarea id="a-exceptions" class="w-full h-40 border border-slate-200 focus:border-sky-400 rounded-3xl p-6 text-sm">${currentEditingTopic.active.exceptions || ''}</textarea></div>
            <div><label class="block text-xs font-medium text-slate-500 mb-2 tracking-widest">COMPARISON</label><textarea id="a-comparison" class="w-full h-40 border border-slate-200 focus:border-sky-400 rounded-3xl p-6 text-sm">${currentEditingTopic.active.comparison || ''}</textarea></div>
            <div><label class="block text-xs font-medium text-slate-500 mb-2 tracking-widest">EXAMPLES</label><textarea id="a-examples" class="w-full h-40 border border-slate-200 focus:border-sky-400 rounded-3xl p-6 text-sm">${currentEditingTopic.active.examples || ''}</textarea></div>
            <div class="col-span-2"><label class="block text-xs font-medium text-slate-500 mb-2 tracking-widest">MISTAKES TO AVOID</label><textarea id="a-mistakes" class="w-full h-40 border border-slate-200 focus:border-sky-400 rounded-3xl p-6 text-sm">${currentEditingTopic.active.mistakes || ''}</textarea></div>
        </div>`;
    } else if (currentTabIndex === 2) {
        html = `<div class="space-y-8 max-w-3xl mx-auto">
            <div><label class="block text-xs font-medium text-slate-500 mb-2 tracking-widest">EXPLAIN IN 3-5 LINES</label><textarea id="p-short" class="w-full h-32 border border-slate-200 focus:border-sky-400 rounded-3xl p-6 text-sm">${currentEditingTopic.proof.shortExplain || ''}</textarea></div>
            <div><label class="block text-xs font-medium text-slate-500 mb-2 tracking-widest">TASK COMPLETED</label><textarea id="p-task" class="w-full h-32 border border-slate-200 focus:border-sky-400 rounded-3xl p-6 text-sm">${currentEditingTopic.proof.task || ''}</textarea></div>
            <div><label class="block text-xs font-medium text-slate-500 mb-2 tracking-widest">FAILURE SCENARIOS</label><textarea id="p-fail" class="w-full h-32 border border-slate-200 focus:border-sky-400 rounded-3xl p-6 text-sm">${currentEditingTopic.proof.failures || ''}</textarea></div>
            <div><label class="block text-xs font-medium text-slate-500 mb-2 tracking-widest">TEACH A BEGINNER</label><textarea id="p-teach" class="w-full h-32 border border-slate-200 focus:border-sky-400 rounded-3xl p-6 text-sm">${currentEditingTopic.proof.teach || ''}</textarea></div>
            <div class="flex items-center gap-4">
                <label class="text-xs font-medium text-slate-500 tracking-widest">CONFIDENCE (1-5)</label>
                <select id="p-confidence" class="border border-slate-200 focus:border-sky-400 rounded-3xl px-6 py-3 text-lg">
                    \( {[1,2,3,4,5].map(n => `<option value=" \){n}" \( {currentEditingTopic.proof.confidence == n ? 'selected' : ''}> \){n}</option>`).join('')}
                </select>
            </div>
        </div>`;
    } else if (currentTabIndex === 3) {
        html = `<div class="max-w-lg mx-auto">
            <div class="mb-8">
                <label class="block text-xs font-medium text-slate-500 mb-3 tracking-widest">MASTERY LEVEL</label>
                <select id="m-level" class="w-full border border-slate-200 focus:border-sky-400 rounded-3xl p-6 text-2xl">
                    \( {masteryLevels.map(m => `<option value=" \){m.val}" \( {currentEditingTopic.mastery.level === m.val ? 'selected' : ''}> \){m.label}</option>`).join('')}
                </select>
            </div>
            <div class="space-y-5">
                <label class="flex items-center gap-4"><input type="checkbox" id="c-define" ${currentEditingTopic.mastery.checklist.define ? 'checked' : ''} class="w-5 h-5 accent-sky-600"> I can define it clearly</label>
                <label class="flex items-center gap-4"><input type="checkbox" id="c-apply" ${currentEditingTopic.mastery.checklist.apply ? 'checked' : ''} class="w-5 h-5 accent-sky-600"> I can apply independently</label>
                <label class="flex items-center gap-4"><input type="checkbox" id="c-solve" ${currentEditingTopic.mastery.checklist.solve ? 'checked' : ''} class="w-5 h-5 accent-sky-600"> I can solve problems</label>
                <label class="flex items-center gap-4"><input type="checkbox" id="c-debug" ${currentEditingTopic.mastery.checklist.debug ? 'checked' : ''} class="w-5 h-5 accent-sky-600"> I can debug</label>
                <label class="flex items-center gap-4"><input type="checkbox" id="c-explain" ${currentEditingTopic.mastery.checklist.explain ? 'checked' : ''} class="w-5 h-5 accent-sky-600"> I can explain without notes</label>
                <label class="flex items-center gap-4"><input type="checkbox" id="c-notuse" ${currentEditingTopic.mastery.checklist.notUse ? 'checked' : ''} class="w-5 h-5 accent-sky-600"> I know when not to use it</label>
            </div>
        </div>`;
    }
    container.innerHTML = html;
}

function saveCurrentTabData() {
    if (!currentEditingTopic) return;
    if (currentTabIndex === 0) {
        currentEditingTopic.intent.why = document.getElementById('i-why')?.value || '';
        currentEditingTopic.intent.problem = document.getElementById('i-problem')?.value || '';
        currentEditingTopic.intent.applied = document.getElementById('i-applied')?.value || '';
        currentEditingTopic.intent.notUse = document.getElementById('i-notuse')?.value || '';
        currentEditingTopic.intent.prior = document.getElementById('i-prior')?.value || '';
        currentEditingTopic.intent.related = document.getElementById('i-related')?.value || '';
        currentEditingTopic.intent.predict = document.getElementById('i-predict')?.value || '';
    } else if (currentTabIndex === 1) {
        currentEditingTopic.active.explanation = document.getElementById('a-explain')?.value || '';
        currentEditingTopic.active.terms = document.getElementById('a-terms')?.value || '';
        currentEditingTopic.active.principles = document.getElementById('a-principles')?.value || '';
        currentEditingTopic.active.exceptions = document.getElementById('a-exceptions')?.value || '';
        currentEditingTopic.active.comparison = document.getElementById('a-comparison')?.value || '';
        currentEditingTopic.active.examples = document.getElementById('a-examples')?.value || '';
        currentEditingTopic.active.mistakes = document.getElementById('a-mistakes')?.value || '';
    } else if (currentTabIndex === 2) {
        currentEditingTopic.proof.shortExplain = document.getElementById('p-short')?.value || '';
        currentEditingTopic.proof.task = document.getElementById('p-task')?.value || '';
        currentEditingTopic.proof.failures = document.getElementById('p-fail')?.value || '';
        currentEditingTopic.proof.teach = document.getElementById('p-teach')?.value || '';
        currentEditingTopic.proof.confidence = parseInt(document.getElementById('p-confidence')?.value) || 3;
    } else if (currentTabIndex === 3) {
        currentEditingTopic.mastery.level = document.getElementById('m-level')?.value || 'Unknown';
        currentEditingTopic.mastery.checklist = {
            define: document.getElementById('c-define')?.checked || false,
            apply: document.getElementById('c-apply')?.checked || false,
            solve: document.getElementById('c-solve')?.checked || false,
            debug: document.getElementById('c-debug')?.checked || false,
            explain: document.getElementById('c-explain')?.checked || false,
            notUse: document.getElementById('c-notuse')?.checked || false
        };
    }
}

async function saveTopic() {
    if (!currentEditingTopic) return;
    saveCurrentTabData();
    await saveTopicToDB(currentEditingTopic);
    currentTopics = await getAllTopics();
    closeModal();
    switchView(currentView);
}

async function deleteCurrentTopic() {
    if (!currentEditingTopic || !confirm("Delete this topic?")) return;
    await deleteTopicFromDB(currentEditingTopic.id);
    currentTopics = await getAllTopics();
    closeModal();
    switchView(currentView);
}

// ====================== FOCUS MODE ======================
function renderFocusMode(container) {
    container.innerHTML = `
        <div class="max-w-md mx-auto mt-20 text-center">
            <div class="text-8xl mb-8">⏳</div>
            <h2 class="text-4xl font-semibold mb-2">Deep Work Session</h2>
            <p class="text-slate-500 mb-12">25-minute focused block</p>
            <div id="timer-display" class="text-[180px] font-bold tabular-nums text-slate-800 mb-12">25:00</div>
            <div class="flex justify-center gap-4">
                <select id="focus-topic-select" class="bg-white border border-slate-200 rounded-3xl px-6 py-4 text-base">
                    \( {currentTopics.length ? currentTopics.map(t => `<option value=" \){t.id}">${t.title}</option>`).join('') : '<option value="">No topics yet</option>'}
                </select>
                <button onclick="startFocusTimer()" class="bg-sky-600 hover:bg-sky-700 text-white px-12 rounded-3xl font-semibold">START</button>
            </div>
        </div>
    `;
}

let timerInterval = null, timeLeft = 25 * 60;

function startFocusTimer() {
    if (!document.getElementById('focus-topic-select').value) return alert("Select a topic");
    timeLeft = 25 * 60;
    updateTimerDisplay();
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert("🎉 Session complete!");
        }
    }, 1000);
}

function updateTimerDisplay() {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    document.getElementById('timer-display').textContent = `\( {m}: \){s < 10 ? '0' : ''}${s}`;
}

// ====================== ANALYTICS ======================
function renderAnalytics(container) {
    const byDisc = {};
    currentTopics.forEach(t => byDisc[t.discipline] = (byDisc[t.discipline] || 0) + 1);

    container.innerHTML = `
        <div class="max-w-5xl mx-auto">
            <h1 class="text-4xl font-semibold mb-12">Analytics</h1>
            <div class="grid grid-cols-2 gap-8">
                <div class="bg-white rounded-3xl p-8">
                    <h3 class="font-medium mb-6">By Discipline</h3>
                    <div class="space-y-6">
                        ${Object.keys(byDisc).map(d => `
                            <div>
                                <div class="flex justify-between mb-2"><span>\( {d}</span><span> \){byDisc[d]}</span></div>
                                <div class="h-2 bg-slate-100 rounded-full">
                                    <div class="h-2 bg-sky-500 rounded-full" style="width: ${Math.max(10, byDisc[d] / currentTopics.length * 100)}%"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="bg-white rounded-3xl p-8">
                    <h3 class="font-medium mb-6">Mastery Distribution</h3>
                    <div class="flex flex-wrap gap-3">
                        ${masteryLevels.map(m => {
                            const c = currentTopics.filter(t => t.mastery?.level === m.val).length;
                            return `<div class="px-6 py-3 bg-\( {m.color}-100 text- \){m.color}-700 rounded-3xl text-sm font-medium flex-1 text-center">\( {m.label}<br><span class="text-3xl"> \){c}</span></div>`;
                        }).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ====================== GLOBAL EXPOSE ======================
window.switchView = switchView;
window.filterTopics = filterTopics;
window.openTopicDetail = openTopicDetail;
window.switchTab = switchTab;
window.saveTopic = saveTopic;
window.deleteTopic = deleteTopic;
window.deleteCurrentTopic = deleteCurrentTopic;
window.showNewTopicModal = showNewTopicModal;
window.closeNewModal = closeNewModal;
window.createNewTopic = createNewTopic;
window.closeModal = closeModal;
window.startFocusTimer = startFocusTimer;
window.initApp = initApp;

// Auto start (HTML also has onload as backup)
window.onload = initApp;