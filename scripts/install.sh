#!/usr/bin/env bash
# scripts/install.sh
set -e

# Define styles
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
BOLD='\033[1m'

echo -e "${BLUE}${BOLD}=========================================${NC}"
echo -e "${BLUE}${BOLD}         Zeocode CLI Installer           ${NC}"
echo -e "${BLUE}${BOLD}=========================================${NC}"
echo ""

# Detect OS and architecture
UNAME_S="$(uname -s)"
UNAME_M="$(uname -m)"

OS=""
ARCH=""

case "$UNAME_S" in
  Darwin)
    OS="macos"
    ;;
  Linux)
    OS="linux"
    ;;
  *)
    echo -e "${RED}Error: Unsupported operating system: $UNAME_S${NC}"
    echo "Zeocode currently only supports Linux and macOS."
    exit 1
    ;;
esac

case "$UNAME_M" in
  x86_64|amd64)
    ARCH="x64"
    ;;
  arm64|aarch64)
    ARCH="arm64"
    ;;
  *)
    echo -e "${RED}Error: Unsupported architecture: $UNAME_M${NC}"
    exit 1
    ;;
esac

ASSET_NAME="zeocode-${OS}-${ARCH}"
DOWNLOAD_URL="https://github.com/TaherMustansir1929/zeocode/releases/latest/download/${ASSET_NAME}"
INSTALL_DIR="$HOME/.zeocode/bin"
INSTALL_PATH="$INSTALL_DIR/zeocode"

echo -e "System detected: ${BLUE}${OS} (${ARCH})${NC}"
echo -e "Installing to:   ${BLUE}${INSTALL_PATH}${NC}"
echo ""

# Create install directory if it doesn't exist
mkdir -p "$INSTALL_DIR"

# Download binary
echo -e "Downloading latest release..."
DOWNLOAD_SUCCESS=false

if command -v curl >/dev/null 2>&1; then
  if curl -fsSL --progress-bar -o "$INSTALL_PATH" "$DOWNLOAD_URL"; then
    DOWNLOAD_SUCCESS=true
  fi
elif command -v wget >/dev/null 2>&1; then
  if wget --show-progress -q -O "$INSTALL_PATH" "$DOWNLOAD_URL"; then
    DOWNLOAD_SUCCESS=true
  fi
fi

if [ "$DOWNLOAD_SUCCESS" = false ]; then
  echo -e "${RED}Error: Failed to download the binary from $DOWNLOAD_URL${NC}"
  echo "Please ensure the latest version is published to GitHub Releases:"
  echo -e "  - Repository: ${BLUE}TaherMustansir1929/zeocode${NC}"
  echo -e "  - Expected asset name: ${BLUE}${ASSET_NAME}${NC}"
  exit 1
fi

# Make binary executable
chmod +x "$INSTALL_PATH"
echo -e "${GREEN}✓ Successfully downloaded and configured executable.${NC}"
echo ""

# Configure PATH
PATH_LINE='export PATH="$HOME/.zeocode/bin:$PATH"'
PATH_CHANGED=false

add_to_config_if_missing() {
  local config_file=$1
  if [ -f "$config_file" ]; then
    if ! grep -Fq "$HOME/.zeocode/bin" "$config_file"; then
      echo "" >> "$config_file"
      echo "# Zeocode CLI" >> "$config_file"
      echo "$PATH_LINE" >> "$config_file"
      echo -e "${GREEN}✓ Added PATH configuration to $config_file${NC}"
      PATH_CHANGED=true
    fi
  fi
}

# Check zsh and bash configurations
if [[ ":$PATH:" != *":$HOME/.zeocode/bin:"* ]]; then
  add_to_config_if_missing "$HOME/.zshrc"
  add_to_config_if_missing "$HOME/.bashrc"
  add_to_config_if_missing "$HOME/.profile"
  add_to_config_if_missing "$HOME/.bash_profile"
  
  # Configure fish shell if present
  if command -v fish >/dev/null 2>&1; then
    FISH_CONFIG_DIR="$HOME/.config/fish"
    mkdir -p "$FISH_CONFIG_DIR"
    FISH_CONFIG="$FISH_CONFIG_DIR/config.fish"
    
    if ! grep -Fq 'fish_add_path $HOME/.zeocode/bin' "$FISH_CONFIG" 2>/dev/null; then
      echo "" >> "$FISH_CONFIG"
      echo "# Zeocode CLI" >> "$FISH_CONFIG"
      echo "fish_add_path \$HOME/.zeocode/bin" >> "$FISH_CONFIG"
      echo -e "${GREEN}✓ Added PATH configuration to $FISH_CONFIG${NC}"
      PATH_CHANGED=true
    fi
  fi
fi

echo -e "${GREEN}${BOLD}=========================================${NC}"
echo -e "${GREEN}${BOLD}     Zeocode CLI installed successfully! ${NC}"
echo -e "${GREEN}${BOLD}=========================================${NC}"
echo ""
echo -e "You can now run: ${BLUE}${BOLD}zeocode${NC}"
echo ""

if [ "$PATH_CHANGED" = true ]; then
  echo -e "${BLUE}Note:${NC} Please restart your terminal or run the following to apply the changes:"
  if [[ "$SHELL" == */zsh ]]; then
    echo -e "   ${BOLD}source ~/.zshrc${NC}"
  elif [[ "$SHELL" == */fish ]]; then
    echo -e "   ${BOLD}source ~/.config/fish/config.fish${NC}"
  else
    echo -e "   ${BOLD}source ~/.bashrc${NC}"
  fi
  echo ""
fi
