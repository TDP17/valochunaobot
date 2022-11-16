const { botUsername } = require("../utils/constant");

/**
 * Removes role from given user
 * @param {*} reaction - reaction received containing the emoji
 * @param {*} user - user that did the reaction
 * @param {*} roleToRemove - role to remove for the user who retracted the signup
 */
const removeRole = async (reaction, user, roleToRemove) => {
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
const addRole = async (reaction, user, allRoles, roleToAdd, guild) => {
  // console.log("Reaction collected", reaction.emoji.name, user.username);
  if (reaction.emoji.name === "👍") {
    const member = await guild.members.fetch(user.id);
    try {
      await member.roles.add(roleToAdd);
      // This logs the user information, uncomment if something is buggy
      // console.log(member.user.username);
      // const named_roles_array = newMember._roles.map((item) => {
      //   return allRoles.get(item).name;
      // });
      // console.log(named_roles_array);
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
const collectList = async (interaction, roleToAdd) => {
  const signupsList = [];

  // Gets list of members who have the role in membersList
  const allMembers = await interaction.guild.members.fetch();
  const memberIterator = allMembers.values();

  let result = memberIterator.next();
  while (!result.done) {
    const temp = result.value._roles;
    const size = Object.keys(temp).length;
    for (let i = 0; i < size; i++) {
      if (temp[i] === roleToAdd.id && result.value.user.username != botUsername)
        signupsList.push(result.value.user.username);
    }
    result = memberIterator.next();
  }

  return signupsList;
};

/**
 * @param {*} signupsList - The list of signed up users
 */
const randomizeList = async (signupsList) => {
  for (let i = signupsList.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [signupsList[i], signupsList[j]] = [signupsList[j], signupsList[i]];
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
const registerUser = async (db, username, name, tag) => {
  try {
    const query = { username };
    const update = { $set: { username, name, tag, rank: 0 } };
    const options = { upsert: true };
    await db.db("main").collection("users").updateOne(query, update, options);
  } catch (error) {
    console.error(error);
  }
};

exports.addRole = addRole;
exports.collectList = collectList;
exports.createReply = createReply;
exports.randomizeList = randomizeList;
exports.removeRole = removeRole;
exports.removeRoleFromAllUsers = removeRoleFromAllUsers;
exports.registerUser = registerUser;
