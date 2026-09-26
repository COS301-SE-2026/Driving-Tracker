"use client";

type ViewRouteProps = {
    open: boolean;
    onClose: () => void;
    route: {
        title: string;
        task: string;
        driver: string;
        vehicle: string;
        startDestination: string;
        endDestination: string;
        status: string;
    } | null;
};

export default function ViewRoute({open, onClose, route} : ViewRouteProps){

    if (!open || !route){
        return null;
    }

    return(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
                <h2 className="mb-4 text-center text-lg font-bold text-gray-900">
                    {route.title}
                </h2>

                <div className="flex flex-col gap-3 text-sm">

                    <div>
                        <span className="block font-medium text-gray-500">
                            Task
                        </span>
                        <span className="text-gray-900">
                            {route.task}
                        </span>
                    </div>

                    <div>
                        <span className="block font-medium text-gray-500">
                            Driver
                        </span>
                        <span className="text-gray-900">
                            {route.driver}
                        </span>
                    </div>

                    <div>
                        <span className="block font-medium text-gray-500">
                            Vehicle
                        </span>
                        <span className="text-gray-900">
                            {route.vehicle}
                        </span>
                    </div>

                    <div>
                        <span className="block font-medium text-gray-500">
                            Start
                        </span>
                        <span className="text-gray-900">
                            {route.startDestination}
                        </span>
                    </div>


                    <div>
                        <span className="block font-medium text-gray-500">
                            Destination
                        </span>
                        <span className="text-gray-900">
                            {route.endDestination}
                        </span>
                    </div>

                    <div>
                        <span className="block font-medium text-gray-500">
                            Status
                        </span>
                        <span className="text-gray-900">
                            {route.status}
                        </span>
                    </div>

                </div>

                <div className="mt-6 flex justify-end">
                    <button onClick = {onClose}
                    className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}