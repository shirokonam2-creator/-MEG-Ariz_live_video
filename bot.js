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

const {
  createWatchRoom,
  getWatchRoom
} = require("./watchRoom");

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
  res.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8"
  });

  res.end("Arizu Cinema Bot is online!");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(
    `🌐 HTTP server đang chạy trên port ${PORT}`
  );
});

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
    .setDescription("Tạo phòng xem video")

    .addUserOption(option =>
      option
        .setName("chu_phong")
        .setDescription("Chủ phòng xem")
        .setRequired(true)
    )

    .addChannelOption(option =>
      option
        .setName("phong_call")
        .setDescription("Phòng voice dùng để xem")
        .setRequired(true)
        .addChannelTypes(2)
    )

    .addStringOption(option =>
      option
        .setName("link")
        .setDescription("Link video")
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

    const rest = new REST({
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

      if (interaction.isChatInputCommand()) {

        // =================================
        // /watch
        // =================================

        if (
          interaction.commandName === "watch"
        ) {

          const owner =
            interaction.options.getUser(
              "chu_phong"
            );

          const voiceChannel =
            interaction.options.getChannel(
              "phong_call"
            );

          const url =
            interaction.options.getString(
              "link"
            );

          // Kiểm tra link
          if (!url) {

            await interaction.reply({
              content:
                "❌ Bạn chưa nhập link video.",
              ephemeral: true
            });

            return;
          }

          // Tạo Cinema Room
          const room =
            createWatchRoom(
              url,
              owner,
              voiceChannel
            );

          await interaction.reply(room);

          console.log(
            `🎬 ${interaction.user.tag}` +
            ` đã tạo phòng xem: ${url}`
          );

          return;
        }

        // =================================
        // /join
        // =================================

        if (
          interaction.commandName === "join"
        ) {

          const member =
            interaction.member;

          // -------------------------------
          // Kiểm tra người dùng có ở voice
          // -------------------------------

          if (
            !member ||
            !member.voice ||
            !member.voice.channel
          ) {

            await interaction.reply({
              content:
                "❌ Bạn phải vào một phòng thoại trước!",
              ephemeral: true
            });

            return;
          }

          const voiceChannel =
            member.voice.channel;

          // -------------------------------
          // Kiểm tra quyền bot
          // -------------------------------

          const permissions =
            voiceChannel.permissionsFor(
              interaction.client.user
            );

          if (
            !permissions ||
            !permissions.has("Connect")
          ) {

            await interaction.reply({
              content:
                "❌ Bot không có quyền **Connect** " +
                "vào phòng thoại này.",
              ephemeral: true
            });

            return;
          }

          // -------------------------------
          // Bot join voice
          // -------------------------------

          try {

            joinVoiceChannel({

              channelId:
                voiceChannel.id,

              guildId:
                voiceChannel.guild.id,

              adapterCreator:
                voiceChannel
                  .guild
                  .voiceAdapterCreator,

              selfDeaf: false,

              selfMute: false
            });

            // -----------------------------
            // Thông báo
            // -----------------------------

            await interaction.reply({

              content:
                `🔊 **[MEG]Ariz_CFM_BOT đã tham gia phòng thoại!**\n\n` +
                `📢 **Phòng:** ${voiceChannel}\n` +
                `👤 **Người gọi:** ${interaction.user}\n\n` +
                `🎬 Bot đã sẵn sàng cho Cinema Room.`

            });

            console.log(
              `🔊 Bot đã join voice: ` +
              `${voiceChannel.name} ` +
              `(${voiceChannel.id})`
            );

          } catch (error) {

            console.error(
              "❌ Không thể join voice:"
            );

            console.error(error);

            await interaction.reply({

              content:
                "❌ Bot không thể tham gia " +
                "phòng thoại.\n\n" +
                "Hãy kiểm tra quyền **Connect** " +
                "và **Speak** của bot.",

              ephemeral: true
            });
          }

          return;
        }
      }

      // ==================================
      // BUTTON
      // ==================================

      if (interaction.isButton()) {

        // -------------------------------
        // watch_info
        // -------------------------------

        if (
          interaction.customId ===
          "watch_info"
        ) {

          const room =
            getWatchRoom();

          if (!room) {

            await interaction.reply({

              content:
                "❌ Hiện không có Cinema Room nào " +
                "đang hoạt động.",

              ephemeral: true
            });

            return;
          }

          const embed =
            new EmbedBuilder()

              .setTitle(
                "ℹ️ [MEG]Ariz_CFM_BOT"
              )

              .setDescription(

                `🎬 **Cinema Room**\n\n` +

                `👑 **Chủ phòng:** ${room.owner}\n` +

                `🔊 **Phòng call:** ` +
                `${room.voiceChannel}\n\n` +

                `🔗 **Video:** ${room.url}\n\n` +

                `👤 **Người xem:** ` +
                `${interaction.user}\n\n` +

                `📺 Hệ thống phòng xem ` +
                `đang hoạt động.`

              )

              .setTimestamp();

          await interaction.reply({

            embeds: [embed],

            ephemeral: true
          });

          return;
        }
      }

    } catch (error) {

      console.error(
        "❌ Interaction error:"
      );

      console.error(error);

      // Tránh lỗi khi interaction
      // đã được trả lời trước đó

      if (
        !interaction.replied &&
        !interaction.deferred
      ) {

        await interaction.reply({

          content:
            "❌ Có lỗi khi xử lý lệnh.",

          ephemeral: true
        });
      }
    }
  }
);

// ========================================
// KHỞI ĐỘNG BOT
// ========================================

async function startBot() {

  await registerCommands();

  console.log(
    "🔐 Đang kết nối tới Discord..."
  );

  try {

    await client.login(
      process.env.DISCORD_TOKEN
    );

  } catch (error) {

    console.error(
      "❌ Không thể đăng nhập Discord:"
    );

    console.error(error);

    process.exit(1);
  }
}

// ========================================
// START
// ========================================

console.log(
  "🚀 Đang khởi động [MEG]Ariz_CFM_BOT..."
);

startBot();
