import { Schema } from 'mongoose'

// ─── i18n Translated Field ───────────────────────────────────────────────────

export interface ITranslatedField {
  en: string;
  ru: string;
}

export const translatedFieldSchema = new Schema<ITranslatedField>(
  {
    en: { type: String, required: true, trim: true },
    ru: { type: String, required: true, trim: true },
  },
  { _id: false },
);
