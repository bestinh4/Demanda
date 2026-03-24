/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { cn } from '@/src/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, title, subtitle, footer, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md',
          className
        )}
        {...props}
      >
        {(title || subtitle) && (
          <div className="border-b border-slate-100 p-6">
            {title && <h3 className="text-lg font-semibold text-slate-900">{title}</h3>}
            {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
          </div>
        )}
        <div className="p-6">{children}</div>
        {footer && (
          <div className="border-t border-slate-100 bg-slate-50/50 p-4 px-6">
            {footer}
          </div>
        )}
      </div>
    );
  }
);

Card.displayName = 'Card';
