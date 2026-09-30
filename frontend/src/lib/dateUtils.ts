export function toLocalDatetimePickerValue(dateInput?: string | Date | null): string {
    const date = dateInput ? new Date(dateInput) : new Date();
    if(Number.isNaN(date.getTime())){
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    }
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
}