import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Erreur capturée par ErrorBoundary:", error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReload = (): void => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full shadow-lg">
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-destructive/10 p-3">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-2xl">Une erreur est survenue</CardTitle>
              <CardDescription className="text-base">
                Nous sommes désolés, une erreur inattendue s'est produite.
                Veuillez recharger l'application pour continuer.
              </CardDescription>
            </CardHeader>

            {import.meta.env.DEV && this.state.error && (
              <CardContent className="space-y-2">
                <div className="bg-destructive/5 rounded-md p-4 border border-destructive/20">
                  <p className="text-sm font-semibold text-destructive mb-2">
                    Détails de l'erreur (mode développement):
                  </p>
                  <p className="text-xs font-mono text-destructive/80 break-words">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <details className="mt-2">
                      <summary className="text-xs font-semibold text-destructive cursor-pointer">
                        Stack trace
                      </summary>
                      <pre className="text-xs mt-2 overflow-auto max-h-32 text-destructive/70">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              </CardContent>
            )}

            <CardFooter className="flex justify-center">
              <Button
                onClick={this.handleReload}
                className="w-full sm:w-auto"
                size="lg"
              >
                Recharger l'application
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
