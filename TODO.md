# TODO — Missing Implementations & Bugs

## Bugs

### `js/central-logic.js`

- **`computeRankings`: Best performance per participant is computed globally, not per discipline.**
  `participantBestPerformances` currently picks the single best measurement across *all* disciplines per participant and maps it into only that measurement's discipline. It must compute the best value per participant per discipline.

- **`computeRankings`: Mark calculation uses `>=` for all units.**
  `bestMeas.value >= minValue` is correct for distance-based disciplines (meters) but wrong for time-based disciplines (minutes), where a lower value is better. Mark lookup must respect the discipline's `unitOrder`.

- **`computeRankings`: `Object.entries(markInfo)` iteration order and selection logic.**
  Numeric mark keys are iterated in ascending order; the marking loop currently breaks on the first `>= min_value`, which can pick the worst qualifying mark. The loop should pick the best applicable mark according to mark ordering and unit direction.

### `js/server.ts`

- **`POST /sync`: participants query omits the `gender` column in the sync response.**
  The sync response currently selects `id, name, forename, class_name AS class` (no `gender`) — this causes helpers to lose gender info when syncing.

- **`PATCH /mark-ranges/:discipline_id/:mark`: route params insufficient to uniquely identify a row.**
  The `mark-ranges` table is uniquely keyed by `(discipline_id, class_level, gender, mark)`. The current route cannot address `class_level`/`gender`, so updates may touch the wrong rows.

- **`DELETE /mark-ranges/:discipline_id` and `/mark-ranges/:discipline_id/:mark` cannot target a specific `(class_level, gender)` group.**

- **`POST /measurements`: no conflict resolution policy.**
  When a measurement for the same `(participant_id, discipline_id, attempt_number)` exists with a differing `value` or `created_at`, the current code silently skips insertion. Decide on expected behaviour (keep newest, overwrite, or surface conflicts).

### `js/central.js`

- **Nav bar clock is not updated on central pages.**
  `helper.js` updates `#top-bar div.time-display span`, but central pages lack the same interval — the time remains static on central views.

- **`displayResults`: participants without rankings are appended but then skipped.**
  `participantsToDisplay` concatenates missing participants, but the render loop immediately returns when `!ranking`. Choose one behaviour: show participants with 0 points, or omit them from `participantsToDisplay`.

- **Dashboard discipline tiles show placeholder helper/current-class.**
  `displayDashboardDisciplines` renders `Helper 1, Helper 2` and `Klasse 8a` statically; these should be replaced with live data from helpers/clients.

### `js/helper.js` / `js/helper-db.js`

- **`syncWithServer`: mismatched measurement key from server response.**
  The server returns `measurements` in the sync response; `syncWithServer` expects `serverMeasurements` and therefore may not apply returned measurements into the local DB.

- **`addParticipantOrUpdate` (IndexedDB) does not store `gender`.**
  Local `participants` rows and `addParticipantOrUpdate` do not include `gender`, so synced participant gender is lost locally.

## Missing Implementations / Features

- **Edit handlers (missing):** `edit-class`, `edit-participant`, `edit-discipline`, `edit-mark-range` — buttons exist but edit flows/handlers are not implemented.

- **Participants page: class-level filter listener missing.**
  `#class-level-filter` is populated but `setupParticipantsFilters` does not attach a listener for it.

- **`initSyncPage`: discipline status table is not populated.**
  Helper status is rendered via WebSocket, but the "Disziplinen Status" table in `central-sync.html` remains static.

- **Import / Export UI wiring.**
  `central-import-export.html` contains buttons and inputs but no JS listeners or implementation for import/export.

- **Live dashboard feed.**
  `#live-event-list` in `central.html` is not populated from WebSocket/polling — it uses placeholder content in the HTML/CSS only.

- **Helper-side timers.**
  Timer start/stop buttons are rendered for timer disciplines in `js/helper.js`, but no timer logic or event handlers are attached.
