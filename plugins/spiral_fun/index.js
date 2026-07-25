const { EmbedBuilder } = require('discord.js');

const eightBallResponses = [
  'It is certain.', 'It is decidedly so.', 'Without a doubt.',
  'Yes - definitely.', 'You may rely on it.', 'As I see it, yes.',
  'Most likely.', 'Outlook good.', 'Yes.', 'Signs point to yes.',
  'Reply hazy, try again.', 'Ask again later.', 'Better not tell you now.',
  'Cannot predict now.', 'Concentrate and ask again.',
  'Don\'t count on it.', 'My reply is no.', 'My sources say no.',
  'Outlook not so good.', 'Very doubtful.'
];

module.exports = {
  commands: {
    '8ball': {
      description: 'Ask the magic 8-ball',
      usage: '<question>',
      execute: async (message, args, runtime) => {
        if (!args.join(' ')) return message.reply('Ask a question!');

        const response = eightBallResponses[Math.floor(Math.random() * eightBallResponses.length)];
        const embed = new EmbedBuilder()
          .setColor('#9900FF')
          .setTitle('Magic 8-Ball')
          .addFields(
            { name: 'Question', value: args.join(' ') },
            { name: 'Answer', value: response }
          );

        await message.reply({ embeds: [embed] });
      }
    },

    coinflip: {
      description: 'Flip a coin',
      execute: async (message, args, runtime) => {
        const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
        const emoji = result === 'Heads' ? '🪙' : '💰';

        const embed = new EmbedBuilder()
          .setColor('#FFD700')
          .setTitle('Coin Flip')
          .setDescription(`${emoji} **${result}!**`);

        await message.reply({ embeds: [embed] });
      }
    },

    dice: {
      description: 'Roll dice',
      usage: '[sides]',
      execute: async (message, args, runtime) => {
        const config = runtime.getPluginConfig('spiral_fun');
        const sides = parseInt(args[0]) || config.dice_default_sides || 6;
        const result = Math.floor(Math.random() * sides) + 1;

        const embed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('Dice Roll')
          .setDescription(`🎲 You rolled a **${result}** (1-${sides})`);

        await message.reply({ embeds: [embed] });
      }
    },

    reverse: {
      description: 'Reverse text',
      usage: '<text>',
      execute: async (message, args, runtime) => {
        if (!args.join(' ')) return message.reply('Provide text to reverse!');

        const reversed = args.join(' ').split('').reverse().join('');
        const embed = new EmbedBuilder()
          .setColor('#00FFFF')
          .setTitle('Reversed Text')
          .setDescription(`\`${reversed}\``);

        await message.reply({ embeds: [embed] });
      }
    },

    rate: {
      description: 'Rate something',
      usage: '<thing>',
      execute: async (message, args, runtime) => {
        if (!args.join(' ')) return message.reply('Provide something to rate!');

        const config = runtime.getPluginConfig('spiral_fun');
        const max = config.rate_max || 10;
        const rating = Math.floor(Math.random() * (max + 1));
        const bar = '█'.repeat(rating) + '░'.repeat(max - rating);

        const embed = new EmbedBuilder()
          .setColor('#FF69B4')
          .setTitle('Rate')
          .setDescription(`I rate **${args.join(' ')}** a **${rating}/${max}**\n\`${bar}\``);

        await message.reply({ embeds: [embed] });
      }
    }
  }
};