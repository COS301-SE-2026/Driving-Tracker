package com.omnitech.drivingtracker.ui.components
import androidx.compose.runtime.Composable
import androidx.compose.ui.*
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.unit.*
import androidx.compose.foundation.*
import com.omnitech.drivingtracker.data.models.*
import androidx.compose.foundation.lazy.*


@Composable
fun ShareTripDialog(
    contacts: List<ContactDto>, //tracking by ID
    selectedContactIds: Set<String>,
    onSelectionChange: (Set<String>) -> Unit,
    onDismiss: () -> Unit, //Don't send trip
    onConfirm: () -> Unit //send trip
){
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {Text("Share Trip With: ")},
        text = {
            Column {
                if (contacts.isEmpty()) {
                    EmptyContactsView()
                } else {
                    ContactsListView(contacts, selectedContactIds, onSelectionChange)
                }
            }
        },
        confirmButton = {
            Button(onClick = onConfirm, enabled = selectedContactIds.isNotEmpty()){
                //enabled stops a user from sending without a contact being selected
                Text("Send Trip")
            }
        },

        dismissButton = {TextButton(onClick = onDismiss){
            Text("Cancel")
        } }
    )
}

@Composable
private fun ContactsListView(
    contacts: List<ContactDto>,
    selectedContactIds: Set<String>,
    onSelectionChange: (Set<String>) -> Unit
){
    LazyColumn( modifier = Modifier.heightIn(max = 300.dp)){
        items(contacts) { contact ->
            ContactsSelectionRow(
                contact = contact,
                isSelected = contact.contactId in selectedContactIds,
                onToggle = {isChecked ->
                    val newSelection = if (isChecked){
                        selectedContactIds + contact.contactId
                    }
                    else{
                        selectedContactIds - contact.contactId
                    }
                    onSelectionChange(newSelection)
                }
            )
        }
    }
}

@Composable
private fun EmptyContactsView(){
    Text("No Contacts Found.")
}

@Composable
private fun ContactsSelectionRow(
    contact: ContactDto,
    isSelected: Boolean,
    onToggle: (Boolean) -> Unit
){
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable {
                onToggle(!isSelected)
            }
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Checkbox(
            checked = isSelected,
            onCheckedChange = { onToggle(it)
            }
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(contact.name)
    }
}