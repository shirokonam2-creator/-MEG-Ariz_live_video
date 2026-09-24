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

const {
  createCinemaRoom,
  getRoom,
  updateRoom
} = require("./cinema/cinemaRoom");

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

const fs = require("fs");
const path = require("path");

const cinemaPublic =
  path.join(__dirname, "cinema", "public");

const server = http.createServer((req, res) => {

  // ============================
  // CINEMA ROOM API
  // ============================

  if (req.url.startsWith("/api/cinema/")) {

    const roomId =
      req.url.split("/")[3];

    if (req.method === "GET") {

      const room = getRoom(roomId);

      if (!room) {
        res.writeHead(404);
        res.end("Room not found");
        return;
      }

      res.writeHead(200, {
        "Content-Type": "application/json"
      });

      res.end(JSON.stringify(room));
      return;
    }

    if (req.method === "POST") {

      let body = "";

      req.on("data", chunk => {
        body += chunk;
      });

      req.on("end", () => {

        try {

          const data = JSON.parse(body);

          const room =
            updateRoom(roomId, data);

          if (!room) {
            res.writeHead(404);
            res.end("Room not found");
            return;
          }

          res.writeHead(200, {
            "Content-Type": "application/json"
          });

          res.end(JSON.stringify(room));

        } catch (error) {

          res.writeHead(400);
          res.end("Invalid JSON");
        }
      });

      return;
    }
  }

  // ============================
  // CINEMA ROOM WEB PAGE
  // ============================

  if (req.url.startsWith("/cinema")) {

    const filePath =
      path.join(cinemaPublic, "index.html");

    fs.readFile(filePath, (error, data) => {

      if (error) {
        res.writeHead(500);
        res.end("Cinema error");
        return;
      }

      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8"
      });

      res.end(data);
    });

    return;
  }

  // ============================
  // CSS
  // ============================

  if (req.url === "/cinema.css") {

    const filePath =
      path.join(cinemaPublic, "cinema.css");

    fs.readFile(filePath, (error, data) => {

      if (error) {
        res.writeHead(404);
        res.end();
        return;
      }

      res.writeHead(200, {
        "Content-Type": "text/css"
      });

      res.end(data);
    });

    return;
  }

  // ============================
  // JAVASCRIPT
  // ============================

  if (req.url === "/cinema.js") {

    const filePath =
      path.join(cinemaPublic, "cinema.js");

    fs.readFile(filePath, (error, data) => {

      if (error) {
        res.writeHead(404);
        res.end();
        return;
      }

      res.writeHead(200, {
        "Content-Type": "application/javascript"
      });

      res.end(data);
    });

    return;
  }

  // ============================
  // DEFAULT
  // ============================

  res.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8"
  });

  res.end("[MEG]Ariz_CFM_BOT Bot is online!");
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
  console.log("🎬 [MEG]Ariz_CFM_BOT đang hoạt động!");
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

const cinemaRoom = createCinemaRoom(
  url,
  interaction.user
);

const cinemaUrl =
  `https://meg-ariz-live-video-1.onrender.com/cinema?room=${cinemaRoom.id}`;

room.embeds[0].setDescription(
  `**Phòng xem đã được tạo!**\n\n` +
  `👤 Người tạo: ${interaction.user}\n` +
  `🎬 [MEG]Ariz_CFM_BOT Room\n\n` +
  `🌐 [Mở phòng xem](${cinemaUrl})\n\n` +
  `📺 Phòng xem được đồng bộ trạng thái.`
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
          .setTitle("ℹ️ [MEG]Ariz_CFM_BOT")
          .setDescription(
            `🎬 **Phòng xem [MEG]Ariz_CFM_BOT**\n\n` +
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

console.log("🚀 Đang khởi động [MEG]Ariz_CFM_BOT...");
startBot();
