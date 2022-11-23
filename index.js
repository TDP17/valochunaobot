const { Client, GatewayIntentBits } = require("discord.js");
const dotenv = require("dotenv");
const {
  removeRole,
  addRole,
  collectList,
  randomizeList,
  createReply,
  removeRoleFromAllUsers,
  registerUser,
  updateRankForUser,
} = require("./services/methods.js");
const {
  reactionMessage,
  roleString,
  rudiString,
} = require("./utils/constant.js");
const { db } = require("./database/initDB.js");
dotenv.config();

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

let allRoles;
let guild;
let roleToAdd = "";
let users;
client.once("ready", async (c) => {
  try {
    guild = await c.guilds.fetch(rudiString);
    allRoles = await guild.roles.fetch();
    roleToAdd = allRoles.get(roleString);

    await db.connect();
    users = db.db("main").collection("users");

    console.info("Bot running!");
  } catch (error) {
    console.error(error);
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  switch (commandName) {
    case "randomize": {
      let signupsList;
      while (!Array.isArray(signupsList)) {
        signupsList = await randomizeList(
          await collectList(interaction, roleToAdd, users)
        );
      }
      const listReply = createReply(signupsList.map((s) => s.username));
      await interaction.reply(listReply);
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
      removeRoleFromAllUsers(interaction, roleToAdd);
      await interaction.reply("Removed roles");
      break;
    }
    case "register": {
      const name = interaction.options.getString("name");
      const tag = interaction.options.getString("tag");

      const reply = await registerUser(users, interaction.user.username, name, tag);

      await interaction.reply(reply);
      break;
    }
    default:
      break;
  }
});

/**
 * Listener for the creation of a message in the guild, receives the msg object
 * @todo Probably refactor the retrieval of guild &roleToManage to be called on the start of a command only once instead of on every message
 * Something like
 *  client.once("ready", () => {
 *    console.log("Bot running!");
 *    Retrieve guild and role to manage here itself
 *  });
 */
client.on("messageCreate", async (msg) => {
   if (msg.content === reactionMessage) {
    const collector = msg.createReactionCollector({
      dispose: true,
    });

    collector.on("collect", async (reaction, user) => {
      addRole(reaction, user, allRoles, roleString, guild, client, users);
      updateRankForUser(users, user.username);
    });

    collector.on("remove", async (reaction, user) => {
      removeRole(reaction, user, roleToAdd);
    });
  }
});

client.login(process.env.BOT_ID);
