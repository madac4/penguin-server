export enum Role {
  Administrator = 'Administrator',
  User = 'User',
}

export enum TokenType {
  EmailConfirmation = 'email_confirmation',
  RefreshToken = 'refresh_token',
  PasswordReset = 'password_reset',
  EmailChange = 'email_change',
}

export enum Language {
  En = 'en',
  Ru = 'ru',
}

export enum MediaType {
  Document = 'document',
  Image = 'image',
  Model = 'model',
}

export enum UploadFolder {
  Categories = 'categories',
  Products = 'products',
  ProtectedProducts = 'protected/products',
  General = 'general',
  Users = 'users',
  All = 'all',
}

export enum SubscriptionStatus {
  Active = 'Active',
  Expired = 'Expired',
  Cancelled = 'Cancelled',
}
