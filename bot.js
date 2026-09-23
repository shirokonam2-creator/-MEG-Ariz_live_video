require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Events,
  EmbedBuilder
} = require("discord.js");

const {
  createWatchRoom
} = require("./watch/watchRoom");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ]
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`✅ Bot đã đăng nhập: ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  // Xử lý slash command
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "watch") {
      const url = interaction.options.getString("url");

      if (!url) {
        await interaction.reply({
          content: "❌ Bạn chưa nhập link video.",
          ephemeral: true
        });
        return;
      }

      const room = createWatchRoom(
        url,
        interaction.user
      );

      await interaction.reply(room);
    }

    return;
  }

  // Xử lý nút ℹ️ Thông tin
  if (interaction.isButton()) {
    if (interaction.customId === "watch_info") {
      const infoEmbed = new EmbedBuilder()
        .setTitle("ℹ️ Thông tin Arizu Cinema")
        .setDescription(
          `🎬 **Phòng xem Arizu Cinema**\n\n` +
          `👤 Người xem: ${interaction.user}\n` +
          `📺 Hệ thống phòng xem đang hoạt động.\n\n` +
          `⚠️ Video được mở thông qua liên kết gốc.`
        )
        .setTimestamp();

      await interaction.reply({
        embeds: [infoEmbed],
        ephemeral: true
      });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);