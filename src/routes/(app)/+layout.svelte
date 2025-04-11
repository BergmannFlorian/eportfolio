<script>
    import "../../app.css";
    import { base } from "$app/paths";

    const { children } = $props();
</script>

<nav>
    <a href="{base}/">home</a>
    <a href="{base}/3d">3D</a>
    <a href="{base}/pdf">PDF</a>
    <a href="{base}/helper">Helper</a>
</nav>

{@render children()}

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
