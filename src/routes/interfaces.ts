export interface Job {
    category: string,
    title: string,
    company: string,
    start: string,
    end: string,
    tasks: string[],
    projects: Projects[],
}

interface Projects {
    name: string,
    link: string,
    details: string[],
}