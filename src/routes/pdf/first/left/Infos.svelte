<script lang="ts">
    import profil from "$lib/assets/images/florian-b.jpg";
    import type { Infos } from "$lib/interfaces/cv";
    import Section from "../Section.svelte";

    export let infos: Infos;
</script>

<div class="h-full flex flex-col left">
    <img src={profil} alt="profil" />
    <div class="text-[29px] text-center font-questrial">
        {infos.contact.name}
    </div>
    <div class="flex flex-col pr-5 pl-5 justify-around h-full">
        <Section title="contact" center={true} titleLight={true}>
            <div class="flex content-center">
                <span class="icon-[solar--map-point-linear] my-auto"></span>
                <div>{infos.contact.address}</div>
            </div>
            <div class="flex content-center">
                <span class="icon-[solar--letter-linear] my-auto"></span>
                <div>{infos.contact.email}</div>
            </div>
            {#each infos.socials as social}
                <div class="flex content-center">
                    <span class="icon-[solar--link-broken] my-auto"></span>
                    <a href={social.link}>{social.link}</a>
                </div>
            {/each}
            {#each infos.others as other}
                <div class="flex content-center">
                    <span class="icon-[solar--card-2-outline] my-auto"></span>
                    <div>{other}</div>
                </div>
            {/each}
        </Section>
        <Section title="références" center={true} titleLight={true}>
            <div class="text-center w-full font-bold">Sur demande</div>
        </Section>
        <Section title="langues" center={true} titleLight={true}>
            <table>
                <tbody>
                    {#each infos.langs as lang}
                        <tr>
                            <td>{lang.name}</td>
                            <td class="px-1">:</td>
                            <td>{lang.level}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </Section>
        <Section title="centres d'intérêts" center={true} titleLight={true}>
            <div>{infos.hobbys.join(", ")}</div>
        </Section>
    </div>
</div>

<style>
    img {
        width: 100%;
        height: 9cm;
        object-fit: cover;
    }

    .left {
        background-color: #3b3b3b;
        color: #b4b4b4;
    }
</style>
