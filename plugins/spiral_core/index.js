const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
  hooks: {
    bot_ready: async (payload, runtime) => {
      const commands = [
        new SlashCommandBuilder()
          .setName('ping')
          .setDescription('Check bot latency'),
        new SlashCommandBuilder()
          .setName('help')
          .setDescription('Show all commands'),
        new SlashCommandBuilder()
          .setName('info')
          .setDescription('Show bot information')
      ];
      await runtime.registerSlashCommands(runtime.config.clientId, commands);
      console.log('[core] Slash commands registered');
    }
  },

  commands: {
    ping: {
      description: 'Check bot latency',
      slash: true,
      execute: async (message, args, runtime) => {
        const sent = await message.reply('Pinging...');
        const latency = sent.createdTimestamp - message.createdTimestamp;
        await sent.edit(`Pong! Latency: ${latency}ms`);
      }
    },

    help: {
      description: 'Show all commands',
      slash: true,
      execute: async (message, args, runtime) => {
        const commands = runtime.getAllCommands();
        const lines = [];
        for (const [name, cmd] of commands) {
          if (cmd.hidden) continue;
          const type = cmd.slash ? 'SLASH' : 'PREFIX';
          lines.push(`\`/${name}\` (${type}) — ${cmd.description || 'No description'}`);
        }
        const embed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('Commands')
          .setDescription(lines.join('\n'))
          .setFooter({ text: `${commands.size} commands total` })
          .setTimestamp();
        await message.reply({ embeds: [embed] });
      }
    },

    info: {
      description: 'Show bot information',
      slash: true,
      execute: async (message, args, runtime) => {
        const uptime = runtime.getUptime();
        const h = Math.floor(uptime / 3600000);
        const m = Math.floor((uptime % 3600000) / 60000);
        const embed = new EmbedBuilder()
          .setColor('#5865F2')
          .setTitle('Bot Info')
          .addFields(
            { name: 'Name', value: runtime.config.name, inline: true },
            { name: 'Uptime', value: `${h}h ${m}m`, inline: true },
            { name: 'Servers', value: `${runtime.client.guilds.cache.size}`, inline: true }
          )
          .setTimestamp();
        await message.reply({ embeds: [embed] });
      }
    }
  }
};
