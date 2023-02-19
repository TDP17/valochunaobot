import { Collection, Document } from "mongodb";
import { randomizedReturnType, signupsListType, usernameListType } from "../types/mainTypes";
import { shuffleArray, canQueue } from "../utils/genericUtils.js";

/**
 * Purges the exempted collection and adds users to if list of exempted users is non empty.
 * @param dbExemptedUsers - The collection of exempted users.
 * @param exemptedUsers - Usernames of the exempted users if any.
 */
export const editExempted = async (dbExemptedUsers: Collection<Document>, exemptedUsers: string[]) => {
  await dbExemptedUsers.deleteMany({});

  if (exemptedUsers.length > 0) {
    for (let username of exemptedUsers)
      await dbExemptedUsers.insertOne({ username: username });
  }
};

/**
 * Returns all the possible parties.
 * @todo This takes too much time, change using a sorted rank list or something.
 * @param list - The list to form combinations of.
 * @param partyNumber - The number of people in a party.
 * @returns (array of array of {username, rank}) The list of all possible parties.
 */
export const returnPossibleParties = (list: signupsListType, partyNumber: number) => {
  const possibleParties = [];

  if (partyNumber === 2) {
    for (let i = 0; i < list.length - 1; i++) {
      const firstRank = list[i].rank;
      for (let j = i + 1; j < list.length; j++) {
        const secondRank = list[j].rank;
        if (canQueue(firstRank, secondRank))
          possibleParties.push([list[i], list[j]]);
      }
    }
  }
  if (partyNumber === 3) {
    for (let i = 0; i < list.length - 2; i++) {
      const firstRank = list[i].rank;

      for (let j = i + 1; j < list.length - 1; j++) {
        const secondRank = list[j].rank;

        for (let k = j + 1; k < list.length; k++) {
          const thirdRank = list[k].rank;
          if (
            canQueue(firstRank, secondRank) &&
            canQueue(firstRank, thirdRank) &&
            canQueue(secondRank, thirdRank)
          )
            possibleParties.push([list[i], list[j], list[k]]);
        }
      }
    }
  }

  return possibleParties;
};

/**
 * Default randomize with every person (exempted included).
 * @param signupsList - The list of everyone who signed up.
 * @param partyNumber - The number of people in excluded party.
 * @returns (object includedList: [string], excludedList: [string]), an object containing the usernames of included and excluded players.
 */
const fullListRandomize = (signupsList: signupsListType, partyNumber: number): randomizedReturnType => {
  shuffleArray(signupsList);
  if (partyNumber === 2) {
    const lastPersonRank = signupsList[signupsList.length - 1].rank;
    const secondLastPersonRank = signupsList[signupsList.length - 2].rank;

    if (canQueue(lastPersonRank, secondLastPersonRank))
      return {
        includedList: signupsList.slice(0, -2).map((u) => u.username),
        excludedList: [
          signupsList[signupsList.length - 1].username,
          signupsList[signupsList.length - 2].username,
        ],
      };
    else return fullListRandomize(signupsList, 2);
  } else if (partyNumber === 3) {
    const lastPersonRank = signupsList[signupsList.length - 1].rank;
    const secondLastPersonRank = signupsList[signupsList.length - 2].rank;
    const thirdLastPersonRank = signupsList[signupsList.length - 3].rank;

    if (
      canQueue(lastPersonRank, secondLastPersonRank) &&
      canQueue(thirdLastPersonRank, secondLastPersonRank) &&
      canQueue(thirdLastPersonRank, lastPersonRank)
    )
      return {
        includedList: signupsList.slice(0, -3).map((u) => u.username),
        excludedList: [
          signupsList[signupsList.length - 1].username,
          signupsList[signupsList.length - 2].username,
          signupsList[signupsList.length - 3].username,
        ],
      };
    else return fullListRandomize(signupsList, 3);
  }
};

/**
 * Maleshwaram area (hehe) one person from non exempted list and place in exempted collection
 * @param exemptedList - The list of usernames who are exempted from being in the minority party.
 * @param nonExemptedList - The list of usernames who can be in the minority party.
 * @returns (object includedList: [string], excludedList: [string]), an object containing the usernames of included and excluded players.
 */
export const randomizeInModOne = (exemptedList: usernameListType, nonExemptedList: usernameListType) => {
  shuffleArray(nonExemptedList);

  const popped = nonExemptedList.pop();

  const finalList = nonExemptedList.map((u) => u.username);

  return {
    includedList: finalList.concat(exemptedList.map((u) => u.username)),
    excludedList: [popped.username],
  };
};

/**
 * @param exemptedList - The list of usernames who are exempted from being in the minority party.
 * @param nonExemptedList - The list of usernames who can be in the minority party.
 * @param signupsList - The list of usernames and ranks of everyone who signed up.
 * @returns (object includedList: [string], excludedList: [string]), an object containing the usernames of included and excluded players.
 */
export const randomizeInModTwo = (exemptedList: usernameListType, nonExemptedList: signupsListType, signupsList: signupsListType) => {
  const possibleTwoMan = returnPossibleParties(nonExemptedList, 2);

  // If no two man, randomize along with exempted list --> Most common case is 4e+3n.
  if (possibleTwoMan.length === 0) {
    return fullListRandomize(signupsList, 2);
  }
  // Otherwise shuffle possible list and pick first
  else {
    shuffleArray(possibleTwoMan);
    const finalTwoMan = possibleTwoMan[0];

    // Construct list of non exempted list - two man
    const finalNonExemptedList = nonExemptedList
      .filter((u) => {
        return (
          u.username !== finalTwoMan[0].username &&
          u.username !== finalTwoMan[1].username
        );
      })
      .map((u) => u.username);

    return {
      includedList: finalNonExemptedList.concat(
        exemptedList.map((u) => u.username)
      ),
      excludedList: finalTwoMan.map((u) => u.username),
    };
  }
};

/**
 * @param exemptedList - The list of usernames who are exempted from being in the minority party.
 * @param nonExemptedList - The list of usernames who can be in the minority party.
 * @param signupsList - The list of usernames and ranks of everyone who signed up.
 * @returns (object includedList: [string], excludedList: [string]), an object containing the usernames of included and excluded players.
 */
export const randomizeInModThree = (exemptedList: usernameListType, nonExemptedList: signupsListType, signupsList: signupsListType) => {
  const possibleThreeMan = returnPossibleParties(nonExemptedList, 3);

  // If no three man, randomize along with exempted list --> Most common case is 4e+4n.
  if (possibleThreeMan.length === 0) {
    return fullListRandomize(signupsList, 3);
  }
  // Otherwise shuffle possible list and pick first
  else {
    shuffleArray(possibleThreeMan);
    const finalThreeMan = possibleThreeMan[0];

    // Construct list of non exempted list - three man
    const finalNonExemptedList = nonExemptedList
      .filter((u) => {
        return (
          u.username !== finalThreeMan[0].username &&
          u.username !== finalThreeMan[1].username &&
          u.username !== finalThreeMan[2].username
        );
      })
      .map((u) => u.username);

    return {
      includedList: finalNonExemptedList.concat(
        exemptedList.map((u) => u.username)
      ),
      excludedList: finalThreeMan.map((u) => u.username),
    };
  }
};
