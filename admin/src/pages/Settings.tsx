import { useAuth } from '../contexts/AuthContext';
import Card from '../components/Card/Card';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import ConfirmSignOut from '../components/SignOut/ConfirmSignOut';
import SignOutAnimation from '../components/SignOut/SignOutAnimation';

const Settings = () => {
  const { signOut, showConfirmSignOut, setShowConfirmSignOut, isSigningOut } = useAuth();

  const handleSignOutClick = () => {
    setShowConfirmSignOut(true);
  };

  const handleConfirmSignOut = async () => {
    await signOut();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Sign Out</h3>
              <p className="text-sm text-gray-500">Sign out from the TYPNI Admin Portal</p>
            </div>
            <button
              onClick={handleSignOutClick}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </Card>

      <ConfirmSignOut
        isOpen={showConfirmSignOut}
        onConfirm={handleConfirmSignOut}
        onCancel={() => setShowConfirmSignOut(false)}
      />
      
      <SignOutAnimation isVisible={isSigningOut} />
    </div>
  );
};

export default Settings; 