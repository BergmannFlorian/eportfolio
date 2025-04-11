<script>
    import { base } from "$app/paths";

    const { children } = $props();
</script>

<nav>
    <a href="{base}/">Home</a>
    <a href="{base}/pdf/helper">Helper</a>
</nav>

{@render children()}
