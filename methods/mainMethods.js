const {
  editExempted,
  randomizeInModOne,
  randomizeInModTwo,
  randomizeInModThree,
} = require("./supportingMethods");

const axios = require("axios");
const { botUsername } = require("../utils/constant");
const { shuffleArray } = require("../utils/genericUtils");

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
const addRole = async (reaction, user, roleToAdd, guild, client, users) => {
  if (reaction.emoji.name === "👍") {
    const member = await guild.members.fetch(user.id);
    try {
      const foundUser = await users.findOne({ username: user.username });

      if (!foundUser) {
        const u = await client.users.fetch(user.id);
        if (!u.bot)
          u.send(
            "Ghar jaladunga tumhara, register karlo pehle with ign and tag and then remove the reaction and re-add it"
          );
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
 * @param {*} includedList - The list of included users
 * @param {*} excludedList - The list of excluded users
 * @returns - listReply, the formatted string version of the reply message by the bot
 */
const createReply = (includedList, ...excludedList) => {
  let idx = 1;

  console.log("Todays included list", includedList);
  console.log("Todays excluded list", excludedList);

  let listReply = "```";
  if (includedList.length > 0) {
    listReply += `\n${idx}. ${includedList.slice(0, 5).join(", ")}\n`;
    idx++;
  } else {
    listReply += `No signups found`;
    listReply += "```";
    return listReply;
  }
  if (includedList.length > 5) {
    listReply += `${idx}. ${includedList.slice(5, 10).join(", ")}\n`;
    idx++;
  }
  if (includedList.length > 10) {
    listReply += `${idx}. ${includedList.slice(10, 15).join(", ")}\n`;
    idx++;
  }
  if (excludedList[0].length > 0) {
    if (excludedList.length === 4) excludedList.pop();
    listReply += `${idx}. ${excludedList[0].join(", ")}\n`;
  }
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
 * @param {*} signupsList - The entire list of signed up users
 * @param {*} exemptedUsers - The exempted users collection
 */
const randomizeList = async (signupsList, dbExemptedUsers) => {
  // Case 5, 10... members
  // Return the list as it is and clear exempted collection
  if (signupsList.length % 5 === 0) {
    shuffleArray(signupsList);
    await editExempted(dbExemptedUsers, []);
    return {
      includedList: signupsList.map((u) => u.username),
      excludedList: [],
    };
  }

  // Pick out exempted and non exempted list
  let exemptedList = await dbExemptedUsers
    .find({}, { projection: { _id: 0 } })
    .toArray();

  exemptedList = exemptedList.filter((e) =>
    signupsList.find((s) => s.username === e.username)
  );
  console.log(exemptedList);

  const nonExemptedList = signupsList.filter(
    (u) => !exemptedList.find((e) => e.username === u.username)
  );

  // Case - 6, 11... members
  if (signupsList.length % 5 === 1) {
    const { includedList, excludedList } = randomizeInModOne(
      exemptedList,
      nonExemptedList
    );

    editExempted(dbExemptedUsers, excludedList);

    return { includedList, excludedList };
  }

  // Case - 7, 12... members
  else if (signupsList.length % 5 === 2) {
    const { includedList, excludedList } = randomizeInModTwo(
      exemptedList,
      nonExemptedList,
      signupsList
    );

    editExempted(dbExemptedUsers, excludedList);

    return { includedList, excludedList };
  }

  // Case - 8, 13... members
  else if (signupsList.length % 5 === 3) {
    const { includedList, excludedList } = randomizeInModThree(
      exemptedList,
      nonExemptedList,
      signupsList
    );

    editExempted(dbExemptedUsers, excludedList);

    return { includedList, excludedList };
  }
  // Case - 9, 14... members -> Ignore last person
  else if (signupsList.length % 5 === 4) {
    const popped = nonExemptedList.pop();
    signupsList = signupsList.filter((u) => u.username !== popped.username);
    const { includedList, excludedList } = randomizeInModThree(
      exemptedList,
      nonExemptedList,
      signupsList
    );

    const droppedList = excludedList.slice();
    droppedList.push(popped.username);
    editExempted(dbExemptedUsers, droppedList);

    return { includedList, excludedList };
  }

  return signupsList;
};

exports.randomizeList = randomizeList;
exports.updateRankForUser = updateRankForUser;
exports.addRole = addRole;
exports.collectList = collectList;
exports.createReply = createReply;
exports.removeRoleFromAllUsers = removeRoleFromAllUsers;
exports.registerUser = registerUser;
exports.removeRole = removeRole;
