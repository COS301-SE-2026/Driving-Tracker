"use client";

import Image from "next/image";
import type { Vehicle } from "./types";

type VehicleCardProps = {
    vehicle: Vehicle;
};

export default function VehicleCard({
    vehicle,
}: VehicleCardProps) {

    const vehicleName = vehicle.name || `${vehicle.make ?? "Unknown"} ${vehicle.model ?? "Vehicle"}`;

    return (
        <div
            className="w-full max-w-[238px] rounded-[9px] bg-[#d9d9d9] p-2 text-left transition hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
        >

            <h2 className="truncate text-[14px] font-bold">
                {vehicleName}
            </h2>

            <span className="mb-2 inline-flex rounded-full bg-[#0095ff] px-2 py-[2px] text-[10px] font-semibold text-white">
                {vehicle.year ?? "Year unavailable"}
            </span>

            {/*vehicle image returned by the backend image search endpoint */}
            <div className="relative flex h-[202px] items-center justify-center overflow-hidden rounded-md bg-white">
                {vehicle.image_url ? (
                    <Image
                        src={vehicle.image_url}
                        alt={`${vehicleName} image`}
                        fill
                        sizes="238px"
                        unoptimized
                        className="object-contain"
                    />
                ) : (
                    <span className="text-xs text-slate-400">
                        No image available
                    </span>
                )}
            </div>

            <div className="mt-2 grid grid-cols-[1fr_auto] gap-1 text-[11px]">
                <div className="space-y-1">
                    <p>
                        <strong>Registration:</strong>{" "}
                        {vehicle.registration ?? "Not available"}
                    </p>

                    <p>
                        <strong>Status:</strong>{" "}
                        {vehicle.assigned_driver ? "On Trip" : "Inactive"}
                    </p>

                    <p>
                        <strong>Driver:</strong>{" "}
                        {vehicle.assigned_driver
                            ? vehicle.assigned_driver.name
                            : "Unassigned"}
                    </p>
                </div>

                <div className="flex flex-col items-center justify-center">
                    <strong className="text-[14px]">TRIPS</strong>
                    <span className="text-[16px]">
                        {vehicle.trip_count}
                    </span>
                </div>
            </div>

        </div>
    );

}