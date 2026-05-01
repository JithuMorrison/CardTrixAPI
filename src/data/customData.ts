import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { CreatureDef, SkillDef, TalentDef, SupportCardDef } from '../../../shared/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '..', '..', 'custom_data.json');

export interface CustomData {
  creatures: CreatureDef[];
  skills: SkillDef[];
  talents: TalentDef[];
  supportCards: SupportCardDef[];
}

const empty: CustomData = { creatures: [], skills: [], talents: [], supportCards: [] };

export function loadCustomData(): CustomData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
  } catch (e) { console.error('[CustomData] Load error:', e); }
  return { ...empty, creatures: [], skills: [], talents: [], supportCards: [] };
}

export function saveCustomData(data: CustomData): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) { console.error('[CustomData] Save error:', e); }
}

export function addCreature(creature: CreatureDef): CustomData {
  const data = loadCustomData();
  data.creatures = data.creatures.filter(c => c.id !== creature.id);
  data.creatures.push(creature);
  saveCustomData(data);
  return data;
}

export function addSkill(skill: SkillDef): CustomData {
  const data = loadCustomData();
  data.skills = data.skills.filter(s => s.id !== skill.id);
  data.skills.push(skill);
  saveCustomData(data);
  return data;
}

export function addTalent(talent: TalentDef): CustomData {
  const data = loadCustomData();
  data.talents = data.talents.filter(t => t.id !== talent.id);
  data.talents.push(talent);
  saveCustomData(data);
  return data;
}

export function addSupportCard(card: SupportCardDef): CustomData {
  const data = loadCustomData();
  data.supportCards = data.supportCards.filter(c => c.id !== card.id);
  data.supportCards.push(card);
  saveCustomData(data);
  return data;
}

export function deleteItem(type: 'creatures' | 'skills' | 'talents' | 'supportCards', id: string): CustomData {
  const data = loadCustomData();
  (data[type] as any[]) = (data[type] as any[]).filter((item: any) => item.id !== id);
  saveCustomData(data);
  return data;
}
