// Initialize empty topics array or grab from LocalStorage
let topics = JSON.parse(localStorage.getItem('deepBeforeDo_topics')) || [];

// DOM Elements
const intentForm = document.getElementById('intent-form');
const topicsContainer = document.getElementById('topics-container');
const statStarted = document.getElementById('stat-started');

// Render topics to the dashboard
function renderTopics() {
    topicsContainer.innerHTML = ''; // Clear current list
    
    if (topics.length === 0) {
        topicsContainer.innerHTML = '<p class="text-slate-400 italic">No topics started yet. Define your intent on the left!</p>';
        return;
    }

    topics.forEach((topic) => {
        const topicCard = document.createElement('div');
        topicCard.className = "flex justify-between items-center p-4 bg-blue-50 rounded-lg border border-blue-100";
        
        topicCard.innerHTML = `
            <div>
                <span class="text-xs font-bold text-blue-500 uppercase tracking-wide">${topic.discipline}</span>
                <h3 class="text-md font-bold text-slate-800">${topic.title}</h3>
                <p class="text-sm text-slate-600 truncate max-w-xs cursor-help" title="${topic.intentWhy}">
                    Intent: ${topic.intentWhy}
                </p>
            </div>
            <div class="text-right">
                <span class="inline-block bg-white border border-blue-200 text-slate-600 text-xs px-2 py-1 rounded shadow-sm">
                    Status: ${topic.mastery}
                </span>
            </div>
        `;
        topicsContainer.appendChild(topicCard);
    });

    // Update simple stats
    statStarted.innerText = topics.length;
}

// Handle form submission
intentForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Grab values
    const discipline = document.getElementById('discipline').value;
    const title = document.getElementById('topic-title').value;
    const intentWhy = document.getElementById('intent-why').value;

    // Create new topic object
    const newTopic = {
        id: Date.now(),
        discipline,
        title,
        intentWhy,
        mastery: '⚠️ Surface Level' // Default starting state
    };

    // Save and render
    topics.push(newTopic);
    localStorage.setItem('deepBeforeDo_topics', JSON.stringify(topics));
    
    // Reset form and update UI
    intentForm.reset();
    renderTopics();
});

// Initial render on page load
renderTopics();
