package com.omnitech.drivingtracker.data.models

import com.google.gson.annotations.SerializedName

data class RegisterFcmRequest(
    @SerializedName("fcm_token") val fcmToken: String
)

data class RegisterFcmResponse(
    val message: String
)

data class RespondContactRequest(
    val status: String
)

data class RespondContactResponse(
    val message: String,
    val data: RespondContactData
)

data class RespondContactData(
    @SerializedName("contact_id") val contactId: String
)

data class NotificationsResponse(
    val message: String,
    val data: NotificationsData
)

data class NotificationsData(
    val notifications: List<NotificationDto>
)

data class NotificationDto(
    @SerializedName("notification_id")
    val notificationId: String,
    val type: String,
    val title: String,
    val body: String? = null,
    @SerializedName("reference_id")
    val referenceId: String? = null,
    @SerializedName("reference_type")
    val referenceType: String? = null,
    @SerializedName("created_at")
    val createdAt: String
)

data class DeleteNotificationsResponse(
    val message: String,
    val data: DeleteNotificationsData
)

data class DeleteNotificationsData(
    @SerializedName("deleted_count")
    val deletedCount: Int
)



