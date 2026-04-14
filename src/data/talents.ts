// ==========================================
// TALENT DEFINITIONS — Per PRD Categories
// Max 2 per creature, hidden from opponent
// ==========================================

import { TalentDef } from '../../../shared/types.js';

export const TALENTS: TalentDef[] = [
  // ---- Turn Priority ----
  {
    id: 'first_strike',
    name: 'First Strike',
    description: 'Always attacks first, regardless of Speed. Ignores opponent\'s First Strike.',
    effect: { type: 'first_strike', value: 1 },
    icon: '⚡',
    rarity: 'Rare',
  },

  // ---- Stat Modifiers ----
  {
    id: 'iron_will',
    name: 'Iron Will',
    description: 'Max HP increased by 25%.',
    effect: { type: 'stat_boost', stat: 'hp', value: 25 },
    icon: '❤️',
    rarity: 'Common',
  },
  {
    id: 'power_surge',
    name: 'Power Surge',
    description: 'Attack increased by 30%.',
    effect: { type: 'stat_boost', stat: 'attack', value: 30 },
    icon: '💪',
    rarity: 'Rare',
  },
  {
    id: 'swift_strikes',
    name: 'Swift Strikes',
    description: 'Speed increased by 25% (attacks more frequently).',
    effect: { type: 'stat_boost', stat: 'speed', value: 25 },
    icon: '🏃',
    rarity: 'Rare',
  },

  // ---- Reactive Talents ----
  {
    id: 'thorned_skin',
    name: 'Thorned Skin',
    description: 'Reflects 20% of damage taken back to attacker.',
    effect: { type: 'on_hit_shield', value: 20 },
    icon: '🌵',
    rarity: 'SuperRare',
  },
  {
    id: 'vampiric',
    name: 'Vampiric',
    description: 'Heals for 15% of all damage dealt.',
    effect: { type: 'lifesteal', value: 15 },
    icon: '🧛',
    rarity: 'SuperRare',
  },
  {
    id: 'resilience',
    name: 'Resilience',
    description: 'Heals for 10% of each hit taken (pain into strength).',
    effect: { type: 'on_hit_heal', value: 10 },
    icon: '💚',
    rarity: 'Rare',
  },

  // ---- Trigger Talents ----
  {
    id: 'berserker',
    name: 'Berserker',
    description: 'Attack increases by 50% when HP drops below 30%.',
    effect: { type: 'berserker_attack', value: 50 },
    icon: '🔥',
    rarity: 'SuperRare',
  },
  {
    id: 'death_burst',
    name: 'Death Burst',
    description: 'Upon death, deals 80% of max HP as final damage.',
    effect: { type: 'on_death_burst', value: 80 },
    icon: '💀',
    rarity: 'Epic',
  },
  {
    id: 'venom',
    name: 'Venomous',
    description: 'Every hit applies poison, dealing 8% of attacker\'s attack per turn for 3 turns.',
    effect: { type: 'poison_on_hit', value: 8 },
    icon: '☠️',
    rarity: 'SuperRare',
  },

  // ---- Passive Talents ----
  {
    id: 'regeneration',
    name: 'Regeneration',
    description: 'Passively heals 3% max HP each turn.',
    effect: { type: 'passive_regen', value: 3 },
    icon: '🌿',
    rarity: 'Common',
  },
  {
    id: 'iron_hide',
    name: 'Iron Hide',
    description: 'All incoming damage reduced by 20%.',
    effect: { type: 'damage_reduction', value: 20 },
    icon: '🛡️',
    rarity: 'Common',
  },
];

export function getTalentDef(id: string): TalentDef | undefined {
  return TALENTS.find(t => t.id === id);
}

export function getAllTalents(): TalentDef[] {
  return TALENTS;
}
