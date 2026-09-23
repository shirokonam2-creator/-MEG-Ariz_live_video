const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require("discord.js");

function createWatchRoom(url, user) {
  const embed = new EmbedBuilder()
    .setTitle("🎬 Arizu Cinema")
    .setDescription(
      `**Phòng xem đã được tạo!**\n\n` +
      `👤 Người tạo: ${user}\n` +
      `🔗 Video: ${url}\n\n` +
      `📺 Mở video bằng nút bên dưới.\n` +
      `👥 Mọi người trong phòng có thể tham gia xem.`
    )
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("▶️ Mở video")
      .setStyle(ButtonStyle.Link)
      .setURL(url),

    new ButtonBuilder()
      .setCustomId("watch_info")
      .setLabel("ℹ️ Thông tin")
      .setStyle(ButtonStyle.Secondary)
  );

  return {
    embeds: [embed],
    components: [row]
  };
}

module.exports = {
  createWatchRoom
};