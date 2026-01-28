export interface IDynamicContent {
     key: string; // unique identifier like 'logo-light', 'logo-dark', 'login-image', 'banner-home'
     type: 'image';
     url: string;
     category?: string; // optional: 'logo', 'login', 'banner', 'footer'
}
