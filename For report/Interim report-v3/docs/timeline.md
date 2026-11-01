---
title: "Timeline"
description: "From concept to autonomy: the FOD Hunter project schedule across Semester 1 and Semester 2 (August 2026 – April 2027), as an interactive Gantt chart."
owner: "FOD Hunter team"
layout: page
sidebar: false
aside: false
outline: false
---

<script setup>
import TimelinePage from '@theme/components/timeline/TimelinePage.vue'
</script>

<!--
  Timeline. Everything on this page is generated from one file:
    docs/shared/assets/data/timeline.json
  - tasks:          one entry per task (owner, category, title, startWeekIdx / endWeekIdx, semester, status, notes)
  - calendar.weeks: the project weeks with their Monday–Sunday dates; task week indices point into this list
  Project start/end, the Semester 1 / Semester 2 boundary and every bar come from these two lists.
  To update the schedule (e.g. a status), edit the JSON; the page and the hero's date line follow.
-->

<TimelinePage />
