import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthService from '../services/authService'; // Ensure the path is correct

const VerifyEmailPrompt = () => {
  const location = useLocation();
  const email = location.state?.email || '';
  const [isResending, setIsResending] = useState(false);

  const handleResend = async () => {
    setIsResending(true);
    try {
      await AuthService.resendVerificationEmail(); // calling the method we'll add in AuthService
      toast.success('Verification email resent!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to resend verification email.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-600 to-purple-700 dark:from-blue-800 dark:to-purple-900 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
          Verify Your Email
        </h2>

        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          Thanks for registering! Please check your inbox{email && <> at <b className="text-white">{email}</b></>} for a verification link before proceeding.
        </p>

        <div className="flex justify-center">
          <button
            onClick={handleResend}
            disabled={isResending}
            className="px-8 py-3 bg-white hover:bg-gray-100 text-blue-600 dark:text-blue-800 font-medium rounded-lg transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
          >
            {isResending ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Resending...
              </span>
            ) : 'Resend Verification Email'}
          </button>
        </div>

        <p className="text-blue-200 mt-8 text-sm">
          Didn't receive the email? Check your spam folder or{' '}
          <a href="/contact" className="text-white underline hover:no-underline">
            contact support
          </a>.
        </p>
      </div>
    </div>
  );
};

export default VerifyEmailPrompt;
