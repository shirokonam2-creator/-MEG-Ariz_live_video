require("dotenv").config();

const http = require("http");

const {
  Client,
  GatewayIntentBits,
  Events,
  EmbedBuilder,
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js");

const {
  createWatchRoom
} = require("./watchRoom");

// ================================
// KIỂM TRA ENV
// ================================

if (!process.env.DISCORD_TOKEN) {
  console.error("❌ Thiếu DISCORD_TOKEN!");
  process.exit(1);
}

if (!process.env.CLIENT_ID) {
  console.error("❌ Thiếu CLIENT_ID!");
  process.exit(1);
}

if (!process.env.GUILD_ID) {
  console.error("❌ Thiếu GUILD_ID!");
  process.exit(1);
}

// ================================
// RENDER HTTP SERVER
// ================================

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

// ================================
// DISCORD CLIENT
// ================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ]
});

// ================================
// LỆNH /WATCH
// ================================

const commands = [
  new SlashCommandBuilder()
    .setName("watch")
    .setDescription("Tạo phòng xem video")
    .addStringOption(option =>
      option
        .setName("url")
        .setDescription("Link video")
        .setRequired(true)
    )
    .toJSON()
];

// ================================
// ĐĂNG KÝ SLASH COMMAND
// ================================

async function registerCommands() {
  try {
    console.log("⏳ Đang đăng ký /watch...");

    const rest = new REST({
      version: "10"
    }).setToken(process.env.DISCORD_TOKEN);

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      {
        body: commands
      }
    );

    console.log("✅ Đã đăng ký /watch thành công!");
  } catch (error) {
    console.error("❌ Không đăng ký được /watch:");
    console.error(error);
  }
}

// ================================
// BOT READY
// ================================

client.once(Events.ClientReady, readyClient => {
  console.log(`✅ Bot đã đăng nhập: ${readyClient.user.tag}`);
  console.log("🎬 Arizu Cinema đang hoạt động!");
});

// ================================
// XỬ LÝ TƯƠNG TÁC
// ================================

client.on(Events.InteractionCreate, async interaction => {

  try {

    // ============================
    // /watch
    // ============================

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

        console.log(
          `🎬 ${interaction.user.tag} đã tạo phòng xem: ${url}`
        );
      }

      return;
    }

    // ============================
    // NÚT THÔNG TIN
    // ============================

    if (interaction.isButton()) {

      if (interaction.customId === "watch_info") {

        const embed = new EmbedBuilder()
          .setTitle("ℹ️ Arizu Cinema")
          .setDescription(
            `🎬 **Phòng xem Arizu Cinema**\n\n` +
            `👤 Người xem: ${interaction.user}\n` +
            `📺 Hệ thống phòng xem đang hoạt động.\n\n` +
            `🔗 Video được mở bằng liên kết gốc.`
          )
          .setTimestamp();

        await interaction.reply({
          embeds: [embed],
          ephemeral: true
        });
      }
    }

  } catch (error) {

    console.error("❌ Interaction error:", error);

    if (!interaction.replied && !interaction.deferred) {

      await interaction.reply({
        content: "❌ Có lỗi khi xử lý lệnh.",
        ephemeral: true
      });

    }
  }
});

// ================================
// KHỞI ĐỘNG
// ================================

async function startBot() {

  await registerCommands();

  console.log("🔐 Đang kết nối tới Discord...");

  try {

    await client.login(process.env.DISCORD_TOKEN);

  } catch (error) {

    console.error("❌ Không thể đăng nhập Discord:");
    console.error(error);

    process.exit(1);
  }
}

console.log("🚀 Đang khởi động Arizu Cinema...");
startBot();
