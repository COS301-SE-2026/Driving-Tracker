"use client";

import { useEffect, useRef, useState } from "react";
import { Filter } from "lucide-react";

export type VehicleFilterState = {
	status: string[];
};

type FilterVehiclesProps = {
	filters: VehicleFilterState;
	onChange: (filters: VehicleFilterState) => void;
	availableStatuses?: string[];
};

const DEFAULT_STATUS_OPTIONS = [
	{label: "Available", value: "AVAILABLE"},
	{label: "Assigned", value: "ASSIGNED"},
	{label: "Unavailable", value: "UNAVAILABLE"},
];

function formatStatusLabel(status: string): string {
	if(!status) return "";
	const lower = status.toLowerCase();
	return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export default function FilterVehicles({
	filters,
	onChange,
	availableStatuses = [],
}: FilterVehiclesProps){
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent){
			if(containerRef.current && !containerRef.current.contains(event.target as Node)){
				setOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const statusOptionsMap = new Map<string, string>();
	DEFAULT_STATUS_OPTIONS.forEach((opt) => {
		statusOptionsMap.set(opt.value.toUpperCase(), opt.label);
	});
	availableStatuses.forEach((status) => {
		if(status){
			const upper = status.toUpperCase();
			if(!statusOptionsMap.has(upper)){
				statusOptionsMap.set(upper, formatStatusLabel(status));
			}
		}
	});

	const options = Array.from(statusOptionsMap.entries()).map(
		([value, label]) => ({
			value,
			label,
		})
	);

	const toggleStatus = (statusValue: string) => {
		const isSelected = filters.status.some(
			(s) => s.toUpperCase() === statusValue.toUpperCase()
		);
		const nextStatus = isSelected ? filters.status.filter(
			(s) => s.toUpperCase() !== statusValue.toUpperCase()
		) : [...filters.status, statusValue];
		
		onChange({...filters, status: nextStatus });
	};

	const clearFilters = () => {
		onChange({ ...filters, status: [] });
	};

	const activeFilterCount = filters.status.length;


	return (
		<div className="relative inline-block" ref={containerRef}>
			<button
				type="button"
				onClick={() => setOpen((o) => !o)}
				aria-label="Filter vehicles by status"
				className={`relative rounded-md p-1 transition hover:bg-slate-100 ${
					activeFilterCount > 0 ? "bg-sky-100 text-sky-700" : "text-slate-700"
				}`}
			>
				<Filter size={20} />
				{activeFilterCount > 0 && (
					<span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-sky-600 text-[10px] font-bold text-white">
						{activeFilterCount}
					</span>
				)}
			</button>

			{open && (
				<div className="absolute right-0 z-40 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
					<div className="mb-3 flex items-center justify-between border-b pb-2">
						<h4 className="text-sm font-semibold text-slate-900">
							Status
						</h4>
						{activeFilterCount > 0 && (
							<button
								type="button"
								onClick={clearFilters}
								className="text-xs text-sky-600 hover:text-sky-800"
							>
								CLear all
							</button>
						)}
					</div>

					<div className="flex flex-col gap-2">
						{options.map(({ value, label }) => {
							const checked = filters.status.some(
								(s) => s.toUpperCase() === value.toUpperCase()
							);
							return(
								<label 
									key={value}
									className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 hover:text-slate-900"
								>
									<input 
										type="checkbox"
										checked={checked}
										onChange={() => toggleStatus(value)}
										className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
									/>
									<span>{label}</span>
								</label>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}