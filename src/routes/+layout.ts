import { browser } from "$app/environment";

export async function load() {
    if (browser) {
        const res = await fetch("cv.json");
        return {
            cv: await res.json()
        }
    } else {
        return {};
    }
}