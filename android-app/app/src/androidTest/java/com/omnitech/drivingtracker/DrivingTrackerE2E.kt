package com.omnitech.drivingtracker

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.UiDevice
import org.junit.Rule
import org.junit.Test
import androidx.test.uiautomator.UiSelector

class DrivingTrackerE2E{
    @get:Rule
    val composeTestRule = createAndroidComposeRule<MainActivity>()

    @Test
    fun useCase1ManageVehiclesFlow(){
        //login - prereq
        composeTestRule.onNodeWithTag("welcomeLoginButton").performClick()
        composeTestRule.onNodeWithTag("loginIdentifier").performTextInput("test_login@gmail.com")
        composeTestRule.onNodeWithTag("loginPassword").performTextInput("Password123!")
        composeTestRule.onNodeWithTag("loginButton").performClick()

        composeTestRule.waitUntil(5000) {
            composeTestRule.onAllNodesWithText("Allow").fetchSemanticsNodes().isNotEmpty()
        }

        composeTestRule.onNodeWithText("Allow").performClick()

        val device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())
        val systemAllowButton = device.findObject(UiSelector().textMatches("(?i)allow|while using the app"))
        if(systemAllowButton.exists()){
            systemAllowButton.click()
        }

        //navigate to vehicles
        composeTestRule.waitUntil(5000) {
            composeTestRule.onAllNodesWithTag("topBarLeftButton").fetchSemanticsNodes().isNotEmpty()
        }

        composeTestRule.onNodeWithTag("topBarLeftButton").performClick()

        composeTestRule.waitUntil(5000) {
            composeTestRule.onAllNodesWithText("Vehicles").fetchSemanticsNodes().isNotEmpty()
        }

        //find vehicles options
        composeTestRule.onNodeWithText("Vehicles").performClick()

        composeTestRule.waitUntil(7000) {
            composeTestRule.onAllNodesWithTag("buttonOpenAddVehicleDialog").fetchSemanticsNodes().isNotEmpty()
        }

        //add new vehicle
        composeTestRule.onNodeWithTag("buttonOpenAddVehicleDialog").performScrollTo().performClick()

        composeTestRule.waitUntil(3000) {
            composeTestRule.onAllNodesWithText("Add New Vehicle").fetchSemanticsNodes().isNotEmpty()
        }
        
        //fill dialog fields
        composeTestRule.onNodeWithTag("addVehicleName").performTextInput("My New Car")
        composeTestRule.onNodeWithTag("addVehicleRegistration").performTextInput("ABC 123 GP")
        composeTestRule.onNodeWithTag("addVehicleMake").performTextInput("Ford")
        composeTestRule.onNodeWithTag("addVehicleModel").performTextInput("Fiesta")
        composeTestRule.onNodeWithTag("addVehicleYear").performTextInput("2020")

        //select fuel type
        composeTestRule.onNodeWithText("Petrol").performClick()

        //click final add button
        composeTestRule.onNodeWithTag("addVehicleConfirmButton").performClick()

        //verify
        composeTestRule.waitUntil(5000){
            composeTestRule.onAllNodesWithText("My New Car").fetchSemanticsNodes().isNotEmpty()
        }
        composeTestRule.onNodeWithText("My New Car").assertIsDisplayed()
    }
}