<script lang="ts">
    import profil from "$lib/assets/images/florian-b.jpg";
    import type { Infos } from "$lib/interfaces/cv";
    import Info from "./Info.svelte";

    export let infos: Infos;
</script>

<div class="h-full flex flex-col">
    <img src={profil} alt="profil" />
    <div class="text-[29px] text-center">{infos.contact.name}</div>
    <div class="flex flex-col pr-5 pl-5 justify-around h-full">
        <Info title="CONTACT">
            <div>{infos.contact.address}</div>
            <div>{infos.contact.email}</div>
            {#each infos.socials as social}
                <div>{social.link}</div>
            {/each}
            {#each infos.others as other}
                <div>{other}</div>
            {/each}
        </Info>
        <Info title="REFERENCES">
            <div class="text-center w-full font-bold">Sur demande</div>
        </Info>
        <Info title="LANGUES">
            <table>
                <tbody>
                    {#each infos.langs as lang}
                        <tr>
                            <td>{lang.name}</td>
                            <td>: {lang.level}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </Info>
        <Info title="CENTRES D'INTERETS">
            <div>{infos.hobbys.join(", ")}</div>
        </Info>
    </div>
</div>

<style>
    img {
        width: 100%;
        height: 9cm;
        object-fit: cover;
    }
</style>
