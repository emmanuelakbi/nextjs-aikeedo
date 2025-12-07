import { requireAuth } from '@/lib/auth/session';
import { UserRepository } from '@/infrastructure/repositories/UserRepository';
import { Id } from '@/domain/user/value-objects/Id';
import ProfileForm from './ProfileForm';

/**
 * Profile page with edit form
 * Requirements: 7.1, 7.2
 */
export const dynamic = 'force-dynamic';



export default async function ProfilePage() {
  const session = await requireAuth();

  // Fetch user data
  const userRepository = new UserRepository();
  const userId = Id.fromString(session.user.id);
  const user = await userRepository.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  // Prepare user data for form
  const userData = {
    id: user.getId().getValue(),
    email: user.getEmail().getValue(),
    emailVerified: user.getEmailVerified(),
    firstName: user.getFirstName(),
    lastName: user.getLastName(),
    phoneNumber: user.getPhoneNumber() || '',
    language: user.getLanguage(),
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage your personal information and account settings
        </p>
      </div>

      {/* Profile form */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <ProfileForm user={userData} />
        </div>
      </div>

      {/* Email verification status */}
      {!user.getEmailVerified() && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Your email address is not verified. Please check your inbox for
                a verification email.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Account information */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Account Information
          </h2>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Account Status
              </dt>
              <dd className="mt-1">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.getStatus() === 'ACTIVE'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {user.getStatus()}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Role</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.getRole()}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Member Since
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(user.getCreatedAt()).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Last Updated
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(user.getUpdatedAt()).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
