// ==========================================
// SUPPORT CARDS — Attachable buffs per creature
// Max 3 per deck, max 1 per creature
// Locked before battle starts — cannot change mid-battle
// ==========================================

import { SupportCardDef } from '../../../shared/types.js';

export const SUPPORT_CARDS: SupportCardDef[] = [
  {
    id: 'bacteria_card',
    name: 'Bacteria Card',
    type: 'special',
    description: '+15% Attack. Every hit applies poison for 3 turns.',
    icon: '🦠',
    rarity: 'Rare',
    effects: [
      { type: 'attack_boost', value: 15 },
      { type: 'poison_on_hit', value: 8 },
    ],
  },
  {
    id: 'iron_bark',
    name: 'Iron Bark',
    type: 'buff',
    description: '+20% HP. Reflects 15% of damage taken back to attacker.',
    icon: '🌳',
    rarity: 'Rare',
    effects: [
      { type: 'hp_boost', value: 20 },
      { type: 'damage_reflect', value: 15 },
    ],
  },
  {
    id: 'adrenaline_vial',
    name: 'Adrenaline Vial',
    type: 'buff',
    description: '+25% Speed. Attacks land more frequently.',
    icon: '💉',
    rarity: 'Common',
    effects: [
      { type: 'speed_boost', value: 25 },
    ],
  },
  {
    id: 'soul_stone',
    name: 'Soul Stone',
    type: 'special',
    description: 'Grants 12% Lifesteal — heals on every attack.',
    icon: '💎',
    rarity: 'SuperRare',
    effects: [
      { type: 'lifesteal', value: 12 },
    ],
  },
  {
    id: 'venom_sac',
    name: 'Venom Sac',
    type: 'special',
    description: 'Passive poison aura — enemies take 10% attack damage per turn.',
    icon: '☠️',
    rarity: 'SuperRare',
    effects: [
      { type: 'poison_on_hit', value: 10 },
    ],
  },
  {
    id: 'frenzy_herb',
    name: 'Frenzy Herb',
    type: 'behavior',
    description: '+20% to highest-weight skill use chance. Cooldowns reduced by 1 turn.',
    icon: '🌿',
    rarity: 'Rare',
    effects: [
      { type: 'cooldown_reduce', value: 1 },
      { type: 'weight_shift', value: 10, skillIndex: 0 },
    ],
  },
  {
    id: 'war_paint',
    name: 'War Paint',
    type: 'buff',
    description: '+30% Attack. The warrior\'s spirit burns bright.',
    icon: '🎨',
    rarity: 'SuperRare',
    effects: [
      { type: 'attack_boost', value: 30 },
    ],
  },
  {
    id: 'ancient_rune',
    name: 'Ancient Rune',
    type: 'buff',
    description: '+30% HP and +10% Attack. Inscribed with primal power.',
    icon: '🔮',
    rarity: 'Epic',
    effects: [
      { type: 'hp_boost', value: 30 },
      { type: 'attack_boost', value: 10 },
    ],
  },
];

export function getSupportCardDef(id: string): SupportCardDef | undefined {
  return SUPPORT_CARDS.find(c => c.id === id);
}

export function getAllSupportCards(): SupportCardDef[] {
  return SUPPORT_CARDS;
}
