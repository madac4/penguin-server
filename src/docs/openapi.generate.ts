import { baseSpec } from './openapi.spec';

/**
 * Returns the canonical OpenAPI spec.
 *
 * The spec is kept in code instead of route JSDoc so request/response schemas
 * can reuse shared DTO components and stay aligned with validators.
 */
export function generateOpenApiSpec(): Record<string, unknown> {
  return baseSpec;
}
