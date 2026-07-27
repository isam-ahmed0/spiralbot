# SpiralCord Plugin Development Guide

## Plugin Structure

```
plugins/my-plugin/
  plugin.json           # Manifest (required)
  index.js              # JavaScript plugin (OR)
  plugin.spi            # SpiralScript plugin (no code needed)
  config.json           # User overrides (optional)
  config.schema.json    # Config defaults (optional)
```

## plugin.json

```json
{
  "name": "my_plugin",
  "version": "1.0.0",
  "description": "What it does",
  "author": "you",
  "collision_policy": "last-wins"
}
```

Collision policies: `error` (refuse), `first-wins`, `last-wins` (default).

---

## JavaScript Plugins (index.js)

```javascript
module.exports = {
  init: async (config, runtime) => {
    // Called once when plugin loads
  },

  commands: {
    ping: {
      description: 'Check latency',
      slash: true,           // Register as slash command
      usage: '<arg>',        // Shown in help
      aliases: ['p'],        // Alternative names
      priority: 0,           // Higher wins on collision
      execute: async (message, args, runtime) => {
        await message.reply('Pong!');
      }
    }
  },

  hooks: {
    bot_ready: async (payload, runtime) => {
      // payload.client, payload.user, payload.config
    },
    message_received: async (payload, runtime) => {
      // payload.message, payload.user, payload.guild
    },
    interaction_received: async (payload, runtime) => {
      // payload.interaction
    }
  },

  repl: {
    greet: {
      description: 'Say hello in REPL',
      execute: async (args, context) => {
        return `Hello ${context.user.username}!`;
      }
    }
  },

  api: {
    getData: () => { return { key: 'value' }; }
  }
};
```

### Slash Commands (JS)

Register in `bot_ready` hook:

```javascript
const { SlashCommandBuilder } = require('discord.js');

hooks: {
  bot_ready: async (payload, runtime) => {
    const commands = [
      new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Pong!')
        .addStringOption(opt => opt
          .setName('input')
          .setDescription('Your input')
          .setRequired(true)
        )
    ];
    await runtime.registerSlashCommands(runtime.config.clientId, commands);
  }
}
```

### Using the Database

```javascript
execute: async (message, args, runtime) => {
  const key = `visits.${message.author.id}`;
  const visits = (runtime.db.get(key) || 0) + 1;
  runtime.db.set(key, visits);
  await message.reply(`Visits: ${visits}`);
}
```

DB scopes: `user:key`, `guild:key`, `global:key`.

### Sending Embeds

```javascript
const { EmbedBuilder } = require('discord.js');

execute: async (message, args, runtime) => {
  const embed = new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle('Title')
    .setDescription('Description')
    .addFields({ name: 'Field', value: 'Value', inline: true })
    .setTimestamp();
  await message.reply({ embeds: [embed] });
}
```

---

## SpiralScript Plugins (.spi)

No JavaScript needed. Write commands in a simple DSL.

### Basic Syntax

```
# Comments start with #

COMMAND hello "Say hello"
  ALIASES hi, hey
  COOLDOWN 3
  RESPONSE_POOL
    Hello {user.name}!
    Hey there!
  END
END
```

### Slash Commands

```
SLASH_COMMAND greet "Greet someone"
  OPTION user target "Who to greet" REQUIRED
  OPTION string message "Your message" OPTIONAL
  REPLY "Hello ${mention.first}!"
END
```

### Option Types

`user`, `string`, `integer`, `boolean`, `channel`, `role`, `number`, `attachment`

### Keywords

| Keyword | Syntax | Description |
|---------|--------|-------------|
| `COMMAND` | `COMMAND name "desc"` | Prefix command |
| `SLASH_COMMAND` | `SLASH_COMMAND name "desc"` | Slash command |
| `OPTION` | `OPTION type name "desc" REQUIRED` | Slash command option |
| `ALIASES` | `ALIASES a, b` | Alternative names |
| `COOLDOWN` | `COOLDOWN 5 ["msg"]` | Cooldown in seconds |
| `REQUIRES_ARGS` | `REQUIRES_ARGS "error"` | Requires arguments |
| `REQUIRES_PERMISSION` | `REQUIRES_PERMISSION BAN_MEMBERS` | Needs permission |
| `RESPONSE` | `RESPONSE "text"` | Fixed response |
| `RESPONSE_POOL` | Pool block | Random response from list |
| `EMBED` | `EMBED "#color"` | Embed response |
| `TITLE` | `TITLE "text"` | Embed title |
| `DESCRIPTION` | `DESCRIPTION "text"` | Embed description |
| `FIELD` | `FIELD "name" "value" INLINE` | Embed field |
| `THUMBNAIL` | `THUMBNAIL "url"` | Embed thumbnail |
| `TIMESTAMP` | `TIMESTAMP` | Add timestamp |
| `BUTTON` | `BUTTON "label" STYLE success ACTION id` | Add button |
| `SELECT` | `SELECT "placeholder" OPTION "label" VALUE val` | Select menu |
| `DB_GET` | `DB_GET user:key` | Read database |
| `DB_SET` | `DB_SET user:key value` | Write database |
| `DB_ADD` | `DB_ADD user:key 100` | Add to number |
| `DB_SUB` | `DB_SUB user:key 50` | Subtract from number |
| `DB_DELETE` | `DB_DELETE user:key` | Delete key |
| `SET` | `SET $var = value` | Set variable |
| `REPLY` | `REPLY "text"` | Reply to message |
| `REPLY_EMBED` | `REPLY_EMBED` | Reply with embed |
| `IF` | `IF $var == "value"` | Conditional |
| `FOR` | `FOR $i FROM 1 TO 10` | Loop |
| `ON_BUTTON` | `ON_BUTTON custom_id` | Handle button |
| `ON_SELECT` | `ON_SELECT custom_id` | Handle select |
| `ON_HOOK` | `ON_HOOK hook_name` | Listen to hook |
| `SEND` | `SEND "text" TO channel:id` | Send to channel |
| `GET_CONFIG` | `GET_CONFIG plugin key` | Read config |
| `EMIT_HOOK` | `EMIT_HOOK "hook_name" args` | Emit custom hook |
| `PLUGIN_API` | `PLUGIN_API plugin method args` | Call plugin API |

### Variables

| Variable | Value |
|----------|-------|
| `{user.id}` | User's Discord ID |
| `{user.name}` | Username |
| `{user.mention}` | User mention string |
| `{guild.id}` | Server ID |
| `{guild.name}` | Server name |
| `{guild.member_count}` | Member count |
| `{channel.id}` | Channel ID |
| `{channel.name}` | Channel name |
| `{args}` | Command arguments |
| `{prefix}` | Bot prefix |
| `{bot.name}` | Bot name |
| `{bot.servers}` | Server count |
| `{bot.uptime}` | Uptime string |
| `{bot.latency}` | Latency in ms |
| `{timestamp}` | Unix timestamp |
| `{db_value}` | Last DB_GET result |
| `{config_value}` | Last GET_CONFIG result |

### Hooks in SpiralScript

```
ON_HOOK bot_ready
  REPLY "Bot is online!"
END

ON_BUTTON my_button
  REPLY "Button clicked!"
END

ON_SELECT my_select
  REPLY "Selected: ${interaction.value}"
END
```

---

## Config System

### config.schema.json (defaults)

```json
{
  "type": "object",
  "properties": {
    "enabled": { "type": "boolean", "default": true },
    "apiKey": { "type": "string", "default": "" },
    "maxItems": { "type": "number", "default": 10 }
  }
}
```

### config.json (user overrides)

```json
{
  "enabled": true,
  "apiKey": "sk-abc123"
}
```

### Access in JavaScript

```javascript
const config = runtime.getPluginConfig('my_plugin');
console.log(config.apiKey);
```

### Access in SpiralScript

```
GET_CONFIG my_plugin apiKey
REPLY "API key: ${config_value}"
```

---

## Runtime API

| Property/Method | Description |
|-----------------|-------------|
| `runtime.client` | Discord.js client |
| `runtime.config` | spiral.json config |
| `runtime.db` | Built-in JSON database |
| `runtime.getUptime()` | Milliseconds since start |
| `runtime.getCommand(name)` | Get a command |
| `runtime.getAllCommands()` | All commands as Map |
| `runtime.getPluginConfig(name)` | Plugin's config |
| `runtime.getPluginAPI(name)` | Plugin's exported API |
| `runtime.registerSlashCommands(clientId, cmds)` | Register slash commands |
| `runtime.emitHook(name, payload)` | Emit custom hook |
| `runtime.restart()` | Restart bot |
| `runtime.stop()` | Shutdown bot |

---

## Hook Events

| Hook | Payload | When |
|------|---------|------|
| `bot_ready` | `{ client, user, config }` | Bot connected |
| `message_received` | `{ message, user, guild, channel }` | Message sent |
| `interaction_received` | `{ interaction, user, guild, channel }` | Slash command used |
| `presence_update` | `{ oldPresence, newPresence, user, guild }` | Status changes |
| `guild_joined` | `{ guild }` | Bot joins server |
| `guild_left` | `{ guild }` | Bot leaves server |
| `voice_state_update` | `{ oldState, newState, user, guild }` | Voice change |
| `reaction_add` | `{ reaction, user, message }` | Reaction added |
| `reaction_remove` | `{ reaction, user, message }` | Reaction removed |
| `bot_shutdown` | `{ client }` | Bot stopping |

---

## Quick Start

```bash
# 1. Create plugin folder
mkdir -p plugins/my_plugin

# 2. Create plugin.json
echo '{"name":"my_plugin","version":"1.0.0","description":"My plugin"}' > plugins/my_plugin/plugin.json

# 3a. JavaScript plugin
echo 'module.exports={commands:{test:{description:"Test",execute:async(m)=>await m.reply("Works!")}}}' > plugins/my_plugin/index.js

# 3b. OR SpiralScript plugin
echo 'COMMAND test "Test"\n  RESPONSE "Works!"\nEND' > plugins/my_plugin/plugin.spi

# 4. Test
spiral test

# 5. Run
spiral run
```
