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
    <div class="flex w-[90%] mb-3 {center ? 'justify-center mt-2' : ''}">
        <hr class="border-solid border-3 w-15 text-gray-light" />
    </div>
    <div class="w-full">
        <slot></slot>
    </div>
</div>
