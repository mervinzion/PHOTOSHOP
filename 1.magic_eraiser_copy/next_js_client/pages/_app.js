// pages/_app.js
import React from 'react';
import Head from 'next/head';
import { AuthProvider } from '../components/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import '../styles/globals.css';
import '../styles/tool-animations.css'; // Import the tool animations CSS

// Your Google Client ID from Google Cloud Console
const GOOGLE_CLIENT_ID = "567230401707-12ghk21h3fqap8r5ff705ubs08q3241p.apps.googleusercontent.com"; 

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#000000" />
        <meta name="description" content="InPaint - Advanced image editing application" />
        <title>InPaint</title>
      </Head>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AuthProvider>
          <Component {...pageProps} />
        </AuthProvider>
      </GoogleOAuthProvider>
    </>
  );
}

export default MyApp;