#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

source "$PROJECT_ROOT/.env"

# curl -X POST "https://api.telegram.org/bot8306159097:AAE2i2vSWJn9t8sOSqbxeK7519dKz0S-fSs/setWebhook" \
#     -H "Content-Type: application/json" \
#     -d '{"url": "https://965f6wkz-2987.asse.devtunnels.ms/webhook", "drop_pending_updates": true}'

# curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
#     -H "Content-Type: application/json" \
#     -d '{"url": "https://965f6wkz-2987.asse.devtunnels.ms/webhook", "drop_pending_updates": true}'