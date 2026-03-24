# Central Interface - Sketch & Page Layout

## Overview
The central interface is for administrators and organizers to manage, analyze, and view competition data. It includes data management, rankings, reporting, and configuration pages.

---

## Page Structure (Multi-Page Navigation)

### Top Bar
- Logo
- Data Import Status
- Sync Indicator (for helper synchronization)
- Navigation Tabs: Dashboard | Participants | Rankings | Sync | Settings | Reports

---

## Page 1: Dashboard / Overview

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] Sport Tournament Central | Sync: 0 pending           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Dashboard  │ Participants │ Rankings │ Sync │ Settings      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Base Data & Configuration                                 │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Import Base Data (Participants, Disciplines, etc.)  │  │
│  │ [Choose File]  [Import]  Status: Ready             │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  Quick Stats (Grid)                                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐      │
│  │ Disciplines  │ │ Classes      │ │ Helpers      │      │
│  │      4       │ │      4       │ │      8       │      │
│  └──────────────┘ └──────────────┘ └──────────────┘      │
│                                                             │
│  Helper Status                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Station 1: Online ✓   | Last Sync: 1m ago          │  │
│  │ Station 2: Online ✓   | Last Sync: 3m ago          │  │
│  │ Station 3: Online ✓   | Last Sync: 2m ago          │  │
│  │ Station 4: Offline    | Last Sync: 15m ago         │  │
│  │ Pending Entries: 12                                 │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  Helper Sync Activity                                      │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Station 3 - 800m: 12 entries synced                │  │
│  │ Station 1 - 50m: 8 entries pending                 │  │
│  │ Station 2 - 3-Jump: 5 entries synced               │  │
│  │ Conflict: David Weber, 3-Jump attempt 1            │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Page 2: Participants Management

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] Sport Tournament Central                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Dashboard  │ Participants │ Rankings │ Sync │ Settings      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [+ Add Participant] | Class: [U10 ▼]  | Gender: [All ▼]   │
│ Search: [_____________________]  [Filter] [Export] [Import]       │
│                                                             │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ ID  │ Name           │ Class  │ Status │ 800m │ 50m │  │
│ ├──────────────────────────────────────────────────────┤  │
│ │ 001 │ Anna Mueller   │ U10    │ ✓      │ 185s │ 7.5s│  │
│ │ 002 │ Bruno Schmitz  │ U10    │ ●      │  -   │  -  │  │
│ │ 003 │ Clara Rossi    │ U10    │ ✓      │ 182s │ 7.3s│  │
│ │ 004 │ David Weber    │ U10    │ ⚠      │ 190s │  -  │  │
│ │ 005 │ Eva Keller     │ U10    │ ✓      │ 188s │ 7.8s│  │
│ │        ... (scrollable)                               │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                             │
│ Legend:  ✓ Complete  ● Pending  ⚠ Error  - No Entry       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Page 3: Rankings & Results (Multiple Sub-Views)

### 3a. Overall Rankings
```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] Sport Tournament Central | Sync: 0 pending           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Dashboard  │ Participants │ Rankings │ Sync │ Settings      │
│             └─ Overall    └─ By Class   ─ By Discipline    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Overall Rankings (All Classes Combined)                   │
│ Filter: [Class Level: All ▼] | [Refresh]                │
│                                                             │
│ ┌──────────────────────────────────────────────────────┐  │
│ │Rank│ Name      │ 800m    │ 50m    │ 3-J    │ Throw  │  │
│ │    │           │Val/Pts  │Val/Pts │Val/Pts │Val/Pts│  │
│ ├──────────────────────────────────────────────────────┤  │
│ │  1 │ Anna M.   │182/25   │7.5/24  │6.2/23  │32/25  │  │
│ │    │           │ Aggregate Points: 97                │  │
│ ├──────────────────────────────────────────────────────┤  │
│ │  2 │ Clara R.  │184/23   │7.3/25  │5.8/21  │31/23  │  │
│ │    │           │ Aggregate Points: 92                │  │
│ ├──────────────────────────────────────────────────────┤  │
│ │  3 │ Eva K.    │185/22   │7.8/22  │6.5/24  │30/22  │  │
│ │    │           │ Aggregate Points: 90                │  │
│ ├──────────────────────────────────────────────────────┤  │
│ │  4 │ David W.  │190/20   │-/0     │6.1/22  │29/21  │  │
│ │    │           │ Aggregate Points: 63                │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                             │
│ [Export to PDF] [Export to CSV] [Print]                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3b. By Class Rankings
```
┌─────────────────────────────────────────────────────────────┐
│ Dashboard  │ Participants │ Rankings │ Sync │ Settings      │
│             └─ Overall    └─ By Class   ─ By Discipline    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Class Level: [Intermediate ▼]                             │
│                                                             │
│ ┌──────────────────────────────────────────────────────┐  │
│ │Rank│ Name      │ 800m    │ 50m    │ 3-J    │ Throw  │  │
│ │    │           │Val/Pts  │Val/Pts │Val/Pts │Val/Pts│  │
│ ├──────────────────────────────────────────────────────┤  │
│ │  1 │ Anna M.   │182/25   │7.5/24  │6.2/23  │32/25  │  │
│ │    │           │ Aggregate Points: 97                │  │
│ ├──────────────────────────────────────────────────────┤  │
│ │  2 │ Clara R.  │184/23   │7.3/25  │5.8/21  │31/23  │  │
│ │    │           │ Aggregate Points: 92                │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3c. By Discipline Rankings
```
┌─────────────────────────────────────────────────────────────┐
│ Dashboard  │ Participants │ Rankings │ Sync │ Settings      │
│             └─ Overall    └─ By Class   ─ By Discipline    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Discipline: [800m Run ▼] | Class Level: [All ▼]          │
│                                                             │
│ ┌──────────────────────────────────────────────────────┐  │
│ │Rank│ Name      │ Value  │ Points │ Class Level      │  │
│ ├──────────────────────────────────────────────────────┤  │
│ │  1 │ Anna M.   │ 182.5s │ 25     │ Intermediate     │  │
│ │  2 │ David W.  │ 183.2s │ 24     │ Intermediate     │  │
│ │  3 │ Clara R.  │ 184.1s │ 23     │ Intermediate     │  │
│ │  4 │ Eva K.    │ 185.5s │ 22     │ Intermediate     │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Page 4: Synchronization Management (Helper Sync)

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] Sport Tournament Central | Sync: 0 pending           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Dashboard  │ Participants │ Rankings │ Sync │ Settings      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Helper Synchronization Status                              │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ Auto-Sync: Enabled ✓                               │  │
│ │ Last Global Sync: 2 minutes ago (09:45 AM)        │  │
│ │ Next Sync: In 58 seconds                           │  │
│ │ [Sync Now] [Enable/Disable]                        │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                             │
│ Helper Stations                                            │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ Station │ Status  │ Last Sync  │ Pending │ Errors  │  │
│ ├──────────────────────────────────────────────────────┤  │
│ │   1    │ Online  │ 1m ago     │ 3       │ 0       │  │
│ │   2    │ Online  │ 3m ago     │ 2       │ 0       │  │
│ │   3    │ Online  │ 2m ago     │ 4       │ 0       │  │
│ │   4    │ Offline │ 15m ago    │ 3       │ 1       │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                             │
│ Pending Entries Queue (12 total)                           │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ Station │ Name           │ Discipline │ Status      │  │
│ ├──────────────────────────────────────────────────────┤  │
│ │   1    │ Bruno Schmitz  │ 50m        │ Waiting     │  │
│ │   1    │ David Weber    │ 800m       │ Waiting     │  │
│ │   3    │ Eva Keller     │ 3-Jump     │ Conflict! ⚠ │  │
│ │        ... (scrollable)                               │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                             │
│ Conflict Resolution (1 conflict)                           │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ Station 3 - Eva Keller, 3-Jump, Attempt 1         │  │
│ │ Station Value: 6.5m  vs  Database: 6.2m           │  │
│ │ [Accept New] [Keep Old] [Manual Review]            │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Page 5: Settings & Configuration

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] Sport Tournament Central | Sync: 0 pending           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Dashboard  │ Participants │ Rankings │ Sync │ Settings      │
│             └─ Disciplines  ─ Classes & Levels  ─ Scoring   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Disciplines Management                                     │
│ [+ Add Discipline]                                         │
│                                                             │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ Name              │ Type      │ Attempts │ Actions  │  │
│ ├──────────────────────────────────────────────────────┤  │
│ │ 800m Run          │ Time (s)  │ 1        │ [Edit]   │  │
│ │ 50m Sprint        │ Time (s)  │ 1        │ [Edit]   │  │
│ │ 3-Jump            │ Distance  │ 2        │ [Edit]   │  │
│ │ Distance Throw    │ Distance  │ 2        │ [Edit]   │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                             │
│ Classes & Class Levels                                     │
│ [+ Add Class]                                              │
│                                                             │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ Class Name    │ Class Level  │ Min Age │ Actions    │  │
│ ├──────────────────────────────────────────────────────┤  │
│ │ U10           │ Beginner     │ 8       │ [Edit]     │  │
│ │ U12           │ Intermediate │ 10      │ [Edit]     │  │
│ │ U14           │ Advanced     │ 12      │ [Edit]     │  │
│ │ U16           │ Elite        │ 14      │ [Edit]     │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                             │
│ Scoring Tables (by Class Level)                            │
│                                                             │
│ Class Level: [Beginner ▼] | Discipline: [800m Run ▼]    │
│ [+ Add Entry]                                              │
│                                                             │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ Performance (s)  │ Points │ Actions                  │  │
│ ├──────────────────────────────────────────────────────┤  │
│ │ ≤ 180           │ 25     │ [Edit] [Delete]          │  │
│ │ 180 - 190       │ 24     │ [Edit] [Delete]          │  │
│ │ 190 - 200       │ 23     │ [Edit] [Delete]          │  │
│ │ 200 - 210       │ 22     │ [Edit] [Delete]          │  │
│ │ > 210           │ 20     │ [Edit] [Delete]          │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                             │
│ [Update] [Cancel]                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Page 6: Reports & Export

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] Sport Tournament Central | Sync: 0 pending           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Dashboard  │ Participants │ Rankings │ Sync │ Settings      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Report Generation                                          │
│                                                             │
│ Report Type: [Overall Rankings ▼] | Format: [PDF ▼]      │
│ Include: [Charts] [Statistics] [Details]                  │
│ [Generate Report]                                          │
│                                                             │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ Recent Reports                                       │  │
│ │ - Overall Rankings (2026-03-20 10:30) [PDF] [CSV]  │  │
│ │ - By Class Level (2026-03-20 09:15) [PDF] [CSV]    │  │
│ │ - 800m Discipline (2026-03-20 08:45) [PDF] [CSV]   │  │
│ │ - Participant List (2026-03-20 08:00) [PDF] [CSV]  │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                             │
│ Data Export                                                │
│                                                             │
│ Export: [All Data ▼] Format: [CSV ▼]                     │
│ [Export]                                                   │
│                                                             │
│ Or select specific exports:                                │
│ [Export Participants] [Export Scores] [Export Errors]     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Features by Page

| Page | Function | Key Actions |
|------|----------|-------------|
| Dashboard | System overview | Import base data, View helper status, View sync activity |
| Participants | Manage all participants | Add/Edit/Delete, View status, Discipline progress |
| Rankings | View results with values and points | Filter by class level, Sort by aggregate points |
| Synchronization | Manage helper sync | View helper stations, Handle conflicts, Resolve errors |
| Settings | Configure system | Manage disciplines, Define class levels, Setup scoring by level |
| Reports | Export data | Generate reports, Export CSV/PDF |

---

## Data Flow Changes

- **Base Data Import**: Disciplines, Classes, Participants (excluding measurements)
- **Class Level Organization**: Classes mapped to levels (Beginner, Intermediate, Advanced, Elite)
- **Scoring by Level**: Scoring tables configured per class level (not per individual class)
- **Rankings Display**: Shows raw values, points per discipline, and aggregate points
- **Helper Sync Only**: Synchronization focused on helper station data sync, not central backend sync
- **Top Bar Indicator**: Sync status shows pending entries from helper stations

---

## Navigation Patterns

- **Top Bar**: Logo, Base Data Import, Sync Indicator (pending count), Main Navigation Tabs
- **Main Navigation**: Dashboard | Participants | Rankings | Sync | Settings | Reports
- **Sub-Navigation**: Ranking filters (Overall, By Class Level, By Discipline)
- **Actions**: Add, Edit, Delete, Import, Export, Sync, Resolve
- **Filters**: Class Level, Discipline filtering
- **Status Indicators**: Online/Offline (Helpers), Synced/Pending/Error (Entries)

---

## Ranking Table Format

Each discipline shows:
- **Val**: Raw performance value (time in seconds or distance in meters)
- **Pts**: Points awarded based on scoring table for class level
- **Aggregate Points**: Sum of points across all disciplines (best value)

Example row:
```
Rank | Name | 800m(Val/Pts) | 50m(Val/Pts) | 3-J(Val/Pts) | Throw(Val/Pts) | Aggregate
  1  | Anna | 182.5/25      | 7.5/24       | 6.2/23       | 32/25          | 97
```

---

## Class Level Structure

```
Class Level  | Classes    | Scoring Table | Age Range
-------------|------------|---------------|----------
Beginner     | U10        | Beginner      | 8-10
Intermediate | U12, U14   | Intermediate  | 10-14
Advanced     | U16-U18    | Advanced      | 14-18
Elite        | U20+       | Elite         | 20+
```

Scoring tables are configured at the class level, not per individual class, allowing multiple classes to share the same performance-to-points conversion.
