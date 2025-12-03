#!/bin/bash
# call-api-pro.sh — Universal Cognito Login + API Caller
# Works on Linux, macOS, and WSL
# No hardcoded values — all provided via ENV or CLI arguments.

#############################################
# Required: Runtime Inputs
#############################################
USERNAME="${USERNAME:-$1}"
PASSWORD="${PASSWORD:-$2}"
CLIENT_ID="${CLIENT_ID:-$3}"
USER_POOL_ID="${USER_POOL_ID:-$4}"
REGION="${REGION:-$5}"
API_URL="${API_URL:-$6}"
SEARCH_KEY="${SEARCH_KEY:-$7}"

TOKEN_FILE="${TOKEN_FILE:-/tmp/idtoken.txt}"
TOKEN_LIFETIME="${TOKEN_LIFETIME:-3300}"  # 55 minutes

#############################################
# Validate Inputs
#############################################
if [[ -z "$USERNAME" || -z "$PASSWORD" || -z "$CLIENT_ID" || -z "$USER_POOL_ID" || -z "$REGION" || -z "$API_URL" || -z "$SEARCH_KEY" ]]; then
  echo "Missing required parameters."
  echo ""
  echo "Usage:"
  echo "  USERNAME=<email> PASSWORD=<pwd> CLIENT_ID=<id> USER_POOL_ID=<pool> REGION=<aws-region> API_URL=<url> ./call-api-pro.sh <search-key>"
  echo ""
  echo "OR pass via CLI:"
  echo "  ./call-api-pro.sh <username> <password> <client_id> <user_pool_id> <region> <api_url> <search-key>"
  exit 1
fi

#############################################
# Cross-platform stat compatibility
#############################################
get_mod_time() {
  if stat --version >/dev/null 2>&1; then
    stat -c %Y "$1"  # GNU stat (Linux)
  else
    stat -f %m "$1"  # BSD stat (macOS)
  fi
}

#############################################
# 1. Ensure Cognito user exists
#############################################
ensure_user_exists() {
  echo "Checking if Cognito user exists..."

  USER_EXISTS=$(aws cognito-idp admin-get-user \
      --user-pool-id "$USER_POOL_ID" \
      --username "$USERNAME" \
      --region "$REGION" \
      --query "Username" \
      --output text 2>/dev/null)

  if [[ "$USER_EXISTS" == "None" || -z "$USER_EXISTS" ]]; then
    echo "User does not exist — creating..."

    aws cognito-idp sign-up \
      --client-id "$CLIENT_ID" \
      --username "$USERNAME" \
      --password "$PASSWORD" \
      --region "$REGION" >/dev/null

    echo "User created."
  else
    echo "User already exists."
  fi

  echo "Confirming user if required..."

  aws cognito-idp admin-confirm-sign-up \
    --user-pool-id "$USER_POOL_ID" \
    --username "$USERNAME" \
    --region "$REGION" >/dev/null 2>&1

  echo "User confirmed."
}

#############################################
# 2. Get or refresh ID token
#############################################
get_token() {
  if [ -f "$TOKEN_FILE" ]; then
    now=$(date +%s)
    mod_time=$(get_mod_time "$TOKEN_FILE")
    age=$((now - mod_time))

    if [ "$age" -lt "$TOKEN_LIFETIME" ]; then
      cat "$TOKEN_FILE"
      return
    fi
  fi

  echo "Generating new Cognito token..."

  ID_TOKEN=$(aws cognito-idp initiate-auth \
      --auth-flow USER_PASSWORD_AUTH \
      --client-id "$CLIENT_ID" \
      --auth-parameters USERNAME="$USERNAME",PASSWORD="$PASSWORD" \
      --region "$REGION" \
      --query "AuthenticationResult.IdToken" \
      --output text)

  if [[ -z "$ID_TOKEN" || "$ID_TOKEN" == "None" ]]; then
    echo "Error: Unable to authenticate."
    exit 1
  fi

  echo "$ID_TOKEN" > "$TOKEN_FILE"
  echo "$ID_TOKEN"
}

#############################################
# Main Logic
#############################################
ensure_user_exists
ID_TOKEN=$(get_token)

echo "Searching for \"$SEARCH_KEY\"..."

call_api() {
  curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: $ID_TOKEN" \
    -H "search-key: $SEARCH_KEY" \
    "$API_URL"
}

RESPONSE=$(call_api)

if echo "$RESPONSE" | grep -q "Unauthorized"; then
  echo "Token expired, refreshing..."
  rm -f "$TOKEN_FILE"
  ID_TOKEN=$(get_token)
  RESPONSE=$(call_api)
fi

if [[ "$RESPONSE" == "[]" || -z "$RESPONSE" ]]; then
  echo "No results found for \"$SEARCH_KEY\""
  exit 0
fi

echo "$RESPONSE" | jq -r '.[] | "\nImage: \(.key)\nLabels: \(.labels | join(", "))\nURL: \(.url)\n"'
