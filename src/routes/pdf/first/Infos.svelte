<script lang="ts">
    import profil from "$lib/assets/images/florian-b.jpg";
    import { getDate } from "$lib/helpers";
    import type { Infos } from "$lib/interfaces/cv";
    import Info from "./Info.svelte";
    import Section from "./Section.svelte";

    export let infos: Infos;

    const birthdate = getDate(infos.contact.age);
    const diff = new Date(Date.now() - birthdate.getTime());
    const age = diff.getFullYear() - 1970;
</script>

<div class="h-full flex flex-col bg-dark text-light">
    <img class="w-full h-[8cm] object-cover" src={profil} alt="profil" />
    <div class="text-[29px] text-center font-questrial">
        {infos.contact.name}
    </div>
    <div class="flex flex-col pr-5 pl-5 justify-around h-full">
        <Section title="contact" center={true}>
            <Info icon="solar:map-point-linear">
                <div>{infos.contact.address}</div>
            </Info>
            <Info icon="solar:letter-linear">
                <div>{infos.contact.email}</div>
            </Info>
            <Info icon="solar:calendar-outline">
                <div>{age}ans</div>
            </Info>
            {#each infos.others as other}
                <Info icon={other.icon}>
                    <div>{other.title}</div>
                </Info>
            {/each}
            {#each infos.socials as social}
                <Info icon="solar:link-broken">
                    <a href={social.link}>{social.link}</a>
                </Info>
            {/each}
            <Info icon="solar:bookmark-circle-broken">
                <div>Références sur demande</div>
            </Info>
        </Section>
        <Section title="langues" center={true}>
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
        <Section title="centres d'intérêt" center={true}>
            {#each infos.hobbys as hobby}
                <div>{hobby}</div>
            {/each}
        </Section>
    </div>
</div>

<style>
</style>
