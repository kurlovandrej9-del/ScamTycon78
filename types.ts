
export enum Tab {
  CLICKER = 'CLICKER',   // Default view
  MARKET = 'MARKET',     // Merged: Upgrades (Soft/Tools) + Traffic
  MANAGEMENT = 'MANAGEMENT', // Merged: Career + Team/Business
  LIFESTYLE = 'LIFESTYLE'
}

export enum VerticalType {
  DATING = 'Дейтинг',
  ESCORT = 'Эскорт',
  SHOP = 'Шоп',
  NFT = 'НФТ',
  TRADE = 'Трейд',
  TRAFFIC = 'Трафик',
  OFFICE = 'Офис',
  LIFESTYLE = 'Имущество'
}

export enum UpgradeType {
  RENTAL = 'RENTAL',       // Active Click Boosters (Spammers, etc)
  SOFTWARE = 'SOFTWARE',   // Evolves: Bot -> Site -> App (Passive Base)
  TRAFFIC = 'TRAFFIC',     // Global Multiplier
}

export enum BusinessStage {
  NONE = 'NONE',
  REMOTE_TEAM = 'REMOTE_TEAM', // Required for Team Lead
  OFFICE = 'OFFICE',           // Required for Head
  NETWORK = 'NETWORK'          // Required for CEO
}

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
  // For Software Evolution
  tierNames?: string[]; // ["Bot", "Site", "App"]
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
  reqBusinessStage: BusinessStage; // New Requirement
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
  profitPerSecond: number;
  clickValue: number;
  reputation: number;
  
  upgrades: Record<string, number>;
  properties: Record<string, number>;
  currentJobId: string;
  
  // Business Logic
  hasBusiness: boolean;
  businessStage: BusinessStage; // Tracks strict stage
  workers: number;     
  officeLevel: number;
  officeBranches: number;
  
  // Business Settings (Nuances)
  workerSalaryRate: number; // 0.1 to 0.9 (10% to 90%). Affects Efficiency.
  
  trafficMultiplier: number;
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
  currentJobId: 'job_start',
  
  hasBusiness: false,
  businessStage: BusinessStage.NONE,
  workers: 0,
  officeLevel: 1,
  officeBranches: 1,
  
  workerSalaryRate: 0.4, // Default 40% salary to workers
  
  trafficMultiplier: 1.0,
  lastSaveTime: Date.now()
};
