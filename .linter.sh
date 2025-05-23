#!/bin/bash
cd /home/kavia/workspace/code-generation/adaptivelearn360-8264-8270/main_container_for_adaptivelearn360
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

