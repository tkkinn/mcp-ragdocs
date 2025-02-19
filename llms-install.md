---
mcp_server_name: ragdocs
runtime: nodejs
capabilities:
  tools:
    - add_documentation
    - search_documentation
    - list_sources
dependencies:
  docker: required
  nodejs: ">=16"
  npm: required
  ollama: required
---

# LLM Installation Guide for mcp-ragdocs

This guide provides step-by-step instructions for AI agents to install and configure the mcp-ragdocs server.

## Prerequisites Check

1. **Node.js:**
   ```bash
   node -v
   ```
   *Expected Output:* Version 16 or higher (e.g., `v16.0.0`)
   *Validation:* Output version number must be >= 16.0.0

2. **Docker:**
   ```bash
   docker --version
   ```
   *Expected Output:* Docker version information (e.g., `Docker version 24.0.0`)
   *Validation:* Command should return version without error

3. **Ollama:**
   ```bash
   ollama --version
   ```
   *Expected Output:* Ollama version information
   *Validation:* Command should return version without error

4. **npm:**
   ```bash
   npm -v
   ```
   *Expected Output:* npm version information
   *Validation:* Command should return version without error

## Installation Steps

1. **Install Package:**
   ```bash
   npm install -g @qpd-v/mcp-server-ragdocs
   ```
   *Expected Output:* Success message indicating package was added
   *Validation:* No error messages, package added to global modules

2. **Verify Global Installation:**
   ```bash
   npm list -g @qpd-v/mcp-server-ragdocs
   ```
   *Expected Output:* Should show @qpd-v/mcp-server-ragdocs@<version>
   *Validation:* Package is listed in global modules

3. **Start Qdrant:**
   ```bash
   docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant
   ```
   *Expected Output:* Qdrant startup messages, including "Access web UI at http://localhost:6333/dashboard"
   *Validation:* Server starts without errors, ports 6333 and 6334 are bound

4. **Verify Qdrant:**
   ```bash
   curl http://localhost:6333/collections
   ```
   *Expected Output:* HTTP 200 status code with JSON response: `{"result":{"collections":[]}}`
   *Validation:* Response is valid JSON and includes "collections" key

5. **Install Ollama Model:**
   ```bash
   ollama pull nomic-embed-text
   ```
   *Expected Output:* Download progress followed by completion message
   *Validation:* Model is downloaded without errors

6. **Verify Ollama Model:**
   ```bash
   ollama list | grep nomic-embed-text
   ```
   *Expected Output:* Line containing "nomic-embed-text" with size and modification date
   *Validation:* Model is listed in available models

## Configuration

### Configuration File Paths
**Select the appropriate path based on your environment:**

1. **Cline:**
   ```
   %AppData%\Roaming\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json
   ```
   *Validation:* File should exist and be writable

2. **Roo-Code:**
   ```
   %AppData%\Roaming\Code\User\globalStorage\rooveterinaryinc.roo-cline\settings\cline_mcp_settings.json
   ```
   *Validation:* File should exist and be writable

3. **Claude Desktop:**
   ```
   %AppData%\Claude\claude_desktop_config.json
   ```
   *Validation:* File should exist and be writable

### Configuration Content
Add this configuration to the selected file(s):

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
*Required Actions:*
1. Replace `YOUR_USERNAME` with actual Windows username
2. Ensure `disabled` is set to `false`
3. Ensure `autoApprove` is set to `[]`
*Validation:* JSON should be valid and parseable

## Verification Steps

1. **Verify Qdrant API:**
   ```bash
   curl http://localhost:6333/collections
   ```
   *Expected Output:* HTTP 200 status code with JSON response: `{"result":{"collections":[]}}`
   *Validation:* Response is valid JSON and service is responsive

2. **Verify Ollama Service:**
   ```bash
   ollama list
   ```
   *Expected Output:* List including "nomic-embed-text" entry
   *Validation:* Model is available and service is running

3. **Test Documentation Import:**
   ```
   Add this documentation: https://docs.qdrant.tech/
   ```
   *Expected Output:* Success message indicating documentation was added
   *Validation:* Documentation appears in sources list

4. **Test Search Functionality:**
   ```
   Search the documentation for "what is Qdrant?"
   ```
   *Expected Output:* Relevant search results from the added documentation
   *Validation:* Results contain information about Qdrant

## Troubleshooting Guide

### Diagnostic Checks

1. **Verify Node.js Environment:**
   ```bash
   node -v && npm -v
   ```
   *Expected Output:* Two version numbers (Node.js >= 16.0.0)
   *Validation:* Both commands return version numbers without errors
   *Resolution if Failed:* Reinstall Node.js from nodejs.org

2. **Check Docker Container:**
   ```bash
   docker ps | grep qdrant
   ```
   *Expected Output:* Line containing "qdrant/qdrant" with port mappings
   *Validation:* Container is running and ports are mapped correctly
   *Resolution if Failed:* Run `docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant`

3. **Verify Ollama Service:**
   ```bash
   ollama list
   ```
   *Expected Output:* List of models including nomic-embed-text
   *Validation:* Service is running and model is available
   *Resolution if Failed:* Run `ollama pull nomic-embed-text`

4. **Check Configuration Files:**
   ```bash
   # For each config file path
   cat "<CONFIG_FILE_PATH>"
   ```
   *Expected Output:* Valid JSON with ragdocs configuration
   *Validation:* JSON is valid and contains required fields
   *Resolution if Failed:* Copy configuration template from above

### Common Error Solutions

1. **Qdrant Connection Error:**
   ```bash
   docker restart $(docker ps -q --filter ancestor=qdrant/qdrant)
   ```
   *Expected Output:* Container ID
   *Validation:* Qdrant service becomes available at http://localhost:6333

2. **Ollama Model Missing:**
   ```bash
   ollama pull nomic-embed-text
   ```
   *Expected Output:* Download progress and completion message
   *Validation:* Model appears in `ollama list` output

3. **npm Global Install Error:**
   ```bash
   npm cache clean --force && npm install -g @qpd-v/mcp-server-ragdocs
   ```
   *Expected Output:* Success message from npm install
   *Validation:* Package appears in `npm list -g`

4. **Path Resolution Issues:**
   - Windows Username: Replace `YOUR_USERNAME` with output of `echo %USERNAME%`
   - Path Separators: Use `/` for npm paths in configuration
   - Verify paths exist: Check each directory in the path exists
