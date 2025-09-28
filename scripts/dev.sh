#!/bin/bash

# export a command called dev that runs the dev script
maildogctl() {
    echo "Welcome to the Maildog development environment"

    # install
    # cd ./
    # cd ./web && pnpm install

    # start
    # cd ./engine && docker compose up -d

    # stop
    # cd ./engine && docker compose down

    # dev
    # cd ./web && npm run dev
}
alias mdctl=maildogctl

# Colors
CYAN='\033[1;36m'
YELLOW='\033[1;33m'
GREEN='\033[1;32m'
RESET='\033[0m'
BOLD='\033[1m'

# Print banner
echo -e "${CYAN}============================================${RESET}"
echo -e " ${BOLD}${GREEN}🐶 Maildog Development Environment${RESET}"
echo -e "${CYAN}============================================${RESET}"
echo -e "You can run ${YELLOW}mdctl${RESET} or ${YELLOW}maildogctl${RESET} to manage your environment"
echo -e ""
echo -e "Usage: ${yellow}maildogctl${RESET} <command>"
echo -e ""
echo -e "Commands:"
echo -e "  ${YELLOW}start${RESET} - Start the Maildog development environment"
echo -e "  ${YELLOW}stop${RESET} - Stop the Maildog development environment"
echo -e "  ${YELLOW}dev${RESET} - Starts the web application live server"
echo -e "${CYAN}============================================${RESET}"
