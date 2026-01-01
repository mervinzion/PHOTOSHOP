// Updated TokenStore.jsx with Localtunnel URL integration
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
  
  // Get auth context to update user tokens
  const { currentUser, updateUserTokens, refreshUserData } = useAuth();

  // Check if Cashfree SDK is loaded
  useEffect(() => {
    const checkCashfreeLoaded = () => {
      if (window.Cashfree) {
        setCashfreeReady(true);
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
        console.log('Cashfree SDK not loaded automatically, trying manual load');
        const script = document.createElement('script');
        script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
        script.async = true;
        script.onload = () => {
          setCashfreeReady(true);
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
      console.log("Using saved Localtunnel URL:", savedTunnelUrl);
    } else {
      const url = prompt("Enter your Localtunnel URL (e.g., https://something.loca.lt):");
      if (url) {
        sessionStorage.setItem('tunnelUrl', url);
        setTunnelUrl(url);
      }
    }
  }, []);

  // Enhanced check for URL parameters after payment return
  useEffect(() => {
    const checkUrlAndVerifyPayment = async () => {
      console.log('Checking URL parameters for payment redirect...');
      
      // Get URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const orderIdFromUrl = urlParams.get('order_id');
      const paymentReturn = urlParams.get('payment') === 'return';
      
      if (orderIdFromUrl || paymentReturn) {
        console.log('🔍 Payment return detected in URL!');
        
        // Get the order ID to verify
        const orderToVerify = orderIdFromUrl || orderId;
        
        if (orderToVerify) {
          console.log(`Order ID to verify: ${orderToVerify}`);
          
          // Set order ID in state if it's from URL
          if (orderIdFromUrl && orderIdFromUrl !== orderId) {
            console.log('Setting order ID from URL parameter');
            setOrderId(orderIdFromUrl);
          }
          
          // Clear URL parameters without refreshing the page
          window.history.replaceState({}, document.title, window.location.pathname);
          
          // Try to find package ID from session storage
          let packageId = null;
          try {
            const pendingOrderData = JSON.parse(sessionStorage.getItem('pendingOrder') || '{}');
            console.log('Pending order data from session:', pendingOrderData);
            
            if (pendingOrderData.id === orderToVerify) {
              packageId = pendingOrderData.packageId;
              console.log(`Found package ID in session: ${packageId}`);
            }
          } catch (err) {
            console.error('Error parsing pending order:', err);
          }
          
          // Start payment verification
          console.log('Starting payment verification sequence...');
          const success = await verifyPaymentAndUpdateTokens(orderToVerify, packageId);
          
          if (!success) {
            // Try again with delays if first attempt fails
            setTimeout(async () => {
              await verifyPaymentAndUpdateTokens(orderToVerify, packageId);
            }, 2000);
          }
        } else {
          console.error('No order ID found for verification');
        }
      } else {
        // Check session storage for pending orders
        console.log('No payment return parameters in URL, checking session storage');
        const pendingOrder = sessionStorage.getItem('pendingOrder');
        
        if (pendingOrder) {
          try {
            const { id, packageId } = JSON.parse(pendingOrder);
            console.log(`Found pending order ${id} in session, verifying...`);
            
            if (!orderId) {
              setOrderId(id);
            }
            
            // Verify this pending order in case it completed elsewhere
            await verifyPaymentAndUpdateTokens(id, packageId);
          } catch (err) {
            console.error('Error processing pending order:', err);
          }
        }
      }
    };
    
    // Run check when component mounts or URL changes
    checkUrlAndVerifyPayment();
  }, []);

  // Fetch available token packages
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setProcessingPackageId('loading-packages');
        const response = await fetch('http://localhost:8000/packages');
        if (!response.ok) {
          throw new Error('Failed to fetch packages');
        }
        const data = await response.json();
        setPackages(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setProcessingPackageId(null);
      }
    };

    fetchPackages();
  }, []);

  // Enhanced handlePurchase function with Localtunnel URL support
  const handlePurchase = async (packageId) => {
    try {
      setProcessingPackageId(packageId);
      setError(null);
      
      // Get the return URL
      const baseUrl = window.location.origin;
      const returnUrl = `${baseUrl}/?payment=return`;
      
      console.log(`Creating order for package: ${packageId}`);
      console.log(`Return URL set to: ${returnUrl}`);
      
      // Create webhook URL if Localtunnel is available
      let createOrderUrl = `http://localhost:8000/create-order?package_id=${packageId}&return_url=${encodeURIComponent(returnUrl)}`;
      
      // Add webhook URL and user ID if available
      if (tunnelUrl) {
        const webhookUrl = `${tunnelUrl}/webhook`;
        createOrderUrl += `&webhook_url=${encodeURIComponent(webhookUrl)}`;
        console.log(`Webhook URL set to: ${webhookUrl}`);
      }
      
      // Add user ID if available
      if (currentUser?.id) {
        createOrderUrl += `&user_id=${currentUser.id}`;
      }
      
      // Call the create-order endpoint
      const response = await fetch(createOrderUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create order');
      }
      
      const data = await response.json();
      console.log('Order created:', data);
      
      // Store the order ID and data
      setOrderId(data.order_id);
      setOrderData(data);
      
      // Save order details to session storage with the packageId
      sessionStorage.setItem('pendingOrder', JSON.stringify({
        id: data.order_id, 
        packageId,
        amount: packages.find(p => p.id === packageId)?.price || 199,
        created: new Date().toISOString()
      }));
      
      // Initialize Cashfree SDK and start checkout
      if (window.Cashfree && data.payment_session_id) {
        console.log('Starting Cashfree checkout with session ID:', data.payment_session_id.substring(0, 20) + '...');
        
        const cashfree = window.Cashfree({
          mode: "sandbox" // Use "production" for live environment
        });
        
        // Build a proper returnUrl that includes the order ID
        const fullReturnUrl = `${returnUrl}&order_id=${data.order_id}`;
        console.log('Full return URL:', fullReturnUrl);
        
        // Open Cashfree checkout
        cashfree.checkout({
          paymentSessionId: data.payment_session_id,
          redirectTarget: "_self", // Using _self to open in same tab
          returnUrl: fullReturnUrl
        });
        
      } else {
        if (!window.Cashfree) {
          throw new Error('Cashfree SDK not loaded. Please refresh and try again.');
        } else if (!data.payment_session_id) {
          throw new Error('No payment session ID received from server.');
        }
      }
      
    } catch (err) {
      setError(err.message);
      console.error('Error initiating payment:', err);
      setProcessingPackageId(null);
    }
  };

  // Enhanced verification function with user ID support
  const verifyPaymentAndUpdateTokens = async (orderIdToVerify, packageId = null) => {
    if (!orderIdToVerify) {
      console.error('Cannot verify payment: No order ID provided');
      return false;
    }
    
    try {
      setProcessingPackageId('verifying-payment');
      console.log(`⏳ Verifying payment for order: ${orderIdToVerify}`);
      
      // Add user_id to verification endpoint
      let verifyUrl = `http://localhost:8000/verify-payment/${orderIdToVerify}`;
      if (currentUser?.id) {
        verifyUrl += `?user_id=${currentUser.id}`;
      }
      
      // Make API call to backend to verify payment status
      const response = await fetch(verifyUrl);
      console.log(`📡 Verification API response status: ${response.status}`);
      
      if (!response.ok) {
        console.error(`Verification API error: ${response.status}`);
        throw new Error(`Failed to verify payment: ${response.status}`);
      }
      
      // Parse response data
      const data = await response.json();
      console.log('📊 Full verification data:', data);
      
      // Check for payments array if it exists
      let isPaid = data.order_status === 'PAID';
      
      // Look for successful payments if the order isn't already marked as PAID
      if (!isPaid && data.payments && Array.isArray(data.payments)) {
        isPaid = data.payments.some(payment => 
          payment.payment_status === 'SUCCESS' || 
          payment.payment_status === 'COMPLETED'
        );
      }
      
      // Update order status in state
      const updatedStatus = {
        order_id: data.order_id,
        status: isPaid ? 'PAID' : data.order_status,
        amount: data.order_amount,
        currency: data.order_currency
      };
      
      setOrderStatus(updatedStatus);
      
      // Check if tokens were updated directly by the server
      if (data.token_update && data.token_update.success) {
        console.log('🎉 Tokens already updated by server!', data.token_update);
        await refreshUserData();
        return true;
      }
      
      // Check if payment is successful
      if (isPaid || data.order_status === 'PAID') {
        console.log('🎉 PAYMENT IS CONFIRMED PAID! Updating tokens...');
        
        // Determine token amount to add
        let tokenAmount = 0;
        
        // Method 1: Use provided packageId
        if (packageId) {
          const packageObj = packages.find(pkg => pkg.id === packageId);
          if (packageObj) {
            tokenAmount = packageObj.tokens;
            console.log(`Determined token amount from package ID: ${tokenAmount}`);
          }
        }
        
        // Method 2: Match by price if package ID didn't work
        if (!tokenAmount) {
          const amount = parseFloat(data.order_amount);
          const matchingPackage = packages.find(pkg => Math.abs(pkg.price - amount) < 1);
          
          if (matchingPackage) {
            tokenAmount = matchingPackage.tokens;
            console.log(`Determined token amount from price match: ${tokenAmount}`);
          } else {
            // Method 3: Fallback to hardcoded values
            if (Math.abs(amount - 199) < 1) tokenAmount = 100;
            else if (Math.abs(amount - 499) < 1) tokenAmount = 300;
            else if (Math.abs(amount - 999) < 1) tokenAmount = 800;
          }
        }
        
        // Update tokens if we determined an amount
        if (tokenAmount > 0 && currentUser) {
          const currentTokens = currentUser?.tokens || 0;
          const newTotal = currentTokens + tokenAmount;
          
          console.log(`Updating tokens: ${currentTokens} + ${tokenAmount} = ${newTotal}`);
          
          // Update tokens in the database
          try {
            const success = await updateUserTokens(newTotal);
            if (success) {
              console.log('✅ Token update successful!');
              
              // Refresh user data from backend to get updated token count
              await refreshUserData();
            } else {
              console.error('❌ Token update failed');
            }
          } catch (err) {
            console.error('❌ Token update error:', err);
          }
        } else {
          console.error('Could not determine token amount for this purchase');
        }
        
        // Clean up
        sessionStorage.removeItem('pendingOrder');
        
        // Reset orderData to show success screen
        setOrderData(null);
        
        return true;
      }
      
      return false;
      
    } catch (err) {
      console.error('Error in payment verification:', err);
      return false;
    } finally {
      setProcessingPackageId(null);
    }
  };

  // Handle the "Back" button from payment view
  const handleBackFromPayment = () => {
    setOrderData(null);
    
    // Remove pending order from session storage
    sessionStorage.removeItem('pendingOrder');
    
    // Verify if payment was completed
    if (orderId) {
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
      const cashfree = window.Cashfree({
        mode: "sandbox" // Use "production" for live environment
      });
      
      // Find the package that matches the order
      const amount = parseFloat(orderStatus?.amount) || 0;
      const packageId = packages.find(pkg => Math.abs(pkg.price - amount) < 1)?.id || 'basic';
      
      console.log('Retrying payment for package:', packageId);
      
      // Get the return URL
      const baseUrl = window.location.origin;
      const returnUrl = `${baseUrl}/?payment=return&order_id=${orderId}`;
      
      // Open Cashfree checkout with proper returnUrl
      cashfree.checkout({
        paymentSessionId: orderData.payment_session_id,
        redirectTarget: "_self",
        returnUrl: returnUrl
      });
    } catch (err) {
      setError('Failed to initialize payment: ' + err.message);
    }
  };

  // Manual verification trigger
  const checkPaymentStatus = () => {
    if (!orderId) {
      setError('No order to verify');
      return;
    }
    
    console.log('Manually checking payment status for order:', orderId);
    
    // Find the package that matches the order
    const amount = parseFloat(orderStatus?.amount) || 0;
    const packageId = packages.find(pkg => Math.abs(pkg.price - amount) < 1)?.id || 'basic';
    
    // Verify payment and update tokens
    setProcessingPackageId('checking-payment');
    verifyPaymentAndUpdateTokens(orderId, packageId)
      .catch(err => {
        console.error('Error in manual verification:', err);
      });
  };

  // Refresh token count before closing
  const handleClose = async () => {
    // Refresh user data from backend to ensure latest token count
    await refreshUserData();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="border-b p-4 flex justify-between items-center">
          <button 
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 flex items-center"
          >
            <ChevronLeft size={20} />
            <span className="ml-1">Back</span>
          </button>
          <h2 className="text-xl font-bold text-center flex-1">
            <span className="flex items-center justify-center">
              <Coins className="mr-2" /> Token Store
            </span>
          </h2>
          <div className="w-20"></div> {/* Spacer for centering */}
        </div>

        {/* Content */}
        <div className="p-6">
          {processingPackageId && !orderData && !orderStatus?.status === 'PAID' ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">Processing...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
              <button 
                onClick={() => setError(null)}
                className="mt-3 px-3 py-1 bg-red-100 text-red-800 rounded text-sm"
              >
                Try Again
              </button>
            </div>
          ) : orderData?.payment_session_id ? (
            <div className="text-center">
              <h3 className="text-lg font-medium mb-4">Complete Your Payment</h3>
              
              {/* Payment initiated with Cashfree SDK */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <p className="text-gray-700 mb-4">Payment initiated with order ID: <span className="font-medium">{orderId}</span></p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button 
                    onClick={retryPayment}
                    className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
                    disabled={processingPackageId === 'retrying-payment'}
                  >
                    <CreditCard size={18} className="mr-2" />
                    {processingPackageId === 'retrying-payment' ? "Processing..." : "Retry Payment"}
                  </button>
                  
                  <button 
                    onClick={checkPaymentStatus}
                    className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                    disabled={processingPackageId === 'checking-payment'}
                  >
                    <Check size={18} className="mr-2" />
                    {processingPackageId === 'checking-payment' ? "Checking..." : "Check Payment Status"}
                  </button>
                </div>
                
                {processingPackageId && (
                  <div className="mt-4 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                    <span className="ml-2 text-sm text-gray-600">Verifying payment...</span>
                  </div>
                )}
              </div>
              
              <p className="mt-3 text-sm text-gray-500 mb-2">
                If you completed payment but the status hasn't updated:
              </p>
              <ol className="text-left text-sm text-gray-600 bg-blue-50 p-3 rounded-md mb-4">
                <li>1. Wait a few moments - payment processing can take time</li>
                <li>2. Click "Check Payment Status" to verify manually</li>
                <li>3. If needed, contact our support team with your order ID</li>
              </ol>
              
              <button
                onClick={handleBackFromPayment}
                className="mt-4 text-gray-600 hover:text-gray-800"
              >
                Cancel and return to store
              </button>
            </div>
          ) : orderStatus && orderStatus.status === 'PAID' ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={32} className="text-green-600" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Payment Successful!</h3>
              <p className="text-gray-600 mb-6">
                Thank you for your purchase. Your tokens have been added to your account.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">Order ID:</span>
                  <span className="font-medium">{orderStatus.order_id}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">Amount:</span>
                  <span className="font-medium">{orderStatus.amount} {orderStatus.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <span className="font-medium text-green-600">Paid</span>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Continue
              </button>
            </div>
          ) : (
            <>
              <h3 className="text-lg font-medium mb-4">Available Packages</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {packages.map((pkg) => (
                  <div 
                    key={pkg.id}
                    className="border rounded-lg hover:shadow-md transition-all cursor-pointer border-gray-200"
                  >
                    <div className="p-4">
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
                  </div>
                ))}
              </div>

              {/* Test credentials info */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm">
                <h4 className="font-medium mb-2">Cashfree Test Payment Info</h4>
                <p>Use these credentials for testing:</p>
                <ul className="mt-2 space-y-1 text-gray-600">
                  <li>• Card number: 4444 3333 2222 1111</li>
                  <li>• Expiry: Any future date</li>
                  <li>• CVV: Any 3-digit number</li>
                  <li>• Name: Any name</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TokenStore;