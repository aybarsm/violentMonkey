#!/usr/bin/env bash

set -euo pipefail

PATH_SELF="$(realpath "${BASH_SOURCE[0]}")"
PATH_DIR_SELF="$(dirname "${PATH_SELF}")"

EXEC_ARGS=( 
    "serve" "webdav" "${PATH_DIR_SELF}" "--addr" "127.0.0.1:8901" 
    "--vfs-cache-mode" "off" "--dir-cache-time" "1s" "--vfs-read-chunk-size" "32M"
    "--vfs-read-chunk-size-limit" "off"
    "--log-level" "INFO"
)

exec rclone "${EXEC_ARGS[@]}"