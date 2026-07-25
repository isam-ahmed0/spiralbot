const { ActivityType, PresenceUpdateStatus } = require('discord.js');

const ACTIVITY_MAP = {
  'Playing': ActivityType.Playing,
  'Listening': ActivityType.Listening,
  'Watching': ActivityType.Watching,
  'Streaming': ActivityType.Streaming,
  'Competing': ActivityType.Competing
};

const STATUS_MAP = {
  'online': PresenceUpdateStatus.Online,
  'idle': PresenceUpdateStatus.Idle,
  'dnd': PresenceUpdateStatus.DoNotDisturb,
  'invisible': PresenceUpdateStatus.Invisible
};

let rotationTimer = null;
let rotationIndex = 0;

module.exports = {
  hooks: {
    bot_ready: async (payload, runtime) => {
      const { client } = payload;
      const config = runtime.getPluginConfig('spiral_presence');

      if (config.enabled === false) return;

      await setPresence(client, config);

      if (config.randomRotation && config.rotationMessages?.length > 0) {
        startRotation(client, config);
      }
    }
  },

  api: {
    setCustomStatus: async (client, statusType, activityType, message, runtime) => {
      const activityTypeEnum = ACTIVITY_MAP[activityType] || ActivityType.Playing;
      const statusTypeEnum = STATUS_MAP[statusType] || PresenceUpdateStatus.Online;

      await client.user.setPresence({
        activities: [{ type: activityTypeEnum, name: message }],
        status: statusTypeEnum
      });
    },

    rotateStatus: async (client, messages, runtime) => {
      if (rotationTimer) clearInterval(rotationTimer);
      if (messages.length === 0) return;

      rotationIndex = 0;
      rotationTimer = setInterval(async () => {
        const config = runtime.getPluginConfig('spiral_presence');
        await client.user.setPresence({
          activities: [{
            type: ACTIVITY_MAP[config.activityType] || ActivityType.Playing,
            name: messages[rotationIndex]
          }],
          status: STATUS_MAP[config.statusType] || PresenceUpdateStatus.Online
        });
        rotationIndex = (rotationIndex + 1) % messages.length;
      }, runtime.getPluginConfig('spiral_presence').rotationInterval || 30000);
    },

    stopRotation: () => {
      if (rotationTimer) {
        clearInterval(rotationTimer);
        rotationTimer = null;
      }
    },

    getStatus: (client) => {
      return {
        status: client.user.presence?.status,
        activities: client.user.presence?.activities
      };
    }
  }
};

async function setPresence(client, config) {
  const activityType = ACTIVITY_MAP[config.activityType] || ActivityType.Playing;
  const status = STATUS_MAP[config.statusType] || PresenceUpdateStatus.Online;

  const activity = {
    type: activityType,
    name: config.statusMessage || 'Spiral Bot'
  };

  if (config.activityType === 'Streaming' && config.streamingUrl) {
    activity.url = config.streamingUrl;
  }

  await client.user.setPresence({
    activities: [activity],
    status: status
  });
}

function startRotation(client, config) {
  if (rotationTimer) clearInterval(rotationTimer);

  rotationIndex = 0;
  const messages = config.rotationMessages;

  rotationTimer = setInterval(async () => {
    await client.user.setPresence({
      activities: [{
        type: ACTIVITY_MAP[config.activityType] || ActivityType.Playing,
        name: messages[rotationIndex]
      }],
      status: STATUS_MAP[config.statusType] || PresenceUpdateStatus.Online
    });
    rotationIndex = (rotationIndex + 1) % messages.length;
  }, config.rotationInterval || 30000);
}