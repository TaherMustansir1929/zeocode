#!/usr/bin/env bash
# scripts/build-cli.sh
set -e

# Function to extract env variables from .env if not already defined in shell environment
get_env_var() {
  local var_name=$1
  local default_val=$2
  
  if [ -n "${!var_name}" ]; then
    echo "${!var_name}"
  elif [ -f .env ]; then
    local val=$(grep -E "^${var_name}=" .env | cut -d'=' -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
    if [ -n "$val" ]; then
      echo "$val"
    else
      echo "$default_val"
    fi
  else
    echo "$default_val"
  fi
}

# Resolve variables
CLERK_FRONTEND_API=$(get_env_var "CLERK_FRONTEND_API" "")
CLERK_OAUTH_CLIENT_ID=$(get_env_var "CLERK_OAUTH_CLIENT_ID" "")
API_URL=$(get_env_var "API_URL" "http://localhost:3000")

# Validate
if [ -z "$CLERK_FRONTEND_API" ] || [ -z "$CLERK_OAUTH_CLIENT_ID" ]; then
  echo "Error: CLERK_FRONTEND_API or CLERK_OAUTH_CLIENT_ID is not defined in the environment or .env file."
  echo "Please set them before compiling the CLI."
  exit 1
fi

echo "Building zeocode CLI with configuration:"
echo "  - API_URL: $API_URL"
echo "  - CLERK_FRONTEND_API: $CLERK_FRONTEND_API"
echo "  - CLERK_OAUTH_CLIENT_ID: $CLERK_OAUTH_CLIENT_ID"
echo ""

# Ensure output directory exists
mkdir -p dist

# Detect host target
UNAME_S="$(uname -s)"
UNAME_M="$(uname -m)"
HOST_OS=""
HOST_ARCH=""

case "$UNAME_S" in
  Darwin) HOST_OS="macos" ;;
  Linux) HOST_OS="linux" ;;
  *) HOST_OS="unknown" ;;
esac

case "$UNAME_M" in
  x86_64|amd64) HOST_ARCH="x64" ;;
  arm64|aarch64) HOST_ARCH="arm64" ;;
  *) HOST_ARCH="unknown" ;;
esac

BUILD_ALL=false
if [ "$1" = "--all" ] || [ "$1" = "all" ]; then
  BUILD_ALL=true
fi

# Define compile targets
if [ "$BUILD_ALL" = true ]; then
  TARGETS=(
    "bun-linux-x64:zeocode-linux-x64"
    "bun-linux-arm64:zeocode-linux-arm64"
    "bun-darwin-x64:zeocode-macos-x64"
    "bun-darwin-arm64:zeocode-macos-arm64"
  )
else
  # Build only for the host platform
  if [ "$HOST_OS" = "unknown" ] || [ "$HOST_ARCH" = "unknown" ]; then
    echo "Warning: Unknown host OS/architecture. Compiling default binary as dist/zeocode..."
    TARGETS=("bun:zeocode")
  else
    TARGETS=("bun:zeocode-${HOST_OS}-${HOST_ARCH}")
  fi
fi

# Build for each target
for TARGET_INFO in "${TARGETS[@]}"; do
  TARGET=${TARGET_INFO%%:*}
  OUTFILE=${TARGET_INFO#*:}
  
  echo "Compiling for target: $TARGET -> dist/$OUTFILE..."
  
  # If compiling for host, let bun auto-determine target by omitting or passing 'bun'
  if [ "$TARGET" = "bun" ]; then
    bun build packages/cli/src/index.tsx \
      --compile \
      --define "process.env.CLERK_FRONTEND_API=\"$CLERK_FRONTEND_API\"" \
      --define "process.env.CLERK_OAUTH_CLIENT_ID=\"$CLERK_OAUTH_CLIENT_ID\"" \
      --define "process.env.API_URL=\"$API_URL\"" \
      --outfile "dist/$OUTFILE"
  else
    bun build packages/cli/src/index.tsx \
      --compile \
      --target="$TARGET" \
      --define "process.env.CLERK_FRONTEND_API=\"$CLERK_FRONTEND_API\"" \
      --define "process.env.CLERK_OAUTH_CLIENT_ID=\"$CLERK_OAUTH_CLIENT_ID\"" \
      --define "process.env.API_URL=\"$API_URL\"" \
      --outfile "dist/$OUTFILE"
  fi
    
  echo "Successfully built dist/$OUTFILE"
done

echo ""
echo "All builds completed! You can find the binaries in the 'dist' directory."
