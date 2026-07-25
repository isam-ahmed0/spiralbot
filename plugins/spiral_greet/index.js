module.exports = {
  keywords: {
    "GREET": async (argsStr, ctxMap, runtime) => {
      const userId = ctxMap.get('user.id');
      console.log(`[Greet] Greeting user ${userId}`);
      await runtime.emitHook('greet:issued', { userId });
    }
  },
  hooks: {
    "greet:issued": async (data, runtime) => {
      console.log(`[Greet Hook] Greeting sent to ${data.userId}`);
    }
  }
};