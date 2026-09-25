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
  SlashCommandBuilder,
  ChannelType
} = require("discord.js");

const {
  joinVoiceChannel
} = require("@discordjs/voice");

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

const {
  createWatchRoom
} = require("./watchRoom");

// ========================================
// GIỚI HẠN VIDEO
// ========================================

const MAX_VIDEOS = 3;

// ========================================
// KIỂM TRA ENV
// ========================================

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

// ========================================
// RENDER HTTP SERVER
// ========================================

const PORT = process.env.PORT || 10000;

const server = http.createServer((req, res) => {

  if (req.url === "/") {

    res.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8"
    });

    res.end(
      "Arizu Cinema Bot is online!"
    );

    return;
  }

  res.writeHead(404, {
    "Content-Type": "text/plain; charset=utf-8"
  });

  res.end("Not Found");
});

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

const client = new Client({

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
      "Tạo Live và phát danh sách video"
    )

    .addUserOption(option =>

      option

        .setName("chu_phong")

        .setDescription(
          "Chủ phòng"
        )

        .setRequired(true)

    )

    .addChannelOption(option =>

      option

        .setName("phong")

        .setDescription(
          "Phòng voice"
        )

        .setRequired(true)

        .addChannelTypes(
          ChannelType.GuildVoice
        )

    )

    .addStringOption(option =>

      option

        .setName("phim")

        .setDescription(
          "Tên phim và tối đa 3 link video, cách nhau bằng dấu cách"
        )

        .setRequired(true)

    )

    .toJSON(),

  // ======================================
  // /join
