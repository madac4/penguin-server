import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';
import { baseSpec } from './openapi.spec';

/**
 * Generates the full OpenAPI spec by merging the base spec with paths
 * extracted from JSDoc @openapi comments in route files.
 */
export function generateOpenApiSpec(): Record<string, unknown> {
  const isCompiled = __dirname.includes(path.sep + 'dist' + path.sep);
  const ext = isCompiled ? 'js' : 'ts';
  const routesGlob = path.join(__dirname, '..', 'api', 'v1', 'routes', '**', `*.${ext}`);

  return swaggerJsdoc({
    definition: baseSpec,
    apis: [routesGlob],
  });
}
