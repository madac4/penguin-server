export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "Penguin CMS API",
    version: "0.1.0",
    description:
      "Backend API for the Penguin CMS — a headless content management system for the jewelry 3D model platform.",
    contact: {
      name: "Penguin Dev Team",
    },
  },
  servers: [
    {
      url: "http://localhost:7777",
      description: "Local development",
    },
  ],
  tags: [
    { name: "Health", description: "Server status & uptime checks" },
    { name: "Auth", description: "Authentication & session management" },
    { name: "Users", description: "User account management" },
    {
      name: "Products",
      description: "CMS product entries (3D jewelry models)",
    },
    { name: "Categories", description: "Content taxonomy — categories" },
    {
      name: "Collections",
      description: "Content taxonomy — curated collections",
    },
    { name: "Tags", description: "Content taxonomy — flat tags" },
    { name: "Pages", description: "CMS static pages" },
    { name: "Blog", description: "CMS blog posts" },
    { name: "Media", description: "Media library — file uploads" },
    { name: "Banners", description: "Promotional banners & hero slots" },
    { name: "Menus", description: "Navigation menus & items" },
    { name: "SEO", description: "Per-page SEO metadata" },
    { name: "Forms", description: "Contact forms & submissions" },
    { name: "Redirects", description: "301/302 URL redirect rules" },
    { name: "Settings", description: "Global site configuration" },
    {
      name: "Admin",
      description: "Admin dashboard — analytics & user management",
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT access token obtained from `POST /api/v1/auth/login`",
      },
    },
    schemas: {
      ApiResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "OK" },
          data: { type: "object", nullable: true },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Something went wrong" },
          errors: {
            type: "array",
            items: { type: "string" },
            nullable: true,
          },
        },
      },
      HealthStatus: {
        type: "object",
        properties: {
          status: { type: "string", example: "ok" },
          version: { type: "string", example: "0.1.0" },
          environment: { type: "string", example: "development" },
          uptime: {
            type: "number",
            example: 123.45,
            description: "Process uptime in seconds",
          },
          timestamp: {
            type: "string",
            format: "date-time",
            example: "2026-03-02T10:00:00.000Z",
          },
        },
      },
    },
  },
  paths: {
    "/api/v1/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        description:
          "Returns the current server status, version, environment and uptime. No authentication required.",
        operationId: "getHealth",
        responses: {
          "200": {
            description: "Server is healthy",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/ApiResponse" },
                    {
                      type: "object",
                      properties: {
                        data: { $ref: "#/components/schemas/HealthStatus" },
                      },
                    },
                  ],
                },
                example: {
                  success: true,
                  message: "OK",
                  data: {
                    status: "ok",
                    version: "0.1.0",
                    environment: "development",
                    uptime: 42.7,
                    timestamp: "2026-03-02T10:00:00.000Z",
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
