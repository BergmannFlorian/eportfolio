export interface Social {
    name: string,
    link: string,
}

export interface Reference {
    name: string,
    title: string,
    company: string,
    phone: string,
}

export interface Lang {
    name: string,
    level: string,
}

export interface Infos {
    title: string,
    contact: {
        name: string,
        email: string,
        address: string,
    },
    socials: Social[],
    references: Reference[],
    langs: Lang[],
    hobbys: string[],
    others: string[],

}

export interface Project {
    name: string,
    link: string,
    details: string[],
}

export interface Job {
    category: string,
    title: string,
    company: string,
    start: string,
    end: string,
    tasks: string[],
    projects: Project[],
}

export interface Formation {
    name: string,
    company: string,
    start: string,
    end: string,
    tasks: string[],
    course: string,
    projects: Project[],
}

export interface Certificate {
    title: string,
    date: string,
    link: string,
}

export interface CV {
    infos: Infos,
    jobs: Job[],
    formations: Formation[],
    certificates: Certificate[],
}