import { redirect } from 'next/navigation';

/**
 * Settings page - redirects to profile
 * User settings are managed in the profile page
 */
export default function SettingsPage() {
  redirect('/profile');
}
