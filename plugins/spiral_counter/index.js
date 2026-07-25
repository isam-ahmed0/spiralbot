const { EmbedBuilder } = require('discord.js');
const counters = new Map();

module.exports = {
  commands: {
    count: {
      description: 'Show your current count',
      execute: async (message, args, runtime) => {
        const userId = message.author.id;
        const count = counters.get(userId) || 0;
        await message.reply(`Your count: **${count}**`);
      }
    },

    countup: {
      description: 'Add 1 to your count',
      execute: async (message, args, runtime) => {
        const config = runtime.getPluginConfig('spiral_counter');
        const userId = message.author.id;
        const current = counters.get(userId) || 0;
        const max = config.maxCount || 1000;

        if (current >= max) {
          return message.reply(`Max count reached! (${max})`);
        }

        counters.set(userId, current + 1);
        await message.reply(`Count: **${current + 1}**`);
      }
    },

    countdown: {
      description: 'Subtract 1 from your count',
      execute: async (message, args, runtime) => {
        const config = runtime.getPluginConfig('spiral_counter');
        const userId = message.author.id;
        const current = counters.get(userId) || 0;
        const min = config.minCount || -1000;

        if (current <= min) {
          return message.reply(`Min count reached! (${min})`);
        }

        counters.set(userId, current - 1);
        await message.reply(`Count: **${current - 1}**`);
      }
    },

    countset: {
      description: 'Set your count',
      usage: '<number>',
      execute: async (message, args, runtime) => {
        const config = runtime.getPluginConfig('spiral_counter');
        const num = parseInt(args[0]);

        if (isNaN(num)) {
          return message.reply('Please provide a valid number.');
        }

        const min = config.minCount || -1000;
        const max = config.maxCount || 1000;

        if (num < min || num > max) {
          return message.reply(`Number must be between ${min} and ${max}.`);
        }

        counters.set(message.author.id, num);
        await message.reply(`Count set to: **${num}**`);
      }
    },

    countreset: {
      description: 'Reset your count to 0',
      execute: async (message, args, runtime) => {
        counters.set(message.author.id, 0);
        await message.reply('Count reset to **0**');
      }
    },

    countleaderboard: {
      description: 'Show top counters',
      aliases: ['countlb'],
      execute: async (message, args, runtime) => {
        const sorted = [...counters.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10);

        if (sorted.length === 0) {
          return message.reply('No counts yet!');
        }

        const embed = new EmbedBuilder()
          .setColor('#FFD700')
          .setTitle('Counter Leaderboard')
          .setTimestamp();

        const lines = sorted.map(([id, count], i) => {
          return `${i + 1}. <@${id}>: **${count}**`;
        });

        embed.setDescription(lines.join('\n'));
        await message.reply({ embeds: [embed] });
      }
    }
  }
};