declare module 'swagger-jsdoc' {
  interface SwaggerDefinition {
    openapi?: string;
    info?: Record<string, unknown>;
    servers?: unknown[];
    tags?: unknown[];
    components?: Record<string, unknown>;
    paths?: Record<string, unknown>;
    [key: string]: unknown;
  }

  interface Options {
    definition: SwaggerDefinition;
    apis: string[];
  }

  function swaggerJsdoc(options: Options): SwaggerDefinition;
  export = swaggerJsdoc;
}
