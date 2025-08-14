// CookieDebugger.jsx - Add this component to test cookies
import React, { useState } from 'react';
import authService from '../services/authService'; // fixed import path

const CookieDebugger = () => {
  const [testResults, setTestResults] = useState({});
  const [loginData, setLoginData] = useState({ email: '', password: '' });

  const checkBrowserSettings = () => {
    const results = {
      userAgent: navigator.userAgent,
      cookieEnabled: navigator.cookieEnabled,
      thirdPartyCookiesBlocked: false,
      currentUrl: window.location.href,
      currentCookies: document.cookie,
      isHTTPS: window.location.protocol === 'https:',
      sameSiteSupport: 'SameSite' in document.createElement('a'),
    };

    // Test if third-party cookies are blocked
    try {
      // Create a test cookie
      document.cookie = "test=value; SameSite=None; Secure";
      results.thirdPartyCookiesBlocked = !document.cookie.includes('test=value');
      // Clean up
      document.cookie = "test=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    } catch (error) {
      results.thirdPartyCookiesBlocked = true;
    }

    setTestResults(results);
    console.log('🔍 Browser check results:', results);
  };

  const testLogin = async () => {
    try {
      console.log('🧪 Testing login with cookie debugging...');
      
      // Clear existing cookies first
      console.log('🧹 Cookies before login:', document.cookie);
      
      const result = await authService.login(loginData);
      console.log('✅ Login result:', result);
      
      // Check cookies immediately after login
      setTimeout(() => {
        const cookiesAfter = document.cookie;
        console.log('🍪 Cookies after login:', cookiesAfter);
        
        setTestResults(prev => ({
          ...prev,
          loginSuccess: true,
          cookiesAfterLogin: cookiesAfter,
          hasTokenCookie: cookiesAfter.includes('token=')
        }));
      }, 500);
      
    } catch (error) {
      console.error('❌ Login test failed:', error);
      setTestResults(prev => ({
        ...prev,
        loginSuccess: false,
        loginError: error.message
      }));
    }
  };

  const testAuthenticatedRequest = async () => {
    try {
      console.log('🧪 Testing authenticated request...');
      const user = await authService.getMe();
      console.log('✅ Authenticated request successful:', user);
      
      setTestResults(prev => ({
        ...prev,
        authenticatedRequestSuccess: true,
        userData: user
      }));
    } catch (error) {
      console.error('❌ Authenticated request failed:', error);
      setTestResults(prev => ({
        ...prev,
        authenticatedRequestSuccess: false,
        authError: error.response?.data || error.message
      }));
    }
  };

  const clearAllCookies = () => {
    // Get all cookies and delete them
    document.cookie.split(";").forEach((c) => {
      const eqPos = c.indexOf("=");
      const name = eqPos > -1 ? c.substr(0, eqPos) : c;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    });
    console.log('🧹 All cookies cleared');
    setTestResults(prev => ({ ...prev, cookiesCleared: true }));
  };

  return (
    <div style={{ 
      padding: '20px', 
      border: '2px solid #333', 
      margin: '20px',
      backgroundColor: '#f5f5f5',
      fontFamily: 'monospace'
    }}>
      <h2>🍪 Cookie Debug Tool</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Browser Settings Check</h3>
        <button onClick={checkBrowserSettings}>Check Browser Settings</button>
        {testResults.userAgent && (
          <div style={{ marginTop: '10px', fontSize: '12px' }}>
            <div>Cookies Enabled: {testResults.cookieEnabled ? '✅' : '❌'}</div>
            <div>HTTPS: {testResults.isHTTPS ? '✅' : '❌'}</div>
            <div>Third-party Cookies Blocked: {testResults.thirdPartyCookiesBlocked ? '❌' : '✅'}</div>
            <div>Current URL: {testResults.currentUrl}</div>
            <div>Current Cookies: {testResults.currentCookies || 'None'}</div>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Login Test</h3>
        <input
          type="email"
          placeholder="Email"
          value={loginData.email}
          onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={loginData.password}
          onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <button onClick={testLogin}>Test Login</button>
        
        {testResults.loginSuccess !== undefined && (
          <div style={{ marginTop: '10px', fontSize: '12px' }}>
            <div>Login Success: {testResults.loginSuccess ? '✅' : '❌'}</div>
            {testResults.cookiesAfterLogin && (
              <div>Cookies After Login: {testResults.cookiesAfterLogin || 'None'}</div>
            )}
            <div>Token Cookie Present: {testResults.hasTokenCookie ? '✅' : '❌'}</div>
            {testResults.loginError && <div>Error: {testResults.loginError}</div>}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Authenticated Request Test</h3>
        <button onClick={testAuthenticatedRequest}>Test /auth/me</button>
        
        {testResults.authenticatedRequestSuccess !== undefined && (
          <div style={{ marginTop: '10px', fontSize: '12px' }}>
            <div>Auth Request Success: {testResults.authenticatedRequestSuccess ? '✅' : '❌'}</div>
            {testResults.userData && <div>User Data: {JSON.stringify(testResults.userData)}</div>}
            {testResults.authError && <div>Auth Error: {JSON.stringify(testResults.authError)}</div>}
          </div>
        )}
      </div>

      <div>
        <h3>Utilities</h3>
        <button onClick={clearAllCookies} style={{ marginRight: '10px' }}>Clear All Cookies</button>
        <button onClick={() => window.location.reload()}>Reload Page</button>
      </div>

      <div style={{ marginTop: '20px', fontSize: '11px', color: '#666' }}>
        <h4>Debug Results:</h4>
        <pre>{JSON.stringify(testResults, null, 2)}</pre>
      </div>
    </div>
  );
};

export default CookieDebugger;