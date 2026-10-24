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
        <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                        {imageLoading ? (
                            <span className="text-[10px] text-slate-500">Loading...</span>
                        ) : imageSrc ? (
                            <Image src = {imageSrc} alt = {`${vehicleName} image`}
                            fill sizes = "64px" unoptimized className="object-cover"
                            />) : (
                                <span className="px-1 text-center text-[10px] text-slate-500">
                                    No image
                                </span>
                            )}
                    </div>

                    <div className="min-w-0">
                        <h2 className="truncate text-lg font-bold text-gray-900">
                            {vehicleName}
                        </h2>
                        <span className="text-sm text-gray-500">
                            {vehicle.year ?? "Year unavailable"}
                        </span>
                    </div>
                </div>

                <div className="relative shrink-0">
                    <button type = "button" aria-label={`Options for ${vehicleName}`}
                    onClick={() => setMenuOpen((open) => !open)}
                    className="rounded-md p-1 hover:bg-slate-100"
                    >
                        <MoreVertical size = {18}/>

                    </button>

                    {menuOpen && (
                        <div className="absolute right-0 top-8 z-20 w-40 rounded-md border border-slate-200 bg-white p-1 shadow-lg">
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

            <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">

                <span className="font-medium text-gray-900">Registration</span>
                <span className="min-w-0 break-all text-gray-700">
                    {vehicle.registration ?? "Not available"}
                </span>

                <span className="font-medium text-gray-900">Status</span>
                <span className="min-w-0 break-all text-gray-700">
                    {capitalizeFirst(vehicle.status ?? "Unknown")}
                </span>

                <span className="font-medium text-gray-900">Driver</span>
                <span className="min-w-0 break-all text-gray-700">
                    {vehicle.assigned_driver?.name ?? "Unassigned"}
                </span>

                <span className="font-medium text-gray-900">Fuel Type</span>
                <span className="min-w-0 break-all text-gray-700">
                    {vehicle.fuel_type ? capitalizeFirst(vehicle.fuel_type) : "Not available"}
                </span>

                <span className="font-medium text-gray-900">Fuel Tank</span>
                <span className="min-w-0 break-all text-gray-700">
                    {vehicle.fuel_tank != null ? `${vehicle.fuel_tank} L` : "Not available"}
                </span>

                <span className="font-medium text-gray-900">Trips</span>
                <span className="min-w-0 break-all text-gray-700">
                    {vehicle.trip_count ?? 0}
                </span>
            </div>
        </div>
    );

}