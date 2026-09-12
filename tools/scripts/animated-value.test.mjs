// AnimatedValue — the half of it a screenshot cannot show.
//
//   node tools/scripts/animated-value.test.mjs
//   node tools/scripts/animated-value.test.mjs --no-build
//
// Motion is the subject, so this asks for `reducedMotion: "no-preference"`:
// the harness's default freezes exactly the thing under test.

import { launch } from '../harness/app.mjs';
import { checks } from '../harness/check.mjs';
import { ROOT, open } from '../glow/docs.mjs';

const build = !process.argv.includes('--no-build');
const ROUTE = '/components/animated-value';

const t = checks('animated value');
const app = await launch({ build, cwd: ROOT, reducedMotion: 'no-preference' });
t.watch(app.page);
const { page } = app;

try {
	await open(page, ROUTE);

	// A string crossfades rather than being revealed: the whole text is in the
	// DOM from the first frame, and it is the *opacity* that moves. A typewriter
	// would show a growing substring instead, which is the thing this component
	// deliberately is not.
	const card = page.locator('#why-not-typewriter');
	const swap = card.locator('.animated-value .swap');
	const settled = await swap.innerText();
	await card.getByRole('button').click();
	await page.waitForTimeout(40);
	const early = await swap.innerText();
	const earlyOpacity = await swap.evaluate((el) => Number(getComputedStyle(el).opacity));
	t.ok(
		`a changed string is whole from the first frame ("${early}")`,
		early !== settled && early.length > 1
	);
	t.ok(`and fades in rather than appearing (opacity ${earlyOpacity.toFixed(2)})`, earlyOpacity < 1);

	await page.waitForTimeout(600);
	t.ok(
		`and settles at full opacity`,
		(await swap.evaluate((el) => Number(getComputedStyle(el).opacity))) === 1
	);

	// The padded zero has to *light up* across the carry rather than flick to
	// full ink on one frame — which only works because the leading cell is the
	// same element before and after, so dropping `.pad` transitions its colour.
	const pad = page.locator('#number-props .animated-number').first();
	const lead = pad.locator('.value span').first();

	const dim = await lead.evaluate((el) => getComputedStyle(el).color);
	const padded = await lead.evaluate((el) => el.classList.contains('pad'));
	t.ok(`a padding zero is dimmed (${dim})`, padded);

	// Wait for the cell to *be* padding first, then poll fast for the flip.
	// Sampling whenever it merely happens to be un-padded would usually land
	// long after the transition finished, and a finished transition is
	// indistinguishable from a snap.
	let wasPadded = false;
	for (let i = 0; i < 60 && !wasPadded; i++) {
		await page.waitForTimeout(150);
		wasPadded = await lead.evaluate((el) => el.classList.contains('pad'));
	}

	let carried = false;
	for (let i = 0; i < 400 && wasPadded && !carried; i++) {
		await page.waitForTimeout(50);
		carried = !(await lead.evaluate((el) => el.classList.contains('pad')));
	}

	if (!carried) {
		t.ok('the carry never came round — colour unverified', false);
	} else {
		const start = await lead.evaluate((el) => getComputedStyle(el).color);
		await page.waitForTimeout(140);
		const mid = await lead.evaluate((el) => getComputedStyle(el).color);
		await page.waitForTimeout(700);
		const end = await lead.evaluate((el) => getComputedStyle(el).color);
		t.ok(`the zero lights up over time, not in one frame (${start} → ${mid})`, mid !== start);
		t.ok(`and arrives at full ink (${end})`, !end.includes('/ 0.3'));
	}

	// The box eases between two content widths rather than stepping: a string
	// swapping for a much longer one is the clearest case of it.
	const swapCard = page.locator('#why-not-typewriter');
	const box = swapCard.locator('.animated-value');
	const w0 = (await box.boundingBox()).width;
	await swapCard.getByRole('button').click();
	await page.waitForTimeout(60);
	const w1 = (await box.boundingBox()).width;
	await page.waitForTimeout(700);
	const w2 = (await box.boundingBox()).width;
	t.ok(
		`the box eases to its new width (${w0.toFixed(1)} → ${w1.toFixed(1)} → ${w2.toFixed(1)})`,
		Math.abs(w2 - w0) > 1 && Math.abs(w1 - w2) > 0.5
	);
} finally {
	await app.close();
	t.done();
}
