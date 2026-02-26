# Backend Event Guide

To send an in-app message to a specific passenger, you can trigger the `backend.message` event on their private channel.

## Event Details

- **Channel:** `passenger.{user_id}`
- **Event:** `backend.message`
- **Payload:**
  ```json
  {
    "title": "Your Title Here",
    "message": "Your message body here"
  }
  ```
