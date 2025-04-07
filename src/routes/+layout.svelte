<script>
    const { children } = $props();
</script>

<nav>
    <a href="/">home</a>
    <a href="/3d">3D</a>
    <a href="/pdf">PDF</a>
</nav>

{@render children()}
