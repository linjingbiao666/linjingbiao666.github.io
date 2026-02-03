import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IN_JSON = path.join(ROOT, 'src', 'data', 'honors.generated.json');

const main = async () => {
	const strict = process.argv.includes('--strict');
	const raw = await fs.readFile(IN_JSON, 'utf8');
	const data = JSON.parse(raw);

	const items = Array.isArray(data.items) ? data.items : [];
	const seen = new Set();
	const dupIds = new Set();
	for (const i of items) {
		if (!i?.id) continue;
		if (seen.has(i.id)) dupIds.add(i.id);
		seen.add(i.id);
	}

	const missingIssuer = items.filter((i) => !i?.issuer || i.issuer === '待补充');
	const missingTime = items.filter((i) => !i?.time?.display);
	const missingThumbs = items.filter((i) => i?.type === 'image' && (!i?.thumbs?.w640 || !i?.thumbs?.w320));

	console.log(`Honors check: items=${items.length}`);
	console.log(`- duplicateIds=${dupIds.size}`);
	console.log(`- missingIssuer=${missingIssuer.length}`);
	console.log(`- missingTime=${missingTime.length}`);
	console.log(`- missingThumbs=${missingThumbs.length}`);

	if (missingIssuer.length) {
		console.log('\nMissing issuer:');
		for (const i of missingIssuer.slice(0, 20)) console.log(`- ${i.source}`);
		if (missingIssuer.length > 20) console.log(`- ... (${missingIssuer.length - 20} more)`);
	}

	if (missingTime.length) {
		console.log('\nMissing time:');
		for (const i of missingTime.slice(0, 20)) console.log(`- ${i.source}`);
		if (missingTime.length > 20) console.log(`- ... (${missingTime.length - 20} more)`);
	}

	if (strict && (dupIds.size || missingIssuer.length || missingTime.length || missingThumbs.length)) {
		process.exitCode = 1;
	}
};

await main();

