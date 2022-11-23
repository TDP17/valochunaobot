// const findPersonToSwitchInTwo = (rankList, firstTarget, secondTarget) => {
//   const possibleSwaps = [];
//   for (let i = 0; i < rankList.length; i++) {
//     // if (rankList[i] !== firstTarget && rankList[i] !== secondTarget) {
//     if (
//       canQueue(secondTarget, rankList[i]) ||
//       canQueue(firstTarget, rankList[i])
//     )
//       possibleSwaps.push(rankList[i]);
//     // }
//   }

//   const swappedOut =
//     possibleSwaps[Math.floor(Math.random() * possibleSwaps.length)];
//   let swappedIn;
//   if (canQueue(swappedOut, firstTarget) && canQueue(swappedOut, secondTarget)) {
//     const num = Math.floor(Math.random() * 2);
//     if (num === 0) swappedIn = firstTarget;
//     else swappedIn = secondTarget;
//   } else {
//     if (canQueue(swappedOut, firstTarget)) swappedIn = secondTarget;
//     else swappedIn = firstTarget;
//   }
//   return { in: swappedIn, out: swappedOut };
// };

// const findPersonToSwitchInThree = (
//   rankList,
//   switchInRank,
//   otherRank1,
//   otherRank2
// ) => {
//   const possibleSwaps = [];
//   for (let i = 0; i < rankList.length; i++) {
//     if (canQueue(otherRank1, rankList[i]) && canQueue(otherRank2, rankList[i]))
//       possibleSwaps.push(rankList[i]);
//   }
//   if (possibleSwaps.length > 0) {
//     const swappedOut =
//       possibleSwaps[Math.floor(Math.random() * possibleSwaps.length)];
//     return { in: switchInRank, out: swappedOut };
//   } else return -1;
// };

const canQueue = (a, b) => {
  const smaller = Math.min(a, b);
  const bigger = Math.max(a, b);
  if (smaller <= 8) return bigger <= 11;
  if (smaller >= 8 && smaller <= 11) return bigger <= 14;
  if (smaller >= 12 && smaller <= 14) return bigger >= 9 && bigger <= 17;
  if (smaller === 15) return bigger >= 12 && bigger <= 18;
  if (smaller === 16) return bigger >= 12 && bigger <= 19;
  if (smaller === 17) return bigger >= 12 && bigger <= 20;
  if (smaller >= 18 && smaller <= 23) return Math.abs(bigger - smaller) <= 3;

  return false;
};

exports.canQueue = canQueue;
// exports.findPersonToSwitchInTwo = findPersonToSwitchInTwo;
// exports.findPersonToSwitchInThree = findPersonToSwitchInThree;
