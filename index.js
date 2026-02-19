// ==================== index.js ====================

let dbInstance = null;
let currentTopics = [];
let currentEditingTopic = null;
let currentTabIndex = 0;
let currentView = 'dashboard';
let timerInterval = null;
let timeLeft = 25 * 60;

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

async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (event) => {
            dbInstance = event.target.result;
            if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
                dbInstance.createObjectStore(STORE_NAME, { keyPath: "id" });
            }
        };
        request.onsuccess = (event) => {
            dbInstance = event.target.result;
            resolve();
        };
        request.onerror = (event) => reject(event.target.error);
    });
}

async function getAllTopics() {
    return new Promise((resolve, reject) => {
        const tx = dbInstance.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
    });
}

async function saveTopicToDB(topic) {
    return new Promise((resolve, reject) => {
        const tx = dbInstance.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(topic);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

async function deleteTopicFromDB(id) {
    return new Promise((resolve, reject) => {
        const tx = dbInstance.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

function initApp() {
    initDB().then(async () => {
        currentTopics = await getAllTopics();
        renderView();
    }).catch(console.error);
}

function switchView(view) {
    currentView = view;
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('nav-active'));
    const activeNav = document.getElementById(`nav-${view}`);
    if (activeNav) activeNav.classList.add('nav-active');
    renderView();
}

function renderView() {
    const contentEl = document.getElementById('content');
    contentEl.innerHTML = '';

    if (currentView === 'dashboard') renderDashboard(contentEl);
    else if (currentView === 'topics') renderAllTopics(contentEl);
    else if (currentView === 'new') showNewTopicModal();
    else if (currentView === 'focus') renderFocusMode(contentEl);
    else if (currentView === 'analytics') renderAnalytics(contentEl);
}

function renderDashboard(container) {
    const started = currentTopics.length;
    const completed = currentTopics.filter(t => t.mastery && t.mastery.level !== "Unknown").length;
    const mastered = currentTopics.filter(t => t.mastery && t.mastery.level === "Mastered").length;

    let html = `
        <div class="max-w-7xl mx-auto">
            <h1 class="text-4xl font-semibold mb-2">Welcome back, deep learner.</h1>
            <p class="text-slate-500 mb-10">Your cognitive integrity dashboard</p>

            <div class="grid grid-cols-4 gap-6">
                <div class="bg-white rounded-3xl p-8 shadow-sm">
                    <div class="text-sky-500 text-sm font-medium tracking-widest">TOPICS STARTED</div>
                    <div class="text-7xl font-bold mt-4">${started}</div>
                </div>
                <div class="bg-white rounded-3xl p-8 shadow-sm">
                    <div class="text-emerald-500 text-sm font-medium tracking-widest">IN PROGRESS</div>
                    <div class="text-7xl font-bold mt-4">${completed}</div>
                </div>
                <div class="bg-white rounded-3xl p-8 shadow-sm">
                    <div class="text-violet-500 text-sm font-medium tracking-widest">MASTERED</div>
                    <div class="text-7xl font-bold mt-4">${mastered}</div>
                </div>
                <div class="bg-white rounded-3xl p-8 shadow-sm">
                    <div class="text-amber-500 text-sm font-medium tracking-widest">AVG CONFIDENCE</div>
                    <div class="text-7xl font-bold mt-4">${currentTopics.length ? 
                        Math.round(currentTopics.reduce((a,t) => a + (t.proof ? t.proof.confidence : 3), 0) / currentTopics.length) : 0}</div>
                </div>
            </div>

            <div class="mt-12">
                <div class="flex justify-between items-end mb-6">
                    <h2 class="text-2xl font-semibold">Recent Activity</h2>
                    <button onclick="switchView('topics')" class="text-sky-600 text-sm font-medium flex items-center gap-2">
                        View all <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </div>
                <div class="bg-white rounded-3xl overflow-hidden shadow-sm">
                    <table class="w-full">
                        <thead>
                            <tr class="border-b">
                                <th class="text-left py-5 px-8 font-medium text-slate-500">TOPIC</th>
                                <th class="text-left py-5 px-8 font-medium text-slate-500">DISCIPLINE</th>
                                <th class="text-left py-5 px-8 font-medium text-slate-500">MASTERY</th>
                                <th class="w-20"></th>
                            </tr>
                        </thead>
                        <tbody id="recent-table"></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    container.innerHTML = html;

    const tbody = document.getElementById('recent-table');
    const recent = currentTopics.slice(0, 5);
    recent.forEach(topic => {
        const row = document.createElement('tr');
        row.className = 'border-b last:border-0 hover:bg-sky-50 cursor-pointer';
        row.innerHTML = `
            <td onclick="openTopicDetail(\( {topic.id})" class="py-6 px-8 font-medium"> \){topic.title}</td>
            <td onclick="openTopicDetail(\( {topic.id})" class="py-6 px-8 text-slate-500"> \){topic.discipline}</td>
            <td onclick="openTopicDetail(${topic.id})" class="py-6 px-8">
                <span class="mastery-badge bg-\( {getMasteryColor(topic.mastery?.level || "Unknown")}-100 text- \){getMasteryColor(topic.mastery?.level || "Unknown")}-700">
                    ${getMasteryEmoji(topic.mastery?.level || "Unknown")} ${topic.mastery?.level || "Unknown"}
                </span>
            </td>
            <td class="pr-8">
                <button onclick="event.stopImmediatePropagation(); deleteTopic(${topic.id});" 
                        class="text-slate-300 hover:text-red-500">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function getMasteryColor(level) {
    const found = masteryLevels.find(m => m.val === level);
    return found ? found.color : "slate";
}
function getMasteryEmoji(level) {
    const found = masteryLevels.find(m => m.val === level);
    return found ? found.label.split(' ')[0] : "❌";
}

function renderAllTopics(container) {
    let html = `
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
    container.innerHTML = html;

    renderTopicsTable();
}

function renderTopicsTable(filtered = null) {
    const tbody = document.getElementById('topics-tbody');
    tbody.innerHTML = '';
    const data = filtered || currentTopics;

    data.forEach(topic => {
        const row = document.createElement('tr');
        row.className = "hover:bg-sky-50 cursor-pointer group";
        row.innerHTML = `
            <td onclick="openTopicDetail(\( {topic.id})" class="px-8 py-7 font-medium group-hover:text-sky-600"> \){topic.title}</td>
            <td onclick="openTopicDetail(\( {topic.id})" class="px-8 py-7 text-slate-500"> \){topic.discipline}</td>
            <td onclick="openTopicDetail(${topic.id})" class="px-8 py-7">
                <span class="mastery-badge bg-\( {getMasteryColor(topic.mastery?.level || "Unknown")}-100 text- \){getMasteryColor(topic.mastery?.level || "Unknown")}-700">
                    ${getMasteryEmoji(topic.mastery?.level || "Unknown")} ${topic.mastery?.level || "Unknown"}
                </span>
            </td>
            <td class="pr-6">
                <button onclick="event.stopImmediatePropagation(); deleteTopic(${topic.id});" 
                        class="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function filterTopics() {
    const term = document.getElementById('search-input').value.toLowerCase().trim();
    if (!term) {
        renderTopicsTable();
        return;
    }
    const filtered = currentTopics.filter(t => 
        t.title.toLowerCase().includes(term) || 
        t.discipline.toLowerCase().includes(term)
    );
    renderTopicsTable(filtered);
}

async function deleteTopic(id) {
    if (!confirm("Delete this topic permanently?")) return;
    await deleteTopicFromDB(id);
    currentTopics = await getAllTopics();
    renderView();
    if (document.getElementById('topic-modal').classList.contains('hidden') === false) closeModal();
}

function showNewTopicModal() {
    document.getElementById('new-topic-modal').classList.remove('hidden');
    document.getElementById('new-title').focus();
}

function closeNewModal() {
    document.getElementById('new-topic-modal').classList.add('hidden');
}

async function createNewTopic() {
    const discipline = document.getElementById('new-discipline').value;
    let title = document.getElementById('new-title').value.trim();
    if (!title) {
        title = "Untitled Topic " + Date.now().toString().slice(-4);
    }

    const newTopic = {
        id: Date.now(),
        title: title,
        discipline: discipline,
        createdAt: new Date().toISOString(),
        intent: { why: "", problem: "", applied: "", notUse: "", prior: "", related: "", predict: "" },
        active: { explanation: "", terms: "", principles: "", exceptions: "", comparison: "", examples: "", mistakes: "" },
        proof: { shortExplain: "", task: "", failures: "", teach: "", confidence: 3 },
        mastery: {
            level: "Unknown",
            checklist: { define: false, apply: false, solve: false, debug: false, explain: false, notUse: false }
        }
    };

    await saveTopicToDB(newTopic);
    currentTopics = await getAllTopics();
    closeNewModal();
    renderView();
    setTimeout(() => openTopicDetail(newTopic.id), 300);
}

function openTopicDetail(id) {
    currentEditingTopic = currentTopics.find(t => t.id === id);
    if (!currentEditingTopic) return;

    // ensure structure
    if (!currentEditingTopic.intent) currentEditingTopic.intent = { why: "", problem: "", applied: "", notUse: "", prior: "", related: "", predict: "" };
    if (!currentEditingTopic.active) currentEditingTopic.active = { explanation: "", terms: "", principles: "", exceptions: "", comparison: "", examples: "", mistakes: "" };
    if (!currentEditingTopic.proof) currentEditingTopic.proof = { shortExplain: "", task: "", failures: "", teach: "", confidence: 3 };
    if (!currentEditingTopic.mastery) currentEditingTopic.mastery = { level: "Unknown", checklist: { define: false, apply: false, solve: false, debug: false, explain: false, notUse: false } };

    document.getElementById('topic-modal').classList.remove('hidden');
    document.getElementById('modal-title').textContent = currentEditingTopic.title;
    document.getElementById('modal-discipline').textContent = currentEditingTopic.discipline;
    document.getElementById('modal-emoji').textContent = currentEditingTopic.discipline === "Coding" ? "💻" : 
                                                         currentEditingTopic.discipline === "Mathematics" ? "🧮" : 
                                                         currentEditingTopic.discipline === "English" ? "📖" : "📚";

    switchTab(0, true);
}

function closeModal() {
    document.getElementById('topic-modal').classList.add('hidden');
    currentEditingTopic = null;
}

function switchTab(tab, force = false) {
    if (!force) saveCurrentTabData();
    currentTabIndex = tab;

    document.querySelectorAll('.tab-btn').forEach((btn, i) => {
        if (i === tab) btn.classList.add('tab-active');
        else btn.classList.remove('tab-active');
    });

    renderCurrentTabContent();
}

function renderCurrentTabContent() {
    const container = document.getElementById('tab-content');
    let html = '';

    if (currentTabIndex === 0) { // INTENT
        html = `
            <div class="grid grid-cols-2 gap-8">
                <div>
                    <label class="block text-xs font-medium text-slate-500 mb-2 tracking-widest">WHY AM I LEARNING THIS?</label>
                    <textarea id="i-why" class="w-full h-28 border border-slate-200 focus:border-sky-400 rounded-3xl p-6 text-sm">${currentEditingTopic.intent.why || ''}</textarea>
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-500 mb-2 tracking-widest">REAL-WORLD PROBLEM SOLVED</label>
                    <textarea id="i-problem" class="w-full h-28 border border-slate-200 focus:border-sky-400 rounded-3xl p-6 text-sm">${currentEditingTopic.intent.problem || ''}</textarea>
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-500 mb-2 tracking-widest">WHERE IS IT APPLIED?</label>
                    <textarea id="i-applied" class="w-full h-28 border border-slate-200 focus:border-sky-400 rounded-3xl p-6 text-sm">${currentEditingTopic.intent.applied || ''}</textarea>
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-500 mb-2 tracking-widest">WHEN SHOULD IT NOT BE USED?</label>
                    <textarea id="i-notuse" class="w-full h-28 border border-slate-200 focus:border-sky-400 rounded-3xl p-6 text-sm">${currentEditingTopic.intent.notUse || ''}</textarea>
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-500 mb-2 tracking-widest">WHAT I ALREADY KNOW</label>
                    <textarea id="i-prior" class="w-full h-28 border border-slate-200 focus:border-sky-400 rounded-3xl p-6 text-sm">${currentEditingTopic.intent.prior || ''}</textarea>
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-500 mb-2 tracking-widest">RELATED CONCEPTS</label>
                    <textarea id="i-related" class="w-full h-28 border border-slate-200 focus:border-sky-400 rounded-3xl p-6 text-sm">${currentEditingTopic.intent.related || ''}</textarea>
                </div>
                <div class="col-span-2">
                    <label class="block text-xs font-medium text-slate-500 mb-2 tracking-widest">WHAT WILL BE DIFFICULT?</label>
                    <textarea id="i-predict" class="w-full h-28 border border-slate-200 focus:border-sky-400 rounded-3xl p-6 text-sm">${currentEditingTopic.intent.predict || ''}</textarea>
                </div>
            </div>
        `;
    } else if (currentTabIndex === 1) { // ACTIVE
        html = `
            <div class="grid grid-cols-2 gap-8">
                <div class="col-span-2">
                    <label class="block text-xs font-medium text-slate-500 mb-2 tracking-widest">EXPLANATION IN MY OWN WORDS</label>
                    <textarea id="a-explain" class="w-full h-40 border border-slate-200 focus:border-sky-400 rounded-3xl p-6 text-sm">${currentEditingTopic.active.explanation || ''}</textarea>
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-500 mb-2 tracking-widest">KEY TERMS</label>
                    <textarea id="a-terms" class="w-full h-40 border border-slate-200 focus:border-sky-400 rounded-3xl p-6 text-sm">${currentEditingTopic.active.terms || ''}</textarea>
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-500 mb-2 tracking-widest">CORE PRINCIPLES / RULES</label>
                    <textarea id="a-principles" class="w-full h-40 border border-slate-200 focus:border-sky-400 rounded-3xl p-6 text-sm">${currentEditingTopic.active.principles || ''}</textarea>
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-500 mb-2 tracking-widest">EXCEPTIONS &amp; EDGE CASES</label>
                    <textarea id="a-exceptions" class="w-full h-40 border border-slate-200 focus:border-sky-400 rounded-3xl p-6 text-sm">${currentEditingTopic.active.exceptions || ''}</textarea>
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-500 mb-2 tracking-widest">COMPARISON WITH SIMILAR</label>
                    <textarea id="a-comparison" class="w-full h-40 border border-slate-200 focus:border-sky-400 rounded-3xl p-6 text-sm">${currentEditingTopic.active.comparison || ''}</textarea>
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-500 mb-2 tracking-widest">PRACTICAL EXAMPLES (2+)</label>
                    <textarea id="a-examples" class="w-full h-40 border border-slate-200 focus:border-sky-400 rounded-3xl p-6 text-sm">${currentEditingTopic.active.examples || ''}</textarea>
                </div>
                <div class="col-span-2">
                    <label class="block text-xs font-medium text-slate-500 mb-2 tracking-widest">COMMON MISTAKES TO AVOID</label>
                    <textarea id="a-mistakes" class="w-full h-40 border border-slate-200 focus:border-sky-400 rounded-3xl p-6 text-sm">${currentEditingTopic.active.mistakes || ''}</textarea>
                </div>
            </div>
        `;
    } else if (currentTabIndex === 2) { // PROOF
        html = `
            <div class="space-y-8 max-w-3xl mx-auto">
                <div>
                    <label class="block text-xs font-medium text-slate-500 mb-2 tracking-widest">EXPLAIN IN 3–5 LINES (NO NOTES)</label>
                    <textarea id="p-short" class="w-full h-32 border border-slate-200 focus:border-sky-400 rounded-3xl p-6 text-sm">${currentEditingTopic.proof.shortExplain || ''}</textarea>
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-500 mb-2 tracking-widest">SMALL APPLICATION TASK COMPLETED</label>
                    <textarea id="p-task" class="w-full h-32 border border-slate-200 focus:border-sky-400 rounded-3xl p-6 text-sm">${currentEditingTopic.proof.task || ''}</textarea>
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-500 mb-2 tracking-widest">FAILURE SCENARIOS IDENTIFIED</label>
                    <textarea id="p-fail" class="w-full h-32 border border-slate-200 focus:border-sky-400 rounded-3xl p-6 text-sm">${currentEditingTopic.proof.failures || ''}</textarea>
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-500 mb-2 tracking-widest">HOW I WOULD TEACH A BEGINNER</label>
                    <textarea id="p-teach" class="w-full h-32 border border-slate-200 focus:border-sky-400 rounded-3xl p-6 text-sm">${currentEditingTopic.proof.teach || ''}</textarea>
                </div>
                <div class="flex items-center gap-4">
                    <label class="text-xs font-medium text-slate-500 tracking-widest">CONFIDENCE (1–5)</label>
                    <select id="p-confidence" class="border border-slate-200 focus:border-sky-400 rounded-3xl px-6 py-3 text-lg">
                        \( {[1,2,3,4,5].map(n => `<option value=" \){n}" \( {currentEditingTopic.proof.confidence == n ? 'selected' : ''}> \){n} ${n===5?'— Rock solid':n===1?'— Still shaky':''}</option>`).join('')}
                    </select>
                </div>
            </div>
        `;
    } else if (currentTabIndex === 3) { // MASTERY
        html = `
            <div class="max-w-lg mx-auto">
                <div class="mb-8">
                    <label class="block text-xs font-medium text-slate-500 mb-3 tracking-widest">CURRENT MASTERY LEVEL</label>
                    <select id="m-level" class="w-full border border-slate-200 focus:border-sky-400 rounded-3xl p-6 text-2xl">
                        \( {masteryLevels.map(m => `<option value=" \){m.val}" \( {currentEditingTopic.mastery.level === m.val ? 'selected' : ''}> \){m.label}</option>`).join('')}
                    </select>
                </div>

                <div class="space-y-5">
                    <label class="flex items-center gap-4 text-base cursor-pointer">
                        <input type="checkbox" id="c-define" ${currentEditingTopic.mastery.checklist.define ? 'checked' : ''} class="w-5 h-5 accent-sky-600">
                        I can define it clearly
                    </label>
                    <label class="flex items-center gap-4 text-base cursor-pointer">
                        <input type="checkbox" id="c-apply" ${currentEditingTopic.mastery.checklist.apply ? 'checked' : ''} class="w-5 h-5 accent-sky-600">
                        I can apply it independently
                    </label>
                    <label class="flex items-center gap-4 text-base cursor-pointer">
                        <input type="checkbox" id="c-solve" ${currentEditingTopic.mastery.checklist.solve ? 'checked' : ''} class="w-5 h-5 accent-sky-600">
                        I can solve problems using it
                    </label>
                    <label class="flex items-center gap-4 text-base cursor-pointer">
                        <input type="checkbox" id="c-debug" ${currentEditingTopic.mastery.checklist.debug ? 'checked' : ''} class="w-5 h-5 accent-sky-600">
                        I can debug mistakes
                    </label>
                    <label class="flex items-center gap-4 text-base cursor-pointer">
                        <input type="checkbox" id="c-explain" ${currentEditingTopic.mastery.checklist.explain ? 'checked' : ''} class="w-5 h-5 accent-sky-600">
                        I can explain it without notes
                    </label>
                    <label class="flex items-center gap-4 text-base cursor-pointer">
                        <input type="checkbox" id="c-notuse" ${currentEditingTopic.mastery.checklist.notUse ? 'checked' : ''} class="w-5 h-5 accent-sky-600">
                        I know when NOT to use it
                    </label>
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
}

function saveCurrentTabData() {
    if (!currentEditingTopic) return;

    if (currentTabIndex === 0) {
        currentEditingTopic.intent.why = document.getElementById('i-why') ? document.getElementById('i-why').value : currentEditingTopic.intent.why;
        currentEditingTopic.intent.problem = document.getElementById('i-problem') ? document.getElementById('i-problem').value : currentEditingTopic.intent.problem;
        currentEditingTopic.intent.applied = document.getElementById('i-applied') ? document.getElementById('i-applied').value : currentEditingTopic.intent.applied;
        currentEditingTopic.intent.notUse = document.getElementById('i-notuse') ? document.getElementById('i-notuse').value : currentEditingTopic.intent.notUse;
        currentEditingTopic.intent.prior = document.getElementById('i-prior') ? document.getElementById('i-prior').value : currentEditingTopic.intent.prior;
        currentEditingTopic.intent.related = document.getElementById('i-related') ? document.getElementById('i-related').value : currentEditingTopic.intent.related;
        currentEditingTopic.intent.predict = document.getElementById('i-predict') ? document.getElementById('i-predict').value : currentEditingTopic.intent.predict;
    } else if (currentTabIndex === 1) {
        currentEditingTopic.active.explanation = document.getElementById('a-explain') ? document.getElementById('a-explain').value : currentEditingTopic.active.explanation;
        currentEditingTopic.active.terms = document.getElementById('a-terms') ? document.getElementById('a-terms').value : currentEditingTopic.active.terms;
        currentEditingTopic.active.principles = document.getElementById('a-principles') ? document.getElementById('a-principles').value : currentEditingTopic.active.principles;
        currentEditingTopic.active.exceptions = document.getElementById('a-exceptions') ? document.getElementById('a-exceptions').value : currentEditingTopic.active.exceptions;
        currentEditingTopic.active.comparison = document.getElementById('a-comparison') ? document.getElementById('a-comparison').value : currentEditingTopic.active.comparison;
        currentEditingTopic.active.examples = document.getElementById('a-examples') ? document.getElementById('a-examples').value : currentEditingTopic.active.examples;
        currentEditingTopic.active.mistakes = document.getElementById('a-mistakes') ? document.getElementById('a-mistakes').value : currentEditingTopic.active.mistakes;
    } else if (currentTabIndex === 2) {
        currentEditingTopic.proof.shortExplain = document.getElementById('p-short') ? document.getElementById('p-short').value : currentEditingTopic.proof.shortExplain;
        currentEditingTopic.proof.task = document.getElementById('p-task') ? document.getElementById('p-task').value : currentEditingTopic.proof.task;
        currentEditingTopic.proof.failures = document.getElementById('p-fail') ? document.getElementById('p-fail').value : currentEditingTopic.proof.failures;
        currentEditingTopic.proof.teach = document.getElementById('p-teach') ? document.getElementById('p-teach').value : currentEditingTopic.proof.teach;
        currentEditingTopic.proof.confidence = document.getElementById('p-confidence') ? parseInt(document.getElementById('p-confidence').value) : currentEditingTopic.proof.confidence;
    } else if (currentTabIndex === 3) {
        currentEditingTopic.mastery.level = document.getElementById('m-level') ? document.getElementById('m-level').value : currentEditingTopic.mastery.level;
        currentEditingTopic.mastery.checklist = {
            define: document.getElementById('c-define') ? document.getElementById('c-define').checked : currentEditingTopic.mastery.checklist.define,
            apply: document.getElementById('c-apply') ? document.getElementById('c-apply').checked : currentEditingTopic.mastery.checklist.apply,
            solve: document.getElementById('c-solve') ? document.getElementById('c-solve').checked : currentEditingTopic.mastery.checklist.solve,
            debug: document.getElementById('c-debug') ? document.getElementById('c-debug').checked : currentEditingTopic.mastery.checklist.debug,
            explain: document.getElementById('c-explain') ? document.getElementById('c-explain').checked : currentEditingTopic.mastery.checklist.explain,
            notUse: document.getElementById('c-notuse') ? document.getElementById('c-notuse').checked : currentEditingTopic.mastery.checklist.notUse
        };
    }
}

async function saveTopic() {
    if (!currentEditingTopic) return;
    saveCurrentTabData();
    await saveTopicToDB(currentEditingTopic);
    currentTopics = await getAllTopics();
    closeModal();
    renderView();
}

async function deleteCurrentTopic() {
    if (!currentEditingTopic || !confirm("Delete this entire topic?")) return;
    await deleteTopicFromDB(currentEditingTopic.id);
    currentTopics = await getAllTopics();
    closeModal();
    renderView();
}

// ====================== FOCUS MODE ======================
function renderFocusMode(container) {
    let html = `
        <div class="max-w-md mx-auto mt-20 text-center">
            <div class="text-8xl mb-8">⏳</div>
            <h2 class="text-4xl font-semibold mb-2">Deep Work Session</h2>
            <p class="text-slate-500 mb-12">25-minute focused mastery block</p>

            <div id="timer-display" class="text-[180px] font-bold tabular-nums text-slate-800 mb-12 leading-none">25:00</div>

            <div class="flex justify-center gap-4">
                <select id="focus-topic-select" class="bg-white border border-slate-200 rounded-3xl px-6 py-4 text-base">
                    <option value="">— Choose a topic —</option>
                    \( {currentTopics.map(t => `<option value=" \){t.id}">${t.title}</option>`).join('')}
                </select>
                <button onclick="startFocusTimer()" 
                        id="start-btn"
                        class="bg-sky-600 hover:bg-sky-700 text-white px-12 rounded-3xl font-semibold">START SESSION</button>
            </div>

            <div id="focus-log" class="mt-16 hidden">
                <textarea id="focus-reflection" placeholder="What did you discover? Any confusion?" 
                          class="w-full h-40 border border-slate-200 focus:border-sky-400 rounded-3xl p-6"></textarea>
                <button onclick="endFocusSession()" 
                        class="mt-6 w-full py-4 bg-emerald-600 text-white rounded-3xl font-medium">End Session &amp; Log</button>
            </div>
        </div>
    `;
    container.innerHTML = html;
}

function startFocusTimer() {
    const select = document.getElementById('focus-topic-select');
    if (!select.value) return alert("Please select a topic first");

    document.getElementById('start-btn').style.display = 'none';
    document.getElementById('focus-log').classList.remove('hidden');

    timeLeft = 25 * 60;
    updateTimerDisplay();

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert("🎉 25-minute deep work block completed!\n\nLog your reflection below.");
        }
    }, 1000);
}

function updateTimerDisplay() {
    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;
    document.getElementById('timer-display').textContent = `\( {min}: \){sec < 10 ? '0' : ''}${sec}`;
}

function endFocusSession() {
    clearInterval(timerInterval);
    const reflection = document.getElementById('focus-reflection').value.trim();
    if (reflection && currentEditingTopic) {
        // For demo we just alert - in full backend you would store in topic
        alert("Reflection saved!\n\n" + reflection);
    }
    renderView();
}

// ====================== ANALYTICS ======================
function renderAnalytics(container) {
    const byDiscipline = {};
    currentTopics.forEach(t => {
        byDiscipline[t.discipline] = (byDiscipline[t.discipline] || 0) + 1;
    });

    let html = `
        <div class="max-w-5xl mx-auto">
            <h1 class="text-4xl font-semibold mb-12">Knowledge Depth Analytics</h1>
            
            <div class="grid grid-cols-2 gap-8">
                <div class="bg-white rounded-3xl p-8">
                    <h3 class="font-medium mb-6">Topics per Discipline</h3>
                    <div class="space-y-6">
                        ${Object.keys(byDiscipline).map(d => `
                            <div>
                                <div class="flex justify-between text-sm mb-2">
                                    <span>${d}</span>
                                    <span class="font-semibold">${byDiscipline[d]}</span>
                                </div>
                                <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div class="h-2 bg-sky-500 rounded-full" style="width: ${Math.max(8, (byDiscipline[d] / currentTopics.length * 100))}%"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="bg-white rounded-3xl p-8">
                    <h3 class="font-medium mb-6">Mastery Distribution</h3>
                    <div class="flex flex-wrap gap-3">
                        ${masteryLevels.map(m => {
                            const count = currentTopics.filter(t => t.mastery && t.mastery.level === m.val).length;
                            return `<div class="px-6 py-3 bg-\( {m.color}-100 text- \){m.color}-700 rounded-3xl text-sm font-medium flex-1 text-center">\( {m.label}<br><span class="text-3xl"> \){count}</span></div>`;
                        }).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    container.innerHTML = html;
}

// Tailwind script already loaded via CDN
// Make sure to place this index.html and index.js in DeepBeforeDo/ folder
// Open index.html in any browser — everything persists via IndexedDB (even if MySQL is down)