// ==========================================
// GAME ENGINE — Auto-Battle Engine
// Primal Duels: Strategy Arena
// ==========================================

import { Server } from 'socket.io';
import { v4 as uuid } from 'uuid';
import {
  GameState, GamePhase, PlayerBattleState, BattleCreature,
  BattleSkill, CombatEvent, DeckConfig, DeckCreature,
} from '../../../shared/types.js';
import { CombatSystem, seededRng } from './CombatSystem.js';
import { getCreatureDef } from '../data/creatures.js';
import { getSkillDef } from '../data/skills.js';
import { ProfileRegistry } from '../socket/profileRegistry.js';

const TICK_RATE_MS = 100;       // ms per tick
const TICKS_PER_TURN = 35;      // 3.5 seconds per combat turn
const SPAWN_DELAY_TICKS = 10;   // 1 second delay after death before next spawns
const MAX_MATCH_TICKS = 18000;  // 180s = 3 minute time limit

export class GameEngine {
  roomId: string;
  state: GameState;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private io: Server;
  private playerSockets: Map<string, string> = new Map();
  private onGameEnd?: (winnerId: string, results: { [pid: string]: { essence: number; xp: number } }) => void;

  // Internal battle tracking
  private playerIds: [string, string] = ['', ''];
  private pendingSpawn: Map<string, number> = new Map(); // playerId -> tick of when to spawn next
  private rngCounter: number = 0;

  constructor(
    io: Server,
    roomId: string,
    player1: { id: string; name: string; socketId: string; deck: DeckConfig },
    player2: { id: string; name: string; socketId: string; deck: DeckConfig },
    onGameEnd?: (winnerId: string, results: { [pid: string]: { essence: number; xp: number } }) => void
  ) {
    this.io = io;
    this.roomId = roomId;
    this.onGameEnd = onGameEnd;

    this.playerSockets.set(player1.id, player1.socketId);
    this.playerSockets.set(player2.id, player2.socketId);
    this.playerIds = [player1.id, player2.id];

    const rngSeed = Math.floor(Math.random() * 0xFFFFFFFF);

    this.state = {
      roomId,
      tick: 0,
      phase: 'setup',
      players: {},
      combatLog: [],
      matchTimer: 0,
      roundNumber: 0,
      rngSeed,
    };

    this.state.players[player1.id] = this.createPlayerState(player1.id, player1.name, player1.deck, false);
    this.state.players[player2.id] = this.createPlayerState(player2.id, player2.name, player2.deck, player2.deck.isBotDeck === true);
  }

  // ---- Player/Creature Setup ----

  private createPlayerState(playerId: string, playerName: string, deck: DeckConfig, isBot: boolean): PlayerBattleState {
    const creatures: BattleCreature[] = [];

    for (let i = 0; i < deck.creatures.length; i++) {
      const dc = deck.creatures[i];
      const creature = this.createBattleCreature(dc, playerId, i + 1);
      if (creature) creatures.push(creature);
    }

    const firstCreature = creatures.shift() || null;

    return {
      playerId,
      playerName,
      isBot,
      activeCombatant: firstCreature,
      spawnQueue: creatures,
      deadCreatures: [],
      totalCreatures: deck.creatures.length,
      creaturesAlive: deck.creatures.length,
    };
  }

  private createBattleCreature(dc: DeckCreature, ownerId: string, spawnOrder: number): BattleCreature | null {
    const def = getCreatureDef(dc.defId);
    if (!def) return null;

    const skillDefs = def.skillIds.map(id => getSkillDef(id)).filter(Boolean);
    const skills: BattleSkill[] = skillDefs.map((skillDef, i) => ({
      defId: skillDef!.id,
      name: skillDef!.name,
      cooldownRemaining: 0,
      cooldown: skillDef!.cooldown,
      weight: dc.skillWeights[i] ?? skillDef!.defaultWeight,
      effect: skillDef!.effect,
      power: skillDef!.power,
      type: skillDef!.type,
      duration: skillDef!.duration,
      buffType: skillDef!.buffType,
      buffValue: skillDef!.buffValue,
      icon: skillDef!.icon,
    }));

    const creature: BattleCreature = {
      id: `${ownerId}_${dc.defId}_${uuid().slice(0, 4)}`,
      defId: dc.defId,
      ownerId,
      name: def.name,
      type: def.type,
      backgroundType: def.backgroundType,
      spawnOrder,
      hp: def.baseHp,
      maxHp: def.baseHp,
      attack: def.baseAttack,
      defense: def.baseDefense,
      speed: def.baseSpeed,
      skills,
      talents: dc.talentIds.filter(Boolean) as string[],
      supportCardId: dc.supportCardId,
      isAlive: true,
      buffs: [],
      image: def.image,
      emoji: def.emoji,
      attackTimerTicks: def.baseSpeed,
    };

    // Apply creature level scaling (+5% per level above 1)
    const profile = ProfileRegistry.get(ownerId);
    if (profile && profile.creatureLevels) {
      const lvl = profile.creatureLevels[dc.defId] || 1;
      if (lvl > 1) {
        const mult = 1 + (lvl - 1) * 0.05; // +5% per level
        creature.maxHp = Math.round(creature.maxHp * mult);
        creature.hp = creature.maxHp;
        creature.attack = Math.round(creature.attack * mult);
        creature.defense = Math.round(creature.defense * mult);
      }
    }

    // Apply talent stat boosts
    CombatSystem.applyTalentStats(creature);

    // Apply support card stat boosts
    CombatSystem.applySupportCardStats(creature);

    return creature;
  }

  // ---- Game Loop ----

  start(): void {
    this.state.phase = 'battle';

    const events: CombatEvent[] = [{
      tick: 0,
      type: 'battle_start',
    }];

    // Emit both players' active creatures (hidden reveal)
    this.broadcastToRoom('game_start', {
      state: this.state,
    });

    // Spawn initial creatures for both players
    for (const pid of this.playerIds) {
      const player = this.state.players[pid];
      if (player.activeCombatant) {
        events.push({
          tick: 0,
          type: 'creature_spawned',
          sourceId: pid,
          targetId: player.activeCombatant.id,
          skillName: player.activeCombatant.name,
        });
      }
    }

    this.state.combatLog = events;
    this.broadcastStateUpdate(events);

    this.intervalId = setInterval(() => this.tick(), TICK_RATE_MS);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  forceEnd(forfeitingPlayerId: string): void {
    const winnerId = this.playerIds.find(id => id !== forfeitingPlayerId) || this.playerIds[0];
    this.endGame(winnerId);
  }

  // ---- Main Tick ----

  private tick(): void {
    if (this.state.phase !== 'battle') return;

    this.state.tick++;
    this.state.matchTimer = Math.floor(this.state.tick / 10);

    const events: CombatEvent[] = [];

    // Handle pending spawns
    for (const [pid, spawnTick] of this.pendingSpawn.entries()) {
      if (this.state.tick >= spawnTick) {
        this.pendingSpawn.delete(pid);
        const player = this.state.players[pid];

        if (player.spawnQueue.length > 0) {
          const nextCreature = player.spawnQueue.shift()!;
          player.activeCombatant = nextCreature;
          player.creaturesAlive = player.spawnQueue.length + 1;

          events.push({
            tick: this.state.tick,
            type: 'creature_spawned',
            sourceId: pid,
            targetId: nextCreature.id,
            skillName: nextCreature.name,
          });
        } else {
          // No more creatures — player loses
          this.endGame(this.playerIds.find(id => id !== pid)!);
          return;
        }
      }
    }

    // Check if both players have active combatants
    const [p1id, p2id] = this.playerIds;
    const p1 = this.state.players[p1id];
    const p2 = this.state.players[p2id];

    const c1 = p1.activeCombatant;
    const c2 = p2.activeCombatant;

    if (!c1 || !c2) {
      // Waiting for spawn
      this.appendEvents(events);
      return;
    }

    // Tick attack timers
    c1.attackTimerTicks--;
    c2.attackTimerTicks--;

    // Combat round fires when either creature's timer reaches 0
    const c1Ready = c1.attackTimerTicks <= 0;
    const c2Ready = c2.attackTimerTicks <= 0;

    if (c1Ready || c2Ready) {
      this.state.roundNumber++;
      events.push({ tick: this.state.tick, type: 'round_start' });

      // Determine turn order for this round
      const seed = this.nextSeed();
      let attackers: [BattleCreature, BattleCreature][];

      if (c1Ready && c2Ready) {
        // Both ready — determine who goes first
        const c1First = CombatSystem.determineFirstAttacker(c1, c2, seed);
        attackers = c1First ? [[c1, c2], [c2, c1]] : [[c2, c1], [c1, c2]];
      } else if (c1Ready) {
        attackers = [[c1, c2]];
        c1.attackTimerTicks = c1.speed; // reset timer
      } else {
        attackers = [[c2, c1]];
        c2.attackTimerTicks = c2.speed; // reset timer
      }

      if (c1Ready && c2Ready) {
        c1.attackTimerTicks = c1.speed;
        c2.attackTimerTicks = c2.speed;
      }

      for (const [attacker, defender] of attackers) {
        if (!attacker.isAlive || !defender.isAlive) continue;

        // Tick skill cooldowns
        for (const skill of attacker.skills) {
          if (skill.cooldownRemaining > 0) skill.cooldownRemaining--;
        }

        // Select skill
        const skill = CombatSystem.selectSkill(attacker, this.nextSeed());
        if (!skill) continue;

        // Apply berserker bonus (modify attack temporarily)
        const berserkerMult = CombatSystem.getBerserkerBonus(attacker);
        const originalAttack = attacker.attack;
        attacker.attack = Math.round(attacker.attack * berserkerMult);

        CombatSystem.executeSkill(attacker, defender, skill, this.state.tick, events);

        attacker.attack = originalAttack;

        // Check for reflection deaths (attacker dies to defender)
        if (this.processCreatureDeath(attacker, defender, events)) return;

        // Check for direct combat death
        if (this.processCreatureDeath(defender, attacker, events)) return;

        // DoT ticks on defender after attack
        CombatSystem.tickDoTs(defender, this.state.tick, events);
        if (this.processCreatureDeath(defender, attacker, events)) return;

        // Passive regen for attacker
        CombatSystem.processPassiveRegen(attacker, this.state.tick, events);
      }

      // Tick buffs after round
      if (c1.isAlive) CombatSystem.tickBuffs(c1);
      if (c2.isAlive) CombatSystem.tickBuffs(c2);
    }

    // Time limit
    if (this.state.tick >= MAX_MATCH_TICKS) {
      const p1hp = (p1.activeCombatant?.hp || 0) + p1.spawnQueue.reduce((s, c) => s + c.hp, 0);
      const p2hp = (p2.activeCombatant?.hp || 0) + p2.spawnQueue.reduce((s, c) => s + c.hp, 0);
      this.appendEvents(events);
      this.endGame(p1hp >= p2hp ? p1id : p2id);
      return;
    }

    this.appendEvents(events);
    this.broadcastStateUpdate(events);
  }

  // ---- Death Handling ----

  /**
   * Processes a creature's death, scheduling a spawn or ending the game.
   * Returns true if the game ended.
   */
  private processCreatureDeath(dead: BattleCreature, killer: BattleCreature | null, events: CombatEvent[]): boolean {
    if (dead.isAlive) return false;

    const ownerId = dead.ownerId;
    const player = this.state.players[ownerId];

    // Already processed or already null
    if (player.deadCreatures.some(c => c.id === dead.id)) return false;

    // Process on-death effects (like Death Burst - which could kill the killer!)
    if (killer) {
      CombatSystem.processDeathEffects(dead, killer, this.state.tick, events);
    }

    events.push({
      tick: this.state.tick,
      type: 'creature_died',
      targetId: dead.id,
      sourceId: killer ? killer.ownerId : undefined,
      skillName: dead.name,
    });

    player.activeCombatant = null;
    player.deadCreatures.push(dead);
    player.creaturesAlive = player.spawnQueue.length;

    // Check if killer also died from death effects
    if (killer && !killer.isAlive) {
      this.processCreatureDeath(killer, null, events);
    }

    if (player.spawnQueue.length > 0) {
      this.pendingSpawn.set(ownerId, this.state.tick + SPAWN_DELAY_TICKS);
      return false;
    } else {
      // Game over — winner is the one who ISN'T the owner of the dead creature
      const winnerId = this.playerIds.find(id => id !== ownerId)!;
      this.endGame(winnerId);
      return true;
    }
  }

  // ---- Game End ----

  private endGame(winnerId: string): void {
    this.state.phase = 'ended';
    this.state.winner = winnerId;
    this.stop();

    const rewards: { [pid: string]: { essence: number; xp: number; coins: number } } = {};
    for (const pid of this.playerIds) {
      const isWinner = pid === winnerId;
      rewards[pid] = {
        essence: isWinner ? 50 : 15,
        xp: isWinner ? 200 : 80,
        coins: isWinner ? 30 : 10,
      };
    }

    (this.state as any).rewards = rewards;

    this.broadcastToRoom('game_end', {
      winner: winnerId,
      state: this.state,
      rewards,
    });

    if (this.onGameEnd) this.onGameEnd(winnerId, rewards);
  }

  // ---- Broadcasting ----

  private broadcastStateUpdate(events: CombatEvent[]): void {
    this.broadcastToRoom('game_state_update', {
      tick: this.state.tick,
      players: this.state.players,
      events,
      matchTimer: this.state.matchTimer,
      phase: this.state.phase,
      roundNumber: this.state.roundNumber,
    });
  }

  private broadcastToRoom(event: string, data: any): void {
    this.io.to(this.roomId).emit(event, data);
  }

  private appendEvents(events: CombatEvent[]): void {
    this.state.combatLog.push(...events);
    if (this.state.combatLog.length > 30) {
      this.state.combatLog = this.state.combatLog.slice(-30);
    }
  }

  // ---- RNG ----

  private nextSeed(): number {
    this.rngCounter++;
    return this.state.rngSeed ^ (this.rngCounter * 2654435761);
  }
}
