package com.omnitech.drivingtracker.utils

import android.content.Context
import android.media.MediaPlayer
import android.speech.tts.TextToSpeech
import android.util.Log
import java.util.Locale

class VoiceAlertManager(private val context: Context){

    private var tts: TextToSpeech? = null;
    private  var isTtsReady = false
    //initialising the TextToSpeech engine
    init{
        tts = TextToSpeech(context.applicationContext){ status ->
            if(status == TextToSpeech.SUCCESS){
                val result = tts?.setLanguage(Locale.US)
                if(result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED){
                    Log.e("TTS", "Language not supported")
                } else {
                    isTtsReady = true
                }

            }else{
                Log.e("VoiceAlertManager", "TTS Init failed: ${status}")
            }
        }
    }
    private fun getRawResourceForEventType(eventType: String): Int {
        val rawName = when (eventType.uppercase(Locale.ROOT)) {
            "HARSH_BRAKE", "HARSH_BRAKING" -> "voice_harsh_brake"
            "HARSH_ACCELERATION", "SPEEDING" -> "voice_speeding"
            "ACCIDENT", "CRASH" -> "voice_accident"
            else -> "voice_default"
        }

        // Dynamically find raw resource ID by file name
        return context.resources.getIdentifier(rawName, "raw", context.packageName)
    }
    //Plays the custome audio if available or falls back to TTS if the audio isn't added yet
    fun playHotspotAlert(eventType: String){
        val rawResId = getRawResourceForEventType(eventType)

        if(rawResId != 0 ){//will attemptr to play the custom audio file
            try{
                val mediaPlayer = MediaPlayer.create(context, rawResId)
                if(mediaPlayer != null){
                    mediaPlayer.setOnCompletionListener { mp -> mp.release() }
                    mediaPlayer.start()
                    Log.d("VoiceAlertManager", "Playing custom voce file for $eventType")
                    return
                }
            }catch (e: Exception){
                Log.e("VoiceAlertManager", "Error playing custom voice file: ${e.message}")
            }

        }

        //fall back
        val eventTypeFormatted = eventType.replace("_", " ").lowercase(Locale.ROOT)
        val alertText = "Caution: Approaching a high risk area. $eventTypeFormatted hotspot ahead."

        if (isTtsReady && tts != null) {
            tts?.speak(alertText, TextToSpeech.QUEUE_ADD, null, System.currentTimeMillis().toString())
        }
    }
    fun shutdown(){
        tts?.stop()
        tts?.shutdown()
        tts = null
        isTtsReady = false
    }

}