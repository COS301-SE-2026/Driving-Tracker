"use client";

import Image from "next/image";
import type { Vehicle } from "./types";
import { useEffect, useState } from "react";
import { apiFetchBlob } from "@/lib/auth/apiClient";
import { ImagePlus, MoreVertical, Pencil, Trash2 } from "lucide-react";

type VehicleCardProps = {
    vehicle: Vehicle;
    onEdit: (vehicle: Vehicle) => void;
    onDelete: (vehicle: Vehicle) => void;
    onImageChange: (vehicle: Vehicle, file: File) => void;
};

function capitalizeFirst(str: string) {
    if (!str) return str;

    return str.trim()[0].toUpperCase() + str.slice(1).toLowerCase();
}

export default function VehicleCard({
    vehicle,
    onEdit,
    onDelete,
    onImageChange,
}: VehicleCardProps) {

    const vehicleName = vehicle.name || `${vehicle.make ?? "Unknown"} ${vehicle.model ?? "Vehicle"}`;

    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [imageLoading, setImageLoading] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        let objectUrl: string | null = null;
        let cancelled = false;

        async function loadImage(){
            if(!vehicle.image_url){
                setImageSrc(null);
                return;
            }

            setImageLoading(true);

            try{
                const imageBlob = await apiFetchBlob(
                    `/upload/fleet-vehicle-image/${vehicle.vehicle_id}`,
                );
                objectUrl = URL.createObjectURL(imageBlob);

                if(!cancelled){
                    setImageSrc(objectUrl);
                }
            }catch{
                if(!cancelled){
                    setImageSrc(null);
                }
            }finally{
                if(!cancelled){
                    setImageLoading(false);
                }
            }
        }

        void loadImage();

        return () => {
            cancelled = true;

            if(objectUrl){
                URL.revokeObjectURL(objectUrl);
            }
        };
    },[vehicle.vehicle_id, vehicle.image_url]);

    return (
        <div
            className="w-full max-w-[238px] rounded-[9px] bg-[#d9d9d9] p-2 text-left transition hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
        >

            <div className="relative flex items-start justify-between gap-2">
                <h2 className="truncate text-[14px] font-bold">
                    {vehicleName}
                </h2>

                <div className="relative shrink-0">
                    <button 
                        type="button"
                        aria-label={`Options for ${vehicleName}`}
                        onClick={() => setMenuOpen((open) => !open)}
                        className="rounded-md p-1 hover:bg-white"
                    >
                        <MoreVertical size={18} />
                    </button>

                    {menuOpen && (
                        <div className="absolte right-0 top-8 z-20 w-40 rounded-md border border-slate-200 bg-white p-1 shadow-lg">
                            <button
                                type="button"
                                onClick={() => {
                                    setMenuOpen(false);
                                    onEdit(vehicle);
                                }}
                                className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-xs hover:bg-slate-100"
                            >
                                <Pencil size={14} />
                                Edit Vehicle
                            </button>

                            <label className="flex w-full cursor-pointer items-center gap-2 rounded px-3 py-2 text-left text-xs hover:bg-slate-100">
                                <ImagePlus size={14} />
                                Change image
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="hidden"
                                    onChange={(event) => {
                                        const file = event.target.files?.[0];
                                        if(file){
                                            onImageChange(vehicle, file);
                                        }
                                        setMenuOpen(false);
                                        event.currentTarget.value = "";
                                    }}
                                />
                            </label>

                            <button
                                type="button"
                                onClick={() => {
                                    setMenuOpen(false);
                                    onDelete(vehicle);
                                }}
                                className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50"
                            >
                                <Trash2 size={14} />
                                Remove vehicle
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <span className="mb-2 inline-flex rounded-full bg-[#0095ff] px-2 py-[2px] text-[10px] font-semibold text-white">
                {vehicle.year ?? "Year unavailable"}
            </span>

            {/*vehicle image returned by the backend image search endpoint */}
            <div className="relative flex h-[202px] items-center justify-center overflow-hidden rounded-md bg-white">
                {imageLoading ? (
                    <span className="text-xs text-slate-400">
                        Loading image...
                    </span>
                ) : imageSrc ? (
                    <Image
                        src={imageSrc}
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
                        { capitalizeFirst(vehicle.status?? "Unknown") }
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