export interface IDynamicContent {
     key: string; // unique identifier like 'logo-light', 'logo-dark', 'login-image', 'banner-home'
     type: 'image';
     image: string;
     category?: string; // optional: 'logo', 'login', 'banner', 'footer'
}
