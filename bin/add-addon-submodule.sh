#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if we're in a git repository
check_git_repo() {
    if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
        echo -e "${YELLOW}This is not a Git repository.${NC}"
        read -p "Would you like to initialize a Git repository? [Y/n] " answer
        answer=${answer:-Y}
        if [[ $answer =~ ^[Yy]$ ]]; then
            git init
            echo -e "${GREEN}Git repository initialized.${NC}"
        else
            echo -e "${RED}Cannot proceed without a Git repository.${NC}"
            exit 1
        fi
    fi
}

# Function to check if Docker is present
check_docker() {
    if ! [ -f "Dockerfile" ] && ! [ -f "docker-compose.yml" ] && ! [ -f "docker-compose.yaml" ]; then
        echo -e "${YELLOW}Warning: No Docker configuration found (Dockerfile or docker-compose.yml)${NC}"
        read -p "Do you want to continue anyway? [Y/n] " answer
        answer=${answer:-Y}
        if [[ ! $answer =~ ^[Yy]$ ]]; then
            echo -e "${RED}Operation cancelled.${NC}"
            exit 1
        fi
    fi
}

# Main script
echo "🔍 Checking repository status..."
check_git_repo
check_docker

# Get the submodule URL from the user
if [ -z "$1" ]; then
    echo -e "${YELLOW}Please provide the Git repository URL for the addon:${NC}"
    read repo_url
else
    repo_url=$1
fi

# Get the target directory (optional)
if [ -z "$2" ]; then
    echo -e "${YELLOW}Please provide the target directory for the addon (press enter for default 'addons/'):${NC}"
    read target_dir
    target_dir=${target_dir:-addons}
else
    target_dir=$2
fi

# Create the addons directory if it doesn't exist
mkdir -p "$target_dir"

# Add the submodule
echo "📦 Adding submodule from $repo_url to $target_dir..."
if git submodule add "$repo_url" "$target_dir"; then
    echo -e "${GREEN}✅ Submodule added successfully!${NC}"
    echo "🔄 Initializing and updating submodule..."
    git submodule update --init --recursive
    echo -e "${GREEN}✨ Done! The addon has been added as a submodule.${NC}"
else
    echo -e "${RED}❌ Failed to add submodule. Please check the repository URL and try again.${NC}"
    exit 1
fi 