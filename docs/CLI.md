# Spiralcord CLI

## Install

```bash
npm install spiral-core
```

## Commands

| Command | Description |
|---------|-------------|
| `spiral install <repo>` | Clone a bot from GitHub |
| `spiral run` | Start bot with REPL + auto-reload |
| `spiral run -N` | Start bot without REPL |
| `spiral dev` | Start with auto-reload only |
| `spiral test` | Test all plugins |
| `spiral test --live` | Run live tests with mocks |
| `spiral test --plugin <name>` | Test a specific plugin |
| `spiral doctor` | Check bot health |
| `spiral update` | Update spiralcord |
| `spiral web` | Start web manager |
| `spiral onboard` | Interactive setup wizard |
| `spiral generate <desc>` | Generate a plugin from description |
| `spiral graph` | Show plugin dependency graph |
| `spiral market browse` | Browse marketplace |
| `spiral market search <q>` | Search plugins |
| `spiral market install <name>` | Install a plugin from marketplace |
| `spiral market rate <name> <1-5>` | Rate a plugin |
| `spiral market update` | Check for updates |
| `spiral market info <name>` | Show plugin info |
| `spiral market remove <name>` | Remove a plugin |
| `spiral market submit` | Submit your plugin |
| `spiral plugin <cmd>` | Plugin management (delegates to spm) |

## Getting Started

```bash
# Install
npm install spiral-core

# Clone a bot
spiral install isam-ahmed0/spinning

# Run the setup wizard
spiral onboard

# Start the bot
spiral run
```

## Run Modes

### `spiral run` (default)
Full mode with REPL console and auto-reload. Requires `chokidar` in your project.

### `spiral run -N` (normal mode)
Basic mode without REPL or auto-reload.

### `spiral dev`
Auto-reload only, no REPL console. Useful for development.

## Plugin Management

Use `spiral plugin` to delegate to SPM:

```bash
spiral plugin list
spiral plugin install user/repo
spiral plugin enable <name>
spiral plugin disable <name>
spiral plugin remove <name>
spiral plugin create <name> [js|dsl]
spiral plugin test <name>
spiral plugin info <name>
spiral plugin update
```

Or use `spm` directly:

```bash
spm list
spm install user/repo
```

## Web Manager

```bash
spiral web
# Opens at http://localhost:3000
```

## Doctor

```bash
spiral doctor
```
Checks: Node version, npm, config, plugins, database health.
