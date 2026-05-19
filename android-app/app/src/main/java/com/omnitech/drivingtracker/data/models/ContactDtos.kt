package com.omnitech.drivingtracker.data.models

import com.google.gson.annotations.SerializedName

//response models matching backend structure for /contacts endpoint

enum class ConsentStatus(val value: String){
    PENDING("PENDING"),
    APPROVED("APPROVED"),
    DENIED("DENIED");

    override fun toString() = value
}

data class ContactsResponse(
    val data: ContactsData,
    val message: String? = null
)

data class ContactsData(
    val contacts: List<ContactDto>
)

data class ContactDto(
    @SerializedName("contact_id")
    val contactId: String,
    val username: String,
    val name: String,
    val email: String? = null,
    @SerializedName("consent_status")
    val consentStatus: ConsentStatus? = null
)

data class CreateContactRequest(
    val identifier: String // email or username
)

data class CreateContactResponse(
    val message: String,
    val data: ContactDto
)

data class ContactIdWrapper(
    @SerializedName("contact_id")
    val contactId: String
)

data class AlertContactsRequest(
    val event_type: String,
    val event_id: String? = null,
    val message: String? = null,
    val contacts: List<ContactIdWrapper>
)

data class ShareLocationRequest(
    val contacts: List<ContactIdWrapper>,
    val lat: Double,
    val lng: Double
)

data class GenericResponse(
    val message: String,
    val data: Map<String, Any>? = null
)