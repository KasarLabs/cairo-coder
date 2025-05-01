#!/bin/bash

docker ps

docker exec postgresql pg_isready -U postgres -h localhost
if [ $? -eq 0 ]; then
   echo "✅ PostgreSQL is ready!"
else
   echo "❌ PostgreSQL is not ready"
fi

docker exec backend ping -c 2 postgres
if [ $? -eq 0 ]; then
   echo "✅ Network connectivity to PostgreSQL works!"
else
   echo "❌ Network connectivity issue to PostgreSQL"
fi

RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/ 2>/dev/null)
if [ "$RESPONSE" == "200" ]; then
   echo "✅ Backend API is working correctly!"
else
   echo "❌ Issue with backend API. HTTP code: $RESPONSE"
   # Get more details about the error
   echo "Error details:"
   curl -v http://localhost:3001/
fi
