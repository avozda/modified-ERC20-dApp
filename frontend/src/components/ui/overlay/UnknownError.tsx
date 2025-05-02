import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../button";

interface UnknownErrorProps {
    title?: string;
    message?: string;
    onRetry?: () => void;
    className?: string;
}

export function UnknownError({
    title = "Something went wrong",
    message = "An unexpected error occurred. Please try again.",
    onRetry,
    className
}: UnknownErrorProps) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm h-full",
            className
        )}>
            <div className="w-full max-w-md p-6 bg-card border rounded-lg shadow-lg flex flex-col items-center space-y-4">
                <AlertTriangle className="size-12 text-destructive" />
                <h2 className="text-xl font-bold text-card-foreground">{title}</h2>
                <p className="text-center text-muted-foreground">{message}</p>

                {onRetry && (
                    <Button
                        onClick={onRetry}
                        variant="default"
                        className="mt-2"
                    >
                        <RefreshCw className="size-4 mr-2" /> Try Again
                    </Button>
                )}
            </div>
        </div>
    );
}