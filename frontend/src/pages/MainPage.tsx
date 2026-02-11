import React, { useState } from 'react';
import { FileUpload } from '../components/FileUpload';
import { ResultCard } from '../components/ResultCard';
import { AnalysisHistory } from '../components/AnalysisHistory';
import '../styles/main-page.css';

interface AnalysisResult {
  success: boolean;
  analysisId: string;
  status: 'ok' | 'divergencies' | 'error';
  message: string;
  pdfContents: any[];
  divergencies: any[];
  timestamp: string;
}

export const MainPage: React.FC = () => {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const handleAnalysisComplete = (result: AnalysisResult) => {
    setAnalysisResult(result);
    setShowHistory(false);
  };

  return (
    <div className="main-page">
      <header className="app-header">
        <div className="header-content">
          <h1>🏢 Validador de PDFs de Seguros</h1>
          <p>Analise e valide documentos de seguros com inteligência artificial</p>
        </div>
        <button
          className="history-toggle"
          onClick={() => setShowHistory(!showHistory)}
        >
          {showHistory ? 'Voltar ao Upload' : 'Ver Histórico'}
        </button>
      </header>

      <main className="page-content">
        {!showHistory ? (
          <>
            <section className="upload-section">
              <FileUpload onAnalysisComplete={handleAnalysisComplete} />
            </section>

            {analysisResult && (
              <section className="result-section">
                <ResultCard
                  status={analysisResult.status}
                  message={analysisResult.message}
                  divergencies={analysisResult.divergencies}
                  fileCount={analysisResult.pdfContents?.length || 0}
                  timestamp={analysisResult.timestamp}
                />
              </section>
            )}
          </>
        ) : (
          <section className="history-section">
            <AnalysisHistory />
          </section>
        )}
      </main>

      <footer className="app-footer">
        <p>© 2026 Validador de Seguros | Análise com IA OpenAI</p>
      </footer>
    </div>
  );
};
