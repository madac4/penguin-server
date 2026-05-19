import type { RequestHandler } from 'express';
import { Router } from 'express';
import multer from 'multer';
import * as mediaController from '../../../controllers/media.controller';
import { authenticate } from '../../../middlewares/auth.middleware';
import { authorize } from '../../../middlewares/role.middleware';
import { validateBody, validateQuery } from '../../../middlewares/validate.middleware';
import { Role } from '../../../utils/enums';
import { getMediaType } from '../../../utils/file.util';
import {
  batchDeleteMediaSchema,
  listMediaSchema,
  updateMediaSchema,
} from '../../../validators/media.validator';

const router = Router();

// ─── Multer setup ────────────────────────────────────────────────────────────

const storage = multer.memoryStorage();
const MAX_UPLOAD_FILE_SIZE = 500 * 1024 * 1024;

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (getMediaType(file.mimetype, file.originalname)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}`));
  }
};

const uploadSingle = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_UPLOAD_FILE_SIZE },
}).single('file') as unknown as RequestHandler;

const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_UPLOAD_FILE_SIZE },
}).array('files', 20) as unknown as RequestHandler;

// Media library is editable by moderators, but destructive actions stay admin-only.
router.use(authenticate);

router.get(
  '/',
  authorize(Role.Administrator, Role.Moderator),
  validateQuery(listMediaSchema),
  mediaController.list,
);

router.get('/:id', authorize(Role.Administrator, Role.Moderator), mediaController.getById);

router.post(
  '/upload',
  authorize(Role.Administrator, Role.Moderator),
  uploadSingle,
  mediaController.upload,
);

router.post(
  '/upload/batch',
  authorize(Role.Administrator, Role.Moderator),
  uploadMultiple,
  mediaController.uploadBatch,
);

router.put(
  '/:id',
  authorize(Role.Administrator, Role.Moderator),
  validateBody(updateMediaSchema),
  mediaController.update,
);

router.delete('/:id', authorize(Role.Administrator), mediaController.remove);

router.post(
  '/delete/batch',
  authorize(Role.Administrator),
  validateBody(batchDeleteMediaSchema),
  mediaController.removeBatch,
);

export default router;
