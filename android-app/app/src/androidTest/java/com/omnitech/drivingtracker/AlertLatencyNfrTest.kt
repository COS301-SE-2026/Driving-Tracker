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

    companion object {
        private const val SELECT_VEHICLE = "Select Vehicle"
        private const val TRIPS_LABEL = "Trips"
        private const val ALLOW_LABEL = "Allow"
        private const val RECORDING_LABEL = "Recording"
    }

    @Before
    fun init() {
        hiltRule.inject()
        ensureInLiveTrip()
    }

    @Test
    fun testAlertVisibilityLatency_Target3000ms() {
        // Wait for the "Recording" badge to be stable
        composeTestRule.waitUntil(60000) {
            isTextVisible(RECORDING_LABEL)
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
            handleAndroid12PreciseLocation(device)

            if (tryClickPermissionButton(device)) {
                // If we clicked a button, wait a moment to see if another permission (like Notifications) follows
                Thread.sleep(1500)
            } else {
                // If no button found, wait a bit and retry until timeout
                Thread.sleep(500)
                // If we've waited a while and nothing is found, we might be back in the app
                if (System.currentTimeMillis() - startTime > 3000 && isTextVisible(SELECT_VEHICLE)) {
                    return // Exit early if app UI is visible
                }
            }
        }
    }

    private fun handleAndroid12PreciseLocation(device: UiDevice) {
        // 1. Handle Android 12+ "Precise" location toggle if it exists
        val preciseSelector = UiSelector().resourceIdMatches(".*:id/precise_location_selection.*")
        val preciseButton = device.findObject(preciseSelector)
        if (preciseButton.exists()) {
            preciseButton.click()
        }
    }

    private fun tryClickPermissionButton(device: UiDevice): Boolean {
        // 2. Try various selectors for the "Allow" / "While using the app" button
        val selectors = listOf(
            UiSelector().resourceIdMatches(".*:id/permission_allow_foreground_only_button"),
            UiSelector().resourceIdMatches(".*:id/permission_allow_button"),
            UiSelector().textMatches("(?i).*While using the app.*"),
            UiSelector().textMatches("(?i).*Allow.*"),
            UiSelector().textMatches("(?i).*Only this time.*")
        )

        for (selector in selectors) {
            val button = device.findObject(selector)
            if (button.exists()) {
                button.click()
                device.waitForIdle()
                return true
            }
        }
        return false
    }

    private fun ensureInLiveTrip() {
        composeTestRule.waitForIdle()

        // 1. Wait for Welcome or Dashboard
        waitForAppReady()

        if (isTagVisible("welcomeLoginButton")) {
            performLogin()
            handleInitialRationale()
        }

        navigateToTrips()
        triggerStartTripFlow()
        selectVehicleAndConfirmStart()

        // 7. Wait for Live Trip "Recording"
        composeTestRule.waitUntil(60000) {
            isTextVisible(RECORDING_LABEL)
        }
    }

    private fun waitForAppReady() {
        composeTestRule.waitUntil(40000) {
            isTagVisible("welcomeLoginButton") || isContentDescriptionVisible(TRIPS_LABEL)
        }
    }

    private fun performLogin() {
        composeTestRule.onNodeWithTag("welcomeLoginButton").performClick()
        composeTestRule.onNodeWithTag("loginIdentifier").performTextInput("omnitech@gmail.com")
        composeTestRule.onNodeWithTag("loginPassword").performTextInput("MySecretPassword123!")
        composeTestRule.onNodeWithTag("loginButton").performClick()
    }

    private fun handleInitialRationale() {
        // 2. Handle Rationale Screen
        composeTestRule.waitUntil(30000) {
            isTextVisible(ALLOW_LABEL) || isContentDescriptionVisible(TRIPS_LABEL)
        }

        if (isTextVisible(ALLOW_LABEL)) {
            composeTestRule.onNodeWithText(ALLOW_LABEL).performClick()
            handleSystemPermissions(maxWaitMs = 10000)
            Thread.sleep(2000)
        }
    }

    private fun navigateToTrips() {
        // 3. Navigate to Trips
        composeTestRule.waitUntil(30000) {
            isContentDescriptionVisible(TRIPS_LABEL)
        }

        // Target the nav bar item specifically if multiple "Trips" labels exist
        composeTestRule.onAllNodesWithContentDescription(TRIPS_LABEL, useUnmergedTree = true).onFirst().performClick()
    }

    private fun triggerStartTripFlow() {
        // 4. Start Trip Flow
        composeTestRule.waitUntil(30000) {
            isTextVisible("Start new trip")
        }
        composeTestRule.onNodeWithText("Start new trip").performClick()

        // Handle Location Permission Popup
        handleSystemPermissions(maxWaitMs = 15000)

        // Critical: Sleep to allow Activity to resume after system dialog closes
        Thread.sleep(3000)
        composeTestRule.waitForIdle()
    }

    private fun selectVehicleAndConfirmStart() {
        // 5. Select Vehicle in Dialog
        composeTestRule.waitUntil(40000) {
            isTextVisible(SELECT_VEHICLE)
        }

        composeTestRule.onNodeWithText(SELECT_VEHICLE, useUnmergedTree = true).performClick()
        composeTestRule.waitForIdle()

        // Pick the last vehicle in the dropdown
        composeTestRule.onAllNodes(hasClickAction()).onLast().performClick()
        composeTestRule.waitForIdle()

        // 6. Confirm Start
        composeTestRule.waitUntil(20000) {
            isTextVisible("Start")
        }

        // IMPORTANT: The app fetches location in the background of this dialog.
        // We wait 2 seconds to ensure the 'lat' and 'lng' variables are populated
        // before we click, otherwise the app's onClick logic will do nothing.
        Thread.sleep(2000)

        // Perform the click using the text as requested
        composeTestRule.onNodeWithText("Start").performClick()
        handleSystemPermissions(maxWaitMs = 10000)
        Thread.sleep(2000)
    }

    private fun isTextVisible(text: String): Boolean = try {
        composeTestRule.onAllNodesWithText(text).fetchSemanticsNodes().isNotEmpty()
    } catch (e: Exception) { false }

    private fun isTagVisible(tag: String): Boolean = try {
        composeTestRule.onAllNodesWithTag(tag).fetchSemanticsNodes().isNotEmpty()
    } catch (e: Exception) { false }

    private fun isContentDescriptionVisible(description: String): Boolean = try {
        composeTestRule.onAllNodesWithContentDescription(description, useUnmergedTree = true).fetchSemanticsNodes().isNotEmpty()
    } catch (e: Exception) { false }
}