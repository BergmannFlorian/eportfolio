<script lang="ts">
    import type { Infos } from "../../3d/interfaces";
    import profil from "$lib/assets/images/florian-b.jpg";

    export let infos: Infos;
</script>

<img src={profil} alt="profil" />
<div>{infos.contact.name}</div>
<div>
    <div>Contact</div>
    <div>
        <div>{infos.contact.address}</div>
        <div>{infos.contact.email}</div>
        {#each infos.socials as social}
            <div>{social}</div>
        {/each}
        {#each infos.others as other}
            <div>{other}</div>
        {/each}
    </div>
</div>
<div>
    <div>Références</div>
    <div>Sur demande</div>
</div>
<div>
    <div>Langues</div>
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
</div>
<div>
    <div>Centres d'intérêt</div>
    <div>
        {#each infos.hobbys as hobby}
            <div>{hobby}</div>
        {/each}
    </div>
</div>

<style>
    img {
        width: 100%;
    }
</style>
