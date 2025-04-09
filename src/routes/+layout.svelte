<script>
    import "../app.css";
    import { base } from "$app/paths";

    const { children } = $props();
</script>

<nav>
    <a href="{base}/">home</a>
    <a href="{base}/3d">3D</a>
    <a href="{base}/pdf">PDF</a>
</nav>

{@render children()}
