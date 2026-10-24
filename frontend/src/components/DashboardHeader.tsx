"use client"
import { useEffect, useState } from "react"
import { Building2 } from "lucide-react"
import { apiFetch } from "@/lib/auth/apiClient"

type OrganizationResponse = {
    data: {
        name: string;
    };
};

export default function DashboardHeader(){

    const[organizationName, setOrganizationName] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {

        let cancelled = false;

        async function loadOrganization(){
            try{
                const response = await apiFetch<OrganizationResponse>("/fleet/organization");

                if (!cancelled){
                    setOrganizationName(response.data.name);
                }
            }
            catch (loadError){
                if (!cancelled){
                    setError(
                        loadError instanceof Error ? loadError.message : "Could not load organization name",
                    );
                }
            }
        }

        void loadOrganization();

        return () => {
            cancelled = true;
        };
    }, []);

    return(
        <header className="flex h-14 items-center justify-between border-b border-sky-100 bg-white px-6">
            <div className="flex min-w-0 items-center gap-2">
                <Building2 aria-hidden="true" className="shrink-0 text-sky-600"/>
                <span className="truncate font-semibold text-gray-900">
                    {organizationName ?? (error ? "Organization Unavailable" : "Loading org...")}
                </span>
            </div>
            {error && (
                <span role="alert" className="ml-4 text-xs text-red-600">
                    {error}
                </span>
            )}
        </header>
    );
}
