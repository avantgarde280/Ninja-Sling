# Kage Sling — Native Android (Kotlin + Jetpack Compose)

This `/android` directory contains the native Android application project mirroring the Kage Sling web game.

## Features Included
- **60Hz Fixed-Timestep 2D Physics (`PhysicsWorld.kt`)**: Gravity, block stacking, sleeping bodies for low-end Android battery/CPU efficiency, collision impulse damage, TNT chain explosions, and 4 ninja mid-air skills.
- **Procedural AudioTrack SFX (`SoundEngine.kt`)**: Synthesized PCM sound effects without external asset overhead.
- **Cosmetic Ninja Skin Armory (`GameModels.kt` & `GameScreen.kt`)**: 12 skins across 4 ninja classes (`Shadow Shinobi`, `Twin Kunoichi`, `Thunder Oni-Buster`, `Cyclone Tengu`), strictly cosmetic with zero physics modifications.
- **Google Play Games Services v2 (`PlayGamesManager.kt`)**: Silent sign-in, `LeaderboardsClient`, `SnapshotsClient` Cloud Saves, and `AchievementsClient` with `SharedPreferences` offline fallback.

## Building in Android Studio
1. Open `/android` in Android Studio Ladybug (or newer) with JDK 17.
2. Replace `game_services_project_id`, `leaderboard_campaign_total`, and achievement IDs in `app/src/main/res/values/strings.xml` with your Google Play Console IDs.
3. Build and run on an Android device or emulator (API 24+, landscape orientation).
