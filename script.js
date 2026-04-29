const canvas = document.getElementById('graphCanvas');
const ctx = canvas.getContext('2d');
let users = [];
let edges = [];
let nodes = [];
let graphBuilt = false;

// ─── Generate Friend Name Inputs ──────────────────────────────────────────────
function generateFriendInputs() {
    const n = parseInt(document.getElementById('numFriends').value);
    const container = document.getElementById('friendNamesContainer');
    container.innerHTML = '';
    for (let i = 0; i < n; i++) {
        container.innerHTML += `
            <div class="input-group" style="margin-top:5px;">
                <input type="text" class="friend-name" placeholder="Friend ${i + 1} Name">
            </div>`;
    }
}

// ─── Sync dropdowns with current user list ────────────────────────────────────
function updateDropdowns() {
    const mainUser = document.getElementById('mainUser').value.trim();
    const friendNames = Array.from(document.querySelectorAll('.friend-name'))
        .map(el => el.value.trim())
        .filter(v => v !== '');

    // Build complete users array: main user first, then friends (no duplicates)
    users = [];
    if (mainUser) users.push(mainUser);
    friendNames.forEach(f => {
        if (!users.includes(f)) users.push(f);
    });

    console.log('[updateDropdowns] Current users:', users);

    const selA = document.getElementById('userA');
    const selB = document.getElementById('userB');
    const prevA = selA.value;
    const prevB = selB.value;

    selA.innerHTML = '';
    selB.innerHTML = '';

    users.forEach(u => {
        selA.innerHTML += `<option value="${u}">${u}</option>`;
        selB.innerHTML += `<option value="${u}">${u}</option>`;
    });

    if (prevA && users.includes(prevA)) selA.value = prevA;
    if (prevB && users.includes(prevB)) selB.value = prevB;
}

// ─── Add Connection ────────────────────────────────────────────────────────────
function addConnection() {
    updateDropdowns();
    const a = document.getElementById('userA').value;
    const b = document.getElementById('userB').value;

    if (!a || !b) return alert('Please select users first.');
    if (a === b) return alert('Select two different users.');

    // Check for duplicate edges (bidirectional)
    const duplicate = edges.find(e =>
        (e.from === a && e.to === b) || (e.from === b && e.to === a)
    );
    if (duplicate) return alert('These users are already connected.');

    // Add edge with consistent ordering (smaller name first alphabetically)
    const edge = a < b ? { from: a, to: b } : { from: b, to: a };
    edges.push(edge);

    console.log('[addConnection] Added edge:', edge);
    console.log('[addConnection] All edges:', edges);

    // Display the edge in the list
    const li = document.createElement('li');
    li.textContent = `${edge.from} ↔ ${edge.to}`;
    document.getElementById('connList').appendChild(li);

    // Redraw graph to show new edge
    drawGraph();
}

// ─── Build Graph (POST /build-graph) ─────────────────────────────────────────
async function buildGraph() {
    updateDropdowns();

    // Validate users
    if (users.length === 0 || !document.getElementById('mainUser').value.trim()) {
        return alert('Please enter your name.');
    }

    // Validate edges exist
    if (edges.length === 0) {
        return alert('Please add at least one connection before building the graph.');
    }

    console.log('[buildGraph] Users:', users);
    console.log('[buildGraph] Edges:', edges);

    try {
        const res = await fetch('http://localhost:5000/build-graph', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ users, connections: edges })
        });

        console.log('[buildGraph] Response status:', res.status);
        const data = await res.json();
        console.log('[buildGraph] Response data:', data);

        if (!res.ok || !data.success) {
            alert('Error: ' + (data.error || 'Unknown server error.'));
            return;
        }

        // Mark graph as built and enable analysis button
        graphBuilt = true;
        document.getElementById('analyzeBtn').disabled = false;
        
        alert(data.message);
        
        // Redraw to ensure visualization is updated
        drawGraph();

    } catch (err) {
        console.error('[buildGraph] Fetch error:', err);
        alert('Failed to reach the server.\nMake sure you ran: npm start\nAnd open http://localhost:5000');
    }
}

// ─── Analyze Graph (POST /suggest-friends) ────────────────────────────────────
async function analyzeGraph() {
    if (!graphBuilt) {
        return alert('Please build the graph first by clicking "Build Social Graph".');
    }

    const mainUser = document.getElementById('mainUser').value.trim();
    if (!mainUser) return alert('Enter your name first.');

    console.log('[analyzeGraph] Requesting suggestions for:', mainUser);

    try {
        const res = await fetch('http://localhost:5000/suggest-friends', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userName: mainUser })
        });

        console.log('[analyzeGraph] Response status:', res.status);
        const data = await res.json();
        console.log('[analyzeGraph] Response data:', data);

        if (!res.ok || !data.success) {
            alert('Error: ' + (data.error || 'Unknown server error.'));
            return;
        }

        // Parse and display traversal results
        const bfs = data.bfs || 'None';
        const dfs = data.dfs || 'None';
        const suggestions = data.suggestions || 'None';

        document.getElementById('bfsRes').textContent = bfs;
        document.getElementById('dfsRes').textContent = dfs;
        document.getElementById('suggRes').textContent = suggestions;

        console.log('[analyzeGraph] BFS:', bfs);
        console.log('[analyzeGraph] DFS:', dfs);
        console.log('[analyzeGraph] Suggestions:', suggestions);

        // Animate BFS traversal if available
        if (bfs && bfs !== 'None') {
            const bfsPath = bfs.split(' ').filter(n => n.trim());
            if (bfsPath.length > 0) animateTraversal(bfsPath);
        }

    } catch (err) {
        console.error('[analyzeGraph] Fetch error:', err);
        alert('Failed to reach the server. Make sure npm start is running.');
    }
}

// ─── Draw Graph on Canvas ─────────────────────────────────────────────────────
function drawGraph() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (users.length === 0) {
        ctx.fillStyle = '#718096';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('No users added yet', canvas.width / 2, canvas.height / 2);
        return;
    }

    const radius = 140;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // Calculate node positions in a circle
    nodes = users.map((name, i) => {
        const angle = (i / users.length) * 2 * Math.PI - Math.PI / 2;
        return {
            name,
            x: cx + radius * Math.cos(angle),
            y: cy + radius * Math.sin(angle)
        };
    });

    // Draw edges (lines)
    ctx.strokeStyle = '#cbd5e0';
    ctx.lineWidth = 2;
    edges.forEach(e => {
        const n1 = nodes.find(n => n.name === e.from);
        const n2 = nodes.find(n => n.name === e.to);
        if (n1 && n2) {
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
        }
    });

    // Draw nodes (circles with names)
    nodes.forEach((n, i) => {
        // Node circle
        ctx.beginPath();
        ctx.arc(n.x, n.y, 28, 0, 2 * Math.PI);
        ctx.fillStyle = i === 0 ? '#2c3e50' : '#3182ce'; // Main user darker
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Node text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const displayName = n.name.substring(0, 10);
        ctx.fillText(displayName, n.x, n.y);
    });

    console.log('[drawGraph] Drawn', users.length, 'nodes and', edges.length, 'edges');
}

// ─── Animate BFS Traversal ────────────────────────────────────────────────────
function animateTraversal(path) {
    drawGraph(); // Reset first
    let i = 0;
    const timer = setInterval(() => {
        if (i >= path.length) return clearInterval(timer);
        const nodeName = path[i].trim();
        const node = nodes.find(n => n.name === nodeName);
        if (node) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, 36, 0, 2 * Math.PI);
            ctx.strokeStyle = '#e53e3e';
            ctx.lineWidth = 4;
            ctx.stroke();
        }
        i++;
    }, 600);
}

// Initial render
console.log('[script.js] Loaded');
drawGraph();
