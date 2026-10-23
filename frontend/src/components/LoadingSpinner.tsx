import { LoaderCircle } from "lucide-react";

export default function LoadingSpinner({
    message = "Loading..."
} : {message?: string}){
    return(
        <div
        role = "status"
        aria-live = "polite"
        className="flex flex-col items-center justify-center gap-3 py-24"
        >
            <LoaderCircle aria-hidden="true" className="animate-spin"/>
            <span>{message}</span>
        </div>
    );
}