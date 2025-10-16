import * as React from "react";
import { cn } from "../../lib/utils";

const Avatar = React.forwardRef(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center overflow-hidden rounded-full bg-muted h-10 w-10",
      className
    )}
    {...props}
  />
));
Avatar.displayName = "Avatar";

const AvatarImage = React.forwardRef(({ className, ...props }, ref) => (
  <img
    ref={ref}
    className={cn("object-cover w-full h-full", className)}
    {...props}
  />
));
AvatarImage.displayName = "AvatarImage";

const AvatarFallback = React.forwardRef(({ className, children, ...props }, ref) => (
  <span
    ref={ref}
    className={cn("flex items-center justify-center w-full h-full text-sm font-medium text-muted-foreground bg-muted", className)}
    {...props}
  >
    {children}
  </span>
));
AvatarFallback.displayName = "AvatarFallback";

export { Avatar, AvatarImage, AvatarFallback }; 