const conversationCache = new Map();
const cooldowns = new Map();

module.exports = {
  hooks: {
    message_received: async (payload, runtime) => {
      const { message } = payload;
      const config = runtime.getPluginConfig('spiral_ai');

      if (!config || !config.enabled || !config.apiKey) return;

      const content = message.content.toLowerCase();
      const trigger = config.trigger || '!ask';

      if (!content.startsWith(trigger) && !message.mentions.has(runtime.client.user)) return;

      const userId = message.author.id;

      if (cooldowns.has(userId)) {
        const remaining = cooldowns.get(userId) - Date.now();
        if (remaining > 0) {
          return message.reply(`Cooldown! Wait ${Math.ceil(remaining / 1000)}s`);
        }
      }

      let question = content.startsWith(trigger)
        ? message.content.slice(trigger.length).trim()
        : message.content.replace(/<@!?\d+>/g, '').trim();

      if (!question) {
        return message.reply(`Usage: ${trigger} <your question>`);
      }

      cooldowns.set(userId, Date.now() + (config.cooldown || 5) * 1000);
      setTimeout(() => cooldowns.delete(userId), (config.cooldown || 5) * 1000);

      const sent = await message.reply('Thinking...');

      try {
        const history = conversationCache.get(userId) || [];
        history.push({ role: 'user', content: question });

        const maxHistory = config.maxHistory || 10;
        const trimmedHistory = history.slice(-maxHistory);

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`
          },
          body: JSON.stringify({
            model: config.model || 'gpt-3.5-turbo',
            messages: [
              { role: 'system', content: config.systemPrompt || 'You are a helpful bot.' },
              ...trimmedHistory
            ],
            max_tokens: 500
          })
        });

        const data = await response.json();

        if (data.error) {
          await sent.edit(`Error: ${data.error.message}`);
          return;
        }

        const reply = data.choices[0].message.content;
        history.push({ role: 'assistant', content: reply });

        if (history.length > maxHistory) {
          conversationCache.set(userId, history.slice(-maxHistory));
        } else {
          conversationCache.set(userId, history);
        }

        if (reply.length > 2000) {
          await sent.edit(reply.substring(0, 2000));
        } else {
          await sent.edit(reply);
        }
      } catch (error) {
        console.error('[ai] Error:', error.message);
        await sent.edit('Failed to get AI response. Check API key.');
      }
    }
  },

  api: {
    clearHistory: (userId) => {
      conversationCache.delete(userId);
    },
    getHistory: (userId) => {
      return conversationCache.get(userId) || [];
    }
  }
};