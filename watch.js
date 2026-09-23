const {
  SlashCommandBuilder
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("watch")
    .setDescription("Tạo phòng xem video")
    .addStringOption(option =>
      option
        .setName("url")
        .setDescription("Link YouTube của video")
        .setRequired(true)
    ),

  async execute(interaction) {
    const url = interaction.options.getString("url");

    await interaction.reply({
      content:
        `🎬 **Arizu Cinema**\n\n` +
        `🔗 **Video:** ${url}\n` +
        `⏳ Đang chuẩn bị phòng xem...`,
      ephemeral: false
    });
  }
};