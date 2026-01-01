"use client";
import React, { useState, useEffect, forwardRef } from "react";
import { useAuth } from './AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { Loader2, Mail, Phone, Shield, ArrowRight, RefreshCw } from 'lucide-react';
import dynamic from 'next/dynamic';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';

// Utility function for class name merging
function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// Input Component with fixed animation effect
const Input = forwardRef(({ className, type, ...props }, ref) => {
  const radius = 100; // change this to adjust the size of the hover effect
  const [visible, setVisible] = useState(false);
  
  let mouseX = useMotionValue(0);
  let mouseY = useMotionValue(0);
  
  function handleMouseMove({ currentTarget, clientX, clientY }) {
    let { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }
  
  return (
    <div className="relative">
      <motion.div 
        className="absolute -inset-0.5 rounded-md pointer-events-none"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              ${visible ? radius + "px" : "0px"} circle at ${mouseX}px ${mouseY}px,
              var(--blue-500, #3b82f6),
              transparent 80%
            )
          `,
          zIndex: 0,
        }}
      />
      <input
        type={type}
        className={cn(
          "relative flex h-12 sm:h-10 w-full rounded-md border-none px-3 py-2 text-base sm:text-sm transition duration-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 z-10",
          className
        )}
        ref={ref}
        {...props}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        style={{
          backgroundColor: 'var(--background)',
          color: 'var(--foreground)',
          boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.1)'
        }}
      />
    </div>
  );
});

Input.displayName = "Input";

// Label Component
const Label = forwardRef(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-sm font-medium leading-none",
      className
    )}
    style={{ color: 'var(--foreground)' }}
    {...props}
  />
));

Label.displayName = "Label";

// Button Component
const Button = forwardRef(({ className, children, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "relative group/btn inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none h-12 sm:h-10 py-2 px-4",
      className
    )}
    style={{ 
      backgroundColor: 'var(--blue-600, #2563eb)', 
      color: 'white' 
    }}
    {...props}
  >
    {children}
    <BottomGradient />
  </button>
));

Button.displayName = "Button";

// Bottom gradient animation for buttons
const BottomGradient = () => {
  return (
    <>
      <span
        className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span
        className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
};

// Form group container
const FormGroup = ({ children, className }) => {
  return (
    <div className={cn("flex w-full flex-col space-y-2", className)}>
      {children}
    </div>
  );
};

// Verification Code Input Component - Mobile friendly
const VerificationInput = ({ value, onChange, length = 4, loading }) => {
  const inputRefs = Array(length).fill(0).map(() => React.createRef());
  
  const handleChange = (e, index) => {
    const val = e.target.value;
    
    if (val === '' || /^[0-9]$/.test(val)) {
      const newCode = [...value];
      newCode[index] = val;
      onChange(newCode.join(''));
      
      // Move to next input if value is entered
      if (val !== '' && index < length - 1) {
        inputRefs[index + 1].current.focus();
      }
    }
  };
  
  const handleKeyDown = (e, index) => {
    // Move to previous input on backspace
    if (e.key === 'Backspace' && index > 0 && e.target.value === '') {
      inputRefs[index - 1].current.focus();
    }
  };
  
  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text/plain').slice(0, length);
    
    if (/^[0-9]+$/.test(pasteData)) {
      // Fill inputs with pasted digits
      const newCode = value.split('');
      pasteData.split('').forEach((digit, i) => {
        newCode[i] = digit;
        if (inputRefs[i] && inputRefs[i].current) {
          inputRefs[i].current.value = digit;
        }
      });
      onChange(newCode.join(''));
      
      // Focus the input after the last pasted digit
      const focusIndex = Math.min(pasteData.length, length - 1);
      inputRefs[focusIndex].current.focus();
    }
  };
  
  return (
    <div className={`flex gap-2 my-4 justify-center ${loading ? 'opacity-50' : ''}`}>
      {Array(length).fill(0).map((_, index) => (
        <input
          key={index}
          ref={inputRefs[index]}
          type="text"
          maxLength="1"
          className="w-14 h-14 sm:w-12 sm:h-12 text-center text-xl font-bold border-2 rounded-md shadow-sm focus:ring-2 relative z-10"
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: 'var(--foreground)',
            borderColor: 'rgba(255, 255, 255, 0.2)'
          }}
          value={value[index] || ''}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          disabled={loading}
          inputMode="numeric"
          pattern="[0-9]*"
        />
      ))}
    </div>
  );
};

// Alert component for displaying status messages
const Alert = ({ children, type = "info", onDismiss }) => {
  const bgColors = {
    info: "rgba(59, 130, 246, 0.1)",
    success: "rgba(16, 185, 129, 0.1)",
    warning: "rgba(245, 158, 11, 0.1)",
    error: "rgba(239, 68, 68, 0.1)"
  };
  
  const textColors = {
    info: "var(--blue-500, #3b82f6)",
    success: "var(--green-500, #10b981)",
    warning: "var(--amber-500, #f59e0b)",
    error: "var(--red-500, #ef4444)"
  };
  
  return (
    <div className="p-3 rounded-md text-sm flex items-start mb-4" 
         style={{ 
           backgroundColor: bgColors[type],
           color: textColors[type]
         }}>
      <div>{children}</div>
      {onDismiss && (
        <button 
          onClick={onDismiss}
          className="ml-auto flex-shrink-0 opacity-70 hover:opacity-100"
          aria-label="Dismiss"
        >
          ×
        </button>
      )}
    </div>
  );
};

// Main Auth Component
const AuthComponent = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  
  // Track connectivity status
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  
  // Verification states
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneVerificationCode, setPhoneVerificationCode] = useState('');
  const [resendingCode, setResendingCode] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  
  // Add state to track if verification code has been sent
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);
  
  // Track if the component is in dark mode for UI appearance
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  const { 
    signup, 
    login, 
    googleLogin, 
    verificationStage, 
    verificationEmail,
    sendEmailVerificationCode,
    verifyEmailCode,
    sendPhoneVerificationCode,
    verifyPhoneCode,
    skipVerification // For development only
  } = useAuth();

  // Check if preferred color scheme is dark and monitor online status
  useEffect(() => {
    if (typeof window === 'undefined') return; // Skip on server side
    
    // Check for dark mode preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
    
    // Check for dark theme
    const darkThemeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleDarkThemeChange = (e) => {
      setIsDarkMode(e.matches);
    };
    
    // Setup online/offline detection
    const handleOnline = () => {
      setIsOnline(true);
      setStatusMessage("Connection restored");
      // Clear the message after 3 seconds
      setTimeout(() => setStatusMessage(""), 3000);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setStatusMessage("You are offline. Some features may be unavailable.");
    };
    
    // Add event listeners
    darkThemeMediaQuery.addEventListener('change', handleDarkThemeChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Set initial online status
    setIsOnline(navigator.onLine);
    
    return () => {
      darkThemeMediaQuery.removeEventListener('change', handleDarkThemeChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Auto-fill "1234" for verification code when in development mode
  useEffect(() => {
    if (typeof window === 'undefined') return; // Skip on server side
    
    if (process.env.NODE_ENV === 'development') {
      if (verificationStage === 'email' && emailVerificationCode === '') {
        setEmailVerificationCode('1234');
      } else if (verificationStage === 'phone' && phoneVerificationCode === '' && phoneCodeSent) {
        // Only auto-fill phone code if the send button has been clicked
        setPhoneVerificationCode('1234');
      }
    }
  }, [verificationStage, phoneCodeSent, emailVerificationCode, phoneVerificationCode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleView = () => {
    setIsLogin(!isLogin);
    setError("");
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }
    
    // Password validation for signup
    if (!isLogin) {
      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters");
        return false;
      }
      
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Show initial status message
      setError("Connecting to authentication server...");
      
      // Add a small delay so users can see the "connecting" message
      // This provides better feedback when the server responds very quickly
      const startTime = Date.now();
      
      // Perform login or signup
      if (isLogin) {
        const userData = await login(formData.email, formData.password);
        console.log("Login successful:", userData);
      } else {
        const userData = await signup(formData.email, formData.password);
        console.log("Signup successful:", userData);
      }
      
      // Ensure the loading state is visible for at least 500ms
      // This prevents UI flashing when the server responds too quickly
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < 500) {
        await new Promise(resolve => setTimeout(resolve, 500 - elapsedTime));
      }
      
      // Clear any error messages on success
      setError("");
    } catch (error) {
      console.error("Authentication error:", error);
      
      // Provide user-friendly error messages based on error type
      if (error.message.includes("connect to the") || 
          error.message.includes("Failed to fetch") ||
          error.message.includes("Network error")) {
        
        // Special handling for test credentials in development mode
        if (process.env.NODE_ENV === 'development' && 
            formData.email === 'test@example.com' && 
            formData.password === 'password123') {
          
          setError("Development mode: Unable to connect to authentication server, but test credentials accepted.");
          
          // Add a small delay to show the message before proceeding
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Clear error and let the auth flow proceed
          // The fallback in AuthContext.jsx should handle this
          setError("");
          return;
        }
        
        setError("Unable to connect to the authentication server. Please check your internet connection and try again later.");
      } else if (error.message.includes("Invalid email or password")) {
        setError("Invalid email or password. Please try again.");
      } else if (error.message.includes("User with this email already exists")) {
        setError("An account with this email already exists. Please use a different email or try logging in.");
      } else if (error.message.includes("Server error")) {
        setError("Our servers are experiencing issues. Please try again later.");
      } else {
        // Fallback error message - use the error message from the server if available
        setError(error.message || "Authentication failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError(""); // Clear any previous errors
    
    try {
      console.log("Google OAuth Response:", credentialResponse);
      
      if (!credentialResponse.credential) {
        throw new Error("No credential received from Google");
      }
      
      console.log("Google Credential Token:", credentialResponse.credential);
      
      // Display a user-friendly message while we process
      // This gives visual feedback even if there's a delay
      setError("Connecting to authentication server...");
      
      const userData = await googleLogin(credentialResponse.credential);
      
      // Clear the processing message when successful
      setError("");
      
      console.log("Google authentication successful:", userData);
    } catch (error) {
      console.error("Google authentication error:", error);
      
      // Provide user-friendly error messages based on error type
      if (error.message.includes("connect to the authentication server") || 
          error.message.includes("Network error")) {
        setError("Unable to connect to the authentication server. Please check your internet connection and try again.");
      } else if (error.message.includes("Invalid email or password")) {
        setError("Google authentication failed. This email may already be registered with a password.");
      } else if (error.message.includes("credential")) {
        setError("Failed to get credentials from Google. Please try again.");
      } else {
        // Fallback error message
        setError(error.message || "Google sign in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google sign in failed. Please try again.");
  };

  // Handle email verification
  const handleResendEmailCode = async () => {
    if (resendCooldown > 0) return;
    
    setResendingCode(true);
    try {
      await sendEmailVerificationCode(verificationEmail);
      setResendCooldown(30); // 30 second cooldown
    } catch (error) {
      setError("Failed to resend verification code. Please try again.");
    } finally {
      setResendingCode(false);
    }
  };

  const handleVerifyEmail = async () => {
    // Debug helper - always accept 1234
    if (emailVerificationCode === "1234") {
      setLoading(true);
      try {
        await verifyEmailCode(verificationEmail, emailVerificationCode);
        setEmailVerificationCode('');
        setError('');
      } catch (error) {
        console.error("Verification error:", error);
        // Even if API fails, continue with verification for testing
        skipVerification();
      } finally {
        setLoading(false);
      }
      return;
    }
    
    if (emailVerificationCode.length !== 4) {
      setError("Please enter the 4-digit verification code");
      return;
    }
    
    setLoading(true);
    try {
      await verifyEmailCode(verificationEmail, emailVerificationCode);
      setEmailVerificationCode('');
      setError('');
    } catch (error) {
      setError(error.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  // Handle phone verification
  const handleSendPhoneCode = async () => {
    // Basic phone validation
    if (!phoneNumber || phoneNumber.length < 10) {
      setError("Please enter a valid phone number");
      return;
    }
    
    setLoading(true);
    try {
      const result = await sendPhoneVerificationCode(phoneNumber);
      if (!result) {
        throw new Error("Failed to send verification code");
      }
      setError('');
      setResendCooldown(30); // 30 second cooldown
      
      // Set phoneCodeSent to true to indicate code has been sent
      setPhoneCodeSent(true);
    } catch (error) {
      if (error.message && error.message.includes("already registered")) {
        setError("This phone number is already registered. Please try another number.");
      } else {
        setError(error.message || "Failed to send verification code");
      }
      
      // In development mode, allow proceeding even if API fails
      if (process.env.NODE_ENV === 'development') {
        setPhoneCodeSent(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhone = async () => {
    // Debug helper - always accept 1234
    if (phoneVerificationCode === "1234") {
      setLoading(true);
      try {
        await verifyPhoneCode(phoneNumber, phoneVerificationCode);
        setPhoneVerificationCode('');
        setError('');
      } catch (error) {
        console.error("Verification error:", error);
        // Even if API fails, continue with verification for testing
        skipVerification();
      } finally {
        setLoading(false);
      }
      return;
    }
    
    if (phoneVerificationCode.length !== 4) {
      setError("Please enter the 4-digit verification code");
      return;
    }
    
    setLoading(true);
    try {
      await verifyPhoneCode(phoneNumber, phoneVerificationCode);
      setPhoneVerificationCode('');
      setError('');
    } catch (error) {
      setError(error.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePhoneNumber = () => {
    setPhoneNumber('');
    setPhoneCodeSent(false);
    setPhoneVerificationCode('');
  };

  // Render email verification screen
  const renderEmailVerification = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Mail className="w-12 h-12 mx-auto mb-2" style={{ color: 'var(--blue-500, #3b82f6)' }} />
        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
          Verify your email
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
          We've sent a verification code to<br />
          <span className="font-medium" style={{ color: 'var(--blue-500, #3b82f6)' }}>{verificationEmail}</span>
        </p>
      </div>

      {!isOnline && (
        <Alert type="warning">
          You are offline. Verification services may be unavailable. In development mode, you can continue using test code 1234.
        </Alert>
      )}

      <div className="space-y-4">
        <div className="text-center">
          <Label htmlFor="verificationCode">Enter the 4-digit verification code</Label>
          <VerificationInput 
            value={emailVerificationCode}
            onChange={setEmailVerificationCode}
            loading={loading}
          />
        </div>

        {error && (
          <div className="text-sm text-center" style={{ color: '#ef4444' }}>
            {error}
          </div>
        )}

        <Button 
          onClick={handleVerifyEmail} 
          className="w-full"
          disabled={loading}
        >
          {loading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</>
          ) : (
            <>Verify Email <ArrowRight className="ml-2 h-4 w-4" /></>
          )}
        </Button>

        <div className="flex flex-col sm:flex-row justify-between items-center text-sm gap-2">
          <button
            onClick={handleResendEmailCode}
            disabled={resendingCode || resendCooldown > 0}
            className={`flex items-center ${
              (resendingCode || resendCooldown > 0) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            style={{ color: 'var(--blue-500, #3b82f6)' }}
          >
            {resendingCode ? (
              <><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Sending...</>
            ) : resendCooldown > 0 ? (
              <>Resend in {resendCooldown}s</>
            ) : (
              <>Resend code</>
            )}
          </button>
          
          {/* For development only - remove in production */}
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={skipVerification}
              className="text-xs opacity-50 hover:opacity-70"
              style={{ color: 'var(--foreground)' }}
            >
              Skip verification (test only)
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Render phone verification screen
  const renderPhoneVerification = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Phone className="w-12 h-12 mx-auto mb-2" style={{ color: 'var(--blue-500, #3b82f6)' }} />
        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
          Secure your account
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
          Add a phone number to protect your account
        </p>
      </div>

      {!isOnline && (
        <Alert type="warning">
          You are offline. Verification services may be unavailable. In development mode, you can continue using test code 1234.
        </Alert>
      )}

      <div className="space-y-4">
        {!phoneCodeSent && (
          <>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="Enter your phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>

            <Button 
              onClick={handleSendPhoneCode} 
              className="w-full"
              disabled={loading || !phoneNumber}
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
              ) : (
                <>Send Verification Code</>
              )}
            </Button>
          </>
        )}

        {phoneCodeSent && (
          <>
            <div className="p-3 rounded-md text-sm flex items-start" 
                style={{ 
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                }}>
              <Shield className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" style={{ color: 'var(--blue-500, #3b82f6)' }} />
              <div>
                <p className="font-medium" style={{ color: 'var(--blue-500, #3b82f6)' }}>Verification code sent</p>
                <p style={{ color: 'var(--blue-500, #3b82f6)', opacity: 0.8 }}>
                  We've sent a code to <span className="font-medium">{phoneNumber}</span>
                </p>
              </div>
            </div>

            <div className="text-center">
              <Label htmlFor="phoneVerificationCode">Enter the 4-digit verification code</Label>
              <VerificationInput 
                value={phoneVerificationCode}
                onChange={setPhoneVerificationCode}
                loading={loading}
              />
            </div>

            {error && (
              <div className="text-sm text-center" style={{ color: '#ef4444' }}>
                {error}
              </div>
            )}

            <Button 
              onClick={handleVerifyPhone} 
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</>
              ) : (
                <>Verify Phone <ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>

            <div className="flex flex-col sm:flex-row justify-between items-center text-sm gap-2">
              <button
                onClick={handleSendPhoneCode}
                disabled={loading || resendCooldown > 0}
                className={`flex items-center ${
                  (loading || resendCooldown > 0) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                style={{ color: 'var(--blue-500, #3b82f6)' }}
              >
                {loading ? (
                  <><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Sending...</>
                ) : resendCooldown > 0 ? (
                  <>Resend in {resendCooldown}s</>
                ) : (
                  <>Resend code</>
                )}
              </button>
              <button
                onClick={handleChangePhoneNumber}
                style={{ color: 'var(--foreground)', opacity: 0.7 }}
                className="hover:opacity-100"
              >
                Change number
              </button>
            </div>
            
            {/* For development only - remove in production */}
            {process.env.NODE_ENV === 'development' && (
              <div className="text-center">
                <button
                  onClick={skipVerification}
                  className="text-xs opacity-50 hover:opacity-70"
                  style={{ color: 'var(--foreground)' }}
                >
                  Skip verification (test only)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  // Render login/signup or verification screens based on verification stage
  const renderAuthContent = () => {
    if (verificationStage === 'email') {
      return renderEmailVerification();
    } else if (verificationStage === 'phone') {
      return renderPhoneVerification();
    } else {
      // Default login/signup screen
      return (
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
              {isLogin ? "Sign in to your account" : "Create an account"}
            </h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
              {isLogin 
                ? "Sign in to continue to the image editor" 
                : "Sign up to get access to all features"}
            </p>
          </div>

          {statusMessage && (
            <Alert type={isOnline ? "success" : "warning"} onDismiss={() => setStatusMessage("")}>
              {statusMessage}
            </Alert>
          )}

          {!isOnline && (
            <Alert type="warning">
              You are offline. Authentication services may be unavailable. In development mode, you can still log in with test credentials.
            </Alert>
          )}

          <div className="w-full flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme={isDarkMode ? "filled_black" : "filled_blue"}
              size="large"
              shape="rectangular"
              text={isLogin ? "signin_with" : "signup_with"}
              width="100%"
              disabled={!isOnline && process.env.NODE_ENV !== 'development'}
            />
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2" style={{ 
                backgroundColor: 'var(--background)',
                color: 'var(--foreground)',
                opacity: 0.7
              }}>
                Or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormGroup>
              <Label htmlFor="email">Email address</Label>
              <Input 
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </FormGroup>

            {!isLogin && (
              <FormGroup>
                <Label htmlFor="confirmPassword">Reenter password</Label>
                <Input 
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </FormGroup>
            )}

            {error && (
              <div className="text-sm" style={{ color: '#ef4444' }}>
                {error}
              </div>
            )}

            {!isLogin && (
              <div className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                By signing up, you agree to our{" "}
                <a href="#" style={{ color: 'var(--blue-500, #3b82f6)' }} className="hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" style={{ color: 'var(--blue-500, #3b82f6)' }} className="hover:underline">
                  Privacy Policy
                </a>
                .
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
              ) : isLogin ? (
                "Sign In"
              ) : (
                "Sign Up"
              )}
            </Button>
          </form>

          <div className="text-center text-sm" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
            {isLogin ? (
              <>
                Don't have an account?{" "}
                <button 
                  onClick={toggleView} 
                  style={{ color: 'var(--blue-500, #3b82f6)' }}
                  className="hover:underline"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button 
                  onClick={toggleView} 
                  style={{ color: 'var(--blue-500, #3b82f6)' }}
                  className="hover:underline"
                >
                  Log in
                </button>
              </>
            )}
          </div>
          
          {/* Test credentials notice */}
          <div className="mt-4 p-3 rounded-md text-xs" style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            color: 'var(--foreground)',
            opacity: 0.7
          }}>
            <p className="font-medium mb-1">Test credentials:</p>
            <p>Email: test@example.com</p>
            <p>Password: password123</p>
            <p className="mt-1">Verification code: 1234</p>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 sm:p-6 rounded-xl shadow-lg" style={{ backgroundColor: 'var(--background)' }}>
      {renderAuthContent()}
    </div>
  );
};

// Use Next.js dynamic import to avoid SSR issues with animations
export default dynamic(() => Promise.resolve(AuthComponent), { ssr: false });