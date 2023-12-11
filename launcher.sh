#!/bin/bash

# Get the directory of the script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Change to the script's directory
cd "$DIR"
# Run launcher with the specified arguments
# /home/carlos/.nvm/versions/node/v21.4.0/bin/node ./launcher.js "$@"
./node_modules/.pnpm/electron@28.0.0/node_modules/electron/dist/electron . "$@"


