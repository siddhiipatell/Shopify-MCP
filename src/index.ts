#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from "dotenv";
import { GraphQLClient } from "graphql-request";
import minimist from "minimist";
import { z } from "zod";

// Import tools
import { getProductById } from "./tools/getProductById.js";
import { getProducts } from "./tools/getProducts.js";
import { getCollections } from "./tools/getCollections.js";
import { getPages } from "./tools/getPages.js";
import { getBlogs } from "./tools/getBlogs.js";
import { getArticles } from "./tools/getArticles.js";
import { getBlogById } from "./tools/getBlogById.js";
import { getArticleById } from "./tools/getArticleById.js";
import { searchShopify } from "./tools/searchShopify.js";
import getOrders from "./tools/getOrders.js";
import { getOrderById } from "./tools/getOrderById.js";

// Parse command line arguments
const argv = minimist(process.argv.slice(2));

// Load environment variables from .env file (if it exists)
dotenv.config();

// Define environment variables - from command line or .env file
const SHOPIFY_ACCESS_TOKEN =
  argv.accessToken || process.env.SHOPIFY_ACCESS_TOKEN;
const MYSHOPIFY_DOMAIN = argv.domain || process.env.MYSHOPIFY_DOMAIN;

// Store in process.env for backwards compatibility
process.env.SHOPIFY_ACCESS_TOKEN = SHOPIFY_ACCESS_TOKEN;
process.env.MYSHOPIFY_DOMAIN = MYSHOPIFY_DOMAIN;

// Validate required environment variables
if (!SHOPIFY_ACCESS_TOKEN) {
  console.error("Error: SHOPIFY_ACCESS_TOKEN is required.");
  console.error("Please provide it via command line argument or .env file.");
  console.error("  Command line: --accessToken=your_token");
  process.exit(1);
}

if (!MYSHOPIFY_DOMAIN) {
  console.error("Error: MYSHOPIFY_DOMAIN is required.");
  console.error("Please provide it via command line argument or .env file.");
  console.error("  Command line: --domain=your-store.myshopify.com");
  process.exit(1);
}

// Create Shopify GraphQL client
const shopifyClient = new GraphQLClient(
  `https://${MYSHOPIFY_DOMAIN}/admin/api/2025-01/graphql.json`,
  {
    headers: {
      "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
      "Content-Type": "application/json"
    }
  }
);

// Initialize tools with GraphQL client
getProducts.initialize(shopifyClient);
getProductById.initialize(shopifyClient);
getCollections.initialize(shopifyClient);
getPages.initialize(shopifyClient);
getBlogs.initialize(shopifyClient);
getArticles.initialize(shopifyClient);
getBlogById.initialize(shopifyClient);
getArticleById.initialize(shopifyClient);
searchShopify.initialize(shopifyClient);
getOrders.initialize(shopifyClient);
getOrderById.initialize(shopifyClient);

// Set up MCP server
const server = new McpServer({
  name: "shopify",
  version: "1.0.0",
  description:
    "MCP Server for Shopify API, enabling interaction with store data through GraphQL API"
});

// Add tools individually, using their schemas directly
server.tool(
  "get-products",
  {
    searchTitle: z.string().optional(),
    limit: z.number().default(10),
    after: z.string().optional(),
    before: z.string().optional(),
    reverse: z.boolean().optional().default(false)
  },
  async (args) => {
    const result = await getProducts.execute(args);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }]
    };
  }
);

server.tool(
  "get-product-by-id",
  {
    productId: z.string().min(1)
  },
  async (args) => {
    const result = await getProductById.execute(args);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }]
    };
  }
);

server.tool(
  "get-collections",
  {
    searchTitle: z.string().optional(),
    limit: z.number().default(10)
  },
  async (args) => {
    const result = await getCollections.execute(args);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }]
    };
  }
);

// Add the getPages tool
server.tool(
  "get-pages",
  {
    searchTitle: z.string().optional(),
    limit: z.number().default(10)
  },
  async (args) => {
    const result = await getPages.execute(args);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }]
    };
  }
);

// Add the getBlogs tool
server.tool(
  "get-blogs",
  {
    searchTitle: z.string().optional(),
    limit: z.number().default(10)
  },
  async (args) => {
    const result = await getBlogs.execute(args);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }]
    };
  }
);

// Add the getArticles tool
server.tool(
  "get-articles",
  {
    blogId: z.string().min(1).describe("The GID of the blog to get articles from (e.g., \"gid://shopify/Blog/1234567890\")"),
    searchTitle: z.string().optional(),
    limit: z.number().default(10)
  },
  async (args) => {
    const result = await getArticles.execute(args);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }]
    };
  }
);

// Register new tools
server.tool(
  "get-blog-by-id",
  getBlogById.schema.shape,
  async (args: z.infer<typeof getBlogById.schema>) => {
    const result = await getBlogById.execute(args);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }]
    };
  }
);

server.tool(
  "get-article-by-id",
  getArticleById.schema.shape,
  async (args: z.infer<typeof getArticleById.schema>) => {
    const result = await getArticleById.execute(args);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }]
    };
  }
);

server.tool(
  "search-shopify",
  searchShopify.schema.shape,
  async (args: z.infer<typeof searchShopify.schema>) => {
    const result = await searchShopify.execute(args);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }]
    };
  }
);

server.tool(
  "get-orders",
  {
    query: z.string().optional(),
    limit: z.number().default(10),
    after: z.string().optional(),
    before: z.string().optional(),
    reverse: z.boolean().optional().default(false),
    sortKey: z.enum(["CREATED_AT", "CUSTOMER_NAME", "ID", "ORDER_NUMBER", "PROCESSED_AT", "TOTAL_PRICE", "UPDATED_AT"]).optional().default("PROCESSED_AT")
  },
  async (args) => {
    const result = await getOrders.execute(args);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }]
    };
  }
);

server.tool(
  "get-order-by-id",
  getOrderById.schema.shape,
  async (args: z.infer<typeof getOrderById.schema>) => {
    const result = await getOrderById.execute(args);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }]
    };
  }
);

// Start the server
const transport = new StdioServerTransport();
server
  .connect(transport)
  .then(() => {})
  .catch((error: unknown) => {
    console.error("Failed to start Shopify MCP Server:", error);
  });
