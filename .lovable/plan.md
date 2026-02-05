
# Case/Box Opening Feature for Customer Club

## Overview
This feature allows users to open loot boxes/cases containing games using their Shards. Admins can create cases with configurable game drops and probabilities, and the system calculates a "fair price" based on a 10% house edge.

---

## Database Schema

### New Table: `shard_cases`
Stores case definitions created by admins.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Case name (e.g., "Premium Gaming Box") |
| description | text | Case description |
| image_url | text | Cover image for the case |
| calculated_price | integer | Auto-calculated price in Shards (with 10% house edge) |
| is_active | boolean | Whether case is available to users |
| display_order | integer | For sorting |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update time |

### New Table: `shard_case_items`
Stores items (games) that can be won from each case.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| case_id | uuid | Reference to shard_cases |
| kinguin_product_id | uuid | Reference to kinguin_products |
| drop_percentage | numeric | Probability of winning (0-100) |
| created_at | timestamp | Creation time |

### New Table: `shard_case_openings`
Records each case opening by users.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | User who opened the case |
| case_id | uuid | Which case was opened |
| won_item_id | uuid | Reference to case_items |
| shards_spent | integer | How many shards were spent |
| created_at | timestamp | When the case was opened |

---

## Price Calculation Formula

The "fair price" is calculated based on expected value with a 10% house edge:

```
Expected Value = Σ (item_sell_price × drop_percentage / 100)
Case Price = Expected Value × 1000 × 0.90  (convert to shards, apply 10% house edge)
```

Example:
- Item A: 200 DKK game, 5% drop = 10 DKK EV contribution
- Item B: 50 DKK game, 30% drop = 15 DKK EV contribution  
- Item C: 20 DKK game, 65% drop = 13 DKK EV contribution
- Total EV = 38 DKK
- Case Price = 38 × 1000 × 0.90 = 34,200 Shards

---

## Backend Edge Function: `open-case`

### Actions
1. **open** - Open a case and receive a random item
   - Validate user authentication
   - Check user has sufficient Shards
   - Deduct Shards from balance
   - Select random item based on weighted probabilities
   - Record the opening
   - Return won item details

### Security
- Server-side random selection (provably fair)
- Atomic balance updates via shard_transactions
- All logic runs on backend to prevent manipulation

---

## Admin Panel: Case Management

New section in admin panel under "Customer Club" tab:

### Case List View
- Table showing all cases with name, item count, calculated price, status
- Toggle active/inactive
- Edit and delete actions

### Case Editor Dialog
- Name, description, image URL fields
- Product search and add functionality
- For each item: display game info + percentage input
- Real-time price calculation display
- Percentage validation (must sum to 100%)

---

## User Interface: Case Opening Page

### Route: `/club/cases`

### Design Elements
- Premium card display for each available case
- Shows case image, name, and Shard cost
- "Open Case" button

### Opening Animation
A visually satisfying spinning wheel/roulette animation:
1. Show all possible items in a horizontal carousel
2. Items scroll rapidly, then slow down
3. Selected item highlights with glow effect
4. Celebration animation for wins
5. Display won item with "Claim" or view in inventory option

### Mobile Support
- Full-screen modal for case opening
- Touch-optimized animation
- Responsive layout matching existing mobile-first design

---

## Technical Implementation

### Files to Create

1. **Database Migration**
   - Create `shard_cases` table with RLS policies
   - Create `shard_case_items` table with RLS policies
   - Create `shard_case_openings` table with RLS policies

2. **Edge Function: `supabase/functions/open-case/index.ts`**
   - Handle case opening logic
   - Weighted random selection
   - Atomic balance updates

3. **Admin Component: `src/components/admin/CaseManagementSection.tsx`**
   - Case CRUD operations
   - Item management with percentage inputs
   - Price calculation display

4. **Hook: `src/hooks/useCases.ts`**
   - Fetch available cases
   - Open case mutation
   - Fetch user's won items

5. **User Page: `src/pages/CasesPage.tsx`**
   - Display available cases
   - Opening animation
   - Case history

6. **Animation Component: `src/components/games/CaseOpeningAnimation.tsx`**
   - Spinning wheel/roulette effect
   - Victory animations
   - Sound effects (optional)

### Files to Modify

1. **`src/App.tsx`** - Add route for `/club/cases`
2. **`src/pages/ClubPage.tsx`** - Add navigation link to cases
3. **`src/components/MobileClub.tsx`** - Add cases quick action
4. **`src/components/admin/CustomerClubTab.tsx`** - Add case management section
5. **`supabase/config.toml`** - Configure edge function

---

## RLS Policies

### shard_cases
- SELECT: Anyone can view active cases (`is_active = true`)
- ALL: Admins can manage (`has_role(auth.uid(), 'admin')`)

### shard_case_items
- SELECT: Anyone can view items for active cases
- ALL: Admins can manage

### shard_case_openings
- SELECT: Users can view their own openings (`auth.uid() = user_id`)
- SELECT: Admins can view all
- INSERT/UPDATE/DELETE: Not allowed from client (handled by edge function)

---

## User Flow

1. User navigates to Cases page from Club
2. Sees available cases with prices and previews
3. Clicks "Open Case" on desired case
4. Confirmation modal shows cost and possible items
5. User confirms and Shards are deducted
6. Spinning animation plays
7. Won item is revealed with celebration
8. Item is recorded in history
9. User can view their won items in their collection

---

## Visual Design Notes

Following the existing premium design system:
- `rounded-2xl` and `rounded-3xl` for cards
- Glassmorphism effects with `backdrop-blur`
- Success/accent color gradients
- Framer Motion for smooth animations
- Consistent with MinesGame and DiceGame styling
