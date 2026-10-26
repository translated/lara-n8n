#!/usr/bin/env bash
# Substitutes the metrics ingestion URL and channel key into the compiled
# bundle. n8n Cloud forbids `process` at runtime, so the values cannot be read
# from the environment by the node itself — they have to be baked in here.
#
# Must run AFTER the build: `pnpm run build` does `rimraf dist && tsc`, so a bake
# performed before it would be silently erased and the package would ship with
# the placeholders intact and metrics off.
set -euo pipefail

TARGET="dist/nodes/LaraTranslate/config/metricsConfig.js"

if [ ! -f "$TARGET" ]; then
	echo "::error::$TARGET not found. Run the build before baking."
	exit 1
fi

bake() {
	local name="$1" value="$2"
	local placeholder="__${name}__"

	if [ -z "$value" ]; then
		echo "$name is not set; leaving the placeholder in place (metrics stay off)."
		return
	fi

	# A control character as the sed delimiter so URLs and keys may contain
	# slashes, pipes or anything else but a newline.
	local delim=$'\x01'
	sed -i.bak "s${delim}${placeholder}${delim}${value}${delim}g" "$TARGET"
	rm -f "$TARGET.bak"

	if grep -q "$placeholder" "$TARGET"; then
		echo "::error::$name was set but its placeholder survived in $TARGET"
		exit 1
	fi
	echo "Baked $name into $TARGET"
}

bake METRICS_URL "${METRICS_URL:-}"
bake METRICS_API_KEY "${METRICS_API_KEY:-}"
