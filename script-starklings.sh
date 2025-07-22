#!/bin/bash


# 1. Nettoyer les éventuels anciens dossiers
echo "🧹 Cleaning up previous installations..."
rm -rf starklings

# 2. Cloner le repo starklings
echo "📦 Cloning starklings repository..."
git clone https://github.com/shramee/starklings.git
if [ $? -ne 0 ]; then
    echo "❌ Failed to clone starklings repository"
    exit 1
fi

# 3. Changer vers la branche feat/upgrade-cairo-and-use-scarb
echo "🔄 Switching to feat/upgrade-cairo-and-use-scarb branch..."
cd starklings
git checkout feat/upgrade-cairo-and-use-scarb
if [ $? -ne 0 ]; then
    echo "❌ Failed to switch to feat/upgrade-cairo-and-use-scarb branch"
    exit 1
fi

# 4. Retourner au dossier parent
cd ..

# Vérifier si le serveur répond
if ! curl -s http://localhost:3001/ > /dev/null 2>&1; then
    echo "❌ Server failed to start"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi

# 8. Lancer le test avec un seul exercice
echo "🎯 Running single Starklings evaluation..."

# SINGLE_EXERCISE=starknet3  node .github/scripts/starklings-evaluate.js
node .github/scripts/starklings-evaluate.js

# 9. Nettoyer
echo "🧹 Cleaning up..."
kill $SERVER_PID 2>/dev/null || true

if command -v docker &> /dev/null; then
    docker stop cairo-coder-test-db 2>/dev/null || true
    docker rm cairo-coder-test-db 2>/dev/null || true
fi

echo "✅ Test completed!"