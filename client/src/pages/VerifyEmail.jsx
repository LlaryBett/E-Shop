import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthService from '../services/authService';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');

  useEffect(() => {
    const verify = async () => {
      try {
        const { data } = await AuthService.verifyEmail(token);
        if (data.success) {
          setStatus('success');
          toast.success('Email verified! You can now log in.');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setStatus('error');
          toast.error(data.message || 'Verification failed.');
        }
      } catch (err) {
        setStatus('error');
        toast.error(err.response?.data?.message || 'Verification failed.');
      }
    };
    verify();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      {status === 'verifying' && <p>Verifying your email...</p>}
      {status === 'success' && <p>Email verified! Redirecting to login...</p>}
      {status === 'error' && (
        <p>
          Verification failed. Please try again or{' '}
          <a href="/contact" className="underline text-blue-600">contact support</a>.
        </p>
      )}
    </div>
  );
};

export default VerifyEmail;
