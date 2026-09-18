"use client";

import {useState} from "react";
import {Truck, Route as RouteIcon, Users, Settings, LogOut} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {BASE_PATH} from "@/lib/basePath";

const navItems = [
    { key: "vehicles", label: "Vehicles", icon: Truck, path: "/dashboard/vehicles"},
    { key: "routes", label: "Routes", icon: RouteIcon, path: "/dashboard/routes"},
    { key: "drivers", label: "Drivers", icon: Users, path: "/dashboard/drivers"},
];

export default function Sidebar(){

    const pathname = usePathname();

    const [active, setActive] = useState("vehicles");

    return (

        <div className="flex h-screen">
            <div className="flex w-16 flex-col items-center justify-between border-r border-gray-200 bg-white py-4">
                <div className="flex flex-col items-center gap-6">

                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500 text-white">
                        <Image
                               src = {`${BASE_PATH}/images/screen1.png`} 
                               alt = "Driving Tracker Logo" 
                               width={56}
                               height={56}
                               className="h-14 w-14 rounded-full"/>
                    </div>

                    <nav className="flex flex-col items-center gap-6">

                        {navItems.map(({key, label, icon: Icon, path}) => {

                            const isActive = pathname.startsWith(path);

                            return (
                                <Link key = {key} href = {path}
                                className="flex flex-col items-center gap-1 group">
                                    <Icon size = {20} className = {isActive ? "text-sky-500" : "text-gray-400 group-hover:text-sky-400"}/>
                                    <span className={`text-[10px] font-medium ${ isActive ? "text-sky-500" : "text-gray-400"}`}>
                                    {label}
                                    </span>
                                </Link>
                            );

                        })}
                    </nav>
                </div>

                <div className="flex flex-col items-center gap-5">

                    <button className="text-gray-400 hover:text-sky-500">
                        <Settings size = {20} />
                    </button>

                    <button className="text-gray-400 hover:text-red-500">
                        <LogOut size = {20} />
                    </button>

                </div>
            </div>
        </div>
    )
}