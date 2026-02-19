// --- IndexedDB Setup ---
let db;
const request = indexedDB.open("DeepBeforeDoDB", 1);

// Runs if the database doesn't exist or needs an upgrade
request.onupgradeneeded = (event) => {
    db = event.target.result;
    // Create an object store holding our topics, using 'id' as the unique key
    const objectStore = db.createObjectStore("topics", { keyPath: "id" });
    // Create an index to easily search by mastery level later if we want
    objectStore.createIndex("mastery", "mastery", { unique: false });
};

// Runs when DB connection is successful
request.onsuccess = (event) => {
    db = event.target.result;
    console.log("IndexedDB connected successfully!");
    renderDashboard(); // Load data once DB is ready
};

request.onerror = (event) => {
    console.error("IndexedDB error:", event.target.errorCode);
};


// --- DOM Elements ---
const intentForm = document.getElementById('intent-form');
const dashboardRows = document.getElementById('dashboard-rows');
const studyModal = document.getElementById('study-modal');
const studyForm = document.getElementById('study-form');
const closeModalBtn = document.getElementById('close-modal');

// --- Functions ---

// 1. Add a new Topic (Stage 1)
intentForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const newTopic = {
        id: Date.now().toString(), // Unique ID
        discipline: document.getElementById('discipline').value,
        title: document.getElementById('topic-title').value,
        intentWhy: document.getElementById('intent-why').value,
        processingText: "",
        proofText: "",
        confidence: 1,
        mastery: '⚠️ Surface Level',
        dateAdded: new Date().toLocaleDateString()
    };

    const transaction = db.transaction(["topics"], "readwrite");
    const store = transaction.objectStore("topics");
    
    store.add(newTopic);

    transaction.oncomplete = () => {
        intentForm.reset();
        renderDashboard(); // Refresh the table
    };
});

// 2. Fetch and Render the Dashboard (Table Rows)
function renderDashboard() {
    const transaction = db.transaction(["topics"], "readonly");
    const store = transaction.objectStore("topics");
    const request = store.getAll();

    request.onsuccess = () => {
        const topics = request.result;
        dashboardRows.innerHTML = ''; // Clear table
        
        let surfaceCount = 0;
        let masteredCount = 0;

        if (topics.length === 0) {
            dashboardRows.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-slate-400 italic">No topics yet. Start by locking in an intent!</td></tr>`;
        }

        topics.reverse().forEach(topic => {
            // Tally stats
            if (topic.mastery.includes('Surface')) surfaceCount++;
            if (topic.mastery.includes('Mastered')) masteredCount++;

            // Create row
            const tr = document.createElement('tr');
            tr.className = "hover:bg-blue-50/50 transition-colors";
            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600">${topic.discipline}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-900">${topic.title}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                    <span class="bg-white border border-blue-200 px-2 py-1 rounded shadow-sm text-xs font-medium">
                        ${topic.mastery}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onclick="openStudyMode('${topic.id}')" class="text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded transition-colors">
                        Study / Edit
                    </button>
                </td>
            `;
            dashboardRows.appendChild(tr);
        });

        // Update top stats
        document.getElementById('stat-started').innerText = topics.length;
        document.getElementById('stat-surface').innerText = surfaceCount;
        document.getElementById('stat-mastered').innerText = masteredCount;
    };
}

// 3. Open Study Modal (Stages 2, 3, 4)
window.openStudyMode = (id) => {
    const transaction = db.transaction(["topics"], "readonly");
    const store = transaction.objectStore("topics");
    const request = store.get(id);

    request.onsuccess = () => {
        const topic = request.result;
        
        // Populate modal fields
        document.getElementById('modal-title').innerText = `Studying: ${topic.title}`;
        document.getElementById('edit-id').value = topic.id;
        document.getElementById('study-processing').value = topic.processingText || "";
        document.getElementById('study-proof').value = topic.proofText || "";
        document.getElementById('study-confidence').value = topic.confidence || 1;
        document.getElementById('study-mastery').value = topic.mastery || "⚠️ Surface Level";
        
        // Show modal
        studyModal.classList.remove('hidden');
    };
};

// 4. Save Study Progress (Update existing record)
studyForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const id = document.getElementById('edit-id').value;
    
    // First, get the existing record so we don't overwrite Intent data
    const transaction = db.transaction(["topics"], "readwrite");
    const store = transaction.objectStore("topics");
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
        const topic = getRequest.result;
        
        // Update the stages
        topic.processingText = document.getElementById('study-processing').value;
        topic.proofText = document.getElementById('study-proof').value;
        topic.confidence = parseInt(document.getElementById('study-confidence').value);
        topic.mastery = document.getElementById('study-mastery').value;

        // Put it back in DB
        const putRequest = store.put(topic);
        
        putRequest.onsuccess = () => {
            studyModal.classList.add('hidden'); // Close modal
            renderDashboard(); // Refresh table
        };
    };
});

// Close Modal manually
closeModalBtn.addEventListener('click', () => {
    studyModal.classList.add('hidden');
});
