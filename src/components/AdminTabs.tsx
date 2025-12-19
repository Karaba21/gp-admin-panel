'use client';

import { useState } from 'react';

interface AdminTabsProps {
    children: React.ReactNode[];
}

export default function AdminTabs({ children }: AdminTabsProps) {
    const [activeTab, setActiveTab] = useState(0);

    const tabs = ['Agregar Auto', 'Gestionar Autos', 'Leads/Cupones'];

    return (
        <div>
            <div className="admin-tabs">
                {tabs.map((tab, index) => (
                    <button
                        key={tab}
                        className={`tab-btn ${activeTab === index ? 'active' : ''}`}
                        onClick={() => setActiveTab(index)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {children.map((child, index) => (
                <div
                    key={index}
                    className={`tab-content ${activeTab === index ? 'active' : ''}`}
                >
                    {child}
                </div>
            ))}
        </div>
    );
}
