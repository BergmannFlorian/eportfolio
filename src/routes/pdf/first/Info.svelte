<script lang="ts">
    import Icon from "@iconify/svelte";

    export let icon: string | null = null;
</script>

<div class="flex content-center">
    {#if icon}
        <Icon {icon} class="my-auto pr-0.5"></Icon>
    {/if}
    <slot></slot>
</div>
