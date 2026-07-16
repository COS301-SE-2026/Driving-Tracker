package com.omnitech.drivingtracker.ui.components
import androidx.compose.runtime.Composable
import androidx.compose.ui.*
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.unit.*
import androidx.compose.foundation.*
import com.omnitech.drivingtracker.data.models.*


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
        title = {Text("Share Contact With: ")},
        text = {
            Column{
                contacts.forEach{
                    contact ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable{
                                onSelectionChange(
                                    if (contact.contactId in selectedContactIds) selectedContactIds - contact.contactId
                                    else selectedContactIds + contact.contactId
                                )
                            }
                            .padding(vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ){
                        Checkbox(
                            checked = contact.contactId in selectedContactIds,
                            onCheckedChange = {
                                checked ->
                                onSelectionChange(
                                    if (checked) selectedContactIds + contact.contactId
                                    else selectedContactIds - contact.contactId
                                )
                            }
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(contact.name)
                    }
                }
            }
        },
        confirmButton = { //FIX TO ACTUALLY SEND TRIP
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