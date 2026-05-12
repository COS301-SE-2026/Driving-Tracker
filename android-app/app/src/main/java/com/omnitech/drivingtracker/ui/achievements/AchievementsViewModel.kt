package com.omnitech.drivingtracker.ui.achievements

import  androidx.lifecycle.ViewModel
import  com.omnitech.drivingtracker.ui.data.Rank

class AchievementsViewModel : ViewModel() {
    //This holds data safely. Can be updated later to pull from actual DB
    val rankList = listOf(
        Rank(name = "Brayden B", score = 87),
        Rank(name = "You", score = 80, isUser = true),
        Rank(name = "Mosa L", score = 87),
        Rank(name = "Sente P", score = 87),//had to include everyone
        Rank(name = "Jack H", score = 87),
        Rank(name = "Moses B", score = 87)
    )

}