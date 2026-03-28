// ========== NEW: AR/VR Logic ==========

window.enterVR = function() {
    // Hide the 2D UI and show the VR scene
    document.getElementById('ui-container').style.display = 'none';
    document.getElementById('vr-view').style.display = 'block';
    
    renderVRScene();
};

window.exitVR = function() {
    // Hide VR and bring back the 2D UI
    document.getElementById('vr-view').style.display = 'none';
    document.getElementById('ui-container').style.display = 'block';
};

function renderVRScene() {
    const vrContainer = document.getElementById('vr-topics-container');
    vrContainer.innerHTML = ''; // Clear previous renders

    if (topics.length === 0) {
        // Just show a welcome message if no topics exist
        vrContainer.innerHTML = `<a-text value="No topics yet!\nGo back and add some." align="center" position="0 1.6 -3" color="#1e3a8a" width="5"></a-text>`;
        return;
    }

    // Distribute topics in a circle around the user
    const radius = 3.5; // Distance from the user

    topics.forEach((topic, index) => {
        // Calculate position in a circle
        const angle = (index / topics.length) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        // Calculate rotation so the card faces the center (the user)
        const rotationY = -(angle * (180 / Math.PI)) + 90;

        // Choose a color based on mastery
        let boxColor = '#ffffff'; // default white
        let textColor = '#1e3a8a';
        
        if (topic.mastery.includes('Mastered') || topic.mastery.includes('Strong')) {
            boxColor = '#a855f7'; // Purple for mastered
            textColor = '#ffffff';
        } else if (topic.mastery.includes('Comfortable')) {
            boxColor = '#4ade80'; // Green
            textColor = '#064e3b';
        } else if (topic.mastery.includes('Surface')) {
            boxColor = '#facc15'; // Yellow
            textColor = '#713f12';
        }

        // Create the 3D element (an A-Frame entity)
        const entity = document.createElement('a-entity');
        entity.setAttribute('position', `${x} 1.5 ${z}`);
        entity.setAttribute('rotation', `0 ${rotationY} 0`);
        
        // Build the visual "Card" (a box with text on it)
        entity.innerHTML = `
            <a-box color="${boxColor}" depth="0.1" height="1.2" width="2" shadow="cast: true"></a-box>
            <a-text value="${escapeHTML(topic.title)}" align="center" position="0 0.2 0.06" color="${textColor}" width="3.5" wrap-count="20"></a-text>
            <a-text value="${escapeHTML(topic.discipline)}" align="center" position="0 -0.2 0.06" color="${textColor}" width="2.5"></a-text>
            <a-text value="${escapeHTML(topic.mastery)}" align="center" position="0 -0.45 0.06" color="${textColor}" width="2"></a-text>
        `;

        vrContainer.appendChild(entity);
    });
}