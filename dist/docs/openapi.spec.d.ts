/**
 * Base OpenAPI spec: info, servers, tags, components.
 * Paths are generated from JSDoc in route files (see openapi.generate.ts).
 */
export declare const baseSpec: {
    openapi: string;
    info: {
        title: string;
        version: string;
        description: string;
        contact: {
            name: string;
        };
    };
    servers: {
        url: string;
        description: string;
    }[];
    tags: {
        name: string;
        description: string;
    }[];
    components: {
        securitySchemes: {
            BearerAuth: {
                type: string;
                scheme: string;
                bearerFormat: string;
                description: string;
            };
        };
        schemas: {
            ApiResponse: {
                type: string;
                properties: {
                    success: {
                        type: string;
                        example: boolean;
                    };
                    message: {
                        type: string;
                        example: string;
                    };
                    data: {
                        type: string;
                        nullable: boolean;
                    };
                };
            };
            ErrorResponse: {
                type: string;
                properties: {
                    success: {
                        type: string;
                        example: boolean;
                    };
                    message: {
                        type: string;
                        example: string;
                    };
                    errors: {
                        type: string;
                        items: {
                            type: string;
                        };
                        nullable: boolean;
                    };
                };
            };
            UserDto: {
                type: string;
                properties: {
                    id: {
                        type: string;
                    };
                    role: {
                        type: string;
                        enum: string[];
                    };
                    username: {
                        type: string;
                    };
                    firstName: {
                        type: string;
                    };
                    lastName: {
                        type: string;
                    };
                    email: {
                        type: string;
                        format: string;
                    };
                    createdAt: {
                        type: string;
                        format: string;
                    };
                    updatedAt: {
                        type: string;
                        format: string;
                    };
                };
            };
        };
    };
    paths: {};
};
//# sourceMappingURL=openapi.spec.d.ts.map