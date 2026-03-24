# The Field-Touch Interface — Helper Page Structural Sketch

> A **touch-first, outdoor-optimized** helper interface for tablets and phones.
> Designed for sunlight readability, one-handed use, and participants arriving
> in unpredictable order at the 3-jump pit, throwing field, or finish line.

---

## Design Philosophy

Every other design in this project uses a **table**. The Field-Touch Interface
has **no table at all**. Instead:

- **Participant Cards** — large, tappable tiles arranged in a scrollable vertical
  stack. Each card is a self-contained unit: name, attempts, status — all visible
  without expanding or drilling in.
- **Bottom-anchored action zone** — all primary actions live within thumb reach at
  the bottom of the screen. The topbar is minimal and read-only.
- **High-contrast, sunlight mode by default** — black text on stark white cards,
  thick borders, oversized status icons. No subtle tints, no thin lines, no
  micro-dots. Everything is visible at arm's length in direct sunlight.
- **Full-screen takeover modes** — Timer and Quick-Add are not small widgets
  embedded in a bar. They take over the entire screen when activated, because
  outdoors you need giant touch targets and zero distraction.

| Aspect | Data-Grid | helper-mockup | **Field-Touch** |
|---|---|---|---|
| Core unit | Table cell | Table row | **Card tile** |
| Input method | Keyboard + arrow keys | Click input fields | **Tap card → inline numpad** |
| Timer | Inline in command bar | Button → modal | **Full-screen overlay** |
| Search | `/` key live-filter | Footer input field | **Sticky bottom sheet with recent + fuzzy match** |
| Status indicators | Cell tint + micro-dot | Small colored dots | **Large badge icons (48px)** |
| Density | ~25 rows at 1080p | ~8 rows at 1080p | **~5-6 cards on tablet, ~3 on phone** |
| Orientation | Landscape only | Any | **Portrait-first** |

---

## Layout Overview — Portrait Tablet (768×1024)

```
┌───────────────────────────────────┐
│  STATUS BAR (fixed, 48px)         │
│  3-Jump  ·  Klasse 5a  ·  ⊘ OFF  │
└───────────────────────────────────┘

┌───────────────────────────────────┐
│                                   │
│  ┌─────────────────────────────┐  │
│  │  PARTICIPANT CARD            │  │
│  │  #07  Weber, Clara           │  │
│  │  ┌───────────┬────────────┐  │  │
│  │  │ Try 1     │ Try 2      │  │  │
│  │  │  5.42 m   │  ── ──     │  │  │
│  │  │  [☁✓]     │  [ ]       │  │  │
│  │  └───────────┴────────────┘  │  │
│  └─────────────────────────────┘  │
│                                   │
│  ┌─────────────────────────────┐  │
│  │  PARTICIPANT CARD            │  │
│  │  #12  Müller, Anna           │  │
│  │  ┌───────────┬────────────┐  │  │
│  │  │ Try 1     │ Try 2      │  │  │
│  │  │  4.88 m   │  5.10 m ★  │  │  │
│  │  │  [☁✓]     │  [☁✓]      │  │  │
│  │  └───────────┴────────────┘  │  │
│  │           COMPLETE ✅         │  │
│  └─────────────────────────────┘  │
│                                   │
│  ┌─────────────────────────────┐  │
│  │  PARTICIPANT CARD            │  │
│  │  #03  Schmidt, Ben           │  │
│  │  ┌───────────┬────────────┐  │  │
│  │  │ Try 1     │ Try 2      │  │  │
│  │  │  ── ──    │  ── ──     │  │  │
│  │  │  [ ]      │  [ ]       │  │  │
│  │  └───────────┴────────────┘  │  │
│  └─────────────────────────────┘  │
│                                   │
│         (scroll for more)         │
│                                   │
└───────────────────────────────────┘

┌───────────────────────────────────┐
│  ACTION ZONE (fixed, 120px)       │
│                                   │
│  ┌──────────┐  ┌───────────────┐  │
│  │  🔍 FIND │  │  ⏱ TIMER      │  │
│  └──────────┘  └───────────────┘  │
│  ┌──────────┐  ┌───────────────┐  │
│  │  ↕ SORT  │  │  ☁ SYNC (3)   │  │
│  └──────────┘  └───────────────┘  │
│                                   │
└───────────────────────────────────┘
```

---

## Status Bar — The Minimal Topbar

A fixed, **read-only** strip. No interactive controls — discipline and class are
selected on a **setup screen** before entering the card view, not from dropdowns
mid-flow (to prevent accidental taps while outdoors).

```
  3-Jump  ·  Klasse 5a  ·  ☁✓ online       ← normal state
  3-Jump  ·  Klasse 5a  ·  ⊘ OFFLINE        ← offline state (bold red text)
```

### Three elements:
1. **Discipline name** — plain text, no dropdown.
2. **Class name** — plain text, no dropdown.
3. **Connection indicator** — large enough to read at a glance:
   - `☁✓` green text = online, sync active.
   - `⊘ OFFLINE` red bold text = no connection. All saves are local-only.

To **change** discipline or class, the helper taps and holds the status bar for
1 second → a full-screen selector appears (large list, big tap targets).
This prevents accidental switches.

---

## Participant Cards — The Core Unit

Each card is a **rounded rectangle** with a **4px left border** that encodes
overall status at a glance. Cards are vertically stacked, full-width, with
**16px vertical gap** between them.

### Card Anatomy

```
┌─ 4px status border ──────────────────────────────────┐
│                                                       │
│  #07  Weber, Clara                            [i]     │
│  ─────────────────────────────────────────────        │
│  ┌─────────────────┐    ┌─────────────────┐           │
│  │   Try 1          │    │   Try 2          │          │
│  │                  │    │                  │          │
│  │    5.42 m        │    │    ── ──         │          │
│  │                  │    │                  │          │
│  │   [💾 saved]     │    │   [  empty  ]    │          │
│  └─────────────────┘    └─────────────────┘           │
│                                                       │
└───────────────────────────────────────────────────────┘
```

### Left Border — Row-Level Status (visible from distance)

| Border color | Meaning |
|---|---|
| **Gray** (4px, muted) | No data entered yet |
| **Blue** (4px, solid) | At least one value saved locally, not yet synced |
| **Green** (4px, solid) | All fields synced to cloud |
| **Red** (4px, solid) | Validation error in at least one field |
| **Gold pulsing** (4px, animated) | Sync conflict detected |

### Card Header

- **ID** in bold monospace: `#07`
- **Name, Vorname** in large text (18px on tablet, 16px on phone).
- **Info button** `[i]` — tapping shows a small tooltip with class level, gender,
  and any notes. Dismissed by tapping elsewhere.

### Attempt Boxes

Each attempt (Try 1, Try 2, etc.) is a **large tap target** (minimum 64px tall)
displayed as a sub-card within the participant card. The number of attempt boxes
adapts to the discipline:

| Discipline | Attempt boxes shown |
|---|---|
| 800m Run | 1 box: "Time" |
| 50m Sprint | 1 box: "Time" |
| 3-Jump | 2 boxes: "Try 1", "Try 2" (expandable if rules change) |
| Distance Throw | 2 boxes: "Try 1", "Try 2" (expandable if rules change) |

**Tapping an attempt box** opens the **Inline Numpad** (see Input section below).

### Per-Attempt Status Icons (48×48px, inside each attempt box)

These are **large, unambiguous icons** — not colored dots, not tints:

| Icon | Meaning |
|---|---|
| `[ ]` (empty outlined box) | No value entered |
| `💾` + "saved" label | Value saved to IndexedDB, not yet synced |
| `☁✓` + "synced" label | Value synchronized to central database |
| `⚡` + "conflict" label | Sync conflict — tap to resolve |

Each icon sits **below** the numeric value in the attempt box, so status and
data are never confused.

### Best Attempt Marker

For multi-attempt disciplines (3-Jump, Distance Throw), the **best valid attempt**
is marked with a `★` star next to the value. This is computed automatically and
updates live when a new attempt is entered.

```
  Try 1          Try 2
  4.88 m         5.10 m ★        ← Try 2 is better
  [☁✓]           [☁✓]
```

### Complete Badge

When all attempts for a participant are filled with valid values and synced,
a **full-width green banner** appears at the bottom of the card:

```
  ────────────────────────────────
          COMPLETE ✅
  ────────────────────────────────
```

---

## Input — The Inline Numpad

There is **no on-screen keyboard from the OS**. When a helper taps an attempt
box, a **custom numpad overlay** slides up from the bottom of the screen,
covering the Action Zone but **not** the card being edited:

```
┌───────────────────────────────────┐
│  PARTICIPANT CARD (highlighted)   │
│  #07 Weber, Clara                 │
│  [ Try 1: ▏5.4_ ]  [ Try 2 ]     │  ← active box has cursor
│                                   │
├───────────────────────────────────┤
│                                   │
│         ┌─────────────────┐       │
│         │   5.4_          │       │  ← large preview display
│         └─────────────────┘       │
│                                   │
│    ┌─────┐ ┌─────┐ ┌─────┐       │
│    │  1  │ │  2  │ │  3  │       │
│    ├─────┤ ├─────┤ ├─────┤       │
│    │  4  │ │  5  │ │  6  │       │
│    ├─────┤ ├─────┤ ├─────┤       │
│    │  7  │ │  8  │ │  9  │       │
│    ├─────┤ ├─────┤ ├─────┤       │
│    │  .  │ │  0  │ │  ⌫  │       │
│    └─────┘ └─────┘ └─────┘       │
│                                   │
│  ┌──────────┐    ┌────────────┐   │
│  │  CANCEL  │    │  CONFIRM ✓ │   │
│  └──────────┘    └────────────┘   │
│                                   │
└───────────────────────────────────┘
```

### Numpad Behavior

- **Large buttons** (minimum 56×56px) — usable with gloves or wet fingers.
- **Preview display** at the top shows the value being entered in large (28px) text.
- **CONFIRM** saves the value to IndexedDB immediately, closes the numpad, and
  **auto-advances** to the next empty attempt box:
  - For 3-Jump / Distance Throw: advances to Try 2 of the **same participant**.
    If Try 2 is already filled, advances to Try 1 of the **next unfilled participant**.
  - For 800m / 50m: advances to the Time box of the **next unfilled participant**
    (vertical flow — participants arriving one by one after a race).
- **CANCEL** discards the entry and closes the numpad.
- **⌫ (backspace)** deletes the last digit.
- The `.` key is disabled after one decimal point is entered.
- Input is validated on CONFIRM: negative or zero values are rejected with a
  brief red flash of the preview display and an error vibration (haptic feedback).

### Auto-Advance Flow Visualization

**3-Jump, participant #07:**
```
  Tap Try 1 → enter 5.42 → CONFIRM
      ↓ auto-opens Try 2 of #07
  Enter 5.10 → CONFIRM
      ↓ auto-opens Try 1 of next unfilled participant
```

**50m Sprint, race just ended:**
```
  Tap Time of #07 → enter 8.21 → CONFIRM
      ↓ auto-opens Time of next unfilled participant
  Enter 7.94 → CONFIRM
      ↓ auto-opens Time of next unfilled participant
  (continue until all arrivals are entered)
```

---

## Quick Find — Bottom Sheet Search

When the helper taps **🔍 FIND** in the Action Zone, a **bottom sheet** slides up
covering the lower 60% of the screen:

```
┌───────────────────────────────────┐
│  (top 40% — cards still visible,  │
│   dimmed, non-interactive)        │
├───────────────────────────────────┤
│                                   │
│  ┌─────────────────────────────┐  │
│  │  🔍  Search by name or ID…  │  │  ← auto-focused, OS keyboard opens
│  └─────────────────────────────┘  │
│                                   │
│  RECENT (last 5 participants      │
│          you entered data for):   │
│                                   │
│  ┌─────────────────────────────┐  │
│  │  #12  Müller, Anna    ☁✓    │  │  ← tap to scroll to her card
│  ├─────────────────────────────┤  │
│  │  #07  Weber, Clara    💾    │  │
│  ├─────────────────────────────┤  │
│  │  #19  Fischer, David  💾    │  │
│  └─────────────────────────────┘  │
│                                   │
│  UNFILLED (participants with      │
│            empty attempts):       │
│                                   │
│  ┌─────────────────────────────┐  │
│  │  #03  Schmidt, Ben    [ ]   │  │
│  ├─────────────────────────────┤  │
│  │  #08  Klein, Eva      [ ]   │  │
│  ├─────────────────────────────┤  │
│  │  #21  Braun, Felix    [ ]   │  │
│  │  ...                        │  │
│  └─────────────────────────────┘  │
│                                   │
└───────────────────────────────────┘
```

### Search Behavior

1. **Immediate results** — Before typing, the sheet shows two pre-built lists:
   - **Recent**: Last 5 participants the helper interacted with (most useful for
     "who just walked up that I need to correct?").
   - **Unfilled**: All participants with at least one empty attempt, sorted by ID.
2. **Fuzzy match** — As the helper types, both lists filter live. Typing `web`
   shows `Weber, Clara`. Typing `07` shows participant `#07`. Matching is
   case-insensitive and works on ID, last name, or first name.
3. **Tap to jump** — Tapping a result row closes the bottom sheet, scrolls the
   card list to that participant, and **briefly highlights the card** with a
   yellow pulse border (1 second).
4. **Tap to jump + input** — Long-pressing a result row jumps to the card **and**
   immediately opens the numpad on the first empty attempt box. This is the
   fastest path for "participant just arrived, enter their result."

### Scenario: Participant walks up to the 3-jump pit

1. Helper taps **🔍 FIND**.
2. Bottom sheet opens. Helper sees **Unfilled** list, spots participant by name → taps.
   *Or* types first few letters of name → fuzzy match → taps.
   *Or* participant tells helper their ID number → types `14` → exact match → taps.
3. Card list scrolls to participant. Card highlights yellow.
4. Helper taps **Try 1** box on the card. Numpad opens.
5. Participant jumps. Helper enters `5.42`, taps **CONFIRM**.
6. Numpad auto-advances to Try 2. Participant jumps again. Enter `5.10`, **CONFIRM**.
7. Card shows `★` on better attempt, status icons update to `💾 saved`.
8. Helper is ready for the next participant.

---

## Card Sorting — The SORT Button

Tapping **↕ SORT** in the Action Zone cycles through three modes. The currently
active mode is shown as a label on the button itself:

| Mode | Button label | Behavior |
|---|---|---|
| **By ID** (default) | `↕ SORT: ID` | Ascending participant number |
| **Unfilled first** | `↕ SORT: TODO` | Cards with empty attempts float to top; filled cards sink to bottom (dimmed slightly) |
| **Recently edited** | `↕ SORT: RECENT` | Last-edited cards at top (most useful during active recording) |

When mode changes, the card list **animates** to the new order (cards slide into
position over 200ms) so the helper doesn't lose spatial context.

---

## Visual Cues — Invalid Attempts

Per the outline: invalid attempts (false starts, fouls) are not recorded. The
system allows unlimited retries until a valid attempt is made. The Field-Touch
Interface handles this as follows:

- There is **no "invalid" button** that saves an invalid marker. Since invalid
  attempts are not recorded per the outline, the helper simply does **not enter**
  a value for that attempt.
- If a helper accidentally enters a value for an invalid attempt, they can tap the
  attempt box and use the numpad's **dedicated CLEAR** action (long-press ⌫) to
  delete the value entirely. The attempt box returns to `[ ] empty` state.
- The card-level status border reverts accordingly (e.g., from green back to blue
  or gray).

### Visual Summary of All States on a Single Card

```
┌─ GREEN border ────────────────────────────────────────┐
│                                                       │
│  #12  Müller, Anna                                    │
│  ─────────────────────────────────────────────        │
│  ┌─────────────────┐    ┌─────────────────┐           │
│  │   Try 1          │    │   Try 2          │          │
│  │    4.88 m        │    │    5.10 m ★      │          │
│  │   [☁✓ synced]    │    │   [☁✓ synced]    │          │
│  └─────────────────┘    └─────────────────┘           │
│               COMPLETE ✅                              │
└───────────────────────────────────────────────────────┘

┌─ BLUE border ─────────────────────────────────────────┐
│                                                       │
│  #07  Weber, Clara                                    │
│  ─────────────────────────────────────────────        │
│  ┌─────────────────┐    ┌─────────────────┐           │
│  │   Try 1          │    │   Try 2          │          │
│  │    5.42 m        │    │    ── ──         │          │
│  │   [💾 saved]     │    │   [ empty ]      │          │
│  └─────────────────┘    └─────────────────┘           │
│                                                       │
└───────────────────────────────────────────────────────┘

┌─ GRAY border ─────────────────────────────────────────┐
│                                                       │
│  #03  Schmidt, Ben                                    │
│  ─────────────────────────────────────────────        │
│  ┌─────────────────┐    ┌─────────────────┐           │
│  │   Try 1          │    │   Try 2          │          │
│  │    ── ──         │    │    ── ──         │          │
│  │   [ empty ]      │    │   [ empty ]      │          │
│  └─────────────────┘    └─────────────────┘           │
│                                                       │
└───────────────────────────────────────────────────────┘

┌─ GOLD pulsing border ─────────────────────────────────┐
│                                                       │
│  #28  Zimmermann, Paul                                │
│  ─────────────────────────────────────────────        │
│  ┌─────────────────┐    ┌─────────────────┐           │
│  │   Try 1          │    │   Try 2          │          │
│  │    6.01 m        │    │    5.88 m ★      │          │
│  │   [⚡ conflict]   │    │   [☁✓ synced]    │          │
│  └─────────────────┘    └─────────────────┘           │
│  ⚠ Tap Try 1 to resolve conflict                      │
└───────────────────────────────────────────────────────┘
```

### Conflict Resolution (Inline, No Modal)

Tapping a conflicted attempt box (marked `⚡`) does **not** open the numpad.
Instead, a **resolution panel** replaces the attempt box content:

```
┌─────────────────────────────────────┐
│  ⚡ CONFLICT on Try 1                │
│                                     │
│  ┌───────────────┐ ┌─────────────┐  │
│  │ YOUR VALUE    │ │ SERVER VALUE│  │
│  │   6.01 m      │ │   5.98 m    │  │
│  │               │ │             │  │
│  │  [ KEEP ✓ ]   │ │ [ ACCEPT ✓]│  │
│  └───────────────┘ └─────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

One tap resolves it. The card border stops pulsing and updates to the correct
status color.

---

## Timer Mode — Full-Screen Takeover

Tapping **⏱ TIMER** in the Action Zone launches a **full-screen overlay** that
replaces the entire view. This is purpose-built for timed events (800m Run,
50m Sprint) where the helper needs to:

1. Start a shared timer when the race begins.
2. Record individual finish times as participants cross the line.

### Phase 1: Ready Screen

```
┌───────────────────────────────────┐
│                                   │
│                                   │
│                                   │
│            00:00.00               │  ← giant timer display (72px)
│                                   │
│                                   │
│    ┌─────────────────────────┐    │
│    │                         │    │
│    │       ▶  START          │    │  ← huge green button, 80px tall
│    │                         │    │
│    └─────────────────────────┘    │
│                                   │
│             [ ✕ EXIT ]            │  ← small, bottom corner
│                                   │
└───────────────────────────────────┘
```

### Phase 2: Running — Lap/Split Button Mode

After START, the screen transforms. The timer ticks live. Below it, a scrollable
list of participants appears as **large stop buttons**:

```
┌───────────────────────────────────┐
│                                   │
│          ● 02:14.38               │  ← giant ticking timer (red dot = live)
│                                   │
│  ┌─────────────────────────────┐  │
│  │  #07  Weber, Clara     TAP  │  │  ← 64px tall stop-button
│  ├─────────────────────────────┤  │
│  │  #12  Müller, Anna     TAP  │  │
│  ├─────────────────────────────┤  │
│  │  #03  Schmidt, Ben     TAP  │  │
│  ├─────────────────────────────┤  │
│  │  #19  Fischer, David   TAP  │  │
│  ├─────────────────────────────┤  │
│  │  ...                        │  │
│  └─────────────────────────────┘  │
│                                   │
│  ┌────────────┐  ┌────────────┐   │
│  │  ⏸ PAUSE   │  │  ■ STOP    │   │
│  └────────────┘  └────────────┘   │
│                                   │
└───────────────────────────────────┘
```

### Stop-Button Behavior

- When a participant crosses the finish line, the helper **taps their name**.
- The current timer value is stamped as their time.
- The button changes appearance immediately:

```
  BEFORE:  │  #07  Weber, Clara       TAP  │   (white bg, dark text)
  AFTER:   │  #07  Weber, Clara   08.21s ✓ │   (green bg, recorded time shown)
```

- Recorded participants **sink to the bottom** of the stop-button list so the helper
  always sees **unfinished runners** at the top — critical when participants are
  arriving in rapid succession at the 50m finish line.
- If the helper taps the **wrong participant**, they can tap the green row to
  **undo** (reverts to TAP state, clears the time). This must happen before the
  timer is stopped.

### Phase 3: Timer Stopped

After **■ STOP**:
- Timer freezes.
- All recorded times are displayed.
- Unrecorded participants are highlighted in red ("missed — enter manually").
- A **SAVE ALL** button saves all stamped times to IndexedDB at once.
- An **EXIT** button returns to the card view. Times appear in the
  corresponding participant cards with `💾 saved` status.

```
┌───────────────────────────────────┐
│                                   │
│          ■ 02:47.12  (stopped)    │
│                                   │
│  ┌─────────────────────────────┐  │
│  │  #07  Weber, Clara   08.21s │  │  ← green bg
│  ├─────────────────────────────┤  │
│  │  #12  Müller, Anna   08.44s │  │  ← green bg
│  ├─────────────────────────────┤  │
│  │  #03  Schmidt, Ben   MISSED │  │  ← red bg, needs manual entry
│  ├─────────────────────────────┤  │
│  │  #19  Fischer, David 09.02s │  │  ← green bg
│  └─────────────────────────────┘  │
│                                   │
│  Tap a MISSED row to enter time   │
│  manually, or correct any time.   │
│                                   │
│  ┌────────────┐  ┌────────────┐   │
│  │ SAVE ALL ✓ │  │   EXIT     │   │
│  └────────────┘  └────────────┘   │
│                                   │
└───────────────────────────────────┘
```

Tapping a **MISSED** row or any recorded row opens the inline numpad for manual
entry or correction.

---

## Sync Button — Action Zone

Tapping **☁ SYNC (3)** in the Action Zone does not open a modal. Instead, it:

1. Shows the count of pending entries on the button itself: `☁ SYNC (3)`.
2. Triggers an immediate sync attempt.
3. The count decrements live as entries sync: `☁ SYNC (2)` → `☁ SYNC (1)` → `☁ SYNC ✓`.
4. If offline, the button briefly pulses red and shows: `☁ SYNC (offline)`.

When all entries are synced, the button shows `☁ SYNC ✓` in green. This is the
resting state.

---

## Offline Behavior — Full Lifecycle

### On Page Load
1. Service Worker serves cached HTML/CSS/JS — page renders immediately even offline.
2. Discipline list, class list, and participant data are loaded from IndexedDB
   (preloaded during initial setup when online).
3. Any previously saved attempt values are restored into their cards.
4. Status bar shows `⊘ OFFLINE` or `☁✓ online` based on current connectivity.

### During Use (Offline)
- All CONFIRM actions in the numpad save to IndexedDB.
- Attempt box icons show `💾 saved` (never `☁✓ synced`).
- Card borders are blue (local data exists, not synced).
- SYNC button shows `☁ SYNC (N offline)` with the count growing.
- Timer mode works identically — times are saved locally.

### On Reconnection
- Sync resumes automatically in the background.
- `💾 saved` icons animate to `☁✓ synced` one by one as each entry succeeds.
- Card borders transition from blue to green.
- SYNC button count decrements to zero.
- Status bar transitions from `⊘ OFFLINE` to `☁✓ online` with a brief green
  flash.

### On Page Reload
- `beforeunload` listener warns if the numpad is open with unsaved digits.
- All confirmed values survive in IndexedDB — fully restored on reload.
- Selected discipline, class, sort mode, and timer state are restored from
  `localStorage`.

---

## Sunlight & Accessibility Optimizations

| Feature | Implementation |
|---|---|
| **High contrast** | Black text on white cards. No gray text anywhere. Status colors are bold primaries (blue, green, red, gold). |
| **Large touch targets** | Minimum 48×48px for all tappable elements. Numpad buttons 56×56px. Timer stop-buttons 64px tall. |
| **No hover states** | All interactions are tap/long-press only. No information hidden behind hover. |
| **Thick borders** | Card borders are 4px (not 1px hairlines). Clearly visible in direct sunlight. |
| **No transparency** | No frosted-glass, no semi-transparent overlays. All panels are opaque white. |
| **Haptic feedback** | Vibration on: CONFIRM, error rejection, conflict detected, sync complete. |
| **Landscape support** | On tablets, landscape mode shows cards in a 2-column grid instead of single-column stack, fitting ~8-10 cards. |
