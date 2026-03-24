# The Terminal — Central Interface Structural Sketch (v3)

> A **command-line-driven** management interface for power-user organizers.
> No buttons, no tabs, no panels. You type commands, the system responds.
> Think database admin tool meets tournament management.

---

## Design Philosophy

Existing central designs are **visual-first**: either multi-page tabs with
point-and-click tables (v1) or a passive multi-panel monitoring wall (v2).
The Terminal is the opposite:

- **Text in, text out.** The entire interface is a scrollable command log
  (like a terminal emulator). The organizer types structured commands and
  receives formatted text responses inline.
- **Precision over browsing.** Instead of scanning tables or watching
  dashboards, the organizer asks exactly the question they need answered
  and gets exactly that answer. No noise, no surrounding panels.
- **Scriptable and repeatable.** Commands can be chained, aliased, and
  recalled from history. An organizer who runs the same tournament every
  year builds up muscle memory for their workflow.
- **Works on anything.** Since it's essentially a text interface in a
  browser, it renders perfectly on any screen size, any connection speed,
  any device. No layout breakpoints needed.

| Aspect | v1 (Tab Dashboard) | v2 (Mission Control) | **v3 (Terminal)** |
|---|---|---|---|
| Navigation | Tab bar, 6 pages | No nav, 6 fixed panels | **No nav — type commands** |
| Data display | Tables, cards, charts | Live-updating panels | **Inline formatted text blocks** |
| Primary interaction | Click buttons/rows | Click panels → drawer | **Type commands, read responses** |
| Learning curve | Low (point and click) | Low (passive watching) | **Medium (learn commands), but fast once learned** |
| Screen requirement | 1024px+ | 1920px+ | **Any width (even 320px)** |
| Real-time updates | Manual refresh | WebSocket live | **Event stream + push notifications inline** |

---

## Layout — The Single Surface

```
┌──────────────────────────────────────────────────────────────┐
│  TITLE BAR (fixed, 36px)                                     │
│  🏆 Bundesjugendspiele 2026  ·  ◉ LIVE  ·  ⊘ 7 pending     │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  ┌─ LOG ──────────────────────────────────────────────────┐  │
│  │                                                        │  │
│  │  > status                                              │  │
│  │                                                        │  │
│  │  TOURNAMENT STATUS                                     │  │
│  │  ─────────────────                                     │  │
│  │  Disciplines:  4 active                                │  │
│  │  Classes:      4 (5a, 5b, 6a, 6b)                     │  │
│  │  Participants: 120 total                               │  │
│  │  Recorded:     347 / 480 values (72.3%)                │  │
│  │  Synced:       340 / 347 (97.9%)                       │  │
│  │  Pending:      7 entries                               │  │
│  │  Helpers:      3 online, 1 offline (Helper-3)          │  │
│  │  Conflicts:    2 unresolved                            │  │
│  │                                                        │  │
│  │  > _                                                   │  │
│  │                                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  INPUT BAR (fixed bottom, 48px)                              │
│  >  ▏                                                        │
│  Tab: autocomplete  ·  ↑↓: history  ·  F1: help             │
└──────────────────────────────────────────────────────────────┘
```

Three zones:
1. **Title Bar** — Tournament name, live indicator, pending sync count. Read-only.
2. **Log** — Scrollable history of all commands and their responses. Oldest at top, newest at bottom. Monospace font throughout.
3. **Input Bar** — Fixed at the bottom. Single-line command input with autocomplete hints.

---

## Command Language

Commands follow the pattern: `verb [noun] [--flags]`

### Core Commands

#### `status` — Tournament overview
```
> status

TOURNAMENT STATUS
─────────────────
Disciplines:  4 active (800m, 50m, 3-Jump, Throw)
Classes:      4 (5a, 5b, 6a, 6b)
Participants: 120 total (62 male, 58 female)
Recorded:     347 / 480 values (72.3%)
Synced:       340 / 347 (97.9%)
Pending:      7 entries
Helpers:      3 online, 1 offline (Helper-3, last seen 47s ago)
Conflicts:    2 unresolved
```

#### `rank` — Rankings
```
> rank

OVERALL RANKING (Top 10)
────────────────────────
 #   Name              Class  800m   50m    3-Jm   Throw  Total
 1   Müller, Anna      5a     198    205    180    215    798
 2   Weber, Clara      5b     185    210    192    201    788
 3   Fischer, David    6a     201    195    175    208    779
 ...

> rank --class 5a

RANKING — Klasse 5a
───────────────────
 #   Name              800m   50m    3-Jm   Throw  Total
 1   Müller, Anna      198    205    180    215    798
 2   Klein, Eva        190    188    195    200    773
 ...

> rank --discipline 3-jump

RANKING — 3-Jump (all classes)
──────────────────────────────
 #   Name              Class  Best    Points
 1   Klein, Eva        5a     5.82m   195
 2   Weber, Clara      5b     5.42m   180
 ...

> rank --class 5a --discipline 800m --gender female

RANKING — 800m, Klasse 5a, Female
─────────────────────────────────
 #   Name              Time     Points
 1   Müller, Anna      187.4s   198
 2   Klein, Eva        192.1s   190
 ...
```

#### `show` — Participant detail
```
> show #07

PARTICIPANT #07 — Weber, Clara
──────────────────────────────
Class: 5a  ·  Gender: female

  Discipline       Value         Points  Status
  ────────────────────────────────────────────
  800m Run         192.1s        190     ☁✓ synced
  50m Sprint       8.44s         200     ☁✓ synced
  3-Jump           5.42m / 5.10m 180     💾 saved (Try 1)
                   (best: 5.42m)         ☁✓ synced (Try 2)
  Distance Throw   24.30m / 22.10m 215   ☁✓ synced
                   (best: 24.30m)

  Total: 785 pts  ·  Mark: 2 (gut)

> show "Müller"

Found 2 matches:
  #12  Müller, Anna   (5a, female)
  #24  Müller, Jonas  (6b, male)
Use: show #12   or   show #24
```

#### `list` — Filtered participant lists
```
> list --class 5a --missing 3-jump

PARTICIPANTS MISSING 3-JUMP DATA — Klasse 5a
─────────────────────────────────────────────
  #03  Schmidt, Ben       (no attempts)
  #08  Klein, Eva         (1 of 2 attempts)
  #21  Braun, Felix       (no attempts)

3 participants need 3-Jump data.

> list --pending

UNSYNCHRONIZED ENTRIES
──────────────────────
  #07  Weber, Clara      3-Jump Try 1    5.42m   💾 saved
  #14  Fischer, David    50m Sprint      8.21s   💾 saved
  #28  Zimmermann, Paul  3-Jump Try 1    6.01m   ⚡ conflict
  ...
  7 entries total.
```

#### `helpers` — Helper device status
```
> helpers

HELPER STATIONS
───────────────
  Helper-1   800m Run       ☁✓ online   last: 0s    synced: 100%
  Helper-2   50m Sprint     ☁✓ online   last: 3s    synced: 87%
  Helper-3   3-Jump         ⊘ OFFLINE   last: 47s   synced: 42%
  Helper-4   Distance Throw ☁✓ online   last: 1s    synced: 94%
```

#### `progress` — Completion matrix
```
> progress

COMPLETION MATRIX
─────────────────
           800m    50m     3-Jump  Throw
  5a       ████░   █████   ███░░   ░░░░░   68%
  5b       █████   ░░░░░   ███░░   █████   62%
  6a       ░░░░░   ░░░░░   ░░░░░   ░░░░░    0%
  6b       ███░░   █████   █████   █████   88%

  Overall: 72.3% complete
  █ = 20% each
```

#### `conflicts` — View and resolve sync conflicts
```
> conflicts

UNRESOLVED CONFLICTS (2)
────────────────────────
  [1]  #14 Fischer,D   3-Jump Try 1   local: 5.42m   server: 5.38m
  [2]  #28 Zimmermann,P 3-Jump Try 1  local: 6.01m   server: 5.98m

Resolve with:  resolve 1 --keep-local   or   resolve 1 --accept-server

> resolve 1 --keep-local

✓ Conflict #1 resolved. Kept local value 5.42m for #14 Fischer, David.
  1 conflict remaining.

> resolve all --accept-server

✓ Resolved 1 remaining conflict(s) using server values.
  0 conflicts remaining.
```

#### `edit` — Modify data
```
> edit #07 3-jump try1 5.45

✓ Updated #07 Weber, Clara — 3-Jump Try 1: 5.42m → 5.45m
  New best: 5.45m (Try 1)
  Saving... 💾 saved. Syncing...

> edit #12 800m 188.2

✓ Updated #12 Müller, Anna — 800m Run: 187.4s → 188.2s
  Points: 198 → 196
  Saving... ☁✓ synced.
```

#### `export` — Generate reports
```
> export --format csv

Generating CSV...
✓ Downloaded: tournament-results-2026-03-24.csv (120 participants, 480 values)

> export --format pdf --class 5a

Generating PDF for Klasse 5a...
✓ Downloaded: results-5a-2026-03-24.pdf (30 participants)

> export --format pdf --certificates

Generating individual certificates...
✓ Downloaded: certificates-2026-03-24.pdf (120 pages)
```

#### `config` — Settings management
```
> config disciplines

DISCIPLINES
───────────
  1. 800m Run         unit: seconds    timer: yes
  2. 50m Sprint       unit: seconds    timer: yes
  3. 3-Jump           unit: meters     tries: 2
  4. Distance Throw   unit: meters     tries: 2

> config add-discipline "Long Jump" --unit meters --tries 3

✓ Added discipline "Long Jump" (meters, 3 tries).
  Scoring table needed. Upload with: config scoring "Long Jump"

> config classes

CLASSES
───────
  5a   Level: Intermediate   28 participants
  5b   Level: Intermediate   26 participants
  6a   Level: Advanced       30 participants
  6b   Level: Advanced       25 participants

> config scoring 3-jump --level intermediate --gender female

SCORING TABLE — 3-Jump, Intermediate, Female
────────────────────────────────────────────
  Distance    Points
  ≥ 6.00m     220
  ≥ 5.50m     200
  ≥ 5.00m     180
  ≥ 4.50m     160
  ...
```

---

## Autocomplete & Shortcuts

### Tab Autocomplete
Pressing **Tab** in the input bar completes partial commands:
```
  > sta[Tab]     →  > status
  > ran[Tab]     →  > rank
  > sh[Tab]      →  > show
  > show #0[Tab] →  > show #07    (first matching ID)
  > show "Mü[Tab] → > show "Müller"
  > list --cl[Tab] → > list --class
```

### History
- **↑** / **↓** arrows cycle through previous commands.
- **Ctrl+R** opens reverse search (type to find a previous command).

### Aliases
```
> alias s status
> alias r rank
> alias p progress

> s
(runs status)
```

### Chaining
```
> status ; conflicts ; helpers

(runs all three sequentially, output stacked in the log)
```

---

## Live Event Stream

The log is not just for responses to commands. Real-time events push into the
log with a distinct styling (dimmed text, left-border accent) so they are
visually separate from command/response pairs:

```
  > status
  (... status output ...)

  │ 14:32:01  ☁✓  #07 Weber,C → 3-Jump Try 1: 5.42m (Helper-3)
  │ 14:32:14  ☁✓  #19 Fischer,D → 50m: 8.21s (Helper-2)
  │ 14:32:20  ⚡   CONFLICT #28 Zimmermann,P 3-Jump Try 1

  > _
```

Events appear **between** command interactions so the organizer stays aware
of activity without needing a separate panel or feed. They scroll up naturally
with the log history.

### Muting the Stream
```
> mute              ← pauses live events in the log
> unmute            ← resumes
> mute --except conflicts   ← only show conflict events
```

---

## Inline Notifications

Critical events (helper going offline, conflicts) also produce a **toast line**
that briefly highlights at the bottom of the log, above the input bar:

```
  ┌──────────────────────────────────────────────────┐
  │  🔴 Helper-3 went offline (3-Jump station)        │  ← fades after 5s
  └──────────────────────────────────────────────────┘
  > ▏
```

The organizer can then type `helpers` or `conflicts` to investigate.

---

## Quick Reference (F1)

Pressing **F1** shows a help overlay listing all commands:

```
┌───────────────────────────────────────────────────────┐
│  COMMAND REFERENCE                          [Esc close]│
│                                                       │
│  status            Tournament overview                │
│  rank [--flags]    Rankings (overall, by class, etc.) │
│  show <id|name>    Participant detail                 │
│  list [--flags]    Filtered participant lists          │
│  helpers           Helper device status               │
│  progress          Completion matrix                  │
│  conflicts         View unresolved conflicts          │
│  resolve <n> <opt> Resolve a conflict                 │
│  edit <id> <args>  Modify a recorded value            │
│  export [--flags]  Generate CSV/PDF reports           │
│  config [sub]      View/edit settings                 │
│  mute / unmute     Toggle live event stream           │
│  alias <a> <cmd>   Create command shortcut            │
│  clear             Clear log history                  │
│  help <command>    Detailed help for a command        │
│                                                       │
│  Flags: --class, --discipline, --gender, --level      │
│         --format, --missing, --pending                │
│                                                       │
│  Tab: autocomplete  ↑↓: history  Ctrl+R: search      │
└───────────────────────────────────────────────────────┘
```

---

## Offline Behavior

- All commands operate on locally cached data in IndexedDB.
- Title bar shows `⊘ OFFLINE` when disconnected.
- Commands that require sync (`resolve`, live events) show a warning:
  `⚠ Offline. Data may be stale. Last sync: 2m ago.`
- On reconnection, a burst of queued events appears in the log.

---

## Responsive Behavior

Since the interface is monospace text in a scrolling log, it naturally adapts
to any width. The only adjustment:

- **< 600px**: Input bar hint text is hidden (just the `>` prompt remains).
- **> 1200px**: Log column width caps at 100 characters for readability
  (centered with margins).
