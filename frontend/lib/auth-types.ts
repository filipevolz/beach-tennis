export type UserRole = 'player' | 'venue_manager';

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterPlayerInput {
  email: string;
  password: string;
  role: 'player';
  playerProfile: {
    displayName: string;
    skillLevel: SkillLevel;
    latitude: number;
    longitude: number;
    bio?: string;
  };
}

export interface RegisterVenueManagerInput {
  email: string;
  password: string;
  role: 'venue_manager';
  venueManagerProfile: {
    displayName: string;
  };
}

export type RegisterInput = RegisterPlayerInput | RegisterVenueManagerInput;
