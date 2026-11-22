package com.kagesling.game.ui

import android.content.Intent
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kagesling.game.R
import com.kagesling.game.data.*
import com.kagesling.game.engine.PhysicsWorld
import com.kagesling.game.engine.SoundEngine
import com.kagesling.game.playgames.PlayGamesManager
import com.kagesling.game.playgames.PlayerSaveData
import kotlinx.coroutines.delay

enum class ScreenMode { TITLE, PLAYING, STAGE_SELECT, ARMORY }

@Composable
fun KageSlingApp(
    playGames: PlayGamesManager,
    onLaunchIntent: (Intent) -> Unit
) {
    var saveData by remember { mutableStateOf(playGames.loadLocal()) }
    var screenMode by remember { mutableStateOf(ScreenMode.TITLE) }
    var currentLevelId by remember { mutableIntStateOf(1) }
    var runKey by remember { mutableIntStateOf(1) }
    var paused by remember { mutableStateOf(false) }
    var muted by remember { mutableStateOf(false) }
    var roundResult by remember { mutableStateOf<Triple<Boolean, Int, Int>?>(null) }

    LaunchedEffect(Unit) {
        playGames.initialize { loaded -> saveData = loaded }
    }

    fun persist(next: PlayerSaveData) {
        saveData = next
        playGames.saveAll(next)
    }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = Color(0xFF0E111D)
    ) {
        when (screenMode) {
            ScreenMode.TITLE -> {
                TitleScreenView(
                    saveData = saveData,
                    playGamesSignedIn = playGames.signedIn,
                    onPlay = {
                        currentLevelId = 1
                        roundResult = null
                        paused = false
                        runKey++
                        screenMode = ScreenMode.PLAYING
                    },
                    onOpenStages = { screenMode = ScreenMode.STAGE_SELECT },
                    onOpenArmory = { screenMode = ScreenMode.ARMORY },
                    onOpenLeaderboard = {
                        playGames.showLeaderboard(onLaunchIntent)
                    },
                    onToggleLowEnd = {
                        persist(saveData.copy(lowEndPerfMode = !saveData.lowEndPerfMode))
                    }
                )
            }

            ScreenMode.STAGE_SELECT -> {
                StageSelectView(
                    saveData = saveData,
                    onSelect = { lvlId ->
                        currentLevelId = lvlId
                        roundResult = null
                        paused = false
                        runKey++
                        screenMode = ScreenMode.PLAYING
                    },
                    onBack = { screenMode = ScreenMode.TITLE }
                )
            }

            ScreenMode.ARMORY -> {
                SkinArmoryView(
                    saveData = saveData,
                    onUnlockOrEquip = { skin ->
                        if (saveData.unlockedSkins.contains(skin.id)) {
                            persist(
                                saveData.copy(
                                    equippedSkins = saveData.equippedSkins + (skin.ninjaType to skin.id)
                                )
                            )
                        } else if (saveData.coins >= skin.cost) {
                            persist(
                                saveData.copy(
                                    coins = saveData.coins - skin.cost,
                                    unlockedSkins = saveData.unlockedSkins + skin.id,
                                    equippedSkins = saveData.equippedSkins + (skin.ninjaType to skin.id)
                                )
                            )
                        }
                    },
                    onBack = { screenMode = ScreenMode.TITLE }
                )
            }

            ScreenMode.PLAYING -> {
                val level = GameCatalog.levels.first { it.id == currentLevelId }
                PlayfieldView(
                    level = level,
                    runKey = runKey,
                    paused = paused || roundResult != null,
                    muted = muted,
                    saveData = saveData,
                    roundResult = roundResult,
                    onTogglePause = { paused = !paused },
                    onToggleMute = {
                        muted = !muted
                        SoundEngine.muted = muted
                    },
                    onRestart = {
                        roundResult = null
                        paused = false
                        runKey++
                    },
                    onNextLevel = {
                        currentLevelId = (currentLevelId + 1).coerceAtMost(GameCatalog.levels.size)
                        roundResult = null
                        paused = false
                        runKey++
                    },
                    onExitTitle = {
                        roundResult = null
                        paused = false
                        screenMode = ScreenMode.TITLE
                    },
                    onRoundFinished = { won, destructionScore, unusedNinjas, _ ->
                        val total = destructionScore + (if (won) unusedNinjas * 10000 else 0)
                        val stars = if (!won) 0 else when {
                            total >= level.starThresholds.third -> 3
                            total >= level.starThresholds.second -> 2
                            else -> 1
                        }
                        if (won) {
                            playGames.unlockAchievement(R.string.achievement_first_strike)
                            if (level.id == GameCatalog.levels.last().id) {
                                playGames.unlockAchievement(R.string.achievement_shogun_vanquished)
                            }
                            val prevBest = saveData.bestScores[level.id] ?: 0
                            val prevStars = saveData.bestStars[level.id] ?: 0
                            val coinsEarned = 45 + stars * 25
                            persist(
                                saveData.copy(
                                    coins = saveData.coins + coinsEarned,
                                    bestScores = saveData.bestScores + (level.id to maxOf(prevBest, total)),
                                    bestStars = saveData.bestStars + (level.id to maxOf(prevStars, stars))
                                )
                            )
                        }
                        roundResult = Triple(won, total, stars)
                    }
                )
            }
        }
    }
}

@Composable
private fun TitleScreenView(
    saveData: PlayerSaveData,
    playGamesSignedIn: Boolean,
    onPlay: () -> Unit,
    onOpenStages: () -> Unit,
    onOpenArmory: () -> Unit,
    onOpenLeaderboard: () -> Unit,
    onToggleLowEnd: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(Color(0xFF12162B), Color(0xFF2B1C3D), Color(0xFF141829))
                )
            )
            .padding(28.dp)
    ) {
        Column(
            modifier = Modifier.align(Alignment.CenterStart).widthIn(max = 560.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Text(
                text = "KAGE SLING",
                color = Color.White,
                fontSize = 44.sp,
                fontWeight = FontWeight.ExtraBold
            )
            Text(
                text = "${saveData.playerName} · ${saveData.coins} Koban · ${saveData.totalStars()} Stars · " +
                    if (playGamesSignedIn) "Play Games Connected" else "Offline Local Save",
                color = Color(0xFFCBD5E1),
                fontSize = 14.sp
            )
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Button(
                    onClick = onPlay,
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE11D48)),
                    modifier = Modifier.height(48.dp)
                ) {
                    Text("Play Campaign", fontWeight = FontWeight.Bold)
                }
                OutlinedButton(onClick = onOpenStages, modifier = Modifier.height(48.dp)) {
                    Text("Stages", color = Color.White)
                }
                OutlinedButton(onClick = onOpenArmory, modifier = Modifier.height(48.dp)) {
                    Text("Skins Armory", color = Color.White)
                }
                OutlinedButton(onClick = onOpenLeaderboard, modifier = Modifier.height(48.dp)) {
                    Text("Leaderboard", color = Color(0xFFFBBF24))
                }
            }
            TextButton(onClick = onToggleLowEnd) {
                Text(
                    text = if (saveData.lowEndPerfMode) {
                        "Hardware Mode: Battery & Low-End 60fps"
                    } else {
                        "Hardware Mode: Balanced Visuals"
                    },
                    color = Color(0xFF94A3B8),
                    fontSize = 12.sp
                )
            }
        }
    }
}

@Composable
private fun StageSelectView(
    saveData: PlayerSaveData,
    onSelect: (Int) -> Unit,
    onBack: () -> Unit
) {
    Column(modifier = Modifier.fillMaxSize().padding(20.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Select Stage", color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.Bold)
            TextButton(onClick = onBack) { Text("Back", color = Color(0xFFFDA4AF)) }
        }
        Spacer(Modifier.height(12.dp))
        LazyVerticalGrid(
            columns = GridCells.Fixed(3),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(GameCatalog.levels) { lvl ->
                val stars = saveData.bestStars[lvl.id] ?: 0
                val best = saveData.bestScores[lvl.id] ?: 0
                Column(
                    modifier = Modifier
                        .background(Color(0xFF171D33), RoundedCornerShape(12.dp))
                        .border(1.dp, Color(0xFF334155), RoundedCornerShape(12.dp))
                        .clickable { onSelect(lvl.id) }
                        .padding(14.dp)
                ) {
                    Text("Stage ${lvl.id} · ${lvl.region}", color = Color(0xFF94A3B8), fontSize = 11.sp)
                    Text(lvl.name, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    Spacer(Modifier.height(6.dp))
                    Text("Best: $best · $stars/3 ★", color = Color(0xFFFBBF24), fontSize = 12.sp)
                }
            }
        }
    }
}

@Composable
private fun SkinArmoryView(
    saveData: PlayerSaveData,
    onUnlockOrEquip: (NinjaSkin) -> Unit,
    onBack: () -> Unit
) {
    var selectedType by remember { mutableStateOf(NinjaType.SHINOBI) }
    val skins = GameCatalog.skins.filter { it.ninjaType == selectedType }

    Column(modifier = Modifier.fillMaxSize().padding(20.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text("Shinobi Armory", color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.Bold)
                Text("Cosmetic Only · Identical Physics · ${saveData.coins} Koban", color = Color(0xFFFBBF24), fontSize = 13.sp)
            }
            TextButton(onClick = onBack) { Text("Back", color = Color(0xFFFDA4AF)) }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(vertical = 10.dp)) {
            NinjaType.entries.forEach { nt ->
                FilterChip(
                    selected = selectedType == nt,
                    onClick = { selectedType = nt },
                    label = { Text(nt.displayName) }
                )
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            skins.forEach { skin ->
                val unlocked = saveData.unlockedSkins.contains(skin.id)
                val equipped = saveData.equippedSkins[selectedType] == skin.id
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .background(Color(0xFF171D33), RoundedCornerShape(12.dp))
                        .border(
                            1.5.dp,
                            if (equipped) Color(0xFF10B981) else Color(0xFF334155),
                            RoundedCornerShape(12.dp)
                        )
                        .padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(skin.name, color = Color.White, fontWeight = FontWeight.Bold)
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .background(skin.palette.cowl, RoundedCornerShape(22.dp))
                            .border(3.dp, skin.palette.accent, RoundedCornerShape(22.dp))
                    )
                    Button(
                        onClick = { onUnlockOrEquip(skin) },
                        enabled = unlocked || saveData.coins >= skin.cost,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (equipped) Color(0xFF059669) else Color(0xFFE11D48)
                        ),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            when {
                                equipped -> "Equipped"
                                unlocked -> "Equip"
                                else -> "Unlock ${skin.cost}"
                            },
                            fontSize = 12.sp
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun PlayfieldView(
    level: LevelDef,
    runKey: Int,
    paused: Boolean,
    muted: Boolean,
    saveData: PlayerSaveData,
    roundResult: Triple<Boolean, Int, Int>?,
    onTogglePause: () -> Unit,
    onToggleMute: () -> Unit,
    onRestart: () -> Unit,
    onNextLevel: () -> Unit,
    onExitTitle: () -> Unit,
    onRoundFinished: (Boolean, Int, Int, Boolean) -> Unit
) {
    val world = remember(level.id, runKey) {
        PhysicsWorld(level, saveData.equippedSkins, saveData.lowEndPerfMode, onRoundFinished)
    }
    var frameTick by remember { mutableLongStateOf(0L) }

    LaunchedEffect(world, paused) {
        var lastNs = System.nanoTime()
        while (true) {
            val now = System.nanoTime()
            val dt = ((now - lastNs) / 1_000_000_000f).coerceIn(0f, 0.05f)
            lastNs = now
            if (!paused) {
                world.step(dt)
                frameTick++
            }
            delay(16L)
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        Canvas(
            modifier = Modifier
                .fillMaxSize()
                .pointerInput(world, paused) {
                    detectTapGestures {
                        if (!paused) world.activateAbility()
                    }
                }
                .pointerInput(world, paused) {
                    detectDragGestures(
                        onDragStart = { offset ->
                            if (paused) return@detectDragGestures
                            val scale = minOf(size.width / 1280f, size.height / 640f)
                            val offX = size.width * 0.5f - world.camX * scale
                            val offY = size.height * 0.62f - 405f * scale
                            world.startAim((offset.x - offX) / scale, (offset.y - offY) / scale)
                        },
                        onDrag = { change, _ ->
                            if (paused) return@detectDragGestures
                            change.consume()
                            val scale = minOf(size.width / 1280f, size.height / 640f)
                            val offX = size.width * 0.5f - world.camX * scale
                            val offY = size.height * 0.62f - 405f * scale
                            world.updateAim((change.position.x - offX) / scale, (change.position.y - offY) / scale)
                        },
                        onDragEnd = { world.releaseAim() },
                        onDragCancel = { world.releaseAim() }
                    )
                }
        ) {
            // Read frameTick so Compose invalidates draw pass cleanly at 60Hz
            frameTick.let {}
            renderWorld(world)
        }

        // Low-occlusion HUD overlay
        Row(
            modifier = Modifier.fillMaxWidth().padding(14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Top
        ) {
            Column(
                modifier = Modifier
                    .background(Color(0xD90E1324), RoundedCornerShape(10.dp))
                    .padding(horizontal = 14.dp, vertical = 8.dp)
            ) {
                Text("Stage ${level.id} · ${level.name}", color = Color(0xFFCBD5E1), fontSize = 12.sp)
                Text("Score: ${world.score}", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(onClick = onToggleMute, modifier = Modifier.height(44.dp)) {
                    Text(if (muted) "Unmute" else "Mute", fontSize = 12.sp)
                }
                Button(onClick = onRestart, modifier = Modifier.height(44.dp)) {
                    Text("Restart", fontSize = 12.sp)
                }
                Button(onClick = onTogglePause, modifier = Modifier.height(44.dp)) {
                    Text("Pause", fontSize = 12.sp)
                }
            }
        }

        if (paused && roundResult == null) {
            Box(
                modifier = Modifier.fillMaxSize().background(Color(0xB3000000)),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    modifier = Modifier
                        .background(Color(0xFF12172A), RoundedCornerShape(16.dp))
                        .padding(24.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text("Paused", color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.Bold)
                    Button(onClick = onTogglePause, modifier = Modifier.width(180.dp)) { Text("Resume") }
                    Button(onClick = onRestart, modifier = Modifier.width(180.dp)) { Text("Restart") }
                    OutlinedButton(onClick = onExitTitle, modifier = Modifier.width(180.dp)) { Text("Title Screen") }
                }
            }
        }

        roundResult?.let { (won, totalScore, stars) ->
            Box(
                modifier = Modifier.fillMaxSize().background(Color(0xBF000000)),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    modifier = Modifier
                        .background(Color(0xFF12172A), RoundedCornerShape(16.dp))
                        .padding(24.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        if (won) "Fortress Shattered!" else "Targets Standing",
                        color = Color.White,
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold
                    )
                    if (won) {
                        Text("Score: $totalScore · $stars / 3 ★", color = Color(0xFFFBBF24), fontWeight = FontWeight.SemiBold)
                        if (level.id < GameCatalog.levels.size) {
                            Button(onClick = onNextLevel, modifier = Modifier.width(200.dp)) { Text("Next Stage") }
                        }
                    }
                    Button(onClick = onRestart, modifier = Modifier.width(200.dp)) { Text("Play Again") }
                    OutlinedButton(onClick = onExitTitle, modifier = Modifier.width(200.dp)) { Text("Title Screen") }
                }
            }
        }
    }
}

private fun DrawScope.renderWorld(world: PhysicsWorld) {
    // Sky backdrop
    drawRect(
        brush = Brush.verticalGradient(listOf(Color(0xFF13162B), Color(0xFF3B2447), Color(0xFFC2410C))),
        size = size
    )

    val scale = minOf(size.width / 1280f, size.height / 640f)
    val offX = size.width * 0.5f - world.camX * scale
    val offY = size.height * 0.62f - 405f * scale

    fun wx(x: Float) = x * scale + offX
    fun wy(y: Float) = y * scale + offY

    // Ground
    drawRect(
        color = Color(0xFF365314),
        topLeft = Offset(0f, wy(GameCatalog.GROUND_Y)),
        size = Size(size.width, size.height - wy(GameCatalog.GROUND_Y))
    )

    // Slingshot & Trajectory
    val slingX = wx(GameCatalog.SLING_X)
    val slingY = wy(GameCatalog.SLING_Y)
    drawLine(Color(0xFF78350F), Offset(slingX, wy(GameCatalog.GROUND_Y)), Offset(slingX, slingY), strokeWidth = 10f * scale)

    if (world.isAiming) {
        for ((tx, ty) in world.getTrajectoryPreview()) {
            drawCircle(Color.White.copy(alpha = 0.8f), radius = 4f * scale, center = Offset(wx(tx), wy(ty)))
        }
    }

    // Blocks
    for (b in world.blocks) {
        val left = wx(b.x - b.w * 0.5f)
        val top = wy(b.y - b.h * 0.5f)
        val bw = b.w * scale
        val bh = b.h * scale
        drawRect(if (b.hitFlash > 0f) Color.White else b.material.color, Offset(left, top), Size(bw, bh))
        drawRect(b.material.strokeColor, Offset(left, top), Size(bw, bh), style = Stroke(width = 2f * scale))
    }

    // Enemies
    for (e in world.enemies) {
        drawCircle(
            if (e.hitFlash > 0f) Color.Yellow else e.type.color,
            radius = e.radius * scale,
            center = Offset(wx(e.x), wy(e.y))
        )
    }

    // Loaded Ninja
    world.loadedNinja?.let { nt ->
        val nx = if (world.isAiming) world.aimX else GameCatalog.SLING_X
        val ny = if (world.isAiming) world.aimY else GameCatalog.SLING_Y
        val skin = GameCatalog.skinById(world.equippedSkins[nt])
        drawCircle(skin.palette.cowl, radius = nt.radius * scale, center = Offset(wx(nx), wy(ny)))
        drawCircle(skin.palette.accent, radius = nt.radius * scale, center = Offset(wx(nx), wy(ny)), style = Stroke(3f * scale))
    }

    // Flying Ninjas
    for (n in world.flyingNinjas) {
        val skin = GameCatalog.skinById(n.skinId)
        for ((tx, ty) in n.trail) {
            drawCircle(skin.palette.ribbon.copy(alpha = 0.4f), radius = 5f * scale, center = Offset(wx(tx), wy(ty)))
        }
        drawCircle(skin.palette.cowl, radius = n.radius * scale, center = Offset(wx(n.x), wy(n.y)))
        drawCircle(skin.palette.accent, radius = n.radius * scale, center = Offset(wx(n.x), wy(n.y)), style = Stroke(3f * scale))
    }

    // Pooled Particles
    for (p in world.particles) {
        if (!p.active) continue
        val alpha = (p.life / p.maxLife).coerceIn(0f, 1f)
        drawCircle(p.color.copy(alpha = alpha), radius = p.size * scale, center = Offset(wx(p.x), wy(p.y)))
    }
}
