import { applyLocale, initialLocale } from './i18n';
import './components/app-shell';

// Apply the initial locale (saved choice → browser language → English).
applyLocale(initialLocale());
