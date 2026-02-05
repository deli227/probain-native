import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  resetKey?: string; // Quand cette valeur change, l'erreur est automatiquement resetee
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

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // Auto-recovery: si resetKey change (ex: navigation vers un autre onglet), reset l'erreur
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null, errorInfo: null });
    }
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
        <div className="min-h-screen bg-primary-dark flex items-center justify-center p-4">
          <Card className="max-w-md w-full bg-white/10 backdrop-blur-xl border border-white/10 shadow-2xl">
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-red-500/15 p-3 border border-red-500/20">
                  <AlertCircle className="h-8 w-8 text-red-400" />
                </div>
              </div>
              <CardTitle className="text-2xl text-white">Une erreur est survenue</CardTitle>
              <CardDescription className="text-base text-white/60">
                Nous sommes désolés, une erreur inattendue s'est produite.
                Veuillez recharger l'application pour continuer.
              </CardDescription>
            </CardHeader>

            {import.meta.env.DEV && this.state.error && (
              <CardContent className="space-y-2">
                <div className="bg-red-500/10 rounded-md p-4 border border-red-500/20">
                  <p className="text-sm font-semibold text-red-400 mb-2">
                    Détails de l'erreur (mode développement):
                  </p>
                  <p className="text-xs font-mono text-red-300/80 break-words">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <details className="mt-2">
                      <summary className="text-xs font-semibold text-red-400 cursor-pointer">
                        Stack trace
                      </summary>
                      <pre className="text-xs mt-2 overflow-auto max-h-32 text-red-300/70">
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
                className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25"
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
