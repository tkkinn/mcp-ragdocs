#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { QdrantClient } from '@qdrant/js-client-rest';
import { chromium } from 'playwright';
import OpenAI from 'openai';
import * as cheerio from 'cheerio';
import axios from 'axios';
import crypto from 'crypto';

// Environment variables for configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6334';
const COLLECTION_NAME = 'documentation';

interface DocumentChunk {
  text: string;
  url: string;
  title: string;
  timestamp: string;
}

interface DocumentPayload extends DocumentChunk {
  _type: 'DocumentChunk';
  [key: string]: unknown;
}

function isDocumentPayload(payload: unknown): payload is DocumentPayload {
  if (!payload || typeof payload !== 'object') return false;
  const p = payload as Partial<DocumentPayload>;
  return (
    p._type === 'DocumentChunk' &&
    typeof p.text === 'string' &&
    typeof p.url === 'string' &&
    typeof p.title === 'string' &&
    typeof p.timestamp === 'string'
  );
}

class RagDocsServer {
  private server: Server;
  private qdrantClient: QdrantClient;
  private openaiClient?: OpenAI;
  private browser: any;

  constructor() {
    this.server = new Server(
      {
        name: 'mcp-ragdocs',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize Qdrant client
    this.qdrantClient = new QdrantClient({ url: QDRANT_URL });

    // Initialize OpenAI client if API key is provided
    if (OPENAI_API_KEY) {
      this.openaiClient = new OpenAI({
        apiKey: OPENAI_API_KEY,
      });
    }

    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.cleanup();
      process.exit(0);
    });
  }

  private async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
    await this.server.close();
  }

  private async initBrowser() {
    if (!this.browser) {
      this.browser = await chromium.launch();
    }
  }

  private async getEmbeddings(text: string): Promise<number[]> {
    if (!this.openaiClient) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'OpenAI API key not configured'
      );
    }

    try {
      const response = await this.openaiClient.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to generate embeddings: ${error}`
      );
    }
  }

  private async initCollection() {
    try {
      const collections = await this.qdrantClient.getCollections();
      const exists = collections.collections.some(c => c.name === COLLECTION_NAME);

      if (!exists) {
        await this.qdrantClient.createCollection(COLLECTION_NAME, {
          vectors: {
            size: 1536, // OpenAI ada-002 embedding size
            distance: 'Cosine',
          },
        });
      }
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to initialize Qdrant collection: ${error}`
      );
    }
  }

  private async fetchAndProcessUrl(url: string): Promise<DocumentChunk[]> {
    await this.initBrowser();
    const page = await this.browser.newPage();
    
    try {
      await page.goto(url, { waitUntil: 'networkidle' });
      const content = await page.content();
      const $ = cheerio.load(content);
      
      // Remove script tags, style tags, and comments
      $('script').remove();
      $('style').remove();
      $('noscript').remove();
      
      // Extract main content
      const title = $('title').text() || url;
      const mainContent = $('main, article, .content, .documentation, body').text();
      
      // Split content into chunks
      const chunks = this.chunkText(mainContent, 1000);
      
      return chunks.map(chunk => ({
        text: chunk,
        url,
        title,
        timestamp: new Date().toISOString(),
      }));
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to fetch URL ${url}: ${error}`
      );
    } finally {
      await page.close();
    }
  }

  private chunkText(text: string, maxChunkSize: number): string[] {
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    let currentChunk: string[] = [];
    
    for (const word of words) {
      currentChunk.push(word);
      const currentLength = currentChunk.join(' ').length;
      
      if (currentLength >= maxChunkSize) {
        chunks.push(currentChunk.join(' '));
        currentChunk = [];
      }
    }
    
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
    }
    
    return chunks;
  }

  private generatePointId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'add_documentation',
          description: 'Add documentation from a URL to the RAG database',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'URL of the documentation to fetch',
              },
            },
            required: ['url'],
          },
        },
        {
          name: 'search_documentation',
          description: 'Search through stored documentation',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query',
              },
              limit: {
                type: 'number',
                description: 'Maximum number of results to return',
                default: 5,
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'list_sources',
          description: 'List all documentation sources currently stored',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      await this.initCollection();

      switch (request.params.name) {
        case 'add_documentation':
          return this.handleAddDocumentation(request.params.arguments);
        case 'search_documentation':
          return this.handleSearchDocumentation(request.params.arguments);
        case 'list_sources':
          return this.handleListSources();
        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
      }
    });
  }

  private async handleAddDocumentation(args: any) {
    if (!args.url || typeof args.url !== 'string') {
      throw new McpError(ErrorCode.InvalidParams, 'URL is required');
    }

    try {
      const chunks = await this.fetchAndProcessUrl(args.url);
      
      for (const chunk of chunks) {
        const embedding = await this.getEmbeddings(chunk.text);
        const payload = {
          ...chunk,
          _type: 'DocumentChunk' as const,
        };
        
        await this.qdrantClient.upsert(COLLECTION_NAME, {
          wait: true,
          points: [
            {
              id: this.generatePointId(),
              vector: embedding,
              payload: payload as Record<string, unknown>,
            },
          ],
        });
      }

      return {
        content: [
          {
            type: 'text',
            text: `Successfully added documentation from ${args.url} (${chunks.length} chunks processed)`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to add documentation: ${error}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async handleSearchDocumentation(args: any) {
    if (!args.query || typeof args.query !== 'string') {
      throw new McpError(ErrorCode.InvalidParams, 'Query is required');
    }

    const limit = args.limit || 5;

    try {
      const queryEmbedding = await this.getEmbeddings(args.query);
      
      const searchResults = await this.qdrantClient.search(COLLECTION_NAME, {
        vector: queryEmbedding,
        limit,
        with_payload: true,
      });

      const formattedResults = searchResults.map(result => {
        if (!isDocumentPayload(result.payload)) {
          throw new Error('Invalid payload type');
        }
        return `[${result.payload.title}](${result.payload.url})\nScore: ${result.score}\nContent: ${result.payload.text}\n`;
      }).join('\n---\n');

      return {
        content: [
          {
            type: 'text',
            text: formattedResults || 'No results found.',
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Search failed: ${error}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async handleListSources() {
    try {
      const scroll = await this.qdrantClient.scroll(COLLECTION_NAME, {
        with_payload: true,
      });

      const sources = new Set<string>();
      for (const point of scroll.points) {
        if (isDocumentPayload(point.payload)) {
          sources.add(`${point.payload.title} (${point.payload.url})`);
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: Array.from(sources).join('\n') || 'No documentation sources found.',
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to list sources: ${error}`,
          },
        ],
        isError: true,
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('RAG Docs MCP server running on stdio');
  }
}

const server = new RagDocsServer();
server.run().catch(console.error);
