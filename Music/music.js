const {
  SlashCommandBuilder,
  EmbedBuilder
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Phát nhạc từ YouTube")
    .addStringOption(option =>
      option
        .setName("query")
        .setDescription("Tên bài hát hoặc link YouTube")
        .setRequired(true)
    ),

  async execute(interaction) {
    const query = interaction.options.getString("query");
    const voiceChannel = interaction.member?.voice?.channel;

    if (!voiceChannel) {
      return interaction.reply({
        content: "❌ Bạn cần vào voice channel trước.",
        ephemeral: true
      });
    }

    await interaction.deferReply();

    try {
      const client = interaction.client;

      if (!client.riffy) {
        return interaction.editReply(
          "❌ Music chưa được khởi động. Lavalink chưa kết nối."
        );
      }

      let player = client.riffy.players.get(
        interaction.guild.id
      );

      if (!player) {
        player = client.riffy.createConnection({
          guildId: interaction.guild.id,
          voiceChannel: voiceChannel.id,
          textChannel: interaction.channel.id,
          deaf: true
        });
      }

      /*
       * Nếu người dùng nhập link YouTube:
       *
       * https://youtube.com/watch?v=...
       * https://youtu.be/...
       *
       * → dùng trực tiếp.
       *
       * Nếu nhập tên bài:
       *
       * → tìm YouTube Music.
       */

      const isYouTube =
        /(?:youtube\.com|youtu\.be)/i.test(query);

      const searchQuery = isYouTube
        ? query
        : `ytmsearch:${query}`;

      const result = await client.riffy.resolve({
        query: searchQuery,
        requester: interaction.user
      });

      if (!result || !result.tracks?.length) {
        return interaction.editReply(
          "❌ Không tìm thấy bài hát trên YouTube."
        );
      }

      /*
       * =========================
       * PLAYLIST
       * =========================
       */

      if (
        result.loadType === "playlist" ||
        result.loadType === "PLAYLIST_LOADED"
      ) {
        let added = 0;

        for (const track of result.tracks) {
          track.info.requester =
            interaction.user;

          player.queue.add(track);
          added++;
        }

        if (
          !player.playing &&
          !player.paused
        ) {
          await player.play();
        }

        const embed =
          new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle("🎵 Playlist Added")
            .setDescription(
              `Đã thêm **${added} bài** vào hàng đợi.`
            )
            .setFooter({
              text:
                `Yêu cầu bởi ${interaction.user.tag}`
            });

        return interaction.editReply({
          embeds: [embed]
        });
      }

      /*
       * =========================
       * TRACK
       * =========================
       */

      const track =
        result.tracks[0];

      track.info.requester =
        interaction.user;

      const willPlayNow =
        !player.playing &&
        !player.paused;

      player.queue.add(track);

      if (willPlayNow) {
        await player.play();
      }

      const title =
        track.info?.title ||
        "Unknown";

      const author =
        track.info?.author ||
        "YouTube";

      const uri =
        track.info?.uri ||
        query;

      const embed =
        new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle(
            willPlayNow
              ? "🎵 Now Playing"
              : "🎵 Track Added"
          )
          .setDescription(
            `[${title}](${uri})`
          )
          .addFields(
            {
              name: "Artist",
              value: author,
              inline: true
            },
            {
              name: "Requester",
              value:
                `${interaction.user}`,
              inline: true
            },
            {
              name: "Queue",
              value:
                `${player.queue.length} track(s)`,
              inline: true
            }
          );

      return interaction.editReply({
        embeds: [embed]
      });

    } catch (error) {
      console.error(
        "[MEG MUSIC /PLAY]",
        error
      );

      return interaction.editReply(
        "❌ Không thể phát YouTube.\n" +
        "Hãy kiểm tra Lavalink và YouTube Source."
      );
    }
  }
};
