import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GraphQLClient, gql } from "graphql-request";

function parseTaniumUrl(input) {
  if (!input) return "https://<company>-api.cloud.tanium.com/plugin/products/gateway/graphql";
  
  let url = input.trim();
  
  if (!url.includes("://")) {
    url = "https://" + url;
  }
  
  if (!url.includes("/plugin/products/gateway")) {
    if (url.includes(".cloud.tanium.com")) {
      url = url.replace(/\/$/, "") + "/plugin/products/gateway/graphql";
    } else {
      url = url.replace(/\/$/, "") + ".cloud.tanium.com/plugin/products/gateway/graphql";
    }
  }
  
  return url;
}

let authToken = "";

function getClient(token) {
  const apiUrl = parseTaniumUrl(process.env.TANIUM_API_URL);
  return new GraphQLClient(apiUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

const server = new McpServer({
  name: "tanium-mcp",
  version: "1.0.0",
});

const sourceObj = { tds: { allNamespaces: false } };

const toolDefinitions = [
  {
    name: "tanium_list_sensors",
    description: "List available Tanium sensors with optional filtering.",
    inputSchema: {
      type: "object",
      properties: {
        filter: { type: "string", description: "Filter sensors by name" },
        first: { type: "number", description: "Number of results", default: 100 },
        includeHidden: { type: "boolean", description: "Include hidden sensors", default: false }
      }
    },
    callback: async (params) => {
      const client = getClient(authToken);
      const { filter, first = 100, includeHidden = false } = params;
      
      let result;
      if (filter) {
        const q = gql`query($f:String,$n:Int,$h:Boolean){sensors(filter:{text:$f},first:$n,includeHidden:$h){edges{node{name category description}} totalRecords}}`;
        result = (await client.request(q, { f: filter, n: first, h: includeHidden })).sensors;
      } else {
        const q = gql`query($n:Int){sensors(first:$n){edges{node{name category description}} totalRecords}}`;
        result = (await client.request(q, { n: first })).sensors;
      }
      
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  },
  {
    name: "tanium_get_endpoints",
    description: "Get Tanium endpoints (computers) with basic properties.",
    inputSchema: {
      type: "object",
      properties: {
        filter: { type: "string", description: "Filter by computer name" },
        first: { type: "number", description: "Number of results", default: 100 }
      }
    },
    callback: async (params) => {
      const client = getClient(authToken);
      const { filter, first = 100 } = params;
      
      let result;
      if (filter) {
        const q = gql`query($n:Int,$s:EndpointSource,$f:String){endpoints(first:$n,source:$s,filter:{path:"name",op:CONTAINS,value:$f}){edges{node{id name ipAddress manufacturer model}} totalRecords}}`;
        result = (await client.request(q, { n: first, s: sourceObj, f: filter })).endpoints;
      } else {
        const q = gql`query($n:Int,$s:EndpointSource){endpoints(first:$n,source:$s){edges{node{id name ipAddress manufacturer model}} totalRecords}}`;
        result = (await client.request(q, { n: first, s: sourceObj })).endpoints;
      }
      
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  },
  {
    name: "tanium_get_computer_groups",
    description: "Get Tanium computer groups.",
    inputSchema: {
      type: "object",
      properties: {
        first: { type: "number", description: "Number of results", default: 100 }
      }
    },
    callback: async (params) => {
      const client = getClient(authToken);
      const { first = 100 } = params;
      
      const q = gql`query($n:Int){computerGroups(first:$n){edges{node{id name expression}} totalRecords}}`;
      const result = (await client.request(q, { n: first })).computerGroups;
      
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  },
  {
    name: "tanium_find_endpoints_by_user",
    description: "Find endpoints where the last logged-in user contains the given name.",
    inputSchema: {
      type: "object",
      properties: {
        userName: { type: "string", description: "Username to search for" },
        first: { type: "number", description: "Number of results", default: 100 }
      },
      required: ["userName"]
    },
    callback: async (params) => {
      const client = getClient(authToken);
      const { userName, first = 100 } = params;
      
      const q = gql`query($n:Int,$s:EndpointSource,$sn:String!,$sv:String!){endpoints(first:$n,source:$s,filter:{sensor:{name:$sn},value:$sv,op:CONTAINS}){edges{node{id name ipAddress manufacturer model}} totalRecords}}`;
      const result = (await client.request(q, { n: first, s: sourceObj, sn: "Last Logged In User", sv: userName })).endpoints;
      
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  },
  {
    name: "tanium_find_endpoints_by_software",
    description: "Find endpoints that have the specified software installed.",
    inputSchema: {
      type: "object",
      properties: {
        softwareName: { type: "string", description: "Software name to search for" },
        first: { type: "number", description: "Number of results", default: 100 }
      },
      required: ["softwareName"]
    },
    callback: async (params) => {
      const client = getClient(authToken);
      const { softwareName, first = 100 } = params;
      
      const q = gql`query($n:Int,$s:EndpointSource,$sn:String!,$sv:String!){endpoints(first:$n,source:$s,filter:{sensor:{name:$sn},value:$sv,op:CONTAINS}){edges{node{id name ipAddress manufacturer model}} totalRecords}}`;
      const result = (await client.request(q, { n: first, s: sourceObj, sn: "Installed Applications", sv: softwareName })).endpoints;
      
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  },
  {
    name: "tanium_find_endpoints_by_computer_name",
    description: "Find endpoints by computer name (partial match).",
    inputSchema: {
      type: "object",
      properties: {
        computerName: { type: "string", description: "Computer name to search for" },
        first: { type: "number", description: "Number of results", default: 100 }
      },
      required: ["computerName"]
    },
    callback: async (params) => {
      const client = getClient(authToken);
      const { computerName, first = 100 } = params;
      
      const q = gql`query($n:Int,$s:EndpointSource,$f:String!){endpoints(first:$n,source:$s,filter:{path:"name",op:CONTAINS,value:$f}){edges{node{id name ipAddress manufacturer model}} totalRecords}}`;
      const result = (await client.request(q, { n: first, s: sourceObj, f: computerName })).endpoints;
      
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  },
  {
    name: "tanium_find_endpoints_by_ip",
    description: "Find endpoints by IP address (partial or full match).",
    inputSchema: {
      type: "object",
      properties: {
        ipAddress: { type: "string", description: "IP address to search for" },
        first: { type: "number", description: "Number of results", default: 100 }
      },
      required: ["ipAddress"]
    },
    callback: async (params) => {
      const client = getClient(authToken);
      const { ipAddress, first = 100 } = params;
      
      const q = gql`query($n:Int,$s:EndpointSource,$sn:String!,$sv:String!){endpoints(first:$n,source:$s,filter:{sensor:{name:$sn},value:$sv,op:CONTAINS}){edges{node{id name ipAddress manufacturer model}} totalRecords}}`;
      const result = (await client.request(q, { n: first, s: sourceObj, sn: "IP Address", sv: ipAddress })).endpoints;
      
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  },
  {
    name: "tanium_get_endpoint_details",
    description: "Get detailed information about a specific endpoint including installed software.",
    inputSchema: {
      type: "object",
      properties: {
        computerName: { type: "string", description: "Exact computer name to query" }
      },
      required: ["computerName"]
    },
    callback: async (params) => {
      const client = getClient(authToken);
      const { computerName } = params;
      
      const q = 'query{endpoints(first:1,source:{tds:{allNamespaces:false}},filter:{path:"name",op:EQ,value:"' + computerName + '"}){edges{node{id name ipAddress manufacturer model lastLoggedInUser installedApplications{name version}}}}}';
      const result = await client.request(q, { cn: computerName });
      const endpoint = result.endpoints.edges[0]?.node;
      
      return { content: [{ type: "text", text: JSON.stringify(endpoint, null, 2) }] };
    }
  },
  {
    name: "tanium_list_packages",
    description: "List Tanium Deploy packages with optional filtering.",
    inputSchema: {
      type: "object",
      properties: {
        filter: { type: "string", description: "Filter packages by name" },
        first: { type: "number", description: "Number of results", default: 20 }
      }
    },
    callback: async (params) => {
      const client = getClient(authToken);
      const { filter, first = 20 } = params;
      
      let q, variables;
      if (filter) {
        q = 'query($f:String,$n:Int){packageSpecs(first:$n,filter:{path:"name",op:CONTAINS,value:$f}){edges{node{id name command commandTimeoutSeconds}} totalRecords}}';
        variables = { f: filter, n: first };
      } else {
        q = 'query($n:Int){packageSpecs(first:$n){edges{node{id name command commandTimeoutSeconds}} totalRecords}}';
        variables = { n: first };
      }
      
      const result = await client.request(q, variables);
      
      return { content: [{ type: "text", text: JSON.stringify(result.packageSpecs, null, 2) }] };
    }
  },
  {
    name: "tanium_get_package_details",
    description: "Get detailed information about a specific Deploy package including all available versions.",
    inputSchema: {
      type: "object",
      properties: {
        packageId: { type: "string", description: "Package ID to query" },
        packageName: { type: "string", description: "Package name to query (alternative to packageId)" }
      }
    },
    callback: async (params) => {
      const client = getClient(authToken);
      const { packageId, packageName } = params;
      
      let q, variables;
      if (packageId) {
        q = 'query($id:ID!){packageSpec(id:$id){id name command commandTimeoutSeconds params{name type required defaultValue}}}';
        variables = { id: packageId };
      } else if (packageName) {
        q = 'query($n:String,$first:Int){packageSpecs(first:$first,filter:{path:"name",op:EQ,value:$n}){edges{node{id name command commandTimeoutSeconds params{name type required defaultValue}}}}}';
        variables = { n: packageName, first: 1 };
      } else {
        return { content: [{ type: "text", text: JSON.stringify({ error: "Either packageId or packageName required" })}] };
      }
      
      const result = await client.request(q, variables);
      const packageData = packageId ? result.packageSpec : result.packageSpecs.edges[0]?.node;
      
      return { content: [{ type: "text", text: JSON.stringify(packageData, null, 2) }] };
    }
  },
  {
    name: "tanium_get_software_versions",
    description: "Get all versions of a specific software installed across endpoints.",
    inputSchema: {
      type: "object",
      properties: {
        softwareName: { type: "string", description: "Software name to search for (e.g., Notepad++)" },
        first: { type: "number", description: "Number of endpoints to return", default: 100 }
      }
    },
    callback: async (params) => {
      const client = getClient(authToken);
      const { softwareName, first = 100 } = params;
      
      const q = 'query($n:Int,$s:EndpointSource,$sn:String!,$sv:String!){endpoints(first:$n,source:$s,filter:{sensor:{name:$sn},value:$sv,op:CONTAINS}){edges{node{name ipAddress installedApplications{name version}}}}}';
      const result = await client.request(q, { n: first, s: sourceObj, sn: "Installed Applications", sv: softwareName });
      
      const endpoints = result.endpoints.edges.map(e => e.node);
      const softwareMap = {};
      
      for (const ep of endpoints) {
        if (ep.installedApplications) {
          for (const app of ep.installedApplications) {
            if (app.name.toLowerCase().includes(softwareName.toLowerCase())) {
              const key = app.name + "|" + app.version;
              if (!softwareMap[key]) {
                softwareMap[key] = { name: app.name, version: app.version, endpoints: [] };
              }
              softwareMap[key].endpoints.push(ep.name);
            }
          }
        }
      }
      
      const summary = Object.values(softwareMap).map(s => ({
        name: s.name,
        version: s.version,
        endpointCount: s.endpoints.length,
        endpoints: s.endpoints.slice(0, 10)
      })).sort((a, b) => b.endpointCount - a.endpointCount);
      
      return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] };
    }
  }
];

for (const tool of toolDefinitions) {
  server.tool(tool.name, tool.description, tool.inputSchema, tool.callback);
}

const app = express();
app.use(express.json());

let initialized = false;
const serverInfo = { name: "tanium-mcp", version: "1.0.0" };

app.post("/mcp", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    authToken = authHeader.substring(7);
  }
  
  const { jsonrpc, method, params, id } = req.body;
  
  if (jsonrpc !== "2.0") {
    return res.json({ jsonrpc: "2.0", error: { code: -32600, message: "Invalid Request" }, id });
  }
   
  if (method === "initialize") {
    initialized = true;
    const result = {
      protocolVersion: params.protocolVersion || "2024-11-05",
      capabilities: { tools: {} },
      serverInfo
    };
    return res.json({ jsonrpc: "2.0", result, id });
  }
  
  if (method === "notifications/initialized") {
    return res.json({ jsonrpc: "2.0", id: null });
  }
  
  if (method === "tools/list") {
    const tools = toolDefinitions.map(t => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema
    }));
    return res.json({ jsonrpc: "2.0", result: { tools }, id });
  }
  
  if (method === "tools/call") {
    const toolName = params.name;
    const args = params.arguments || {};
    
    try {
      const tool = toolDefinitions.find(t => t.name === toolName);
      if (!tool) {
        return res.json({ jsonrpc: "2.0", error: { code: -32601, message: "Method not found" }, id });
      }
      
      const result = await tool.callback(args);
      return res.json({ jsonrpc: "2.0", result, id });
    } catch (error) {
      return res.json({ jsonrpc: "2.0", error: { code: -32603, message: error.message }, id });
    }
  }
  
  return res.json({ jsonrpc: "2.0", error: { code: -32601, message: "Method not found" }, id });
});

app.get("/mcp", (req, res) => {
  res.json({ status: "ok" });
});

app.delete("/mcp", (req, res) => {
  initialized = false;
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Tanium MCP Server listening on port ${PORT}`);
});
