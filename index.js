// ---------- Data & Storage ----------
let topics = [];

// Load from localStorage
function loadTopics() {
    const stored = localStorage.getItem('deepbeforedo_topics');
    if (stored) {
        topics = JSON.parse(stored);
    } else {
        // sample starter
        topics = [
            {
                id: '1',
                title: 'JavaScript Array.map',
                discipline: 'Coding',
                intent: { why: 'To transform arrays functionally', problem: 'Data formatting', where: 'React renders', notUse: 'When side effects needed', prior: 'loops', related: 'forEach, filter', difficulties: 'callback return' },
                active: { explanation: 'map creates new array by applying function', keyTerms: 'callback, new array', rules: 'returns same length', exceptions: 'empty slots', comparison: 'forEach returns undefined', examples: '[1,2].map(x=>x*2)', mistakes: 'forgetting return' },
                proof: { shortExplain: 'map transforms each element', task: 'double numbers', failures: 'if callback not pure', teach: 'like a factory line', confidence: 4 },
                mastery: '🟢 Comfortable'
            }
        ];
        saveTopics();
    }
    render();
}

function saveTopics() {
    localStorage.setItem('deepbeforedo_topics', JSON.stringify(topics));
    updateStats();
}

// ---------- Helper: generate new id ----------
function newId() { return Date.now() + '-' + Math.random().toString(36).substr(2, 9); }

// ---------- Render topics list ----------
function render() {
    const container = document.getElementById('topicsContainer');
    if (!container) return;

    if (topics.length === 0) {
        container.innerHTML = '<div class="card p-8 text-center text-blue-400">No topics yet. Add one above ☝️</div>';
        updateStats();
        return;
    }

    let html = '';
    topics.forEach(topic => {
        html += `
            <div class="card p-5 hover:shadow-lg transition">
                <div class="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <span class="text-xl font-semibold text-blue-800">${escapeHTML(topic.title)}</span>
                        <span class="ml-3 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">${topic.discipline}</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="text-2xl" title="Mastery level">${topic.mastery || '❌ Unknown'}</span>
                        <button onclick="editTopic('${topic.id}')" class="text-blue-600 hover:text-blue-800 text-sm">✏️ edit</button>
                        <button onclick="deleteTopic('${topic.id}')" class="text-red-400 hover:text-red-600 text-sm">🗑️</button>
                    </div>
                </div>
                <!-- Quick phase indicators (simplified) -->
                <div class="flex gap-2 mt-3 text-xs">
                    <span class="px-2 py-1 rounded-full ${topic.intent ? 'bg-green-200 text-green-800' : 'bg-gray-200'}">Intent</span>
                    <span class="px-2 py-1 rounded-full ${topic.active ? 'bg-green-200 text-green-800' : 'bg-gray-200'}">Active</span>
                    <span class="px-2 py-1 rounded-full ${topic.proof ? 'bg-green-200 text-green-800' : 'bg-gray-200'}">Proof</span>
                </div>
                <!-- simple expandable forms -->
                <div class="mt-3 text-sm text-blue-600">
                    <details class="cursor-pointer">
                        <summary class="font-medium">View / edit phases</summary>
                        <div class="mt-2 space-y-2 p-2 bg-blue-50 rounded">
                            <!-- Intent fields -->
                            <div><label class="block text-xs">Why?</label><input class="input-field text-sm" id="intentWhy_${topic.id}" value="${escapeHTML(topic.intent?.why || '')}" placeholder="Why am I learning this?"></div>
                            <div><label class="block text-xs">Real-world problem</label><input class="input-field text-sm" id="intentProblem_${topic.id}" value="${escapeHTML(topic.intent?.problem || '')}"></div>
                            <div><label class="block text-xs">Where applied?</label><input class="input-field text-sm" id="intentWhere_${topic.id}" value="${escapeHTML(topic.intent?.where || '')}"></div>
                            <div><label class="block text-xs">When NOT to use?</label><input class="input-field text-sm" id="intentNotUse_${topic.id}" value="${escapeHTML(topic.intent?.notUse || '')}"></div>
                            <button onclick="updateIntent('${topic.id}')" class="btn-blue text-xs mt-1">Save Intent</button>

                            <!-- Active fields (shortened) -->
                            <div class="mt-2"><label class="block text-xs">Explanation (own words)</label><textarea class="input-field text-sm" id="activeExplain_${topic.id}">${escapeHTML(topic.active?.explanation || '')}</textarea></div>
                            <button onclick="updateActive('${topic.id}')" class="btn-blue text-xs">Save Active</button>

                            <!-- Proof fields -->
                            <div class="mt-2"><label class="block text-xs">Short explain (3-5 lines)</label><textarea class="input-field text-sm" id="proofShort_${topic.id}">${escapeHTML(topic.proof?.shortExplain || '')}</textarea></div>
                            <div><label class="block text-xs">Confidence (1-5)</label><input type="number" min="1" max="5" class="input-field text-sm" id="proofConfidence_${topic.id}" value="${topic.proof?.confidence || 1}"></div>
                            <button onclick="updateProof('${topic.id}')" class="btn-blue text-xs">Save Proof</button>

                            <!-- Mastery selector -->
                            <div class="mt-3">
                                <select class="input-field text-sm" id="masterySelect_${topic.id}">
                                    <option ${topic.mastery === '❌ Unknown' ? 'selected' : ''}>❌ Unknown</option>
                                    <option ${topic.mastery === '⚠️ Surface Level' ? 'selected' : ''}>⚠️ Surface Level</option>
                                    <option ${topic.mastery === '🟡 Practicing' ? 'selected' : ''}>🟡 Practicing</option>
                                    <option ${topic.mastery === '🟢 Comfortable' ? 'selected' : ''}>🟢 Comfortable</option>
                                    <option ${topic.mastery === '🔵 Strong' ? 'selected' : ''}>🔵 Strong</option>
                                    <option ${topic.mastery === '🟣 Mastered' ? 'selected' : ''}>🟣 Mastered</option>
                                </select>
                                <button onclick="updateMastery('${topic.id}')" class="btn-blue text-xs ml-2">Set</button>
                            </div>
                        </div>
                    </details>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
    updateStats();
}

// Simple escape for XSS
function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"]/g, function(m) {
        if (m === '&') return '&amp;'; if (m === '<') return '&lt;'; if (m === '>') return '&gt;'; if (m === '"') return '&quot;';
        return m;
    });
}

// ---------- CRUD operations ----------
window.addTopic = function() {
    const title = document.getElementById('newTopicTitle').value.trim();
    const discipline = document.getElementById('newTopicDiscipline').value;
    if (!title) return alert('Title required');
    const newTopic = {
        id: newId(),
        title,
        discipline,
        intent: null,
        active: null,
        proof: null,
        mastery: '❌ Unknown'
    };
    topics.push(newTopic);
    saveTopics();
    document.getElementById('newTopicTitle').value = '';
    render();
};

window.deleteTopic = function(id) {
    if (!confirm('Delete topic?')) return;
    topics = topics.filter(t => t.id !== id);
    saveTopics();
    render();
};

window.editTopic = function(id) {
    const elem = document.querySelector(`#intentWhy_${id}`);
    if (elem) elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

// Phase updates
window.updateIntent = function(id) {
    const topic = topics.find(t => t.id === id);
    if (!topic) return;
    topic.intent = {
        why: document.getElementById(`intentWhy_${id}`).value,
        problem: document.getElementById(`intentProblem_${id}`).value,
        where: document.getElementById(`intentWhere_${id}`).value,
        notUse: document.getElementById(`intentNotUse_${id}`).value,
        prior: '', related: '', difficulties: ''
    };
    saveTopics();
    render();
};

window.updateActive = function(id) {
    const topic = topics.find(t => t.id === id);
    if (!topic) return;
    topic.active = {
        explanation: document.getElementById(`activeExplain_${id}`).value,
        keyTerms: '', rules: '', exceptions: '', comparison: '', examples: '', mistakes: ''
    };
    saveTopics();
    render();
};

window.updateProof = function(id) {
    const topic = topics.find(t => t.id === id);
    if (!topic) return;
    topic.proof = {
        shortExplain: document.getElementById(`proofShort_${id}`).value,
        confidence: parseInt(document.getElementById(`proofConfidence_${id}`).value) || 1,
        task: '', failures: '', teach: ''
    };
    saveTopics();
    render();
};

window.updateMastery = function(id) {
    const topic = topics.find(t => t.id === id);
    if (!topic) return;
    const select = document.getElementById(`masterySelect_${id}`);
    topic.mastery = select.value;
    saveTopics();
    render();
};

// ---------- Dashboard stats ----------
function updateStats() {
    const total = topics.length;
    const completed = topics.filter(t => t.mastery === '🟣 Mastered' || t.mastery === '🔵 Strong').length;
    const surface = topics.filter(t => t.mastery === '⚠️ Surface Level' || t.mastery === '🟡 Practicing').length;
    const mastered = topics.filter(t => t.mastery === '🟣 Mastered').length;
    const weak = topics.filter(t => t.mastery === '❌ Unknown' || t.mastery === '⚠️ Surface Level').length;

    document.getElementById('statStarted').innerText = total;
    document.getElementById('statCompleted').innerText = completed;
    document.getElementById('statSurface').innerText = surface;
    document.getElementById('statMastered').innerText = mastered;
    document.getElementById('statWeak').innerText = weak;
}

// ========== NEW: TensorFlow.js Notes Analyzer ==========
let modelReady = false;
let model;  // will hold our tiny model

// Build a simple model with fixed weights (so it's deterministic)
async function createModel() {
    // Define a simple sequential model
    model = tf.sequential();
    model.add(tf.layers.dense({
        units: 1,
        inputShape: [3],  // 3 features: wordCount, sentenceCount, keywordScore
        useBias: true,
        // We set fixed weights to avoid random training
        kernelInitializer: tf.initializers.constant({value: [[0.5], [0.3], [0.8]]}),
        biasInitializer: tf.initializers.constant({value: [0.2]})
    }));
    // No need to compile for inference only
    modelReady = true;
    console.log('TensorFlow.js model ready');
}

// Extract simple features from text
function extractFeatures(text) {
    if (!text.trim()) return [0, 0, 0];
    
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const wordCount = Math.min(words.length, 500) / 500;  // normalize to [0,1]
    
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const sentenceCount = Math.min(sentences.length, 20) / 20;
    
    // Keyword score: count occurrences of deep-learning-related words
    const keywords = ['why', 'because', 'apply', 'example', 'understand', 'proof', 'intent', 'master', 'practice'];
    let keywordHits = 0;
    const lowerText = text.toLowerCase();
    keywords.forEach(kw => {
        const regex = new RegExp('\\b' + kw + '\\b', 'g');
        const matches = lowerText.match(regex);
        if (matches) keywordHits += matches.length;
    });
    const keywordScore = Math.min(keywordHits, 10) / 10;  // cap at 10
    
    return [wordCount, sentenceCount, keywordScore];
}

// Analyze notes and update UI
async function analyzeNotes() {
    const notes = document.getElementById('notesInput').value;
    if (!notes.trim()) {
        alert('Please paste some notes first.');
        return;
    }

    const resultDiv = document.getElementById('analysisResult');
    const willSpan = document.getElementById('willResult');
    const wishSpan = document.getElementById('wishResult');
    
    resultDiv.classList.remove('hidden');
    willSpan.innerText = 'Analyzing...';
    wishSpan.innerText = 'Please wait';
    
    // Ensure model is created
    if (!modelReady) {
        await createModel();
    }
    
    // Extract features
    const features = extractFeatures(notes);
    const inputTensor = tf.tensor2d([features], [1, 3]);
    
    // Run inference
    const output = model.predict(inputTensor);
    const score = (await output.data())[0];  // score between 0 and 1 (due to weights)
    
    // Map score to will and wish
    let will, wish;
    if (score > 0.7) {
        will = "🔥 High chance of mastery — your notes show depth!";
        wish = "Proceed to the Proof Phase and test yourself.";
    } else if (score > 0.4) {
        will = "📘 Moderate understanding — some gaps remain.";
        wish = "Review the Intent and Active phases to clarify core ideas.";
    } else {
        will = "🌱 Surface level — needs more reflection.";
        wish = "Spend time on the Intent Phase: define why and where this applies.";
    }
    
    willSpan.innerText = will;
    wishSpan.innerText = wish;
    
    // Cleanup tensors
    inputTensor.dispose();
    output.dispose();
}

