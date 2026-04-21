// ==========================================
// SKILL DEFINITIONS — 3 skills per creature type
// ==========================================

import { SkillDef } from '../../../shared/types.js';

export const SKILLS: SkillDef[] = [
  // ======== WOLF SKILLS ========
  { id: 'wolf_fang',   name: 'Wolf Fang',    type: 'Earth',   effect: 'damage', power: 90,  cooldown: 0, defaultWeight: 50, description: 'A crushing bite that tears through flesh.', icon: '🐺', rarity: 'Common', allowedCreatureIds: ['wolf'] },
  { id: 'howl_rally',  name: 'Howl Rally',   type: 'Earth',   effect: 'buff',   power: 0,   cooldown: 3, defaultWeight: 30, buffType: 'attack', buffValue: 25, duration: 3, description: 'A war howl that surges attack power.', icon: '🔊', rarity: 'Rare', allowedCreatureIds: ['wolf'] },
  { id: 'pack_hunt',   name: 'Pack Hunt',    type: 'Earth',   effect: 'damage', power: 130, cooldown: 4, defaultWeight: 20, description: 'A coordinated lunge dealing heavy damage.', icon: '🐾', rarity: 'Rare', allowedCreatureIds: ['wolf'] },

  // ======== EAGLE SKILLS ========
  { id: 'talon_strike',  name: 'Talon Strike',  type: 'Air', effect: 'damage', power: 95,  cooldown: 0, defaultWeight: 50, description: 'Razor-sharp talons raking the enemy.', icon: '🦅', rarity: 'Common' },
  { id: 'wind_dive',     name: 'Wind Dive',     type: 'Air', effect: 'damage', power: 150, cooldown: 4, defaultWeight: 30, description: 'A devastating high-speed dive attack.', icon: '💨', rarity: 'Rare' },
  { id: 'sky_screech',   name: 'Sky Screech',   type: 'Air', effect: 'debuff', power: 20,  cooldown: 3, defaultWeight: 20, buffType: 'attack', buffValue: -20, duration: 2, description: 'A piercing screech that shatters focus, reducing enemy attack.', icon: '🔊', rarity: 'Rare' },

  // ======== CROCODILE SKILLS ========
  { id: 'death_roll',   name: 'Death Roll',   type: 'Water', effect: 'damage', power: 120, cooldown: 2, defaultWeight: 50, description: 'Seizes the enemy and rolls — bones crunch.', icon: '🐊', rarity: 'Common' },
  { id: 'armored_hide', name: 'Armored Hide', type: 'Water', effect: 'buff',   power: 0,   cooldown: 4, defaultWeight: 30, buffType: 'damage_reduction', buffValue: 35, duration: 3, description: 'Hardens scales, drastically reducing damage taken.', icon: '🛡️', rarity: 'Rare' },
  { id: 'swamp_drag',   name: 'Swamp Drag',   type: 'Water', effect: 'debuff', power: 40,  cooldown: 3, defaultWeight: 20, buffType: 'speed', buffValue: -30, duration: 2, description: 'Drags enemy into murky water, slowing their movements.', icon: '🌊', rarity: 'SuperRare' },

  // ======== TIGER SKILLS ========
  { id: 'tiger_slash',  name: 'Tiger Slash',  type: 'Earth', effect: 'damage', power: 110, cooldown: 0, defaultWeight: 50, description: 'A ferocious slashing blow from powerful claws.', icon: '🐯', rarity: 'Rare' },
  { id: 'pounce',       name: 'Pounce',       type: 'Earth', effect: 'damage', power: 160, cooldown: 3, defaultWeight: 30, description: 'Leaps with full weight onto the enemy — devastating.', icon: '⚡', rarity: 'Rare' },
  { id: 'roar',         name: 'Intimidating Roar', type: 'Earth', effect: 'debuff', power: 0, cooldown: 4, defaultWeight: 20, buffType: 'attack', buffValue: -30, duration: 3, description: 'A spine-chilling roar that crushes enemy morale.', icon: '😱', rarity: 'SuperRare' },

  // ======== SHARK SKILLS ========
  { id: 'jaw_crush',       name: 'Jaw Crush',       type: 'Water', effect: 'damage', power: 115, cooldown: 0, defaultWeight: 50, description: 'Clamps down with thousands of PSI of bite force.', icon: '🦈', rarity: 'Rare' },
  { id: 'feeding_frenzy',  name: 'Feeding Frenzy',  type: 'Water', effect: 'damage', power: 170, cooldown: 4, defaultWeight: 30, description: 'Enters a frenzied state of maximum aggression.', icon: '🩸', rarity: 'SuperRare' },
  { id: 'blood_sense',     name: 'Blood Sense',      type: 'Water', effect: 'buff',   power: 0,   cooldown: 3, defaultWeight: 20, buffType: 'attack', buffValue: 35, duration: 3, description: 'Detects a drop of blood — attack surges dramatically.', icon: '👁️', rarity: 'Rare' },

  // ======== FALCON SKILLS ========
  { id: 'stoop_dive',  name: 'Stoop Dive',  type: 'Air', effect: 'damage', power: 140, cooldown: 0, defaultWeight: 50, description: 'A 240mph dive — the fastest strike in nature.', icon: '🦆', rarity: 'Rare' },
  { id: 'gale_rush',   name: 'Gale Rush',   type: 'Air', effect: 'buff',   power: 0,   cooldown: 3, defaultWeight: 30, buffType: 'speed', buffValue: 30, duration: 3, description: 'Rides powerful thermals, massively boosting speed.', icon: '💨', rarity: 'SuperRare' },
  { id: 'aerial_spin', name: 'Aerial Spin', type: 'Air', effect: 'damage', power: 120, cooldown: 3, defaultWeight: 20, description: 'A spinning windmill strike with both wings and talons.', icon: '🌀', rarity: 'Rare' },

  // ======== BEAR SKILLS ========
  { id: 'bear_maul',       name: 'Bear Maul',       type: 'Earth', effect: 'damage', power: 140, cooldown: 1, defaultWeight: 50, description: 'A devastating mauling attack from massive claws.', icon: '🐻', rarity: 'SuperRare' },
  { id: 'iron_fur',        name: 'Iron Fur',         type: 'Earth', effect: 'shield', power: 200,  cooldown: 5, defaultWeight: 30, description: 'Muscles flex to near-iron density, absorbing damage.', icon: '🛡️', rarity: 'SuperRare' },
  { id: 'earthquake_stomp', name: 'Earthquake Stomp', type: 'Earth', effect: 'debuff', power: 60, cooldown: 4, defaultWeight: 20, buffType: 'speed', buffValue: -25, duration: 3, description: 'A ground-shaking stomp that destabilizes the opponent.', icon: '🌍', rarity: 'Epic' },

  // ======== ORCA SKILLS ========
  { id: 'tail_slam',    name: 'Tail Slam',    type: 'Water', effect: 'damage', power: 150, cooldown: 1, defaultWeight: 50, description: 'Brings its massive tail down with crushing force.', icon: '🐋', rarity: 'SuperRare' },
  { id: 'sonar_burst',  name: 'Sonar Burst',  type: 'Water', effect: 'debuff', power: 50,  cooldown: 3, defaultWeight: 30, buffType: 'attack', buffValue: -25, duration: 3, description: 'Disorienting sonar wave that disrupts combat effectiveness.', icon: '📡', rarity: 'SuperRare' },
  { id: 'breach',       name: 'Breach',       type: 'Water', effect: 'damage', power: 200, cooldown: 5, defaultWeight: 20, description: 'Launches itself from the water — crushing slam on landing.', icon: '💥', rarity: 'Epic' },

  // ======== THUNDERBIRD SKILLS ========
  { id: 'lightning_wing', name: 'Lightning Wing', type: 'Air', effect: 'damage', power: 145, cooldown: 1, defaultWeight: 50, description: 'Strikes with wings charged with raw lightning.', icon: '⚡', rarity: 'SuperRare' },
  { id: 'storm_shriek',   name: 'Storm Shriek',   type: 'Air', effect: 'debuff', power: 60,  cooldown: 3, defaultWeight: 30, buffType: 'attack', buffValue: -30, duration: 3, description: 'A thunderclap screech that disrupts enemy focus.', icon: '🌩️', rarity: 'SuperRare' },
  { id: 'thunder_dive',   name: 'Thunder Dive',   type: 'Air', effect: 'damage', power: 220, cooldown: 5, defaultWeight: 20, description: 'Wraps itself in lightning and plummets at full speed.', icon: '☄️', rarity: 'Epic' },

  // ======== NEMEAN LION SKILLS ========
  { id: 'nemean_claw',  name: 'Nemean Claw',  type: 'Earth', effect: 'damage', power: 165, cooldown: 1, defaultWeight: 50, description: 'Claws that cannot be stopped by any known weapon.', icon: '🦁', rarity: 'Epic' },
  { id: 'golden_mane',  name: 'Golden Mane',  type: 'Earth', effect: 'buff',   power: 0,   cooldown: 4, defaultWeight: 30, buffType: 'damage_reduction', buffValue: 45, duration: 4, description: 'The mythical golden pelt deflects blows with divine grace.', icon: '✨', rarity: 'Epic' },
  { id: 'pride_roar',   name: 'Pride Roar',   type: 'Earth', effect: 'debuff', power: 70,  cooldown: 5, defaultWeight: 20, buffType: 'attack', buffValue: -40, duration: 3, description: 'A roar that echoes divine power, crushing enemy will to fight.', icon: '👑', rarity: 'Mythic' },

  // ======== KRAKEN SKILLS ========
  { id: 'tentacle_slam', name: 'Tentacle Slam', type: 'Water', effect: 'damage', power: 160, cooldown: 1, defaultWeight: 50, description: 'Massive tentacles slam down with ocean-crushing force.', icon: '🦑', rarity: 'Epic' },
  { id: 'whirlpool_pull', name: 'Whirlpool Pull', type: 'Water', effect: 'debuff', power: 80, cooldown: 4, defaultWeight: 30, buffType: 'speed', buffValue: -50, duration: 3, description: 'Creates a vortex that drags enemies into its grasp.', icon: '🌀', rarity: 'Epic' },
  { id: 'ink_blind',    name: 'Ink Blind',    type: 'Water', effect: 'debuff', power: 40,  cooldown: 3, defaultWeight: 20, buffType: 'attack', buffValue: -45, duration: 2, description: 'Releases a blinding cloud of pitch-black ink.', icon: '🖤', rarity: 'SuperRare' },

  // ======== PHOENIX SKILLS ========
  { id: 'flame_dive',     name: 'Flame Dive',     type: 'Fire', effect: 'damage', power: 155, cooldown: 1, defaultWeight: 50, description: 'Ignites its body and plunges into the enemy.', icon: '🔥', rarity: 'Epic' },
  { id: 'rebirth_ash',    name: 'Rebirth Ash',    type: 'Fire', effect: 'heal',   power: 200, cooldown: 6, defaultWeight: 30, description: 'Burns itself and rises — heals significantly with each rebirth.', icon: '💫', rarity: 'Epic' },
  { id: 'inferno_trail',  name: 'Inferno Trail',  type: 'Fire', effect: 'dot',    power: 60,  cooldown: 4, defaultWeight: 20, duration: 4, description: 'Leaves a trail of living fire that burns for multiple turns.', icon: '🌋', rarity: 'Epic' },

  // ======== CERBERUS SKILLS ========
  { id: 'triple_bite',    name: 'Triple Bite',    type: 'Shadow', effect: 'damage', power: 190, cooldown: 2, defaultWeight: 50, description: 'Three heads strike simultaneously — a lethal combo.', icon: '🐕', rarity: 'Mythic' },
  { id: 'hellfire_breath', name: 'Hellfire Breath', type: 'Shadow', effect: 'dot',  power: 80, cooldown: 5, defaultWeight: 30, duration: 5, description: 'Breathes the fire of the underworld — burns for 5 turns.', icon: '🔥', rarity: 'Mythic' },
  { id: 'death_howl',     name: 'Death Howl',     type: 'Shadow', effect: 'debuff', power: 100, cooldown: 5, defaultWeight: 20, buffType: 'attack', buffValue: -50, duration: 4, description: 'A howl from the realm of death that breaks an enemy\'s spirit.', icon: '💀', rarity: 'Mythic' },

  // ======== BEHEMOTH SKILLS ========
  { id: 'world_crash',   name: 'World Crash',   type: 'Earth', effect: 'damage', power: 200, cooldown: 2, defaultWeight: 50, description: 'Charges with the force of a colliding continent.', icon: '🌍', rarity: 'Mythic' },
  { id: 'titanic_armor', name: 'Titanic Armor', type: 'Earth', effect: 'shield', power: 500, cooldown: 6, defaultWeight: 30, description: 'Its hide is described in scripture as one of creation\'s hardest materials.', icon: '🏔️', rarity: 'Mythic' },
  { id: 'tremor',        name: 'Tremor',        type: 'Earth', effect: 'debuff', power: 120, cooldown: 5, defaultWeight: 20, buffType: 'speed', buffValue: -60, duration: 4, description: 'Its footsteps cause the ground to crack and crumble.', icon: '💥', rarity: 'Epic' },

  // ======== LEVIATHAN SKILLS ========
  { id: 'tidal_crush',   name: 'Tidal Crush',   type: 'Water', effect: 'damage', power: 210, cooldown: 2, defaultWeight: 50, description: 'The force of an ocean crashing down in a single blow.', icon: '🌊', rarity: 'Mythic' },
  { id: 'serpent_coil',  name: 'Serpent Coil',  type: 'Water', effect: 'debuff', power: 100, cooldown: 5, defaultWeight: 30, buffType: 'speed', buffValue: -70, duration: 4, description: 'Coils around the prey — no escape, no mercy.', icon: '🐍', rarity: 'Mythic' },
  { id: 'abyss_roar',    name: 'Abyss Roar',    type: 'Water', effect: 'debuff', power: 80,  cooldown: 4, defaultWeight: 20, buffType: 'attack', buffValue: -55, duration: 3, description: 'A roar from the deepest abyss that shatters enemy resolve.', icon: '🔱', rarity: 'Legendary' },

  // ======== GRYPHON SKILLS ========
  { id: 'divine_slash',    name: 'Divine Slash',    type: 'Air', effect: 'damage', power: 220, cooldown: 2, defaultWeight: 50, description: 'A slash empowered by divine authority — no armour withstands it.', icon: '⚔️', rarity: 'Legendary' },
  { id: 'sky_dominion',    name: 'Sky Dominion',    type: 'Air', effect: 'buff',   power: 0,   cooldown: 5, defaultWeight: 30, buffType: 'attack', buffValue: 60, duration: 4, description: 'Asserts dominion over all sky creatures — raw power surge.', icon: '👑', rarity: 'Legendary' },
  { id: 'celestial_roar',  name: 'Celestial Roar',  type: 'Air', effect: 'debuff', power: 120, cooldown: 6, defaultWeight: 20, buffType: 'attack', buffValue: -60, duration: 4, description: 'A roar blessed by divine power that humbles any opponent.', icon: '✨', rarity: 'Legendary' },

  // ======== WYVERN SKILLS ========
  { id: 'venom_fang',    name: 'Venom Fang',    type: 'Fire', effect: 'dot',    power: 90,  cooldown: 3, defaultWeight: 50, duration: 6, description: 'Injects paralyzing venom — massive damage over 6 turns.', icon: '☠️', rarity: 'Legendary' },
  { id: 'wing_inferno',  name: 'Wing Inferno',  type: 'Fire', effect: 'damage', power: 240, cooldown: 4, defaultWeight: 30, description: 'Fans wings creating a wall of fire — absolute destruction.', icon: '🔥', rarity: 'Legendary' },
  { id: 'death_spiral',  name: 'Death Spiral',  type: 'Fire', effect: 'damage', power: 300, cooldown: 7, defaultWeight: 20, description: 'Enters a death spiral — ultimate finishing move.', icon: '💀', rarity: 'UltraLegendary' },

  // ======== DRAGON SKILLS ========
  { id: 'inferno_breath', name: 'Inferno Breath', type: 'Fire', effect: 'dot',    power: 120, cooldown: 3, defaultWeight: 50, duration: 5, description: 'Dragon fire that burns from the inside — 5 turns of pure agony.', icon: '🐉', rarity: 'UltraLegendary' },
  { id: 'dragon_claw',    name: 'Dragon Claw',    type: 'Fire', effect: 'damage', power: 280, cooldown: 2, defaultWeight: 30, description: 'Claws forged by centuries of battle — can shatter mountains.', icon: '🔥', rarity: 'UltraLegendary' },
  { id: 'ancient_roar',   name: 'Ancient Roar',   type: 'Fire', effect: 'debuff', power: 150, cooldown: 6, defaultWeight: 20, buffType: 'attack', buffValue: -70, duration: 5, description: 'A roar carrying the weight of an immortal being — enemy collapses.', icon: '💥', rarity: 'UltraLegendary' },

  // ======== HYDRA SKILLS ========
  { id: 'nine_heads',          name: 'Nine Heads',       type: 'Shadow', effect: 'damage', power: 260, cooldown: 2, defaultWeight: 50, description: 'Nine heads strike in rapid succession — each bite lethal.', icon: '🐲', rarity: 'UltraLegendary' },
  { id: 'acid_spray',          name: 'Acid Spray',       type: 'Shadow', effect: 'dot',    power: 110, cooldown: 4, defaultWeight: 30, duration: 6, description: 'Sprays corrosive acid that dissolves armour over 6 turns.', icon: '☠️', rarity: 'UltraLegendary' },
  { id: 'immortal_regeneration', name: 'Immortal Regen', type: 'Shadow', effect: 'heal',   power: 400, cooldown: 6, defaultWeight: 20, description: 'Regenerates like the mythical Hydra — massive HP restoration.', icon: '💪', rarity: 'UltraLegendary' },

  // ======== COMMON ELEMENTAL SKILLS (Shared) ========
  { id: 'earth_shield', name: 'Earth Shield', type: 'Earth', effect: 'shield', power: 150, cooldown: 4, defaultWeight: 30, description: 'Wraps the user in tectonic plates.', icon: '🛡️', rarity: 'Rare' },
  { id: 'water_mending', name: 'Water Mending', type: 'Water', effect: 'heal', power: 120, cooldown: 3, defaultWeight: 30, description: 'Soothing currents heal the body.', icon: '💧', rarity: 'Rare' },
  { id: 'fire_blast', name: 'Fire Blast', type: 'Fire', effect: 'damage', power: 120, cooldown: 2, defaultWeight: 30, description: 'A generic but powerful burst of flame.', icon: '💥', rarity: 'Common' },
  { id: 'air_haste', name: 'Air Haste', type: 'Air', effect: 'buff', power: 0, cooldown: 4, defaultWeight: 30, buffType: 'speed', buffValue: 25, duration: 3, description: 'Wind currents accelerate movement.', icon: '💨', rarity: 'Rare' },
  { id: 'shadow_strike', name: 'Shadow Strike', type: 'Shadow', effect: 'damage', power: 140, cooldown: 3, defaultWeight: 30, description: 'Strikes from the void with lethal force.', icon: '🌑', rarity: 'SuperRare' },
  { id: 'divine_blessing', name: 'Divine Blessing', type: 'Divine', effect: 'buff', power: 0, cooldown: 5, defaultWeight: 30, buffType: 'attack', buffValue: 40, duration: 2, description: 'A holy surge of celestial power.', icon: '✨', rarity: 'Epic' },

  // ======== EXCLUSIVE ROAD SKILLS ========
  { id: 'lions_bite',    name: 'Lion\'s Bite',   type: 'Divine', effect: 'damage', power: 140, cooldown: 0, defaultWeight: 50, description: 'The Chimera\'s lion head snaps with primal force.', icon: '🦁', rarity: 'Epic' },
  { id: 'goat_bash',     name: 'Goat Bash',      type: 'Divine', effect: 'debuff', power: 60,  cooldown: 3, defaultWeight: 30, buffType: 'speed', buffValue: -20, duration: 2, description: 'A headbutt from the goat head that stuns the enemy.', icon: '🐏', rarity: 'Epic' },
  { id: 'serpent_venom', name: 'Serpent Venom',  type: 'Divine', effect: 'dot',    power: 50,  cooldown: 4, defaultWeight: 20, duration: 4, description: 'The tail-serpent strikes, poisoning the foe.', icon: '🐍', rarity: 'Epic' },
  
  { id: 'void_strike',   name: 'Void Strike',    type: 'Shadow', effect: 'damage', power: 180, cooldown: 2, defaultWeight: 50, description: 'A strike from the heart of the void. Ignores armor.', icon: '🌑', rarity: 'Legendary' },
  { id: 'phantom_pounce', name: 'Phantom Pounce', type: 'Shadow', effect: 'damage', power: 220, cooldown: 4, defaultWeight: 30, description: 'A high-speed pounce that leaves after-images.', icon: '⚡', rarity: 'Legendary' },
  { id: 'shadow_clone',  name: 'Shadow Clone',   type: 'Shadow', effect: 'buff',   power: 0,   cooldown: 5, defaultWeight: 20, buffType: 'attack', buffValue: 50, duration: 3, description: 'Creates a shadow double to amplify attack power.', icon: '👥', rarity: 'Legendary' },
];

export function getSkillDef(id: string): SkillDef | undefined {
  return SKILLS.find(s => s.id === id);
}

export function getSkillsByCreature(creatureId: string, skillIds: [string, string, string]): SkillDef[] {
  return skillIds.map(id => SKILLS.find(s => s.id === id)!).filter(Boolean);
}
