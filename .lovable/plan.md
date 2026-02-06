

# Plan: Fix Double-Deduction Bug & Create Immersive Casino Experience

## Part 1: Critical Bug Fix - Double Shard Deduction

### Root Cause Analysis
After investigating the transaction logs and backend code, I discovered the bug:

**The problem:** Both edge functions (`play-mines` and `play-dice`) are doing TWO things that each update the balance:
1. **Direct update** to `shard_balances` table (lines 166-173 in play-mines, lines 135-143 in play-dice)
2. **Insert into `shard_transactions`** which triggers the `handle_shard_transaction` database trigger that ALSO updates the balance

The database trigger automatically adds/subtracts from balance whenever a transaction is inserted:

```sql
UPDATE public.shard_balances
SET balance = balance + NEW.amount, ...
```

So when a 100 shard bet is placed:
- Edge function: `balance = currentBalance - 100` (first -100)
- Transaction insert triggers: `balance = balance + (-100)` (second -100)
- **Result: -200 shards deducted!**

### Fix Strategy
Remove the direct balance updates from edge functions and rely ONLY on the trigger-based system via `shard_transactions` inserts. This is cleaner, atomic, and consistent.

#### Files to Modify:
1. **`supabase/functions/play-mines/index.ts`**
   - Remove direct `shard_balances.update()` calls (lines 166-173, 318-325, 429-435)
   - Keep only `shard_transactions.insert()` calls (the trigger handles balance updates)
   - Update validation to re-fetch balance after inserting bet transaction

2. **`supabase/functions/play-dice/index.ts`**
   - Remove the single direct `shard_balances.update()` call (lines 135-143)
   - Keep only the `shard_transactions.insert()` calls

---

## Part 2: Transform Casino into an Immersive Experience

### Current State
- Single `/club/games` page with both Mines and Dice stacked
- Basic card containers for each game
- No visual hierarchy or casino atmosphere
- Mobile experience is identical to desktop

### Vision: Multi-Room Casino
Create an experience similar to entering an online casino with:
- **Casino Lobby** as the main hub
- **Individual game rooms** that feel focused and immersive
- **Premium visual theming** with dark, luxurious aesthetics
- **Live elements** showing other players' wins

### New Page Structure

```text
/club/casino          → Casino Lobby (new)
/club/casino/mines    → Mines Game Room (new)
/club/casino/dice     → Dice Game Room (new)
/club/casino/cases    → Cases Room (move existing)
```

### Implementation Details

#### 1. Casino Lobby Page (`src/pages/CasinoLobbyPage.tsx`)
- Animated mesh gradient background with dark purple/gold theme
- Large game selection cards with 3D tilt effects
- Live wins ticker across the top (shows "Player X won Y shards on Mines!")
- Balance prominently displayed with glow effect
- Category sections: "Sweepstake Games", "Loot Cases"
- Quick stats: Total wagered today, biggest win, etc.

#### 2. Mines Game Room (`src/pages/MinesRoomPage.tsx`)
- Full-screen immersive experience
- Animated background (subtle particle effects)
- Game history sidebar showing recent plays
- Sound toggle (visual only, for future)
- Back button to lobby

#### 3. Dice Game Room (`src/pages/DicesRoomPage.tsx`)
- Full-screen immersive experience  
- 3D dice visualization
- Animated roll history graph
- Hot/cold streak indicators
- Back button to lobby

#### 4. Update Navigation
- Change `/club/games` to redirect to `/club/casino`
- Update MobileClub.tsx to link to `/club/casino`
- Add casino room links to mobile navigation within casino

#### 5. New Components

| Component | Purpose |
|-----------|---------|
| `CasinoBackground.tsx` | Animated dark gradient with floating particles |
| `GameRoomCard.tsx` | 3D tilt card for lobby game selection |
| `LiveWinsTicker.tsx` | Scrolling ticker showing recent wins |
| `CasinoBalance.tsx` | Premium balance display with glow |
| `GameHistory.tsx` | Sidebar showing recent game results |

#### 6. Database Addition
- Query `game_sessions` table to power live wins feed
- Add win amount tracking for display purposes

### Visual Design Specifications

**Color Palette for Casino:**
- Background: Deep purple-black gradient (`#0a0612` → `#1a0a2e`)
- Accent: Gold/amber for wins (`#f59e0b`)
- Game accent: Different per game (Mines: emerald, Dice: blue)
- Card backgrounds: Dark glass with border glow

**Animations:**
- Entrance: Fade in with scale
- Game cards: 3D tilt on hover with light reflection
- Balance: Pulse glow on change
- Wins: Confetti burst on big wins

### Mobile-Specific Enhancements
- Full-screen game rooms with bottom sheet controls
- Swipe between lobby sections
- Haptic feedback on actions (visual cues for now)
- Bottom navigation within casino context

---

## Implementation Order

**Phase 1: Fix Critical Bug (Priority)**
1. Update `play-mines/index.ts` - remove direct balance updates
2. Update `play-dice/index.ts` - remove direct balance updates
3. Deploy and test thoroughly

**Phase 2: Casino Structure**
4. Create `CasinoLobbyPage.tsx` with basic structure
5. Create `MinesRoomPage.tsx` wrapping existing game
6. Create `DiceRoomPage.tsx` wrapping existing game
7. Update routing in `App.tsx`

**Phase 3: Visual Polish**
8. Create `CasinoBackground.tsx` component
9. Create `LiveWinsTicker.tsx` component
10. Add 3D game selection cards
11. Polish mobile experience

**Phase 4: Enhancements**
12. Add game history sidebars
13. Create statistics displays
14. Implement win celebrations

---

## Technical Notes

### Bug Fix Code Changes (play-mines)

Remove these direct balance update blocks:
```typescript
// REMOVE: Direct balance update on start
await supabaseAdmin
  .from("shard_balances")
  .update({
    balance: currentBalance - betAmount,
    lifetime_spent: ...
  })
  .eq("user_id", userId);

// KEEP: Transaction insert (trigger handles balance)
await supabaseAdmin.from("shard_transactions").insert({...});
```

For win/cashout scenarios, the transaction insert with positive amount will trigger the balance increase automatically.

### Route Updates (App.tsx)

```typescript
// New routes
<Route path="/club/casino" element={<CasinoLobbyPage />} />
<Route path="/club/casino/mines" element={<MinesRoomPage />} />
<Route path="/club/casino/dice" element={<DiceRoomPage />} />
<Route path="/club/casino/cases" element={<CasesRoomPage />} />

// Keep existing for backwards compatibility, redirect
<Route path="/club/games" element={<Navigate to="/club/casino" />} />
```

