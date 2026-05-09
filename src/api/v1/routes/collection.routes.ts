import { Router } from 'express';
import * as collectionController from '../../../controllers/collection.controller';
import { authenticate } from '../../../middlewares/auth.middleware';
import { validateBody, validateQuery } from '../../../middlewares/validate.middleware';
import {
  createCollectionSchema,
  listCollectionsSchema,
  renameCollectionSchema,
} from '../../../validators/collection.validator';

const router = Router();

router.use(authenticate);

router.get('/', validateQuery(listCollectionsSchema), collectionController.list);

router.post('/', validateBody(createCollectionSchema), collectionController.create);

router.get('/:id', collectionController.getById);

router.patch('/:id', validateBody(renameCollectionSchema), collectionController.rename);

router.delete('/:id', collectionController.remove);

router.post('/:id/items/:productId', collectionController.addItem);

router.delete('/:id/items/:productId', collectionController.removeItem);

export default router;
