"use client";

import { useState, useEffect, useCallback, useMemo} from "react";
import { Search, ArrowRight } from "lucide-react";
import DashboardNavbar from "@/components/DashboardNavbar";
import FilterRoutes, { FilterState } from "@/components/routes/FilterRoutes";
import AddRoute, { RouteFormData } from "@/components/routes/AddRoute";
import RouteMenu from "@/components/routes/RouteMenu";
import ViewRoute from "@/components/routes/ViewRoute";
import PastRoutes from "@/components/routes/PastRoutes";
import { apiFetch } from "@/lib/auth/apiClient";
import { useRouter } from "next/navigation";
import { toLocalDatetimePickerValue } from "@/lib/dateUtils";

type Stop = {
    id: string;
    address: string;
    lat?: number; 
    lng?: number;
};

type Route = {
    id: string;
    driverId?: string;
    vehicleId?: string;
    title: string;
    task: string;
    vehicle: string;
    stops: Stop[];
    startDestination: string;
    endDestination: string;
    driver: string;
    status: "Not Started" | "On Trip" | "Completed";
    scheduledFor?: string;
};
type FleetDriver = {
    user_id: string;
    name: string;
    surname: string ;
    email : string;
};
type FleetVehicle ={
    vehicle_id: string ;
    registration: string; 
    make: string;
    model: string ;
};
type FleetTripApi ={
     trip_id: string;
    status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED";
    scheduled_for?: string;
    title?: string;
    description?: string,
    planned_start_addr?: string;
    planned_start_lat?: number | string;
    planned_start_lng?: number | string;
    planned_end_addr?: string;
    planned_dest_lat?: number | string;
    planned_dest_lng?: number | string;
    vehicle_id?: string;
    driver?: {
        user_id: string;
        name: string;
        surname: string;
    };
    vehicles?: {
        make: string;
        model: string;
    };
};
// //mocks
const routes: Route[] = [
    {id: "1",title:"Bread delivery",task: "Sales", vehicle: "Car1",stops: [{id: "1-start", address: "Logistics house"},{id: "1-end", address: "PNP Northridge"}],startDestination: "Logistics house",endDestination: "PNP Northridge",driver: "Noah Beck",status: "Not Started"},
    {id: "2",title:"Egg delivery",task: "Sales",vehicle: "Car1",stops: [{id: "2-start", address: "Logistics house"},{id: "2-end", address: "Spar"}],startDestination: "Logistics house",endDestination: "Spar Baysvillage",driver: "Sipho Man",status: "On Trip"},
    {id: "3",title:"Shirts delivery",task: "Sales",vehicle: "Car1",stops: [{id: "3-start", address: "Logistics house"},{id: "3-end", address: "PNP Hatfield"}],startDestination: "Logistics house",endDestination: "PNP Clothing",driver: "Ally Jackson",status: "Completed"},
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

function RouteCard({route, onView, onEdit, onDelete, onViewProgress}: {
    route: Route;
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onViewProgress: () => void;
}){

    return (
        <div className="w-full rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-3 flex items-start justify-between">
                <h3 className="text-2xl font-bold text-gray-900">
                    {route.title}
                </h3>
                <div className="flex items-center gap-2">
                    {route.status === "On Trip" && (
                        <button onClick = {onViewProgress} className="flex items-center gap-1 text-xs font-semibold text-sky-500 hover:text-sky-600">
                            View Progress
                            <ArrowRight size = {14}/>
                        </button>
                    )}
                    <RouteMenu routeTitle={route.title} onView = {onView} onEdit={onEdit} onDelete={onDelete} />
                </div>
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
    const [driverList, setDriversList] = useState<FleetDriver[]>([]);
    const [vehicleList, setVehiclesList]= useState<FleetVehicle[]>([]);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [filters, setFilters] = useState<FilterState>({status : [], sortBy: null});
    const [editingRoute, setEditingRoute] = useState<Route | null>(null);
    const [viewingRoute, setViewingRoute] = useState<Route | null>(null);
    // const [addOpen, setAddOpen] = useState(false);
    const router = useRouter();
    const [routeToDelete, setRouteToDelete] = useState<Route | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const loadData = useCallback(async () =>{
        try{
            const [driversRes, vehiclesRes, tripsRes] = await Promise.all([
                apiFetch<{ data: { drivers: FleetDriver[] } }>('/fleet/fleet_drivers'),
                apiFetch<{ data: { vehicles: FleetVehicle[] } }>('/fleet/fleet_vehicles'),
                apiFetch<{ data: { trips: FleetTripApi[] } }>('/fleet/fleet_trips')
            ]);

            const fetchedDrivers = driversRes?.data?.drivers ??[];
            const fetchedVehicles = vehiclesRes?.data?.vehicles?? [];
            const fetchedTrips = tripsRes?.data?.trips ?? [];

            setDriversList(fetchedDrivers);
            setVehiclesList(fetchedVehicles);

            const mappedRoutes: Route[] = fetchedTrips.map((t)=> {
                let status: Route["status"] = "Not Started";
                if (t.status === "IN_PROGRESS") status = "On Trip";
                if (t.status === "COMPLETED") status = "Completed";

                const driverName = t.driver ? `${t.driver.name} ${t.driver.surname}`.trim() : "Unassigned";
                const vehicleName = t.vehicles ? `${t.vehicles.make} ${t.vehicles.model}`.trim() : "Unassigned";

                const startLat = t.planned_start_lat != null ? Number(t.planned_start_lat) : undefined;
                const startLng = t.planned_start_lng != null ? Number(t.planned_start_lng) : undefined;
                const destLat = t.planned_dest_lat != null ? Number(t.planned_dest_lat) : undefined;
                const destLng = t.planned_dest_lng != null ? Number(t.planned_dest_lng) : undefined;

                return{
                    id: t.trip_id,
                    driverId: t.driver?.user_id,
                    vehicleId: t.vehicle_id,
                    title: t.title || "Scheduled Delivery",
                    task: t.description || "Delivery",
                    vehicle: vehicleName,
                    stops: [
                        { id: `${t.trip_id}-start`, address: t.planned_start_addr || "Start" , lat: startLat, lng: startLng},
                        { id: `${t.trip_id}-end`, address: t.planned_end_addr || "Destination", lat: destLat, lng: destLng }
                    ],
                    startDestination: t.planned_start_addr || "Start",
                    endDestination: t.planned_end_addr || "Destination",
                    driver: driverName,
                    status,
                    scheduledFor: t.scheduled_for
                };
            });
            setRoutesList(mappedRoutes);
        }catch(err){
            console.error("Failed to load fleet data:", err);
            setLoadError(err instanceof Error ? err.message : "Failed to load fleet data");
        }
    },[]);

    useEffect(()=>{
        loadData();
    }, [loadData]);

    const handleDeleteRoute = async (id: string) => {
        
        const route = routesList.find((r) => r.id === id);
        if (!route){
            return;
        }

        if (route.status !== "Not Started"){
            setLoadError("Only routes that haven't been started can be deleted");
            return;
        }

        setDeleteError(null);
        setRouteToDelete(route);
    };

    const confirmDeleteRoute = async () => {

        if (!routeToDelete){
            return;
        }

        setIsDeleting(true);
        setDeleteError(null);

        try{

            await apiFetch(`/fleet/fleet_trips/${routeToDelete.id}`, {method: "DELETE"});

            setRoutesList((prev) => prev.filter((r) => r.id !== routeToDelete.id));
            setLoadError(null);
            setRouteToDelete(null);
        }
        catch(err){
            console.error("Failed to delete trip", err);
            setDeleteError(err instanceof Error ? err.message : "Failed to delete route");
        }
        finally{
            setIsDeleting(false);
        }
    };

    const handleAddRoute = async( data: RouteFormData) =>{
        try{
            const foundDriver = driverList.find(
                (d) => `${d.name} ${d.surname}`.trim() === data.driver.trim() || d.user_id === data.driver
            );
            const foundVehicle = vehicleList.find(
                (v) => `${v.make} ${v.model}`.trim() === data.vehicle.trim() || v.registration === data.vehicle || v.vehicle_id === data.vehicle
            );

            if (!foundDriver || !foundVehicle) {
                alert("Please select a valid driver and vehicle from your fleet.");
                return;
            }
            const res = await apiFetch<{ data:{trip: {trip_id: string}}}>('/fleet/schedule_trip',{
                method: 'POST',
                body: JSON.stringify({
                    title: data.title,
                    task: data.task,
                    driver_id: foundDriver.user_id,
                    vehicle_id: foundVehicle.vehicle_id,
                    planned_start_time: new Date().toISOString(),
                    planned_start_location:{
                        address: data.stops[0].address,
                        lat: data.stops[0].lat ?? 0,
                        lng: data.stops[0].lng ?? 0,
                    },
                    planned_end_location:{
                        address: data.stops[data.stops.length - 1].address,
                        lat: data.stops[data.stops.length - 1].lat ?? 0,
                        lng: data.stops[data.stops.length - 1].lng ?? 0,
                    },
                    selected_points: data.selected_points,
                    stops: data.stops.map((s, idx) => ({
                        address: s.address,
                        lat: s.lat ?? 0,
                        lng: s.lng ?? 0,
                        stop_order: idx + 1,
                    }))
                })
            });
            console.log("Trip created in database:", res);
             await loadData();
             setAddOpen(false);
        }catch(err){
            console.error("Failed to schedule trip", err);
        }
    }

    const handleEditRoute = async (data: RouteFormData) => {

        if (!editingRoute){
            return;
        }


            const resolvedStops = await Promise.all(data.stops.map(async (stop) => {
                if (stop.lat && stop.lng) return stop;
                if (!stop.address?.trim()) return stop;
                try{
                    const res = await apiFetch<{data: {lat: number; lng: number}[]}>(
                        `/map/search?address=${encodeURIComponent(stop.address)}`
                    );
                    if (res.data?.[0]) return {...stop, lat: res.data[0].lat, lng: res.data[0].lng};
                }
                catch (e){
                    console.error("Geocoding failed", e);
                }
                return stop;
            }));

            const foundDriver = driverList.find(
                (d) => `${d.name} ${d.surname}`.trim() === data.driver.trim() || d.user_id === data.driver
            );

            const foundVehicle = vehicleList.find(
                (v) => `${v.make} ${v.model}`.trim() === data.vehicle.trim() || v.registration === data.vehicle || v.vehicle_id === data.vehicle
            );

            if (!foundDriver || !foundVehicle){
                throw new Error("Please select a valid driver and vehicle from your fleet.");
            }

            const startStop = resolvedStops[0];
            const endStop = resolvedStops[resolvedStops.length - 1];

            if (!startStop.lat || !startStop.lng || !endStop.lat || !endStop.lng){
                throw new Error("Could not determine valid coordinates for start or end location.");
            }

            await apiFetch(`/fleet/fleet_trips/${editingRoute.id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    title: data.title,
                    task: data.task,
                    driver_id: foundDriver.user_id,
                    vehicle_id: foundVehicle.vehicle_id,
                    planned_start_time: data.plannedStartTime ? new Date(data.plannedStartTime).toISOString() : new Date().toISOString(),
                    planned_start_location: {
                        address: startStop.address,
                        lat: startStop.lat,
                        lng: startStop.lng,
                    },
                    planned_end_location: {
                        address: endStop.address,
                        lat: endStop.lat,
                        lng: endStop.lng,
                    },
                    selected_points: data.selected_points,
                    stops: resolvedStops.map((s, idx) => ({
                        address: s.address,
                        lat: s.lat ?? 0,
                        lng: s.lng ?? 0,
                        stop_order: idx + 1,
                    }))
                })
            });

            await loadData();
            setEditingRoute(null);
    
};

    const filtered = routesList
    .filter((r) => r.title.toLowerCase().includes(query.toLowerCase()))
    .filter((r) => filters.status.length === 0 || filters.status.includes(r.status))
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

    const editingRouteFormData = useMemo<RouteFormData | undefined>(
        () =>
            editingRoute ? {
                title: editingRoute.title,
                task: editingRoute.task,
                driver: editingRoute.driver,
                driverId: editingRoute.driverId,
                vehicle: editingRoute.vehicle,
                vehicleId: editingRoute.vehicleId,
                stops: editingRoute.stops,
                plannedStartTime: toLocalDatetimePickerValue(editingRoute.scheduledFor),
            } : undefined, [editingRoute]
    );

    const activeRoutes = filtered.filter(
        (route) => route.status !== "Completed"
    )
    const pastRoutes = filtered.filter(
        (route) => route.status === "Completed"
    )

    const [addOpen, setAddOpen] = useState(false);

    const driverOptions = driverList.map(
        (driver) => 
            [driver.name, driver.surname].filter(Boolean).join(" ") ||driver.user_id,
    );

    const vehicleOptions = vehicleList.map(
        (vehicle) => 
            [vehicle.make, vehicle.model].filter(Boolean).join(" ") ||vehicle.vehicle_id,
    );

    return(
        <div className="flex">
            <DashboardNavbar />

            <PastRoutes routes={pastRoutes} 
            onSelect={(id)=> {
                const route = routesList.find((r) => r.id === id);
                if (route){
                    setViewingRoute(route);
                }
            }} />

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
                    <ViewRoute open={viewingRoute !== null} onClose={()=> setViewingRoute(null)} route={viewingRoute} />
                    <AddRoute open={addOpen} onClose={()=>setAddOpen(false)} onSubmit={handleAddRoute} driverOptions={driverOptions} vehicleOptions={vehicleOptions}/>
                    <AddRoute open = {editingRoute !== null} onClose={()=>setEditingRoute(null)}
                    onSubmit={handleEditRoute} vehicleOptions={vehicleOptions} driverOptions={driverOptions}
                    initialData={editingRouteFormData} />

                    {routeToDelete && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                            <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
                                <h3 className="text-lg font-bold text-gray-900">
                                    Delete route?
                                </h3>
                                <p className="mt-2 text-sm text-gray-600">
                                    Are you sure you want to delete <span className="font-semibold">{routeToDelete.title}</span>? This action is permanent.
                                </p>

                                {deleteError && (
                                    <p role="alert" className="mt-3 text-sm text-red-600">{deleteError}</p>
                                )}

                                <div className="mt-6 flex justify-end gap-3">
                                    <button 
                                    onClick={()=> setRouteToDelete(null)}
                                    disabled={isDeleting}
                                    className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">
                                        Cancel
                                    </button>
                                    
                                    <button 
                                    onClick={confirmDeleteRoute} disabled = {isDeleting}
                                    className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">
                                        {isDeleting ? "Deleting..." : "Delete"}
                                    </button>
                                </div>
                            </div>
                            </div>
                    )}

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

                    {activeRoutes.map((route) => (
                        <RouteCard key = {route.id} route = {route}
                        onView = {() => setViewingRoute(route)}
                        onEdit={() => setEditingRoute(route)}
                        onDelete = {() => handleDeleteRoute(route.id)}
                        onViewProgress={() => {
                            if (route.driverId){
                                router.push(`/dashboard/home?driver=${route.driverId}`);
                            }
                        }} />
                    ))}

                </div>

                {loadError && <p role="alert" className="mt-4 text-sm text-red-600">{loadError}</p>}
            </div>
        </div>
    );
}