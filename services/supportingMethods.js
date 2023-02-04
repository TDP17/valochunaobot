const axios = require("axios");
const { botUsername } = require("../utils/constant");

/**
 * Removes role from given user
 * @param {*} reaction - reaction received containing the emoji
 * @param {*} user - user that did the reaction
 * @param {*} roleToRemove - role to remove for the user who retracted the signup
 */
const removeRole = async (reaction, user, roleToRemove, guild) => {
  try {
    if (reaction.emoji.name === "👍") {
      const member = await guild.members.fetch(user.id);
      member.roles.remove(roleToRemove);
    }
  } catch (error) {
    console.error(error);
  }
};

/**
 * Adds role to given user
 * @param {*} reaction - reaction received containing the emoji
 * @param {*} user - user that did the reaction
 * @param {*} roleToAdd - role to add for the user who retracted the signup
 * @param {*} guild - guild is the server (I think?)
 */
const addRole = async (
  reaction,
  user,
  roleToAdd,
  guild,
  client,
  users
) => {
  if (reaction.emoji.name === "👍") {
    const member = await guild.members.fetch(user.id);
    try {
      const foundUser = await users.findOne({ username: user.username });

      if (!foundUser) {
        const u = await client.users.fetch(user.id);
        if (!u.bot)
          u.send("Ghar jaladunga tumhara, register karlo pehle with ign and tag and then remove the reaction and re-add it");
        return;
      }

      await member.roles.add(roleToAdd);
    } catch (error) {
      console.error(error);
    }
  }
};

/**
 * Collects the list of users who signed up for the day
 * @param {*} interaction - The interaction object received by the listener interactionCreate, contains the guild object to fetch all members
 * @returns - signupsList, an array containing all the signups for the day
 */
const collectList = async (interaction, roleToAdd, users) => {
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
      ) {
        try {
          const user = await users.findOne({
            username: result.value.user.username,
          });
          signupsList.push({ username: user.username, rank: user.rank });
        } catch (error) {
          console.error(error);
        }
      }
    }
    result = memberIterator.next();
  }

  return signupsList;
};

/**
 * @param {*} signupsList - The list of signed up users
 * @returns - listReply, the formatted string version of the reply message by the bot
 */
const createReply = (signupsList) => {
  let listReply = "```";
  if (signupsList.length > 0)
    listReply += `\n1.${signupsList.slice(0, 5).join(", ")}\n`;
  else listReply += `No signups found`;
  if (signupsList.length > 5)
    listReply += `2.${signupsList.slice(5, 10).join(", ")}\n`;
  if (signupsList.length > 10)
    listReply += `3.${signupsList.slice(10, 15).join(", ")}\n`;
  listReply += "```";

  return listReply;
};

/**
 * @param {*} interaction - The interaction object received by the listener interactionCreate, contains the guild object to fetch all members
 * @param {*} roleToAdd - role to add for the user who retracted the signup
 */
const removeRoleFromAllUsers = async (interaction, roleToAdd) => {
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
};

/**
 * @param {*} db - database client of mongodb
 * @param {*} username - username of the person who used the interaction
 * @param {*} name - valorant in game name
 * @param {*} tag - valornat in game tag
 */
const registerUser = async (users, username, name, tag) => {
  try {
    const response = await axios({
      method: "get",
      timeout: 20 * 1000,
      url: `https://api.henrikdev.xyz/valorant/v1/mmr/ap/${name}/${tag}`,
    });
    if (response.status === 200) {
      const rank = response.data.data.currenttier;
      const update = { $set: { username, name, tag, rank } };
      const query = { username };
      const options = { upsert: true };
      await users.updateOne(query, update, options);
      return `Found user with rank ${response.data.data.currenttierpatched} :D`;
    } else {
      return "Some error, contact TDP";
    }
  } catch (error) {
    if (error.response.status === 404)
      return "User not found on region asia-pacific, if your account is not AP, unlucky";
    else {
      console.error(error);
      return "Some error, contact TDP";
    }
  }
};

const updateRankForUser = async (users, username) => {
  if (username === "ValoChunaoBot") return;
  try {
    const user = await users.findOne({ username: username });

    if (!user) return console.error(`No user found with username ${username}`);

    const { name, tag } = user;

    const response = await axios({
      method: "get",
      timeout: 20 * 10000,
      url: `https://api.henrikdev.xyz/valorant/v1/mmr/ap/${name}/${tag}`,
    });

    if (response.data.data.currenttier == user.rank) return;

    await users.updateOne(
      { username },
      { $set: { rank: response.data.data.currenttier } }
    );
  } catch (error) {
    console.error(error);
  }
};

/**
 * Purges the exempted collection. Adds users to if an argument is passed to it
 * @param {*} dbExemptedUsers The collection of exempted users
 * @param  {...any} exemptedUsers Usernames of the exempted users if any
 */
const editExempted = async (dbExemptedUsers, ...exemptedUsers) => {
  await dbExemptedUsers.deleteMany({});

  // Add users only if passed
  if(exemptedUsers.length > 0)
  {
    for(username in exemptedUsers)
      await dbExemptedUsers.insertOne({username: user});
  }
};

exports.addRole = addRole;
exports.collectList = collectList;
exports.createReply = createReply;
exports.removeRole = removeRole;
exports.removeRoleFromAllUsers = removeRoleFromAllUsers;
exports.registerUser = registerUser;
exports.updateRankForUser = updateRankForUser;
exports.editExempted = editExempted;