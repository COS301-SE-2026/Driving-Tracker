package com.omnitech.drivingtracker

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.UiDevice
import org.junit.Rule
import org.junit.Test
import androidx.test.uiautomator.UiSelector
import com.omnitech.drivingtracker.data.sensors.ISensorFusionManager
import org.junit.Before
import javax.inject.Inject
import dagger.hilt.android.testing.HiltAndroidRule
import dagger.hilt.android.testing.HiltAndroidTest

@HiltAndroidTest
class DrivingTrackerE2E{

    @get:Rule(order = 0)
    var hiltRule: HiltAndroidRule = HiltAndroidRule(this)

    @get:Rule(order = 1)
    val composeTestRule = createAndroidComposeRule<MainActivity>()

    @Inject
    lateinit var sensorManager: ISensorFusionManager

    @Before
    fun init(){
        hiltRule.inject()
    }

    private fun performLoginAndHandlePermissions(){
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
    }

    @Test
    fun useCase1ManageVehiclesFlow(){

        val uniqueName = "Test Car ${System.currentTimeMillis()}"
        val editedName = "Edited ${System.currentTimeMillis()}"

        //performLoginAndHandlePermissions()
        composeTestRule.onNodeWithTag("welcomeLoginButton").performClick()
        composeTestRule.onNodeWithTag("loginIdentifier").performTextInput("test_login@gmail.com")
        composeTestRule.onNodeWithTag("loginPassword").performTextInput("Password123!")
        composeTestRule.onNodeWithTag("loginButton").performClick()

        //navigate to vehicles
        composeTestRule.waitUntil(10000) {
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

    @Test
    fun useCase4SafetyAlertFlow(){
        performLoginAndHandlePermissions()

        composeTestRule.onNodeWithContentDescription("Trips", useUnmergedTree = true).performClick()

        composeTestRule.onNodeWithText("Start new trip").performClick()

        val device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())
        val systemAllowButton = device.findObject(UiSelector().text("While using the app"))
        val buttonDidAppear = systemAllowButton.waitForExists(5000)
        val systemAllowButtonBackup = device.findObject(UiSelector().textMatches("(?i)Allow"))
        if(buttonDidAppear){
            systemAllowButton.click()
        }else if(systemAllowButtonBackup.exists()){
            systemAllowButtonBackup.click()
        }

        device.waitForIdle()

        composeTestRule.waitUntil(7000){
            try{
                composeTestRule.onAllNodesWithText("Select Vehicle").fetchSemanticsNodes().isNotEmpty()
            }catch(e: Exception){
                false
            }
        }
        composeTestRule.onNodeWithText("Select Vehicle").performClick()

        composeTestRule.onAllNodes(hasClickAction()).onFirst().performClick()

        composeTestRule.onNodeWithText("Start").performClick()

        composeTestRule.waitUntil(8000){
            composeTestRule.onAllNodesWithText("Recording").fetchSemanticsNodes().isNotEmpty()
        }

        sensorManager.triggerFakeEvent("HARSH_BRAKE")

        composeTestRule.waitUntil(8000){
            composeTestRule.onAllNodesWithTag("liveTripAlertBanner").fetchSemanticsNodes().isNotEmpty()
        }

        composeTestRule.onNodeWithTag("liveTripAlertBanner").assertIsDisplayed()

        composeTestRule.onNodeWithText("End Trip").performClick()
        composeTestRule.waitUntil(8000){
            composeTestRule.onAllNodesWithText("Past").fetchSemanticsNodes().isNotEmpty()
        }

        composeTestRule.onAllNodesWithText("See More").onFirst().performClick()

        composeTestRule.waitUntil(5000){
            composeTestRule.onAllNodesWithText("Trip Summary").fetchSemanticsNodes().isNotEmpty()
        }

        composeTestRule.onNodeWithText("Trip Summary").assertIsDisplayed()

        composeTestRule.onNodeWithText("Hard Braking").assertIsDisplayed()

        composeTestRule.onNode(hasText("1") and hasAnyAncestor(hasAnyChild(hasText("Hard Braking")))).assertIsDisplayed()
    }
}