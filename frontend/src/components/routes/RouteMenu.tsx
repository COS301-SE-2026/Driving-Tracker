"use client";

import {useState} from "react";
import {MoreVertical, Eye, Pencil, Trash2} from "lucide-react";

type RouteMenuProps = {
    routeTitle: string;
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
};

export default function RouteMenu({routeTitle, onView, onEdit, onDelete} : RouteMenuProps){

    const [menuOpen, setMenuOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    return(
        <div className="relative">

            <button onClick={() => setMenuOpen((o) => !o)} className="text-gray-400 hover:text-gray-600">
                <MoreVertical size = {20} />
            </button>

            {menuOpen && (
                <div className="absolute right-0 z-30 mt-1 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">

                    <button onClick={()=> {setMenuOpen(false); onView();}}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <Eye size={16}/>
                        View
                    </button>

                    <button onClick={()=> {setMenuOpen(false); onEdit();}}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <Pencil size={16}/>
                        Edit Route
                    </button>

                    <button onClick={()=> {setMenuOpen(false); setConfirmOpen(true);}}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-gray-50">
                        <Trash2 size={16}/>
                        Delete Route
                    </button>
                </div>
            )}

            {confirmOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">

                        <h3 className="text-lg font-bold text-gray-900">
                            Delete route?
                        </h3>
                        <p className="mt-2 text-sm text-gray-600">
                            Are you sure you want to delete <span className="font-semibold">{routeTitle}</span>
                            ? This action is permanent.
                        </p>

                        <div className="mt-6 flex justify-end gap-3">

                            <button onClick={()=> setConfirmOpen(false)}
                            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">
                                Cancel
                            </button>

                            <button onClick={()=> {onDelete(); setConfirmOpen(false);}}
                            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}