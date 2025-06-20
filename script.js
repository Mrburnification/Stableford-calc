let state = {
    course: '',
    date: '',
    players: ['Player 1', 'Player 2', 'Player 3', 'Player 4'],
    handicaps: [0, 0, 0, 0],
    scores: Array(18).fill().map(() => Array(4).fill('')),
    strokeIndexes: [10,8,18,2,12,16,6,4,14,11,17,9,1,13,15,5,7,3], // Default SI values
    pars: [4,4,3,5,4,3,4,5,4,4,3,4,5,4,3,4,4,5], // Default par values
    theme: 'classic',
    playerCount: 4
};

const defaultPars = [4,4,3,5,4,3,4,5,4,4,3,4,5,4,3,4,4,5];

function init() {
    try {
        loadState();
        createNumberPads();
        updatePlayerInputs();
        createScoreTable();
        createSummary();
        setupEventListeners();
        applyTheme(state.theme);
        updatePlayerControls();
    } catch (error) {
        console.error('Initialization error:', error);
        // Initialize with default values if there's an error
        state = {
            course: '',
            date: '',
            players: ['Player 1', 'Player 2', 'Player 3', 'Player 4'],
            handicaps: [0, 0, 0, 0],
            scores: Array(18).fill().map(() => Array(4).fill('')),
            strokeIndexes: [10,8,18,2,12,16,6,4,14,11,17,9,1,13,15,5,7,3],
            pars: [4,4,3,5,4,3,4,5,4,4,3,4,5,4,3,4,4,5],
            theme: 'classic',
            playerCount: 4
        };
        createNumberPads();
        updatePlayerInputs();
        createScoreTable();
        createSummary();
        setupEventListeners();
    }
}

function addPlayer() {
    if (state.playerCount < 8) {
        state.playerCount++;
        state.players.push(`Player ${state.playerCount}`);
        state.handicaps.push(0);
        
        // Extend scores array for new player
        state.scores.forEach(hole => hole.push(''));
        
        updatePlayerInputs();
        createScoreTable();
        createSummary();
        setupEventListeners();
        updatePlayerControls();
        saveState();
    }
}

function removePlayer() {
    if (state.playerCount > 1) {
        state.playerCount--;
        state.players.pop();
        state.handicaps.pop();
        
        // Remove last player from scores
        state.scores.forEach(hole => hole.pop());
        
        updatePlayerInputs();
        createScoreTable();
        createSummary();
        setupEventListeners();
        updatePlayerControls();
        saveState();
    }
}

function updatePlayerControls() {
    document.getElementById('playerCount').textContent = state.playerCount;
    document.getElementById('addPlayer').disabled = state.playerCount >= 8;
    document.getElementById('removePlayer').disabled = state.playerCount <= 1;
}

function updatePlayerInputs() {
    const container = document.getElementById('playerInputsContainer');
    container.innerHTML = '';
    
    for (let i = 0; i < state.playerCount; i++) {
        const playerRow = document.createElement('div');
        playerRow.className = 'player-row';
        playerRow.innerHTML = `
            <input type="text" placeholder="Player ${i + 1}" 
                class="player-name" data-player="${i}" 
                value="${state.players[i] || ''}">
            <input type="number" min="0" max="54" 
                class="handicap" data-player="${i}" 
                value="${state.handicaps[i] || 0}" 
                placeholder="HCP">
        `;
        container.appendChild(playerRow);
    }
}

function createScoreTable() {
    const thead = document.getElementById('scoreHead');
    const tbody = document.getElementById('scoreBody');
    
    if (!thead || !tbody) {
        console.error('Score table elements not found');
        return;
    }
    
    // Create header
    let headerHtml = '<tr class="header-row"><th>Hole</th><th>Par</th><th>SI</th>';
    
    // Gross score columns
    for (let p = 0; p < state.playerCount; p++) {
        headerHtml += `<th>P${p + 1} Gross</th>`;
    }
    
    // Net score columns
    for (let p = 0; p < state.playerCount; p++) {
        headerHtml += `<th>P${p + 1} Net</th>`;
    }
    
    // Points columns
    for (let p = 0; p < state.playerCount; p++) {
        headerHtml += `<th>P${p + 1} Pts</th>`;
    }
    
    headerHtml += '<th>Winner</th></tr>';
    thead.innerHTML = headerHtml;
    
    // Create body
    tbody.innerHTML = '';
    
    for (let hole = 0; hole < 18; hole++) {
        const tr = document.createElement('tr');
        let rowHtml = `
            <td><strong>${hole + 1}</strong></td>
            <td><input type="text" readonly inputmode="none" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
                 class="par" data-hole="${hole}" 
                 value="${state.pars[hole] || ''}" 
                 placeholder="Par"></td>
            <td><input type="text" readonly inputmode="none" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
                 class="stroke-index" data-hole="${hole}" 
                 value="${state.strokeIndexes[hole] || ''}" 
                 placeholder="SI"></td>
        `;
        
        // Gross score inputs
        for (let p = 0; p < state.playerCount; p++) {
            rowHtml += `<td><input type="text" readonly inputmode="none" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
                 data-hole="${hole}" data-player="${p}" 
                 class="gross" value="${(state.scores[hole] && state.scores[hole][p]) || ''}"></td>`;
        }
        
        // Net score displays
        for (let p = 0; p < state.playerCount; p++) {
            rowHtml += `<td class="net" data-player="${p}"></td>`;
        }
        
        // Points displays
        for (let p = 0; p < state.playerCount; p++) {
            rowHtml += `<td class="points" data-player="${p}"></td>`;
        }
        
        rowHtml += '<td class="winner"></td>';
        tr.innerHTML = rowHtml;
        tbody.appendChild(tr);
    }
    updateCalculations();
}

function createSummary() {
    const summaryHead = document.getElementById('summaryHead');
    const summaryBody = document.getElementById('summaryBody');
    
    if (!summaryHead || !summaryBody) {
        console.error('Summary table elements not found');
        return;
    }
    
    // Create summary header
    summaryHead.innerHTML = `
        <tr class="header-row">
            <th>Player</th>
            <th>Front 9</th>
            <th>Back 9</th>
            <th>Total</th>
            <th>Front Pts</th>
            <th>Back Pts</th>
            <th>Total Pts</th>
            <th>Position</th>
        </tr>
    `;
    
    updateSummary();
}

function calculateNetScore(gross, handicap, si) {
    if (gross === '' || si === '') return '';
    const strokes = Math.floor(handicap / 18) + (handicap % 18 >= parseInt(si) ? 1 : 0);
    return parseInt(gross) - strokes;
}

function calculatePoints(net, hole) {
    if (net === '') return '';
    const par = state.pars[hole];
    const diff = net - par;
    if (diff <= -4) return 6;
    if (diff <= -3) return 5;
    if (diff <= -2) return 4;
    if (diff <= -1) return 3;
    if (diff <= 0) return 2;
    if (diff <= 1) return 1;
    return 0;
}

function updateCalculations() {
    const rows = document.querySelectorAll('#scoreBody tr');
    if (!rows.length) {
        console.error('No score rows found');
        return;
    }

    rows.forEach((row, hole) => {
        const siInput = row.querySelector('.stroke-index');
        const si = siInput ? siInput.value : '';
        
        for (let p = 0; p < state.playerCount; p++) {
            const grossInput = row.querySelector(`.gross[data-player="${p}"]`);
            const netCell = row.querySelector(`.net[data-player="${p}"]`);
            const pointsCell = row.querySelector(`.points[data-player="${p}"]`);
            
            if (!grossInput || !netCell || !pointsCell) continue;
            
            const gross = grossInput.value;
            const net = calculateNetScore(gross, state.handicaps[p], si);
            const points = calculatePoints(net, hole);
            
            netCell.textContent = net || '';
            pointsCell.textContent = points || '';
            pointsCell.className = `points conditional-${points}`;
        }
        
        // Calculate hole winner
        const pointCells = row.querySelectorAll('.points');
        const points = Array.from(pointCells).map(td => parseInt(td.textContent) || 0);
        const maxPoints = Math.max(...points);
        const winners = points.reduce((acc, val, idx) => val === maxPoints && val > 0 ? [...acc, idx + 1] : acc, []);
        const winnerCell = row.querySelector('.winner');
        if (winnerCell) {
            winnerCell.textContent = maxPoints === 0 ? '' : 
                winners.length > 1 ? 'Tie' : `P${winners[0]}`;
        }
    });
    
    updateSummary();
    saveState();
}

function updateSummary() {
    const summaryBody = document.getElementById('summaryBody');
    if (!summaryBody) {
        console.error('Summary body not found');
        return;
    }
    
    summaryBody.innerHTML = '';
    
    for (let p = 0; p < state.playerCount; p++) {
        const front9Gross = state.scores.slice(0, 9).reduce((sum, hole) => {
            const score = hole[p] ? parseInt(hole[p]) : 0;
            return sum + (score || 0);
        }, 0);
        
        const back9Gross = state.scores.slice(9).reduce((sum, hole) => {
            const score = hole[p] ? parseInt(hole[p]) : 0;
            return sum + (score || 0);
        }, 0);
        
        const totalGross = front9Gross + back9Gross;
        
        const front9Points = calculateTotalPoints(p, 0, 8);
        const back9Points = calculateTotalPoints(p, 9, 17);
        const totalPoints = front9Points + back9Points;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${state.players[p] || `Player ${p + 1}`}</strong></td>
            <td>${front9Gross || ''}</td>
            <td>${back9Gross || ''}</td>
            <td><strong>${totalGross || ''}</strong></td>
            <td>${front9Points || ''}</td>
            <td>${back9Points || ''}</td>
            <td><strong>${totalPoints || ''}</strong></td>
            <td class="position"></td>
        `;
        summaryBody.appendChild(tr);
    }
    
    // Calculate positions
    const totalPoints = Array.from(summaryBody.querySelectorAll('tr')).map(tr => 
        parseInt(tr.querySelector('td:nth-last-child(2)').textContent) || 0
    );
    
    const positions = calculatePositions(totalPoints);
    summaryBody.querySelectorAll('.position').forEach((td, i) => {
        td.innerHTML = `<strong>${positions[i] || ''}</strong>`;
        if (positions[i] === 1) {
            td.style.color = '#27ae60';
            td.innerHTML = `<strong>🏆 ${positions[i]}</strong>`;
        }
    });
}

function calculateTotalPoints(player, startHole, endHole) {
    return state.scores.slice(startHole, endHole + 1).reduce((sum, hole, index) => {
        const gross = hole[player] ? parseInt(hole[player]) : 0;
        if (!gross) return sum;
        
        const si = state.strokeIndexes[startHole + index] || '';
        const net = calculateNetScore(gross, state.handicaps[player], si);
        return sum + (calculatePoints(net, startHole + index) || 0);
    }, 0);
}

function calculatePositions(points) {
    const sorted = [...points].map((p, i) => ({points: p, index: i}))
        .sort((a, b) => b.points - a.points);
    
    const positions = Array(points.length).fill('');
    let currentPosition = 1;
    let currentPoints = sorted[0] ? sorted[0].points : 0;
    
    sorted.forEach((item, i) => {
        if (item.points < currentPoints) {
            currentPosition = i + 1;
            currentPoints = item.points;
        }
        positions[item.index] = item.points > 0 ? currentPosition : '';
    });
    
    return positions;
}

function setupEventListeners() {
    // Remove existing listeners by cloning elements
    const container = document.body;
    
    // Add number selection interface functionality
    const overlay = document.getElementById('overlay');
    const parNumberPad = document.getElementById('parNumberPad');
    const siNumberPad = document.getElementById('siNumberPad');
    const grossNumberPad = document.getElementById('grossNumberPad');
    let activeInput = null;

    // Remove any existing event listeners by cloning and replacing elements
    const newOverlay = overlay.cloneNode(true);
    overlay.parentNode.replaceChild(newOverlay, overlay);
    
    const newParNumberPad = parNumberPad.cloneNode(true);
    parNumberPad.parentNode.replaceChild(newParNumberPad, parNumberPad);
    
    const newSiNumberPad = siNumberPad.cloneNode(true);
    siNumberPad.parentNode.replaceChild(newSiNumberPad, siNumberPad);
    
    const newGrossNumberPad = grossNumberPad.cloneNode(true);
    grossNumberPad.parentNode.replaceChild(newGrossNumberPad, grossNumberPad);

    // Handle input clicks
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('par')) {
            e.preventDefault();
            activeInput = e.target;
            newOverlay.classList.add('active');
            newParNumberPad.classList.add('active');
            newSiNumberPad.classList.remove('active');
            newGrossNumberPad.classList.remove('active');
        } else if (e.target.classList.contains('stroke-index')) {
            e.preventDefault();
            activeInput = e.target;
            newOverlay.classList.add('active');
            newSiNumberPad.classList.add('active');
            newParNumberPad.classList.remove('active');
            newGrossNumberPad.classList.remove('active');
        } else if (e.target.classList.contains('gross')) {
            e.preventDefault();
            activeInput = e.target;
            newOverlay.classList.add('active');
            newGrossNumberPad.classList.add('active');
            newParNumberPad.classList.remove('active');
            newSiNumberPad.classList.remove('active');
        }
    });

    // Handle number button clicks
    document.querySelectorAll('.number-button').forEach(button => {
        button.addEventListener('click', () => {
            if (activeInput) {
                const number = button.dataset.number;
                activeInput.value = number;

                if (activeInput.classList.contains('par')) {
                    const hole = parseInt(activeInput.dataset.hole);
                    state.pars[hole] = parseInt(number);
                } else if (activeInput.classList.contains('stroke-index')) {
                    const hole = parseInt(activeInput.dataset.hole);
                    state.strokeIndexes[hole] = parseInt(number);
                } else if (activeInput.classList.contains('gross')) {
                    const hole = parseInt(activeInput.dataset.hole);
                    const player = parseInt(activeInput.dataset.player);
                    if (!state.scores[hole]) state.scores[hole] = [];
                    state.scores[hole][player] = parseInt(number);
                }

                updateCalculations();
                
                // Close the number pad
                newOverlay.classList.remove('active');
                newParNumberPad.classList.remove('active');
                newSiNumberPad.classList.remove('active');
                newGrossNumberPad.classList.remove('active');
                activeInput = null;
            }
        });
    });

    // Close number pad when clicking overlay
    newOverlay.addEventListener('click', () => {
        newOverlay.classList.remove('active');
        newParNumberPad.classList.remove('active');
        newSiNumberPad.classList.remove('active');
        newGrossNumberPad.classList.remove('active');
        activeInput = null;
    });

    // Handle other input events
    container.addEventListener('input', (e) => {
        if (e.target.classList.contains('handicap')) {
            const player = parseInt(e.target.dataset.player);
            state.handicaps[player] = parseInt(e.target.value) || 0;
            updateCalculations();
        } else if (e.target.classList.contains('player-name')) {
            const player = parseInt(e.target.dataset.player);
            state.players[player] = e.target.value;
            updateSummary();
            saveState();
        } else if (e.target.id === 'courseName') {
            state.course = e.target.value;
            saveState();
        } else if (e.target.id === 'gameDate') {
            state.date = e.target.value;
            saveState();
        }
    });
}

function applyTheme(theme) {
    document.body.className = theme;
    state.theme = theme;
    document.getElementById('themeSelect').value = theme;
    saveState();
}

function saveState() {
    try {
        localStorage.setItem('stablefordState', JSON.stringify(state));
        console.log('State saved successfully');
    } catch (error) {
        console.error('Error saving state:', error);
    }
}

function loadState() {
    try {
        const savedState = localStorage.getItem('stablefordState');
        if (savedState) {
            state = JSON.parse(savedState);
            // Ensure arrays are properly initialized
            if (!state.pars) state.pars = [4,4,3,5,4,3,4,5,4,4,3,4,5,4,3,4,4,5];
            if (!state.strokeIndexes) state.strokeIndexes = [10,8,18,2,12,16,6,4,14,11,17,9,1,13,15,5,7,3];
            if (!state.scores) state.scores = Array(18).fill().map(() => Array(4).fill(''));
            if (!state.players) state.players = ['Player 1', 'Player 2', 'Player 3', 'Player 4'];
            if (!state.handicaps) state.handicaps = [0, 0, 0, 0];
            if (!state.playerCount) state.playerCount = 4;
            if (!state.theme) state.theme = 'classic';
            
            // Update UI elements
            document.getElementById('courseName').value = state.course || '';
            document.getElementById('gameDate').value = state.date || '';
            document.getElementById('themeSelect').value = state.theme;
            
            console.log('State loaded successfully');
        }
    } catch (error) {
        console.error('Error loading state:', error);
        // Initialize with default values if there's an error
        state = {
            course: '',
            date: '',
            players: ['Player 1', 'Player 2', 'Player 3', 'Player 4'],
            handicaps: [0, 0, 0, 0],
            scores: Array(18).fill().map(() => Array(4).fill('')),
            strokeIndexes: [10,8,18,2,12,16,6,4,14,11,17,9,1,13,15,5,7,3],
            pars: [4,4,3,5,4,3,4,5,4,4,3,4,5,4,3,4,4,5],
            theme: 'classic',
            playerCount: 4
        };
    }
}

function confirmReset() {
    if (confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
        resetState();
    }
}

function resetState() {
    state = {
        course: '',
        date: '',
        players: ['Player 1', 'Player 2', 'Player 3', 'Player 4'],
        handicaps: [0, 0, 0, 0],
        scores: Array(18).fill().map(() => Array(4).fill('')),
        strokeIndexes: [10,8,18,2,12,16,6,4,14,11,17,9,1,13,15,5,7,3],
        pars: [4,4,3,5,4,3,4,5,4,4,3,4,5,4,3,4,4,5],
        theme: 'classic',
        playerCount: 4
    };
    
    // Clear localStorage
    localStorage.removeItem('stablefordState');
    
    // Reset UI
    document.getElementById('courseName').value = '';
    document.getElementById('gameDate').value = '';
    document.getElementById('themeSelect').value = 'classic';
    
    // Reinitialize the UI
    updatePlayerInputs();
    createScoreTable();
    createSummary();
    setupEventListeners();
    applyTheme('classic');
    updatePlayerControls();
    
    console.log('State reset to defaults');
}

// Add event listener for beforeunload to save state
window.addEventListener('beforeunload', saveState);

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);

function saveAsImage() {
    const overlay = document.getElementById('loadingOverlay');
    const container = document.querySelector('.container');
    
    if (!container) {
        console.error('Container element not found');
        alert('Error: Could not find the scorecard container');
        return;
    }
    
    overlay.classList.remove('hidden');
    
    // Store original scroll position
    const originalScroll = window.scrollY;
    
    // Temporarily set container width to 1280px for capture
    const originalWidth = container.style.width;
    container.style.width = '1280px';
    
    // Use html2canvas to capture the container
    html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 1280,
        windowWidth: 1280
    }).then(canvas => {
        try {
            // Create a temporary link to download the image
            const link = document.createElement('a');
            const courseName = state.course || 'golf-scorecard';
            const date = state.date || new Date().toISOString().split('T')[0];
            const filename = `${courseName}-${date}.png`.replace(/[^a-z0-9.-]/gi, '-');
            
            link.download = filename;
            link.href = canvas.toDataURL('image/png');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error creating download link:', error);
            alert('Error saving image. Please try again.');
        } finally {
            // Restore original container width
            container.style.width = originalWidth;
            // Restore original scroll position
            window.scrollTo(0, originalScroll);
            overlay.classList.add('hidden');
        }
    }).catch(error => {
        console.error('Error generating image:', error);
        // Restore original container width
        container.style.width = originalWidth;
        // Restore original scroll position
        window.scrollTo(0, originalScroll);
        overlay.classList.add('hidden');
        alert('Error generating image. Please try again.');
    });
}

// Add event listener for the export button
document.addEventListener('DOMContentLoaded', function() {
    const exportButton = document.getElementById('exportButton');
    if (exportButton) {
        exportButton.addEventListener('click', saveAsImage);
    }
});

function createNumberPads() {
    // Create SI number buttons
    const siGrid = document.querySelector('.si-grid');
    siGrid.innerHTML = ''; // Clear existing buttons
    for (let i = 1; i <= 18; i++) {
        const button = document.createElement('button');
        button.className = 'number-button';
        button.dataset.number = i;
        button.innerHTML = `
            <span class="number">${i}</span>
            <span class="par-label">SI</span>
        `;
        siGrid.appendChild(button);
    }

    // Create gross score number buttons
    const grossGrid = document.querySelector('.gross-grid');
    grossGrid.innerHTML = ''; // Clear existing buttons
    for (let i = 1; i <= 10; i++) {
        const button = document.createElement('button');
        button.className = 'number-button';
        button.dataset.number = i;
        button.innerHTML = `
            <span class="number">${i}</span>
            <span class="par-label">SCORE</span>
        `;
        grossGrid.appendChild(button);
    }
} 