# Mission Control — Central Interface Structural Sketch

> A **single-screen, no-navigation** real-time dashboard for organizers running
> the tournament from a central desk or projected onto a large monitor.
> Everything is visible at once — no tabs, no page switches, no drilling down.

---

## Design Philosophy

The existing central designs use **multi-page tab navigation** — Dashboard,
Participants, Rankings, Sync, Settings, Reports as separate views. You see one
page at a time and switch between them.

Mission Control eliminates page-switching entirely:

- **One screen, always.** The viewport is divided into **fixed zones** (panels)
  that all display simultaneously. Think NASA mission control or a stock
  trading terminal — dense, multi-panel, always-on.
- **Live updating.** Panels refresh in real-time as helpers submit data.
  Numbers tick, progress bars fill, rankings re-sort — the organizer watches
  the tournament unfold without clicking anything.
- **Interaction is secondary.** The primary use is **monitoring**. Interaction
  (filtering, exporting, resolving conflicts) happens via a slide-out drawer
  triggered from any panel, not by navigating away.
- **Designed for widescreen.** Optimized for 1920×1080 or larger. Panels
  rearrange responsively down to 1366×768 but this is not a mobile interface.

| Aspect | central-mockup / sketch | **Mission Control** |
|---|---|---|
| Navigation | Tab bar, 6 pages | **No navigation — single screen** |
| Data layout | Tables per page | **Tiled panels (6-8 simultaneous)** |
| Updates | Manual refresh / page load | **Live WebSocket push** |
| Interaction | Click through pages | **Click panel → slide-out drawer** |
| Primary use | Manage data (CRUD) | **Monitor tournament in real time** |
| Density | One topic per viewport | **All topics visible at once** |

---

## Layout — Panel Grid (1920×1080)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HEADER BAR (48px)                                                      │
│  🏆 Bundesjugendspiele 2026  ·  4 Disciplines  ·  120 Participants     │
│  │  ◉ LIVE  ·  Last update: 0s ago  │  ⚙ Settings  │  📤 Export       │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┬──────────────────────┬──────────────────────────┐
│                      │                      │                          │
│   STATION MAP        │   LIVE FEED          │   LEADERBOARD            │
│   (Panel A)          │   (Panel B)          │   (Panel C)              │
│                      │                      │                          │
│   ┌────┐ ┌────┐     │   14:32:01 #07 ← 5.42│   1. Müller,A   842pts  │
│   │800m│ │50m │     │   14:31:58 #12 ← 8.21│   2. Weber,C    798pts  │
│   │ ●5 │ │ ○  │     │   14:31:44 #03 ← 24.3│   3. Fischer,D  776pts  │
│   └────┘ └────┘     │   14:31:20 #19 ← 187s│   4. Schmidt,B  751pts  │
│   ┌────┐ ┌────┐     │   14:31:01 #28 ← 5.10│   5. Klein,E    723pts  │
│   │3-Jm│ │Thrw│     │   ...                 │   ...                   │
│   │ ●12│ │ ●8 │     │                       │                         │
│   └────┘ └────┘     │                       │   Filter: [All ▾]       │
│                      │                      │                          │
├──────────────────────┼──────────────────────┼──────────────────────────┤
│                      │                      │                          │
│   PROGRESS MATRIX    │   SYNC HEALTH        │   ALERTS                 │
│   (Panel D)          │   (Panel E)          │   (Panel F)              │
│                      │                      │                          │
│       800m 50m 3J Th │   Helper-1  ☁✓ 0s   │   ⚡ 2 conflicts         │
│   5a  ██░░ ████ ██░░ │   Helper-2  ☁✓ 3s   │   ⚠ #14 missing 50m     │
│   5b  ████ ░░░░ ██░░ │   Helper-3  ⊘ 47s   │   🔴 Helper-3 offline   │
│   6a  ░░░░ ░░░░ ░░░░ │   Helper-4  ☁✓ 1s   │                         │
│   6b  ██░░ ████ ████ │                      │   2 unresolved           │
│                      │   Pending: 7 entries │                          │
│                      │                      │                          │
└──────────────────────┴──────────────────────┴──────────────────────────┘
```

Six panels in a **3×2 grid**. Each panel has a fixed role and updates independently.

---

## Panel A — Station Map

A **spatial diagram** of the discipline stations, showing real-time activity.

```
┌─────────────────────────┐
│  STATION MAP             │
│                          │
│  ┌──────────┐ ┌────────┐│
│  │  800m    │ │  50m   ││
│  │  Run     │ │ Sprint ││
│  │          │ │        ││
│  │  ●  5    │ │  ○  0  ││
│  │ Helper-1 │ │ (idle) ││
│  └──────────┘ └────────┘│
│                          │
│  ┌──────────┐ ┌────────┐│
│  │  3-Jump  │ │ Throw  ││
│  │          │ │        ││
│  │  ● 12    │ │ ●  8   ││
│  │ Helper-3 │ │Helper-4││
│  └──────────┘ └────────┘│
│                          │
└─────────────────────────┘
```

### Station Box Contents
- **Discipline name** — large label.
- **Activity indicator**:
  - `●` green dot + number = actively receiving data. Number = entries received
    in the last 10 minutes.
  - `○` gray dot = idle (no data in last 10 minutes).
  - `⊘` red dot = helper offline.
- **Helper name** — which helper device is assigned to this station.
- **Currently serving class** — shown below the helper name if known.

### Interaction
- Click a station box → **Drawer** slides in from the right showing the full
  participant list for that station's current class + discipline, with all
  recorded values and statuses. (See Drawer section below.)

---

## Panel B — Live Feed

A **reverse-chronological event stream** showing every data point as it arrives.
Looks like a log or chat feed — new entries push in at the top.

```
┌──────────────────────────┐
│  LIVE FEED          ◉ ON │
│                          │
│  14:32:01  3-Jump        │
│  #07 Weber,C → 5.42m    │
│  💾 saved                │
│                          │
│  14:31:58  50m Sprint    │
│  #12 Müller,A → 8.21s   │
│  ☁✓ synced               │
│                          │
│  14:31:44  Throw         │
│  #03 Schmidt,B → 24.3m  │
│  ☁✓ synced               │
│                          │
│  14:31:20  800m Run      │
│  #19 Fischer,D → 187.4s │
│  ☁✓ synced               │
│                          │
│  ... (scrollable)        │
│                          │
└──────────────────────────┘
```

### Entry Format
Each entry shows: **timestamp**, **discipline**, **participant ID + name**,
**recorded value**, and **sync status**.

### Behavior
- Auto-scrolls to newest at top.
- Entries with issues (conflicts, errors) are highlighted with a left-border
  color (gold for conflict, red for error).
- The `◉ ON` indicator can be toggled to `◉ PAUSED` to freeze the feed
  (useful for reading without entries pushing past).
- Click any entry → Drawer opens with that participant's full record.

---

## Panel C — Leaderboard

A **live ranking table** that re-sorts automatically as new scores arrive.

```
┌────────────────────────────────┐
│  LEADERBOARD                   │
│                                │
│  Filter: [All ▾] [Overall ▾]  │
│                                │
│   #  Name           Points    │
│  ─────────────────────────────│
│   1  Müller, Anna     842     │
│   2  Weber, Clara     798     │
│   3  Fischer, David   776     │
│   4  Schmidt, Ben     751     │
│   5  Klein, Eva       723     │
│   6  Koch, Max        701     │
│   7  Lang, Mia        688     │
│   8  Braun, Felix     665     │
│   9  Richter, Lena    640     │
│  10  Bauer, Tim       622     │
│  ...                          │
│                                │
│  Showing 10 of 120             │
└────────────────────────────────┘
```

### Filters (in-panel, no page switch)
Two compact dropdowns at the top of the panel:

- **Scope**: `All` | `Klasse 5a` | `Klasse 5b` | `Klasse 6a` | ... | `Boys` | `Girls`
- **View**: `Overall` (aggregate points) | `800m` | `50m` | `3-Jump` | `Throw`

When filtered to a specific discipline, the table shows raw performance values
alongside points:
```
  #  Name           Value    Points
  1  Müller, Anna   7.94s    220
  2  Weber, Clara   8.21s    205
```

### Live Updates
When a new score arrives and changes ranking positions, the affected rows
**briefly flash** and slide to their new position (animated over 300ms).
A small `↑2` or `↓1` badge shows the position change.

### Interaction
- Click a participant → Drawer shows their full breakdown (all disciplines,
  all attempts, all points, computed mark).

---

## Panel D — Progress Matrix

A **heatmap-style grid** showing completion status across all classes × all
disciplines at a glance.

```
┌──────────────────────────────┐
│  PROGRESS MATRIX             │
│                              │
│        800m  50m  3-Jm  Thr  │
│   5a   ██░░  ████  ██░░  ░░░░ │
│   5b   ████  ░░░░  ██░░  ████ │
│   6a   ░░░░  ░░░░  ░░░░  ░░░░ │
│   6b   ██░░  ████  ████  ████ │
│                              │
│  ██ = 100%  ▓▓ = 50-99%     │
│  ░░ = 1-49% ·· = 0%         │
│                              │
└──────────────────────────────┘
```

### Cell Encoding
Each cell in the matrix is a small progress bar:
- **Full block** `████` (green) = 100% of participants in that class have
  completed that discipline.
- **Partial block** `██░░` (blue) = some but not all.
- **Empty block** `░░░░` (gray) = started but sparse.
- **Dots** `····` (muted) = 0% — no data at all.

A percentage label appears on hover (or by clicking on the cell).

### Interaction
- Click any cell → Drawer opens showing the participant list for that
  class + discipline, with each participant's recorded value and status.

### Value
This panel answers the organizer's most common question at a glance:
*"Which classes still need to go to which stations?"* A row of gray/empty
cells means that class hasn't visited those stations yet.

---

## Panel E — Sync Health

Shows the **status of every helper device** — the organizer's view of the
network.

```
┌────────────────────────────────┐
│  SYNC HEALTH                   │
│                                │
│  Helper-1 (800m)               │
│  ☁✓ online  ·  last: 0s ago   │
│  ▰▰▰▰▰▰▰▰▰▰ 100% synced      │
│                                │
│  Helper-2 (50m)                │
│  ☁✓ online  ·  last: 3s ago   │
│  ▰▰▰▰▰▰▰▰░░  87% synced      │
│                                │
│  Helper-3 (3-Jump)             │
│  ⊘ OFFLINE  ·  last: 47s ago  │
│  ▰▰▰▰░░░░░░  42% synced       │
│                                │
│  Helper-4 (Throw)              │
│  ☁✓ online  ·  last: 1s ago   │
│  ▰▰▰▰▰▰▰▰▰░  94% synced      │
│                                │
│  ── QUEUE ──                   │
│  7 entries pending sync        │
│                                │
└────────────────────────────────┘
```

### Per-Helper Info
- **Name + assigned discipline** — who is where.
- **Connection status**: `☁✓ online` (green) or `⊘ OFFLINE` (red, bold).
- **Recency**: seconds since last data received.
- **Sync progress bar**: percentage of that helper's entries that have been
  successfully synced.

### Queue Count
Total pending entries across all helpers waiting to sync.

### Interaction
- Click a helper → Drawer shows that helper's pending entries, allowing the
  organizer to see exactly what hasn't synced yet.

---

## Panel F — Alerts

A **priority-sorted list** of issues that need the organizer's attention.

```
┌────────────────────────────────┐
│  ALERTS              2 open    │
│                                │
│  🔴 Helper-3 offline (47s)     │
│     3-Jump station not syncing │
│     [Dismiss]                  │
│                                │
│  ⚡ 2 sync conflicts            │
│     #14 Try 1: local 5.42     │
│               server 5.38      │
│     #28 Try 1: local 6.01     │
│               server 5.98      │
│     [Resolve all]              │
│                                │
│  ⚠ #14 missing 50m data       │
│     All other disciplines done │
│     [Dismiss]                  │
│                                │
│  ── Resolved ──                │
│  ✓ Helper-2 reconnected (2m)  │
│  ✓ #09 conflict resolved      │
│                                │
└────────────────────────────────┘
```

### Alert Types
| Icon | Type | Trigger |
|---|---|---|
| 🔴 | Helper offline | No data from a helper for >30 seconds |
| ⚡ | Sync conflict | Server and local values disagree |
| ⚠ | Missing data | A participant has completed 3/4 disciplines but is missing one |
| ℹ️ | Info | Non-critical notifications (class rotation complete, etc.) |

### Behavior
- Alerts auto-appear as conditions arise.
- **[Dismiss]** removes informational alerts.
- **[Resolve all]** on conflicts → Drawer opens with a conflict resolution
  interface (side-by-side comparison, single-click resolution per entry).
- Resolved alerts move to a muted "Resolved" section at the bottom with
  a timestamp.
- The `2 open` badge in the panel header gives an instant count.

---

## The Drawer — Interaction Layer

All interaction happens in a **slide-out drawer** that appears from the right
edge, covering ~40% of the screen width. The panels behind it stay visible
(dimmed), so the organizer never loses context.

```
                                    ┌──────────────────────┐
  ┌──────────────────────────┐      │  DRAWER              │
  │ (panels dimmed but       │      │                      │
  │  visible behind drawer)  │      │  Content varies by   │
  │                          │      │  what was clicked:    │
  │                          │      │                      │
  │                          │      │  - Participant detail │
  │                          │      │  - Station data list  │
  │                          │      │  - Conflict resolver  │
  │                          │      │  - Helper pending Q   │
  │                          │      │  - Export controls    │
  │                          │      │                      │
  │                          │      │       [ ✕ CLOSE ]    │
  └──────────────────────────┘      └──────────────────────┘
```

### Drawer Contents by Trigger

**Click participant (from Leaderboard or Feed):**
```
  #07 Weber, Clara — Klasse 5a, weiblich
  ──────────────────────────────────────
  800m Run     187.4s    →  198 pts  ☁✓
  50m Sprint     8.21s   →  205 pts  ☁✓
  3-Jump         5.42m*  →  180 pts  💾
                 5.10m
  Throw         24.30m*  →  215 pts  ☁✓
                22.10m
  ──────────────────────────────────────
  Total:                     798 pts
  Mark:                      2+ (gut)
```
Full discipline breakdown with raw values, points, sync status, and computed
mark. The `*` marks the best attempt used for scoring.

**Click station (from Station Map):**
Participant list for that station's current class, with completion status per
participant. The organizer can see who has been recorded and who hasn't.

**Click conflict alert:**
```
  ⚡ CONFLICT RESOLUTION
  ──────────────────────
  #14 Fischer, David — 3-Jump Try 1

  Local value:    5.42 m   (Helper-3, 14:31:20)
  Server value:   5.38 m   (Helper-1, 14:30:55)

  [ Keep Local ]    [ Accept Server ]    [ Enter new value: ___ ]
```
Three resolution options including manual override. Single click resolves.

**Click Export (header bar):**
```
  📤 EXPORT
  ─────────
  Format:  [CSV ▾]  [PDF ▾]

  Scope:
  ○ All participants
  ○ Specific class: [select ▾]
  ○ Specific discipline: [select ▾]

  Include:
  ☑ Raw performance values
  ☑ Calculated points
  ☑ Marks
  ☐ Attempt details (all tries)

  [ GENERATE & DOWNLOAD ]
```

**Click Settings (header bar):**
```
  ⚙ SETTINGS
  ───────────
  Disciplines:
    800m Run  ·  50m Sprint  ·  3-Jump  ·  Throw
    [ + Add discipline ]

  Classes:
    5a (Level: Intermediate)  ·  5b  ·  6a  ·  6b
    [ + Add class ]

  Scoring Tables:
    [ Upload / Edit scoring tables ]

  Helpers:
    Helper-1 → 800m  ·  Helper-2 → 50m  ·  ...
    [ Manage assignments ]
```

---

## Header Bar — Global Controls

```
┌──────────────────────────────────────────────────────────────────────────┐
│  🏆 Bundesjugendspiele 2026  ·  4 Disciplines  ·  120 Participants      │
│  │  ◉ LIVE  ·  Last update: 0s ago  │  ⚙ Settings  │  📤 Export        │
└──────────────────────────────────────────────────────────────────────────┘
```

- **Tournament name + stats** — quick context (read-only).
- **◉ LIVE** — green pulsing dot confirming real-time data flow is active.
  If the central server loses connection: `⊘ DISCONNECTED` in red.
- **Last update** — seconds since any data was received from any helper.
  Resets to `0s` on every incoming entry.
- **⚙ Settings** — opens Settings drawer.
- **📤 Export** — opens Export drawer.

---

## Real-Time Data Flow

```
  Helper devices (IndexedDB)
       │
       │  sync (automatic, background)
       ▼
  Central server / database
       │
       │  WebSocket push
       ▼
  Mission Control (browser)
       │
       ├─→ Live Feed (new entry appears)
       ├─→ Leaderboard (ranking re-sorts)
       ├─→ Progress Matrix (cell fills)
       ├─→ Station Map (activity count increments)
       ├─→ Sync Health (progress bars update)
       └─→ Alerts (new issues surface)
```

All six panels update independently as data arrives. No manual refresh needed.
The organizer can leave Mission Control open on a projected screen and the
tournament's progress is visible in real time to everyone in the room.

---

## Responsive Behavior

### 1920×1080 (Recommended)
Full 3×2 panel grid as shown above.

### 1366×768
Panels reflow to **2×3** grid (2 columns, 3 rows). Each panel is narrower but
all six remain visible. Scrollable within each panel if content overflows.

### <1200px wide
Banner: `⚠ Mission Control is designed for large screens. Use at least 1366px width.`
Panels stack vertically as a scrollable single column (functional but not optimal).

### Mobile
Not supported. Redirect to helper interface or show a blocking message.
