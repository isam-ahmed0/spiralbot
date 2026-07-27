module.exports = {
  init: async (config, runtime) => {
    console.log('[greetings] Plugin loaded');
  },

  commands: {
    hello: {
      description: 'Greet someone',
      usage: '[user]',
      aliases: ['hi', 'hey'],
      execute: async (message, args, runtime) => {
        const target = message.mentions.users.first() || message.author;
        await message.reply(`Hello, ${target.username}!`);
      }
    },

    goodbye: {
      description: 'Say goodbye',
      execute: async (message, args, runtime) => {
        await message.reply('Goodbye! See you next time!');
      }
    }
  },

  hooks: {
    bot_ready: async (payload, runtime) => {
      console.log(`[greetings] Online as ${payload.user.tag}`);
    },

    message_received: async (payload, runtime) => {
      const { message } = payload;
      if (message.content.startsWith('!') && !message.author.bot) {
        const cmd = message.content.split(' ')[0].slice(runtime.config.prefix.length);
        console.log(`[greetings] ${cmd} from ${message.author.tag}`);
      }
    }
  }
};
