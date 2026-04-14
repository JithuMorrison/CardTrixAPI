// ==========================================
// COMBAT SYSTEM — 1v1 auto-battle mechanics
// ==========================================

import { BattleCreature, ActiveBuff, CombatEvent, BattleSkill } from '../../../shared/types.js';
import { getTalentDef } from '../data/talents.js';
import { getSupportCardDef } from '../data/supportCards.js';

export class CombatSystem {

  // ---- Turn Priority ----

  /**
   * Returns true if creature1 goes first.
   * Priority: First Strike talent > Speed > seeded RNG tiebreak.
   */
  static determineFirstAttacker(
    c1: BattleCreature, c2: BattleCreature, seed: number
  ): boolean {
    const c1HasFirstStrike = c1.talents.some(id => id === 'first_strike');
    const c2HasFirstStrike = c2.talents.some(id => id === 'first_strike');

    if (c1HasFirstStrike && !c2HasFirstStrike) return true;
    if (c2HasFirstStrike && !c1HasFirstStrike) return false;

    // Speed comparison (lower = faster)
    if (c1.speed < c2.speed) return true;
    if (c2.speed < c1.speed) return false;

    // Seeded RNG tiebreak
    return seededRng(seed) < 0.5;
  }

  // ---- Skill Selection ----

  /**
   * Select a skill using weighted random. Respects cooldowns.
   */
  static selectSkill(creature: BattleCreature, seed: number): BattleSkill | null {
    const available = creature.skills.filter(s => s.cooldownRemaining <= 0);
    if (available.length === 0) {
      // All on cooldown — use first available with smallest cooldown
      const soonest = [...creature.skills].sort((a, b) => a.cooldownRemaining - b.cooldownRemaining)[0];
      return soonest || null;
    }

    const totalWeight = available.reduce((sum, s) => sum + s.weight, 0);
    let roll = seededRng(seed) * totalWeight;

    for (const skill of available) {
      roll -= skill.weight;
      if (roll <= 0) return skill;
    }
    return available[available.length - 1];
  }

  // ---- Damage Calculation ----

  /**
   * Calculate raw damage from skill.
   */
  static calculateDamageDetailed(attacker: BattleCreature, skill: BattleSkill): { total: number; base: number; reasons: string[] } {
    const reasons: string[] = [];
    let baseDamage = (attacker.attack * skill.power) / 100;
    const base = Math.round(baseDamage);

    // Apply attacker buffs
    const attackBuff = getStatBuff(attacker.buffs, 'attack');
    if (attackBuff !== 0) {
      baseDamage *= (1 + attackBuff / 100);
      reasons.push(`${attackBuff > 0 ? '+' : ''}${attackBuff}% Attack from buffs`);
    }

    return {
      total: Math.round(baseDamage),
      base,
      reasons
    };
  }

  static calculateDamage(attacker: BattleCreature, skill: BattleSkill): number {
    return this.calculateDamageDetailed(attacker, skill).total;
  }

  /**
   * Apply damage to target, considering defense buffs.
   */
  static applyDamageDetailed(target: BattleCreature, rawDamage: number, attacker: BattleCreature | null = null): { dealt: number; mitigated: number; explanations: string[] } {
    let damage = rawDamage;
    let originalDamage = rawDamage;
    const explanations: string[] = [];

    // Shield check
    const shieldBuff = target.buffs.find(b => b.type === 'shield');
    if (shieldBuff && shieldBuff.value > 0) {
      const absorbed = Math.min(shieldBuff.value, damage);
      shieldBuff.value -= absorbed;
      damage -= absorbed;
      explanations.push(`Shield absorbed ${Math.round(absorbed)}`);
      if (shieldBuff.value <= 0) {
        target.buffs = target.buffs.filter(b => b.id !== shieldBuff.id);
      }
    }

    // Talent: Iron Hide (damage reduction)
    if (target.talents.includes('iron_hide')) {
      damage *= 0.8;
      explanations.push(`Iron Hide talent reduced dmg by 20%`);
    }

    // Defense buffs
    const defBuff = getStatBuff(target.buffs, 'damage_reduction');
    if (defBuff !== 0) {
      damage *= (1 - defBuff / 100);
      explanations.push(`${defBuff}% damage reduction from buffs`);
    }

    const finalDamage = Math.max(1, Math.round(damage));
    const mitigated = Math.round(originalDamage - finalDamage);

    target.hp = Math.max(0, target.hp - finalDamage);
    if (target.hp <= 0) target.isAlive = false;

    // Talent: Thorned Skin (damage reflection)
    if (attacker && target.talents.includes('thorned_skin') && finalDamage > 0) {
      const reflected = Math.round(finalDamage * 0.2);
      attacker.hp = Math.max(0, attacker.hp - reflected);
      if (attacker.hp <= 0) attacker.isAlive = false;
    }

    return { dealt: finalDamage, mitigated, explanations };
  }

  static applyDamage(target: BattleCreature, rawDamage: number, attacker: BattleCreature | null = null): number {
    return this.applyDamageDetailed(target, rawDamage, attacker).dealt;
  }

  /**
   * Apply lifesteal healing.
   */
  static processLifesteal(attacker: BattleCreature, damageDealt: number): number {
    let lifestealPct = 0;

    // Talent: Vampiric
    if (attacker.talents.includes('vampiric')) lifestealPct += 15;

    // Support card: Soul Stone
    if (attacker.supportCardId) {
      const card = getSupportCardDef(attacker.supportCardId);
      if (card) {
        const ls = card.effects.find(e => e.type === 'lifesteal');
        if (ls) lifestealPct += ls.value;
      }
    }

    if (lifestealPct <= 0) return 0;

    const healed = Math.round(damageDealt * lifestealPct / 100);
    attacker.hp = Math.min(attacker.maxHp, attacker.hp + healed);
    return healed;
  }

  /**
   * Apply poison from talents/support cards after a hit.
   */
  static processPoisonOnHit(attacker: BattleCreature, target: BattleCreature): boolean {
    let poisonDmgPct = 0;

    // Talent: Venomous
    if (attacker.talents.includes('venom')) poisonDmgPct += 8;

    // Support card: Bacteria / Venom Sac
    if (attacker.supportCardId) {
      const card = getSupportCardDef(attacker.supportCardId);
      if (card) {
        const p = card.effects.find(e => e.type === 'poison_on_hit');
        if (p) poisonDmgPct += p.value;
      }
    }

    if (poisonDmgPct <= 0) return false;

    const poisonDamage = Math.round(attacker.attack * poisonDmgPct / 100);
    // Add or stack poison DOT
    const existingPoison = target.buffs.find(b => b.type === 'dot' && b.sourceId === attacker.id);
    if (existingPoison) {
      existingPoison.remainingTurns = 3; // refresh
    } else {
      target.buffs.push({
        id: `poison_${attacker.id}_${Date.now()}`,
        type: 'dot',
        value: poisonDamage,
        remainingTurns: 3,
        sourceId: attacker.id,
      });
    }
    return true;
  }

  // ---- Skill Execution ----

  static executeSkill(
    attacker: BattleCreature,
    defender: BattleCreature,
    skill: BattleSkill,
    tick: number,
    events: CombatEvent[]
  ): void {
    // Put skill on cooldown
    skill.cooldownRemaining = skill.cooldown;

    events.push({
      tick,
      type: 'skill_used',
      sourceId: attacker.id,
      targetId: defender.id,
      skillName: skill.name,
      skillIcon: skill.icon,
      attackerId: attacker.id,
      defenderId: defender.id,
    });

    switch (skill.effect) {
      case 'damage': {
        const damageData = this.calculateDamageDetailed(attacker, skill);
        let raw = damageData.total;

        const res = this.applyDamageDetailed(defender, raw, attacker);
        const dealt = res.dealt;
        const explanation = [...damageData.reasons, ...res.explanations].join(' | ');

        events.push({
          tick,
          type: 'damage_dealt',
          sourceId: attacker.id,
          targetId: defender.id,
          value: dealt,
          rawDamage: damageData.base,
          mitigated: res.mitigated,
          explanation: explanation || undefined,
          skillName: skill.name,
          skillIcon: skill.icon,
        });

        // Lifesteal
        const healed = this.processLifesteal(attacker, dealt);
        if (healed > 0) events.push({ tick, type: 'heal', sourceId: attacker.id, targetId: attacker.id, value: healed });

        // Poison on hit
        this.processPoisonOnHit(attacker, defender);
        break;
      }

      case 'dot': {
        // Apply a bleeding/burn DoT
        const dotDamage = Math.round((attacker.attack * skill.power) / 100);
        const turns = skill.duration || 3;
        defender.buffs.push({
          id: `dot_${attacker.id}_${tick}`,
          type: 'dot',
          value: dotDamage,
          remainingTurns: turns,
          sourceId: attacker.id,
        });
        events.push({ tick, type: 'debuff_applied', sourceId: attacker.id, targetId: defender.id, skillName: skill.name, value: dotDamage, effectType: 'dot' });
        break;
      }

      case 'heal': {
        const healAmount = Math.round((attacker.attack * skill.power) / 100);
        const actual = Math.min(healAmount, attacker.maxHp - attacker.hp);
        attacker.hp = Math.min(attacker.maxHp, attacker.hp + actual);
        events.push({ tick, type: 'heal', sourceId: attacker.id, targetId: attacker.id, value: actual });
        break;
      }

      case 'buff': {
        if (skill.buffType && skill.buffValue !== undefined) {
          attacker.buffs.push({
            id: `buff_${skill.defId}_${tick}`,
            type: skill.buffType,
            value: skill.buffValue,
            remainingTurns: skill.duration || 3,
            sourceId: attacker.id,
          });
        }
        events.push({ tick, type: 'buff_applied', sourceId: attacker.id, targetId: attacker.id, skillName: skill.name });
        break;
      }

      case 'debuff': {
        if (skill.buffType && skill.buffValue !== undefined) {
          defender.buffs.push({
            id: `debuff_${skill.defId}_${tick}`,
            type: skill.buffType,
            value: skill.buffValue, // negative = reduction
            remainingTurns: skill.duration || 3,
            sourceId: attacker.id,
          });
          // Minor direct damage too
          if (skill.power > 0) {
            const dmg = Math.round((attacker.attack * skill.power) / 100 * 0.4);
            this.applyDamage(defender, dmg, attacker);
            events.push({ tick, type: 'damage_dealt', sourceId: attacker.id, targetId: defender.id, value: dmg });
          }
        }
        events.push({ tick, type: 'debuff_applied', sourceId: attacker.id, targetId: defender.id, skillName: skill.name });
        break;
      }

      case 'shield': {
        attacker.buffs.push({
          id: `shield_${skill.defId}_${tick}`,
          type: 'shield',
          value: skill.power,
          remainingTurns: skill.duration || 3,
          sourceId: attacker.id,
        });
        events.push({ tick, type: 'shield_applied', sourceId: attacker.id, targetId: attacker.id, value: skill.power });
        break;
      }
    }
  }

  // ---- DoT Tick Processing ----

  static tickDoTs(creature: BattleCreature, tick: number, events: CombatEvent[]): void {
    const dotsToRemove: string[] = [];
    for (const buff of creature.buffs) {
      if (buff.type === 'dot') {
        const damage = Math.max(1, buff.value);
        creature.hp = Math.max(0, creature.hp - damage);
        if (creature.hp <= 0) creature.isAlive = false;
        buff.remainingTurns--;
        events.push({ tick, type: 'dot_tick', targetId: creature.id, value: damage });
        if (buff.remainingTurns <= 0) dotsToRemove.push(buff.id);
      }
    }
    creature.buffs = creature.buffs.filter(b => !dotsToRemove.includes(b.id));
  }

  // ---- Buff/Debuff Tick ----

  static tickBuffs(creature: BattleCreature): void {
    creature.buffs = creature.buffs
      .map(b => {
        if (b.type !== 'dot') b.remainingTurns--;
        return b;
      })
      .filter(b => b.remainingTurns > 0);
  }

  // ---- Passive Regen ----

  static processPassiveRegen(creature: BattleCreature, tick: number, events: CombatEvent[]): void {
    if (!creature.isAlive) return;
    if (!creature.talents.includes('regeneration')) return;

    // Only trigger every 10 ticks (1 second)
    if (tick % 10 !== 0) return;

    const regen = Math.round(creature.maxHp * 0.05);
    creature.hp = Math.min(creature.maxHp, creature.hp + regen);
    
    // Only add to events if buffer is provided
    if (events) {
      events.push({ tick, type: 'heal', sourceId: creature.id, targetId: creature.id, value: regen });
    }
  }

  // ---- Berserker Check ----

  static getBerserkerBonus(creature: BattleCreature): number {
    if (!creature.talents.includes('berserker')) return 1;
    if (creature.hp / creature.maxHp < 0.30) return 1.5; // +50%
    return 1;
  }

  // ---- Death Effects ----

  static processDeathEffects(
    dead: BattleCreature, killer: BattleCreature,
    tick: number, events: CombatEvent[]
  ): void {
    // Talent: Death Burst
    if (dead.talents.includes('death_burst')) {
      const burstDamage = Math.round(dead.maxHp * 0.8);
      killer.hp = Math.max(0, killer.hp - burstDamage);
      if (killer.hp <= 0) killer.isAlive = false;
      events.push({ tick, type: 'damage_dealt', sourceId: dead.id, targetId: killer.id, value: burstDamage, effectType: 'death_burst' });
    }
  }

  // ---- Support Card Application to Stats ----

  static applySupportCardStats(creature: BattleCreature): void {
    if (!creature.supportCardId) return;
    const card = getSupportCardDef(creature.supportCardId);
    if (!card) return;

    for (const effect of card.effects) {
      switch (effect.type) {
        case 'attack_boost':
          creature.attack = Math.round(creature.attack * (1 + effect.value / 100));
          break;
        case 'hp_boost':
          creature.maxHp = Math.round(creature.maxHp * (1 + effect.value / 100));
          creature.hp = creature.maxHp;
          break;
        case 'speed_boost':
          // Speed is ticks between attacks — boost reduces it
          creature.speed = Math.max(10, Math.round(creature.speed * (1 - effect.value / 100)));
          break;
        case 'cooldown_reduce':
          for (const skill of creature.skills) {
            skill.cooldown = Math.max(0, skill.cooldown - effect.value);
          }
          break;
        case 'weight_shift':
          if (effect.skillIndex !== undefined && creature.skills[effect.skillIndex]) {
            creature.skills[effect.skillIndex].weight = Math.min(80, creature.skills[effect.skillIndex].weight + effect.value);
          }
          break;
      }
    }
  }

  // ---- Talent Stat Application ----

  static applyTalentStats(creature: BattleCreature): void {
    for (const talentId of creature.talents) {
      if (!talentId) continue;
      const talent = getTalentDef(talentId);
      if (!talent) continue;

      if (talent.effect.type === 'stat_boost') {
        switch (talent.effect.stat) {
          case 'hp':
            creature.maxHp = Math.round(creature.maxHp * (1 + talent.effect.value / 100));
            creature.hp = creature.maxHp;
            break;
          case 'attack':
            creature.attack = Math.round(creature.attack * (1 + talent.effect.value / 100));
            break;
          case 'speed':
            creature.speed = Math.max(10, Math.round(creature.speed * (1 - talent.effect.value / 100)));
            break;
        }
      }
    }
  }
}

// ---- Helpers ----

function getStatBuff(buffs: ActiveBuff[], type: string): number {
  return buffs
    .filter(b => b.type === type)
    .reduce((sum, b) => sum + b.value, 0);
}

/** Seeded pseudo-random number generator (mulberry32) */
export function seededRng(seed: number): number {
  let t = seed + 0x6D2B79F5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
