import React from 'react';
import { Loader2 } from 'lucide-react';

export function Loader({ message = "Loading...", size = "default", className = "" }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-8 w-8",
    lg: "h-12 w-12"
  };

  return React.createElement(
    "div",
    { className: `flex flex-col items-center justify-center space-y-4 ${className}` },
    React.createElement(
      Loader2,
      {
        className: `${sizeClasses[size]} animate-spin text-blue-600 dark:text-blue-400`
      }
    ),
    message && React.createElement(
      "p",
      { className: "text-sm font-medium text-gray-700 dark:text-gray-300" },
      message
    )
  );
}

export function PageLoader({ message = "Loading..." }) {
  return React.createElement(
    "div",
    { className: "flex items-center justify-center min-h-[400px] w-full" },
    React.createElement(Loader, { message, size: "lg", className: "py-12" })
  );
}

export function InlineLoader({ message = "Loading..." }) {
  return React.createElement(
    "div",
    { className: "flex items-center justify-center py-12" },
    React.createElement(Loader, { message, size: "default" })
  );
}

export function TableLoader({ message = "Loading..." }) {
  return React.createElement(
    "div",
    { className: "flex items-center justify-center py-8" },
    React.createElement(Loader, { message, size: "default" })
  );
}

