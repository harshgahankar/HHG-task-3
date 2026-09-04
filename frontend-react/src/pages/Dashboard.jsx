import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePipeline } from '../context/PipelineContext';

export default function Dashboard() {
  const { uploadedFile, uploadedImage, uploadImage, faces, setFaces } = usePipeline();
  const [dragOver, setDragOver] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState(null);
  const [detectionDone, setDetectionDone] = useState(false);
  const navigate = useNavigate();

  const handleDragOver = useCallback((e) => { e.preventDefault(); setDragOver(true); }, []);
  const handleDragLeave = useCallback((e) => { e.preventDefault(); setDragOver(false); }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) { uploadImage(file); setFaces([]); setDetectError(null); setDetectionDone(false); }
  }, [uploadImage]);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) { uploadImage(file); setFaces([]); setDetectError(null); setDetectionDone(false); }
  }, [uploadImage]);

  const runDetection = useCallback(async () => {
    if (!uploadedFile || detecting) return;
    setDetecting(true); setDetectError(null); setDetectionDone(false);
    try {
      const formData = new FormData(); formData.append('file', uploadedFile);
      const response = await fetch('/api/detect', { method: 'POST', body: formData });
      if (!response.ok) throw new Error(`Detection failed: ${response.statusText}`);
      const data = await response.json(); setFaces(data.faces || []); setDetectionDone(true);
    } catch (err) { setDetectError(err.message); } finally { setDetecting(false); }
  }, [uploadedFile, detecting, setFaces]);

  const pipelineSteps = [
    { id: 1, label: 'Upload', status: uploadedImage ? 'complete' : 'active' },
    { id: 2, label: 'Detection', status: detecting ? 'active' : detectionDone ? 'complete' : 'pending' },
    { id: 3, label: 'Encoding', status: detectionDone ? 'complete' : 'pending' },
    { id: 4, label: 'Ledger', status: 'pending' },
    { id: 5, label: 'Verify', status: 'pending' },
  ];

  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto w-full flex flex-col gap-8">
      <section>
        <h2 className="text-headline-md text-on-surface mb-2">Face Identification & Blockchain Verification</h2>
        <p className="text-body-md text-on-surface-variant max-w-2xl">Upload a facial image to initiate the AI detection pipeline and cryptographically verify identity against the blockchain ledger.</p>
      </section>

      <section className="card-panel rounded-xl p-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none"></div>
        <div className="flex justify-between items-center relative z-10">
          {pipelineSteps.map((step, i) => (
            <div key={step.id} className="contents">
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm relative z-10 transition-all duration-300 ${step.status === 'complete' ? 'bg-secondary text-on-secondary shadow-[0_0_12px_rgba(16,185,129,0.3)]' : step.status === 'active' ? 'bg-primary-container text-on-primary-container glow-pulse' : 'bg-surface-container-high text-on-surface-variant border border-outline-variant'}`}>
                  {step.status === 'complete' ? <span className="material-symbols-outlined text-[18px]">check</span> : step.id}
                </div>
                <span className={`text-[11px] font-semibold uppercase tracking-wider ${step.status === 'active' ? 'text-primary-container' : step.status === 'complete' ? 'text-secondary' : 'text-on-surface-variant'}`}>{step.label}</span>
              </div>
              {i < pipelineSteps.length - 1 && <div className={`flex-1 h-[2px] -mx-4 relative top-[-14px] rounded-full transition-colors duration-300 ${step.status === 'complete' ? 'bg-secondary' : 'bg-outline-variant'}`}></div>}
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2">
          <div className={`card-panel rounded-xl p-8 h-full min-h-[380px] flex flex-col items-center justify-center dropzone relative cursor-pointer transition-all duration-300 ${dragOver ? 'dragover border-primary/50 bg-primary/5' : ''}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => document.getElementById('file-input').click()} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') document.getElementById('file-input').click(); }}>
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">image</span>
              <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Input Source</span>
            </div>
            <input id="file-input" type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
            {uploadedImage ? (
              <div className="flex flex-col items-center gap-4">
                <img src={uploadedImage} alt="Uploaded face" className="max-h-[280px] rounded-lg border border-outline-variant shadow-lg" />
                <p className="text-body-sm text-on-surface-variant">Image loaded. Ready for detection.</p>
                <button onClick={(e) => { e.stopPropagation(); runDetection(); }} disabled={detecting} className="mt-2 px-6 py-2.5 bg-primary text-on-primary text-body-sm font-semibold rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2 shadow-[0_0_20px_rgba(0,209,255,0.2)]">
                  <span className="material-symbols-outlined text-[18px]">{detecting ? 'hourglass_top' : 'radar'}</span>
                  {detecting ? 'Detecting Faces...' : 'Run Detection'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center gap-4 max-w-sm">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary-container mb-1">
                  <span className="material-symbols-outlined text-[36px]">cloud_upload</span>
                </div>
                <h3 className="text-headline-sm text-on-surface">Drag & Drop Image</h3>
                <p className="text-body-sm text-on-surface-variant leading-relaxed">Support for JPG, PNG, WEBP. High resolution frontal faces yield optimal encoding results.</p>
                <button className="mt-2 px-6 py-2.5 bg-primary-container text-on-primary-container text-body-sm font-semibold rounded-lg hover:bg-primary-container/90 transition-colors">Browse Files</button>
              </div>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-5">
          <div className="card-panel rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden h-[230px]">
            <div className="flex items-center justify-between z-10">
              <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Face Analysis</span>
              <span className="text-[12px] text-primary-container flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">radar</span>
                {detecting ? 'Scanning' : detectionDone ? `${faces.length} face(s) found` : 'Awaiting Input'}
              </span>
            </div>
            <div className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-lg flex items-center justify-center relative overflow-hidden">
              {uploadedImage ? <img src={uploadedImage} alt="Face analysis" className="w-full h-full object-contain" /> : (
                <div className="text-center z-10">
                  <span className="material-symbols-outlined text-on-surface-variant text-[48px] opacity-20">face_retouching_natural</span>
                  <p className="text-[12px] text-on-surface-variant mt-2">Awaiting Input</p>
                </div>
              )}
            </div>
          </div>

          <div className="card-panel rounded-xl p-5 flex-1 flex flex-col">
            <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-4 block">Pipeline Execution</span>
            <div className="flex flex-col gap-0">
              {[
                { label: 'Image Parsing', status: uploadedImage ? 'complete' : 'pending' },
                { label: 'Face Detection', status: detecting ? 'active' : detectionDone ? 'complete' : 'pending' },
                { label: 'Feature Encoding', status: detectionDone ? 'complete' : 'pending' },
                { label: 'Ledger Query', status: 'pending' },
              ].map((item, i) => (
                <div key={i}>
                  <div className={`flex items-center justify-between py-2 ${item.status === 'pending' ? 'opacity-40' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'complete' ? 'bg-secondary' : item.status === 'active' ? 'bg-primary-container animate-pulse' : 'bg-on-surface-variant'}`}></span>
                      <span className={`text-[13px] ${item.status === 'active' ? 'text-primary-container font-medium' : 'text-on-surface'}`}>{item.label}</span>
                    </div>
                    <span className={`text-[12px] ${item.status === 'complete' ? 'text-secondary' : item.status === 'active' ? 'text-primary-container flex items-center gap-1.5' : 'text-on-surface-variant'}`}>
                      {item.status === 'complete' && 'Done'}
                      {item.status === 'active' && <><span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse"></span>Running</>}
                      {item.status === 'pending' && 'Pending'}
                    </span>
                  </div>
                  {i < 3 && <div className="h-[1px] w-full bg-outline-variant"></div>}
                </div>
              ))}
            </div>
            {detectError && <div className="mt-4 p-3 bg-error/10 border border-error/30 rounded-lg text-error text-[13px]">{detectError}</div>}
            {detectionDone && !detectError && (
              <div className="mt-4 p-3 bg-secondary/10 border border-secondary/30 rounded-lg text-secondary text-[13px]">
                Detection complete. {faces.length > 0 ? `${faces.length} face(s) detected.` : 'No faces detected.'}{' '}
                <button onClick={() => navigate('/scan')} className="underline hover:text-primary font-medium">Go to Search →</button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
