---
name: host-admin
description: Manage the NanoClaw host — restart the process, rebuild the container image, or update configuration. Main group only.
allowed-tools: mcp__nanoclaw__restart_service, mcp__nanoclaw__rebuild_image, mcp__nanoclaw__update_config
---

# Host Admin

Manage the NanoClaw host service from within a conversation. All commands are restricted to the main group.

## Tools

### restart_service
Restart the NanoClaw process. The bot sends a confirmation message, then exits. The service manager (launchd/systemd) automatically restarts it. Your container will be terminated during the restart.

### rebuild_image
Rebuild the agent container image. The service stays running — only new containers spawned after the build use the updated image. Use `no_cache: true` when Docker's cached layers are stale (e.g., after changing files that get COPYed into the image).

### update_config
Update `.env` values or per-group container configuration.

- `.env` changes (CONTAINER_TIMEOUT, IDLE_TIMEOUT, MAX_CONCURRENT_CONTAINERS, ASSISTANT_NAME, etc.) take effect after a restart.
- `containerConfig` changes (timeout) take effect on the next container spawn — no restart needed.
- Secrets (API keys, tokens) cannot be set via this tool. They must be edited manually in `.env`.
