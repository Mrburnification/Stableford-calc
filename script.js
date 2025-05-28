let state = {
    course: '',
    date: '',
    players: ['', '', '', ''],
    handicaps: [0, 0, 0, 0],
    scores: Array(18).fill().map(() => Array(4).fill('')),
    strokeIndexes: [10,8,18,2,12,16,6,4,14,11,17,9,1,13,15,5,7,3], // Default SI values
    theme: 'classic',
    playerCount: 4
};

const defaultPars = [4,4,3,5,4,3,4,5,4,4,3,4,5,4,3,4,4,5];

function init() {
    try {
        loadState();
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
            players: ['', '', '', ''],
            handicaps: [0, 0, 0, 0],
            scores: Array(18).fill().map(() => Array(4).fill('')),
            strokeIndexes: [10,8,18,2,12,16,6,4,14,11,17,9,1,13,15,5,7,3],
            theme: 'classic',
            playerCount: 4
        };
        updatePlayerInputs();
        createScoreTable();
        createSummary();
        setupEventListeners();
    }
}

function addPlayer() {
    if (state.playerCount < 8) {
        state.playerCount++;
        state.players.push('');
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
    const playerInputs = document.getElementById('playerInputs');
    const handicapInputs = document.getElementById('handicapInputs');
    
    // Set grid columns based on player count
    const columns = Math.min(state.playerCount, 4);
    playerInputs.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    handicapInputs.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    
    playerInputs.innerHTML = '';
    handicapInputs.innerHTML = '';
    
    for (let i = 0; i < state.playerCount; i++) {
        // Player name input
        const playerDiv = document.createElement('div');
        playerDiv.innerHTML = `<input type="text" placeholder="Player ${i + 1}" class="player-name" data-player="${i}" value="${state.players[i] || ''}">`;
        playerInputs.appendChild(playerDiv);
        
        // Handicap input
        const handicapDiv = document.createElement('div');
        handicapDiv.innerHTML = `<input type="number" min="0" max="54" value="${state.handicaps[i] || 0}" class="handicap" data-player="${i}" placeholder="HCP">`;
        handicapInputs.appendChild(handicapDiv);
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
            <td><strong>${defaultPars[hole]}</strong></td>
            <td><input type="number" min="1" max="18" 
                 class="stroke-index" data-hole="${hole}" 
                 value="${state.strokeIndexes[hole] || ''}" 
                 placeholder="SI"></td>
        `;
        
        // Gross score inputs
        for (let p = 0; p < state.playerCount; p++) {
            rowHtml += `<td><input type="number" min="1" max="12" 
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
            <th>Front 9 Gross</th>
            <th>Back 9 Gross</th>
            <th>Total Gross</th>
            <th>Front 9 Pts</th>
            <th>Back 9 Pts</th>
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

function calculatePoints(net, par) {
    if (net === '') return '';
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
            const points = calculatePoints(net, defaultPars[hole]);
            
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
        return sum + (calculatePoints(net, defaultPars[startHole + index]) || 0);
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
    
    container.addEventListener('input', (e) => {
        if (e.target.classList.contains('gross')) {
            const hole = parseInt(e.target.dataset.hole);
            const player = parseInt(e.target.dataset.player);
            if (!state.scores[hole]) state.scores[hole] = [];
            state.scores[hole][player] = e.target.value;
            updateCalculations();
        } else if (e.target.classList.contains('handicap')) {
            const player = parseInt(e.target.dataset.player);
            state.handicaps[player] = parseInt(e.target.value) || 0;
            updateCalculations();
        } else if (e.target.classList.contains('player-name')) {
            const player = parseInt(e.target.dataset.player);
            state.players[player] = e.target.value;
            updateSummary();
            saveState();
        } else if (e.target.classList.contains('stroke-index')) {
            const hole = parseInt(e.target.dataset.hole);
            state.strokeIndexes[hole] = e.target.value;
            updateCalculations();
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
    // Can't use localStorage in Claude artifacts - would normally save here
    console.log('State would be saved:', state);
}

function loadState() {
    // Can't use localStorage in Claude artifacts - would normally load here
    console.log('State would be loaded');
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init); 