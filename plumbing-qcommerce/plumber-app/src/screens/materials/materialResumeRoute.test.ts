import { describe, expect, it } from 'vitest';
import { materialResumeRoute } from './materialResumeRoute';

describe('materialResumeRoute', () => {
  it('continues a collected-material job at After Photos rather than restarting inspection', () => {
    expect(materialResumeRoute('42')).toEqual({ name: 'AfterPhotos', params: { jobId: '42' } });
  });
});
