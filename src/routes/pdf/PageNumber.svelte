<script lang="ts">
    interface Props {
        page: number;
        total: number;
    }

    const { page, total }: Props = $props();
</script>

<div class="absolute bottom-4 right-5 text-light">{page} / {total}</div>