const { SlashCommandBuilder, Routes } = require("discord.js");
const { REST } = require("@discordjs/rest");

const dotenv = require("dotenv");
dotenv.config();

const commands = [
  new SlashCommandBuilder()
    .setName("randomize")
    .setDescription("Replies with a randomized list of users for valo"),
  new SlashCommandBuilder()
    .setName("removeroles")
    .setDescription("Removes roles from all"),
  new SlashCommandBuilder()
    .setName("signups")
    .setDescription("Starts collection of names")
    .addIntegerOption((option) =>
      option.setName("time").setDescription("The time to signups end in ms")
    ),
].map((command) => command.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.BOT_ID);

rest
  .put(Routes.applicationCommands("1004416149569667133"), { body: commands })
  .then(() => console.log("Successfully registered application commands."))
  .catch(console.error);
