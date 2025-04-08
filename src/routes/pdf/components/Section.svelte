<script lang="ts">
    export let title: string;
    export let center: boolean = false;
    export let titleLight: boolean = false;

    console.log(5, center);
</script>

<div class="w-full flex justify-center flex-wrap">
    <div
        class="text-[19px] text-center w-full tracking-[5px] font-questrial {titleLight
            ? 'text-gray-light'
            : 'text-gray-dark'}"
    >
        {title.toUpperCase()}
    </div>
    <div class="flex w-[90%] {center ? 'justify-center' : ''}">
        <hr class="border-solid border-3 w-15 mb-3 gray" />
    </div>
    <div class="w-full">
        <slot></slot>
    </div>
</div>

<style>
    .gray {
        color: #b4b4b4;
    }
</style>
