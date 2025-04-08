<script lang="ts">
    export let title: string;
</script>

<div class="w-full flex justify-center flex-wrap">
    <div class="text-[19px] text-center w-full pb-4 tracking-[5px]">
        {title}
    </div>
    <hr class="border-solid border-3 w-15 mb-4" />
    <div class="w-full">
        <slot></slot>
    </div>
</div>
