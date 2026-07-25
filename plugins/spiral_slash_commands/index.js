const { REST, Routes } = require('discord.js');

module.exports = {
  hooks: {
    bot_ready: async (payload, runtime) => {
      const { client } = payload;
      const config = runtime.getPluginConfig('spiral_slash_commands');

      if (config.enabled === false || config.autoRegister === false) return;

      const clientId = config.clientId || runtime.config.clientId;
      if (!clientId) {
        console.log('No clientId found - skipping slash command registration');
        return;
      }

      const slashCommands = runtime.pluginManager.getSlashCommands();
      if (slashCommands.length === 0) return;

      const commandsData = slashCommands.map(cmd => ({
        name: cmd.name,
        description: cmd.description,
        options: []
      }));

      try {
        const rest = new REST({ version: '10' }).setToken(runtime.config.token);
        await rest.put(Routes.applicationCommands(clientId), { body: commandsData });
        console.log(`Registered ${commandsData.length} slash commands`);
      } catch (error) {
        console.error('Failed to register slash commands:', error.message);
      }
    },

    interaction_received: async (payload, runtime) => {
      const { interaction } = payload;
      if (!interaction.isChatInputCommand()) return;

      const commandName = interaction.commandName;
      const cmd = runtime.pluginManager.getCommand(commandName);

      if (!cmd) {
        await interaction.reply({ content: 'Command not found.', ephemeral: true });
        return;
      }

      try {
        await cmd.handler(interaction, interaction.options.data.map(o => o.value), runtime);
      } catch (error) {
        console.error(`Error executing slash command ${commandName}:`, error);
        const reply = { content: 'An error occurred.', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(reply);
        } else {
          await interaction.reply(reply);
        }
      }
    }
  },

  api: {
    registerCommands: async (client, commands, runtime) => {
      const clientId = runtime.config.clientId;
      if (!clientId) return;

      const rest = new REST({ version: '10' }).setToken(runtime.config.token);
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
    },

    unregisterAll: async (client, runtime) => {
      const clientId = runtime.config.clientId;
      if (!clientId) return;

      const rest = new REST({ version: '10' }).setToken(runtime.config.token);
      await rest.put(Routes.applicationCommands(clientId), { body: [] });
    }
  }
};