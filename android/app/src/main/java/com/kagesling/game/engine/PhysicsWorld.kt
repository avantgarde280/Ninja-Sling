package com.kagesling.game.engine

import androidx.compose.ui.graphics.Color
import com.kagesling.game.data.EnemyType
import com.kagesling.game.data.GameCatalog
import com.kagesling.game.data.LevelDef
import com.kagesling.game.data.MaterialType
import com.kagesling.game.data.NinjaType
import kotlin.math.abs
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sin
import kotlin.random.Random

class BlockBody(
    var x: Float,
    var y: Float,
    val w: Float,
    val h: Float,
    val material: MaterialType,
    var hp: Float = material.maxHp
) {
    var vx: Float = 0f
    var vy: Float = 0f
    var sleeping: Boolean = false
    var hitFlash: Float = 0f
}

class EnemyBody(
    var x: Float,
    var y: Float,
    val type: EnemyType,
    var hp: Float = type.maxHp
) {
    var vx: Float = 0f
    var vy: Float = 0f
    val radius: Float = type.radius
    var hitFlash: Float = 0f
}

class NinjaBody(
    var x: Float,
    var y: Float,
    var vx: Float,
    var vy: Float,
    val type: NinjaType,
    val skinId: String,
    var abilityUsed: Boolean = false
) {
    val radius: Float = type.radius
    val trail = ArrayList<Pair<Float, Float>>(24)
}

class ParticleItem {
    var active: Boolean = false
    var x: Float = 0f
    var y: Float = 0f
    var vx: Float = 0f
    var vy: Float = 0f
    var size: Float = 5f
    var life: Float = 0f
    var maxLife: Float = 0.4f
    var color: Color = Color.White
}

/**
 * Fixed-timestep (60Hz) 2D physics simulation with gravity, sleeping bodies for low-end
 * Android battery/CPU optimization, impulse damage, TNT chain blasts, and pre-allocated particles.
 */
class PhysicsWorld(
    val level: LevelDef,
    var equippedSkins: Map<NinjaType, String>,
    val lowEndMode: Boolean = false,
    private val onRoundFinished: (won: Boolean, destructionScore: Int, unusedNinjas: Int, tntTriggered: Boolean) -> Unit
) {
    val blocks = ArrayList<BlockBody>(32)
    val enemies = ArrayList<EnemyBody>(12)
    val flyingNinjas = ArrayList<NinjaBody>(6)
    val queue = ArrayDeque<NinjaType>()
    val particles = Array(if (lowEndMode) 90 else 180) { ParticleItem() }

    var loadedNinja: NinjaType? = null
    var isAiming: Boolean = false
    var aimX: Float = GameCatalog.SLING_X
    var aimY: Float = GameCatalog.SLING_Y

    var score: Int = 0
    var shakeMag: Float = 0f
    var camX: Float = 640f
    var roundEnded: Boolean = false
    var tntTriggered: Boolean = false

    private var particleCursor = 0
    private var accumulator = 0f
    private var flightElapsed = 0f
    private var settleTimer = 0f
    private var levelElapsed = 0f

    companion object {
        private const val FIXED_DT = 1f / 60f
        private const val GRAVITY = 760f
        private const val SLING_MAX_PULL = 115f
        private const val MAX_LAUNCH_SPEED = 980f
    }

    init {
        for (b in level.blocks) {
            blocks.add(
                BlockBody(
                    x = level.fortressOriginX + b.relX,
                    y = GameCatalog.GROUND_Y - b.heightAboveGround,
                    w = b.w,
                    h = b.h,
                    material = b.material
                )
            )
        }
        for (e in level.enemies) {
            enemies.add(
                EnemyBody(
                    x = level.fortressOriginX + e.relX,
                    y = GameCatalog.GROUND_Y - e.heightAboveGround,
                    type = e.type
                )
            )
        }
        queue.addAll(level.ninjas)
        loadNext()
    }

    private fun loadNext() {
        loadedNinja = if (queue.isNotEmpty()) queue.removeFirst() else null
        aimX = GameCatalog.SLING_X
        aimY = GameCatalog.SLING_Y
        isAiming = false
    }

    fun startAim(worldX: Float, worldY: Float): Boolean {
        if (roundEnded || loadedNinja == null || flyingNinjas.isNotEmpty()) return false
        if (hypot(worldX - GameCatalog.SLING_X, worldY - GameCatalog.SLING_Y) <= 84f) {
            isAiming = true
            updateAim(worldX, worldY)
            return true
        }
        return false
    }

    fun updateAim(worldX: Float, worldY: Float) {
        if (!isAiming) return
        var dx = worldX - GameCatalog.SLING_X
        var dy = worldY - GameCatalog.SLING_Y
        val dist = hypot(dx, dy)
        if (dist > SLING_MAX_PULL) {
            dx *= SLING_MAX_PULL / dist
            dy *= SLING_MAX_PULL / dist
        }
        aimX = GameCatalog.SLING_X + dx
        aimY = min(GameCatalog.GROUND_Y - 26f, GameCatalog.SLING_Y + dy)
    }

    fun releaseAim(): Boolean {
        if (!isAiming || loadedNinja == null) {
            isAiming = false
            return false
        }
        isAiming = false
        val pullX = GameCatalog.SLING_X - aimX
        val pullY = GameCatalog.SLING_Y - aimY
        val pullDist = hypot(pullX, pullY)
        if (pullDist < 18f) {
            aimX = GameCatalog.SLING_X
            aimY = GameCatalog.SLING_Y
            return false
        }
        val type = loadedNinja!!
        val speed = (pullDist / SLING_MAX_PULL) * MAX_LAUNCH_SPEED * type.launchScale
        val vx = (pullX / pullDist) * speed
        val vy = (pullY / pullDist) * speed
        val skinId = equippedSkins[type] ?: GameCatalog.defaultEquipped.getValue(type)

        flyingNinjas.add(NinjaBody(aimX, aimY, vx, vy, type, skinId))
        SoundEngine.playLaunch(type)
        loadedNinja = null
        aimX = GameCatalog.SLING_X
        aimY = GameCatalog.SLING_Y
        flightElapsed = 0f
        settleTimer = 0f
        return true
    }

    fun activateAbility(): Boolean {
        if (roundEnded || flyingNinjas.isEmpty()) return false
        val lead = flyingNinjas.first()
        if (lead.abilityUsed) return false
        lead.abilityUsed = true
        SoundEngine.playAbility(lead.type)

        when (lead.type) {
            NinjaType.SHINOBI -> {
                val spd = max(400f, hypot(lead.vx, lead.vy))
                lead.vx = (lead.vx / spd).coerceAtLeast(0.75f) * 1280f
                lead.vy *= 0.35f
            }
            NinjaType.KUNOICHI -> {
                val baseAngle = atan2(lead.vy, lead.vx)
                val spd = max(620f, hypot(lead.vx, lead.vy) * 1.1f)
                for (delta in floatArrayOf(-0.26f, 0.26f)) {
                    flyingNinjas.add(
                        NinjaBody(
                            lead.x, lead.y,
                            cos(baseAngle + delta) * spd,
                            sin(baseAngle + delta) * spd,
                            NinjaType.KUNOICHI, lead.skinId, abilityUsed = true
                        )
                    )
                }
            }
            NinjaType.ONI_BUSTER -> {
                detonateAt(lead.x, lead.y, 180f, 140f)
                lead.vy = -320f
            }
            NinjaType.TENGU -> {
                lead.vx *= 0.25f
                lead.vy = 1380f
            }
        }
        return true
    }

    fun getTrajectoryPreview(): List<Pair<Float, Float>> {
        if (!isAiming || loadedNinja == null) return emptyList()
        val pullX = GameCatalog.SLING_X - aimX
        val pullY = GameCatalog.SLING_Y - aimY
        val pullDist = hypot(pullX, pullY)
        if (pullDist < 18f) return emptyList()

        val type = loadedNinja!!
        val speed = (pullDist / SLING_MAX_PULL) * MAX_LAUNCH_SPEED * type.launchScale
        var vx = (pullX / pullDist) * speed
        var vy = (pullY / pullDist) * speed
        var x = aimX
        var y = aimY
        val pts = ArrayList<Pair<Float, Float>>(18)
        for (i in 1..36) {
            vy += GRAVITY * FIXED_DT
            x += vx * FIXED_DT
            y += vy * FIXED_DT
            if (y > GameCatalog.GROUND_Y) break
            if (i % 2 == 0) pts.add(x to y)
        }
        return pts
    }

    fun step(rawDt: Float) {
        if (roundEnded) {
            updateParticles(min(rawDt, 0.05f))
            return
        }
        val clamped = min(rawDt, 0.05f)
        levelElapsed += clamped
        accumulator += clamped
        var steps = 0
        while (accumulator >= FIXED_DT && steps < 4) {
            stepPhysics(FIXED_DT)
            accumulator -= FIXED_DT
            steps++
        }
        updateParticles(clamped)
        shakeMag *= 0.88f
        if (shakeMag < 0.2f) shakeMag = 0f

        val targetCam = if (flyingNinjas.isNotEmpty()) {
            flyingNinjas.first().x.coerceIn(480f, 1200f)
        } else 680f
        camX += (targetCam - camX) * min(1f, clamped * 6f)
    }

    private fun stepPhysics(dt: Float) {
        // 1. Integrate flying ninjas
        for (ninja in flyingNinjas) {
            ninja.vy += GRAVITY * dt
            ninja.vx *= 0.997f
            ninja.x += ninja.vx * dt
            ninja.y += ninja.vy * dt

            if (ninja.y + ninja.radius > GameCatalog.GROUND_Y) {
                ninja.y = GameCatalog.GROUND_Y - ninja.radius
                ninja.vy = -ninja.vy * ninja.type.restitution
                ninja.vx *= 0.84f
            }
            if (hypot(ninja.vx, ninja.vy) > 90f) {
                ninja.trail.add(ninja.x to ninja.y)
                if (ninja.trail.size > 20) ninja.trail.removeAt(0)
            }
        }

        // 2. Integrate blocks (with sleeping optimization)
        for (b in blocks) {
            if (b.hitFlash > 0f) b.hitFlash = max(0f, b.hitFlash - dt)
            if (b.sleeping) continue
            b.vy += GRAVITY * dt
            b.x += b.vx * dt
            b.y += b.vy * dt
            b.vx *= 0.96f

            val halfH = b.h * 0.5f
            if (b.y + halfH >= GameCatalog.GROUND_Y) {
                b.y = GameCatalog.GROUND_Y - halfH
                if (abs(b.vy) > 120f && levelElapsed > 0.4f) {
                    applyBlockDamage(b, abs(b.vy) * 0.14f)
                }
                b.vy = 0f
                b.vx *= 0.72f
                if (abs(b.vx) < 8f) {
                    b.vx = 0f
                    b.sleeping = true
                }
            }
        }

        // Block-on-block vertical stacking & settling
        for (i in blocks.indices) {
            val a = blocks[i]
            for (j in i + 1 until blocks.size) {
                val b = blocks[j]
                val dx = a.x - b.x
                val overlapX = (a.w + b.w) * 0.5f - abs(dx)
                if (overlapX <= 0f) continue
                val dy = a.y - b.y
                val overlapY = (a.h + b.h) * 0.5f - abs(dy)
                if (overlapY <= 0f) continue

                if (overlapY < overlapX) {
                    val push = overlapY * 0.5f
                    if (dy < 0) {
                        a.y -= push; b.y += push
                        if (a.vy > 0f) {
                            if (a.vy > 190f && levelElapsed > 0.4f) {
                                applyBlockDamage(a, a.vy * 0.12f)
                                applyBlockDamage(b, a.vy * 0.12f)
                            }
                            a.vy = 0f
                            a.vx *= 0.8f
                        }
                    } else {
                        b.y -= push; a.y += push
                        if (b.vy > 0f) b.vy = 0f
                    }
                } else {
                    val push = overlapX * 0.5f
                    if (dx < 0) { a.x -= push; b.x += push } else { a.x += push; b.x -= push }
                }
            }
        }

        // 3. Integrate enemies
        for (e in enemies) {
            if (e.hitFlash > 0f) e.hitFlash = max(0f, e.hitFlash - dt)
            e.vy += GRAVITY * dt
            e.x += e.vx * dt
            e.y += e.vy * dt
            e.vx *= 0.94f

            if (e.y + e.radius >= GameCatalog.GROUND_Y) {
                e.y = GameCatalog.GROUND_Y - e.radius
                if (abs(e.vy) > 150f && levelElapsed > 0.4f) {
                    e.hp -= abs(e.vy) * 0.16f
                    e.hitFlash = 0.12f
                }
                e.vy = 0f
            }

            // Rest on top of blocks
            for (b in blocks) {
                val closestX = e.x.coerceIn(b.x - b.w * 0.5f, b.x + b.w * 0.5f)
                val closestY = e.y.coerceIn(b.y - b.h * 0.5f, b.y + b.h * 0.5f)
                val dx = e.x - closestX
                val dy = e.y - closestY
                val dist = hypot(dx, dy)
                if (dist < e.radius && dist > 0.001f) {
                    val push = e.radius - dist
                    e.x += (dx / dist) * push
                    e.y += (dy / dist) * push
                    if (dy < 0 && e.vy > 0f) e.vy = 0f
                }
            }
        }

        // 4. Ninja collisions with blocks & enemies
        for (ninja in flyingNinjas) {
            val blockIter = blocks.toList()
            for (b in blockIter) {
                val closestX = ninja.x.coerceIn(b.x - b.w * 0.5f, b.x + b.w * 0.5f)
                val closestY = ninja.y.coerceIn(b.y - b.h * 0.5f, b.y + b.h * 0.5f)
                val dx = ninja.x - closestX
                val dy = ninja.y - closestY
                val dist = hypot(dx, dy)
                if (dist < ninja.radius && dist > 0.001f) {
                    val nx = dx / dist
                    val ny = dy / dist
                    ninja.x += nx * (ninja.radius - dist)
                    ninja.y += ny * (ninja.radius - dist)

                    val relSpeed = hypot(ninja.vx - b.vx, ninja.vy - b.vy)
                    if (relSpeed > b.material.impactThreshold) {
                        val dmg = (relSpeed - b.material.impactThreshold * 0.5f) * 0.14f * ninja.type.density
                        applyBlockDamage(b, dmg)
                        SoundEngine.playImpact(b.material)
                    }
                    b.sleeping = false
                    b.vx += ninja.vx * 0.28f / b.material.massFactor
                    b.vy += ninja.vy * 0.18f / b.material.massFactor
                    ninja.vx *= 0.62f
                    ninja.vy *= 0.62f
                }
            }

            val enemyIter = enemies.toList()
            for (e in enemyIter) {
                val dx = e.x - ninja.x
                val dy = e.y - ninja.y
                val dist = hypot(dx, dy)
                val minDist = e.radius + ninja.radius
                if (dist < minDist && dist > 0.001f) {
                    val relSpeed = hypot(ninja.vx - e.vx, ninja.vy - e.vy)
                    e.hp -= relSpeed * 0.18f * ninja.type.density
                    e.hitFlash = 0.15f
                    e.vx += ninja.vx * 0.45f
                    e.vy += ninja.vy * 0.35f - 120f
                }
            }
        }

        // Remove defeated enemies
        val deadEnemies = enemies.filter { it.hp <= 0f || it.x > GameCatalog.WORLD_WIDTH + 120f || it.x < -120f }
        for (dead in deadEnemies) {
            enemies.remove(dead)
            score += dead.type.scoreValue
            spawnBurst(dead.x, dead.y, 12, Color(0xFF34D399))
            shakeMag = max(shakeMag, 6f)
        }

        // Turn & Victory progression
        if (flyingNinjas.isNotEmpty()) {
            flightElapsed += dt
            val anyFast = flyingNinjas.any { hypot(it.vx, it.vy) > 45f && it.x < GameCatalog.WORLD_WIDTH + 100f }
            if (!anyFast || flightElapsed > 5.5f) settleTimer += dt else settleTimer = 0f

            if (settleTimer >= 0.8f || flightElapsed > 7.5f) {
                flyingNinjas.clear()
                if (enemies.isEmpty()) {
                    finishRound(true)
                } else if (queue.isNotEmpty()) {
                    loadNext()
                } else {
                    loadedNinja = null
                    finishRound(false)
                }
            }
        } else if (enemies.isEmpty() && !roundEnded) {
            finishRound(true)
        }
    }

    private fun applyBlockDamage(b: BlockBody, damage: Float) {
        if (!blocks.contains(b)) return
        b.hp -= damage
        b.hitFlash = 0.12f
        if (b.hp <= 0f) {
            blocks.remove(b)
            score += b.material.scoreValue
            if (b.material == MaterialType.TNT) {
                tntTriggered = true
                detonateAt(b.x, b.y, 185f, 150f)
            } else {
                spawnBurst(b.x, b.y, 10, b.material.color)
            }
        }
    }

    private fun detonateAt(cx: Float, cy: Float, radius: Float, maxDamage: Float) {
        SoundEngine.playExplosion()
        shakeMag = max(shakeMag, 14f)
        spawnBurst(cx, cy, 24, Color(0xFFF97316))

        for (b in blocks.toList()) {
            val dx = b.x - cx
            val dy = b.y - cy
            val dist = hypot(dx, dy)
            if (dist <= radius) {
                val falloff = 1f - dist / radius
                b.sleeping = false
                if (dist > 0.01f) {
                    b.vx += (dx / dist) * 420f * falloff
                    b.vy += ((dy / dist) - 0.35f) * 420f * falloff
                }
                applyBlockDamage(b, maxDamage * falloff)
            }
        }

        for (e in enemies.toList()) {
            val dx = e.x - cx
            val dy = e.y - cy
            val dist = hypot(dx, dy)
            if (dist <= radius) {
                val falloff = 1f - dist / radius
                e.hp -= maxDamage * falloff
                e.hitFlash = 0.15f
            }
        }
    }

    private fun spawnBurst(x: Float, y: Float, count: Int, color: Color) {
        val actual = if (lowEndMode) (count / 2).coerceAtLeast(3) else count
        repeat(actual) {
            val p = particles[particleCursor]
            particleCursor = (particleCursor + 1) % particles.size
            val ang = Random.nextFloat() * 6.283f
            val spd = 80f + Random.nextFloat() * 240f
            p.active = true
            p.x = x
            p.y = y
            p.vx = cos(ang) * spd
            p.vy = sin(ang) * spd - 60f
            p.size = 4f + Random.nextFloat() * 5f
            p.maxLife = 0.35f + Random.nextFloat() * 0.35f
            p.life = p.maxLife
            p.color = color
        }
    }

    private fun updateParticles(dt: Float) {
        for (p in particles) {
            if (!p.active) continue
            p.life -= dt
            if (p.life <= 0f) {
                p.active = false
                continue
            }
            p.vy += GRAVITY * 0.65f * dt
            p.x += p.vx * dt
            p.y += p.vy * dt
        }
    }

    private fun finishRound(won: Boolean) {
        if (roundEnded) return
        roundEnded = true
        val unused = if (won) queue.size + (if (loadedNinja != null) 1 else 0) else 0
        if (won) SoundEngine.playVictory()
        onRoundFinished(won, score, unused, tntTriggered)
    }
}
