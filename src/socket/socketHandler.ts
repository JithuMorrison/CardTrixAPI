// ==========================================
// SOCKET HANDLER — Primal Duels: Strategy Arena
// ==========================================

import { Server, Socket } from 'socket.io';
import { v4 as uuid } from 'uuid';
import { Matchmaking } from './matchmaking.js';
import { RoomManager } from './roomManager.js';
import { JoinQueuePayload, JoinBotPayload, PlayerProfile, DeckConfig, DeckCreature } from '../../../shared/types.js';
import { CREATURES } from '../data/creatures.js';
import { SKILLS } from '../data/skills.js';
import { TALENTS } from '../data/talents.js';
import { SUPPORT_CARDS } from '../data/supportCards.js';
import { ProfileRegistry } from './profileRegistry.js';
import { GachaSystem } from './gachaSystem.js';
import { checkProgression } from '../engine/progression.js';

// Initialize registry
ProfileRegistry.init();

const STARTER_CREATURES = ['wolf', 'eagle', 'crocodile', 'tiger', 'shark', 'falcon'];
const STARTER_SKILLS = ['wolf_fang', 'howl_rally', 'pack_hunt', 'talon_strike', 'wind_dive', 'sky_screech'];
const STARTER_TALENTS = ['iron_will', 'regeneration', 'iron_hide'];
const STARTER_SUPPORT_CARDS = ['adrenaline_vial'];

function getOrCreatePlayer(id: string, name: string): PlayerProfile {
  let profile = ProfileRegistry.get(id);
  if (profile) {
    // Migration: ensure new fields exist
    profile.unlockedCreatures = profile.unlockedCreatures || [...STARTER_CREATURES];
    profile.unlockedSkills = profile.unlockedSkills || [];
    profile.unlockedTalents = profile.unlockedTalents || [];
    profile.unlockedSupportCards = profile.unlockedSupportCards || [];
    
    // Catch-up for Primal Road milestones (ensure they have rewards for existing XP)
    checkProgression(profile, -1, profile.experience);
    ProfileRegistry.save(profile);

    return profile;
  }

  profile = {
    id,
    name,
    rating: 1000,
    wins: 0,
    losses: 0,
    unlockedCreatures: [...STARTER_CREATURES],
    unlockedSkills: [],
    unlockedTalents: [],
    unlockedSupportCards: [],
    shards: {},
    lootBoxStats: { boxesOpened: 0, pityCounters: {} },
    essence: 500,
    totalWins: 0,
    totalLosses: 0,
    experience: 0,
    level: 1,
  };

  ProfileRegistry.save(profile);
  return profile;
}

/** Build a bot deck using the first 6 creatures with default skill weights */
function buildBotDeck(): DeckConfig {
  const botCreatures = CREATURES.slice(0, 6);
  const supportChoices = ['adrenaline_vial', 'iron_bark', 'bacteria_card'];
  
  return {
    isBotDeck: true,
    creatures: botCreatures.map((c, i) => ({
      defId: c.id,
      skillWeights: [50, 30, 20] as [number, number, number],
      talentIds: ['iron_will', 'regeneration'] as [string | null, string | null],
      // Bot now uses unique support cards, max 3 per deck
      supportCardId: i < 3 ? supportChoices[i] : null,
    })),
  };
}

export function setupSocketHandlers(io: Server): void {
  const matchmaking = new Matchmaking();
  const roomManager = new RoomManager(io);

  // Periodic PvP matchmaking
  setInterval(() => {
    const match = matchmaking.findMatch();
    if (match) {
      const [p1, p2] = match;
      const roomId = `room_${uuid().slice(0, 8)}`;

      const engine = roomManager.createRoom(roomId,
        { id: p1.playerId, name: p1.playerName, socketId: p1.socketId, deck: p1.deck },
        { id: p2.playerId, name: p2.playerName, socketId: p2.socketId, deck: p2.deck },
        onGameEnd(roomId, roomManager, io)
      );

      const p1Socket = io.sockets.sockets.get(p1.socketId);
      const p2Socket = io.sockets.sockets.get(p2.socketId);
      if (p1Socket) p1Socket.join(roomId);
      if (p2Socket) p2Socket.join(roomId);

      io.to(p1.socketId).emit('match_found', { roomId, opponentName: p2.playerName, yourId: p1.playerId });
      io.to(p2.socketId).emit('match_found', { roomId, opponentName: p1.playerName, yourId: p2.playerId });

      setTimeout(() => engine.start(), 2000);
    }
  }, 1000);

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // ---- Profile ----
    socket.on('get_profile', (data: { playerId: string; playerName: string }, callback) => {
      const profile = getOrCreatePlayer(data.playerId, data.playerName);
      if (callback) callback(profile);
    });

    // ---- Game Data ----
    socket.on('get_game_data', (_, callback) => {
      if (callback) {
        callback({
          creatures: CREATURES,
          skills: SKILLS,
          talents: TALENTS,
          supportCards: SUPPORT_CARDS,
        });
      }
    });

    // ---- PvP Matchmaking ----
    socket.on('join_queue', (data: JoinQueuePayload) => {
      if (!data.deck || !data.deck.creatures || data.deck.creatures.length < 6) {
        socket.emit('error', { message: 'Invalid deck: need exactly 6 creatures' });
        return;
      }
      console.log(`[Matchmaking] ${data.playerName} joined PvP queue`);
      matchmaking.addToQueue(data.playerId, data.playerName, socket.id, data.deck,
        getOrCreatePlayer(data.playerId, data.playerName).rating);
      socket.emit('queue_joined', { position: matchmaking.getQueueSize() });
    });

    socket.on('leave_queue', (data: { playerId: string }) => {
      matchmaking.removeFromQueue(data.playerId);
      socket.emit('queue_left');
    });

    // ---- VS Bot ----
    socket.on('join_bot', (data: JoinBotPayload) => {
      if (!data.deck || !data.deck.creatures || data.deck.creatures.length < 6) {
        socket.emit('error', { message: 'Invalid deck: need exactly 6 creatures' });
        return;
      }

      console.log(`[Bot] ${data.playerName} started a bot match`);

      const roomId = `bot_${uuid().slice(0, 8)}`;
      const botId = `bot_${uuid().slice(0, 6)}`;
      const botDeck = buildBotDeck();

      const engine = roomManager.createRoom(roomId,
        { id: data.playerId, name: data.playerName, socketId: socket.id, deck: data.deck },
        { id: botId, name: '🤖 Primal Bot', socketId: 'bot_socket', deck: botDeck },
        onGameEnd(roomId, roomManager, io)
      );

      socket.join(roomId);

      socket.emit('match_found', { roomId, opponentName: '🤖 Primal Bot', yourId: data.playerId, isBot: true });

      setTimeout(() => engine.start(), 1500);
    });

    // ---- Gacha ----
    socket.on('open_box', (data: { playerId: string; boxType: string }, callback) => {
      console.log(`[Socket] open_box received from ${data.playerId} for ${data.boxType}`);
      try {
        const player = ProfileRegistry.get(data.playerId);
        if (!player) {
          if (callback) callback({ success: false, message: 'Player profile not found. Please refresh.' });
          return;
        }
        
        const reward = GachaSystem.openLootBox(player, data.boxType);
        // Logic for item processing and array safety checks
        // (Implementation details handled by GachaSystem logic)
        ProfileRegistry.save(player);
        
        if (callback) callback({ success: true, reward, player });
      } catch (err: any) {
        if (callback) callback({ success: false, message: err.message });
      }
    });

    // ---- Disconnect ----
    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
      matchmaking.removeBySocketId(socket.id);
      roomManager.handleDisconnect(socket.id);
    });
  });
}

function onGameEnd(roomId: string, roomManager: RoomManager, io: Server) {
  return (winnerId: string, results: { [pid: string]: { essence: number; xp: number } }) => {
    for (const pid of Object.keys(results)) {
      if (pid.startsWith('bot_')) continue; // skip bot profile updates
      const profile = ProfileRegistry.get(pid);
      if (!profile) continue;
      const reward = results[pid];
      profile.essence += reward.essence;
      
      if (pid === winnerId) {
        profile.totalWins++;
        profile.wins++;
        profile.rating += 25;
      } else {
        profile.totalLosses++;
        profile.losses++;
        profile.rating = Math.max(100, profile.rating - 15);
      }
      
      const oldXp = profile.experience;
      profile.experience += reward.xp;
      
      // Check Primal Road milestones
      const roadUnlocks = checkProgression(profile, oldXp, profile.experience);
      if (roadUnlocks.length > 0) {
        io.to(pid).emit('road_unlock', { rewards: roadUnlocks, profile });
      }

      if (profile.experience >= profile.level * 500) profile.level++;
      ProfileRegistry.save(profile);
    }

    setTimeout(() => roomManager.cleanupRoom(roomId), 30000);
  };
}
