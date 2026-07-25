const { EmbedBuilder } = require('discord.js');

const balances = new Map();
const lastDaily = new Map();
const lastWork = new Map();

const workResponses = [
  { job: 'Programmer', min: 100, max: 500 },
  { job: 'Designer', min: 80, max: 400 },
  { job: 'Writer', min: 50, max: 300 },
  { job: 'Chef', min: 60, max: 350 },
  { job: 'Driver', min: 40, max: 250 },
  { job: 'Teacher', min: 70, max: 380 },
  { job: 'Doctor', min: 150, max: 600 },
  { job: 'Artist', min: 30, max: 200 }
];

function getBalance(userId) {
  return balances.get(userId) || 0;
}

function addBalance(userId, amount) {
  balances.set(userId, getBalance(userId) + amount);
}

function removeBalance(userId, amount) {
  const current = getBalance(userId);
  if (current < amount) return false;
  balances.set(userId, current - amount);
  return true;
}

module.exports = {
  api: {
    getBalance,
    addBalance,
    removeBalance
  },

  commands: {
    balance: {
      description: 'Check your balance',
      execute: async (message, args, runtime) => {
        const config = runtime.getPluginConfig('spiral_economy');
        const balance = getBalance(message.author.id);
        const symbol = config.currency_symbol || '$';

        const embed = new EmbedBuilder()
          .setColor('#FFD700')
          .setTitle('Your Balance')
          .setDescription(`You have **${symbol}${balance.toLocaleString()}** coins`);

        await message.reply({ embeds: [embed] });
      }
    },

    daily: {
      description: 'Claim daily reward',
      execute: async (message, args, runtime) => {
        const config = runtime.getPluginConfig('spiral_economy');
        const userId = message.author.id;
        const now = Date.now();
        const lastClaim = lastDaily.get(userId) || 0;
        const cooldown = (config.daily_cooldown_hours || 24) * 60 * 60 * 1000;

        if (now - lastClaim < cooldown) {
          const remaining = cooldown - (now - lastClaim);
          const hours = Math.floor(remaining / (1000 * 60 * 60));
          const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
          return message.reply(`You already claimed your daily! Wait ${hours}h ${minutes}m.`);
        }

        const min = config.daily_reward_min || 100;
        const max = config.daily_reward_max || 500;
        const reward = Math.floor(Math.random() * (max - min)) + min;
        addBalance(userId, reward);
        lastDaily.set(userId, now);

        const embed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('Daily Reward!')
          .setDescription(`You received **$${reward}** coins!`);

        await message.reply({ embeds: [embed] });
        await runtime.pluginManager.emitHook('econ:daily', { userId, amount: reward });
      }
    },

    work: {
      description: 'Work to earn money',
      execute: async (message, args, runtime) => {
        const config = runtime.getPluginConfig('spiral_economy');
        const userId = message.author.id;
        const now = Date.now();
        const lastWorkTime = lastWork.get(userId) || 0;
        const cooldown = (config.work_cooldown_minutes || 30) * 60 * 1000;

        if (now - lastWorkTime < cooldown) {
          const remaining = cooldown - (now - lastWorkTime);
          const minutes = Math.floor(remaining / (1000 * 60));
          return message.reply(`You're tired! Wait ${minutes} minutes before working again.`);
        }

        const work = workResponses[Math.floor(Math.random() * workResponses.length)];
        const earned = Math.floor(Math.random() * (work.max - work.min)) + work.min;
        addBalance(userId, earned);
        lastWork.set(userId, now);

        const embed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('Work Complete!')
          .setDescription(`You worked as a **${work.job}** and earned **$${earned}** coins!`);

        await message.reply({ embeds: [embed] });
        await runtime.pluginManager.emitHook('econ:worked', { userId, job: work.job, amount: earned });
      }
    },

    pay: {
      description: 'Pay another user',
      usage: '<user> <amount>',
      execute: async (message, args, runtime) => {
        const userId = message.author.id;
        const target = message.mentions?.users?.first();
        const amount = parseInt(args[args.length - 1]);

        if (!target) return message.reply('Please mention a user to pay.');
        if (!amount || amount <= 0) return message.reply('Please provide a valid amount.');
        if (target.id === userId) return message.reply("You can't pay yourself.");
        if (getBalance(userId) < amount) return message.reply('Insufficient balance.');

        removeBalance(userId, amount);
        addBalance(target.id, amount);

        const embed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('Payment Sent!')
          .setDescription(`You paid **$${amount}** to ${target.tag}`);

        await message.reply({ embeds: [embed] });
        await runtime.pluginManager.emitHook('econ:paid', { from: userId, to: target.id, amount });
      }
    },

    leaderboard: {
      description: 'View richest users',
      execute: async (message, args, runtime) => {
        const sorted = [...balances.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10);

        const embed = new EmbedBuilder()
          .setColor('#FFD700')
          .setTitle('Leaderboard')
          .setDescription(sorted.length === 0 ? 'No data yet.' : '');

        sorted.forEach(([userId, balance], index) => {
          const medals = ['🥇', '🥈', '🥉'];
          const medal = medals[index] || `**${index + 1}.**`;
          embed.addFields({ name: medal, value: `<@${userId}> - **$${balance.toLocaleString()}**`, inline: true });
        });

        await message.reply({ embeds: [embed] });
      }
    }
  },

  hooks: {
    "econ:daily": async (data) => {
      console.log(`[Economy] ${data.userId} claimed daily: $${data.amount}`);
    },
    "econ:worked": async (data) => {
      console.log(`[Economy] ${data.userId} worked as ${data.job}: $${data.amount}`);
    }
  }
};