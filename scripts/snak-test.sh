#!/bin/bash

pnpm run test:code-quality --force | tee test-output.log

TEST_RESULT=${PIPESTATUS[0]}

if [ $TEST_RESULT -ne 0 ]; then
    echo "❌ API test failed with exit code $TEST_RESULT!"
    exit 1
else
    echo "✅ API test passed!"
fi