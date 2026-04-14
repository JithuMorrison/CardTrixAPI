import { PlayerProfile, Rarity } from '../../../shared/types.js';
import { CREATURES } from '../data/creatures.js';
import { SUPPORT_CARDS } from '../data/supportCards.js';
import { SKILLS } from '../data/skills.js';
import { TALENTS } from '../data/talents.js';

interface BoxReward {
  defId: string;
  type: string;
  name: string;
  icon: string;
  rarity: Rarity;
  isDuplicate: boolean;
  fragmentsGiven: number;
}

const BASE_RATES: Record<Rarity, number> = {
  Common: 50.0, Rare: 25.0, SuperRare: 12.0, Epic: 7.0,
  Mythic: 3.5, Legendary: 1.5, UltraLegendary: 0.8, Heroic: 0.2,
};

const BOX_MODIFIERS: Record<string, { minRarity: Rarity; multiplier: number; cost: number }> = {
  'basic':     { minRarity: 'Common',  multiplier: 1.0, cost: 0 },
  'rare':      { minRarity: 'Rare',    multiplier: 1.5, cost: 100 },
  'epic':      { minRarity: 'Epic',    multiplier: 2.0, cost: 300 },
  'legendary': { minRarity: 'Legendary', multiplier: 3.0, cost: 500 },
};

const PITY_INCREMENTS: Record<string, number> = {
  Mythic: 0.1, Legendary: 0.2, UltraLegendary: 0.3, Heroic: 0.05,
};

const RARITY_ORDER: Rarity[] = ['Common', 'Rare', 'SuperRare', 'Epic', 'Mythic', 'Legendary', 'UltraLegendary', 'Heroic'];

export class GachaSystem {
  static openLootBox(player: PlayerProfile, boxType: string): BoxReward {
    const modifier = BOX_MODIFIERS[boxType] || BOX_MODIFIERS['basic'];

    if (player.essence < modifier.cost) throw new Error('Insufficient Essence');

    player.essence -= modifier.cost;
    player.lootBoxStats.boxesOpened++;

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

    const pool = [
      ...CREATURES.filter(c => c.rarity === selectedRarity).map(c => ({ id: c.id, name: c.name, icon: c.emoji, itemType: 'creature' as const })),
      ...SUPPORT_CARDS.filter(c => c.rarity === selectedRarity).map(c => ({ id: c.id, name: c.name, icon: c.icon, itemType: 'support' as const })),
      ...SKILLS.filter(s => s.rarity === selectedRarity).map(s => ({ id: s.id, name: s.name, icon: s.icon, itemType: 'skill' as const })),
      ...TALENTS.filter(t => t.rarity === selectedRarity).map(t => ({ id: t.id, name: t.name, icon: t.icon, itemType: 'talent' as const })),
    ];

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
      }
    } else if (item.itemType === 'support') {
      if ((player.unlockedSupportCards || []).includes(item.id)) {
        isDuplicate = true; fragmentsGiven = 5 * rarityMultiplier;
      } else {
        player.unlockedSupportCards = player.unlockedSupportCards || [];
        player.unlockedSupportCards.push(item.id);
      }
    } else if (item.itemType === 'skill') {
      if (player.unlockedSkills.includes(item.id)) {
        isDuplicate = true; fragmentsGiven = 5 * rarityMultiplier;
      } else {
        player.unlockedSkills.push(item.id);
      }
    } else if (item.itemType === 'talent') {
      if (player.unlockedTalents.includes(item.id)) {
        isDuplicate = true; fragmentsGiven = 8 * rarityMultiplier;
      } else {
        player.unlockedTalents.push(item.id);
      }
    }

    return { defId: item.id, type: item.itemType, name: item.name, icon: item.icon, rarity: selectedRarity, isDuplicate, fragmentsGiven };
  }
}
