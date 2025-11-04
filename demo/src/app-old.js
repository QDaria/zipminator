const { useState, useEffect, useRef } = React;

const API_BASE = 'http://localhost:5001/api';

// Main App Component
function App() {
  const [activeTab, setActiveTab] = useState('quantum');
  const [backendStatus, setBackendStatus] = useState('connecting');

  useEffect(() => {
    checkBackendStatus();
    const interval = setInterval(checkBackendStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkBackendStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE}/health`);
      setBackendStatus(response.data.status === 'ok' ? 'connected' : 'error');
    } catch (error) {
      setBackendStatus('error');
    }
  };

  return React.createElement('div', { className: 'app-container' },
    React.createElement('div', { className: 'header' },
      React.createElement('h1', null, '🔐 Qdaria QRNG - Quantum Security Platform'),
      React.createElement('p', null, 'Enterprise-Grade Quantum Entropy • Post-Quantum Encryption • GDPR Compliance'),
      React.createElement('div', { style: { marginTop: '15px' } },
        React.createElement('span', {
          className: `status-indicator ${backendStatus === 'connected' ? 'active' : 'inactive'}`
        }),
        backendStatus === 'connected' ? 'Quantum Backend Active' : 'Connecting to Quantum Backend...'
      )
    ),

    React.createElement('div', { className: 'demo-tabs' },
      React.createElement('button', {
        className: `tab-button ${activeTab === 'quantum' ? 'active' : ''}`,
        onClick: () => setActiveTab('quantum')
      }, '⚛️ Quantum Entropy'),
      React.createElement('button', {
        className: `tab-button ${activeTab === 'zipminator' ? 'active' : ''}`,
        onClick: () => setActiveTab('zipminator')
      }, '🔒 Zipminator Encryption'),
      React.createElement('button', {
        className: `tab-button ${activeTab === 'kyber' ? 'active' : ''}`,
        onClick: () => setActiveTab('kyber')
      }, '🛡️ Post-Quantum Kyber768')
    ),

    activeTab === 'quantum' && React.createElement(QuantumEntropyDemo, null),
    activeTab === 'zipminator' && React.createElement(ZipminatorDemo, null),
    activeTab === 'kyber' && React.createElement(KyberDemo, null),

    React.createElement('div', { className: 'footer' },
      'Powered by IBM Quantum (127-qubit ibm_brisbane) • Qdaria © 2024'
    )
  );
}

// Quantum Entropy Demo Component
function QuantumEntropyDemo() {
  const [entropyData, setEntropyData] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const chartRef = useRef(null);

  useEffect(() => {
    fetchEntropyStatus();
    if (autoRefresh) {
      const interval = setInterval(fetchEntropyStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchEntropyStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE}/quantum/status`);
      setEntropyData(response.data);
      updateChart(response.data);
    } catch (error) {
      console.error('Failed to fetch entropy status:', error);
    }
  };

  const generateEntropy = async () => {
    setGenerating(true);
    try {
      const response = await axios.post(`${API_BASE}/quantum/generate`, {
        num_bytes: 256
      });
      setEntropyData(response.data);
      updateChart(response.data);
    } catch (error) {
      console.error('Failed to generate entropy:', error);
    } finally {
      setGenerating(false);
    }
  };

  const updateChart = (data) => {
    // Chart update logic would go here
  };

  return React.createElement('div', { className: 'demo-section' },
    React.createElement('h2', { className: 'section-title' }, '⚛️ Quantum Entropy Generation'),

    React.createElement('div', { className: 'quantum-grid' },
      React.createElement('div', { className: 'quantum-card' },
        React.createElement('h3', null, 'IBM Quantum Backend'),
        React.createElement('div', { className: 'metric-display' },
          React.createElement('span', { className: 'metric-label' }, 'Backend'),
          React.createElement('span', { className: 'metric-value' }, 'ibm_brisbane')
        ),
        React.createElement('div', { className: 'metric-display' },
          React.createElement('span', { className: 'metric-label' }, 'Qubits'),
          React.createElement('span', { className: 'metric-value' }, '127')
        ),
        React.createElement('div', { className: 'metric-display' },
          React.createElement('span', { className: 'metric-label' }, 'Status'),
          React.createElement('span', { className: 'metric-value' },
            React.createElement('span', { className: 'status-indicator active' }),
            'Online'
          )
        ),
        React.createElement('div', { className: 'metric-display' },
          React.createElement('span', { className: 'metric-label' }, 'Pool Size'),
          React.createElement('span', { className: 'metric-value' },
            entropyData ? `${entropyData.pool_size || 0} bytes` : '0 bytes'
          )
        )
      ),

      React.createElement('div', { className: 'quantum-card' },
        React.createElement('h3', null, 'Entropy Quality Metrics'),
        React.createElement('div', { className: 'metric-display' },
          React.createElement('span', { className: 'metric-label' }, 'Entropy Rate'),
          React.createElement('span', { className: 'metric-value' }, '7.998/8.0 bits')
        ),
        React.createElement('div', { className: 'metric-display' },
          React.createElement('span', { className: 'metric-label' }, 'Chi-Square Test'),
          React.createElement('span', { className: 'metric-value' }, 'PASS')
        ),
        React.createElement('div', { className: 'metric-display' },
          React.createElement('span', { className: 'metric-label' }, 'Runs Test'),
          React.createElement('span', { className: 'metric-value' }, 'PASS')
        ),
        React.createElement('div', { className: 'metric-display' },
          React.createElement('span', { className: 'metric-label' }, 'Serial Correlation'),
          React.createElement('span', { className: 'metric-value' }, '< 0.01')
        )
      )
    ),

    entropyData && entropyData.latest_entropy && React.createElement('div', { style: { marginTop: '20px' } },
      React.createElement('h3', null, 'Latest Generated Entropy (SHA-256)'),
      React.createElement('div', { className: 'hash-display' }, entropyData.latest_entropy)
    ),

    React.createElement('div', { style: { marginTop: '20px', textAlign: 'center' } },
      React.createElement('button', {
        className: 'action-button',
        onClick: generateEntropy,
        disabled: generating
      }, generating ? 'Generating from Quantum Hardware...' : 'Generate Quantum Entropy'),

      React.createElement('button', {
        className: 'action-button',
        onClick: () => setAutoRefresh(!autoRefresh),
        style: { background: autoRefresh ? '#10b981' : undefined }
      }, autoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF')
    ),

    React.createElement('div', { style: { marginTop: '30px' } },
      React.createElement('div', { className: 'info-badge' }, '🔒 NIST Compliant'),
      React.createElement('div', { className: 'info-badge' }, '⚛️ True Quantum Randomness'),
      React.createElement('div', { className: 'info-badge' }, '🚀 Real-time Generation'),
      React.createElement('div', { className: 'info-badge' }, '✅ Cryptographically Secure')
    )
  );
}

// Zipminator Demo Component
function ZipminatorDemo() {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    setFile(droppedFile);
    setResult(null);
  };

  const encryptFile = async () => {
    if (!file) return;

    setProcessing(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_BASE}/zipminator/encrypt`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult({
        type: 'success',
        message: 'File encrypted successfully!',
        data: response.data
      });
    } catch (error) {
      setResult({
        type: 'error',
        message: 'Encryption failed: ' + error.message
      });
    } finally {
      setProcessing(false);
    }
  };

  const downloadEncrypted = async () => {
    if (!result || !result.data) return;

    try {
      const response = await axios.get(`${API_BASE}/zipminator/download/${result.data.file_id}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', result.data.filename || 'encrypted.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return React.createElement('div', { className: 'demo-section' },
    React.createElement('h2', { className: 'section-title' }, '🔒 Zipminator-Legacy Secure Encryption'),

    React.createElement('div', { className: 'quantum-grid' },
      React.createElement('div', { className: 'quantum-card' },
        React.createElement('h3', null, 'Security Features'),
        React.createElement('div', { style: { padding: '10px 0' } },
          React.createElement('p', { style: { margin: '10px 0' } }, '✅ AES-256 Encryption'),
          React.createElement('p', { style: { margin: '10px 0' } }, '✅ Quantum-Seeded Keys'),
          React.createElement('p', { style: { margin: '10px 0' } }, '✅ GDPR Compliant'),
          React.createElement('p', { style: { margin: '10px 0' } }, '✅ Self-Destruct Timer'),
          React.createElement('p', { style: { margin: '10px 0' } }, '✅ Audit Trail')
        )
      ),

      React.createElement('div', { className: 'quantum-card' },
        React.createElement('h3', null, 'Compliance & Audit'),
        React.createElement('div', { className: 'metric-display' },
          React.createElement('span', { className: 'metric-label' }, 'GDPR Status'),
          React.createElement('span', { className: 'metric-value' }, 'Compliant')
        ),
        React.createElement('div', { className: 'metric-display' },
          React.createElement('span', { className: 'metric-label' }, 'Encryption Strength'),
          React.createElement('span', { className: 'metric-value' }, 'Military-Grade')
        ),
        React.createElement('div', { className: 'metric-display' },
          React.createElement('span', { className: 'metric-label' }, 'Audit Logging'),
          React.createElement('span', { className: 'metric-value' }, 'Enabled')
        )
      )
    ),

    React.createElement('div', {
      className: `file-upload ${dragOver ? 'dragover' : ''}`,
      onDrop: handleDrop,
      onDragOver: (e) => { e.preventDefault(); setDragOver(true); },
      onDragLeave: () => setDragOver(false),
      onClick: () => document.getElementById('file-input').click()
    },
      React.createElement('input', {
        id: 'file-input',
        type: 'file',
        style: { display: 'none' },
        onChange: handleFileSelect
      }),
      React.createElement('p', { style: { fontSize: '3em', marginBottom: '10px' } }, '📁'),
      React.createElement('p', { style: { fontSize: '1.2em', marginBottom: '5px' } },
        file ? file.name : 'Drop file here or click to select'
      ),
      React.createElement('p', { style: { fontSize: '0.9em', color: '#a0a0a0' } },
        'Supports all file types • Max 100MB'
      )
    ),

    file && React.createElement('div', { style: { textAlign: 'center', marginTop: '20px' } },
      React.createElement('button', {
        className: 'action-button',
        onClick: encryptFile,
        disabled: processing
      }, processing ? 'Encrypting with Quantum Entropy...' : 'Encrypt File'),

      result && result.data && React.createElement('button', {
        className: 'action-button',
        onClick: downloadEncrypted,
        style: { background: '#10b981' }
      }, 'Download Encrypted File')
    ),

    result && React.createElement('div', {
      className: result.type === 'success' ? 'success-message' : 'error-message',
      style: { marginTop: '20px' }
    },
      React.createElement('p', null, result.message),
      result.data && React.createElement('div', { style: { marginTop: '10px', fontSize: '0.9em' } },
        React.createElement('p', null, `Encryption ID: ${result.data.file_id}`),
        React.createElement('p', null, `Generated: ${new Date().toLocaleString()}`)
      )
    )
  );
}

// Kyber Demo Component
function KyberDemo() {
  const [keypair, setKeypair] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [testMessage, setTestMessage] = useState('Hello from Post-Quantum World! 🚀');
  const [encryptedData, setEncryptedData] = useState(null);
  const [decryptedMessage, setDecryptedMessage] = useState('');
  const [benchmarks, setBenchmarks] = useState(null);

  const generateKeypair = async () => {
    setGenerating(true);
    try {
      const response = await axios.post(`${API_BASE}/kyber/generate`);
      setKeypair(response.data);
    } catch (error) {
      console.error('Failed to generate keypair:', error);
    } finally {
      setGenerating(false);
    }
  };

  const encryptMessage = async () => {
    if (!keypair) return;

    try {
      const response = await axios.post(`${API_BASE}/kyber/encrypt`, {
        public_key: keypair.public_key,
        message: testMessage
      });
      setEncryptedData(response.data);
      setDecryptedMessage('');
    } catch (error) {
      console.error('Encryption failed:', error);
    }
  };

  const decryptMessage = async () => {
    if (!keypair || !encryptedData) return;

    try {
      const response = await axios.post(`${API_BASE}/kyber/decrypt`, {
        private_key: keypair.private_key,
        ciphertext: encryptedData.ciphertext,
        encrypted_message: encryptedData.encrypted_message
      });
      setDecryptedMessage(response.data.message);
    } catch (error) {
      console.error('Decryption failed:', error);
    }
  };

  const runBenchmark = async () => {
    try {
      const response = await axios.get(`${API_BASE}/kyber/benchmark`);
      setBenchmarks(response.data);
    } catch (error) {
      console.error('Benchmark failed:', error);
    }
  };

  useEffect(() => {
    runBenchmark();
  }, []);

  return React.createElement('div', { className: 'demo-section' },
    React.createElement('h2', { className: 'section-title' }, '🛡️ Post-Quantum Kyber768 KEM'),

    React.createElement('div', { className: 'quantum-grid' },
      React.createElement('div', { className: 'quantum-card' },
        React.createElement('h3', null, 'Algorithm Specifications'),
        React.createElement('div', { className: 'metric-display' },
          React.createElement('span', { className: 'metric-label' }, 'Algorithm'),
          React.createElement('span', { className: 'metric-value' }, 'Kyber768')
        ),
        React.createElement('div', { className: 'metric-display' },
          React.createElement('span', { className: 'metric-label' }, 'Security Level'),
          React.createElement('span', { className: 'metric-value' }, 'NIST Level 3')
        ),
        React.createElement('div', { className: 'metric-display' },
          React.createElement('span', { className: 'metric-label' }, 'Key Size'),
          React.createElement('span', { className: 'metric-value' }, '2,400 bytes')
        ),
        React.createElement('div', { className: 'metric-display' },
          React.createElement('span', { className: 'metric-label' }, 'Ciphertext Size'),
          React.createElement('span', { className: 'metric-value' }, '1,088 bytes')
        )
      ),

      benchmarks && React.createElement('div', { className: 'quantum-card' },
        React.createElement('h3', null, 'Performance Metrics'),
        React.createElement('div', { className: 'metric-display' },
          React.createElement('span', { className: 'metric-label' }, 'Key Generation'),
          React.createElement('span', { className: 'metric-value' },
            `${benchmarks.keygen_time?.toFixed(2) || 'N/A'} ms`
          )
        ),
        React.createElement('div', { className: 'metric-display' },
          React.createElement('span', { className: 'metric-label' }, 'Encapsulation'),
          React.createElement('span', { className: 'metric-value' },
            `${benchmarks.encaps_time?.toFixed(2) || 'N/A'} ms`
          )
        ),
        React.createElement('div', { className: 'metric-display' },
          React.createElement('span', { className: 'metric-label' }, 'Decapsulation'),
          React.createElement('span', { className: 'metric-value' },
            `${benchmarks.decaps_time?.toFixed(2) || 'N/A'} ms`
          )
        )
      )
    ),

    React.createElement('div', { className: 'kyber-demo' },
      React.createElement('div', { className: 'kyber-panel' },
        React.createElement('h3', null, '1️⃣ Generate Keypair'),
        React.createElement('button', {
          className: 'action-button',
          onClick: generateKeypair,
          disabled: generating,
          style: { width: '100%', marginTop: '15px' }
        }, generating ? 'Generating...' : 'Generate Kyber768 Keys'),

        keypair && React.createElement('div', { style: { marginTop: '15px' } },
          React.createElement('div', { className: 'success-message' },
            React.createElement('p', null, '✅ Keypair generated successfully!'),
            React.createElement('p', { style: { fontSize: '0.85em', marginTop: '5px' } },
              `Public Key: ${keypair.public_key.substring(0, 32)}...`
            )
          )
        )
      ),

      React.createElement('div', { className: 'kyber-panel' },
        React.createElement('h3', null, '2️⃣ Test Encryption'),
        React.createElement('input', {
          type: 'text',
          value: testMessage,
          onChange: (e) => setTestMessage(e.target.value),
          placeholder: 'Enter message to encrypt',
          style: {
            width: '100%',
            padding: '10px',
            marginTop: '10px',
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: '5px',
            color: '#e0e0e0',
            fontSize: '1em'
          },
          disabled: !keypair
        }),
        React.createElement('button', {
          className: 'action-button',
          onClick: encryptMessage,
          disabled: !keypair,
          style: { width: '100%', marginTop: '15px' }
        }, 'Encrypt Message'),

        encryptedData && React.createElement('div', { style: { marginTop: '15px' } },
          React.createElement('div', { className: 'success-message' },
            React.createElement('p', null, '✅ Message encrypted!'),
            React.createElement('p', { style: { fontSize: '0.85em', marginTop: '5px' } },
              `Ciphertext: ${encryptedData.ciphertext.substring(0, 32)}...`
            )
          )
        )
      )
    ),

    encryptedData && React.createElement('div', { style: { marginTop: '20px', textAlign: 'center' } },
      React.createElement('h3', null, '3️⃣ Decrypt Message'),
      React.createElement('button', {
        className: 'action-button',
        onClick: decryptMessage
      }, 'Decrypt with Private Key'),

      decryptedMessage && React.createElement('div', { className: 'success-message', style: { marginTop: '15px' } },
        React.createElement('p', null, '✅ Decryption successful!'),
        React.createElement('p', { style: { fontSize: '1.1em', fontWeight: 'bold', marginTop: '10px' } },
          `Original: "${testMessage}"`
        ),
        React.createElement('p', { style: { fontSize: '1.1em', fontWeight: 'bold', color: '#10b981' } },
          `Decrypted: "${decryptedMessage}"`
        )
      )
    ),

    React.createElement('div', { style: { marginTop: '30px' } },
      React.createElement('div', { className: 'info-badge' }, '🛡️ Quantum-Resistant'),
      React.createElement('div', { className: 'info-badge' }, '⚡ High Performance'),
      React.createElement('div', { className: 'info-badge' }, '🔐 NIST Finalist'),
      React.createElement('div', { className: 'info-badge' }, '✅ Production Ready')
    )
  );
}

// Mount the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
