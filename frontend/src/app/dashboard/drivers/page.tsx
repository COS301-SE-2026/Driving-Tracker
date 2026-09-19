"use client";

import {useState} from "react";
import { MoreVertical, Search, SlidersHorizontal } from "lucide-react";
import DashboardNavbar from "@/components/DashboardNavbar"
import AddDriver from "@/components/drivers/AddDriver";

//mocked for now
type Driver = {
    id: string;
    name: string;
    trips: number;
    distanceKm: number;
    status: "Inactive" | "On Trip";
    score: number;
};

//mock drivers
const drivers: Driver[] = [
    {id: "1", name: "Joseph Sethoba", trips: 5, distanceKm: 80, status: "Inactive", score: 96},
    {id: "2", name: "Marius Surname", trips: 3, distanceKm: 52, status: "Inactive", score: 52},
    {id: "3", name: "Noah Beck", trips: 2, distanceKm: 48, status: "On Trip", score: 72}
]

function ScoreValue({score} : {score: number}){
    const color = score >= 60 ? "text-emerald-500" : "text-red-500";
    return <span className={`font-semibold ${color}`}> {score} </span>
}

function DriverCard({driver} : {driver : Driver}){
    return (
        <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-5">

            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gray-200"/>
                    <h3 className="text-lg font-bold text-gray-900">
                        {driver.name}
                    </h3>
                </div>

                <button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical size = {20} />
                </button>

            </div>

            <div className="grid grid-cols-2 gap-y-2 text-sm">

                <span className="font-medium text-gray-900">
                    Trips
                </span>
                <span className="text-gray-700">
                    {driver.trips}
                </span>

                <span className="font-medium text-gray-900">
                    Distance
                </span>
                <span className="text-gray-700">
                    {driver.distanceKm} km
                </span>

                <span className="font-medium text-gray-900">
                    Status
                </span>
                <span className="text-gray-700">
                    {driver.status}
                </span>

                <span className="font-medium text-gray-900">
                    Score
                </span>
                <ScoreValue score = {driver.score} />

            </div>
        </div>
    );
}

export default function ManageDrivers(){

    const [query, setQuery] = useState("");
    const [driversList, setDriversList] = useState<Driver[]>(drivers);
    const inActiveCount = driversList.filter((d) => d.status === "Inactive").length;
    const onTripCount = driversList.filter((d) => d.status === "On Trip").length;
    const filtered = driversList.filter((d) => 
    d.name.toLowerCase().includes(query.toLowerCase()));
    const [addOpen, setAddOpen] = useState(false);

    const handleAddDriver = (data: {name:string; surname:string;idNumber:string}) => {
        const newDriver: Driver = {
            id: crypto.randomUUID(),
            name: `${data.name} ${data.surname}`,
            trips: 0,
            distanceKm: 0,
            status: "Inactive",
            score: 0,
        };
        setDriversList((prev) => [...prev, newDriver]);
    };

    return(
        <div className="flex">
            <DashboardNavbar/>

        <div className="flex-1 bg-gradient-to-br from-white via-sky-50 to-sky-100 p-8">

            <h1 className="text-4xl text-center font-extrabold text-gray-900">
                Manage Drivers
            </h1>
            <div className="mt-4 border-t border-gray-200 pt-3 text-center text-sm text-black">
                {driversList.length} drivers &nbsp;•&nbsp; {inActiveCount} inactive &nbsp; •&nbsp; {onTripCount} on trip
            </div>

            <div className="mt-6 flex items-center justify-between">
                <button onClick={()=> setAddOpen(true)} className="rounded-lg bg-sky-200 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-200">
                    + Add Driver
                </button>
                <AddDriver open = {addOpen} onClose={()=> setAddOpen(false)} onSubmit = {handleAddDriver} />

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search size = {20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                        <input value = {query} onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search Drivers" 
                        className="w-48 rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-sky-400"/>
                    </div>
                    <button className="text-gray-500 hover:text-gray-700">
                        <SlidersHorizontal size = {20} />
                    </button>
                </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((driver) => (
                    <DriverCard key = {driver.id} driver = {driver} />
                ))}
            </div>

        </div>
        </div>
    );
}