// Fixed AuthComponent.jsx with Dark Theme and Improved Verification
import React, { useState, useEffect } from "react";
import { useMotionTemplate, useMotionValue, motion } from "motion/react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { IconBrandGoogle } from "@tabler/icons-react";
import { useAuth } from './AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { Loader2, Mail, Phone, Shield, ArrowRight, RefreshCw } from 'lucide-react';

// Utility function for class name merging
const cn = (...inputs) => {
  const merge = (acc, obj) => {
    if (obj === null || obj === undefined || obj === false) return acc;
    if (typeof obj === "string") return [...acc, obj];
    return [...acc, ...Object.keys(obj).filter(k => obj[k]).map(k => k)];
  };
  return inputs.reduce((acc, obj) => merge(acc, obj), []).join(" ");
};

// Input Component
const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  const radius = 100;
  const [visible, setVisible] = useState(false);
  let mouseX = useMotionValue(0);
  let mouseY = useMotionValue(0);
  
  function handleMouseMove({ currentTarget, clientX, clientY }) {
    let { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }
  
  return (
    <motion.div
      style={{
        background: useMotionTemplate`
          radial-gradient(
            ${visible ? radius + "px" : "0px"} circle at ${mouseX}px ${mouseY}px,
            #3b82f6,
            transparent 80%
          )
        `,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      className="group/input rounded-lg p-[2px] transition duration-300"
    >
      <input
        type={type}
        className={cn(
          "shadow-input dark:placeholder-text-neutral-600 flex h-10 w-full rounded-md border-none bg-gray-50 px-3 py-2 text-sm text-black transition duration-400 group-hover/input:shadow-none file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-400 focus-visible:ring-[2px] focus-visible:ring-neutral-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-800 dark:text-white dark:shadow-[0px_0px_1px_1px_#404040] dark:focus-visible:ring-neutral-600",
          className
        )}
        ref={ref}
        {...props}
      />
    </motion.div>
  );
});

Input.displayName = "Input";

// Label Component
const Label = React.forwardRef(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      "text-sm font-medium text-black dark:text-white leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className
    )}
    {...props}
  />
));

Label.displayName = LabelPrimitive.Root.displayName;

// Button Component
const Button = React.forwardRef(({ className, children, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none h-10 py-2 px-4 bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700",
      className
    )}
    {...props}
  >
    {children}
  </button>
));

Button.displayName = "Button";

// Verification Code Input Component - Improved for dark theme
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
    
    // Auto submit when code is complete
    if (e.key === 'Enter' && value.length === length) {
      // Trigger submit
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
    <div className={`flex gap-2 my-4 ${loading ? 'opacity-50' : ''}`}>
      {Array(length).fill(0).map((_, index) => (
        <input
          key={index}
          ref={inputRefs[index]}
          type="text"
          maxLength="1"
          className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-zinc-800 dark:border-gray-700 dark:text-white"
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

// Auth Component
const AuthComponent = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Verification states
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneVerificationCode, setPhoneVerificationCode] = useState('');
  const [resendingCode, setResendingCode] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  
  // Add state to track if verification code has been sent - fixes premature progression
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

  // Check if preferred color scheme is dark
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
    
    // Check for dark theme
    const darkThemeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleDarkThemeChange = (e) => {
      setIsDarkMode(e.matches);
    };
    
    darkThemeMediaQuery.addEventListener('change', handleDarkThemeChange);
    
    return () => {
      darkThemeMediaQuery.removeEventListener('change', handleDarkThemeChange);
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
    if (process.env.NODE_ENV === 'development') {
      if (verificationStage === 'email' && emailVerificationCode === '') {
        setEmailVerificationCode('1234');
      } else if (verificationStage === 'phone' && phoneVerificationCode === '' && phoneCodeSent) {
        // Only auto-fill phone code if the send button has been clicked
        setPhoneVerificationCode('1234');
      }
    }
  }, [verificationStage, phoneCodeSent]);

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
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await signup(formData.email, formData.password);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = (credentialResponse) => {
    setLoading(true);
    try {
      console.log("Google OAuth Response:", credentialResponse);
      console.log("Google Credential Token:", credentialResponse.credential);
      googleLogin(credentialResponse.credential);
    } catch (error) {
      setError(error.message);
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
        <Mail className="w-12 h-12 mx-auto text-blue-500 mb-2" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Verify your email
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          We've sent a verification code to<br />
          <span className="font-medium text-blue-600 dark:text-blue-400">{verificationEmail}</span>
        </p>
      </div>

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
          <div className="text-sm text-red-500 text-center">
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

        <div className="flex justify-between items-center text-sm">
          <button
            onClick={handleResendEmailCode}
            disabled={resendingCode || resendCooldown > 0}
            className={`text-blue-600 hover:underline dark:text-blue-400 flex items-center ${
              (resendingCode || resendCooldown > 0) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
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
          <button
            onClick={skipVerification}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400 text-xs"
          >
            Skip verification (test only)
          </button>
        </div>
      </div>
    </div>
  );

  // Render phone verification screen
  const renderPhoneVerification = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Phone className="w-12 h-12 mx-auto text-blue-500 mb-2" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Secure your account
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Add a phone number to protect your account
        </p>
      </div>

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
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md text-sm flex items-start">
              <Shield className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800 dark:text-blue-300">Verification code sent</p>
                <p className="text-blue-600 dark:text-blue-400">
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
              <div className="text-sm text-red-500 text-center">
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

            <div className="flex justify-between items-center text-sm">
              <button
                onClick={handleSendPhoneCode}
                disabled={loading || resendCooldown > 0}
                className={`text-blue-600 hover:underline dark:text-blue-400 flex items-center ${
                  (loading || resendCooldown > 0) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
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
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                Change number
              </button>
            </div>
            
            {/* For development only - remove in production */}
            <div className="text-center">
              <button
                onClick={skipVerification}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400 text-xs"
              >
                Skip verification (test only)
              </button>
            </div>
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isLogin ? "Sign in to your account" : "Create an account"}
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {isLogin 
                ? "Sign in to continue to the image editor" 
                : "Sign up to get access to all features"}
            </p>
          </div>

          <div className="w-full flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme={isDarkMode ? "filled_black" : "filled_blue"}
              size="large"
              shape="rectangular"
              text={isLogin ? "signin_with" : "signup_with"}
              width="100%"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white dark:bg-zinc-900 text-gray-500 dark:text-gray-400">
                Or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
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
            </div>

            <div className="space-y-2">
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
            </div>

            {!isLogin && (
              <div className="space-y-2">
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
              </div>
            )}

            {error && (
              <div className="text-sm text-red-500">
                {error}
              </div>
            )}

            {!isLogin && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                By signing up, you agree to our{" "}
                <a href="#" className="text-blue-600 hover:underline dark:text-blue-500">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-blue-600 hover:underline dark:text-blue-500">
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

          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            {isLogin ? (
              <>
                Don't have an account?{" "}
                <button 
                  onClick={toggleView} 
                  className="text-blue-600 hover:underline dark:text-blue-500"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button 
                  onClick={toggleView} 
                  className="text-blue-600 hover:underline dark:text-blue-500"
                >
                  Log in
                </button>
              </>
            )}
          </div>
          
          {/* Test credentials notice */}
          <div className="mt-4 p-3 bg-gray-100 dark:bg-zinc-800 rounded-md text-xs text-gray-600 dark:text-gray-400">
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
    <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-zinc-900 rounded-xl shadow-lg">
      {renderAuthContent()}
    </div>
  );
};

export default AuthComponent;