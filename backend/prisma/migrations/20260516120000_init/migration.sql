-- CreateExtension
CREATE EXTENSION IF NOT EXISTS postgis;

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('player', 'venue_manager');
CREATE TYPE "SkillLevel" AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE "AvailabilitySlotStatus" AS ENUM ('available', 'reserved', 'cancelled');
CREATE TYPE "MatchFormat" AS ENUM ('singles', 'doubles');
CREATE TYPE "MatchVisibility" AS ENUM ('public', 'invite');
CREATE TYPE "MatchStatus" AS ENUM ('forming', 'open', 'ready_to_book', 'booked', 'cancelled');
CREATE TYPE "MatchSpotStatus" AS ENUM ('open', 'filled');
CREATE TYPE "BookingStatus" AS ENUM ('pending', 'confirmed', 'cancelled');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "player_profiles" (
    "user_id" UUID NOT NULL,
    "display_name" TEXT NOT NULL,
    "skill_level" "SkillLevel" NOT NULL,
    "bio" VARCHAR(280),
    "location" geography(Point, 4326),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_profiles_pkey" PRIMARY KEY ("user_id")
);

CREATE TABLE "venue_manager_profiles" (
    "user_id" UUID NOT NULL,
    "display_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venue_manager_profiles_pkey" PRIMARY KEY ("user_id")
);

CREATE TABLE "venues" (
    "id" UUID NOT NULL,
    "manager_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "description" TEXT,
    "location" geography(Point, 4326),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venues_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "courts" (
    "id" UUID NOT NULL,
    "venue_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "surface" TEXT,

    CONSTRAINT "courts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "availability_slots" (
    "id" UUID NOT NULL,
    "court_id" UUID NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "status" "AvailabilitySlotStatus" NOT NULL DEFAULT 'available',
    "price_cents" INTEGER,

    CONSTRAINT "availability_slots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "matches" (
    "id" UUID NOT NULL,
    "creator_id" UUID NOT NULL,
    "format" "MatchFormat" NOT NULL,
    "visibility" "MatchVisibility" NOT NULL,
    "invite_code" TEXT,
    "skill_level" "SkillLevel" NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'forming',
    "notes" TEXT,
    "location" geography(Point, 4326),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "match_spots" (
    "id" UUID NOT NULL,
    "match_id" UUID NOT NULL,
    "player_id" UUID,
    "status" "MatchSpotStatus" NOT NULL DEFAULT 'open',
    "position" INTEGER NOT NULL,

    CONSTRAINT "match_spots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bookings" (
    "id" UUID NOT NULL,
    "match_id" UUID NOT NULL,
    "availability_slot_id" UUID NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'pending',
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "matches_invite_code_key" ON "matches"("invite_code");
CREATE UNIQUE INDEX "bookings_availability_slot_id_key" ON "bookings"("availability_slot_id");
CREATE INDEX "availability_slots_status_starts_at_idx" ON "availability_slots"("status", "starts_at");

-- AddForeignKey
ALTER TABLE "player_profiles" ADD CONSTRAINT "player_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "venue_manager_profiles" ADD CONSTRAINT "venue_manager_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "venues" ADD CONSTRAINT "venues_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "courts" ADD CONSTRAINT "courts_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "availability_slots" ADD CONSTRAINT "availability_slots_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "courts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "matches" ADD CONSTRAINT "matches_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "match_spots" ADD CONSTRAINT "match_spots_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "match_spots" ADD CONSTRAINT "match_spots_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_availability_slot_id_fkey" FOREIGN KEY ("availability_slot_id") REFERENCES "availability_slots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Spatial indexes
CREATE INDEX "player_profiles_location_idx" ON "player_profiles" USING GIST ("location");
CREATE INDEX "venues_location_idx" ON "venues" USING GIST ("location");
CREATE INDEX "matches_location_idx" ON "matches" USING GIST ("location");
