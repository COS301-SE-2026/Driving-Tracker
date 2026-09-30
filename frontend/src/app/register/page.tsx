"use client";

import {useState, type FormEvent} from "react";
import Image from "next/image";
import {Eye, EyeOff, MapPin} from "lucide-react";
import { BASE_PATH } from "@/lib/basePath";
import { register } from "@/lib/auth/authService";

type FormState = {
    organizationName: string;
    email: string;
    name: string;
    surname: string;
    phoneNumber: string;
    dob: string;
    password: string;
    confirmPassword: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const initialForm: FormState = {
    organizationName: "",
    email: "",
    name: "",
    surname: "",
    phoneNumber: "",
    dob: "",
    password: "",
    confirmPassword: "",
};

export default function RegisterPage(){
    const [form, setForm] = useState<FormState>(initialForm);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    function update<K extends keyof FormState>(key: K, value: FormState[K]){
        setForm((prev) => ({...prev, [key]: value}));
    }

    function validate(): boolean {
        const next: FormErrors = {};

        if (!form.organizationName.trim()){
            next.organizationName = "Enter your organization's name.";
        }

        if (!form.email.trim()){
            next.email = "Enter an email address.";
        }
        else if (!/^\S+@\S+\.\S+$/.test(form.email)){
            next.email = "Please enter a valid email address";
        }

        if (!form.name.trim()){
            next.name = "Enter your name.";
        }

        if (!form.surname.trim()){
            next.surname = "Enter your surname.";
        }

        if (!form.phoneNumber.trim()){
            next.phoneNumber = "Enter your phone number.";
        }

        else if (!/^\+?[0-9()\-\s]{7,20}$/.test(form.phoneNumber)){
            next.phoneNumber = "Enter a valid phone number.";
        }

        if (!form.dob.trim()){
            next.dob = "Enter your date of birth.";
        }

        if (!form.password){
            next.password = "Enter a password.";
        }
        else if (form.password.length < 8){
            next.password = "Use at least 8 characters";
        }

        if (!form.confirmPassword){
            next.confirmPassword = "Confirm your password.";
        }
        else if (form.confirmPassword !== form.password){
            next.confirmPassword = "Passwords do not match."
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
        setErrors({});
        setSuccessMessage("");
        setFormError("");

        try{
            setErrors({});
            setFormError("");
            const message = await register({
                name: form.name,
                surname: form.surname,
                email: form.email,
                dob: form.dob,
                password: form.confirmPassword,
                phone_number: form.phoneNumber,
                organization_name: form.organizationName
            });

            setSuccessMessage(message);
            setForm(initialForm);
            
        }catch (error){
            setFormError(error instanceof Error ? error.message : "Unable to register");
        }
        finally{
            setSubmitting(false);
        }
    }

    return(
            <div className="min-h-screen md:h-screen w-full flex bg-white font-sans md:overflow-hidden">
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
    
                <div className="flex-1 md:h-full md:overflow-y-auto bg-slate-50">
                    <div className="min-h-full flex items-center justify-center px-6 py-4">
                    <div className="w-full max-w-md rounded-3xl bg-gradient-to-br from-[#8FE0DE] to-[#4FB9C4] p-6 sm:p-7 shadow-2xl shadow-blue-900/20">
    
                    <h1 className="text-white text-3xl font-bold tracking-tight">
                        Welcome!
                    </h1>
    
    
                    <form className="mt-4 space-y-3" onSubmit={handleSubmit} noValidate>
                        <RegisterField 
                        label = "Organization Name"
                        id = "organizationName"
                        type = "text"
                        value = {form.organizationName}
                        onChange = {(v)=> update("organizationName",v)}
                        error = {errors.organizationName}
                        placeholder = "Org Name"
                        />

                        <RegisterField 
                        label = "Email Address"
                        id = "email"
                        type = "email"
                        value = {form.email}
                        onChange = {(v)=> update("email",v)}
                        error = {errors.email}
                        placeholder = "email@example.com"
                        />

                            
                        <RegisterField 
                            label = "Phone Number"
                            id = "phoneNumber"
                            type = "tel"
                            value = {form.phoneNumber}
                            onChange = {(v)=> update("phoneNumber",v)}
                            error = {errors.phoneNumber}
                            placeholder = "0201234567"
                        />
                        

                        <div className="grid grid-cols-2 gap-4">
                            <RegisterField 
                            label = "Name"
                            id = "name"
                            type = "text"
                            value = {form.name}
                            onChange = {(v)=> update("name",v)}
                            error = {errors.name}
                            placeholder = "Name"
                            />
                            <RegisterField 
                            label = "Surname"
                            id = "surname"
                            type = "text"
                            value = {form.surname}
                            onChange = {(v)=> update("surname",v)}
                            error = {errors.surname}
                            placeholder = "Surname"
                            />
                        </div>

                        <RegisterField 
                        label = "Date of Birth"
                        id = "dob"
                        type = "date"
                        autoComplete="dob"
                        value = {form.dob}
                        onChange = {(v)=> update("dob",v)}
                        error = {errors.dob}
                        />

                        <PasswordField
                        label = "Password"
                        id = "password"
                        value = {form.password}
                        onChange = {(v) => update("password", v)}
                        error = {errors.password}
                        show = {showPassword}
                        onToggleShow = {() => setShowPassword((v) => !v)}
                        autoComplete="new-password"
                        />

                        <PasswordField
                        label = "Confirm Password"
                        id = "confirmpassword"
                        value = {form.confirmPassword}
                        onChange = {(v) => update("confirmPassword", v)}
                        error = {errors.confirmPassword}
                        show = {showConfirmPassword}
                        onToggleShow = {() => setShowConfirmPassword((v) => !v)}
                        autoComplete="new-password"
                        />

                        <button type = "submit" disabled = {submitting} 
                        className="w-full rounded-xl bg-white py-3 text-sm font-semibold text-[#5678C2] shadow-sm transition hover:bg-white/90 active:scale-[0.99] disabled:opacity-70 disabled:active:scale-100">
                            {submitting ? "Creating account..." : "Create account"}
                        </button>
                        
                        <p className="text-center text-sm text-white/85">
                        Already have an account?{" "}
                        <a href="/login" className="font-semibold text-white underline underline-offset-2 hover:text-white/90">
                        Log In
                        </a>
                        </p>
                        {formError && (
                            <p role="alert" className="text-sm text-red-100">
                                {formError}
                            </p>
                        )}

                        {successMessage && (
                            <p role="status" className="rounded-xl bg-emerald-100 px-4 py-3 text-sm font-medium text-emerald-800">
                                {successMessage}
                            </p>
                        )}
                    </form>
    
                    </div>
                </div>
                </div>
            </div>
        );
}

function FieldShell({
    label, id, error, children,
} : {
    label: string;
    id: string; 
    error?: string;
    children: React.ReactNode;
}){
    return(
        <div>
            <label htmlFor={id} className="text-sm font-semibold text-slate-800">
                {label}
            </label>

            {children}

            {
                error && (
                    <p id = {`${id}-error`} 
                    className="mt-1.5 text-xs font-medium text-red-100 bg-red-500/20 rounded px-2 py-1 w-fit">
                        {error}
                    </p>
                )
            }
        </div>
    );
}

function RegisterField({
    label, id, type, value, onChange, error, placeholder, autoComplete
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

        <FieldShell label = {label} id = {id} error = {error}>
            <input
            id = {id}
            type = {type}
            value = {value}
            onChange = {(e) => onChange(e.target.value)}
            placeholder = {placeholder}
            autoComplete= {autoComplete}
            aria-invalid  ={!!error}
            aria-describedby = {error ? `${id}-error` : undefined}
            className = {`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:ring-2 focus:ring-white/70 ${error ? "border-red-400" : "border-transparent"}`}
            />
        </FieldShell>
    );
}

function PasswordField({
    label, id, value, onChange, error, show, onToggleShow, autoComplete,
} : {
    label: string;
    id: string;
    value: string; 
    onChange: (v: string) => void; 
    error?: string;
    show: boolean;
    onToggleShow: () => void;
    autoComplete?: string;
}){
    return(
        <FieldShell label = {label} id={id} error = {error}>
            <div className="mt-1.5 relative">
                <input
                id = {id}
                type = {show ? "text" : "password"}
                value = {value}
                onChange = {(e) => onChange(e.target.value)}
                placeholder = "•••••••••••••"
                autoComplete= {autoComplete}
                aria-invalid  ={!!error}
                aria-describedby = {error ? `${id}-error` : undefined}
                className = {`mt-1.5 w-full rounded-xl border bg-white px-4 py-3 pr-11 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:ring-2 focus:ring-white/70 ${error ? "border-red-400" : "border-transparent"}`}
                />
                <button type="button" onClick={onToggleShow}
                aria-label = {show ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-700">
                    {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
            </div>
        </FieldShell>
    );
}