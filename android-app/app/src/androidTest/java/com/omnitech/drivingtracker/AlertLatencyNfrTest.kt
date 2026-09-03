package com.omnitech.drivingtracker

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithContentDescription
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onFirst
import androidx.compose.ui.test.onLast
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.UiDevice
import androidx.test.uiautomator.UiSelector
import com.omnitech.drivingtracker.data.sensors.ISensorFusionManager
import dagger.hilt.android.testing.HiltAndroidRule
import dagger.hilt.android.testing.HiltAndroidTest
import org.junit.Assert
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import javax.inject.Inject

@HiltAndroidTest
class AlertLatencyNfrTest {

    @get:Rule(order = 0)
    var hiltRule = HiltAndroidRule(this)

    @get: Rule(order = 1)
    val composeTestRule = createAndroidComposeRule<MainActivity>()

    @Inject
    lateinit var sensorManager: ISensorFusionManager

    @Before
    fun init() {
        hiltRule.inject()
        ensureInLiveTrip()
    }
    @Test
    fun testAlertVisibilityLatency_Target3000ms() {
        // Wait for the "Recording" badge to be stable
        composeTestRule.waitUntil(60000) {
            try {
                composeTestRule.onAllNodesWithText("Recording").fetchSemanticsNodes().isNotEmpty()
            } catch (e: Exception) { false }
        }

        // Brief sleep to ensure the LiveTrip LaunchedEffects have started
        Thread.sleep(3000)

        val detectionTime = System.currentTimeMillis()

        // Trigger via MainSync to ensure immediate propagation to the Service
        InstrumentationRegistry.getInstrumentation().runOnMainSync {
            sensorManager.triggerFakeEvent("HARSH_BRAKE")
        }

        // Wait for the banner with the tag you defined in LiveTrip.kt
        composeTestRule.waitUntil(10000) {
            try {
                composeTestRule.onAllNodesWithText("Alert:", substring = true)
                    .fetchSemanticsNodes().isNotEmpty()
            } catch (e: Exception) { false }
        }

        val appearanceTime = System.currentTimeMillis()
        val latency = appearanceTime - detectionTime
        Assert.assertTrue("Alert took ${latency}ms to show", latency <= 3000)
    }

    private fun handleSystemPermissions(maxWaitMs: Long = 15000) {
        val device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())
        val startTime = System.currentTimeMillis()

        while (System.currentTimeMillis() - startTime < maxWaitMs) {
            // 1. Handle Android 12+ "Precise" location toggle if it exists
            val preciseSelector = UiSelector().resourceIdMatches(".*:id/precise_location_selection.*")
            val preciseButton = device.findObject(preciseSelector)
            if (preciseButton.exists()) {
                preciseButton.click()
            }

            // 2. Try various selectors for the "Allow" / "While using the app" button
            val selectors = listOf(
                UiSelector().resourceIdMatches(".*:id/permission_allow_foreground_only_button"),
                UiSelector().resourceIdMatches(".*:id/permission_allow_button"),
                UiSelector().textMatches("(?i).*While using the app.*"),
                UiSelector().textMatches("(?i).*Allow.*"),
                UiSelector().textMatches("(?i).*Only this time.*")
            )

            var found = false
            for (selector in selectors) {
                val button = device.findObject(selector)
                if (button.exists()) {
                    button.click()
                    device.waitForIdle()
                    found = true
                    break
                }
            }

            // If we clicked a button, wait a moment to see if another permission (like Notifications) follows
            if (found) {
                Thread.sleep(1500)
            } else {
                // If no button found, wait a bit and retry until timeout
                Thread.sleep(500)
                // If we've waited a while and nothing is found, we might be back in the app
                if (System.currentTimeMillis() - startTime > 3000) {
                    // Try to see if we can reach the app again by catching the exception
                    try {
                        if (composeTestRule.onAllNodesWithText("Select Vehicle").fetchSemanticsNodes().isNotEmpty()) {
                            return // Exit early if app UI is visible
                        }
                    } catch (e: Exception) { /* Keep waiting for system dialog */ }
                }
            }
        }
    }

    private fun ensureInLiveTrip() {
        composeTestRule.waitForIdle()

        // 1. Wait for Welcome or Dashboard
        composeTestRule.waitUntil(40000) {
            try {
                composeTestRule.onAllNodesWithTag("welcomeLoginButton").fetchSemanticsNodes().isNotEmpty() ||
                        composeTestRule.onAllNodesWithContentDescription("Trips", useUnmergedTree = true).fetchSemanticsNodes().isNotEmpty()
            } catch (e: Exception) { false }
        }

        val isWelcomeVisible = try {
            composeTestRule.onAllNodesWithTag("welcomeLoginButton").fetchSemanticsNodes().isNotEmpty()
        } catch (e: Exception) { false }

        if (isWelcomeVisible) {
            composeTestRule.onNodeWithTag("welcomeLoginButton").performClick()
            composeTestRule.onNodeWithTag("loginIdentifier").performTextInput("omnitech@gmail.com")
            composeTestRule.onNodeWithTag("loginPassword").performTextInput("MySecretPassword123!")
            composeTestRule.onNodeWithTag("loginButton").performClick()

            // 2. Handle Rationale Screen
            composeTestRule.waitUntil(30000) {
                try {
                    composeTestRule.onAllNodesWithText("Allow").fetchSemanticsNodes().isNotEmpty() ||
                            composeTestRule.onAllNodesWithContentDescription("Trips", useUnmergedTree = true).fetchSemanticsNodes().isNotEmpty()
                } catch (e: Exception) { false }
            }

            val inAppAllow = try { composeTestRule.onAllNodesWithText("Allow").fetchSemanticsNodes() } catch (e: Exception) { emptyList() }
            if (inAppAllow.isNotEmpty()) {
                composeTestRule.onNodeWithText("Allow").performClick()
                handleSystemPermissions(maxWaitMs = 10000)
                Thread.sleep(2000)
            }
        }

        // 3. Navigate to Trips
        composeTestRule.waitUntil(30000) {
            try {
                composeTestRule.onAllNodesWithContentDescription("Trips", useUnmergedTree = true).fetchSemanticsNodes().isNotEmpty()
            } catch (e: Exception) { false }
        }

        // Target the nav bar item specifically if multiple "Trips" labels exist
        composeTestRule.onAllNodesWithContentDescription("Trips", useUnmergedTree = true).onFirst().performClick()

        // 4. Start Trip Flow
        composeTestRule.waitUntil(30000) {
            try {
                composeTestRule.onAllNodesWithText("Start new trip").fetchSemanticsNodes().isNotEmpty()
            } catch (e: Exception) { false }
        }
        composeTestRule.onNodeWithText("Start new trip").performClick()

        // Handle Location Permission Popup
        handleSystemPermissions(maxWaitMs = 15000)

        // Critical: Sleep to allow Activity to resume after system dialog closes
        Thread.sleep(3000)
        composeTestRule.waitForIdle()

        // 5. Select Vehicle in Dialog
        composeTestRule.waitUntil(40000) {
            try {
                composeTestRule.onAllNodesWithText("Select Vehicle", useUnmergedTree = true).fetchSemanticsNodes().isNotEmpty()
            } catch (e: Exception) { false }
        }

        composeTestRule.onNodeWithText("Select Vehicle", useUnmergedTree = true).performClick()
        composeTestRule.waitForIdle()

        // Pick the last vehicle in the dropdown
        composeTestRule.onAllNodes(hasClickAction()).onLast().performClick()
        composeTestRule.waitForIdle()

        // 6. Confirm Start
        composeTestRule.waitUntil(20000) {
            try {
                composeTestRule.onAllNodesWithText("Start").fetchSemanticsNodes().isNotEmpty()
            } catch (e: Exception) { false }
        }

            // IMPORTANT: The app fetches location in the background of this dialog.
            // We wait 2 seconds to ensure the 'lat' and 'lng' variables are populated
            // before we click, otherwise the app's onClick logic will do nothing.
        Thread.sleep(2000)

            // Perform the click using the text as requested
        composeTestRule.onNodeWithText("Start").performClick()
        handleSystemPermissions(maxWaitMs = 10000)
        Thread.sleep(2000)

        // 7. Wait for Live Trip "Recording"
        composeTestRule.waitUntil(60000) {
            try {
                composeTestRule.onAllNodesWithText("Recording").fetchSemanticsNodes().isNotEmpty()
            } catch (e: Exception) { false }
        }
    }
}