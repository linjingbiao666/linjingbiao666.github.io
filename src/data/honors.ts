export type HonorLevel = '校级' | '省级' | '国家级';

export type HonorType = 'image' | 'pdf' | 'other';

export interface HonorTime {
	yearStart: number | null;
	yearEnd: number | null;
	display: string | null;
}

export interface HonorThumbs {
	w320?: string;
	w640?: string;
	w960?: string;
}

export interface HonorItem {
	id: string;
	title: string;
	level: HonorLevel;
	category: string;
	issuer: string;
	time: HonorTime;
	type: HonorType;
	original: string;
	thumbs: HonorThumbs;
	sizeBytes?: number;
	width?: number;
	height?: number;
	source: string;
    // New detailed fields
    description?: string; // 获奖背景/详情
    criteria?: string;    // 评选标准
    ratio?: string;       // 获奖比例 (e.g., "前5%")
    highlight?: boolean;  // 是否高亮展示
}

export interface HonorGroup {
	level: HonorLevel;
	category: string;
	yearKey: string;
	yearStart: number | null;
	yearEnd: number | null;
	itemIds: string[];
}

export interface HonorsGeneratedData {
	generatedAt: string | null;
	sourceDir: string;
	items: HonorItem[];
	groups: HonorGroup[];
}

