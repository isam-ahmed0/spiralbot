const { EmbedBuilder } = require('discord.js');

const warnings = new Map();

module.exports = {
  api: {
    getWarnings: (guildId, userId) => warnings.get(guildId)?.get(userId) || []
  },

  commands: {
    mute: {
      description: 'Mute a user',
      usage: '<user> [minutes]',
      execute: async (message, args, runtime) => {
        const config = runtime.getPluginConfig('spiral_moderation');
        const target = message.mentions?.users?.first();
        const duration = parseInt(args[0]) || config.default_mute_duration_minutes || 5;

        if (!target) return message.reply('Please mention a user to mute.');
        if (!message.member.permissions.has('MODERATE_MEMBERS')) {
          return message.reply('You need `Moderate Members` permission.');
        }

        try {
          const member = message.guild.members.cache.get(target.id);
          await member.timeout(duration * 60 * 1000, 'Muted by Spiral');
          await message.reply(`Muted ${target.tag} for ${duration} minutes.`);
          await runtime.pluginManager.emitHook('mod:muted', { userId: target.id, duration, moderator: message.author.id });
        } catch (error) {
          await message.reply('Failed to mute user.');
        }
      }
    },

    unmute: {
      description: 'Unmute a user',
      usage: '<user>',
      execute: async (message, args, runtime) => {
        const target = message.mentions?.users?.first();

        if (!target) return message.reply('Please mention a user to unmute.');
        if (!message.member.permissions.has('MODERATE_MEMBERS')) {
          return message.reply('You need `Moderate Members` permission.');
        }

        try {
          const member = message.guild.members.cache.get(target.id);
          await member.timeout(null, 'Unmuted by Spiral');
          await message.reply(`Unmuted ${target.tag}.`);
          await runtime.pluginManager.emitHook('mod:unmuted', { userId: target.id, moderator: message.author.id });
        } catch (error) {
          await message.reply('Failed to unmute user.');
        }
      }
    },

    warn: {
      description: 'Warn a user',
      usage: '<user> [reason]',
      execute: async (message, args, runtime) => {
        const target = message.mentions?.users?.first();
        const reason = args.slice(1).join(' ') || 'No reason provided';

        if (!target) return message.reply('Please mention a user to warn.');
        if (!message.member.permissions.has('MODERATE_MEMBERS')) {
          return message.reply('You need `Moderate Members` permission.');
        }

        const guildId = message.guild.id;
        if (!warnings.has(guildId)) warnings.set(guildId, new Map());
        const guildWarnings = warnings.get(guildId);
        if (!guildWarnings.has(target.id)) guildWarnings.set(target.id, []);

        guildWarnings.get(target.id).push({
          reason,
          moderator: message.author.id,
          timestamp: Date.now()
        });

        const count = guildWarnings.get(target.id).length;
        const embed = new EmbedBuilder()
          .setColor('#FFFF00')
          .setTitle('User Warned')
          .setDescription(`${target.tag} has been warned.`)
          .addFields(
            { name: 'Reason', value: reason },
            { name: 'Total Warnings', value: `${count}` }
          );

        await message.reply({ embeds: [embed] });
        await runtime.pluginManager.emitHook('mod:warned', { userId: target.id, reason, count, moderator: message.author.id });
      }
    },

    warnings: {
      description: 'View warnings for a user',
      usage: '[user]',
      execute: async (message, args, runtime) => {
        const target = message.mentions?.users?.first() || message.author;
        const guildId = message.guild.id;
        const guildWarnings = warnings.get(guildId);
        const userWarnings = guildWarnings?.get(target.id) || [];

        const embed = new EmbedBuilder()
          .setColor('#FFFF00')
          .setTitle(`Warnings for ${target.tag}`)
          .setDescription(userWarnings.length === 0 ? 'No warnings.' : '');

        userWarnings.forEach((w, i) => {
          embed.addFields({
            name: `Warning ${i + 1}`,
            value: `Reason: ${w.reason}\nModerator: <@${w.moderator}>\nDate: <t:${Math.floor(w.timestamp / 1000)}:R>`
          });
        });

        await message.reply({ embeds: [embed] });
      }
    }
  },

  hooks: {
    "mod:muted": async (data) => {
      console.log(`[Moderation] User ${data.userId} muted for ${data.duration} min`);
    },
    "mod:warned": async (data) => {
      console.log(`[Moderation] User ${data.userId} warned (${data.count} total)`);
    }
  }
};