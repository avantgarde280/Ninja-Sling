package com.kagesling.game.data

import androidx.compose.ui.graphics.Color

enum class NinjaType(
    val displayName: String,
    val abilityName: String,
    val radius: Float,
    val density: Float,
    val restitution: Float,
    val launchScale: Float
) {
    SHINOBI("Shadow Shinobi", "Shadow Dash", 20f, 1.0f, 0.44f, 1.0f),
    KUNOICHI("Twin Kunoichi", "Shuriken Split", 17f, 0.85f, 0.48f, 1.05f),
    ONI_BUSTER("Thunder Oni-Buster", "Smoke Blast", 25f, 1.45f, 0.30f, 0.94f),
    TENGU("Cyclone Tengu", "Meteor Dive", 20f, 1.15f, 0.36f, 1.02f)
}

enum class MaterialType(
    val maxHp: Float,
    val massFactor: Float,
    val scoreValue: Int,
    val impactThreshold: Float,
    val color: Color,
    val strokeColor: Color
) {
    BAMBOO(38f, 0.8f, 250, 140f, Color(0xFF65A30D), Color(0xFF365314)),
    WOOD(68f, 1.1f, 400, 175f, Color(0xFFB45309), Color(0xFF451A03)),
    ICE(34f, 0.9f, 350, 115f, Color(0xB87DD3FC), Color(0xFFE0F2FE)),
    STONE(155f, 2.1f, 750, 260f, Color(0xFF64748B), Color(0xFF1E293B)),
    TNT(26f, 1.0f, 900, 130f, Color(0xFFB91C1C), Color(0xFF450A0A))
}

enum class EnemyType(val radius: Float, val maxHp: Float, val scoreValue: Int, val color: Color) {
    GRUNT(21f, 32f, 2500, Color(0xFF4D7C0F)),
    GUARD(24f, 62f, 4000, Color(0xFF334155)),
    SHOGUN(29f, 115f, 8500, Color(0xFF991B1B))
}

data class SkinPalette(
    val cowl: Color,
    val accent: Color,
    val ribbon: Color,
    val mask: Color,
    val crest: Color
)

/**
 * Purely cosmetic character skin. Zero gameplay or physics modifiers.
 */
data class NinjaSkin(
    val id: String,
    val ninjaType: NinjaType,
    val name: String,
    val cost: Int,
    val palette: SkinPalette
)

data class BlockDef(
    val relX: Float,
    val heightAboveGround: Float,
    val w: Float,
    val h: Float,
    val material: MaterialType
)

data class EnemyDef(
    val relX: Float,
    val heightAboveGround: Float,
    val type: EnemyType
)

data class LevelDef(
    val id: Int,
    val name: String,
    val region: String,
    val ninjas: List<NinjaType>,
    val starThresholds: Triple<Int, Int, Int>,
    val fortressOriginX: Float,
    val blocks: List<BlockDef>,
    val enemies: List<EnemyDef>
)

object GameCatalog {
    const val WORLD_WIDTH = 1800f
    const val WORLD_HEIGHT = 760f
    const val GROUND_Y = 620f
    const val SLING_X = 240f
    const val SLING_Y = 500f

    val skins: List<NinjaSkin> = listOf(
        NinjaSkin("shinobi_crimson", NinjaType.SHINOBI, "Crimson Shadow", 0, SkinPalette(Color(0xFF1E2438), Color(0xFFE11D48), Color(0xFFFB7185), Color(0xFFF5D0A9), Color(0xFFF8FAFC))),
        NinjaSkin("shinobi_ivory", NinjaType.SHINOBI, "White Fang", 120, SkinPalette(Color(0xFFE2E8F0), Color(0xFF0284C7), Color(0xFF38BDF8), Color(0xFFF1C6A0), Color(0xFF0F172A))),
        NinjaSkin("shinobi_gold", NinjaType.SHINOBI, "Gilded Anbu", 240, SkinPalette(Color(0xFF18181B), Color(0xFFD97706), Color(0xFFFBBF24), Color(0xFFFDE68A), Color(0xFFFEF3C7))),

        NinjaSkin("kunoichi_jade", NinjaType.KUNOICHI, "Jade Lotus", 0, SkinPalette(Color(0xFF134E4A), Color(0xFF10B981), Color(0xFF34D399), Color(0xFFF5D0A9), Color(0xFFECFDF5))),
        NinjaSkin("kunoichi_sakura", NinjaType.KUNOICHI, "Sakura Veil", 140, SkinPalette(Color(0xFF4C1D4B), Color(0xFFEC4899), Color(0xFFF9A8D4), Color(0xFFF7D5B6), Color(0xFFFDF2F8))),
        NinjaSkin("kunoichi_moonlight", NinjaType.KUNOICHI, "Moonlight Mist", 260, SkinPalette(Color(0xFF312E81), Color(0xFF06B6D4), Color(0xFF67E8F9), Color(0xFFF5D0A9), Color(0xFFECFEFF))),

        NinjaSkin("oni_amber", NinjaType.ONI_BUSTER, "Amber Kabuto", 0, SkinPalette(Color(0xFF451A03), Color(0xFFF97316), Color(0xFFFBBF24), Color(0xFFF59E0B), Color(0xFFFDE68A))),
        NinjaSkin("oni_obsidian", NinjaType.ONI_BUSTER, "Obsidian Iron", 160, SkinPalette(Color(0xFF27272A), Color(0xFFDC2626), Color(0xFFF87171), Color(0xFFEF4444), Color(0xFFFCA5A5))),
        NinjaSkin("oni_azure", NinjaType.ONI_BUSTER, "Azure Raijin", 300, SkinPalette(Color(0xFF1E3A8A), Color(0xFF3B82F6), Color(0xFF93C5FD), Color(0xFFEAB308), Color(0xFFFEF08A))),

        NinjaSkin("tengu_cobalt", NinjaType.TENGU, "Cobalt Gale", 0, SkinPalette(Color(0xFF1E293B), Color(0xFF3B82F6), Color(0xFF60A5FA), Color(0xFFCBD5E1), Color(0xFFF8FAFC))),
        NinjaSkin("tengu_crimson", NinjaType.TENGU, "Scarlet Crow", 180, SkinPalette(Color(0xFF1C1917), Color(0xFFB91C1C), Color(0xFFFB7185), Color(0xFFDC2626), Color(0xFFFCA5A5))),
        NinjaSkin("tengu_emerald", NinjaType.TENGU, "Jade Falcon", 320, SkinPalette(Color(0xFF064E3B), Color(0xFF10B981), Color(0xFF6EE7B7), Color(0xFFF59E0B), Color(0xFFFDE68A)))
    )

    val defaultEquipped: Map<NinjaType, String> = mapOf(
        NinjaType.SHINOBI to "shinobi_crimson",
        NinjaType.KUNOICHI to "kunoichi_jade",
        NinjaType.ONI_BUSTER to "oni_amber",
        NinjaType.TENGU to "tengu_cobalt"
    )

    fun skinById(id: String?): NinjaSkin = skins.firstOrNull { it.id == id } ?: skins.first()

    val levels: List<LevelDef> = listOf(
        LevelDef(
            id = 1,
            name = "Bamboo Gatehouse",
            region = "Outer Valley Dojo",
            ninjas = listOf(NinjaType.SHINOBI, NinjaType.SHINOBI, NinjaType.KUNOICHI, NinjaType.SHINOBI),
            starThresholds = Triple(18000, 28000, 36000),
            fortressOriginX = 1120f,
            blocks = listOf(
                BlockDef(-100f, 50f, 22f, 100f, MaterialType.BAMBOO),
                BlockDef(0f, 50f, 22f, 100f, MaterialType.BAMBOO),
                BlockDef(-50f, 110f, 136f, 20f, MaterialType.WOOD),
                BlockDef(110f, 50f, 22f, 100f, MaterialType.BAMBOO),
                BlockDef(210f, 50f, 22f, 100f, MaterialType.BAMBOO),
                BlockDef(160f, 110f, 136f, 20f, MaterialType.WOOD),
                BlockDef(55f, 130f, 150f, 20f, MaterialType.BAMBOO),
                BlockDef(10f, 185f, 20f, 90f, MaterialType.WOOD),
                BlockDef(100f, 185f, 20f, 90f, MaterialType.WOOD),
                BlockDef(55f, 240f, 130f, 20f, MaterialType.WOOD)
            ),
            enemies = listOf(
                EnemyDef(-50f, 22f, EnemyType.GRUNT),
                EnemyDef(160f, 22f, EnemyType.GRUNT),
                EnemyDef(55f, 162f, EnemyType.GRUNT)
            )
        ),
        LevelDef(
            id = 2,
            name = "Shoji Lantern Shrine",
            region = "Maple Courtyard",
            ninjas = listOf(NinjaType.KUNOICHI, NinjaType.SHINOBI, NinjaType.TENGU, NinjaType.KUNOICHI),
            starThresholds = Triple(22000, 32000, 40000),
            fortressOriginX = 1150f,
            blocks = listOf(
                BlockDef(-140f, 25f, 70f, 50f, MaterialType.STONE),
                BlockDef(140f, 25f, 70f, 50f, MaterialType.STONE),
                BlockDef(0f, 24f, 46f, 48f, MaterialType.TNT),
                BlockDef(-140f, 100f, 20f, 100f, MaterialType.ICE),
                BlockDef(-55f, 50f, 20f, 100f, MaterialType.ICE),
                BlockDef(55f, 50f, 20f, 100f, MaterialType.ICE),
                BlockDef(140f, 100f, 20f, 100f, MaterialType.ICE),
                BlockDef(0f, 110f, 142f, 20f, MaterialType.WOOD),
                BlockDef(-120f, 160f, 76f, 20f, MaterialType.BAMBOO),
                BlockDef(120f, 160f, 76f, 20f, MaterialType.BAMBOO),
                BlockDef(-45f, 170f, 20f, 100f, MaterialType.WOOD),
                BlockDef(45f, 170f, 20f, 100f, MaterialType.WOOD),
                BlockDef(0f, 230f, 130f, 20f, MaterialType.WOOD)
            ),
            enemies = listOf(
                EnemyDef(-96f, 22f, EnemyType.GRUNT),
                EnemyDef(96f, 22f, EnemyType.GRUNT),
                EnemyDef(0f, 144f, EnemyType.GUARD)
            )
        ),
        LevelDef(
            id = 3,
            name = "Frozen Torii Bridge",
            region = "North Ridge",
            ninjas = listOf(NinjaType.KUNOICHI, NinjaType.TENGU, NinjaType.SHINOBI, NinjaType.ONI_BUSTER),
            starThresholds = Triple(24000, 35000, 44000),
            fortressOriginX = 1140f,
            blocks = listOf(
                BlockDef(-160f, 55f, 24f, 110f, MaterialType.ICE),
                BlockDef(-70f, 55f, 24f, 110f, MaterialType.ICE),
                BlockDef(-115f, 120f, 126f, 20f, MaterialType.STONE),
                BlockDef(10f, 55f, 24f, 110f, MaterialType.WOOD),
                BlockDef(120f, 55f, 24f, 110f, MaterialType.WOOD),
                BlockDef(65f, 120f, 146f, 20f, MaterialType.WOOD),
                BlockDef(175f, 55f, 24f, 110f, MaterialType.ICE),
                BlockDef(255f, 55f, 24f, 110f, MaterialType.ICE),
                BlockDef(215f, 120f, 116f, 20f, MaterialType.ICE),
                BlockDef(-145f, 180f, 20f, 100f, MaterialType.BAMBOO),
                BlockDef(-85f, 180f, 20f, 100f, MaterialType.BAMBOO),
                BlockDef(-115f, 240f, 100f, 20f, MaterialType.WOOD),
                BlockDef(22f, 180f, 20f, 100f, MaterialType.ICE),
                BlockDef(108f, 180f, 20f, 100f, MaterialType.ICE),
                BlockDef(65f, 240f, 118f, 20f, MaterialType.ICE),
                BlockDef(65f, 154f, 46f, 48f, MaterialType.TNT)
            ),
            enemies = listOf(
                EnemyDef(-115f, 22f, EnemyType.GRUNT),
                EnemyDef(65f, 24f, EnemyType.GUARD),
                EnemyDef(-115f, 152f, EnemyType.GRUNT),
                EnemyDef(215f, 22f, EnemyType.GRUNT)
            )
        ),
        LevelDef(
            id = 4,
            name = "Twin Watchtowers",
            region = "Crimson Gorge",
            ninjas = listOf(NinjaType.SHINOBI, NinjaType.ONI_BUSTER, NinjaType.TENGU, NinjaType.KUNOICHI),
            starThresholds = Triple(26000, 37000, 46000),
            fortressOriginX = 1130f,
            blocks = listOf(
                BlockDef(-165f, 55f, 24f, 110f, MaterialType.STONE),
                BlockDef(-75f, 55f, 24f, 110f, MaterialType.STONE),
                BlockDef(-120f, 120f, 126f, 20f, MaterialType.WOOD),
                BlockDef(-155f, 180f, 20f, 100f, MaterialType.WOOD),
                BlockDef(-85f, 180f, 20f, 100f, MaterialType.WOOD),
                BlockDef(-120f, 240f, 110f, 20f, MaterialType.BAMBOO),
                BlockDef(0f, 30f, 80f, 60f, MaterialType.WOOD),
                BlockDef(0f, 84f, 46f, 48f, MaterialType.TNT),
                BlockDef(75f, 55f, 24f, 110f, MaterialType.STONE),
                BlockDef(165f, 55f, 24f, 110f, MaterialType.STONE),
                BlockDef(120f, 120f, 126f, 20f, MaterialType.WOOD),
                BlockDef(85f, 180f, 20f, 100f, MaterialType.WOOD),
                BlockDef(155f, 180f, 20f, 100f, MaterialType.WOOD),
                BlockDef(120f, 240f, 110f, 20f, MaterialType.BAMBOO),
                BlockDef(120f, 295f, 20f, 90f, MaterialType.ICE)
            ),
            enemies = listOf(
                EnemyDef(-120f, 24f, EnemyType.GUARD),
                EnemyDef(-120f, 152f, EnemyType.GRUNT),
                EnemyDef(120f, 24f, EnemyType.GUARD),
                EnemyDef(120f, 152f, EnemyType.GRUNT)
            )
        ),
        LevelDef(
            id = 5,
            name = "Granite Fortress Keep",
            region = "Thunder Peaks",
            ninjas = listOf(NinjaType.ONI_BUSTER, NinjaType.TENGU, NinjaType.ONI_BUSTER, NinjaType.SHINOBI),
            starThresholds = Triple(28000, 40000, 50000),
            fortressOriginX = 1160f,
            blocks = listOf(
                BlockDef(-195f, 60f, 32f, 120f, MaterialType.STONE),
                BlockDef(-195f, 170f, 30f, 100f, MaterialType.STONE),
                BlockDef(-115f, 55f, 24f, 110f, MaterialType.STONE),
                BlockDef(0f, 55f, 24f, 110f, MaterialType.WOOD),
                BlockDef(115f, 55f, 24f, 110f, MaterialType.STONE),
                BlockDef(-60f, 120f, 116f, 20f, MaterialType.STONE),
                BlockDef(60f, 120f, 116f, 20f, MaterialType.STONE),
                BlockDef(58f, 24f, 46f, 48f, MaterialType.TNT),
                BlockDef(-88f, 180f, 22f, 100f, MaterialType.WOOD),
                BlockDef(0f, 180f, 22f, 100f, MaterialType.ICE),
                BlockDef(88f, 180f, 22f, 100f, MaterialType.WOOD),
                BlockDef(0f, 240f, 210f, 20f, MaterialType.WOOD),
                BlockDef(0f, 295f, 24f, 90f, MaterialType.BAMBOO)
            ),
            enemies = listOf(
                EnemyDef(-58f, 24f, EnemyType.GUARD),
                EnemyDef(-44f, 152f, EnemyType.GUARD),
                EnemyDef(44f, 152f, EnemyType.GRUNT),
                EnemyDef(175f, 22f, EnemyType.GRUNT)
            )
        ),
        LevelDef(
            id = 6,
            name = "Grand Shogun Citadel",
            region = "Imperial Summit",
            ninjas = listOf(NinjaType.SHINOBI, NinjaType.KUNOICHI, NinjaType.ONI_BUSTER, NinjaType.TENGU, NinjaType.ONI_BUSTER),
            starThresholds = Triple(34000, 48000, 60000),
            fortressOriginX = 1180f,
            blocks = listOf(
                BlockDef(-225f, 55f, 30f, 110f, MaterialType.STONE),
                BlockDef(-225f, 150f, 26f, 80f, MaterialType.ICE),
                BlockDef(-145f, 55f, 24f, 110f, MaterialType.STONE),
                BlockDef(-45f, 55f, 24f, 110f, MaterialType.WOOD),
                BlockDef(45f, 55f, 24f, 110f, MaterialType.WOOD),
                BlockDef(145f, 55f, 24f, 110f, MaterialType.STONE),
                BlockDef(-95f, 120f, 112f, 20f, MaterialType.STONE),
                BlockDef(0f, 120f, 74f, 20f, MaterialType.WOOD),
                BlockDef(95f, 120f, 112f, 20f, MaterialType.STONE),
                BlockDef(-95f, 24f, 46f, 48f, MaterialType.TNT),
                BlockDef(95f, 24f, 46f, 48f, MaterialType.TNT),
                BlockDef(-115f, 180f, 22f, 100f, MaterialType.WOOD),
                BlockDef(-35f, 180f, 22f, 100f, MaterialType.ICE),
                BlockDef(35f, 180f, 22f, 100f, MaterialType.ICE),
                BlockDef(115f, 180f, 22f, 100f, MaterialType.WOOD),
                BlockDef(0f, 240f, 260f, 20f, MaterialType.WOOD),
                BlockDef(-52f, 295f, 20f, 90f, MaterialType.BAMBOO),
                BlockDef(52f, 295f, 20f, 90f, MaterialType.BAMBOO),
                BlockDef(0f, 351f, 140f, 22f, MaterialType.WOOD)
            ),
            enemies = listOf(
                EnemyDef(0f, 24f, EnemyType.GUARD),
                EnemyDef(-75f, 152f, EnemyType.GRUNT),
                EnemyDef(75f, 152f, EnemyType.GRUNT),
                EnemyDef(0f, 280f, EnemyType.SHOGUN),
                EnemyDef(205f, 24f, EnemyType.GUARD)
            )
        )
    )
}
