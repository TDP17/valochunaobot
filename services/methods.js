const axios = require("axios");
const { botUsername } = require("../utils/constant");
const { canQueue } = require("../utils/rankBasedUtils");

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
  allRoles,
  roleToAdd,
  guild,
  client,
  users
) => {
  // console.log("Reaction collected", reaction.emoji.name, user.username);
  if (reaction.emoji.name === "👍") {
    const member = await guild.members.fetch(user.id);
    try {
      const foundUser = await users.findOne({ username: user.username });

      if (!foundUser) {
        const u = await client.users.fetch(user.id);
        if (!u.bot)
          u.send("Please register first using /register with your ign and tag");
        return;
      }

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
 */
const randomizeList = async (signupsList) => {
  for (let i = signupsList.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [signupsList[i], signupsList[j]] = [signupsList[j], signupsList[i]];
  }

  // Post randomize swapping
  // Case 5, 10... members
  if (signupsList.length <= 5) return signupsList;

  // Case - 6, 11... members
  if (signupsList.length % 5 <= 1) {
    return signupsList;
  }
  // Case - 7, 12... members
  else if (signupsList.length % 5 === 2) {
    const lastPersonRank = signupsList[signupsList.length - 1].rank;
    const secondLastPersonRank = signupsList[signupsList.length - 2].rank;

    if (canQueue(lastPersonRank, secondLastPersonRank)) return signupsList;
    else return -1;

    // Definitive way to find the 2 people that can queue, fixes time complexity - use if taking too long to find.
    // const signupsListRanks = signupsList.map((s) => s.rank);
    // const swaps = findPersonToSwitchInTwo(
    //   signupsListRanks.slice(0, -2),
    //   secondLastPersonRank,
    //   lastPersonRank
    // );

    // // Has to be either of last 2
    // const firstIndex =
    //   swaps.in === lastPersonRank
    //     ? signupsListRanks.length - 1
    //     : signupsListRanks.length - 2;
    // const secondIndex = signupsListRanks.indexOf(swaps.out);
    // if (secondIndex === -1) return -1;

    // [signupsList[firstIndex], signupsList[secondIndex]] = [
    //   signupsList[secondIndex],
    //   signupsList[firstIndex],
    // ];
  }
  // Case - 8, 13... members
  else if (signupsList.length % 5 === 3) {
    // const signupsListRanks = signupsList.map((s) => s.rank);
    const lastPersonRank = signupsList[signupsList.length - 1].rank;
    const secondLastPersonRank = signupsList[signupsList.length - 2].rank;
    const thirdLastPersonRank = signupsList[signupsList.length - 3].rank;

    if (
      canQueue(lastPersonRank, secondLastPersonRank) &&
      canQueue(thirdLastPersonRank, secondLastPersonRank) &&
      canQueue(thirdLastPersonRank, lastPersonRank)
    )
      return signupsList;
    else return -1;

    // Definitive way to find the 3 people that can queue, fixes time complexity - use if taking too long to find.
    // if (signupsList.length % 5 === 4) signupsList.pop();
    // if (
    //   (!canQueue(lastPersonRank, secondLastPersonRank),
    //   !canQueue(lastPersonRank, thirdLastPersonRank),
    //   !canQueue(thirdLastPersonRank, secondLastPersonRank))
    // )
    //   return -1;

    // // The approach we take here is swap in last person, second last person and third last person
    // // then select a random one from the 3 lists possible
    // const randomizationHelper = [];
    // const lastIn = findPersonToSwitchInThree(
    //   signupsListRanks.slice(0, -3),
    //   lastPersonRank,
    //   secondLastPersonRank,
    //   thirdLastPersonRank
    // );
    // const secondLastIn = findPersonToSwitchInThree(
    //   signupsListRanks.slice(0, -3),
    //   lastPersonRank,
    //   secondLastPersonRank,
    //   thirdLastPersonRank
    // );
    // const thirdLastIn = findPersonToSwitchInThree(
    //   signupsListRanks.slice(0, -3),
    //   lastPersonRank,
    //   secondLastPersonRank,
    //   thirdLastPersonRank
    // );
    // if (lastIn !== -1) randomizationHelper.push(lastIn);
    // if (secondLastIn !== -1) randomizationHelper.push(secondLastIn);
    // if (thirdLastIn !== -1) randomizationHelper.push(thirdLastIn);

    // const finalListIndex =
    //   randomizationHelper[
    //     Math.floor(Math.random() * randomizationHelper.length)
    //   ];

    // const firstIndex = signupsListRanks.indexOf(finalListIndex.in);
    // const secondIndex = signupsListRanks.indexOf(finalListIndex.out);

    // [signupsList[firstIndex], signupsList[secondIndex]] = [
    //   signupsList[secondIndex],
    //   signupsList[firstIndex],
    // ];
  }
  // Case - 9, 14... members -> Ignore last person
  else if (signupsList.length % 5 === 4) {
    const lastPersonRank = signupsList[signupsList.length - 2].rank;
    const secondLastPersonRank = signupsList[signupsList.length - 3].rank;
    const thirdLastPersonRank = signupsList[signupsList.length - 4].rank;

    if (
      canQueue(lastPersonRank, secondLastPersonRank) &&
      canQueue(thirdLastPersonRank, secondLastPersonRank) &&
      canQueue(thirdLastPersonRank, lastPersonRank)
    ) {
      signupsList.pop();
      return signupsList;
    } else return -1;
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
      timeout: 20 * 1000,
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

exports.addRole = addRole;
exports.collectList = collectList;
exports.createReply = createReply;
exports.randomizeList = randomizeList;
exports.removeRole = removeRole;
exports.removeRoleFromAllUsers = removeRoleFromAllUsers;
exports.registerUser = registerUser;
exports.updateRankForUser = updateRankForUser;
