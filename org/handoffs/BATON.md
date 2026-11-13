# Baton: which handoff runs now (read by the hourly check-in; every builder updates its row before stopping)
| handoff file | status | started_at | last_commit |
|---|---|---|---|
| polish-round4.md | done | 2026-11-02T21:41Z (session_013FPdmxro5Sn2RKVFK4oLko) | 8984f0e (site), records after |
| public-share.md | cancelled (CEO: host maker on Cloudflare) | - | - |
| owner-preview.md | done | 2026-11-03 (session_013FPdmwTwsMrzb1gHMwjoKy) | a456109 |
| gmail-alerts.md | done | 2026-11-13 (session_013FPdmxVtEHoM64xunXBC3R) | e77082e |
Rule for every builder: before you stop (done OR out of context), set your row to done, add a queued row for any follow-up handoff you wrote, commit and push. The check-in starts queued rows within the hour.
