// ==========================================
// ROOM MANAGER — Room lifecycle management
// ==========================================

import { Server } from 'socket.io';
import { GameEngine } from '../engine/GameEngine.js';
import { DeckConfig } from '../../../shared/types.js';

interface Room {
  id: string;
  engine: GameEngine;
  players: string[]; // playerIds
  socketIds: string[]; // socketIds
  createdAt: number;
  disconnectTimers: Map<string, ReturnType<typeof setTimeout>>;
}

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private playerRooms: Map<string, string> = new Map(); // playerId -> roomId
  private socketToPlayer: Map<string, string> = new Map(); // socketId -> playerId

  constructor(private io: Server) {}

  /**
   * Create a new room and start a game.
   */
  createRoom(
    roomId: string,
    player1: { id: string; name: string; socketId: string; deck: DeckConfig },
    player2: { id: string; name: string; socketId: string; deck: DeckConfig },
    onGameEnd?: (winnerId: string, results: { [pid: string]: { essence: number, xp: number } }) => void
  ): GameEngine {
    const engine = new GameEngine(this.io, roomId, player1, player2, onGameEnd);

    const room: Room = {
      id: roomId,
      engine,
      players: [player1.id, player2.id],
      socketIds: [player1.socketId, player2.socketId],
      createdAt: Date.now(),
      disconnectTimers: new Map(),
    };

    this.rooms.set(roomId, room);
    this.playerRooms.set(player1.id, roomId);
    this.playerRooms.set(player2.id, roomId);
    this.socketToPlayer.set(player1.socketId, player1.id);
    this.socketToPlayer.set(player2.socketId, player2.id);

    return engine;
  }

  /**
   * Get room by ID.
   */
  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * Get room by player ID.
   */
  getRoomByPlayer(playerId: string): Room | undefined {
    const roomId = this.playerRooms.get(playerId);
    if (!roomId) return undefined;
    return this.rooms.get(roomId);
  }

  /**
   * Get player ID from socket ID.
   */
  getPlayerBySocket(socketId: string): string | undefined {
    return this.socketToPlayer.get(socketId);
  }

  /**
   * Get engine for a player.
   */
  getEngineByPlayer(playerId: string): GameEngine | undefined {
    const room = this.getRoomByPlayer(playerId);
    return room?.engine;
  }

  /**
   * Handle player disconnect — start forfeit timer.
   */
  handleDisconnect(socketId: string): void {
    const playerId = this.socketToPlayer.get(socketId);
    if (!playerId) return;

    const room = this.getRoomByPlayer(playerId);
    if (!room) return;

    // Give 30 seconds to reconnect
    const timer = setTimeout(() => {
      // Player didn't reconnect — forfeit
      room.engine.forceEnd(playerId);
      this.cleanupRoom(room.id);
    }, 30000);

    room.disconnectTimers.set(playerId, timer);
  }

  /**
   * Handle player reconnect — cancel forfeit timer.
   */
  handleReconnect(playerId: string, newSocketId: string): GameEngine | undefined {
    const room = this.getRoomByPlayer(playerId);
    if (!room) return undefined;

    // Cancel forfeit timer
    const timer = room.disconnectTimers.get(playerId);
    if (timer) {
      clearTimeout(timer);
      room.disconnectTimers.delete(playerId);
    }

    // Update socket mapping
    this.socketToPlayer.delete(room.socketIds[room.players.indexOf(playerId)]);
    this.socketToPlayer.set(newSocketId, playerId);
    room.socketIds[room.players.indexOf(playerId)] = newSocketId;

    return room.engine;
  }

  /**
   * Clean up a room after game ends.
   */
  cleanupRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.engine.stop();

    // Clear all timers
    for (const timer of room.disconnectTimers.values()) {
      clearTimeout(timer);
    }

    // Clean up mappings
    for (const playerId of room.players) {
      this.playerRooms.delete(playerId);
    }
    for (const socketId of room.socketIds) {
      this.socketToPlayer.delete(socketId);
    }

    this.rooms.delete(roomId);
  }

  /**
   * Get active room count.
   */
  getActiveRoomCount(): number {
    return this.rooms.size;
  }
}
