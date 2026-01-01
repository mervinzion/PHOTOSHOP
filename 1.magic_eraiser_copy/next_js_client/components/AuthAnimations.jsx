// AuthAnimations.jsx
import React from 'react';

// Bouncing Bar Loader - Good for general loading
export const BouncingBarLoader = ({ color = '#2c8fff', size = 75 }) => {
  return (
    <div className="loader" style={{ width: size + 'px', height: size * 1.3 + 'px' }}>
      <div className="loader__bar" style={{ backgroundColor: color }}></div>
      <div className="loader__bar" style={{ backgroundColor: color }}></div>
      <div className="loader__bar" style={{ backgroundColor: color }}></div>
      <div className="loader__bar" style={{ backgroundColor: color }}></div>
      <div className="loader__bar" style={{ backgroundColor: color }}></div>
      <div className="loader__ball" style={{ backgroundColor: color }}></div>
      
      <style jsx>{`
        .loader {
          position: relative;
        }
        .loader__bar {
          position: absolute;
          bottom: 0;
          width: ${size / 7.5}px;
          height: 50%;
          background: ${color};
          transform-origin: center bottom;
          box-shadow: 1px 1px 0 rgba(0, 0, 0, 0.2);
        }
        .loader__bar:nth-child(1) {
          left: 0px;
          transform: scale(1, 0.2);
          animation: barUp1 4s infinite;
        }
        .loader__bar:nth-child(2) {
          left: ${size / 5}px;
          transform: scale(1, 0.4);
          animation: barUp2 4s infinite;
        }
        .loader__bar:nth-child(3) {
          left: ${size / 2.5}px;
          transform: scale(1, 0.6);
          animation: barUp3 4s infinite;
        }
        .loader__bar:nth-child(4) {
          left: ${size / 1.67}px;
          transform: scale(1, 0.8);
          animation: barUp4 4s infinite;
        }
        .loader__bar:nth-child(5) {
          left: ${size / 1.25}px;
          transform: scale(1, 1);
          animation: barUp5 4s infinite;
        }
        .loader__ball {
          position: absolute;
          bottom: ${size / 7.5}px;
          left: 0;
          width: ${size / 7.5}px;
          height: ${size / 7.5}px;
          background: ${color};
          border-radius: 50%;
          animation: ball 4s infinite;
        }
        
        @keyframes ball {
          0% {
            transform: translate(0, 0);
          }
          5% {
            transform: translate(${size / 9}px, -14px);
          }
          10% {
            transform: translate(${size / 5}px, -10px);
          }
          17% {
            transform: translate(${size / 3.3}px, -24px);
          }
          20% {
            transform: translate(${size / 2.5}px, -20px);
          }
          27% {
            transform: translate(${size / 2}px, -34px);
          }
          30% {
            transform: translate(${size / 1.67}px, -30px);
          }
          37% {
            transform: translate(${size / 1.4}px, -44px);
          }
          40% {
            transform: translate(${size / 1.25}px, -40px);
          }
          50% {
            transform: translate(${size / 1.25}px, 0);
          }
          57% {
            transform: translate(${size / 1.4}px, -14px);
          }
          60% {
            transform: translate(${size / 1.67}px, -10px);
          }
          67% {
            transform: translate(${size / 2}px, -24px);
          }
          70% {
            transform: translate(${size / 2.5}px, -20px);
          }
          77% {
            transform: translate(${size / 3.3}px, -34px);
          }
          80% {
            transform: translate(${size / 5}px, -30px);
          }
          87% {
            transform: translate(${size / 9}px, -44px);
          }
          90% {
            transform: translate(0, -40px);
          }
          100% {
            transform: translate(0, 0);
          }
        }
        
        @keyframes barUp1 {
          0%, 40%, 100% {
            transform: scale(1, 0.2);
          }
          50%, 90% {
            transform: scale(1, 1);
          }
        }
        
        @keyframes barUp2 {
          0%, 40%, 100% {
            transform: scale(1, 0.4);
          }
          50%, 90% {
            transform: scale(1, 0.8);
          }
        }
        
        @keyframes barUp3 {
          0%, 100% {
            transform: scale(1, 0.6);
          }
        }
        
        @keyframes barUp4 {
          0%, 40%, 100% {
            transform: scale(1, 0.8);
          }
          50%, 90% {
            transform: scale(1, 0.4);
          }
        }
        
        @keyframes barUp5 {
          0%, 40%, 100% {
            transform: scale(1, 1);
          }
          50%, 90% {
            transform: scale(1, 0.2);
          }
        }
      `}</style>
    </div>
  );
};

// WiFi Signal Loader - Good for showing connection status/attempts
export const WiFiLoader = ({ 
  backgroundColor = '#62abff', 
  frontColor = '#4f29f0', 
  backColor = '#c3c8de', 
  textColor = '#414856',
  text = 'Connecting',
  size = 64
}) => {
  return (
    <div id="wifi-loader" style={{ 
      '--background': backgroundColor,
      '--front-color': frontColor,
      '--back-color': backColor,
      '--text-color': textColor,
      width: `${size}px`,
      height: `${size}px`
    }}>
      <svg className="circle-outer" viewBox="0 0 86 86">
        <circle className="back" cx="43" cy="43" r="40"></circle>
        <circle className="front" cx="43" cy="43" r="40"></circle>
      </svg>
      <svg className="circle-middle" viewBox="0 0 60 60">
        <circle className="back" cx="30" cy="30" r="27"></circle>
        <circle className="front" cx="30" cy="30" r="27"></circle>
      </svg>
      <svg className="circle-inner" viewBox="0 0 34 34">
        <circle className="back" cx="17" cy="17" r="14"></circle>
        <circle className="front" cx="17" cy="17" r="14"></circle>
      </svg>
      <div className="text" data-text={text}></div>

      <style jsx>{`
        #wifi-loader {
          --background: ${backgroundColor};
          --front-color: ${frontColor};
          --back-color: ${backColor};
          --text-color: ${textColor};
          border-radius: 50px;
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        #wifi-loader svg {
          position: absolute;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        #wifi-loader svg circle {
          position: absolute;
          fill: none;
          stroke-width: 6px;
          stroke-linecap: round;
          stroke-linejoin: round;
          transform: rotate(-100deg);
          transform-origin: center;
        }
        
        #wifi-loader svg circle.back {
          stroke: var(--back-color);
        }
        
        #wifi-loader svg circle.front {
          stroke: var(--front-color);
        }
        
        #wifi-loader svg.circle-outer {
          height: ${size * 1.34}px;
          width: ${size * 1.34}px;
        }
        
        #wifi-loader svg.circle-outer circle {
          stroke-dasharray: 62.75 188.25;
        }
        
        #wifi-loader svg.circle-outer circle.back {
          animation: circle-outer 1.8s ease infinite 0.3s;
        }
        
        #wifi-loader svg.circle-outer circle.front {
          animation: circle-outer 1.8s ease infinite 0.15s;
        }
        
        #wifi-loader svg.circle-middle {
          height: ${size * 0.94}px;
          width: ${size * 0.94}px;
        }
        
        #wifi-loader svg.circle-middle circle {
          stroke-dasharray: 42.5 127.5;
        }
        
        #wifi-loader svg.circle-middle circle.back {
          animation: circle-middle 1.8s ease infinite 0.25s;
        }
        
        #wifi-loader svg.circle-middle circle.front {
          animation: circle-middle 1.8s ease infinite 0.1s;
        }
        
        #wifi-loader svg.circle-inner {
          height: ${size * 0.53}px;
          width: ${size * 0.53}px;
        }
        
        #wifi-loader svg.circle-inner circle {
          stroke-dasharray: 22 66;
        }
        
        #wifi-loader svg.circle-inner circle.back {
          animation: circle-inner 1.8s ease infinite 0.2s;
        }
        
        #wifi-loader svg.circle-inner circle.front {
          animation: circle-inner 1.8s ease infinite 0.05s;
        }
        
        #wifi-loader .text {
          position: absolute;
          bottom: -${size * 0.625}px;
          display: flex;
          justify-content: center;
          align-items: center;
          text-transform: lowercase;
          font-weight: 500;
          font-size: ${size * 0.22}px;
          letter-spacing: 0.2px;
        }
        
        #wifi-loader .text::before, #wifi-loader .text::after {
          content: attr(data-text);
        }
        
        #wifi-loader .text::before {
          color: var(--text-color);
        }
        
        #wifi-loader .text::after {
          color: var(--front-color);
          animation: text-animation 3.6s ease infinite;
          position: absolute;
          left: 0;
        }
        
        @keyframes circle-outer {
          0% {
            stroke-dashoffset: 25;
          }
          25% {
            stroke-dashoffset: 0;
          }
          65% {
            stroke-dashoffset: 301;
          }
          80% {
            stroke-dashoffset: 276;
          }
          100% {
            stroke-dashoffset: 276;
          }
        }
        
        @keyframes circle-middle {
          0% {
            stroke-dashoffset: 17;
          }
          25% {
            stroke-dashoffset: 0;
          }
          65% {
            stroke-dashoffset: 204;
          }
          80% {
            stroke-dashoffset: 187;
          }
          100% {
            stroke-dashoffset: 187;
          }
        }
        
        @keyframes circle-inner {
          0% {
            stroke-dashoffset: 9;
          }
          25% {
            stroke-dashoffset: 0;
          }
          65% {
            stroke-dashoffset: 106;
          }
          80% {
            stroke-dashoffset: 97;
          }
          100% {
            stroke-dashoffset: 97;
          }
        }
        
        @keyframes text-animation {
          0% {
            clip-path: inset(0 100% 0 0);
          }
          50% {
            clip-path: inset(0);
          }
          100% {
            clip-path: inset(0 0 0 100%);
          }
        }
      `}</style>
    </div>
  );
};

// Orbital Loader - Good for showing verification in progress
export const OrbitalLoader = ({ size = 100 }) => {
  return (
    <div className="orbital-container">
      <svg className="pl" viewBox="0 0 160 160" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#000"></stop>
            <stop offset="100%" stopColor="#fff"></stop>
          </linearGradient>
          <mask id="mask1">
            <rect x="0" y="0" width="160" height="160" fill="url(#grad)"></rect>
          </mask>
          <mask id="mask2">
            <rect x="28" y="28" width="104" height="104" fill="url(#grad)"></rect>
          </mask>
        </defs>
        
        <g>
          <g className="pl__ring-rotate">
            <circle className="pl__ring-stroke" cx="80" cy="80" r="72" fill="none" stroke="hsl(223,90%,55%)" strokeWidth="16" strokeDasharray="452.39 452.39" strokeDashoffset="452" strokeLinecap="round" transform="rotate(-45,80,80)"></circle>
          </g>
        </g>
        <g mask="url(#mask1)">
          <g className="pl__ring-rotate">
            <circle className="pl__ring-stroke" cx="80" cy="80" r="72" fill="none" stroke="hsl(193,90%,55%)" strokeWidth="16" strokeDasharray="452.39 452.39" strokeDashoffset="452" strokeLinecap="round" transform="rotate(-45,80,80)"></circle>
          </g>
        </g>
        
        <g>
          <g strokeWidth="4" strokeDasharray="12 12" strokeDashoffset="12" strokeLinecap="round" transform="translate(80,80)">
            <polyline className="pl__tick" stroke="hsl(223,10%,90%)" points="0,2 0,14" transform="rotate(-135,0,0) translate(0,40)"></polyline>
            <polyline className="pl__tick" stroke="hsl(223,10%,90%)" points="0,2 0,14" transform="rotate(-90,0,0) translate(0,40)"></polyline>
            <polyline className="pl__tick" stroke="hsl(223,10%,90%)" points="0,2 0,14" transform="rotate(-45,0,0) translate(0,40)"></polyline>
            <polyline className="pl__tick" stroke="hsl(223,10%,90%)" points="0,2 0,14" transform="rotate(0,0,0) translate(0,40)"></polyline>
            <polyline className="pl__tick" stroke="hsl(223,10%,90%)" points="0,2 0,14" transform="rotate(45,0,0) translate(0,40)"></polyline>
            <polyline className="pl__tick" stroke="hsl(223,10%,90%)" points="0,2 0,14" transform="rotate(90,0,0) translate(0,40)"></polyline>
            <polyline className="pl__tick" stroke="hsl(223,10%,90%)" points="0,2 0,14" transform="rotate(135,0,0) translate(0,40)"></polyline>
            <polyline className="pl__tick" stroke="hsl(223,10%,90%)" points="0,2 0,14" transform="rotate(180,0,0) translate(0,40)"></polyline>
          </g>
        </g>
        <g mask="url(#mask1)">
          <g strokeWidth="4" strokeDasharray="12 12" strokeDashoffset="12" strokeLinecap="round" transform="translate(80,80)">
            <polyline className="pl__tick" stroke="hsl(223,90%,80%)" points="0,2 0,14" transform="rotate(-135,0,0) translate(0,40)"></polyline>
            <polyline className="pl__tick" stroke="hsl(223,90%,80%)" points="0,2 0,14" transform="rotate(-90,0,0) translate(0,40)"></polyline>
            <polyline className="pl__tick" stroke="hsl(223,90%,80%)" points="0,2 0,14" transform="rotate(-45,0,0) translate(0,40)"></polyline>
            <polyline className="pl__tick" stroke="hsl(223,90%,80%)" points="0,2 0,14" transform="rotate(0,0,0) translate(0,40)"></polyline>
            <polyline className="pl__tick" stroke="hsl(223,90%,80%)" points="0,2 0,14" transform="rotate(45,0,0) translate(0,40)"></polyline>
            <polyline className="pl__tick" stroke="hsl(223,90%,80%)" points="0,2 0,14" transform="rotate(90,0,0) translate(0,40)"></polyline>
            <polyline className="pl__tick" stroke="hsl(223,90%,80%)" points="0,2 0,14" transform="rotate(135,0,0) translate(0,40)"></polyline>
            <polyline className="pl__tick" stroke="hsl(223,90%,80%)" points="0,2 0,14" transform="rotate(180,0,0) translate(0,40)"></polyline>
          </g>
        </g>
        
        <g>
          <g transform="translate(64,28)">
            <g className="pl__arrows" transform="rotate(45,16,52)">
              <path fill="hsl(3,90%,55%)" d="M17.998,1.506l13.892,43.594c.455,1.426-.56,2.899-1.998,2.899H2.108c-1.437,0-2.452-1.473-1.998-2.899L14.002,1.506c.64-2.008,3.356-2.008,3.996,0Z"></path>
              <path fill="hsl(223,10%,90%)" d="M14.009,102.499L.109,58.889c-.453-1.421,.559-2.889,1.991-2.889H29.899c1.433,0,2.444,1.468,1.991,2.889l-13.899,43.61c-.638,2.001-3.345,2.001-3.983,0Z"></path>
            </g>
          </g>
        </g>
        <g mask="url(#mask2)">
          <g transform="translate(64,28)">
            <g className="pl__arrows" transform="rotate(45,16,52)">
              <path fill="hsl(333,90%,55%)" d="M17.998,1.506l13.892,43.594c.455,1.426-.56,2.899-1.998,2.899H2.108c-1.437,0-2.452-1.473-1.998-2.899L14.002,1.506c.64-2.008,3.356-2.008,3.996,0Z"></path>
              <path fill="hsl(223,90%,80%)" d="M14.009,102.499L.109,58.889c-.453-1.421,.559-2.889,1.991-2.889H29.899c1.433,0,2.444,1.468,1.991,2.889l-13.899,43.61c-.638,2.001-3.345,2.001-3.983,0Z"></path>
            </g>
          </g>
        </g>
      </svg>
      
      <style jsx>{`
        .orbital-container {
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .pl {
          display: block;
        }
        
        .pl__arrows,
        .pl__ring-rotate,
        .pl__ring-stroke,
        .pl__tick {
          animation-duration: 2s;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        
        .pl__arrows {
          animation-name: arrows;
          transform: rotate(45deg);
          transform-origin: 16px 52px;
        }
        
        .pl__ring-rotate,
        .pl__ring-stroke {
          transform-origin: 80px 80px;
        }
        
        .pl__ring-rotate {
          animation-name: ringRotate;
        }
        
        .pl__ring-stroke {
          animation-name: ringStroke;
          transform: rotate(-45deg);
        }
        
        .pl__tick {
          animation-name: tick;
        }
        
        .pl__tick:nth-child(2) {
          animation-delay: -1.75s;
        }
        
        .pl__tick:nth-child(3) {
          animation-delay: -1.5s;
        }
        
        .pl__tick:nth-child(4) {
          animation-delay: -1.25s;
        }
        
        .pl__tick:nth-child(5) {
          animation-delay: -1s;
        }
        
        .pl__tick:nth-child(6) {
          animation-delay: -0.75s;
        }
        
        .pl__tick:nth-child(7) {
          animation-delay: -0.5s;
        }
        
        .pl__tick:nth-child(8) {
          animation-delay: -0.25s;
        }
        
        /* Animations */
        @keyframes arrows {
          from {
            transform: rotate(45deg);
          }
          to {
            transform: rotate(405deg);
          }
        }
        
        @keyframes ringRotate {
          from {
            transform: rotate(0);
          }
          to {
            transform: rotate(720deg);
          }
        }
        
        @keyframes ringStroke {
          from,
          to {
            stroke-dashoffset: 452;
            transform: rotate(-45deg);
          }
          50% {
            stroke-dashoffset: 169.5;
            transform: rotate(-180deg);
          }
        }
        
        @keyframes tick {
          from,
          3%,
          47%,
          to {
            stroke-dashoffset: -12;
          }
          14%,
          36% {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
};

// A simple wrapper component to center loaders in a container with optional message
export const LoadingContainer = ({ children, message, size = 'md' }) => {
  const padding = {
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6'
  };
  
  return (
    <div className={`flex flex-col items-center justify-center ${padding[size]}`}>
      <div className="mb-2">
        {children}
      </div>
      {message && (
        <div className="mt-4 text-center" style={{ color: 'var(--foreground)' }}>
          {message}
        </div>
      )}
    </div>
  );
};

// Connection Error animation - For network errors
export const ConnectionError = ({ size = 100, message = "Connection Error" }) => {
  return (
    <div className="connection-error">
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path className="wifi-ring wifi-error" d="M12 3C7.03 3 2.81 5.72 0.78 9.75" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path className="wifi-ring" d="M8.5 10.5C9.88 9.27 11.86 9.03 13.5 10.5" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path className="wifi-ring wifi-error" d="M23.22 9.75C21.19 5.72 16.97 3 12 3" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path className="wifi-ring" d="M15.5 10.5C14.12 9.27 12.14 9.03 10.5 10.5" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="15" r="2" fill="#ef4444"/>
        <line className="cross-line" x1="4" y1="4" x2="20" y2="20" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      {message && <p className="error-message">{message}</p>}
      
      <style jsx>{`
        .connection-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        
        .wifi-ring {
          opacity: 0.7;
        }
        
        .wifi-error {
          animation: pulse 2s infinite;
        }
        
        .cross-line {
          animation: fadeIn 0.5s ease-in;
        }
        
        .error-message {
          margin-top: 12px;
          color: #ef4444;
          font-size: ${size * 0.16}px;
          font-weight: 500;
        }
        
        @keyframes pulse {
          0% {
            opacity: 0.7;
          }
          50% {
            opacity: 0.3;
          }
          100% {
            opacity: 0.7;
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};