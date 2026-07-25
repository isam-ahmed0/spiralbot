# Spiralcord Engine

Complete technical documentation of how Spiralcord works.

## Table of Contents

1. [Architecture](#architecture)
2. [Runtime](#runtime)
3. [Plugin Manager](#plugin-manager)
4. [Plugin System](#plugin-system)
5. [Hook System](#hook-system)
6. [Command System](#command-system)
7. [DSL System](#dsl-system)
8. [Configuration](#configuration)
9. [Plugin API](#plugin-api)
10. [REPL Console](#repl-console)
11. [Speed Optimizations](#speed-optimizations)
12. [Creating Plugins](#creating-plugins)

---

## Architecture

```
spiralcord/
├── bin/spiral.js          # CLI entry point
├── spm/
│   ├── bin/spm.js         # SPM CLI
│   └── lib/commands.js    # Shared SPM command functions
├── src/
│   ├── runtime.js         # Core runtime (thin shell)
│   ├── plugins/
│   │   ├── manager.js     # Plugin loader + hook system
│   │   └── builtin/       # Built-in plugins
│   └── web/
│       ├── server.js      # Express web server
│       └── public/        # Web UI
└── package.json
```

**Design principle:** Runtime is a thin shell. ALL features come from plugins.

---

## Runtime

**File:** `src/runtime.js`

The runtime is minimal - it only does 3 things:

1. Creates Discord.js client
2. Loads plugins from `plugins/` folder
3. Emits events to plugins

```javascript
class SpiralRuntime {
  constructor(config) {
    this.config = config;
    this.client = null;
    this.pluginManager = new SpiralPluginManager(this);
  }

  async start() {
    this.client = new Client({ intents: this._resolveIntents() });
    this._bindEvents();
    await this.pluginManager.loadPlugins(pluginsDir);
    await this.client.login(this.config.token);
  }
}
```

### What the runtime provides:

| Method | Description |
|--------|-------------|
| `runtime.client` | Discord.js Client instance |
| `runtime.config` | Bot configuration from spiral.json |
| `runtime.db` | Built-in JSON key-value database |
| `runtime.pluginManager` | Plugin manager instance |
| `runtime.getCommand(name)` | Get a registered command |
| `runtime.getAllCommands()` | Get all commands as Map |
| `runtime.getPluginConfig(name)` | Get plugin's config.json |
| `runtime.getPluginAPI(name)` | Get plugin's exported API |
| `runtime.restart()` | Restart without killing process |
| `runtime.stop()` | Shutdown bot completely |

---

## Plugin Manager

**File:** `src/plugins/manager.js`

The plugin manager handles:

1. **Loading** - Reads plugin folders, loads code
2. **Dependencies** - Resolves plugin order
3. **Commands** - Registers command handlers
4. **Hooks** - Event subscription system
5. **REPL** - Collects plugin REPL commands
6. **DSL** - Compiles DSL to executable commands
7. **Config** - Loads per-plugin configuration

### Loading Process

```
1. Read plugins/ directory
2. Read each plugin.json manifest
3. Resolve dependencies (topological sort)
4. Load plugins sequentially (ensures ordering)
5. Register commands, hooks, REPL commands, APIs
```

### Sequential Loading

Plugins are loaded in dependency order, one at a time:

```javascript
for (const plugin of sorted) {
  await this.loadPlugin(plugin);  // Sequential for reliability
}
```

---

## Plugin System

### Plugin Types

| Type | File | Use Case |
|------|------|----------|
| **JavaScript** | `index.js` | Full logic, API calls, complex behavior |
| **DSL** | `plugin.dsl` | Simple commands, responses, no code |

### Plugin Structure

```
plugins/my_plugin/
├── plugin.json          # Required: manifest
├── index.js             # JS plugin code
├── plugin.dsl           # OR DSL commands
├── config.json          # Optional: runtime config
└── config.schema.json   # Optional: config validation
```

### plugin.json (Manifest)

```json
{
  "name": "spiral_myplugin",
  "version": "1.0.0",
  "description": "My awesome plugin",
  "dependencies": {},
  "collision_policy": "last-wins",
  "hooks": ["message_received", "bot_ready"],
  "commands": {
    "mycommand": {
      "description": "Does something",
      "slash": true,
      "usage": "<arg>"
    }
  }
}
```

### Collision Policies

| Policy | Behavior |
|--------|----------|
| `error` | Refuse to load if command exists |
| `first-wins` | Keep first registered command |
| `last-wins` | Overwrite with new command (default) |

---

## Hook System

Hooks are events that plugins can subscribe to. When an event fires, all subscribed plugins receive the payload.

### Available Hooks

| Hook | Payload | When |
|------|---------|------|
| `bot_ready` | `{ client, user, config }` | Bot connected |
| `message_received` | `{ message, user, guild, channel }` | Message sent |
| `interaction_received` | `{ interaction, user, guild, channel }` | Slash command used |
| `presence_update` | `{ oldPresence, newPresence, user, guild }` | User status changes |
| `guild_joined` | `{ guild }` | Bot joins server |
| `guild_left` | `{ guild }` | Bot leaves server |
| `voice_state_update` | `{ oldState, newState, user, guild }` | Voice channel change |
| `reaction_add` | `{ reaction, user, message }` | Reaction added |
| `reaction_remove` | `{ reaction, user, message }` | Reaction removed |
| `bot_shutdown` | `{ client }` | Bot stopping |

### Subscribing to Hooks

**JavaScript:**
```javascript
module.exports = {
  hooks: {
    message_received: async (payload, runtime) => {
      const { message } = payload;
      if (message.content === '!hello') {
        await message.reply('Hello!');
      }
    }
  }
};
```

### Emitting Hooks

```javascript
// Emit to all listeners (parallel)
await this.pluginManager.emitHook('message_received', payload);

// Emit serially (one after another)
await this.pluginManager.emitHookSerial('event', payload);

// Emit until one returns true
await this.pluginManager.emitHookWithResult('event', payload);
```

---

## Command System

Commands are registered by plugins and dispatched by `spiral_command_dispatch`.

### Registering Commands

**JavaScript:**
```javascript
module.exports = {
  commands: {
    ping: {
      description: 'Check latency',
      usage: '',
      slash: true,
      priority: 0,
      execute: async (message, args, runtime) => {
        await message.reply('Pong!');
      }
    }
  }
};
```

### Command Properties

| Property | Type | Description |
|----------|------|-------------|
| `description` | string | Help text |
| `usage` | string | Argument syntax |
| `slash` | boolean | Register as slash command |
| `priority` | number | Higher = takes precedence |
| `execute` | function | `(message, args, runtime) => void` |

### Command Execution Flow

```
1. User sends "!ping"
2. spiral_command_dispatch intercepts
3. Extracts command name ("ping") and args
4. Calls runtime.getCommand("ping")
5. Executes handler(message, args, runtime)
```

### Disabled Commands

In `spiral.json`:
```json
{
  "disabledCommands": ["ban", "kick"]
}
```

---

## DSL System

DSL (Domain Specific Language) lets you create commands without JavaScript.

### DSL Syntax

```
# Comments start with #

COMMAND <name> "description"
  ALIASES <alias1>, <alias2>
  COOLDOWN <seconds>
  REQUIRES_ARGS "error message"
  REQUIRES_PERMISSION <PERMISSION>
  RESPONSE "single response"
  RESPONSE_POOL
    Response 1
    Response 2
    Response 3
  END
  EMBED "#hexcolor"
  TITLE "Embed title"
  DESCRIPTION "Embed description"
END
```

### DSL Variables

| Variable | Replaced With |
|----------|---------------|
| `{user.id}` | User's Discord ID |
| `{user.name}` | Username |
| `{channel.id}` | Channel ID |
| `{guild.id}` | Server ID |
| `{guild.name}` | Server name |
| `{args}` | Command arguments |

### DSL Example

```
COMMAND hello "Say hello"
  ALIASES hi, hey
  COOLDOWN 3
  RESPONSE_POOL
    Hello {user.name}!
    Hey {user.name}!
    Hi there!
  END
```

This creates:
- Command: `!hello`
- Aliases: `!hi`, `!hey`
- Cooldown: 3 seconds
- Random response from pool

---

## Configuration

### Bot Config (spiral.json)

```json
{
  "name": "My Bot",
  "token": "DISCORD_TOKEN",
  "prefix": "!",
  "intents": ["Guilds", "GuildMessages", "MessageContent"],
  "clientId": "123456789",
  "disabledCommands": []
}
```

### Plugin Config

Each plugin can have `config.json` and `config.schema.json`.

**config.schema.json** (defines defaults):
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "enabled": { "type": "boolean", "default": true },
    "apiKey": { "type": "string", "default": "" },
    "maxItems": { "type": "number", "default": 10 }
  }
}
```

**config.json** (user overrides):
```json
{
  "enabled": true,
  "apiKey": "sk-1234..."
}
```

### Loading Order

1. Read `config.schema.json` → extract defaults
2. Read `config.json` → override defaults
3. Plugin receives merged config

### Accessing Config

```javascript
// In plugin:
const config = runtime.getPluginConfig('spiral_myplugin');
console.log(config.apiKey);
```

---

## Plugin API

Plugins can export an API that other plugins can use.

### Exporting API

```javascript
module.exports = {
  api: {
    getUserData: (userId) => {
      return database.get(userId);
    },
    setUserData: (userId, data) => {
      database.set(userId, data);
    }
  }
};
```

### Using API

```javascript
// In another plugin:
const myPlugin = runtime.getPluginAPI('spiral_myplugin');
const data = myPlugin.getUserData(userId);
```

---

## REPL Console

Spiralcord includes an interactive REPL console via `spiral run -R`.

### Starting

```bash
spiral run -R
```

This starts the bot with:
- Auto-reload on file changes (requires chokidar)
- Interactive REPL console
- Plugin management via `spm.*` commands
- Custom commands from plugins

### REPL Commands

**Bot commands:**

| Command | Description |
|---------|-------------|
| `.status` | Show uptime, servers, users |
| `.reload` | Hot-reload all plugins |
| `.stop` | Stop the bot |
| `.commands` | List all registered commands |
| `.help` | Show available commands |

**SPM commands:**

| Command | Description |
|---------|-------------|
| `spm.plugins` | List installed plugins |
| `spm.install <source>` | Install from GitHub |
| `spm.create <name>` | Create new plugin |
| `spm.enable <name>` | Enable plugin |
| `spm.disable <name>` | Disable plugin |
| `spm.remove <name>` | Remove plugin |
| `spm.test <name>` | Test plugin |
| `spm.info <name>` | Show plugin info |
| `spm.update` | Update all plugins |

### Plugin REPL Commands

Plugins can register custom REPL commands:

```javascript
module.exports = {
  name: 'my-plugin',
  commands: { ... },
  repl: {
    greet: {
      description: 'Say hello',
      execute: async (args, context) => {
        return `Hello ${context.user.username}!`;
      }
    },
    stats: {
      description: 'Show custom stats',
      execute: async (args, context) => {
        return `Custom stat: ${context.db.get('mystats')}`;
      }
    }
  }
};
```

### REPL Context

```javascript
context.runtime    // SpiralRuntime instance
context.client     // Discord.js client
context.db         // Built-in database
context.manager    // Plugin manager
context.config     // spiral.json config
context.user       // Bot's user object
```

### REPL Example

```
$ spiral run -R
[runtime] Starting Spiralcord v2.3.0
[runtime] Ready as MyBot#1234 | 5 servers
[repl] 2 plugin command(s) registered: .greet, .stats

spiral> .status
Uptime: 0h 2m 30s | Servers: 5 | Users: 200

spiral> spm.plugins
  ● spiral_core v1.0.0 — Core plugin
  ● my-plugin v1.0.0 — My custom plugin

spiral> .greet
Hello User!

spiral> .reload
Plugins reloaded.

spiral> .exit
Bot continues running. Press Ctrl+C to stop.
```

---

## Speed Optimizations

### 1. Async File Operations

```javascript
// Before: Blocks event loop
const data = fs.readFileSync(path, 'utf-8');

// After: Non-blocking
const data = await fs.promises.readFile(path, 'utf-8');
```

### 2. Faster Restart

```javascript
// Before: Destroy → Create → Login
client.destroy();
client = new Client(...);
await client.login(token);

// After: Reuse, just reload plugins
client.destroy();
client.removeAllListeners();
client = new Client(...);
_bindEvents();
await client.login(token);
```

### 3. Module Cache Clearing

```javascript
// Clear require cache for hot reload
delete require.cache[require.resolve(indexPath)];
```

---

## Creating Plugins

### JavaScript Plugin Template

```javascript
// plugins/my_plugin/index.js

module.exports = {
  // Called once when plugin loads
  init: async (config, runtime) => {
    console.log('My plugin loaded!');
  },

  // Event hooks
  hooks: {
    message_received: async (payload, runtime) => {
      const { message } = payload;
      if (message.content === '!mycommand') {
        await message.reply('Hello from my plugin!');
      }
    }
  },

  // Commands
  commands: {
    mycommand: {
      description: 'My custom command',
      execute: async (message, args, runtime) => {
        await message.reply('It works!');
      }
    }
  },

  // REPL commands
  repl: {
    mycmd: {
      description: 'My REPL command',
      execute: async (args, context) => {
        return 'Hello from REPL!';
      }
    }
  },

  // API for other plugins
  api: {
    doSomething: () => {
      return 'result';
    }
  }
};
```

### DSL Plugin Template

```
# plugins/my_plugin/plugin.dsl

COMMAND mycommand "My custom command"
  ALIASES mc
  COOLDOWN 5
  RESPONSE "Hello from my DSL plugin!"
END
```

### Plugin Checklist

- [ ] Create folder in `plugins/`
- [ ] Create `plugin.json` with name, version, description
- [ ] Create `index.js` or `plugin.dsl`
- [ ] Optionally add `config.json` and `config.schema.json`
- [ ] Optionally add `repl` commands for interactive console
- [ ] Test with `spiral run`
- [ ] Add to README if publishing

---

## CLI Commands

| Command | Description |
|---------|-------------|
| `spiral install <repo>` | Clone bot from GitHub |
| `spiral run` | Start bot |
| `spiral run -R` | Start with auto-reload + REPL |
| `spiral dev` | Start with auto-reload |
| `spiral web` | Start web manager |
| `spiral test` | Test all plugins |
| `spiral doctor` | Check bot health |
| `spiral update` | Update spiralcord |
| `spiral plugin <cmd>` | Delegate to SPM |

---

## Examples

### Example 1: AI Plugin

```javascript
module.exports = {
  hooks: {
    message_received: async (payload, runtime) => {
      const { message } = payload;
      const config = runtime.getPluginConfig('spiral_ai');

      if (!message.content.startsWith('!ask')) return;

      const question = message.content.slice(4).trim();
      const response = await callOpenAI(question, config.apiKey);
      await message.reply(response);
    }
  }
};
```

### Example 2: Counter Plugin

```javascript
const counters = new Map();

module.exports = {
  commands: {
    count: {
      description: 'Show your count',
      execute: async (message, args, runtime) => {
        const count = counters.get(message.author.id) || 0;
        await message.reply(`Count: ${count}`);
      }
    },
    countup: {
      description: 'Add 1',
      execute: async (message, args, runtime) => {
        const current = counters.get(message.author.id) || 0;
        counters.set(message.author.id, current + 1);
        await message.reply(`Count: ${current + 1}`);
      }
    }
  }
};
```

### Example 3: DSL Greetings

```
COMMAND hello "Say hello"
  ALIASES hi, hey
  COOLDOWN 3
  RESPONSE_POOL
    Hello {user.name}!
    Hey {user.name}!
    Hi there!
  END
```

---

## Troubleshooting

### Plugin not loading

1. Check `plugin.json` exists
2. Check `index.js` or `plugin.dsl` exists
3. Check for syntax errors in console
4. Verify dependencies are installed

### Command not working

1. Check command is registered: `spiral test`
2. Check not in `disabledCommands`
3. Check plugin is enabled
4. Check command spelling

### Bot shows offline

1. Check `spiral.json` has valid token
2. Check `spiral_presence` plugin is enabled
3. Check `config.json` has correct statusType
4. Check console for `[presence]` errors

### chokidar not found

`spiral dev` and `spiral run -R` require chokidar in your project:

```bash
npm install chokidar
```

---

## File Reference

| File | Purpose |
|------|---------|
| `spiral.json` | Bot configuration |
| `plugins/*/plugin.json` | Plugin manifest |
| `plugins/*/index.js` | JavaScript plugin code |
| `plugins/*/plugin.dsl` | DSL plugin code |
| `plugins/*/config.json` | Plugin runtime config |
| `plugins/*/config.schema.json` | Config defaults/schema |
| `data.json` | Built-in database |

---

## Version

Spiralcord v2.3.0
