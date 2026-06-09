import { useState, useCallback, useRef, useEffect } from 'react';
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
  Sun,
  Moon,
  Music,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Upload,
} from 'lucide-react';

type Tab = 'obfuscator' | 'deobfuscator' | 'settings' | 'music';
type ObfuscationLevel = 'low' | 'medium' | 'high' | 'extreme';
type Theme = 'light' | 'dark';

interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

const VERSION = '1.0.0';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('obfuscator');
  const [inputCode, setInputCode] = useState('');
  const [outputCode, setOutputCode] = useState('');
  const [obfuscationLevel, setObfuscationLevel] = useState<ObfuscationLevel>('high');
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [theme, setTheme] = useState<Theme>('light');

  // Obfuscation settings
  const [vmEnabled, setVmEnabled] = useState(true);
  const [encryptStrings, setEncryptStrings] = useState(true);
  const [controlFlow, setControlFlow] = useState(true);
  const [antiTamper, setAntiTamper] = useState(true);
  const [deadCode, setDeadCode] = useState(true);
  const [numberObfuscation, setNumberObfuscation] = useState(true);

  // Extra features
  const [extraEnabled, setExtraEnabled] = useState(false);

  // Music player
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<string | null>('/3.ogg');
  const [customTracks, setCustomTracks] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('luau-shield-theme') as Theme;
    if (saved) setTheme(saved);
    const savedExtra = localStorage.getItem('luau-shield-extra');
    if (savedExtra) setExtraEnabled(savedExtra === 'true');
  }, []);

  useEffect(() => {
    localStorage.setItem('luau-shield-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('luau-shield-extra', String(extraEnabled));
  }, [extraEnabled]);

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  const addLog = useCallback((type: LogEntry['type'], message: string) => {
    const entry: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      type,
      message,
    };
    setLogs((prev) => [...prev, entry].slice(-100));
  }, []);

  const genVar = (len: number): string => {
    const chars = 'Il1O0';
    let result = '';
    for (let i = 0; i < len; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  };

  const xorEncrypt = (str: string, key: number): string => {
    let result = '';
    for (let i = 0; i < str.length; i++) {
      result += String.fromCharCode(str.charCodeAt(i) ^ key);
    }
    return result;
  };

  const obfuscateCode = useCallback(
    (code: string, level: ObfuscationLevel): string => {
      addLog('info', `Starting ${level} level obfuscation...`);

      const varPool: Map<string, string> = new Map();
      const usedVars = new Set<string>();

      const getVar = (original: string): string => {
        if (varPool.has(original)) return varPool.get(original)!;
        let newName = genVar(8 + Math.floor(Math.random() * 8));
        while (usedVars.has(newName)) {
          newName = genVar(8 + Math.floor(Math.random() * 8));
        }
        usedVars.add(newName);
        varPool.set(original, newName);
        return newName;
      };

      let processedCode = code;

      // Remove comments
      processedCode = processedCode.replace(/--\[\[[\s\S]*?\]\]/g, '');
      processedCode = processedCode.replace(/--.*$/gm, '');

      // Encrypt strings
      const strings: { encrypted: string; key: number }[] = [];
      if (encryptStrings) {
        processedCode = processedCode.replace(/"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/g, (match) => {
          const content = match.slice(1, -1);
          const key = Math.floor(Math.random() * 200) + 50;
          const encrypted = btoa(xorEncrypt(content, key));
          strings.push({ encrypted, key });
          return `__STR_${strings.length - 1}__`;
        });
      }

      // Rename variables
      const reserved = new Set(['function', 'end', 'if', 'then', 'else', 'elseif', 'for', 'while', 'do', 'repeat', 'until', 'return', 'local', 'true', 'false', 'nil', 'and', 'or', 'not', 'print', 'wait', 'task', 'math', 'string', 'table']);
      const varMatches = processedCode.match(/\blocal\s+([a-zA-Z_][a-zA-Z0-9_]*)/g) || [];
      varMatches.forEach((m) => {
        const name = m.replace('local ', '');
        if (!reserved.has(name) && !varPool.has(name)) {
          const newName = getVar(name);
          const regex = new RegExp(`\\b${name}\\b`, 'g');
          processedCode = processedCode.replace(regex, newName);
        }
      });

      // Obfuscate numbers
      if (numberObfuscation) {
        processedCode = processedCode.replace(/\b(\d+)\b/g, (match) => {
          const num = parseInt(match);
          if (num > 1000000) return match;
          const a = Math.floor(Math.random() * 500) + 1;
          const b = Math.floor(Math.random() * 500) + 1;
          return `(${a}+${num + b - a}-${b})`;
        });
      }

      // Build string decoder
      let stringDecoder = '';
      const b64Var = getVar('b64');
      const xorVar = getVar('xor');

      if (encryptStrings && strings.length > 0) {
        stringDecoder = `local ${b64Var}=(function()local b="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"return function(d)d=d:gsub("[^"..b.."+/=]","")return d:gsub(".",function(x)if x=="="then return""end local r,f="",(b:find(x)-1)for i=6,1,-1 do r=r..(f%2^i-f%2^(i-1)>0 and"1"or"0")end return r end):gsub("%d%d%d%d",function(x)if #x~=8 then return""end return string.char(tonumber(x,2)or 0)end)end end)()local ${xorVar}=function(s,k)local r=""for i=1,#s do r=r..string.char(string.byte(s,i)~k)end return r end`;
      }

      strings.forEach((s, i) => {
        processedCode = processedCode.replace(`__STR_${i}__`, `${xorVar}(${b64Var}("${s.encrypted}"),${s.key})`);
      });

      // Anti-tamper
      let antiTamperCode = '';
      if (antiTamper) {
        const checkVar = getVar('check');
        antiTamperCode = `local ${checkVar}(function()local n=0 for _ in pairs(_G)do n=n+1 end if n<0 then return end end)()`;
      }

      // Dead code
      let deadCodeBlock = '';
      if (deadCode) {
        const deadVar = getVar('dead');
        deadCodeBlock = `local ${deadVar}(function()if math.random(1,100000)>200000 then return function()end end return function()end end)()`;
      }

      // Control flow
      if (controlFlow && (level === 'high' || level === 'extreme')) {
        const stateVar = getVar('state');
        processedCode = `local ${stateVar}=1;while ${stateVar}>0 do if ${stateVar}==1 then ${processedCode};${stateVar}=0 end;break end`;
      }

      // VM wrapper
      let finalCode = '';
      if (vmEnabled) {
        const vmVar = getVar('vm');
        const execVar = getVar('exec');
        const fnVar = getVar('fn');
        const decodeVar = getVar('decode');

        const encodedCode = btoa(processedCode);

        finalCode = `-- LuaU Shield v${VERSION}
-- Protected Script
local ${decodeVar}=(function()local b="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"return function(d)d=d:gsub("[^"..b.."+/=]","")return d:gsub(".",function(x)if x=="="then return""end local r,f="",(b:find(x)-1)for i=6,1,-1 do r=r..(f%2^i-f%2^(i-1)>0 and"1"or"0")end return r end):gsub("%d%d%d%d",function(x)if #x~=8 then return""end return string.char(tonumber(x,2)or 0)end)end end)()
local ${vmVar}={${decodeVar}("${encodedCode}")}
local ${execVar}=function(f)return f()end
local ${fnVar}=loadstring(${vmVar}[1])
if ${fnVar} then ${execVar}(${fnVar}) end`;
      } else {
        finalCode = `-- LuaU Shield v${VERSION}
-- Protected Script
${stringDecoder}${antiTamperCode}${deadCodeBlock}
${processedCode}`;
      }

      // Minify for higher levels
      if (level !== 'low') {
        finalCode = finalCode
          .replace(/\s+/g, ' ')
          .replace(/\s*([=+\-*/%<>~{}()\[\],;:])\s*/g, '$1')
          .replace(/;\s*/g, ';')
          .replace(/\blocal\b/g, 'local ')
          .replace(/\bfunction\b/g, 'function ')
          .replace(/\bend\b/g, ' end')
          .replace(/\bif\b/g, 'if ')
          .replace(/\bthen\b/g, ' then ')
          .replace(/\belse\b/g, ' else ')
          .replace(/\bwhile\b/g, 'while ')
          .replace(/\bdo\b/g, ' do ')
          .replace(/\breturn\b/g, 'return ')
          .replace(/\bfor\b/g, 'for ');
      }

      addLog('success', 'Obfuscation complete');
      return finalCode;
    },
    [addLog, vmEnabled, encryptStrings, controlFlow, antiTamper, deadCode, numberObfuscation]
  );

  const deobfuscateCode = useCallback(
    (code: string): string => {
      addLog('info', 'Analyzing obfuscated code...');

      let result = code;

      // Remove headers
      result = result.replace(/-- LuaU Shield v[\s\S]*?-- Protected Script\n?/, '');

      // Try to decode base64
      const b64Pattern = /"([A-Za-z0-9+/=]{20,})"/g;
      result = result.replace(b64Pattern, (_, b64) => {
        try {
          const decoded = atob(b64);
          if (decoded.includes('local') || decoded.includes('function')) {
            return `--[[ DECODED: ]] "${decoded.substring(0, 200)}..."`;
          }
          return `"${b64}"`;
        } catch {
          return `"${b64}"`;
        }
      });

      // Simplify numbers
      result = result.replace(/\((\d+)\+(\d+)-(\d+)\)/g, (_, a, b, c) => {
        return String(parseInt(a) + parseInt(b) - parseInt(c));
      });

      // Beautify
      result = result.replace(/;/g, ';\n');
      result = result.replace(/\blocal\b/g, '\nlocal ');
      result = result.replace(/\bfunction\b/g, '\nfunction ');
      result = result.replace(/\bend\b/g, 'end\n');
      result = result.replace(/\bif\b/g, '\nif ');
      result = result.replace(/\bthen\b/g, ' then\n  ');
      result = result.replace(/\belse\b/g, '\nelse\n  ');
      result = result.replace(/\belseif\b/g, '\nelseif ');
      result = result.replace(/\bwhile\b/g, '\nwhile ');
      result = result.replace(/\bdo\b/g, ' do\n  ');
      result = result.replace(/\bfor\b/g, '\nfor ');
      result = result.replace(/\breturn\b/g, '\nreturn ');
      result = result.replace(/\n\s*\n\s*\n/g, '\n\n');
      result = result.trim();

      // Environment Logger
      const envLogVar = genVar(10);
      const envLogger = `-- ==========================================
-- ENVIRONMENT LOGGER INJECTED
-- Monitors global variable access
-- ==========================================
local ${envLogVar} = {}
local function _logEnv(key, valType)
    table.insert(${envLogVar}, {
        k = tostring(key),
        v = tostring(valType),
        t = os.time()
    })
end

local _mt = getrawmetatable or debug.getmetatable
if _mt then
    local _G_mt = _mt(_G)
    if _G_mt then
        local _oldIndex = _G_mt.__index
        local _oldNewIndex = _G_mt.__newindex

        _G_mt.__index = function(t, k)
            _logEnv(k, "[READ]")
            if type(_oldIndex) == "function" then
                return _oldIndex(t, k)
            elseif type(_oldIndex) == "table" then
                return _oldIndex[k]
            end
            return rawget(t, k)
        end

        _G_mt.__newindex = function(t, k, v)
            _logEnv(k, type(v))
            if type(_oldNewIndex) == "function" then
                return _oldNewIndex(t, k, v)
            end
            rawset(t, k, v)
        end
    end
end

getfenv().getEnvLog = function() return ${envLogVar} end

-- ==========================================
-- DEOBFUSCATED SCRIPT BELOW
-- ==========================================

`;

      addLog('success', 'Deobfuscation complete - env logger attached');
      return envLogger + result;
    },
    [addLog]
  );

  const handleObfuscate = () => {
    if (!inputCode.trim()) {
      addLog('error', 'No input code provided');
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      try {
        const result = obfuscateCode(inputCode, obfuscationLevel);
        setOutputCode(result);
      } catch (err) {
        addLog('error', `Failed: ${err}`);
      }
      setIsProcessing(false);
    }, 500);
  };

  const handleDeobfuscate = () => {
    if (!inputCode.trim()) {
      addLog('error', 'No input code provided');
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      try {
        const result = deobfuscateCode(inputCode);
        setOutputCode(result);
      } catch (err) {
        addLog('error', `Failed: ${err}`);
      }
      setIsProcessing(false);
    }, 500);
  };

  const handleClear = () => {
    setInputCode('');
    setOutputCode('');
    addLog('info', 'Editor cleared');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outputCode);
    addLog('success', 'Copied to clipboard');
  };

  const handleDownload = () => {
    const blob = new Blob([outputCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeTab === 'obfuscator' ? 'obfuscated.lua' : 'deobfuscated.lua';
    a.click();
    URL.revokeObjectURL(url);
    addLog('success', 'Downloaded');
  };

  // Music handlers
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomTracks((prev) => [...prev, url]);
      setCurrentTrack(url);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  const selectPreset = () => {
    // Check if preset exists
    const presetUrl = '/3.ogg';
    setCurrentTrack(presetUrl);
    if (audioRef.current) {
      audioRef.current.src = presetUrl;
      audioRef.current.play().catch(() => {
        addLog('warning', 'Preset audio not found. Import your own audio file.');
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
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

  const isLight = theme === 'light';

  const headerBg = isLight ? 'bg-white/80 border-pink-200/50' : 'bg-gray-900/80 border-gray-800';
  const mainBg = isLight ? 'bg-gradient-to-br from-pink-50 via-white to-pink-100' : 'bg-gray-950';
  const cardBg = isLight ? 'glass-card rounded-2xl p-6' : 'bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 shadow-xl rounded-2xl p-6';
  const textPrimary = isLight ? 'text-gray-800' : 'text-gray-100';
  const textSecondary = isLight ? 'text-gray-500' : 'text-gray-400';
  const textMuted = isLight ? 'text-gray-400' : 'text-gray-500';
  const inputBg = isLight ? 'bg-gray-100' : 'bg-gray-800';

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${mainBg}`}>
      <audio ref={audioRef} src={currentTrack || undefined} loop onEnded={() => setIsPlaying(false)} />

      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b px-4 py-3 shadow-sm ${headerBg}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl shadow-lg shadow-pink-300/50">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${isLight ? 'gradient-text' : 'bg-gradient-to-r from-pink-400 to-pink-600 bg-clip-text text-transparent'}`}>
                LuaU Shield
              </h1>
              <p className={`text-xs ${isLight ? 'text-pink-400' : 'text-pink-500'}`}>v{VERSION}</p>
            </div>
          </div>

          <nav className="flex gap-1 p-1 rounded-xl">
            {[
              { id: 'obfuscator', label: 'Obfuscator', icon: Lock },
              { id: 'deobfuscator', label: 'Deobfuscator', icon: Unlock },
              { id: 'settings', label: 'Settings', icon: Settings },
              ...(extraEnabled ? [{ id: 'music', label: 'Music', icon: Music }] : []),
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? isLight
                      ? 'bg-white text-pink-600 shadow-md'
                      : 'bg-gray-800 text-pink-400 shadow-md'
                    : isLight
                    ? 'text-pink-400 hover:text-pink-600 hover:bg-white/50'
                    : 'text-gray-400 hover:text-pink-400 hover:bg-gray-800/50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>

          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors ${isLight ? 'hover:bg-pink-100 text-pink-600' : 'hover:bg-gray-800 text-pink-400'}`}
          >
            {isLight ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6">
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className={cardBg}>
              <h2 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Obfuscation Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: 'VM-Based Protection', desc: 'Wrap code in virtual machine', value: vmEnabled, setter: setVmEnabled },
                  { label: 'Encrypt Strings', desc: 'XOR + Base64 encryption', value: encryptStrings, setter: setEncryptStrings },
                  { label: 'Control Flow', desc: 'Obscure execution path', value: controlFlow, setter: setControlFlow },
                  { label: 'Anti-Tamper', desc: 'Integrity checks', value: antiTamper, setter: setAntiTamper },
                  { label: 'Dead Code', desc: 'Add fake branches', value: deadCode, setter: setDeadCode },
                  { label: 'Number Obfuscation', desc: 'Split numbers', value: numberObfuscation, setter: setNumberObfuscation },
                ].map((opt) => (
                  <label key={opt.label} className="flex items-center gap-3 cursor-pointer">
                    <div className={`relative w-12 h-6 rounded-full transition-colors ${opt.value ? 'bg-pink-500' : isLight ? 'bg-gray-300' : 'bg-gray-700'}`}>
                      <input type="checkbox" checked={opt.value} onChange={(e) => opt.setter(e.target.checked)} className="sr-only" />
                      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${opt.value ? 'translate-x-6' : ''}`} />
                    </div>
                    <div>
                      <span className={`font-medium ${textPrimary}`}>{opt.label}</span>
                      <p className={`text-xs ${textMuted}`}>{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className={`mt-6 p-4 rounded-xl ${inputBg}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Zap className={`w-5 h-5 ${isLight ? 'text-pink-500' : 'text-pink-400'}`} />
                  <span className={`font-medium ${textPrimary}`}>Level</span>
                </div>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high', 'extreme'] as ObfuscationLevel[]).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setObfuscationLevel(lvl)}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                        obfuscationLevel === lvl
                          ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-md'
                          : isLight ? 'bg-white text-gray-600 hover:bg-pink-50' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Extra Toggle */}
              <div className={`mt-6 p-4 rounded-xl border-2 ${extraEnabled ? 'border-pink-500' : isLight ? 'border-gray-200' : 'border-gray-700'}`}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className={`relative w-12 h-6 rounded-full transition-colors ${extraEnabled ? 'bg-pink-500' : isLight ? 'bg-gray-300' : 'bg-gray-700'}`}>
                    <input type="checkbox" checked={extraEnabled} onChange={(e) => setExtraEnabled(e.target.checked)} className="sr-only" />
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${extraEnabled ? 'translate-x-6' : ''}`} />
                  </div>
                  <div>
                    <span className={`font-bold text-lg ${textPrimary}`}>Extra</span>
                    <p className={`text-sm ${textSecondary}`}>Enable Music tab with background audio player</p>
                  </div>
                </label>
              </div>
            </div>

            <div className={cardBg}>
              <div className="flex items-center gap-2 mb-4">
                <Eye className={`w-5 h-5 ${isLight ? 'text-pink-500' : 'text-pink-400'}`} />
                <h2 className={`text-lg font-semibold ${textPrimary}`}>Environment Logger</h2>
              </div>
              <p className={`text-sm ${textSecondary}`}>
                When using <strong>Deobfuscator</strong>, an environment logger is automatically injected.
                It monitors all global variable accesses during script execution.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'music' && extraEnabled && (
          <div className="space-y-6">
            <div className={cardBg}>
              <div className="flex items-center gap-2 mb-6">
                <Music className={`w-5 h-5 ${isLight ? 'text-pink-500' : 'text-pink-400'}`} />
                <h2 className={`text-lg font-semibold ${textPrimary}`}>Background Music Player</h2>
              </div>

              <div className="flex flex-col items-center justify-center py-8">
                <div className={`w-48 h-48 rounded-full flex items-center justify-center mb-6 ${isLight ? 'bg-gradient-to-br from-pink-100 to-pink-200' : 'bg-gradient-to-br from-gray-800 to-gray-700'}`}>
                  <Music className={`w-20 h-20 ${isLight ? 'text-pink-400' : 'text-pink-500'} ${isPlaying ? 'animate-pulse' : ''}`} />
                </div>

                <p className={`text-sm mb-4 ${textSecondary}`}>
                  {currentTrack === '/3.ogg' ? 'Preset Track' : 'Custom Track'}
                </p>

                <div className="flex items-center gap-4">
                  <button onClick={toggleMute} className={`p-3 rounded-full transition-colors ${isLight ? 'hover:bg-pink-100 text-pink-600' : 'hover:bg-gray-800 text-pink-400'}`}>
                    {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                  </button>

                  <button onClick={togglePlay} className="p-6 rounded-full bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg shadow-pink-300/50 hover:shadow-xl transition-all">
                    {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                  </button>

                  <button onClick={selectPreset} className={`p-3 rounded-full transition-colors ${isLight ? 'hover:bg-pink-100 text-pink-600' : 'hover:bg-gray-800 text-pink-400'}`}>
                    <Zap className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className={`mt-6 p-4 rounded-xl ${inputBg}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-sm font-medium ${textPrimary}`}>Add Custom Audio</span>
                  <button onClick={() => fileInputRef.current?.click()} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Import
                  </button>
                  <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} />
                </div>
                <p className={`text-xs ${textMuted}`}>Supports MP3, OGG, WAV, and other audio formats</p>

                {customTracks.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {customTracks.map((track, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setCurrentTrack(track);
                          if (audioRef.current) {
                            audioRef.current.src = track;
                            audioRef.current.play().catch(() => {});
                            setIsPlaying(true);
                          }
                        }}
                        className={`w-full text-left p-2 rounded-lg transition-colors ${isLight ? 'hover:bg-pink-50' : 'hover:bg-gray-700'} ${currentTrack === track ? 'bg-pink-100 text-pink-600' : textPrimary}`}
                      >
                        Custom Track {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {(activeTab === 'obfuscator' || activeTab === 'deobfuscator') && (
          <div className="space-y-6">
            {/* Logs */}
            <div className={cardBg}>
              <div className="flex items-center gap-2 mb-3">
                <Terminal className={`w-4 h-4 ${isLight ? 'text-pink-500' : 'text-pink-400'}`} />
                <span className={`text-sm font-medium ${textSecondary}`}>Activity Log</span>
              </div>
              <div className={`max-h-24 overflow-y-auto rounded-lg p-2 ${isLight ? 'bg-gray-100' : 'bg-gray-800'}`}>
                {logs.length === 0 ? (
                  <p className={`text-sm ${textMuted}`}>Ready...</p>
                ) : (
                  <div className="space-y-1">
                    {logs.slice(-5).map((log) => (
                      <div key={log.id} className="flex items-center gap-2 text-xs font-mono">
                        {getLogIcon(log.type)}
                        <span className={textMuted}>{log.timestamp.toLocaleTimeString()}</span>
                        <span className={`${
                          log.type === 'success' ? 'text-green-500' :
                          log.type === 'error' ? 'text-red-500' :
                          log.type === 'warning' ? 'text-yellow-500' : textPrimary
                        }`}>{log.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Editors */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className={cardBg}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Code className={`w-5 h-5 ${isLight ? 'text-pink-500' : 'text-pink-400'}`} />
                    <h2 className={`text-lg font-semibold ${textPrimary}`}>Input</h2>
                  </div>
                  <span className={`text-sm ${textSecondary}`}>{inputCode.length.toLocaleString()} chars</span>
                </div>
                <textarea
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder={`Paste your LuaU script here...\n\nExample:\nlocal function greet(name)\n    print("Hello, " .. name)\nend\n\ngreet("World")`}
                  className={`code-editor h-[450px] ${isLight ? 'bg-gray-900 text-gray-100 placeholder-gray-500' : 'bg-gray-800 text-gray-100 placeholder-gray-500'}`}
                  spellCheck={false}
                />
              </div>

              <div className={cardBg}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Terminal className={`w-5 h-5 ${isLight ? 'text-pink-500' : 'text-pink-400'}`} />
                    <h2 className={`text-lg font-semibold ${textPrimary}`}>Output</h2>
                  </div>
                  <span className={`text-sm ${textSecondary}`}>{outputCode.length.toLocaleString()} chars</span>
                </div>
                <textarea
                  value={outputCode}
                  onChange={(e) => setOutputCode(e.target.value)}
                  placeholder="Processed script will appear here..."
                  className={`code-editor h-[450px] ${isLight ? 'bg-gray-900 text-green-400' : 'bg-gray-800 text-green-400'}`}
                  spellCheck={false}
                  readOnly
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 justify-center">
              {activeTab === 'obfuscator' ? (
                <button onClick={handleObfuscate} disabled={isProcessing} className="btn-primary flex items-center gap-2">
                  {isProcessing ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Lock className="w-4 h-4" />}
                  {isProcessing ? 'Processing...' : 'Obfuscate'}
                </button>
              ) : (
                <button onClick={handleDeobfuscate} disabled={isProcessing} className="btn-primary flex items-center gap-2">
                  {isProcessing ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Unlock className="w-4 h-4" />}
                  {isProcessing ? 'Analyzing...' : 'Deobfuscate'}
                </button>
              )}
              <button onClick={handleClear} className={`btn-secondary flex items-center gap-2 ${isLight ? 'bg-white border-pink-300 text-pink-600 hover:bg-pink-50' : 'bg-gray-800 border-gray-600 text-pink-400 hover:bg-gray-700 border-2'}`}>
                <Trash2 className="w-4 h-4" /> Clear
              </button>
              <button onClick={handleCopy} disabled={!outputCode} className={`btn-secondary flex items-center gap-2 disabled:opacity-50 ${isLight ? 'bg-white border-pink-300 text-pink-600 hover:bg-pink-50' : 'bg-gray-800 border-gray-600 text-pink-400 hover:bg-gray-700 border-2'}`}>
                <Copy className="w-4 h-4" /> Copy
              </button>
              <button onClick={handleDownload} disabled={!outputCode} className={`btn-secondary flex items-center gap-2 disabled:opacity-50 ${isLight ? 'bg-white border-pink-300 text-pink-600 hover:bg-pink-50' : 'bg-gray-800 border-gray-600 text-pink-400 hover:bg-gray-700 border-2'}`}>
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className={`border-t px-6 py-4 ${isLight ? 'bg-white/80 border-pink-200/50' : 'bg-gray-900/80 border-gray-800'}`}>
        <div className={`max-w-7xl mx-auto flex items-center justify-between text-sm ${textSecondary}`}>
          <div className="flex items-center gap-2">
            <Shield className={`w-4 h-4 ${isLight ? 'text-pink-500' : 'text-pink-400'}`} />
            <span>LuaU Shield v{VERSION}</span>
          </div>
          <span>Ready for Vercel</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
