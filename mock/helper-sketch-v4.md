# The Carousel — Helper Page Structural Sketch

> A **single-participant-at-a-time**, full-screen focus interface.
> Swipe or tap arrows to move between participants. Every pixel on screen
> belongs to the one person whose result you are recording right now.

---

## Design Philosophy

Every previous helper design shows **many participants simultaneously** — as
table rows, grid cells, or card stacks. The Carousel does the opposite:

- **One participant owns the entire screen.** Their name, ID, all attempt
  fields, status, and actions fill the viewport completely.
- **Navigation is linear.** Swipe left/right (or arrow buttons) to move between
  participants — like flipping through index cards in a filing box.
- **Context never competes with input.** There are no other participants visible
  to distract. The helper's attention is 100% on the current person.
- **Search breaks the sequence.** When a participant walks up out of order, the
  helper uses a quick-search to jump directly to their slide, then returns to
  the sequence.

| Aspect | helper-mockup | Data-Grid | Field-Touch | **Carousel** |
|---|---|---|---|---|
| Visible participants | ~8 rows | ~25 rows | ~5 cards | **1** |
| Core data unit | Table row | Table cell | Card tile | **Full-screen slide** |
| Navigation | Scroll table | Arrow keys | Scroll cards | **Swipe / arrows** |
| Input trigger | Click field | Type in cell | Tap → numpad | **Fields always visible & editable** |
| Participant ordering | Static by ID | Toggle fill-sort | 3 sort modes | **Queue: next-unfilled auto-advances** |

---

## Layout Overview

### Portrait (phone/tablet) and Landscape (laptop) — same structure, scaled

```
┌──────────────────────────────────────────────────────────┐
│  CONTEXT RIBBON (fixed top, 40px)                        │
│  3-Jump  ·  5a  ·  Slide 7 / 28  ·  ☁ 3 pending        │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                                                          │
│  ◀                                                    ▶  │
│                                                          │
│          ┌────────────────────────────────┐               │
│          │                                │               │
│          │        #07                     │               │
│          │        WEBER, Clara            │               │
│          │                                │               │
│          ├────────────────────────────────┤               │
│          │                                │               │
│          │   Try 1               Try 2    │               │
│          │   ┌──────────┐   ┌──────────┐  │               │
│          │   │           │   │           │ │               │
│          │   │  5.42 m   │   │  ▏___    │ │               │
│          │   │           │   │           │ │               │
│          │   │  💾 saved │   │  empty   │ │               │
│          │   └──────────┘   └──────────┘  │               │
│          │                                │               │
│          │        ★ Best: 5.42 m          │               │
│          │                                │               │
│          └────────────────────────────────┘               │
│                                                          │
│  ◀                                                    ▶  │
│                                                          │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  DOCK (fixed bottom, ~64px)                              │
│                                                          │
│   🔍 Find    ⏱ Timer    ▶▶ Skip to next unfilled        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Context Ribbon — What & Where

A thin, persistent strip at the top. Read-only (no dropdowns mid-session).

```
  3-Jump  ·  5a  ·  Slide 7 / 28  ·  ☁ 3 pending
  ────────────────────────────────────────────────
  Discipline  Class  Position counter  Sync status
```

- **Discipline + Class** — set on a setup screen before entering Carousel mode.
  To change: long-press the ribbon → full-screen selector.
- **Slide N / Total** — shows current position in the participant sequence. Gives
  the helper a sense of progress ("I'm on 7 of 28, almost a quarter done").
- **Sync status** — same as other designs: `☁ N pending` (orange) or `☁✓` (green)
  or `⊘ OFFLINE` (red).

---

## The Slide — One Participant, Full Viewport

The central area is a **single slide** filling all space between the ribbon and
the dock. The slide contains everything about one participant.

### Slide Anatomy

```
┌──────────────────────────────────────┐
│                                      │
│  ┌──────────────────────────────┐    │
│  │  IDENTITY BLOCK              │    │
│  │                              │    │
│  │  #07                         │    │  ← ID in large monospace (32px)
│  │  WEBER, Clara                │    │  ← Name in bold (28px)
│  │  Klasse 5a · weiblich        │    │  ← class + gender, muted (16px)
│  └──────────────────────────────┘    │
│                                      │
│  ┌──────────────────────────────┐    │
│  │  ATTEMPT FIELDS              │    │
│  │                              │    │
│  │  ┌────────────┐ ┌──────────┐ │    │
│  │  │  Try 1     │ │  Try 2   │ │    │
│  │  │            │ │          │ │    │
│  │  │  5.42 m    │ │  ___     │ │    │
│  │  │            │ │          │ │    │
│  │  │  💾 saved  │ │  empty   │ │    │
│  │  └────────────┘ └──────────┘ │    │
│  │                              │    │
│  │  ★ Best: 5.42 m             │    │  ← auto-computed best attempt
│  └──────────────────────────────┘    │
│                                      │
│  ┌──────────────────────────────┐    │
│  │  SLIDE STATUS BAR            │    │
│  │  ● Partially entered         │    │  ← overall slide status
│  └──────────────────────────────┘    │
│                                      │
└──────────────────────────────────────┘
```

### Identity Block
- ID and Name are displayed very large — the helper can **confirm at a glance**
  they are looking at the right person when a participant walks up.
- Class and gender are shown smaller, for context only.

### Attempt Fields — Always Editable, No Extra Tap

**Critical difference from Field-Touch:** In the Carousel, input fields are
**always visible and directly editable**. There is no numpad overlay. The field
is a native `<input type="number">` with large font (24px), tall hit area
(56px), and `inputmode="decimal"` for mobile numeric keyboards.

- **Tap** a field → OS numeric keyboard appears (or field is ready to type on
  desktop). The field is large enough that mistaps are rare.
- **Enter / Done** on keyboard → value saves to IndexedDB, field shows status
  update, and cursor **auto-advances**:
  - Multi-attempt (3-Jump, Throw): advances to Try 2 on same slide.
  - Single-attempt (800m, 50m): auto-swipes to next slide.
  - If all fields on the slide are filled: auto-swipes to next **unfilled** slide.
- **No custom numpad** — the OS keyboard is adequate when each slide has at most
  2–3 fields. The overhead of a custom numpad only pays off when you're opening
  and closing it dozens of times rapidly (like in Field-Touch's card stack).

### Field Layout per Discipline

**800m Run / 50m Sprint** — single wide field, centered:
```
  ┌────────────────────────────────┐
  │         Time (seconds)         │
  │                                │
  │           187.4                │
  │                                │
  │          ☁✓ synced             │
  └────────────────────────────────┘
```

**3-Jump / Distance Throw** — two fields side by side:
```
  ┌──────────────┐  ┌──────────────┐
  │   Try 1 (m)  │  │   Try 2 (m)  │
  │              │  │              │
  │    5.42      │  │    5.10      │
  │              │  │              │
  │   💾 saved   │  │   ☁✓ synced  │
  └──────────────┘  └──────────────┘

  ★ Best: 5.42 m
```

### Per-Field Status Indicators

Large text labels below each field (not icons — text is unambiguous outdoors):

| Label | Color | Meaning |
|---|---|---|
| `empty` | Gray text | No value entered |
| `💾 saved` | Blue text | In IndexedDB, not synced |
| `☁✓ synced` | Green text | Successfully sent to server |
| `⚡ conflict` | Gold text, pulsing | Server disagrees — tap to resolve |
| `✖ invalid` | Red text | Validation failed (negative, non-numeric, etc.) |

### Slide Status Bar

A full-width strip at the bottom of the slide summarizing completion:

| Status | Appearance |
|---|---|
| `○ Not started` | Gray text, hollow circle |
| `● Partially entered` | Blue text, half-filled circle |
| `✅ Complete & synced` | Green text, checkmark |
| `⚠ Needs attention` | Red text, warning icon |

---

## Navigation — Moving Between Slides

### Swipe Gesture (Touch)
- **Swipe left** → next participant.
- **Swipe right** → previous participant.
- A peek animation shows the edge of the adjacent slide (20px) during the swipe,
  confirming there's more content in that direction.

### Arrow Buttons (Touch + Desktop)
- Large `◀` and `▶` buttons on the left and right edges of the slide area
  (48px wide, full height of the slide zone — impossible to miss).
- On desktop, **←** and **→** keyboard arrows navigate slides when no input
  field is focused.

### Slide Order

Participants are arranged by ID by default. But the Carousel has a smart
**queue concept**:

- **Default queue**: All participants in ID order.
- **Auto-skip**: When the helper taps **▶▶ Skip to next unfilled** in the dock,
  the Carousel jumps forward to the next slide with at least one empty attempt
  field. Completed participants are skipped entirely.
- **Return to sequence**: After a search-jump (see below), the helper can swipe
  normally to continue from wherever they landed, or tap **▶▶** to resume
  the unfilled queue.

### Progress Minimap

Below the context ribbon, a thin (4px) horizontal progress bar spans the full
width. Each participant is a segment:

```
  ████████░░░░██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
  ^^^^^^^^              ^^^^^^
  green = complete       blue = partial       gray = empty
                                   ▲
                                   current position (white pip)
```

This gives the helper an instant birds-eye view of overall progress without
seeing any other participant's data.

---

## Dock — Bottom Action Bar

Fixed at the bottom, always within thumb reach. Three actions:

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│   🔍 Find       ⏱ Timer       ▶▶ Next unfilled      │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 🔍 Find — Full-Screen Search Overlay

Tapping opens a **full-screen overlay** (not a bottom sheet — maximum screen
space for results on any device):

```
┌──────────────────────────────────────┐
│                                      │
│  ┌──────────────────────────────┐    │
│  │ 🔍  Type name or ID…         │    │  ← auto-focused
│  └──────────────────────────────┘    │
│                                      │
│  ── ALL PARTICIPANTS ──              │
│                                      │
│  #01  Bauer, Tim          ○          │
│  #02  Engel, Sara         ✅          │
│  #03  Schmidt, Ben        ○          │
│  #04  Richter, Lena       ●          │
│  #05  Koch, Max           ○          │
│  #06  Lang, Mia           ✅          │
│  #07  Weber, Clara        ●          │
│  ...                                 │
│                                      │
│  ──────────────                      │
│  ○ = empty  ● = partial  ✅ = done    │
│                                      │
│         [ ✕ CLOSE ]                  │
│                                      │
└──────────────────────────────────────┘
```

- Shows **all participants** with their completion status icon.
- Typing filters instantly (fuzzy match on name or ID).
- Tapping a row **closes the overlay and navigates the carousel to that slide**.
- The helper can immediately start entering data — the input fields are right
  there, full-screen, ready.

**Scenario — Participant walks up to the 3-jump pit:**
1. Tap **🔍 Find**.
2. Participant says "I'm Clara Weber."
3. Type `web` → one result: `#07 Weber, Clara ●`. Tap it.
4. Carousel slides to #07. Try 1 already has 5.42. Try 2 is empty.
5. Tap Try 2 field, type `5.10`, press Done. Saved. Slide shows `✅ Complete`.
6. Tap **▶▶ Next unfilled** to jump to whoever needs data next.

### ⏱ Timer — Full-Screen Timer Overlay

Tapping opens an overlay purpose-built for timed disciplines (800m, 50m).
Three phases:

**Phase 1 — Ready:**
```
┌──────────────────────────────────────┐
│                                      │
│                                      │
│              00:00.00                │  ← giant (80px)
│                                      │
│         ┌────────────────┐           │
│         │   ▶  START     │           │  ← large green button
│         └────────────────┘           │
│                                      │
│              [ ✕ EXIT ]              │
│                                      │
└──────────────────────────────────────┘
```

**Phase 2 — Running:**

Unlike Field-Touch (which shows per-participant stop buttons), the Carousel timer
uses a **split + assign** model:

```
┌──────────────────────────────────────┐
│                                      │
│           ● 00:08.21                 │  ← ticking live (72px)
│                                      │
│  ┌──────────────────────────────┐    │
│  │                              │    │
│  │          ◉ SPLIT             │    │  ← giant button, entire width
│  │                              │    │
│  └──────────────────────────────┘    │
│                                      │
│  SPLITS CAPTURED:                    │
│  ① 00:08.21                         │
│  ② 00:08.44                         │
│  ③ 00:09.02                         │
│                                      │
│  ┌────────────┐  ┌────────────┐      │
│  │  ⏸ PAUSE   │  │  ■ FINISH  │      │
│  └────────────┘  └────────────┘      │
│                                      │
└──────────────────────────────────────┘
```

- The helper taps **◉ SPLIT** every time a participant crosses the finish line.
  Each tap captures the current timer value and adds it to a numbered list.
- Splits are **not assigned to participants yet**. The helper's only job during
  the race is to tap SPLIT as fast as runners arrive — no fumbling to find names.
- After **■ FINISH**, the assignment screen appears.

**Phase 3 — Assign Splits to Participants:**

```
┌──────────────────────────────────────┐
│                                      │
│  ASSIGN SPLITS                       │
│                                      │
│  ① 00:08.21  →  [ select… ▾ ]       │
│  ② 00:08.44  →  [ select… ▾ ]       │
│  ③ 00:09.02  →  [ select… ▾ ]       │
│                                      │
│  UNASSIGNED PARTICIPANTS:            │
│  #01 Bauer, Tim                      │
│  #03 Schmidt, Ben                    │
│  #05 Koch, Max                       │
│  #07 Weber, Clara                    │
│  ... (all without a time)            │
│                                      │
│  Tap a participant, then tap a       │
│  split time to pair them.            │
│                                      │
│  ┌────────────────────────────┐      │
│  │       SAVE & EXIT          │      │
│  └────────────────────────────┘      │
│                                      │
└──────────────────────────────────────┘
```

- Left column: captured split times.
- Right column: dropdown or tap-to-select from unassigned participants.
- **Drag-and-drop** (on tablet) or **tap-tap pairing** (tap a split, then tap a
  participant name to link them).
- This **split-then-assign** model is fundamentally different from Data-Grid's
  inline timer paste and Field-Touch's per-participant stop buttons. It's
  optimized for the reality that during a fast 50m sprint, you can't read names
  — you just tap SPLIT for each finisher, then calmly assign afterwards.
- **SAVE & EXIT** writes all assigned times to their participant slides in
  IndexedDB and returns to the Carousel.

### ▶▶ Next Unfilled

Single tap → Carousel slides forward (with animation) to the next participant
who has at least one empty attempt field. If all participants are complete, the
button shows `✅ All done!` and is disabled.

---

## Offline / Sync Logic

Identical lifecycle to the outline requirements, presented per-slide:

### Per-Field Save Flow
```
  Field empty         →   type value + confirm
  Field: 💾 saved     →   background sync attempts
  Field: ☁✓ synced    →   done (or edit again → back to 💾)
```

### Offline State
- Context ribbon: `⊘ OFFLINE` in red.
- All confirmed values save to IndexedDB normally.
- Field labels show `💾 saved` (never `☁✓ synced`).
- **Dock sync count** is not visible (no sync button — sync is fully automatic
  in the Carousel). Instead the ribbon's pending count increments.

### Reconnection
- Ribbon transitions to `☁✓ online`.
- Background sync runs. Field labels animate from `💾 saved` → `☁✓ synced` on
  each slide as you view it (no animation for off-screen slides to save resources;
  they update when you navigate to them).

### Conflict
- Field shows `⚡ conflict` label.
- Tapping the field shows an inline resolution:
  ```
  Your value: 5.42    Server: 5.38
  [ Keep mine ]       [ Use server ]
  ```
- Single tap resolves. No modal, no overlay.

### Page Reload
- `beforeunload` prompt if a field is mid-edit.
- IndexedDB restores all confirmed values.
- `localStorage` restores: current slide position, discipline, class, timer state.
- Service Worker caches all static assets for offline load.

---

## Accessibility & Device Handling

| Feature | Detail |
|---|---|
| **One-hand use** | Dock is at bottom. Swipe is natural. Arrow buttons span full height. |
| **Large text** | Name: 28px. ID: 32px. Input fields: 24px. Status labels: 16px. |
| **No hidden info** | Everything for this participant is on-screen. No expand, no drill-in. |
| **Desktop keyboard** | ← → arrows = navigate slides. Tab = next field. Enter = confirm. |
| **Progress awareness** | Minimap bar shows overall completion without leaving current slide. |
| **Landscape on tablet** | Attempt fields switch to horizontal layout (side by side with identity block). |
