#!/bin/bash

# Script to switch between package versions for local vs production environments

echo "Package Version Switcher for Crawler"
echo "===================================="

if [ "$1" = "local" ]; then
    echo "Switching to LOCAL environment packages (Bull 4.x, Redis 4.x)..."
    
    # Backup current production packages
    if [ ! -f "package.json.production" ]; then
        cp package.json package.json.production
        echo "Backed up current packages to package.json.production"
    fi
    
    # Restore local packages
    if [ -f "package.json.backup" ]; then
        cp package.json.backup package.json
        echo "Restored local packages from package.json.backup"
    else
        echo "Error: package.json.backup not found!"
        exit 1
    fi
    
    echo "Installing local packages..."
    npm install
    
elif [ "$1" = "production" ]; then
    echo "Switching to PRODUCTION environment packages (Bull 3.x, Redis 3.x)..."
    
    # Backup current packages
    if [ ! -f "package.json.local" ]; then
        cp package.json package.json.local
        echo "Backed up current packages to package.json.local"
    fi
    
    # Restore production packages
    if [ -f "package.json.production" ]; then
        cp package.json.production package.json
        echo "Restored production packages from package.json.production"
    else
        echo "Error: package.json.production not found!"
        exit 1
    fi
    
    echo "Installing production packages..."
    npm install
    
elif [ "$1" = "status" ]; then
    echo "Current package status:"
    echo "======================="
    
    if [ -f "package.json" ]; then
        echo "Current package.json:"
        grep -E "(bull|redis)" package.json | head -2
    fi
    
    echo ""
    echo "Available backups:"
    if [ -f "package.json.local" ]; then
        echo "  package.json.local (local environment)"
    fi
    if [ -f "package.json.production" ]; then
        echo "  package.json.production (production environment)"
    fi
    if [ -f "package.json.backup" ]; then
        echo "  package.json.backup (original local packages)"
    fi
    
else
    echo "Usage: $0 {local|production|status}"
    echo ""
    echo "Commands:"
    echo "  local      - Switch to local environment packages (Bull 4.x, Redis 4.x)"
    echo "  production - Switch to production environment packages (Bull 3.x, Redis 3.x)"
    echo "  status     - Show current package status and available backups"
    echo ""
    echo "Examples:"
    echo "  $0 local      # Switch to local packages"
    echo "  $0 production # Switch to production packages"
    echo "  $0 status     # Check current status"
fi
