package com.omnitech.drivingtracker

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.junit4.createComposeRule
import org.junit.Rule
import org.junit.Test

class DrivingTrackerE2E{
    @get:Rule
    val composeTestRule = createAndroidComposeRule<MainActivity>()

    @Test
    fun useCase1ManageVehiclesFlow(){
        //login - prereq
        composeTestRule.onNodeWithTag("welcomeLoginButton").performClick()
        composeTestRule.onNodeWithTag("loginIdentifier").performTextInput("testuser")
        composeTestRule.onNodeWithTag("loginPassword").performTextInput("Password123!")
        composeTestRule.onNodeWithTag("loginButton").performClick()



    }
}