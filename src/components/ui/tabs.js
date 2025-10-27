import React from "react";
import { cn } from "../../lib/utils";

const Tabs = ({ className, children, defaultValue, onValueChange, ...props }) => {
  const [value, setValue] = React.useState(defaultValue);

  const handleValueChange = (newValue) => {
    setValue(newValue);
    if (onValueChange) {
      onValueChange(newValue);
    }
  };

  return (
    <div className={cn("w-full", className)} {...props}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { value, onValueChange: handleValueChange });
        }
        return child;
      })}
    </div>
  );
};

const TabsList = ({ className, children, value, onValueChange, ...props }) => {
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        className
      )}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { value, onValueChange });
        }
        return child;
      })}
    </div>
  );
};

const TabsTrigger = ({ className, children, value: currentValue, onValueChange, triggerValue, ...props }) => {
  const isActive = currentValue === triggerValue;

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive && "bg-background text-foreground shadow-sm",
        className
      )}
      onClick={() => onValueChange && onValueChange(triggerValue)}
      {...props}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ className, children, value: currentValue, contentValue, ...props }) => {
  if (currentValue !== contentValue) return null;

  return (
    <div
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };
