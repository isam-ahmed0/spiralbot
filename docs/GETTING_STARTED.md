# Getting Started

Create a Discord bot with Spiralcord from scratch.

## Step 1: Install

```bash
npm install spiral-core
```

## Step 2: Create a Discord Application

1. Go to https://discord.com/developers/applications
2. Click **New Application**, give it a name
3. Go to **Bot** tab → **Reset Token** → copy the token
4. Go to **OAuth2** → **URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: `Send Messages`, `Read Message History`, `Use Slash Commands`, `Embed Links`
5. Open the generated URL → invite to your server
6. Go to **General Information** tab → copy **Application ID** (this is your `clientId`)

## Step 3: Setup the Bot

```bash
# Run the setup wizard
spiral onboard
```

It will ask for:
- **Bot Token** — paste from step 2
- **Bot Name** — display name
- **Prefix** — command prefix (default: `!`)
- **Intents** — `Guilds`, `GuildMessages`, `MessageContent` (minimum)
- **Client ID** — the application ID from step 2

This creates `spiral.json` in the current directory.

## Step 4: Create Your First Plugin

Create a folder structure:

```bash
mkdir -p plugins/hello
```

Create `plugins/hello/plugin.json`:

```json
{
  "name": "hello",
  "version": "1.0.0",
  "description": "My first plugin",
  "collision_policy": "last-wins"
}
```

Create `plugins/hello/index.js`:

```javascript
module.exports = {
  commands: {
    hello: {
      description: 'Say hello',
      execute: async (message, args, runtime) => {
        await message.reply('Hello world!');
      }
    },
    ping: {
      description: 'Check latency',
      execute: async (message, args, runtime) => {
        await message.reply('Pong!');
      }
    }
  }
};
```

## Step 5: Start the Bot

```bash
spiral run
```

If everything works:
```
[runtime] Starting Spiralcord v2.6.0
[runtime] Loading plugins...
[runtime] 1 plugins, 2 commands loaded
[runtime] Ready as MyBot#1234 | 1 servers
```

Type `!hello` in your Discord server. The bot replies "Hello world!"

## What's Next

- [Plugin Development](docs/PLUGINS.md) — Add hooks, slash commands, embeds
- [CLI Reference](docs/CLI.md) — All available commands
- [API Reference](docs/API.md) — Runtime methods, database, config

## Troubleshooting

### Bot won't start
```
Error: Bot token is missing or invalid.
```
Make sure `spiral.json` has a valid bot token. Run `spiral onboard` to set it.

### Commands not working
```
No commands registered.
```
Check that your `plugins/` folder has valid plugins with `plugin.json` and `index.js`.

### Plugin not loading
```
[manager] Failed to load my_plugin
```
Check for syntax errors in `index.js`. Make sure `plugin.json` exists with valid JSON.

### "chokidar" not found
```bash
npm install chokidar
```
Required for `spiral run` (REPL mode) and `spiral dev` (auto-reload).
