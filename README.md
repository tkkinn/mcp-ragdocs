# mcp-server-ragdocs

A Model Context Protocol (MCP) server that enables semantic search and retrieval of documentation using a vector database (Qdrant). This server allows you to add documentation from URLs or local files and then search through them using natural language queries.

## Version

Current version: 0.1.3

## Features

- Add documentation from URLs or local files
- Store documentation in a vector database for semantic search
- Search through documentation using natural language
- List all documentation sources

## Installation

You can use this server directly with `npx`:

```bash
npx -y @qpd-v/mcp-server-ragdocs
```

Or install it globally:

```bash
npm install -g @qpd-v/mcp-server-ragdocs
```

## Requirements

- Node.js 16 or higher
- Qdrant running locally (see [Qdrant Installation](#qdrant-installation))
- OpenAI API key for generating embeddings

## Qdrant Installation

1. Using Docker (recommended):
```bash
docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant
```

2. Or download from [Qdrant's website](https://qdrant.tech/documentation/quick-start/)

## Configuration

### Claude Desktop

Add this to your Claude Desktop configuration file:

Windows: `%AppData%\Claude\claude_desktop_config.json`
macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "ragdocs": {
      "command": "npx",
      "args": ["-y", "@qpd-v/mcp-server-ragdocs"],
      "env": {
        "OPENAI_API_KEY": "your-openai-api-key",
        "QDRANT_URL": "http://localhost:6333"
      }
    }
  }
}
```

### Environment Variables

- `OPENAI_API_KEY` (required): Your OpenAI API key for generating embeddings
- `QDRANT_URL` (optional): URL of your Qdrant instance (defaults to http://localhost:6333)

## Available Tools

1. `add_documentation`
   - Add documentation from a URL to the RAG database
   - Parameters:
     - `url`: URL of the documentation to fetch

2. `search_documentation`
   - Search through stored documentation
   - Parameters:
     - `query`: Search query
     - `limit` (optional): Maximum number of results to return (default: 5)

3. `list_sources`
   - List all documentation sources currently stored
   - No parameters required

## Example Usage

In Claude Desktop or any other MCP-compatible client:

1. Add documentation:
```
Add this documentation: https://docs.example.com/api
```

2. Search documentation:
```
Search the documentation for information about authentication
```

3. List sources:
```
What documentation sources are available?
```

## Development

1. Clone the repository:
```bash
git clone https://github.com/qpd-v/mcp-server-ragdocs.git
cd mcp-server-ragdocs
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Run locally:
```bash
npm start
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
