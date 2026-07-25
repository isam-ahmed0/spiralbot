module.exports = {
  hooks: {
    message_received: async (payload, runtime) => {
      const { message } = payload;
      const config = runtime.getPluginConfig('spiral_command_dispatch');

      if (config.enabled === false) return;

      const prefix = runtime.config.prefix || '!';
      if (!message.content.startsWith(prefix)) return;

      const args = message.content.slice(prefix.length).trim().split(/\s+/);
      let commandName = args.shift();

      if (!commandName) return;

      if (!config.caseSensitive) {
        commandName = commandName.toLowerCase();
      }

      const disabledCommands = runtime.config.disabledCommands || [];
      if (disabledCommands.includes(commandName)) {
        await message.reply(`Command \`${commandName}\` has been disabled.`);
        return;
      }

      if (config.autoDeleteCommand) {
        try { await message.delete(); } catch {}
      }

      const executed = await runtime.pluginManager.executeCommand(commandName, message, args);
      if (executed) return;
    }
  }
};