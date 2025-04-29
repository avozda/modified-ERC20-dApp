import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageLoaderProps {
    message?: string;
    className?: string;
}

export function PageLoader({ message = "Loading...", className }: PageLoaderProps) {
    return (
        <div className={cn(
            "flex flex-col align-center items-center justify-center bg-background/80 backdrop-blur-sm h-full",
            className
        )}>
            <div className="flex flex-col items-center space-y-4">
                <Loader2 className="size-12 animate-spin text-primary" />
                <p className="text-lg font-medium text-foreground">{message}</p>
            </div>
        </div>
    );
}