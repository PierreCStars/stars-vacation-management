import Link from "next/link";

interface AuthErrorPageProps {
  searchParams: { error?: string };
}

export default function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const errorCode = searchParams?.error ?? "Unknown";
  
  // Map error codes to user-friendly messages
  const getErrorMessage = (code: string) => {
    switch (code) {
      case "AccessDenied":
        return "Access denied. Please use a Stars Monte Carlo email address or contact your administrator.";
      case "Configuration":
        return "There is a problem with the server configuration.";
      case "Verification":
        return "The verification token has expired or has already been used.";
      case "Default":
        return "An error occurred during sign-in.";
      default:
        return `An error occurred: ${code}`;
    }
  };

  const getErrorTitle = (code: string) => {
    switch (code) {
      case "AccessDenied":
        return "Access Denied";
      case "Configuration":
        return "Configuration Error";
      case "Verification":
        return "Verification Error";
      default:
        return "Sign-in Error";
    }
  };

  return (
    <main className="mx-auto max-w-screen-sm p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          {getErrorTitle(errorCode)}
        </h1>
        <p className="text-lg text-gray-600 mb-4">
          {getErrorMessage(errorCode)}
        </p>
        <div className="bg-gray-100 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700">
            <strong>Error Code:</strong> <code className="bg-gray-200 px-2 py-1 rounded">{errorCode}</code>
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="text-center">
          <Link 
            href="/" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Go back home
          </Link>
        </div>
        
        <div className="text-center">
          <Link 
            href="/auth/signin" 
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Try signing in again
          </Link>
        </div>
      </div>

      {errorCode === "AccessDenied" && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">
            Need Access?
          </h3>
          <p className="text-sm text-blue-700">
            If you believe you should have access to this system, please contact your administrator 
            or try using your Stars Monte Carlo email address.
          </p>
        </div>
      )}
    </main>
  );
}
