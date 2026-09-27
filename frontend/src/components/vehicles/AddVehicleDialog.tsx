"use client"

import { FormEvent, useEffect, useState } from "react";
import { LoaderCircle, X } from "lucide-react";
import {
    createVehicle,
    searchVehicleImage,
} from "@/lib/vehicle-api";
import type { Vehicle } from "./types";

type Props = {
    open: boolean;
    onClose: () => void;
    onCreated: (vehicle: Vehicle) => void;
};

export default function AddVehicleDialog({
    open,
    onClose,
    onCreated,
}: Props) {

    const [make, setMake] = useState("");
    const [model, setModel] = useState("");
    const [year, setYear] = useState("");
    const [fuelType, setFuelType] = useState("PETROL");
    const [fuelTank, setFuelTank] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open) {
            setMake("");
            setModel("");
            setYear("");
            setFuelType("PETROL");
            setFuelTank("");
            setError("");
        }
    }, [open]);

    if (!open) {
        return null;
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {

        event.preventDefault();

        const numericYear = Number(year);
        const numericTank = Number(fuelTank);

        if (
            !make.trim() || !model.trim() || !Number.isInteger(numericYear) || numericTank <= 0
        ) {
            setError(
                "Make, model, year, fuel type, and tank size are required."
            );
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            //creating the vehicle in the db
            const vehicle = await createVehicle({
                make: make.trim(),
                model: model.trim(),
                year: numericYear,
                fuel_type: fuelType,
                fuel_tank: numericTank,
            });

            //fetching a matching vehicle image after creation
            const image = await searchVehicleImage(
                make.trim(),
                model.trim(),
                numericYear,
            );

            //adding image URL to the new card immediately
            onCreated({
                ...vehicle,
                image_url: image?.image_url ?? null,
            });

            onClose();
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : "Could not add vehicle.",
            );
        } finally {
            setIsSubmitting(false);
        }

    }

    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4">
            <div
                role="dialog"
                aria-modal="true"
                className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
            >
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-xl font-bold">
                        Add Vehicle
                    </h2>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close dialog"
                        className="rounded-md p-1 hover:bg-slate-100"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-4"
                >
                    <label className="block text-sm font-medium">
                        Make
                        <input
                            value={make}
                            onChange={(event) => setMake(event.target.value)}
                            placeholder="Mercedes-Benz"
                            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-sky-500"
                        />
                    </label>

                    <label className="block text-sm font-medium">
                        Model
                        <input
                            value={model}
                            onChange={(event) => setModel(event.target.value)}
                            placeholder="Actros"
                            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-sky-500"
                        />
                    </label>

                    <label className="block text-sm font-medium">
                        Year
                        <input
                            type="number"
                            min="1886"
                            max={new Date().getFullYear() + 1}
                            value={year}
                            onChange={(event) => setYear(event.target.value)}
                            placeholder="2022"
                            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-sky-500"
                        />
                    </label>

                    <label className="block text-sm font-medium">
                        Fuel type
                        <select
                            value={fuelType}
                            onChange={(event) => setFuelType(event.target.value)}
                            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                        >
                            <option value="PETROL">Petrol</option>
                            <option value="DIESEL">Diesel</option>
                            <option value="ELECTRIC">Electric</option>
                            <option value="HYBRID">Hybrid</option>
                        </select>
                    </label>

                    <label className="block text-sm font-medium">
                        Fuel tank size
                        <div>
                            <input
                                type="number"
                                min="1"
                                step="0.1"
                                value={fuelTank}
                                onChange={(event) => setFuelTank(event.target.value)}
                                placeholder="50"
                                className="w-full rounded-l-md border border-slate-300 px-3 py-2"
                            />
                            <span className="flex items-center rounded-r-md border border-l-0 border-slate-100 px-3 text-sm">
                                L
                            </span>
                        </div>
                        
                    </label>

                    {error && (
                        <p className="text-sm text-red-600">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex w-full items-center justify-center gap-2 rounded-md bg-sky-500 px-4 py-2 font-semibold text-white hover:bg-sky-600 disabled:opacity-60"
                    >
                        {isSubmitting && (
                            <LoaderCircle
                                size={18}
                                className="animate-spin"
                            />
                        )}

                        {isSubmitting
                            ? "Adding vehicle..."
                            : "Add vehicle"}
                    </button>
                </form>
            </div>
        </div>
    );

}