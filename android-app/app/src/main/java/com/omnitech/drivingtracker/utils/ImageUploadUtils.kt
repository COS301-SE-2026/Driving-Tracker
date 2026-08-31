package com.omnitech.drivingtracker.utils

import android.net.Uri
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody
import android.content.Context

object ImageUploadUtils{
    private const val MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

    fun uriToMultipart(context: Context, uri: Uri, partName: String): MultipartBody.Part{
       val contentResolver = context.contentResolver
       val mimeType = contentResolver.getType(uri) ?: "image/jpeg"

       val bytes = contentResolver.openInputStream(uri)?.use{ it.readBytes() }
           ?: throw IllegalArgumentException("Unable to read the selected image")

        if(bytes.size > MAX_FILE_SIZE_BYTES){
            throw IllegalArgumentException("Image must be 10 MB or smaller")
        }

        val extension = when (mimeType){
            "image/png" -> "png"
            "image/webp" -> "webp"
            else -> "jpg"
        }

        val requestBody = bytes.toRequestBody(mimeType.toMediaTypeOrNull())
        return MultipartBody.Part.createFormData(partName, "upload.extension", requestBody)

    }
}