# SpiralCord Example Bot

Minimal example bot showcasing SpiralCord's plugin-only architecture.

## Quick Start

```bash
npm install
spiral onboard    # enter your bot token + client id
spiral run        # start the bot
```

## What's Included

| Plugin | Type | Commands |
|--------|------|----------|
| `spiral_core` | JS (slash) | `/ping`, `/help`, `/info` |
| `spiral_greetings` | JS (prefix) | `!hello`, `!goodbye` + hooks |
| `spiral_fun` | SpiralScript (slash) | `/8ball`, `/coinflip`, `/dice` |
| `spiral_economy` | SpiralScript (both) | `/balance`, `/daily`, `!balance`, `!daily` + config |

## Plugins

- **spiral_core** — Core slash commands. Registers with Discord via `bot_ready` hook.
- **spiral_greetings** — Prefix commands with event hooks. Logs commands to console.
- **spiral_fun** — Pure SpiralScript. No JavaScript needed — just `.spi` file.
- **spiral_economy** — SpiralScript with both slash + prefix, config system, and database.

## Learn More

- [Plugin Development Guide](PLUGIN_GUIDE.md) — JS, SpiralScript, config, hooks
- [SpiralCord Docs](https://github.com/spiralcord/spiralcord) — Full documentation

## License

MIT
