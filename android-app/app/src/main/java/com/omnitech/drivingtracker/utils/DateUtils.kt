package com.omnitech.drivingtracker.utils

import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

fun formateScheduledDate(dateString: String): String {
    return try{
        val instant = Instant.parse(dateString)
        val formatter = DateTimeFormatter.ofPattern("EEE, dd MM yyyy 'at' HH:mm", Locale.getDefault())

        instant.atZone(ZoneId.systemDefault()).format(formatter)

    } catch(_: Exception) {
        dateString.replace("T"," ").replace("Z", "").substringBefore(".")
    }
}