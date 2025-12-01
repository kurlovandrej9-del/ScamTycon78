
export enum Tab {
  CLICKER = 'CLICKER',   // Default view
  MARKET = 'MARKET',     // Upgrades
  MANAGEMENT = 'MANAGEMENT', // Business + Laundering
  SCHEMES = 'SCHEMES',   // New: Active tasks (Temki)
  LIFESTYLE = 'LIFESTYLE',
  PROFILE = 'PROFILE'    
}

export enum VerticalType {
  DATING = 'Дейтинг',
  ESCORT = 'Эскорт',
  SHOP = 'Шоп',
  NFT = 'НФТ',
  TRADE = 'Трейд',
  TRAFFIC = 'Трафик',
  OFFICE = 'Офис',
  LIFESTYLE = 'Имущество',
  LAUNDERING = 'Обмыв',
  DARK = 'Чернуха' 
}

export enum UpgradeType {
  RENTAL = 'RENTAL',       
  SOFTWARE = 'SOFTWARE',   
  TRAFFIC = 'TRAFFIC',     
  BLACK_MARKET = 'BLACK_MARKET' 
}

export enum BusinessStage {
  NONE = 'NONE',
  REMOTE_TEAM = 'REMOTE_TEAM', 
  OFFICE = 'OFFICE',           
  NETWORK = 'NETWORK'          
}

export enum TeamStrategy {
  SAFE = 'SAFE',       
  BALANCED = 'BALANCED', 
  AGGRESSIVE = 'AGGRESSIVE' 
}

// --- TRADING / EXCHANGE TYPES ---
export enum AssetType {
  CRYPTO = 'CRYPTO',
  STOCK = 'STOCK',
  RESOURCE = 'RESOURCE'
}

export interface AssetItem {
  id: string;
  symbol: string;
  name: string;
  type: AssetType;
  basePrice: number;
  volatility: number; 
  icon: string;
}

// --- SCHEMES (ТЕМКИ) ---
export enum SchemeCategory {
  GREY = 'GREY',   // Internet stuff (Refund, Airdrop)
  BLACK = 'BLACK'  // Drugs, Guns (High Risk)
}

export interface SchemeItem {
  id: string;
  name: string;
  description: string;
  category: SchemeCategory;
  cost: number;
  durationSeconds: number; // Time to complete
  riskPercentage: number;  // 0-100% chance of failure
  minProfit: number;
  maxProfit: number;
  icon: string;
  reqReputation?: number;
}

export interface ActiveScheme {
  id: string; // unique instance id
  schemeId: string;
  startTime: number;
  endTime: number;
  isReady: boolean;
}
// ------------------------------

export interface UpgradeItem {
  id: string;
  name: string;
  type: UpgradeType;
  vertical: VerticalType;
  baseCost: number;
  baseProfit: number; 
  level: number;
  description: string;
  maxLevel?: number;
  tierNames?: string[]; 
}

export interface LaunderingItem {
  id: string;
  name: string;
  baseCost: number;
  baseLimit: number; 
  baseIncome: number; 
  description: string;
  reqBusinessStage: BusinessStage;
  icon: string;
}

export interface PropertyItem {
  id: string;
  name: string;
  baseCost: number;
  reputationBonus: number;
  description: string;
  image: string;
}

export interface JobPosition {
  id: string;
  title: string;
  vertical: string;
  salaryPerClick: number;
  passiveIncome: number;
  requiredReputation: number;
  costToPromote: number;
  isManager: boolean;
  reqBusinessStage: BusinessStage; 
}

export interface GameEvent {
  id: string;
  title: string;
  message: string;
  type: 'GOOD' | 'BAD';
  effectValue: number;
}

export interface GameState {
  balance: number;
  lifetimeEarnings: number;
  
  // Stats
  reputation: number;
  clickValue: number;
  profitPerSecond: number; 
  
  // Inventory
  upgrades: Record<string, number>; 
  properties: Record<string, number>; 
  launderingUpgrades: Record<string, number>; 
  
  // Trading Portfolio
  ownedAssets: Record<string, number>; 
  assetPrices: Record<string, number>; 
  
  // Active Schemes
  activeSchemes: ActiveScheme[];

  currentJobId: string;
  
  // Business Logic
  hasBusiness: boolean;
  businessStage: BusinessStage; 
  teamStrategy: TeamStrategy; 
  workers: number;     
  officeLevel: number;
  officeBranches: number;
  
  // Settings
  workerSalaryRate: number; 
  
  lastSaveTime: number;
}

export const INITIAL_STATE: GameState = {
  balance: 0,
  lifetimeEarnings: 0,
  profitPerSecond: 0,
  clickValue: 1,
  reputation: 0,
  upgrades: {},
  properties: {},
  launderingUpgrades: {}, 
  
  ownedAssets: {},
  assetPrices: {},
  
  activeSchemes: [],

  currentJobId: 'job_start',
  
  hasBusiness: false,
  businessStage: BusinessStage.NONE,
  teamStrategy: TeamStrategy.SAFE,
  workers: 0,
  officeLevel: 1,
  officeBranches: 1,
  
  workerSalaryRate: 0.4, 
  
  lastSaveTime: Date.now()
};
