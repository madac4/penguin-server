"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.baseSpec = void 0;
/**
 * Base OpenAPI spec: info, servers, tags, components.
 * Paths are generated from JSDoc in route files (see openapi.generate.ts).
 */
exports.baseSpec = {
    openapi: '3.1.0',
    info: {
        title: 'Penguin CMS API',
        version: '0.1.0',
        description: 'Backend API for the Penguin CMS — a headless content management system for the jewelry 3D model platform.',
        contact: {
            name: 'Penguin Dev Team',
        },
    },
    servers: [
        {
            url: 'https://penguin-development-19486681fb5f.herokuapp.com',
            description: 'Development',
        },
        {
            url: 'http://localhost:7777',
            description: 'Local development',
        },
    ],
    tags: [
        { name: 'Auth', description: 'Authentication & session management' },
        { name: 'Users', description: 'User account management' },
        {
            name: 'Products',
            description: 'CMS product entries (3D jewelry models)',
        },
        { name: 'Categories', description: 'Content taxonomy — categories' },
        {
            name: 'Collections',
            description: 'Content taxonomy — curated collections',
        },
        { name: 'Tags', description: 'Content taxonomy — flat tags' },
        { name: 'Pages', description: 'CMS static pages' },
        { name: 'Blog', description: 'CMS blog posts' },
        { name: 'Media', description: 'Media library — file uploads' },
        { name: 'Banners', description: 'Promotional banners & hero slots' },
        { name: 'Menus', description: 'Navigation menus & items' },
        { name: 'SEO', description: 'Per-page SEO metadata' },
        { name: 'Forms', description: 'Contact forms & submissions' },
        { name: 'Redirects', description: '301/302 URL redirect rules' },
        { name: 'Settings', description: 'Global site configuration' },
        {
            name: 'Admin',
            description: 'Admin dashboard — analytics & user management',
        },
    ],
    components: {
        securitySchemes: {
            BearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'JWT access token obtained from `POST /api/v1/auth/login`',
            },
        },
        schemas: {
            ApiResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'OK' },
                    data: { type: 'object', nullable: true },
                },
            },
            ErrorResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'Something went wrong' },
                    errors: {
                        type: 'array',
                        items: { type: 'string' },
                        nullable: true,
                    },
                },
            },
            UserDto: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    role: { type: 'string', enum: ['User', 'Administrator'] },
                    username: { type: 'string' },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                },
            },
        },
    },
    paths: {},
};
//# sourceMappingURL=openapi.spec.js.map