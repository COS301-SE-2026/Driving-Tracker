"use client"
import {useState, type FormEvent} from "react";
import {X} from "lucide-react";
import Image from "next/image";
import {BASE_PATH} from "@/lib/basePath";

type DriverFormData = {
    name: string;
    surname: string;
    email: string;
    phoneNumber: string;
    dob: string;
};

type AddDriverDialogProps = {
    open: boolean;
    onClose: ()=> void;
    onSubmit: (data: DriverFormData) => void | Promise<void>;
};

export default function AddDriver({open, onClose, onSubmit}: AddDriverDialogProps){
    
    const [name, setName] = useState("");
    const [surname, setSurname] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [dob, setDob] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!open) return null;

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try{
            await onSubmit({name,surname,email,phoneNumber,dob});
            setName("");
            setSurname("");
            setEmail("");
            setPhoneNumber("");
            setDob("");
            onClose();
        }
        catch (err){
            setError(err instanceof Error ? err.message : "Could not add driver");
        }
        finally{
            setIsSubmitting(false);
        } 
    };

    return(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
                <div className="mb-2 flex items-center justify-between">
                    <div className="w-5"/>
                    <div className="h-14 w-14 overflow-hidden rounded-full">
                        <Image 
                            src = {`${BASE_PATH}/images/screen1.png`}
                            alt = "Driving Tracker Logo"
                            width = {56}
                            height={56}
                            className="h-full w-full object-cover"
                        />
                    </div>

                    <button onClick={onClose} disabled={isSubmitting} aria-label = "Close" className="text-gray-400 hover:text-gray-600">
                        <X size = {20}/>
                    </button>
                </div>

                <h2 className="mb-4 text-center text-lg font-bold text-gray-900">
                    Add Driver
                </h2>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Name
                        </label>
                        <input value={name}
                        onChange={(e) => setName(e.target.value)}
                        required className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-sky-400"/>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Surname
                        </label>
                        <input value={surname}
                        onChange={(e) => setSurname(e.target.value)}
                        required className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-sky-400"/>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input type = "email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-sky-400"/>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Phone Number
                        </label>
                        <input type = "tel" value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-sky-400"/>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Date of Birth
                        </label>
                        <input type = "date" value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        required className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-sky-400"/>
                    </div>

                    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

                    <div className="mt-2 flex justify-end gap-3">
                        <button type = "button" onClick={onClose} disabled={isSubmitting} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">
                            Cancel
                        </button>
                        <button type = "submit" disabled={isSubmitting} className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600">
                            Add Driver
                        </button>
                    </div>


                </form>
            </div>
        </div>
    )
}