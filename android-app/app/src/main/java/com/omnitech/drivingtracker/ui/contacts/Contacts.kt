package com.omnitech.drivingtracker.ui.contacts

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.omnitech.drivingtracker.data.models.ConsentStatus
import com.omnitech.drivingtracker.data.models.ContactDto

@Composable
fun Contacts(viewModel: ContactsViewModel = viewModel()) {

    val state by viewModel.uiState.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ){
        Text("Trusted Contacts", style = MaterialTheme.typography.headlineSmall)
        Spacer(modifier = Modifier.height(16.dp))

        when(state){
            is ContactsViewModel.UiState.Idle, is ContactsViewModel.UiState.Loading -> {
                CircularProgressIndicator(modifier = Modifier.align(Alignment.CenterHorizontally))
            }
            is ContactsViewModel.UiState.Success -> {
                val contacts = (state as ContactsViewModel.UiState.Success).contacts
                if(contacts.isEmpty()) {
                    Text("No contacts yet")
                }else{
                    LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)){
                        items(contacts) { contact ->
                            ContactCard(contact)
                        }
                    }
                }
            }
            is ContactsViewModel.UiState.Error -> {
                val error = state as ContactsViewModel.UiState.Error
                Text(
                    "Error: ${error.message ?: "Unknown error"}",
                    color = MaterialTheme.colorScheme.error
                )
                Button(onClick = { viewModel.loadContacts() }){
                    Text("Retry")
                }
            }
        }
    }

//    var contacts by remember {
//        mutableStateOf<List<ContactDto>>(emptyList())
//    }
//    var isLoading by remember {
//        mutableStateOf(false)
//    }
//    var errorMessage by remember {
//        mutableStateOf<String?>(null)
//    }
//
//    LaunchedEffect(authToken) {
//        //do not make network request if user not signed in
//        if (authToken.isBlank()) {
//            return@LaunchedEffect
//        }
//
//        isLoading = true
//        errorMessage = null
//
//        //fetch current user's contacts
//        RetrofitClient.apiService.getContacts()
//            .enqueue(object : Callback<ContactsResponse> {
//                override fun onResponse(
//                    call: Call<ContactsResponse>,
//                    response: Response<ContactsResponse>
//                ) {
//                    isLoading = false
//
//                    //on success, replace list with server response
//                    if (response.isSuccessful) {
//                        contacts = response.body()?.data?.contacts.orEmpty()
//                    } else {
//                        errorMessage = "Failed to load contacts"
//                    }
//                }
//
//                override fun onFailure(call: Call<ContactsResponse>, t: Throwable) {
//                    isLoading = false
//                    errorMessage = t.message ?: "Network error"
//                }
//            })
//    }
//
//    Column(
//        modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background)
//    ) {
//        Row(
//            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp),
//            verticalAlignment = Alignment.CenterVertically,
//            horizontalArrangement = Arrangement.SpaceBetween
//        ) {
//            Icon(
//                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
//                contentDescription = "Back",
//                tint = MaterialTheme.colorScheme.onBackground
//            )
//            Row {
//                Text(
//                    text = "Driving ",
//                    fontWeight = FontWeight.Bold,
//                    fontSize = 18.sp,
//                    color = MaterialTheme.colorScheme.onBackground
//                )
//                Text(
//                    text = "Tracker",
//                    fontWeight = FontWeight.Normal,
//                    fontSize = 18.sp,
//                    color = MaterialTheme.colorScheme.onBackground
//                )
//            }
//            Icon(
//                imageVector = Icons.Default.Settings,
//                contentDescription = "Settings",
//                tint = MaterialTheme.colorScheme.onBackground
//            )
//        }
//        //Page title
//        Text(
//            text = "Contacts",
//            fontWeight = FontWeight.Bold,
//            style = MaterialTheme.typography.headlineLarge,
//            color = MaterialTheme.colorScheme.onBackground,
//            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
//        )
//
//        when {
//            authToken.isBlank() -> {
//                Box(
//                    modifier = Modifier.weight(1f).fillMaxWidth(),
//                    contentAlignment = Alignment.Center
//                ) {
//                    Text(
//                        text = "Sign in to load your contacts.",
//                        color = MaterialTheme.colorScheme.onSurfaceVariant
//                    )
//                }
//            }
//
//            isLoading -> {
//                Box(
//                    modifier = Modifier.weight(1f).fillMaxWidth(),
//                    contentAlignment = Alignment.Center
//                ) {
//                    CircularProgressIndicator()
//                }
//            }
//
//            errorMessage != null -> {
//                Box(
//                    modifier = Modifier.weight(1f).fillMaxWidth(),
//                    contentAlignment = Alignment.Center
//                ) {
//                    Text(
//                        text = errorMessage.orEmpty(),
//                        color = MaterialTheme.colorScheme.error
//                    )
//                }
//            }
//
//            else -> {
//                //Contacts
//                Column(
//                    modifier = Modifier.weight(1f).verticalScroll(rememberScrollState())
//                        .padding(horizontal = 16.dp),
//                    verticalArrangement = Arrangement.spacedBy(12.dp)
//                ) {
//                    contacts.forEach { contact ->
//                        ContactCard(contact = contact) //display contact card for each contact in the class
//                    }
//                    //Add contact button
//                    Spacer(modifier = Modifier.height(4.dp))
//                    OutlinedButton(
//                        onClick = {},
//                        shape = RoundedCornerShape(50),
//                        border = ButtonDefaults.outlinedButtonBorder(enabled = true),
//                    ) {
//                        Icon(
//                            imageVector = Icons.Default.Add,
//                            contentDescription = "Add",
//                            modifier = Modifier.size(16.dp)
//                        )
//                        Spacer(modifier = Modifier.width(8.dp))
//                        Text(text = "Add Contact")
//                    }
//                }
//            }
//        }
//
//        BottomNavBar()
//    }
}

@Composable
fun ContactCard(contact: ContactDto){
    Card(modifier = Modifier.fillMaxWidth().padding(8.dp)){
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ){
            Column(modifier = Modifier.weight(1f)){
                Text(contact.name, style = MaterialTheme.typography.bodyMedium)
                Text(contact.username, style = MaterialTheme.typography.bodySmall)
                if(contact.email != null){
                    Text(contact.email, style = MaterialTheme.typography.labelSmall)
                }
            }

            val statusColor = when (contact.consentStatus){
                ConsentStatus.APPROVED -> MaterialTheme.colorScheme.primary
                ConsentStatus.PENDING -> MaterialTheme.colorScheme.outline
                ConsentStatus.DENIED -> MaterialTheme.colorScheme.error
                else -> MaterialTheme.colorScheme.outline
            }

            ElevatedSuggestionChip(
                onClick = {},
                label = { Text(contact.consentStatus?.name ?: "Unknown") },
                colors = SuggestionChipDefaults.elevatedSuggestionChipColors(
                    containerColor = statusColor.copy(alpha = 0.2f)
                )
            )
        }
    }




    //only show trip sharing controls when backend says consent was approved
//    val isSharing = contact.consent_status == "APPROVED"
//
//    Card(
//        modifier = Modifier.fillMaxWidth(),
//        shape = RoundedCornerShape(5.dp),
//        colors = CardDefaults.cardColors(containerColor=Color(0xFFEEEEEE)),
//        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
//    ) {
//        Column(modifier = Modifier.padding(18.dp)) {
//            Row(verticalAlignment = Alignment.CenterVertically){
//                //Name and Avatar
//                Icon(
//                    imageVector = Icons.Default.AccountCircle,
//                    contentDescription = "Avatar",
//                    modifier = Modifier.size(40.dp),
//                    tint = MaterialTheme.colorScheme.outline
//                )
//                Spacer(modifier = Modifier.width(12.dp))
//                Column{
//                    Text(
//                        text = contact.name,
//                        fontWeight = FontWeight.SemiBold,
//                        style = MaterialTheme.typography.bodyLarge,
//                        color = MaterialTheme.colorScheme.onBackground
//                    )
//                    Text(
//                        text = contact.username,
//                        style = MaterialTheme.typography.bodyMedium,
//                        color = MaterialTheme.colorScheme.onSurfaceVariant
//                    )
//                }
//            }
//
//            if(isSharing){
//                Spacer(modifier = Modifier.height(12.dp))
//                Row(
//                    modifier = Modifier.fillMaxWidth(),
//                    verticalAlignment = Alignment.CenterVertically,
//                    horizontalArrangement = Arrangement.SpaceBetween
//                ){
//                    Row(verticalAlignment = Alignment.CenterVertically){
//                        Box(
//                            modifier = Modifier.size(10.dp).background(MaterialTheme.colorScheme.error, CircleShape)
//                        )
//                        Spacer(modifier = Modifier.width(6.dp))
//                        Text(
//                            text = "On Trip",
//                            style = MaterialTheme.typography.bodyMedium,
//                            color = MaterialTheme.colorScheme.onSurfaceVariant
//                        )
//                    }
//                    Button(
//                        onClick = {},
//                        shape = RoundedCornerShape(50),
//                        colors = ButtonDefaults.buttonColors(
//                            containerColor = Green,
//                            contentColor = Color.White
//                        ),
//                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 2.dp),
//                        modifier = Modifier.height(30.dp).padding(end=8.dp).padding(vertical=4.dp)
//                    ) {
//                        Text("See Activity", style = MaterialTheme.typography.bodyMedium)
//                    }
//                }
//            }
//        }
//    }
}

@Preview(showBackground=true)
@Composable
fun ContactsPreview(){
    DrivingTrackerTheme{
        Contacts()
    }
}