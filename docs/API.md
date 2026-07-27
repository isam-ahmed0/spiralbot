# Runtime API

Available to all plugins via the `runtime` parameter.

## Core

| Property | Type | Description |
|----------|------|-------------|
| `runtime.client` | Client | Discord.js client instance |
| `runtime.config` | object | Bot config from spiral.json |
| `runtime.db` | SpiralDB | Built-in JSON database |
| `runtime.pluginManager` | PluginManager | Plugin manager instance |
| `runtime.startTime` | number | Timestamp when bot started |

## Methods

| Method | Description |
|--------|-------------|
| `runtime.start()` | Start the bot |
| `runtime.stop()` | Shut down gracefully |
| `runtime.restart()` | Restart without killing process |
| `runtime.getUptime()` | Milliseconds since bot started |
| `runtime.getCommand(name)` | Get registered command |
| `runtime.getAllCommands()` | Get all commands as Map |
| `runtime.getPluginConfig(name)` | Get plugin's config |
| `runtime.getPluginAPI(name)` | Get plugin's exported API |
| `runtime.registerSlashCommands(clientId, commands, opts?)` | Register slash commands (auto-dedup, auto-delete stale) |

## Database (`runtime.db`)

Built-in JSON key-value store persisted to `data.json`.

| Method | Description |
|--------|-------------|
| `db.get(key, default?)` | Get value by dot-notation key |
| `db.set(key, value)` | Set value by dot-notation key |
| `db.add(key, amount)` | Add a number (creates if missing) |
| `db.delete(key)` | Delete a key |
| `db.has(key)` | Check if key exists |
| `db.all()` | Get all data as object |
| `db.clear()` | Clear all data |

### Dot Notation

```javascript
db.set('users.1234.balance', 100);
db.get('users.1234.balance');  // 100
db.add('users.1234.balance', 50);  // 150
db.has('users.1234');  // true
```

## Hook System

### Emitting

```javascript
// Parallel — all listeners at once
await runtime.pluginManager.emitHook('event', payload);

// Serial — one at a time
await runtime.pluginManager.emitHookSerial('event', payload);

// Until one returns true
const result = await runtime.pluginManager.emitHookWithResult('event', payload);
```

### Subscribing

```javascript
module.exports = {
  hooks: {
    message_received: async (payload, runtime) => {
      const { message } = payload;
      if (message.content === '!ping') {
        await message.reply('Pong!');
      }
    }
  }
};
```

## Slash Commands

```javascript
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  hooks: {
    bot_ready: async (payload, runtime) => {
      const commands = [
        new SlashCommandBuilder()
          .setName('ping')
          .setDescription('Pong!')
      ];
      await runtime.registerSlashCommands(
        runtime.config.clientId,
        commands
      );
    }
  }
};
```

Registration is idempotent:
- Duplicate names are skipped with a warning
- Stale commands (removed from plugins) are auto-deleted
- Existing commands are updated in-place
- Works for both global and per-guild registration

## Config

### Bot Config (`spiral.json`)

```json
{
  "name": "My Bot",
  "token": "DISCORD_TOKEN",
  "prefix": "!",
  "intents": ["Guilds", "GuildMessages", "MessageContent"],
  "clientId": "123456789",
  "disabledCommands": [],
  "enabledPlugins": [],
  "perGuildSlash": false
}
```

### Plugin Config

Each plugin can have `config.json` and `config.schema.json` for type-safe defaults.
