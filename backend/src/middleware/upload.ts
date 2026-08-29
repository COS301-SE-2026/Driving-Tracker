import multer, { type FileFilterCallback } from "multer";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIMETYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

function file_filter(req: unknown, file: Express.Multer.File, callback: FileFilterCallback){
    if(!ALLOWED_MIMETYPES.includes(file.mimetype)){
        callback(new Error("INVALID_FILE_TYPE"));
        return;
    }

    callback(null, true);
}

//files kept in memory, then handed to blob
export const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE_BYTES },
    fileFilter: file_filter,
})