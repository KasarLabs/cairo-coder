#!/bin/bash

# Vérifier si le serveur répond
if ! curl -s http://localhost:3002/ > /dev/null 2>&1; then
    echo "❌ Server failed to start"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi

# 8. Lancer le test avec un seul exercice
echo "🎯 Running single Starklings evaluation..."

# SINGLE_EXERCISE=variables2  node .github/scripts/starklings-evaluate.js
node .github/scripts/starklings-evaluate.js

# 9. Nettoyer
echo "🧹 Cleaning up..."
kill $SERVER_PID 2>/dev/null || true

if command -v docker &> /dev/null; then
    docker stop cairo-coder-test-db 2>/dev/null || true
    docker rm cairo-coder-test-db 2>/dev/null || true
fi

echo "✅ Test completed!"