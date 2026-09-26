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
// GIỚI HẠN /watch
// ========================================

// Đây là giới hạn INPUT của /watch.
// Không phải MAX_WATCH_LINKS của Live.js.

const MAX_VIDEOS = 3;

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
// RENDER / RAILWAY HTTP SERVER
// ========================================

const PORT =
  process.env.PORT || 10000;

const server =
  http.createServer((req, res) => {

    if (req.url === "/") {

      res.writeHead(200, {
        "Content-Type":
          "text/plain; charset=utf-8"
      });

      res.end(
        "Arizu Cinema Bot is online!"
      );

      return;
    }

    res.writeHead(404, {
      "Content-Type":
        "text/plain; charset=utf-8"
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
// TÁCH TÊN PHIM + LINK
// ========================================

function parseWatchInput(input) {

  const text =
    String(input || "").trim();

  if (!text) {

    return {
      videoName: "",
      links: [],
      tooManyLinks: false
    };
  }

  // Lấy toàn bộ link
  const links =
    text.match(
      /https?:\/\/[^\s]+/gi
    ) || [];

  // Lấy phần tên phim
  const videoName =
    text

      .replace(
        /https?:\/\/[^\s]+/gi,
        ""
      )

      .replace(
        /\s+/g,
        " "
      )

      .trim();

  return {

    videoName,

    links,

    tooManyLinks:
      links.length > MAX_VIDEOS

  };
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
      `📺 Giới hạn /watch: ${MAX_VIDEOS} link`
    );

    console.log(
      `📺 Giới hạn Live: ${MAX_WATCH_LINKS} link`
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

          const owner =
            interaction.options.getUser(
              "chu_phong"
            );

          const voiceChannel =
            interaction.options.getChannel(
              "phong_call"
            );

          const phimInput =
            interaction.options.getString(
              "phim"
            );

          // -------------------------------
          // Phân tích input
          // -------------------------------

          const parsed =
            parseWatchInput(
              phimInput
            );

          // -------------------------------
          // Kiểm tra số link
          // -------------------------------

          if (
            parsed.tooManyLinks
          ) {

            await interaction.reply({

              content:
                `❌ Bạn chỉ được nhập tối đa ${MAX_VIDEOS} link video.\n\n` +
                `📌 Bạn đã nhập: ${parsed.links.length} link.`,

              ephemeral: true

            });

            return;
          }

          // -------------------------------
          // Tên phim
          // -------------------------------

          const videoName =
            parsed.videoName ||
            "Video không có tên";

          // -------------------------------
          // Danh sách link
          // -------------------------------

          const links =
            parsed.links;

          // -------------------------------
          // Không có link
          // -------------------------------

          if (
            links.length === 0
          ) {

            await interaction.reply({

              content:
                "❌ Bạn chưa nhập link video hợp lệ.\n\n" +

                "Ví dụ:\n" +

                "`/watch chu_phong:@Tên phong_call:Phòng phim phim:TenPhim https://example.com/video.mp4`",

              ephemeral: true

            });

            return;
          }

          // -------------------------------
          // Kiểm tra giới hạn Live
          // -------------------------------

          if (
            links.length >
            MAX_WATCH_LINKS
          ) {

            await interaction.reply({

              content:
                `❌ Hệ thống Live chỉ cho phép tối đa ${MAX_WATCH_LINKS} link.`,

              ephemeral: true

            });

            return;
          }

          // -------------------------------
          // Kiểm tra voice channel
          // -------------------------------

          if (
            !voiceChannel ||
            !voiceChannel.isVoiceBased()
          ) {

            await interaction.reply({

              content:
                "❌ Bạn phải chọn một phòng thoại hợp lệ.",

              ephemeral: true

            });

            return;
          }

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
                "❌ Bot không có quyền **Connect** vào phòng thoại này.",

              ephemeral: true

            });

            return;
          }

          // -------------------------------
          // Tạo Live
          // -------------------------------

          const live =
            startWatchLive({

              owner,

              voiceChannel,

              videoName,

              links

            });

          // -------------------------------
          // Tạo Watch Room
          // -------------------------------

          const room =
            createWatchRoom(

              links[0],

              owner,

              voiceChannel

            );

          // -------------------------------
          // Embed
          // -------------------------------

          const embed =
            new EmbedBuilder()

              .setTitle(
                "🎬 [MEG]Ariz_CFM_BOT — Cinema Room"
              )

              .setDescription(

                `**Phòng xem đã được tạo!**\n\n` +

                `👑 **Chủ phòng:** ${owner}\n` +

                `🔊 **Phòng call:** ${voiceChannel}\n` +

                `🎞️ **Tên phim:** ${videoName}\n` +

                `🔗 **Số link:** ${links.length}/${MAX_VIDEOS}\n\n` +

                `📺 **Link hiện tại:** ${links[0]}\n\n` +

                `👥 Dùng **/join** để bot tham gia phòng thoại.`

              )

              .setTimestamp();

          // -------------------------------
          // Buttons
          // -------------------------------

          const row =
            new ActionRowBuilder()

              .addComponents(

                new ButtonBuilder()

                  .setLabel(
                    "▶️ Mở video"
                  )

                  .setStyle(
                    ButtonStyle.Link
                  )

                  .setURL(
                    links[0]
                  ),

                new ButtonBuilder()

                  .setCustomId(
                    "watch_info"
                  )

                  .setLabel(
                    "ℹ️ Thông tin"
                  )

                  .setStyle(
                    ButtonStyle.Secondary
                  )

              );

          // -------------------------------
          // Trả kết quả
          // -------------------------------

          await interaction.reply({

            embeds: [
              embed
            ],

            components: [
              row
            ]

          });

          // -------------------------------
          // Log
          // -------------------------------

          console.log(
            `🎬 ${interaction.user.tag} đã tạo Live: ${videoName}`
          );

          console.log(
            `🔗 Số link: ${live.videos.length}`
          );

          console.log(
            `🔊 Voice: ${voiceChannel.name}`
          );

          console.log(
            `👑 Chủ phòng: ${owner.tag}`
          );

          return;
        }

        // =================================
        // /join
        // =================================

        if (
          interaction.commandName ===
          "join"
        ) {

          // -------------------------------
          // Lấy member
          // -------------------------------

          const member =
            interaction.member;

          // -------------------------------
          // Kiểm tra người dùng có trong
          // voice hay không
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

          // -------------------------------
          // Voice channel
          // -------------------------------

          const voiceChannel =
            member.voice.channel;

          // -------------------------------
          // Kiểm tra quyền
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
                "❌ Bot không có quyền **Connect** vào phòng thoại này.",

              ephemeral: true

            });

            return;
          }

          // -------------------------------
          // Join voice
          // -------------------------------

          try {

            joinVoiceChannel({

              channelId:
                voiceChannel.id,

              guildId:
                voiceChannel.guild.id,

              adapterCreator:
                voiceChannel.guild
                  .voiceAdapterCreator,

              selfDeaf:
                false,

              selfMute:
                false

            });

            // -----------------------------
            // Reply
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

            if (
              !interaction.replied &&
              !interaction.deferred
            ) {

              await interaction.reply({

                content:

                  "❌ Bot không thể tham gia phòng thoại.\n\n" +

                  "Hãy kiểm tra quyền **Connect** và **Speak** của bot.",

                ephemeral: true

              });

            }
          }

          return;
        }
      }

      // ==================================
      // BUTTON
      // ==================================

      if (
        interaction.isButton()
      ) {

        // -------------------------------
        // WATCH INFO
        // -------------------------------

        if (
          interaction.customId ===
          "watch_info"
        ) {

          const room =
            getWatchRoom();

          const live =
            getWatchLive();

          // -----------------------------
          // Không có room/live
          // -----------------------------

          if (
            !room &&
            !live
          ) {

            await interaction.reply({

              content:
                "❌ Hiện không có Cinema Room nào đang hoạt động.",

              ephemeral: true

            });

            return;
          }

          // -----------------------------
          // Video hiện tại
          // -----------------------------

          const currentVideo =
            getWatchCurrentVideo();

          // -----------------------------
          // Embed thông tin
          // -----------------------------

          const embed =
            new EmbedBuilder()

              .setTitle(
                "ℹ️ [MEG]Ariz_CFM_BOT"
              )

              .setDescription(

                `🎬 **Cinema Room**\n\n` +

                `👑 **Chủ phòng:** ${
                  live?.owner ||
                  room?.owner ||
                  "Không xác định"
                }\n` +

                `🔊 **Phòng call:** ${
                  live?.voiceChannel ||
                  room?.voiceChannel ||
                  "Không xác định"
                }\n\n` +

                `🎞️ **Tên phim:** ${
                  live?.videoName ||
                  "Không có tên"
                }\n\n` +

                `📺 **Video hiện tại:** ${
                  currentVideo?.link ||
                  room?.url ||
                  "Không có"
                }\n\n` +

                `📊 **Trạng thái:** ${
                  live?.status ||
                  "waiting"
                }`

              )

              .setTimestamp();

          // -----------------------------
          // Reply
          // -----------------------------

          await interaction.reply({

            embeds: [
              embed
            ],

            ephemeral: true

          });

          return;
        }
      }

    } catch (error) {

      // ==================================
      // ERROR
      // ==================================

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
