const { editExempted } = require("./supportingMethods");

const shuffleArray = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
};

/**
 * @param {*} signupsList - The entire list of signed up users
 * @param {*} exemptedUsers - The exempted users collection
 */
const randomizeList = async (signupsList, dbExemptedUsers) => {
  // Case 5, 10... members
  // Return the list as it is and clear exempted collection
  if (signupsList.length <= 5) {
    await editExempted(dbExemptedUsers);
    return signupsList;
  }

  // Pick out exempted and non exempetd list
  const exemptedList = await dbExemptedUsers
    .find({}, { projection: { _id: 0 } })
    .toArray();

  const nonExemptedList = signupsList.filter(
    (u) => !exemptedList.find((e) => e.username === u.username)
  );

  // Case - 6, 11... members
  // Maleshwaram area (hehe) one person from non exempted list and place in exempted collection
  if (signupsList.length % 5 <= 1) {
    shuffleArray(nonExemptedList);

    const popped = nonExemptedList.pop();

    await editExempted(dbExemptedUsers, popped);

    const finalList = nonExemptedList.map((u) => {
      return { username: u.username };
    });

    return finalList.concat(exemptedList);
  }

  // Case - 7, 12... members
  // Lots of cases to handle, probably refactor to something better at dynamic handling using dp probably?
  else if (signupsList.length % 5 === 2) {
    const lastPersonRank = signupsList[signupsList.length - 1].rank;
    const secondLastPersonRank = signupsList[signupsList.length - 2].rank;

    if (canQueue(lastPersonRank, secondLastPersonRank)) return signupsList;
    else return -1;
  }

  // Case - 8, 13... members
  else if (signupsList.length % 5 === 3) {
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

exports.randomizeList = randomizeList;
