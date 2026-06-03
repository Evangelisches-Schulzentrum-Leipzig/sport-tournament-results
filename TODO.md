# TODO — Missing Implementations & Bugs

## Bugs

### `js/central-logic.js`

- **`computeRankings`: Best performance per participant is computed globally, not per discipline.**
  `participantBestPerformances` picks the single best measurement across *all* disciplines per participant, then maps it into only the ranking for *that measurement's discipline*. Participants are therefore missing from all other discipline rankings. Should compute the best value per discipline per participant.

- **`computeRankings`: Mark calculation uses `>=` for all units.**
  `bestMeas.value >= minValue` is correct for distance-based disciplines (meters) but wrong for time-based disciplines (minutes), where a lower value is better. Mark lookup must respect the discipline's `unitOrder`.

- **`computeRankings`: `Object.entries(markInfo)` iteration order is not guaranteed.**
  Numeric keys are sorted ascending in V8 (mark 1 first), so the first `break` on `>= min_value` may return the worst qualifying mark instead of the best. Entries should be sorted explicitly from best mark (1) to worst (6) and the last qualifying mark selected.

### `js/server.ts`

- **`POST /sync`: participants query is missing the `gender` column.**
  `SELECT id, name, forename, class_name AS class FROM participants` should include `gender` so the synced snapshot is consistent with all other participant endpoints.

- **`PATCH /mark-ranges/:discipline_id/:mark`: route params are insufficient to uniquely identify a row.**
  The unique key is `(discipline_id, class_level, gender, mark)`. Without `class_level` and `gender` in the route, the UPDATE will silently affect the wrong rows when multiple class-level/gender combinations share the same discipline and mark number.

- **`DELETE /mark-ranges/:discipline_id`: deletes all ranges for an entire discipline.**
  There is no endpoint to delete a single `(discipline_id, class_level, gender)` group. The existing `/mark-ranges/:discipline_id/:mark` endpoint also cannot filter by `class_level` and `gender`.

- **`POST /measurements` (existing TODO): no conflict handling.**
  When a measurement with the same `participant_id`, `discipline_id`, and `attempt_number` exists but has a different `value` or `created_at`, the record is silently skipped. Strategy needs to be decided (e.g. keep newest by `created_at`, raise a conflict, or overwrite).

### `js/central.js`

- **Nav bar clock is never updated on central pages.**
  The `<span>10:00:00</span>` in the nav bar is a static placeholder. `setInterval` to update it exists in `helper.js` but not in `central.js`.

- **`displayResults`: concatenated `missingParticipants` are always skipped.**
  Participants not found in `overallRankings` are appended to `participantsToDisplay`, but the loop immediately does `if (!ranking) return` for them. Either the fallback should be removed or participants with no measurements should be shown with 0 points without requiring a ranking entry.

- **`displayDashboardDisciplines`: discipline tiles show hardcoded placeholder text.**
  `discipline-helper` shows "Helper 1, Helper 2" and `discipline-current-class` shows "Klasse 8a" — neither is loaded from real data.

### `js/helper.js`

- **`syncWithServer`: wrong destructuring key for server measurements.**
  The `sync()` API response returns `{ classes, disciplines, participants, measurements }`, but `syncWithServer` destructures `serverMeasurements`. This key is always `undefined`, so the local DB is never updated with server measurements after a sync.

### `js/helper-db.js` / `js/helper.js`

- **`addParticipantOrUpdate` does not store `gender`.**
  The local IndexedDB `participants` table schema and `addParticipantOrUpdate` both omit `gender`, so gender is lost locally. The helper data input table also never receives gender info from the server sync.

---

## Missing Implementations

### `js/central.js`

- **Edit/Delete handlers for classes** (`edit-class` / `delete-class` buttons are rendered but have no event listeners).

- **Edit/Delete handlers for participants** (`edit-participant` / `delete-participant` buttons are rendered but have no event listeners).

- **Edit/Delete handlers for disciplines** (`edit-discipline` / `delete-discipline` buttons are rendered but have no event listeners).

- **Edit/Delete handlers for mark ranges** (`edit-mark-range` / `delete-mark-range` buttons are rendered but have no event listeners).

- **Class-level filter on the participants page has no event listener.**
  `#class-level-filter` exists in the DOM but `setupParticipantsFilters` only attaches a listener to the class-name filter and search input.

- **`initSyncPage`: "Helfer Status" and "Disziplinen Status" sections are never populated.**
  Both tables in `central-sync.html` contain hardcoded placeholder rows and are not loaded or updated from any data source.

- **`central-import-export.html`: all import and export buttons have no event listeners.**
  File inputs, import buttons, export format/class selectors, and all export buttons are never wired up. No import or export logic exists anywhere in `central.js`.

- **Live feed on the dashboard is hardcoded.**
  `#live-event-list` in `central.html` is never cleared or updated. It should display recent measurements received via WebSocket or polling.

- **Dashboard discipline tiles: helper and current-class fields are hardcoded.**
  See bug note above — no data source exists yet for which helper is assigned to a discipline or which class is currently being processed.

### `js/server.ts`

- **WebSocket only echoes raw messages; no server-push for new measurements.**
  The WS server broadcasts whatever clients send, but never pushes notifications when a new measurement is inserted via `POST /measurements` or `POST /sync`. Central clients have no way to receive live updates without polling.

### `js/helper.js`

- **Timer button and stop-timer button have no functionality.**
  Rows for timer disciplines render a "Timer" start button and a "stop-timer" button, but no event listeners or timer logic is attached to them.
