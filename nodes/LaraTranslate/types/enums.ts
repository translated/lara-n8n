export enum PdfTranslationExtensions {
	PDF = 'pdf',
	DOCX = 'docx',
}

export enum DocumentStatus {
	INITIALIZED = 'initialized',
	ANALYZING = 'analyzing',
	PAUSED = 'paused',
	READY = 'ready',
	TRANSLATING = 'translating',
	TRANSLATED = 'translated',
	ERROR = 'error',
}
