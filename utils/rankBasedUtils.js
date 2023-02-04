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