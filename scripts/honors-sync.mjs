import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const SOURCE_DIR = path.join(ROOT, 'public', '全部奖状');
const THUMBS_DIR = path.join(SOURCE_DIR, '_thumbs');
const OUT_JSON = path.join(ROOT, 'src', 'data', 'honors.generated.json');
const OVERRIDES_JSON = path.join(ROOT, 'src', 'data', 'honors.overrides.json');

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const PDF_EXTS = new Set(['.pdf']);
const THUMB_WIDTHS = [320, 640, 960];

const toPosix = (p) => p.split(path.sep).join('/');

const safeReadJson = async (filePath, fallback) => {
	try {
		const raw = await fs.readFile(filePath, 'utf8');
		return JSON.parse(raw);
	} catch {
		return fallback;
	}
};

const ensureDir = async (dir) => {
	await fs.mkdir(dir, { recursive: true });
};

const sha1 = (input) => crypto.createHash('sha1').update(input).digest('hex');

const extractYear = (text) => {
	if (!text) return null;
	const normalized = String(text).replace(/\s+/g, '');
	const rangeMatch = normalized.match(/(19|20)\d{2}\s*[-=~～]\s*(19|20)\d{2}/);
	if (rangeMatch) {
		const nums = rangeMatch[0].match(/\d{4}/g);
		if (!nums || nums.length < 2) return null;
		return {
			yearStart: Number(nums[0]),
			yearEnd: Number(nums[1]),
			display: `${nums[0]}-${nums[1]}`
		};
	}
	const yearMatch = normalized.match(/(19|20)\d{2}/);
	if (yearMatch) {
		const y = Number(yearMatch[0]);
		return { yearStart: y, yearEnd: y, display: String(y) };
	}
	return null;
};

const cleanText = (text) => {
	let t = String(text);
	t = t.replace(/\.[^/.]+$/, '');
	t = t.replace(/\s{2,}/g, ' ').trim();
	t = t.replace(/\s*0{0,2}\d{2,3}\s*$/g, (m) => (m.trim().length <= 3 ? '' : m));
	t = t.replace(/\s*\d{3}\s*$/g, '');
	t = t.replace(/\s+/g, ' ').trim();
	return t;
};

const cleanTitle = (name) => {
	let t = cleanText(name);
	t = t
		.replace(/(证书|奖状|证明)(全部|正面)?$/g, '')
		.replace(/(证书|奖状|证明)(全部|正面)?/g, (m) => (m.length > 6 ? m : m))
		.replace(/(全部|正面)$/g, '')
		.replace(/合照$/g, '')
		.replace(/^\d{4}[-=~～]\d{4}/g, '')
		.replace(/^\d{4}/g, '')
		.replace(/学年度/g, '')
		.replace(/[-_]+/g, ' ')
		.replace(/\s{2,}/g, ' ')
		.trim();
	return t || cleanText(name);
};

const normalizeCategory = (dirName) => {
	let t = cleanText(dirName);
	t = t.replace(/^\d{4}\s*[-=~～]\s*\d{4}/g, '');
	t = t.replace(/^\d{4}/g, '');
	t = t.replace(/学年度/g, '');
	t = t.replace(/(证书|奖状|证明)(全部|正面)?/g, '');
	t = t.replace(/\s{2,}/g, ' ').trim();
	return t || cleanText(dirName);
};

const inferLevel = (relativePosix) => {
	if (relativePosix.includes('省级')) return '省级';
	if (relativePosix.includes('校级')) return '校级';
	return '校级';
};

const inferCategory = (relativePosix) => {
	const segments = relativePosix.split('/').filter(Boolean);
	if (segments.length === 0) return '未分类';
	const root = segments[0];
	if (root.includes('省级') && segments.length >= 2) {
		return normalizeCategory(segments[1]);
	}
	if (root.includes('校级')) return '校级奖状';
	return normalizeCategory(root);
};

const inferIssuer = (level, category, overrides) => {
	if (level === '校级') return '广西财经学院';
	const map = overrides?.issuerByCategoryKeyword ?? {};
	for (const [keyword, issuer] of Object.entries(map)) {
		if (category.includes(keyword)) return String(issuer);
	}
	return '待补充';
};

const newerOrEqual = async (a, b) => {
	try {
		const [sa, sb] = await Promise.all([fs.stat(a), fs.stat(b)]);
		return sb.mtimeMs >= sa.mtimeMs;
	} catch {
		return false;
	}
};

const buildThumbs = async (inputAbsPath, relativePosixNoExt) => {
	const out = {};
	const relDir = path.posix.dirname(relativePosixNoExt);
	const base = path.posix.basename(relativePosixNoExt);
	const outDir = path.join(THUMBS_DIR, relDir);
	await ensureDir(outDir);

	let metadata;
	try {
		metadata = await sharp(inputAbsPath).metadata();
	} catch {
		metadata = null;
	}

	for (const w of THUMB_WIDTHS) {
		const outFile = `${base}.w${w}.webp`;
		const outAbsPath = path.join(outDir, outFile);
		const shouldSkip = await newerOrEqual(inputAbsPath, outAbsPath);
		if (!shouldSkip) {
			await sharp(inputAbsPath)
				.rotate()
				.resize({ width: w, withoutEnlargement: true })
				.webp({ quality: 82 })
				.toFile(outAbsPath);
		}
		out[`w${w}`] = `/全部奖状/_thumbs/${toPosix(path.posix.join(relDir, outFile))}`;
	}

	return {
		thumbs: out,
		width: metadata?.width ?? undefined,
		height: metadata?.height ?? undefined
	};
};

const walkFiles = async (rootDir) => {
	const results = [];
	const stack = [rootDir];
	while (stack.length) {
		const current = stack.pop();
		if (!current) continue;
		const entries = await fs.readdir(current, { withFileTypes: true });
		for (const entry of entries) {
			const absPath = path.join(current, entry.name);
			if (absPath.startsWith(THUMBS_DIR)) continue;
			if (entry.isDirectory()) {
				stack.push(absPath);
			} else if (entry.isFile()) {
				results.push(absPath);
			}
		}
	}
	return results;
};

const main = async () => {
	const overrides = await safeReadJson(OVERRIDES_JSON, { items: {}, issuerByCategoryKeyword: {} });
	await ensureDir(THUMBS_DIR);

	const absFiles = await walkFiles(SOURCE_DIR);
	const items = [];

	for (const absPath of absFiles) {
		const ext = path.extname(absPath).toLowerCase();
		if (!IMAGE_EXTS.has(ext) && !PDF_EXTS.has(ext)) continue;

		const sourceRel = toPosix(path.relative(SOURCE_DIR, absPath));
		const original = `/全部奖状/${sourceRel}`;
		const baseNoExt = sourceRel.replace(/\.[^/.]+$/, '');

		const level = inferLevel(sourceRel);
		const category = inferCategory(sourceRel);

		const titleRaw = path.basename(sourceRel);
		const title = cleanTitle(titleRaw);

		const timeCandidate = extractYear(sourceRel) ?? extractYear(titleRaw) ?? extractYear(category);
		const time = {
			yearStart: timeCandidate?.yearStart ?? null,
			yearEnd: timeCandidate?.yearEnd ?? null,
			display: timeCandidate?.display ?? null
		};

		const defaultIssuer = inferIssuer(level, category, overrides);
		const itemOverride = overrides?.items?.[sourceRel] ?? null;
		const issuer = (itemOverride?.issuer ?? defaultIssuer) || defaultIssuer;

		const stat = await fs.stat(absPath);

		let type = 'other';
		let thumbs = {};
		let width;
		let height;
		if (IMAGE_EXTS.has(ext)) {
			type = 'image';
			const t = await buildThumbs(absPath, baseNoExt);
			thumbs = t.thumbs;
			width = t.width;
			height = t.height;
		} else if (PDF_EXTS.has(ext)) {
			type = 'pdf';
			thumbs = { w640: '/pdf-thumb.svg' };
		}

		const item = {
			id: sha1(sourceRel).slice(0, 12),
			title: itemOverride?.title ?? title,
			level,
			category: itemOverride?.category ?? category,
			issuer,
			time: itemOverride?.time ?? time,
			type,
			original,
			thumbs,
			sizeBytes: stat.size,
			width,
			height,
			source: sourceRel
		};
		items.push(item);
	}

	const levelRank = (l) => (l === '校级' ? 0 : 1);
	const yearRank = (t) => (t?.yearEnd ?? t?.yearStart ?? -1);

	items.sort((a, b) => {
		const lr = levelRank(a.level) - levelRank(b.level);
		if (lr !== 0) return lr;
		const yr = yearRank(b.time) - yearRank(a.time);
		if (yr !== 0) return yr;
		const cr = a.category.localeCompare(b.category, 'zh-CN');
		if (cr !== 0) return cr;
		return a.title.localeCompare(b.title, 'zh-CN');
	});

	const groupsMap = new Map();
	for (const item of items) {
		const yearKey = item.time.display ?? '未知时间';
		const key = `${item.level}__${item.category}__${yearKey}`;
		const existing = groupsMap.get(key);
		if (existing) {
			existing.itemIds.push(item.id);
			continue;
		}
		groupsMap.set(key, {
			level: item.level,
			category: item.category,
			yearKey,
			yearStart: item.time.yearStart,
			yearEnd: item.time.yearEnd,
			itemIds: [item.id]
		});
	}

	const groups = Array.from(groupsMap.values()).sort((a, b) => {
		const lr = levelRank(a.level) - levelRank(b.level);
		if (lr !== 0) return lr;
		const cr = a.category.localeCompare(b.category, 'zh-CN');
		if (cr !== 0) return cr;
		const yr = (b.yearEnd ?? b.yearStart ?? -1) - (a.yearEnd ?? a.yearStart ?? -1);
		if (yr !== 0) return yr;
		return a.yearKey.localeCompare(b.yearKey, 'zh-CN');
	});

	const out = {
		generatedAt: new Date().toISOString(),
		sourceDir: '/全部奖状',
		items,
		groups
	};

	await fs.writeFile(OUT_JSON, JSON.stringify(out, null, 2), 'utf8');

	const missingIssuer = items.filter((i) => i.issuer === '待补充').length;
	const missingTime = items.filter((i) => !i.time?.display).length;
	console.log(
		`Honors synced: items=${items.length}, groups=${groups.length}, thumbsDir=/全部奖状/_thumbs, missingIssuer=${missingIssuer}, missingTime=${missingTime}`
	);
};

await main();

