
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require("discord.js");

function createWatchRoom(url, owner, voiceChannel) {

  const embed = new EmbedBuilder()
    .setTitle("🎬 [MEG]Ariz_CFM_BOT — Cinema Room")
    .setDescription(
      `**Phòng xem đã được tạo!**\n\n` +
      `👑 **Chủ phòng:** ${owner}\n` +
      `🔊 **Phòng call:** ${voiceChannel}\n` +
      `🔗 **Video:** ${url}\n\n` +
      `👥 Dùng **/join** để tham gia phòng xem.\n` +
      `🎬 Video được mở bằng liên kết gốc.`
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
