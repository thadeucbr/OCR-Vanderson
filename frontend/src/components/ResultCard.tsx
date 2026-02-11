import React from 'react';
import '../styles/result-card.css';

interface Divergency {
  type: 'missing_field' | 'inconsistent_data' | 'invalid_format' | 'anomaly';
  field: string;
  file1: string;
  file2?: string;
  value1?: string;
  value2?: string;
  description: string;
}

interface ResultCardProps {
  status: 'ok' | 'divergencies' | 'error';
  message: string;
  divergencies?: Divergency[];
  fileCount: number;
  timestamp: string;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  status,
  message,
  divergencies = [],
  fileCount,
  timestamp,
}) => {
  const statusIcon = {
    ok: '✓',
    divergencies: '⚠',
    error: '✗',
  };

  const statusLabel = {
    ok: 'Tudo OK',
    divergencies: 'Divergências Encontradas',
    error: 'Erro na Análise',
  };

  return (
    <div className={`result-card result-${status}`}>
      <div className="result-header">
        <div className="status-icon">{statusIcon[status]}</div>
        <div className="status-info">
          <h2>{statusLabel[status]}</h2>
          <p className="message">{message}</p>
          <p className="timestamp">
            {fileCount} arquivo(s) analisado(s) em {new Date(timestamp).toLocaleString('pt-BR')}
          </p>
        </div>
      </div>

      {status === 'ok' && (
        <div className="success-content">
          <p className="success-message">
            ✓ Documentos estão aptos para prosseguimento
          </p>
        </div>
      )}

      {status === 'divergencies' && divergencies.length > 0 && (
        <div className="divergencies-content">
          <h3>Divergências Encontradas:</h3>
          <div className="divergencies-list">
            {divergencies.map((div: any, idx: number) => (
              <div key={idx} className={`divergency-item divergency-${div.type}`}>
                <div className="divergency-header">
                  <span className="type-badge">{div.type}</span>
                  <span className="field-name">{div.field}</span>
                </div>
                <div className="divergency-details">
                  {/* Novo formato com array de files */}
                  {div.files && Array.isArray(div.files) && (
                    <>
                      {div.files.map((file: string, fileIdx: number) => (
                        <p key={fileIdx}>
                          <strong>Arquivo {fileIdx + 1}:</strong> {file}
                          {div.values && div.values[file] && (
                            <span className="value"> → {div.values[file]}</span>
                          )}
                        </p>
                      ))}
                    </>
                  )}
                  
                  {/* Formato antigo (compatibilidade) */}
                  {!div.files && (
                    <>
                      <p>
                        <strong>Arquivo 1:</strong> {div.file1}
                        {div.value1 && <span className="value"> → {div.value1}</span>}
                      </p>
                      {div.file2 && (
                        <p>
                          <strong>Arquivo 2:</strong> {div.file2}
                          {div.value2 && <span className="value"> → {div.value2}</span>}
                        </p>
                      )}
                    </>
                  )}
                  
                  <p className="description">{div.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="error-content">
          <p className="error-text">Erro ao processar os documentos. Verifique o arquivo e tente novamente.</p>
        </div>
      )}
    </div>
  );
};
