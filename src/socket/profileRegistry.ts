// ==========================================
// PROFILE REGISTRY — Persistent data storage
// ==========================================

import fs from 'fs/promises';
import path from 'path';
import { PlayerProfile } from '../../../shared/types.js';

const DATA_FILE = path.resolve('players.json');

export class ProfileRegistry {
  private static players: Map<string, PlayerProfile> = new Map();

  /**
   * Initialize the registry by loading from disk.
   */
  static async init(): Promise<void> {
    try {
      const data = await fs.readFile(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      this.players = new Map(Object.entries(parsed));
      console.log(`[Registry] Loaded ${this.players.size} player profiles.`);
    } catch (error) {
      console.log('[Registry] No profiles found, starting fresh.');
      this.players = new Map();
    }
  }

  /**
   * Get a player by ID.
   */
  static get(id: string): PlayerProfile | undefined {
    return this.players.get(id);
  }

  /**
   * Save a profile and persist to disk.
   */
  static async save(profile: PlayerProfile): Promise<void> {
    this.players.set(profile.id, profile);
    await this.persist();
  }

  /**
   * Internal method to write to JSON file.
   */
  private static async persist(): Promise<void> {
    try {
      const obj = Object.fromEntries(this.players);
      await fs.writeFile(DATA_FILE, JSON.stringify(obj, null, 2));
    } catch (error) {
      console.error('[Registry] Error persisting data:', error);
    }
  }

  /**
   * Get all players.
   */
  static getAll(): PlayerProfile[] {
    return Array.from(this.players.values());
  }
}
