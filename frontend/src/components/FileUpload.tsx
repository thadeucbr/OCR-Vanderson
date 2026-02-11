import React, { useState, useRef } from 'react';
import { analysisAPI } from '../services/api';
import '../styles/upload.css';

interface UploadProps {
  onAnalysisComplete?: (result: any) => void;
}

export const FileUpload: React.FC<UploadProps> = ({ onAnalysisComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const selectedFile = files[0];
      if (selectedFile.name.endsWith('.zip')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Por favor, envie um arquivo ZIP');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];
      if (selectedFile.name.endsWith('.zip')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Por favor, envie um arquivo ZIP');
      }
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Por favor, selecione um arquivo');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await analysisAPI.uploadAndAnalyze(file);
      setSuccess(true);
      setFile(null);
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 2000);

      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erro ao processar arquivo. Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-container">
      <div
        className="drop-zone"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {file ? (
          <>
            <p className="drop-zone-text">✓ Arquivo selecionado:</p>
            <p className="file-name">{file.name}</p>
            <p className="file-size">({(file.size / 1024 / 1024).toFixed(2)} MB)</p>
          </>
        ) : (
          <>
            <p className="drop-zone-text">📁 Arraste um arquivo ZIP aqui</p>
            <p className="drop-zone-subtext">ou clique para selecionar</p>
          </>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">✓ Análise realizada com sucesso!</div>}

      <button
        className="submit-button"
        onClick={handleSubmit}
        disabled={!file || loading}
      >
        {loading ? 'Processando...' : 'Analisar PDFs'}
      </button>
    </div>
  );
};
