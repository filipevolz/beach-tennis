# Beach Tennis Matchmaking and Venue Booking PRD

## Overview

This product helps beach tennis players find partners and opponents for doubles and singles matches while helping arenas and clubs fill open court slots. It is designed for two primary groups: players who struggle to organize games consistently, and venues that want more court utilization without relying on fragmented messaging channels. The value of the product is simple: it connects demand and supply in one place, making it easier to discover people, places, and available times for play.

## Goals

- Launch an MVP that supports both sides of the marketplace from day one: players and venues.
- Enable players to find compatible partners and opponents in their area without depending on private messaging groups.
- Enable arenas and clubs to publish available courts and times in a way that drives more bookings and better occupancy.
- Achieve balanced early growth between active players and active venues during the first three months.
- Validate that users can move from discovery to confirmed match participation in a repeatable flow.

## User Stories

- As a player, I want to find nearby matches that need more people so that I can play without organizing everything myself.
- As a player, I want to find partners and opponents by skill level so that matches feel competitive and enjoyable.
- As a player, I want to choose between doubles and singles opportunities so that I can join the format I prefer.
- As a player, I want to create or join an open match so that I can quickly gather the right number of players.
- As an arena or club manager, I want to publish available courts and times so that I can fill unused inventory.
- As an arena or club manager, I want players to discover and book available slots through a simple flow so that my staff spends less time coordinating manually.
- As an arena or club manager, I want visibility into which published times attract demand so that I can improve scheduling and promotions.

## Core Features

- Venue listing and availability publishing
  Venues can create profiles, list their location, and publish court availability by time slot. This is the supply foundation of the marketplace.

- Match discovery
  Players can browse available matches and open spots using filters such as location, game format, and player level. This is the main discovery loop for demand.

- Open match creation and joining
  Players can create a match request or join a partially filled match. A match can be structured for singles or doubles, with visible open spots and participation status.

- Partner and opponent matching
  Players can discover other players who fit their preferred level and match intent. The product should make it easy to understand whether someone is seeking a partner, an opponent, or a full match.

- Booking flow tied to venue availability
  A player or match organizer can confirm participation in a venue time slot that has been published by an arena or club. The flow should reduce back-and-forth coordination.

- Basic trust and clarity signals
  Player profiles should communicate enough context to support confident joining decisions, including playing level and location. Venue profiles should clearly present court details and scheduling context.

## User Experience

The primary journey starts with either a player looking for a game or a venue publishing availability. A player should be able to open the product, choose singles or doubles, view available matches or open slots nearby, and quickly see whether a partner, opponent, or full group is still needed. The experience should reduce uncertainty and make open opportunities obvious.

For venues, the core flow should be lightweight: create a profile, publish available court times, and expose those opportunities to players in a discoverable format. Venue-side effort must remain low or supply will not grow.

The experience should feel reliable and easy to scan on mobile, since many users will make decisions in real time. The product should avoid forcing users into complex setup before they can see useful opportunities. Accessibility should include clear labels, readable booking states, and simple status communication for open spots and confirmed participation.

## Non-Goals (Out of Scope)

- Tournament management
- Coaching marketplaces
- Membership billing or full club management software
- Advanced ranking systems
- In-app chat with broad social networking features
- Complex dynamic pricing or revenue optimization tools for venues
- Support for sports beyond beach tennis in the MVP

## Phased Rollout Plan

### MVP (Phase 1)

- Venue and club profiles
- Court availability publishing
- Player profiles with level and location
- Discovery of matches and open slots
- Open match creation and joining for singles and doubles
- Basic booking confirmation flow

Success criteria to proceed to Phase 2:
- Balanced growth in active players and active venues
- Repeat usage from both sides
- Evidence that users complete the journey from discovery to confirmed participation

### Phase 2

- Better match quality controls based on preferences and play context
- Waitlists or replacement flows for open spots
- Venue-side insights into slot performance
- Stronger onboarding for player intent, such as partner-seeking versus opponent-seeking

Success criteria to proceed to Phase 3:
- Improved fill rates for venue-published slots
- Higher repeat booking and match participation rates
- Reduced friction reported by both players and venues

### Phase 3

- Expanded retention features
- Richer venue merchandising and promotional options
- Community and loyalty features if they support repeat play
- Broader optimization of marketplace liquidity by region and time

Long-term success criteria:
- Sustainable two-sided marketplace growth
- Consistent venue utilization uplift
- Reliable player retention driven by successful match outcomes

## Success Metrics

- Number of active players per month
- Number of active venues per month
- Growth rate of both sides of the marketplace during the first three months
- Number of matches created
- Number of match spots filled
- Number of confirmed bookings tied to published venue availability
- Repeat participation rate for players
- Repeat publishing rate for venues
- Share of published time slots that lead to player participation

## Risks and Mitigations

- Cold-start marketplace risk
  Mitigation: focus launch on a limited geography or concentrated community where supply and demand can be activated together.

- Poor match quality due to unclear expectations
  Mitigation: make skill level, format, and participation intent visible before joining.

- Venue-side friction in publishing availability
  Mitigation: keep venue setup and slot publishing lightweight in the MVP.

- User confusion between booking a court and joining an existing match
  Mitigation: present clear distinctions between open matches, open spots, and venue time slots.

- Over-scoping the MVP
  Mitigation: keep the first release focused on discovery, joining, and booking rather than broader social or club-management capabilities.

## Architecture Decision Records

- [ADR-001: Balanced Marketplace MVP Centered on Open Match Participation](adrs/adr-001.md) — The MVP will serve both venues and players from day one, with open match participation as the core marketplace interaction.

## Open Questions

- Should venues be able to publish open slots only, or also host venue-created matches in the MVP?
- What minimum player profile information is needed to make joining decisions feel safe and credible?
- Should the MVP support private match organization between known players, or only open discovery flows?
- What geographic launch scope gives the marketplace the best chance of balanced early liquidity?
