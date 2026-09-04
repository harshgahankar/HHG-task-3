import { createContext, useContext, useState, useCallback } from 'react';

const PipelineContext = createContext(null);

export function PipelineProvider({ children }) {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [faces, setFaces] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [fingerprint, setFingerprint] = useState(null);
  const [anchorResult, setAnchorResult] = useState(null);
  const [chainStatus, setChainStatus] = useState(null);

  const uploadImage = useCallback((file) => {
    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setUploadedImage(ev.target.result);
    reader.readAsDataURL(file);
  }, []);

  const reset = useCallback(() => {
    setUploadedFile(null);
    setUploadedImage(null);
    setFaces([]);
    setSearchResults([]);
    setSelectedResult(null);
    setFingerprint(null);
    setAnchorResult(null);
  }, []);

  return (
    <PipelineContext.Provider value={{
      uploadedFile, uploadedImage, uploadImage,
      faces, setFaces,
      searchResults, setSearchResults,
      selectedResult, setSelectedResult,
      fingerprint, setFingerprint,
      anchorResult, setAnchorResult,
      chainStatus, setChainStatus,
      reset,
    }}>
      {children}
    </PipelineContext.Provider>
  );
}

export function usePipeline() {
  const ctx = useContext(PipelineContext);
  if (!ctx) throw new Error('usePipeline must be used within PipelineProvider');
  return ctx;
}
