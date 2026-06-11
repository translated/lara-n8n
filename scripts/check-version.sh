#!/usr/bin/env bash
# Fails if the package version is out of sync across the three places that must
# agree: package.json, the inlined PACKAGE_VERSION header constant, and the
# README version badge. See CLAUDE.md "Versioning".
set -euo pipefail

HEADER_FILE="nodes/LaraTranslate/config/clientHeaders.ts"
README_FILE="README.md"

pkg=$(node -p "require('./package.json').version")
header=$(sed -nE "s/^export const PACKAGE_VERSION = '([^']+)';.*/\1/p" "$HEADER_FILE")
readme=$(sed -nE 's@.*img\.shields\.io/badge/version-([^-]+)-blue.*@\1@p' "$README_FILE")

fail=0
if [ -z "$header" ]; then
	echo "::error::Could not read PACKAGE_VERSION from $HEADER_FILE"
	fail=1
elif [ "$pkg" != "$header" ]; then
	echo "::error::Version mismatch: package.json=$pkg but $HEADER_FILE PACKAGE_VERSION=$header"
	fail=1
fi

if [ -z "$readme" ]; then
	echo "::error::Could not read the version badge from $README_FILE"
	fail=1
elif [ "$pkg" != "$readme" ]; then
	echo "::error::Version mismatch: package.json=$pkg but README badge=$readme"
	fail=1
fi

if [ "$fail" -ne 0 ]; then
	echo "Update the version in all three places to match package.json ($pkg)."
	exit 1
fi

echo "Version consistent across package.json, clientHeaders.ts and README: $pkg"
