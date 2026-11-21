# Integrations Guide (Person B)

Actioned integrates with **Trello** for task creation and **Slack** for reminders.

---

## 1. Trello Setup

When a meeting is approved on the review screen (`POST /meetings/{id}/approve`), approved action items are created as cards in Trello.

### Configuration
In `backend/.env`:
```env
TRELLO_API_KEY=your_trello_api_key
TRELLO_TOKEN=your_trello_token
TRELLO_BOARD_ID=your_target_list_id
```

### How to get credentials:
1. Go to https://trello.com/power-ups/admin and generate an API key.
2. Generate a read/write token for your account.
3. Obtain the `idList` of the column where tasks should be placed (e.g. "To Do" list ID via `https://api.trello.com/1/boards/{board_id}/lists?key=...&token=...`).

### Mock Fallback:
If credentials are not set, `backend/services/integrations.py` automatically returns mock task references (`mock_trello_xxxxx`) with zero errors, so the demo works completely without live API keys.

---

## 2. Slack Webhooks

When a task is approved or an upcoming deadline approaches:
In `backend/.env`:
```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/yyy/zzz
```

### Mock Fallback:
If `SLACK_WEBHOOK_URL` is empty, notifications are logged to stdout with `[Slack Mock]` prefix.
