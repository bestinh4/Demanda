/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum PlayerPosition {
  GOALKEEPER = 'Goleiro',
  DEFENDER = 'Defensor',
  MIDFIELDER = 'Meio-campista',
  FORWARD = 'Atacante',
}

export enum MatchStatus {
  SCHEDULED = 'Agendada',
  IN_PROGRESS = 'Em andamento',
  FINISHED = 'Finalizada',
  CANCELLED = 'Cancelada',
}

export interface Athlete {
  id: string;
  name: string;
  email: string;
  position: PlayerPosition;
  teamId?: string;
  stats: {
    goals: number;
    assists: number;
    matchesPlayed: number;
  };
  createdAt: number;
}

export interface Team {
  id: string;
  name: string;
  logoUrl?: string;
  coach: string;
  athletesIds: string[];
  stats: {
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
  };
  createdAt: number;
}

export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  date: number;
  status: MatchStatus;
  location: string;
  events: MatchEvent[];
  createdAt: number;
}

export interface MatchEvent {
  id: string;
  type: 'GOAL' | 'YELLOW_CARD' | 'RED_CARD' | 'SUBSTITUTION';
  minute: number;
  playerId: string;
  teamId: string;
  details?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'admin' | 'user';
  createdAt: number;
}
