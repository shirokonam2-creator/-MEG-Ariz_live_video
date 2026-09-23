require("dotenv").config();

const {
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js");

const commands = [
  new SlashCommandBuilder()
    .setName("watch")
    .setDescription("Tạo phòng xem video")
    .addStringOption(option =>
      option
        .setName("url")
        .setDescription("Link YouTube của video")
        .setRequired(true)
    )
    .toJSON()
];

const rest = new REST({ version: "10" })
  .setToken(process.env.DISCORD_TOKEN);

async function registerCommands() {
  try {
    console.log("⏳ Đang đăng ký lệnh /watch...");

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      {
        body: commands
      }
    );

    console.log("✅ Đã đăng ký /watch!");
  } catch (error) {
    console.error("❌ Lỗi:", error);
  }
}

registerCommands();