const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { exec } = require('child_process');

const app = express();
const PORT = 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ─── Paths ────────────────────────────────────────────────────────────────────
const DATA_FILE = path.join(__dirname, 'graphdata.json');
const C_SRC     = path.join(__dirname, 'main.c');
const C_EXE     = path.join(__dirname, 'main.exe');

// ─── JavaScript Fallback Algorithms ──────────────────────────────────────────
function jsBFS(users, adjMatrix, startIdx) {
    const visited = new Array(users.length).fill(false);
    const queue = [startIdx];
    visited[startIdx] = true;
    const result = [];

    while (queue.length > 0) {
        const u = queue.shift();
        result.push(users[u]);
        for (let v = 0; v < users.length; v++) {
            if (adjMatrix[u][v] && !visited[v]) {
                visited[v] = true;
                queue.push(v);
            }
        }
    }
    return result.join(' ');
}

function jsDFSUtil(users, adjMatrix, u, visited, result) {
    visited[u] = true;
    result.push(users[u]);
    for (let v = 0; v < users.length; v++) {
        if (adjMatrix[u][v] && !visited[v]) {
            jsDFSUtil(users, adjMatrix, v, visited, result);
        }
    }
}

function jsDFS(users, adjMatrix, startIdx) {
    const visited = new Array(users.length).fill(false);
    const result = [];
    jsDFSUtil(users, adjMatrix, startIdx, visited, result);
    return result.join(' ');
}

function jsSuggestFriends(users, adjMatrix, userIdx) {
    const suggestions = [];
    for (let i = 0; i < users.length; i++) {
        if (i === userIdx || adjMatrix[userIdx][i]) continue;
        for (let j = 0; j < users.length; j++) {
            if (adjMatrix[userIdx][j] && adjMatrix[i][j]) {
                suggestions.push(users[i]);
                break;
            }
        }
    }
    return suggestions.length > 0 ? suggestions.join(' ') : 'None';
}

function buildAdjMatrix(users, connections) {
    const n = users.length;
    const adj = Array.from({ length: n }, () => new Array(n).fill(0));
    connections.forEach(c => {
        const u = users.indexOf(c.from);
        const v = users.indexOf(c.to);
        if (u !== -1 && v !== -1) {
            adj[u][v] = 1;
            adj[v][u] = 1;
        }
    });
    return adj;
}

// ─── Home Route ───────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ─── POST /build-graph ────────────────────────────────────────────────────────
app.post('/build-graph', (req, res) => {
    console.log('[POST /build-graph] Body:', JSON.stringify(req.body));

    const { users, connections } = req.body;
    
    if (!users || !Array.isArray(users) || users.length === 0) {
        return res.status(400).json({ success: false, error: 'Invalid graph data. Provide a users array.' });
    }

    if (!connections || !Array.isArray(connections) || connections.length === 0) {
        return res.status(400).json({ success: false, error: 'Please add at least one connection.' });
    }

    try {
        const graphData = { users, connections };
        fs.writeFileSync(DATA_FILE, JSON.stringify(graphData, null, 2));
        console.log('[POST /build-graph] graphdata.json saved:', graphData);
        res.json({ 
            success: true, 
            message: 'Graph built successfully!',
            users: users,
            connections: connections
        });
    } catch (err) {
        console.error('[POST /build-graph] File write error:', err.message);
        res.status(500).json({ success: false, error: 'Failed to save graph data.' });
    }
});

// ─── POST /suggest-friends ────────────────────────────────────────────────────
app.post('/suggest-friends', (req, res) => {
    console.log('[POST /suggest-friends] Body:', JSON.stringify(req.body));

    const { userName } = req.body;
    if (!userName) {
        return res.status(400).json({ success: false, error: 'userName is required.' });
    }

    if (!fs.existsSync(DATA_FILE)) {
        return res.status(400).json({ success: false, error: 'No graph data found. Build the graph first.' });
    }

    let graphData;
    try {
        graphData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (e) {
        console.error('[POST /suggest-friends] JSON parse error:', e.message);
        return res.status(500).json({ success: false, error: 'graphdata.json is corrupted.' });
    }

    const { users, connections } = graphData;
    const userIdx = users.indexOf(userName);
    if (userIdx === -1) {
        return res.status(400).json({ success: false, error: `User "${userName}" not found in graph.` });
    }

    // Helper to use JS fallback algorithms
    const useJSAlgorithms = () => {
        console.log('[POST /suggest-friends] Using JavaScript fallback algorithms.');
        const adj = buildAdjMatrix(users, connections);
        const bfs = jsBFS(users, adj, userIdx) || 'None';
        const dfs = jsDFS(users, adj, userIdx) || 'None';
        const suggestions = jsSuggestFriends(users, adj, userIdx) || 'None';
        
        console.log('[POST /suggest-friends] JS Results - BFS:', bfs, 'DFS:', dfs, 'Suggestions:', suggestions);
        
        return { bfs, dfs, suggestions };
    };

    // Helper to run C program and parse output
    const runWithC = (callback) => {
        const nameArgs  = users.map(u => `"${u}"`).join(' ');
        const numEdges  = connections.length;
        const edgeArgs  = connections.map(c => `${users.indexOf(c.from)} ${users.indexOf(c.to)}`).join(' ');
        const runCmd    = `"${C_EXE}" ${users.length} ${userIdx} ${nameArgs} ${numEdges} ${edgeArgs}`;

        console.log('[POST /suggest-friends] Running C program:', runCmd);
        exec(runCmd, (err, stdout, stderr) => {
            if (err) {
                console.warn('[POST /suggest-friends] C execution failed, using JS fallback:', stderr || err.message);
                callback(null); // signal fallback
            } else {
                console.log('[POST /suggest-friends] C output:\n', stdout);
                callback(stdout);
            }
        });
    };

    // Helper to parse C output
    const parseOrFallback = (stdout) => {
        if (stdout && stdout.trim()) {
            // Parse C program output
            const results = { bfs: 'None', dfs: 'None', suggestions: 'None' };
            stdout.split('\n').forEach(line => {
                const trimmed = line.trim();
                if (trimmed.startsWith('BFS:')) {
                    results.bfs = trimmed.replace('BFS:', '').trim() || 'None';
                }
                if (trimmed.startsWith('DFS:')) {
                    results.dfs = trimmed.replace('DFS:', '').trim() || 'None';
                }
                if (trimmed.startsWith('SUGGESTIONS:')) {
                    results.suggestions = trimmed.replace('SUGGESTIONS:', '').trim() || 'None';
                }
            });
            
            console.log('[POST /suggest-friends] Parsed C Results - BFS:', results.bfs, 'DFS:', results.dfs, 'Suggestions:', results.suggestions);
            
            // Ensure results are not empty
            if (results.bfs === 'None' || results.bfs === '') results.bfs = 'None';
            if (results.dfs === 'None' || results.dfs === '') results.dfs = 'None';
            if (results.suggestions === 'None' || results.suggestions === '') results.suggestions = 'None';
            
            return results;
        } else {
            // Use JS fallback
            return useJSAlgorithms();
        }
    };

    if (fs.existsSync(C_EXE)) {
        // EXE exists — run it directly
        runWithC(stdout => {
            const results = parseOrFallback(stdout);
            res.json({ success: true, ...results });
        });
    } else {
        // Try compiling first
        console.log('[POST /suggest-friends] main.exe not found, attempting compile...');
        exec(`gcc "${C_SRC}" -o "${C_EXE}"`, (compileErr, _, compileStderr) => {
            if (compileErr) {
                console.warn('[POST /suggest-friends] GCC not available, using JS fallback.', compileStderr);
                const results = useJSAlgorithms();
                return res.json({ success: true, note: 'GCC not found — used JS algorithms', ...results });
            }

            console.log('[POST /suggest-friends] Compile OK, running...');
            runWithC(stdout => {
                const results = parseOrFallback(stdout);
                res.json({ success: true, ...results });
            });
        });
    }
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n✅ Server running at http://localhost:${PORT}`);
    console.log(`   Open your browser: http://localhost:${PORT}\n`);
});
