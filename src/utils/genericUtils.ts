/**
 * Checks if two given ranks can queue together or not.
 * @param a rank 1.
 * @param b rank 2.
 * @returns (boolean), if the two ranks a and b can queue together.
 */
export const canQueue = (a: number, b: number): boolean => {
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

// Uses Fisher - Yates (Knuth's algo).
export const shuffleArray = (arr: any[]): void => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
};
