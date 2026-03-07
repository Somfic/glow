# Installation Guide

## Install from GitHub

You can install Glow UI directly from GitHub without needing to commit the `dist` folder to the repository:

```bash
# Using npm
npm install github:somfic/glow

# Using bun
bun add github:somfic/glow

# Install a specific version/tag
bun add github:somfic/glow#v0.2.0
```

## How It Works

When you install from GitHub:

1. **Clone**: The repository is cloned (without the `dist` folder)
2. **Install Dependencies**: `npm install` or `bun install` runs
3. **Auto-Build**: The `prepare` script automatically runs `svelte-package` to build the library
4. **Ready**: The package is ready to use with all components built in the `dist` folder

## For Development

If you're contributing to Glow UI:

```bash
# Clone the repo
git clone https://github.com/somfic/glow.git
cd glow

# Install dependencies
bun install

# The prepare script will auto-build the package
# dist/ folder is gitignored and won't be committed

# Start development server
bun run dev

# Build the package manually (if needed)
bun run package

# Run the full build (including site)
bun run build
```

## For Publishing

The GitHub Actions workflow automatically:
- Builds the package on each push
- Creates releases with version tags
- **Does NOT commit** the `dist` folder to the repo

Users installing from GitHub will have the package built automatically via the `prepare` script.

## Package Scripts

- `prepare` - Auto-runs after install to build the package
- `package` - Manually build the package to `dist/`
- `build` - Build the package + documentation site
- `dev` - Start development server
- `prepack` - Runs before `npm publish` to build and lint
