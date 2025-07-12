import * as React from "react";
import { cn } from "../../lib/utils";

/**
 * Componente Alert do Shadcn UI adaptado para o BoletoXCrypto
 * 
 * @param {Object} props - Propriedades do componente
 */
const Alert = React.forwardRef(({ className, variant = "default", ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(
      "relative w-full rounded-lg border p-4",
      {
        "bg-background text-foreground": variant === "default",
        "border-destructive/50 text-destructive dark:border-destructive": variant === "destructive",
        "border-greenPrimary/50 bg-greenLight text-greenDark": variant === "success",
        "border-yellow-500/50 bg-yellow-50 text-yellow-800": variant === "warning",
      },
      className
    )}
    {...props}
  />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
