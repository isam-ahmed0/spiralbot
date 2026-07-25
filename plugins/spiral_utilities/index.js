const { EmbedBuilder } = require('discord.js');

const afkUsers = new Map();

module.exports = {
  commands: {
    remind: {
      description: 'Set a reminder',
      usage: '<time> <message>',
      execute: async (message, args, runtime) => {
        if (args.length < 2) {
          return message.reply('Usage: `!remind <time> <message>` (e.g., `!remind 30m Check oven`)');
        }

        const timeStr = args[0];
        const reminderText = args.slice(1).join(' ');
        let ms = 0;

        const timeMatch = timeStr.match(/^(\d+)(s|m|h|d)$/);
        if (!timeMatch) return message.reply('Invalid time format. Use s/m/h/d (e.g., 30m, 2h, 1d)');

        const [, amount, unit] = timeMatch;
        const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
        ms = parseInt(amount) * multipliers[unit];

        const config = runtime.getPluginConfig('spiral_utilities');
        const maxMs = (config.max_reminder_days || 7) * 86400000;
        if (ms > maxMs) return message.reply(`Maximum reminder time is ${config.max_reminder_days || 7} days.`);

        const embed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('Reminder Set!')
          .setDescription(`I'll remind you about: **${reminderText}**`)
          .addFields({ name: 'In', value: timeStr });

        await message.reply({ embeds: [embed] });

        setTimeout(async () => {
          try {
            await message.channel.send(`<@${message.author.id}> Reminder: **${reminderText}**`);
          } catch (e) {}
        }, ms);
      }
    },

    afk: {
      description: 'Set AFK status',
      usage: '[reason]',
      execute: async (message, args, runtime) => {
        const config = runtime.getPluginConfig('spiral_utilities');
        const reason = args.join(' ') || config.afk_message || 'AFK';

        afkUsers.set(message.author.id, {
          reason,
          timestamp: Date.now()
        });

        const embed = new EmbedBuilder()
          .setColor('#FFFF00')
          .setTitle('AFK Set')
          .setDescription(`You are now AFK: **${reason}**`);

        await message.reply({ embeds: [embed] });
      }
    },

    timestamp: {
      description: 'Get timestamp info',
      execute: async (message, args, runtime) => {
        const now = new Date();

        const embed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('Timestamps')
          .addFields(
            { name: 'Unix', value: `${Math.floor(now.getTime() / 1000)}`, inline: true },
            { name: 'ISO', value: now.toISOString(), inline: true },
            { name: 'Discord', value: `<t:${Math.floor(now.getTime() / 1000)}:F>`, inline: true }
          );

        await message.reply({ embeds: [embed] });
      }
    },

    uptime: {
      description: 'Check bot uptime',
      execute: async (message, args, runtime) => {
        const uptime = runtime.client.uptime;
        const days = Math.floor(uptime / 86400000);
        const hours = Math.floor(uptime % 86400000 / 3600000);
        const minutes = Math.floor(uptime % 3600000 / 60000);
        const seconds = Math.floor(uptime % 60000 / 1000);

        const embed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('Bot Uptime')
          .setDescription(`${days}d ${hours}h ${minutes}m ${seconds}s`);

        await message.reply({ embeds: [embed] });
      }
    }
  },

  hooks: {}
};