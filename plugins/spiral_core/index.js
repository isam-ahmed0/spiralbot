const { EmbedBuilder } = require('discord.js');

function formatUptime(ms) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / 1000 / 60) % 60);
  const hours = Math.floor((ms / 1000 / 60 / 60) % 24);
  const days = Math.floor(ms / 1000 / 60 / 60 / 24);
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

module.exports = {
  commands: {
    help: {
      description: 'Show all available commands',
      usage: '[command]',
      execute: async (message, args, runtime) => {
        const prefix = runtime.config.prefix || '!';

        if (args[0]) {
          const cmd = runtime.getCommand(args[0]);
          if (!cmd) return message.reply('Command not found.');

          const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle(`Command: ${prefix}${args[0]}`)
            .setDescription(cmd.description)
            .addFields(
              { name: 'Usage', value: `\`${prefix}${args[0]} ${cmd.usage || ''}\`` },
              { name: 'Plugin', value: cmd.plugin || 'spiral_core' }
            );
          return message.reply({ embeds: [embed] });
        }

        const embed = new EmbedBuilder()
          .setColor('#0099FF')
          .setTitle('Spiral Bot Commands')
          .setTimestamp();

        const commandsByPlugin = {};
        for (const [name, cmd] of runtime.getAllCommands()) {
          const plugin = cmd.plugin || 'spiral_core';
          if (!commandsByPlugin[plugin]) commandsByPlugin[plugin] = [];
          commandsByPlugin[plugin].push(`\`${prefix}${name}\` - ${cmd.description}`);
        }

        for (const [plugin, cmds] of Object.entries(commandsByPlugin)) {
          embed.addFields({ name: plugin, value: cmds.join('\n') });
        }

        return message.reply({ embeds: [embed] });
      }
    },

    ping: {
      description: 'Check bot latency',
      execute: async (message, args, runtime) => {
        const sent = await message.reply('Pinging...');
        const latency = sent.createdMessageTimestamp - message.createdTimestamp;
        const apiLatency = Math.round(runtime.client.ws.ping);

        const embed = new EmbedBuilder()
          .setColor('#FFFF00')
          .setTitle('Pong!')
          .addFields(
            { name: 'Bot Latency', value: `\`${latency}ms\``, inline: true },
            { name: 'API Latency', value: `\`${apiLatency}ms\``, inline: true }
          );
        return sent.edit({ content: null, embeds: [embed] });
      }
    },

    info: {
      description: 'Show bot information',
      execute: async (message, args, runtime) => {
        const uptime = formatUptime(runtime.client.uptime);
        const embed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('Spiral Bot Info')
          .setThumbnail(runtime.client.user.displayAvatarURL())
          .addFields(
            { name: 'Bot Name', value: runtime.client.user.username, inline: true },
            { name: 'Servers', value: `${runtime.client.guilds.cache.size}`, inline: true },
            { name: 'Uptime', value: uptime, inline: true },
            { name: 'Plugins', value: `${runtime.pluginManager.getPlugins().length}`, inline: true },
            { name: 'Commands', value: `${runtime.getAllCommands().size}`, inline: true },
            { name: 'Node.js', value: process.version, inline: true }
          )
          .setTimestamp();
        return message.reply({ embeds: [embed] });
      }
    },

    server: {
      description: 'Show server information',
      execute: async (message, args, runtime) => {
        if (!message.guild) return message.reply('This command can only be used in a server.');

        const guild = message.guild;
        const embed = new EmbedBuilder()
          .setColor('#FF00FF')
          .setTitle(guild.name)
          .setThumbnail(guild.iconURL())
          .addFields(
            { name: 'Server ID', value: guild.id, inline: true },
            { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
            { name: 'Members', value: `${guild.memberCount}`, inline: true },
            { name: 'Channels', value: `${guild.channels.cache.size}`, inline: true },
            { name: 'Roles', value: `${guild.roles.cache.size}`, inline: true },
            { name: 'Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true }
          );
        return message.reply({ embeds: [embed] });
      }
    },

    user: {
      description: 'Show user information',
      usage: '[user]',
      execute: async (message, args, runtime) => {
        const user = message.mentions.users.first() || message.author;
        const member = message.guild?.members.cache.get(user.id);

        const embed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle(user.username)
          .setThumbnail(user.displayAvatarURL())
          .addFields(
            { name: 'ID', value: user.id, inline: true },
            { name: 'Bot', value: user.bot ? 'Yes' : 'No', inline: true },
            { name: 'Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true }
          );

        if (member) {
          embed.addFields(
            { name: 'Joined', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
            { name: 'Nickname', value: member.nickname || 'None', inline: true }
          );
        }

        return message.reply({ embeds: [embed] });
      }
    },

    purge: {
      description: 'Delete multiple messages',
      usage: '<amount>',
      execute: async (message, args, runtime) => {
        if (!message.member.permissions.has('MANAGE_MESSAGES')) {
          return message.reply('You need `Manage Messages` permission.');
        }

        const amount = parseInt(args[0]);
        if (!amount || amount < 1 || amount > 100) {
          return message.reply('Please provide a number between 1 and 100.');
        }

        const deleted = await message.channel.bulkDelete(amount + 1, true);
        return message.reply(`Deleted ${deleted.size - 1} messages.`);
      }
    },

    kick: {
      description: 'Kick a user',
      usage: '<user> [reason]',
      execute: async (message, args, runtime) => {
        if (!message.member.permissions.has('KICK_MEMBERS')) {
          return message.reply('You need `Kick Members` permission.');
        }

        const user = message.mentions.users.first();
        if (!user) return message.reply('Please mention a user to kick.');

        const member = message.guild.members.cache.get(user.id);
        if (!member) return message.reply('User not found in this server.');

        const reason = args.slice(1).join(' ') || 'No reason provided';

        try {
          await member.kick(reason);
          return message.reply(`Kicked ${user.tag} for: ${reason}`);
        } catch (error) {
          return message.reply('Failed to kick user.');
        }
      }
    },

    ban: {
      description: 'Ban a user',
      usage: '<user> [reason]',
      execute: async (message, args, runtime) => {
        if (!message.member.permissions.has('BAN_MEMBERS')) {
          return message.reply('You need `Ban Members` permission.');
        }

        const user = message.mentions.users.first();
        if (!user) return message.reply('Please mention a user to ban.');

        const member = message.guild.members.cache.get(user.id);
        if (!member) return message.reply('User not found in this server.');

        const reason = args.slice(1).join(' ') || 'No reason provided';

        try {
          await member.ban({ reason });
          return message.reply(`Banned ${user.tag} for: ${reason}`);
        } catch (error) {
          return message.reply('Failed to ban user.');
        }
      }
    },

    restart: {
      description: 'Restart the bot without stopping the process',
      execute: async (message, args, runtime) => {
        if (!message.member.permissions.has('ADMINISTRATOR')) {
          return message.reply('You need `Administrator` permission.');
        }

        const sent = await message.reply('Restarting bot...');

        try {
          await runtime.restart();
          await sent.edit('Bot restarted successfully!');
        } catch (error) {
          console.error('[restart] Failed:', error.message);
          await sent.edit('Failed to restart bot. Check console for errors.');
        }
      }
    },

    shutdown: {
      description: 'Stop the bot completely',
      execute: async (message, args, runtime) => {
        if (!message.member.permissions.has('ADMINISTRATOR')) {
          return message.reply('You need `Administrator` permission.');
        }

        await message.reply('Shutting down...');
        await runtime.stop();
        process.exit(0);
      }
    }
  }
};