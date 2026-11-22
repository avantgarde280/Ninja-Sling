package com.kagesling.game.playgames

import android.app.Activity
import android.content.Context
import android.content.Intent
import com.google.android.gms.games.PlayGames
import com.google.android.gms.games.PlayGamesSdk
import com.google.android.gms.games.SnapshotsClient
import com.google.android.gms.games.snapshot.SnapshotMetadataChange
import com.kagesling.game.R
import com.kagesling.game.data.GameCatalog
import com.kagesling.game.data.NinjaType
import org.json.JSONArray
import org.json.JSONObject

data class PlayerSaveData(
    val playerName: String = "RoninPlayer",
    val coins: Int = 250,
    val unlockedSkins: Set<String> = setOf("shinobi_crimson", "kunoichi_jade", "oni_amber", "tengu_cobalt"),
    val equippedSkins: Map<NinjaType, String> = GameCatalog.defaultEquipped,
    val bestScores: Map<Int, Int> = emptyMap(),
    val bestStars: Map<Int, Int> = emptyMap(),
    val lowEndPerfMode: Boolean = false
) {
    fun totalCampaignScore(): Int = bestScores.values.sum()
    fun totalStars(): Int = bestStars.values.sum()

    fun toJson(): String {
        val root = JSONObject()
        root.put("playerName", playerName)
        root.put("coins", coins)
        root.put("lowEndPerfMode", lowEndPerfMode)
        root.put("unlockedSkins", JSONArray(unlockedSkins.toList()))
        val eqObj = JSONObject()
        equippedSkins.forEach { (k, v) -> eqObj.put(k.name, v) }
        root.put("equippedSkins", eqObj)
        val scObj = JSONObject()
        bestScores.forEach { (k, v) -> scObj.put(k.toString(), v) }
        root.put("bestScores", scObj)
        val stObj = JSONObject()
        bestStars.forEach { (k, v) -> stObj.put(k.toString(), v) }
        root.put("bestStars", stObj)
        return root.toString()
    }

    companion object {
        fun fromJson(json: String): PlayerSaveData {
            val obj = JSONObject(json)
            val unlocked = mutableSetOf("shinobi_crimson", "kunoichi_jade", "oni_amber", "tengu_cobalt")
            obj.optJSONArray("unlockedSkins")?.let { arr ->
                for (i in 0 until arr.length()) unlocked.add(arr.getString(i))
            }
            val equipped = GameCatalog.defaultEquipped.toMutableMap()
            obj.optJSONObject("equippedSkins")?.let { eq ->
                NinjaType.entries.forEach { nt ->
                    if (eq.has(nt.name)) equipped[nt] = eq.getString(nt.name)
                }
            }
            val scores = mutableMapOf<Int, Int>()
            obj.optJSONObject("bestScores")?.let { sc ->
                sc.keys().forEach { k -> k.toIntOrNull()?.let { id -> scores[id] = sc.getInt(k) } }
            }
            val stars = mutableMapOf<Int, Int>()
            obj.optJSONObject("bestStars")?.let { st ->
                st.keys().forEach { k -> k.toIntOrNull()?.let { id -> stars[id] = st.getInt(k) } }
            }
            return PlayerSaveData(
                playerName = obj.optString("playerName", "RoninPlayer"),
                coins = obj.optInt("coins", 250),
                unlockedSkins = unlocked,
                equippedSkins = equipped,
                bestScores = scores,
                bestStars = stars,
                lowEndPerfMode = obj.optBoolean("lowEndPerfMode", false)
            )
        }
    }
}

/**
 * Integrates Google Play Games Services v2:
 * - Silent Sign-In & Player Identity
 * - LeaderboardsClient (submitScore & native Leaderboard UI intent)
 * - SnapshotsClient (Cloud Save persistence across Android devices)
 * - AchievementsClient (unlock achievements)
 * Falls back cleanly to SharedPreferences for offline play.
 */
class PlayGamesManager(private val activity: Activity) {
    private val prefs = activity.getSharedPreferences("kage_sling_save", Context.MODE_PRIVATE)
    var signedIn: Boolean = false
        private set

    fun initialize(onReady: (PlayerSaveData) -> Unit) {
        PlayGamesSdk.initialize(activity)
        val local = loadLocal()

        PlayGames.getGamesSignInClient(activity).isAuthenticated.addOnCompleteListener { task ->
            signedIn = task.isSuccessful && task.result.isAuthenticated
            if (signedIn) {
                loadCloudSnapshot { cloud ->
                    onReady(cloud ?: local)
                }
            } else {
                onReady(local)
            }
        }
    }

    fun loadLocal(): PlayerSaveData {
        val raw = prefs.getString("snapshot_json", null) ?: return PlayerSaveData()
        return runCatching { PlayerSaveData.fromJson(raw) }.getOrDefault(PlayerSaveData())
    }

    fun saveAll(data: PlayerSaveData) {
        val json = data.toJson()
        prefs.edit().putString("snapshot_json", json).apply()

        if (signedIn) {
            val totalScore = data.totalCampaignScore().toLong()
            PlayGames.getLeaderboardsClient(activity)
                .submitScore(activity.getString(R.string.leaderboard_campaign_total), totalScore)
            saveCloudSnapshot(json, data.totalCampaignScore().toLong())
        }
    }

    fun unlockAchievement(resId: Int) {
        if (!signedIn) return
        PlayGames.getAchievementsClient(activity).unlock(activity.getString(resId))
    }

    fun showLeaderboard(onIntent: (Intent) -> Unit) {
        if (!signedIn) return
        PlayGames.getLeaderboardsClient(activity)
            .getLeaderboardIntent(activity.getString(R.string.leaderboard_campaign_total))
            .addOnSuccessListener { intent -> onIntent(intent) }
    }

    private fun saveCloudSnapshot(json: String, scoreValue: Long) {
        val snapshotsClient = PlayGames.getSnapshotsClient(activity)
        snapshotsClient.open("kage_sling_cloud", true, SnapshotsClient.RESOLUTION_POLICY_MOST_RECENTLY_MODIFIED)
            .addOnSuccessListener { result ->
                val snapshot = result.data ?: return@addOnSuccessListener
                snapshot.snapshotContents.writeBytes(json.toByteArray(Charsets.UTF_8))
                val metadata = SnapshotMetadataChange.Builder()
                    .setDescription("Kage Sling Progress")
                    .setPlayedTimeMillis(scoreValue)
                    .build()
                snapshotsClient.commitAndClose(snapshot, metadata)
            }
    }

    private fun loadCloudSnapshot(onLoaded: (PlayerSaveData?) -> Unit) {
        val snapshotsClient = PlayGames.getSnapshotsClient(activity)
        snapshotsClient.open("kage_sling_cloud", true, SnapshotsClient.RESOLUTION_POLICY_MOST_RECENTLY_MODIFIED)
            .addOnSuccessListener { result ->
                val bytes = result.data?.snapshotContents?.readFully()
                if (bytes != null) {
                    val parsed = runCatching { PlayerSaveData.fromJson(String(bytes, Charsets.UTF_8)) }.getOrNull()
                    onLoaded(parsed)
                } else {
                    onLoaded(null)
                }
            }
            .addOnFailureListener { onLoaded(null) }
    }
}
