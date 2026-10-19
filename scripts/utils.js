#!/usr/bin/env node

/**
 * Dataroid Cordova Plugin - Utility Functions
 */

"use strict";

const fs = require("fs");
const path = require("path");

/**
 * Recursively create directories
 * @param {string} dir - Directory path to create
 */
function mkdirRecursive(dir) {
  if (!fs.existsSync(dir)) {
    mkdirRecursive(path.dirname(dir));
    fs.mkdirSync(dir);
  }
}

/**
 * Copy a file from source to destination
 * @param {string} src - Source file path
 * @param {string} dest - Destination file path
 */
function copyFile(src, dest) {
  mkdirRecursive(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

/**
 * Create a transaction tracker for atomic hook mutations.
 *
 * Every file written by a hook should be tracked via `track(filePath)` BEFORE
 * the first write. On success the caller invokes `commit()` (a no-op that
 * clears the tracked state). On failure the caller invokes `rollback()` which
 * restores every tracked file to its pre-mutation content (or deletes it if
 * it did not exist before).
 *
 * Why: PRD Req 37 requires that hook scripts do not leave host projects in
 * half-mutated states after partial failures. The transaction tracker gives
 * each hook an all-or-nothing guarantee over the files it modifies.
 *
 * @returns {{ track: (filePath: string) => void, commit: () => void, rollback: () => void }}
 */
function createTransaction() {
  // Map<filePath, { existed: boolean, content: string|null }>
  var snapshots = new Map();

  return {
    /**
     * Snapshot the current content of `filePath` so it can be restored
     * on rollback. Safe to call multiple times for the same path – only
     * the first snapshot is kept.
     */
    track: function track(filePath) {
      if (snapshots.has(filePath)) return;
      if (fs.existsSync(filePath)) {
        snapshots.set(filePath, {
          existed: true,
          content: fs.readFileSync(filePath, "utf8"),
        });
      } else {
        snapshots.set(filePath, { existed: false, content: null });
      }
    },

    /**
     * Mark the transaction as successfully completed. Clears all
     * tracked snapshots so a subsequent rollback is a no-op.
     */
    commit: function commit() {
      snapshots.clear();
    },

    /**
     * Restore every tracked file to its pre-mutation state.
     * Files that did not exist before are deleted.
     * Returns an array of file paths that could not be restored.
     */
    rollback: function rollback() {
      var failures = [];
      for (var entry of snapshots) {
        var filePath = entry[0];
        var snapshot = entry[1];
        try {
          if (snapshot.existed) {
            fs.writeFileSync(filePath, snapshot.content, "utf8");
          } else if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (e) {
          failures.push(filePath + ": " + e.message);
        }
      }
      snapshots.clear();
      return failures;
    },
  };
}

module.exports = {
  mkdirRecursive,
  copyFile,
  createTransaction,
};
