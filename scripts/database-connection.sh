#!/bin/bash

echo "=== Testing database connection via /chat/completions endpoint ==="

# Préparation des données pour l'appel API (requête simple)
REQUEST_DATA='{
    "model": "gemini-2.5-flash",
    "messages": [
      {
        "role": "user",
        "content": "Hello"
      }
    ],
    "temperature": 0.7
  }'

RESPONSE=$(curl -s -X POST http://localhost:3001/chat/completions \
  -H "Content-Type: application/json" \
  -d "$REQUEST_DATA")

# Vérification de la réponse pour détecter des erreurs de base de données
if echo "$RESPONSE" | jq -e '.error' >/dev/null 2>&1; then
  echo "❌ Database connection error detected"
  echo "Error details:"
  echo "$RESPONSE" | jq '.error'
  exit 1
else
  echo "✅ Successfully connected to database via /chat/completions endpoint"
  exit 0
fi