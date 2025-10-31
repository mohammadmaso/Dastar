{
  "mcpServers": {
    "ai-elements": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://registry.ai-sdk.dev/api/mcp"
      ]
    }
  }
}




{
  "mcpServers": {
    "mastra": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@mastra/mcp-docs-server"]
    }
  }
}

claude mcp add mastra -- npx -y @mastra/mcp-docs-server



claude mcp add --transport http context7 https://mcp.context7.com/mcp --header "CONTEXT7_API_KEY: ctx7sk-7d5f23ab-be00-4744-9c03-c60e1b68f2b0"