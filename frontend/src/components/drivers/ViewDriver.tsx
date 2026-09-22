"use client";

type ViewDriverDialog = {
    open: boolean;
    onClose: ()=> void;
    driver: {
        name: string;
        email: string;
        phoneNumber: string;
        dob: string;
        licenseNumber: string;
    } | null;
};

export default function ViewDriver({open, onClose, driver} : ViewDriverDialog) {
    
    if (!open || !driver){
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
                <h2 className="mb-4 text-center text-lg font-bold text-gray-900">
                    Driver Details
                </h2>
                <div className="flex flex-col gap-3 text-sm">

                    <div>
                        <span className="block font-medium text-gray-500">
                            Name
                        </span>
                        <span className="text-gray-900">
                            {driver.name}
                        </span>
                    </div>

                    <div>
                        <span className="block font-medium text-gray-500">
                            Email
                        </span>
                        <span className="text-gray-900">
                            {driver.email}
                        </span>
                    </div>

                    <div>
                        <span className="block font-medium text-gray-500">
                            Phone Number
                        </span>
                        <span className="text-gray-900">
                            {driver.phoneNumber}
                        </span>
                    </div>

                    <div>
                        <span className="block font-medium text-gray-500">
                            Date of Birth
                        </span>
                        <span className="text-gray-900">
                            {driver.dob}
                        </span>
                    </div>

                    <div>
                        <span className="block font-medium text-gray-500">
                            License Number
                        </span>
                        <span className="text-gray-900">
                            {driver.licenseNumber}
                        </span>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button onClick={onClose} className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}