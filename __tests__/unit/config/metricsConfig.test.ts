import { describe, it, expect } from 'vitest';
import { METRICS_API_KEY, METRICS_URL } from '../../../nodes/LaraTranslate/config/metricsConfig';
import { createMetricsContext } from '../../../nodes/LaraTranslate/services/metrics';

describe('metricsConfig', () => {
	it('keeps the placeholders in the source so the bake step is the only writer', () => {
		expect(METRICS_URL).toBe('__METRICS_URL__');
		expect(METRICS_API_KEY).toBe('__METRICS_API_KEY__');
	});

	it('keeps metrics off while the placeholders are unbaked', () => {
		expect(createMetricsContext('instance-abc', {}, 'execution-1')).toBeUndefined();
	});
});
