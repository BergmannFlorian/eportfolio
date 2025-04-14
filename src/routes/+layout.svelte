<script>
    import "../app.css";
    import { base } from "$app/paths";
    import { page } from "$app/state";
    import profil from "$lib/assets/images/florian-b.jpg";

    const { children } = $props();

    const routes = [
        { path: "", name: "Home" },
        { path: "3d", name: "3D" },
        { path: "pdf", name: "CV" },
        { path: "helper", name: "Helper" },
    ];

    routes.forEach((route) => {
        route.path = `${base}/${route.path}`;
    });

    let y = $state(0);
    let prevY = $state(0);
    let hide = $state(false);

    function checkScroll() {
        hide = prevY <= y;
        prevY = y;
    }
</script>

<svelte:window on:scroll={checkScroll} bind:scrollY={y} />

<header
    class="bg-dark text-light h-[50px] w-full flex font-teachers fixed top-0 z-10 duration-400 {hide
        ? '-translate-y-full'
        : 'translate-y-0'}"
>
    <img class="h-full w-auto object-cover" src={profil} alt="profil" />
    <nav class="h-full flex">
        {#each routes as route}
            <a
                href={route.path}
                class="h-full content-center px-3 font-bold {page.url
                    .pathname == route.path
                    ? 'bg-light text-dark'
                    : ''}"
            >
                {route.name}
            </a>
        {/each}
    </nav>
</header>

<div class="w-full h-full mt-[50px]">
    {@render children()}
</div>

<style>
    @import url("https://fonts.googleapis.com/css2?family=Questrial&display=swap");
    @import url("https://fonts.googleapis.com/css2?family=Questrial&family=Teachers:ital,wght@0,400..800;1,400..800&display=swap");
    @import "tailwindcss";

    @media print {
        nav {
            display: none !important;
        }
    }

    @theme {
        --color-light: #b4b4b4;
        --color-gray: #646464;
        --color-dark: #3b3b3b;
        --font-questrial: "Questrial", sans-serif;
        --font-teachers: "Teachers", sans-serif;
    }
</style>
