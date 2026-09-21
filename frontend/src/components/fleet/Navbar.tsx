"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {BASE_PATH} from "@/lib/basePath";
import {
    Truck,
    Route as RouteIcon,
    Users,
    Settings,
    LogOut,
} from "lucide-react";

const navItems = [
    { key: "vehicles", label: "Vehicles", icon: Truck, path: "/dashboard/vehicles"},
    { key: "routes", label: "Routes", icon: RouteIcon, path: "/dashboard/routes"},
    { key: "drivers", label: "Drivers", icon: Users, path: "/dashboard/drivers"},
];

export default function Sidebar(){

    const pathname = usePathname();

    return (

        <div className="flex h-screen">
            <div className="flex w-16 flex-col items-center justify-between border-r border-sky-100 bg-sky-50 py-4">
                <div className="flex flex-col items-center gap-10">

                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-500 text-white">
                        <Image
                               src = {`${BASE_PATH}/images/screen1.png`} 
                               alt = "Driving Tracker Logo" 
                               width={56}
                               height={56}
                               className="h-14 w-14 rounded-full"/>
                    </div>

                    <nav className="flex flex-col items-center gap-8">

                        {navItems.map(({key, label, icon: Icon, path}) => {

                            const isActive = pathname.startsWith(path);

                            return (
                                <Link key = {key} href = {path}
                                className="flex flex-col items-center gap-1 group">
                                    <Icon size = {30} className = {isActive ? "text-sky-500" : "text-black group-hover:text-sky-400"}/>
                                    <span className={`text-[10px] font-medium ${ isActive ? "text-sky-500" : "text-black"}`}>
                                    {label}
                                    </span>
                                </Link>
                            );

                        })}
                    </nav>
                </div>

                <div className="flex flex-col items-center gap-5 border-t border-sky-200 pt-5">

                    <button className="text-black hover:text-sky-500">
                        <Settings size = {30} />
                    </button>

                    <button className="text-black hover:text-red-500">
                        <LogOut size = {30} />
                    </button>

                </div>
            </div>
        </div>
    )
} 