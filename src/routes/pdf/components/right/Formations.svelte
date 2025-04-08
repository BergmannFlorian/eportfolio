<script lang="ts">
    import type { Formation } from "$lib/interfaces/cv";

    export let formations: Formation[];
</script>

<div>
    <div>FORMATIONS</div>
    <table>
        <tbody>
            {#each formations as formation}
                <tr>
                    <td>{formation.start} - {formation.end}</td>
                    <td>{formation.company}</td>
                    <td>
                        <div>{formation.name}</div>
                        <div>
                            {#each formation.tasks as task}
                                <div>{task}</div>
                            {/each}
                        </div>
                    </td>
                    <td></td>
                </tr>
            {/each}
        </tbody>
    </table>
</div>
