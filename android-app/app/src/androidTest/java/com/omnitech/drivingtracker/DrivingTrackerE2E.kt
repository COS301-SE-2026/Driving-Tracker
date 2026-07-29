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

        val uniqueName = "Test Car ${System.currentTimeMillis()}"
        val editedName = "Edited ${System.currentTimeMillis()}"

        //login - prereq
        composeTestRule.onNodeWithTag("welcomeLoginButton").performClick()
        composeTestRule.onNodeWithTag("loginIdentifier").performTextInput("test_login@gmail.com")
        composeTestRule.onNodeWithTag("loginPassword").performTextInput("Password123!")
        composeTestRule.onNodeWithTag("loginButton").performClick()

        composeTestRule.waitUntil(7000) {
            composeTestRule.onAllNodesWithText("Allow").fetchSemanticsNodes().isNotEmpty()
        }

        composeTestRule.onNodeWithText("Allow").performClick()

        val device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())
        val systemAllowButton = device.findObject(UiSelector().textMatches("(?i)allow|while using the app"))
        if(systemAllowButton.exists()){
            systemAllowButton.click()
            device.waitForIdle()
        }

        //navigate to vehicles
        composeTestRule.waitUntil(8000) {
            try{
                composeTestRule.onAllNodesWithTag("topBarLeftButton").fetchSemanticsNodes().isNotEmpty()
            }catch (e: Exception){
                false
            }
        }

        composeTestRule.onNodeWithTag("topBarLeftButton").performClick()


        composeTestRule.waitUntil(5000) {
            composeTestRule.onAllNodesWithText("Vehicles").fetchSemanticsNodes().isNotEmpty()
        }

        //find vehicles options
        composeTestRule.onNodeWithText("Vehicles").performClick()

        composeTestRule.waitUntil(7000) {
            composeTestRule.onAllNodesWithTag("vehicleList", useUnmergedTree = true).fetchSemanticsNodes().isNotEmpty()
        }

        composeTestRule.onNodeWithTag("vehicleList", useUnmergedTree = true).performScrollToNode(hasTestTag("buttonOpenAddVehicleDialog"))

        //add new vehicle
        composeTestRule.onNodeWithTag("buttonOpenAddVehicleDialog").performClick()

        composeTestRule.waitUntil(3000) {
            composeTestRule.onAllNodesWithText("Add New Vehicle").fetchSemanticsNodes().isNotEmpty()
        }

        //fill dialog fields
        composeTestRule.onNodeWithTag("addVehicleName").performTextInput(uniqueName)
        composeTestRule.onNodeWithTag("addVehicleRegistration").performTextInput("ABC 123 GP")
        composeTestRule.onNodeWithTag("addVehicleMake").performTextInput("Ford")
        composeTestRule.onNodeWithTag("addVehicleModel").performTextInput("Fiesta")
        composeTestRule.onNodeWithTag("addVehicleYear").performTextInput("2020")

        //select fuel type
        composeTestRule.onNodeWithText("Petrol").performClick()

        //click final add button
        composeTestRule.onNodeWithTag("addVehicleConfirmButton").performClick()

        composeTestRule.waitForIdle()
        //verify
//        composeTestRule.waitUntil(5000){
//            composeTestRule.onAllNodesWithText(uniqueName).fetchSemanticsNodes().isNotEmpty()
//        }

        composeTestRule.onNodeWithTag("vehicleList", useUnmergedTree = true).performScrollToNode(hasText(uniqueName))

        composeTestRule.onNodeWithText(uniqueName).assertIsDisplayed()

        composeTestRule.onNodeWithTag("buttonVehicleOptions$uniqueName").performClick()
        //Edit
//        composeTestRule.onNode(hasContentDescription("Options") and
//                hasAnyAncestor(hasAnyChild(hasText(uniqueName)))).performClick()

        composeTestRule.waitUntil(3000){
            composeTestRule.onAllNodesWithText("Edit Name").fetchSemanticsNodes().isNotEmpty()
        }

        composeTestRule.onNodeWithText("Edit Name").performClick()

        composeTestRule.onNode(hasText(uniqueName) and hasSetTextAction()).performTextReplacement(editedName)

        composeTestRule.onNodeWithText("Save").performClick()

        composeTestRule.waitForIdle()
//        composeTestRule.waitUntil(10000){
//            composeTestRule.onAllNodesWithText(editedName).fetchSemanticsNodes().isNotEmpty()
//        }

        composeTestRule.onNodeWithTag("vehicleList", useUnmergedTree = true).performScrollToNode(hasText(editedName))
        composeTestRule.onNodeWithText(editedName).assertIsDisplayed()

        //Delete
//        composeTestRule.onNode(
//            hasContentDescription("Options") and
//            hasAnyAncestor(hasAnyChild(hasText(editedName)))
//        ).performClick()
        composeTestRule.onNodeWithTag("buttonVehicleOptions$editedName").performClick()

        composeTestRule.onNodeWithText("Remove Vehicle").performClick()
        composeTestRule.onNodeWithText("Remove").performClick()

        composeTestRule.waitForIdle()
        composeTestRule.onNodeWithText(editedName).assertDoesNotExist()
    }
}