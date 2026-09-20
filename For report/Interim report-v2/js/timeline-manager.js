/**
 * FOD Hunter CDE4301 - Interactive Timeline & Gantt Engine
 * Features:
 * - 5 Team Members only (Asuka, Zacarias, Hilbert, Bryan, Gabriel) - No team row.
 * - All-Member Columns Merged Vertically: S1 Wk12 (Interim Presentation), S1 Wk13 (Documentation Due),
 *   S2 Wk11 (Final Documentation Due), and S2 Wk13 (Final Presentation) merge across all rows.
 * - Dynamic Add Deliverable: Any deliverable designated for "All Members" automatically merges the entire column.
 * - Show by Week: Displays 1 week at a time (Mon-Sun), fitting 100% width with NO horizontal scroll.
 * - Show by Month: Displays 1 month at a time with continuous merged cells across weeks.
 * - Dynamic Subsystem Filter: Dropdown shows ONLY subsystems belonging to selected member.
 * - Subsystem Management: Members can Add, Rename, and Remove Subsystems with live UI updates.
 * - Rich Hover Tooltip: When Edit mode is deactivated, hovering over any task reveals member notes.
 * - Consistent Apple Dark UI: Identical styles, heights, and custom SVG chevrons for all selects and buttons.
 * - Repo Sync: 1-click Export to sync changes directly into git repo.
 * - Password Lock: Team passcode required to unlock Edit Mode.
 */

(function () {
  'use strict';

  // ── 1. CALENDAR DATA & STRUCTURES ─────────────────────────────────
  const TIMELINE_WEEKS = [
  {
    "index": 0,
    "code": "S1 Wk1",
    "sem": "1",
    "month": "Aug 2026",
    "startDate": "10 Aug 2026",
    "endDate": "16 Aug 2026",
    "dateRange": "10 Aug \u2013 16 Aug 2026",
    "days": [
      {
        "dayIndex": 0,
        "dayName": "Mon",
        "dayNum": 10,
        "monthName": "Aug",
        "dateStr": "10 Aug",
        "fullDate": "Monday, 10 August 2026",
        "iso": "2026-08-10",
        "isToday": false
      },
      {
        "dayIndex": 1,
        "dayName": "Tue",
        "dayNum": 11,
        "monthName": "Aug",
        "dateStr": "11 Aug",
        "fullDate": "Tuesday, 11 August 2026",
        "iso": "2026-08-11",
        "isToday": false
      },
      {
        "dayIndex": 2,
        "dayName": "Wed",
        "dayNum": 12,
        "monthName": "Aug",
        "dateStr": "12 Aug",
        "fullDate": "Wednesday, 12 August 2026",
        "iso": "2026-08-12",
        "isToday": false
      },
      {
        "dayIndex": 3,
        "dayName": "Thu",
        "dayNum": 13,
        "monthName": "Aug",
        "dateStr": "13 Aug",
        "fullDate": "Thursday, 13 August 2026",
        "iso": "2026-08-13",
        "isToday": false
      },
      {
        "dayIndex": 4,
        "dayName": "Fri",
        "dayNum": 14,
        "monthName": "Aug",
        "dateStr": "14 Aug",
        "fullDate": "Friday, 14 August 2026",
        "iso": "2026-08-14",
        "isToday": false
      },
      {
        "dayIndex": 5,
        "dayName": "Sat",
        "dayNum": 15,
        "monthName": "Aug",
        "dateStr": "15 Aug",
        "fullDate": "Saturday, 15 August 2026",
        "iso": "2026-08-15",
        "isToday": false
      },
      {
        "dayIndex": 6,
        "dayName": "Sun",
        "dayNum": 16,
        "monthName": "Aug",
        "dateStr": "16 Aug",
        "fullDate": "Sunday, 16 August 2026",
        "iso": "2026-08-16",
        "isToday": false
      }
    ],
    "isCurrent": false
  },
  {
    "index": 1,
    "code": "S1 Wk2",
    "sem": "1",
    "month": "Aug 2026",
    "startDate": "17 Aug 2026",
    "endDate": "23 Aug 2026",
    "dateRange": "17 Aug \u2013 23 Aug 2026",
    "days": [
      {
        "dayIndex": 0,
        "dayName": "Mon",
        "dayNum": 17,
        "monthName": "Aug",
        "dateStr": "17 Aug",
        "fullDate": "Monday, 17 August 2026",
        "iso": "2026-08-17",
        "isToday": false
      },
      {
        "dayIndex": 1,
        "dayName": "Tue",
        "dayNum": 18,
        "monthName": "Aug",
        "dateStr": "18 Aug",
        "fullDate": "Tuesday, 18 August 2026",
        "iso": "2026-08-18",
        "isToday": false
      },
      {
        "dayIndex": 2,
        "dayName": "Wed",
        "dayNum": 19,
        "monthName": "Aug",
        "dateStr": "19 Aug",
        "fullDate": "Wednesday, 19 August 2026",
        "iso": "2026-08-19",
        "isToday": false
      },
      {
        "dayIndex": 3,
        "dayName": "Thu",
        "dayNum": 20,
        "monthName": "Aug",
        "dateStr": "20 Aug",
        "fullDate": "Thursday, 20 August 2026",
        "iso": "2026-08-20",
        "isToday": false
      },
      {
        "dayIndex": 4,
        "dayName": "Fri",
        "dayNum": 21,
        "monthName": "Aug",
        "dateStr": "21 Aug",
        "fullDate": "Friday, 21 August 2026",
        "iso": "2026-08-21",
        "isToday": false
      },
      {
        "dayIndex": 5,
        "dayName": "Sat",
        "dayNum": 22,
        "monthName": "Aug",
        "dateStr": "22 Aug",
        "fullDate": "Saturday, 22 August 2026",
        "iso": "2026-08-22",
        "isToday": false
      },
      {
        "dayIndex": 6,
        "dayName": "Sun",
        "dayNum": 23,
        "monthName": "Aug",
        "dateStr": "23 Aug",
        "fullDate": "Sunday, 23 August 2026",
        "iso": "2026-08-23",
        "isToday": false
      }
    ],
    "isCurrent": false
  },
  {
    "index": 2,
    "code": "S1 Wk3",
    "sem": "1",
    "month": "Aug 2026",
    "startDate": "24 Aug 2026",
    "endDate": "30 Aug 2026",
    "dateRange": "24 Aug \u2013 30 Aug 2026",
    "days": [
      {
        "dayIndex": 0,
        "dayName": "Mon",
        "dayNum": 24,
        "monthName": "Aug",
        "dateStr": "24 Aug",
        "fullDate": "Monday, 24 August 2026",
        "iso": "2026-08-24",
        "isToday": false
      },
      {
        "dayIndex": 1,
        "dayName": "Tue",
        "dayNum": 25,
        "monthName": "Aug",
        "dateStr": "25 Aug",
        "fullDate": "Tuesday, 25 August 2026",
        "iso": "2026-08-25",
        "isToday": false
      },
      {
        "dayIndex": 2,
        "dayName": "Wed",
        "dayNum": 26,
        "monthName": "Aug",
        "dateStr": "26 Aug",
        "fullDate": "Wednesday, 26 August 2026",
        "iso": "2026-08-26",
        "isToday": false
      },
      {
        "dayIndex": 3,
        "dayName": "Thu",
        "dayNum": 27,
        "monthName": "Aug",
        "dateStr": "27 Aug",
        "fullDate": "Thursday, 27 August 2026",
        "iso": "2026-08-27",
        "isToday": false
      },
      {
        "dayIndex": 4,
        "dayName": "Fri",
        "dayNum": 28,
        "monthName": "Aug",
        "dateStr": "28 Aug",
        "fullDate": "Friday, 28 August 2026",
        "iso": "2026-08-28",
        "isToday": false
      },
      {
        "dayIndex": 5,
        "dayName": "Sat",
        "dayNum": 29,
        "monthName": "Aug",
        "dateStr": "29 Aug",
        "fullDate": "Saturday, 29 August 2026",
        "iso": "2026-08-29",
        "isToday": false
      },
      {
        "dayIndex": 6,
        "dayName": "Sun",
        "dayNum": 30,
        "monthName": "Aug",
        "dateStr": "30 Aug",
        "fullDate": "Sunday, 30 August 2026",
        "iso": "2026-08-30",
        "isToday": false
      }
    ],
    "isCurrent": false
  },
  {
    "index": 3,
    "code": "S1 Wk4",
    "sem": "1",
    "month": "Aug 2026",
    "startDate": "31 Aug 2026",
    "endDate": "06 Sep 2026",
    "dateRange": "31 Aug \u2013 06 Sep 2026",
    "days": [
      {
        "dayIndex": 0,
        "dayName": "Mon",
        "dayNum": 31,
        "monthName": "Aug",
        "dateStr": "31 Aug",
        "fullDate": "Monday, 31 August 2026",
        "iso": "2026-08-31",
        "isToday": false
      },
      {
        "dayIndex": 1,
        "dayName": "Tue",
        "dayNum": 1,
        "monthName": "Sep",
        "dateStr": "01 Sep",
        "fullDate": "Tuesday, 01 September 2026",
        "iso": "2026-09-01",
        "isToday": false
      },
      {
        "dayIndex": 2,
        "dayName": "Wed",
        "dayNum": 2,
        "monthName": "Sep",
        "dateStr": "02 Sep",
        "fullDate": "Wednesday, 02 September 2026",
        "iso": "2026-09-02",
        "isToday": false
      },
      {
        "dayIndex": 3,
        "dayName": "Thu",
        "dayNum": 3,
        "monthName": "Sep",
        "dateStr": "03 Sep",
        "fullDate": "Thursday, 03 September 2026",
        "iso": "2026-09-03",
        "isToday": false
      },
      {
        "dayIndex": 4,
        "dayName": "Fri",
        "dayNum": 4,
        "monthName": "Sep",
        "dateStr": "04 Sep",
        "fullDate": "Friday, 04 September 2026",
        "iso": "2026-09-04",
        "isToday": false
      },
      {
        "dayIndex": 5,
        "dayName": "Sat",
        "dayNum": 5,
        "monthName": "Sep",
        "dateStr": "05 Sep",
        "fullDate": "Saturday, 05 September 2026",
        "iso": "2026-09-05",
        "isToday": false
      },
      {
        "dayIndex": 6,
        "dayName": "Sun",
        "dayNum": 6,
        "monthName": "Sep",
        "dateStr": "06 Sep",
        "fullDate": "Sunday, 06 September 2026",
        "iso": "2026-09-06",
        "isToday": false
      }
    ],
    "isCurrent": false
  },
  {
    "index": 4,
    "code": "S1 Wk5",
    "sem": "1",
    "month": "Sep 2026",
    "startDate": "07 Sep 2026",
    "endDate": "13 Sep 2026",
    "dateRange": "07 Sep \u2013 13 Sep 2026",
    "days": [
      {
        "dayIndex": 0,
        "dayName": "Mon",
        "dayNum": 7,
        "monthName": "Sep",
        "dateStr": "07 Sep",
        "fullDate": "Monday, 07 September 2026",
        "iso": "2026-09-07",
        "isToday": false
      },
      {
        "dayIndex": 1,
        "dayName": "Tue",
        "dayNum": 8,
        "monthName": "Sep",
        "dateStr": "08 Sep",
        "fullDate": "Tuesday, 08 September 2026",
        "iso": "2026-09-08",
        "isToday": false
      },
      {
        "dayIndex": 2,
        "dayName": "Wed",
        "dayNum": 9,
        "monthName": "Sep",
        "dateStr": "09 Sep",
        "fullDate": "Wednesday, 09 September 2026",
        "iso": "2026-09-09",
        "isToday": false
      },
      {
        "dayIndex": 3,
        "dayName": "Thu",
        "dayNum": 10,
        "monthName": "Sep",
        "dateStr": "10 Sep",
        "fullDate": "Thursday, 10 September 2026",
        "iso": "2026-09-10",
        "isToday": false
      },
      {
        "dayIndex": 4,
        "dayName": "Fri",
        "dayNum": 11,
        "monthName": "Sep",
        "dateStr": "11 Sep",
        "fullDate": "Friday, 11 September 2026",
        "iso": "2026-09-11",
        "isToday": false
      },
      {
        "dayIndex": 5,
        "dayName": "Sat",
        "dayNum": 12,
        "monthName": "Sep",
        "dateStr": "12 Sep",
        "fullDate": "Saturday, 12 September 2026",
        "iso": "2026-09-12",
        "isToday": false
      },
      {
        "dayIndex": 6,
        "dayName": "Sun",
        "dayNum": 13,
        "monthName": "Sep",
        "dateStr": "13 Sep",
        "fullDate": "Sunday, 13 September 2026",
        "iso": "2026-09-13",
        "isToday": false
      }
    ],
    "isCurrent": false
  },
  {
    "index": 5,
    "code": "S1 Wk6",
    "sem": "1",
    "month": "Sep 2026",
    "startDate": "14 Sep 2026",
    "endDate": "20 Sep 2026",
    "dateRange": "14 Sep \u2013 20 Sep 2026",
    "days": [
      {
        "dayIndex": 0,
        "dayName": "Mon",
        "dayNum": 14,
        "monthName": "Sep",
        "dateStr": "14 Sep",
        "fullDate": "Monday, 14 September 2026",
        "iso": "2026-09-14",
        "isToday": false
      },
      {
        "dayIndex": 1,
        "dayName": "Tue",
        "dayNum": 15,
        "monthName": "Sep",
        "dateStr": "15 Sep",
        "fullDate": "Tuesday, 15 September 2026",
        "iso": "2026-09-15",
        "isToday": false
      },
      {
        "dayIndex": 2,
        "dayName": "Wed",
        "dayNum": 16,
        "monthName": "Sep",
        "dateStr": "16 Sep",
        "fullDate": "Wednesday, 16 September 2026",
        "iso": "2026-09-16",
        "isToday": false
      },
      {
        "dayIndex": 3,
        "dayName": "Thu",
        "dayNum": 17,
        "monthName": "Sep",
        "dateStr": "17 Sep",
        "fullDate": "Thursday, 17 September 2026",
        "iso": "2026-09-17",
        "isToday": false
      },
      {
        "dayIndex": 4,
        "dayName": "Fri",
        "dayNum": 18,
        "monthName": "Sep",
        "dateStr": "18 Sep",
        "fullDate": "Friday, 18 September 2026",
        "iso": "2026-09-18",
        "isToday": false
      },
      {
        "dayIndex": 5,
        "dayName": "Sat",
        "dayNum": 19,
        "monthName": "Sep",
        "dateStr": "19 Sep",
        "fullDate": "Saturday, 19 September 2026",
        "iso": "2026-09-19",
        "isToday": false
      },
      {
        "dayIndex": 6,
        "dayName": "Sun",
        "dayNum": 20,
        "monthName": "Sep",
        "dateStr": "20 Sep",
        "fullDate": "Sunday, 20 September 2026",
        "iso": "2026-09-20",
        "isToday": true
      }
    ],
    "isCurrent": true
  },
  {
    "index": 6,
    "code": "S1 Recess",
    "sem": "1",
    "month": "Sep 2026",
    "startDate": "21 Sep 2026",
    "endDate": "27 Sep 2026",
    "dateRange": "21 Sep \u2013 27 Sep 2026",
    "days": [
      {
        "dayIndex": 0,
        "dayName": "Mon",
        "dayNum": 21,
        "monthName": "Sep",
        "dateStr": "21 Sep",
        "fullDate": "Monday, 21 September 2026",
        "iso": "2026-09-21",
        "isToday": false
      },
      {
        "dayIndex": 1,
        "dayName": "Tue",
        "dayNum": 22,
        "monthName": "Sep",
        "dateStr": "22 Sep",
        "fullDate": "Tuesday, 22 September 2026",
        "iso": "2026-09-22",
        "isToday": false
      },
      {
        "dayIndex": 2,
        "dayName": "Wed",
        "dayNum": 23,
        "monthName": "Sep",
        "dateStr": "23 Sep",
        "fullDate": "Wednesday, 23 September 2026",
        "iso": "2026-09-23",
        "isToday": false
      },
      {
        "dayIndex": 3,
        "dayName": "Thu",
        "dayNum": 24,
        "monthName": "Sep",
        "dateStr": "24 Sep",
        "fullDate": "Thursday, 24 September 2026",
        "iso": "2026-09-24",
        "isToday": false
      },
      {
        "dayIndex": 4,
        "dayName": "Fri",
        "dayNum": 25,
        "monthName": "Sep",
        "dateStr": "25 Sep",
        "fullDate": "Friday, 25 September 2026",
        "iso": "2026-09-25",
        "isToday": false
      },
      {
        "dayIndex": 5,
        "dayName": "Sat",
        "dayNum": 26,
        "monthName": "Sep",
        "dateStr": "26 Sep",
        "fullDate": "Saturday, 26 September 2026",
        "iso": "2026-09-26",
        "isToday": false
      },
      {
        "dayIndex": 6,
        "dayName": "Sun",
        "dayNum": 27,
        "monthName": "Sep",
        "dateStr": "27 Sep",
        "fullDate": "Sunday, 27 September 2026",
        "iso": "2026-09-27",
        "isToday": false
      }
    ],
    "isCurrent": false
  },
  {
    "index": 7,
    "code": "S1 Wk7",
    "sem": "1",
    "month": "Sep 2026",
    "startDate": "28 Sep 2026",
    "endDate": "04 Oct 2026",
    "dateRange": "28 Sep \u2013 04 Oct 2026",
    "days": [
      {
        "dayIndex": 0,
        "dayName": "Mon",
        "dayNum": 28,
        "monthName": "Sep",
        "dateStr": "28 Sep",
        "fullDate": "Monday, 28 September 2026",
        "iso": "2026-09-28",
        "isToday": false
      },
      {
        "dayIndex": 1,
        "dayName": "Tue",
        "dayNum": 29,
        "monthName": "Sep",
        "dateStr": "29 Sep",
        "fullDate": "Tuesday, 29 September 2026",
        "iso": "2026-09-29",
        "isToday": false
      },
      {
        "dayIndex": 2,
        "dayName": "Wed",
        "dayNum": 30,
        "monthName": "Sep",
        "dateStr": "30 Sep",
        "fullDate": "Wednesday, 30 September 2026",
        "iso": "2026-09-30",
        "isToday": false
      },
      {
        "dayIndex": 3,
        "dayName": "Thu",
        "dayNum": 1,
        "monthName": "Oct",
        "dateStr": "01 Oct",
        "fullDate": "Thursday, 01 October 2026",
        "iso": "2026-10-01",
        "isToday": false
      },
      {
        "dayIndex": 4,
        "dayName": "Fri",
        "dayNum": 2,
        "monthName": "Oct",
        "dateStr": "02 Oct",
        "fullDate": "Friday, 02 October 2026",
        "iso": "2026-10-02",
        "isToday": false
      },
      {
        "dayIndex": 5,
        "dayName": "Sat",
        "dayNum": 3,
        "monthName": "Oct",
        "dateStr": "03 Oct",
        "fullDate": "Saturday, 03 October 2026",
        "iso": "2026-10-03",
        "isToday": false
      },
      {
        "dayIndex": 6,
        "dayName": "Sun",
        "dayNum": 4,
        "monthName": "Oct",
        "dateStr": "04 Oct",
        "fullDate": "Sunday, 04 October 2026",
        "iso": "2026-10-04",
        "isToday": false
      }
    ],
    "isCurrent": false
  },
  {
    "index": 8,
    "code": "S1 Wk8",
    "sem": "1",
    "month": "Oct 2026",
    "startDate": "05 Oct 2026",
    "endDate": "11 Oct 2026",
    "dateRange": "05 Oct \u2013 11 Oct 2026",
    "days": [
      {
        "dayIndex": 0,
        "dayName": "Mon",
        "dayNum": 5,
        "monthName": "Oct",
        "dateStr": "05 Oct",
        "fullDate": "Monday, 05 October 2026",
        "iso": "2026-10-05",
        "isToday": false
      },
      {
        "dayIndex": 1,
        "dayName": "Tue",
        "dayNum": 6,
        "monthName": "Oct",
        "dateStr": "06 Oct",
        "fullDate": "Tuesday, 06 October 2026",
        "iso": "2026-10-06",
        "isToday": false
      },
      {
        "dayIndex": 2,
        "dayName": "Wed",
        "dayNum": 7,
        "monthName": "Oct",
        "dateStr": "07 Oct",
        "fullDate": "Wednesday, 07 October 2026",
        "iso": "2026-10-07",
        "isToday": false
      },
      {
        "dayIndex": 3,
        "dayName": "Thu",
        "dayNum": 8,
        "monthName": "Oct",
        "dateStr": "08 Oct",
        "fullDate": "Thursday, 08 October 2026",
        "iso": "2026-10-08",
        "isToday": false
      },
      {
        "dayIndex": 4,
        "dayName": "Fri",
        "dayNum": 9,
        "monthName": "Oct",
        "dateStr": "09 Oct",
        "fullDate": "Friday, 09 October 2026",
        "iso": "2026-10-09",
        "isToday": false
      },
      {
        "dayIndex": 5,
        "dayName": "Sat",
        "dayNum": 10,
        "monthName": "Oct",
        "dateStr": "10 Oct",
        "fullDate": "Saturday, 10 October 2026",
        "iso": "2026-10-10",
        "isToday": false
      },
      {
        "dayIndex": 6,
        "dayName": "Sun",
        "dayNum": 11,
        "monthName": "Oct",
        "dateStr": "11 Oct",
        "fullDate": "Sunday, 11 October 2026",
        "iso": "2026-10-11",
        "isToday": false
      }
    ],
    "isCurrent": false
  },
  {
    "index": 9,
    "code": "S1 Wk9",
    "sem": "1",
    "month": "Oct 2026",
    "startDate": "12 Oct 2026",
    "endDate": "18 Oct 2026",
    "dateRange": "12 Oct \u2013 18 Oct 2026",
    "days": [
      {
        "dayIndex": 0,
        "dayName": "Mon",
        "dayNum": 12,
        "monthName": "Oct",
        "dateStr": "12 Oct",
        "fullDate": "Monday, 12 October 2026",
        "iso": "2026-10-12",
        "isToday": false
      },
      {
        "dayIndex": 1,
        "dayName": "Tue",
        "dayNum": 13,
        "monthName": "Oct",
        "dateStr": "13 Oct",
        "fullDate": "Tuesday, 13 October 2026",
        "iso": "2026-10-13",
        "isToday": false
      },
      {
        "dayIndex": 2,
        "dayName": "Wed",
        "dayNum": 14,
        "monthName": "Oct",
        "dateStr": "14 Oct",
        "fullDate": "Wednesday, 14 October 2026",
        "iso": "2026-10-14",
        "isToday": false
      },
      {
        "dayIndex": 3,
        "dayName": "Thu",
        "dayNum": 15,
        "monthName": "Oct",
        "dateStr": "15 Oct",
        "fullDate": "Thursday, 15 October 2026",
        "iso": "2026-10-15",
        "isToday": false
      },
      {
        "dayIndex": 4,
        "dayName": "Fri",
        "dayNum": 16,
        "monthName": "Oct",
        "dateStr": "16 Oct",
        "fullDate": "Friday, 16 October 2026",
        "iso": "2026-10-16",
        "isToday": false
      },
      {
        "dayIndex": 5,
        "dayName": "Sat",
        "dayNum": 17,
        "monthName": "Oct",
        "dateStr": "17 Oct",
        "fullDate": "Saturday, 17 October 2026",
        "iso": "2026-10-17",
        "isToday": false
      },
      {
        "dayIndex": 6,
        "dayName": "Sun",
        "dayNum": 18,
        "monthName": "Oct",
        "dateStr": "18 Oct",
        "fullDate": "Sunday, 18 October 2026",
        "iso": "2026-10-18",
        "isToday": false
      }
    ],
    "isCurrent": false
  },
  {
    "index": 10,
    "code": "S1 Wk10",
    "sem": "1",
    "month": "Oct 2026",
    "startDate": "19 Oct 2026",
    "endDate": "25 Oct 2026",
    "dateRange": "19 Oct \u2013 25 Oct 2026",
    "days": [
      {
        "dayIndex": 0,
        "dayName": "Mon",
        "dayNum": 19,
        "monthName": "Oct",
        "dateStr": "19 Oct",
        "fullDate": "Monday, 19 October 2026",
        "iso": "2026-10-19",
        "isToday": false
      },
      {
        "dayIndex": 1,
        "dayName": "Tue",
        "dayNum": 20,
        "monthName": "Oct",
        "dateStr": "20 Oct",
        "fullDate": "Tuesday, 20 October 2026",
        "iso": "2026-10-20",
        "isToday": false
      },
      {
        "dayIndex": 2,
        "dayName": "Wed",
        "dayNum": 21,
        "monthName": "Oct",
        "dateStr": "21 Oct",
        "fullDate": "Wednesday, 21 October 2026",
        "iso": "2026-10-21",
        "isToday": false
      },
      {
        "dayIndex": 3,
        "dayName": "Thu",
        "dayNum": 22,
        "monthName": "Oct",
        "dateStr": "22 Oct",
        "fullDate": "Thursday, 22 October 2026",
        "iso": "2026-10-22",
        "isToday": false
      },
      {
        "dayIndex": 4,
        "dayName": "Fri",
        "dayNum": 23,
        "monthName": "Oct",
        "dateStr": "23 Oct",
        "fullDate": "Friday, 23 October 2026",
        "iso": "2026-10-23",
        "isToday": false
      },
      {
        "dayIndex": 5,
        "dayName": "Sat",
        "dayNum": 24,
        "monthName": "Oct",
        "dateStr": "24 Oct",
        "fullDate": "Saturday, 24 October 2026",
        "iso": "2026-10-24",
        "isToday": false
      },
      {
        "dayIndex": 6,
        "dayName": "Sun",
        "dayNum": 25,
        "monthName": "Oct",
        "dateStr": "25 Oct",
        "fullDate": "Sunday, 25 October 2026",
        "iso": "2026-10-25",
        "isToday": false
      }
    ],
    "isCurrent": false
  },
  {
    "index": 11,
    "code": "S1 Wk11",
    "sem": "1",
    "month": "Oct 2026",
    "startDate": "26 Oct 2026",
    "endDate": "01 Nov 2026",
    "dateRange": "26 Oct \u2013 01 Nov 2026",
    "days": [
      {
        "dayIndex": 0,
        "dayName": "Mon",
        "dayNum": 26,
        "monthName": "Oct",
        "dateStr": "26 Oct",
        "fullDate": "Monday, 26 October 2026",
        "iso": "2026-10-26",
        "isToday": false
      },
      {
        "dayIndex": 1,
        "dayName": "Tue",
        "dayNum": 27,
        "monthName": "Oct",
        "dateStr": "27 Oct",
        "fullDate": "Tuesday, 27 October 2026",
        "iso": "2026-10-27",
        "isToday": false
      },
      {
        "dayIndex": 2,
        "dayName": "Wed",
        "dayNum": 28,
        "monthName": "Oct",
        "dateStr": "28 Oct",
        "fullDate": "Wednesday, 28 October 2026",
        "iso": "2026-10-28",
        "isToday": false
      },
      {
        "dayIndex": 3,
        "dayName": "Thu",
        "dayNum": 29,
        "monthName": "Oct",
        "dateStr": "29 Oct",
        "fullDate": "Thursday, 29 October 2026",
        "iso": "2026-10-29",
        "isToday": false
      },
      {
        "dayIndex": 4,
        "dayName": "Fri",
        "dayNum": 30,
        "monthName": "Oct",
        "dateStr": "30 Oct",
        "fullDate": "Friday, 30 October 2026",
        "iso": "2026-10-30",
        "isToday": false
      },
      {
        "dayIndex": 5,
        "dayName": "Sat",
        "dayNum": 31,
        "monthName": "Oct",
        "dateStr": "31 Oct",
        "fullDate": "Saturday, 31 October 2026",
        "iso": "2026-10-31",
        "isToday": false
      },
      {
        "dayIndex": 6,
        "dayName": "Sun",
        "dayNum": 1,
        "monthName": "Nov",
        "dateStr": "01 Nov",
        "fullDate": "Sunday, 01 November 2026",
        "iso": "2026-11-01",
        "isToday": false
      }
    ],
    "isCurrent": false
  },
  {
    "index": 12,
    "code": "S1 Wk12",
    "sem": "1",
    "month": "Nov 2026",
    "startDate": "02 Nov 2026",
    "endDate": "08 Nov 2026",
    "dateRange": "02 Nov \u2013 08 Nov 2026",
    "days": [
      {
        "dayIndex": 0,
        "dayName": "Mon",
        "dayNum": 2,
        "monthName": "Nov",
        "dateStr": "02 Nov",
        "fullDate": "Monday, 02 November 2026",
        "iso": "2026-11-02",
        "isToday": false
      },
      {
        "dayIndex": 1,
        "dayName": "Tue",
        "dayNum": 3,
        "monthName": "Nov",
        "dateStr": "03 Nov",
        "fullDate": "Tuesday, 03 November 2026",
        "iso": "2026-11-03",
        "isToday": false
      },
      {
        "dayIndex": 2,
        "dayName": "Wed",
        "dayNum": 4,
        "monthName": "Nov",
        "dateStr": "04 Nov",
        "fullDate": "Wednesday, 04 November 2026",
        "iso": "2026-11-04",
        "isToday": false
      },
      {
        "dayIndex": 3,
        "dayName": "Thu",
        "dayNum": 5,
        "monthName": "Nov",
        "dateStr": "05 Nov",
        "fullDate": "Thursday, 05 November 2026",
        "iso": "2026-11-05",
        "isToday": false
      },
      {
        "dayIndex": 4,
        "dayName": "Fri",
        "dayNum": 6,
        "monthName": "Nov",
        "dateStr": "06 Nov",
        "fullDate": "Friday, 06 November 2026",
        "iso": "2026-11-06",
        "isToday": false
      },
      {
        "dayIndex": 5,
        "dayName": "Sat",
        "dayNum": 7,
        "monthName": "Nov",
        "dateStr": "07 Nov",
        "fullDate": "Saturday, 07 November 2026",
        "iso": "2026-11-07",
        "isToday": false
      },
      {
        "dayIndex": 6,
        "dayName": "Sun",
        "dayNum": 8,
        "monthName": "Nov",
        "dateStr": "08 Nov",
        "fullDate": "Sunday, 08 November 2026",
        "iso": "2026-11-08",
        "isToday": false
      }
    ],
    "isCurrent": false
  },
  {
    "index": 13,
    "code": "S1 Wk13",
    "sem": "1",
    "month": "Nov 2026",
    "startDate": "09 Nov 2026",
    "endDate": "15 Nov 2026",
    "dateRange": "09 Nov \u2013 15 Nov 2026",
    "days": [
      {
        "dayIndex": 0,
        "dayName": "Mon",
        "dayNum": 9,
        "monthName": "Nov",
        "dateStr": "09 Nov",
        "fullDate": "Monday, 09 November 2026",
        "iso": "2026-11-09",
        "isToday": false
      },
      {
        "dayIndex": 1,
        "dayName": "Tue",
        "dayNum": 10,
        "monthName": "Nov",
        "dateStr": "10 Nov",
        "fullDate": "Tuesday, 10 November 2026",
        "iso": "2026-11-10",
        "isToday": false
      },
      {
        "dayIndex": 2,
        "dayName": "Wed",
        "dayNum": 11,
        "monthName": "Nov",
        "dateStr": "11 Nov",
        "fullDate": "Wednesday, 11 November 2026",
        "iso": "2026-11-11",
        "isToday": false
      },
      {
        "dayIndex": 3,
        "dayName": "Thu",
        "dayNum": 12,
        "monthName": "Nov",
        "dateStr": "12 Nov",
        "fullDate": "Thursday, 12 November 2026",
        "iso": "2026-11-12",
        "isToday": false
      },
      {
        "dayIndex": 4,
        "dayName": "Fri",
        "dayNum": 13,
        "monthName": "Nov",
        "dateStr": "13 Nov",
        "fullDate": "Friday, 13 November 2026",
        "iso": "2026-11-13",
        "isToday": false
      },
      {
        "dayIndex": 5,
        "dayName": "Sat",
        "dayNum": 14,
        "monthName": "Nov",
        "dateStr": "14 Nov",
        "fullDate": "Saturday, 14 November 2026",
        "iso": "2026-11-14",
        "isToday": false
      },
      {
        "dayIndex": 6,
        "dayName": "Sun",
        "dayNum": 15,
        "monthName": "Nov",
        "dateStr": "15 Nov",
        "fullDate": "Sunday, 15 November 2026",
        "iso": "2026-11-15",
        "isToday": false
      }
    ],
    "isCurrent": false
  },
  {
    "index": 14,
    "code": "Reading Wk",
    "sem": "vac",
    "month": "Nov 2026",
    "startDate": "16 Nov 2026",
    "endDate": "22 Nov 2026",
    "dateRange": "16 Nov \u2013 22 Nov 2026",
    "days": [
      {
        "dayIndex": 0,
        "dayName": "Mon",
        "dayNum": 16,
        "monthName": "Nov",
        "dateStr": "16 Nov",
        "fullDate": "Monday, 16 November 2026",
        "iso": "2026-11-16",
        "isToday": false
      },
      {
        "dayIndex": 1,
        "dayName": "Tue",
        "dayNum": 17,
        "monthName": "Nov",
        "dateStr": "17 Nov",
        "fullDate": "Tuesday, 17 November 2026",
        "iso": "2026-11-17",
        "isToday": false
      },
      {
        "dayIndex": 2,
        "dayName": "Wed",
        "dayNum": 18,
        "monthName": "Nov",
        "dateStr": "18 Nov",
        "fullDate": "Wednesday, 18 November 2026",
        "iso": "2026-11-18",
        "isToday": false
      },
      {
        "dayIndex": 3,
        "dayName": "Thu",
        "dayNum": 19,
        "monthName": "Nov",
        "dateStr": "19 Nov",
        "fullDate": "Thursday, 19 November 2026",
        "iso": "2026-11-19",
        "isToday": false
      },
      {
        "dayIndex": 4,
        "dayName": "Fri",
        "dayNum": 20,
        "monthName": "Nov",
        "dateStr": "20 Nov",
        "fullDate": "Friday, 20 November 2026",
        "iso": "2026-11-20",
        "isToday": false
      },
      {
        "dayIndex": 5,
        "dayName": "Sat",
        "dayNum": 21,
        "monthName": "Nov",
        "dateStr": "21 Nov",
        "fullDate": "Saturday, 21 November 2026",
        "iso": "2026-11-21",
        "isToday": false
      },
      {
        "dayIndex": 6,
        "dayName": "Sun",
        "dayNum": 22,
        "monthName": "Nov",
        "dateStr": "22 Nov",
        "fullDate": "Sunday, 22 November 2026",
        "iso": "2026-11-22",
        "isToday": false
      }
    ],
    "isCurrent": false
  },
  {
    "index": 15,
    "code": "Exam Wk 1",
    "sem": "vac",
    "month": "Nov 2026",
    "startDate": "23 Nov 2026",
    "endDate": "29 Nov 2026",
    "dateRange": "23 Nov \u2013 29 Nov 2026",
    "days": [
      {
        "dayIndex": 0,
        "dayName": "Mon",
        "dayNum": 23,
        "monthName": "Nov",
        "dateStr": "23 Nov",
        "fullDate": "Monday, 23 November 2026",
        "iso": "2026-11-23",
        "isToday": false
      },
      {
        "dayIndex": 1,
        "dayName": "Tue",
        "dayNum": 24,
        "monthName": "Nov",
        "dateStr": "24 Nov",
        "fullDate": "Tuesday, 24 November 2026",
        "iso": "2026-11-24",
        "isToday": false
      },
      {
        "dayIndex": 2,
        "dayName": "Wed",
        "dayNum": 25,
        "monthName": "Nov",
        "dateStr": "25 Nov",
        "fullDate": "Wednesday, 25 November 2026",
        "iso": "2026-11-25",
        "isToday": false
      },
      {
        "dayIndex": 3,
        "dayName": "Thu",
        "dayNum": 26,
        "monthName": "Nov",
        "dateStr": "26 Nov",
        "fullDate": "Thursday, 26 November 2026",
        "iso": "2026-11-26",
        "isToday": false
      },
      {
        "dayIndex": 4,
        "dayName": "Fri",
        "dayNum": 27,
        "monthName": "Nov",
        "dateStr": "27 Nov",
        "fullDate": "Friday, 27 November 2026",
        "iso": "2026-11-27",
        "isToday": false
      },
      {
        "dayIndex": 5,
        "dayName": "Sat",
        "dayNum": 28,
        "monthName": "Nov",
        "dateStr": "28 Nov",
        "fullDate": "Saturday, 28 November 2026",
        "iso": "2026-11-28",
        "isToday": false
      },
      {
        "dayIndex": 6,
        "dayName": "Sun",
        "dayNum": 29,
        "monthName": "Nov",
        "dateStr": "29 Nov",
        "fullDate": "Sunday, 29 November 2026",
        "iso": "2026-11-29",
        "isToday": false
      }
    ],
    "isCurrent": false
  },
  {
    "index": 16,
    "code": "Exam Wk 2",
    "sem": "vac",
    "month": "Nov 2026",
    "startDate": "30 Nov 2026",
    "endDate": "06 Dec 2026",
    "dateRange": "30 Nov \u2013 06 Dec 2026",
    "days": [
      {
        "dayIndex": 0,
        "dayName": "Mon",
        "dayNum": 30,
        "monthName": "Nov",
        "dateStr": "30 Nov",
        "fullDate": "Monday, 30 November 2026",
        "iso": "2026-11-30",
        "isToday": false
      },
      {
        "dayIndex": 1,
        "dayName": "Tue",
        "dayNum": 1,
        "monthName": "Dec",
        "dateStr": "01 Dec",
        "fullDate": "Tuesday, 01 December 2026",
        "iso": "2026-12-01",
        "isToday": false
      },
      {
        "dayIndex": 2,
        "dayName": "Wed",
        "dayNum": 2,
        "monthName": "Dec",
        "dateStr": "02 Dec",
        "fullDate": "Wednesday, 02 December 2026",
        "iso": "2026-12-02",
        "isToday": false
      },
      {
        "dayIndex": 3,
        "dayName": "Thu",
        "dayNum": 3,
        "monthName": "Dec",
        "dateStr": "03 Dec",
        "fullDate": "Thursday, 03 December 2026",
        "iso": "2026-12-03",
        "isToday": false
      },
      {
        "dayIndex": 4,
        "dayName": "Fri",
        "dayNum": 4,
        "monthName": "Dec",
        "dateStr": "04 Dec",
        "fullDate": "Friday, 04 December 2026",
        "iso": "2026-12-04",
        "isToday": false
      },
      {
        "dayIndex": 5,
        "dayName": "Sat",
        "dayNum": 5,
        "monthName": "Dec",
        "dateStr": "05 Dec",
        "fullDate": "Saturday, 05 December 2026",
        "iso": "2026-12-05",
        "isToday": false
      },
      {
        "dayIndex": 6,
        "dayName": "Sun",
        "dayNum": 6,
        "monthName": "Dec",
        "dateStr": "06 Dec",
        "fullDate": "Sunday, 06 December 2026",
        "iso": "2026-12-06",
        "isToday": false
      }
    ],
    "isCurrent": false
  },
  {
    "index": 17,
    "code": "Vac Wk 1",
    "sem": "vac",
    "month": "Dec 2026",
    "startDate": "07 Dec 2026",
    "endDate": "13 Dec 2026",
    "dateRange": "07 Dec \u2013 13 Dec 2026",
    "days": [
      {
        "dayIndex": 0,
        "dayName": "Mon",
        "dayNum": 7,
        "monthName": "Dec",
        "dateStr": "07 Dec",
        "fullDate": "Monday, 07 December 2026",
        "iso": "2026-12-07",
        "isToday": false
      },
      {
        "dayIndex": 1,
        "dayName": "Tue",
        "dayNum": 8,
        "monthName": "Dec",
        "dateStr": "08 Dec",
        "fullDate": "Tuesday, 08 December 2026",
        "iso": "2026-12-08",
        "isToday": false
      },
      {
        "dayIndex": 2,
        "dayName": "Wed",
        "dayNum": 9,
        "monthName": "Dec",
        "dateStr": "09 Dec",
        "fullDate": "Wednesday, 09 December 2026",
        "iso": "2026-12-09",
        "isToday": false
      },
      {
        "dayIndex": 3,
        "dayName": "Thu",
        "dayNum": 10,
        "monthName": "Dec",
        "dateStr": "10 Dec",
        "fullDate": "Thursday, 10 December 2026",
        "iso": "2026-12-10",
        "isToday": false
      },
      {
        "dayIndex": 4,
        "dayName": "Fri",
        "dayNum": 11,
        "monthName": "Dec",
        "dateStr": "11 Dec",
        "fullDate": "Friday, 11 December 2026",
        "iso": "2026-12-11",
        "isToday": false
      },
      {
        "dayIndex": 5,
        "dayName": "Sat",
        "dayNum": 12,
        "monthName": "Dec",
        "dateStr": "12 Dec",
        "fullDate": "Saturday, 12 December 2026",
        "iso": "2026-12-12",
        "isToday": false
      },
      {
        "dayIndex": 6,
        "dayName": "Sun",
        "dayNum": 13,
        "monthName": "Dec",
        "dateStr": "13 Dec",
        "fullDate": "Sunday, 13 December 2026",
        "iso": "2026-12-13",
        "isToday": false
      }
    ],
    "isCurrent": false
  },
  {
    "index": 18,
    "code": "Vac Wk 2",
    "sem": "vac",
    "month": "Dec 2026",
    "startDate": "14 Dec 2026",
    "endDate": "20 Dec 2026",
    "dateRange": "14 Dec \u2013 20 Dec 2026",
    "days": [
      {
        "dayIndex": 0,
        "dayName": "Mon",
        "dayNum": 14,
        "monthName": "Dec",
        "dateStr": "14 Dec",
        "fullDate": "Monday, 14 December 2026",
        "iso": "2026-12-14",
        "isToday": false
      },
      {
        "dayIndex": 1,
        "dayName": "Tue",
        "dayNum": 15,
        "monthName": "Dec",
        "dateStr": "15 Dec",
        "fullDate": "Tuesday, 15 December 2026",
        "iso": "2026-12-15",
        "isToday": false
      },
      {
        "dayIndex": 2,
        "dayName": "Wed",
        "dayNum": 16,
        "monthName": "Dec",
        "dateStr": "16 Dec",
        "fullDate": "Wednesday, 16 December 2026",
        "iso": "2026-12-16",
        "isToday": false
      },
      {
        "dayIndex": 3,
        "dayName": "Thu",
        "dayNum": 17,
        "monthName": "Dec",
        "dateStr": "17 Dec",
        "fullDate": "Thursday, 17 December 2026",
        "iso": "2026-12-17",
        "isToday": false
      },
      {
        "dayIndex": 4,
        "dayName": "Fri",
        "dayNum": 18,
        "monthName": "Dec",
        "dateStr": "18 Dec",
        "fullDate": "Friday, 18 December 2026",
        "iso": "2026-12-18",
        "isToday": false
      },
      {
        "dayIndex": 5,
        "dayName": "Sat",
        "dayNum": 19,
        "monthName": "Dec",
        "dateStr": "19 Dec",
        "fullDate": "Saturday, 19 December 2026",
        "iso": "2026-12-19",
        "isToday": false
      },
      {
        "dayIndex": 6,
        "dayName": "Sun",
        "dayNum": 20,
        "monthName": "Dec",
        "dateStr": "20 Dec",
        "fullDate": "Sunday, 20 December 2026",
        "iso": "2026-12-20",
        "isToday": false
      }
    ],
    "isCurrent": false
  },
  {
    "index": 19,
    "code": "Vac Wk 3",
    "sem": "vac",
    "month": "Dec 2026",
    "startDate": "21 Dec 2026",
    "endDate": "27 Dec 2026",
    "dateRange": "21 Dec \u2013 27 Dec 2026",
    "days": [
      {
        "dayIndex": 0,
        "dayName": "Mon",
        "dayNum": 21,
        "monthName": "Dec",
        "dateStr": "21 Dec",
        "fullDate": "Monday, 21 December 2026",
        "iso": "2026-12-21",
        "isToday": false
      },
      {
        "dayIndex": 1,
        "dayName": "Tue",
        "dayNum": 22,
        "monthName": "Dec",
        "dateStr": "22 Dec",
        "fullDate": "Tuesday, 22 December 2026",
        "iso": "2026-12-22",
        "isToday": false
      },
      {
        "dayIndex": 2,
        "dayName": "Wed",
        "dayNum": 23,
        "monthName": "Dec",
        "dateStr": "23 Dec",
        "fullDate": "Wednesday, 23 December 2026",
        "iso": "2026-12-23",
        "isToday": false
      },
      {
        "dayIndex": 3,
        "dayName": "Thu",
        "dayNum": 24,
        "monthName": "Dec",
        "dateStr": "24 Dec",
        "fullDate": "Thursday, 24 December 2026",
        "iso": "2026-12-24",
        "isToday": false
      },
      {
        "dayIndex": 4,
        "dayName": "Fri",
        "dayNum": 25,
        "monthName": "Dec",
        "dateStr": "25 Dec",
        "fullDate": "Friday, 25 December 2026",
        "iso": "2026-12-25",
        "isToday": false
      },
      {
        "dayIndex": 5,
        "dayName": "Sat",
        "dayNum": 26,
        "monthName": "Dec",
        "dateStr": "26 Dec",
        "fullDate": "Saturday, 26 December 2026",
        "iso": "2026-12-26",
        "isToday": false
      },
      {
        "dayIndex": 6,
        "dayName": "Sun",
        "dayNum": 27,
        "monthName": "Dec",
        "dateStr": "27 Dec",
        "fullDate": "Sunday, 27 December 2026",
        "iso": "2026-12-27",
        "isToday": false
      }
    ],
    "isCurrent": false
  },
  {
    "index": 20,
    "code": "Vac Wk 4",
    "sem": "vac",
    "month": "Dec 2026",
    "startDate": "28 Dec 2026",
    "endDate": "03 Jan 2027",
    "dateRange": "28 Dec \u2013 03 Jan 2027",
    "days": [
      {
        "dayIndex": 0,
        "dayName": "Mon",
        "dayNum": 28,
        "monthName": "Dec",
        "dateStr": "28 Dec",
        "fullDate": "Monday, 28 December 2026",
        "iso": "2026-12-28",
        "isToday": false
      },
      {
        "dayIndex": 1,
        "dayName": "Tue",
        "dayNum": 29,
        "monthName": "Dec",
        "dateStr": "29 Dec",
        "fullDate": "Tuesday, 29 December 2026",
        "iso": "2026-12-29",
        "isToday": false
      },
      {
        "dayIndex": 2,
        "dayName": "Wed",
        "dayNum": 30,
        "monthName": "Dec",
        "dateStr": "30 Dec",
        "fullDate": "Wednesday, 30 December 2026",
        "iso": "2026-12-30",
        "isToday": false
      },
      {
        "dayIndex": 3,
        "dayName": "Thu",
        "dayNum": 31,
        "monthName": "Dec",
        "dateStr": "31 Dec",
        "fullDate": "Thursday, 31 December 2026",
        "iso": "2026-12-31",
        "isToday": false
      },
      {
        "dayIndex": 4,
        "dayName": "Fri",
        "dayNum": 1,
        "monthName": "Jan",
        "dateStr": "01 Jan",
        "fullDate": "Friday, 01 January 2027",
        "iso": "2027-01-01",
        "isToday": false
      },
      {
        "dayIndex": 5,
        "dayName": "Sat",
        "dayNum": 2,
        "monthName": "Jan",
        "dateStr": "02 Jan",
        "fullDate": "Saturday, 02 January 2027",
        "iso": "2027-01-02",
        "isToday": false
      },
      {
        "dayIndex": 6,
        "dayName": "Sun",
        "dayNum": 3,
        "monthName": "Jan",
        "dateStr": "03 Jan",
        "fullDate": "Sunday, 03 January 2027",
        "iso": "2027-01-03",
        "isToday": false
      }
    ],
    "isCurrent": false
  },
  {
    "index": 21,
    "code": "S2 Wk1",
    "sem": "2",
    "month": "Jan 2027",
    "startDate": "11 Jan 2027",
    "endDate": "17 Jan 2027",
    "dateRange": "11 Jan \u2013 17 Jan 2027",
    "days": [
      {
        "dayIndex": 0,
        "dayName": "Mon",
        "dayNum": 11,
        "monthName": "Jan",
        "dateStr": "11 Jan",
        "fullDate": "Monday, 11 January 2027",
        "iso": "2027-01-11",
        "isToday": false
      },
      {
        "dayIndex": 1,
        "dayName": "Tue",
        "dayNum": 12,
        "monthName": "Jan",
        "dateStr": "12 Jan",
        "fullDate": "Tuesday, 12 January 2027",
        "iso": "2027-01-12",
        "isToday": false
      },
      {
        "dayIndex": 2,
        "dayName": "Wed",
        "dayNum": 13,
        "monthName": "Jan",
        "dateStr": "13 Jan",
        "fullDate": "Wednesday, 13 January 2027",
        "iso": "2027-01-13",
        "isToday": false
      },
      {
        "dayIndex": 3,
        "dayName": "Thu",
        "dayNum": 14,
        "monthName": "Jan",
        "dateStr": "14 Jan",
        "fullDate": "Thursday, 14 January 2027",
        "iso": "2027-01-14",
        "isToday": false
      },
      {
        "dayIndex": 4,
        "dayName": "Fri",
        "dayNum": 15,
        "monthName": "Jan",
        "dateStr": "15 Jan",
        "fullDate": "Friday, 15 January 2027",
        "iso": "2027-01-15",
        "isToday": false
      },
      {
        "dayIndex": 5,
        "dayName": "Sat",
        "dayNum": 16,
        "monthName": "Jan",
        "dateStr": "16 Jan",
        "fullDate": "Saturday, 16 January 2027",
        "iso": "2027-01-16",
        "isToday": false
      },
      {
        "dayIndex": 6,
        "dayName": "Sun",
        "dayNum": 17,
        "monthName": "Jan",
        "dateStr": "17 Jan",
        "fullDate": "Sunday, 17 January 2027",
        "iso": "2027-01-17",
        "isToday": false
      }
    ],
    "isCurrent": false
  },
  {
    "index": 22,
    "code": "S2 Wk2",
    "sem": "2",
    "month": "Jan 2027",
    "startDate": "18 Jan 2027",
    "endDate": "24 Jan 2027",
    "dateRange": "18 Jan \u2013 24 Jan 2027",
    "days": [
      {
        "dayIndex": 0,
        "dayName": "Mon",
        "dayNum": 18,
        "monthName": "Jan",
        "dateStr": "18 Jan",
        "fullDate": "Monday, 18 January 2027",
        "iso": "2027-01-18",
        "isToday": false
      },
      {
        "dayIndex": 1,
        "dayName": "Tue",
        "dayNum": 19,
        "monthName": "Jan",
        "dateStr": "19 Jan",
        "fullDate": "Tuesday, 19 January 2027",
        "iso": "2027-01-19",
        "isToday": false
      },
      {
        "dayIndex": 2,
        "dayName": "Wed",
        "dayNum": 20,
        "monthName": "Jan",
        "dateStr": "20 Jan",
        "fullDate": "Wednesday, 20 January 2027",
        "iso": "2027-01-20",
        "isToday": false
      },
      {
        "dayIndex": 3,
        "dayName": "Thu",
        "dayNum": 21,
        "monthName": "Jan",
        "dateStr": "21 Jan",
        "fullDate": "Thursday, 21 January 2027",
        "iso": "2027-01-21",
        "isToday": false
      },
      {
        "dayIndex": 4,
        "dayName": "Fri",
        "dayNum": 22,
        "monthName": "Jan",
        "dateStr": "22 Jan",
        "fullDate": "Friday, 22 January 2027",
        "iso": "2027-01-22",
        "isToday": false
      },
      {
        "dayIndex": 5,
        "dayName": "Sat",
        "dayNum": 23,
        "monthName": "Jan",
        "dateStr": "23 Jan",
        "fullDate": "Saturday, 23 January 2027",
        "iso": "2027-01-23",
        "isToday": false
      },
      {
        "dayIndex": 6,
        "dayName": "Sun",
        "dayNum": 24,
        "monthName": "Jan",
        "dateStr": "24 Jan",
        "fullDate": "Sunday, 24 January 2027",
        "iso": "2027-01-24",
        "isToday": false
      }
    ],
    "isCurrent": false
  },
  {
    "index": 23,
    "code": "S2 Wk3",
    "sem": "2",
    "month": "Jan 2027",
    "startDate": "25 Jan 2027",
    "endDate": "31 Jan 2027",
    "dateRange": "25 Jan \u2013 31 Jan 2027",
    "days": [
      {
        "dayIndex": 0,
        "dayName": "Mon",
        "dayNum": 25,
        "monthName": "Jan",
        "dateStr": "25 Jan",
        "fullDate": "Monday, 25 January 2027",
        "iso": "2027-01-25",
        "isToday": false
      },
      {
        "dayIndex": 1,
        "dayName": "Tue",
        "dayNum": 26,
        "monthName": "Jan",
        "dateStr": "26 Jan",
        "fullDate": "Tuesday, 26 January 2027",
        "iso": "2027-01-26",
        "isToday": false
      },
      {
        "dayIndex": 2,
        "dayName": "Wed",
        "dayNum": 27,
        "monthName": "Jan",
        "dateStr": "27 Jan",
        "fullDate": "Wednesday, 27 January 2027",
        "iso": "2027-01-27",
        "isToday": false
      },
      {
        "dayIndex": 3,
        "dayName": "Thu",
        "dayNum": 28,
        "monthName": "Jan",
        "dateStr": "28 Jan",
        "fullDate": "Thursday, 28 January 2027",
        "iso": "2027-01-28",
        "isToday": false
      },
      {
        "dayIndex": 4,
        "dayName": "Fri",
        "dayNum": 29,
        "monthName": "Jan",
        "dateStr": "29 Jan",
        "fullDate": "Friday, 29 January 2027",
        "iso": "2027-01-29",
        "isToday": false
      },
      {
        "dayIndex": 5,
        "dayName": "Sat",
        "dayNum": 30,
        "monthName": "Jan",
        "dateStr": "30 Jan",
        "fullDate": "Saturday, 30 January 2027",
        "iso": "2027-01-30",
        "isToday": false
      },
      {
        "dayIndex": 6,
        "dayName": "Sun",
        "dayNum": 31,
        "monthName": "Jan",
        "dateStr": "31 Jan",
        "fullDate": "Sunday, 31 January 2027",
        "iso": "2027-01-31",
        "isToday": false
      }
    ],
    "isCurrent": false
  },
  {
    "index": 24,
    "code": "S2 Wk4",
    "sem": "2",
    "month": "Feb 2027",
    "startDate": "01 Feb 2027",
    "endDate": "07 Feb 2027",
    "dateRange": "01 Feb \u2013 07 Feb 2027",
    "days": [
      {
        "dayIndex": 0,
        "dayName": "Mon",
        "dayNum": 1,
        "monthName": "Feb",
        "dateStr": "01 Feb",
        "fullDate": "Monday, 01 February 2027",
        "iso": "2027-02-01",
        "isToday": false
      },
      {
        "dayIndex": 1,
        "dayName": "Tue",
        "dayNum": 2,
        "monthName": "Feb",
        "dateStr": "02 Feb",
        "fullDate": "Tuesday, 02 February 2027",
        "iso": "2027-02-02",
        "isToday": false
      },
      {
        "dayIndex": 2,
        "dayName": "Wed",
        "dayNum": 3,
        "monthName": "Feb",
        "dateStr": "03 Feb",
        "fullDate": "Wednesday, 03 February 2027",
        "iso": "2027-02-03",
        "isToday": false
      },
      {
        "dayIndex": 3,
        "dayName": "Thu",
        "dayNum": 4,
        "monthName": "Feb",
        "dateStr": "04 Feb",
        "fullDate": "Thursday, 04 February 2027",
        "iso": "2027-02-04",
        "isToday": false
      },
      {
        "dayIndex": 4,
        "dayName": "Fri",
        "dayNum": 5,
        "monthName": "Feb",
        "dateStr": "05 Feb",
        "fullDate": "Friday, 05 February 2027",
        "iso": "2027-02-05",
        "isToday": false
      },
      {
        "dayIndex": 5,
        "dayName": "Sat",
        "dayNum": 6,
        "monthName": "Feb",
        "dateStr": "06 Feb",
        "fullDate": "Saturday, 06 February 2027",
        "iso": "2027-02-06",
        "isToday": false
      },
      {
        "dayIndex": 6,
        "dayName": "Sun",
        "dayNum": 7,
        "monthName": "Feb",
        "dateStr": "07 Feb",
        "fullDate": "Sunday, 07 February 2027",
        "iso": "2027-02-07",
        "isToday": false
      }
    ],
    "isCurrent": false
  },
  {
    "index": 25,
    "code": "S2 Wk5",
    "sem": "2",
    "month": "Feb 2027",
    "startDate": "08 Feb 2027",
    "endDate": "14 Feb 2027",
    "dateRange": "08 Feb \u2013 14 Feb 2027",
    "days": [
      {
        "dayIndex": 0,
        "dayName": "Mon",
        "dayNum": 8,
        "monthName": "Feb",
        "dateStr": "08 Feb",
        "fullDate": "Monday, 08 February 2027",
        "iso": "2027-02-08",
        "isToday": false
      },
      {
        "dayIndex": 1,
        "dayName": "Tue",
        "dayNum": 9,
        "monthName": "Feb",
        "dateStr": "09 Feb",
        "fullDate": "Tuesday, 09 February 2027",
        "iso": "2027-02-09",
        "isToday": false
      },
      {
        "dayIndex": 2,
        "dayName": "Wed",
        "dayNum": 10,
        "monthName": "Feb",
        "dateStr": "10 Feb",
        "fullDate": "Wednesday, 10 February 2027",
        "iso": "2027-02-10",
        "isToday": false
      },
      {
        "dayIndex": 3,
        "dayName": "Thu",
        "dayNum": 11,
        "monthName": "Feb",
        "dateStr": "11 Feb",
        "fullDate": "Thursday, 11 February 2027",
        "iso": "2027-02-11",
        "isToday": false
      },
      {
        "dayIndex": 4,
        "dayName": "Fri",
        "dayNum": 12,
        "monthName": "Feb",
        "dateStr": "12 Feb",
        "fullDate": "Friday, 12 February 2027",
        "iso": "2027-02-12",
        "isToday": false
      },
      {
        "dayIndex": 5,
        "dayName": "Sat",
        "dayNum": 13,
        "monthName": "Feb",
        "dateStr": "13 Feb",
        "fullDate": "Saturday, 13 February 2027",
        "iso": "2027-02-13",
        "isToday": false
      },
      {
        "dayIndex": 6,
        "dayName": "Sun",
        "dayNum": 14,
        "monthName": "Feb",
        "dateStr": "14 Feb",
        "fullDate": "Sunday, 14 February 2027",
        "iso": "2027-02-14",
        "isToday": false
      }
    ],
    "isCurrent": false
  },
  {
    "index": 26,
    "code": "S2 Wk6",
    "sem": "2",
    "month": "Feb 2027",
    "startDate": "15 Feb 2027",
    "endDate": "21 Feb 2027",
    "dateRange": "15 Feb \u2013 21 Feb 2027",
    "days": [
      {
        "dayIndex": 0,
        "dayName": "Mon",
        "dayNum": 15,
        "monthName": "Feb",
        "dateStr": "15 Feb",
        "fullDate": "Monday, 15 February 2027",
        "iso": "2027-02-15",
        "isToday": false
      },
      {
        "dayIndex": 1,
        "dayName": "Tue",
        "dayNum": 16,
        "monthName": "Feb",
        "dateStr": "16 Feb",
        "fullDate": "Tuesday, 16 February 2027",
        "iso": "2027-02-16",
        "isToday": false
      },
      {
        "dayIndex": 2,
        "dayName": "Wed",
        "dayNum": 17,
        "monthName": "Feb",
        "dateStr": "17 Feb",
        "fullDate": "Wednesday, 17 February 2027",
        "iso": "2027-02-17",
        "isToday": false
      },
      {
        "dayIndex": 3,
        "dayName": "Thu",
        "dayNum": 18,
        "monthName": "Feb",
        "dateStr": "18 Feb",
        "fullDate": "Thursday, 18 February 2027",
        "iso": "2027-02-18",
        "isToday": false
      },
      {
        "dayIndex": 4,
        "dayName": "Fri",
        "dayNum": 19,
        "monthName": "Feb",
        "dateStr": "19 Feb",
        "fullDate": "Friday, 19 February 2027",
        "iso": "2027-02-19",
        "isToday": false
      },
      {
        "dayIndex": 5,
        "dayName": "Sat",
        "dayNum": 20,
        "monthName": "Feb",
        "dateStr": "20 Feb",
        "fullDate": "Saturday, 20 February 2027",
        "iso": "2027-02-20",
        "isToday": false
      },
      {
        "dayIndex": 6,
        "dayName": "Sun",
        "dayNum": 21,
        "monthName": "Feb",
        "dateStr": "21 Feb",
        "fullDate": "Sunday, 21 February 2027",
        "iso": "2027-02-21",
        "isToday": false
      }
    ],
    "isCurrent": false
  },
  {
    "index": 27,
    "code": "S2 Recess",
    "sem": "2",
    "month": "Feb 2027",
    "startDate": "22 Feb 2027",
    "endDate": "28 Feb 2027",
    "dateRange": "22 Feb \u2013 28 Feb 2027",
    "days": [
      {
        "dayIndex": 0,
        "dayName": "Mon",
        "dayNum": 22,
        "monthName": "Feb",
        "dateStr": "22 Feb",
        "fullDate": "Monday, 22 February 2027",
        "iso": "2027-02-22",
        "isToday": false
      },
      {
        "dayIndex": 1,
        "dayName": "Tue",
        "dayNum": 23,
        "monthName": "Feb",
        "dateStr": "23 Feb",
        "fullDate": "Tuesday, 23 February 2027",
        "iso": "2027-02-23",
        "isToday": false
      },
      {
        "dayIndex": 2,
        "dayName": "Wed",
        "dayNum": 24,
        "monthName": "Feb",
        "dateStr": "24 Feb",
        "fullDate": "Wednesday, 24 February 2027",
        "iso": "2027-02-24",
        "isToday": false
      },
      {
        "dayIndex": 3,
        "dayName": "Thu",
        "dayNum": 25,
        "monthName": "Feb",
        "dateStr": "25 Feb",
        "fullDate": "Thursday, 25 February 2027",
        "iso": "2027-02-25",
        "isToday": false
      },
      {
        "dayIndex": 4,
        "dayName": "Fri",
        "dayNum": 26,
        "monthName": "Feb",
        "dateStr": "26 Feb",
        "fullDate": "Friday, 26 February 2027",
        "iso": "2027-02-26",
        "isToday": false
      },
      {
        "dayIndex": 5,
        "dayName": "Sat",
        "dayNum": 27,
        "monthName": "Feb",
        "dateStr": "27 Feb",
        "fullDate": "Saturday, 27 February 2027",
        "iso": "2027-02-27",
        "isToday": false
      },
      {
        "dayIndex": 6,
        "dayName": "Sun",
        "dayNum": 28,
        "monthName": "Feb",
        "dateStr": "28 Feb",
        "fullDate": "Sunday, 28 February 2027",
        "iso": "2027-02-28",
        "isToday": false
      }
    ],
    "isCurrent": false
  },
  {
    "index": 28,
    "code": "S2 Wk7",
    "sem": "2",
    "month": "Mar 2027",
    "startDate": "01 Mar 2027",
    "endDate": "07 Mar 2027",
    "dateRange": "01 Mar \u2013 07 Mar 2027",
    "days": [
      {
        "dayIndex": 0,
        "dayName": "Mon",
        "dayNum": 1,
        "monthName": "Mar",
        "dateStr": "01 Mar",
        "fullDate": "Monday, 01 March 2027",
        "iso": "2027-03-01",
        "isToday": false
      },
      {
        "dayIndex": 1,
        "dayName": "Tue",
        "dayNum": 2,
        "monthName": "Mar",
        "dateStr": "02 Mar",
        "fullDate": "Tuesday, 02 March 2027",
        "iso": "2027-03-02",
        "isToday": false
      },
      {
        "dayIndex": 2,
        "dayName": "Wed",
        "dayNum": 3,
        "monthName": "Mar",
        "dateStr": "03 Mar",
        "fullDate": "Wednesday, 03 March 2027",
        "iso": "2027-03-03",
        "isToday": false
      },
      {
        "dayIndex": 3,
        "dayName": "Thu",
        "dayNum": 4,
        "monthName": "Mar",
        "dateStr": "04 Mar",
        "fullDate": "Thursday, 04 March 2027",
        "iso": "2027-03-04",
        "isToday": false
      },
      {
        "dayIndex": 4,
        "dayName": "Fri",
        "dayNum": 5,
        "monthName": "Mar",
        "dateStr": "05 Mar",
        "fullDate": "Friday, 05 March 2027",
        "iso": "2027-03-05",
        "isToday": false
      },
      {
        "dayIndex": 5,
        "dayName": "Sat",
        "dayNum": 6,
        "monthName": "Mar",
        "dateStr": "06 Mar",
        "fullDate": "Saturday, 06 March 2027",
        "iso": "2027-03-06",
        "isToday": false
      },
      {
        "dayIndex": 6,
        "dayName": "Sun",
        "dayNum": 7,
        "monthName": "Mar",
        "dateStr": "07 Mar",
        "fullDate": "Sunday, 07 March 2027",
        "iso": "2027-03-07",
        "isToday": false
      }
    ],
    "isCurrent": false
  },
  {
    "index": 29,
    "code": "S2 Wk8",
    "sem": "2",
    "month": "Mar 2027",
    "startDate": "08 Mar 2027",
    "endDate": "14 Mar 2027",
    "dateRange": "08 Mar \u2013 14 Mar 2027",
    "days": [
      {
        "dayIndex": 0,
        "dayName": "Mon",
        "dayNum": 8,
        "monthName": "Mar",
        "dateStr": "08 Mar",
        "fullDate": "Monday, 08 March 2027",
        "iso": "2027-03-08",
        "isToday": false
      },
      {
        "dayIndex": 1,
        "dayName": "Tue",
        "dayNum": 9,
        "monthName": "Mar",
        "dateStr": "09 Mar",
        "fullDate": "Tuesday, 09 March 2027",
        "iso": "2027-03-09",
        "isToday": false
      },
      {
        "dayIndex": 2,
        "dayName": "Wed",
        "dayNum": 10,
        "monthName": "Mar",
        "dateStr": "10 Mar",
        "fullDate": "Wednesday, 10 March 2027",
        "iso": "2027-03-10",
        "isToday": false
      },
      {
        "dayIndex": 3,
        "dayName": "Thu",
        "dayNum": 11,
        "monthName": "Mar",
        "dateStr": "11 Mar",
        "fullDate": "Thursday, 11 March 2027",
        "iso": "2027-03-11",
        "isToday": false
      },
      {
        "dayIndex": 4,
        "dayName": "Fri",
        "dayNum": 12,
        "monthName": "Mar",
        "dateStr": "12 Mar",
        "fullDate": "Friday, 12 March 2027",
        "iso": "2027-03-12",
        "isToday": false
      },
      {
        "dayIndex": 5,
        "dayName": "Sat",
        "dayNum": 13,
        "monthName": "Mar",
        "dateStr": "13 Mar",
        "fullDate": "Saturday, 13 March 2027",
        "iso": "2027-03-13",
        "isToday": false
      },
      {
        "dayIndex": 6,
        "dayName": "Sun",
        "dayNum": 14,
        "monthName": "Mar",
        "dateStr": "14 Mar",
        "fullDate": "Sunday, 14 March 2027",
        "iso": "2027-03-14",
        "isToday": false
      }
    ],
    "isCurrent": false
  },
  {
    "index": 30,
    "code": "S2 Wk9",
    "sem": "2",
    "month": "Mar 2027",
    "startDate": "15 Mar 2027",
    "endDate": "21 Mar 2027",
    "dateRange": "15 Mar \u2013 21 Mar 2027",
    "days": [
      {
        "dayIndex": 0,
        "dayName": "Mon",
        "dayNum": 15,
        "monthName": "Mar",
        "dateStr": "15 Mar",
        "fullDate": "Monday, 15 March 2027",
        "iso": "2027-03-15",
        "isToday": false
      },
      {
        "dayIndex": 1,
        "dayName": "Tue",
        "dayNum": 16,
        "monthName": "Mar",
        "dateStr": "16 Mar",
        "fullDate": "Tuesday, 16 March 2027",
        "iso": "2027-03-16",
        "isToday": false
      },
      {
        "dayIndex": 2,
        "dayName": "Wed",
        "dayNum": 17,
        "monthName": "Mar",
        "dateStr": "17 Mar",
        "fullDate": "Wednesday, 17 March 2027",
        "iso": "2027-03-17",
        "isToday": false
      },
      {
        "dayIndex": 3,
        "dayName": "Thu",
        "dayNum": 18,
        "monthName": "Mar",
        "dateStr": "18 Mar",
        "fullDate": "Thursday, 18 March 2027",
        "iso": "2027-03-18",
        "isToday": false
      },
      {
        "dayIndex": 4,
        "dayName": "Fri",
        "dayNum": 19,
        "monthName": "Mar",
        "dateStr": "19 Mar",
        "fullDate": "Friday, 19 March 2027",
        "iso": "2027-03-19",
        "isToday": false
      },
      {
        "dayIndex": 5,
        "dayName": "Sat",
        "dayNum": 20,
        "monthName": "Mar",
        "dateStr": "20 Mar",
        "fullDate": "Saturday, 20 March 2027",
        "iso": "2027-03-20",
        "isToday": false
      },
      {
        "dayIndex": 6,
        "dayName": "Sun",
        "dayNum": 21,
        "monthName": "Mar",
        "dateStr": "21 Mar",
        "fullDate": "Sunday, 21 March 2027",
        "iso": "2027-03-21",
        "isToday": false
      }
    ],
    "isCurrent": false
  },
  {
    "index": 31,
    "code": "S2 Wk10",
    "sem": "2",
    "month": "Mar 2027",
    "startDate": "22 Mar 2027",
    "endDate": "28 Mar 2027",
    "dateRange": "22 Mar \u2013 28 Mar 2027",
    "days": [
      {
        "dayIndex": 0,
        "dayName": "Mon",
        "dayNum": 22,
        "monthName": "Mar",
        "dateStr": "22 Mar",
        "fullDate": "Monday, 22 March 2027",
        "iso": "2027-03-22",
        "isToday": false
      },
      {
        "dayIndex": 1,
        "dayName": "Tue",
        "dayNum": 23,
        "monthName": "Mar",
        "dateStr": "23 Mar",
        "fullDate": "Tuesday, 23 March 2027",
        "iso": "2027-03-23",
        "isToday": false
      },
      {
        "dayIndex": 2,
        "dayName": "Wed",
        "dayNum": 24,
        "monthName": "Mar",
        "dateStr": "24 Mar",
        "fullDate": "Wednesday, 24 March 2027",
        "iso": "2027-03-24",
        "isToday": false
      },
      {
        "dayIndex": 3,
        "dayName": "Thu",
        "dayNum": 25,
        "monthName": "Mar",
        "dateStr": "25 Mar",
        "fullDate": "Thursday, 25 March 2027",
        "iso": "2027-03-25",
        "isToday": false
      },
      {
        "dayIndex": 4,
        "dayName": "Fri",
        "dayNum": 26,
        "monthName": "Mar",
        "dateStr": "26 Mar",
        "fullDate": "Friday, 26 March 2027",
        "iso": "2027-03-26",
        "isToday": false
      },
      {
        "dayIndex": 5,
        "dayName": "Sat",
        "dayNum": 27,
        "monthName": "Mar",
        "dateStr": "27 Mar",
        "fullDate": "Saturday, 27 March 2027",
        "iso": "2027-03-27",
        "isToday": false
      },
      {
        "dayIndex": 6,
        "dayName": "Sun",
        "dayNum": 28,
        "monthName": "Mar",
        "dateStr": "28 Mar",
        "fullDate": "Sunday, 28 March 2027",
        "iso": "2027-03-28",
        "isToday": false
      }
    ],
    "isCurrent": false
  },
  {
    "index": 32,
    "code": "S2 Wk11",
    "sem": "2",
    "month": "Mar 2027",
    "startDate": "29 Mar 2027",
    "endDate": "04 Apr 2027",
    "dateRange": "29 Mar \u2013 04 Apr 2027",
    "days": [
      {
        "dayIndex": 0,
        "dayName": "Mon",
        "dayNum": 29,
        "monthName": "Mar",
        "dateStr": "29 Mar",
        "fullDate": "Monday, 29 March 2027",
        "iso": "2027-03-29",
        "isToday": false
      },
      {
        "dayIndex": 1,
        "dayName": "Tue",
        "dayNum": 30,
        "monthName": "Mar",
        "dateStr": "30 Mar",
        "fullDate": "Tuesday, 30 March 2027",
        "iso": "2027-03-30",
        "isToday": false
      },
      {
        "dayIndex": 2,
        "dayName": "Wed",
        "dayNum": 31,
        "monthName": "Mar",
        "dateStr": "31 Mar",
        "fullDate": "Wednesday, 31 March 2027",
        "iso": "2027-03-31",
        "isToday": false
      },
      {
        "dayIndex": 3,
        "dayName": "Thu",
        "dayNum": 1,
        "monthName": "Apr",
        "dateStr": "01 Apr",
        "fullDate": "Thursday, 01 April 2027",
        "iso": "2027-04-01",
        "isToday": false
      },
      {
        "dayIndex": 4,
        "dayName": "Fri",
        "dayNum": 2,
        "monthName": "Apr",
        "dateStr": "02 Apr",
        "fullDate": "Friday, 02 April 2027",
        "iso": "2027-04-02",
        "isToday": false
      },
      {
        "dayIndex": 5,
        "dayName": "Sat",
        "dayNum": 3,
        "monthName": "Apr",
        "dateStr": "03 Apr",
        "fullDate": "Saturday, 03 April 2027",
        "iso": "2027-04-03",
        "isToday": false
      },
      {
        "dayIndex": 6,
        "dayName": "Sun",
        "dayNum": 4,
        "monthName": "Apr",
        "dateStr": "04 Apr",
        "fullDate": "Sunday, 04 April 2027",
        "iso": "2027-04-04",
        "isToday": false
      }
    ],
    "isCurrent": false
  },
  {
    "index": 33,
    "code": "S2 Wk12",
    "sem": "2",
    "month": "Apr 2027",
    "startDate": "05 Apr 2027",
    "endDate": "11 Apr 2027",
    "dateRange": "05 Apr \u2013 11 Apr 2027",
    "days": [
      {
        "dayIndex": 0,
        "dayName": "Mon",
        "dayNum": 5,
        "monthName": "Apr",
        "dateStr": "05 Apr",
        "fullDate": "Monday, 05 April 2027",
        "iso": "2027-04-05",
        "isToday": false
      },
      {
        "dayIndex": 1,
        "dayName": "Tue",
        "dayNum": 6,
        "monthName": "Apr",
        "dateStr": "06 Apr",
        "fullDate": "Tuesday, 06 April 2027",
        "iso": "2027-04-06",
        "isToday": false
      },
      {
        "dayIndex": 2,
        "dayName": "Wed",
        "dayNum": 7,
        "monthName": "Apr",
        "dateStr": "07 Apr",
        "fullDate": "Wednesday, 07 April 2027",
        "iso": "2027-04-07",
        "isToday": false
      },
      {
        "dayIndex": 3,
        "dayName": "Thu",
        "dayNum": 8,
        "monthName": "Apr",
        "dateStr": "08 Apr",
        "fullDate": "Thursday, 08 April 2027",
        "iso": "2027-04-08",
        "isToday": false
      },
      {
        "dayIndex": 4,
        "dayName": "Fri",
        "dayNum": 9,
        "monthName": "Apr",
        "dateStr": "09 Apr",
        "fullDate": "Friday, 09 April 2027",
        "iso": "2027-04-09",
        "isToday": false
      },
      {
        "dayIndex": 5,
        "dayName": "Sat",
        "dayNum": 10,
        "monthName": "Apr",
        "dateStr": "10 Apr",
        "fullDate": "Saturday, 10 April 2027",
        "iso": "2027-04-10",
        "isToday": false
      },
      {
        "dayIndex": 6,
        "dayName": "Sun",
        "dayNum": 11,
        "monthName": "Apr",
        "dateStr": "11 Apr",
        "fullDate": "Sunday, 11 April 2027",
        "iso": "2027-04-11",
        "isToday": false
      }
    ],
    "isCurrent": false
  },
  {
    "index": 34,
    "code": "S2 Wk13",
    "sem": "2",
    "month": "Apr 2027",
    "startDate": "12 Apr 2027",
    "endDate": "18 Apr 2027",
    "dateRange": "12 Apr \u2013 18 Apr 2027",
    "days": [
      {
        "dayIndex": 0,
        "dayName": "Mon",
        "dayNum": 12,
        "monthName": "Apr",
        "dateStr": "12 Apr",
        "fullDate": "Monday, 12 April 2027",
        "iso": "2027-04-12",
        "isToday": false
      },
      {
        "dayIndex": 1,
        "dayName": "Tue",
        "dayNum": 13,
        "monthName": "Apr",
        "dateStr": "13 Apr",
        "fullDate": "Tuesday, 13 April 2027",
        "iso": "2027-04-13",
        "isToday": false
      },
      {
        "dayIndex": 2,
        "dayName": "Wed",
        "dayNum": 14,
        "monthName": "Apr",
        "dateStr": "14 Apr",
        "fullDate": "Wednesday, 14 April 2027",
        "iso": "2027-04-14",
        "isToday": false
      },
      {
        "dayIndex": 3,
        "dayName": "Thu",
        "dayNum": 15,
        "monthName": "Apr",
        "dateStr": "15 Apr",
        "fullDate": "Thursday, 15 April 2027",
        "iso": "2027-04-15",
        "isToday": false
      },
      {
        "dayIndex": 4,
        "dayName": "Fri",
        "dayNum": 16,
        "monthName": "Apr",
        "dateStr": "16 Apr",
        "fullDate": "Friday, 16 April 2027",
        "iso": "2027-04-16",
        "isToday": false
      },
      {
        "dayIndex": 5,
        "dayName": "Sat",
        "dayNum": 17,
        "monthName": "Apr",
        "dateStr": "17 Apr",
        "fullDate": "Saturday, 17 April 2027",
        "iso": "2027-04-17",
        "isToday": false
      },
      {
        "dayIndex": 6,
        "dayName": "Sun",
        "dayNum": 18,
        "monthName": "Apr",
        "dateStr": "18 Apr",
        "fullDate": "Sunday, 18 April 2027",
        "iso": "2027-04-18",
        "isToday": false
      }
    ],
    "isCurrent": false
  }
];

  const TIMELINE_MONTHS = [
    { idx: 0, name: 'Aug 2026', label: 'August 2026', title: 'August 2026 • S1 Wk1 – Wk4', sem: '1', startWeek: 0, endWeek: 3 },
    { idx: 1, name: 'Sep 2026', label: 'September 2026', title: 'September 2026 • S1 Wk5 – Wk7 & Recess', sem: '1', isCurrent: true, startWeek: 4, endWeek: 7 },
    { idx: 2, name: 'Oct 2026', label: 'October 2026', title: 'October 2026 • S1 Wk8 – Wk11', sem: '1', startWeek: 8, endWeek: 11 },
    { idx: 3, name: 'Nov 2026', label: 'November 2026', title: 'November 2026 • S1 Wk12 – Wk13 & Exams', sem: '1', startWeek: 12, endWeek: 15 },
    { idx: 4, name: 'Dec 2026', label: 'December 2026', title: 'December 2026 • Vacation Wk1 – Wk4', sem: 'vac', startWeek: 16, endWeek: 20 },
    { idx: 5, name: 'Jan 2027', label: 'January 2027', title: 'January 2027 • S2 Wk1 – Wk3', sem: '2', startWeek: 21, endWeek: 23 },
    { idx: 6, name: 'Feb 2027', label: 'February 2027', title: 'February 2027 • S2 Wk4 – Wk6 & Recess', sem: '2', startWeek: 24, endWeek: 27 },
    { idx: 7, name: 'Mar 2027', label: 'March 2027', title: 'March 2027 • S2 Wk7 – Wk11', sem: '2', startWeek: 28, endWeek: 32 },
    { idx: 8, name: 'Apr 2027', label: 'April 2027', title: 'April 2027 • S2 Wk12 – Wk13 & Finals', sem: '2', startWeek: 33, endWeek: 34 }
  ];

  const OWNERS_CONFIG = {
    'asuka': {
      code: 'asuka',
      name: 'Asuka',
      fullName: 'Asuka (A0308285Y)',
      badgeClass: 'badge-purple',
      taskClass: 'gantt-task-asuka'
    },
    'zacarias': {
      code: 'zacarias',
      name: 'Zacarias',
      fullName: 'Zacarias (A0308821B)',
      badgeClass: 'badge-blue',
      taskClass: 'gantt-task-zac'
    },
    'hilbert': {
      code: 'hilbert',
      name: 'Hilbert',
      fullName: 'Hilbert (A0310232E)',
      badgeClass: 'badge-indigo',
      taskClass: 'gantt-task-hilbert'
    },
    'bryan': {
      code: 'bryan',
      name: 'Bryan',
      fullName: 'Bryan (A0297394E)',
      badgeClass: 'badge-amber',
      taskClass: 'gantt-task-bryan'
    },
    'gabriel': {
      code: 'gabriel',
      name: 'Gabriel',
      fullName: 'Gabriel (A0297298Y)',
      badgeClass: 'badge-emerald',
      taskClass: 'gantt-task-gabriel'
    },
    'all': {
      code: 'all',
      name: 'All Members',
      fullName: 'All Members (Full Team)',
      badgeClass: 'badge-rose',
      taskClass: 'gantt-task-milestone'
    }
  };

  const DEFAULT_SUBSYSTEMS = {
  "asuka": [
    "Problem Finding & Definition",
    "Needs Definition",
    "Vacuum Subsystem",
    "Suspension Subsystem",
    "Administrative"
  ],
  "zacarias": [
    "Chassis Design & Assembly",
    "Plate Design & Fabrication",
    "Motor Calculations"
  ],
  "hilbert": [
    "Research",
    "Navigation",
    "UAV Communication",
    "Extra",
    "Report"
  ],
  "bryan": [
    "Circuit Design & Component Selection",
    "Hardware Procurement & Assembly",
    "Firmware & Testing"
  ],
  "gabriel": [
    "Computer Vision & YOLO Architecture",
    "Hardware Procurement & Electrical"
  ]
};
  const DEFAULT_TASKS = [
  {
    "id": "task-101",
    "owner": "Asuka",
    "ownerCode": "asuka",
    "category": "Problem Finding & Definition",
    "title": "Secondary research on problem",
    "period": "S1 Wk1 - S1 Wk4",
    "startWeekIdx": 0,
    "endWeekIdx": 3,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "Comprehensive literature review on runway FOD risks, turbine ingestion thresholds, and current sweepers."
  },
  {
    "id": "task-102",
    "owner": "Asuka",
    "ownerCode": "asuka",
    "category": "Problem Finding & Definition",
    "title": "Primary Research on Problem",
    "period": "S1 Wk5 - S1 Wk6",
    "startWeekIdx": 4,
    "endWeekIdx": 5,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "Direct consultation with airport operators and airfield safety protocols."
  },
  {
    "id": "task-103",
    "owner": "Asuka",
    "ownerCode": "asuka",
    "category": "Problem Finding & Definition",
    "title": "Finalize Problem Insight report and problem definition",
    "period": "S1 Recess",
    "startWeekIdx": 6,
    "endWeekIdx": 6,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "Synthesizing operational problem statement and design constraints during recess week."
  },
  {
    "id": "task-104",
    "owner": "Asuka",
    "ownerCode": "asuka",
    "category": "Needs Definition",
    "title": "Generation of List of Requirements and list of specifications",
    "period": "S1 Wk3 - S1 Wk4",
    "startWeekIdx": 2,
    "endWeekIdx": 3,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "Target pickup aerodynamic velocities, suction volume, power budget, and maximum payload envelope."
  },
  {
    "id": "task-105",
    "owner": "Asuka",
    "ownerCode": "asuka",
    "category": "Needs Definition",
    "title": "Purchase of items needed for CFP",
    "period": "S1 Wk5 - S1 Wk6",
    "startWeekIdx": 4,
    "endWeekIdx": 5,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "Procurement of impeller blower fan, duct fittings, and suspension hardware."
  },
  {
    "id": "task-106",
    "owner": "Asuka",
    "ownerCode": "asuka",
    "category": "Vacuum Subsystem",
    "title": "Calculations and design for Vacuum Subsystem",
    "period": "S1 Wk3 - S1 Wk6",
    "startWeekIdx": 2,
    "endWeekIdx": 5,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "CFD simulation of nozzle flow, aerodynamic pressure drop, and ducting dimensions."
  },
  {
    "id": "task-107",
    "owner": "Asuka",
    "ownerCode": "asuka",
    "category": "Vacuum Subsystem",
    "title": "Development of second design iteration",
    "period": "S1 Recess",
    "startWeekIdx": 6,
    "endWeekIdx": 6,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "Refining impeller housing and aerofoil profile to maximize localized negative pressure."
  },
  {
    "id": "task-108",
    "owner": "Asuka",
    "ownerCode": "asuka",
    "category": "Vacuum Subsystem",
    "title": "Fabrication of Vacuum Head",
    "period": "S1 Wk7 - S1 Wk8",
    "startWeekIdx": 7,
    "endWeekIdx": 8,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "3D printing high-impact vacuum manifold and mounting brackets."
  },
  {
    "id": "task-109",
    "owner": "Asuka",
    "ownerCode": "asuka",
    "category": "Vacuum Subsystem",
    "title": "Testing of Vacuum Subsystem",
    "period": "S1 Wk9",
    "startWeekIdx": 9,
    "endWeekIdx": 9,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "Benchtop suction testing across metallic, rubber, and aggregate debris specimens."
  },
  {
    "id": "task-110",
    "owner": "Asuka",
    "ownerCode": "asuka",
    "category": "Vacuum Subsystem",
    "title": "Improvement on Vacuum Subsystem",
    "period": "S1 Wk10 - S1 Wk11",
    "startWeekIdx": 10,
    "endWeekIdx": 11,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "Optimizing air skirt seal and airflow distribution across pickup width."
  },
  {
    "id": "task-111",
    "owner": "Asuka",
    "ownerCode": "asuka",
    "category": "Vacuum Subsystem",
    "title": "Finalise Design for Vacuum subsystem",
    "period": "S1 Wk11",
    "startWeekIdx": 11,
    "endWeekIdx": 11,
    "semester": "1",
    "isMilestone": true,
    "status": "In Progress",
    "notes": "Locking in mechanical CAD and CFP integration drawings for Interim Review."
  },
  {
    "id": "task-112",
    "owner": "Asuka",
    "ownerCode": "asuka",
    "category": "Suspension Subsystem",
    "title": "Calculations and design for Suspension Subsystem",
    "period": "S1 Wk3 - S1 Wk6",
    "startWeekIdx": 2,
    "endWeekIdx": 5,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "Spring rate, damper kinematics, and ground clearance calculations for rough tarmac."
  },
  {
    "id": "task-113",
    "owner": "Asuka",
    "ownerCode": "asuka",
    "category": "Suspension Subsystem",
    "title": "Waiting on component arrival",
    "period": "S1 Recess",
    "startWeekIdx": 6,
    "endWeekIdx": 6,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "Tracking delivery of CNC machined suspension links, coil-overs, and fasteners."
  },
  {
    "id": "task-114",
    "owner": "Asuka",
    "ownerCode": "asuka",
    "category": "Suspension Subsystem",
    "title": "Fabrication of Suspension Brackets",
    "period": "S1 Wk7 - S1 Wk8",
    "startWeekIdx": 7,
    "endWeekIdx": 8,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "Machining and mounting structural brackets to chassis rails."
  },
  {
    "id": "task-115",
    "owner": "Asuka",
    "ownerCode": "asuka",
    "category": "Suspension Subsystem",
    "title": "Testing of Suspension subsystem",
    "period": "S1 Wk9",
    "startWeekIdx": 9,
    "endWeekIdx": 9,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "Drop tests and payload deflection measurements under simulated operating weight."
  },
  {
    "id": "task-116",
    "owner": "Asuka",
    "ownerCode": "asuka",
    "category": "Suspension Subsystem",
    "title": "Improvement on Suspension Subsystem",
    "period": "S1 Wk10 - S1 Wk11",
    "startWeekIdx": 10,
    "endWeekIdx": 11,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "Tuning damping ratio and anti-vibration damping pads."
  },
  {
    "id": "task-117",
    "owner": "Asuka",
    "ownerCode": "asuka",
    "category": "Suspension Subsystem",
    "title": "Finalise design for suspension subsystem",
    "period": "S1 Wk11",
    "startWeekIdx": 11,
    "endWeekIdx": 11,
    "semester": "1",
    "isMilestone": true,
    "status": "In Progress",
    "notes": "Finalizing CAD and torque specs for full vehicle integration."
  },
  {
    "id": "task-118",
    "owner": "Asuka",
    "ownerCode": "asuka",
    "category": "Administrative",
    "title": "Documentation",
    "period": "S1 Recess",
    "startWeekIdx": 6,
    "endWeekIdx": 6,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "Maintaining mechanical subsystem design notebooks and risk registers."
  },
  {
    "id": "task-119",
    "owner": "Asuka",
    "ownerCode": "asuka",
    "category": "Administrative",
    "title": "Prepare documentation and compile all results",
    "period": "S1 Wk11",
    "startWeekIdx": 11,
    "endWeekIdx": 11,
    "semester": "1",
    "isMilestone": true,
    "status": "In Progress",
    "notes": "Compiling mechanical performance metrics for Interim Report submission."
  },
  {
    "id": "task-120",
    "owner": "Asuka",
    "ownerCode": "asuka",
    "category": "Administrative",
    "title": "RESERVIST",
    "period": "Vac Wk 1 - Vac Wk 2",
    "startWeekIdx": 17,
    "endWeekIdx": 18,
    "semester": "vac",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "National Service Reservist deployment."
  },
  {
    "id": "task-201",
    "owner": "Zacarias",
    "ownerCode": "zacarias",
    "category": "Chassis Design & Assembly",
    "title": "Chassis Design",
    "period": "S1 Wk1 - S1 Wk6",
    "startWeekIdx": 0,
    "endWeekIdx": 5,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "Structural frame CAD, weight distribution, and component spatial layout."
  },
  {
    "id": "task-202",
    "owner": "Zacarias",
    "ownerCode": "zacarias",
    "category": "Chassis Design & Assembly",
    "title": "Fabrication of chassis",
    "period": "S1 Recess - S1 Wk9",
    "startWeekIdx": 6,
    "endWeekIdx": 9,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "Cutting, welding, and assembling 8020 aluminum extrusion frame."
  },
  {
    "id": "task-203",
    "owner": "Zacarias",
    "ownerCode": "zacarias",
    "category": "Chassis Design & Assembly",
    "title": "Assembly of chassis",
    "period": "S1 Wk10",
    "startWeekIdx": 10,
    "endWeekIdx": 10,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "Final mechanical assembly of chassis frame with wheel hubs and axles."
  },
  {
    "id": "task-204",
    "owner": "Zacarias",
    "ownerCode": "zacarias",
    "category": "Chassis Design & Assembly",
    "title": "Improve on suspension and chassis",
    "period": "S1 Wk10 - S1 Wk11",
    "startWeekIdx": 10,
    "endWeekIdx": 11,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "Torsional stiffness validation and structural reinforcement."
  },
  {
    "id": "task-205",
    "owner": "Zacarias",
    "ownerCode": "zacarias",
    "category": "Plate Design & Fabrication",
    "title": "Design of Plate",
    "period": "S1 Wk3 - S1 Wk7",
    "startWeekIdx": 2,
    "endWeekIdx": 7,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "Baseplate, electronics deck, and vacuum intake mounting plate CAD."
  },
  {
    "id": "task-206",
    "owner": "Zacarias",
    "ownerCode": "zacarias",
    "category": "Plate Design & Fabrication",
    "title": "Fabrication of Plate",
    "period": "S1 Wk8 - S1 Wk10",
    "startWeekIdx": 8,
    "endWeekIdx": 10,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "CNC laser cutting and waterjet profiling of aluminum baseplates."
  },
  {
    "id": "task-207",
    "owner": "Zacarias",
    "ownerCode": "zacarias",
    "category": "Motor Calculations",
    "title": "Motor Calculations",
    "period": "S1 Wk3 - S1 Wk5",
    "startWeekIdx": 2,
    "endWeekIdx": 4,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "Torque curve, gear ratio, incline capability, and payload speed modeling."
  },
  {
    "id": "task-301",
    "owner": "Hilbert",
    "ownerCode": "hilbert",
    "category": "Research",
    "title": "Secondary research on problem",
    "period": "S1 Wk1 - S1 Wk2",
    "startWeekIdx": 0,
    "endWeekIdx": 1,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "Evaluation of RTK-GPS, LiDAR SLAM, and visual odometry algorithms."
  },
  {
    "id": "task-302",
    "owner": "Hilbert",
    "ownerCode": "hilbert",
    "category": "Research",
    "title": "CV Camera Research",
    "period": "S1 Wk3 - S1 Wk4",
    "startWeekIdx": 2,
    "endWeekIdx": 3,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "Lens focal length, FOV, and global vs rolling shutter benchmark for high-speed tracking."
  },
  {
    "id": "task-303",
    "owner": "Hilbert",
    "ownerCode": "hilbert",
    "category": "Navigation",
    "title": "ROS Installation and getting familiar",
    "period": "S1 Wk2 - S1 Wk3",
    "startWeekIdx": 1,
    "endWeekIdx": 2,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "Setting up Ubuntu 24.04, ROS 2 Jazzy/Iron, and micro-ROS toolchains."
  },
  {
    "id": "task-304",
    "owner": "Hilbert",
    "ownerCode": "hilbert",
    "category": "Navigation",
    "title": "ROS Simulation on obstacle avoidance",
    "period": "S1 Wk4 - S1 Wk6",
    "startWeekIdx": 3,
    "endWeekIdx": 5,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "Gazebo simulation environment with costmaps, Nav2, and DWA planner."
  },
  {
    "id": "task-305",
    "owner": "Hilbert",
    "ownerCode": "hilbert",
    "category": "Navigation",
    "title": "Integrating UGV model into ROS Simulation",
    "period": "S1 Recess - S1 Wk8",
    "startWeekIdx": 6,
    "endWeekIdx": 8,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "URDF/Xacro robot description with accurate inertia, wheel physics, and sensors."
  },
  {
    "id": "task-306",
    "owner": "Hilbert",
    "ownerCode": "hilbert",
    "category": "Navigation",
    "title": "Mapping and Integrating to ROS Simulation",
    "period": "S1 Wk9 - S1 Wk10",
    "startWeekIdx": 9,
    "endWeekIdx": 10,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "2D/3D SLAM map generation and localization validation in simulated runway."
  },
  {
    "id": "task-307",
    "owner": "Hilbert",
    "ownerCode": "hilbert",
    "category": "Navigation",
    "title": "Integrating ROS2 package into physical UGV",
    "period": "S2 Wk1 - S2 Wk2",
    "startWeekIdx": 21,
    "endWeekIdx": 22,
    "semester": "2",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "Deploying Nav2 stack to onboard compute with real motor controller interface."
  },
  {
    "id": "task-308",
    "owner": "Hilbert",
    "ownerCode": "hilbert",
    "category": "Navigation",
    "title": "Tuning and testing of UGV navigation",
    "period": "S2 Wk3 - S2 Wk4",
    "startWeekIdx": 23,
    "endWeekIdx": 24,
    "semester": "2",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "Real-world waypoint tracking, speed tuning, and runway boundary compliance."
  },
  {
    "id": "task-309",
    "owner": "Hilbert",
    "ownerCode": "hilbert",
    "category": "UAV Communication",
    "title": "Communication research",
    "period": "S1 Wk5",
    "startWeekIdx": 4,
    "endWeekIdx": 4,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "Wi-Fi 6 vs LoRa vs ESP-NOW telemetry protocols for UAV-UGV bridge."
  },
  {
    "id": "task-310",
    "owner": "Hilbert",
    "ownerCode": "hilbert",
    "category": "UAV Communication",
    "title": "Component Selection",
    "period": "S1 Wk6",
    "startWeekIdx": 5,
    "endWeekIdx": 5,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "Transceiver module selection, high-gain antennas, and interface hardware."
  },
  {
    "id": "task-311",
    "owner": "Hilbert",
    "ownerCode": "hilbert",
    "category": "UAV Communication",
    "title": "Delivery of Components",
    "period": "S1 Recess - S1 Wk8",
    "startWeekIdx": 6,
    "endWeekIdx": 8,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "Procuring RF modules and testing bench."
  },
  {
    "id": "task-312",
    "owner": "Hilbert",
    "ownerCode": "hilbert",
    "category": "UAV Communication",
    "title": "Testing Communication between UGV and UAV computer",
    "period": "S1 Wk9",
    "startWeekIdx": 9,
    "endWeekIdx": 9,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "Throughput, packet loss, and latency testing under simulated interference."
  },
  {
    "id": "task-313",
    "owner": "Hilbert",
    "ownerCode": "hilbert",
    "category": "UAV Communication",
    "title": "Simulation for communication link between UGV and UAV",
    "period": "S1 Wk10 - S1 Wk11",
    "startWeekIdx": 10,
    "endWeekIdx": 11,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "ROS 2 Zenoh/DDS bridge simulation for multi-agent coordinated sweep."
  },
  {
    "id": "task-314",
    "owner": "Hilbert",
    "ownerCode": "hilbert",
    "category": "UAV Communication",
    "title": "Integrating communication package with UAV",
    "period": "S2 Wk5",
    "startWeekIdx": 25,
    "endWeekIdx": 25,
    "semester": "2",
    "isMilestone": true,
    "status": "In Progress",
    "notes": "End-to-end aerial drone detection to ground robot intercept dispatch."
  },
  {
    "id": "task-315",
    "owner": "Hilbert",
    "ownerCode": "hilbert",
    "category": "Extra",
    "title": "Calculations for motor and components",
    "period": "S1 Wk1 - S1 Wk2",
    "startWeekIdx": 0,
    "endWeekIdx": 1,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "Power requirements and current draw sizing for navigation computers."
  },
  {
    "id": "task-316",
    "owner": "Hilbert",
    "ownerCode": "hilbert",
    "category": "Extra",
    "title": "Designing final Chassis",
    "period": "Vac Wk 1 - Vac Wk 2",
    "startWeekIdx": 17,
    "endWeekIdx": 18,
    "semester": "vac",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "Collaborative refinement of chassis envelope during December break."
  },
  {
    "id": "task-317",
    "owner": "Hilbert",
    "ownerCode": "hilbert",
    "category": "Report",
    "title": "Prepare documentation and compile all results",
    "period": "S1 Wk11",
    "startWeekIdx": 11,
    "endWeekIdx": 11,
    "semester": "1",
    "isMilestone": true,
    "status": "In Progress",
    "notes": "Interim documentation submission for navigation and autonomy stack."
  },
  {
    "id": "task-318",
    "owner": "Hilbert",
    "ownerCode": "hilbert",
    "category": "Report",
    "title": "RESERVIST",
    "period": "Vac Wk 2 - Vac Wk 3",
    "startWeekIdx": 18,
    "endWeekIdx": 19,
    "semester": "vac",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "National Service Reservist duty."
  },
  {
    "id": "task-319",
    "owner": "Hilbert",
    "ownerCode": "hilbert",
    "category": "Report",
    "title": "Prepare documentation and compile all results",
    "period": "S2 Wk10 - S2 Wk11",
    "startWeekIdx": 31,
    "endWeekIdx": 32,
    "semester": "2",
    "isMilestone": true,
    "status": "In Progress",
    "notes": "Final Capstone thesis and documentation compilation for Week 11."
  },
  {
    "id": "task-401",
    "owner": "Bryan",
    "ownerCode": "bryan",
    "category": "Circuit Design & Component Selection",
    "title": "Component calculations and selection",
    "period": "S1 Wk2 - S1 Wk6",
    "startWeekIdx": 1,
    "endWeekIdx": 5,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "Battery C-rating, buck-boost regulators, motor drivers, and BMS sizing."
  },
  {
    "id": "task-402",
    "owner": "Bryan",
    "ownerCode": "bryan",
    "category": "Circuit Design & Component Selection",
    "title": "Wiring Diagram",
    "period": "S1 Wk5 - S1 Wk6",
    "startWeekIdx": 4,
    "endWeekIdx": 5,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "High-voltage and low-voltage harness schematics and fused distribution blocks."
  },
  {
    "id": "task-403",
    "owner": "Bryan",
    "ownerCode": "bryan",
    "category": "Circuit Design & Component Selection",
    "title": "Communication chart and Power budget diagram",
    "period": "S1 Wk5 - S1 Wk6",
    "startWeekIdx": 4,
    "endWeekIdx": 5,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "CAN bus topology, signal routing, and continuous vs peak power budget."
  },
  {
    "id": "task-404",
    "owner": "Bryan",
    "ownerCode": "bryan",
    "category": "Hardware Procurement & Assembly",
    "title": "Delivery of Components",
    "period": "S1 Recess",
    "startWeekIdx": 6,
    "endWeekIdx": 6,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "Receiving PCB components, contactors, emergency stop switches, and harness wiring."
  },
  {
    "id": "task-405",
    "owner": "Bryan",
    "ownerCode": "bryan",
    "category": "Hardware Procurement & Assembly",
    "title": "Electrical Assembly/Soldering",
    "period": "S1 Wk7 - S1 Wk9",
    "startWeekIdx": 7,
    "endWeekIdx": 9,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "Soldering power distribution board, crimping connectors, and harness loom."
  },
  {
    "id": "task-406",
    "owner": "Bryan",
    "ownerCode": "bryan",
    "category": "Firmware & Testing",
    "title": "Testing Power/Battery",
    "period": "S1 Wk7 - S1 Wk9",
    "startWeekIdx": 7,
    "endWeekIdx": 9,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "LiPo discharge curve testing, thermal rise monitoring, and BMS protection triggers."
  },
  {
    "id": "task-407",
    "owner": "Bryan",
    "ownerCode": "bryan",
    "category": "Firmware & Testing",
    "title": "Programming of STM32",
    "period": "S1 Wk7 - S1 Wk8",
    "startWeekIdx": 7,
    "endWeekIdx": 8,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "Firmware for motor PWM, encoder feedback, and CAN safety heartbeat."
  },
  {
    "id": "task-408",
    "owner": "Bryan",
    "ownerCode": "bryan",
    "category": "Firmware & Testing",
    "title": "Testing Circuits",
    "period": "S1 Wk9 - S1 Wk11",
    "startWeekIdx": 9,
    "endWeekIdx": 11,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "Load testing of voltage regulators and ground loop isolation."
  },
  {
    "id": "task-409",
    "owner": "Bryan",
    "ownerCode": "bryan",
    "category": "Firmware & Testing",
    "title": "RESERVIST",
    "period": "Vac Wk 2 - Vac Wk 3",
    "startWeekIdx": 18,
    "endWeekIdx": 19,
    "semester": "vac",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "National Service Reservist deployment."
  },
  {
    "id": "task-501",
    "owner": "Gabriel",
    "ownerCode": "gabriel",
    "category": "Computer Vision & YOLO Architecture",
    "title": "Yolo - CV",
    "period": "S1 Wk1 - S1 Wk6",
    "startWeekIdx": 0,
    "endWeekIdx": 5,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "Benchmark YOLOv8 vs YOLOv11 for small FOD detection on tarmac."
  },
  {
    "id": "task-502",
    "owner": "Gabriel",
    "ownerCode": "gabriel",
    "category": "Computer Vision & YOLO Architecture",
    "title": "CV Data and Training",
    "period": "S1 Recess - S1 Wk10",
    "startWeekIdx": 6,
    "endWeekIdx": 10,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "Dataset annotation, synthetic augmentation, and model training for bolts, wire, and debris."
  },
  {
    "id": "task-503",
    "owner": "Gabriel",
    "ownerCode": "gabriel",
    "category": "Computer Vision & YOLO Architecture",
    "title": "Development of CV Proof of concept",
    "period": "S1 Wk9 - S1 Wk13",
    "startWeekIdx": 9,
    "endWeekIdx": 13,
    "semester": "1",
    "isMilestone": true,
    "status": "In Progress",
    "notes": "Live RTSP camera inference pipeline demonstrating real-time bounding box detection."
  },
  {
    "id": "task-504",
    "owner": "Gabriel",
    "ownerCode": "gabriel",
    "category": "Computer Vision & YOLO Architecture",
    "title": "Integrating CV with ROS2",
    "period": "S2 Wk1 - S2 Wk2",
    "startWeekIdx": 21,
    "endWeekIdx": 22,
    "semester": "2",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "Publishing detected FOD 3D coordinates into ROS 2 `/detected_fod` topic."
  },
  {
    "id": "task-505",
    "owner": "Gabriel",
    "ownerCode": "gabriel",
    "category": "Computer Vision & YOLO Architecture",
    "title": "Tuning and testing of UGV CV",
    "period": "S2 Wk3 - S2 Wk4",
    "startWeekIdx": 23,
    "endWeekIdx": 24,
    "semester": "2",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "Optimizing TensorRT FP16 engine on Jetson compute under direct sunlight conditions."
  },
  {
    "id": "task-506",
    "owner": "Gabriel",
    "ownerCode": "gabriel",
    "category": "Hardware Procurement & Electrical",
    "title": "Component calculations and selection",
    "period": "S1 Wk2 - S1 Wk6",
    "startWeekIdx": 1,
    "endWeekIdx": 5,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "Camera sensor FOV, lens resolution, and Jetson compute wattage calculations."
  },
  {
    "id": "task-507",
    "owner": "Gabriel",
    "ownerCode": "gabriel",
    "category": "Hardware Procurement & Electrical",
    "title": "Communication chart and Power budget diagram",
    "period": "S1 Wk5 - S1 Wk6",
    "startWeekIdx": 4,
    "endWeekIdx": 5,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "Camera gigabit Ethernet/MIPI CSI interface and power draw diagram."
  },
  {
    "id": "task-508",
    "owner": "Gabriel",
    "ownerCode": "gabriel",
    "category": "Hardware Procurement & Electrical",
    "title": "Delivery of Components",
    "period": "S1 Recess",
    "startWeekIdx": 6,
    "endWeekIdx": 6,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "Procuring camera modules, optical filters, and edge compute carrier board."
  },
  {
    "id": "task-509",
    "owner": "Gabriel",
    "ownerCode": "gabriel",
    "category": "Hardware Procurement & Electrical",
    "title": "Electrical Assembly/Soldering",
    "period": "S1 Wk7 - S1 Wk9",
    "startWeekIdx": 7,
    "endWeekIdx": 9,
    "semester": "1",
    "isMilestone": false,
    "status": "In Progress",
    "notes": "Assembling camera mount wiring, power cable harnesses, and heatsinks."
  },
  {
    "id": "task-901",
    "owner": "All Members",
    "ownerCode": "all",
    "category": "Capstone Milestones",
    "title": "INTERIM PRESENTATION: Critical Function Prototype",
    "period": "S1 Wk12",
    "startWeekIdx": 12,
    "endWeekIdx": 12,
    "semester": "1",
    "isMilestone": true,
    "status": "In Progress",
    "notes": "Formal demonstration of working Critical Function Prototype (CFP) to academic and industry assessors.",
    "isAllMembers": true
  },
  {
    "id": "task-902",
    "owner": "All Members",
    "ownerCode": "all",
    "category": "Capstone Milestones",
    "title": "DOCUMENTATION DUE ON THIS WEEK",
    "period": "S1 Wk13",
    "startWeekIdx": 13,
    "endWeekIdx": 13,
    "semester": "1",
    "isMilestone": true,
    "status": "In Progress",
    "notes": "Final submission of Interim Engineering Report and CAD repository.",
    "isAllMembers": true
  },
  {
    "id": "task-903",
    "owner": "All Members",
    "ownerCode": "all",
    "category": "Capstone Milestones",
    "title": "FINAL DOCUMENTATION DUE ON WEEK 11",
    "period": "S2 Wk11",
    "startWeekIdx": 32,
    "endWeekIdx": 32,
    "semester": "2",
    "isMilestone": true,
    "status": "In Progress",
    "notes": "Complete Capstone Final Dissertation, bill of materials, and open-source documentation.",
    "isAllMembers": true
  },
  {
    "id": "task-904",
    "owner": "All Members",
    "ownerCode": "all",
    "category": "Capstone Milestones",
    "title": "FINAL PRESENTATION",
    "period": "S2 Wk13",
    "startWeekIdx": 34,
    "endWeekIdx": 34,
    "semester": "2",
    "isMilestone": true,
    "status": "In Progress",
    "notes": "Final Capstone Live Demonstration and Presentation to Faculty.",
    "isAllMembers": true
  }
];

  const STORAGE_KEY = 'cde4301_timeline_tasks_v6';
  const SUBSYSTEMS_KEY = 'cde4301_timeline_subsystems_v6';
  const AUTH_KEY = 'cde4301_timeline_authenticated';
  const VALID_PASSCODES = ['cde4301', 'robotics2026', 'nusrobotics'];

  // Current State
  let activeWeekIndex = 5; // S1 Wk6 (14-20 Sep 2026)
  let activeMonthIndex = 1; // September 2026
  let allTasks = loadTasks();
  let allSubsystems = loadSubsystems();
  let currentMode = 'week'; // 'week' | 'month'
  let isEditMode = false;
  let currentOwnerFilter = 'all';
  let searchQuery = '';
  let activeEditingTaskId = null;

  function loadTasks() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load tasks from localStorage:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_TASKS));
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allTasks));
    } catch (e) {
      console.error('Failed to save tasks to localStorage:', e);
    }
  }

  function loadSubsystems() {
    try {
      const saved = localStorage.getItem(SUBSYSTEMS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load subsystems from localStorage:', e);
    }
    const initial = JSON.parse(JSON.stringify(DEFAULT_SUBSYSTEMS));
    if (Array.isArray(allTasks)) {
      allTasks.forEach(t => {
        const o = t.ownerCode || (t.owner ? t.owner.toLowerCase() : 'asuka');
        if (o !== 'all' && o !== 'team') {
          if (!initial[o]) initial[o] = [];
          if (!initial[o].includes(t.category)) initial[o].push(t.category);
        }
      });
    }
    return initial;
  }

  function saveSubsystems() {
    try {
      localStorage.setItem(SUBSYSTEMS_KEY, JSON.stringify(allSubsystems));
    } catch (e) {
      console.error('Failed to save subsystems to localStorage:', e);
    }
  }

  function isAuthenticated() {
    return sessionStorage.getItem(AUTH_KEY) === 'true';
  }

  function setAuthenticated(val) {
    if (val) sessionStorage.setItem(AUTH_KEY, 'true');
    else sessionStorage.removeItem(AUTH_KEY);
  }

  // ── 2. DOM INJECTION (ACTION BAR, MODALS, HOVER TOOLTIP) ───────────
  function initDOM() {
    const matrixContainer = document.getElementById('view-container-matrix');
    if (!matrixContainer) return;

    // Clean up any old action bars or banners
    const existingBar = document.querySelector('.timeline-action-bar');
    if (existingBar) existingBar.remove();
    const existingBanner = document.getElementById('timeline-edit-banner');
    if (existingBanner) existingBanner.remove();

    // Inject New Action Bar
    const actionBar = document.createElement('div');
    actionBar.className = 'timeline-action-bar';
    actionBar.innerHTML = `
      <div class="timeline-nav-navigator">
        <div class="timeline-nav-buttons">
          <button class="t-btn-scroll" id="btn-timeline-prev" title="Previous Week / Month" aria-label="Previous">‹</button>
          <button class="t-btn-scroll" id="btn-timeline-next" title="Next Week / Month" aria-label="Next">›</button>
        </div>
        
        <div class="timeline-current-title-wrap">
          <select id="timeline-period-select" class="timeline-period-select" title="Select Week or Month"></select>
        </div>

        <button class="t-btn-today" id="btn-timeline-jump-today" title="Jump to Today (20 Sep 2026 • S1 Wk6)">
          <span class="live-pulse"></span> Today (20 Sep)
        </button>
      </div>

      <div class="timeline-view-toggle">
        <button class="t-toggle-btn active" id="btn-toggle-week">📅 Show by Week</button>
        <button class="t-toggle-btn" id="btn-toggle-month">📆 Show by Month</button>
      </div>

      <div class="timeline-edit-controls">
        <button class="t-btn-edit" id="btn-toggle-edit-mode">
          <span id="edit-lock-icon">🔒</span> <span id="edit-btn-label">Edit Timeline</span>
        </button>
        <button class="t-btn-action t-btn-primary" id="btn-add-new-task" style="display: none;">
          ➕ Add Deliverable
        </button>
        <button class="t-btn-action t-btn-purple" id="btn-add-subsystem-top" style="display: none;" title="Create a new Subsystem / Category row">
          🧩 Add Subsystem
        </button>
        <div class="timeline-extra-actions" id="timeline-extra-actions" style="display: none;">
          <button class="t-btn-action t-btn-green" id="btn-export-excel-top" title="Export Gantt Chart to Excel (.xlsx)">
            📊 Export Excel
          </button>
          <button class="t-btn-action t-btn-secondary" id="btn-import-top" title="Import schedule from Excel (.xlsx) or JSON">
            📥 Import
          </button>
          <button class="t-btn-action t-btn-secondary" id="btn-sync-repo" title="Sync timeline updates to Git repository">
            💾 Sync to Repo
          </button>
        </div>
      </div>
    `;

    // Active Edit Banner
    const editBanner = document.createElement('div');
    editBanner.className = 'timeline-edit-banner';
    editBanner.id = 'timeline-edit-banner';
    editBanner.style.display = 'none';
    editBanner.innerHTML = `
      <div class="edit-banner-content">
        <span class="edit-badge">🔓 EDIT MODE ACTIVE</span>
        <span>Members can click <strong>🧩 Add Subsystem</strong> to add categories, <strong>✏️ / 🗑️</strong> to rename or remove subsystems, or <strong>➕ Add Deliverable</strong> to insert project tasks.</span>
      </div>
      <button class="edit-banner-exit" id="btn-banner-exit">Exit Edit Mode ✕</button>
    `;

    matrixContainer.parentNode.insertBefore(actionBar, matrixContainer);
    matrixContainer.parentNode.insertBefore(editBanner, matrixContainer);

    updatePeriodSelectOptions();

    // Inject Floating Tooltip for Hover Notes
    if (!document.getElementById('gantt-task-tooltip')) {
      const tooltip = document.createElement('div');
      tooltip.id = 'gantt-task-tooltip';
      tooltip.className = 'gantt-floating-tooltip';
      tooltip.style.display = 'none';
      document.body.appendChild(tooltip);
    }

    // Inject Password Modal
    if (!document.getElementById('timeline-password-modal')) {
      const pwdModal = document.createElement('div');
      pwdModal.className = 'timeline-modal-backdrop';
      pwdModal.id = 'timeline-password-modal';
      pwdModal.style.display = 'none';
      pwdModal.innerHTML = `
        <div class="timeline-modal-dialog">
          <div class="timeline-modal-header">
            <h3>🔒 Team Passcode Required</h3>
            <button class="modal-close-icon" id="btn-close-pwd-modal">&times;</button>
          </div>
          <div class="timeline-modal-body">
            <p style="color:var(--text-muted);font-size:13px;margin-bottom:16px;">
              To add/remove subsystems or edit project deliverables, enter the CDE4301 team passcode.
            </p>
            <div class="form-group" style="margin-bottom:12px;">
              <label for="timeline-pwd-input" style="font-size:12px;font-weight:600;display:block;margin-bottom:6px;">Team Passcode:</label>
              <div class="pwd-input-wrapper">
                <input type="password" id="timeline-pwd-input" placeholder="Enter passcode..." autocomplete="current-password">
                <button type="button" id="btn-toggle-pwd-visibility" class="btn-pwd-eye" title="Show/Hide Passcode">👁️</button>
              </div>
              <div class="pwd-error-msg" id="pwd-error-msg" style="display:none;color:#ff453a;font-size:12px;margin-top:6px;">Incorrect passcode. Please try again.</div>
            </div>
          </div>
          <div class="timeline-modal-footer">
            <button class="btn btn-outline" id="btn-cancel-pwd">Cancel</button>
            <button class="btn btn-primary" id="btn-submit-pwd">Unlock Edit Mode 🔓</button>
          </div>
        </div>
      `;
      document.body.appendChild(pwdModal);
    }

    // Inject Add Subsystem Modal
    if (!document.getElementById('timeline-subsystem-modal')) {
      const subModal = document.createElement('div');
      subModal.className = 'timeline-modal-backdrop';
      subModal.id = 'timeline-subsystem-modal';
      subModal.style.display = 'none';
      subModal.innerHTML = `
        <div class="timeline-modal-dialog">
          <div class="timeline-modal-header">
            <h3>🧩 Add New Subsystem / Category</h3>
            <button class="modal-close-icon" id="btn-close-subsystem-modal">&times;</button>
          </div>
          <div class="timeline-modal-body">
            <div class="form-group" style="margin-bottom:14px;">
              <label for="subsystem-member-select" style="font-size:12px;font-weight:600;display:block;margin-bottom:6px;">Student In Charge *</label>
              <select id="subsystem-member-select" style="width:100%;">
                <option value="asuka">Asuka (A0308285Y)</option>
                <option value="zacarias">Zacarias (A0308821B)</option>
                <option value="hilbert">Hilbert (A0310232E)</option>
                <option value="bryan">Bryan (A0297394E)</option>
                <option value="gabriel">Gabriel (A0297298Y)</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom:14px;">
              <label for="subsystem-name-input" style="font-size:12px;font-weight:600;display:block;margin-bottom:6px;">Subsystem Name *</label>
              <input type="text" id="subsystem-name-input" placeholder="e.g. Vacuum Impeller & Aerodynamics" style="width:100%;">
            </div>
            <p style="font-size:11.5px;color:var(--text-muted);margin:0;">
              This creates a dedicated category row for this member on the Gantt chart. Deliverables can be added immediately.
            </p>
          </div>
          <div class="timeline-modal-footer">
            <button class="btn btn-outline" id="btn-cancel-subsystem">Cancel</button>
            <button class="btn btn-primary" id="btn-submit-subsystem">➕ Create Subsystem</button>
          </div>
        </div>
      `;
      document.body.appendChild(subModal);
    }

    // Inject Task Editor Modal
    if (!document.getElementById('timeline-task-modal')) {
      const taskModal = document.createElement('div');
      taskModal.className = 'timeline-modal-backdrop';
      taskModal.id = 'timeline-task-modal';
      taskModal.style.display = 'none';
      taskModal.innerHTML = `
        <div class="timeline-modal-dialog modal-lg">
          <div class="timeline-modal-header">
            <h3 id="task-modal-heading">➕ Add / Edit Deliverable</h3>
            <button class="modal-close-icon" id="btn-close-task-modal">&times;</button>
          </div>
          <div class="timeline-modal-body">
            <form id="timeline-task-form">
              <div class="form-group" style="margin-bottom:14px;">
                <label for="task-form-title" style="font-size:12px;font-weight:600;display:block;margin-bottom:5px;">Deliverable Title *</label>
                <input type="text" id="task-form-title" required placeholder="e.g. Interim Presentation / Vacuum Impeller Design" style="width:100%;">
              </div>

              <div class="form-row-2" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">
                <div class="form-group">
                  <label for="task-form-owner" style="font-size:12px;font-weight:600;display:block;margin-bottom:5px;">Student In Charge *</label>
                  <select id="task-form-owner" required style="width:100%;">
                    <option value="asuka">Asuka (A0308285Y)</option>
                    <option value="zacarias">Zacarias (A0308821B)</option>
                    <option value="hilbert">Hilbert (A0310232E)</option>
                    <option value="bryan">Bryan (A0297394E)</option>
                    <option value="gabriel">Gabriel (A0297298Y)</option>
                    <option value="all">⭐ All Members (Entire Column Merge)</option>
                  </select>
                </div>
                <div class="form-group" id="group-task-category">
                  <label for="task-form-category" style="font-size:12px;font-weight:600;display:block;margin-bottom:5px;">Subsystem / Category *</label>
                  <select id="task-form-category" required style="width:100%;"></select>
                  <div id="new-cat-inline-wrap" style="display:none;margin-top:8px;">
                    <input type="text" id="task-form-new-cat" placeholder="Enter new subsystem name..." style="width:100%;">
                  </div>
                </div>
              </div>

              <div class="form-row-2" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">
                <div class="form-group">
                  <label for="task-form-start-week" style="font-size:12px;font-weight:600;display:block;margin-bottom:5px;">Start Week *</label>
                  <select id="task-form-start-week" required style="width:100%;"></select>
                </div>
                <div class="form-group">
                  <label for="task-form-end-week" style="font-size:12px;font-weight:600;display:block;margin-bottom:5px;">End Week *</label>
                  <select id="task-form-end-week" required style="width:100%;"></select>
                </div>
              </div>

              <div class="form-row-2" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">
                <div class="form-group">
                  <label for="task-form-status" style="font-size:12px;font-weight:600;display:block;margin-bottom:5px;">Progress Status</label>
                  <select id="task-form-status" style="width:100%;">
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Planned">Planned</option>
                    <option value="Review Needed">Review Needed</option>
                  </select>
                </div>
                <div class="form-group checkbox-group" style="display:flex;flex-direction:column;gap:8px;margin-top:14px;">
                  <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12.5px;font-weight:600;color:var(--text-main);">
                    <input type="checkbox" id="task-form-milestone" style="width:16px;height:16px;accent-color:#ff453a;">
                    <span>⭐ Mark as Milestone</span>
                  </label>
                  <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12.5px;font-weight:600;color:#fca5a5;">
                    <input type="checkbox" id="task-form-all-members" style="width:16px;height:16px;accent-color:#ef4444;">
                    <span>👥 Applies to All Members (Merge Entire Column)</span>
                  </label>
                </div>
              </div>

              <div class="form-group" style="margin-bottom:10px;">
                <label for="task-form-notes" style="font-size:12px;font-weight:600;display:block;margin-bottom:5px;">Deliverable Notes &amp; Specifications (Visible on hover)</label>
                <textarea id="task-form-notes" rows="3" placeholder="Deliverable details, test metrics, component part numbers..." style="width:100%;"></textarea>
              </div>
            </form>
          </div>
          <div class="timeline-modal-footer" style="display:flex;justify-content:space-between;width:100%;align-items:center;">
            <div>
              <button class="btn btn-danger" id="btn-delete-task" style="display:none;">🗑️ Delete Task</button>
            </div>
            <div style="display:flex;gap:10px;">
              <button class="btn btn-outline" id="btn-cancel-task">Cancel</button>
              <button class="btn btn-primary" id="btn-save-task">💾 Save Deliverable</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(taskModal);

      // Populate week dropdowns in Task Modal
      const startSelect = document.getElementById('task-form-start-week');
      const endSelect = document.getElementById('task-form-end-week');
      if (startSelect && endSelect) {
        TIMELINE_WEEKS.forEach((w, idx) => {
          const curTag = w.isCurrent ? ' 📍 (Current Week)' : '';
          const opt1 = document.createElement('option');
          opt1.value = idx;
          opt1.textContent = `${w.code} (${w.startDate}) - Sem ${w.sem === 'vac' ? 'Break' : w.sem}${curTag}`;
          startSelect.appendChild(opt1);

          const opt2 = document.createElement('option');
          opt2.value = idx;
          opt2.textContent = `${w.code} (${w.endDate}) - Sem ${w.sem === 'vac' ? 'Break' : w.sem}${curTag}`;
          endSelect.appendChild(opt2);
        });
      }

      // Dynamic category population on owner change
      const ownerSelect = document.getElementById('task-form-owner');
      const allMembersCheck = document.getElementById('task-form-all-members');
      const catSelect = document.getElementById('task-form-category');
      const newCatWrap = document.getElementById('new-cat-inline-wrap');
      const newCatInput = document.getElementById('task-form-new-cat');

      if (ownerSelect) {
        ownerSelect.addEventListener('change', (e) => {
          if (e.target.value === 'all') {
            if (allMembersCheck) allMembersCheck.checked = true;
          }
          populateCategoryDropdown(e.target.value);
        });
      }

      if (allMembersCheck) {
        allMembersCheck.addEventListener('change', (e) => {
          if (e.target.checked) {
            if (ownerSelect) ownerSelect.value = 'all';
            populateCategoryDropdown('all');
          } else {
            if (ownerSelect && ownerSelect.value === 'all') ownerSelect.value = 'asuka';
            populateCategoryDropdown(ownerSelect ? ownerSelect.value : 'asuka');
          }
        });
      }

      if (catSelect) {
        catSelect.addEventListener('change', (e) => {
          if (e.target.value === '__new__') {
            if (newCatWrap) newCatWrap.style.display = 'block';
            if (newCatInput) { newCatInput.value = ''; newCatInput.focus(); }
          } else {
            if (newCatWrap) newCatWrap.style.display = 'none';
          }
        });
      }
    }

    // Inject Repo Sync Modal
    if (!document.getElementById('timeline-sync-modal')) {
      const syncModal = document.createElement('div');
      syncModal.className = 'timeline-modal-backdrop';
      syncModal.id = 'timeline-sync-modal';
      syncModal.style.display = 'none';
      syncModal.innerHTML = `
        <div class="timeline-modal-dialog">
          <div class="timeline-modal-header">
            <h3>💾 Export &amp; Sync Timeline</h3>
            <button class="modal-close-icon" id="btn-close-sync-modal">&times;</button>
          </div>
          <div class="timeline-modal-body">
            <p style="color:var(--text-main);font-size:13px;line-height:1.5;margin-bottom:14px;">
              Export your updated Gantt chart to Excel (.xlsx) or save updated JSON to commit to your GitHub repository:
            </p>
            <div style="background:#14141c;border:1px solid rgba(16,185,129,0.3);padding:14px;border-radius:10px;margin-bottom:14px;">
              <strong style="color:#6ee7b7;display:block;margin-bottom:6px;font-size:13px;">📊 Option A: Export to Excel (.xlsx)</strong>
              <p style="font-size:11.5px;color:var(--text-muted);margin-bottom:10px;">
                Generates a multi-sheet spreadsheet including the 35-week Gantt Matrix and Deliverables List.
              </p>
              <button class="btn btn-primary" id="btn-download-excel-sync" style="background:#10b981;border-color:#10b981;font-weight:700;">📊 Download CDE4301_runway_patrol_gantt.xlsx</button>
            </div>
            <div style="background:#14141c;border:1px solid rgba(255,255,255,0.1);padding:14px;border-radius:10px;margin-bottom:14px;">
              <strong style="color:#60a5fa;display:block;margin-bottom:6px;font-size:13px;">💾 Option B: Download Repo JSON</strong>
              <p style="font-size:11.5px;color:var(--text-muted);margin-bottom:10px;">
                Save this JSON file into <code>For report/Interim report-v2/js/timeline-tasks.json</code> and push to Git.
              </p>
              <button class="btn btn-primary" id="btn-download-sync-json">📥 Download timeline-tasks.json</button>
            </div>
            <div style="background:#14141c;border:1px solid rgba(255,255,255,0.1);padding:14px;border-radius:10px;">
              <strong style="color:#a78bfa;display:block;margin-bottom:6px;font-size:13px;">Git Commit &amp; Push Commands:</strong>
              <pre style="background:#09090d;padding:8px 12px;border-radius:6px;font-size:11.5px;color:#a5b4fc;margin:0;user-select:all;">git add .
git commit -m "Update team timeline and subsystems"
git push</pre>
            </div>
          </div>
          <div class="timeline-modal-footer">
            <button class="btn btn-outline" id="btn-close-sync-footer">Done</button>
          </div>
        </div>
      `;
      document.body.appendChild(syncModal);
    }

    // Inject Import Modal (Excel .xlsx + JSON)
    if (!document.getElementById('timeline-import-modal')) {
      const importModal = document.createElement('div');
      importModal.className = 'timeline-modal-backdrop';
      importModal.id = 'timeline-import-modal';
      importModal.style.display = 'none';
      importModal.innerHTML = `
        <div class="timeline-modal-dialog" style="max-width:560px;">
          <div class="timeline-modal-header">
            <h3>📥 Import Schedule (Excel .xlsx / JSON)</h3>
            <button class="modal-close-icon" id="btn-close-import-modal">&times;</button>
          </div>
          <div class="timeline-modal-body">
            <p style="color:var(--text-muted);font-size:13px;margin-bottom:14px;line-height:1.5;">
              Upload an Excel workbook (<code>.xlsx</code> / <code>.xls</code>) or a JSON backup to load deliverables:
            </p>
            <div class="form-group" style="margin-bottom:14px;">
              <label style="font-size:12px;font-weight:600;display:block;margin-bottom:6px;color:#ffffff;">Choose File (.xlsx or .json):</label>
              <input type="file" id="import-file-input" accept=".xlsx, .xls, .json" style="width:100%;font-size:12px;padding:8px;background:#181820;border:1px dashed rgba(255,255,255,0.2);border-radius:8px;color:#fff;cursor:pointer;">
              <div id="import-file-feedback" style="display:none;margin-top:8px;padding:8px 12px;border-radius:6px;font-size:12px;"></div>
            </div>
            <div class="form-group">
              <label for="import-json-textarea" style="font-size:12px;font-weight:600;display:block;margin-bottom:5px;">Or Paste JSON Data:</label>
              <textarea id="import-json-textarea" rows="4" placeholder='{"tasks": [...], "subsystems": {...}}' style="width:100%;font-family:monospace;font-size:11px;background:#101014;color:#e2e8f0;border:1px solid rgba(255,255,255,0.15);border-radius:6px;padding:8px;"></textarea>
            </div>
          </div>
          <div class="timeline-modal-footer">
            <button class="btn btn-outline" id="btn-cancel-import">Cancel</button>
            <button class="btn btn-primary" id="btn-submit-import" style="background:#10b981;border-color:#10b981;font-weight:700;">Load Schedule</button>
          </div>
        </div>
      `;
      document.body.appendChild(importModal);
    }

    // Inject Toast Notification
    if (!document.getElementById('timeline-toast')) {
      const toast = document.createElement('div');
      toast.id = 'timeline-toast';
      toast.className = 'timeline-toast';
      document.body.appendChild(toast);
    }
  }

  // ── 3. DYNAMIC CATEGORY DROPDOWN ──────────────────────────────────
  function populateCategoryDropdown(ownerCode, selectedCat = '') {
    const catSelect = document.getElementById('task-form-category');
    const newCatWrap = document.getElementById('new-cat-inline-wrap');
    if (!catSelect) return;

    catSelect.innerHTML = '';
    
    if (ownerCode === 'all' || ownerCode === 'team') {
      const opt = document.createElement('option');
      opt.value = 'Capstone Milestones';
      opt.textContent = 'Capstone Milestones (Entire Column Merge)';
      catSelect.appendChild(opt);
      if (newCatWrap) newCatWrap.style.display = 'none';
      return;
    }

    const memberSubsystems = allSubsystems[ownerCode] || [];

    if (memberSubsystems.length === 0) {
      const optNone = document.createElement('option');
      optNone.value = '';
      optNone.textContent = `(No subsystems defined yet for ${OWNERS_CONFIG[ownerCode]?.name || ownerCode})`;
      catSelect.appendChild(optNone);
    } else {
      memberSubsystems.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        if (cat === selectedCat) opt.selected = true;
        catSelect.appendChild(opt);
      });
    }

    // Option to create new subsystem
    const optNew = document.createElement('option');
    optNew.value = '__new__';
    optNew.textContent = `➕ Create New Subsystem for ${OWNERS_CONFIG[ownerCode]?.name || ownerCode}...`;
    catSelect.appendChild(optNew);

    if (selectedCat && !memberSubsystems.includes(selectedCat)) {
      const optCustom = document.createElement('option');
      optCustom.value = selectedCat;
      optCustom.textContent = selectedCat;
      optCustom.selected = true;
      catSelect.insertBefore(optCustom, optNew);
    }

    if (newCatWrap) newCatWrap.style.display = 'none';
  }

  function updatePeriodSelectOptions() {
    const select = document.getElementById('timeline-period-select');
    if (!select) return;

    if (currentMode === 'week') {
      select.innerHTML = TIMELINE_WEEKS.map((w, idx) => {
        const cur = w.isCurrent ? ' 📍 (Current Week)' : '';
        return `<option value="${idx}" ${idx === activeWeekIndex ? 'selected' : ''}>${w.code}: ${w.dateRange}${cur}</option>`;
      }).join('');
    } else {
      select.innerHTML = TIMELINE_MONTHS.map((m, idx) => {
        const cur = m.isCurrent ? ' 📍 (Current Month)' : '';
        return `<option value="${idx}" ${idx === activeMonthIndex ? 'selected' : ''}>${m.title}${cur}</option>`;
      }).join('');
    }
  }

  function showToast(msg, isSuccess = true) {
    const toast = document.getElementById('timeline-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.style.background = isSuccess ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)';
    toast.style.display = 'block';
    setTimeout(() => { toast.classList.add('visible'); }, 10);
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => { toast.style.display = 'none'; }, 300);
    }, 2800);
  }

  // ── 4. RENDER GANTT MATRIX ────────────────────────────────────────
  function renderTimeline() {
    const table = document.getElementById('gantt-table');
    if (!table) return;

    updatePeriodSelectOptions();

    if (currentMode === 'week') {
      renderSingleWeekView(table);
    } else {
      renderSingleMonthView(table);
    }

    applyFilters();
    renderRoadmapCards();
  }

  // ── SHOW BY WEEK: 7 DAYS ACROSS ──────────────────────────────────
  function renderSingleWeekView(table) {
    const currentWk = TIMELINE_WEEKS[activeWeekIndex];
    if (!currentWk) return;

    // Check if current week is an all-member milestone week
    const allMemberMilestone = allTasks.find(t => 
      (t.ownerCode === 'all' || t.isAllMembers) && 
      t.startWeekIdx <= activeWeekIndex && 
      t.endWeekIdx >= activeWeekIndex
    );

    let htmlThead = `
      <thead>
        <tr>
          <th rowspan="2" class="th-sticky-owner" style="width: 140px; min-width: 130px;">Student In Charge</th>
          <th rowspan="2" class="th-sticky-cat" style="width: 180px; min-width: 160px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span>Subsystem / Category</span>
              ${isEditMode ? '<button class="btn-th-add-sub" id="btn-th-add-sub" title="Add new subsystem">➕</button>' : ''}
            </div>
          </th>
          <th colspan="7" class="th-single-week-header ${allMemberMilestone ? 'th-milestone-red' : ''}" style="text-align: center; padding: 10px 12px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size: 13px; font-weight: 700; color: #ffffff;">
                ${allMemberMilestone ? '⭐ ' : ''}${currentWk.code} • ${currentWk.dateRange} (Semester ${currentWk.sem === 'vac' ? 'Break' : currentWk.sem})
              </span>
              ${currentWk.isCurrent ? '<span class="badge-current-week" style="margin:0;">CURRENT WEEK (TODAY: 20 SEP)</span>' : ''}
            </div>
          </th>
        </tr>
        <tr>
    `;

    currentWk.days.forEach(day => {
      const todayCls = day.isToday ? 'col-current-day' : '';
      const todayBadge = day.isToday ? '<span class="badge-today-pill">TODAY</span>' : '';

      htmlThead += `
        <th class="col-day-cell ${todayCls}" style="text-align: center; padding: 8px 6px;">
          <div class="col-day-wrap">
            ${todayBadge}
            <span class="col-day-name">${day.dayName}</span>
            <span class="col-day-date">${day.dateStr}</span>
          </div>
        </th>
      `;
    });

    htmlThead += `
        </tr>
      </thead>
    `;

    // 5 TEAM MEMBERS ONLY (NO TEAM ROW)
    const ownerOrder = ['asuka', 'zacarias', 'hilbert', 'bryan', 'gabriel'];

    // Calculate total rows across all 5 members
    let totalTableRows = 0;
    const memberRowCounts = {};
    ownerOrder.forEach(oCode => {
      let categories = allSubsystems[oCode] ? [...allSubsystems[oCode]] : [];
      allTasks.filter(t => (t.ownerCode || t.owner.toLowerCase()) === oCode).forEach(t => {
        if (!categories.includes(t.category)) categories.push(t.category);
      });
      if (categories.length === 0) categories = ['General'];
      memberRowCounts[oCode] = categories.length;
      totalTableRows += categories.length;
    });

    let htmlTbody = '<tbody>';
    let globalRowIdx = 0;

    ownerOrder.forEach(oCode => {
      const ownerCfg = OWNERS_CONFIG[oCode];
      let categories = allSubsystems[oCode] ? [...allSubsystems[oCode]] : [];
      allTasks.filter(t => (t.ownerCode || t.owner.toLowerCase()) === oCode).forEach(t => {
        if (!categories.includes(t.category)) categories.push(t.category);
      });
      if (categories.length === 0) categories = ['General'];

      categories.forEach((cat, catIdx) => {
        htmlTbody += `<tr class="gantt-row" data-owner="${oCode}" data-cat="${cat}">`;

        // Owner cell
        if (catIdx === 0) {
          htmlTbody += `
            <td rowspan="${categories.length}" class="gantt-owner-cell">
              <span class="owner-badge ${ownerCfg.badgeClass}">${ownerCfg.name}</span>
              <strong style="display:block; margin-top: 6px; font-size: 13px; color: var(--text-main);">${ownerCfg.fullName}</strong>
              ${isEditMode ? `<button class="btn-owner-add-subsystem" data-owner="${oCode}" title="Add Subsystem for ${ownerCfg.name}">➕ Subsystem</button>` : ''}
            </td>
          `;
        }

        // Category cell
        htmlTbody += `
          <td class="gantt-cat-cell">
            <div class="category-cell-content">
              <span class="category-name-text">${cat}</span>
              <div class="cat-actions-row">
                ${isEditMode ? `
                  <button class="btn-cat-action btn-cat-edit" data-owner="${oCode}" data-cat="${cat}" title="Rename subsystem">✏️</button>
                  <button class="btn-cat-action btn-cat-del" data-owner="${oCode}" data-cat="${cat}" title="Delete subsystem">🗑️</button>
                  <button class="btn-row-add-task" data-owner="${oCode}" data-cat="${cat}" title="Add deliverable to this subsystem">➕</button>
                ` : ''}
              </div>
            </div>
          </td>
        `;

        // If this week is an ALL-MEMBER MILESTONE, merge the entire column across all rows!
        if (allMemberMilestone) {
          if (globalRowIdx === 0) {
            htmlTbody += `
              <td rowspan="${totalTableRows}" colspan="7" class="col-all-members-milestone-week">
                <div class="week-all-milestone-banner" data-id="${allMemberMilestone.id}">
                  <span class="milestone-star" style="font-size:20px;">⭐</span>
                  <div>
                    <div style="font-size:15px; font-weight:800; letter-spacing:0.5px; color:#ffffff;">
                      ${escapeHtml(allMemberMilestone.title)}
                    </div>
                    <div style="font-size:12px; color:#fecaca; margin-top:4px;">
                      Entire Team Capstone Milestone • Applies to All Members
                    </div>
                  </div>
                  ${isEditMode ? `<button class="btn btn-outline" style="border-color:rgba(255,255,255,0.4);color:#fff;" onclick="window.TimelineEngine.editTask('${allMemberMilestone.id}')">✏️ Edit Milestone</button>` : ''}
                </div>
              </td>
            `;
          }
          // For all subsequent rows, the 7 day cells are skipped!
        } else {
          // Normal week: render active tasks for this member or empty day cells
          const catTasks = allTasks.filter(t => 
            (t.ownerCode || t.owner.toLowerCase()) === oCode && 
            t.category === cat
          );
          const activeTasks = catTasks.filter(t => t.startWeekIdx <= activeWeekIndex && t.endWeekIdx >= activeWeekIndex);

          if (activeTasks.length > 0) {
            htmlTbody += `<td colspan="7" class="gantt-task-cell-7day" style="padding: 6px 8px;">`;
            activeTasks.forEach(task => {
              const milestoneCls = task.isMilestone ? 'gantt-task-milestone' : '';
              const statusBadge = task.status ? `<span class="task-status-tag status-${(task.status || '').toLowerCase().replace(/\s+/g, '-')}">${task.status}</span>` : '';
              const milestoneIcon = task.isMilestone ? '⭐ ' : '';

              htmlTbody += `
                <div class="gantt-task-box gantt-week-task-bar ${ownerCfg.taskClass} ${milestoneCls} ${isEditMode ? 'editable-task' : ''}"
                     data-id="${task.id}">
                  <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                    <span class="gantt-task-text" style="font-weight:600; font-size:13.5px;">
                      ${milestoneIcon}${escapeHtml(task.title)}
                    </span>
                    <div style="display:flex; align-items:center; gap:8px;">
                      ${statusBadge}
                      <span style="font-size:11px; opacity:0.8; font-family:var(--font-mono);">${task.period}</span>
                      ${isEditMode ? '<span class="task-edit-pencil">✏️</span>' : ''}
                    </div>
                  </div>
                </div>
              `;
            });
            htmlTbody += `</td>`;
          } else {
            currentWk.days.forEach(day => {
              const todayEmptyCls = day.isToday ? 'col-current-day-empty' : '';
              htmlTbody += `<td class="gantt-cell-empty ${todayEmptyCls}" data-day="${day.dayName}" data-date="${day.dateStr}"></td>`;
            });
          }
        }

        htmlTbody += `</tr>`;
        globalRowIdx++;
      });
    });

    htmlTbody += '</tbody>';
    table.innerHTML = htmlThead + htmlTbody;

    attachCellListeners(table);
  }

  // ── SHOW BY MONTH: 1 MONTH AT A TIME (WITH MERGED COLUMNS) ────────
  function renderSingleMonthView(table) {
    const currentMo = TIMELINE_MONTHS[activeMonthIndex];
    if (!currentMo) return;

    const monthWeeks = TIMELINE_WEEKS.slice(currentMo.startWeek, currentMo.endWeek + 1);
    const sWk = monthWeeks[0].index;
    const eWk = monthWeeks[monthWeeks.length - 1].index;
    const numCols = monthWeeks.length;

    // 1. Identify all-member tasks overlapping this month
    const allMemberTasks = allTasks.filter(t => 
      (t.ownerCode === 'all' || t.isAllMembers) && 
      t.startWeekIdx <= eWk && 
      t.endWeekIdx >= sWk
    );

    const allMemberColsMap = new Map();
    allMemberTasks.forEach(t => {
      const cStart = Math.max(0, t.startWeekIdx - sWk);
      const cEnd = Math.min(numCols - 1, t.endWeekIdx - sWk);
      const span = cEnd - cStart + 1;
      for (let c = cStart; c <= cEnd; c++) {
        allMemberColsMap.set(c, {
          task: t,
          span: span,
          cStart: cStart,
          cEnd: cEnd,
          isStart: (c === cStart)
        });
      }
    });

    let htmlThead = `
      <thead>
        <tr>
          <th rowspan="2" class="th-sticky-owner" style="width: 150px; min-width: 140px;">Student In Charge</th>
          <th rowspan="2" class="th-sticky-cat" style="width: 190px; min-width: 170px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span>Subsystem / Category</span>
              ${isEditMode ? '<button class="btn-th-add-sub" id="btn-th-add-sub" title="Add new subsystem">➕</button>' : ''}
            </div>
          </th>
          <th colspan="${numCols}" class="th-single-week-header" style="background: rgba(99, 102, 241, 0.15); color: #c7d2fe; text-align: center; border-bottom: 2px solid #6366f1; padding: 10px 12px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size: 14px; font-weight: 700; color: #ffffff;">
                ${currentMo.title}
              </span>
              ${currentMo.isCurrent ? '<span class="badge-current-week" style="margin:0;">CURRENT MONTH</span>' : ''}
            </div>
          </th>
        </tr>
        <tr>
    `;

    monthWeeks.forEach((w, colIdx) => {
      const isCur = w.isCurrent ? 'col-current-week' : '';
      const curBadge = w.isCurrent ? '<span class="badge-current-week">TODAY</span>' : '';
      const isMilestoneCol = allMemberColsMap.has(colIdx);
      const milestoneHdrCls = isMilestoneCol ? 'th-milestone-red' : '';

      htmlThead += `
        <th class="col-month-week-hdr ${isCur} ${milestoneHdrCls}" style="text-align: center; padding: 8px 6px;">
          <div class="col-wk-wrap">
            ${curBadge}
            <span class="col-wk-code" style="font-size:12px; font-weight:700;">${w.code}</span>
            <span class="col-wk-date" style="font-size:10px;">${w.dateRange}</span>
          </div>
        </th>
      `;
    });

    htmlThead += `
        </tr>
      </thead>
    `;

    // 5 TEAM MEMBERS ONLY (NO TEAM ROW)
    const ownerOrder = ['asuka', 'zacarias', 'hilbert', 'bryan', 'gabriel'];

    // Pre-calculate lanes for each category to compute accurate rowspans
    const catLanesMap = [];
    let totalTableRows = 0;

    ownerOrder.forEach(oCode => {
      let categories = allSubsystems[oCode] ? [...allSubsystems[oCode]] : [];
      allTasks.filter(t => (t.ownerCode || t.owner.toLowerCase()) === oCode).forEach(t => {
        if (!categories.includes(t.category)) categories.push(t.category);
      });
      if (categories.length === 0) categories = ['General'];

      let ownerRows = 0;
      const catInfos = [];

      categories.forEach(cat => {
        const catTasks = allTasks.filter(t => 
          (t.ownerCode || t.owner.toLowerCase()) === oCode && 
          t.category === cat
        );

        // Find tasks that overlap with this month
        const overlapping = [];
        catTasks.forEach(t => {
          if (t.startWeekIdx <= eWk && t.endWeekIdx >= sWk) {
            const cStart = Math.max(0, t.startWeekIdx - sWk);
            const cEnd = Math.min(numCols - 1, t.endWeekIdx - sWk);
            overlapping.push({
              task: t,
              cStart: cStart,
              cEnd: cEnd,
              span: cEnd - cStart + 1
            });
          }
        });

        // Pack into non-overlapping lanes
        overlapping.sort((a, b) => a.cStart - b.cStart || b.span - a.span);
        const lanes = [];
        overlapping.forEach(item => {
          let placed = false;
          for (let l of lanes) {
            if (l[l.length - 1].cEnd < item.cStart) {
              l.push(item);
              placed = true;
              break;
            }
          }
          if (!placed) lanes.push([item]);
        });

        const numLanes = Math.max(1, lanes.length);
        catInfos.push({ cat, lanes, numLanes });
        ownerRows += numLanes;
      });

      catLanesMap.push({
        ownerCode: oCode,
        ownerRows: ownerRows,
        categories: catInfos
      });
      totalTableRows += ownerRows;
    });

    let htmlTbody = '<tbody>';
    let globalRowIdx = 0;

    catLanesMap.forEach(ownerBlock => {
      const { ownerCode, ownerRows, categories } = ownerBlock;
      const ownerCfg = OWNERS_CONFIG[ownerCode];
      let ownerRendered = false;

      categories.forEach(catInfo => {
        const { cat, lanes, numLanes } = catInfo;

        for (let laneIdx = 0; laneIdx < numLanes; laneIdx++) {
          htmlTbody += `<tr class="gantt-row" data-owner="${ownerCode}" data-cat="${cat}">`;

          // Owner cell (spans all rows for this member)
          if (!ownerRendered) {
            htmlTbody += `
              <td rowspan="${ownerRows}" class="gantt-owner-cell">
                <span class="owner-badge ${ownerCfg.badgeClass}">${ownerCfg.name}</span>
                <strong style="display:block; margin-top: 6px; font-size: 14px; color: var(--text-main);">${ownerCfg.fullName}</strong>
                ${isEditMode ? `<button class="btn-owner-add-subsystem" data-owner="${ownerCode}" title="Add Subsystem for ${ownerCfg.name}">➕ Subsystem</button>` : ''}
              </td>
            `;
            ownerRendered = true;
          }

          // Category cell (spans all lane rows for this category)
          if (laneIdx === 0) {
            htmlTbody += `
              <td rowspan="${numLanes}" class="gantt-cat-cell">
                <div class="category-cell-content">
                  <span class="category-name-text">${cat}</span>
                  <div class="cat-actions-row">
                    ${isEditMode ? `
                      <button class="btn-cat-action btn-cat-edit" data-owner="${ownerCode}" data-cat="${cat}" title="Rename subsystem">✏️</button>
                      <button class="btn-cat-action btn-cat-del" data-owner="${ownerCode}" data-cat="${cat}" title="Delete subsystem">🗑️</button>
                      <button class="btn-row-add-task" data-owner="${ownerCode}" data-cat="${cat}" title="Add deliverable to this subsystem">➕</button>
                    ` : ''}
                  </div>
                </div>
              </td>
            `;
          }

          // Render columns across the month
          const lane = lanes[laneIdx] || [];
          let currCol = 0;

          while (currCol < numCols) {
            // Check if currCol is part of an all-member milestone column
            if (allMemberColsMap.has(currCol)) {
              const info = allMemberColsMap.get(currCol);
              if (globalRowIdx === 0 && info.isStart) {
                // Merged all-member column spanning entire table height!
                const task = info.task;
                htmlTbody += `
                  <td rowspan="${totalTableRows}" colspan="${info.span}" class="col-all-members-milestone" data-id="${task.id}" title="${escapeHtml(task.title)}">
                    <div class="milestone-vertical-content">
                      <span class="milestone-vert-star">⭐</span>
                      <span class="milestone-vert-title">${escapeHtml(task.title)}</span>
                    </div>
                  </td>
                `;
              }
              // Skip past all-member milestone column on all subsequent rows
              currCol = info.cEnd + 1;
              continue;
            }

            // Normal member column: find next all-member boundary
            let nextMilestoneStart = numCols;
            for (let [colKey, colInfo] of allMemberColsMap) {
              if (colInfo.isStart && colKey > currCol && colKey < nextMilestoneStart) {
                nextMilestoneStart = colKey;
              }
            }

            // Find next task in this lane before nextMilestoneStart
            const nextItem = lane.find(it => it.cStart >= currCol && it.cStart < nextMilestoneStart);

            if (nextItem) {
              if (nextItem.cStart > currCol) {
                const emptySpan = nextItem.cStart - currCol;
                htmlTbody += `<td colspan="${emptySpan}" class="gantt-cell-empty"></td>`;
              }

              // Merged task cell across its duration
              const task = nextItem.task;
              const milestoneCls = task.isMilestone ? 'gantt-task-milestone' : '';
              const milestoneIcon = task.isMilestone ? '⭐ ' : '';
              const statusBadge = task.status ? `<span class="task-status-tag status-${task.status.toLowerCase().replace(/\s+/g, '-')}">${task.status}</span>` : '';

              htmlTbody += `
                <td colspan="${nextItem.span}" class="gantt-task-cell-merged">
                  <div class="gantt-task-box gantt-month-task-bar ${ownerCfg.taskClass} ${milestoneCls} ${isEditMode ? 'editable-task' : ''}"
                       data-id="${task.id}">
                    <span class="gantt-task-text" style="font-weight:600; font-size:12.5px; line-height:1.35;">
                      ${milestoneIcon}${escapeHtml(task.title)}
                    </span>
                    <div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
                      ${statusBadge}
                      <span style="font-size:11px; opacity:0.8; font-family:var(--font-mono);">${task.period}</span>
                      ${isEditMode ? '<span class="task-edit-pencil">✏️</span>' : ''}
                    </div>
                  </div>
                </td>
              `;
              currCol = nextItem.cEnd + 1;
            } else {
              // Empty space until next milestone or end of month
              const emptySpan = nextMilestoneStart - currCol;
              if (emptySpan > 0) {
                htmlTbody += `<td colspan="${emptySpan}" class="gantt-cell-empty"></td>`;
                currCol = nextMilestoneStart;
              } else {
                currCol++;
              }
            }
          }

          htmlTbody += `</tr>`;
          globalRowIdx++;
        }
      });
    });

    htmlTbody += '</tbody>';
    table.innerHTML = htmlThead + htmlTbody;

    attachCellListeners(table);
  }

  // ── 5. CELL LISTENERS & HOVER NOTES TOOLTIP ───────────────────────
  function attachCellListeners(table) {
    const tooltip = document.getElementById('gantt-task-tooltip');

    table.querySelectorAll('.gantt-task-box, .col-all-members-milestone, .week-all-milestone-banner').forEach(box => {
      const taskId = box.getAttribute('data-id');

      // Hover Tooltip: Active when Edit Mode is deactivated
      box.addEventListener('mouseenter', (e) => {
        if (isEditMode || !tooltip) return;

        const task = allTasks.find(t => t.id === taskId);
        if (!task) return;

        const ownerCfg = OWNERS_CONFIG[task.ownerCode] || OWNERS_CONFIG['all'];
        const notesHtml = task.notes && task.notes.trim()
          ? `<div class="tooltip-notes-text">${escapeHtml(task.notes)}</div>`
          : `<div class="tooltip-notes-empty">No member notes recorded for this deliverable.</div>`;

        const milestoneBadge = task.isMilestone ? '<span class="tooltip-badge-milestone">⭐ Milestone</span>' : '';
        const allMembersBadge = (task.ownerCode === 'all' || task.isAllMembers) ? '<span class="tooltip-badge-all">👥 All Members</span>' : '';
        const statusBadge = task.status ? `<span class="task-status-tag status-${task.status.toLowerCase().replace(/\s+/g, '-')}">${task.status}</span>` : '';

        tooltip.innerHTML = `
          <div class="tooltip-header">
            <div class="tooltip-title">${escapeHtml(task.title)}</div>
            <div class="tooltip-tags">${allMembersBadge} ${milestoneBadge} ${statusBadge}</div>
          </div>
          <div class="tooltip-meta">
            <span class="tooltip-pill ${ownerCfg.badgeClass}">👤 ${ownerCfg.fullName}</span>
            <span class="tooltip-pill badge-outline">🧩 ${escapeHtml(task.category)}</span>
            <span class="tooltip-pill badge-outline">⏱️ ${task.period}</span>
          </div>
          <div class="tooltip-notes-box">
            <div class="tooltip-notes-label">📝 Member Notes & Specifications:</div>
            ${notesHtml}
          </div>
        `;

        positionTooltip(e);
        tooltip.style.display = 'block';
      });

      box.addEventListener('mousemove', (e) => {
        if (isEditMode || !tooltip || tooltip.style.display === 'none') return;
        positionTooltip(e);
      });

      box.addEventListener('mouseleave', () => {
        if (tooltip) tooltip.style.display = 'none';
      });

      box.addEventListener('click', () => {
        if (tooltip) tooltip.style.display = 'none';
        if (isEditMode) {
          openTaskModalForEdit(taskId);
        } else {
          const found = allTasks.find(t => t.id === taskId);
          if (found) openDetailModal(found);
        }
      });
    });

    function positionTooltip(e) {
      if (!tooltip) return;
      const xOffset = 15;
      const yOffset = 15;
      let left = e.clientX + xOffset;
      let top = e.clientY + yOffset;

      const tipRect = tooltip.getBoundingClientRect();
      if (left + 360 > window.innerWidth) {
        left = e.clientX - 370;
      }
      if (top + 220 > window.innerHeight) {
        top = e.clientY - tipRect.height - 10;
      }
      if (left < 10) left = 10;
      if (top < 10) top = 10;

      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
    }

    // Subsystem Add Task button
    table.querySelectorAll('.btn-row-add-task').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const owner = btn.getAttribute('data-owner');
        const cat = btn.getAttribute('data-cat');
        openTaskModalForAdd(owner, cat);
      });
    });

    // Subsystem Rename button
    table.querySelectorAll('.btn-cat-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const owner = btn.getAttribute('data-owner');
        const oldCat = btn.getAttribute('data-cat');
        renameSubsystem(owner, oldCat);
      });
    });

    // Subsystem Delete button
    table.querySelectorAll('.btn-cat-del').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const owner = btn.getAttribute('data-owner');
        const cat = btn.getAttribute('data-cat');
        deleteSubsystem(owner, cat);
      });
    });

    // Owner "➕ Subsystem" button
    table.querySelectorAll('.btn-owner-add-subsystem').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const owner = btn.getAttribute('data-owner');
        openSubsystemModal(owner);
      });
    });

    // Header "➕ Subsystem" button
    const btnThAddSub = document.getElementById('btn-th-add-sub');
    if (btnThAddSub) {
      btnThAddSub.addEventListener('click', () => openSubsystemModal('asuka'));
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function openDetailModal(task) {
    const modal = document.getElementById('task-detail-modal');
    if (!modal) return;
    const modalTitle = document.getElementById('modal-task-title');
    const modalOwner = document.getElementById('modal-task-owner');
    const modalNotes = document.getElementById('modal-task-notes');
    if (modalTitle) modalTitle.textContent = task.title;
    if (modalOwner) modalOwner.textContent = `Owner: ${task.owner} • Period: ${task.period} (${task.status || 'In Progress'})`;
    if (modalNotes) modalNotes.textContent = task.notes || 'No notes specified.';
    modal.classList.add('open');
  }

  // ── 6. SUBSYSTEM MANAGEMENT FUNCTIONS ────────────────────────────
  function openSubsystemModal(defaultOwner = 'asuka') {
    const modal = document.getElementById('timeline-subsystem-modal');
    const select = document.getElementById('subsystem-member-select');
    const input = document.getElementById('subsystem-name-input');
    if (select) select.value = defaultOwner;
    if (input) input.value = '';
    if (modal) {
      modal.style.display = 'flex';
      setTimeout(() => { if (input) input.focus(); }, 50);
    }
  }

  function closeSubsystemModal() {
    const modal = document.getElementById('timeline-subsystem-modal');
    if (modal) modal.style.display = 'none';
  }

  function submitNewSubsystem() {
    const select = document.getElementById('subsystem-member-select');
    const input = document.getElementById('subsystem-name-input');
    const ownerCode = (select ? select.value : 'asuka').toLowerCase();
    const newName = (input ? input.value : '').trim();

    if (!newName) {
      alert('Please enter a subsystem name.');
      return;
    }

    if (!allSubsystems[ownerCode]) allSubsystems[ownerCode] = [];

    if (allSubsystems[ownerCode].includes(newName)) {
      alert(`Subsystem "${newName}" already exists for this member.`);
      return;
    }

    allSubsystems[ownerCode].push(newName);
    saveSubsystems();
    closeSubsystemModal();
    renderTimeline();
    showToast(`✓ Subsystem "${newName}" created successfully!`);
  }

  function renameSubsystem(ownerCode, oldName) {
    const newName = prompt(`Enter new name for subsystem:\n"${oldName}"`, oldName);
    if (!newName || newName.trim() === '' || newName.trim() === oldName) return;

    const trimmed = newName.trim();
    if (!allSubsystems[ownerCode]) allSubsystems[ownerCode] = [];

    const idx = allSubsystems[ownerCode].indexOf(oldName);
    if (idx !== -1) {
      allSubsystems[ownerCode][idx] = trimmed;
    } else {
      allSubsystems[ownerCode].push(trimmed);
    }

    allTasks.forEach(t => {
      const o = t.ownerCode || (t.owner ? t.owner.toLowerCase() : 'asuka');
      if (o === ownerCode && t.category === oldName) {
        t.category = trimmed;
      }
    });

    saveSubsystems();
    saveTasks();
    renderTimeline();
    showToast(`✓ Subsystem renamed to "${trimmed}".`);
  }

  function deleteSubsystem(ownerCode, catName) {
    const tasksCount = allTasks.filter(t => 
      (t.ownerCode || t.owner.toLowerCase()) === ownerCode && 
      t.category === catName
    ).length;

    const confirmMsg = tasksCount > 0
      ? `Are you sure you want to delete subsystem:\n"${catName}"\nand all ${tasksCount} deliverable(s) under it?`
      : `Delete empty subsystem "${catName}"?`;

    if (confirm(confirmMsg)) {
      if (allSubsystems[ownerCode]) {
        allSubsystems[ownerCode] = allSubsystems[ownerCode].filter(c => c !== catName);
      }
      allTasks = allTasks.filter(t => 
        !((t.ownerCode || t.owner.toLowerCase()) === ownerCode && t.category === catName)
      );

      saveSubsystems();
      saveTasks();
      renderTimeline();
      showToast(`🗑️ Subsystem "${catName}" deleted.`, false);
    }
  }

  // ── 7. ROADMAP CARDS SYNC ────────────────────────────────────────
  function renderRoadmapCards() {
    const container = document.getElementById('view-container-cards');
    if (!container) return;

    const ownerOrder = ['asuka', 'zacarias', 'hilbert', 'bryan', 'gabriel'];
    ownerOrder.forEach(oCode => {
      const block = container.querySelector(`.gantt-card-block[data-owner="${oCode}"]`);
      if (!block) return;

      const itemsContainer = block.querySelector('div[style*="flex-direction: column"]');
      if (!itemsContainer) return;

      const memberTasks = allTasks.filter(t => (t.ownerCode || t.owner.toLowerCase()) === oCode);

      let itemsHtml = '';
      memberTasks.forEach(task => {
        const isS1 = task.endWeekIdx <= 13;
        const isS2 = task.startWeekIdx >= 21;
        const milestoneBadge = task.isMilestone ? '<span style="color:#ff453a;margin-left:6px;">⭐ Milestone</span>' : '';
        const editClick = isEditMode ? `onclick="window.TimelineEngine.editTask('${task.id}')" style="cursor:pointer;"` : '';

        itemsHtml += `
          <div class="gantt-task-item" data-id="${task.id}" data-sem1="${isS1}" data-sem2="${isS2}" ${editClick}
               style="background: var(--bg-hover); padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border-color); margin-bottom:8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-size: 11px; font-weight: 700; color: var(--accent-purple); text-transform: uppercase;">
                ${task.category} ${milestoneBadge}
              </span>
              <span style="font-size: 10.5px; font-family: var(--font-mono); color: var(--text-muted);">${task.period}</span>
            </div>
            <div style="font-size: 12.5px; font-weight: 600; color: var(--text-main);">${task.title}</div>
          </div>
        `;
      });

      itemsContainer.innerHTML = itemsHtml;
    });
  }

  // ── 8. FILTERING & SEARCH ─────────────────────────────────────────
  function applyFilters() {
    const table = document.getElementById('gantt-table');
    if (!table) return;

    table.querySelectorAll('tbody tr').forEach(tr => {
      const rowOwner = (tr.getAttribute('data-owner') || '').toLowerCase();
      const rowCat = (tr.getAttribute('data-cat') || '').toLowerCase();
      const rowText = tr.textContent.toLowerCase();

      const ownerMatch = currentOwnerFilter === 'all' || rowOwner === currentOwnerFilter.toLowerCase();
      const searchMatch = !searchQuery.trim() || rowText.includes(searchQuery.toLowerCase());

      tr.classList.toggle('gantt-row-hidden', !(ownerMatch && searchMatch));
    });

    document.querySelectorAll('.gantt-card-block').forEach(block => {
      const blockOwner = (block.getAttribute('data-owner') || '').toLowerCase();
      const ownerOk = currentOwnerFilter === 'all' || blockOwner === currentOwnerFilter.toLowerCase();
      let hasVisible = false;

      block.querySelectorAll('.gantt-task-item').forEach(item => {
        const search = !searchQuery.trim() || item.textContent.toLowerCase().includes(searchQuery.toLowerCase());
        item.style.display = search ? 'block' : 'none';
        if (search) hasVisible = true;
      });

      block.style.display = ownerOk && hasVisible ? 'block' : 'none';
    });
  }

  // ── 9. NAVIGATION ARROWS ─────────────────────────────────────────
  function navigatePrevious() {
    if (currentMode === 'week') {
      if (activeWeekIndex > 0) {
        activeWeekIndex--;
        renderTimeline();
      } else {
        showToast('Already at the start of Semester 1 (Wk 1).');
      }
    } else {
      if (activeMonthIndex > 0) {
        activeMonthIndex--;
        renderTimeline();
      } else {
        showToast('Already at the first month (August 2026).');
      }
    }
  }

  function navigateNext() {
    if (currentMode === 'week') {
      if (activeWeekIndex < TIMELINE_WEEKS.length - 1) {
        activeWeekIndex++;
        renderTimeline();
      } else {
        showToast('Already at the final week of Semester 2.');
      }
    } else {
      if (activeMonthIndex < TIMELINE_MONTHS.length - 1) {
        activeMonthIndex++;
        renderTimeline();
      } else {
        showToast('Already at the final month (April 2027).');
      }
    }
  }

  function jumpToToday() {
    activeWeekIndex = 5; // S1 Wk6 (14-20 Sep 2026)
    activeMonthIndex = 1; // September 2026
    renderTimeline();
    showToast('📍 Jumped to Today: 20 September 2026 (S1 Wk6)');
  }

  // ── 10. VIEW MODE TOGGLE ──────────────────────────────────────────
  function setViewMode(mode) {
    if (currentMode === mode) return;
    currentMode = mode;

    const btnWeek = document.getElementById('btn-toggle-week');
    const btnMonth = document.getElementById('btn-toggle-month');

    if (mode === 'week') {
      btnWeek.classList.add('active');
      btnMonth.classList.remove('active');
    } else {
      btnMonth.classList.add('active');
      btnWeek.classList.remove('active');
    }

    renderTimeline();
  }

  // ── 11. EDIT MODE & SECURITY ──────────────────────────────────────
  function toggleEditMode() {
    if (isEditMode) {
      deactivateEditMode();
    } else {
      if (isAuthenticated()) {
        activateEditMode();
      } else {
        openPasswordModal();
      }
    }
  }

  function activateEditMode() {
    isEditMode = true;
    const btnLabel = document.getElementById('edit-btn-label');
    const lockIcon = document.getElementById('edit-lock-icon');
    const btnAdd = document.getElementById('btn-add-new-task');
    const btnAddSubTop = document.getElementById('btn-add-subsystem-top');
    const extraActions = document.getElementById('timeline-extra-actions');
    const editBanner = document.getElementById('timeline-edit-banner');

    if (btnLabel) btnLabel.textContent = 'Lock Editing';
    if (lockIcon) lockIcon.textContent = '🔓';
    if (btnAdd) btnAdd.style.display = 'inline-flex';
    if (btnAddSubTop) btnAddSubTop.style.display = 'inline-flex';
    if (extraActions) extraActions.style.display = 'inline-flex';
    if (editBanner) editBanner.style.display = 'flex';

    renderTimeline();
    showToast('🔓 Edit Mode Unlocked. You can now add deliverables and manage subsystems.');
  }

  function deactivateEditMode() {
    isEditMode = false;
    const btnLabel = document.getElementById('edit-btn-label');
    const lockIcon = document.getElementById('edit-lock-icon');
    const btnAdd = document.getElementById('btn-add-new-task');
    const btnAddSubTop = document.getElementById('btn-add-subsystem-top');
    const extraActions = document.getElementById('timeline-extra-actions');
    const editBanner = document.getElementById('timeline-edit-banner');

    if (btnLabel) btnLabel.textContent = 'Edit Timeline';
    if (lockIcon) lockIcon.textContent = '🔒';
    if (btnAdd) btnAdd.style.display = 'none';
    if (btnAddSubTop) btnAddSubTop.style.display = 'none';
    if (extraActions) extraActions.style.display = 'none';
    if (editBanner) editBanner.style.display = 'none';

    renderTimeline();
    showToast('🔒 Edit Mode Closed.');
  }

  function openPasswordModal() {
    const modal = document.getElementById('timeline-password-modal');
    const input = document.getElementById('timeline-pwd-input');
    const errMsg = document.getElementById('pwd-error-msg');
    if (!modal) return;
    if (input) { input.value = ''; input.type = 'password'; }
    if (errMsg) errMsg.style.display = 'none';
    modal.style.display = 'flex';
    setTimeout(() => { if (input) input.focus(); }, 50);
  }

  function closePasswordModal() {
    const modal = document.getElementById('timeline-password-modal');
    if (modal) modal.style.display = 'none';
  }

  function checkPassword() {
    const input = document.getElementById('timeline-pwd-input');
    const errMsg = document.getElementById('pwd-error-msg');
    const entered = (input ? input.value : '').trim().toLowerCase();

    if (VALID_PASSCODES.includes(entered)) {
      setAuthenticated(true);
      closePasswordModal();
      activateEditMode();
    } else {
      if (errMsg) errMsg.style.display = 'block';
      if (input) {
        input.classList.add('input-shake');
        setTimeout(() => input.classList.remove('input-shake'), 400);
      }
    }
  }

  // ── 12. TASK MANAGEMENT ──────────────────────────────────────────
  function openTaskModalForAdd(defaultOwner = 'asuka', defaultCat = '') {
    activeEditingTaskId = null;
    const modal = document.getElementById('timeline-task-modal');
    const heading = document.getElementById('task-modal-heading');
    const btnDelete = document.getElementById('btn-delete-task');
    const titleInput = document.getElementById('task-form-title');
    const ownerSelect = document.getElementById('task-form-owner');
    const startSelect = document.getElementById('task-form-start-week');
    const endSelect = document.getElementById('task-form-end-week');
    const statusSelect = document.getElementById('task-form-status');
    const milestoneCheck = document.getElementById('task-form-milestone');
    const allMembersCheck = document.getElementById('task-form-all-members');
    const notesInput = document.getElementById('task-form-notes');

    if (heading) heading.textContent = '➕ Add New Capstone Deliverable';
    if (btnDelete) btnDelete.style.display = 'none';
    if (titleInput) titleInput.value = '';
    if (ownerSelect) ownerSelect.value = defaultOwner;
    if (allMembersCheck) allMembersCheck.checked = (defaultOwner === 'all');
    populateCategoryDropdown(defaultOwner, defaultCat);
    if (startSelect) startSelect.value = activeWeekIndex;
    if (endSelect) endSelect.value = activeWeekIndex;
    if (statusSelect) statusSelect.value = 'In Progress';
    if (milestoneCheck) milestoneCheck.checked = (defaultOwner === 'all');
    if (notesInput) notesInput.value = '';

    if (modal) {
      modal.style.display = 'flex';
      setTimeout(() => { if (titleInput) titleInput.focus(); }, 50);
    }
  }

  function openTaskModalForEdit(taskId) {
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;

    activeEditingTaskId = taskId;
    const modal = document.getElementById('timeline-task-modal');
    const heading = document.getElementById('task-modal-heading');
    const btnDelete = document.getElementById('btn-delete-task');
    const titleInput = document.getElementById('task-form-title');
    const ownerSelect = document.getElementById('task-form-owner');
    const startSelect = document.getElementById('task-form-start-week');
    const endSelect = document.getElementById('task-form-end-week');
    const statusSelect = document.getElementById('task-form-status');
    const milestoneCheck = document.getElementById('task-form-milestone');
    const allMembersCheck = document.getElementById('task-form-all-members');
    const notesInput = document.getElementById('task-form-notes');

    const isAll = (task.ownerCode === 'all' || task.isAllMembers);
    const oCode = isAll ? 'all' : (task.ownerCode || 'asuka');

    if (heading) heading.textContent = `✏️ Edit Deliverable: ${task.title}`;
    if (btnDelete) btnDelete.style.display = 'inline-block';
    if (titleInput) titleInput.value = task.title;
    if (ownerSelect) ownerSelect.value = oCode;
    if (allMembersCheck) allMembersCheck.checked = isAll;
    populateCategoryDropdown(oCode, task.category);
    if (startSelect) startSelect.value = task.startWeekIdx;
    if (endSelect) endSelect.value = task.endWeekIdx;
    if (statusSelect) statusSelect.value = task.status || 'In Progress';
    if (milestoneCheck) milestoneCheck.checked = !!task.isMilestone;
    if (notesInput) notesInput.value = task.notes || '';

    if (modal) modal.style.display = 'flex';
  }

  function closeTaskModal() {
    const modal = document.getElementById('timeline-task-modal');
    if (modal) modal.style.display = 'none';
  }

  function saveTaskFromModal() {
    const title = (document.getElementById('task-form-title').value || '').trim();
    let ownerCode = document.getElementById('task-form-owner').value;
    const allMembersChecked = document.getElementById('task-form-all-members').checked;

    if (allMembersChecked) {
      ownerCode = 'all';
    }

    const catSelect = document.getElementById('task-form-category');
    let cat = catSelect ? catSelect.value : '';

    if (ownerCode === 'all') {
      cat = 'Capstone Milestones';
    } else if (cat === '__new__') {
      const newCatInput = document.getElementById('task-form-new-cat');
      cat = newCatInput ? newCatInput.value.trim() : '';
    }

    const startIdx = parseInt(document.getElementById('task-form-start-week').value, 10);
    const endIdx = parseInt(document.getElementById('task-form-end-week').value, 10);
    const status = document.getElementById('task-form-status').value;
    const isMilestone = document.getElementById('task-form-milestone').checked || allMembersChecked;
    const notes = (document.getElementById('task-form-notes').value || '').trim();

    if (!title) {
      alert('Please enter a deliverable title.');
      return;
    }
    if (!cat) {
      alert('Please specify a subsystem or category.');
      return;
    }
    if (startIdx > endIdx) {
      alert('Start week cannot be later than End week.');
      return;
    }

    if (ownerCode !== 'all') {
      if (!allSubsystems[ownerCode]) allSubsystems[ownerCode] = [];
      if (!allSubsystems[ownerCode].includes(cat)) {
        allSubsystems[ownerCode].push(cat);
        saveSubsystems();
      }
    }

    const startWk = TIMELINE_WEEKS[startIdx];
    const endWk = TIMELINE_WEEKS[endIdx];
    const periodStr = startIdx === endIdx ? startWk.code : `${startWk.code} - ${endWk.code}`;
    const ownerCfg = OWNERS_CONFIG[ownerCode] || OWNERS_CONFIG['all'];
    const sem = endIdx <= 13 ? '1' : (endIdx <= 20 ? 'vac' : '2');

    if (activeEditingTaskId) {
      const task = allTasks.find(t => t.id === activeEditingTaskId);
      if (task) {
        task.title = title;
        task.owner = ownerCfg.name;
        task.ownerCode = ownerCode;
        task.isAllMembers = (ownerCode === 'all');
        task.category = cat;
        task.startWeekIdx = startIdx;
        task.endWeekIdx = endIdx;
        task.period = periodStr;
        task.semester = sem;
        task.isMilestone = isMilestone;
        task.status = status;
        task.notes = notes;
      }
      showToast('✓ Deliverable updated successfully.');
    } else {
      const newId = `task-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 100)}`;
      allTasks.push({
        id: newId,
        owner: ownerCfg.name,
        ownerCode: ownerCode,
        isAllMembers: (ownerCode === 'all'),
        category: cat,
        title: title,
        period: periodStr,
        startWeekIdx: startIdx,
        endWeekIdx: endIdx,
        semester: sem,
        isMilestone: isMilestone,
        status: status,
        notes: notes
      });
      showToast('✓ New deliverable added.');
    }

    saveTasks();
    closeTaskModal();
    renderTimeline();
  }

  function deleteTaskFromModal() {
    if (!activeEditingTaskId) return;
    const task = allTasks.find(t => t.id === activeEditingTaskId);
    if (!task) return;

    if (confirm(`Are you sure you want to delete deliverable:\n"${task.title}"?`)) {
      allTasks = allTasks.filter(t => t.id !== activeEditingTaskId);
      saveTasks();
      closeTaskModal();
      renderTimeline();
      showToast('🗑️ Deliverable removed.', false);
    }
  }

  // ── 13. EXCEL EXPORT & IMPORT & REPO SYNC ──────────────────────────
  function openSyncModal() {
    const modal = document.getElementById('timeline-sync-modal');
    if (modal) modal.style.display = 'flex';
  }

  function closeSyncModal() {
    const modal = document.getElementById('timeline-sync-modal');
    if (modal) modal.style.display = 'none';
  }

  function downloadSyncJSON() {
    const exportData = {
      tasks: allTasks,
      subsystems: allSubsystems,
      exportedAt: new Date().toISOString()
    };
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'timeline-tasks.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('💾 Downloaded timeline-tasks.json. Save it to your repo folder and push to Git!');
  }

  // EXCEL EXPORT
  function exportToExcel() {
    if (typeof XLSX === 'undefined') {
      alert('Excel export engine (SheetJS) is loading. Please try again in a moment.');
      return;
    }

    try {
      const WEEKS_COUNT = 35;
      const WEEK_CODES = [
        'Sem 1 W1', 'Sem 1 W2', 'Sem 1 W3', 'Sem 1 W4', 'Sem 1 W5', 'Sem 1 W6', 'SEM 1 RECESS WEEK',
        'Sem 1 W7', 'Sem 1 W8', 'Sem 1 W9', 'Sem 1 W10', 'Sem 1 W11', 'Sem 1 W12', 'Sem 1 W13',
        'READING WEEK', 'EXAM WEEK 1', 'EXAM WEEK 2',
        'VACATION WEEK 1', 'VACATION WEEK 2', 'VACATION WEEK 3', 'VACATION WEEK 4',
        'Sem 2 W1', 'Sem 2 W2', 'Sem 2 W3', 'Sem 2 W4', 'Sem 2 W5', 'Sem 2 W6', 'Sem 2 Recess Week',
        'Sem 2 W7', 'Sem 2 W8', 'Sem 2 W9', 'Sem 2 W10', 'Sem 2 W11', 'Sem 2 W12', 'Sem 2 W13'
      ];

      const ownerOrder = ['asuka', 'zacarias', 'hilbert', 'bryan', 'gabriel'];
      const ownerNames = {
        asuka: 'Asuka',
        zacarias: 'Zac',
        hilbert: 'Hilbert',
        bryan: 'Bryan',
        gabriel: 'Gabriel'
      };

      // 1. Build Deliverables List Sheet (Clean tabular view for easy editing)
      const listHeaders = ['ID', 'Owner', 'Owner Code', 'Subsystem', 'Title', 'Period', 'Start Week', 'End Week', 'Semester', 'Status', 'Is Milestone', 'Is All Members', 'Notes'];
      const listRows = [listHeaders];
      allTasks.forEach(t => {
        listRows.push([
          t.id || '',
          t.owner || '',
          t.ownerCode || '',
          t.category || '',
          t.title || '',
          t.period || '',
          (t.startWeekIdx != null ? t.startWeekIdx : ''),
          (t.endWeekIdx != null ? t.endWeekIdx : ''),
          t.semester || '',
          t.status || 'In Progress',
          t.isMilestone ? 'YES' : 'NO',
          t.isAllMembers ? 'YES' : 'NO',
          t.notes || ''
        ]);
      });

      const wsList = XLSX.utils.aoa_to_sheet(listRows);

      // Set column widths for Deliverables List
      wsList['!cols'] = [
        { wch: 12 }, // ID
        { wch: 14 }, // Owner
        { wch: 12 }, // Owner Code
        { wch: 28 }, // Subsystem
        { wch: 42 }, // Title
        { wch: 20 }, // Period
        { wch: 12 }, // Start Week
        { wch: 12 }, // End Week
        { wch: 10 }, // Semester
        { wch: 14 }, // Status
        { wch: 14 }, // Is Milestone
        { wch: 14 }, // Is All Members
        { wch: 60 }  // Notes
      ];

      // 2. Build Gantt Chart Matrix Sheet
      const matrixRows = [];
      for (let r = 0; r < 5; r++) matrixRows.push([]);
      matrixRows[1][1] = 'CDE4301 Capstone Year-Long Gantt Chart & Workflow';
      matrixRows[2][1] = 'Chronological tracking of task progress across Semester 1 and Semester 2 (August 2026 - April 2027)';

      const headerRow = ['', 'Student In Charge', 'Remarks / Subsystem', ...WEEK_CODES];
      matrixRows[4] = headerRow;

      const merges = [];
      let currentRowIdx = 5;
      const allMemberTasks = allTasks.filter(t => t.isAllMembers || t.ownerCode === 'all');
      const studentTasks = allTasks.filter(t => !t.isAllMembers && t.ownerCode !== 'all');

      ownerOrder.forEach(ownerCode => {
        const subs = (allSubsystems[ownerCode] && allSubsystems[ownerCode].length > 0) ? allSubsystems[ownerCode] : ['General'];
        const startR = currentRowIdx;
        const endR = startR + subs.length - 1;

        subs.forEach((sub, subIdx) => {
          const row = new Array(3 + WEEKS_COUNT).fill('');
          if (subIdx === 0) {
            row[1] = ownerNames[ownerCode];
          }
          row[2] = sub;

          // Place tasks for this owner and subsystem
          const subTasks = studentTasks.filter(t => t.ownerCode === ownerCode && t.category === sub);
          subTasks.forEach(t => {
            const colStart = 3 + t.startWeekIdx;
            const colEnd = 3 + t.endWeekIdx;
            if (colStart >= 3 && colStart < 3 + WEEKS_COUNT) {
              row[colStart] = t.title;
              if (colEnd > colStart) {
                merges.push({ s: { r: currentRowIdx, c: colStart }, e: { r: currentRowIdx, c: colEnd } });
              }
            }
          });

          matrixRows.push(row);
          currentRowIdx++;
        });

        if (endR > startR) {
          merges.push({ s: { r: startR, c: 1 }, e: { r: endR, c: 1 } });
        }
      });

      const firstStudentRow = 5;
      const lastStudentRow = currentRowIdx - 1;

      // Vertical merges for All-Member milestones across all student rows
      allMemberTasks.forEach(t => {
        const colStart = 3 + t.startWeekIdx;
        const colEnd = 3 + t.endWeekIdx;
        if (colStart >= 3 && colStart < 3 + WEEKS_COUNT) {
          matrixRows[firstStudentRow][colStart] = t.title;
          merges.push({
            s: { r: firstStudentRow, c: colStart },
            e: { r: lastStudentRow, c: colEnd }
          });
        }
      });

      const wsGantt = XLSX.utils.aoa_to_sheet(matrixRows);
      wsGantt['!merges'] = merges;

      // Set column widths for Gantt Chart
      const ganttCols = [{ wch: 4 }, { wch: 18 }, { wch: 30 }];
      for (let i = 0; i < WEEKS_COUNT; i++) {
        ganttCols.push({ wch: 18 });
      }
      wsGantt['!cols'] = ganttCols;

      // Build Workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsGantt, 'Gantt Chart');
      XLSX.utils.book_append_sheet(wb, wsList, 'Deliverables List');

      try {
        XLSX.writeFile(wb, 'CDE4301_runway_patrol_gantt.xlsx');
      } catch (writeErr) {
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'CDE4301_runway_patrol_gantt.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      showToast('📊 Exported CDE4301_runway_patrol_gantt.xlsx successfully!');
    } catch (err) {
      console.error('Excel Export Error:', err);
      alert('Failed to export Excel spreadsheet: ' + err.message);
    }
  }

  let pendingImportFile = null;

  function openImportModal() {
    pendingImportFile = null;
    const modal = document.getElementById('timeline-import-modal');
    const textarea = document.getElementById('import-json-textarea');
    const fileInput = document.getElementById('import-file-input');
    const feedback = document.getElementById('import-file-feedback');
    if (textarea) textarea.value = '';
    if (fileInput) fileInput.value = '';
    if (feedback) { feedback.style.display = 'none'; feedback.textContent = ''; }
    if (modal) modal.style.display = 'flex';
  }

  function closeImportModal() {
    pendingImportFile = null;
    const modal = document.getElementById('timeline-import-modal');
    if (modal) modal.style.display = 'none';
  }

  function handleImportFileChange(e) {
    const file = e.target.files && e.target.files[0];
    const feedback = document.getElementById('import-file-feedback');
    if (!file) {
      pendingImportFile = null;
      if (feedback) feedback.style.display = 'none';
      return;
    }
    pendingImportFile = file;
    if (feedback) {
      feedback.style.display = 'block';
      feedback.style.background = 'rgba(59, 130, 246, 0.15)';
      feedback.style.border = '1px solid rgba(59, 130, 246, 0.4)';
      feedback.style.color = '#93c5fd';
      feedback.textContent = `Selected file: ${file.name} (${(file.size / 1024).toFixed(1)} KB). Click "Load Schedule" below to process.`;
    }
  }

  function handleImportSubmit() {
    const fileInput = document.getElementById('import-file-input');
    const file = pendingImportFile || (fileInput && fileInput.files && fileInput.files[0]);

    if (file) {
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        importFromExcelFile(file);
        return;
      } else if (fileName.endsWith('.json')) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          processJsonString(evt.target.result);
        };
        reader.readAsText(file);
        return;
      }
    }

    const textarea = document.getElementById('import-json-textarea');
    const jsonStr = (textarea ? textarea.value : '').trim();
    if (jsonStr) {
      processJsonString(jsonStr);
      return;
    }

    alert('Please select an Excel (.xlsx/.xls) or JSON file, or paste JSON content.');
  }

  function processJsonString(jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        allTasks = parsed;
      } else if (parsed && Array.isArray(parsed.tasks)) {
        allTasks = parsed.tasks;
        if (parsed.subsystems) allSubsystems = parsed.subsystems;
      } else {
        alert('Invalid JSON: Must contain an array of deliverables.');
        return;
      }
      saveTasks();
      saveSubsystems();
      closeImportModal();
      renderTimeline();
      showToast(`📥 Successfully imported ${allTasks.length} deliverables from JSON!`);
    } catch (e) {
      alert('Failed to parse JSON schedule: ' + e.message);
    }
  }

  function importFromExcelFile(file) {
    if (typeof XLSX === 'undefined') {
      alert('Excel parsing engine (SheetJS) is loading. Please try again.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        
        let loadedTasks = [];
        let loadedSubsystems = {};

        // 1. Check if 'Deliverables List' sheet exists
        if (wb.SheetNames.includes('Deliverables List')) {
          const ws = wb.Sheets['Deliverables List'];
          const rows = XLSX.utils.sheet_to_json(ws);
          
          rows.forEach((r, idx) => {
            const title = (r['Title'] || r['Deliverable Title'] || '').toString().trim();
            if (!title) return;

            let owner = (r['Owner'] || 'Asuka').toString().trim();
            let ownerCode = (r['Owner Code'] || '').toString().toLowerCase().trim();
            if (!ownerCode) {
              const lower = owner.toLowerCase();
              if (lower.includes('asuka')) ownerCode = 'asuka';
              else if (lower.includes('zac')) ownerCode = 'zacarias';
              else if (lower.includes('hilbert')) ownerCode = 'hilbert';
              else if (lower.includes('bryan')) ownerCode = 'bryan';
              else if (lower.includes('gabriel')) ownerCode = 'gabriel';
              else ownerCode = 'all';
            }

            const isAll = (r['Is All Members'] === 'YES' || r['Is All Members'] === true || ownerCode === 'all');
            if (isAll) {
              owner = 'All Members';
              ownerCode = 'all';
            }

            const cat = (r['Subsystem'] || (isAll ? 'Capstone Milestones' : 'General')).toString().trim();
            const startWk = parseInt(r['Start Week'] != null ? r['Start Week'] : 0, 10);
            const endWk = parseInt(r['End Week'] != null ? r['End Week'] : startWk, 10);
            const status = (r['Status'] || 'In Progress').toString().trim();
            const notes = (r['Notes'] || '').toString().trim();
            const isMilestone = (r['Is Milestone'] === 'YES' || r['Is Milestone'] === true || isAll);
            const period = r['Period'] || (startWk === endWk ? `Wk ${startWk + 1}` : `Wk ${startWk + 1} - Wk ${endWk + 1}`);
            const sem = endWk <= 13 ? '1' : (endWk <= 20 ? 'vac' : '2');

            if (ownerCode !== 'all') {
              if (!loadedSubsystems[ownerCode]) loadedSubsystems[ownerCode] = [];
              if (!loadedSubsystems[ownerCode].includes(cat)) loadedSubsystems[ownerCode].push(cat);
            }

            loadedTasks.push({
              id: r['ID'] || `task-xl-${idx + 1}`,
              owner: owner,
              ownerCode: ownerCode,
              isAllMembers: isAll,
              category: cat,
              title: title,
              period: period,
              startWeekIdx: startWk,
              endWeekIdx: endWk,
              semester: sem,
              isMilestone: isMilestone,
              status: status,
              notes: notes
            });
          });
        } 
        // 2. Fallback: Parse 'Gantt Chart' matrix sheet
        else if (wb.SheetNames.includes('Gantt Chart') || wb.SheetNames.length > 0) {
          const sheetName = wb.SheetNames.includes('Gantt Chart') ? 'Gantt Chart' : wb.SheetNames[0];
          const ws = wb.Sheets[sheetName];
          const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:AL50');
          const merges = ws['!merges'] || [];

          // Map merged ranges by min_row, min_col
          const mergeMap = {};
          merges.forEach(m => {
            mergeMap[`${m.s.r},${m.s.c}`] = m;
          });

          // Find header row with 'Sem 1 W1' or similar
          let headerR = 4;
          for (let r = 0; r <= Math.min(10, range.e.r); r++) {
            for (let c = 0; c <= range.e.c; c++) {
              const cell = ws[XLSX.utils.encode_cell({ r, c })];
              if (cell && typeof cell.v === 'string' && (cell.v.includes('Sem 1') || cell.v.includes('S1 Wk'))) {
                headerR = r;
                break;
              }
            }
          }

          // Week columns start after Student and Subsystem columns
          let weekStartCol = 3;

          // Identify student rows
          let currentOwnerCode = 'asuka';
          let currentOwnerName = 'Asuka';
          let currentSub = 'General';

          for (let r = headerR + 1; r <= range.e.r; r++) {
            const studentCell = ws[XLSX.utils.encode_cell({ r, c: 1 })];
            if (studentCell && studentCell.v) {
              const val = studentCell.v.toString().toLowerCase();
              if (val.includes('asuka')) { currentOwnerCode = 'asuka'; currentOwnerName = 'Asuka'; }
              else if (val.includes('zac')) { currentOwnerCode = 'zacarias'; currentOwnerName = 'Zac'; }
              else if (val.includes('hilbert')) { currentOwnerCode = 'hilbert'; currentOwnerName = 'Hilbert'; }
              else if (val.includes('bryan')) { currentOwnerCode = 'bryan'; currentOwnerName = 'Bryan'; }
              else if (val.includes('gabriel')) { currentOwnerCode = 'gabriel'; currentOwnerName = 'Gabriel'; }
            }

            const subCell = ws[XLSX.utils.encode_cell({ r, c: 2 })];
            if (subCell && subCell.v) {
              currentSub = subCell.v.toString().trim();
              if (!loadedSubsystems[currentOwnerCode]) loadedSubsystems[currentOwnerCode] = [];
              if (!loadedSubsystems[currentOwnerCode].includes(currentSub)) {
                loadedSubsystems[currentOwnerCode].push(currentSub);
              }
            }

            // Check week cells in this row
            for (let c = weekStartCol; c <= range.e.c; c++) {
              const cell = ws[XLSX.utils.encode_cell({ r, c })];
              if (cell && cell.v && cell.v.toString().trim()) {
                const title = cell.v.toString().trim();
                const m = mergeMap[`${r},${c}`];
                const startWk = c - weekStartCol;
                const endWk = m ? (m.e.c - weekStartCol) : startWk;
                const isVerticalAll = m && (m.e.r - m.s.r >= 10); // spans across all student rows

                const isAll = isVerticalAll || title.toLowerCase().includes('presentation') || title.toLowerCase().includes('documentation due');

                loadedTasks.push({
                  id: `task-xl-${loadedTasks.length + 1}`,
                  owner: isAll ? 'All Members' : currentOwnerName,
                  ownerCode: isAll ? 'all' : currentOwnerCode,
                  isAllMembers: isAll,
                  category: isAll ? 'Capstone Milestones' : currentSub,
                  title: title,
                  period: startWk === endWk ? `Wk ${startWk + 1}` : `Wk ${startWk + 1} - Wk ${endWk + 1}`,
                  startWeekIdx: Math.max(0, startWk),
                  endWeekIdx: Math.max(0, endWk),
                  semester: endWk <= 13 ? '1' : (endWk <= 20 ? 'vac' : '2'),
                  isMilestone: isAll,
                  status: 'In Progress',
                  notes: ''
                });
              }
            }
          }
        }

        if (loadedTasks.length > 0) {
          allTasks = loadedTasks;
          if (Object.keys(loadedSubsystems).length > 0) {
            allSubsystems = loadedSubsystems;
            saveSubsystems();
          }
          saveTasks();
          closeImportModal();
          renderTimeline();
          showToast(`✓ Successfully imported ${allTasks.length} deliverables from "${file.name}"!`);
        } else {
          alert('Could not find any deliverables in this Excel workbook.');
        }

      } catch (err) {
        console.error('Excel Import Error:', err);
        alert('Failed to parse Excel file: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  // ── 14. INITIALIZATION & EVENT BINDINGS ────────────────────────────
  function initTimeline() {
    initDOM();
    renderTimeline();

    const btnPrev = document.getElementById('btn-timeline-prev');
    const btnNext = document.getElementById('btn-timeline-next');
    const btnJumpToday = document.getElementById('btn-timeline-jump-today');
    const periodSelect = document.getElementById('timeline-period-select');

    if (btnPrev) btnPrev.addEventListener('click', navigatePrevious);
    if (btnNext) btnNext.addEventListener('click', navigateNext);
    if (btnJumpToday) btnJumpToday.addEventListener('click', jumpToToday);

    if (periodSelect) {
      periodSelect.addEventListener('change', (e) => {
        const val = parseInt(e.target.value, 10);
        if (currentMode === 'week') {
          activeWeekIndex = val;
        } else {
          activeMonthIndex = val;
        }
        renderTimeline();
      });
    }

    const btnWeek = document.getElementById('btn-toggle-week');
    const btnMonth = document.getElementById('btn-toggle-month');
    if (btnWeek) btnWeek.addEventListener('click', () => setViewMode('week'));
    if (btnMonth) btnMonth.addEventListener('click', () => setViewMode('month'));

    const btnEdit = document.getElementById('btn-toggle-edit-mode');
    const btnBannerExit = document.getElementById('btn-banner-exit');
    if (btnEdit) btnEdit.addEventListener('click', toggleEditMode);
    if (btnBannerExit) btnBannerExit.addEventListener('click', toggleEditMode);

    const btnAdd = document.getElementById('btn-add-new-task');
    if (btnAdd) btnAdd.addEventListener('click', () => openTaskModalForAdd('asuka'));

    const btnAddSubTop = document.getElementById('btn-add-subsystem-top');
    if (btnAddSubTop) btnAddSubTop.addEventListener('click', () => openSubsystemModal('asuka'));

    // Excel Export, Repo Sync & Import
    const btnExportTop = document.getElementById('btn-export-excel-top');
    const btnImportTop = document.getElementById('btn-import-top');
    const btnSyncRepo = document.getElementById('btn-sync-repo');

    if (btnExportTop) btnExportTop.addEventListener('click', exportToExcel);
    if (btnImportTop) btnImportTop.addEventListener('click', openImportModal);
    if (btnSyncRepo) btnSyncRepo.addEventListener('click', openSyncModal);

    const btnCloseSync = document.getElementById('btn-close-sync-modal');
    const btnCloseSyncFooter = document.getElementById('btn-close-sync-footer');
    const btnDownloadSync = document.getElementById('btn-download-sync-json');
    const btnDownloadExcelSync = document.getElementById('btn-download-excel-sync');

    if (btnCloseSync) btnCloseSync.addEventListener('click', closeSyncModal);
    if (btnCloseSyncFooter) btnCloseSyncFooter.addEventListener('click', closeSyncModal);
    if (btnDownloadSync) btnDownloadSync.addEventListener('click', downloadSyncJSON);
    if (btnDownloadExcelSync) btnDownloadExcelSync.addEventListener('click', exportToExcel);

    // Import file input change
    const fileInput = document.getElementById('import-file-input');
    if (fileInput) fileInput.addEventListener('change', handleImportFileChange);

    // Subsystem modal buttons
    const btnCloseSub = document.getElementById('btn-close-subsystem-modal');
    const btnCancelSub = document.getElementById('btn-cancel-subsystem');
    const btnSubmitSub = document.getElementById('btn-submit-subsystem');
    if (btnCloseSub) btnCloseSub.addEventListener('click', closeSubsystemModal);
    if (btnCancelSub) btnCancelSub.addEventListener('click', closeSubsystemModal);
    if (btnSubmitSub) btnSubmitSub.addEventListener('click', submitNewSubsystem);

    // Password modal buttons
    const btnClosePwd = document.getElementById('btn-close-pwd-modal');
    const btnCancelPwd = document.getElementById('btn-cancel-pwd');
    const btnSubmitPwd = document.getElementById('btn-submit-pwd');
    const btnPwdEye = document.getElementById('btn-toggle-pwd-visibility');
    const pwdInput = document.getElementById('timeline-pwd-input');

    if (btnClosePwd) btnClosePwd.addEventListener('click', closePasswordModal);
    if (btnCancelPwd) btnCancelPwd.addEventListener('click', closePasswordModal);
    if (btnSubmitPwd) btnSubmitPwd.addEventListener('click', checkPassword);
    if (pwdInput) {
      pwdInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') checkPassword();
      });
    }
    if (btnPwdEye && pwdInput) {
      btnPwdEye.addEventListener('click', () => {
        pwdInput.type = pwdInput.type === 'password' ? 'text' : 'password';
      });
    }

    // Task modal buttons
    const btnCloseTask = document.getElementById('btn-close-task-modal');
    const btnCancelTask = document.getElementById('btn-cancel-task');
    const btnSaveTask = document.getElementById('btn-save-task');
    const btnDeleteTask = document.getElementById('btn-delete-task');

    if (btnCloseTask) btnCloseTask.addEventListener('click', closeTaskModal);
    if (btnCancelTask) btnCancelTask.addEventListener('click', closeTaskModal);
    if (btnSaveTask) btnSaveTask.addEventListener('click', (e) => { e.preventDefault(); saveTaskFromModal(); });
    if (btnDeleteTask) btnDeleteTask.addEventListener('click', (e) => { e.preventDefault(); deleteTaskFromModal(); });

    // Import modal close & submit buttons
    const btnCloseImport = document.getElementById('btn-close-import-modal');
    const btnCancelImport = document.getElementById('btn-cancel-import');
    const btnSubmitImport = document.getElementById('btn-submit-import');

    if (btnCloseImport) btnCloseImport.addEventListener('click', closeImportModal);
    if (btnCancelImport) btnCancelImport.addEventListener('click', closeImportModal);
    if (btnSubmitImport) btnSubmitImport.addEventListener('click', handleImportSubmit);

    // Owner filter buttons
    const ownerFilterBtns = document.querySelectorAll('.owner-filter-btn');
    ownerFilterBtns.forEach(b => {
      b.addEventListener('click', () => {
        ownerFilterBtns.forEach(btn => btn.classList.remove('active'));
        b.classList.add('active');
        currentOwnerFilter = b.getAttribute('data-owner');
        applyFilters();
      });
    });

    const searchInput = document.getElementById('gantt-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        applyFilters();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTimeline);
  } else {
    initTimeline();
  }

  window.TimelineEngine = {
    editTask: (id) => openTaskModalForEdit(id),
    addSubsystem: (owner) => openSubsystemModal(owner),
    setWeek: (idx) => { activeWeekIndex = idx; renderTimeline(); },
    setMonth: (idx) => { activeMonthIndex = idx; renderTimeline(); },
    jumpToday: () => jumpToToday()
  };

})();
