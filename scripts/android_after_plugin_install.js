#!/usr/bin/env node

/**
 * Dataroid Cordova Plugin - Android After Plugin Install Hook
 *
 * This script performs read-only validation when the plugin is installed:
 *   1. Validates that SDK_KEY and SERVER_URL are present and valid.
 *   2. Validates Firebase artifacts when PUSH_ENABLED=true.
 *   3. Validates minSdkVersion meets feature requirements.
 *   4. Detects legacy/manual Dataroid framework references that would
 *      conflict with the plugin's managed dependencies.
 *
 * All Android project configuration (permissions, deep link intent-filter,
 * google-services.json placement, Google Services Gradle plugin) is the
 * responsibility of the host app developer.
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { CODES, fail } = require("./errors");

module.exports = function androidAfterPluginInstall(context) {
  const projectRoot = context.opts.projectRoot;
  const platformRoot = path.join(projectRoot, "platforms", "android");

  console.log("[Dataroid] Running Android after_plugin_install hook...");

  if (!fs.existsSync(platformRoot)) {
    console.log("[Dataroid] Android platform not found, skipping...");
    return;
  }

  const valuesDir = path.join(
    platformRoot,
    "app",
    "src",
    "main",
    "res",
    "values",
  );
  const stringsXmlPath = path.join(valuesDir, "strings.xml");
  const cdvStringsXmlPath = path.join(valuesDir, "cdv_strings.xml");

  let config = readStringsConfig(stringsXmlPath);
  if (Object.keys(config).length === 0) {
    config = readStringsConfig(cdvStringsXmlPath);
  }

  validateRequiredConfig(config);

  const pushEnabled = config.dataroid_push_enabled === "true";
  if (pushEnabled) {
    validateFirebaseArtifacts(projectRoot, platformRoot);
  }

  validateMinSdkForFeatures(platformRoot, config);

  detectLegacyConflicts(platformRoot);

  console.log("[Dataroid] Android validation complete.");
};

// =====================================================================
// Configuration reading
// =====================================================================

/**
 * Read Dataroid config values from an Android string resource file
 * (strings.xml on cordova-android <= 14, cdv_strings.xml on >= 15).
 * Returns an object with key-value pairs for all dataroid_* entries.
 */
function readStringsConfig(stringsXmlPath) {
  const config = {};
  if (!fs.existsSync(stringsXmlPath)) {
    return config;
  }

  const content = fs.readFileSync(stringsXmlPath, "utf8");
  const re = /<string name="(dataroid_[^"]+)">([^<]*)<\/string>/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    config[m[1]] = m[2].trim();
  }
  return config;
}

/**
 * Read the Android app package name from AndroidManifest.xml.
 * Returns null if it cannot be determined.
 */
function readAppPackageName(platformRoot) {
  var manifestPath = path.join(
    platformRoot,
    "app",
    "src",
    "main",
    "AndroidManifest.xml",
  );
  if (!fs.existsSync(manifestPath)) return null;

  var manifest = fs.readFileSync(manifestPath, "utf8");
  var m = manifest.match(/<manifest[^>]*package="([^"]*)"/);
  return m ? m[1] : null;
}

// =====================================================================
// Validation
// =====================================================================

/**
 * Validate that SDK_KEY and SERVER_URL are present and valid.
 * Fails the build with DATAROID_E_CONFIG_REQUIRED if missing.
 * SERVER_URL must be a valid HTTPS URL (PRD Req 39).
 */
function validateRequiredConfig(config) {
  const sdkKey = config.dataroid_sdk_key;
  const serverUrl = config.dataroid_server_url;

  if (!sdkKey || sdkKey.startsWith("$")) {
    fail(
      CODES.DATAROID_E_CONFIG_REQUIRED,
      "SDK_KEY is required. Add --variable SDK_KEY=<your-key> to the cordova plugin add command.",
    );
  }

  if (!serverUrl || serverUrl.startsWith("$")) {
    fail(
      CODES.DATAROID_E_CONFIG_REQUIRED,
      "SERVER_URL is required. Add --variable SERVER_URL=<your-url> to the cordova plugin add command.",
    );
  }

  if (!serverUrl.startsWith("https://")) {
    fail(
      CODES.DATAROID_E_CONFIG_REQUIRED,
      "SERVER_URL must use HTTPS. Got: " +
        serverUrl +
        ". Use --variable SERVER_URL=https://your-server.example.com",
    );
  }
}

/**
 * Validate that google-services.json exists, is valid JSON, and contains
 * the expected structure when PUSH_ENABLED=true.
 * Fails the build with DATAROID_E_FIREBASE_MISSING if absent or malformed.
 *
 * PRD Req 33: "Firebase policy is enforced with deterministic path/variant
 * validation and standardized failure messages."
 */
function validateFirebaseArtifacts(projectRoot, platformRoot) {
  const googleServicesPath = path.join(projectRoot, "google-services.json");

  if (!fs.existsSync(googleServicesPath)) {
    fail(
      CODES.DATAROID_E_FIREBASE_MISSING,
      "google-services.json not found in project root (" +
        projectRoot +
        "). " +
        "Push notifications require Firebase configuration. " +
        "Download google-services.json from the Firebase Console and place it " +
        "in your project root directory, or set PUSH_ENABLED=false.",
    );
  }

  var content = fs.readFileSync(googleServicesPath, "utf8");
  var parsed;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    fail(
      CODES.DATAROID_E_FIREBASE_MISSING,
      "google-services.json is not valid JSON: " +
        e.message +
        ". " +
        "Download a fresh copy from the Firebase Console.",
    );
  }

  if (!parsed.project_info || !parsed.client || !Array.isArray(parsed.client)) {
    fail(
      CODES.DATAROID_E_FIREBASE_MISSING,
      "google-services.json is missing required fields (project_info, client). " +
        "The file may be corrupted or incomplete. " +
        "Download a fresh copy from the Firebase Console.",
    );
  }

  if (parsed.client.length === 0) {
    fail(
      CODES.DATAROID_E_FIREBASE_MISSING,
      "google-services.json has an empty 'client' array. " +
        "Register your Android app in the Firebase Console to generate a valid configuration.",
    );
  }

  var appPackageName = readAppPackageName(platformRoot);
  if (appPackageName) {
    var hasMatchingClient = parsed.client.some(function (c) {
      return (
        c.client_info &&
        c.client_info.android_client_info &&
        c.client_info.android_client_info.package_name === appPackageName
      );
    });
    if (!hasMatchingClient) {
      var firebasePackages = parsed.client
        .map(function (c) {
          return (
            c.client_info &&
            c.client_info.android_client_info &&
            c.client_info.android_client_info.package_name
          );
        })
        .filter(Boolean);
      fail(
        CODES.DATAROID_E_FIREBASE_MISSING,
        "google-services.json does not contain a client entry for package '" +
          appPackageName +
          "'. " +
          "Found packages: [" +
          firebasePackages.join(", ") +
          "]. " +
          "Register '" +
          appPackageName +
          "' in your Firebase project, " +
          "download an updated google-services.json, and place it in the project root.",
      );
    }
  }
}

// =====================================================================
// Legacy conflict detection (PRD Req 31)
// =====================================================================

/**
 * Detect legacy/manual Dataroid SDK integration that conflicts with the plugin.
 * Hard-fails with DATAROID_E_LEGACY_CONFLICT when conflicts are found.
 *
 * Checks:
 *  - Existing non-Dataroid android:name on <application> in AndroidManifest.xml
 *  - Manual dataroid-android-sdk (or legacy appconnect-android-sdk) dependency in the app's build.gradle
 */
function detectLegacyConflicts(platformRoot) {
  var manifestPath = path.join(
    platformRoot,
    "app",
    "src",
    "main",
    "AndroidManifest.xml",
  );
  if (fs.existsSync(manifestPath)) {
    var manifest = fs.readFileSync(manifestPath, "utf8");
    var appNameMatch = manifest.match(
      /<application[^>]*android:name="([^"]*)"/,
    );
    if (appNameMatch) {
      var appName = appNameMatch[1];
      if (/dataroid|appconnect|MainApplication/i.test(appName)) {
        fail(
          CODES.DATAROID_E_LEGACY_CONFLICT,
          'AndroidManifest.xml contains android:name="' +
            appName +
            '" ' +
            "which conflicts with the plugin's provider-based auto-initialization. " +
            "Remove the android:name attribute from <application> in your manifest. " +
            "The plugin now initializes via DataroidInitProvider (ContentProvider) " +
            "and no longer requires a custom Application class.",
        );
      }
    }
  }

  var appBuildGradlePath = path.join(platformRoot, "app", "build.gradle");
  if (fs.existsSync(appBuildGradlePath)) {
    var appGradle = fs.readFileSync(appBuildGradlePath, "utf8");
    if (
      /implementation\s+['"]com\.commencis:appconnect-android-sdk/.test(
        appGradle,
      ) ||
      /implementation\s+['"]com\.dataroid:dataroid-android-sdk/.test(appGradle)
    ) {
      fail(
        CODES.DATAROID_E_LEGACY_CONFLICT,
        "Manual Dataroid SDK dependency found in app/build.gradle. " +
          "This conflicts with the plugin's managed dependency. " +
          "Remove the 'com.dataroid:dataroid-android-sdk' (or legacy 'com.commencis:appconnect-android-sdk') " +
          "dependency from your app's build.gradle — the plugin manages this via plugin.gradle.",
      );
    }
  }
}

// =====================================================================
// Feature-specific minSdk validation (PRD Req 9)
// =====================================================================

/**
 * Validate that the host project's minSdkVersion meets feature requirements.
 * Geofencing requires API 21+ and background location requires API 29+.
 * Fails fast per PRD Req 9: feature-specific native constraints must fail
 * with explicit guidance.
 */
function validateMinSdkForFeatures(platformRoot, config) {
  const geofenceEnabled = config.dataroid_geofence_enabled === "true";
  if (!geofenceEnabled) return;

  const appBuildGradlePath = path.join(platformRoot, "app", "build.gradle");
  if (!fs.existsSync(appBuildGradlePath)) return;

  const appGradle = fs.readFileSync(appBuildGradlePath, "utf8");
  const minSdkMatch = appGradle.match(/minSdkVersion\s+(\d+)/);
  if (!minSdkMatch) return;

  const minSdk = parseInt(minSdkMatch[1], 10);
  if (isNaN(minSdk)) return;

  if (minSdk < 21) {
    fail(
      CODES.DATAROID_E_CONFIG_REQUIRED,
      "GEOFENCE_ENABLED=true requires minSdkVersion >= 21 (API 21+). " +
        "Current minSdkVersion is " +
        minSdk +
        ". " +
        "Either increase your minSdkVersion to 21 or higher, or set GEOFENCE_ENABLED=false.",
    );
  }
}

module.exports._testing = {
  readStringsConfig,
  readAppPackageName,
  validateRequiredConfig,
  validateFirebaseArtifacts,
  detectLegacyConflicts,
  validateMinSdkForFeatures,
};
