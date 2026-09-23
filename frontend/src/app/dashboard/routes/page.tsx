"use client";

import {useState} from "react";
import {Search, ArrowRight} from "lucide-react";
import DashboardNavbar from "@/components/DashboardNavbar";
import FilterRoutes, {FilterState} from "@/components/routes/FilterRoutes"
import AddRoute from "@/components/routes/AddRoute";

type Route = {
    id: string;
    title: string;
    task: string;
    startDestination: string;
    endDestination: string;
    driver: string;
    status: "Not Started" | "On Trip" | "Completed";
};

//mocks
const routes: Route[] = [
    {id: "1",title:"Bread delivery",task: "Sales",startDestination: "Logistics house",endDestination: "PNP Northridge",driver: "Noah Beck",status: "Not Started"},
    {id: "2",title:"Egg delivery",task: "Sales",startDestination: "Logistics house",endDestination: "Spar Baysvillage",driver: "Sipho Man",status: "On Trip"},
    {id: "3",title:"Shirts delivery",task: "Sales",startDestination: "Logistics house",endDestination: "PNP Clothing",driver: "Ally Jackson",status: "Completed"},
];

function StatusPill({status} : {status: Route["status"]}){

    const textStyles: Record<Route["status"], string> = {
        "On Trip": "text-emerald-600",
        "Not Started": "text-red-600",
        "Completed": "text-sky-600",
    };

    const dotStyles: Record<Route["status"], string> = {
        "On Trip": "bg-emerald-500",
        "Not Started": "bg-red-500",
        "Completed": "bg-sky-500",
    };

    return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${textStyles[status]}`}>
            <span className={`h-2 w-2 rounded-full ${dotStyles[status]}`}/>
            {status}
        </span>
    );
}

function RouteCard({route}: {route: Route}){
    return (
        <div className="w-full rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-3 flex items-start justify-between">
                <h3 className="text-2xl font-bold text-gray-900">
                    {route.title}
                </h3>
                <button className="flex items-center gap-1 text-xs font-semibold text-sky-500 hover:text-sky-600">
                    View Progress
                    <ArrowRight size = {14}/>
                </button>
            </div>

            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                <span className="font-medium text-gray-900">
                    Task:
                </span>
                <span className="text-gray-700">
                    {route.task}
                </span>

                <span className="font-medium text-gray-900">
                    Destination:
                </span>
                <span className="text-gray-700">
                    {route.endDestination}
                </span>

                <span className="font-medium text-gray-900">
                    Driver:
                </span>
                <span className="text-gray-700">
                    {route.driver}
                </span>

                <span className="font-medium text-gray-900">
                    Status:
                </span>
                <StatusPill status = {route.status} />
            </div>
        </div>
    );
}

export default function Routes(){

    const [query, setQuery] = useState("");
    const [routesList, setRoutesList] = useState<Route[]>(routes);
    const [filters, setFilters] = useState<FilterState>({status : [],driver: [], destination: [], sortBy: null});

    const filtered = routesList
    .filter((r) => r.title.toLowerCase().includes(query.toLowerCase()))
    .filter((r) => filters.status.length === 0 || filters.status.includes(r.status))
    .filter((r) => filters.destination.length === 0 || filters.destination.includes(r.endDestination))
    .filter((r) => filters.driver.length === 0 || filters.driver.includes(r.driver))
    .sort((a,b) => {
        if (filters.sortBy === "title-asc"){
            return a.title.localeCompare(b.title);
        }
        if (filters.sortBy === "driver-asc"){
            return a.driver.localeCompare(b.driver);
        }
        if (filters.sortBy === "destination-asc"){
            return a.endDestination.localeCompare(b.endDestination);
        }

        if (filters.sortBy === "title-desc"){
            return b.title.localeCompare(a.title);
        }
        if (filters.sortBy === "driver-desc"){
            return b.driver.localeCompare(a.driver);
        }
        if (filters.sortBy === "destination-desc"){
            return b.endDestination.localeCompare(a.endDestination);
        }
        return 0;
    });

    const [addOpen, setAddOpen] = useState(false);
    const driverOptions = Array.from(new Set(routesList.map((r)=> r.driver)));

    return(
        <div className="flex">
            <DashboardNavbar />

            <div className="flex-1 bg-gradient-to-br from-white via-sky-50 to-sky-150 p-8">
                <h1 className="text-4xl text-center font-extrabold text-gray-900">
                    Routes
                </h1>
                <div className="mt-4 border-t border-gray-200 pt-3" />

                <div className="mt-6 flex items-center justify-between">
                    <button
                    onClick={() => setAddOpen(true)}
                    className="rounded-lg bg-sky-200 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-200">
                        + Assign Route
                    </button>
                    <AddRoute open = {addOpen} onClose={()=>setAddOpen(false)}
                    onSubmit={(data) => console.log(data)} driverOptions={driverOptions} />

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search Route"
                            className="w-48 rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-sky-400" />
                        </div>

                        <FilterRoutes filters = {filters} onChange = {setFilters} />
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">

                    {filtered.map((route) => (
                        <RouteCard key = {route.id} route = {route} />
                    ))}

                </div>
            </div>
        </div>
    );
}