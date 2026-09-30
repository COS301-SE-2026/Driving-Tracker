"use client";

import {useState, type FormEvent, Suspense} from "react";
import Image from "next/image";
import {Eye, EyeOff, MapPin} from "lucide-react";
import {BASE_PATH} from "@/lib/basePath";
import {useRouter} from "next/navigation";
import { login } from "@/lib/auth/authService";
import { useSearchParams } from "next/navigation";

export default function SignInPage(){

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<{email ?: string; password?: string}>({});
    const [submitting, setSubmitting] = useState(false);
    const router = useRouter();
    const [formError, setFormError] = useState("");

    function validate(){

        const next : {
            email?: string;
            password?: string
        } = {};

        if (!email.trim()){
            next.email = "Enter your email address";
        }
        else if (!/^\S+@\S+\.\S+$/.test(email)){
            next.email = "Please enter a valid email address"
        }

        if (!password){
            next.password = "Please enter your password";
        }

        setErrors(next);
        return Object.keys(next).length === 0;
    }

    async function handleSubmit(e: FormEvent){

        e.preventDefault();

        if (!validate()){
            return;
        }
        setSubmitting(true);

    
        setFormError("");

        try{
            setFormError("");
            await login(email.trim(), password);
            router.replace("/dashboard/home");
        }
        catch (error){
            setFormError(error instanceof Error ? error.message : "Unable to sign in");
        }
        finally{
            setSubmitting(false);
        }
    }

    function VerifiedBanner() {
        const searchParams = useSearchParams();
        if(searchParams.get("verified") !== "true") return null;

        return (
            <div
            role="status" 
            className="mt-6 -mb-2 rounded-xl bg-emerald-100 px-4 py-3 text-sm font-medium text-emerald-800">
                Email verified successfully! You can now log in.
            </div>
        );
    }

    return(
        <div className="min-h-screen w-full flex bg-white font-sans">
            {}
            <div className="relative hidden md:flex md:w-[42%] lg:w-[45%] items-center justify-center bg-gradient-to-br from-[#8FE0DE] to-[#4FB9C4] overflow-hidden">
                <div className="absolute top-8 left-8 flex items-center gap-2 text-white/90">
                    <MapPin className = "h-6 w-6"/>
                    <span className="font-semibold tracking-tight">Driving Tracker</span>
                </div>

                <div className="relative w-[80%] max-w-md aspect-[280/457] drop-shadow-xl">
                <Image
                    src = {`${BASE_PATH}/images/manyMascots.png`} 
                    alt = "Many driving tracker mascots" 
                    fill
                    sizes = "(min-width: 1024px) 400px, 320px"
                    className = "object-contain"
                    priority
                />
                </div>

                <p className="absolute bottom-10 left-10 right-10 text-white text-center text-lg sm:text-xl font-semibold tracking-[0.15em] uppercase">
                Track ● Analyze ● Improve
                </p>
            </div>

            <div className="flex-1 flex items-center justify-center px-6 py-12 bg-slate-50">
                <div className="w-full max-w-md rounded-3xl bg-gradient-to-br from-[#8FE0DE] to-[#4FB9C4] p-8 sm:p-10 shadow-2xl shadow-blue-900/20">

                <h1 className="text-white text-3xl font-bold tracking-tight">
                    Welcome back!
                </h1>

                <p className="mt-1.5 text-white/80 text-sm">
                Log in to view and manage your fleet.
                </p>

                <Suspense fallback={null}>
                    <VerifiedBanner />
                </Suspense>

                <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
                    <LoginField 
                    label = "Email address"
                    id = "email"
                    type = "email"
                    value = {email}
                    onChange = {setEmail}
                    error = {errors.email}
                    placeholder = "email@example.com"
                    autoComplete="email"
                    />

                    <div>
                        <div className="flex items-center justify-between">
                            <label htmlFor="password" className="text-sm font-semibold text-slate-800">
                                Password
                            </label>
                            <a href = "/forgot-password" className="text-xs font-medium text-white/90 hover:text-white underline underline-offset-2">
                            Forgot Password?
                            </a>
                        </div>

                        <div className="mt-1.5 relative">
                            <input 
                            id = "password"
                            type = {showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            value = {password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder = "•••••••••••••"
                            aria-invalid = {!!errors.password}
                            aria-describedby = {errors.password ? "password-error" : undefined}
                            className={`w-full rounded-xl border bg-white px-4 py-3 pr-11 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:ring-2 focus:ring-white/70 ${
                                errors.password ? "border-red-400" : "border-transparent"
                            }`}
                        />

                        <button 
                        type="button"
                        onClick={()=> setShowPassword((v) => !v)}
                        aria-label = {showPassword ? "Hide password" : "Show password"}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-700">
                            {showPassword ? <EyeOff className = "h-5 w-5" /> : <Eye className = "h-5 w-5"/>}
                        </button>
                        </div>
                        {errors.password && (
                            <p id="password-error" className="mt-1.5 text-xs font-medium text-red-100 bg-red-500/20 rounded px-2 py-1 w-fit">
                                {errors.password}
                            </p>
                        )}
                    </div>

                    <button
                    type = "submit"
                    disabled = {submitting}
                    className="!mt-6 w-full rounded-xl bg-white py-3 text-sm font-semibold text-[#5678C2] shadow-sm transition hover:bg-white/90 activate:scale-[0.99] disabled:opacity-70 disabled:active:scale-100">
                        {submitting ? "Signing in..." : "Sign in"}
                    </button>

                    <p className="text-center text-sm text-white/85">
                    Don&apos;t have an account?{" "}
                    <a href="/register" className="font-semibold text-white underline underline-offset-2 hover:text-white/90">
                    Sign Up
                    </a>
                    </p>
                    {formError && (
                        <p role="alert" className="text-sm text-red-100">
                            {formError}
                        </p>
                    )}
                </form>

                </div>
            </div>
        </div>
    );
}

function LoginField({
    label, id, type, value, onChange, error, placeholder, autoComplete,
} : {
    label: string;
    id: string;
    type: string;
    value: string; 
    onChange: (v: string) => void; 
    error?: string;
    placeholder? : string; 
    autoComplete?: string;
}){
    return(
        <div>
            <label htmlFor={id} className="text-sm font-semibold text-slate-800">
                {label}
            </label>

            <input
            id = {id}
            type = {type}
            value = {value}
            onChange = {(e) => onChange(e.target.value)}
            placeholder = {placeholder}
            autoComplete= {autoComplete}
            aria-invalid  ={!!error}
            aria-describedby = {error ? `${id}-error` : undefined}
            className = {`mt-1.5 w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:ring-2 focus:ring-white/70 ${error ? "border-red-400" : "border-transparent"}`}
            />
            {
                error && (
                    <p id = {`${id}-error`} 
                    className="mt-1.5 text-xs font-medium text-red-100 bg-red-50 0/20 rounded px-2 py-1 w-fit">
                        {error}
                    </p>
                )
            }
        </div>
    );
}