// Updated TokenStore.jsx with improved redirect handling, verification, and security
import React, { useState, useEffect } from 'react';
import { ChevronLeft, CreditCard, Coins, Check, ArrowRight, Package } from 'lucide-react';
import { useAuth } from './AuthContext';

const TokenStore = ({ onClose }) => {
  const [packages, setPackages] = useState([]);
  const [processingPackageId, setProcessingPackageId] = useState(null);
  const [error, setError] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [orderStatus, setOrderStatus] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [cashfreeReady, setCashfreeReady] = useState(false);
  const [tunnelUrl, setTunnelUrl] = useState("");
  const [debugLog, setDebugLog] = useState([]);
  
  // Get auth context to update user tokens
  const { currentUser, updateUserTokens, refreshUserData } = useAuth();

  // Add debug logging function to track the component's behavior
  const log = (message, data = null) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      message,
      data
    };
    console.log(`[TokenStore] ${message}`, data || '');
    setDebugLog(prev => [logEntry, ...prev]);
  };

  // Inject custom styles to ensure proper text rendering
  useEffect(() => {
    log("TokenStore component mounted");

    // Style injection code
    const style = document.createElement('style');
    style.innerHTML = `
      #token-store-container * {
        box-sizing: border-box;
      }
      
      #token-store-container h1, 
      #token-store-container h2, 
      #token-store-container h3, 
      #token-store-container h4, 
      #token-store-container p, 
      #token-store-container span, 
      #token-store-container div {
        color: #000000 !important;
        font-weight: 400 !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
      log("TokenStore component unmounted");
    };
  }, []);

  // Check if Cashfree SDK is loaded
  useEffect(() => {
    const checkCashfreeLoaded = () => {
      if (window.Cashfree) {
        setCashfreeReady(true);
        log("Cashfree SDK loaded");
        return true;
      }
      return false;
    };

    if (checkCashfreeLoaded()) return;

    // If not loaded, set up listener for when script loads
    const handleScriptLoad = () => {
      if (checkCashfreeLoaded()) {
        document.removeEventListener('cashfree-sdk-loaded', handleScriptLoad);
      }
    };

    document.addEventListener('cashfree-sdk-loaded', handleScriptLoad);

    // If script takes too long, try to load it directly
    const timeout = setTimeout(() => {
      if (!window.Cashfree) {
        log('Cashfree SDK not loaded automatically, trying manual load');
        const script = document.createElement('script');
        script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
        script.async = true;
        script.onload = () => {
          setCashfreeReady(true);
          log("Cashfree SDK manually loaded");
        };
        document.head.appendChild(script);
      }
    }, 2000);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('cashfree-sdk-loaded', handleScriptLoad);
    };
  }, []);

  // Prompt for Localtunnel URL when component loads
  useEffect(() => {
    const savedTunnelUrl = sessionStorage.getItem('tunnelUrl');
    
    if (savedTunnelUrl) {
      setTunnelUrl(savedTunnelUrl);
      log("Using saved Localtunnel URL:", savedTunnelUrl);
    } else {
      const url = prompt("Enter your Localtunnel URL (e.g., https://something.loca.lt):");
      if (url) {
        sessionStorage.setItem('tunnelUrl', url);
        setTunnelUrl(url);
        log("New Localtunnel URL saved:", url);
      }
    }
  }, []);

  // Enhanced check for URL parameters after payment return
  useEffect(() => {
    // Log current URL for debugging
    log('Checking URL parameters for payment redirect...', window.location.search);
    
    const checkUrlAndVerifyPayment = async () => {
      try {
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const orderIdFromUrl = urlParams.get('order_id');
        const paymentReturn = urlParams.get('payment') === 'return';
        
        log('URL parameters check', { orderIdFromUrl, paymentReturn, search: window.location.search });
        
        if (orderIdFromUrl || paymentReturn) {
          log('🔍 Payment return detected in URL!');
          
          // Get the order ID to verify
          const orderToVerify = orderIdFromUrl || orderId;
          
          if (orderToVerify) {
            log(`Order ID to verify: ${orderToVerify}`);
            
            // Set order ID in state if it's from URL
            if (orderIdFromUrl && orderIdFromUrl !== orderId) {
              log('Setting order ID from URL parameter');
              setOrderId(orderIdFromUrl);
            }
            
            // Clear URL parameters without refreshing the page
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Try to find package ID from session storage
            let packageId = null;
            try {
              const pendingOrderData = JSON.parse(sessionStorage.getItem('pendingOrder') || '{}');
              log('Pending order data from session:', pendingOrderData);
              
              if (pendingOrderData.id === orderToVerify) {
                packageId = pendingOrderData.packageId;
                log(`Found package ID in session: ${packageId}`);
              }
            } catch (err) {
              log('Error parsing pending order:', err);
            }
            
            // Start payment verification - add extra logging
            log('Starting payment verification sequence for order:', orderToVerify);
            
            const success = await verifyPaymentAndUpdateTokens(orderToVerify, packageId);
            log('Initial verification result:', success);
            
            if (!success) {
              // Try again with delays if first attempt fails
              log('First verification attempt failed, trying again in 2 seconds');
              setTimeout(async () => {
                log('Running delayed verification attempt');
                await verifyPaymentAndUpdateTokens(orderToVerify, packageId);
              }, 2000);
            }
          } else {
            log('No order ID found for verification');
          }
        } else {
          // Check session storage for pending orders
          log('No payment return parameters in URL, checking session storage');
          const pendingOrder = sessionStorage.getItem('pendingOrder');
          
          if (pendingOrder) {
            try {
              const { id, packageId } = JSON.parse(pendingOrder);
              log(`Found pending order ${id} in session, verifying...`);
              
              if (!orderId) {
                setOrderId(id);
                log(`Setting order ID from session storage: ${id}`);
              }
              
              // Verify this pending order in case it completed elsewhere
              await verifyPaymentAndUpdateTokens(id, packageId);
            } catch (err) {
              log('Error processing pending order:', err);
            }
          }
        }
      } catch (err) {
        log('Error in checkUrlAndVerifyPayment:', err);
        setError(`Error checking payment status: ${err.message}`);
      }
    };
    
    // Run check when component mounts
    checkUrlAndVerifyPayment();
  }, []);

  // Fetch available token packages
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setProcessingPackageId('loading-packages');
        log('Fetching available token packages');
        
        const response = await fetch('http://localhost:8000/packages');
        if (!response.ok) {
          throw new Error('Failed to fetch packages');
        }
        const data = await response.json();
        log('Packages fetched successfully', data);
        setPackages(data);
      } catch (err) {
        log('Error fetching packages:', err);
        setError(err.message);
      } finally {
        setProcessingPackageId(null);
      }
    };

    fetchPackages();
  }, []);

  // Enhanced handlePurchase function with security
  const handlePurchase = async (packageId) => {
    try {
      setProcessingPackageId(packageId);
      setError(null);
      log(`Initiating purchase for package: ${packageId}`);
      
      // Get the return URL
      const baseUrl = window.location.origin;
      const returnUrl = `${baseUrl}/?payment=return`;
      
      log(`Return URL set to: ${returnUrl}`);
      
      // Create webhook URL if Localtunnel is available
      let createOrderUrl = `http://localhost:8000/create-order?package_id=${packageId}&return_url=${encodeURIComponent(returnUrl)}`;
      
      // Add webhook URL and user ID if available
      if (tunnelUrl) {
        const webhookUrl = `${tunnelUrl}/webhook`;
        createOrderUrl += `&webhook_url=${encodeURIComponent(webhookUrl)}`;
        log(`Webhook URL set to: ${webhookUrl}`);
      } else {
        log('No tunnel URL available, webhook notifications may not work');
      }
      
      // Add user ID if available - REQUIRED for security
      if (currentUser?.id) {
        createOrderUrl += `&user_id=${currentUser.id}`;
        log(`Adding user_id to request: ${currentUser.id}`);
      } else {
        log('Warning: No user ID available for this purchase');
        setError('You must be logged in to make a purchase');
        setProcessingPackageId(null);
        return;
      }
      
      // Call the create-order endpoint
      log(`Calling create-order API: ${createOrderUrl}`);
      const response = await fetch(createOrderUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create order');
      }
      
      const data = await response.json();
      log('Order created successfully', data);
      
      // Store the order ID and data
      setOrderId(data.order_id);
      setOrderData(data);
      
      // Save order details to session storage with security tokens
      const orderDetails = {
        id: data.order_id, 
        packageId,
        amount: packages.find(p => p.id === packageId)?.price || 199,
        created: new Date().toISOString(),
        // Store security tokens if available
        paymentToken: data.payment_token || null,
        paymentNonce: data.payment_nonce || null
      };
      
      sessionStorage.setItem('pendingOrder', JSON.stringify(orderDetails));
      log('Saved order details to session storage', orderDetails);
      
      // Initialize Cashfree SDK and start checkout
      if (window.Cashfree && data.payment_session_id) {
        log('Starting Cashfree checkout with session ID', data.payment_session_id);
        
        const cashfree = window.Cashfree({
          mode: "sandbox" // Use "production" for live environment
        });
        
        // Build a proper returnUrl that includes the order ID
        const fullReturnUrl = `${returnUrl}&order_id=${data.order_id}`;
        log('Full return URL:', fullReturnUrl);
        
        // Open Cashfree checkout
        cashfree.checkout({
          paymentSessionId: data.payment_session_id,
          redirectTarget: "_self", // Using _self to open in same tab
          returnUrl: fullReturnUrl
        });
        
        log('Cashfree checkout initiated');
      } else {
        if (!window.Cashfree) {
          throw new Error('Cashfree SDK not loaded. Please refresh and try again.');
        } else if (!data.payment_session_id) {
          throw new Error('No payment session ID received from server.');
        }
      }
      
    } catch (err) {
      log('Error initiating payment:', err);
      setError(err.message);
      setProcessingPackageId(null);
    }
  };

  // Enhanced verification function with security tokens
  const verifyPaymentAndUpdateTokens = async (orderIdToVerify, packageId = null) => {
    if (!orderIdToVerify) {
      log('Cannot verify payment: No order ID provided');
      return false;
    }
    
    try {
      setProcessingPackageId('verifying-payment');
      log(`⏳ Verifying payment for order: ${orderIdToVerify}, package: ${packageId || 'unknown'}`);
      
      // Get security tokens from session storage
      let paymentToken = null;
      let paymentNonce = null;
      
      try {
        const pendingOrderData = JSON.parse(sessionStorage.getItem('pendingOrder') || '{}');
        log('Pending order data from session:', pendingOrderData);
        
        if (pendingOrderData.id === orderIdToVerify) {
          packageId = pendingOrderData.packageId || packageId;
          paymentToken = pendingOrderData.paymentToken;
          paymentNonce = pendingOrderData.paymentNonce;
          log(`Found security tokens in session: token=${!!paymentToken}, nonce=${!!paymentNonce}`);
        }
      } catch (err) {
        log('Error parsing pending order:', err);
      }
      
      // Build secure verification URL with tokens
      let verifyUrl = `http://localhost:8000/verify-payment/${orderIdToVerify}`;
      const params = [];
      
      // Add user_id to verification endpoint (REQUIRED for security)
      if (currentUser?.id) {
        params.push(`user_id=${currentUser.id}`);
        log(`Adding user_id to verification: ${currentUser.id}`);
      } else {
        log('Error: No user ID available for verification');
        setError('Authentication required to verify payment');
        setProcessingPackageId(null);
        return false;
      }
      
      // Add security tokens if available
      if (paymentToken) {
        params.push(`payment_token=${encodeURIComponent(paymentToken)}`);
        log('Adding payment token to verification request');
      }
      
      if (paymentNonce) {
        params.push(`payment_nonce=${encodeURIComponent(paymentNonce)}`);
        log('Adding payment nonce to verification request');
      }
      
      // Append all parameters
      if (params.length > 0) {
        verifyUrl += `?${params.join('&')}`;
      }
      
      // Make API call to backend to verify payment status
      log(`Making API call to: ${verifyUrl}`);
      const response = await fetch(verifyUrl);
      log(`📡 Verification API response status: ${response.status}`);
      
      if (!response.ok) {
        log(`Verification API error: ${response.status}`);
        throw new Error(`Failed to verify payment: ${response.status}`);
      }
      
      // Parse response data
      const data = await response.json();
      log('📊 Verification response data:', data);
      
      // Check for error messages in the response
      if (data.status === 'error') {
        log(`Verification error: ${data.message}`);
        setError(data.message || 'Failed to verify payment');
        return false;
      }
      
      // Check for payment already processed
      if (data.status === 'already_processed') {
        log('Payment was already processed');
        await refreshUserData(); // Refresh user data to get updated token count
        
        // Update order status in state
        const updatedStatus = {
          order_id: orderIdToVerify,
          status: 'PAID',
          amount: data.order_amount || 0,
          currency: data.order_currency || 'INR'
        };
        
        setOrderStatus(updatedStatus);
        setOrderData(null); // Reset orderData to show success screen
        
        // Clean up
        sessionStorage.removeItem('pendingOrder');
        log('Removed pending order from session storage');
        
        return true;
      }
      
      // Check if payment is successful
      let isPaid = data.order_status === 'PAID';
      
      // Look for successful payments if the order isn't already marked as PAID
      if (!isPaid && data.payments && Array.isArray(data.payments)) {
        isPaid = data.payments.some(payment => 
          payment.payment_status === 'SUCCESS' || 
          payment.payment_status === 'COMPLETED'
        );
        log(`Payment status determined from payments array: isPaid=${isPaid}`);
      }
      
      // Update order status in state
      const updatedStatus = {
        order_id: data.order_id,
        status: isPaid ? 'PAID' : data.order_status,
        amount: data.order_amount,
        currency: data.order_currency
      };
      
      log('Updating order status in state:', updatedStatus);
      setOrderStatus(updatedStatus);
      
      // Check if tokens were updated directly by the server
      if (data.token_update && data.token_update.success) {
        log('🎉 Tokens already updated by server!', data.token_update);
        await refreshUserData();
        
        // Reset orderData to show success screen
        setOrderData(null);
        
        // Clean up
        sessionStorage.removeItem('pendingOrder');
        log('Removed pending order from session storage');
        
        return true;
      }
      
      // Check if payment is successful but tokens not yet updated
      if (isPaid || data.order_status === 'PAID') {
        log('🎉 PAYMENT IS CONFIRMED PAID! Updating tokens...');
        
        // Determine token amount to add
        let tokenAmount = 0;
        
        // Method 1: Use provided packageId
        if (packageId) {
          const packageObj = packages.find(pkg => pkg.id === packageId);
          if (packageObj) {
            tokenAmount = packageObj.tokens;
            log(`Determined token amount from package ID: ${tokenAmount}`);
          }
        }
        
        // Method 2: Match by price if package ID didn't work
        if (!tokenAmount) {
          const amount = parseFloat(data.order_amount);
          const matchingPackage = packages.find(pkg => Math.abs(pkg.price - amount) < 1);
          
          if (matchingPackage) {
            tokenAmount = matchingPackage.tokens;
            log(`Determined token amount from price match: ${tokenAmount}`);
          } else {
            // Method 3: Fallback to hardcoded values
            if (Math.abs(amount - 199) < 1) tokenAmount = 100;
            else if (Math.abs(amount - 499) < 1) tokenAmount = 300;
            else if (Math.abs(amount - 999) < 1) tokenAmount = 800;
            log(`Determined token amount from hardcoded values: ${tokenAmount}`);
          }
        }
        
        // Update tokens if we determined an amount
        if (tokenAmount > 0 && currentUser) {
          const currentTokens = currentUser?.tokens || 0;
          const newTotal = currentTokens + tokenAmount;
          
          log(`Updating tokens: ${currentTokens} + ${tokenAmount} = ${newTotal}`);
          
          // Update tokens in the database
          try {
            const success = await updateUserTokens(newTotal);
            if (success) {
              log('✅ Token update successful!');
              
              // Refresh user data from backend to get updated token count
              await refreshUserData();
            } else {
              log('❌ Token update failed');
            }
          } catch (err) {
            log('❌ Token update error:', err);
          }
        } else {
          log('Could not determine token amount for this purchase');
        }
        
        // Clean up
        sessionStorage.removeItem('pendingOrder');
        log('Removed pending order from session storage');
        
        // Reset orderData to show success screen
        setOrderData(null);
        
        return true;
      }
      
      log(`Payment verification complete but order is not paid (status: ${data.order_status})`);
      return false;
      
    } catch (err) {
      log('Error in payment verification:', err);
      setError(`Verification error: ${err.message}`);
      return false;
    } finally {
      setProcessingPackageId(null);
    }
  };

  // Handle the "Back" button from payment view
  const handleBackFromPayment = () => {
    log('User clicked back from payment view');
    setOrderData(null);
    
    // Remove pending order from session storage
    sessionStorage.removeItem('pendingOrder');
    log('Removed pending order from session storage');
    
    // Verify if payment was completed
    if (orderId) {
      log(`Checking if order ${orderId} was completed before going back`);
      verifyPaymentAndUpdateTokens(orderId);
    }
  };

  // Retry payment with Cashfree SDK
  const retryPayment = () => {
    if (!orderData || !orderData.payment_session_id || !window.Cashfree) {
      setError('Cannot retry payment. Missing session ID or SDK not loaded.');
      return;
    }
    
    try {
      log('Retrying payment with Cashfree SDK');
      const cashfree = window.Cashfree({
        mode: "sandbox" // Use "production" for live environment
      });
      
      // Find the package that matches the order
      const amount = parseFloat(orderStatus?.amount) || 0;
      const packageId = packages.find(pkg => Math.abs(pkg.price - amount) < 1)?.id || 'basic';
      
      log('Retrying payment for package:', packageId);
      
      // Get the return URL
      const baseUrl = window.location.origin;
      const returnUrl = `${baseUrl}/?payment=return&order_id=${orderId}`;
      log('Return URL for retry:', returnUrl);
      
      // Open Cashfree checkout with proper returnUrl
      cashfree.checkout({
        paymentSessionId: orderData.payment_session_id,
        redirectTarget: "_self",
        returnUrl: returnUrl
      });
      
      log('Cashfree checkout reopened for retry');
    } catch (err) {
      log('Failed to retry payment:', err);
      setError('Failed to initialize payment: ' + err.message);
    }
  };

  // Manual verification trigger
  const checkPaymentStatus = () => {
    if (!orderId) {
      setError('No order to verify');
      return;
    }
    
    log('Manually checking payment status for order:', orderId);
    
    // Find the package that matches the order
    const amount = parseFloat(orderStatus?.amount) || 0;
    const packageId = packages.find(pkg => Math.abs(pkg.price - amount) < 1)?.id || 'basic';
    
    // Verify payment and update tokens
    setProcessingPackageId('checking-payment');
    verifyPaymentAndUpdateTokens(orderId, packageId)
      .catch(err => {
        log('Error in manual verification:', err);
      });
  };

  // Refresh token count before closing
  const handleClose = async () => {
    log('Closing token store');
    // Refresh user data from backend to ensure latest token count
    await refreshUserData();
    onClose();
  };

  // Helper to render debug logs if needed
  const renderDebugLogs = () => {
    if (process.env.NODE_ENV !== 'development') return null;
    
    return (
      <div className="mt-4 p-3 bg-gray-100 rounded-md text-xs max-h-40 overflow-auto">
        <h4 className="font-medium mb-2">Debug Logs:</h4>
        {debugLog.map((entry, i) => (
          <div key={i} className="mb-1">
            <span className="text-gray-500">{entry.timestamp.slice(11, 19)}</span>:{' '}
            <span>{entry.message}</span>
            {entry.data && typeof entry.data === 'object' && (
              <pre className="text-xs mt-1 ml-4 text-gray-600">
                {JSON.stringify(entry.data, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    // In TokenStore.jsx, modify the outer container and modal container:
<div className="fixed inset-0 flex items-center justify-center z-50" 
     style={{
       backdropFilter: 'blur(8px)',
       WebkitBackdropFilter: 'blur(8px)',
       backgroundColor: 'rgba(0, 0, 0, 0.2)'
     }}>
  <div id="token-store-container" style={{ 
    backgroundColor: '#ffffff', 
    borderRadius: '0.75rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    maxWidth: '768px', 
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    position: 'relative'
  }}>
        {/* Header */}
        <div style={{ 
          borderBottom: '1px solid #e5e7eb', 
          padding: '16px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <button 
            onClick={handleClose}
            style={{ 
              color: '#6b7280', 
              display: 'flex', 
              alignItems: 'center',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px'
            }}
          >
            <ChevronLeft size={20} />
            <span style={{ marginLeft: '4px', fontWeight: 400, color: 'inherit' }}>Back</span>
          </button>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: 600, 
            textAlign: 'center', 
            flex: 1,
            margin: 0,
            color: '#000000'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Coins style={{ marginRight: '8px' }} /> 
              <span style={{ color: '#000000' }}>Token Store</span>
            </span>
          </h2>
          <div style={{ width: '80px' }}></div> {/* Spacer for centering */}
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {processingPackageId && !orderData && !orderStatus?.status === 'PAID' ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ 
                animation: 'spin 1s linear infinite',
                borderRadius: '50%',
                height: '48px',
                width: '48px',
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: '#e5e7eb #e5e7eb #111827 #e5e7eb',
                margin: '0 auto'
              }}></div>
              <p style={{ marginTop: '16px', color: '#6b7280' }}>Processing...</p>
            </div>
          ) : error ? (
            <div style={{ 
              backgroundColor: '#fef2f2', 
              borderWidth: '1px', 
              borderColor: '#fecaca', 
              color: '#b91c1c', 
              padding: '12px 16px', 
              borderRadius: '6px', 
              position: 'relative',
              marginBottom: '16px'
            }}>
              <strong style={{ fontWeight: 600, color: '#b91c1c' }}>Error: </strong>
              <span style={{ display: 'block', color: '#b91c1c' }}>{error}</span>
              <button 
                onClick={() => setError(null)}
                style={{ 
                  marginTop: '12px', 
                  padding: '4px 12px', 
                  backgroundColor: '#fee2e2', 
                  color: '#b91c1c', 
                  borderRadius: '4px', 
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Try Again
              </button>
            </div>
          ) : orderData?.payment_session_id ? (
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: 500, 
                marginBottom: '16px',
                color: '#000000'
              }}>
                Complete Your Payment
              </h3>
              
              {/* Payment initiated with Cashfree SDK */}
              <div style={{ 
                backgroundColor: '#f9fafb', 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px', 
                padding: '16px', 
                marginBottom: '24px' 
              }}>
                <p style={{ color: '#374151', marginBottom: '16px' }}>
                  Payment initiated with order ID: 
                  <span style={{ fontWeight: 500, color: '#000000' }}> {orderId}</span>
                </p>
                
                <div style={{ 
                  display: 'flex', 
                  flexDirection: window.innerWidth < 640 ? 'column' : 'row',
                  gap: '16px', 
                  justifyContent: 'center' 
                }}>
                  <button 
                    onClick={retryPayment}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      padding: '12px 16px', 
                      backgroundColor: '#059669', 
                      color: 'white', 
                      borderRadius: '6px',
                      fontWeight: 500,
                      border: 'none',
                      cursor: 'pointer',
                      opacity: processingPackageId === 'retrying-payment' ? 0.5 : 1
                    }}
                    disabled={processingPackageId === 'retrying-payment'}
                  >
                    <CreditCard size={18} style={{ marginRight: '8px' }} />
                    {processingPackageId === 'retrying-payment' ? "Processing..." : "Retry Payment"}
                  </button>
                  
                  <button 
                    onClick={checkPaymentStatus}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      padding: '12px 16px', 
                      backgroundColor: '#2563eb', 
                      color: 'white', 
                      borderRadius: '6px',
                      fontWeight: 500,
                      border: 'none',
                      cursor: 'pointer',
                      opacity: processingPackageId === 'checking-payment' ? 0.5 : 1
                    }}
                    disabled={processingPackageId === 'checking-payment'}
                  >
                    <Check size={18} style={{ marginRight: '8px' }} />
                    {processingPackageId === 'checking-payment' ? "Checking..." : "Check Payment Status"}
                  </button>
                </div>
                
                {processingPackageId && (
                  <div style={{ 
                    marginTop: '16px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    <div style={{ 
                      animation: 'spin 1s linear infinite',
                      borderRadius: '50%',
                      height: '24px',
                      width: '24px',
                      borderWidth: '2px',
                      borderStyle: 'solid',
                      borderColor: '#e5e7eb #e5e7eb #111827 #e5e7eb'
                    }}></div>
                    <span style={{ marginLeft: '8px', fontSize: '14px', color: '#6b7280' }}>
                      Verifying payment...
                    </span>
                  </div>
                )}
              </div>
              
              <p style={{ marginTop: '12px', fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                If you completed payment but the status hasn't updated:
              </p>
              
              <div style={{ 
                textAlign: 'left', 
                fontSize: '14px', 
                color: '#3b82f6', 
                backgroundColor: '#eff6ff', 
                padding: '12px', 
                borderRadius: '6px', 
                marginBottom: '16px' 
              }}>
                <ol style={{ margin: 0, paddingLeft: '20px' }}>
                  <li style={{ marginBottom: '4px', color: '#1f2937' }}>
                    1. Wait a few moments - payment processing can take time
                  </li>
                  <li style={{ marginBottom: '4px', color: '#1f2937' }}>
                    2. Click "Check Payment Status" to verify manually
                  </li>
                  <li style={{ color: '#1f2937' }}>
                    3. If needed, contact our support team with your order ID
                  </li>
                </ol>
              </div>
              
              <button
                onClick={handleBackFromPayment}
                style={{ 
                  marginTop: '16px', 
                  color: '#4b5563', 
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 8px'
                }}
              >
                Cancel and return to store
              </button>

              {process.env.NODE_ENV === 'development' && renderDebugLogs()}
            </div>
          ) : orderStatus && orderStatus.status === 'PAID' ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ 
                width: '64px', 
                height: '64px', 
                backgroundColor: '#d1fae5', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 16px auto' 
              }}>
                <Check size={32} style={{ color: '#059669' }} />
              </div>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: 500, 
                color: '#111827', 
                marginBottom: '8px' 
              }}>
                Payment Successful!
              </h3>
              <p style={{ color: '#4b5563', marginBottom: '24px' }}>
                Thank you for your purchase. Your tokens have been added to your account.
              </p>
              <div style={{ 
                backgroundColor: '#f9fafb', 
                borderRadius: '8px', 
                padding: '16px', 
                marginBottom: '24px' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#6b7280' }}>Order ID:</span>
                  <span style={{ fontWeight: 500, color: '#111827' }}>{orderStatus.order_id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#6b7280' }}>Amount:</span>
                  <span style={{ fontWeight: 500, color: '#111827' }}>
                    {orderStatus.amount} {orderStatus.currency}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>Status:</span>
                  <span style={{ fontWeight: 500, color: '#059669' }}>Paid</span>
                </div>
              </div>
              <button
                onClick={handleClose}
                style={{ 
                  padding: '8px 16px', 
                  backgroundColor: '#2563eb', 
                  color: 'white', 
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Continue
              </button>

              {process.env.NODE_ENV === 'development' && renderDebugLogs()}
            </div>
          ) : (
            <>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: 500, 
                marginBottom: '16px',
                color: '#000000'
              }}>
                Available Packages
              </h3>
              
              {packages.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {packages.map((pkg) => (
                    <div 
                      key={pkg.id}
                      className="border rounded-lg hover:shadow-md transition-all cursor-pointer border-gray-200 p-4"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{pkg.name}</h4>
                          <div className="flex items-center mt-1">
                            <Coins className="text-yellow-500 mr-1" size={16} />
                            <span className="font-bold">{pkg.tokens}</span>
                            <span className="ml-1 text-gray-500 text-sm">tokens</span>
                          </div>
                        </div>
                        <Package size={20} className="text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-sm mb-3">{pkg.description || `${pkg.tokens} tokens for image editing`}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold">₹{pkg.price.toFixed(2)}</span>
                        <button 
                          className="px-3 py-1 bg-[#abf134] text-black rounded text-sm font-medium hover:bg-[#9ed830] flex items-center"
                          onClick={() => handlePurchase(pkg.id)}
                          disabled={!cashfreeReady || processingPackageId === pkg.id}
                        >
                          {processingPackageId === pkg.id ? "Processing..." : "Buy Now"}
                          <ArrowRight size={14} className="ml-1" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div style={{ 
                    animation: 'spin 1s linear infinite',
                    borderRadius: '50%',
                    height: '40px',
                    width: '40px',
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    borderColor: '#e5e7eb #e5e7eb #111827 #e5e7eb',
                    margin: '0 auto'
                  }}></div>
                  <p style={{ marginTop: '16px', color: '#6b7280' }}>Loading packages...</p>
                </div>
              )}

              {/* Test credentials info */}
              <div style={{ 
                backgroundColor: '#f9fafb', 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px', 
                padding: '16px', 
                fontSize: '14px',
                marginTop: '32px'
              }}>
                <h4 style={{ 
                  fontWeight: 500, 
                  marginBottom: '8px',
                  color: '#000000',
                  fontSize: '14px'
                }}>
                  Cashfree Test Payment Info
                </h4>
                <p style={{ color: '#000000' }}>Use these credentials for testing:</p>
                <ul style={{ 
                  marginTop: '8px', 
                  listStyleType: 'none', 
                  padding: 0,
                  color: '#4b5563' 
                }}>
                  <li style={{ 
                    marginBottom: '4px',
                    paddingLeft: '16px',
                    position: 'relative',
                    color: '#000000'
                  }}>
                    <span style={{ 
                      position: 'absolute', 
                      left: 0,
                      color: '#000000'
                    }}>•</span> 
                    Card number: 4444 3333 2222 1111
                  </li>
                  <li style={{ 
                    marginBottom: '4px',
                    paddingLeft: '16px',
                    position: 'relative',
                    color: '#000000'
                  }}>
                    <span style={{ 
                      position: 'absolute', 
                      left: 0,
                      color: '#000000'
                    }}>•</span> 
                    Expiry: Any future date
                  </li>
                  <li style={{ 
                    marginBottom: '4px',
                    paddingLeft: '16px',
                    position: 'relative',
                    color: '#000000'
                  }}>
                    <span style={{ 
                      position: 'absolute', 
                      left: 0,
                      color: '#000000'
                    }}>•</span> 
                    CVV: Any 3-digit number
                  </li>
                  <li style={{ 
                    paddingLeft: '16px',
                    position: 'relative',
                    color: '#000000'
                  }}>
                    <span style={{ 
                      position: 'absolute', 
                      left: 0,
                      color: '#000000'
                    }}>•</span> 
                    Name: Any name
                  </li>
                </ul>
              </div>

              {process.env.NODE_ENV === 'development' && renderDebugLogs()}
            </>
          )}
        </div>
      </div>
      
      {/* Keyframe animation for spinner */}
      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default TokenStore;