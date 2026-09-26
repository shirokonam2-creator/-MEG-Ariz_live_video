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

        // Kiểm tra người dùng đã vào voice chưa
        if (!voiceChannel) {
            return interaction.reply({
                content: "❌ Bạn phải vào voice channel trước.",
                ephemeral: true
            });
        }

        await interaction.deferReply();

        try {
            const client = interaction.client;

            // Kiểm tra Riffy
            if (!client.riffy) {
                return interaction.editReply(
                    "❌ Music system chưa được khởi động."
                );
            }

            // Lấy player hiện tại
            let player = client.riffy.players.get(
                interaction.guild.id
            );

            // Nếu chưa có player thì tạo
            if (!player) {
                player = client.riffy.createConnection({
                    guildId: interaction.guild.id,
                    voiceChannel: voiceChannel.id,
                    textChannel: interaction.channel.id,
                    deaf: true
                });
            }

            // Nếu là link YouTube thì dùng trực tiếp
            // Nếu là tên bài hát thì tìm trên YouTube
            let searchQuery;

            if (isYouTubeUrl(query)) {
                searchQuery = query;
            } else {
                searchQuery = `ytmsearch:${query}`;
            }

            console.log(
                `[MUSIC] Searching: ${searchQuery}`
            );

            // Tìm bài
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
             * PLAYLIST
             */
            if (
                result.loadType === "playlist" ||
                result.loadType === "PLAYLIST_LOADED"
            ) {
                for (const track of result.tracks) {
                    player.queue.add(track);
                }

                const embed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle("🎵 YouTube Playlist")
                    .setDescription(
                        `Đã thêm **${result.tracks.length} bài** vào hàng đợi.`
                    )
                    .setFooter({
                        text: `Yêu cầu bởi ${interaction.user.tag}`
                    });

                await interaction.editReply({
                    embeds: [embed]
                });
            }

            /*
             * TRACK
             */
            else {
                const track = result.tracks[0];

                player.queue.add(track);

                const info = track.info || track;

                const title =
                    info.title ||
                    "Không rõ tên bài";

                const author =
                    info.author ||
                    "YouTube";

                const uri =
                    info.uri ||
                    query;

                const duration =
                    formatDuration(
                        info.length || 0
                    );

                const embed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle("🎵 Đã thêm vào hàng đợi")
                    .setDescription(
                        `[${title}](${uri})`
                    )
                    .addFields(
                        {
                            name: "🎤 Kênh",
                            value: author,
                            inline: true
                        },
                        {
                            name: "⏱️ Thời lượng",
                            value: duration,
                            inline: true
                        },
                        {
                            name: "👤 Yêu cầu bởi",
                            value: `${interaction.user}`,
                            inline: true
                        }
                    )
                    .setFooter({
                        text: "YouTube Music"
                    });

                await interaction.editReply({
                    embeds: [embed]
                });
            }

            /*
             * Bắt đầu phát nếu player đang rảnh
             */
            if (
                !player.playing &&
                !player.paused
            ) {
                await player.play();
            }

        } catch (error) {
            console.error(
                "[MUSIC /PLAY ERROR]",
                error
            );

            return interaction.editReply(
                "❌ Có lỗi khi phát nhạc YouTube.\n" +
                "Hãy kiểm tra Lavalink và YouTube Source."
            );
        }
    }
};


/*
 * Kiểm tra URL YouTube
 */
function isYouTubeUrl(url) {
    return /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(
        url
    );
}


/*
 * Chuyển milliseconds → mm:ss / hh:mm:ss
 */
function formatDuration(ms) {
    if (!ms || ms < 0) {
        return "Không rõ";
    }

    const totalSeconds = Math.floor(ms / 1000);

    const hours = Math.floor(
        totalSeconds / 3600
    );

    const minutes = Math.floor(
        (totalSeconds % 3600) / 60
    );

    const seconds =
        totalSeconds % 60;

    const s = String(seconds).padStart(
        2,
        "0"
    );

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(
            2,
            "0"
        )}:${s}`;
    }

    return `${minutes}:${s}`;
                         } 
