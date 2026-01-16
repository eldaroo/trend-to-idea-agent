"use client";

import { useState } from "react";

interface RefineModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: {
        timeframe: string;
        region: string;
        include: string;
        exclude: string;
    }) => void;
}

export function RefineModal({ isOpen, onClose, onSubmit }: RefineModalProps) {
    const [timeframe, setTimeframe] = useState("7d");
    const [region, setRegion] = useState("Global");
    const [include, setInclude] = useState("");
    const [exclude, setExclude] = useState("");

    if (!isOpen) return null;

    const handleSubmit = () => {
        onSubmit({ timeframe, region, include, exclude });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0, 0, 0, 0.7)' }}>
            <div className="w-full max-w-md p-6 rounded-2xl animate-fade-in"
                style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)'
                }}>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Refine Research
                    </h3>
                    <button onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                        style={{
                            background: 'var(--bg-elevated)',
                            color: 'var(--text-muted)'
                        }}>
                        ✕
                    </button>
                </div>

                {/* Form */}
                <div className="space-y-4">
                    {/* Timeframe */}
                    <div>
                        <label className="block text-sm font-medium mb-2"
                            style={{ color: 'var(--text-secondary)' }}>
                            Timeframe
                        </label>
                        <select
                            value={timeframe}
                            onChange={(e) => setTimeframe(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg text-sm"
                            style={{
                                background: 'var(--bg-elevated)',
                                border: '1px solid var(--border-default)',
                                color: 'var(--text-primary)'
                            }}>
                            <option value="24h">Last 24 hours</option>
                            <option value="7d">Last 7 days</option>
                            <option value="30d">Last 30 days</option>
                        </select>
                    </div>

                    {/* Region */}
                    <div>
                        <label className="block text-sm font-medium mb-2"
                            style={{ color: 'var(--text-secondary)' }}>
                            Region
                        </label>
                        <select
                            value={region}
                            onChange={(e) => setRegion(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg text-sm"
                            style={{
                                background: 'var(--bg-elevated)',
                                border: '1px solid var(--border-default)',
                                color: 'var(--text-primary)'
                            }}>
                            <option value="Global">Global</option>
                            <option value="US">United States</option>
                            <option value="Europe">Europe</option>
                            <option value="Asia">Asia</option>
                            <option value="Latin America">Latin America</option>
                        </select>
                    </div>

                    {/* Include topics */}
                    <div>
                        <label className="block text-sm font-medium mb-2"
                            style={{ color: 'var(--text-secondary)' }}>
                            Include topics
                        </label>
                        <input
                            type="text"
                            value={include}
                            onChange={(e) => setInclude(e.target.value)}
                            placeholder="e.g., AI, startups, technology"
                            className="w-full px-4 py-2.5 rounded-lg text-sm"
                            style={{
                                background: 'var(--bg-elevated)',
                                border: '1px solid var(--border-default)',
                                color: 'var(--text-primary)'
                            }}
                        />
                    </div>

                    {/* Exclude topics */}
                    <div>
                        <label className="block text-sm font-medium mb-2"
                            style={{ color: 'var(--text-secondary)' }}>
                            Exclude topics
                        </label>
                        <input
                            type="text"
                            value={exclude}
                            onChange={(e) => setExclude(e.target.value)}
                            placeholder="e.g., politics, crypto"
                            className="w-full px-4 py-2.5 rounded-lg text-sm"
                            style={{
                                background: 'var(--bg-elevated)',
                                border: '1px solid var(--border-default)',
                                color: 'var(--text-primary)'
                            }}
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                    <button onClick={handleSubmit}
                        className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors"
                        style={{
                            background: 'var(--accent)',
                            color: 'white'
                        }}>
                        Apply & Re-search
                    </button>
                    <button onClick={onClose}
                        className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors"
                        style={{
                            background: 'var(--bg-elevated)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-default)'
                        }}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
