<script lang="ts">
	import { tick } from 'svelte';
	import { EDIT_LIMITS, type EditSections, type SkillCategoryEdit, type SkillEdit } from '#lib/content/edit.js';
	import type { SkillLevel } from '#lib/cv/skills.js';
	import { m } from '#lib/paraglide/messages.js';
	import { baseLocale, locales } from '#lib/paraglide/runtime.js';
	import EditDialog from './EditDialog.svelte';
	import { FIELD } from './field.js';

	/**
	 * Skill catalog as a table, like the CV: one column per category, one row per CV level
	 * (computed from the dates of use, shown only), one card per skill. Cards are dragged
	 * by their handle to another place of their row, which sets their order and category;
	 * on the handle, the arrow keys do the same (↑ ↓ within the cell, ← → to the next column).
	 */
	/** context / triggerLabel: when opened from another page (the CV toolbar) */
	let {
		class: className = '',
		context,
		triggerLabel
	}: { class?: string; context?: string; triggerLabel?: string } = $props();
	let data = $state<EditSections['skills'] | null>(null);
	let board = $state<HTMLElement>();

	type Slot = { c: number; i: number };
	/** Card whose handle is pressed: only that card is draggable */
	let armed = $state<SkillEdit | null>(null);
	let dragged = $state<Slot | null>(null);
	/** Insertion index while dragging, and where to draw it: next to a card, or at the cell end */
	let target = $state<(Slot & { card: number; after: boolean }) | null>(null);

	type Row = { level: SkillLevel | null; label: () => string };
	const levelRows: Row[] = [
		{ level: 'top', label: () => m.cv_level_top() },
		{ level: 'mid', label: () => m.cv_level_mid() },
		{ level: 'bottom', label: () => m.cv_level_bottom() }
	];
	const unusedRow: Row = { level: null, label: () => m.edit_skill_level_none() };
	// "Not used yet" only when needed (e.g. a new skill)
	const rows = $derived(
		data?.categories.some((category) => category.skills.some((skill) => skill.level === null))
			? [...levelRows, unusedRow]
			: levelRows
	);

	const newSkill = (): SkillEdit => ({
		id: null,
		name: '',
		inStack: false,
		onSite: true,
		onCv: true,
		uses: 0,
		level: null,
		personalOnly: false
	});
	const newCategory = (): SkillCategoryEdit => ({
		id: null,
		code: '',
		name: Object.fromEntries(locales.map((locale) => [locale, ''])),
		onCv: true,
		skills: []
	});
	const categoryName = (category: SkillCategoryEdit) => category.name[baseLocale] || m.edit_category_new();

	/** Cards of a cell, with their index in the column */
	const cardsOf = (category: SkillCategoryEdit, level: SkillLevel | null) =>
		category.skills.map((skill, i) => ({ skill, i })).filter(({ skill }) => skill.level === level);

	/** After the last card of a cell, or at the end of the column */
	function endOfCell(category: SkillCategoryEdit, level: SkillLevel | null): number {
		const cards = cardsOf(category, level);
		return cards.length > 0 ? cards[cards.length - 1].i + 1 : category.skills.length;
	}

	const draggedLevel = () => (dragged && data ? data.categories[dragged.c].skills[dragged.i]?.level : undefined);

	/** Moves a skill to `to` (insertion index, counted before the move) */
	function moveSkill(from: Slot, to: Slot): Slot | null {
		if (!data) return null;
		const [skill] = data.categories[from.c].skills.splice(from.i, 1);
		const index = from.c === to.c && from.i < to.i ? to.i - 1 : to.i;
		data.categories[to.c].skills.splice(index, 0, skill);
		return { c: to.c, i: index };
	}

	async function focusHandle(slot: Slot | null) {
		if (!slot) return;
		await tick();
		board?.querySelector<HTMLElement>(`[data-handle="${slot.c}:${slot.i}"]`)?.focus();
	}

	function onHandleKey(event: KeyboardEvent, c: number, i: number) {
		if (!data) return;
		const columns = data.categories;
		const level = columns[c].skills[i].level;
		const cell = cardsOf(columns[c], level).map((card) => card.i);
		const position = cell.indexOf(i);
		let to: Slot | null = null;
		if (event.key === 'ArrowUp' && position > 0) to = { c, i: cell[position - 1] };
		else if (event.key === 'ArrowDown' && position < cell.length - 1) to = { c, i: cell[position + 1] + 1 };
		else if (event.key === 'ArrowLeft' && c > 0) to = { c: c - 1, i: endOfCell(columns[c - 1], level) };
		else if (event.key === 'ArrowRight' && c < columns.length - 1) to = { c: c + 1, i: endOfCell(columns[c + 1], level) };
		if (!to) return;
		event.preventDefault();
		focusHandle(moveSkill({ c, i }, to));
	}

	// A card only goes to a cell of its own row: the level comes from the dates, not the table
	function onCardDragOver(event: DragEvent, c: number, i: number, level: SkillLevel | null) {
		if (!dragged || draggedLevel() !== level) return;
		event.preventDefault();
		event.stopPropagation();
		const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
		const after = event.clientY > box.top + box.height / 2;
		target = { c, i: after ? i + 1 : i, card: i, after };
	}

	function onCellDragOver(event: DragEvent, c: number, level: SkillLevel | null) {
		if (!dragged || !data || draggedLevel() !== level) return;
		event.preventDefault();
		// Outside the cards: at the end of the cell
		target = { c, i: endOfCell(data.categories[c], level), card: -1, after: false };
	}

	function onDrop(event: DragEvent) {
		event.preventDefault();
		if (dragged && target) moveSkill(dragged, target);
		endDrag();
	}

	function endDrag() {
		armed = null;
		dragged = null;
		target = null;
	}

	async function addSkill(c: number) {
		if (!data) return;
		data.categories[c].skills.push(newSkill());
		await tick();
		board?.querySelector<HTMLInputElement>(`[data-name="${c}:${data.categories[c].skills.length - 1}"]`)?.focus();
	}

	function moveCategory(from: number, to: number) {
		if (!data) return;
		[data.categories[from], data.categories[to]] = [data.categories[to], data.categories[from]];
	}

	function validate({ categories }: EditSections['skills']) {
		const duplicate = categories.some((category) => {
			const names = category.skills.map((skill) => skill.name.trim().toLowerCase());
			return new Set(names).size !== names.length;
		});
		return duplicate ? m.edit_skill_duplicate() : null;
	}

	const flags = [
		{ key: 'inStack', label: () => m.edit_skill_in_stack() },
		{ key: 'onSite', label: () => m.edit_skill_on_site() },
		{ key: 'onCv', label: () => m.edit_skill_on_cv() }
	] as const;
	const icon =
		'flex size-8 shrink-0 cursor-pointer items-center justify-center text-fg-subtle hover:bg-inverse hover:text-inverse-fg disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-fg-subtle';
	const small = `${FIELD} min-h-9 px-2 text-sm`;
	const marker = 'pointer-events-none h-0.5 bg-accent';
	// Row headers stay visible while the table scrolls sideways
	const rowHeader = 'sticky left-0 z-10 bg-surface px-2 py-3';
</script>

<EditDialog
	section="skills"
	title={m.edit_skills_title()}
	hint="{m.edit_skills_board_hint()} {m.edit_skills_hint()}"
	size="wide"
	{context}
	{triggerLabel}
	bind:data
	{validate}
	class={className}
>
	{#if data}
		<button
			type="button"
			onclick={() => data!.categories.push(newCategory())}
			class="btn-outline min-h-10 cursor-pointer self-start px-4 text-sm"
		>
			<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
			{m.edit_category_add()}
		</button>

		<!-- Table: the 1px gaps over the border color draw the grid lines -->
		<div bind:this={board} class="overflow-x-auto pb-3">
			<div
				class="grid w-max gap-px border border-border bg-border"
				style:grid-template-columns="6rem repeat({data.categories.length}, 17rem)"
			>
				<!-- Header row: one category per column -->
				<div class={rowHeader}></div>
				{#each data.categories as category, c (category)}
					<div class="flex flex-col gap-2 bg-surface p-3" role="group" aria-label={categoryName(category)}>
						{#each locales as locale (locale)}
							<div class="flex items-center gap-2">
								<span class="w-6 font-mono text-xs text-fg-subtle uppercase">{locale}</span>
								<input
									type="text"
									lang={locale}
									required={locale === baseLocale}
									maxlength={EDIT_LIMITS.categoryName}
									aria-label="{m.edit_skill_category_name()} ({locale})"
									placeholder={locale === baseLocale ? '' : category.name[baseLocale]}
									bind:value={category.name[locale]}
									class="{small} font-medium"
								/>
							</div>
						{/each}
						<div class="flex items-center justify-between gap-2">
							<label class="flex min-h-9 cursor-pointer items-center gap-2 text-sm">
								<input type="checkbox" bind:checked={category.onCv} class="size-4 accent-accent" />
								{m.edit_category_on_cv_short()}
							</label>
							<span class="flex">
								<button
									type="button"
									class={icon}
									disabled={c === 0}
									onclick={() => moveCategory(c, c - 1)}
									aria-label={m.edit_category_move_left({ category: categoryName(category) })}
								>
									<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
								</button>
								<button
									type="button"
									class={icon}
									disabled={c === data.categories.length - 1}
									onclick={() => moveCategory(c, c + 1)}
									aria-label={m.edit_category_move_right({ category: categoryName(category) })}
								>
									<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
								</button>
								<!-- Only an empty category can go: its skills are moved or removed first -->
								<button
									type="button"
									class={icon}
									disabled={category.skills.length > 0}
									title={category.skills.length > 0 ? m.edit_category_remove_hint() : m.edit_category_remove()}
									aria-label={m.edit_category_remove()}
									onclick={() => data!.categories.splice(c, 1)}
								>
									<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
								</button>
							</span>
						</div>
					</div>
				{/each}

				<!-- One row per CV level -->
				{#each rows as row (row.level)}
					<div class="{rowHeader} text-[10px] leading-[1.3] font-semibold tracking-[0.5px] break-words text-fg-subtle uppercase">{row.label()}</div>
					{#each data.categories as category, c (category)}
						{@const cards = cardsOf(category, row.level)}
						<div
							role="list"
							aria-label="{categoryName(category)} · {row.label()}"
							ondragover={(event) => onCellDragOver(event, c, row.level)}
							ondrop={onDrop}
							class="flex min-h-14 flex-col gap-2 p-2 {target?.c === c && draggedLevel() === row.level
								? 'bg-accent/8'
								: 'bg-bg'}"
						>
							{#each cards as { skill, i } (skill)}
								{#if target?.c === c && target.card === i && !target.after}
									<div aria-hidden="true" class={marker}></div>
								{/if}
								<div
									role="listitem"
									draggable={armed === skill}
									ondragstart={(event) => {
										if (armed !== skill) {
											event.preventDefault();
											return;
										}
										dragged = { c, i };
										event.dataTransfer?.setData('text/plain', skill.name);
										if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
									}}
									ondragend={endDrag}
									ondragover={(event) => onCardDragOver(event, c, i, row.level)}
									class="flex flex-col gap-2 border border-border bg-surface p-2 {dragged?.c === c && dragged.i === i
										? 'opacity-40'
										: ''}"
								>
									<div class="flex items-center gap-1.5">
										<button
											type="button"
											data-handle="{c}:{i}"
											aria-label={m.edit_skill_drag({ skill: skill.name || m.edit_untitled() })}
											title={m.edit_skill_drag({ skill: skill.name || m.edit_untitled() })}
											onpointerdown={() => (armed = skill)}
											onpointerup={() => {
												if (!dragged) armed = null;
											}}
											onkeydown={(event) => onHandleKey(event, c, i)}
											class="flex size-8 shrink-0 cursor-grab touch-none items-center justify-center text-fg-subtle hover:text-fg-strong active:cursor-grabbing"
										>
											<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.6" /><circle cx="15" cy="6" r="1.6" /><circle cx="9" cy="12" r="1.6" /><circle cx="15" cy="12" r="1.6" /><circle cx="9" cy="18" r="1.6" /><circle cx="15" cy="18" r="1.6" /></svg>
										</button>
										<input
											type="text"
											required
											data-name="{c}:{i}"
											maxlength={EDIT_LIMITS.skillName}
											aria-label={m.edit_skill_name()}
											placeholder={m.edit_skill_name_placeholder()}
											bind:value={skill.name}
											class="{small} min-w-0 flex-1"
										/>
										<button
											type="button"
											class={icon}
											onclick={() => category.skills.splice(i, 1)}
											aria-label={m.edit_remove({ item: skill.name || m.edit_untitled() })}
										>
											<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
										</button>
									</div>
									<div class="flex flex-wrap items-center gap-1.5 pl-9.5">
										{#each flags as flag (flag.key)}
											<button
												type="button"
												aria-pressed={skill[flag.key]}
												onclick={() => (skill[flag.key] = !skill[flag.key])}
												class="min-h-7 cursor-pointer border px-2 font-mono text-[11px] {skill[flag.key]
													? 'border-inverse bg-inverse text-inverse-fg'
													: 'border-chip-border text-fg-subtle line-through hover:border-border-strong'}"
												>{flag.label()}</button
											>
										{/each}
										<span class="ml-auto flex gap-2 font-mono text-[11px] text-fg-subtle">
											{#if skill.personalOnly}
												<span title={m.cv_skill_personal_note()}>*</span>
											{/if}
											{#if skill.uses > 0}
												<span title={m.edit_skill_uses({ count: skill.uses })}
													>{m.edit_skill_uses_short({ count: skill.uses })}</span
												>
											{/if}
										</span>
									</div>
								</div>
								{#if target?.c === c && target.card === i && target.after}
									<div aria-hidden="true" class={marker}></div>
								{/if}
							{/each}
							{#if target?.c === c && target.card === -1 && draggedLevel() === row.level}
								<div aria-hidden="true" class={marker}></div>
							{/if}
						</div>
					{/each}
				{/each}

				<!-- Footer row: new skills start "not used yet" -->
				<div class={rowHeader}></div>
				{#each data.categories as category, c (category)}
					<div class="bg-surface p-2">
						<button
							type="button"
							onclick={() => addSkill(c)}
							aria-label="{m.edit_skill_add()} · {categoryName(category)}"
							class="flex min-h-9 w-full cursor-pointer items-center justify-center gap-2 border border-dashed border-chip-border text-sm text-fg-muted hover:border-border-strong hover:text-fg-strong"
						>
							<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
							{m.edit_skill_add()}
						</button>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</EditDialog>
