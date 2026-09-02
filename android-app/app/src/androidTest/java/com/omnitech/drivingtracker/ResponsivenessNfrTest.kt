package com.omnitech.drivingtracker

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithContentDescription
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
//import androidx.preference.isNotEmpty
import dagger.hilt.android.testing.HiltAndroidRule
import dagger.hilt.android.testing.HiltAndroidTest
import junit.framework.TestCase.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test

@HiltAndroidTest
class ResponsivenessNfrTest{

    @get:Rule(order = 0)
    var hiltRule = HiltAndroidRule(this)

    @get: Rule(order = 1)
    val composeTestRule = createAndroidComposeRule<MainActivity>()

    @Before
    fun init(){
        hiltRule.inject()
        ensureLoggedIn()
    }
    @Test
    fun testNavigationResponsiveness_Target200ms(){
        //once a user is logged in start on dashboard
        composeTestRule.waitUntil(1000){
            try{
                composeTestRule.onAllNodesWithTag("topBarLeftButtion").fetchSemanticsNodes().isNotEmpty()
            }catch (e: Exception){
                false
            }
        }
        composeTestRule.onNodeWithTag("topBarLeftButton").performClick()
        val startTime = System.currentTimeMillis() //timer to see how long navigation takes

        composeTestRule.waitUntil(5000) {
            composeTestRule.onAllNodesWithText("Vehicles").fetchSemanticsNodes().isNotEmpty()
        }
        composeTestRule.onNodeWithText("Vehicles").performClick()

        composeTestRule.waitUntil(2000) {
            composeTestRule.onAllNodesWithTag("vehicleList", useUnmergedTree =  true).fetchSemanticsNodes().isNotEmpty()
        }
        val latency = System.currentTimeMillis() - startTime
        android.util.Log.i("NFR_METRIC","UI Responsiveness: ${latency}ms")
        assertTrue("UI took ${latency}ms to respond (NFR Limit: 200ms)", latency <= 200)
    }



    private fun ensureLoggedIn(){
        val isWelcomeVisible = composeTestRule.onAllNodesWithTag("welcomeLoginButton")
            .fetchSemanticsNodes().isNotEmpty()
        if (isWelcomeVisible) {
            composeTestRule.onNodeWithTag("welcomeLoginButton").performClick()
            composeTestRule.onNodeWithTag("loginIdentifier").performTextInput("omnitech@gmail.com")
            composeTestRule.onNodeWithTag("loginPassword").performTextInput("MySecretPassword123!")
            composeTestRule.onNodeWithTag("loginButton").performClick()
            composeTestRule.waitUntil(10000) { composeTestRule.onAllNodesWithContentDescription("Dashboard").fetchSemanticsNodes().isNotEmpty()
            }
        }
    }
}