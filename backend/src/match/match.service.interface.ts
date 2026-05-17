import { MatchFormat, MatchVisibility, SkillLevel } from '@prisma/client';
import { Paginated } from '../common/types/pagination';

export type { MatchFormat, MatchVisibility };
export type MatchStatus = 'forming' | 'open' | 'ready_to_book' | 'booked' | 'cancelled';

export interface CreateMatchInput {
  format: MatchFormat;
  visibility: MatchVisibility;
  skillLevel: SkillLevel;
  latitude: number;
  longitude: number;
  notes?: string;
}

export interface DiscoveryQuery {
  latitude: number;
  longitude: number;
  radiusKm: number;
  format?: MatchFormat;
  skillLevel?: SkillLevel;
  page?: number;
  pageSize?: number;
}

export interface MatchSpotDto {
  id: string;
  position: number;
  status: string;
  playerId: string | null;
}

export interface MatchDto {
  id: string;
  creatorId: string;
  format: MatchFormat;
  visibility: MatchVisibility;
  inviteCode: string | null;
  skillLevel: SkillLevel;
  status: MatchStatus;
  notes: string | null;
  location: { latitude: number; longitude: number } | null;
  spots: MatchSpotDto[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IMatchService {
  create(userId: string, input: CreateMatchInput): Promise<MatchDto>;
  findPublicNearby(query: DiscoveryQuery): Promise<Paginated<MatchDto>>;
  findByInviteCode(code: string): Promise<MatchDto>;
  findById(matchId: string): Promise<MatchDto>;
  joinSpot(matchId: string, userId: string): Promise<MatchSpotDto>;
  leaveSpot(matchId: string, userId: string): Promise<void>;
}
