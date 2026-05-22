package com.omnitech.drivingtracker.ui.data

//Deals with displaying ranks on achievements screen
//Will take data from DB
data class Rank(
    val name: String,
    val score: Int,
    val isUser: Boolean = false
)