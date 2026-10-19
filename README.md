# Dataroid Cordova Plugin SDK

A comprehensive analytics, push notifications, in-app messaging, and engagement SDK for Apache Cordova applications.

[![Cordova](https://img.shields.io/badge/cordova-%3E%3D12.0.0-blue)](https://cordova.apache.org/)
[![Android](https://img.shields.io/badge/cordova--android-%3E%3D12.0.0-green)](https://developer.android.com/)
[![iOS](https://img.shields.io/badge/cordova--ios-%3E%3D7.0.0-lightgrey)](https://developer.apple.com/)
[![Version](https://img.shields.io/badge/version-4.3.0-orange)](./docs/change_logs.md)

## Features

- **Screen Tracking** - Track user navigation and page views
- **Event Collection** - Custom event tracking with typed attributes
- **User Profile Management** - Set, update, and manage user data
- **E-commerce Events** - Track purchases, cart actions, and product views
- **Push Notifications** - Rich push notification support (opt-in)
- **In-App Messaging** - Display targeted messages
- **App Inbox** - Persistent message inbox
- **Context Triggers** - Trigger-based actions
- **Geofencing** - Location-based engagement (opt-in)
- **APM** - Application Performance Monitoring
- **Super Attributes** - Persistent custom attributes
- **Deep Linking** - Handle deep links and deferred deep links
- **Runtime Diagnostics** - `getSdkStatus()` for SDK health monitoring

## Requirements

- Node.js >= 18.0.0
- Cordova CLI >= 12.0.0
- cordova-android >= 12.0.0
- cordova-ios >= 7.0.0
- Xcode 26+
- iOS 13.0+
- Android API 21+ (host project `minSdk` inherited by default)

## Installation

### Baseline Install (Analytics Only)

The simplest install — analytics, event tracking, in-app messaging, and APM work out of the box. Push notifications are **disabled** by default.

```bash
cordova plugin add cordova-plugin-dataroid-sdk \
  --variable SDK_KEY="your-sdk-key" \
  --variable SERVER_URL="https://your-server-url" \
  --variable APP_GROUP_IDENTIFIER="group.com.yourcompany.yourapp"
```

> `APP_GROUP_IDENTIFIER` is required for iOS builds and must also be enabled as an App Group capability for the app target in Xcode. Android ignores it.

### Push-Enabled Install

Enables push notifications. Requires `google-services.json` in your project root (Android) and valid APNs configuration (iOS).

```bash
cordova plugin add cordova-plugin-dataroid-sdk \
  --variable SDK_KEY="your-sdk-key" \
  --variable SERVER_URL="https://your-server-url" \
  --variable APP_GROUP_IDENTIFIER="group.com.yourcompany.yourapp" \
  --variable PUSH_ENABLED="true"
```

### Geofence-Enabled Install

Enables location-based geofencing. This injects location permissions into your app.

```bash
cordova plugin add cordova-plugin-dataroid-sdk \
  --variable SDK_KEY="your-sdk-key" \
  --variable SERVER_URL="https://your-server-url" \
  --variable APP_GROUP_IDENTIFIER="group.com.yourcompany.yourapp" \
  --variable GEOFENCE_ENABLED="true"
```

### Rich Push (iOS)

The App Group identifier is already required for every iOS install; notification extensions (rich push media, delivery tracking) additionally need `PUSH_ENABLED`:

```bash
cordova plugin add cordova-plugin-dataroid-sdk \
  --variable SDK_KEY="your-sdk-key" \
  --variable SERVER_URL="https://your-server-url" \
  --variable PUSH_ENABLED="true" \
  --variable APP_GROUP_IDENTIFIER="group.com.yourcompany.yourapp"
```

### From GitHub

```bash
cordova plugin add https://github.com/dataroid/sdk-cordova.git \
  --variable SDK_KEY="your-sdk-key" \
  --variable SERVER_URL="https://your-server-url" \
  --variable APP_GROUP_IDENTIFIER="group.com.yourcompany.yourapp"
```

### Configuration Variables

| Variable                   | Required | Default | Description                                                                                |
| -------------------------- | -------- | ------- | ------------------------------------------------------------------------------------------ |
| `SDK_KEY`                  | Yes      | -       | Your Dataroid SDK key                                                                      |
| `SERVER_URL`               | Yes      | -       | Dataroid server URL (must be HTTPS)                                                        |
| `PUSH_ENABLED`             | No       | `false` | Enable push notifications                                                                  |
| `GEOFENCE_ENABLED`         | No       | `false` | Enable geofencing (injects location permissions)                                           |
| `DEEPLINK_SCHEME`          | No       | -       | Deep link scheme (e.g., `myapp`). Both scheme and host required.                           |
| `DEEPLINK_HOST`            | No       | -       | Deep link host (e.g., `example.com`). Both scheme and host required.                       |
| `APP_GROUP_IDENTIFIER`     | iOS: Yes | -       | iOS App Group identifier. Required on iOS — the native SDK does not initialize without it. |
| `LANGUAGE_CODE`            | No       | Auto    | Optional override; otherwise the native SDK detects the app language                       |
| `LOGS_ENABLED`             | No       | `false` | Enable native SDK debug logs at init time                                                  |
| `IN_APP_MESSAGING_ENABLED` | No       | `true`  | Enable in-app messages                                                                     |
| `APM_ENABLED`              | No       | `true`  | Enable APM                                                                                 |
| `APP_INBOX_ENABLED`        | No       | `true`  | Enable App Inbox                                                                           |

## Quick Start

The plugin automatically initializes on app launch using the configuration provided during installation. No manual `Application` class changes (Android) or `AppDelegate` edits (iOS) are required.

### Basic Usage

```javascript
// Enable debug logging (JS + native SDK)
Dataroid.setDebugEnabled(true);

// Track a screen view
Dataroid.viewStartedWithViewClass("HomeScreen", "Home");

// Collect a custom event
Dataroid.collectEvent("button_clicked", {
  buttonId: { type: "string", value: "signup_button" },
});

// Set user data
Dataroid.setUser(
  { customerId: "user123", email: "user@example.com" },
  { loyaltyLevel: { type: "string", value: "gold" } },
);

// Check SDK health
const status = await Dataroid.getSdkStatus();
console.log("SDK initialized:", status.initialized);
console.log("Enabled modules:", status.enabledModules);
```

## API Reference

### Promise vs Callback Pattern

All methods support both Promise-based and callback-based invocation:

```javascript
// Promise-based (modern)
try {
  const result = await Dataroid.collectEvent("my_event", {
    /* attrs */
  });
  console.log("Success:", result);
} catch (error) {
  console.error("Error:", error);
}

// Callback-based (traditional)
Dataroid.collectEvent(
  "my_event",
  {
    /* attrs */
  },
  function (result) {
    if (result.success) {
      console.log("Success:", result);
    } else {
      console.error("Error:", result);
    }
  },
);
```

### SDK Diagnostics

```javascript
// Get SDK initialization status and health info
const status = await Dataroid.getSdkStatus();
// Returns:
// {
//   success: true,
//   initialized: boolean,
//   sdkVersion: string,
//   framework: 'CORDOVA',
//   enabledModules: ['push', 'inAppMessaging', 'apm', ...],
//   lastErrorCode: string | null,
//   lastErrorMessage: string | null,
//   lastInitTimestamp: string | null
// }
```

### Screen Tracking

```javascript
// Basic screen tracking (deprecated - use viewStartedWithViewClass)
Dataroid.viewStarted("HomeScreen");
Dataroid.viewStopped("HomeScreen");

// Screen tracking with view class
Dataroid.viewStartedWithViewClass("HomeViewController", "Home");
Dataroid.viewStoppedWithViewClass("HomeViewController", "Home");

// Screen tracking with custom attributes
Dataroid.viewStartedWithExtras("ProductViewController", "Product Details", {
  productId: { type: "string", value: "SKU123" },
  category: { type: "string", value: "Electronics" },
});
Dataroid.viewStoppedWithExtras("ProductViewController", "Product Details", {
  productId: { type: "string", value: "SKU123" },
  category: { type: "string", value: "Electronics" },
});
```

### Event Collection

```javascript
// Simple event
Dataroid.collectEvent("user_action", null);

// Event with attributes
Dataroid.collectEvent("purchase_completed", {
  amount: { type: "amount", value: 99.99, currency: "USD" },
  itemCount: { type: "number", value: 3 },
  isFirstPurchase: { type: "boolean", value: true },
  purchaseDate: { type: "date", value: new Date().toISOString() },
});
```

### User Management

```javascript
// Set user with basic data
Dataroid.setUser(
  {
    customerId: "user123",
    email: "user@example.com",
    firstName: "John",
    lastName: "Doe",
    gender: "MALE", // MALE, FEMALE, NON_BINARY, UNKNOWN, UNDEFINED
    phoneNumber: "+1234567890",
    dateOfBirth: "1990-01-15",
  },
  null,
);

// Set user with extra attributes
Dataroid.setUser(
  { customerId: "user123" },
  {
    membershipLevel: { type: "string", value: "premium" },
    totalOrders: { type: "number", value: 42 },
  },
);

// Update the same user's profile and custom attributes
Dataroid.setUser(
  { customerId: "user123", firstName: "Jane" },
  { newAttribute: { type: "string", value: "newValue" } },
).catch(console.error);

// Clear user (logout)
Dataroid.clearUser();
```

`customerId` must be a non-empty string. To update a profile, call `setUser` again with the same ID. `updateUser` was removed in 4.3.0. See [User Profile](docs/users/user_profile.md) for examples.

### E-commerce Events

```javascript
// Product definition
const product = {
  id: "SKU123",
  name: "Wireless Headphones",
  quantity: 1,
  price: 149.99,
  currency: "USD",
  brand: "AudioBrand",
  category: "Electronics",
};

// View product
Dataroid.viewProduct(product, null);

// View category
Dataroid.viewCategory("Electronics", null);

// Search
Dataroid.search("wireless headphones", null);

// Add to cart
Dataroid.addToCart(product, 149.99, 149.99, null);

// Remove from cart
Dataroid.removeFromCart(product, 149.99, 0, null);

// Clear cart
Dataroid.clearCart(null);

// Start checkout
Dataroid.startCheckout(149.99, "USD", 1, null);

// Purchase
Dataroid.purchase(
  [product],
  {
    value: 149.99,
    currency: "USD",
    success: true,
    trxId: "TRX123456",
    paymentMethod: "credit_card",
  },
  null,
);

// Wishlist
Dataroid.addToWishList(product, null);
Dataroid.removeFromWishList(product, null);
```

### Push Notifications & Deep Links

```javascript
// Handle deep links
Dataroid.handleDeeplink(function (deeplinkUrl) {
  console.log("Received deep link:", deeplinkUrl);
  // Navigate to appropriate screen
});

// Track manually launched deep link
Dataroid.deeplinkLaunched("myapp://products/123");
```

### App Inbox

```javascript
// Get all messages
const result = await Dataroid.getAppInboxMessages(null);
console.log("Messages:", result.messages);

// Get filtered messages
const filteredResult = await Dataroid.getAppInboxMessages({
  type: "PUSH_MESSAGE", // PUSH_MESSAGE, INAPP_MESSAGE, GEOFENCE_MESSAGE, ACTION_BASED_MESSAGE
  status: "UNREAD", // UNREAD, READ, DISMISSED
});

// Mark as read
await Dataroid.readAppInboxMessage("messageId123");

// Delete message
await Dataroid.deleteAppInboxMessage("messageId123");

// Subscribe to new messages
Dataroid.subscribeToCreateAppInboxMessages(function (message) {
  console.log("New message:", message);
});

// Subscribe to message updates
Dataroid.subscribeToUpdateAppInboxMessages(function (message) {
  console.log("Message updated:", message);
});

// Subscribe to message deletions
Dataroid.subscribeToDeleteAppInboxMessages(function (messageId) {
  console.log("Message deleted:", messageId);
});

// Enable/disable inbox
Dataroid.enableAppInbox();
Dataroid.disableAppInbox();
```

### Context Triggers

```javascript
// Subscribe to context trigger results
Dataroid.subscribeContextTrigger(function (result) {
  console.log("Context trigger:", result.contextTriggerId);
  console.log("Machine output:", result.machineOutput);
});

// Unsubscribe
Dataroid.unsubscribeContextTrigger(myCallback);
```

### Super Attributes

```javascript
// Set super attribute
Dataroid.setSuperAttribute({
  key: "userSegment",
  type: "string", // string, number, float, boolean, date
  value: "premium",
});

// Get all super attributes (returns key-value object)
const attrs = await Dataroid.getAllSuperAttributes();
console.log("Attributes:", attrs.attributes);
// attrs.attributes is Record<string, any>, e.g. { userSegment: 'premium' }

// Clear specific attribute
Dataroid.clearSuperAttribute("userSegment");

// Clear all
Dataroid.clearAllSuperAttributes();
```

### Component Interaction Tracking

```javascript
// Button click
Dataroid.collectButtonClickEvent(
  {
    className: "UIButton",
    label: "Submit",
    accessibilityLabel: "Submit Form",
    componentId: "submit_btn",
    coordinates: { left: 0, top: 0, right: 100, bottom: 44 },
  },
  {
    viewClass: "FormViewController",
    viewLabel: "Form",
  },
);

// Text change
Dataroid.collectTextChangeEvent(
  {
    className: "UITextField",
    textValue: "user input",
    placeholder: "Enter text",
    componentId: "email_field",
  },
  null,
);

// Toggle change
Dataroid.collectToggleChangeEvent(
  {
    className: "UISwitch",
    isChecked: true,
    componentId: "notifications_toggle",
  },
  null,
);

// Touch/tap events
Dataroid.collectTouchEvent(
  {
    className: "UIView",
    touchPoint: { x: 150, y: 200 },
  },
  null,
);

Dataroid.collectDoubleTapEvent(
  {
    className: "UIImageView",
    touchPoint: { x: 150, y: 200 },
  },
  null,
);

Dataroid.collectLongPressEvent(
  {
    className: "UITableViewCell",
    touchPoint: { x: 150, y: 200 },
  },
  null,
);

// Swipe
Dataroid.collectSwipeEvent(
  {
    className: "UIScrollView",
    swipePoints: {
      swipeStart: { x: 100, y: 200 },
      swipeEnd: { x: 300, y: 200 },
    },
  },
  null,
);
```

### APM (Application Performance Monitoring)

```javascript
// Collect HTTP call
Dataroid.collectHttpCall({
  url: "https://api.example.com/users",
  method: "GET",
  statusCode: 200,
  duration: 245,
  success: true,
});

// Collect network error
Dataroid.collectNetworkError({
  url: "https://api.example.com/users",
  method: "GET",
  duration: 30000,
  type: "TIMEOUT_ERROR", // NO_CONNECTION_ERROR, SSL_ERROR, TIMEOUT_ERROR, UNKNOWN
  exception: "TimeoutException",
  message: "Request timed out after 30 seconds",
});

// Enable/disable APM
Dataroid.enableAPMEvents();
Dataroid.disableAPMEvents();
```

### Geofencing

```javascript
// Enable geofencing (requires location permissions)
Dataroid.enableGeofence();

// Disable geofencing
Dataroid.disableGeofence();
```

### Settings & Configuration

```javascript
// Enable/disable debug logging (affects both JS and native SDK)
Dataroid.setDebugEnabled(true);

// Get device ID
const result = await Dataroid.getDeviceId();
console.log("Device ID:", result.deviceId);

// Update language
Dataroid.updateLanguage("tr");

// Session management
Dataroid.setSessionDropDuration(900); // 15 minutes in seconds

// Enable/disable features
Dataroid.enableEventCollecting();
Dataroid.disableEventCollecting();

Dataroid.enableInAppMessaging();
Dataroid.disableInAppMessaging();
```

### Error Collection

```javascript
// Collect error
try {
  loadUserProfile();
} catch (error) {
  Dataroid.collectError(error).catch(function (err) {
    console.warn("Could not report the error:", err.message);
  });
}

// Or report a failure without an Error object
Dataroid.collectError({
  name: "NetworkError",
  message: "Failed to fetch user data",
}).catch(function (err) {
  console.warn("Could not report the error:", err.message);
});
```

`collectError` rejects when the error cannot be reported, for example when the SDK is not initialized. Handle the rejection, as above; the SDK never reports it as a crash.

## Platform-Specific Notes

### Android

**Automatic initialization:** The plugin uses a `ContentProvider`-based auto-init mechanism. No `Application` class changes are needed — the SDK initializes before your app code runs, even if you have a custom `Application` class.

**Repository access:** The Dataroid Maven repository (`nexus.commencis.com`) is automatically configured. No credentials are required.

**Firebase (Push Notifications):** When `PUSH_ENABLED=true`, place `google-services.json` in your Cordova project root. The install hook validates its presence and fails fast if missing.

**Permissions:** Permissions are injected conditionally based on your configuration:

- `INTERNET` and `ACCESS_NETWORK_STATE` — always included
- `POST_NOTIFICATIONS` — only when `PUSH_ENABLED=true`
- `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `ACCESS_BACKGROUND_LOCATION` — only when `GEOFENCE_ENABLED=true`

**minSdk:** The plugin does not force a `minSdkVersion`. It inherits your project's setting. If a feature requires a higher API level, the install hook emits a clear error.

### iOS

**Automatic initialization:** The plugin initializes in `pluginInitialize` and uses AppDelegate swizzling for push notification handling. No manual `AppDelegate` changes needed.

**CocoaPods:** The plugin declares a `Connect-SDK-iOS` pod dependency with `use_frameworks!`. If your Podfile has conflicting linkage settings, the install hook detects this and fails with guidance.

**App Groups:** Required. The native iOS SDK returns `nil` from initialization without an app group, so `scripts/ios_after_plugin_install.js` fails the install when `APP_GROUP_IDENTIFIER` is missing. Enable the same App Group for the app target in Xcode.

**Notification Extension:** When `PUSH_ENABLED=true`, the `DataroidNotificationServiceExtension` target is automatically created in your Xcode project. This is idempotent across repeated `cordova prepare` runs.

## Troubleshooting

### Install-Time Errors

The plugin uses standardized error codes for all install/prepare failures:

| Error Code                    | Cause                                                    | Fix                                                                         |
| ----------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------- |
| `DATAROID_E_CONFIG_REQUIRED`  | `SDK_KEY` or `SERVER_URL` is missing or empty            | Provide both required variables in `cordova plugin add`                     |
| `DATAROID_E_FIREBASE_MISSING` | `PUSH_ENABLED=true` but `google-services.json` not found | Place `google-services.json` in your Cordova project root                   |
| `DATAROID_E_LEGACY_CONFLICT`  | Manual/legacy Dataroid SDK integration detected          | Remove manual SDK references from your project before installing the plugin |
| `DATAROID_E_IOS_POD_CONFLICT` | Podfile has incompatible framework linkage               | Resolve Podfile conflicts per the error message guidance                    |
| `DATAROID_E_ROLLBACK_FAILED`  | Partial hook mutation rollback failed                    | Follow the manual cleanup steps printed in the error output                 |

### Runtime Errors

| Error Code                | Cause                                                   | Fix                                                              |
| ------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------- |
| `DATAROID_E_INIT_RUNTIME` | SDK failed to initialize (e.g., non-HTTPS `SERVER_URL`) | Check `getSdkStatus()` for details; ensure `SERVER_URL` is HTTPS |

### Common Issues

**Plugin installation fails:**

- Ensure Cordova CLI >= 12.0.0 and Node.js >= 18.0.0
- Check that `SDK_KEY` and `SERVER_URL` variables are provided
- Verify `SERVER_URL` uses HTTPS

**Push notifications not working (iOS):**

- Verify `PUSH_ENABLED=true` was set during install
- Verify Push Notification capability is enabled in Xcode
- Check APN certificates are configured correctly
- Ensure device token is registered (check console logs)

**Push notifications not working (Android):**

- Verify `PUSH_ENABLED=true` was set during install
- Verify `google-services.json` is in your project root
- Check Firebase configuration
- Ensure notification permissions are granted (Android 13+)

**Deep links not working:**

- Verify both `DEEPLINK_HOST` and `DEEPLINK_SCHEME` are configured (both are required)
- Check intent filters (Android) and URL schemes (iOS)
- Test with `adb shell am start` (Android) or URL scheme test (iOS)

### Debug Mode

Enable debug logging to troubleshoot issues:

```javascript
Dataroid.setDebugEnabled(true);
```

This enables both JavaScript-layer logging and native SDK verbose logging on both platforms.

Check native logs:

- **Android**: `adb logcat | grep Dataroid`
- **iOS**: Xcode console, filter by "Dataroid"

### Runtime Diagnostics

Use `getSdkStatus()` to check SDK health at runtime:

```javascript
const status = await Dataroid.getSdkStatus();
if (!status.initialized) {
  console.error(
    "SDK init failed:",
    status.lastErrorCode,
    status.lastErrorMessage,
  );
}
```

## TypeScript Support

Full TypeScript definitions are included:

```typescript
import Dataroid from "cordova-plugin-dataroid-sdk";
// or
declare var Dataroid: DataroidStatic;

// Use with full type safety
const result = await Dataroid.getDeviceId();
console.log(result.deviceId);

const status = await Dataroid.getSdkStatus();
console.log(status.initialized, status.enabledModules);
```

## When Manual Setup Is Required

The plugin is designed for zero-touch installation. However, some scenarios require manual steps due to Apple/Google policy constraints that cannot be automated by a Cordova plugin:

| Scenario                           | What's Needed                                                                                  | Why It Can't Be Automated                                                                      |
| ---------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **iOS Universal Links**            | Add Associated Domains entitlement in Xcode + host `apple-app-site-association` on your domain | Requires Apple Developer Portal domain verification and server-side file hosting               |
| **iOS APNs certificates**          | Configure push certificates/keys in Apple Developer Portal                                     | Portal access requires developer account authentication                                        |
| **Android ProGuard rules**         | Add Dataroid keep rules if minification is enabled                                             | ProGuard config varies per project; plugin cannot safely modify host rules                     |
| **iOS App Store push entitlement** | Change `aps-environment` from `development` to `production` before release                     | The plugin injects `development` by default; production requires manual switch or CI scripting |
| **Custom notification sounds**     | Place sound files in platform-specific resource directories                                    | Sound file selection is app-specific                                                           |

> If none of the above apply to your project, no manual steps are needed.

## Tested Cordova Versions

CI validates the plugin against a production-baseline (minimum non-EOL versions for App Store shipping) and latest-stable matrix:

| Component       | Production Baseline | Latest Stable |
| --------------- | ------------------- | ------------- |
| Cordova CLI     | 12.0.0              | 12.0.0        |
| cordova-android | 12.0.0              | 13.0.0        |
| cordova-ios     | 7.0.0               | 7.1.0         |
| Node.js         | 18                  | 18            |
| Java            | 17                  | 17            |

Smoke tests verify install hooks, config file generation, manifest/plist injection, and dependency declarations for each matrix entry. Actual platform builds are not tested in CI because the native Dataroid SDKs are proprietary.

## Versioning Policy

This project follows [Semantic Versioning](https://semver.org/):

- **Major** releases (e.g., 2.x → 3.0): Breaking changes to install flow, runtime defaults, native init mechanism, or JS API behavior. Always accompanied by a migration guide.
- **Minor** releases (e.g., 3.0 → 3.1): Backward-compatible additive features, new diagnostics, or new optional configuration variables.
- **Patch** releases (e.g., 3.0.16 → 3.0.17): Bug fixes, documentation improvements, and test coverage — no behavioral changes.

See [CHANGELOG.md](./CHANGELOG.md) for full release history.

## Migration from v2.x to v3.0

See [CHANGELOG.md](./CHANGELOG.md) for full details. Key breaking changes:

### `PUSH_ENABLED` default changed from `true` to `false`

If you relied on push being enabled by default, explicitly set `PUSH_ENABLED=true`:

```bash
# Before (v2.x) — push was enabled by default
cordova plugin add cordova-plugin-dataroid-sdk --variable SDK_KEY=... --variable SERVER_URL=...

# After (v3.0) — must explicitly enable push
cordova plugin add cordova-plugin-dataroid-sdk --variable SDK_KEY=... --variable SERVER_URL=... --variable PUSH_ENABLED=true
```

### Android `Application` class replacement removed

v3.0 uses a `ContentProvider`-based auto-init instead of replacing your `Application` class. If you had custom `MainApplication` code, it is no longer overwritten. Remove any manual Dataroid Application class references from your `AndroidManifest.xml`.

### `minSdkVersion` no longer forced

The plugin no longer forces `minSdkVersion = 24`. Your project's own `minSdk` setting is respected. If a feature requires a higher API level, the install hook tells you.

### `getAllSuperAttributes` response shape changed

The `attributes` field changed from `string[]` (array of keys) to `Record<string, any>` (key-value map). Update code that iterated over attribute names to handle the new object shape.

### `setDebugEnabled` now affects native SDK

Previously only toggled JS-layer logging. Now also enables/disables native SDK verbose logging on both platforms via the Cordova bridge.

### Permissions are now conditional

Permissions like `POST_NOTIFICATIONS` and location permissions are only injected when the corresponding feature is enabled. If you relied on these being always present, enable the relevant feature flag.

### Deep link config is conditional

Intent filters and URL scheme entries are only injected when both `DEEPLINK_SCHEME` and `DEEPLINK_HOST` are provided. Empty defaults no longer generate invalid manifest/plist entries. If you relied on deep link config always being present, set both variables explicitly.

### Engine requirements updated

- Cordova CLI: >= 12.0.0 (was >= 10.0.0)
- cordova-android: >= 12.0.0 (was >= 10.0.0)
- cordova-ios: >= 7.0.0 (was >= 6.0.0)
- Node.js: >= 18.0.0

### Rollback to v2.x

If you need to revert to the previous major version:

```bash
# 1. Remove v3.x plugin (uninstall hooks clean up injected config)
cordova plugin remove cordova-plugin-dataroid-sdk

# 2. Re-add the v2.x version
cordova plugin add cordova-plugin-dataroid-sdk@2 \
  --variable SDK_KEY="your-sdk-key" \
  --variable SERVER_URL="https://your-server-url"

# 3. Re-add platforms to ensure a clean state
cordova platform remove android && cordova platform add android
cordova platform remove ios && cordova platform add ios
```

> Note: v2.x requires manual `Application` class wiring on Android and does not support conditional permissions. Review the v2.x README for post-install steps.

## Releasing

Releases are fully automated via GitHub Actions. Pushing a version tag triggers the CI pipeline which runs tests, builds the package, publishes it to the Dataroid NPM registry, and creates a GitHub Release.

### Alpha Release

```bash
git tag 4.3.0-alpha.1
git push origin 4.3.0-alpha.1
```

This triggers the **Build & Publish Package** workflow (`release-rc-package.yml`). The package is published with the `alpha` dist-tag so consumers can install it explicitly without affecting the `latest` tag.

### Release Candidate

```bash
git tag 4.3.0-rc.1
git push origin 4.3.0-rc.1
```

This triggers the same workflow and publishes the package with the `rc` dist-tag.

### Stable Release

```bash
git tag 4.3.0
git push origin 4.3.0
```

This triggers the **Release Package** workflow (`release.yml`) which reuses the same build-and-publish pipeline. The package is published as `latest` and the GitHub Release is marked as a full release.

### What the Pipeline Does

1. Checks out the tagged commit
2. Runs `npm install && npm test`
3. Uses the tag directly as the package version (e.g., `4.3.0-alpha.1`, `4.3.0-rc.1`, or `4.3.0`)
4. Packs and publishes to `nexus.dataroid.com`
5. Uploads the `.tgz` artifact to GitHub
6. Creates a GitHub Release with auto-generated release notes

## Support

- Documentation: [https://docs.dataroid.com](https://docs.dataroid.com)
- Issues: [GitHub Issues](https://github.com/dataroid/sdk-cordova/issues)
- Email: support@dataroid.com

## License

UNLICENSED - Proprietary software. All rights reserved.
