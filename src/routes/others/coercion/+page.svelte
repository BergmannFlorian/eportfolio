<script>
    // @ts-nocheck

    import H2 from "../../pdf/fonts/H2.svelte";

    const vals = [
        "5",
        "0",
        "-5",
        5,
        0,
        -1,
        Infinity,
        -Infinity,
        // BigInt(5),
        // BigInt(0),
        // BigInt(5),
        true,
        false,
        undefined,
        null,
        [1, 2, 3],
        [],
        { nom: "test" },
        {},
        function () {},
        function () {
            let x = 2;
        },
    ];
</script>

<div id="container">
    <div>
        <H2>Self operations</H2>
        <table>
            <thead>
                <tr>
                    <th></th>
                    <th>..++</th>
                    <th>..--</th>
                    <th>!..</th>
                    <th>+..</th>
                    <th>-..</th>
                    <th>++..</th>
                    <th>--..</th>
                </tr>
            </thead>
            <tbody>
                {#each vals as val, index}
                    {@const tmp = [...vals]}
                    <tr>
                        <td>{tmp[index]} : {typeof tmp[index]}</td>
                        <td>{tmp[index]++}</td>
                        <td>{tmp[index]--}</td>
                        <td>{!tmp[index]}</td>
                        <td>{+tmp[index]}</td>
                        <td>{-tmp[index]}</td>
                        <td>{++tmp[index]}</td>
                        <td>{--tmp[index]}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
    {#each vals as val1}
        <div class="pt-5">
            <table>
                <thead>
                    <tr>
                        <th>{val1} : {typeof val1}</th>
                        <th>**</th>
                        <th>*</th>
                        <th>/</th>
                        <th>%</th>
                        <th>+</th>
                        <th>-</th>
                        <th>{"<"}</th>
                        <th>{"<="}</th>
                        <th>{">"}</th>
                        <th>{">="}</th>
                        <th>==</th>
                        <th>!=</th>
                        <th>===</th>
                        <th>!==</th>
                        <th>&&</th>
                        <th>||</th>
                    </tr>
                </thead>
                <tbody>
                    {#each vals as val2}
                        <tr>
                            <td class="text-nowrap">{val2} : {typeof val2}</td>
                            <td>{val1 ** val2}</td>
                            <td>{val1 * val2}</td>
                            <td>{val1 / val2}</td>
                            <td>{val1 % val2}</td>
                            <td>{val1 + val2}</td>
                            <td>{val1 - val2}</td>
                            <td>{val1 < val2}</td>
                            <td>{val1 <= val2}</td>
                            <td>{val1 > val2}</td>
                            <td>{val1 >= val2}</td>
                            <td>{val1 == val2}</td>
                            <td>{val1 != val2}</td>
                            <td>{val1 === val2}</td>
                            <td>{val1 !== val2}</td>
                            <td>{val1 && val2}</td>
                            <td>{val1 || val2}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/each}
</div>

<style>
    table {
        border-collapse: collapse;
        border-style: var(--tw-border-style);
        border-width: 1px;
    }
    th,
    td {
        border-style: var(--tw-border-style);
        border-width: 1px;
        padding-block: calc(var(--spacing) * 1);
        padding-inline: calc(var(--spacing) * 2);
    }
</style>
