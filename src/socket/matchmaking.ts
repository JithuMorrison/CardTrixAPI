// ==========================================
// MATCHMAKING — Queue and match players
// ==========================================

import { DeckConfig } from '../../../shared/types.js';

interface QueueEntry {
  playerId: string;
  playerName: string;
  socketId: string;
  deck: DeckConfig;
  joinedAt: number;
  rating: number;
}

export class Matchmaking {
  private queue: QueueEntry[] = [];

  /**
   * Add a player to the matchmaking queue.
   */
  addToQueue(playerId: string, playerName: string, socketId: string, deck: DeckConfig, rating: number = 1000): void {
    // Remove if already in queue
    this.removeFromQueue(playerId);

    this.queue.push({
      playerId,
      playerName,
      socketId,
      deck,
      joinedAt: Date.now(),
      rating,
    });
  }

  /**
   * Remove a player from the queue.
   */
  removeFromQueue(playerId: string): void {
    this.queue = this.queue.filter(e => e.playerId !== playerId);
  }

  /**
   * Remove a player by socket ID.
   */
  removeBySocketId(socketId: string): void {
    this.queue = this.queue.filter(e => e.socketId !== socketId);
  }

  /**
   * Try to find a match. Returns a pair or null.
   */
  findMatch(): [QueueEntry, QueueEntry] | null {
    if (this.queue.length < 2) return null;

    // Simple: match first two in queue
    // Future: rating-based matching
    const p1 = this.queue[0];
    const p2 = this.queue[1];

    // Remove both from queue
    this.queue.splice(0, 2);

    return [p1, p2];
  }

  /**
   * Get queue size.
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Check if player is in queue.
   */
  isInQueue(playerId: string): boolean {
    return this.queue.some(e => e.playerId === playerId);
  }
}
