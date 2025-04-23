export function dateFormat(date: string, options: Intl.DateTimeFormatOptions = {
    month: "short",
    year: "numeric",
}): string {
    return getDate(date).toLocaleDateString("fr-FR", options);
}

export function getDate(date: string): Date {
    const split = date.split(".");
    return new Date(
        Number(split[2]),
        Number(split[1]) - 1,
        Number(split[0]),
    );
}

export function shortDate(start: string, end: string): string {
    const startDate = getDate(start);
    const endDate = getDate(end);
    if (startDate.getFullYear() === endDate.getFullYear()) {
        return `${dateFormat(start, { month: "short" })} - ${dateFormat(end, { month: "short", year: "numeric" })}`;
    } else {
        return `${startDate.getFullYear()} - ${endDate.getFullYear()}`;
    }
}

export function toSlug(name: string): string {
    return name.toLocaleLowerCase().replace(' ', '_')
}