
# Customer Club & Shards Loyalty System

## Overview
Building a complete customer loyalty system called "Customer Club" where users earn "Shards" (points) from purchases and activities, then redeem them for rewards.

**Core Value Proposition:**
- 1000 Shards = 1 DKK value
- 1% of purchase value returned as Shards
- Daily login rewards
- Future: Social media engagement rewards
- Shards redeemable for store vouchers

---

## Phase 1: Authentication System

### User Authentication
- Email/password signup and login
- Email verification (standard flow)
- Password reset functionality
- Persistent sessions

### User Profiles
A `profiles` table linked to `auth.users` storing:
- Display name
- Avatar (optional)
- Created date
- Total purchases made

---

## Phase 2: Database Structure

### New Tables

```text
┌─────────────────────────────────────────────────────────────────┐
│                         profiles                                 │
├─────────────────────────────────────────────────────────────────┤
│ id (uuid, PK) → auth.users.id                                   │
│ display_name (text)                                             │
│ avatar_url (text, nullable)                                     │
│ total_purchases (numeric, default 0)                            │
│ created_at, updated_at                                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      shard_balances                              │
├─────────────────────────────────────────────────────────────────┤
│ user_id (uuid, PK) → profiles.id                                │
│ balance (integer, default 0) — current spendable shards         │
│ lifetime_earned (integer, default 0)                            │
│ lifetime_spent (integer, default 0)                             │
│ updated_at                                                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    shard_transactions                            │
├─────────────────────────────────────────────────────────────────┤
│ id (uuid, PK)                                                   │
│ user_id (uuid) → profiles.id                                    │
│ amount (integer) — positive = earned, negative = spent          │
│ type (text) — 'purchase', 'daily_login', 'redemption', etc.     │
│ description (text)                                              │
│ reference_id (text, nullable) — order ID, reward ID, etc.       │
│ created_at                                                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      daily_logins                                │
├─────────────────────────────────────────────────────────────────┤
│ id (uuid, PK)                                                   │
│ user_id (uuid) → profiles.id                                    │
│ login_date (date) — one entry per day per user                  │
│ streak_count (integer) — consecutive days                       │
│ shards_awarded (integer)                                        │
│ created_at                                                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      reward_items                                │
├─────────────────────────────────────────────────────────────────┤
│ id (uuid, PK)                                                   │
│ name (text)                                                     │
│ description (text)                                              │
│ type (text) — 'voucher', 'exclusive_item', etc.                 │
│ shard_cost (integer)                                            │
│ value_dkk (numeric, nullable) — for vouchers                    │
│ stock (integer, nullable) — null = unlimited                    │
│ image_url (text, nullable)                                      │
│ is_active (boolean, default true)                               │
│ created_at, updated_at                                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      user_rewards                                │
├─────────────────────────────────────────────────────────────────┤
│ id (uuid, PK)                                                   │
│ user_id (uuid) → profiles.id                                    │
│ reward_id (uuid) → reward_items.id                              │
│ shards_spent (integer)                                          │
│ voucher_code (text, nullable) — generated discount code         │
│ status (text) — 'active', 'used', 'expired'                     │
│ used_at (timestamp, nullable)                                   │
│ expires_at (timestamp, nullable)                                │
│ created_at                                                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                 shard_earning_rules                              │
├─────────────────────────────────────────────────────────────────┤
│ id (uuid, PK)                                                   │
│ action_type (text) — 'purchase', 'daily_login', 'streak_bonus'  │
│ base_shards (integer) — fixed amount OR null if percentage      │
│ percentage (numeric, nullable) — e.g., 1.0 for 1%               │
│ streak_multiplier (numeric, nullable) — bonus per streak day    │
│ max_shards (integer, nullable) — cap per action                 │
│ is_active (boolean)                                             │
│ created_at, updated_at                                          │
└─────────────────────────────────────────────────────────────────┘
```

### Row-Level Security (RLS)
- Users can only read/update their own profile
- Users can only read their own shard balance and transactions
- Users can only read their own rewards
- Reward items are publicly readable
- Admin-only tables for managing rewards and rules

---

## Phase 3: Shard Earning Logic

### 1. Purchase Rewards
When an order is paid (via Shopify webhook):
- Calculate 1% of order value in DKK
- Convert to shards (× 1000)
- Example: 299 DKK purchase → 299 × 0.01 × 1000 = 2,990 shards

**Implementation:** Modify `shopify-order-webhook` to:
1. Look up user by email
2. Award shards if user has an account
3. Record transaction

### 2. Daily Login Rewards
Base rewards with streak bonuses:
- Day 1: 50 shards
- Day 2: 75 shards
- Day 3: 100 shards
- Day 4: 125 shards
- Day 5: 150 shards
- Day 6: 175 shards
- Day 7+: 200 shards + 25 extra per week

**Implementation:** 
- Backend function checks last login date
- Awards shards if no entry for today
- Tracks streak (resets if >24h gap)

### 3. Future Earning Methods (Prepared)
- Social media follows
- Product reviews
- Referrals
- Special events/promotions

---

## Phase 4: Shard Redemption

### Voucher System
- Pre-configured voucher tiers (e.g., 50 DKK, 100 DKK, 200 DKK)
- Shard cost = value × 1000 (e.g., 50 DKK = 50,000 shards)
- Generate unique discount codes via Shopify API
- Codes have expiration dates

### Redemption Flow
1. User browses reward shop
2. Selects a voucher
3. Backend verifies sufficient balance
4. Deducts shards atomically
5. Creates Shopify discount code
6. Returns code to user

---

## Phase 5: User Interface

### New Pages & Components

**Authentication:**
- `/login` - Login page
- `/signup` - Registration page
- `/forgot-password` - Password reset
- Auth modal option in header

**Customer Club:**
- `/club` - Main loyalty dashboard
  - Shard balance display
  - Recent transactions
  - Streak tracker
  - Quick access to rewards

- `/club/rewards` - Reward shop
  - Available vouchers/rewards
  - Shard costs
  - Redemption button

- `/club/history` - Transaction history
  - All shard earnings/spending
  - Filters by type

**Header Updates:**
- User icon → opens auth modal or profile dropdown
- Show shard balance when logged in
- Visual streak indicator

**Mobile Navigation:**
- Add "Club" tab with shard icon
- Badge showing balance

---

## Phase 6: Admin Panel

### New Admin Tab: "Customer Club"

**Shards Overview:**
- Total shards in circulation
- Total shards awarded vs redeemed
- Active users count

**Reward Management:**
- Create/edit reward items
- Set shard costs
- Enable/disable rewards
- View redemption stats

**Earning Rules:**
- Configure purchase percentage
- Set daily login rewards
- Manage streak bonuses

---

## Technical Details

### Database Triggers
```text
1. on_auth_user_created → auto-create profile + shard_balance
2. on_shard_transaction_insert → update shard_balance atomically
```

### Backend Functions (Edge Functions)
```text
1. claim-daily-shards
   - Validate user session
   - Check last claim date
   - Calculate streak
   - Award shards
   - Return new balance + streak info

2. redeem-reward
   - Validate user + balance
   - Check reward availability
   - Deduct shards (atomic)
   - Generate voucher code
   - Create user_reward entry
   - Return voucher details

3. award-purchase-shards (internal)
   - Called from shopify-order-webhook
   - Matches email to user
   - Calculates + awards shards
```

### Security Considerations
- All shard modifications through backend functions
- Atomic balance updates to prevent race conditions
- Admin role required for reward/rule management
- RLS policies prevent unauthorized access

---

## Implementation Order

1. **Database Setup**
   - Create all tables with RLS
   - Add triggers for auto-creation
   - Seed initial reward items

2. **Authentication**
   - Auth pages (login, signup, forgot-password)
   - Auth context/provider
   - Protected route wrapper
   - Header integration

3. **Core Shard System**
   - Edge function: claim-daily-shards
   - Edge function: redeem-reward
   - Modify shopify-order-webhook for purchase shards

4. **Customer Club UI**
   - Dashboard page with balance/streak
   - Reward shop with redemption
   - Transaction history

5. **Admin Panel**
   - Customer Club tab
   - Reward management
   - Analytics overview

---

## Estimated Effort
- Database + Auth: Medium
- Backend Functions: Medium
- UI Components: Medium-High
- Admin Panel: Medium
- Testing & Polish: Medium

This creates a solid foundation that can easily expand with:
- Social media integrations
- Tiered membership levels
- Exclusive products
- Referral system
- Gamification elements
