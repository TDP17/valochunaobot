const { Client, GatewayIntentBits } = require("discord.js");

const dotenv = require("dotenv");
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

const reactionMessage = "React with a 👍 to signup for tonight";
const roleString = "1004490463400689798";
const botUsername = "ValoChunaoBot";

client.once("ready", () => {
  console.log("Ready!");
});

let timeToEnd; // Time to end option collected from user

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const allRoles = await interaction.guild.roles.fetch();
  const roleToAdd = allRoles.get(roleString);

  const { commandName } = interaction;

  if (commandName === "randomize") {
    const list = [];

    const allMembers = await interaction.guild.members.fetch();

    const memberIt = allMembers.values();

    let result = memberIt.next();
    while (!result.done) {
      const temp = result.value._roles;
      const size = Object.keys(temp).length;
      for (let i = 0; i < size; i++) {
        if (
          temp[i] === roleToAdd.id &&
          result.value.user.username != botUsername
        )
          list.push(result.value.user.username);
      }
      result = memberIt.next();
    }

    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }

    const firstList = list.slice(0, 5);
    let secondList;
    if (list.length > 5) {
      secondList = list.slice(5, 10);
    }

    await interaction.reply(
      `First List: \`${firstList.join(" ")}\`\n${
        list.length > 5 ? `Second List: \`${secondList.join(" ")}\`` : ""
      }`
    );
  } else if (commandName === "signups") {
    timeToEnd = interaction.options.getInteger("time");
    const allMembers = await interaction.guild.members.fetch();
    const memberIt = allMembers.values();

    const message = await interaction.reply({
      content: reactionMessage,
      fetchReply: true,
    });
    message.react("👍");
  } else if (commandName === "removeroles") {
    const allMembers = await interaction.guild.members.fetch();
    const memberIt = allMembers.values();
    let result = memberIt.next();
    while (!result.done) {
      const temp = result.value._roles;
      const size = Object.keys(temp).length;
      for (let i = 0; i < size; i++) {
        if (temp[i] === roleToAdd.id) result.value.roles.remove(roleToAdd);
      }
      result = memberIt.next();
    }
    const message = await interaction.reply("Removes roles");
  }
});

client.on("messageCreate", (msg) => {
  if (msg.content === reactionMessage) {
    const collector = msg.createReactionCollector({ time: timeToEnd });

    collector.on("collect", async (reaction, user) => {
      if (reaction.emoji.name === "👍") {
        const guild = msg.guild;

        const allRoles = await guild.roles.fetch();
        const roleToAdd = allRoles.get(roleString);

        const member = await guild.members.fetch(user.id);
        member.roles.add(roleToAdd);
      }
    });

    collector.on("end", (collected) => {
      console.log(`Collected ${collected.size} items`);
    });
  }
});

client.login(process.env.BOT_ID);
