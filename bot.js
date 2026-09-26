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
  getWatchCurrentVideo,
  watchNext,
  watchPause,
  watchResume,
  watchStop
} = require("./Lienket_watch");

const {
  createWatchRoom
} = require("./watchRoom");

// ========================================
// GIỚI HẠN INPUT /watch
// ========================================

// Đây là giới hạn của /watch.
// KHÔNG phải MAX_WATCH_LINKS.
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
// HTTP SERVER
// ========================================

const PORT = process.env.PORT || 10000;

const server = http.createServer((req, res) => {
  if (req.url === "/") {
    res.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8"
    });

    res.end("Arizu Cinema Bot is online!");
    return;
  }

  res.writeHead(404, {
    "Content-Type": "text/plain; charset=utf-8"
  });

  res.end("Not Found");
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
// TÁCH TÊN PHIM + LINK
// ========================================

function parseWatchInput(input) {
  const text = String(input || "").trim();

  if (!text) {
    return {
      videoName: "",
      links: [],
      tooManyLinks: false
    };
  }

  const links =
    text.match(/https?:\/\/[^\s]+/gi) || [];

  const videoName = text
    .replace(/https?:\/\/[^\s]+/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return {
    videoName,
    links,
    tooManyLinks: links.length > MAX_VIDEOS
  };
}

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
      "Tạo Live với tối đa 3 video"
    )

    .addUserOption(option =>
      option
        .setName("chu_phong")
        .setDescription("Chủ phòng")
        .setRequired(true)
    )

    .addChannelOption(option =>
      option
        .setName("phong")
        .setDescription("Phòng voice")
        .setRequired(true)
        .addChannelTypes(
          ChannelType.GuildVoice
        )
    )

    .addStringOption(option =>
      option
        .setName("phim")
        .setDescription(
          "Tên phim + tối đa 3 link video"
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
// ĐĂNG KÝ COMMAND
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
      "✅ Đã đăng ký /watch và /join!"
    );

  } catch (error) {
    console.error(
      "❌ Không đăng ký được command:"
    );

    console.error(error);
  }
}

// ========================================
// READY
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
// INTERACTION
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
        // /WATCH
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
              "phong"
            );

          const input =
            interaction.options.getString(
              "phim"
            );

          // --------------------------------
          // Kiểm tra dữ liệu
          // --------------------------------

          if (!owner) {
            await interaction.reply({
              content:
                "❌ Không xác định được chủ phòng.",
              ephemeral: true
            });

            return;
          }

          if (!voiceChannel) {
            await interaction.reply({
              content:
                "❌ Không xác định được phòng voice.",
              ephemeral: true
            });

            return;
          }

          if (!input) {
            await interaction.reply({
              content:
                "❌ Bạn chưa nhập tên phim hoặc link video.",
              ephemeral: true
            });

            return;
          }

          // --------------------------------
          // Kiểm tra loại channel
          // --------------------------------

          if (
            voiceChannel.type !==
            ChannelType.GuildVoice
          ) {

            await interaction.reply({
              content:
                "❌ Kênh được chọn phải là phòng thoại.",
              ephemeral: true
            });

            return;
          }

          // --------------------------------
          // Tách tên + link
          // --------------------------------

          const parsed =
            parseWatchInput(input);

          // --------------------------------
          // Kiểm tra số link
          // --------------------------------

          if (parsed.tooManyLinks) {

            await interaction.reply({
              content:
                `❌ Bạn chỉ được nhập tối đa **${MAX_VIDEOS} link video**.`,
              ephemeral: true
            });

            return;
          }

          // --------------------------------
          // Phải có ít nhất 1 link
          // --------------------------------

          if (
            parsed.links.length === 0
          ) {

            await interaction.reply({
              content:
                "❌ Bạn chưa nhập link video hợp lệ.",
              ephemeral: true
            });

            return;
          }

          // --------------------------------
          // Tên phim
          // --------------------------------

          const videoName =
            parsed.videoName ||
            "Video không có tên";

          const links =
            parsed.links;

          // --------------------------------
          // Kiểm tra quyền bot
          // --------------------------------

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
                "❌ Bot không có quyền **Connect** vào phòng thoại này.",
              ephemeral: true
            });

            return;
          }

          // --------------------------------
          // Tạo Live
          // --------------------------------

          let live;

          try {

            live =
              startWatchLive({
                owner,
                voiceChannel,
                videoName,
                links
              });

          } catch (error) {

            console.error(
              "❌ Không thể tạo Live:"
            );

            console.error(error);

            await interaction.reply({
              content:
                `❌ Không thể tạo Live.\n> ${error.message}`,
              ephemeral: true
            });

            return;
          }

          // --------------------------------
          // Video hiện tại
          // --------------------------------

          const currentVideo =
            getWatchCurrentVideo();

          if (!currentVideo) {

            await interaction.reply({
              content:
                "❌ Không lấy được video đầu tiên.",
              ephemeral: true
            });

            return;
          }

          // --------------------------------
          // Tạo Cinema Room
          // --------------------------------

          let cinemaRoom;

          try {

            cinemaRoom =
              createWatchRoom(
                links[0],
                owner,
                voiceChannel
              );

          } catch (error) {

            console.error(
              "❌ Không thể tạo Cinema Room:"
            );

            console.error(error);

            await interaction.reply({
              content:
                "❌ Live đã được tạo nhưng Cinema Room không thể tạo.",
              ephemeral: true
            });

            return;
          }

          // --------------------------------
          // Embed Live
          // --------------------------------

          const embed =
            new EmbedBuilder()
              .setTitle(
                "🎬 [MEG]Ariz_CFM_BOT — Live"
              )
              .setDescription(
                `**${videoName}**\n\n` +

                `👑 **Chủ phòng:** ${owner}\n` +

                `🔊 **Phòng:** ${voiceChannel}\n\n` +

                `▶️ **Đang phát:** Video ${currentVideo.id}\n\n` +

                `🔗 **Link:** ${currentVideo.link}\n\n` +

                `📋 **Tổng số video:** ${links.length}`
              )
              .setTimestamp();

          // --------------------------------
          // Nút điều khiển
          // --------------------------------

          const row =
            new ActionRowBuilder()
              .addComponents(

                new ButtonBuilder()
                  .setCustomId("live_pause")
                  .setLabel("⏸️ Tạm dừng")
                  .setStyle(
                    ButtonStyle.Secondary
                  ),

                new ButtonBuilder()
                  .setCustomId("live_resume")
                  .setLabel("▶️ Tiếp tục")
                  .setStyle(
                    ButtonStyle.Success
                  ),

                new ButtonBuilder()
                  .setCustomId("live_next")
                  .setLabel("⏭️ Tiếp")
                  .setStyle(
                    ButtonStyle.Primary
                  ),

                new ButtonBuilder()
                  .setCustomId("live_stop")
                  .setLabel("⏹️ Dừng")
                  .setStyle(
                    ButtonStyle.Danger
                  )

              );

          // --------------------------------
          // Reply
          // --------------------------------

          await interaction.reply({

            embeds: [
              embed
            ],

            components: [
              row
            ]

          });

          console.log(
            `🎬 ${interaction.user.tag} ` +
            `đã tạo Live "${videoName}" ` +
            `với ${links.length} video.`
          );

          return;
        }

        // =================================
        // /JOIN
        // =================================

        if (
          interaction.commandName === "join"
        ) {

          const member =
            interaction.member;

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

          // --------------------------------
          // Kiểm tra quyền
          // --------------------------------

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
                "❌ Bot không có quyền **Connect** vào phòng thoại này.",
              ephemeral: true
            });

            return;
          }

          // --------------------------------
          // Join Voice
          // --------------------------------

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

            await interaction.reply({

              content:
                `🔊 **[MEG]Ariz_CFM_BOT đã tham gia phòng thoại!**\n\n` +
                `📢 **Phòng:** ${voiceChannel}\n` +
                `👤 **Người gọi:** ${interaction.user}\n\n` +
                `🎬 Bot đã sẵn sàng cho Cinema Room.`

            });

            console.log(
              `🔊 Bot đã join: ${voiceChannel.name}`
            );

          } catch (error) {

            console.error(
              "❌ Không thể join voice:"
            );

            console.error(error);

            await interaction.reply({
              content:
                "❌ Bot không thể tham gia phòng thoại.",
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

        // --------------------------------
        // PAUSE
        // --------------------------------

        if (
          interaction.customId ===
          "live_pause"
        ) {

          const success =
            watchPause();

          await interaction.reply({

            content: success
              ? "⏸️ Live đã tạm dừng."
              : "❌ Không có Live đang hoạt động.",

            ephemeral: true

          });

          return;
        }

        // --------------------------------
        // RESUME
        // --------------------------------

        if (
          interaction.customId ===
          "live_resume"
        ) {

          const success =
            watchResume();

          await interaction.reply({

            content: success
              ? "▶️ Live đã tiếp tục."
              : "❌ Không có Live đang hoạt động.",

            ephemeral: true

          });

          return;
        }

        // --------------------------------
        // NEXT
        // --------------------------------

        if (
          interaction.customId ===
          "live_next"
        ) {

          const next =
            watchNext();

          if (!next) {

            await interaction.reply({
              content:
                "⏹️ Đã hết danh sách video.",
              ephemeral: true
            });

            return;
          }

          await interaction.reply({

            content:
              `⏭️ Chuyển sang **video ${next.id}**.\n` +
              `🔗 ${next.link}`,

            ephemeral: true

          });

          return;
        }

        // --------------------------------
        // STOP
        // --------------------------------

        if (
          interaction.customId ===
          "live_stop"
        ) {

          const success =
            watchStop();

          await interaction.reply({

            content: success
              ? "⏹️ Live đã dừng."
              : "❌ Không có Live đang hoạt động.",

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
