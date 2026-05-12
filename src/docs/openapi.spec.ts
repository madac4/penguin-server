const translatedField = {
  type: 'object',
  required: ['en', 'ru'],
  properties: {
    en: { type: 'string' },
    ru: { type: 'string' },
  },
};

const optionalTranslatedField = {
  type: 'object',
  properties: {
    en: { type: 'string', default: '' },
    ru: { type: 'string', default: '' },
  },
};

const idParam = (name = 'id', description?: string) => ({
  in: 'path',
  name,
  required: true,
  description,
  schema: { type: 'string' },
});

const paginationParams = [
  { in: 'query', name: 'page', schema: { type: 'integer', minimum: 1, default: 1 } },
  {
    in: 'query',
    name: 'limit',
    schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
  },
];

const jsonBody = (schema: Record<string, unknown>, required = true) => ({
  required,
  content: {
    'application/json': { schema },
  },
});

const multipartBody = (schema: Record<string, unknown>) => ({
  required: true,
  content: {
    'multipart/form-data': { schema },
  },
});

const response = (schema: Record<string, unknown> | null, description = 'OK') => ({
  description,
  content: {
    'application/json': {
      schema: {
        type: 'object',
        required: ['success', 'message', 'data'],
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'OK' },
          data: schema ?? { type: 'null' },
        },
      },
    },
  },
});

const paginated = (itemRef: string) => ({
  type: 'object',
  required: ['items', 'total', 'page', 'limit', 'totalPages'],
  properties: {
    items: { type: 'array', items: { $ref: itemRef } },
    total: { type: 'integer' },
    page: { type: 'integer' },
    limit: { type: 'integer' },
    totalPages: { type: 'integer' },
  },
});

const errorResponses = {
  400: { $ref: '#/components/responses/BadRequest' },
  401: { $ref: '#/components/responses/Unauthorized' },
  403: { $ref: '#/components/responses/Forbidden' },
  404: { $ref: '#/components/responses/NotFound' },
  409: { $ref: '#/components/responses/Conflict' },
};

const bearerSecurity = [{ bearerAuth: [] }];

export const baseSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Penguin CMS API',
    version: '0.1.0',
    description:
      'Backend API for the Penguin CMS — a headless content management system for the jewelry 3D model platform.',
    contact: { name: 'Penguin Dev Team' },
  },
  servers: [
    { url: 'http://localhost:7777', description: 'Local development' },
    {
      url: 'https://penguin-development-19486681fb5f.herokuapp.com',
      description: 'Development',
    },
    {
      url: 'https://penguin-production-7d0d655a35e1.herokuapp.com',
      description: 'Production',
    },
  ],
  tags: [
    { name: 'Auth', description: 'Authentication and session management' },
    { name: 'Profile', description: 'Current user profile and account settings' },
    { name: 'Users', description: 'Admin user account management' },
    { name: 'Products', description: 'Product catalog and acquisition flow' },
    { name: 'Categories', description: 'Content taxonomy categories' },
    { name: 'Tags', description: 'Flat content tags' },
    { name: 'Property Definitions', description: 'Dynamic product property definitions' },
    { name: 'Media', description: 'Media library and file uploads' },
    { name: 'Collections', description: 'Authenticated user product collections' },
    { name: 'Acquisitions', description: 'Acquired product history and files' },
    { name: 'Subscription Plans', description: 'Lemon Squeezy-backed plan catalog' },
    { name: 'Subscriptions', description: 'Subscription checkout, billing, and webhooks' },
    { name: 'Health', description: 'Service health checks' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT access token obtained from POST /api/v1/auth/login',
      },
    },
    responses: {
      BadRequest: { description: 'Validation or business rule error' },
      Unauthorized: { description: 'Not authenticated or token is invalid' },
      Forbidden: { description: 'Authenticated user does not have access' },
      NotFound: { description: 'Resource not found' },
      Conflict: { description: 'Resource conflict' },
    },
    schemas: {
      ApiResponse: response({ type: 'object', nullable: true }).content['application/json'].schema,
      ErrorResponse: {
        type: 'object',
        required: ['success', 'message'],
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
          errors: { type: 'array', items: { type: 'string' } },
        },
      },
      TranslatedField: translatedField,
      OptionalTranslatedField: optionalTranslatedField,
      TokensDto: {
        type: 'object',
        required: ['accessToken', 'refreshToken'],
        properties: {
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
        },
      },
      UserDto: {
        type: 'object',
        required: [
          'id',
          'role',
          'username',
          'firstName',
          'lastName',
          'email',
          'isBlocked',
          'createdAt',
          'updatedAt',
        ],
        properties: {
          id: { type: 'string' },
          role: { type: 'string', enum: ['User', 'Administrator'] },
          username: { type: ['string', 'null'] },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          pendingEmail: { type: ['string', 'null'], format: 'email' },
          isBlocked: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['email', 'password', 'confirmPassword', 'firstName', 'lastName'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          confirmPassword: { type: 'string', minLength: 8 },
          firstName: { type: 'string', minLength: 1 },
          lastName: { type: 'string', minLength: 1 },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 1 },
        },
      },
      RefreshTokenRequest: {
        type: 'object',
        required: ['refreshToken'],
        properties: { refreshToken: { type: 'string', minLength: 1 } },
      },
      EmailRequest: {
        type: 'object',
        required: ['email'],
        properties: { email: { type: 'string', format: 'email' } },
      },
      ResetPasswordRequest: {
        type: 'object',
        required: ['token', 'password', 'confirmPassword'],
        properties: {
          token: { type: 'string', minLength: 1 },
          password: { type: 'string', minLength: 8 },
          confirmPassword: { type: 'string', minLength: 8 },
        },
      },
      UpdateProfileRequest: {
        type: 'object',
        properties: {
          username: { type: 'string', minLength: 3, maxLength: 30, pattern: '^[a-zA-Z0-9_-]+$' },
          firstName: { type: 'string', minLength: 1 },
          lastName: { type: 'string', minLength: 1 },
        },
      },
      ChangeEmailRequest: {
        type: 'object',
        required: ['newEmail'],
        properties: { newEmail: { type: 'string', format: 'email' } },
      },
      ChangePasswordRequest: {
        type: 'object',
        required: ['currentPassword', 'newPassword', 'confirmNewPassword'],
        properties: {
          currentPassword: { type: 'string', minLength: 8 },
          newPassword: { type: 'string', minLength: 8 },
          confirmNewPassword: { type: 'string', minLength: 8 },
        },
      },
      DeleteAccountRequest: {
        type: 'object',
        required: ['currentPassword'],
        properties: { currentPassword: { type: 'string', minLength: 8 } },
      },
      UpdateUserRequest: {
        type: 'object',
        properties: {
          firstName: { type: 'string', minLength: 1 },
          lastName: { type: 'string', minLength: 1 },
          username: {
            oneOf: [
              { type: 'string', minLength: 3, maxLength: 30, pattern: '^[a-zA-Z0-9_-]+$' },
              { type: 'null' },
            ],
          },
          role: { type: 'string', enum: ['User', 'Administrator'] },
        },
      },
      ChangeUserPasswordRequest: {
        type: 'object',
        required: ['newPassword', 'confirmNewPassword'],
        properties: {
          newPassword: { type: 'string', minLength: 8 },
          confirmNewPassword: { type: 'string', minLength: 8 },
        },
      },
      CategoryDto: {
        type: 'object',
        required: [
          'id',
          'name',
          'description',
          'slug',
          'parent',
          'image',
          'icon',
          'sortOrder',
          'isActive',
          'createdAt',
          'updatedAt',
        ],
        properties: {
          id: { type: 'string' },
          name: { $ref: '#/components/schemas/TranslatedField' },
          description: { $ref: '#/components/schemas/TranslatedField' },
          slug: { $ref: '#/components/schemas/TranslatedField' },
          parent: { type: ['string', 'null'] },
          image: { type: ['string', 'null'] },
          icon: { type: ['string', 'null'] },
          sortOrder: { type: 'integer' },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CategoryTreeDto: {
        allOf: [
          { $ref: '#/components/schemas/CategoryDto' },
          {
            type: 'object',
            required: ['children'],
            properties: {
              children: { type: 'array', items: { $ref: '#/components/schemas/CategoryTreeDto' } },
            },
          },
        ],
      },
      CategoryCreateRequest: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { $ref: '#/components/schemas/TranslatedField' },
          description: { $ref: '#/components/schemas/OptionalTranslatedField' },
          parent: { type: ['string', 'null'], default: null },
          image: { type: ['string', 'null'], default: null },
          icon: { type: ['string', 'null'], default: null },
          sortOrder: { type: 'integer', default: 0 },
          isActive: { type: 'boolean', default: true },
        },
      },
      CategoryUpdateRequest: {
        type: 'object',
        properties: {
          name: { $ref: '#/components/schemas/TranslatedField' },
          description: { $ref: '#/components/schemas/OptionalTranslatedField' },
          parent: { type: ['string', 'null'] },
          image: { type: ['string', 'null'] },
          icon: { type: ['string', 'null'] },
          sortOrder: { type: 'integer' },
          isActive: { type: 'boolean' },
        },
      },
      TagDto: {
        type: 'object',
        required: ['id', 'name', 'slug', 'isActive', 'createdAt', 'updatedAt'],
        properties: {
          id: { type: 'string' },
          name: { $ref: '#/components/schemas/TranslatedField' },
          slug: { $ref: '#/components/schemas/TranslatedField' },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      TagCreateRequest: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { $ref: '#/components/schemas/TranslatedField' },
          isActive: { type: 'boolean', default: true },
        },
      },
      TagUpdateRequest: {
        type: 'object',
        properties: {
          name: { $ref: '#/components/schemas/TranslatedField' },
          isActive: { type: 'boolean' },
        },
      },
      PropertyDefinitionDto: {
        type: 'object',
        required: [
          'id',
          'name',
          'slug',
          'categories',
          'values',
          'isActive',
          'showInListing',
          'createdAt',
          'updatedAt',
        ],
        properties: {
          id: { type: 'string' },
          name: { $ref: '#/components/schemas/TranslatedField' },
          slug: { $ref: '#/components/schemas/TranslatedField' },
          categories: { type: 'array', items: { type: 'string' } },
          values: { type: 'array', items: { type: 'string' } },
          isActive: { type: 'boolean' },
          showInListing: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      PropertyDefinitionCreateRequest: {
        type: 'object',
        required: ['name', 'categories'],
        properties: {
          name: { $ref: '#/components/schemas/TranslatedField' },
          categories: { type: 'array', minItems: 1, items: { type: 'string' } },
          values: { type: 'array', items: { type: 'string', minLength: 1 }, default: [] },
          isActive: { type: 'boolean', default: true },
          showInListing: { type: 'boolean', default: false },
        },
      },
      PropertyDefinitionUpdateRequest: {
        type: 'object',
        properties: {
          name: { $ref: '#/components/schemas/TranslatedField' },
          categories: { type: 'array', minItems: 1, items: { type: 'string' } },
          values: { type: 'array', items: { type: 'string', minLength: 1 } },
          isActive: { type: 'boolean' },
          showInListing: { type: 'boolean' },
        },
      },
      ProductPropertyInput: {
        type: 'object',
        required: ['definition'],
        properties: {
          definition: { type: 'string' },
          value: { type: 'string', default: '' },
          isActive: { type: 'boolean', default: true },
        },
      },
      ProductPropertyDto: {
        type: 'object',
        required: ['definition', 'value', 'isActive'],
        properties: {
          definition: { type: 'string' },
          value: { type: 'string' },
          isActive: { type: 'boolean' },
        },
      },
      ProductPropertyDetailDto: {
        type: 'object',
        required: ['definition', 'value', 'isActive'],
        properties: {
          definition: { $ref: '#/components/schemas/PropertyDefinitionDto' },
          value: { type: 'string' },
          isActive: { type: 'boolean' },
        },
      },
      ProductFileInput: {
        type: 'object',
        required: ['url', 'filename', 'format', 'size'],
        properties: {
          url: {
            type: 'string',
            description:
              'R2 object key/path. Existing R2 public URLs are accepted and normalized to a key before storage.',
          },
          filename: { type: 'string', minLength: 1 },
          format: { type: 'string', minLength: 1 },
          size: { type: 'integer', minimum: 0 },
        },
      },
      ProductFileDto: {
        type: 'object',
        required: ['url', 'filename', 'format', 'size'],
        properties: {
          url: {
            type: ['string', 'null'],
            format: 'uri',
            description:
              'Always null in product list/detail responses. Use the acquired product files endpoint to get signed download URLs.',
          },
          filename: { type: 'string' },
          format: { type: 'string' },
          size: { type: 'integer' },
        },
      },
      FileAccessDto: {
        type: 'object',
        required: ['locked', 'reason'],
        properties: {
          locked: { type: 'boolean' },
          reason: {
            type: ['string', 'null'],
            enum: ['unauthenticated', 'subscription_required', 'quota_exceeded', null],
          },
        },
      },
      ProductDto: {
        type: 'object',
        required: [
          'id',
          'name',
          'description',
          'slug',
          'thumbnail',
          'images',
          'files',
          'category',
          'tags',
          'isFree',
          'viewCount',
          'likeCount',
          'properties',
          'listingProperties',
          'isActive',
          'createdAt',
          'updatedAt',
        ],
        properties: {
          id: { type: 'string' },
          name: { $ref: '#/components/schemas/TranslatedField' },
          description: { $ref: '#/components/schemas/TranslatedField' },
          slug: { $ref: '#/components/schemas/TranslatedField' },
          thumbnail: { type: 'string' },
          images: { type: 'array', items: { type: 'string' } },
          files: { type: 'array', items: { $ref: '#/components/schemas/ProductFileDto' } },
          category: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          isFree: { type: 'boolean' },
          viewCount: { type: 'integer' },
          likeCount: { type: 'integer' },
          properties: { type: 'array', items: { $ref: '#/components/schemas/ProductPropertyDto' } },
          listingProperties: {
            type: 'array',
            items: { $ref: '#/components/schemas/ProductPropertyDetailDto' },
          },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      ProductDetailDto: {
        allOf: [
          { $ref: '#/components/schemas/ProductDto' },
          {
            type: 'object',
            required: ['category', 'tags', 'properties', 'fileAccess'],
            properties: {
              category: {
                oneOf: [{ $ref: '#/components/schemas/CategoryDto' }, { type: 'null' }],
              },
              tags: { type: 'array', items: { $ref: '#/components/schemas/TagDto' } },
              properties: {
                type: 'array',
                items: { $ref: '#/components/schemas/ProductPropertyDetailDto' },
              },
              fileAccess: { $ref: '#/components/schemas/FileAccessDto' },
            },
          },
        ],
      },
      ProductCreateRequest: {
        type: 'object',
        required: ['name', 'category'],
        properties: {
          name: { $ref: '#/components/schemas/TranslatedField' },
          description: { $ref: '#/components/schemas/OptionalTranslatedField' },
          thumbnail: { type: 'string', default: '' },
          images: { type: 'array', items: { type: 'string' }, default: [] },
          files: {
            type: 'array',
            items: { $ref: '#/components/schemas/ProductFileInput' },
            default: [],
          },
          category: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' }, default: [] },
          isFree: { type: 'boolean', default: false },
          properties: {
            type: 'array',
            items: { $ref: '#/components/schemas/ProductPropertyInput' },
            default: [],
          },
          isActive: { type: 'boolean', default: true },
        },
      },
      ProductUpdateRequest: {
        type: 'object',
        properties: {
          name: { $ref: '#/components/schemas/TranslatedField' },
          description: { $ref: '#/components/schemas/OptionalTranslatedField' },
          thumbnail: { type: 'string' },
          images: { type: 'array', items: { type: 'string' } },
          files: { type: 'array', items: { $ref: '#/components/schemas/ProductFileInput' } },
          category: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          isFree: { type: 'boolean' },
          properties: {
            type: 'array',
            items: { $ref: '#/components/schemas/ProductPropertyInput' },
          },
          isActive: { type: 'boolean' },
        },
      },
      ProductFiltersDto: {
        type: 'object',
        required: ['formats', 'tags', 'properties'],
        properties: {
          formats: { type: 'array', items: { type: 'string' } },
          tags: { type: 'array', items: { $ref: '#/components/schemas/TagDto' } },
          properties: {
            type: 'array',
            items: {
              type: 'object',
              required: ['definition', 'values'],
              properties: {
                definition: { $ref: '#/components/schemas/PropertyDefinitionDto' },
                values: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
      },
      MediaDto: {
        type: 'object',
        required: [
          'id',
          'filename',
          'url',
          'mimeType',
          'size',
          'type',
          'folder',
          'uploadedBy',
          'alt',
          'createdAt',
          'updatedAt',
        ],
        properties: {
          id: { type: 'string' },
          filename: { type: 'string' },
          url: { type: 'string', format: 'uri' },
          mimeType: { type: 'string' },
          size: { type: 'integer' },
          type: { type: 'string', enum: ['document', 'image', 'model'] },
          folder: {
            type: 'string',
            enum: ['subscriptions', 'categories', 'products', 'general', 'models', 'users', 'all'],
          },
          uploadedBy: { type: 'string' },
          alt: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      MediaUpdateRequest: {
        type: 'object',
        properties: {
          alt: { type: 'string' },
          filename: { type: 'string' },
        },
      },
      BatchDeleteMediaRequest: {
        type: 'object',
        required: ['ids'],
        properties: { ids: { type: 'array', minItems: 1, items: { type: 'string' } } },
      },
      CollectionItemDto: {
        type: 'object',
        required: ['productId', 'enrolledAt'],
        properties: {
          productId: { type: 'string' },
          enrolledAt: { type: 'string', format: 'date-time' },
        },
      },
      CollectionDto: {
        type: 'object',
        required: ['id', 'userId', 'name', 'items', 'itemCount', 'createdAt', 'updatedAt'],
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          name: { type: 'string' },
          items: { type: 'array', items: { $ref: '#/components/schemas/CollectionItemDto' } },
          itemCount: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CollectionSummaryDto: {
        type: 'object',
        required: ['id', 'userId', 'name', 'itemCount', 'createdAt', 'updatedAt'],
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          name: { type: 'string' },
          itemCount: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CollectionWithProductsDto: {
        type: 'object',
        required: ['id', 'userId', 'name', 'items', 'itemCount', 'createdAt', 'updatedAt'],
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          name: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              required: ['product', 'enrolledAt', 'isDownloaded'],
              properties: {
                product: { $ref: '#/components/schemas/ProductDto' },
                enrolledAt: { type: 'string', format: 'date-time' },
                isDownloaded: { type: 'boolean' },
              },
            },
          },
          itemCount: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CollectionNameRequest: {
        type: 'object',
        required: ['name'],
        properties: { name: { type: 'string', minLength: 1, maxLength: 100 } },
      },
      DownloadedProductDto: {
        type: 'object',
        required: [
          'id',
          'productId',
          'product',
          'collectionId',
          'acquisitionSource',
          'subscriptionId',
          'subscriptionPlanId',
          'quotaConsumed',
          'acquiredAt',
        ],
        properties: {
          id: { type: 'string' },
          productId: { type: 'string' },
          product: { $ref: '#/components/schemas/ProductDto' },
          collectionId: { type: ['string', 'null'] },
          acquisitionSource: { type: 'string' },
          subscriptionId: { type: ['string', 'null'] },
          subscriptionPlanId: { type: ['string', 'null'] },
          quotaConsumed: { type: 'boolean' },
          acquiredAt: { type: 'string', format: 'date-time' },
        },
      },
      ProductFilesDto: {
        type: 'object',
        required: ['files'],
        properties: {
          files: {
            type: 'array',
            items: {
              type: 'object',
              required: ['url', 'filename', 'format', 'size', 'expiresIn'],
              properties: {
                url: {
                  type: 'string',
                  format: 'uri',
                  description: 'Short-lived signed R2 download URL.',
                },
                filename: { type: 'string' },
                format: { type: 'string' },
                size: { type: 'integer' },
                expiresIn: { type: 'integer', example: 60 },
              },
            },
          },
        },
      },
      AcquireProductRequest: {
        type: 'object',
        properties: { collectionId: { type: 'string' } },
      },
      AcquireProductResponse: {
        type: 'object',
        required: ['collectionId'],
        properties: { collectionId: { type: 'string' } },
      },
      SubscriptionPlanDto: {
        type: 'object',
        required: [
          'id',
          'lsVariantId',
          'name',
          'description',
          'price',
          'interval',
          'downloadsPerPeriod',
          'imageUrl',
          'isActive',
          'lsEditUrl',
          'createdAt',
        ],
        properties: {
          id: { type: 'string' },
          lsVariantId: { type: 'string' },
          name: { type: 'string' },
          description: { type: ['string', 'null'] },
          price: { type: 'number', description: 'Price in dollars from Lemon Squeezy' },
          interval: { type: ['string', 'null'], enum: ['month', 'year', null] },
          downloadsPerPeriod: { type: 'integer' },
          imageUrl: { type: 'string' },
          isActive: { type: 'boolean' },
          lsEditUrl: { type: 'string', format: 'uri' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      SubscriptionPlanCreateRequest: {
        type: 'object',
        required: ['lsVariantId', 'downloadsPerPeriod'],
        properties: {
          lsVariantId: { type: 'string' },
          downloadsPerPeriod: { type: 'integer', minimum: 1 },
          imageUrl: { type: 'string' },
        },
      },
      SubscriptionPlanUpdateRequest: {
        type: 'object',
        properties: {
          lsVariantId: { type: 'string' },
          downloadsPerPeriod: { type: 'integer', minimum: 1 },
          imageUrl: { type: 'string' },
          isActive: { type: 'boolean' },
        },
      },
      SubscriptionDto: {
        type: 'object',
        required: [
          'id',
          'userId',
          'plan',
          'lsSubscriptionId',
          'status',
          'downloadsUsed',
          'downloadsRemaining',
          'renewsAt',
          'cancelledAt',
          'createdAt',
        ],
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          plan: { $ref: '#/components/schemas/SubscriptionPlanDto' },
          lsSubscriptionId: { type: 'string' },
          status: { type: 'string', enum: ['active', 'cancelled', 'expired', 'past_due'] },
          downloadsUsed: { type: 'integer' },
          downloadsRemaining: { type: 'integer' },
          renewsAt: { type: ['string', 'null'], format: 'date-time' },
          cancelledAt: { type: ['string', 'null'], format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      BillingHistoryDto: {
        type: 'object',
        required: [
          'id',
          'userId',
          'subscriptionId',
          'lsSubscriptionId',
          'lsPaymentId',
          'status',
          'total',
          'currency',
          'receiptUrl',
          'paidAt',
          'createdAt',
        ],
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          subscriptionId: { type: ['string', 'null'] },
          lsSubscriptionId: { type: 'string' },
          lsPaymentId: { type: 'string' },
          status: { type: 'string', enum: ['paid', 'failed'] },
          total: { type: ['integer', 'null'] },
          currency: { type: ['string', 'null'] },
          receiptUrl: { type: ['string', 'null'], format: 'uri' },
          paidAt: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      CheckoutRequest: {
        type: 'object',
        required: ['planId'],
        properties: { planId: { type: 'string' } },
      },
      CheckoutResponse: {
        type: 'object',
        required: ['checkoutUrl'],
        properties: { checkoutUrl: { type: 'string', format: 'uri' } },
      },
      HealthDto: {
        type: 'object',
        required: ['status', 'version', 'environment', 'uptime', 'timestamp'],
        properties: {
          status: { type: 'string', enum: ['ok'] },
          version: { type: 'string' },
          environment: { type: 'string' },
          uptime: { type: 'number' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    '/api/v1/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        operationId: 'healthCheck',
        responses: { 200: response({ $ref: '#/components/schemas/HealthDto' }, 'Service health') },
      },
    },
    '/api/v1/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        operationId: 'register',
        requestBody: jsonBody({ $ref: '#/components/schemas/RegisterRequest' }),
        responses: {
          201: response(null, 'Registration successful'),
          400: errorResponses[400],
          409: errorResponses[409],
        },
      },
    },
    '/api/v1/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        operationId: 'login',
        requestBody: jsonBody({ $ref: '#/components/schemas/LoginRequest' }),
        responses: {
          200: response({ $ref: '#/components/schemas/TokensDto' }, 'Login successful'),
          401: errorResponses[401],
          403: errorResponses[403],
        },
      },
    },
    '/api/v1/auth/refresh-token': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh access token',
        operationId: 'refreshToken',
        requestBody: jsonBody({ $ref: '#/components/schemas/RefreshTokenRequest' }),
        responses: {
          200: response({ $ref: '#/components/schemas/TokensDto' }, 'Tokens refreshed'),
          401: errorResponses[401],
        },
      },
    },
    '/api/v1/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout',
        operationId: 'logout',
        requestBody: jsonBody({ $ref: '#/components/schemas/RefreshTokenRequest' }),
        responses: { 200: response(null, 'Logged out successfully'), 401: errorResponses[401] },
      },
    },
    '/api/v1/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Forgot password',
        operationId: 'forgotPassword',
        requestBody: jsonBody({ $ref: '#/components/schemas/EmailRequest' }),
        responses: {
          200: response(null, 'Password reset email accepted'),
          400: errorResponses[400],
        },
      },
    },
    '/api/v1/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Reset password',
        operationId: 'resetPassword',
        requestBody: jsonBody({ $ref: '#/components/schemas/ResetPasswordRequest' }),
        responses: { 200: response(null, 'Password reset successfully'), 400: errorResponses[400] },
      },
    },
    '/api/v1/auth/confirm-email': {
      get: {
        tags: ['Auth'],
        summary: 'Confirm email address',
        operationId: 'confirmEmail',
        parameters: [{ in: 'query', name: 'token', required: true, schema: { type: 'string' } }],
        responses: { 200: response(null, 'Email confirmed'), 400: errorResponses[400] },
      },
    },
    '/api/v1/auth/resend-confirmation': {
      post: {
        tags: ['Auth'],
        summary: 'Resend confirmation email',
        operationId: 'resendConfirmationEmail',
        requestBody: jsonBody({ $ref: '#/components/schemas/EmailRequest' }),
        responses: {
          200: response(null, 'Confirmation email sent'),
          400: errorResponses[400],
          404: errorResponses[404],
        },
      },
    },
    '/api/v1/profile': {
      get: {
        tags: ['Profile'],
        summary: 'Get current user profile',
        operationId: 'getProfile',
        security: bearerSecurity,
        responses: {
          200: response({ $ref: '#/components/schemas/UserDto' }, 'User profile'),
          401: errorResponses[401],
        },
      },
      patch: {
        tags: ['Profile'],
        summary: 'Update profile',
        operationId: 'updateProfile',
        security: bearerSecurity,
        requestBody: jsonBody({ $ref: '#/components/schemas/UpdateProfileRequest' }),
        responses: {
          200: response({ $ref: '#/components/schemas/UserDto' }, 'Profile updated'),
          401: errorResponses[401],
          409: errorResponses[409],
        },
      },
    },
    '/api/v1/profile/change-email': {
      post: {
        tags: ['Profile'],
        summary: 'Request email change',
        operationId: 'changeEmail',
        security: bearerSecurity,
        requestBody: jsonBody({ $ref: '#/components/schemas/ChangeEmailRequest' }),
        responses: {
          200: response(null, 'Email change confirmation sent'),
          400: errorResponses[400],
          401: errorResponses[401],
          409: errorResponses[409],
        },
      },
    },
    '/api/v1/profile/confirm-email-change': {
      get: {
        tags: ['Profile'],
        summary: 'Confirm email change',
        operationId: 'confirmEmailChange',
        security: bearerSecurity,
        parameters: [{ in: 'query', name: 'token', required: true, schema: { type: 'string' } }],
        responses: {
          200: response(null, 'Email address updated'),
          400: errorResponses[400],
          401: errorResponses[401],
          409: errorResponses[409],
        },
      },
    },
    '/api/v1/profile/change-password': {
      post: {
        tags: ['Profile'],
        summary: 'Change password',
        operationId: 'changePassword',
        security: bearerSecurity,
        requestBody: jsonBody({ $ref: '#/components/schemas/ChangePasswordRequest' }),
        responses: { 200: response(null, 'Password changed'), 401: errorResponses[401] },
      },
    },
    '/api/v1/profile/delete-account': {
      delete: {
        tags: ['Profile'],
        summary: 'Delete account',
        operationId: 'deleteAccount',
        security: bearerSecurity,
        requestBody: jsonBody({ $ref: '#/components/schemas/DeleteAccountRequest' }),
        responses: { 200: response(null, 'Account deleted'), 401: errorResponses[401] },
      },
    },
    '/api/v1/users': {
      get: {
        tags: ['Users'],
        summary: 'List users',
        operationId: 'listUsers',
        security: bearerSecurity,
        parameters: [
          ...paginationParams,
          { in: 'query', name: 'search', schema: { type: 'string' } },
          {
            in: 'query',
            name: 'role',
            schema: { type: 'string', enum: ['Administrator', 'User'] },
          },
          { in: 'query', name: 'isBlocked', schema: { type: 'boolean' } },
        ],
        responses: {
          200: response(paginated('#/components/schemas/UserDto'), 'Paginated users'),
          401: errorResponses[401],
          403: errorResponses[403],
        },
      },
    },
    '/api/v1/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Get user details',
        operationId: 'getUserById',
        security: bearerSecurity,
        parameters: [idParam()],
        responses: {
          200: response({ $ref: '#/components/schemas/UserDto' }, 'User details'),
          404: errorResponses[404],
        },
      },
      patch: {
        tags: ['Users'],
        summary: 'Update user',
        operationId: 'updateUser',
        security: bearerSecurity,
        parameters: [idParam()],
        requestBody: jsonBody({ $ref: '#/components/schemas/UpdateUserRequest' }),
        responses: {
          200: response({ $ref: '#/components/schemas/UserDto' }, 'User updated'),
          404: errorResponses[404],
          409: errorResponses[409],
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Delete user',
        operationId: 'deleteUser',
        security: bearerSecurity,
        parameters: [idParam()],
        responses: { 200: response(null, 'User deleted'), 404: errorResponses[404] },
      },
    },
    '/api/v1/users/{id}/password': {
      patch: {
        tags: ['Users'],
        summary: 'Change user password',
        operationId: 'changeUserPassword',
        security: bearerSecurity,
        parameters: [idParam()],
        requestBody: jsonBody({ $ref: '#/components/schemas/ChangeUserPasswordRequest' }),
        responses: { 200: response(null, 'User password changed'), 404: errorResponses[404] },
      },
    },
    '/api/v1/users/{id}/block': {
      patch: {
        tags: ['Users'],
        summary: 'Toggle block status',
        operationId: 'toggleBlockUser',
        security: bearerSecurity,
        parameters: [idParam()],
        responses: {
          200: response({ $ref: '#/components/schemas/UserDto' }, 'User block status toggled'),
          404: errorResponses[404],
        },
      },
    },
    '/api/v1/categories': {
      get: {
        tags: ['Categories'],
        summary: 'Paginated list of categories',
        operationId: 'listCategories',
        parameters: [
          ...paginationParams,
          { in: 'query', name: 'search', schema: { type: 'string' } },
          { in: 'query', name: 'isActive', schema: { type: 'boolean' } },
          {
            in: 'query',
            name: 'parent',
            description: "Category ID or 'null' for root categories",
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: response(paginated('#/components/schemas/CategoryDto'), 'Paginated categories'),
        },
      },
      post: {
        tags: ['Categories'],
        summary: 'Create a category',
        operationId: 'createCategory',
        security: bearerSecurity,
        requestBody: jsonBody({ $ref: '#/components/schemas/CategoryCreateRequest' }),
        responses: {
          201: response({ $ref: '#/components/schemas/CategoryDto' }, 'Category created'),
          ...errorResponses,
        },
      },
    },
    '/api/v1/categories/tree': {
      get: {
        tags: ['Categories'],
        summary: 'Get category tree',
        operationId: 'getCategoryTree',
        responses: {
          200: response(
            { type: 'array', items: { $ref: '#/components/schemas/CategoryTreeDto' } },
            'Category tree',
          ),
        },
      },
    },
    '/api/v1/categories/{id}': {
      get: {
        tags: ['Categories'],
        summary: 'Get category by ID',
        operationId: 'getCategoryById',
        security: bearerSecurity,
        parameters: [idParam()],
        responses: {
          200: response({ $ref: '#/components/schemas/CategoryDto' }, 'Category details'),
          401: errorResponses[401],
          403: errorResponses[403],
          404: errorResponses[404],
        },
      },
      put: {
        tags: ['Categories'],
        summary: 'Update a category',
        operationId: 'updateCategory',
        security: bearerSecurity,
        parameters: [idParam()],
        requestBody: jsonBody({ $ref: '#/components/schemas/CategoryUpdateRequest' }),
        responses: {
          200: response({ $ref: '#/components/schemas/CategoryDto' }, 'Category updated'),
          ...errorResponses,
        },
      },
      delete: {
        tags: ['Categories'],
        summary: 'Delete a category',
        operationId: 'deleteCategory',
        security: bearerSecurity,
        parameters: [idParam()],
        responses: { 200: response(null, 'Category deleted'), ...errorResponses },
      },
    },
    '/api/v1/categories/{id}/sort-order': {
      patch: {
        tags: ['Categories'],
        summary: 'Update category sort order',
        operationId: 'updateCategorySortOrder',
        security: bearerSecurity,
        parameters: [idParam()],
        requestBody: jsonBody({
          type: 'object',
          required: ['sortOrder'],
          properties: { sortOrder: { type: 'integer' } },
        }),
        responses: {
          200: response({ $ref: '#/components/schemas/CategoryDto' }, 'Sort order updated'),
          ...errorResponses,
        },
      },
    },
    '/api/v1/tags': {
      get: {
        tags: ['Tags'],
        summary: 'Paginated list of tags',
        operationId: 'listTags',
        parameters: [
          ...paginationParams,
          { in: 'query', name: 'search', schema: { type: 'string' } },
          { in: 'query', name: 'isActive', schema: { type: 'boolean' } },
        ],
        responses: { 200: response(paginated('#/components/schemas/TagDto'), 'Paginated tags') },
      },
      post: {
        tags: ['Tags'],
        summary: 'Create a tag',
        operationId: 'createTag',
        security: bearerSecurity,
        requestBody: jsonBody({ $ref: '#/components/schemas/TagCreateRequest' }),
        responses: {
          201: response({ $ref: '#/components/schemas/TagDto' }, 'Tag created'),
          ...errorResponses,
        },
      },
    },
    '/api/v1/tags/{id}': {
      get: {
        tags: ['Tags'],
        summary: 'Get tag by ID',
        operationId: 'getTagById',
        parameters: [idParam()],
        responses: {
          200: response({ $ref: '#/components/schemas/TagDto' }, 'Tag details'),
          404: errorResponses[404],
        },
      },
      put: {
        tags: ['Tags'],
        summary: 'Update a tag',
        operationId: 'updateTag',
        security: bearerSecurity,
        parameters: [idParam()],
        requestBody: jsonBody({ $ref: '#/components/schemas/TagUpdateRequest' }),
        responses: {
          200: response({ $ref: '#/components/schemas/TagDto' }, 'Tag updated'),
          ...errorResponses,
        },
      },
      delete: {
        tags: ['Tags'],
        summary: 'Delete a tag',
        operationId: 'deleteTag',
        security: bearerSecurity,
        parameters: [idParam()],
        responses: { 200: response(null, 'Tag deleted'), ...errorResponses },
      },
    },
    '/api/v1/property-definitions': {
      get: {
        tags: ['Property Definitions'],
        summary: 'Paginated list of property definitions',
        operationId: 'listPropertyDefinitions',
        parameters: [
          ...paginationParams,
          { in: 'query', name: 'search', schema: { type: 'string' } },
          { in: 'query', name: 'isActive', schema: { type: 'boolean' } },
          { in: 'query', name: 'category', schema: { type: 'string' } },
        ],
        responses: {
          200: response(
            paginated('#/components/schemas/PropertyDefinitionDto'),
            'Paginated property definitions',
          ),
        },
      },
      post: {
        tags: ['Property Definitions'],
        summary: 'Create a property definition',
        operationId: 'createPropertyDefinition',
        security: bearerSecurity,
        requestBody: jsonBody({ $ref: '#/components/schemas/PropertyDefinitionCreateRequest' }),
        responses: {
          201: response(
            { $ref: '#/components/schemas/PropertyDefinitionDto' },
            'Property definition created',
          ),
          ...errorResponses,
        },
      },
    },
    '/api/v1/property-definitions/{id}': {
      get: {
        tags: ['Property Definitions'],
        summary: 'Get property definition by ID',
        operationId: 'getPropertyDefinitionById',
        parameters: [idParam()],
        responses: {
          200: response(
            { $ref: '#/components/schemas/PropertyDefinitionDto' },
            'Property definition details',
          ),
          404: errorResponses[404],
        },
      },
      put: {
        tags: ['Property Definitions'],
        summary: 'Update a property definition',
        operationId: 'updatePropertyDefinition',
        security: bearerSecurity,
        parameters: [idParam()],
        requestBody: jsonBody({ $ref: '#/components/schemas/PropertyDefinitionUpdateRequest' }),
        responses: {
          200: response(
            { $ref: '#/components/schemas/PropertyDefinitionDto' },
            'Property definition updated',
          ),
          ...errorResponses,
        },
      },
      delete: {
        tags: ['Property Definitions'],
        summary: 'Delete a property definition',
        operationId: 'deletePropertyDefinition',
        security: bearerSecurity,
        parameters: [idParam()],
        responses: { 200: response(null, 'Property definition deleted'), ...errorResponses },
      },
    },
    '/api/v1/products': {
      get: {
        tags: ['Products'],
        summary: 'Paginated list of products',
        operationId: 'listProducts',
        parameters: [
          ...paginationParams,
          { in: 'query', name: 'search', schema: { type: 'string' } },
          { in: 'query', name: 'category', schema: { type: 'string' } },
          {
            in: 'query',
            name: 'tags',
            description: 'Comma-separated tag IDs',
            schema: { type: 'string' },
          },
          { in: 'query', name: 'isActive', schema: { type: 'boolean' } },
          {
            in: 'query',
            name: 'sortBy',
            schema: { type: 'string', enum: ['newest', 'popular'], default: 'newest' },
          },
          {
            in: 'query',
            name: 'formats',
            description: 'Comma-separated file formats',
            schema: { type: 'string' },
          },
          {
            in: 'query',
            name: 'properties',
            description: 'Comma-separated definitionId:value pairs',
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: response(paginated('#/components/schemas/ProductDto'), 'Paginated products'),
        },
      },
      post: {
        tags: ['Products'],
        summary: 'Create a product',
        operationId: 'createProduct',
        security: bearerSecurity,
        requestBody: jsonBody({ $ref: '#/components/schemas/ProductCreateRequest' }),
        responses: {
          201: response({ $ref: '#/components/schemas/ProductDto' }, 'Product created'),
          ...errorResponses,
        },
      },
    },
    '/api/v1/products/filters': {
      get: {
        tags: ['Products'],
        summary: 'Available filters for product list',
        operationId: 'getProductFilters',
        parameters: [{ in: 'query', name: 'category', schema: { type: 'string' } }],
        responses: {
          200: response({ $ref: '#/components/schemas/ProductFiltersDto' }, 'Available filters'),
        },
      },
    },
    '/api/v1/products/{id}': {
      get: {
        tags: ['Products'],
        summary: 'Get product by ID',
        operationId: 'getProductById',
        parameters: [idParam()],
        responses: {
          200: response({ $ref: '#/components/schemas/ProductDetailDto' }, 'Product details'),
          404: errorResponses[404],
        },
      },
      put: {
        tags: ['Products'],
        summary: 'Update a product',
        operationId: 'updateProduct',
        security: bearerSecurity,
        parameters: [idParam()],
        requestBody: jsonBody({ $ref: '#/components/schemas/ProductUpdateRequest' }),
        responses: {
          200: response({ $ref: '#/components/schemas/ProductDto' }, 'Product updated'),
          ...errorResponses,
        },
      },
      delete: {
        tags: ['Products'],
        summary: 'Delete a product',
        operationId: 'deleteProduct',
        security: bearerSecurity,
        parameters: [idParam()],
        responses: { 200: response(null, 'Product deleted'), ...errorResponses },
      },
    },
    '/api/v1/products/{id}/acquire': {
      post: {
        tags: ['Products'],
        summary: 'Acquire a product',
        operationId: 'acquireProduct',
        security: bearerSecurity,
        parameters: [idParam()],
        requestBody: jsonBody({ $ref: '#/components/schemas/AcquireProductRequest' }, false),
        responses: {
          201: response(
            { $ref: '#/components/schemas/AcquireProductResponse' },
            'Product acquired',
          ),
          403: errorResponses[403],
          404: errorResponses[404],
          409: errorResponses[409],
        },
      },
    },
    '/api/v1/media': {
      get: {
        tags: ['Media'],
        summary: 'List media files',
        operationId: 'listMedia',
        security: bearerSecurity,
        parameters: [
          ...paginationParams,
          { in: 'query', name: 'search', schema: { type: 'string' } },
          {
            in: 'query',
            name: 'folder',
            schema: {
              type: 'string',
              enum: [
                'subscriptions',
                'categories',
                'products',
                'general',
                'models',
                'users',
                'all',
              ],
              default: 'all',
            },
          },
          {
            in: 'query',
            name: 'type',
            schema: { type: 'string', enum: ['document', 'image', 'model'] },
          },
          { in: 'query', name: 'dateFrom', schema: { type: 'string', format: 'date-time' } },
          { in: 'query', name: 'dateTo', schema: { type: 'string', format: 'date-time' } },
        ],
        responses: {
          200: response(paginated('#/components/schemas/MediaDto'), 'Paginated media'),
          401: errorResponses[401],
          403: errorResponses[403],
        },
      },
    },
    '/api/v1/media/{id}': {
      get: {
        tags: ['Media'],
        summary: 'Get media by ID',
        operationId: 'getMediaById',
        security: bearerSecurity,
        parameters: [idParam()],
        responses: {
          200: response({ $ref: '#/components/schemas/MediaDto' }, 'Media details'),
          404: errorResponses[404],
        },
      },
      put: {
        tags: ['Media'],
        summary: 'Update media metadata',
        operationId: 'updateMedia',
        security: bearerSecurity,
        parameters: [idParam()],
        requestBody: jsonBody({ $ref: '#/components/schemas/MediaUpdateRequest' }),
        responses: {
          200: response({ $ref: '#/components/schemas/MediaDto' }, 'Media updated'),
          404: errorResponses[404],
        },
      },
      delete: {
        tags: ['Media'],
        summary: 'Delete a media file',
        operationId: 'deleteMedia',
        security: bearerSecurity,
        parameters: [idParam()],
        responses: { 200: response(null, 'File deleted'), 404: errorResponses[404] },
      },
    },
    '/api/v1/media/upload': {
      post: {
        tags: ['Media'],
        summary: 'Upload a single file',
        operationId: 'uploadMedia',
        security: bearerSecurity,
        requestBody: multipartBody({
          type: 'object',
          required: ['file', 'folder'],
          properties: {
            file: { type: 'string', format: 'binary' },
            folder: {
              type: 'string',
              enum: [
                'subscriptions',
                'categories',
                'products',
                'general',
                'models',
                'users',
                'all',
              ],
            },
            alt: { type: 'string', default: '' },
          },
        }),
        responses: {
          201: response({ $ref: '#/components/schemas/MediaDto' }, 'File uploaded'),
          ...errorResponses,
        },
      },
    },
    '/api/v1/media/upload/batch': {
      post: {
        tags: ['Media'],
        summary: 'Upload multiple files',
        operationId: 'uploadMediaBatch',
        security: bearerSecurity,
        requestBody: multipartBody({
          type: 'object',
          required: ['files', 'folder'],
          properties: {
            files: { type: 'array', items: { type: 'string', format: 'binary' } },
            folder: {
              type: 'string',
              enum: [
                'subscriptions',
                'categories',
                'products',
                'general',
                'models',
                'users',
                'all',
              ],
            },
          },
        }),
        responses: {
          201: response(
            { type: 'array', items: { $ref: '#/components/schemas/MediaDto' } },
            'Files uploaded',
          ),
          ...errorResponses,
        },
      },
    },
    '/api/v1/media/delete/batch': {
      post: {
        tags: ['Media'],
        summary: 'Batch delete media files',
        operationId: 'batchDeleteMedia',
        security: bearerSecurity,
        requestBody: jsonBody({ $ref: '#/components/schemas/BatchDeleteMediaRequest' }),
        responses: {
          200: response(
            {
              type: 'object',
              required: ['deleted'],
              properties: { deleted: { type: 'integer' } },
            },
            'Files deleted',
          ),
        },
      },
    },
    '/api/v1/collections': {
      get: {
        tags: ['Collections'],
        summary: 'List user collections',
        operationId: 'listCollections',
        security: bearerSecurity,
        parameters: paginationParams,
        responses: {
          200: response(
            paginated('#/components/schemas/CollectionSummaryDto'),
            'Paginated collections',
          ),
          401: errorResponses[401],
        },
      },
      post: {
        tags: ['Collections'],
        summary: 'Create a collection',
        operationId: 'createCollection',
        security: bearerSecurity,
        requestBody: jsonBody({ $ref: '#/components/schemas/CollectionNameRequest' }),
        responses: {
          201: response({ $ref: '#/components/schemas/CollectionDto' }, 'Collection created'),
          409: errorResponses[409],
        },
      },
    },
    '/api/v1/collections/{id}': {
      get: {
        tags: ['Collections'],
        summary: 'Get a collection with products',
        operationId: 'getCollectionById',
        security: bearerSecurity,
        parameters: [idParam()],
        responses: {
          200: response(
            { $ref: '#/components/schemas/CollectionWithProductsDto' },
            'Collection details',
          ),
          404: errorResponses[404],
        },
      },
      patch: {
        tags: ['Collections'],
        summary: 'Rename a collection',
        operationId: 'renameCollection',
        security: bearerSecurity,
        parameters: [idParam()],
        requestBody: jsonBody({ $ref: '#/components/schemas/CollectionNameRequest' }),
        responses: {
          200: response({ $ref: '#/components/schemas/CollectionDto' }, 'Collection renamed'),
          404: errorResponses[404],
          409: errorResponses[409],
        },
      },
      delete: {
        tags: ['Collections'],
        summary: 'Delete a collection',
        operationId: 'deleteCollection',
        security: bearerSecurity,
        parameters: [idParam()],
        responses: { 200: response(null, 'Collection deleted'), 404: errorResponses[404] },
      },
    },
    '/api/v1/collections/{id}/items/{productId}': {
      post: {
        tags: ['Collections'],
        summary: 'Add an acquired product to a collection',
        operationId: 'addCollectionItem',
        security: bearerSecurity,
        parameters: [idParam(), idParam('productId')],
        responses: {
          201: response(
            { $ref: '#/components/schemas/CollectionDto' },
            'Product added to collection',
          ),
          403: errorResponses[403],
          404: errorResponses[404],
          409: errorResponses[409],
        },
      },
      delete: {
        tags: ['Collections'],
        summary: 'Remove a product from a collection',
        operationId: 'removeCollectionItem',
        security: bearerSecurity,
        parameters: [idParam(), idParam('productId')],
        responses: {
          200: response(
            { $ref: '#/components/schemas/CollectionDto' },
            'Product removed from collection',
          ),
          404: errorResponses[404],
        },
      },
    },
    '/api/v1/acquisitions': {
      get: {
        tags: ['Acquisitions'],
        summary: "List current user's acquired products",
        operationId: 'listAcquisitions',
        security: bearerSecurity,
        parameters: paginationParams,
        responses: {
          200: response(
            paginated('#/components/schemas/DownloadedProductDto'),
            'Paginated acquisition history',
          ),
          401: errorResponses[401],
        },
      },
    },
    '/api/v1/acquisitions/{productId}/files': {
      get: {
        tags: ['Acquisitions'],
        summary: 'Get files for an acquired product',
        operationId: 'getAcquiredProductFiles',
        security: bearerSecurity,
        parameters: [idParam('productId')],
        responses: {
          200: response({ $ref: '#/components/schemas/ProductFilesDto' }, 'File list returned'),
          403: errorResponses[403],
          404: errorResponses[404],
        },
      },
    },
    '/api/v1/acquisitions/admin': {
      get: {
        tags: ['Acquisitions'],
        summary: 'List all acquisitions',
        operationId: 'adminListAcquisitions',
        security: bearerSecurity,
        parameters: [
          ...paginationParams,
          { in: 'query', name: 'userId', schema: { type: 'string' } },
          { in: 'query', name: 'productId', schema: { type: 'string' } },
          { in: 'query', name: 'collectionId', schema: { type: 'string' } },
        ],
        responses: {
          200: response(
            paginated('#/components/schemas/DownloadedProductDto'),
            'Paginated acquisition records',
          ),
          403: errorResponses[403],
        },
      },
    },
    '/api/v1/subscription-plans': {
      get: {
        tags: ['Subscription Plans'],
        summary: 'List subscription plans',
        operationId: 'listSubscriptionPlans',
        responses: {
          200: response(
            { type: 'array', items: { $ref: '#/components/schemas/SubscriptionPlanDto' } },
            'List of plans',
          ),
        },
      },
      post: {
        tags: ['Subscription Plans'],
        summary: 'Create a subscription plan',
        operationId: 'createSubscriptionPlan',
        security: bearerSecurity,
        requestBody: jsonBody({ $ref: '#/components/schemas/SubscriptionPlanCreateRequest' }),
        responses: {
          201: response({ $ref: '#/components/schemas/SubscriptionPlanDto' }, 'Plan created'),
          404: errorResponses[404],
          409: errorResponses[409],
        },
      },
    },
    '/api/v1/subscription-plans/{id}': {
      get: {
        tags: ['Subscription Plans'],
        summary: 'Get plan by ID',
        operationId: 'getSubscriptionPlanById',
        parameters: [idParam()],
        responses: {
          200: response({ $ref: '#/components/schemas/SubscriptionPlanDto' }, 'Plan details'),
          404: errorResponses[404],
        },
      },
      patch: {
        tags: ['Subscription Plans'],
        summary: 'Update a subscription plan',
        operationId: 'updateSubscriptionPlan',
        security: bearerSecurity,
        parameters: [idParam()],
        requestBody: jsonBody({ $ref: '#/components/schemas/SubscriptionPlanUpdateRequest' }),
        responses: {
          200: response({ $ref: '#/components/schemas/SubscriptionPlanDto' }, 'Plan updated'),
          404: errorResponses[404],
          409: errorResponses[409],
        },
      },
      delete: {
        tags: ['Subscription Plans'],
        summary: 'Delete a subscription plan',
        operationId: 'deleteSubscriptionPlan',
        security: bearerSecurity,
        parameters: [idParam()],
        responses: { 204: { description: 'Plan deleted' }, 404: errorResponses[404] },
      },
    },
    '/api/v1/subscriptions/checkout': {
      post: {
        tags: ['Subscriptions'],
        summary: 'Create a subscription checkout session',
        operationId: 'createSubscriptionCheckout',
        security: bearerSecurity,
        requestBody: jsonBody({ $ref: '#/components/schemas/CheckoutRequest' }),
        responses: {
          200: response({ $ref: '#/components/schemas/CheckoutResponse' }, 'Checkout URL created'),
          400: errorResponses[400],
          401: errorResponses[401],
          404: errorResponses[404],
        },
      },
    },
    '/api/v1/subscriptions/webhook': {
      post: {
        tags: ['Subscriptions'],
        summary: 'Lemon Squeezy subscription webhook receiver',
        operationId: 'subscriptionWebhook',
        parameters: [
          { in: 'header', name: 'X-Signature', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: {
            description: 'Webhook received',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['received'],
                  properties: { received: { type: 'boolean' } },
                },
              },
            },
          },
          400: { description: 'Missing signature or body' },
          401: { description: 'Invalid signature' },
        },
      },
    },
    '/api/v1/subscriptions/me': {
      get: {
        tags: ['Subscriptions'],
        summary: "Get current user's subscription",
        operationId: 'getMySubscription',
        security: bearerSecurity,
        responses: {
          200: response(
            { oneOf: [{ $ref: '#/components/schemas/SubscriptionDto' }, { type: 'null' }] },
            'Current subscription or null',
          ),
          401: errorResponses[401],
        },
      },
      delete: {
        tags: ['Subscriptions'],
        summary: "Cancel current user's subscription",
        operationId: 'cancelMySubscription',
        security: bearerSecurity,
        responses: {
          204: { description: 'Cancellation initiated' },
          400: errorResponses[400],
          401: errorResponses[401],
          404: errorResponses[404],
        },
      },
    },
    '/api/v1/subscriptions/billing-history': {
      get: {
        tags: ['Subscriptions'],
        summary: "Get current user's billing history",
        operationId: 'getMyBillingHistory',
        security: bearerSecurity,
        parameters: paginationParams,
        responses: {
          200: response(
            paginated('#/components/schemas/BillingHistoryDto'),
            'Paginated billing history',
          ),
          401: errorResponses[401],
        },
      },
    },
    '/api/v1/subscriptions': {
      get: {
        tags: ['Subscriptions'],
        summary: 'List all subscriptions',
        operationId: 'adminListSubscriptions',
        security: bearerSecurity,
        parameters: [
          ...paginationParams,
          {
            in: 'query',
            name: 'status',
            schema: { type: 'string', enum: ['active', 'cancelled', 'expired', 'past_due'] },
          },
          { in: 'query', name: 'userId', schema: { type: 'string' } },
        ],
        responses: {
          200: response(
            paginated('#/components/schemas/SubscriptionDto'),
            'Paginated subscriptions',
          ),
          401: errorResponses[401],
          403: errorResponses[403],
        },
      },
    },
  },
};
