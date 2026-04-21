import { PlayerProfile, Rarity } from '../../../shared/types.js';
import { CREATURES } from '../data/creatures.js';
import { SKILLS } from '../data/skills.js';
import { TALENTS } from '../data/talents.js';

export interface RoadReward {
  xpGoal: number;
  type: 'creature' | 'skill' | 'talent' | 'support' | 'essence';
  id: string;
  name: string;
  count?: number;
}

export const ROAD_REWARDS: RoadReward[] = [
  { xpGoal: 500,  type: 'essence',  id: 'essence',     name: '250 Essence', count: 250 },
  { xpGoal: 1200, type: 'creature', id: 'chimera',     name: 'Chimera' },
  { xpGoal: 2000, type: 'skill',    id: 'earth_shield', name: 'Earth Shield' },
  { xpGoal: 3500, type: 'essence',  id: 'essence',     name: '1000 Essence', count: 1000 },
  { xpGoal: 5000, type: 'creature', id: 'spectral_tiger', name: 'Spectral Tiger' },
];

export const EXCLUSIVE_IDS = ['chimera', 'spectral_tiger', 'lions_bite', 'goat_bash', 'serpent_venom', 'void_strike', 'phantom_pounce', 'shadow_clone'];

export function checkProgression(profile: PlayerProfile, oldXp: number, newXp: number): RoadReward[] {
  const unlocked: RoadReward[] = [];
  
  for (const reward of ROAD_REWARDS) {
    if (oldXp < reward.xpGoal && newXp >= reward.xpGoal) {
      grantReward(profile, reward);
      unlocked.push(reward);
    }
  }
  
  return unlocked;
}

function grantReward(profile: PlayerProfile, reward: RoadReward) {
  switch (reward.type) {
    case 'creature':
      if (!profile.unlockedCreatures.includes(reward.id)) {
        profile.unlockedCreatures.push(reward.id);
        // Also unlock base skills
        const def = CREATURES.find(c => c.id === reward.id);
        if (def) {
          profile.unlockedSkills = profile.unlockedSkills || [];
          def.skillIds.forEach(sid => {
            if (!profile.unlockedSkills.includes(sid)) profile.unlockedSkills.push(sid);
          });
        }
      }
      break;
    case 'skill':
      profile.unlockedSkills = profile.unlockedSkills || [];
      if (!profile.unlockedSkills.includes(reward.id)) profile.unlockedSkills.push(reward.id);
      break;
    case 'talent':
      profile.unlockedTalents = profile.unlockedTalents || [];
      if (!profile.unlockedTalents.includes(reward.id)) profile.unlockedTalents.push(reward.id);
      break;
    case 'essence':
      profile.essence += reward.count || 0;
      break;
  }
}
