import { applyLocale, initialLocale } from './i18n';
import './components/home-page';

// Apply the initial locale (saved choice → browser language → English).
applyLocale(initialLocale());
