import { Client, Collection, GatewayIntentBits, Guild, Role } from "discord.js";
import {
  removeRoleFromUser,
  addRoleToUser,
  collectList,
  randomizeList,
  createReply,
  removeRoleFromAllUsers,
  registerUser,
  updateRankForUser,
} from "./methods/mainMethods.js";
import { reactionMessage, roleString, rudiString } from "./utils/constant.js";
import db from "./database/initDB.js";

import * as dotenv from "dotenv";
dotenv.config();

const dbUsers = db.db("main").collection("users");
const dbExemptedUsers = db.db("main").collection("exemptedUsers");

let guild: Guild, allRoles: Collection<string, Role>, roleToManage: Role;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
  ],
});

client.once("ready", async (c) => {
  try {
    await db.connect();

    // Fetch important objects needed to get/set discord data.
    guild = await c.guilds.fetch(rudiString);
    allRoles = await guild.roles.fetch();
    roleToManage = allRoles.get(roleString);

    console.info("ValoChunaoBot is online and running!");
  } catch (error) {
    console.error(error);
  }
});

// Handle the slash commands input by the user,
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  switch (commandName) {
    case "randomize": {
      await interaction.deferReply();

      const { includedList, excludedList } = await randomizeList(
        await collectList(interaction, roleToManage, dbUsers),
        dbExemptedUsers
      );
      const listReply = createReply(includedList, excludedList);
      await interaction.editReply(listReply);
      break;
    }

    case "signups": {
      const message = await interaction.reply({
        content: reactionMessage,
        fetchReply: true,
      });
      message.react("👍");
      break;
    }

    case "removeroles": {
      await interaction.deferReply();
      await removeRoleFromAllUsers(interaction, roleToManage);
      await interaction.editReply("Removed roles");
      break;
    }

    case "register": {
      await interaction.deferReply();

      const name = interaction.options.getString("name");
      const tag = interaction.options.getString("tag");

      const reply = await registerUser(
        dbUsers,
        interaction.user.username,
        name,
        tag
      );

      await interaction.editReply(reply);
      break;
    }

    default:
      break;
  }
});

// Hack to get signups on reaction.
client.on("messageCreate", async (msg) => {
  if (msg.author.username === "angadbagla") {
    let contents = msg.content;
    let pos = contents.search(/b/i);
    if (pos !== -1) {
      contents = contents.replace(/b/ig, "");
      await msg.delete();
      if(contents.length > 0)
        await msg.channel.send(`${contents}`);
    }
  }

  if (msg.content === reactionMessage) {
    const collector = msg.createReactionCollector({
      dispose: true,
    });

    // Adds the role given on reaction to user and then updates his/her rank in the database
    collector.on("collect", async (reaction, user) => {
      if (reaction.emoji.name === "👍") {
        await addRoleToUser(user, roleString, guild, client, dbUsers);
        await updateRankForUser(dbUsers, user.username);
      }
    });

    collector.on("remove", async (reaction, user) => {
      await removeRoleFromUser(reaction, user, roleToManage, guild);
    });
  }
});

client.login(process.env.BOT_ID);
