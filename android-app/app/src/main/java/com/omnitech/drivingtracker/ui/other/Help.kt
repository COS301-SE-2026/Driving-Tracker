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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.*

data class FaqItem(
    val category: String,
    val question: String,
    val answer: String
)
@Composable
fun Help(navController: NavController?=null){


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
fun QuestionCard(items: List<FaqItem>){
    Column(
        modifier = Modifier.padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ){
        items.forEach{
            item -> Question( item = item)
        }
    }

}

@Composable
fun Question(item : FaqItem){

    var expanded by remember { mutableStateOf(false) }

    Card(
        onClick = { expanded = !expanded},
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(MaterialTheme.colorScheme.onSurfaceVariant),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ){
        Column( modifier = Modifier.fillMaxWidth()){
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ){
                Text(
                    text = item.question,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.weight(1f)
                )
                Icon(
                    imageVector = if (expanded)
                                    Icons.Default.KeyboardArrowUp
                                    else Icons.Default.KeyboardArrowUp,
                    contentDescription = null,
                    tint = Color.Gray
                )
            }
            if (expanded){
                Text(
                    text = item.answer,
                    fontSize = 13.sp,
                    color = Color.Gray,
                    modifier = Modifier.padding(top = 8.dp)
                )
            }
        }
    }
}

@Preview(showBackground = true)
@Composable
fun HelpPreview(){
    DrivingTrackerTheme {
        Help(navController = rememberNavController())
    }
}
