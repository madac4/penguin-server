import type { Request, Response } from 'express';
import { CatchAsyncErrors } from '../middlewares/error.middleware';
import * as propertyDefinitionService from '../services/property-definition.service';
import { success } from '../utils/response.util';
import type {
  CreatePropertyDefinitionInput,
  ListPropertyDefinitionsInput,
  UpdatePropertyDefinitionInput,
} from '../validators/property-definition.validator';

export const create = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const propDef = await propertyDefinitionService.createPropertyDefinition(
    req.body as CreatePropertyDefinitionInput,
  );
  success(res, propDef, 201, 'Property definition created successfully');
});

export const getById = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const propDef = await propertyDefinitionService.getPropertyDefinitionById(req.params.id);
  success(res, propDef);
});

export const list = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const result = await propertyDefinitionService.listPropertyDefinitions(
    req.query as unknown as ListPropertyDefinitionsInput,
  );
  success(res, result);
});

export const update = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const propDef = await propertyDefinitionService.updatePropertyDefinition(
    req.params.id,
    req.body as UpdatePropertyDefinitionInput,
  );
  success(res, propDef, 200, 'Property definition updated successfully');
});

export const remove = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  await propertyDefinitionService.deletePropertyDefinition(req.params.id);
  success(res, null, 200, 'Property definition deleted successfully');
});
