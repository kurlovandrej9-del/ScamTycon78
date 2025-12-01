
export const formatMoney = (amount: number): string => {
  if (amount >= 1_000_000_000) return `₴${(amount / 1_000_000_000).toFixed(2)}B`;
  if (amount >= 1_000_000) return `₴${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `₴${(amount / 1_000).toFixed(2)}K`;
  return `₴${Math.floor(amount)}`;
};

export const calculateUpgradeCost = (baseCost: number, currentLevel: number): number => {
  return Math.floor(baseCost * Math.pow(1.15, currentLevel));
};
