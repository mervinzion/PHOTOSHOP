import React, { useState, useEffect } from 'react';

const APIDebugger = ({ imageData, preset, dimensions }) => {
    const [debugInfo, setDebugInfo] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const checkConnection = async () => {
            try {
                // Check health endpoint
                const healthCheck = await fetch('http://localhost:8000/api/health');
                const healthData = await healthCheck.json();
                
                // Check config endpoint
                const configCheck = await fetch('http://localhost:8000/api/config');
                const configData = await configCheck.json();
                
                setDebugInfo({
                    health: healthData,
                    config: configData,
                    requestDimensions: dimensions,
                    imageSize: imageData ? `${imageData.width}x${imageData.height}` : 'No image'
                });
            } catch (err) {
                setError(`Connection error: ${err.message}`);
            }
        };

        checkConnection();
    }, [imageData, dimensions]);

    if (error) {
        return (
            <div className="fixed bottom-24 left-4 bg-red-100 p-4 rounded-lg shadow-lg border border-red-200 max-w-md text-red-700">
                {error}
            </div>
        );
    }

    if (!debugInfo) {
        return <div>Checking connection...</div>;
    }

    return (
        <div className="fixed bottom-24 left-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200 max-w-md">
            <h3 className="font-medium mb-2">Debug Information</h3>
            <div className="space-y-2 text-sm">
                <div>
                    <strong>Backend Status:</strong> {debugInfo.health.status}
                </div>
                <div>
                    <strong>Model Loaded:</strong> {String(debugInfo.health.model_loaded)}
                </div>
                <div>
                    <strong>CUDA Available:</strong> {String(debugInfo.health.cuda_available)}
                </div>
                <div>
                    <strong>Requested Dimensions:</strong> {dimensions?.width}x{dimensions?.height}
                </div>
                <div>
                    <strong>Max Image Size:</strong> {debugInfo.config.max_image_size}
                </div>
            </div>
        </div>
    );
};

export default APIDebugger;