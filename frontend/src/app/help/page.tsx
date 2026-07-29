import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Help(){
    return(
        <main className="flex flex-col">

            <Navbar/>

            {/*How to Section*/}
            <section className="flex flex-col ms:flex-row items-center gap-12 px-6 py-16 max-w-7xl mx-auto">
                <div className="flex flex-col gap-6 max-w-lg">
                    <div>
                        <h1 className="text-4xl font-extrabold">How to track your drive:</h1>
                        <span className="block h-1 w-24 mt-2"/>
                    </div>

                    <div className="p-6 rounded-2xl">
                        <p className="text-base">
                            One of Driving Tracker's core features is to track trips. We understand that this may be confusing for some users, so here are a few tutorials to make your app experience more smooth.
                        </p>
                    </div>
                </div>

                <div className="flex-1 flex justify-center">
                    <div className="w-full max-w-xl aspect-video rounded-3xl p-2">
                        
                        <img src = "/images/phone-2.png" alt = "Driving Tracker pic"/>
                        <img src = "/images/phone-3.png" alt = "Driving Tracker pic2"/>
                        <img src = "/images/phone-4.png" alt = "Driving Tracker pic3"/>
                        
                    </div>
                </div>
            </section>

            {/*FAQ*/}
            <section className="flex flex-col md:flex-row items-start gap-8 px-6 py-16 max-w-7xl mx-auto w-full">
                <div className="flex flex-col gap-2 ms:w-1/4">
                    <h2 className="text-3xl font-extrabold">FAQs</h2>
                    <span className="block h-1 w-16" />
                    <p className="text-sm">Get the answers you need</p>
                </div>

                <div className="flex-1 flex flex-col gap-4">
                    <div className="flex gap-4 overflow-x-auto">
                        <div className="min-w-[200px] h-40 rounded-2xl shrink-0" />
                        <div className="min-w-[200px] h-40 rounded-2xl shrink-0" />
                        <div className="min-w-[200px] h-40 rounded-2xl shrink-0" />
                    </div>

                    <div className="flex justify-center gap-2">
                        <span className="h-2 w-2 rounded-full"/>
                        <span className="h-2 w-2 rounded-full"/>
                        <span className="h-2 w-2 rounded-full"/>
                    </div>
                </div>

                <div className="md:w-32 flex justify-center">
                    <div className="w-24 h-24 rounded-full"/>
                    <img src = "/images/screen1.png" alt = "Driving Tracker Logo" className="h-20 w-20 rounded-full"/>
                </div>
            </section>

        <Footer/>
        </main>
    )
}