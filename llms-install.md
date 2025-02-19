# LLM Installation Guide for mcp-ragdocs

This guide provides step-by-step instructions for AI agents to install and configure the mcp-ragdocs server.

## Prerequisites Check

1. Check Node.js version (must be 16 or higher):
```bash
node -v
```

2. Check if Docker is installed:
```bash
docker --version
```

3. Check if Ollama is installed:
```bash
ollama --version
```

## Installation Steps

1. Install the package globally:
```bash
npm install -g @qpd-v/mcp-server-ragdocs
```

2. Verify global installation:
```bash
npm list -g @qpd-v/mcp-server-ragdocs
```

3. Start Qdrant using Docker:
```bash
docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant
```

4. Verify Qdrant is running:
```bash
curl http://localhost:6333/collections
```
Expected response: A JSON object with collections data

5. Pull the required Ollama model:
```bash
ollama pull nomic-embed-text
```

6. Verify Ollama model is available:
```bash
ollama list | grep nomic-embed-text
```

## Configuration

### Configuration File Paths
- Cline: `%AppData%\Roaming\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`
- Roo-Code: `%AppData%\Roaming\Code\User\globalStorage\rooveterinaryinc.roo-cline\settings\cline_mcp_settings.json`
- Claude Desktop: `%AppData%\Claude\claude_desktop_config.json`

### Configuration Content
Add this configuration to the appropriate file(s):

```json
{
  "mcpServers": {
    "ragdocs": {
      "command": "node",
      "args": ["C:/Users/YOUR_USERNAME/AppData/Roaming/npm/node_modules/@qpd-v/mcp-server-ragdocs/build/index.js"],
      "env": {
        "QDRANT_URL": "http://127.0.0.1:6333",
        "EMBEDDING_PROVIDER": "ollama",
        "OLLAMA_URL": "http://localhost:11434"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

## Verification Steps

1. Check Qdrant Status:
```bash
curl http://localhost:6333/collections
```
Expected: Should return a JSON response without errors

2. Check Ollama Status:
```bash
ollama list
```
Expected: Should show nomic-embed-text in the list

3. Test Configuration:
Add a test documentation URL:
```
Add this documentation: https://docs.qdrant.tech/
```
Expected: Should successfully add the documentation

4. Test Search:
```
Search the documentation for "what is Qdrant?"
```
Expected: Should return relevant results from the added documentation

## Troubleshooting Checks

If installation fails, verify:

1. Node.js Installation:
```bash
node -v
npm -v
```

2. Docker Status:
```bash
docker ps | grep qdrant
```

3. Ollama Status:
```bash
ollama list
```

4. Configuration File:
- Check if the configuration file exists
- Verify the paths are correct for your system
- Ensure JSON syntax is valid

## Common Error Solutions

1. Qdrant Connection Error:
```bash
docker restart $(docker ps -q --filter ancestor=qdrant/qdrant)
```

2. Ollama Model Missing:
```bash
ollama pull nomic-embed-text
```

3. npm Global Install Error:
```bash
npm cache clean --force
npm install -g @qpd-v/mcp-server-ragdocs
```

4. Path Issues:
- Replace `YOUR_USERNAME` with actual Windows username
- Use correct path separators (`/` for npm paths, `\\` for Windows paths)
