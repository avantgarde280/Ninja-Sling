package com.kagesling.game.engine

import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import com.kagesling.game.data.MaterialType
import com.kagesling.game.data.NinjaType
import kotlin.concurrent.thread
import kotlin.math.PI
import kotlin.math.sin
import kotlin.random.Random

/**
 * Procedural low-latency PCM sound synthesizer using Android AudioTrack.
 * Zero external audio assets needed; respects mute toggle.
 */
object SoundEngine {
    @Volatile
    var muted: Boolean = false

    private const val SAMPLE_RATE = 22050

    fun playLaunch(type: NinjaType) {
        if (muted) return
        val startFreq = when (type) {
            NinjaType.ONI_BUSTER -> 160f
            NinjaType.KUNOICHI -> 330f
            else -> 240f
        }
        playTone(startFreq, startFreq * 2.2f, 0.22f, 0.28f)
    }

    fun playAbility(type: NinjaType) {
        if (muted) return
        when (type) {
            NinjaType.ONI_BUSTER -> playExplosion()
            NinjaType.TENGU -> playTone(860f, 190f, 0.22f, 0.3f)
            NinjaType.KUNOICHI -> playTone(980f, 1560f, 0.14f, 0.24f)
            NinjaType.SHINOBI -> playTone(360f, 1100f, 0.14f, 0.28f)
        }
    }

    fun playImpact(material: MaterialType) {
        if (muted) return
        when (material) {
            MaterialType.ICE -> playTone(1250f, 760f, 0.08f, 0.18f)
            MaterialType.STONE -> playTone(120f, 52f, 0.10f, 0.24f)
            MaterialType.BAMBOO -> playTone(360f, 190f, 0.07f, 0.18f)
            else -> playTone(210f, 95f, 0.08f, 0.20f)
        }
    }

    fun playExplosion() {
        if (muted) return
        thread(isDaemon = true) {
            val count = (SAMPLE_RATE * 0.36f).toInt()
            val pcm = ShortArray(count)
            for (i in 0 until count) {
                val t = i.toFloat() / SAMPLE_RATE
                val env = (1f - i.toFloat() / count)
                val bass = sin(2.0 * PI * (120.0 - 80.0 * (i.toFloat() / count)) * t)
                val noise = Random.nextFloat() * 2f - 1f
                val mix = (bass * 0.65 + noise * 0.35) * env * 0.45
                pcm[i] = (mix * Short.MAX_VALUE).toInt().coerceIn(Short.MIN_VALUE.toInt(), Short.MAX_VALUE.toInt()).toShort()
            }
            writePcm(pcm)
        }
    }

    fun playVictory() {
        if (muted) return
        thread(isDaemon = true) {
            val notes = floatArrayOf(293.66f, 369.99f, 440f, 587.33f)
            val noteLen = (SAMPLE_RATE * 0.12f).toInt()
            val pcm = ShortArray(notes.size * noteLen)
            for (n in notes.indices) {
                for (i in 0 until noteLen) {
                    val env = 1f - i.toFloat() / noteLen
                    val sample = sin(2.0 * PI * notes[n] * (i.toFloat() / SAMPLE_RATE)) * env * 0.32
                    pcm[n * noteLen + i] = (sample * Short.MAX_VALUE).toInt().toShort()
                }
            }
            writePcm(pcm)
        }
    }

    private fun playTone(f0: Float, f1: Float, durationSec: Float, volume: Float) {
        thread(isDaemon = true) {
            val count = (SAMPLE_RATE * durationSec).toInt().coerceAtLeast(1)
            val pcm = ShortArray(count)
            var phase = 0.0
            for (i in 0 until count) {
                val p = i.toFloat() / count
                val freq = f0 + (f1 - f0) * p
                phase += 2.0 * PI * freq / SAMPLE_RATE
                val env = 1f - p
                val sample = sin(phase) * env * volume
                pcm[i] = (sample * Short.MAX_VALUE).toInt().toShort()
            }
            writePcm(pcm)
        }
    }

    private fun writePcm(pcm: ShortArray) {
        try {
            val track = AudioTrack.Builder()
                .setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_GAME)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build()
                )
                .setAudioFormat(
                    AudioFormat.Builder()
                        .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                        .setSampleRate(SAMPLE_RATE)
                        .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                        .build()
                )
                .setBufferSizeInBytes(pcm.size * 2)
                .setTransferMode(AudioTrack.MODE_STATIC)
                .build()
            track.write(pcm, 0, pcm.size)
            track.play()
            Thread.sleep((pcm.size * 1000L) / SAMPLE_RATE + 40L)
            track.release()
        } catch (_: Throwable) {
            // Safe ignore on emulator audio absence
        }
    }
}
