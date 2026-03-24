# The Pipeline — Central Interface Structural Sketch (v4)

> A **Kanban-style pipeline board** where each participant flows through
> discipline columns from left to right. The organizer sees the entire
> tournament as a flow of people moving through stations — not as static
> tables or live feeds, but as a **visual process**.

---

## Design Philosophy

Previous central designs organize data by **topic** (tabs for participants,
rankings, sync) or by **simultaneity** (all panels at once). The Pipeline
organizes by **flow** — each participant is a card that moves through a
pipeline of discipline columns, physically representing their journey through
the tournament.

- **Spatial metaphor.** Left = not started, right = finished. A participant's
  card migrates rightward as they complete disciplines. The board's shape
  tells you the tournament's state at a glance — clumped on the left means
  early stage, spread across means mid-progress, stacked on the right means
  nearly done.
- **Drag-and-drop management.** Cards can be manually dragged between columns
  to correct errors or re-assign. But primarily the board updates itself
  automatically as helpers record data.
- **Swimlanes for classes.** Horizontal rows group cards by class, so the
  organizer can see which class is at which station.
- **No page switching, no command typing, no tab clicking.** Everything is
  one scrollable board.

| Aspect | v1 (Tabs) | v2 (Mission Control) | v3 (Terminal) | **v4 (Pipeline)** |
|---|---|---|---|---|
| Mental model | Database admin | Control room monitor | CLI power user | **Process flow / Kanban** |
| Core unit | Table row | Panel widget | Text command+response | **Participant card in a column** |
| Navigation | Tab switching | None (fixed grid) | Type commands | **Scroll board horizontally** |
| Organization | By topic | By function | By query | **By tournament stage** |
| Update style | Refresh | WebSocket push | Event stream | **Cards animate between columns** |

---

## Layout Overview

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  HEADER (48px, fixed)                                                                │
│  🏆 Bundesjugendspiele 2026  ·  ◉ LIVE  ·  72.3% complete  ·  🔍 Find  ·  ⚙  ·  📤 │
└──────────────────────────────────────────────────────────────────────────────────────┘

  ← horizontal scroll →

┌────────────┬────────────┬────────────┬────────────┬────────────┬────────────┐
│  WAITING   │  800m Run  │ 50m Sprint │  3-Jump    │   Throw    │  COMPLETE  │
│  (backlog) │            │            │            │            │  (done)    │
├────────────┼────────────┼────────────┼────────────┼────────────┼────────────┤
│            │            │            │            │            │            │
│ ─ 5a ──── │ ─ 5a ──── │ ─ 5a ──── │ ─ 5a ──── │ ─ 5a ──── │ ─ 5a ──── │
│ ┌────────┐ │ ┌────────┐ │            │ ┌────────┐ │            │ ┌────────┐ │
│ │ #21    │ │ │ #07    │ │            │ │ #03    │ │            │ │ #12    │ │
│ │ Braun  │ │ │ Weber  │ │            │ │Schmidt │ │            │ │ Müller │ │
│ │ 0/4    │ │ │ 1/4 ●  │ │            │ │ 2/4 ●  │ │            │ │ 4/4 ✅  │ │
│ └────────┘ │ └────────┘ │            │ └────────┘ │            │ └────────┘ │
│ ┌────────┐ │ ┌────────┐ │            │            │            │ ┌────────┐ │
│ │ #08    │ │ │ #05    │ │            │            │            │ │ #19    │ │
│ │ Klein  │ │ │ Koch   │ │            │            │            │ │Fischer │ │
│ │ 0/4    │ │ │ 1/4 ●  │ │            │            │            │ │ 4/4 ✅  │ │
│ └────────┘ │ └────────┘ │            │            │            │ └────────┘ │
│            │            │            │            │            │            │
│ ─ 5b ──── │ ─ 5b ──── │ ─ 5b ──── │ ─ 5b ──── │ ─ 5b ──── │ ─ 5b ──── │
│ ┌────────┐ │            │ ┌────────┐ │            │ ┌────────┐ │            │
│ │ #31    │ │            │ │ #33    │ │            │ │ #35    │ │            │
│ │ Engel  │ │            │ │Richter │ │            │ │ Lang   │ │            │
│ │ 0/4    │ │            │ │ 2/4 ●  │ │            │ │ 3/4 ●  │ │            │
│ └────────┘ │            │ └────────┘ │            │ └────────┘ │            │
│            │            │            │            │            │            │
│ ... more   │ ... more   │            │            │            │            │
│ classes    │            │            │            │            │            │
│            │            │            │            │            │            │
└────────────┴────────────┴────────────┴────────────┴────────────┴────────────┘
```

### Columns (left to right)

| Column | Purpose |
|---|---|
| **WAITING** | Participants who haven't completed any discipline yet. Starting area. |
| **800m Run** | Participants whose *most recently completed* discipline is 800m. |
| **50m Sprint** | Most recently completed is 50m. |
| **3-Jump** | Most recently completed is 3-Jump. |
| **Throw** | Most recently completed is Distance Throw. |
| **COMPLETE** | All 4 disciplines done. Finish area. |

**Important:** Participants don't necessarily flow left-to-right in strict column
order. They go to whichever discipline their class rotates to next. A card
appears in the column of their **last completed discipline** — so the organizer
sees *where each person was most recently recorded*. Once all 4 are done, the
card moves to COMPLETE regardless of order.

### Swimlanes (horizontal rows)

Each class is a **horizontal swimlane** within every column. Cards for class 5a
are grouped in the 5a row, 5b in the 5b row, etc. This lets the organizer see:
- "Class 5a's cards are mostly in the 800m and 3-Jump columns → they've
  visited those stations."
- "Class 6a is entirely in the WAITING column → they haven't started yet."

Swimlanes are collapsible (click the class label to fold/unfold).

---

## Participant Card — The Moving Unit

Each participant is a small card (~120×80px) that lives in exactly one column
at a time. Cards are compact — they carry just enough info to identify the
person and their progress.

```
┌──────────────────┐
│  #07  Weber, C.  │  ← ID + abbreviated name
│  ████░░░░  2/4   │  ← mini progress bar + fraction
│  💾 ●            │  ← sync status + active indicator
└──────────────────┘
```

### Card Elements

- **ID + Name**: `#07 Weber, C.` — abbreviated to fit. Full name shown on hover
  or click.
- **Progress bar**: 4 segments (one per discipline). Filled segments = completed
  disciplines. E.g., `████░░░░` = 2 of 4 done.
- **Fraction**: `2/4` — numeric complement to the progress bar.
- **Sync indicator**: `💾` (has unsaved data), `☁` (all synced), or `⚡` (conflict).
- **Active indicator**: `●` (orange dot) if this participant's data was recorded
  in the last 5 minutes (helps spot "in progress" participants).

### Card Colors

The card's **background color** encodes overall status:

| Background | Meaning |
|---|---|
| White | Normal, no issues |
| Faint blue | Has locally saved data not yet synced |
| Faint green | All recorded data synced |
| Yellow border | Has a sync conflict |
| Red border | Missing data that should exist (e.g., class finished a station but this participant has no entry) |

---

## Card Movement Animation

When a helper records data for a participant, the card **animates** from its
current column to the new column:

1. Card lifts slightly (shadow increases).
2. Card slides horizontally to the new column position.
3. Card settles into place in the correct swimlane.

The animation takes ~400ms — fast enough to not block, slow enough to be
noticeable. This gives the organizer an immediate visual signal: "something
just happened" without needing to read text or check feeds.

If multiple cards move at once (e.g., a helper submits a batch after being
offline), the cards animate in a staggered sequence (100ms apart), creating
a cascading visual flow.

---

## Card Click — Expansion Panel

Clicking a card **expands it in-place** to show full details. The card grows
to fill the column width and pushes other cards down:

```
┌──────────────────────────────────┐
│  #07  Weber, Clara               │
│  Klasse 5a  ·  weiblich          │
│  ────────────────────────────    │
│                                  │
│  800m Run      192.1s   190 pts  │  ☁✓
│  50m Sprint    ──       ──       │  (not recorded)
│  3-Jump        5.42m*   180 pts  │  💾
│                5.10m             │
│  Throw         ──       ──       │  (not recorded)
│  ────────────────────────────    │
│  Total so far: 370 pts           │
│                                  │
│  [Edit]  [Resolve conflict]      │
│                                  │
│         [ ▲ Collapse ]           │
└──────────────────────────────────┘
```

### Expanded Card Contents
- Full name, class, gender.
- All 4 disciplines listed:
  - Completed: value + points + sync status.
  - Multi-attempt: all tries shown, best marked with `*`.
  - Not yet recorded: `──` placeholder.
- Running total of accumulated points.
- **[Edit]** button opens an inline editor for any value (type new value,
  press Enter to save).
- **[Resolve conflict]** appears only if there's a `⚡` conflict. Shows the
  local vs server values with Keep/Accept buttons.
- **[▲ Collapse]** returns the card to compact view.

---

## Header Bar — Global Controls

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  🏆 Bundesjugendspiele 2026  ·  ◉ LIVE  ·  72.3% complete                   │
│  │  🔍 Find participant  │  👁 Filter  │  ⚙ Settings  │  📤 Export           │
└──────────────────────────────────────────────────────────────────────────────┘
```

### ◉ LIVE Indicator
- Green pulsing dot = receiving data in real-time.
- `⊘ DISCONNECTED` red = offline, board frozen at last known state.

### 72.3% Complete
- Overall tournament progress. Updates live. Gives instant macro-level awareness
  without scanning the board.

### 🔍 Find Participant
Opens a search bar that drops down from the header. Type a name or ID:
- Matching card(s) are **highlighted with a bright yellow glow** on the board.
- All non-matching cards **dim** to 40% opacity.
- The board auto-scrolls to center the first match.
- Press Esc to clear the search and restore all cards.

### 👁 Filter
Dropdown with filter options. Active filters dim/hide non-matching cards:
- **By class**: Show only 5a, only 5b, etc.
- **By status**: Only pending sync, only conflicts, only complete, only waiting.
- **By discipline progress**: "Missing 800m", "Missing Throw", etc.
- Multiple filters can be combined.
- Active filter count shown as a badge: `👁 Filter (2)`.

### ⚙ Settings
Opens a **right-side slide-out panel** (similar to v2's drawer) for:
- Managing disciplines (add/remove/edit).
- Managing classes and participants.
- Uploading/editing scoring tables.
- Managing helper assignments.

### 📤 Export
Opens slide-out panel for:
- Export format: CSV, PDF.
- Scope: all, by class, by discipline.
- Content: raw values, points, marks, certificates.
- **[Generate & Download]** button.

---

## Column Headers — Mini Stats

Each column header shows a live count:

```
┌─────────────────────────┐
│  3-Jump        18 cards │
│  ☁ 15 synced  💾 2  ⚡ 1 │
└─────────────────────────┘
```

- **Card count**: How many participants are currently in this column.
- **Sync breakdown**: synced / locally saved / conflicted counts.

The **WAITING** column header additionally shows:
```
  WAITING      12 cards
  (not started any discipline)
```

The **COMPLETE** column header additionally shows:
```
  COMPLETE     34 cards   (28.3%)
  All 4 disciplines recorded
```

---

## Real-Time Updates

### Card Movement
Cards move between columns automatically as helpers record data. The organizer
does not need to refresh or click anything.

### Column Count Updates
Header counts update in real-time: `17 cards` → `18 cards` as a card enters.

### Conflict Surfacing
When a conflict appears, the affected card's border turns yellow and a small
`⚡` icon pulses on it. The column header's conflict count increments.

### New Data Indicator
When a card receives new data, it briefly **flashes** (border pulses blue for
1 second) even if it doesn't change columns. This lets the organizer see
activity on the board without cards necessarily moving.

---

## Responsive Behavior

### 1920×1080 (recommended)
All 6 columns visible. Horizontal scroll minimal or none. Swimlanes show
4-6 cards per row.

### 1366×768
4-5 columns visible at once. Gentle horizontal scroll to see WAITING and
COMPLETE columns. Cards slightly smaller (100×70px).

### 1024×768 (tablet landscape)
3 columns visible. Horizontal scroll essential. Swimlane labels become
sticky on the left edge so class context is always visible while scrolling.

### < 768px
Not supported. Banner: `⚠ The Pipeline requires at least 1024px width.`

---

## Comparison to Traditional Kanban

| Traditional Kanban | **The Pipeline** |
|---|---|
| Tasks move through stages | Participants move through disciplines |
| Columns = workflow stages | Columns = discipline stations |
| Card = task/ticket | Card = participant |
| Manual drag to move | **Auto-moves as helpers record data** |
| WIP limits | Column counts (informational) |
| Single swimlane | **Swimlanes per class** |
| Done column | COMPLETE column with progress % |

The metaphor works because a sports tournament **is** a pipeline: participants
enter, flow through stations (disciplines), and exit as completed. The organizer's
job is to ensure smooth flow — identifying bottlenecks (too many cards stuck in
one column), blockages (offline helpers), and completion gaps (cards that should
have moved but haven't).
