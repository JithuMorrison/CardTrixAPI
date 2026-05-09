import { PlayerProfile, Rarity } from '../../../shared/types.js';
import { CREATURES } from '../data/creatures.js';
import { SUPPORT_CARDS } from '../data/supportCards.js';
import { SKILLS } from '../data/skills.js';
import { TALENTS } from '../data/talents.js';
import { EXCLUSIVE_IDS } from '../engine/progression.js';

interface BoxRewardItem {
  defId: string;
  type: string;
  name: string;
  icon: string;
  rarity: Rarity;
  isDuplicate: boolean;
  fragmentsGiven: number;
}

export interface BoxResult {
  items: BoxRewardItem[];
  bonusCoins: number;
  bonusPowerPoints: number;
}

const BASE_RATES: Record<Rarity, number> = {
  Common: 50.0, Rare: 25.0, SuperRare: 12.0, Epic: 7.0,
  Mythic: 3.5, Legendary: 1.5, UltraLegendary: 0.8, Heroic: 0.2,
};

interface BoxConfig {
  minRarity: Rarity;
  multiplier: number;
  cost: number;
  coinRange: [number, number];
  powerPointRange: [number, number];
  supportOnly: boolean;
}

const BOX_MODIFIERS: Record<string, BoxConfig> = {
  'rare':      { minRarity: 'Rare',      multiplier: 1.5, cost: 100, coinRange: [20, 60],   powerPointRange: [10, 30],  supportOnly: false },
  'epic':      { minRarity: 'Epic',      multiplier: 2.0, cost: 300, coinRange: [50, 150],  powerPointRange: [30, 80],  supportOnly: false },
  'legendary': { minRarity: 'Legendary', multiplier: 3.0, cost: 500, coinRange: [100, 300], powerPointRange: [60, 150], supportOnly: false },
  'support':   { minRarity: 'Rare',      multiplier: 1.5, cost: 400, coinRange: [30, 80],   powerPointRange: [15, 40],  supportOnly: true },
};

const PITY_INCREMENTS: Record<string, number> = {
  Mythic: 0.1, Legendary: 0.2, UltraLegendary: 0.3, Heroic: 0.05,
};

const RARITY_ORDER: Rarity[] = ['Common', 'Rare', 'SuperRare', 'Epic', 'Mythic', 'Legendary', 'UltraLegendary', 'Heroic'];

export class GachaSystem {
  static openLootBox(player: PlayerProfile, boxType: string): BoxResult {
    console.log(`[Gacha] Opening ${boxType} for ${player.id} (${player.name})`);
    const modifier = BOX_MODIFIERS[boxType] || BOX_MODIFIERS['rare'];

    if (player.essence < modifier.cost) throw new Error('Insufficient Essence');

    player.essence -= modifier.cost;
    player.lootBoxStats.boxesOpened++;

    // --- Roll main item ---
    const mainItem = this.rollItem(player, modifier);

    // --- Bonus coins ---
    const [minC, maxC] = modifier.coinRange;
    const bonusCoins = Math.floor(minC + Math.random() * (maxC - minC));
    player.coins = (player.coins || 0) + bonusCoins;

    // --- Bonus power points ---
    const [minP, maxP] = modifier.powerPointRange;
    const bonusPowerPoints = Math.floor(minP + Math.random() * (maxP - minP));
    player.powerPoints = (player.powerPoints || 0) + bonusPowerPoints;

    console.log(`[Gacha] Result: ${mainItem.name} | +${bonusCoins} coins | +${bonusPowerPoints} PP`);
    return { items: [mainItem], bonusCoins, bonusPowerPoints };
  }

  private static rollItem(player: PlayerProfile, modifier: BoxConfig): BoxRewardItem {
    let adjustedRates = { ...BASE_RATES };

    for (const r of RARITY_ORDER) {
      if (PITY_INCREMENTS[r] !== undefined) {
        const pity = player.lootBoxStats.pityCounters[r] || 0;
        adjustedRates[r] = (BASE_RATES[r] + pity * PITY_INCREMENTS[r]) * modifier.multiplier;
      }
    }

    const minIndex = RARITY_ORDER.indexOf(modifier.minRarity);
    for (let i = 0; i < minIndex; i++) adjustedRates[RARITY_ORDER[i]] = 0;

    const totalWeight = Object.values(adjustedRates).reduce((s, r) => s + r, 0);
    let roll = Math.random() * totalWeight;
    let selectedRarity: Rarity = RARITY_ORDER[minIndex];

    for (const r of RARITY_ORDER) {
      if (adjustedRates[r] > 0) {
        if (roll <= adjustedRates[r]) { selectedRarity = r; break; }
        roll -= adjustedRates[r];
      }
    }

    for (const r of ['Mythic', 'Legendary', 'UltraLegendary', 'Heroic']) {
      if (r === selectedRarity) player.lootBoxStats.pityCounters[r] = 0;
      else player.lootBoxStats.pityCounters[r] = (player.lootBoxStats.pityCounters[r] || 0) + 1;
    }

    // Build item pool — support box gets ONLY support cards; normal boxes EXCLUDE support cards
    let pool: { id: string; name: string; icon: string; itemType: 'creature' | 'support' | 'skill' | 'talent' | 'resource' }[];

    if (modifier.supportOnly) {
      // Support box — only support cards
      pool = SUPPORT_CARDS
        .filter(c => c.rarity === selectedRarity && !EXCLUSIVE_IDS.includes(c.id))
        .map(c => ({ id: c.id, name: c.name, icon: c.icon, itemType: 'support' as const }));
    } else {
      // Normal boxes — NO support cards
      pool = [
        ...CREATURES.filter(c => c.rarity === selectedRarity && !EXCLUSIVE_IDS.includes(c.id)).map(c => ({ id: c.id, name: c.name, icon: c.emoji, itemType: 'creature' as const })),
        ...SKILLS.filter(s => s.rarity === selectedRarity && !EXCLUSIVE_IDS.includes(s.id)).map(s => ({ id: s.id, name: s.name, icon: s.icon, itemType: 'skill' as const })),
        ...TALENTS.filter(t => t.rarity === selectedRarity && !EXCLUSIVE_IDS.includes(t.id)).map(t => ({ id: t.id, name: t.name, icon: t.icon, itemType: 'talent' as const })),
      ];
    }

    const item = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)]
      : { id: 'tokens', name: 'Essence Tokens', icon: '🪙', itemType: 'resource' as const };

    let isDuplicate = false;
    let fragmentsGiven = 0;
    const rarityMultiplier = RARITY_ORDER.indexOf(selectedRarity) + 1;

    if (item.itemType === 'creature') {
      if (player.unlockedCreatures.includes(item.id)) {
        isDuplicate = true;
        fragmentsGiven = 10 * rarityMultiplier;
        player.shards = player.shards || {};
        player.shards[item.id] = (player.shards[item.id] || 0) + fragmentsGiven;
      } else {
        player.unlockedCreatures.push(item.id);
        const creatureDef = CREATURES.find(c => c.id === item.id);
        if (creatureDef) {
          player.unlockedSkills = player.unlockedSkills || [];
          creatureDef.skillIds.forEach(sid => {
            if (!player.unlockedSkills.includes(sid)) {
              player.unlockedSkills.push(sid);
            }
          });
        }
      }
    } else if (item.itemType === 'support') {
      if ((player.unlockedSupportCards || []).includes(item.id)) {
        isDuplicate = true; fragmentsGiven = 5 * rarityMultiplier;
      } else {
        player.unlockedSupportCards = player.unlockedSupportCards || [];
        player.unlockedSupportCards.push(item.id);
      }
    } else if (item.itemType === 'skill') {
      player.unlockedSkills = player.unlockedSkills || [];
      if (player.unlockedSkills.includes(item.id)) {
        isDuplicate = true; fragmentsGiven = 5 * rarityMultiplier;
      } else {
        player.unlockedSkills.push(item.id);
      }
    } else if (item.itemType === 'talent') {
      player.unlockedTalents = player.unlockedTalents || [];
      if (player.unlockedTalents.includes(item.id)) {
        isDuplicate = true; fragmentsGiven = 8 * rarityMultiplier;
      } else {
        player.unlockedTalents.push(item.id);
      }
    } else if (item.itemType === 'resource') {
      const amount = 50 * rarityMultiplier;
      player.essence += amount;
    }

    return { defId: item.id, type: item.itemType, name: item.name, icon: item.icon, rarity: selectedRarity, isDuplicate, fragmentsGiven };
  }
}
