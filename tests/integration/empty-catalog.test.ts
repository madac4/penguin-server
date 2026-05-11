import app from '@/app';
import request from 'supertest';

describe('Empty catalog responses', () => {
  it('returns an empty paginated category list when no categories exist', async () => {
    const res = await request(app).get('/api/v1/categories');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });
  });

  it('returns an empty category tree when no categories exist', async () => {
    const res = await request(app).get('/api/v1/categories/tree');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });

  it('returns an empty paginated product list when no products exist', async () => {
    const res = await request(app).get('/api/v1/products');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });
  });

  it('returns an empty subscription plan list when no plans exist', async () => {
    const res = await request(app).get('/api/v1/subscription-plans');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });
});
