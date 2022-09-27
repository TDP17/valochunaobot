const { Client, GatewayIntentBits } = require("discord.js");

const dotenv = require("dotenv");
dotenv.config();

const { reactionMessage, roleString, botUsername } = require("./constant.js");

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

client.once("ready", () => {
  console.log("Bot running!");
});

// Vars
let timeToEnd; // Time to end option collected from user

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const allRoles = await interaction.guild.roles.fetch();
  const roleToAdd = allRoles.get(roleString);

  const { commandName } = interaction;

  switch (commandName) {
    case "randomize": {
      const signupsList = [];

      // Gets list of members who have the role in membersList
      const allMembers = await interaction.guild.members.fetch();
      const memberIterator = allMembers.values();
      let result = memberIterator.next();
      while (!result.done) {
        const temp = result.value._roles;
        const size = Object.keys(temp).length;
        for (let i = 0; i < size; i++) {
          if (
            temp[i] === roleToAdd.id &&
            result.value.user.username != botUsername
          )
            signupsList.push(result.value.user.username);
        }
        result = memberIterator.next();
      }

      // Randomizes membersList
      for (let i = signupsList.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [signupsList[i], signupsList[j]] = [signupsList[j], signupsList[i]];
      }

      // Constructs a reply for the bot dynamically with added discord formatting
      let listReply = "```";
      if (signupsList.length > 0)
        listReply += `\n1.${signupsList.slice(0, 5).join(", ")}\n`;
      else listReply += `No signups found`;
      if (signupsList.length > 5)
        listReply += `2.${signupsList.slice(5, 10).join(", ")}\n`;
      if (signupsList.length > 10)
        listReply += `3.${signupsList.slice(10, 15).join(", ")}\n`;
      listReply += "```";

      await interaction.reply(listReply);
      break;
    }
    case "signups": {
      timeToEnd = interaction.options.getInteger("time");

      const message = await interaction.reply({
        content: reactionMessage,
        fetchReply: true,
      });

      message.react("👍");
      break;
    }
    case "removeroles": {
      // Fetches all members to check for role
      const allMembers = await interaction.guild.members.fetch();
      const memberIt = allMembers.values();
      let result = memberIt.next();
      while (!result.done) {
        const temp = result.value._roles;
        const size = Object.keys(temp).length;

        // Checks role list of given user
        for (let i = 0; i < size; i++) {
          if (temp[i] === roleToAdd.id) result.value.roles.remove(roleToAdd);
        }
        result = memberIt.next();
      }

      await interaction.reply("Removed roles");
      break;
    }
    default:
      break;
  }
});

/**
 * @todo Start reaction collector on interaction instead of message to remove dependency on constant reactionMessage
 */
client.on("messageCreate", async (msg) => {
  const guild = msg.guild;
  const allRoles = await guild.roles.fetch();
  const roleToManage = allRoles.get(roleString);

  if (msg.content === reactionMessage) {
    const collector = msg.createReactionCollector({
      time: timeToEnd,
      dispose: true,
    });

    collector.on("collect", async (reaction, user) => {
      console.log("Reaction collected", reaction.emoji.name, user.username);
      if (reaction.emoji.name === "👍") {
        const member = await guild.members.fetch(user.id);
        member.roles.add(roleToManage);
        console.log("Added member", member.user.username);
      }
    });

    collector.on("remove", async (reaction, user) => {
      if (reaction.emoji.name === "👍") {
        const member = await guild.members.fetch(user.id);
        member.roles.remove(roleToManage);
      }
    });
  }
});

client.login(process.env.BOT_ID);
