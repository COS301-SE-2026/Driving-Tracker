import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";
import { randomUUID } from "node:crypto";
import { ExtendedError } from "../utils/errors";

const CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const PROFILE_CONTAINER_NAME = process.env.AZURE_STORAGE_PROFILE_CONTAINER_NAME;
const VEHICLE_CONTAINER_NAME = process.env.AZURE_STORAGE_VEHICLE_CONTAINER_NAME;

if(!CONNECTION_STRING){
    throw new Error("AZURE_STORAGE_CONTAINER_STRING is not set");
}

if(!PROFILE_CONTAINER_NAME){
    throw new Error("AZURE_STORAGE_PROFILE_CONTAINER_NAME is not set");
}

if(!VEHICLE_CONTAINER_NAME){
    throw new Error("AZURE_STORAGE_VEHICLE_CONTAINER_NAME is not set");
}

const blob_service_client = BlobServiceClient.fromConnectionString(CONNECTION_STRING);

export type ImageKind = "profile" | "vehicle";

const container_clients: Record<ImageKind, ContainerClient> = {
    profile: blob_service_client.getContainerClient(PROFILE_CONTAINER_NAME),
    vehicle: blob_service_client.getContainerClient(VEHICLE_CONTAINER_NAME),
}

function extension_from_mimetype(mimetype: string): string {
    switch(mimetype){
        case "image/jpeg":
        case "image/jpg":
            return "jpg";
        case "image/png":
            return "png";
        case "image/webp":
            return "webp";
        default:
            throw new ExtendedError("Unsupported image type", "INVALID_FILE_TYPE");
    }
}

export interface BlobDownload{
    stream: NodeJS.ReadableStream;
    content_Type: string;
    content_length?: number;
}

export const blob_storage_service = {
    //uploads an image buffer into the container for the given kind and returns the blob's internal name
    async upload_image(file: {buffer: Buffer; mimetype: string}, kind: ImageKind): Promise<string> {
        const extension = extension_from_mimetype(file.mimetype);
        const blob_name = `${randomUUID()}.${extension}`;
        const block_blob_client = container_clients[kind].getBlockBlobClient(blob_name);

        await block_blob_client.uploadData(file.buffer, {
            blobHTTPHeaders: {
                blobContentType: file.mimetype
            },
        });

        return blob_name;
    },

    async download(kind: ImageKind, blob_name: string): Promise<BlobDownload> {
        const block_blob_client = container_clients[kind].getBlockBlobClient(blob_name);
        const download_response = await block_blob_client.download();

        if(!download_response.readableStreamBody){
            throw new ExtendedError("Image could not be read from storage", "IMAGE_READ_FAILED");
        }
        return{
            stream: download_response.readableStreamBody,
            content_Type: download_response.contentType ?? "application/octet-stream",
            content_length: download_response.contentLength,
        };
    },

    async delete_image(kind: ImageKind, blob_name: string | null | undefined): Promise<void> {
        if(!blob_name){
            return;
        }

        try{
            const block_blob_client = container_clients[kind].getBlockBlobClient(blob_name);
            await block_blob_client.deleteIfExists();
        }catch{

        }
    }
}