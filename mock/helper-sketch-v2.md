# The Data-Grid — Helper Page Structural Sketch

> A keyboard-first, data-dense helper interface optimized for laptop/desktop users
> who need maximum throughput when entering results for 25-30 participants per class.

---

## Design Philosophy

Unlike the existing helper mockup (card-like rows, icon-driven, touch-friendly spacing),
**The Data-Grid** treats the entire viewport as a **spreadsheet**:

- **Zero chrome.** No cards, no rounded corners, no padding between cells. Every pixel is data.
- **No modals or popups.** All state is visible inline — sync status, errors, and timer live inside the grid itself.
- **Keyboard owns everything.** Mouse is tolerated, never required. Tab, Enter, arrow keys, and single-letter hotkeys drive the entire workflow.
- **The footer is a command bar**, not a button row — inspired by terminal/IDE status bars.

---

## Layout Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│ TOPBAR (single fixed row, ~32px tall)                                   │
│  [D] Discipline ▾  [C] Class ▾  │  ● 3 pending  ✓ 47 synced  │ 14:32  │
└─────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  GRID (fills 100% remaining viewport height, scrolls independently)     │
│                                                                         │
│  ┌────┬──────────────────┬─────────┬─────────┬───┐                      │
│  │ ID │ Name             │ Field 1 │ Field 2 │ ◉ │  ← column headers    │
│  ├────┼──────────────────┼─────────┼─────────┼───┤     are sticky       │
│  │ 01 │ Müller, Anna     │  12.34  │  11.98  │ ✓ │                      │
│  │ 02 │ Schmidt, Ben     │   ▏     │         │   │  ← cursor is here    │
│  │ 03 │ Weber, Clara     │         │         │   │                      │
│  │ .. │ ...              │         │         │   │                      │
│  │ 28 │ Zimmermann, Paul │  13.01  │  12.44  │ ● │                      │
│  └────┴──────────────────┴─────────┴─────────┴───┘                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────┐
│ COMMAND BAR (fixed bottom, ~28px, monospace)                            │
│  / search…  │ F2 Timer  00:00.0 │ F3 Toggle-filled │ F4 Force-sync     │
└─────────────────────────────────────────────────────────────────────────┘
```

### Key Differences from Existing Designs

| Aspect | Existing helper-mockup | The Data-Grid |
|---|---|---|
| Primary input | Click-to-focus input boxes with generous padding | Arrow-key cell navigation, spreadsheet-style |
| Sync status | Colored dots per row | Inline micro-icon per **cell** + aggregated count in topbar |
| Timer | Floating button that opens a modal | Embedded in command bar, timer value editable inline |
| Search | Footer input that filters table | `/` key activates incremental search overlay, Esc clears |
| Footer | Row of toggle buttons | Single-line command bar with hotkey labels |
| Layout density | ~8 visible rows at 1080p | ~22-25 visible rows at 1080p (all participants without scrolling) |

---

## Topbar — The Context Strip

A single, thin, fixed row. Three zones separated by thin vertical dividers:

```
 [D] 3-Jump ▾    [C] 5a ▾    │    ● 3 pending  ✓ 47 synced    │    14:32
 ───────────────────────────────────────────────────────────────────────
 Zone 1: Selectors             Zone 2: Sync summary              Zone 3: Clock
```

### Zone 1 — Discipline & Class Selectors
- Rendered as compact dropdowns with the **hotkey letter shown** in a box: `[D]`, `[C]`.
- Pressing `D` opens discipline dropdown; typing first letters filters. `Enter` selects. `Esc` cancels.
- Pressing `C` opens class dropdown, same behavior.
- After selection, the grid columns and validation rules reconfigure instantly (e.g., 3-Jump shows 2 attempt fields; 800m shows 1 time field).

### Zone 2 — Sync Aggregate
- `● N pending` — orange dot, count of cells saved locally but not synced.
- `✓ N synced` — green checkmark, total synced cells.
- Clicking this zone (or pressing `F5`) does **not** open a modal. Instead it temporarily highlights all pending rows in the grid with a subtle orange left-border flash, then fades after 2 seconds.

### Zone 3 — Wall Clock
- Passive display. Useful for helpers coordinating timing.

---

## Central Grid — The Data Surface

The grid is a dense `<table>` filling the viewport between topbar and command bar. Column headers are **sticky** (remain visible while scrolling).

### Column Layout per Discipline

**800m Run** (1 field):
```
│ ID │ Name, Vorname      │  Time (s)  │ ◉ │
│ 01 │ Müller, Anna       │   187.4    │ ✓ │
```

**50m Sprint** (1 field):
```
│ ID │ Name, Vorname      │  Time (s)  │ ◉ │
│ 01 │ Müller, Anna       │    8.21    │ ✓ │
```

**3-Jump** (2 fields, best is auto-highlighted):
```
│ ID │ Name, Vorname      │  Try 1 (m) │  Try 2 (m) │ ◉ │
│ 01 │ Müller, Anna       │    5.42*   │    5.10    │ ✓ │
```
`*` marks the best attempt. Computed automatically. If only one try entered, no asterisk.

**Distance Throw** (2 fields, same layout as 3-Jump):
```
│ ID │ Name, Vorname      │  Try 1 (m) │  Try 2 (m) │ ◉ │
│ 01 │ Müller, Anna       │   22.10    │   24.30*   │ ✓ │
```

> If the number of allowed tries changes in the future, additional columns appear automatically.

### The Status Column `◉`

This is the **row-level sync summary**, but The Data-Grid also shows **cell-level** status:

| Cell background | Meaning |
|---|---|
| Default (white) | Empty, no data entered |
| Faint blue tint | Saved to local storage, **not** synced |
| No tint (white with green micro-dot in top-right corner of cell) | Successfully synchronized to cloud |
| Red left-border on cell | Validation error (e.g., negative time, non-numeric) |

The `◉` column shows a **composite row status**:
- `  ` (blank) — no data entered yet
- `●` (orange) — at least one field saved locally, not synced
- `✓` (green) — all fields synced
- `⚠` (red) — validation error in at least one field

This means a helper can glance at the `◉` column to see completion at a glance, **and** look at individual cell tints for detail — without opening anything.

### Row Ordering & Fill-Toggle

By default, rows are sorted by participant ID. When `F3` (Toggle-filled) is active:
- Rows with **all fields filled** sink to the bottom of the grid (grouped, dimmed slightly).
- Unfilled/partial rows float to the top, preserving their ID order within the group.
- A small label appears in the command bar: `[filled ↓]` to confirm the mode is active.

---

## Command Bar — The Control Strip

A fixed-bottom single-line bar. Monospace font. Behaves like a hybrid of a status bar and a command palette.

```
 / search…  │  F2 Timer 00:00.0  │  F3 filled↓  │  F4 sync  │  ↑↓ navigate  │  Tab next-cell
```

### `/` — Incremental Search
- Pressing `/` at any time places the cursor into the search segment of the command bar.
- Typing filters the grid **live** — only matching rows are shown. Match highlights in the Name column.
- `Enter` jumps the cell cursor to the first match's first empty field.
- `Esc` clears the search and restores full grid view.
- This replaces the separate search input from the existing mockup.

### `F2` — Timer
- `F2` **starts** a stopwatch. The timer value `00:00.0` ticks live in the command bar.
- `F2` again **stops** the timer.
- When the timer stops, the current value is **not** auto-inserted. Instead the helper can press `Enter` on any time cell to paste the stopped timer value, or type a manual override.
- `Shift+F2` **resets** the timer to `00:00.0`.
- The timer is particularly useful for 800m and 50m: start the timer when the race begins, then quickly tab through participants and press `Enter` to stamp split times, or manually enter each time.

### `F3` — Toggle Filled to Bottom
- Toggles the fill-sort mode described above.
- The label in the command bar changes between `F3 filled↓` (active) and `F3 filled` (inactive).

### `F4` — Force Sync
- Triggers an immediate sync attempt for all locally-saved data.
- The pending count in the topbar animates down as entries sync.
- If offline, the command bar briefly flashes: `offline — queued`.

---

## Input Speed — Keyboard Flow

### Cell Navigation
- **Arrow keys** (`↑` `↓` `←` `→`): Move the active cell cursor through the grid. The active cell has a **2px blue border**.
- **Tab**: Move to the **next input cell** in the row (skips ID and Name columns). At the end of a row, jumps to the first input cell of the next row.
- **Shift+Tab**: Reverse of Tab.
- **Enter** (on an empty cell): If the timer has a stopped value, paste it. Otherwise, enter edit mode.
- **Enter** (on a cell being edited): Confirm the value, save to local storage, auto-tab to the next empty cell in the same column (vertical entry mode for timed events — ideal for recording participants finishing a race one by one).
- **Escape**: Cancel edit, revert cell to previous value.

### Auto-Tabbing Modes

**Horizontal mode (default for 3-Jump, Distance Throw):**
After confirming a value in Try 1, the cursor auto-advances to Try 2 in the **same row**.
After Try 2, cursor advances to Try 1 of the **next row**.
This matches the flow: one participant does both tries, then the next.

**Vertical mode (activated by pressing `Ctrl+↓`, ideal for 800m/50m):**
After confirming a value, the cursor advances **down** to the same column in the **next row**.
This matches the flow: participants finish a race one at a time; the helper records each time sequentially down the column.

The currently active mode is shown as a subtle indicator in the command bar: `[→ horiz]` or `[↓ vert]`.

### Numeric-Only Entry
- All performance cells accept only numeric input with decimal point.
- Non-numeric keystrokes are silently ignored (no error flash for rejected keystrokes — just no character appears).
- Negative values are rejected on confirm and the cell gets a red left-border.

### Rapid Correction
- **Backspace** (on a confirmed cell): Re-enters edit mode with the value selected, allowing immediate overwrite.
- **Delete** (on a confirmed cell): Clears the cell value entirely (after a local-storage delete, sync status resets to blank).

---

## Offline / Sync Logic — Visual States in Detail

### Storage Lifecycle of a Single Cell Value

```
  [ Empty ]                    (white cell, no indicator)
      │
      │  helper types a value and presses Enter/Tab
      ▼
  [ Saved Locally ]            (faint blue cell background)
      │                        (row ◉ column shows ● orange)
      │                        (topbar pending count increments)
      │
      │  background sync succeeds
      ▼
  [ Synchronized ]             (white cell + green micro-dot top-right)
      │                        (row ◉ column shows ✓ if all cells synced)
      │                        (topbar synced count increments, pending decrements)
      │
      │  helper edits the value again
      ▼
  [ Saved Locally ]            (back to blue tint, green dot disappears)
                               (pending count increments again)
```

### Offline Behavior
- When the device is offline, all saves go to IndexedDB.
- The topbar sync zone shows: `⊘ offline  ● 12 pending` — the `⊘` symbol replaces the green checkmark count.
- The command bar `F4 sync` label dims and shows `F4 sync (offline)`.
- On reconnection, sync resumes automatically. A brief green flash of the topbar zone confirms reconnection.

### Conflict Resolution
- If a sync returns a conflict (e.g., another helper updated the same cell), the cell shows a **yellow background** and a `⚡` icon in the `◉` column.
- Pressing `Enter` on a conflicted cell shows a **one-line inline diff** directly below the cell (not a modal): `server: 12.40 │ local: 12.34 │ [K]eep local │ [A]ccept server`.
- Single keypress `K` or `A` resolves the conflict immediately.

### Page Reload Protection
- `beforeunload` listener warns if there are unsaved edits (data typed but not yet confirmed/saved).
- All confirmed values are already in IndexedDB, so a reload restores the full grid state.
- On reload, the selected discipline, class, toggle states, and timer value are restored from `localStorage`.
- Static assets (JS, CSS) are cached via a Service Worker so the page loads fully offline.

---

## Responsive Degradation (Desktop Focus)

The Data-Grid is **not** designed for mobile. At viewports narrower than 900px, a banner appears:

```
┌──────────────────────────────────────────────┐
│  ⚠ This interface is optimized for desktop.  │
│  Use the Standard Helper page on mobile.     │
└──────────────────────────────────────────────┘
```

At 1920×1080, approximately **25 rows** are visible without scrolling — enough for an entire class.
At 1366×768, approximately **18 rows** are visible — scroll is minimal.

---

## Summary of Hotkeys

| Key | Action |
|---|---|
| `D` | Open discipline selector |
| `C` | Open class selector |
| `/` | Activate search |
| `F2` | Start/stop timer |
| `Shift+F2` | Reset timer |
| `F3` | Toggle filled-to-bottom |
| `F4` | Force sync |
| `F5` | Flash pending rows |
| `Tab` / `Shift+Tab` | Next / previous input cell |
| `↑` `↓` `←` `→` | Navigate grid cells |
| `Enter` | Confirm value / paste timer / enter edit |
| `Escape` | Cancel edit / clear search |
| `Ctrl+↓` | Switch to vertical auto-tab mode |
| `Ctrl+→` | Switch to horizontal auto-tab mode |
| `Backspace` | Re-edit a confirmed cell |
| `Delete` | Clear a cell |
