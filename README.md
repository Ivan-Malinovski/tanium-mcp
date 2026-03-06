# Tanium MCP Server

MCP (Model Context Protocol) server for Tanium endpoint management, compatible with Microsoft Copilot Studio.

## Features

### Endpoint Management
- **List sensors** - View available Tanium sensors
- **Get endpoints** - List all managed endpoints with basic info (IP, hostname, manufacturer, model)
- **Get computer groups** - View endpoint groupings
- **Find endpoints** - Search by computer name, IP address, username, or installed software
- **Get endpoint details** - Full details including installed software

### Package Management (Deploy)
- **List packages** - Browse Tanium Deploy packages
- **Get package details** - View package commands and parameters
- **Get software versions** - Find all versions of software across endpoints (e.g., "how many endpoints have old Notepad++?")

## Supported URL Formats

```bash
# Just company name
simcorp

# With or without https://
https://simcorp-api.cloud.tanium.com
simcorp-api.cloud.tanium.com

# Full URL (as-is)
https://simcorp-api.cloud.tanium.com/plugin/products/gateway/graphql
```

## Usage

### Local Development
```bash
npm install
npm start
```

### Docker
```bash
# Build
docker build -t tanium-mcp .

# Run with environment variable
docker run -p 3000:3000 -e TANIUM_API_URL=simcorp tanium-mcp

# Or with full URL
docker run -p 3000:3000 -e TANIUM_API_URL=https://simcorp-api.cloud.tanium.com tanium-mcp
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TANIUM_API_URL` | Tanium API URL (see formats above) | `https://simcorp-api.cloud.tanium.com/plugin/products/gateway/graphql` |
| `PORT` | HTTP server port | `3000` |

## API

The server exposes an MCP endpoint at `/mcp` that accepts JSON-RPC 2.0 requests.

### Authentication
Bearer token in the `Authorization` header:
```
Authorization: Bearer <your-token>
```

### Example Request
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "tanium_list_sensors",
    "arguments": { "first": 10 }
  },
  "id": 1
}
```

## Deployment

### Azure Container Apps
```bash
az containerapp up -n tanium-mcp --source .
```

### Swagger / Copilot Studio
Import `swagger.yaml` into Copilot Studio to register the MCP server.

## Tools

| Tool | Description |
|------|-------------|
| `tanium_list_sensors` | List available sensors |
| `tanium_get_endpoints` | Get all endpoints |
| `tanium_get_computer_groups` | Get computer groups |
| `tanium_find_endpoints_by_user` | Find by logged-in user |
| `tanium_find_endpoints_by_software` | Find by installed software |
| `tanium_find_endpoints_by_computer_name` | Find by hostname |
| `tanium_find_endpoints_by_ip` | Find by IP address |
| `tanium_get_endpoint_details` | Get full endpoint info |
| `tanium_list_packages` | List Deploy packages |
| `tanium_get_package_details` | Get package details |
| `tanium_get_software_versions` | Get software versions across endpoints |
