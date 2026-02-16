import React from 'react';
import { MONTH_NAMES } from './constants';

/**
 * Render a text string, auto-linking any URLs found within it.
 * Used in SchematicSidebar and SeedbedView for notes display.
 */
export function renderNotes(notes: string | null): React.ReactNode[] | null {
    if (!notes) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return notes.split(urlRegex).map((part, i) => {
        if (part.match(urlRegex)) {
            return React.createElement('a', {
                key: i,
                href: part,
                target: '_blank',
                rel: 'noopener noreferrer',
                className: 'text-blue-500 hover:underline break-all',
                onClick: (e: React.MouseEvent) => e.stopPropagation(),
            }, part);
        }
        return part;
    });
}

/**
 * Safely parse placement metadata from string or object form.
 */
export function parseMetadata(metadata: string | Record<string, unknown> | null | undefined): Record<string, unknown> {
    if (!metadata) return {};
    if (typeof metadata === 'string') {
        try { return JSON.parse(metadata); } catch { return {}; }
    }
    return metadata;
}

/**
 * Format a month range like "Mar - Sep" from 1-indexed month numbers.
 */
export function formatMonthRange(start: number | null, end: number | null): string {
    if (!start || !end) return 'Not set';
    if (start === end) return MONTH_NAMES[start - 1];
    return `${MONTH_NAMES[start - 1]} - ${MONTH_NAMES[end - 1]}`;
}
