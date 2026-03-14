---
name: Media Library Implementation
overview: Add a Media model to track all uploaded files in MongoDB, build a full admin media library with list/upload/delete operations, and support filtering by folder, file type, date range, and search.
todos:
  - id: media-enum
    content: Add MediaType enum to enums.ts and getMediaType helper to file.util.ts
    status: completed
  - id: media-model
    content: Create Media Mongoose model with indexes (src/models/media.model.ts)
    status: completed
  - id: media-dto
    content: Create MediaDto and toMediaDto mapper (src/dtos/media.dto.ts)
    status: completed
  - id: media-validator
    content: Create Zod schemas for upload and list (src/validators/media.validator.ts)
    status: completed
  - id: media-service
    content: Create media service wrapping upload service + Media model (src/services/media.service.ts)
    status: completed
  - id: media-controller
    content: Create media controller (src/controllers/media.controller.ts)
    status: completed
  - id: media-routes
    content: Create admin media routes with OpenAPI docs (src/api/v1/routes/media.routes.ts)
    status: completed
  - id: media-register
    content: Register media router in src/api/v1/index.ts
    status: completed
isProject: false
---

# Media Library Implementation

## Problem

Currently, files are uploaded to Cloudflare R2 and a URL is returned, but **nothing is tracked in the database**. There is no way to browse, filter, or manage uploaded files. We need a `Media` model to persist file metadata and a full admin media library API on top of it.

## Data Model

```mermaid
erDiagram
    Media {
        string filename
        string url
        string key
        string mimeType
        number size
        MediaType type
        UploadFolder folder
        ObjectId uploadedBy
        string alt
    }
    Media }o--|| User : "uploaded by"
```

### `Media` model fields

- `filename` -- original file name (e.g. `ring-photo.webp`)
- `url` -- full public R2 URL
- `key` -- R2 object key (e.g. `products/a1b2c3d4.webp`) for deletion
- `mimeType` -- e.g. `image/webp`, `application/pdf`
- `size` -- file size in bytes
- `type` -- derived enum: `image`, `document`, `model` (for filtering)
- `folder` -- the `UploadFolder` value: `categories`, `products`, `users`
- `uploadedBy` -- ref to User who uploaded it
- `alt` -- optional alt text / description
- `createdAt`, `updatedAt` -- timestamps

### New enum `MediaType`

Added to [src/utils/enums.ts](src/utils/enums.ts):

```typescript
export enum MediaType {
  Image = 'image',
  Document = 'document',
  Model = 'model',
}
```

## Integration with existing upload flow

The current upload pipeline in [src/services/upload.service.ts](src/services/upload.service.ts) uploads to R2 and returns a URL. The new `media.service.ts` will **wrap** the existing upload service:

1. Call `uploadService.uploadFile()` to push to R2 (unchanged)
2. Create a `Media` document with metadata from the multer file object
3. Return the `MediaDto` (includes URL + metadata)
4. On delete: remove the Media record AND call `uploadService.deleteFile()` to remove from R2

The existing upload routes ([src/api/v1/routes/upload.routes.ts](src/api/v1/routes/upload.routes.ts)) stay untouched -- they remain a low-level API. The new media routes are the admin-facing library.

## Files to Create

### Model

- **[src/models/media.model.ts](src/models/media.model.ts)** -- `Media` Mongoose model with indexes on `folder`, `type`, `uploadedBy`, `createdAt`, and a text index on `filename` + `alt`

### DTO

- **[src/dtos/media.dto.ts](src/dtos/media.dto.ts)** -- `MediaDto` interface and `toMediaDto()` mapper

### Validator

- **[src/validators/media.validator.ts](src/validators/media.validator.ts)** -- Zod schemas:
  - `uploadMediaSchema` -- validates `folder` (required, must be UploadFolder), `alt` (optional)
  - `listMediaSchema` -- validates `page`, `limit`, `search`, `folder` (UploadFolder), `type` (MediaType), `dateFrom`, `dateTo`

### Service

- **[src/services/media.service.ts](src/services/media.service.ts)** -- Business logic:
  - `uploadMedia(file, folder, uploadedBy, alt?)` -- upload to R2 + create Media record
  - `uploadMultipleMedia(files, folder, uploadedBy)` -- batch upload
  - `listMedia(query)` -- paginated, filterable by folder/type/date/search
  - `getMediaById(id)` -- single media details
  - `updateMedia(id, { alt })` -- update alt text
  - `deleteMedia(id)` -- delete from R2 + remove Media record
  - `deleteMultipleMedia(ids)` -- batch delete

### Controller

- **[src/controllers/media.controller.ts](src/controllers/media.controller.ts)** -- Thin handlers for all media endpoints

### Routes

- **[src/api/v1/routes/media.routes.ts](src/api/v1/routes/media.routes.ts)** -- Admin-only routes with OpenAPI docs:
  - `GET /` -- list media (paginated, filtered)
  - `GET /:id` -- get single media
  - `POST /upload` -- upload single file (image/document/model auto-detected from mime)
  - `POST /upload/batch` -- upload multiple files
  - `PUT /:id` -- update media metadata (alt text)
  - `DELETE /:id` -- delete single media
  - `POST /delete/batch` -- batch delete by IDs

## Files to Modify

- **[src/utils/enums.ts](src/utils/enums.ts)** -- add `MediaType` enum
- **[src/api/v1/index.ts](src/api/v1/index.ts)** -- register `mediaRouter` at `/media`
- **[src/utils/file.util.ts](src/utils/file.util.ts)** -- add a `getMediaType(mimetype, filename)` helper that returns the `MediaType` based on the file

## Implementation Order

enums + file util -> model -> DTO -> validator -> service -> controller -> routes -> route registration
