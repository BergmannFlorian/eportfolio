export function dateFormat(dateS: string, options: Intl.DateTimeFormatOptions = {
    month: "short",
    year: "numeric",
}): string {
    const split = dateS.split(".");
    const date = new Date(
        Number(split[2]),
        Number(split[1]) - 1,
        Number(split[0]),
    );
    return date.toLocaleDateString("fr-FR", options);
}