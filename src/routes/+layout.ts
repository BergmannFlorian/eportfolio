import cvJson from "$lib/data/cv.json";
import skillsJson from "$lib/data/skills.json"
import type { CV } from "$lib/interfaces/cv";
import type { Skills } from "$lib/interfaces/skills";

export const prerender = true

export async function load() {
    return {
        cv: cvJson as CV,
        skills: skillsJson as Skills
    }
}