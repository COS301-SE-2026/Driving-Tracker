import DashboardNavbar from "@/components/DashboardNavbar"

export default function Drivers(){
    return (
        <main className="flex min-h-screen">
            <DashboardNavbar/>

            <section className = "flex-1 p-8">
                <h1 className="text-3xl font-bold">Drivers</h1>
            </section>
        </main>
    );
}