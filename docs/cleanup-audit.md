# Cleanup status

Source review for 0.8.0, 2026-09-23. The [prior audit](history/pre-0.8.0-refresh/cleanup-audit.md) is historical, not an outstanding work order.

Implemented: shared native wrapper registration; shared damage application for manual/normal cards; shared chat-button styling; focused QuickHack validation boundaries; encounter-owned connection awareness; scoped effect expiration; batched relevant status/HUD refreshes; status-menu lifecycle cleanup instead of a page-wide watcher. The one-time awareness migration and test HUD were removed. Screen effects moved to Visual Tools.

Retained deliberately: ownership/target/range/sight checks, saved claims and receipts around cross-document changes, uncertain-application review, subsystem queues and recovery. A game aid still needs to avoid double damage and stale-target writes.

Remaining candidates are concrete issues in [BACKLOG](../BACKLOG.md), not permission for broad refactoring. No new performance benchmark or runtime cleanup was performed during this documentation refresh.
