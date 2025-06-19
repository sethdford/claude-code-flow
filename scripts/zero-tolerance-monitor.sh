#!/bin/bash

# Zero Tolerance TypeScript Error Monitor
# This script provides real-time monitoring of TypeScript error elimination progress

COLOR_RED='\033[0;31m'
COLOR_GREEN='\033[0;32m'
COLOR_YELLOW='\033[1;33m'
COLOR_BLUE='\033[0;34m'
COLOR_RESET='\033[0m'

INITIAL_ERRORS=370
LOG_FILE="zero-tolerance-progress.log"

# Function to get current error count
get_error_count() {
    npm run typecheck 2>&1 | grep "error TS" | wc -l | tr -d ' '
}

# Function to get errors by type
get_errors_by_type() {
    npm run typecheck 2>&1 | grep "error TS" | cut -d':' -f2 | sort | uniq -c | sort -nr
}

# Function to get errors by file
get_errors_by_file() {
    npm run typecheck 2>&1 | grep "error TS" | cut -d'(' -f1 | sort | uniq -c | sort -nr | head -10
}

# Main monitoring loop
while true; do
    clear
    echo -e "${COLOR_BLUE}╔════════════════════════════════════════════════════════════════╗${COLOR_RESET}"
    echo -e "${COLOR_BLUE}║          ZERO TOLERANCE TYPESCRIPT ERROR MONITOR               ║${COLOR_RESET}"
    echo -e "${COLOR_BLUE}╚════════════════════════════════════════════════════════════════╝${COLOR_RESET}"
    echo
    
    CURRENT_ERRORS=$(get_error_count)
    FIXED_ERRORS=$((INITIAL_ERRORS - CURRENT_ERRORS))
    PERCENTAGE=$((FIXED_ERRORS * 100 / INITIAL_ERRORS))
    
    # Status bar
    echo -e "${COLOR_YELLOW}Progress:${COLOR_RESET}"
    printf "["
    PROGRESS_BAR_LENGTH=50
    FILLED_LENGTH=$((PERCENTAGE * PROGRESS_BAR_LENGTH / 100))
    
    for ((i=0; i<FILLED_LENGTH; i++)); do
        printf "#"
    done
    for ((i=FILLED_LENGTH; i<PROGRESS_BAR_LENGTH; i++)); do
        printf "-"
    done
    printf "] %d%%\n\n" "$PERCENTAGE"
    
    # Current status
    if [ "$CURRENT_ERRORS" -eq 0 ]; then
        echo -e "${COLOR_GREEN}✓ ZERO ERRORS ACHIEVED! Mission Complete!${COLOR_RESET}"
    else
        echo -e "${COLOR_RED}Remaining Errors: $CURRENT_ERRORS${COLOR_RESET}"
    fi
    
    echo -e "Fixed Errors: ${COLOR_GREEN}$FIXED_ERRORS${COLOR_RESET} / $INITIAL_ERRORS"
    echo
    
    # Error breakdown
    echo -e "${COLOR_YELLOW}Error Types:${COLOR_RESET}"
    echo "----------------------------------------"
    get_errors_by_type | head -10
    echo
    
    # File breakdown
    echo -e "${COLOR_YELLOW}Files with Most Errors:${COLOR_RESET}"
    echo "----------------------------------------"
    get_errors_by_file
    echo
    
    # Log progress
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Errors: $CURRENT_ERRORS, Fixed: $FIXED_ERRORS" >> "$LOG_FILE"
    
    # Refresh every 10 seconds
    echo -e "${COLOR_BLUE}Refreshing in 10 seconds... (Ctrl+C to exit)${COLOR_RESET}"
    sleep 10
done