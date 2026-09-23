"use client"

import { FormEvent, use, useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
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

        

    }

}