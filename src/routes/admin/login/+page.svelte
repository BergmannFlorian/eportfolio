<script lang="ts">
	import ArrowRight from '#lib/components/icons/ArrowRight.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { localizeHref } from '#lib/paraglide/runtime.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// A locked or expired code step sends the user back to the password step
	const step = $derived(
		form?.error === 'locked' || form?.error === 'expired' ? 'password' : data.step
	);

	const error = $derived.by(() => {
		switch (form?.error) {
			case 'invalid':
				return step === 'code' ? m.admin_error_code() : m.admin_error_invalid();
			case 'locked':
				return m.admin_error_locked({ minutes: data.lockMinutes });
			case 'expired':
				return m.admin_error_expired();
			default:
				return null;
		}
	});

	let showPassword = $state(false);

	const field =
		'min-h-12 w-full border border-border bg-bg px-3.5 py-2.5 text-base text-fg hover:border-fg-subtle focus:border-fg-strong focus:outline-2 focus:outline-offset-1 focus:outline-accent';
	const label = 'text-sm font-medium text-fg-strong';
	const backLink =
		'inline-flex min-h-11 items-center gap-2 self-start font-mono text-sm text-fg-subtle no-underline hover:text-fg-strong';
</script>

<svelte:head>
	<title>{m.admin_meta_title()}</title>
</svelte:head>

{#snippet arrowLeft()}
	<svg
		aria-hidden="true"
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg
	>
{/snippet}

<div class="flex w-full max-w-110 flex-col gap-8">
	<div class="flex flex-col gap-3.5">
		<p class="kicker">{m.admin_kicker()}</p>
		<h1
			class="m-0 font-display text-5xl leading-[1.05] font-normal tracking-[-1px] text-fg-strong"
		>
			{m.admin_login_title()}
		</h1>
	</div>

	<section
		aria-labelledby="step-title"
		class="flex flex-col gap-6 border border-t-2 border-border border-t-border-strong bg-surface p-6 sm:p-8"
	>
		<div class="flex items-baseline justify-between gap-4">
			<h2 id="step-title" class="label-caps text-[13px] text-fg-strong">
				{step === 'code' ? m.admin_step_code() : m.admin_step_password()}
			</h2>
			<span class="font-mono text-[13px] text-fg-subtle">
				{m.admin_step_count({ current: step === 'code' ? 2 : 1, total: 2 })}
			</span>
		</div>

		{#if error}
			<div
				role="alert"
				class="flex items-start gap-3 border-l-3 border-accent bg-bg px-3.5 py-3 text-[15px] leading-normal"
			>
				<svg
					aria-hidden="true"
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="mt-0.5 shrink-0 text-accent"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></svg
				>
				<span>{error}</span>
			</div>
		{/if}

		{#if step === 'password'}
			<form method="POST" action="?/password" class="flex flex-col gap-5">
				<div class="flex flex-col gap-2">
					<label for="email" class={label}>{m.admin_email()}</label>
					<input
						id="email"
						name="email"
						type="email"
						autocomplete="username"
						required
						value={form?.email ?? ''}
						class={field}
					/>
				</div>
				<div class="flex flex-col gap-2">
					<label for="password" class={label}>{m.admin_password()}</label>
					<div class="relative">
						<input
							id="password"
							name="password"
							type={showPassword ? 'text' : 'password'}
							autocomplete="current-password"
							required
							class="{field} pr-13"
						/>
						<button
							type="button"
							aria-pressed={showPassword}
							onclick={() => (showPassword = !showPassword)}
							class="absolute top-0 right-0 flex size-12 cursor-pointer items-center justify-center text-fg-subtle hover:text-fg-strong"
						>
							<span class="sr-only">{m.admin_show_password()}</span>
							<svg
								aria-hidden="true"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.75"
								stroke-linecap="round"
								stroke-linejoin="round"
								><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle
									cx="12"
									cy="12"
									r="3"
								/></svg
							>
						</button>
					</div>
				</div>
				<button
					type="submit"
					disabled={form?.error === 'locked'}
					class="btn-primary min-h-12 cursor-pointer justify-center text-[15px] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-inverse disabled:hover:text-inverse-fg"
				>
					{m.admin_continue()}
					<ArrowRight size={16} />
				</button>
			</form>
		{:else}
			<form method="POST" action="?/code" class="flex flex-col gap-5">
				<p class="m-0 text-[15px] leading-relaxed text-fg-muted">{m.admin_code_help()}</p>
				<div class="flex flex-col gap-2">
					<label for="code" class={label}>{m.admin_code()}</label>
					<!-- svelte-ignore a11y_autofocus -->
					<input
						id="code"
						name="code"
						type="text"
						inputmode="numeric"
						autocomplete="one-time-code"
						pattern="[0-9 ]*"
						maxlength="7"
						required
						autofocus
						class="{field} min-h-15 text-center font-mono text-[26px] tracking-[10px]"
					/>
				</div>
				<button type="submit" class="btn-primary min-h-12 cursor-pointer justify-center text-[15px]">
					{m.admin_sign_in()}
				</button>
			</form>
			<form method="POST" action="?/restart">
				<button type="submit" class="{backLink} cursor-pointer">
					{@render arrowLeft()}
					{m.admin_restart()}
				</button>
			</form>
		{/if}
	</section>

	<a href={localizeHref('/')} class={backLink}>
		{@render arrowLeft()}
		{m.admin_back_to_site()}
	</a>
</div>
