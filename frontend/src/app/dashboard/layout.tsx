"use client";

import { AuthProvider, useAuth } from "@/lib/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function DashboardAuthGuard({ children }: { children: React.ReactNode }) {
    const { isInitializing, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if(!isInitializing && !isAuthenticated){
            router.push("/login");
        }
    }, [isInitializing, isAuthenticated, router]);

    if(isInitializing){
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-gray-500">Loading fleet dashboard...</p>
            </div>
        );
    }

    if(!isAuthenticated) {
        return null;
    }

    return <>{children}</>;
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
    <AuthProvider>
        <DashboardAuthGuard>{children}</DashboardAuthGuard>
    </AuthProvider>
    );
}