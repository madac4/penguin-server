import { Router } from 'express';
import * as downloadController from '../../../controllers/download.controller';
import { authenticate } from '../../../middlewares/auth.middleware';
import { authorize } from '../../../middlewares/role.middleware';
import { validateQuery } from '../../../middlewares/validate.middleware';
import { Role } from '../../../utils/enums';
import {
  listAcquisitionsSchema,
  listAcquisitionHistorySchema,
} from '../../../validators/collection.validator';

const router = Router();

router.use(authenticate);

router.get('/', validateQuery(listAcquisitionHistorySchema), downloadController.list);

router.get('/:productId/files', downloadController.getFiles);

router.get(
  '/admin',
  authorize(Role.Administrator),
  validateQuery(listAcquisitionsSchema),
  downloadController.adminList,
);

export default router;
