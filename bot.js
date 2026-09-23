require("dotenv").config();

const http = require("http");

const {
  Client,
  GatewayIntentBits,
  Events,
  EmbedBuilder
} = require("discord.js");

const {
  createWatchRoom
} = require("./watchRoom");

// ===============================
// HTTP SERVER FOR RENDER
// ===============================

const PORT = process.env.PORT || 10000;

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8"
  });

  res.end("Arizu Cinema Bot is online!");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 HTTP server đang chạy trên port ${PORT}`);
});

// ===============================
// DISCORD CLIENT
// ===============================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ]
});

// ===============================
// BOT READY
// ===============================

client.once(Events.ClientReady, (readyClient) => {
  console.log(`✅ Bot đã đăng nhập: ${readyClient.user.tag}`);
  console.log(`🎬 Arizu Cinema đang hoạt động!`);
});

// ===============================
// INTERACTIONS
// ===============================

client.on(Events.InteractionCreate, async (interaction) => {
  try {

    // ===========================
    // SLASH COMMAND
    // ===========================

    if (interaction.isChatInputCommand()) {

      // /watch
      if (interaction.commandName === "watch") {

        const url = interaction.options.getString("url");

        if (!url) {
          await interaction.reply({
            content: "❌ Bạn chưa nhập link video.",
            ephemeral: true
          });

          return;
        }

        // Tạo phòng xem
        const room = createWatchRoom(
          url,
          interaction.user
        );

        await interaction.reply(room);

        console.log(
          `🎬 ${interaction.user.tag} đã tạo phòng xem: ${url}`
        );
      }

      return;
    }

    // ===========================
    // BUTTON
    // ===========================

    if (interaction.isButton()) {

      // Nút thông tin
      if (interaction.customId === "watch_info") {

        const infoEmbed = new EmbedBuilder()
          .setTitle("ℹ️ Thông tin Arizu Cinema")
          .setDescription(
            `🎬 **Phòng xem Arizu Cinema**\n\n` +
            `👤 Người xem: ${interaction.user}\n` +
            `📺 Hệ thống phòng xem đang hoạt động.\n\n` +
            `🔗 Video được mở thông qua liên kết gốc.\n\n` +
            `⚠️ Arizu Cinema không tải hoặc lưu lại video.`
          )
          .setTimestamp();

        await interaction.reply({
          embeds: [infoEmbed],
          ephemeral: true
        });
      }
    }

  } catch (error) {

    console.error("❌ Lỗi Interaction:", error);

    // Nếu interaction chưa được trả lời
    if (!interaction.replied && !interaction.deferred) {

      await interaction.reply({
        content: "❌ Đã xảy ra lỗi khi xử lý yêu cầu.",
        ephemeral: true
      });

    }
  }
});

// ===============================
// DISCORD LOGIN
// ===============================

if (!process.env.DISCORD_TOKEN) {

  console.error(
    "❌ Không tìm thấy DISCORD_TOKEN trong Environment Variables!"
  );

  process.exit(1);
}

client.login(process.env.DISCORD_TOKEN)
  .then(() => {
    console.log("🔐 Đang kết nối tới Discord...");
  })
  .catch((error) => {
    console.error("❌ Không thể đăng nhập Discord:", error);
    process.exit(1);
  }); 
