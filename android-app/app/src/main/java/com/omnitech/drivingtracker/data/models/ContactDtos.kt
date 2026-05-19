package com.omnitech.drivingtracker.data.models

//response models matching backend structure for /contacts endpoint

data class ContactsResponse(
    val data: ContactsData,
    val message: String? = null
)

data class ContactsData(
    val contacts: List<ContactDto>
)

data class ContactDto(
    val contact_id: String,
    val username: String,
    val name: String,
    val email: String? = null,
    val consent_status: String? = null
)