
import { UpgradeItem, JobPosition, VerticalType, UpgradeType, PropertyItem, GameEvent, BusinessStage } from './types';

// --- GAME COST CONSTANTS ---
export const CREATE_TEAM_COST = 20000;
export const SKIP_TO_OFFICE_COST = 250000; // ~10x harder than remote team
export const CONVERT_TO_OFFICE_COST = 250000;
export const OPEN_NEW_BRANCH_COST = 5000000;
export const WORKER_HIRE_COST_BASE = 500;

export const OFFICE_CAPACITY = [
  { level: 1, name: 'Чат в Telegram', maxWorkers: 5, cost: 0 },
  { level: 2, name: 'Коворкинг', maxWorkers: 15, cost: 50000 },
  { level: 3, name: 'Офис B-класс', maxWorkers: 40, cost: 250000 },
  { level: 4, name: 'Офис A-класс', maxWorkers: 100, cost: 2000000 },
  { level: 5, name: 'Башня Москва-Сити', maxWorkers: 500, cost: 25000000 },
];

// LIFESTYLE
export const PROPERTIES: PropertyItem[] = [
  { id: 'prop_coffee', name: 'Кофе', baseCost: 500, reputationBonus: 1, description: '+1 Реп', image: '☕' },
  { id: 'prop_gucci', name: 'Gucci Шмот', baseCost: 2500, reputationBonus: 3, description: '+3 Реп', image: 'gucci' }, // New
  { id: 'prop_sneakers', name: 'Кроссовки', baseCost: 5000, reputationBonus: 5, description: '+5 Реп', image: '👟' },
  { id: 'prop_iphone', name: 'Айфон', baseCost: 25000, reputationBonus: 15, description: '+15 Реп', image: '📱' },
  { id: 'prop_macbook', name: 'Макбук', baseCost: 100000, reputationBonus: 50, description: '+50 Реп', image: '💻' },
  { id: 'prop_rolex', name: 'Ролекс', baseCost: 500000, reputationBonus: 150, description: '+150 Реп', image: '⌚' },
  { id: 'prop_tesla', name: 'Тесла', baseCost: 1500000, reputationBonus: 350, description: '+350 Реп', image: 'tesla' }, // New
  { id: 'prop_bmw', name: 'BMW M5', baseCost: 4000000, reputationBonus: 800, description: '+800 Реп', image: '🏎️' },
  { id: 'prop_heli', name: 'Вертолет', baseCost: 12000000, reputationBonus: 2000, description: '+2K Реп', image: '🚁' }, // New
  { id: 'prop_apt', name: 'Пентхаус', baseCost: 25000000, reputationBonus: 4000, description: '+4K Реп', image: '🏢' },
  { id: 'prop_yacht', name: 'Яхта', baseCost: 75000000, reputationBonus: 9000, description: '+9K Реп', image: '🛥️' }, // New
  { id: 'prop_villa', name: 'Вилла', baseCost: 150000000, reputationBonus: 15000, description: '+15K Реп', image: '🌴' },
  { id: 'prop_island', name: 'Остров', baseCost: 500000000, reputationBonus: 40000, description: '+40K Реп', image: '🏝️' }, // New
  { id: 'prop_club', name: 'Футб. Клуб', baseCost: 1000000000, reputationBonus: 100000, description: '+100K Реп', image: '⚽' }, // New
];

// RANDOM EVENTS
export const RANDOM_EVENTS: GameEvent[] = [
  { id: 'ev_block', title: 'Лок Карты', message: 'Дроп отвалился.', type: 'BAD', effectValue: -0.05 },
  { id: 'ev_raid', title: 'Проверка', message: 'Пришлось решать вопросы.', type: 'BAD', effectValue: -0.10 },
  { id: 'ev_whale', title: 'Мамонт', message: 'Жирный депозит!', type: 'GOOD', effectValue: 2000 },
  { id: 'ev_pump', title: 'Памп', message: 'Крипта выросла.', type: 'GOOD', effectValue: 5000 },
];

// MARKET UPGRADES (Consolidated)
export const MARKET_ITEMS: UpgradeItem[] = [
  // 1. RENTAL TOOLS (Active Click Boost)
  { id: 'tool_proxy', name: 'Прокси', type: UpgradeType.RENTAL, vertical: VerticalType.TRAFFIC, baseCost: 100, baseProfit: 2, level: 0, description: '+2 Тап' },
  { id: 'tool_spam_soft', name: 'Спамер', type: UpgradeType.RENTAL, vertical: VerticalType.DATING, baseCost: 500, baseProfit: 5, level: 0, description: '+5 Тап' },
  { id: 'tool_sms', name: 'SMS Бот', type: UpgradeType.RENTAL, vertical: VerticalType.TRAFFIC, baseCost: 1500, baseProfit: 15, level: 0, description: '+15 Тап' },
  { id: 'tool_parser', name: 'Парсер', type: UpgradeType.RENTAL, vertical: VerticalType.TRAFFIC, baseCost: 5000, baseProfit: 40, level: 0, description: '+40 Тап' },
  { id: 'tool_cloaka', name: 'Клоака', type: UpgradeType.RENTAL, vertical: VerticalType.TRADE, baseCost: 15000, baseProfit: 100, level: 0, description: '+100 Тап' },

  // 2. SOFTWARE EVOLUTION (Passive Base per Worker)
  // Logic: 1-10 Bot, 11-20 Site, 21+ App
  { 
    id: 'soft_dating', name: 'Дейтинг Бот', type: UpgradeType.SOFTWARE, vertical: VerticalType.DATING, 
    baseCost: 10000, baseProfit: 5, level: 0, 
    description: 'Мамонты ищут любви.', 
    tierNames: ['Дейтинг Бот', 'Сайт Знакомств', 'Приложение для Встреч'] 
  },
  { 
    id: 'soft_escort', name: 'Эскорт Бот', type: UpgradeType.SOFTWARE, vertical: VerticalType.ESCORT, 
    baseCost: 50000, baseProfit: 20, level: 0, 
    description: 'Приватные услуги.', 
    tierNames: ['Эскорт Бот', 'Элитное Агентство', 'VIP Клуб App'] 
  },
  { 
    id: 'soft_shop', name: 'Трейд Бот', type: UpgradeType.SOFTWARE, vertical: VerticalType.SHOP, 
    baseCost: 200000, baseProfit: 60, level: 0, 
    description: 'Арбитраж товаров.', 
    tierNames: ['Товарный Бот', 'Даркнет Шоп', 'Маркетплейс'] 
  },
  { 
    id: 'soft_crypto', name: 'НФТ Бот', type: UpgradeType.SOFTWARE, vertical: VerticalType.TRADE, 
    baseCost: 1000000, baseProfit: 250, level: 0, 
    description: 'Скам картинки.', 
    tierNames: ['Минтер Бот', 'НФТ Коллекция', 'Своя Биржа'] 
  },

  // 3. TRAFFIC (Multipliers)
  { id: 'traf_spam', name: 'Спам', type: UpgradeType.TRAFFIC, vertical: VerticalType.TRAFFIC, baseCost: 2000, baseProfit: 0.05, level: 0, description: '+5% Доход' },
  { id: 'traf_tiktok', name: 'ТикТок', type: UpgradeType.TRAFFIC, vertical: VerticalType.TRAFFIC, baseCost: 10000, baseProfit: 0.15, level: 0, description: '+15% Доход' },
  { id: 'traf_google', name: 'Google Ads', type: UpgradeType.TRAFFIC, vertical: VerticalType.TRAFFIC, baseCost: 50000, baseProfit: 0.30, level: 0, description: '+30% Доход' },
  { id: 'traf_fb', name: 'Фейсбук', type: UpgradeType.TRAFFIC, vertical: VerticalType.TRAFFIC, baseCost: 150000, baseProfit: 0.50, level: 0, description: '+50% Доход' },
];

export const CAREER_LADDER: JobPosition[] = [
  { 
    id: 'job_start', title: 'Новорег', vertical: 'Дейтинг', 
    salaryPerClick: 1, passiveIncome: 0, requiredReputation: 0, costToPromote: 0, isManager: false, reqBusinessStage: BusinessStage.NONE 
  },
  { 
    id: 'job_worker', title: 'Воркер', vertical: 'Дейтинг', 
    salaryPerClick: 5, passiveIncome: 0, requiredReputation: 50, costToPromote: 100, isManager: false, reqBusinessStage: BusinessStage.NONE 
  },
  { 
    id: 'job_support', title: 'Саппорт', vertical: 'Офис', 
    salaryPerClick: 15, passiveIncome: 0, requiredReputation: 250, costToPromote: 1000, isManager: false, reqBusinessStage: BusinessStage.NONE 
  },
  { 
    id: 'job_cold', title: 'Холодка', vertical: 'Офис', 
    salaryPerClick: 35, passiveIncome: 0, requiredReputation: 1000, costToPromote: 5000, isManager: false, reqBusinessStage: BusinessStage.NONE 
  },
  { 
    id: 'job_closer', title: 'Клоузер', vertical: 'Офис', 
    salaryPerClick: 100, passiveIncome: 0, requiredReputation: 5000, costToPromote: 25000, isManager: false, reqBusinessStage: BusinessStage.NONE 
  },
  // MANAGEMENT - REQUIRES BUSINESS
  { 
    id: 'job_team_lead', title: 'Тим Лид', vertical: 'Менеджмент', 
    salaryPerClick: 300, passiveIncome: 200, requiredReputation: 20000, costToPromote: 100000, isManager: true, 
    reqBusinessStage: BusinessStage.REMOTE_TEAM // MUST HAVE TEAM
  },
  { 
    id: 'job_head', title: 'Босс Офиса', vertical: 'Менеджмент', 
    salaryPerClick: 800, passiveIncome: 1000, requiredReputation: 100000, costToPromote: 1000000, isManager: true, 
    reqBusinessStage: BusinessStage.OFFICE // MUST HAVE OFFICE
  },
  { 
    id: 'job_ceo', title: 'CEO', vertical: 'Владелец', 
    salaryPerClick: 3000, passiveIncome: 10000, requiredReputation: 500000, costToPromote: 15000000, isManager: true, 
    reqBusinessStage: BusinessStage.NETWORK // MUST HAVE NETWORK
  },
];
