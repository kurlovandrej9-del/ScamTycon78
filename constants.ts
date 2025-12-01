
import { UpgradeItem, JobPosition, VerticalType, UpgradeType, PropertyItem, GameEvent, BusinessStage, LaunderingItem, TeamStrategy, AssetItem, AssetType, SchemeItem, SchemeCategory } from './types';

// --- GAME COST CONSTANTS (UAH) ---
export const CREATE_TEAM_COST = 50000; 
export const SKIP_TO_OFFICE_COST = 2000000; 
export const CONVERT_TO_OFFICE_COST = 1000000; 
export const OPEN_NEW_BRANCH_COST = 25000000; 
export const WORKER_HIRE_COST_BASE = 1500; 
export const BASE_BANK_LIMIT = 100000; 

// --- CHARACTER STAGES (IMAGES) ---
export const CHARACTER_STAGES = [
  'https://cdn-icons-png.flaticon.com/512/4140/4140048.png', // Stage 1: Новичок (Бедный студент)
  'https://cdn-icons-png.flaticon.com/512/4140/4140047.png', // Stage 2: Воркер
  'https://cdn-icons-png.flaticon.com/512/4140/4140037.png', // Stage 3: Саппорт
  'https://cdn-icons-png.flaticon.com/512/4140/4140051.png', // Stage 4: Холодка
  'https://cdn-icons-png.flaticon.com/512/4139/4139981.png', // Stage 5: Клоузер
  'https://cdn-icons-png.flaticon.com/512/4140/4140061.png', // Stage 6: Тим Лид
  'https://cdn-icons-png.flaticon.com/512/4140/4140076.png', // Stage 7: Босс Офиса
  'https://cdn-icons-png.flaticon.com/512/4140/4140052.png', // Stage 8: CEO
  'https://cdn-icons-png.flaticon.com/512/4140/4140066.png', // Stage 9: Rich (1M+)
  'https://cdn-icons-png.flaticon.com/512/4140/4140074.png', // Stage 10: Very Rich (10M+)
  'https://cdn-icons-png.flaticon.com/512/4140/4140057.png', // Stage 11: Ultra Rich (100M+)
];

export const OFFICE_CAPACITY = [
  { level: 1, name: 'Чат в Telegram', maxWorkers: 5, cost: 0 },
  { level: 2, name: 'Коворкинг', maxWorkers: 15, cost: 250000 }, 
  { level: 3, name: 'Офис B-класс', maxWorkers: 40, cost: 1500000 }, 
  { level: 4, name: 'Офис A-класс', maxWorkers: 100, cost: 10000000 }, 
  { level: 5, name: 'Башня Москва-Сити', maxWorkers: 500, cost: 100000000 }, 
];

export const TEAM_STRATEGIES = {
  [TeamStrategy.SAFE]: { 
    name: 'Дейтинг (Safe)', 
    desc: 'Низкий риск, стабильный доход.', 
    multiplier: 0.8, 
    risk: 1,
    color: 'text-green-500'
  },
  [TeamStrategy.BALANCED]: { 
    name: 'Товарка (Mid)', 
    desc: 'Средний риск, нормальный профит.', 
    multiplier: 1.2, 
    risk: 3,
    color: 'text-blue-500'
  },
  [TeamStrategy.AGGRESSIVE]: { 
    name: 'Гемблинг (High)', 
    desc: 'Высокий риск, бешеный профит.', 
    multiplier: 1.8, 
    risk: 8,
    color: 'text-red-500'
  }
};

// --- SCHEMES LIST (TEMKI) ---
export const SCHEMES_LIST: SchemeItem[] = [
  // --- GREY SCHEMES (Online Scam/Abuse) ---
  {
    id: 'scheme_refund', name: 'Рефанд ASOS', category: SchemeCategory.GREY,
    cost: 5000, durationSeconds: 30, riskPercentage: 10, minProfit: 8000, maxProfit: 15000,
    description: 'Вернуть шмот и деньги.', icon: '📦'
  },
  {
    id: 'scheme_p2p', name: 'P2P Треугольник', category: SchemeCategory.GREY,
    cost: 20000, durationSeconds: 60, riskPercentage: 20, minProfit: 25000, maxProfit: 45000,
    description: 'Крутим бинанс.', icon: '📐'
  },
  {
    id: 'scheme_logs', name: 'Отработка Логов', category: SchemeCategory.GREY,
    cost: 50000, durationSeconds: 120, riskPercentage: 30, minProfit: 60000, maxProfit: 200000,
    description: 'Ищем криптокошельки.', icon: '🍪'
  },
  {
    id: 'scheme_retro', name: 'Абуз Ретродропа', category: SchemeCategory.GREY,
    cost: 150000, durationSeconds: 300, riskPercentage: 40, minProfit: 200000, maxProfit: 1000000,
    description: 'Мультиаккинг L0/ZkSync.', icon: '🪂'
  },

  // --- BLACK SCHEMES (Drug/Guns Trade) ---
  {
    id: 'black_weed', name: 'Закуп: Шишки (1кг)', category: SchemeCategory.BLACK,
    cost: 100000, durationSeconds: 180, riskPercentage: 15, minProfit: 150000, maxProfit: 250000,
    description: 'Купил оптом, продал в розницу.', icon: '🌿'
  },
  {
    id: 'black_pills', name: 'Закуп: Колеса', category: SchemeCategory.BLACK,
    cost: 500000, durationSeconds: 400, riskPercentage: 25, minProfit: 750000, maxProfit: 1500000,
    description: 'Для рейвов и тусовок.', icon: '💊'
  },
  {
    id: 'black_snow', name: 'Закуп: Снег (Колумбия)', category: SchemeCategory.BLACK,
    cost: 2000000, durationSeconds: 600, riskPercentage: 35, minProfit: 3000000, maxProfit: 8000000,
    description: 'Элитный товар для депутатов.', icon: '❄️'
  },
  {
    id: 'black_glock', name: 'Партия Glock-17', category: SchemeCategory.BLACK,
    cost: 5000000, durationSeconds: 900, riskPercentage: 30, minProfit: 7000000, maxProfit: 15000000,
    description: 'Австрийское качество. Спиленные номера.', icon: '🔫'
  },
  {
    id: 'black_ak', name: 'Партия AK-47', category: SchemeCategory.BLACK,
    cost: 15000000, durationSeconds: 1800, riskPercentage: 45, minProfit: 25000000, maxProfit: 60000000,
    description: 'Классика для локальных конфликтов.', icon: '💀'
  },
  {
    id: 'black_transit', name: 'Транзит Груза', category: SchemeCategory.BLACK,
    cost: 50000000, durationSeconds: 3600, riskPercentage: 50, minProfit: 100000000, maxProfit: 300000000,
    description: 'Перевозка через границу. Максимальный риск.', icon: '🚚'
  },
];

// --- TRADING ASSETS ---
export const ASSETS: AssetItem[] = [
  {
    id: 'btc', symbol: 'BTC', name: 'Биткоин', type: AssetType.CRYPTO,
    basePrice: 65000, volatility: 0.08, icon: '₿'
  },
  {
    id: 'eth', symbol: 'ETH', name: 'Эфириум', type: AssetType.CRYPTO,
    basePrice: 3500, volatility: 0.06, icon: 'Ξ'
  },
  {
    id: 'scam', symbol: 'SCAM', name: 'СкамКоин', type: AssetType.CRYPTO,
    basePrice: 0.5, volatility: 0.25, icon: '🤡' 
  },
  {
    id: 'tsla', symbol: 'TSLA', name: 'Тесла Акции', type: AssetType.STOCK,
    basePrice: 200, volatility: 0.03, icon: '🚗'
  },
  {
    id: 'gold', symbol: 'XAU', name: 'Золото', type: AssetType.RESOURCE,
    basePrice: 2000, volatility: 0.01, icon: '🥇' 
  }
];

// LAUNDERING (ОБМЫВ СРЕДСТВ)
export const LAUNDERING_ITEMS: LaunderingItem[] = [
  { 
    id: 'laund_fop', name: 'ФОП 3-группа', 
    baseCost: 15000, baseLimit: 75000, baseIncome: 15, 
    description: '+75к Лимит', reqBusinessStage: BusinessStage.NONE, icon: '📄' 
  },
  { 
    id: 'laund_crypto', name: 'P2P Обменник', 
    baseCost: 150000, baseLimit: 250000, baseIncome: 150, 
    description: '+250к Лимит', reqBusinessStage: BusinessStage.NONE, icon: '💻' 
  },
  { 
    id: 'laund_shawarma', name: 'Шаурма у Ашота', 
    baseCost: 750000, baseLimit: 1000000, baseIncome: 800, 
    description: '+1М Лимит', reqBusinessStage: BusinessStage.REMOTE_TEAM, icon: '🌯' 
  },
  { 
    id: 'laund_carwash', name: 'Автомойка', 
    baseCost: 3500000, baseLimit: 5000000, baseIncome: 2500, 
    description: '+5М Лимит', reqBusinessStage: BusinessStage.OFFICE, icon: '🚗' 
  },
  { 
    id: 'laund_rest', name: 'Ресторан "Мафия"', 
    baseCost: 15000000, baseLimit: 20000000, baseIncome: 12000, 
    description: '+20М Лимит', reqBusinessStage: BusinessStage.OFFICE, icon: '🍝' 
  },
  { 
    id: 'laund_const', name: 'Застройщик', 
    baseCost: 100000000, baseLimit: 150000000, baseIncome: 50000, 
    description: '+150М Лимит', reqBusinessStage: BusinessStage.NETWORK, icon: '🏗️' 
  },
];

// LIFESTYLE
export const PROPERTIES: PropertyItem[] = [
  { id: 'prop_coffee', name: 'Кофе', baseCost: 750, reputationBonus: 0.1, description: '+0.1 Реп', image: '☕' },
  { id: 'prop_gucci', name: 'Gucci Шмот', baseCost: 5000, reputationBonus: 0.5, description: '+0.5 Реп', image: 'gucci' },
  { id: 'prop_sneakers', name: 'Кроссовки', baseCost: 15000, reputationBonus: 1, description: '+1 Реп', image: '👟' },
  { id: 'prop_iphone', name: 'Айфон', baseCost: 50000, reputationBonus: 3, description: '+3 Реп', image: '📱' },
  { id: 'prop_macbook', name: 'Макбук', baseCost: 250000, reputationBonus: 8, description: '+8 Реп', image: '💻' },
  { id: 'prop_rolex', name: 'Ролекс', baseCost: 1000000, reputationBonus: 20, description: '+20 Реп', image: '⌚' },
  { id: 'prop_tesla', name: 'Тесла', baseCost: 5000000, reputationBonus: 50, description: '+50 Реп', image: 'tesla' },
  { id: 'prop_bmw', name: 'BMW M5', baseCost: 15000000, reputationBonus: 120, description: '+120 Реп', image: '🏎️' },
  { id: 'prop_heli', name: 'Вертолет', baseCost: 50000000, reputationBonus: 300, description: '+300 Реп', image: '🚁' },
  { id: 'prop_apt', name: 'Пентхаус', baseCost: 150000000, reputationBonus: 800, description: '+800 Реп', image: '🏢' },
  { id: 'prop_yacht', name: 'Яхта', baseCost: 500000000, reputationBonus: 2000, description: '+2K Реп', image: '🛥️' },
  { id: 'prop_villa', name: 'Вилла', baseCost: 1500000000, reputationBonus: 5000, description: '+5K Реп', image: '🌴' },
  { id: 'prop_island', name: 'Остров', baseCost: 10000000000, reputationBonus: 15000, description: '+15K Реп', image: '🏝️' },
  { id: 'prop_club', name: 'Футб. Клуб', baseCost: 50000000000, reputationBonus: 50000, description: '+50K Реп', image: '⚽' },
];

// RANDOM EVENTS
export const RANDOM_EVENTS: GameEvent[] = [
  { id: 'ev_block', title: 'Блок Карты', message: 'Финмон заморозил счет.', type: 'BAD', effectValue: -0.05 },
  { id: 'ev_raid', title: 'Проверка', message: 'Налоговая на пороге.', type: 'BAD', effectValue: -0.15 },
  { id: 'ev_whale', title: 'Мамонт', message: 'Жирный депозит!', type: 'GOOD', effectValue: 1500 }, 
  { id: 'ev_pump', title: 'Памп', message: 'Крипта выросла.', type: 'GOOD', effectValue: 5000 }, 
];

// MARKET ITEMS
export const MARKET_ITEMS: UpgradeItem[] = [
  // --- 1. RENTAL TOOLS (Active Click Boost) ---
  { id: 'tool_proxy', name: 'Прокси', type: UpgradeType.RENTAL, vertical: VerticalType.TRAFFIC, baseCost: 250, baseProfit: 1, level: 0, description: '+1 Тап' },
  { id: 'tool_vpn', name: 'VPN Сервис', type: UpgradeType.RENTAL, vertical: VerticalType.TRAFFIC, baseCost: 800, baseProfit: 1.5, level: 0, description: '+1.5 Тап' },
  { id: 'tool_spam_soft', name: 'Спамер', type: UpgradeType.RENTAL, vertical: VerticalType.DATING, baseCost: 1500, baseProfit: 2, level: 0, description: '+2 Тап' },
  { id: 'tool_sms', name: 'SMS Бот', type: UpgradeType.RENTAL, vertical: VerticalType.TRAFFIC, baseCost: 5000, baseProfit: 5, level: 0, description: '+5 Тап' },
  { id: 'tool_parser', name: 'Парсер', type: UpgradeType.RENTAL, vertical: VerticalType.TRAFFIC, baseCost: 25000, baseProfit: 12, level: 0, description: '+12 Тап' },
  { id: 'tool_checker', name: 'Чекер Баз', type: UpgradeType.RENTAL, vertical: VerticalType.TRAFFIC, baseCost: 60000, baseProfit: 20, level: 0, description: '+20 Тап' },
  { id: 'tool_cloaka', name: 'Клоака', type: UpgradeType.RENTAL, vertical: VerticalType.TRADE, baseCost: 100000, baseProfit: 30, level: 0, description: '+30 Тап' },
  { id: 'tool_bomber', name: 'SMS Бомбер', type: UpgradeType.RENTAL, vertical: VerticalType.DARK, baseCost: 250000, baseProfit: 50, level: 0, description: '+50 Тап' },
  { id: 'tool_ddos', name: 'DDoS Панель', type: UpgradeType.RENTAL, vertical: VerticalType.DARK, baseCost: 1000000, baseProfit: 150, level: 0, description: '+150 Тап' },

  // --- 2. SOFTWARE EVOLUTION (Passive Base per Worker) ---
  // Dating Vertical
  { 
    id: 'soft_dating', name: 'Дейтинг Бот', type: UpgradeType.SOFTWARE, vertical: VerticalType.DATING, 
    baseCost: 15000, baseProfit: 0.5, level: 0, 
    description: 'Мамонты ищут любви.', 
    tierNames: ['Дейтинг Бот', 'Сайт Знакомств', 'Приложение для Встреч'] 
  },
  // Escort Vertical
  { 
    id: 'soft_escort', name: 'Эскорт Бот', type: UpgradeType.SOFTWARE, vertical: VerticalType.ESCORT, 
    baseCost: 75000, baseProfit: 2, level: 0, 
    description: 'Приватные услуги.', 
    tierNames: ['Эскорт Бот', 'Элитное Агентство', 'VIP Клуб App'] 
  },
  // Shop Vertical
  { 
    id: 'soft_shop', name: 'Трейд Бот', type: UpgradeType.SOFTWARE, vertical: VerticalType.SHOP, 
    baseCost: 350000, baseProfit: 8, level: 0, 
    description: 'Арбитраж товаров.', 
    tierNames: ['Товарный Бот', 'Даркнет Шоп', 'Маркетплейс'] 
  },
  // Crypto/NFT Vertical
  { 
    id: 'soft_crypto', name: 'НФТ Бот', type: UpgradeType.SOFTWARE, vertical: VerticalType.TRADE, 
    baseCost: 2000000, baseProfit: 25, level: 0, 
    description: 'Скам картинки.', 
    tierNames: ['Минтер Бот', 'НФТ Коллекция', 'Своя Биржа'] 
  },
  // New Softs (Scam Specific)
  { 
    id: 'soft_casino', name: 'Фейк Казино', type: UpgradeType.SOFTWARE, vertical: VerticalType.TRADE, 
    baseCost: 5000000, baseProfit: 50, level: 0, 
    description: 'Подкрученный RTP.', 
    tierNames: ['Telegram Казино', 'Крипто Рулетка', 'Глобал Беттинг'] 
  },
  { 
    id: 'soft_drainer', name: 'Wallet Drainer', type: UpgradeType.SOFTWARE, vertical: VerticalType.TRADE, 
    baseCost: 15000000, baseProfit: 120, level: 0, 
    description: 'Очистка кошельков.', 
    tierNames: ['Скрипт Дрейнера', 'Фишинг Сеть', 'Смарт Контракт'] 
  },
  { 
    id: 'soft_stealer', name: 'Стиллер', type: UpgradeType.SOFTWARE, vertical: VerticalType.TRADE, 
    baseCost: 40000000, baseProfit: 250, level: 0, 
    description: 'Сбор паролей.', 
    tierNames: ['Билд Стиллера', 'Ботнет', 'Приватный Эксплойт'] 
  },

  // --- 3. TRAFFIC (Multipliers) ---
  { id: 'traf_spam', name: 'Спам', type: UpgradeType.TRAFFIC, vertical: VerticalType.TRAFFIC, baseCost: 5000, baseProfit: 0.02, level: 0, description: '+2% Доход' },
  { id: 'traf_tiktok', name: 'ТикТок', type: UpgradeType.TRAFFIC, vertical: VerticalType.TRAFFIC, baseCost: 25000, baseProfit: 0.05, level: 0, description: '+5% Доход' },
  { id: 'traf_push', name: 'Push Сетки', type: UpgradeType.TRAFFIC, vertical: VerticalType.TRAFFIC, baseCost: 80000, baseProfit: 0.08, level: 0, description: '+8% Доход' },
  { id: 'traf_google', name: 'Google Ads', type: UpgradeType.TRAFFIC, vertical: VerticalType.TRAFFIC, baseCost: 150000, baseProfit: 0.10, level: 0, description: '+10% Доход' },
  { id: 'traf_fb', name: 'Фейсбук', type: UpgradeType.TRAFFIC, vertical: VerticalType.TRAFFIC, baseCost: 1000000, baseProfit: 0.20, level: 0, description: '+20% Доход' },
  { id: 'traf_channels', name: 'Угон Каналов', type: UpgradeType.TRAFFIC, vertical: VerticalType.TRAFFIC, baseCost: 5000000, baseProfit: 0.35, level: 0, description: '+35% Доход' },
  { id: 'traf_influencers', name: 'Скупка Блогеров', type: UpgradeType.TRAFFIC, vertical: VerticalType.TRAFFIC, baseCost: 25000000, baseProfit: 0.60, level: 0, description: '+60% Доход' },

  // --- 4. BLACK MARKET (ЧЕРНУХА) - HIGH PROFIT, DARK THEME ---
  {
    id: 'dark_courier', name: 'Кладмены', type: UpgradeType.BLACK_MARKET, vertical: VerticalType.DARK,
    baseCost: 500000, baseProfit: 10, level: 0,
    description: 'Работа ногами.',
    tierNames: ['Кладмен', 'Склад', 'Региональный Склад']
  },
  {
    id: 'dark_grow', name: 'Гроубокс', type: UpgradeType.BLACK_MARKET, vertical: VerticalType.DARK,
    baseCost: 2500000, baseProfit: 40, level: 0,
    description: 'Агрономия на дому.',
    tierNames: ['Шкаф', 'Теплица', 'Плантация']
  },
  {
    id: 'dark_thugs', name: 'Спортики', type: UpgradeType.BLACK_MARKET, vertical: VerticalType.DARK,
    baseCost: 10000000, baseProfit: 100, level: 0,
    description: 'Решение вопросов.',
    tierNames: ['Быки', 'Коллекторы', 'ЧВК Группа']
  },
  {
    id: 'dark_lab', name: 'Хим. Лаба', type: UpgradeType.BLACK_MARKET, vertical: VerticalType.DARK,
    baseCost: 50000000, baseProfit: 400, level: 0,
    description: 'Синий лед.',
    tierNames: ['Трейлер', 'Подвал', 'Пром. Цех']
  },
  {
    id: 'dark_guns', name: 'Оружейка', type: UpgradeType.BLACK_MARKET, vertical: VerticalType.DARK,
    baseCost: 150000000, baseProfit: 1000, level: 0,
    description: 'Торговля металлом.',
    tierNames: ['Травматы', 'Калашниковы', 'РПГ']
  },
  {
    id: 'dark_hitman', name: 'Агентство', type: UpgradeType.BLACK_MARKET, vertical: VerticalType.DARK,
    baseCost: 1000000000, baseProfit: 5000, level: 0,
    description: 'Устранение конкурентов.',
    tierNames: ['Киллер', 'Снайпер', 'Элитный Отряд']
  }
];

export const CAREER_LADDER: JobPosition[] = [
  { 
    id: 'job_start', title: 'Новичок', vertical: 'Дейтинг', 
    salaryPerClick: 1, passiveIncome: 0, requiredReputation: 0, costToPromote: 0, isManager: false, reqBusinessStage: BusinessStage.NONE 
  },
  { 
    id: 'job_worker', title: 'Воркер', vertical: 'Дейтинг', 
    salaryPerClick: 2, passiveIncome: 0, requiredReputation: 50, costToPromote: 500, isManager: false, reqBusinessStage: BusinessStage.NONE 
  },
  { 
    id: 'job_support', title: 'Саппорт', vertical: 'Офис', 
    salaryPerClick: 5, passiveIncome: 0, requiredReputation: 300, costToPromote: 3000, isManager: false, reqBusinessStage: BusinessStage.NONE 
  },
  { 
    id: 'job_cold', title: 'Холодка', vertical: 'Офис', 
    salaryPerClick: 10, passiveIncome: 0, requiredReputation: 1000, costToPromote: 15000, isManager: false, reqBusinessStage: BusinessStage.NONE 
  },
  { 
    id: 'job_closer', title: 'Клоузер', vertical: 'Офис', 
    salaryPerClick: 25, passiveIncome: 0, requiredReputation: 5000, costToPromote: 75000, isManager: false, reqBusinessStage: BusinessStage.NONE 
  },
  { 
    id: 'job_team_lead', title: 'Тим Лид', vertical: 'Менеджмент', 
    salaryPerClick: 60, passiveIncome: 10, requiredReputation: 25000, costToPromote: 300000, isManager: true, 
    reqBusinessStage: BusinessStage.REMOTE_TEAM 
  },
  { 
    id: 'job_head', title: 'Босс Офиса', vertical: 'Менеджмент', 
    salaryPerClick: 150, passiveIncome: 50, requiredReputation: 150000, costToPromote: 2500000, isManager: true, 
    reqBusinessStage: BusinessStage.OFFICE 
  },
  { 
    id: 'job_ceo', title: 'CEO', vertical: 'Владелец', 
    salaryPerClick: 500, passiveIncome: 250, requiredReputation: 1000000, costToPromote: 50000000, isManager: true, 
    reqBusinessStage: BusinessStage.NETWORK 
  },
];
