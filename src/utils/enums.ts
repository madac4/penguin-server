export enum Role {
  Administrator = 'Administrator',
  Moderator = 'Moderator',
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
  Subscriptions = 'subscriptions',
  Categories = 'categories',
  Products = 'products',
  General = 'general',
  Models = 'models',
  Users = 'users',
  All = 'all',
}

export enum CartStatus {
  Active = 'active',
  CheckedOut = 'checked_out',
  Expired = 'expired',
}
