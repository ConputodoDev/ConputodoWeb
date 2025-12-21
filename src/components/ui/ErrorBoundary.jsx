import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error capturado por Boundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-gray-50">
          <div className="max-w-md p-8 bg-white border-t-4 border-red-500 shadow-xl rounded-2xl">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 text-red-500 bg-red-100 rounded-full">
              <AlertTriangle size={32} />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">¡Ups! Algo salió mal</h1>
            <p className="mb-6 text-gray-500">Ha ocurrido un error inesperado. Hemos registrado el problema.</p>
            
            <button 
              onClick={() => window.location.reload()} 
              className="flex items-center justify-center w-full gap-2 py-3 font-bold text-white transition-colors bg-gray-900 rounded-xl hover:bg-black"
            >
              <RefreshCw size={18} /> Recargar Página
            </button>

            {/* Solo mostrar detalles técnicos en desarrollo */}
            {import.meta.env.DEV && this.state.errorInfo && (
              <details className="p-3 mt-6 overflow-auto font-mono text-xs text-left text-red-700 bg-gray-100 rounded max-h-40">
                <summary className="mb-1 font-bold cursor-pointer">Detalles del Error (Dev Only)</summary>
                {this.state.errorInfo.componentStack}
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;