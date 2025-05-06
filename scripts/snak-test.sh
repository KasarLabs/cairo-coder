#!/bin/bash

pnpm run test:code-quality --force | tee test-output.log

TEST_RESULT=${PIPESTATUS[0]}

if [ $TEST_RESULT -ne 0 ]; then
    echo "❌ API test failed with exit code $TEST_RESULT!"
    echo "=============== Test Logs ==============="
    grep -A 5 -E "TEST FAILED|❌" test-output.log || true
    exit 1
else
    echo "✅ API test passed!"
fi