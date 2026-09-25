require("dotenv").config();

const http = require("http");

const {
  Client,
  GatewayIntentBits,
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js");

const {
  joinVoiceChannel
} = require("@discordjs/voice");

// ========================================
// WATCH ROOM
// ========================================

const {
  createWatchRoom,
  getWatchRoom
} = require("./watchRoom");

// ========================================
// LIVE SYSTEM
// ========================================

const {
  startWatchLive,
  getWatchLive,
  getWatchCurrentVideo,
  watchNext,
  watchPause,
  watchResume,
  watchStop,
  clearWatchLive,
  MAX_WATCH_LINKS
} = require("./Lienket_watch");

// ========================================
// KIỂM TRA ENV
// ========================================

if (!process.env.DISCORD_TOKEN) {

  console.error(
    "❌ Thiếu DISCORD_TOKEN!"
  );

  process.exit(1);
}

if (!process.env.CLIENT_ID) {

  console.error(
    "❌ Thiếu CLIENT_ID!"
  );

  process.exit(1);
}

if (!process.env.GUILD_ID) {

  console.error(
    "❌ Thiếu GUILD_ID!"
  );

  process.exit(1);
}

// ========================================
// RENDER HTTP SERVER
// ========================================

const PORT =
  process.env.PORT || 10000;

const server =
  http.createServer(
    (req, res) => {

      res.writeHead(200, {
        "Content-Type":
          "text/plain; charset=utf-8"
      });

      res.end(
        "Arizu Cinema Bot is online!"
      );
    }
  );

server.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      `🌐 HTTP server đang chạy trên port ${PORT}`
    );
  }
);

// ========================================
// DISCORD CLIENT
// ========================================

const client =
  new Client({

    intents: [

      GatewayIntentBits.Guilds,

      GatewayIntentBits.GuildVoiceStates

    ]
  });

// ========================================
// SLASH COMMANDS
// ========================================

const commands = [

  // ======================================
  // /watch
  // ======================================

  new SlashCommandBuilder()

    .setName("watch")

    .setDescription(
      "Tạo phòng xem video"
    )

    .addUserOption(option =>

      option

        .setName("chu_phong")

        .setDescription(
          "Chủ phòng xem"
        )

        .setRequired(true)

    )

    .addChannelOption(option =>

      option

        .setName("phong_call")

        .setDescription(
          "Phòng voice dùng để xem"
        )

        .setRequired(true)

        .addChannelTypes(2)

    )

    .addStringOption(option =>

      option

        .setName("phim")

        .setDescription(
          "Tên phim + tối đa 3 link video, cách nhau bằng dấu cách"
        )

        .setRequired(true)

    )

    .toJSON(),

  // ======================================
  // /join
  // ======================================

  new SlashCommandBuilder()

    .setName("join")

    .setDescription(
      "Cho bot tham gia phòng thoại của bạn"
    )

    .toJSON()
];

// ========================================
// ĐĂNG KÝ SLASH COMMAND
// ========================================

async function registerCommands() {

  try {

    console.log(
      "⏳ Đang đăng ký /watch và /join..."
    );

    const rest =
      new REST({
        version: "10"
      }).setToken(
        process.env.DISCORD_TOKEN
      );

    await rest.put(

      Routes.applicationGuildCommands(

        process.env.CLIENT_ID,

        process.env.GUILD_ID

      ),

      {
        body: commands
      }

    );

    console.log(
      "✅ Đã đăng ký /watch và /join thành công!"
    );

  } catch (error) {

    console.error(
      "❌ Không đăng ký được slash command:"
    );

    console.error(error);
  }
}

// ========================================
// BOT READY
// ========================================

client.once(

  Events.ClientReady,

  readyClient => {

    console.log(
      `✅ Bot đã đăng nhập: ${readyClient.user.tag}`
    );

    console.log(
      "🎬 [MEG]Ariz_CFM_BOT đang hoạt động!"
    );

    console.log(
      `📺 Giới hạn /watch: ${MAX_WATCH_LINKS} link`
    );
  }
);

// ========================================
// XỬ LÝ INTERACTION
// ========================================

client.on(

  Events.InteractionCreate,

  async interaction => {

    try {

      // ==================================
      // SLASH COMMAND
      // ==================================

      if (
        interaction.isChatInputCommand()
      ) {

        // =================================
        // /watch
        // =================================

        if (
          interaction.commandName ===
          "watch"
        ) {

          // -------------------------------
          // Lấy thông tin
          // -------------------------------
