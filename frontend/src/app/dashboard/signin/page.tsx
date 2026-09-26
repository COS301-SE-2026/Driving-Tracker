"use client";

import {useState, type FormEvent} from "react";

export default function SignInPage(){

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [remember, setRemember] = useState(false);
    const [errors, setErrors] = useState<{email ?: string; password?: string}>({});
    const [submitting, setSubmitting] = useState(false);

    function validate(){

        const next : {
            email?: string;
            password?: string
        } = {};

        if (!email.trim()){
            next.email = "Enter your email address";
        }
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
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
        try{
            //integrate endpoint
            await new Promise((r) => setTimeout(r,600));
        }
        finally{
            setSubmitting(false);
        }
    }

    return(

    );
}

function LoginInField({
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