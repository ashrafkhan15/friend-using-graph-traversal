#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_USERS 10
#define MAX_NAME_LEN 50

typedef struct {
    int adj[MAX_USERS][MAX_USERS];
    char names[MAX_USERS][MAX_NAME_LEN];
    int n;
} Graph;

void initGraph(Graph *g, int n) {
    g->n = (n > MAX_USERS) ? MAX_USERS : n;
    for (int i = 0; i < g->n; i++) {
        for (int j = 0; j < g->n; j++) {
            g->adj[i][j] = 0;
        }
    }
}

void addEdge(Graph *g, int u, int v) {
    if (u >= 0 && u < g->n && v >= 0 && v < g->n) {
        g->adj[u][v] = 1;
        g->adj[v][u] = 1;
    }
}

void BFS(Graph *g, int start) {
    int visited[MAX_USERS] = {0};
    int queue[MAX_USERS], f = 0, r = 0;
    int count = 0;
    
    visited[start] = 1;
    queue[r++] = start;
    
    printf("BFS:");
    while (f < r) {
        int u = queue[f++];
        if (count > 0) printf(" ");
        printf("%s", g->names[u]);
        count++;
        
        for (int v = 0; v < g->n; v++) {
            if (g->adj[u][v] && !visited[v]) {
                visited[v] = 1;
                queue[r++] = v;
            }
        }
    }
    if (count == 0) printf("None");
    printf("\n");
}

void DFSUtil(Graph *g, int u, int visited[], int *count) {
    visited[u] = 1;
    if (*count > 0) printf(" ");
    printf("%s", g->names[u]);
    (*count)++;
    
    for (int v = 0; v < g->n; v++) {
        if (g->adj[u][v] && !visited[v]) {
            DFSUtil(g, v, visited, count);
        }
    }
}

void DFS(Graph *g, int start) {
    int visited[MAX_USERS] = {0};
    int count = 0;
    
    printf("DFS:");
    DFSUtil(g, start, visited, &count);
    if (count == 0) printf("None");
    printf("\n");
}

void suggestFriends(Graph *g, int userIdx) {
    printf("SUGGESTIONS:");
    int found = 0;
    int suggested[MAX_USERS] = {0};

    // Suggest 'i' if 'i' is not already a friend of 'userIdx' 
    // AND they share at least one common friend 'j'.
    for (int i = 0; i < g->n; i++) {
        if (i == userIdx || g->adj[userIdx][i]) continue;
        
        for (int j = 0; j < g->n; j++) {
            if (g->adj[userIdx][j] && g->adj[i][j]) {
                if (!suggested[i]) {
                    if (found > 0) printf(" ");
                    printf("%s", g->names[i]);
                    suggested[i] = 1;
                    found = 1;
                }
                break;
            }
        }
    }
    
    if (!found) printf("None");
    printf("\n");
}

int main(int argc, char *argv[]) {
    // Expected arguments: numUsers userIdx [names...] numEdges [edge pairs...]
    if (argc < 4) {
        fprintf(stderr, "Insufficient arguments\n");
        return 1;
    }
    
    int n = atoi(argv[1]);
    int userIdx = atoi(argv[2]);
    
    Graph g;
    initGraph(&g, n);
    
    int argIdx = 3;
    for (int i = 0; i < n; i++) {
        if (argIdx < argc) {
            strncpy(g.names[i], argv[argIdx++], MAX_NAME_LEN - 1);
            g.names[i][MAX_NAME_LEN - 1] = '\0';
        }
    }
    
    if (argIdx < argc) {
        int edges = atoi(argv[argIdx++]);
        for (int i = 0; i < edges; i++) {
            if (argIdx + 1 < argc) {
                int u = atoi(argv[argIdx++]);
                int v = atoi(argv[argIdx++]);
                addEdge(&g, u, v);
            }
        }
    }
    
    BFS(&g, userIdx);
    DFS(&g, userIdx);
    suggestFriends(&g, userIdx);
    
    return 0;
}
