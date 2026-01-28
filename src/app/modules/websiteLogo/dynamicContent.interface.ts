export interface IDynamicContent {
     key: string; // unique identifier like 'logo-light', 'logo-dark', 'login-image', 'banner-home'
     type: 'image';
     images: string[];
}
