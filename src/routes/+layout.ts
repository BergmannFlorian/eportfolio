import { browser } from "$app/environment";

export const prerender = true

export async function load() {
    if (browser) {
        const cv = await fetch("cv.json");
        const skills = await fetch("skills.json");
        return {
            cv: await cv.json(),
            skills: await skills.json()
        }
    } else {
        return {};
    }
}