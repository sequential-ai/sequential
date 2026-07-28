import { useUser, UserButton } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import axios from "axios";

export default function Dashboard() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [syncStatus, setSyncStatus] = useState("Checking database...");
  const [dbUser, setDbUser] = useState(null);

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const syncWithDatabase = async () => {
        try {
          // First, attempt to login to see if the user exists in our DB
          const loginRes = await axios.post("http://localhost:5000/api/v1/auth/login", {
            clerkUserId: user.id,
          }).catch(err => err.response);

          if (loginRes.status === 200) {
            setSyncStatus("User successfully loaded from database.");
            setDbUser(loginRes.data.data);
          } else if (loginRes.status === 404) {
            // User not found in DB, let's register them!
            setSyncStatus("User not found in database. Provisioning new workspace...");
            
            const registerRes = await axios.post("http://localhost:5000/api/v1/auth/register", {
              clerkUserId: user.id,
              email: user.primaryEmailAddress?.emailAddress,
              firstName: user.firstName,
              lastName: user.lastName,
              imageUrl: user.imageUrl
            });

            if (registerRes.status === 201) {
              setSyncStatus("Workspace and user provisioned successfully in database!");
              setDbUser(registerRes.data.data);
            }
          } else {
            setSyncStatus(`Error connecting to database: ${loginRes.data?.message || 'Unknown Error'}`);
          }
        } catch (error) {
          console.error("Sync Error:", error);
          setSyncStatus("Failed to synchronize with backend database.");
        }
      };

      syncWithDatabase();
    }
  }, [isLoaded, isSignedIn, user]);

  if (!isLoaded) {
    return <div className="p-8 text-center">Loading data...</div>;
  }

  if (!isSignedIn) {
    return <div className="p-8 text-center">You must be signed in to view this page.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8 font-sans">
      <header className="flex justify-between items-center mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-indigo-600">Sequential Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="font-medium text-gray-700">Welcome, {user.firstName || 'User'}!</span>
          <UserButton afterSignOutUrl="/login" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white shadow rounded-lg p-6 border-l-4 border-indigo-500">
          <h2 className="text-xl font-semibold mb-2">Synchronization Status</h2>
          <p className="text-gray-600 font-medium">{syncStatus}</p>
        </div>

        {dbUser && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* User Profile Card */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 border-b pb-2">Your Profile</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500 font-semibold block uppercase text-xs">Internal DB ID</span>
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">{dbUser.id}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-semibold block uppercase text-xs">Email</span>
                  <span>{dbUser.email}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-semibold block uppercase text-xs">System Role</span>
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-bold text-xs mt-1">
                    {dbUser.systemRole}
                  </span>
                </div>
              </div>
            </div>

            {/* Organizations Loop */}
            {dbUser.memberships?.map((membership) => {
              const org = membership.organization;
              const sub = org.subscription;
              const apiKeys = org.apiKeys || [];
              const credits = org.creditLedger?.reduce((acc, curr) => acc + curr.amount, 0) || 0;

              return (
                <div key={org.id} className="bg-white shadow rounded-lg p-6 md:col-span-2 border-t-4 border-emerald-500">
                  <div className="flex justify-between items-start mb-4 border-b pb-2">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">{org.name}</h2>
                      <p className="text-sm text-gray-500 font-mono">Slug: {org.slug}</p>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold uppercase">
                      Role: {membership.role}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                    
                    {/* Subscription & Credits */}
                    <div className="bg-gray-50 rounded p-4 border">
                      <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">Billing & Plan</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Plan:</span>
                          <span className="font-semibold text-indigo-600">{sub?.plan?.name || 'None'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Status:</span>
                          <span className="font-semibold">{sub?.status || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between mt-2 pt-2 border-t">
                          <span className="text-gray-500">Available Credits:</span>
                          <span className="font-bold text-green-600">{credits}</span>
                        </div>
                      </div>
                    </div>

                    {/* API Keys */}
                    <div className="bg-gray-50 rounded p-4 border md:col-span-2">
                      <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">API Keys</h3>
                      {apiKeys.length > 0 ? (
                        <div className="space-y-3">
                          {apiKeys.map(key => (
                            <div key={key.id} className="flex justify-between items-center bg-white p-3 rounded border shadow-sm">
                              <div>
                                <p className="font-semibold text-sm">{key.name}</p>
                                <p className="font-mono text-xs text-gray-500">{key.keyPrefix}{key.keyHash}</p>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded font-bold ${key.environment === 'LIVE' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {key.environment}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No API keys found.</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

          </div>
        )}
      </main>
    </div>
  );
}
