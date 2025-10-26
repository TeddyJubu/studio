# Shadcn MCP Notes

- The `components.json` scaffold is present and points at `tailwind.config.ts` and `src/app/globals.css`, so the workspace is already wired for the Shadcn CLI.
- The configured MCP registry does not currently surface a `shadcn` server (`list_mcp_resources` responded with an empty set), so component pulls must be handled through the CLI or manual scaffolding.
- Layout, navigation, and data-display primitives have been added locally (`navigation-menu`, `breadcrumb`, `app-shell`, `stats-card`) to unblock the redesign until the MCP server is reachable.

