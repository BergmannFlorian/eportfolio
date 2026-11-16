<script lang="ts">
	import profil from '#lib/assets/portrait.jpg';
	import type { PublicCV } from '#lib/cv/types.js';
	import { m } from '#lib/paraglide/messages.js';
	import Info from './Info.svelte';
	import Section from './Section.svelte';

	let { infos }: { infos: PublicCV['infos'] } = $props();
</script>

<div class="flex h-full flex-col bg-cv-dark text-cv-light">
	<img class="h-[8cm] w-full object-cover" src={profil} alt={m.cv_photo_alt()} />
	<div class="text-center font-display text-[29px]">
		{infos.contact.name}
	</div>
	<div class="flex h-full flex-col justify-around pr-5 pl-5">
		<Section title={m.cv_section_contact()} center={true}>
			<Info icon="solar:map-point-linear">
				<div>{infos.contact.city}</div>
			</Info>
			<Info icon="solar:letter-linear">
				<div>{infos.contact.email}</div>
			</Info>
			<Info icon="solar:calendar-outline">
				<div>{m.cv_age({ age: infos.contact.age })}</div>
			</Info>
			{#each infos.others as other (other.title)}
				<Info icon={other.icon}>
					<div>{other.title}</div>
				</Info>
			{/each}
			{#each infos.socials as social (social.link)}
				<Info icon="solar:link-broken">
					<a href="https://{social.link}">{social.link}</a>
				</Info>
			{/each}
			<Info icon="solar:bookmark-circle-broken">
				<div>{m.cv_references()}</div>
			</Info>
		</Section>
		<Section title={m.cv_section_languages()} center={true}>
			<table>
				<tbody>
					{#each infos.langs as lang (lang.name)}
						<tr>
							<td>{lang.name}</td>
							<td class="px-1">:</td>
							<td>{lang.level}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</Section>
		<Section title={m.cv_section_hobbies()} center={true}>
			{#each infos.hobbys as hobby (hobby)}
				<div>{hobby}</div>
			{/each}
		</Section>
	</div>
</div>
