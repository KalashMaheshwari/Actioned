import os
import requests
from typing import Dict, Any, Optional

def create_trello_card(
    name: str,
    desc: str,
    due_date: Optional[str] = None
) -> Dict[str, Any]:
    """
    Creates a task card in Trello.
    If Trello credentials are not configured, returns a mock task reference.
    """
    api_key = os.getenv("TRELLO_API_KEY", "").strip()
    token = os.getenv("TRELLO_TOKEN", "").strip()
    board_id = os.getenv("TRELLO_BOARD_ID", "").strip()

    if not (api_key and token and board_id):
        # Graceful mock response for demo / test without external keys
        return {
            "success": True,
            "mock": True,
            "id": f"mock_trello_{abs(hash(name)) % 100000}",
            "name": name,
            "due": due_date,
            "url": "https://trello.com/c/mock-card"
        }

    try:
        url = "https://api.trello.com/1/cards"
        query = {
            "key": api_key,
            "token": token,
            "idList": board_id,
            "name": name,
            "desc": desc,
            "due": due_date
        }
        res = requests.post(url, params=query, timeout=5)
        if res.status_code in (200, 201):
            data = res.json()
            return {"success": True, "id": data.get("id"), "url": data.get("url")}
        return {"success": False, "error": res.text}
    except Exception as e:
        return {"success": False, "error": str(e)}

def send_slack_notification(message: str) -> bool:
    """
    Sends an alert or digest to Slack via incoming webhook.
    """
    webhook_url = os.getenv("SLACK_WEBHOOK_URL", "").strip()
    if not webhook_url:
        print(f"[Slack Mock] Notification: {message}")
        return True

    try:
        res = requests.post(webhook_url, json={"text": message}, timeout=5)
        return res.status_code == 200
    except Exception as e:
        print(f"[Slack Error]: {e}")
        return False
