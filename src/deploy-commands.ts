import { SlashCommandBuilder, Routes } from "discord.js";
import { REST } from "@discordjs/rest";

import * as dotenv from "dotenv";
dotenv.config();

/**
 * Creates a list of slash commands
 * Before pushing to github and running CD, run npm run slash
 * @todo Add npm run slash to cd
 */
const commands = [
  new SlashCommandBuilder()
    .setName("randomize")
    .setDescription("Replies with a randomized list of users for valo"),
  new SlashCommandBuilder()
    .setName("removeroles")
    .setDescription("Removes roles from all"),
  new SlashCommandBuilder()
    .setName("signups")
    .setDescription("Starts collection of names"),
  new SlashCommandBuilder()
    .setName("register")
    .setDescription("Register for valo chunao bot")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Your in game name")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("tag")
        .setDescription("Your in game tag (4 numbers without #)")
        .setRequired(true)
    ),
].map((command) => command.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.BOT_ID);

rest
  .put(Routes.applicationCommands(process.env.APP_ID), { body: commands })
  .then(() => console.log("Successfully registered application commands."))
  .catch(console.error);
