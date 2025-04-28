<script lang="ts">
    import Icon from "@iconify/svelte";

    export let icon: string | null = null;
</script>

<div class="flex content-center">
    {#if icon}
        <Icon {icon} class="my-auto"></Icon>
    {/if}
    <slot></slot>
</div>
