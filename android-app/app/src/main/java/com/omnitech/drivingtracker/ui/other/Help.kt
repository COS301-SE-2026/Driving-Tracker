package com.omnitech.drivingtracker.ui.other
import androidx.compose.foundation.clickable
import androidx.compose.runtime.Composable
import androidx.navigation.NavController
import com.omnitech.drivingtracker.Screen
import com.omnitech.drivingtracker.ui.components.StandardScreen
import androidx.compose.foundation.layout.*
import androidx.compose.ui.unit.*
import androidx.compose.ui.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.navigation.compose.rememberNavController
import com.omnitech.drivingtracker.ui.theme.DrivingTrackerTheme
import androidx.compose.material3.*
import androidx.compose.ui.graphics.Color
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.Arrangement

@Composable
fun Help(navController: NavController?=null){

    data class FaqItem(
        val category: String,
        val question: String,
        val answer: String
    )

    val faqItems = listOf(
        FaqItem("General","How do I share my trips with my friends and family?",
            "Go to the contacts page and add a contact. Then when starting a trip, " +
                    "select a contact to share your trip with. " +
                    "In the case that you forget to choose a contact," +
                    "press 'Share Trip' and select your trusted contacts. ")
    )

    val categories = faqItems.map {it.category}.distinct()//so that items are added where they need to be

    StandardScreen(
        navController = navController,
        title = "Help",
        onLeftClick = {navController?.popBackStack()},
        onRightClick = {navController?.navigate(Screen.Settings.route)},
        showBottomBar = false

    ) {
        Spacer(modifier = Modifier.height(20.dp))

        Column(

        ){
            /*RowOne()
            RowTwo()
            QuestionCard()*/
        }
    }
}

@Composable
fun RowOne(selectedTab: Int, onTabSelected: (Int) -> Unit){ //TABS
    val tabs = listOf("FAQ", "Contact Us")
    Row(
        modifier = Modifier.fillMaxWidth()
    ){
        tabs.forEachIndexed{
            index, label ->
            Column(
                modifier = Modifier.weight(1f).clickable{onTabSelected(index)},
                horizontalAlignment = Alignment.CenterHorizontally
            ){
                Text(
                    text = label,
                    fontWeight = if (selectedTab == index) FontWeight.Bold else FontWeight.Normal,
                    modifier = Modifier.padding(vertical = 12.dp)
                )
                Box(modifier = Modifier.height(2.dp)
                    .fillMaxWidth(0.6f)
                    .background(if (selectedTab == index)
                    Color.Black
                    else Color.Transparent))
            }
        }
    }
}

@Composable //CATEGORIES
fun RowTwo(
    categories: List<String>,
    selectedCategory: String,
    onCategorySelected: (String) -> Unit
){
    Row(
        modifier = Modifier.padding(horizontal = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ){
        categories.forEach {
            category ->
            FilterChip(
                selected = category == selectedCategory,
                onClick = {onCategorySelected(category)},
                label = {Text(category)},
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = Color.Green,
                    selectedLabelColor = Color.White
                )
            )
        }
    }
}

@Composable
fun QuestionCard(navController: NavController){

}

@Preview(showBackground = true)
@Composable
fun HelpPreview(){
    DrivingTrackerTheme {
        Help(navController = rememberNavController())
    }
}
