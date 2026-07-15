package com.omnitech.drivingtracker.ui.other
import androidx.compose.foundation.clickable
import androidx.compose.runtime.Composable
import androidx.navigation.NavController
import com.omnitech.drivingtracker.Screen
import com.omnitech.drivingtracker.ui.components.StandardScreen
import androidx.compose.foundation.layout.*
import androidx.compose.ui.unit.*
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
import androidx.compose.material.icons.filled.*
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.*
import androidx.compose.ui.graphics.vector.*

data class FaqItem(
    val category: String,
    val question: String,
    val answer: String
)

data class ContactItem(
    val icon: ImageVector,
    val name: String,
    val value: String
)
@Composable
fun Help(navController: NavController?=null){

    val faqItems = listOf(
        FaqItem("General","How do I share my trips with my friends and family?",
            "Go to the contacts page and add a contact. Then when starting a trip, " +
                    "select a contact to share your trip with. " +
                    "In the case that you forget to choose a contact," +
                    "press 'Share Trip' and select your trusted contacts. "),
        FaqItem("General","Is my data safe and private?",
            "Yes, all trip data is encrypted and never sold to third parties."),
        FaqItem("Connections", "How do I connect my OBD device?",
            "Open the More page from the navbar, press OBD, and then press OBD Adapters. " +
                    "After this press the 'Add device' button and then follow the steps.")
    )

    val contactItems = listOf(
        ContactItem(Icons.Default.Mail,"Email","omnitech.capstone@gmail.com"),
        ContactItem(Icons.Default.Phone,"Phone Number","+27 658 0565"),
        ContactItem(Icons.Default.Business,"Address","Private Bag X20 \n Hatfield \n 0028 \n South Africa")
    )

    val categories = faqItems.map {it.category}.distinct()//so that items are added where they need to be

    var selectedTab by remember {mutableStateOf(0)}
    var selectedCategory by remember { mutableStateOf(categories.first()) }

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
            RowOne(selectedTab){ selectedTab = it}

            Spacer(modifier = Modifier.height(16.dp))

            //FAQ
            if (selectedTab == 0){

                RowTwo(categories, selectedCategory) { selectedCategory = it }

                Spacer(modifier = Modifier.height(16.dp))

                QuestionCard(faqItems.filter {it.category == selectedCategory})

            }
            //Contact Us
            else{
                Spacer(modifier = Modifier.height(16.dp))
                ContactCard(contactItems)
            }
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
                    fontWeight = if (selectedTab == index) FontWeight.ExtraBold else FontWeight.ExtraBold,
                    modifier = Modifier.padding(vertical = 12.dp)
                )
                Box(modifier = Modifier.height(2.dp)
                    .fillMaxWidth(0.6f)
                    .background(if (selectedTab == index)
                    Color.Black
                    else Color.LightGray))
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
                    selectedContainerColor = MaterialTheme.colorScheme.primary,
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
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ){
        Column( modifier = Modifier.fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 14.dp)){
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ){
                Text(
                    text = item.question,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.weight(1f),
                    color = Color.Black,
                    fontSize = 20.sp
                )
                Icon(
                    imageVector = if (expanded)
                                    Icons.Default.KeyboardArrowUp
                                    else Icons.Default.KeyboardArrowDown,
                    contentDescription = null,
                    tint = Color.Black
                )
            }
            if (expanded){
                Text(
                    text = item.answer,
                    fontSize = 15.sp,
                    color = Color.Black,
                    modifier = Modifier.padding(top = 8.dp),
                    fontWeight = FontWeight.Normal
                )
            }
        }
    }
}

@Composable
fun ContactCard(items : List<ContactItem>){
    Column(
        modifier = Modifier.padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ){
        items.forEach {item -> ContactRow(item = item)}
    }
}

@Composable
fun ContactRow(item : ContactItem){
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ){
        Row(
            modifier = Modifier.fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically
        ){

            Icon(
                imageVector = item.icon,
                contentDescription = item.name,
                tint = MaterialTheme.colorScheme.primary
            )

            Spacer(modifier = Modifier.width(12.dp))

            Column{
                Text(
                    text = item.name,
                    fontSize = 20.sp,
                    color = Color.Black
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = item.value,
                    fontWeight = FontWeight.SemiBold,
                    color = Color.DarkGray
                )
            }
        }
    }
    Spacer(modifier = Modifier.height(16.dp))
}

@Preview(showBackground = true)
@Composable
fun HelpPreview(){
    DrivingTrackerTheme {
        Help(navController = rememberNavController())
    }
}
