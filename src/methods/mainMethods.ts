import axios from "axios";
import { editExempted, randomizeInModOne, randomizeInModTwo, randomizeInModThree } from "./supportingMethods.js";
import { signupsListType, usernameListType } from "../types/mainTypes";

import { botUsername } from "../utils/constant.js";
import { MessageReaction, User, Role, Guild, Client, CacheType, Interaction } from "discord.js";
import { Collection, Document } from "mongodb";

/**
 * Removes role from given user.
 * @param user - User that did the reaction.
 * @param roleToRemove - Role to remove for the user who removed the signup.
 * @param guild - The discord server object.
 */
export const removeRoleFromUser = async (reaction: MessageReaction, user: User, roleToRemove: Role, guild: Guild) => {
  try {
    if (reaction.emoji.name === "👍") {
      const member = await guild.members.fetch(user.id);
      await member.roles.remove(roleToRemove);
    }
  } catch (error) {
    console.error(error);
  }
};

/**
 * Adds role to given user.
 * @param user - User that did the reaction.
 * @param roleToManage - Role to add for the user who added the signup.
 * @param guild - The discord server object.
 */
export const addRoleToUser = async (user: User, roleToManage: string, guild: Guild, client: Client<boolean>, dbUsers: Collection<Document>) => {
  const member = await guild.members.fetch(user.id);
  try {
    const foundUser = await dbUsers.findOne({ username: user.username });

    if (!foundUser) {
      const u = await client.users.fetch(user.id);
      if (!u.bot)
        u.send(
          "Ghar jaladunga tumhara, register karlo pehle with ign and tag and then remove the reaction and re-add it"
        );
      return;
    }

    await member.roles.add(roleToManage);
  } catch (error) {
    console.error(error);
  }
};

/**
 * Collects the list of users who signed up for the day.
 * @todo Refactor for cleanliness.
 * @param interaction - The interaction object received by the listener interactionCreate, contains the guild object to fetch all members.
 * @returns - signupsList, an array containing all the signups for the day.
 */
export const collectList = async (interaction: Interaction<CacheType>, roleToManage: Role, dbUsers: Collection<Document>) => {
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
        temp[i] === roleToManage.id &&
        result.value.user.username != botUsername
      ) {
        try {
          const user = await dbUsers.findOne({
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
 * Creates a formatted string that the bot serves up as a reply for the "randomize" command.
 * @todo Make excludedList passing by other functions more even, probably just a string array.
 * @param includedList - The list of included users.
 * @param excludedList - The list of excluded users.
 * @returns - listReply, the formatted string version of the reply message by the bot.
 */
export const createReply = (includedList: string[], ...excludedList: string[][]) => {
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
 * Removes the specified role from all members who have it.
 * @param interaction - The interaction object received by the listener interactionCreate, contains the guild object to fetch all members
 * @param roleToManage - Role to remove from all members.
 */
export const removeRoleFromAllUsers = async (interaction: Interaction<CacheType>, roleToManage: Role) => {
  const allMembers = await interaction.guild.members.fetch();
  const memberIt = allMembers.values();
  let result = memberIt.next();
  while (!result.done) {
    const temp = result.value._roles;
    const size = Object.keys(temp).length;

    for (let i = 0; i < size; i++) {
      if (temp[i] === roleToManage.id) result.value.roles.remove(roleToManage);
    }
    result = memberIt.next();
  }
};

/**
 * Registers the user in the users database collection, required once per user. Updates existing user if redone
 * @param dbUsers The database collection for the users.
 * @param username The discord username of the person to update rank for.
 * @param name In game name of the Valorant player.
 * @param tag In game tag of the Valorant player (The numbers after the #, example #7590 --> 7590).
 */
export const registerUser = async (dbUsers: Collection<Document>, username: string, name: string, tag: string) => {
  try {
    const response = await axios({
      method: "get",
      timeout: 20 * 10000,
      url: `https://api.henrikdev.xyz/valorant/v1/mmr/ap/${name}/${tag}`,
    });
    if (response.status === 200) {
      const rank = response.data.data.currenttier;
      const update = { $set: { username, name, tag, rank } };
      const query = { username };
      const options = { upsert: true };
      await dbUsers.updateOne(query, update, options);
      return `Found user with rank ${response.data.data.currenttierpatched}`;
    } else {
      return "Some error, contact TDP";
    }
  } catch (error) {
    if (error.response.status === 404)
      return "User not found on region Asia-Pacific OR request timed out, please try again.";
    else {
      console.error(error);
      return "Some error, contact TDP";
    }
  }
};

/**
 * Updates rank for given username if it exists.
 * @param dbUsers The database collection for the users.
 * @param username The discord username of the person to update rank for.
 */
export const updateRankForUser = async (dbUsers: Collection<Document>, username: string) => {
  if (username === "ValoChunaoBot") return;
  try {
    const user = await dbUsers.findOne({ username: username });

    if (!user) return console.error(`No user found with username ${username}`);

    const { name, tag } = user;

    const response = await axios({
      method: "get",
      timeout: 20 * 10000,
      url: `https://api.henrikdev.xyz/valorant/v1/mmr/ap/${name}/${tag}`,
    });

    if (response.data.data.currenttier == user.rank) return;

    await dbUsers.updateOne(
      { username },
      { $set: { rank: response.data.data.currenttier } }
    );
  } catch (error) {
    console.error(error);
  }
};

/**
 * Randomizes the list, the "main" function of this bot, contains a case by case structure.
 * @todo check if switch looks cleaner here.
 * @refactor exemptedList as unknown as usernameListType.
 * @param signupsList The list of all people who signed up, used in case proper parties cannot be generated,
 * @param dbExemptedUsers The database collection for the exempted users.
 * @returns {includedList, excludedList}, an object containing the list of people in the 5 man and not in the 5 man respectively [does not return the popped user. Example in 9 people, does not return the 9th person].
 */
export const randomizeList = async (signupsList: signupsListType, dbExemptedUsers: Collection<Document>) => {
  // Case 5, 10... members
  if (signupsList.length % 5 === 0 || signupsList.length <= 5) {
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

  // Remove non signed up exempted people
  exemptedList = exemptedList.filter((e) =>
    signupsList.find((s) => s.username === e.username)
  );

  const nonExemptedList = signupsList.filter(
    (u) => !exemptedList.find((e) => e.username === u.username)
  );

  // Case - 6, 11... members
  if (signupsList.length % 5 === 1) {
    const { includedList, excludedList } = randomizeInModOne(
      exemptedList as unknown as usernameListType,
      nonExemptedList
    );

    editExempted(dbExemptedUsers, excludedList);

    return { includedList, excludedList };
  }

  // Case - 7, 12... members
  else if (signupsList.length % 5 === 2) {
    const { includedList, excludedList } = randomizeInModTwo(
      exemptedList as unknown as usernameListType,
      nonExemptedList,
      signupsList
    );

    editExempted(dbExemptedUsers, excludedList);

    return { includedList, excludedList };
  }

  // Case - 8, 13... members
  else if (signupsList.length % 5 === 3) {
    const { includedList, excludedList } = randomizeInModThree(
      exemptedList as unknown as usernameListType,
      nonExemptedList,
      signupsList
    );

    editExempted(dbExemptedUsers, excludedList);

    return { includedList, excludedList };
  }
  // Case - 9, 14... members
  else if (signupsList.length % 5 === 4) {
    const popped = nonExemptedList.pop();
    signupsList = signupsList.filter(u => u.username !== popped.username);

    const { includedList, excludedList } = randomizeInModThree(
      exemptedList as unknown as usernameListType,
      nonExemptedList,
      signupsList
    );

    // This is done to add the popped person in the exempted collection.
    const droppedList = excludedList.slice();
    droppedList.push(popped.username);
    editExempted(dbExemptedUsers, droppedList);

    return { includedList, excludedList };
  }
};
