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