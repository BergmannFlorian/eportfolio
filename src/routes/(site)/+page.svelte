<script lang="ts">
	import About from '#lib/components/About.svelte';
	import Contact from '#lib/components/Contact.svelte';
	import Hero from '#lib/components/Hero.svelte';
	import Journey from '#lib/components/Journey.svelte';
	import Skills from '#lib/components/Skills.svelte';
	import StackBand from '#lib/components/StackBand.svelte';
	import Works from '#lib/components/Works.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const home = $derived(data.home);
</script>

<svelte:head>
	<title>{m.meta_title()}</title>
	<meta name="description" content={m.meta_description()} />
</svelte:head>

<Hero headline={home.headline} bio={home.bio} email={home.email} portrait={home.portrait} />
<StackBand stack={home.stack} />
<Works works={home.works} personalWorks={home.personalWorks} />
<Skills skills={home.skills} />
<Journey jobs={home.jobs} />
<About about={home.about} facts={home.facts} languages={home.languages} hobbies={home.hobbies} />
<Contact email={home.email} />
