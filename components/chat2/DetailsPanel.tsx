import React from "react";

const DetailsPanel = () => {
    return (
        <div className="h-full p-6 overflow-y-auto">
            <div className="text-xl font-semibold text-gray-800 mb-4">Details Panel</div>
            <div className="text-gray-600">
                {/* Placeholder for results, documents, recommendations, etc. */}
                <p>This panel will display property results, market insights, or additional chatbot recommendations.</p>
            </div>
        </div>
    );
};

export default DetailsPanel;
