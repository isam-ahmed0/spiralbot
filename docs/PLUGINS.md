# Plugin Development

## Tutorial: Build a Greeting Plugin

Create a plugin that responds to `!hello` and `!goodbye`.

### 1. Create the plugin folder

```bash
mkdir -p plugins/greeter
```

### 2. Add manifest

`plugins/greeter/plugin.json`:

```json
{
  "name": "greeter",
  "version": "1.0.0",
  "description": "Greets users",
  "collision_policy": "last-wins"
}
```

### 3. Add plugin code

`plugins/greeter/index.js`:

```javascript
module.exports = {
  commands: {
    hello: {
      description: 'Say hello',
      execute: async (message, args, runtime) => {
        const name = args.join(' ') || message.author.username;
        await message.reply(`Hello, ${name}!`);
      }
    },
    goodbye: {
      description: 'Say goodbye',
      execute: async (message, args, runtime) => {
        await message.reply('Goodbye!');
      }
    }
  }
};
```

### 4. Test it

```bash
spiral run
```

In Discord: `!hello friend` → "Hello, friend!"

---

## Plugin Types

| Type | File | When to Use |
|------|------|-------------|
| **JavaScript** | `index.js` | Full logic, APIs, complex behavior |
| **SpiralScript** | `plugin.spi` | Simple commands, no code |
| **DSL** | `plugin.dsl` | Basic command-response patterns |

## Plugin Structure

```
plugins/my-plugin/
  plugin.json           # Manifest (required)
  index.js              # JavaScript plugin
  plugin.spi            # SpiralScript (alternative)
  config.json           # Runtime config (optional)
  config.schema.json    # Config schema (optional)
```

## Manifest (`plugin.json`)

```json
{
  "name": "my_plugin",
  "version": "1.0.0",
  "description": "Does cool stuff",
  "author": "You",
  "dependencies": {},
  "collision_policy": "last-wins"
}
```

### Collision Policies

When two plugins register the same command name:

| Policy | Behavior |
|--------|----------|
| `error` | Refuse to load, crash on conflict |
| `first-wins` | Keep the first registered command |
| `last-wins` | Overwrite with newer command (default) |

## JavaScript Plugin

### Commands

```javascript
module.exports = {
  commands: {
    ping: {
      description: 'Check latency',
      usage: '',
      slash: true,         // Register as slash command too
      priority: 0,         // Higher = wins conflicts
      execute: async (message, args, runtime) => {
        await message.reply('Pong!');
      }
    }
  }
};
```

The `execute` function receives:
- `message` — Discord message object
- `args` — Array of space-separated arguments
- `runtime` — Runtime API (db, config, etc.)

### Hooks (Events)

```javascript
module.exports = {
  hooks: {
    bot_ready: async (payload, runtime) => {
      console.log('Bot is online!');
    },
    message_received: async (payload, runtime) => {
      const { message } = payload;
      if (message.content.startsWith('!')) {
        console.log(`Command from ${message.author.tag}: ${message.content}`);
      }
    }
  }
};
```

### Init (setup on load)

```javascript
module.exports = {
  init: async (config, runtime) => {
    console.log('Plugin loaded with config:', config);
    // One-time setup here
  }
};
```

### REPL Commands

```javascript
module.exports = {
  repl: {
    greet: {
      description: 'Say hello in REPL',
      execute: async (args, context) => {
        return `Hello ${context.user.username}!`;
      }
    }
  }
};
```

Access in REPL with `.greet`.

## Common Patterns

### Read arguments

```javascript
execute: async (message, args, runtime) => {
  if (args.length === 0) {
    return await message.reply('Usage: !say <message>');
  }
  const text = args.join(' ');
  await message.channel.send(text);
}
```

### Check permissions

```javascript
execute: async (message, args, runtime) => {
  if (!message.member.permissions.has('Administrator')) {
    return await message.reply('You need Administrator permission.');
  }
  // do admin stuff
}
```

### Use the database

```javascript
execute: async (message, args, runtime) => {
  const key = `visits.${message.author.id}`;
  const visits = (runtime.db.get(key) || 0) + 1;
  runtime.db.set(key, visits);
  await message.reply(`You've visited ${visits} times!`);
}
```

### Send an embed

```javascript
const { EmbedBuilder } = require('discord.js');

execute: async (message, args, runtime) => {
  const embed = new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle('My Embed')
    .setDescription('Hello!')
    .addFields({ name: 'Field', value: 'Value' })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
```

### Slash commands

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

### Add command options (slash)

```javascript
const { SlashCommandBuilder } = require('discord.js');

// In your bot_ready hook:
const commands = [
  new SlashCommandBuilder()
    .setName('greet')
    .setDescription('Greet someone')
    .addUserOption(opt => opt
      .setName('user')
      .setDescription('Who to greet')
      .setRequired(true)
    )
    .addStringOption(opt => opt
      .setName('message')
      .setDescription('Optional message')
    )
];

// In your interaction_received hook or command dispatch:
const user = interaction.options.getUser('user');
const msg = interaction.options.getString('message') || 'Hello!';
await interaction.reply(`${msg} ${user}!`);
```

## SpiralScript Plugin

```
COMMAND hello "Say hello"
  ALIASES hi, hey
  COOLDOWN 3
  RESPONSE_POOL
    Hello {user.name}!
    Hey {user.name}!
    Hi there!
  END
END
```

### SpiralScript keywords

| Keyword | Description |
|---------|-------------|
| `COMMAND <name> "desc"` | Define a command |
| `ALIASES a, b` | Alternative names |
| `COOLDOWN <sec>` | Cooldown per user |
| `REQUIRES_ARGS <n>` | Minimum arguments |
| `REQUIRES_PERMISSION <perm>` | Required permission |
| `RESPONSE "text"` | Single response |
| `RESPONSE_POOL ... END` | Random response |
| `EMBED "#color"` | Embed response |
| `TITLE "text"` | Embed title |
| `DESCRIPTION "text"` | Embed description |
| `DB_GET <key>` | Read from database |
| `DB_SET <key> <val>` | Write to database |
| `DB_ADD <key> <amt>` | Add to database value |
| `IF ... ELSE ... END` | Conditional |
| `SET ${var} = <value>` | Set variable |
| `REPLY_EMBED` | Send the embed |

### Variables

| Variable | Replaced With |
|----------|---------------|
| `{user.id}` | User's Discord ID |
| `{user.name}` | Username |
| `{channel.id}` | Channel ID |
| `{guild.id}` | Server ID |
| `{guild.name}` | Server name |
| `{args}` | Command arguments |
| `{prefix}` | Bot prefix |

## DSL Plugin

```
COMMAND ping "Pong!"
  RESPONSE "Pong!"
END
```

## Hook Events

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

## Cross-Plugin API

Export from one plugin:

```javascript
module.exports = {
  api: {
    getUserData: (userId) => runtime.db.get(userId),
    setUserData: (userId, data) => runtime.db.set(userId, data)
  }
};
```

Use in another plugin:

```javascript
const api = runtime.getPluginAPI('my_plugin');
const data = api.getUserData('1234');
```

## Plugin Config

Each plugin can have `config.schema.json` (defaults) and `config.json` (overrides).

`config.schema.json`:

```json
{
  "type": "object",
  "properties": {
    "enabled": { "type": "boolean", "default": true },
    "color": { "type": "string", "default": "#FF0000" },
    "maxItems": { "type": "number", "default": 10 }
  }
}
```

Access in code:

```javascript
const config = runtime.getPluginConfig('my_plugin');
if (config.enabled) {
  console.log(config.color);
}
```

## Generating Plugins

```bash
# Auto-detect category from description
spiral generate "economy plugin with balance and daily"

# Generate as SpiralScript
spiral generate "welcome message" --type spi

# Preview without writing
spiral generate "moderation with ban and kick" --dry-run
```

Categories detected: economy, moderation, fun, welcome, counter, leveling, poll, reminder, starboard, logging, music, ai_chat, generic.
