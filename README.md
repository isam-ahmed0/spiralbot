# Spiral Bot

A customizable Discord bot with plugin system.

## Quick Start

1. Fork or clone this repo
2. Edit `spiral.json` - add your bot token
3. Run `npm install`
4. Run `spiral run`

## Commands

| Command | Description | Permission |
|---------|-------------|------------|
| `!help` | Show all commands | None |
| `!ping` | Check bot latency | None |
| `!info` | Bot information | None |
| `!server` | Server info | None |
| `!user [user]` | User info | None |
| `!restart` | Restart bot | Administrator |
| `!shutdown` | Stop bot | Administrator |
| `!purge <amount>` | Delete messages | Manage Messages |
| `!kick <user> [reason]` | Kick user | Kick Members |
| `!ban <user> [reason]` | Ban user | Ban Members |
| `!balance` | Check balance | None |
| `!daily` | Daily reward | None |
| `!work` | Work for coins | None |
| `!pay <user> <amount>` | Pay user | None |
| `!leaderboard` | Top users | None |
| `!mute <user>` | Mute user | Manage Roles |
| `!unmute <user>` | Unmute user | Manage Roles |
| `!warn <user> [reason]` | Warn user | Manage Messages |
| `!warnings [user]` | Check warnings | None |
| `!remind <time> <message>` | Set reminder | None |
| `!afk [message]` | Set AFK | None |
| `!8ball <question>` | Ask magic 8-ball | None |
| `!coinflip` | Flip a coin | None |
| `!dice` | Roll dice | None |
| `!reverse <text>` | Reverse text | None |
| `!rate <thing>` | Rate something | None |

## Plugins

All features are plugins. Edit, remove, or create new ones in `plugins/` folder.

### Plugin Structure

```
plugins/
  my_plugin/
    plugin.json      # Plugin manifest
    index.js         # Plugin code
    config.json      # Plugin config
    config.schema.json  # Config schema (optional)
```

### Create a Plugin

```bash
spm create my_plugin
```

### Manage Plugins

```bash
spm list           # List all plugins
spm enable <name>  # Enable plugin
spm disable <name> # Disable plugin
spm remove <name>  # Remove plugin
spm test <name>    # Test plugin
spm info <name>    # Show plugin info
```

## Development

### Auto-reload

```bash
spiral dev
```

Watches `plugins/` and `src/` for changes and auto-reloads.

### Interactive REPL

```bash
spiral run -R
```

Starts the bot with auto-reload + interactive console:

```
spiral> .status
Uptime: 0h 5m 30s | Servers: 5 | Users: 200

spiral> spm.plugins
  ● spiral_core v1.0.0 — Core plugin
  ● spiral_economy v1.0.0 — Economy system

spiral> .reload
Plugins reloaded.

spiral> .exit
Bot continues running.
```

#### Bot REPL Commands

| Command | Description |
|---------|-------------|
| `.status` | Show uptime, servers, users |
| `.reload` | Hot-reload all plugins |
| `.stop` | Stop the bot |
| `.commands` | List all registered commands |

#### SPM REPL Commands

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

## Configuration

Edit `spiral.json`:

```json
{
  "name": "My Bot",
  "token": "YOUR_TOKEN_HERE",
  "prefix": "!",
  "intents": ["Guilds", "GuildMessages", "MessageContent"]
}
```

## Plugin Config

Each plugin has its own `config.json` in its folder. Edit directly or use the web manager:

```bash
spiral web
```

Open http://localhost:3000 to manage plugins visually.

## Status

The bot's status is controlled by `plugins/spiral_presence/config.json`:

```json
{
  "enabled": true,
  "statusType": "online",
  "activityType": "Playing",
  "statusMessage": "Spiral Bot | !help"
}
```

Status types: `online`, `idle`, `dnd`, `offline`, `invisible`
Activity types: `Playing`, `Listening`, `Watching`, `Streaming`, `Competing`

## License

MIT
