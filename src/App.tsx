import { useState, useCallback } from 'react';
import {
  Shield,
  Lock,
  Unlock,
  Code,
  Settings,
  Terminal,
  Copy,
  Download,
  Trash2,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Zap,
  Eye,
  Activity,
} from 'lucide-react';

type Tab = 'obfuscator' | 'deobfuscator' | 'logger' | 'history';
type ObfuscationLevel = 'low' | 'medium' | 'high' | 'extreme';

interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

interface ScriptHistory {
  id: string;
  timestamp: Date;
  type: 'obfuscated' | 'deobfuscated';
  originalLength: number;
  resultLength: number;
  level?: ObfuscationLevel;
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('obfuscator');
  const [inputCode, setInputCode] = useState('');
  const [outputCode, setOutputCode] = useState('');
  const [obfuscationLevel, setObfuscationLevel] = useState<ObfuscationLevel>('medium');
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [scriptHistory, setScriptHistory] = useState<ScriptHistory[]>([]);
  const [vmEnabled, setVmEnabled] = useState(true);
  const [encryptStrings, setEncryptStrings] = useState(true);
  const [controlFlow, setControlFlow] = useState(true);
  const [antiTamper, setAntiTamper] = useState(true);
  const [envLogging, setEnvLogging] = useState(true);

  const addLog = useCallback((type: LogEntry['type'], message: string) => {
    const entry: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      type,
      message,
    };
    setLogs((prev) => [...prev, entry].slice(-100));
  }, []);

  const generateVarName = (length: number): string => {
    const chars = 'Il1O0';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  };

  const obfuscateCode = useCallback(
    (code: string, level: ObfuscationLevel): string => {
      addLog('info', 'Starting obfuscation process...');

      let result = code;
      const iterations = level === 'low' ? 1 : level === 'medium' ? 2 : level === 'high' ? 3 : 5;

      for (let i = 0; i < iterations; i++) {
        result = applyObfuscation(result, level);
      }

      if (vmEnabled) {
        result = wrapInVM(result);
        addLog('info', 'VM protection applied');
      }

      if (envLogging) {
        result = addEnvLogger(result);
        addLog('info', 'Environment logger injected');
      }

      addLog('success', `Obfuscation complete (${level} level)`);
      return result;
    },
    [addLog, vmEnabled, envLogging]
  );

  const applyObfuscation = (code: string, level: ObfuscationLevel): string => {
    let result = code;

    if (encryptStrings) {
      result = result.replace(/"([^"]*)"/g, (match) => {
        const str = match.slice(1, -1);
        const encoded = btoa(str);
        return `decode_base64("${encoded}")`;
      });

      const base64Decoder = `local decode_base64 = (function()
    local b = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
    return function(data)
        data = string.gsub(data, "[^" .. b .. "=]", "")
        return (data:gsub(".", function(x)
            if x == "=" then return "" end
            local r, f = "", (b:find(x) - 1)
            for i = 6, 1, -1 do r = r .. (f % 2^i - f % 2^(i-1) > 0 and "1" or "0") end
            return r
        end):gsub("%d%d%d%d", function(x)
            if #x ~= 8 then return "" end
            local n = tonumber(x, 2)
            return n and string.char(n) or ""
        end))
    end
end)()
`;
      result = base64Decoder + result;
    }

    if (controlFlow && (level === 'high' || level === 'extreme')) {
      result = addControlFlowFlattening(result);
    }

    if (antiTamper) {
      result = addAntiTamper(result);
    }

    const varNames = code.match(/\b(local\s+)([a-zA-Z_][a-zA-Z0-9_]*)/g) || [];
    varNames.forEach((match) => {
      const varName = match.replace('local ', '');
      if (varName.length > 2 && !['function', 'end', 'if', 'then', 'else', 'for', 'while', 'do'].includes(varName)) {
        const newName = generateVarName(8 + Math.floor(Math.random() * 8));
        const regex = new RegExp(`\\b${varName}\\b`, 'g');
        result = result.replace(regex, newName);
      }
    });

    result = result.replace(/\-\-.*\n/g, '\n');
    result = result.replace(/\s+/g, ' ');
    result = result.replace(/\s*([=+\-*/%<>!&|({\[\])};:,])\s*/g, '$1');
    result = result.replace(/\s+/g, ' ');

    return result;
  };

  const addControlFlowFlattening = (code: string): string => {
    const varName = generateVarName(10);
    return `local ${varName} = 1
while ${varName} > 0 do
    if ${varName} == 1 then
        ${code}
        ${varName} = 0
    end
end`;
  };

  const addAntiTamper = (code: string): string => {
    const checkVar = generateVarName(12);
    const hashVar = generateVarName(12);
    return `local ${checkVar},${hashVar}=(function()
    local s=0
    local function c(n)
        s=(s+n)%2147483647
        return s
    end
    return function(t)
        s=0
        for i=1,#t do c(t:byte(i)) end
        return s
    end
end)()
do
    local _t=${hashVar}("${code.length}")
    if _t~=${code.length} then return end
end
${code}`;
  };

  const wrapInVM = (code: string): string => {
    const vmVar = generateVarName(16);
    const opVar = generateVarName(16);
    const stackVar = generateVarName(16);
    const ops: string[] = [];

    const chunks: string[] = [];
    for (let i = 0; i < code.length; i += 50) {
      chunks.push(code.slice(i, i + 50));
    }

    chunks.forEach((chunk, i) => {
      ops.push(`[${i}] = function() ${chunk} end`);
    });

    return `-- VM-Based Protected Script
-- Generated by LuaU Shield
do
    local ${vmVar} = {
        ${ops.join(',\n        ')}
    }
    local ${stackVar} = {}
    local ${opVar}
    for i = 0, ${chunks.length - 1} do
        ${opVar} = ${vmVar}[i]
        if ${opVar} then
            table.insert(${stackVar}, ${opVar})
        end
    end
    for _, fn in ipairs(${stackVar}) do
        fn()
    end
end
`;
  };

  const addEnvLogger = (code: string): string => {
    const envVar = generateVarName(12);
    return `local ${envVar} = {}
do
    local _G_raw = _G
    local function log_env(key, value)
        table.insert(${envVar}, {k = key, v = type(value)})
    end
    local mt = {
        __index = function(t, k)
            log_env(k, t[k])
            return _G_raw[k]
        end,
        __newindex = function(t, k, v)
            log_env(k, v)
            _G_raw[k] = v
        end
    }
    setmetatable(_G, mt)
end
${code}
-- Environment access log available after execution
`;
  };

  const deobfuscateCode = useCallback(
    (code: string): string => {
      addLog('info', 'Starting deobfuscation analysis...');

      let result = code;

      result = result.replace(/decode_base64\s*\(\s*"([A-Za-z0-9+\/=]+)"\s*\)/g, (_, b64) => {
        try {
          return `"${atob(b64)}"`;
        } catch {
          return `"[DECODE_ERROR]"`;
        }
      });

      result = result.replace(/decode_base64\s*\(\s*'([A-Za-z0-9+\/=]+)'\s*\)/g, (_, b64) => {
        try {
          return `"${atob(b64)}"`;
        } catch {
          return `"[DECODE_ERROR]"`;
        }
      });

      result = result.replace(/\blocal\s+([IlO0]+)\s*=/g, (_, name) => {
        const readable = `var_${Math.random().toString(36).substr(2, 6)}`;
        return `local ${readable} =`;
      });

      const funcPattern = /local\s+function\s*\(\s*\)\s*([\s\S]*?)\s*end\s*\(\s*\)/g;
      result = result.replace(funcPattern, (_, body) => {
        return `-- IIFE extracted\n${body}`;
      });

      result = result.replace(/--\s*VM-Based Protected Script[\s\S]*?do\n([\s\S]*?)\nend\n/, (_, content) => {
        return `-- VM Layer Removed\n${content}`;
      });

      result = result.replace(
        /--\s*Environment access log[\s\S]*?setmetatable\(_G, mt\)\s*\nend\n/,
        '-- Environment logger removed\n'
      );

      result = result.replace(/while\s+([^\s]+)\s*>\s*0\s+do\s*if\s+\1\s*==\s*1\s+then\s*([\s\S]*?)\s*\1\s*=\s*0\s*end\s*end/g, (_, _var, body) => {
        return body.trim();
      });

      const patterns = [
        { regex: /\s*;\s*/g, replace: ';\n' },
        { regex: /\bthen\s*/g, replace: 'then\n  ' },
        { regex: /\bdo\s*/g, replace: 'do\n  ' },
        { regex: /\bend\s*/g, replace: '\nend\n' },
      ];

      patterns.forEach(({ regex, replace }) => {
        result = result.replace(regex, replace);
      });

      result = result.replace(/local\s+/g, '\nlocal ');
      result = result.replace(/function\s+/g, '\nfunction ');
      result = result.replace(/\n\s*\n/g, '\n');
      result = result.trim();

      addLog('success', 'Deobfuscation complete');
      return result;
    },
    [addLog]
  );

  const handleObfuscate = () => {
    if (!inputCode.trim()) {
      addLog('error', 'No input code provided');
      return;
    }

    setIsProcessing(true);
    addLog('info', `Processing with ${obfuscationLevel} obfuscation level...`);

    setTimeout(() => {
      const result = obfuscateCode(inputCode, obfuscationLevel);
      setOutputCode(result);

      const historyEntry: ScriptHistory = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        type: 'obfuscated',
        originalLength: inputCode.length,
        resultLength: result.length,
        level: obfuscationLevel,
      };
      setScriptHistory((prev) => [historyEntry, ...prev].slice(0, 50));

      setIsProcessing(false);
    }, 800);
  };

  const handleDeobfuscate = () => {
    if (!inputCode.trim()) {
      addLog('error', 'No input code provided');
      return;
    }

    setIsProcessing(true);
    addLog('info', 'Analyzing obfuscated code...');

    setTimeout(() => {
      const result = deobfuscateCode(inputCode);
      setOutputCode(result);

      const historyEntry: ScriptHistory = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        type: 'deobfuscated',
        originalLength: inputCode.length,
        resultLength: result.length,
      };
      setScriptHistory((prev) => [historyEntry, ...prev].slice(0, 50));

      setIsProcessing(false);
    }, 600);
  };

  const handleClear = () => {
    setInputCode('');
    setOutputCode('');
    addLog('info', 'Editor cleared');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outputCode);
    addLog('success', 'Output copied to clipboard');
  };

  const handleDownload = () => {
    const blob = new Blob([outputCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeTab === 'obfuscator' ? 'obfuscated.lua' : 'deobfuscated.lua';
    a.click();
    URL.revokeObjectURL(url);
    addLog('success', 'Script downloaded');
  };

  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Activity className="w-4 h-4 text-pink-500" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-pink-200/50 px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl shadow-lg shadow-pink-300/50">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">LuaU Shield</h1>
              <p className="text-xs text-pink-400">Obfuscator & Deobfuscator</p>
            </div>
          </div>

          <nav className="flex gap-1 bg-pink-100/50 p-1 rounded-xl">
            {[
              { id: 'obfuscator', label: 'Obfuscator', icon: Lock },
              { id: 'deobfuscator', label: 'Deobfuscator', icon: Unlock },
              { id: 'logger', label: 'Env Logger', icon: Eye },
              { id: 'history', label: 'History', icon: Terminal },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white text-pink-600 shadow-md'
                    : 'text-pink-400 hover:text-pink-600 hover:bg-white/50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-400 animate-pulse" />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6">
        {(activeTab === 'obfuscator' || activeTab === 'deobfuscator') && (
          <div className="space-y-6">
            {activeTab === 'obfuscator' && (
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="w-5 h-5 text-pink-500" />
                  <h2 className="text-lg font-semibold text-gray-800">Obfuscation Settings</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Obfuscation Level</label>
                    <div className="flex rounded-lg overflow-hidden border border-pink-200">
                      {(['low', 'medium', 'high', 'extreme'] as ObfuscationLevel[]).map((level) => (
                        <button
                          key={level}
                          onClick={() => setObfuscationLevel(level)}
                          className={`flex-1 px-3 py-2 text-sm font-medium transition-all ${
                            obfuscationLevel === level
                              ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white'
                              : 'bg-white text-gray-600 hover:bg-pink-50'
                          }`}
                        >
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={vmEnabled}
                        onChange={(e) => setVmEnabled(e.target.checked)}
                        className="w-4 h-4 text-pink-600 border-pink-300 rounded focus:ring-pink-500"
                      />
                      <span className="text-sm text-gray-700">VM-Based Protection</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={encryptStrings}
                        onChange={(e) => setEncryptStrings(e.target.checked)}
                        className="w-4 h-4 text-pink-600 border-pink-300 rounded focus:ring-pink-500"
                      />
                      <span className="text-sm text-gray-700">Encrypt Strings</span>
                    </label>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={controlFlow}
                        onChange={(e) => setControlFlow(e.target.checked)}
                        className="w-4 h-4 text-pink-600 border-pink-300 rounded focus:ring-pink-500"
                      />
                      <span className="text-sm text-gray-700">Control Flow Flattening</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={envLogging}
                        onChange={(e) => setEnvLogging(e.target.checked)}
                        className="w-4 h-4 text-pink-600 border-pink-300 rounded focus:ring-pink-500"
                      />
                      <span className="text-sm text-gray-700">Environment Logger</span>
                    </label>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={antiTamper}
                        onChange={(e) => setAntiTamper(e.target.checked)}
                        className="w-4 h-4 text-pink-600 border-pink-300 rounded focus:ring-pink-500"
                      />
                      <span className="text-sm text-gray-700">Anti-Tamper</span>
                    </label>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Zap className="w-4 h-4 text-pink-400" />
                      <span>Higher security = slower execution</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Code className="w-5 h-5 text-pink-500" />
                    <h2 className="text-lg font-semibold text-gray-800">Input Script</h2>
                  </div>
                  <span className="text-sm text-gray-500">{inputCode.length} chars</span>
                </div>
                <textarea
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder="Paste your LuaU script here..."
                  className="code-editor"
                  spellCheck={false}
                />
              </div>

              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-pink-500" />
                    <h2 className="text-lg font-semibold text-gray-800">Output</h2>
                  </div>
                  <span className="text-sm text-gray-500">{outputCode.length} chars</span>
                </div>
                <textarea
                  value={outputCode}
                  onChange={(e) => setOutputCode(e.target.value)}
                  placeholder="Processed script will appear here..."
                  className="code-editor"
                  spellCheck={false}
                  readOnly
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              {activeTab === 'obfuscator' ? (
                <button
                  onClick={handleObfuscate}
                  disabled={isProcessing}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  {isProcessing ? 'Processing...' : 'Obfuscate'}
                </button>
              ) : (
                <button
                  onClick={handleDeobfuscate}
                  disabled={isProcessing}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Unlock className="w-4 h-4" />
                  )}
                  {isProcessing ? 'Analyzing...' : 'Deobfuscate'}
                </button>
              )}
              <button onClick={handleClear} className="btn-secondary flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
              <button
                onClick={handleCopy}
                disabled={!outputCode}
                className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
              <button
                onClick={handleDownload}
                disabled={!outputCode}
                className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        )}

        {activeTab === 'logger' && (
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-pink-500" />
                <h2 className="text-lg font-semibold text-gray-800">Environment Logger</h2>
              </div>
              <button
                onClick={() => setLogs([])}
                className="px-3 py-1 text-sm text-gray-600 hover:text-pink-600 transition-colors"
              >
                Clear Log
              </button>
            </div>

            <div className="bg-gray-900 rounded-xl p-4 max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No log entries yet. Process a script to see activity.</p>
              ) : (
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-2 bg-gray-800 rounded-lg font-mono text-sm"
                    >
                      {getLogIcon(log.type)}
                      <span className="text-gray-400 text-xs">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                      <span
                        className={`${
                          log.type === 'success'
                            ? 'text-green-400'
                            : log.type === 'error'
                            ? 'text-red-400'
                            : log.type === 'warning'
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      >
                        {log.message}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 p-4 bg-pink-50 rounded-xl">
              <h3 className="font-semibold text-gray-800 mb-2">What the Env Logger Does:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-pink-500 flex-shrink-0 mt-0.5" />
                  <span>Monitors all global variable accesses during script execution</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-pink-500 flex-shrink-0 mt-0.5" />
                  <span>Tracks function calls and environment modifications</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-pink-500 flex-shrink-0 mt-0.5" />
                  <span>Helps analyze obfuscated scripts behavior in sandboxed environments</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-pink-500 flex-shrink-0 mt-0.5" />
                  <span>Injected code runs in controlled environment before execution</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Terminal className="w-5 h-5 text-pink-500" />
              <h2 className="text-lg font-semibold text-gray-800">Script History</h2>
              <span className="ml-auto text-sm text-gray-500">{scriptHistory.length} entries</span>
            </div>

            {scriptHistory.length === 0 ? (
              <div className="text-center py-12">
                <Code className="w-12 h-12 text-pink-300 mx-auto mb-4" />
                <p className="text-gray-500">No scripts processed yet</p>
                <p className="text-sm text-gray-400 mt-1">Obfuscate or deobfuscate a script to see it here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scriptHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-4 p-4 bg-white rounded-xl border border-pink-100 hover:border-pink-300 transition-colors"
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        entry.type === 'obfuscated'
                          ? 'bg-pink-100 text-pink-600'
                          : 'bg-green-100 text-green-600'
                      }`}
                    >
                      {entry.type === 'obfuscated' ? (
                        <Lock className="w-5 h-5" />
                      ) : (
                        <Unlock className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800 capitalize">{entry.type}</span>
                        {entry.level && (
                          <span className="px-2 py-0.5 text-xs bg-pink-100 text-pink-600 rounded-full">
                            {entry.level}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {entry.originalLength} → {entry.resultLength} chars
                        <span className="mx-2">•</span>
                        {((entry.resultLength / entry.originalLength) * 100).toFixed(0)}% size
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">
                      {entry.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-pink-200/50 bg-white/80 backdrop-blur-xl py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-pink-500" />
            <span>LuaU Shield - VM-Based Protection</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Built for Vercel Deployment</span>
            <span className="text-pink-400">•</span>
            <span>Secure by design</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
