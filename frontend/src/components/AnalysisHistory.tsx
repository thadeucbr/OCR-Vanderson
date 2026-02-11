import React, { useState, useEffect } from 'react';
import { analysisAPI } from '../services/api';
import '../styles/history.css';

export const AnalysisHistory: React.FC = () => {
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadAnalyses = async (page: number = 1) => {
    setLoading(true);
    try {
      const result = await analysisAPI.getAnalyses(page, 5);
      setAnalyses(result.data);
      setTotalPages(result.pagination.pages);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading analyses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyses();
  }, []);

  return (
    <div className="history-container">
      <h2>Histórico de Análises</h2>

      {loading ? (
        <p className="loading">Carregando...</p>
      ) : analyses.length === 0 ? (
        <p className="empty-state">Nenhuma análise realizada ainda</p>
      ) : (
        <>
          <div className="analyses-list">
            {analyses.map((analysis) => (
              <div
                key={analysis._id}
                className={`history-item status-${analysis.status}`}
              >
                <button
                  className="history-item-button"
                  onClick={() => setExpandedId(expandedId === analysis._id ? null : analysis._id)}
                >
                  <div className="history-item-header">
                    <span className="status-badge">{analysis.status === 'ok' ? '✓' : '⚠'}</span>
                    <span className="item-date">
                      {new Date(analysis.timestamp).toLocaleDateString('pt-BR')}{' '}
                      {new Date(analysis.timestamp).toLocaleTimeString('pt-BR')}
                    </span>
                    <span className="expand-icon">
                      {expandedId === analysis._id ? '▼' : '▶'}
                    </span>
                  </div>
                  <div className="history-item-message">
                    <p>{analysis.message}</p>
                  </div>
                  <div className="history-item-info">
                    <span>{analysis.pdfContents?.length || 0} arquivo(s)</span>
                    {analysis.divergencies?.length > 0 && (
                      <span className="divergency-count">
                        {analysis.divergencies.length} divergência(s)
                      </span>
                    )}
                  </div>
                </button>

                {expandedId === analysis._id && (
                  <div className="history-item-details">
                    {analysis.divergencies && analysis.divergencies.length > 0 ? (
                      <div className="divergencies-detail">
                        <h4>Divergências Encontradas:</h4>
                        {analysis.divergencies.map((div: any, idx: number) => (
                          <div key={idx} className="divergency-detail-item">
                            <div className="divergency-type-badge">{div.type}</div>
                            <div className="divergency-detail-content">
                              <p className="divergency-field"><strong>Campo:</strong> {div.field}</p>
                              <p className="divergency-files"><strong>Arquivos:</strong> {div.files?.join(', ') || 'N/A'}</p>
                              {div.values && (
                                <p className="divergency-values">
                                  <strong>Valores:</strong> {JSON.stringify(div.values)}
                                </p>
                              )}
                              {div.description && (
                                <p className="divergency-desc"><strong>Descrição:</strong> {div.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="divergencies-detail">
                        <p className="success-message">✓ Nenhuma divergência encontrada</p>
                      </div>
                    )}

                    {analysis.pdfContents && (
                      <div className="extracted-data-detail">
                        <h4>Dados Extraídos:</h4>
                        {analysis.pdfContents.map((pdf: any, idx: number) => (
                          <div key={idx} className="pdf-data-item">
                            <p className="pdf-name"><strong>{pdf.fileName}</strong></p>
                            {pdf.personalData && Object.keys(pdf.personalData).length > 0 && (
                              <div className="data-section">
                                <strong>Dados Pessoais:</strong>
                                <ul>
                                  {Object.entries(pdf.personalData).map(([key, value]) => (
                                    <li key={key}>{key}: {String(value)}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {pdf.vehicleData && Object.keys(pdf.vehicleData).length > 0 && (
                              <div className="data-section">
                                <strong>Dados do Veículo:</strong>
                                <ul>
                                  {Object.entries(pdf.vehicleData).map(([key, value]) => (
                                    <li key={key}>{key}: {String(value)}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => loadAnalyses(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ← Anterior
              </button>
              <span>
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => loadAnalyses(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Próxima →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
