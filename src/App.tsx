import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Loader2, Download, Settings2, Image as ImageIcon, 
  MapPin, Calendar, School, UserCheck, AlertTriangle, RefreshCw,
  Maximize2, FileText, Layout, Users, User, ClipboardList, PenTool, FileType, Eye, EyeOff, Copy,
  CheckCircle2, Printer, Upload, Trash2, MessageSquare, Plus, Minus,
  Send, Smile, Paperclip, Edit3, Save, X
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

// --- COMPONENTS ---
const MindmapNode = ({ node, depth = 0, isExportingMode = false }: { node: any, depth?: number, isExportingMode?: boolean }) => {
  const [isOpen, setIsOpen] = useState(depth < 1);

  useEffect(() => {
    if (isExportingMode) {
      setIsOpen(true);
    }
  }, [isExportingMode]);

  return (
    <div className={`mt-2`} style={{ marginLeft: depth > 0 ? '20px' : '0' }}>
      <div 
        onClick={() => !isExportingMode && setIsOpen(!isOpen)}
        className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${
          isExportingMode ? 'cursor-default' : 'cursor-pointer'
        } ${
          depth === 0 ? 'bg-purple-600 text-white border-purple-700 shadow-md' :
          depth === 1 ? 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100' :
          'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
        }`}
      >
        {node.children && node.children.length > 0 ? (
          <span className="shrink-0">{isOpen ? <Minus size={14}/> : <Plus size={14}/>}</span>
        ) : (
          <span className="w-[14px] shrink-0"></span>
        )}
        <span className="font-bold text-sm">{node.label}</span>
      </div>
      {isOpen && node.children && node.children.length > 0 && (
        <div className="border-l-2 border-slate-200 ml-5 pl-4 space-y-2 mt-2">
          {node.children.map((child: any, idx: number) => (
            <MindmapNode key={idx} node={child} depth={depth + 1} isExportingMode={isExportingMode} />
          ))}
        </div>
      )}
    </div>
  );
};

// --- TYPES ---
interface ResultData {
  identifikasi: { pesertaDidik: string; materi: string; dimensiProfil: string };
  kurikulumCinta: { cintaAllah: string; cintaDiri: string; cintaSesama: string; cintaAlam: string; cintaIlmu: string };
  desainPembelajaran: { capaian: string; tp: string; topik: string; praktikPedagogis: string; lingkungan: string };
  pengalamanBelajar: { awal: string; inti: string; penutup: string };
  asesmen: { awal: string; proses: string; akhir: string };
  materiLengkap: string;
  lkpdIndividu: { judul: string; langkah: string };
  lkpdKelompok: { judul: string; langkah: string };
  penugasanIndividu: { judul: string; instruksi: string };
  rubrikPenilaian: Array<{ kriteria: string; sangatBaik: string; baik: string; cukup: string; perluBimbingan: string }>;
  evaluasi: {
    pilgan: Array<{ soal: string; a: string; b: string; c: string; d: string; kunci: string; image?: string }>;
    essay: Array<{ soal: string; kunci: string; image?: string }>;
  };
  kisiKisi: Array<{ no: number; materi: string; indikator: string; level: string; bloom: string; bentukSoal: string }>;
  prota: Array<{ semester: string; materi: string; alokasiWaktu: string }>;
  prosem: Array<{ materi: string; alokasiWaktu: string; jadwal: string[] }>;
  mindmap: {
    label: string;
    children: Array<{
      label: string;
      children?: Array<{
        label: string;
      }>;
    }>;
  };
  tekaTekiSilang: {
    mendatar: Array<{ nomor: number; pertanyaan: string; jawaban: string }>;
    menurun: Array<{ nomor: number; pertanyaan: string; jawaban: string }>;
  };
}

// --- KONFIGURASI ---
const MODEL_NAME = "gemini-3-flash-preview";

export default function App() {
  // --- STATE IDENTITAS MATERI ---
  const [subject, setSubject] = useState('Al-Islam');
  const [customSubject, setCustomSubject] = useState('');
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [topic, setTopic] = useState('Iman Kepada Allah SWT');
  const [namaPenyusun, setNamaPenyusun] = useState('Aminudin, S.Pd.');
  const [nbmPenyusun, setNbmPenyusun] = useState('1640634'); 
  const [kelas, setKelas] = useState('Kelas VII');
  const [semester, setSemester] = useState('Ganjil');
  const [tahunAjaran, setTahunAjaran] = useState('2025/2026');
  const [alokasiWaktu, setAlokasiWaktu] = useState('3 JP x 40 Menit');
  
  // --- STATE IDENTITAS SEKOLAH ---
  const [namaSekolah, setNamaSekolah] = useState('SMP MUHAMMADIYAH 1 KOTA PROBOLINGGO');
  const [namaKepala, setNamaKepala] = useState('Rachmawati Fitriyah, S.H,. S.Pd.'); 
  const [nbmKepala, setNbmKepala] = useState('1083916'); 
  const [kota, setKota] = useState('Probolinggo');
  const [tanggal, setTanggal] = useState('10 Januari 2026');

  // --- STATE NAVIGASI & EKSPOR ---
  const [activeTab, setActiveTab] = useState('rpp');
  const [paperFormat, setPaperFormat] = useState('a4'); 
  const [isLoading, setIsLoading] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [isExportingMode, setIsExportingMode] = useState(false);
  const [isLibraryReady, setIsLibraryReady] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false); 
  const [result, setResult] = useState<ResultData | null>(null);
  const [error, setError] = useState('');
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [userApiKey, setUserApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [ttsMode, setTtsMode] = useState('full'); // 'full' or 'horizontal'
  const [numPilgan, setNumPilgan] = useState(10);
  const [numEssay, setNumEssay] = useState(5);
  const [mainTab, setMainTab] = useState('modul'); // 'modul', 'prota', 'prosem', 'konsultasi'
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'model'; text: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [protaList, setProtaList] = useState('');
  const [prosemList, setProsemList] = useState('');
  const [soalMaterials, setSoalMaterials] = useState<Array<{ topic: string; level: 'Mudah' | 'Menengah' | 'HOTS'; bloom: string }>>([{ topic: '', level: 'Menengah', bloom: 'C2' }]);
  const [examTitle, setExamTitle] = useState('ASESMEN SUMATIF');
  const [noEssayMode, setNoEssayMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isGeneratingMateri, setIsGeneratingMateri] = useState(false);
  const [isChatMaximized, setIsChatMaximized] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [includeDalil, setIncludeDalil] = useState(true);
  
  // --- STATE KALENDER PENDIDIKAN ---
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarGanjil, setCalendarGanjil] = useState([
    { month: 'Juli', weeks: ['T', 'T', 'E', 'E', 'E'] },
    { month: 'Agustus', weeks: ['E', 'E', 'E', 'E', 'E'] },
    { month: 'September', weeks: ['E', 'E', 'E', 'E', 'T'] },
    { month: 'Oktober', weeks: ['E', 'E', 'E', 'E', 'E'] },
    { month: 'November', weeks: ['E', 'E', 'E', 'E', 'E'] },
    { month: 'Desember', weeks: ['E', 'E', 'T', 'T', 'T'] },
  ]);
  const [calendarGenap, setCalendarGenap] = useState([
    { month: 'Januari', weeks: ['T', 'E', 'E', 'E', 'E'] },
    { month: 'Februari', weeks: ['E', 'E', 'E', 'E', 'E'] },
    { month: 'Maret', weeks: ['E', 'E', 'T', 'E', 'E'] },
    { month: 'April', weeks: ['E', 'T', 'T', 'E', 'E'] },
    { month: 'Mei', weeks: ['E', 'E', 'E', 'E', 'T'] },
    { month: 'Juni', weeks: ['T', 'T', 'T', 'T', 'T'] },
  ]);

  const [effectiveWeeksGanjil, setEffectiveWeeksGanjil] = useState(19);
  const [nonEffectiveWeeksGanjil, setNonEffectiveWeeksGanjil] = useState(7);
  const [effectiveWeeksGenap, setEffectiveWeeksGenap] = useState(18);
  const [nonEffectiveWeeksGenap, setNonEffectiveWeeksGenap] = useState(8);

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) setUserApiKey(savedKey);
  }, []);

  const saveApiKey = (key: string) => {
    setUserApiKey(key);
    localStorage.setItem('gemini_api_key', key);
  };

  // Update totals when calendar changes
  useEffect(() => {
    const calc = (cal: any[]) => {
      let e = 0, t = 0;
      cal.forEach(m => m.weeks.forEach((w: string) => w === 'E' ? e++ : t++));
      return { e, t };
    };
    const ganjil = calc(calendarGanjil);
    setEffectiveWeeksGanjil(ganjil.e);
    setNonEffectiveWeeksGanjil(ganjil.t);
    const genap = calc(calendarGenap);
    setEffectiveWeeksGenap(genap.e);
    setNonEffectiveWeeksGenap(genap.t);
  }, [calendarGanjil, calendarGenap]);

  useEffect(() => {
    // Memuat logo default saat pertama kali aplikasi dijalankan
    const defaultLogoUrl = 'https://cdn-icons-png.flaticon.com/512/167/167707.png';
    
    const loadDefaultLogo = () => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          try {
            setLogoBase64(canvas.toDataURL('image/png'));
          } catch (e) {
            console.warn("Gagal mengonversi logo ke Base64, menggunakan URL langsung.");
            setLogoBase64(defaultLogoUrl);
          }
        }
      };
      img.onerror = () => {
        console.warn("Gagal memuat logo default dari URL utama, mencoba fallback.");
        // Fallback ke URL alternatif jika utama gagal
        const fallbackUrl = 'https://cdn-icons-png.flaticon.com/512/167/167707.png';
        setLogoBase64(fallbackUrl);
      };
      img.src = defaultLogoUrl;
    };
    
    loadDefaultLogo();
  }, []);

  const displaySubject = isCustomSubject ? customSubject : subject;
  const exportAreaRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatLoading]);

  useEffect(() => {
    const scripts = [
      { id: 'html2pdf-script', src: 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js' },
      { id: 'html2canvas-script', src: 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js' }
    ];
    
    let loadedCount = 0;
    const totalScripts = scripts.length;

    const checkReady = () => {
      loadedCount++;
      if (loadedCount === totalScripts) {
        setIsLibraryReady(true);
      }
    };

    scripts.forEach(s => {
      const existing = document.getElementById(s.id);
      if (!existing) {
        const script = document.createElement('script');
        script.id = s.id;
        script.src = s.src;
        script.async = true;
        script.onload = checkReady;
        script.onerror = () => {
          console.error(`Gagal memuat script: ${s.src}`);
          // Tetap hitung agar tidak stuck jika satu gagal, tapi mungkin tampilkan peringatan
          checkReady();
        };
        document.body.appendChild(script);
      } else {
        // Jika sudah ada, anggap sudah termuat
        checkReady();
      }
    });
  }, []);

  const cleanText = (text: string) => {
    if (!text) return "";
    let cleaned = text.replace(/\\n/g, "\n").replace(/#/g, "").replace(/_{2,}/g, "").replace(/\s{3,}/g, " ").trim();
    // Tambahkan newline sebelum angka jika angka tersebut berada di tengah kalimat (setelah titik) untuk merapikan penomoran yang "collapse"
    cleaned = cleaned.replace(/([.!?])\s+(\d+\.)\s+/g, "$1\n$2 ");
    return cleaned;
  };

  const processBold = (line: string) => {
    if (typeof line !== 'string') return line;
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-black">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const renderFormattedText = (text: string, className = "") => {
    if (!text) return null;
    const cleaned = cleanText(text);
    const lines = cleaned.split('\n');
    
    // Logic grouping untuk mencegah pemotongan antara judul dan isi (keep with next)
    const groups: { type: 'line' | 'spacer', content?: string, key: number }[][] = [];
    let currentGroup: { type: 'line' | 'spacer', content?: string, key: number }[] = [];
    
    lines.forEach((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) {
        if (currentGroup.length > 0) {
          groups.push(currentGroup);
          currentGroup = [];
        }
        groups.push([{ type: 'spacer', key: i }]);
        return;
      }
      
      // Deteksi judul sub-bab atau poin utama
      const isHeading = trimmed.length < 150 && (
        /^\d+\./.test(trimmed) || 
        /^[A-Z][A-Z\s]{3,}$/.test(trimmed) ||
        trimmed.startsWith('Pengertian') || 
        trimmed.startsWith('Dalil') || 
        trimmed.startsWith('Hukum') || 
        trimmed.startsWith('Hikmah') ||
        trimmed.endsWith(':')
      );
      
      if (isHeading && currentGroup.length > 0) {
        groups.push(currentGroup);
        currentGroup = [];
      }
      
      currentGroup.push({ type: 'line', content: line, key: i });
    });
    
    if (currentGroup.length > 0) groups.push(currentGroup);
    
    return groups.map((group, gIdx) => {
      if (group[0].type === 'spacer') {
        return <div key={`g-${gIdx}`} className="h-2"></div>;
      }
      
      return (
        <div key={`g-${gIdx}`} className="section-block" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
          {group.map((item) => {
            const line = item.content || "";
            const i = item.key;
            
            const isArabic = /[\u0600-\u06FF]/.test(line);
            
            const listMatch = line.match(/^(\s*)(\d+\.|\-|\*|[a-z]\.)\s+(.*)$/);
            if (listMatch) {
              const bullet = listMatch[2];
              const content = listMatch[3];
              return (
                <div key={i} className={`flex gap-2 mb-2 last:mb-0 leading-relaxed ${className}`} 
                     style={{ 
                       direction: isArabic ? 'rtl' : 'ltr',
                       textAlign: isArabic ? 'right' : (isExportingMode ? 'left' : 'justify'),
                       letterSpacing: isExportingMode ? '0.4px' : 'normal',
                       wordSpacing: isExportingMode ? '0.6px' : 'normal'
                     }}>
                  <span className="shrink-0 font-bold min-w-[1.8rem]" style={{ marginRight: isExportingMode ? '4px' : '0' }}>{bullet}</span>
                  <div className={`flex-1 ${isArabic ? 'text-[18px] font-serif leading-[1.8]' : ''}`}>{processBold(content)}</div>
                </div>
              );
            }
            
            return (
              <div key={i} className={`mb-3 last:mb-0 leading-relaxed ${className}`} 
                    style={{ 
                      wordBreak: 'break-word', 
                      overflowWrap: 'break-word',
                      direction: isArabic ? 'rtl' : 'ltr',
                      textAlign: isArabic ? 'right' : (isExportingMode ? 'left' : 'justify'),
                      fontSize: isArabic ? '18px' : 'inherit',
                      fontFamily: isArabic ? 'serif' : 'inherit',
                      lineHeight: isArabic ? '1.8' : 'inherit',
                      letterSpacing: isExportingMode ? '0.4px' : 'normal',
                      wordSpacing: isExportingMode ? '0.6px' : 'normal'
                    }}>
                {processBold(line)}
              </div>
            );
          })}
        </div>
      );
    });
  };

  const handleGenerateMateriList = async () => {
    setIsGeneratingMateri(true);
    const apiKeyToUse = userApiKey || process.env.GEMINI_API_KEY || "";
    if (!apiKeyToUse) {
      setError("Kode aplikasi tidak ditemukan. Silakan masukkan kode di pengaturan.");
      setIsGeneratingMateri(false);
      return;
    }

    const ai = new GoogleGenAI({ apiKey: apiKeyToUse });
    const type = mainTab === 'prota' ? 'Tahunan (1 Tahun)' : 'Semester (6 Bulan)';

    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: [
          { role: 'user', parts: [{ text: `Berikan daftar materi pokok Kurikulum Merdeka Fase D (SMP) untuk Mata Pelajaran: ${displaySubject}, ${kelas}. 
          Format output: HANYA DAFTAR MATERI, satu materi per baris, tanpa nomor, tanpa penjelasan, tanpa kata pengantar. 
          Berikan materi untuk jangka waktu: ${type}.` }] }
        ],
      });

      const list = response.text || "";
      if (mainTab === 'prota') {
        setProtaList(list.trim());
      } else {
        setProsemList(list.trim());
      }
    } catch (err) {
      console.error("Generate Materi Error:", err);
      setError("Gagal generate materi otomatis.");
    } finally {
      setIsGeneratingMateri(false);
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    
    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setIsChatLoading(true);

    const apiKeyToUse = userApiKey || process.env.GEMINI_API_KEY || "";
    if (!apiKeyToUse) {
      setChatMessages(prev => [...prev, { role: 'model', text: "Maaf, kode aplikasi tidak ditemukan. Silakan masukkan kode di pengaturan." }]);
      setIsChatLoading(false);
      return;
    }

    const ai = new GoogleGenAI({ apiKey: apiKeyToUse });

    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: [
          { role: 'user', parts: [{ text: `Anda adalah asisten ahli administrasi guru dan pendidikan yang profesional. Jawablah pertanyaan berikut dengan sangat bijak, mendalam, dan sesuai dengan regulasi pendidikan terbaru di Indonesia (Kurikulum Merdeka). 
          Gunakan tata bahasa Indonesia yang baik dan benar sesuai EYD. 
          Gunakan pemformatan yang rapi (gunakan poin-poin atau penomoran jika perlu) agar mudah dibaca.
          Pertanyaan: ${userMsg}` }] }
        ],
        config: {
          systemInstruction: "Anda adalah konsultan pendidikan profesional untuk guru SMP Muhammadiyah. Anda memberikan saran yang praktis, religius (AIK), dan sesuai standar akademik tinggi. Pastikan jawaban Anda rapi, profesional, dan mudah dipahami.",
        }
      });

      const reply = response.text || "Maaf, saya tidak dapat memberikan jawaban saat ini.";
      setChatMessages(prev => [...prev, { role: 'model', text: reply }]);
    } catch (err) {
      console.error("Chat Error:", err);
      setChatMessages(prev => [...prev, { role: 'model', text: "Terjadi kesalahan saat menghubungi asisten. Mohon coba lagi." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleDownloadDefaultLogo = () => {
    const logoUrl = 'https://drive.google.com/file/d/1VvSuJzYatiDrM5-j0yNIDmUjvAGCHGuH/view?usp=sharing';
    window.open(logoUrl, '_blank');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const currentTopic = mainTab === 'modul' ? topic : mainTab === 'prota' ? protaList : mainTab === 'prosem' ? prosemList : examTitle;
    if (!currentTopic.trim()) { 
      setError(mainTab === 'modul' ? 'Mohon masukkan judul materi.' : mainTab === 'soal' ? 'Mohon masukkan judul soal/ujian.' : 'Mohon masukkan daftar materi.'); 
      return; 
    }
    if (mainTab === 'soal' && soalMaterials.some(m => !m.topic.trim())) {
      setError('Mohon lengkapi semua judul materi soal.');
      return;
    }

    setIsLoading(true); 
    setError('');
    
    const apiKeyToUse = userApiKey || process.env.GEMINI_API_KEY || "";
    if (!apiKeyToUse) {
      setError("Kode aplikasi tidak ditemukan. Silakan masukkan kode pembelian anda di panel pengaturan.");
      setIsLoading(false);
      return;
    }

    const ai = new GoogleGenAI({ apiKey: apiKeyToUse });

    const calendarInfo = `
      Kalender Pendidikan Detail:
      Semester Ganjil: ${calendarGanjil.map(m => `${m.month} (${m.weeks.join(',')})`).join('; ')}
      Semester Genap: ${calendarGenap.map(m => `${m.month} (${m.weeks.join(',')})`).join('; ')}
      (E = Efektif, T = Tidak Efektif, L = Libur)
    `;

    let prompt = "";
    if (mainTab === 'modul') {
      prompt = `Buat RPP MENDALAM Profesional Kurikulum Merdeka Fase D (SMP) untuk ${kelas}, materi: "${topic}", Mata Pelajaran: ${displaySubject}. 
        WAJIB:
        1. Gunakan Bahasa Indonesia formal yang sangat baik.
        2. Pastikan bagian "Target Peserta Didik" (identifikasi.pesertaDidik) secara eksplisit menyebutkan "${kelas}".
        3. LKPD Mandiri, LKPD Kelompok, dan Penugasan harus terisi dengan instruksi kerja atau butir pertanyaan yang sangat lengkap, sistematis, dan mendalam.
        4. PENTING: Untuk LKPD dan Penugasan, setiap butir instruksi/pertanyaan HARUS dipisahkan dengan baris baru (newline \\n) agar membentuk daftar yang rapi. Jangan menggabungkan beberapa nomor dalam satu paragraf.
        5. Tambahkan bagian "materiLengkap" yang berisi penjelasan konsep secara runtut, komunikatif, dan mendalam. Materi WAJIB dipecah menjadi beberapa sub-bab yang sistematis. Gunakan format paragraf standar dengan spasi antar paragraf yang jelas (gunakan double newline \\n\\n untuk antar paragraf).
        ${(displaySubject.toLowerCase().includes('al-islam') || displaySubject.toLowerCase().includes('agama islam')) ? 
          `KHUSUS untuk mata pelajaran ${displaySubject}, struktur "materiLengkap" HARUS mencakup: 
          - Pengertian
          ${includeDalil ? '- Dalil (Wajib mencakup ayat Al-Qur\'an dan Hadits yang relevan, sertakan teks Arab asli beserta terjemahannya)' : ''}
          - Hukum (jika ada kaitannya dengan materi)
          - Hikmah.
          Pastikan setiap sub-bab ini diisi secara lengkap, mendalam, dan bebas dari kesalahan pengetikan (typo).` : 
          `Untuk mata pelajaran ${displaySubject}, sesuaikan struktur "materiLengkap" agar mencakup konsep-konsep kunci secara lengkap, sistematis, mendalam, dan bebas dari kesalahan pengetikan (typo). ${includeDalil ? 'Sertakan ayat Al-Qur\'an atau Hadits yang relevan jika memungkinkan.' : 'Jangan sertakan ayat Al-Qur\'an atau Hadits dalam teks materi.'}`
        }
        6. Evaluasi: ${numPilgan} Pilihan Ganda (A-D) dan ${numEssay} Essay berbobot tinggi.
        7. Kisi-kisi Soal: Buat tabel kisi-kisi soal yang mencakup nomor, materi, indikator soal, level kognitif (L1/L2/L3), Taksonomi Bloom (C1-C6), dan bentuk soal.
        8. Program Tahunan (Prota): Buat rencana program tahunan yang mencakup semester, materi pokok, dan alokasi waktu. Gunakan kalender pendidikan: Ganjil (${effectiveWeeksGanjil} Efektif, ${nonEffectiveWeeksGanjil} Tidak Efektif), Genap (${effectiveWeeksGenap} Efektif, ${nonEffectiveWeeksGenap} Tidak Efektif). ${calendarInfo}
        9. Program Semester (Prosem): Buat rencana program semester (6 bulan) yang mencakup materi pokok, alokasi waktu, dan jadwal bulanan. Sesuaikan dengan jumlah pekan efektif yang diberikan. ${calendarInfo}
        10. Integrasikan nilai-nilai keislaman dan kemuhammadiyahan dalam bagian Kurikulum Berbasis Cinta (KBC).
        11. Tambahkan bagian "tekaTekiSilang" yang berisi ${ttsMode === 'full' ? 'minimal 5 pertanyaan mendatar dan 5 pertanyaan menurun' : 'minimal 10 pertanyaan mendatar saja (kosongkan bagian menurun)'} yang relevan dengan materi.
        12. Tambahkan bagian "mindmap" yang berisi struktur hierarkis materi (Root -> Sub-materi -> Sub-sub materi) untuk mempermudah visualisasi pengajaran.
        Jawab dalam format JSON murni sesuai schema.`;
    } else if (mainTab === 'prota') {
      prompt = `Buat PROGRAM TAHUNAN (PROTA) Profesional Kurikulum Merdeka Fase D (SMP) untuk ${kelas}, Mata Pelajaran: ${displaySubject}.
        Daftar Materi Pokok yang diinginkan:
        ${protaList}
        
        Kalender Pendidikan:
        - Semester Ganjil: ${effectiveWeeksGanjil} Pekan Efektif, ${nonEffectiveWeeksGanjil} Pekan Tidak Efektif.
        - Semester Genap: ${effectiveWeeksGenap} Pekan Efektif, ${nonEffectiveWeeksGenap} Pekan Tidak Efektif.
        ${calendarInfo}
        
        WAJIB:
        1. Gunakan Bahasa Indonesia formal (EYD) yang sangat baik.
        2. Susun materi tersebut ke dalam Semester Ganjil dan Genap secara logis.
        3. Tentukan Alokasi Waktu (JP) yang realistis untuk setiap materi berdasarkan jumlah pekan efektif yang tersedia.
        4. Jawab dalam format JSON murni sesuai schema (hanya isi bagian prota, yang lain bisa dikosongkan atau dummy).`;
    } else if (mainTab === 'soal') {
      const materiList = soalMaterials.map(m => `- ${m.topic} (Kesulitan: ${m.level}, Taksonomi Bloom: ${m.bloom})`).join('\n');
      prompt = `Buat SOAL UJIAN / ASESMEN Profesional Kurikulum Merdeka Fase D (SMP) untuk ${kelas}, Mata Pelajaran: ${displaySubject}.
        Judul Ujian: ${examTitle}
        Daftar Materi & Tingkat Kesulitan:
        ${materiList}
        
        WAJIB:
        1. Gunakan Bahasa Indonesia formal (EYD) yang sangat baik.
        2. Buat ${numPilgan} soal Pilihan Ganda (A-D) yang berkualitas tinggi sesuai tingkat kesulitan yang diminta.
        3. ${noEssayMode ? 'JANGAN buat soal Essay.' : `Buat ${numEssay} soal Essay yang mendalam.`}
        4. Buat tabel KISI-KISI SOAL yang lengkap mencakup nomor, materi, indikator soal, level kognitif (L1/L2/L3), Taksonomi Bloom (C1-C6), dan bentuk soal.
        5. Jawab dalam format JSON murni sesuai schema (hanya isi bagian evaluasi dan kisiKisi, yang lain bisa dikosongkan atau dummy).`;
    } else {
      prompt = `Buat PROGRAM SEMESTER (PROSEM) Profesional Kurikulum Merdeka Fase D (SMP) untuk ${kelas}, Semester: ${semester}, Mata Pelajaran: ${displaySubject}.
        Daftar Materi Pokok yang diinginkan:
        ${prosemList}
        
        Kalender Pendidikan Semester ${semester}:
        - Pekan Efektif: ${semester === 'Ganjil' ? effectiveWeeksGanjil : effectiveWeeksGenap}
        - Pekan Tidak Efektif: ${semester === 'Ganjil' ? nonEffectiveWeeksGanjil : nonEffectiveWeeksGenap}
        ${calendarInfo}
        
        WAJIB:
        1. Gunakan Bahasa Indonesia formal (EYD) yang sangat baik.
        2. Tentukan Alokasi Waktu (JP) yang realistis untuk setiap materi berdasarkan jumlah pekan efektif.
        3. Buat jadwal distribusi bulanan (6 bulan) dengan menandai minggu efektif (gunakan tanda 'X' atau 'V' dalam array jadwal). Pastikan total minggu efektif yang ditandai sesuai dengan input kalender pendidikan di atas.
        4. Jawab dalam format JSON murni sesuai schema (hanya isi bagian prosem, yang lain bisa dikosongkan atau dummy).`;
    }

    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          systemInstruction: "Anda adalah Guru Ahli Kurikulum Merdeka di lingkungan SMP Muhammadiyah yang visioner. Output Anda selalu terstruktur, mendalam, dan siap pakai secara profesional.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              identifikasi: { type: Type.OBJECT, properties: { pesertaDidik: { type: Type.STRING }, materi: { type: Type.STRING }, dimensiProfil: { type: Type.STRING } } },
              kurikulumCinta: { type: Type.OBJECT, properties: { cintaAllah: { type: Type.STRING }, cintaDiri: { type: Type.STRING }, cintaSesama: { type: Type.STRING }, cintaAlam: { type: Type.STRING }, cintaIlmu: { type: Type.STRING } } },
              desainPembelajaran: { type: Type.OBJECT, properties: { capaian: { type: Type.STRING }, tp: { type: Type.STRING }, topik: { type: Type.STRING }, praktikPedagogis: { type: Type.STRING }, lingkungan: { type: Type.STRING } } },
              pengalamanBelajar: { type: Type.OBJECT, properties: { awal: { type: Type.STRING }, inti: { type: Type.STRING }, penutup: { type: Type.STRING } } },
              asesmen: { type: Type.OBJECT, properties: { awal: { type: Type.STRING }, proses: { type: Type.STRING }, akhir: { type: Type.STRING } } },
              materiLengkap: { type: Type.STRING },
              lkpdIndividu: { type: Type.OBJECT, properties: { judul: { type: Type.STRING }, langkah: { type: Type.STRING } } },
              lkpdKelompok: { type: Type.OBJECT, properties: { judul: { type: Type.STRING }, langkah: { type: Type.STRING } } },
              penugasanIndividu: { type: Type.OBJECT, properties: { judul: { type: Type.STRING }, instruksi: { type: Type.STRING } } },
              rubrikPenilaian: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { kriteria: { type: Type.STRING }, sangatBaik: { type: Type.STRING }, baik: { type: Type.STRING }, cukup: { type: Type.STRING }, perluBimbingan: { type: Type.STRING } } } },
              evaluasi: {
                type: Type.OBJECT,
                properties: {
                  pilgan: {
                    type: Type.ARRAY,
                    items: { type: Type.OBJECT, properties: { soal: { type: Type.STRING }, a: { type: Type.STRING }, b: { type: Type.STRING }, c: { type: Type.STRING }, d: { type: Type.STRING }, kunci: { type: Type.STRING }, image: { type: Type.STRING, description: "Optional image URL or base64" } } }
                  },
                  essay: {
                    type: Type.ARRAY,
                    items: { type: Type.OBJECT, properties: { soal: { type: Type.STRING }, kunci: { type: Type.STRING }, image: { type: Type.STRING, description: "Optional image URL or base64" } } }
                  }
                }
              },
              kisiKisi: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    no: { type: Type.NUMBER },
                    materi: { type: Type.STRING },
                    indikator: { type: Type.STRING },
                    level: { type: Type.STRING },
                    bloom: { type: Type.STRING },
                    bentukSoal: { type: Type.STRING }
                  }
                }
              },
              prota: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    semester: { type: Type.STRING },
                    materi: { type: Type.STRING },
                    alokasiWaktu: { type: Type.STRING }
                  }
                }
              },
              prosem: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    materi: { type: Type.STRING },
                    alokasiWaktu: { type: Type.STRING },
                    jadwal: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
                }
              },
              tekaTekiSilang: {
                type: Type.OBJECT,
                properties: {
                  mendatar: {
                    type: Type.ARRAY,
                    items: { type: Type.OBJECT, properties: { nomor: { type: Type.NUMBER }, pertanyaan: { type: Type.STRING }, jawaban: { type: Type.STRING } } }
                  },
                  menurun: {
                    type: Type.ARRAY,
                    items: { type: Type.OBJECT, properties: { nomor: { type: Type.NUMBER }, pertanyaan: { type: Type.STRING }, jawaban: { type: Type.STRING } } }
                  }
                }
              },
              mindmap: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  children: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        label: { type: Type.STRING },
                        children: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              label: { type: Type.STRING }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            required: ["identifikasi", "kurikulumCinta", "desainPembelajaran", "pengalamanBelajar", "asesmen", "materiLengkap", "lkpdIndividu", "lkpdKelompok", "penugasanIndividu", "rubrikPenilaian", "evaluasi", "kisiKisi", "prota", "prosem", "tekaTekiSilang", "mindmap"]
          }
        }
      });

      if (response.text) {
        const data = JSON.parse(response.text);
        setResult(data);
        if (mainTab === 'soal') {
          setActiveTab('evaluasi');
        } else if (mainTab === 'prota') {
          setActiveTab('prota');
        } else if (mainTab === 'prosem') {
          setActiveTab('prosem');
        } else {
          setActiveTab('rpp');
        }
      }
    } catch (err) {
      setError("Gagal membuat materi. Pastikan koneksi internet stabil dan coba lagi.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (!result) return;
    
    // @ts-ignore
    if (!window.html2pdf) {
      alert("Library PDF belum siap, silakan tunggu sebentar atau muat ulang halaman.");
      return;
    }

    setIsPdfLoading(true); 
    setIsExportingMode(true);
    
    const isLandscape = activeTab === 'prosem';
    const paperDim = paperFormat === 'a4' ? 'a4' : [210, 330];
    const baseName = mainTab === 'soal' ? examTitle : topic;
    
    setTimeout(() => {
      try {
        const element = exportAreaRef.current;
        if (!element) {
          setIsPdfLoading(false);
          setIsExportingMode(false);
          return;
        }
        
        const opt = {
          margin: [10, 10, 10, 10], // Margin 1cm keliling
          filename: `${mainTab.toUpperCase()}_${activeTab.toUpperCase()}_${baseName.replace(/\s+/g, '_')}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 3, 
            useCORS: true, 
            logging: false,
            letterRendering: true,
            width: isLandscape ? 1050 : 718,
            windowWidth: isLandscape ? 1050 : 718,
            x: 0,
            y: 0,
            scrollX: 0,
            scrollY: 0,
          },
          jsPDF: { unit: 'mm', format: paperDim, orientation: isLandscape ? 'landscape' : 'portrait', compress: true },
          pagebreak: { mode: ['css', 'legacy'], avoid: ['tr', '.header-bg', '.section-block'] }
        };
        
        // @ts-ignore
        window.html2pdf().set(opt).from(element).save().then(() => {
          setIsPdfLoading(false); 
          setIsExportingMode(false);
        }).catch((err: any) => {
          console.error("PDF Export Error (Promise):", err);
          alert("Gagal mengekspor PDF. Silakan coba lagi.");
          setIsPdfLoading(false);
          setIsExportingMode(false);
        });
      } catch (err) {
        console.error("PDF Export Error (Catch):", err);
        alert("Terjadi kesalahan saat menyiapkan PDF. Silakan coba lagi.");
        setIsPdfLoading(false);
        setIsExportingMode(false);
      }
    }, 1200); // Tambahkan sedikit waktu agar mindmap sempat terbuka semua
  };

  const handleExportImage = () => {
    if (!result) return;
    
    // @ts-ignore
    if (!window.html2canvas) {
      alert("Library Gambar belum siap, silakan tunggu sebentar atau muat ulang halaman.");
      return;
    }

    setIsExportingMode(true);
    setTimeout(() => {
      try {
        const element = exportAreaRef.current;
        if (!element) {
          setIsExportingMode(false);
          return;
        }
        
        // @ts-ignore
        window.html2canvas(element, { 
          scale: 4, 
          useCORS: true, 
          allowTaint: true,
          backgroundColor: '#ffffff',
          windowWidth: activeTab === 'prosem' ? 1400 : 1200,
          onclone: (clonedDoc: Document) => {
            const clonedElement = clonedDoc.getElementById('export-area');
            if (clonedElement) {
              const images = clonedElement.getElementsByTagName('img');
              for (let i = 0; i < images.length; i++) {
                images[i].setAttribute('crossOrigin', 'anonymous');
                const src = images[i].src;
                images[i].src = '';
                images[i].src = src;
              }
            }
          }
        }).then(canvas => {
          const link = document.createElement('a');
          const baseName = mainTab === 'soal' ? examTitle : topic;
          link.download = `IMG_${activeTab.toUpperCase()}_${baseName.replace(/\s+/g, '_')}.jpg`;
          link.href = canvas.toDataURL("image/jpeg", 0.95);
          link.click();
          setIsExportingMode(false);
        }).catch((err: any) => {
          console.error("Image Export Error (Promise):", err);
          alert("Gagal mengekspor gambar. Silakan coba lagi.");
          setIsExportingMode(false);
        });
      } catch (err) {
        console.error("Image Export Error (Catch):", err);
        alert("Terjadi kesalahan saat menyiapkan gambar. Silakan coba lagi.");
        setIsExportingMode(false);
      }
    }, 1000); // Tambahkan sedikit waktu agar mindmap sempat terbuka semua
  };

  const handleGenerateImage = async (prompt: string, index: number, type: 'pilgan' | 'essay') => {
    if (!result) return;
    
    const apiKeyToUse = userApiKey || process.env.GEMINI_API_KEY || "";
    if (!apiKeyToUse) {
      setError("Kode aplikasi tidak ditemukan. Silakan masukkan kode pembelian anda di panel pengaturan.");
      return;
    }

    setIsGeneratingMateri(true);
    try {
      const ai = new GoogleGenAI({ apiKey: apiKeyToUse });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `Generate a high-quality educational illustration for this school question: "${prompt}". Style: clean, professional, educational illustration, no text in image.` }],
        },
        config: {
          imageConfig: { aspectRatio: "1:1" }
        }
      });

      let imageUrl = "";
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageUrl) {
        const newResult = { ...result };
        if (type === 'pilgan') {
          newResult.evaluasi.pilgan[index].image = imageUrl;
        } else {
          newResult.evaluasi.essay[index].image = imageUrl;
        }
        setResult(newResult);
      }
    } catch (err) {
      console.error("Image Generation Error:", err);
      setError("Gagal menghasilkan gambar. Silakan coba lagi.");
    } finally {
      setIsGeneratingMateri(false);
    }
  };

  const exportToWord = (ext: string) => {
    if (!result || !exportAreaRef.current) return;
    const baseName = mainTab === 'soal' ? examTitle : topic;
    const fileName = `${mainTab.toUpperCase()}_${activeTab.toUpperCase()}_${baseName.replace(/\s+/g, '_')}.${ext}`;
    const isLandscape = activeTab === 'prosem';
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><style>@page { size: ${isLandscape ? 'landscape' : 'portrait'}; margin: 2.0cm; } body { font-family: 'Times New Roman', serif; font-size: 11pt; } table { border-collapse: collapse; width: 100%; border: 1pt solid black; } th, td { border: 1pt solid black; padding: 8pt; vertical-align: top; } .header-bg { background-color: #b4c7e7; text-align: center; font-weight: bold; }</style></head><body>`;
    const footer = "</body></html>";
    const contentHtml = exportAreaRef.current.innerHTML;
    const blob = new Blob(['\ufeff', header + contentHtml + footer], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = fileName; link.click();
  };

  const getHeaderTitle = () => {
    if (mainTab === 'soal' && activeTab === 'evaluasi') return examTitle.toUpperCase();
    switch(activeTab) {
      case 'rpp': return 'RENCANA PELAKSANAAN PEMBELAJARAN';
      case 'materi': return 'RINGKASAN MATERI PEMBELAJARAN';
      case 'lkpd_individu': return 'LEMBAR KERJA PESERTA DIDIK (MANDIRI)';
      case 'lkpd_kelompok': return 'LEMBAR KERJA PESERTA DIDIK (KELOMPOK)';
      case 'penugasan': return 'LEMBAR PENUGASAN TERSTRUKTUR';
      case 'instrumen': return 'RUBRIK KRITERIA & INSTRUMEN PENILAIAN';
      case 'evaluasi': return 'LEMBAR EVALUASI PEMBELAJARAN';
      case 'kisi_kisi': return 'KISI-KISI SOAL EVALUASI';
      case 'prota': return 'PROGRAM TAHUNAN (PROTA)';
      case 'prosem': return 'PROGRAM SEMESTER (PROSEM)';
      case 'tts': return 'TEKA-TEKI SILANG (TTS) MATERI';
      case 'mindmap': return 'AI MINDMAP BAGAN MATERI';
      default: return 'RENCANA PELAKSANAAN PEMBELAJARAN';
    }
  };

  const getAttachmentData = () => {
    if (!result) return null;
    switch(activeTab) {
      case 'materi': return { judul: `MATERI: ${result.desainPembelajaran.topik}`, isi: result.materiLengkap };
      case 'lkpd_individu': return { judul: result.lkpdIndividu.judul, isi: result.lkpdIndividu.langkah };
      case 'lkpd_kelompok': return { judul: result.lkpdKelompok.judul, isi: result.lkpdKelompok.langkah };
      case 'penugasan': return { judul: result.penugasanIndividu.judul, isi: result.penugasanIndividu.instruksi };
      case 'tts': return { judul: `TTS: ${result.desainPembelajaran.topik}`, isi: "" };
      default: return null;
    }
  };

  const isKBCVisible = displaySubject.toLowerCase().includes('islam') || displaySubject.toLowerCase().includes('muhammadiyah') || displaySubject.toLowerCase().includes('arab');

  const IdentityTable = () => (
    <table className="w-full border-collapse mb-4 text-[11px]" style={{ border: '1pt solid black', tableLayout: 'fixed', boxSizing: 'border-box', borderSpacing: 0 }}>
      <tbody>
        <tr>
          <td className="p-2 border border-black" style={{ border: '1pt solid black', width: '50%' }}>Nama: ............................................................</td>
          <td className="p-2 border border-black" style={{ border: '1pt solid black', width: '25%' }}>Kelas: .................</td>
          <td className="p-2 border border-black" style={{ border: '1pt solid black', width: '25%' }}>Tanggal: ............</td>
        </tr>
      </tbody>
    </table>
  );

  const InstitutionalKop = () => {
    const sampleLogo = 'https://cdn-icons-png.flaticon.com/512/167/167707.png';
    return (
      <div style={{ width: '100%', marginBottom: '15pt', boxSizing: 'border-box', position: 'relative', pageBreakInside: 'avoid' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100px' }}>
          <div style={{ position: 'absolute', left: '0', top: '0' }}>
            <img src={logoBase64 || sampleLogo} alt="Logo" style={{ width: '85px', height: '85px', objectFit: 'contain' }} crossOrigin="anonymous" />
          </div>
        
        <div style={{ textAlign: 'center', width: '100%', paddingLeft: '85px', paddingRight: '20px', boxSizing: 'border-box', letterSpacing: isExportingMode ? '0.2px' : 'normal' }}>
          <p style={{ margin: '0', fontSize: '10pt', fontWeight: 'bold' }}>MAJELIS PENDIDIKAN DASAR MENENGAH DAN PENDIDIKAN NON FORMAL</p>
          <p style={{ margin: '0', fontSize: '11pt', fontWeight: 'bold' }}>PIMPINAN DAERAH MUHAMMADIYAH KOTA PROBOLINGGO</p>
          <h1 style={{ margin: '2pt 0', fontSize: '15pt', fontWeight: 'bold', textTransform: 'uppercase' }}>SMP MUHAMMADIYAH 1 KOTA PROBOLINGGO</h1>
          <p style={{ margin: '0', fontSize: '10pt', fontWeight: 'bold' }}>TERAKREDITASI A</p>
          <p style={{ margin: '0', fontSize: '9pt' }}>Jl. Mayjend Panjaitan 73 Kota Probolinggo Email: <span style={{ color: 'blue', textDecoration: 'underline' }}>smp_muh.prob@yahoo.co.id</span></p>
          <p style={{ margin: '0', fontSize: '9pt' }}>Telp/fax. 0335-422307 Website: smpmusapro.sch.id</p>
        </div>
      </div>
      
      <div style={{ borderTop: '2.5pt solid black', marginTop: '6pt', width: '100%', boxSizing: 'border-box' }}></div>
      <div style={{ borderTop: '0.5pt solid black', marginTop: '2pt', width: '100%', marginBottom: '10pt', boxSizing: 'border-box' }}></div>
    </div>
  );
};

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 font-sans text-slate-900 selection:bg-blue-100">
      <div className="flex-grow p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* HEADER BRANDING */}
          {!isExportingMode && (
            <div className="space-y-4">
              <div className="relative flex items-center justify-between bg-white px-4 md:px-6 py-4 rounded-2xl shadow-sm border border-slate-200">
                 {/* UPDATE INDICATOR */}
                 <div className="absolute top-2 right-4 text-[8px] md:text-[9px] font-black text-slate-300 uppercase tracking-tighter">
                   Update 06.03.26
                 </div>
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center shadow-md border border-slate-100 overflow-hidden p-1">
                      {logoBase64 ? (
                        <img src={logoBase64} alt="Logo" className="w-full h-full object-contain" crossOrigin="anonymous" />
                      ) : (
                        <School size={24} className="text-slate-300" />
                      )}
                   </div>
                   <div>
                     <h1 className="text-lg md:text-xl font-black text-slate-800 tracking-tight">WAKA AIK SMPMUSAPRO</h1>
                     <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">SMP MUHAMMADIYAH 1 PROBOLINGGO</p>
                   </div>
                 </div>
                 <div className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-500">
                    <div className="flex items-center gap-1"><CheckCircle2 size={14} className="text-emerald-500" /> Kurikulum Merdeka</div>
                    <div className="flex items-center gap-1"><CheckCircle2 size={14} className="text-emerald-500" /> KBC Integrated</div>
                 </div>
              </div>

              {/* MAIN NAVIGATION */}
              <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto no-scrollbar">
                <button onClick={() => { setMainTab('modul'); setActiveTab('rpp'); }} className={`flex-1 min-w-[120px] px-4 md:px-6 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase flex items-center justify-center gap-2 transition-all ${mainTab === 'modul' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}><Layout size={16}/> Buat Modul</button>
                <button onClick={() => { setMainTab('prota'); setActiveTab('prota'); }} className={`flex-1 min-w-[100px] px-4 md:px-6 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase flex items-center justify-center gap-2 transition-all ${mainTab === 'prota' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}><Calendar size={16}/> Prota</button>
                <button onClick={() => { setMainTab('prosem'); setActiveTab('prosem'); }} className={`flex-1 min-w-[100px] px-4 md:px-6 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase flex items-center justify-center gap-2 transition-all ${mainTab === 'prosem' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}><RefreshCw size={16}/> Prosem</button>
                <button onClick={() => { setMainTab('soal'); setActiveTab('evaluasi'); }} className={`flex-1 min-w-[140px] px-4 md:px-6 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase flex items-center justify-center gap-2 transition-all ${mainTab === 'soal' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}><ClipboardList size={16}/> Generate Soal</button>
                <button onClick={() => setMainTab('konsultasi')} className={`flex-1 min-w-[120px] px-4 md:px-6 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase flex items-center justify-center gap-2 transition-all ${mainTab === 'konsultasi' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}><Sparkles size={16}/> Konsultasi</button>
              </div>
            </div>
          )}

          {/* KONSULTASI CHAT INTERFACE */}
          {mainTab === 'konsultasi' && !isExportingMode && (
            <div className={`bg-[#E5DDD5] rounded-2xl shadow-xl border border-slate-200 flex flex-col overflow-hidden relative transition-all duration-300 ${
              isChatMaximized 
                ? 'fixed inset-4 z-[100] h-auto' 
                : isChatMinimized 
                  ? 'h-[60px]' 
                  : 'h-[650px]'
            }`}>
              {/* WhatsApp Header */}
              <div className="bg-[#075E54] p-3 text-white flex items-center justify-between shadow-md z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center overflow-hidden border border-white/20">
                    {logoBase64 ? (
                      <img src={logoBase64} alt="Avatar" className="w-full h-full object-contain" />
                    ) : (
                      <School size={20} className="text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm leading-tight">WAKA AIK (Konsultasi)</h3>
                    <p className="text-[10px] text-emerald-100 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> Online
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setIsChatMinimized(!isChatMinimized);
                      if (isChatMaximized) setIsChatMaximized(false);
                    }}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white"
                    title={isChatMinimized ? "Buka Chat" : "Minimal Layar"}
                  >
                    {isChatMinimized ? <Plus size={18} /> : <Minus size={18} />}
                  </button>
                  <button 
                    onClick={() => {
                      setIsChatMaximized(!isChatMaximized);
                      if (isChatMinimized) setIsChatMinimized(false);
                    }}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white"
                    title={isChatMaximized ? "Kecilkan Layar" : "Maximaze Layar"}
                  >
                    <Maximize2 size={18} />
                  </button>
                  <button 
                    onClick={() => setChatMessages([])}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white"
                    title="Bersihkan Chat"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              {/* Chat Area */}
              {!isChatMinimized && (
                <>
                  <div className="flex-grow overflow-y-auto p-4 space-y-3">
                    {chatMessages.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-white max-w-xs">
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Enkripsi End-to-End</p>
                          <p className="text-xs text-slate-600 leading-relaxed">Pesan dalam chat ini dilindungi secara profesional. Tanyakan apa saja seputar Kurikulum Merdeka atau AIK.</p>
                        </div>
                      </div>
                    )}
                    
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`relative max-w-[85%] px-3 py-2 rounded-lg text-sm shadow-sm ${
                          msg.role === 'user' 
                            ? 'bg-[#DCF8C6] text-slate-800 rounded-tr-none' 
                            : 'bg-white text-slate-800 rounded-tl-none'
                        }`}>
                          {/* Tail for bubbles */}
                          <div className={`absolute top-0 w-2 h-2 ${
                            msg.role === 'user' 
                              ? '-right-2 bg-[#DCF8C6] [clip-path:polygon(0_0,0_100%,100%_0)]' 
                              : '-left-2 bg-white [clip-path:polygon(100%_0,100%_100%,0_0)]'
                          }`}></div>
                          
                          <div className="leading-relaxed break-words">
                            {renderFormattedText(msg.text)}
                          </div>
                          <div className="text-[9px] text-slate-400 text-right mt-1 flex items-center justify-end gap-1">
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {msg.role === 'user' && <CheckCircle2 size={10} className="text-blue-500" />}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {isChatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-white px-3 py-2 rounded-lg rounded-tl-none shadow-sm flex items-center gap-2 relative">
                          <div className="absolute top-0 -left-2 w-2 h-2 bg-white [clip-path:polygon(100%_0,100%_100%,0_0)]"></div>
                          <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* WhatsApp Input Area */}
                  <div className="p-2 bg-[#F0F2F5] flex items-center gap-2">
                    <div className="flex gap-1 px-1">
                      <button className="p-2 text-slate-500 hover:text-slate-700 transition-colors"><Smile size={22} /></button>
                      <button className="p-2 text-slate-500 hover:text-slate-700 transition-colors"><Paperclip size={22} /></button>
                    </div>
                    <div className="flex-grow relative">
                      <input 
                        type="text" 
                        value={chatInput} 
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleChat()}
                        placeholder="Ketik pesan"
                        className="w-full p-2.5 px-4 bg-white border-none rounded-full text-sm focus:ring-0 outline-none shadow-sm"
                      />
                    </div>
                    <button 
                      onClick={handleChat}
                      disabled={isChatLoading || !chatInput.trim()}
                      className={`p-3 rounded-full flex items-center justify-center transition-all shadow-md ${
                        chatInput.trim() ? 'bg-[#00A884] text-white hover:bg-[#008F6F]' : 'bg-slate-400 text-white opacity-50'
                      }`}
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* CONTROL PANEL */}
          {mainTab !== 'konsultasi' && !isExportingMode && (
            <div className="bg-white p-6 rounded-2xl shadow-xl border-b-8 border-slate-800 transition-all">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4 border-r border-slate-100 pr-0 lg:pr-6">
                  <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2"><Layout size={14} /> Identitas Sekolah</h3>
                  <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm shadow-inner">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 ml-1">Nama Institusi</label>
                      <input type="text" value={namaSekolah} onChange={e => setNamaSekolah(e.target.value)} className="w-full p-2 border rounded font-bold bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 ml-1">Logo Institusi</label>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3 p-2 bg-white border rounded-lg shadow-sm">
                          <div className="w-12 h-12 border rounded bg-slate-50 flex items-center justify-center overflow-hidden p-1 flex-shrink-0">
                            <img 
                              src={logoBase64 || 'https://cdn-icons-png.flaticon.com/512/167/167707.png'} 
                              alt="Preview" 
                              className="w-full h-full object-contain" 
                              crossOrigin="anonymous" 
                            />
                          </div>
                          <div className="flex-grow">
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handleLogoUpload} 
                              className="hidden" 
                              id="logo-upload" 
                            />
                            <label 
                              htmlFor="logo-upload" 
                              className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md text-[11px] font-bold hover:bg-blue-100 cursor-pointer transition-all border border-blue-100"
                            >
                              <Upload size={14} /> Ganti Logo
                            </label>
                            <button 
                              onClick={handleDownloadDefaultLogo}
                              className="ml-2 inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-md text-[11px] font-bold hover:bg-emerald-100 cursor-pointer transition-all border border-emerald-100"
                              title="Download Logo Muhammadiyah"
                            >
                              <Download size={14} /> Download Logo
                            </button>
                            {logoBase64 && (
                              <button 
                                onClick={() => setLogoBase64(null)}
                                className="ml-3 text-[10px] text-red-500 font-bold hover:underline"
                              >
                                Hapus
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-[9px] text-slate-400 italic ml-1">* Disarankan menggunakan gambar format PNG transparan.</p>
                      </div>
                    </div>
                    {(mainTab === 'modul' || mainTab === 'soal') && (
                      <div className="grid grid-cols-2 gap-2">
                         <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 ml-1">Jumlah Pilgan</label>
                            <input type="number" value={numPilgan} onChange={e => setNumPilgan(parseInt(e.target.value) || 0)} className="w-full p-2 border rounded bg-white font-bold" />
                         </div>
                         <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 ml-1">Jumlah Essay</label>
                            <input 
                              type="number" 
                              value={noEssayMode && mainTab === 'soal' ? 0 : numEssay} 
                              onChange={e => setNumEssay(parseInt(e.target.value) || 0)} 
                              disabled={noEssayMode && mainTab === 'soal'}
                              className="w-full p-2 border rounded bg-white font-bold disabled:opacity-50" 
                            />
                         </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                       <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 ml-1">Kota</label>
                          <input type="text" value={kota} onChange={e => setKota(e.target.value)} placeholder="Kota" className="w-full p-2 border rounded bg-white" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 ml-1">Tanggal Dokumen</label>
                          <input type="text" value={tanggal} onChange={e => setTanggal(e.target.value)} placeholder="Tanggal" className="w-full p-2 border rounded bg-white" />
                       </div>
                    </div>
                  </div>

                  <h3 className="text-xs font-black text-orange-600 uppercase tracking-widest flex items-center gap-2 mt-4"><Printer size={14} /> Format & Pengesahan</h3>
                  <div className="space-y-3 p-4 bg-orange-50 rounded-xl border border-orange-100 shadow-inner text-sm">
                    <div className="grid grid-cols-2 gap-3 mb-2">
                       <input type="text" value={tahunAjaran} onChange={e => setTahunAjaran(e.target.value)} placeholder="Tahun Pelajaran" className="w-full p-2 border rounded bg-white" />
                       <select value={semester} onChange={e => setSemester(e.target.value)} className="w-full p-2 border rounded bg-white font-bold">
                         <option value="Ganjil">Semester Ganjil</option><option value="Genap">Semester Genap</option>
                       </select>
                    </div>
                    <div className="flex gap-4 p-2 bg-white rounded-lg border border-orange-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase self-center mr-2">Ukuran Kertas:</span>
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-xs"><input type="radio" checked={paperFormat === 'f4'} onChange={() => setPaperFormat('f4')} className="accent-orange-600" /> F4</label>
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-xs"><input type="radio" checked={paperFormat === 'a4'} onChange={() => setPaperFormat('a4')} className="accent-orange-600" /> A4</label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" value={namaKepala} onChange={e => setNamaKepala(e.target.value)} placeholder="Nama Kepala" className="w-full p-2 border rounded text-xs bg-white font-semibold" />
                      <input type="text" value={nbmKepala} onChange={e => setNbmKepala(e.target.value)} placeholder="NBM Kepala" className="w-full p-2 border rounded text-xs bg-white" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2"><UserCheck size={14} /> Detail Materi & Guru</h3>
                  <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm shadow-inner">
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" value={namaPenyusun} onChange={e => setNamaPenyusun(e.target.value)} className="w-full p-2 border rounded font-bold bg-white" />
                      <input type="text" value={nbmPenyusun} onChange={e => setNbmPenyusun(e.target.value)} className="w-full p-2 border rounded bg-white" placeholder="NBM Guru" />
                    </div>
                    
                    <select value={isCustomSubject ? 'manual' : subject} onChange={e => e.target.value === 'manual' ? setIsCustomSubject(true) : (setIsCustomSubject(false), setSubject(e.target.value))} className="w-full p-2 border rounded font-bold outline-none bg-white">
                        <option value="Al-Islam">Al-Islam</option>
                        <option value="Kemuhammadiyahan">Kemuhammadiyahan</option>
                        <option value="Bahasa Arab">Bahasa Arab</option>
                        <option value="Pendidikan Pancasila">Pendidikan Pancasila</option>
                        <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                        <option value="Matematika">Matematika</option>
                        <option value="IPA (Sains)">IPA (Sains)</option>
                        <option value="manual">Tulis Mapel Lainnya...</option>
                    </select>

                    {isCustomSubject && <input type="text" value={customSubject} onChange={e => setCustomSubject(e.target.value)} placeholder="Ketik Nama Mata Pelajaran..." className="w-full p-2 border rounded font-bold bg-emerald-50 border-emerald-200" />}
                    
                    <div className="grid grid-cols-2 gap-2">
                      <select value={kelas} onChange={e => setKelas(e.target.value)} className="w-full p-2 border rounded font-bold bg-white">
                        <option value="Kelas VII">Kelas VII</option>
                        <option value="Kelas VIII">Kelas VIII</option>
                        <option value="Kelas IX">Kelas IX</option>
                      </select>
                      <input type="text" value={alokasiWaktu} onChange={e => setAlokasiWaktu(e.target.value)} placeholder="Alokasi Waktu" className="w-full p-2 border rounded font-bold bg-white" />
                    </div>

                    {(mainTab === 'prota' || mainTab === 'prosem') && (
                      <div className="space-y-4">
                        <button 
                          onClick={() => setShowCalendar(!showCalendar)}
                          className="w-full p-3 bg-slate-800 text-white rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg"
                        >
                          <Calendar size={14} /> {showCalendar ? 'Tutup Kalender Pendidikan' : 'Buka Kalender Pendidikan'}
                        </button>

                        {showCalendar && (
                          <div className="space-y-6 p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="flex items-center justify-between border-b pb-2">
                              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Kalender Pendidikan</h4>
                              <div className="flex gap-3 text-[9px] font-bold">
                                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full"></span> Efektif</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-rose-500 rounded-full"></span> Tdk Efektif</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-500 rounded-full"></span> Libur</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                              {/* SEMESTER GANJIL */}
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-1 h-4 bg-rose-600 rounded-full"></div>
                                  <h5 className="text-[10px] font-black text-rose-600 uppercase">Semester Ganjil</h5>
                                </div>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-[10px]">
                                    <thead>
                                      <tr className="text-slate-400 font-bold">
                                        <th className="text-left py-1">Bulan</th>
                                        <th className="text-center py-1">W1</th>
                                        <th className="text-center py-1">W2</th>
                                        <th className="text-center py-1">W3</th>
                                        <th className="text-center py-1">W4</th>
                                        <th className="text-center py-1">W5</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {calendarGanjil.map((m, mIdx) => (
                                        <tr key={mIdx}>
                                          <td className="py-2 font-bold text-slate-600">{m.month}</td>
                                          {m.weeks.map((w, wIdx) => (
                                            <td key={wIdx} className="text-center py-1 px-0.5">
                                              <button 
                                                onClick={() => {
                                                  const newCal = [...calendarGanjil];
                                                  const states = ['E', 'T', 'L'];
                                                  const nextIdx = (states.indexOf(w) + 1) % states.length;
                                                  newCal[mIdx].weeks[wIdx] = states[nextIdx] as any;
                                                  setCalendarGanjil(newCal);
                                                }}
                                                className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-[9px] transition-all shadow-sm transform active:scale-90 ${
                                                  w === 'E' ? 'bg-emerald-500 text-white' : 
                                                  w === 'T' ? 'bg-rose-500 text-white' : 
                                                  'bg-amber-500 text-white'
                                                }`}
                                              >
                                                {w}
                                              </button>
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              {/* SEMESTER GENAP */}
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-1 h-4 bg-teal-600 rounded-full"></div>
                                  <h5 className="text-[10px] font-black text-teal-600 uppercase">Semester Genap</h5>
                                </div>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-[10px]">
                                    <thead>
                                      <tr className="text-slate-400 font-bold">
                                        <th className="text-left py-1">Bulan</th>
                                        <th className="text-center py-1">W1</th>
                                        <th className="text-center py-1">W2</th>
                                        <th className="text-center py-1">W3</th>
                                        <th className="text-center py-1">W4</th>
                                        <th className="text-center py-1">W5</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {calendarGenap.map((m, mIdx) => (
                                        <tr key={mIdx}>
                                          <td className="py-2 font-bold text-slate-600">{m.month}</td>
                                          {m.weeks.map((w, wIdx) => (
                                            <td key={wIdx} className="text-center py-1 px-0.5">
                                              <button 
                                                onClick={() => {
                                                  const newCal = [...calendarGenap];
                                                  const states = ['E', 'T', 'L'];
                                                  const nextIdx = (states.indexOf(w) + 1) % states.length;
                                                  newCal[mIdx].weeks[wIdx] = states[nextIdx] as any;
                                                  setCalendarGenap(newCal);
                                                }}
                                                className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-[9px] transition-all shadow-sm transform active:scale-90 ${
                                                  w === 'E' ? 'bg-emerald-500 text-white' : 
                                                  w === 'T' ? 'bg-rose-500 text-white' : 
                                                  'bg-amber-500 text-white'
                                                }`}
                                              >
                                                {w}
                                              </button>
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-inner">
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black text-rose-600 uppercase flex items-center gap-1"><Calendar size={10}/> Semester Ganjil</h4>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[9px] font-bold text-slate-500 block mb-1">Pekan Efektif</label>
                              <input type="number" value={effectiveWeeksGanjil} onChange={e => setEffectiveWeeksGanjil(parseInt(e.target.value) || 0)} className="w-full p-2 border rounded font-bold text-xs focus:border-rose-300 focus:ring-0 outline-none" />
                            </div>
                            <div>
                              <label className="text-[9px] font-bold text-slate-500 block mb-1">Pekan Tidak Efektif</label>
                              <input type="number" value={nonEffectiveWeeksGanjil} onChange={e => setNonEffectiveWeeksGanjil(parseInt(e.target.value) || 0)} className="w-full p-2 border rounded font-bold text-xs focus:border-rose-300 focus:ring-0 outline-none" />
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black text-teal-600 uppercase flex items-center gap-1"><Calendar size={10}/> Semester Genap</h4>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[9px] font-bold text-slate-500 block mb-1">Pekan Efektif</label>
                              <input type="number" value={effectiveWeeksGenap} onChange={e => setEffectiveWeeksGenap(parseInt(e.target.value) || 0)} className="w-full p-2 border rounded font-bold text-xs focus:border-teal-300 focus:ring-0 outline-none" />
                            </div>
                            <div>
                              <label className="text-[9px] font-bold text-slate-500 block mb-1">Pekan Tidak Efektif</label>
                              <input type="number" value={nonEffectiveWeeksGenap} onChange={e => setNonEffectiveWeeksGenap(parseInt(e.target.value) || 0)} className="w-full p-2 border rounded font-bold text-xs focus:border-teal-300 focus:ring-0 outline-none" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="space-y-1 pt-2">
                       <label className="text-[10px] font-black text-blue-600 uppercase ml-1 flex items-center justify-between">
                         <span>{mainTab === 'modul' ? 'Judul Materi (Topic)' : mainTab === 'prota' ? 'Daftar Materi Tahunan' : mainTab === 'prosem' ? 'Daftar Materi Semester' : 'Judul Soal / Ujian'}</span>
                         {(mainTab === 'prota' || mainTab === 'prosem') && (
                           <button 
                             onClick={handleGenerateMateriList}
                             disabled={isGeneratingMateri}
                             className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-all text-[9px] font-bold border border-blue-200 disabled:opacity-50"
                           >
                             {isGeneratingMateri ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                             Generate Contoh
                           </button>
                         )}
                       </label>
                       {mainTab === 'modul' ? (
                         <input 
                           type="text" 
                           value={topic} 
                           onChange={e => setTopic(e.target.value)} 
                           placeholder="Contoh: Meneladani Asmaul Husna..." 
                           className="w-full p-3 border-2 border-blue-200 rounded-xl font-black text-lg focus:border-blue-500 focus:ring-0 transition-all bg-white" 
                         />
                       ) : mainTab === 'soal' ? (
                         <input 
                           type="text" 
                           value={examTitle} 
                           onChange={e => setExamTitle(e.target.value)} 
                           placeholder="Contoh: ASESMEN SUMATIF BAB 1..." 
                           className="w-full p-3 border-2 border-blue-200 rounded-xl font-black text-lg focus:border-blue-500 focus:ring-0 transition-all bg-white" 
                         />
                       ) : (
                         <textarea 
                           value={mainTab === 'prota' ? protaList : prosemList}
                           onChange={e => mainTab === 'prota' ? setProtaList(e.target.value) : setProsemList(e.target.value)}
                           placeholder={mainTab === 'prota' ? "Masukkan daftar materi pokok selama satu tahun (pisahkan dengan baris baru)..." : "Masukkan daftar materi pokok selama satu semester (pisahkan dengan baris baru)..."}
                           className="w-full p-3 border-2 border-blue-200 rounded-xl font-bold text-sm focus:border-blue-500 focus:ring-0 transition-all bg-white h-32"
                         />
                       )}
                    </div>

                    {mainTab === 'soal' && (
                      <div className="space-y-3 pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-blue-600 uppercase ml-1">Daftar Materi & Tingkat Kesulitan</label>
                          <button 
                            onClick={() => setSoalMaterials([...soalMaterials, { topic: '', level: 'Menengah', bloom: 'C2' }])}
                            className="p-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                            title="Tambah Materi"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <div className="space-y-2">
                          {soalMaterials.map((m, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                              <input 
                                type="text" 
                                value={m.topic} 
                                onChange={e => {
                                  const newM = [...soalMaterials];
                                  newM[idx].topic = e.target.value;
                                  setSoalMaterials(newM);
                                }}
                                placeholder={`Materi ${idx + 1}`}
                                className="flex-grow p-2 border rounded-lg text-xs font-bold bg-white"
                              />
                              <select 
                                value={m.level} 
                                onChange={e => {
                                  const newM = [...soalMaterials];
                                  newM[idx].level = e.target.value as any;
                                  setSoalMaterials(newM);
                                }}
                                className="p-2 border rounded-lg text-[10px] font-bold bg-white w-20"
                              >
                                <option value="Mudah">Mudah</option>
                                <option value="Menengah">Menengah</option>
                                <option value="HOTS">HOTS</option>
                              </select>
                              <select 
                                value={m.bloom} 
                                onChange={e => {
                                  const newM = [...soalMaterials];
                                  newM[idx].bloom = e.target.value;
                                  setSoalMaterials(newM);
                                }}
                                className="p-2 border rounded-lg text-[10px] font-bold bg-white w-24"
                              >
                                <option value="C1">C1 (Mengingat)</option>
                                <option value="C2">C2 (Memahami)</option>
                                <option value="C3">C3 (Menerapkan)</option>
                                <option value="C4">C4 (Menganalisis)</option>
                                <option value="C5">C5 (Mengevaluasi)</option>
                                <option value="C6">C6 (Mencipta)</option>
                              </select>
                              {soalMaterials.length > 1 && (
                                <button 
                                  onClick={() => setSoalMaterials(soalMaterials.filter((_, i) => i !== idx))}
                                  className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                >
                                  <Minus size={14} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        
                         <div className="flex items-center gap-4 pt-2">
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <div className={`w-10 h-5 rounded-full transition-all relative ${noEssayMode ? 'bg-blue-600' : 'bg-slate-300'}`}>
                              <input type="checkbox" checked={noEssayMode} onChange={e => setNoEssayMode(e.target.checked)} className="hidden" />
                              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${noEssayMode ? 'left-6' : 'left-1'}`}></div>
                            </div>
                            <span className="text-[10px] font-black text-slate-500 uppercase group-hover:text-blue-600">Mode Tanpa Essay</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer group">
                            <div className={`w-10 h-5 rounded-full transition-all relative ${includeDalil ? 'bg-blue-600' : 'bg-slate-300'}`}>
                              <input type="checkbox" checked={includeDalil} onChange={e => setIncludeDalil(e.target.checked)} className="hidden" />
                              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${includeDalil ? 'left-6' : 'left-1'}`}></div>
                            </div>
                            <span className="text-[10px] font-black text-slate-500 uppercase group-hover:text-blue-600">Sertakan Ayat/Hadits</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* API KEY INPUT */}
                    <div className="pt-2 border-t border-slate-100 mt-2">
                      <button 
                        onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                        className="text-[10px] font-bold text-slate-400 flex items-center gap-1 hover:text-blue-600 transition-all"
                      >
                        <Settings2 size={12} /> {showApiKeyInput ? 'Sembunyikan Pengaturan' : 'Pengaturan'}
                      </button>
                      
                      {showApiKeyInput && (
                        <div className="mt-2 p-3 bg-blue-50 rounded-xl border border-blue-100 space-y-2">
                          <label className="text-[10px] font-bold text-blue-600 uppercase block">KODE APLIKASI</label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <input 
                                type={showApiKey ? "text" : "password"} 
                                value={userApiKey} 
                                onChange={e => saveApiKey(e.target.value)}
                                placeholder="Masukkan KODE Pembelian Anda..." 
                                className="w-full p-2 pr-16 text-xs border rounded bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                <button 
                                  onClick={() => setShowApiKey(!showApiKey)}
                                  className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                                  title={showApiKey ? "Sembunyikan" : "Lihat"}
                                >
                                  {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                                <button 
                                  onClick={() => {
                                    navigator.clipboard.writeText(userApiKey);
                                    alert("Kode berhasil disalin!");
                                  }}
                                  className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                                  title="Salin Kode"
                                >
                                  <Copy size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                          <p className="text-[9px] text-slate-500 leading-tight">
                            *Kode disimpan secara lokal di browser Anda. Pastikan anda menyimpan secara  pribadi, untuk digunakan pada browser yang berbeda.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <button onClick={() => handleGenerate()} disabled={isLoading} className={`w-full text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 ${mainTab === 'modul' ? 'bg-slate-900 hover:bg-black' : mainTab === 'prota' ? 'bg-rose-600 hover:bg-rose-700' : mainTab === 'prosem' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-orange-600 hover:bg-orange-700'}`}>
                    {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles className="text-yellow-400" />} 
                    {mainTab === 'modul' ? 'BUAT MODUL LENGKAP' : mainTab === 'prota' ? 'BUAT PROTA LENGKAP' : mainTab === 'prosem' ? 'BUAT PROSEM LENGKAP' : 'BUAT SOAL LENGKAP'}
                  </button>
                  {error && <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-center gap-2"><AlertTriangle size={14}/> {error}</div>}
                </div>
              </div>
            </div>
          )}

          {/* TAB NAVIGATION */}
          {result && !isExportingMode && mainTab === 'modul' && (
            <div className="flex flex-wrap gap-2 justify-center bg-white p-3 rounded-2xl shadow-lg border border-slate-200 sticky top-4 z-50">
              <button onClick={() => setActiveTab('rpp')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all ${activeTab === 'rpp' ? 'bg-blue-600 text-white shadow-lg scale-105' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}><Layout size={12}/> Modul Utama</button>
              <button onClick={() => setActiveTab('materi')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all ${activeTab === 'materi' ? 'bg-amber-600 text-white shadow-lg scale-105' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}><ClipboardList size={12}/> Materi</button>
              <button onClick={() => setActiveTab('lkpd_individu')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all ${activeTab === 'lkpd_individu' ? 'bg-emerald-600 text-white shadow-lg scale-105' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}><User size={12}/> LKPD</button>
              <button onClick={() => setActiveTab('penugasan')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all ${activeTab === 'penugasan' ? 'bg-pink-600 text-white shadow-lg scale-105' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}><PenTool size={12}/> Tugas</button>
              <button onClick={() => setActiveTab('instrumen')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all ${activeTab === 'instrumen' ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}><ClipboardList size={12}/> Rubrik</button>
              <button onClick={() => setActiveTab('evaluasi')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all ${activeTab === 'evaluasi' ? 'bg-orange-600 text-white shadow-lg scale-105' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}><FileText size={12}/> Evaluasi</button>
              <button onClick={() => setActiveTab('kisi_kisi')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all ${activeTab === 'kisi_kisi' ? 'bg-cyan-600 text-white shadow-lg scale-105' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}><ClipboardList size={12}/> Kisi-kisi</button>
              <button onClick={() => setActiveTab('prota')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all ${activeTab === 'prota' ? 'bg-rose-600 text-white shadow-lg scale-105' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}><Calendar size={12}/> Prota</button>
              <button onClick={() => setActiveTab('prosem')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all ${activeTab === 'prosem' ? 'bg-teal-600 text-white shadow-lg scale-105' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}><RefreshCw size={12}/> Prosem</button>
              <button onClick={() => setActiveTab('mindmap')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all ${activeTab === 'mindmap' ? 'bg-purple-600 text-white shadow-lg scale-105' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}><Sparkles size={12}/> Mindmap</button>
              
              <div className="h-8 w-px bg-slate-200 mx-2 hidden lg:block"></div>
              
              <div className="flex gap-1">
                <button onClick={() => setIsEditMode(!isEditMode)} className={`px-3 py-2 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all border ${isEditMode ? 'bg-amber-500 text-white border-amber-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                  {isEditMode ? <Save size={12}/> : <Edit3 size={12}/>} {isEditMode ? 'Selesai Edit' : 'Edit Konten'}
                </button>
                <button 
                  onClick={handleExportPDF} 
                  disabled={isPdfLoading || !isLibraryReady} 
                  className={`px-3 py-2 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all disabled:opacity-50 ${
                    isLibraryReady ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isPdfLoading || !isLibraryReady ? <Loader2 size={12} className="animate-spin"/> : <Download size={12}/>}
                  {isPdfLoading ? 'Mengekspor...' : (!isLibraryReady ? 'Menyiapkan...' : 'PDF')}
                </button>
                <button onClick={() => exportToWord('doc')} className="bg-slate-800 text-white px-3 py-2 rounded-xl text-[10px] font-bold flex items-center gap-1 hover:bg-black transition-all"><FileType size={12}/> Word</button>
                <button 
                  onClick={handleExportImage} 
                  disabled={!isLibraryReady}
                  className={`px-3 py-2 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all border ${
                    isLibraryReady ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  }`}
                >
                  {isLibraryReady ? <ImageIcon size={12}/> : <Loader2 size={12} className="animate-spin"/>}
                  {isLibraryReady ? 'JPG' : '...'}
                </button>
              </div>

              {(activeTab === 'evaluasi') && (
                <button onClick={() => setShowAnswers(!showAnswers)} className={`ml-2 px-3 py-2 rounded-xl text-[10px] font-bold flex items-center gap-1 border transition-all ${showAnswers ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-slate-100 text-slate-500 border-slate-300'}`}>
                  {showAnswers ? <EyeOff size={12}/> : <Eye size={12}/>} {showAnswers ? 'Guru View' : 'Siswa View'}
                </button>
              )}
            </div>
          )}

          {/* TAB NAVIGATION FOR SOAL */}
          {result && !isExportingMode && mainTab === 'soal' && (
            <div className="flex flex-wrap gap-2 justify-center bg-white p-3 rounded-2xl shadow-lg border border-slate-200 sticky top-4 z-50">
              <button onClick={() => setActiveTab('evaluasi')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all ${activeTab === 'evaluasi' ? 'bg-orange-600 text-white shadow-lg scale-105' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}><FileText size={12}/> Daftar Soal</button>
              <button onClick={() => setActiveTab('kisi_kisi')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all ${activeTab === 'kisi_kisi' ? 'bg-cyan-600 text-white shadow-lg scale-105' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}><ClipboardList size={12}/> Kisi-kisi</button>
              
              <div className="h-8 w-px bg-slate-200 mx-2 hidden lg:block"></div>
              
              <div className="flex gap-1">
                <button onClick={() => setIsEditMode(!isEditMode)} className={`px-3 py-2 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all border ${isEditMode ? 'bg-amber-500 text-white border-amber-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                  {isEditMode ? <Save size={12}/> : <Edit3 size={12}/>} {isEditMode ? 'Selesai Edit' : 'Edit Konten'}
                </button>
                <button 
                  onClick={handleExportPDF} 
                  disabled={isPdfLoading || !isLibraryReady} 
                  className={`px-3 py-2 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all disabled:opacity-50 ${
                    isLibraryReady ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isPdfLoading || !isLibraryReady ? <Loader2 size={12} className="animate-spin"/> : <Download size={12}/>}
                  {isPdfLoading ? 'Mengekspor...' : (!isLibraryReady ? 'Menyiapkan...' : 'PDF')}
                </button>
                <button onClick={() => exportToWord('doc')} className="bg-slate-800 text-white px-3 py-2 rounded-xl text-[10px] font-bold flex items-center gap-1 hover:bg-black transition-all"><FileType size={12}/> Word</button>
                <button 
                  onClick={handleExportImage} 
                  disabled={!isLibraryReady}
                  className={`px-3 py-2 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all border ${
                    isLibraryReady ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  }`}
                >
                  {isLibraryReady ? <ImageIcon size={12}/> : <Loader2 size={12} className="animate-spin"/>}
                  {isLibraryReady ? 'JPG' : '...'}
                </button>
              </div>

              <button onClick={() => setShowAnswers(!showAnswers)} className={`ml-2 px-3 py-2 rounded-xl text-[10px] font-bold flex items-center gap-1 border transition-all ${showAnswers ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-slate-100 text-slate-500 border-slate-300'}`}>
                {showAnswers ? <EyeOff size={12}/> : <Eye size={12}/>} {showAnswers ? 'Mode Guru' : 'Mode Siswa'}
              </button>
            </div>
          )}

          {/* EXPORT BAR FOR PROTA/PROSEM */}
          {result && !isExportingMode && (mainTab === 'prota' || mainTab === 'prosem') && (
            <div className="flex justify-center bg-white p-3 rounded-2xl shadow-lg border border-slate-200 sticky top-4 z-50 gap-2">
              <button onClick={() => setIsEditMode(!isEditMode)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all border ${isEditMode ? 'bg-amber-500 text-white border-amber-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                {isEditMode ? <Save size={14}/> : <Edit3 size={14}/>} {isEditMode ? 'Selesai Edit' : 'Edit Konten'}
              </button>
              <button 
                onClick={handleExportPDF} 
                disabled={isPdfLoading || !isLibraryReady} 
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all disabled:opacity-50 shadow-md ${
                  isLibraryReady ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isPdfLoading || !isLibraryReady ? <Loader2 size={14} className="animate-spin"/> : <Download size={14}/>}
                {isPdfLoading ? 'Mengekspor...' : (!isLibraryReady ? 'Menyiapkan...' : 'Unduh PDF')}
              </button>
              <button onClick={() => exportToWord('doc')} className="bg-slate-800 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-black transition-all shadow-md">
                <FileType size={14}/> Unduh Word
              </button>
              <button 
                onClick={handleExportImage} 
                disabled={!isLibraryReady}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all shadow-md ${
                  isLibraryReady ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isLibraryReady ? <ImageIcon size={14}/> : <Loader2 size={14} className="animate-spin"/>}
                {isLibraryReady ? 'Unduh JPG' : 'Menyiapkan...'}
              </button>
            </div>
          )}

          {/* PREVIEW AREA */}
          {result && mainTab !== 'konsultasi' && (
            <div ref={exportAreaRef}
                 id="export-area"
                 contentEditable={isEditMode}
                 suppressContentEditableWarning={true}
                 className={`bg-white text-black font-serif transition-all ${isExportingMode ? 'p-0 shadow-none border-none' : 'p-10 shadow-2xl border border-slate-300 mb-20'} ${isEditMode ? 'outline-2 outline-dashed outline-amber-400 cursor-text' : ''}`} 
                 style={{ 
                   width: isExportingMode ? (activeTab === 'prosem' ? '277mm' : '190mm') : 'auto', 
                   maxWidth: isExportingMode ? (activeTab === 'prosem' ? '277mm' : '190mm') : (activeTab === 'prosem' ? '297mm' : '210mm'),
                   fontSize: '11px', 
                   boxSizing: 'border-box',
                   height: 'auto',
                   overflow: 'visible',
                   // Menonaktifkan margin auto saat ekspor agar koordinat tepat di 0 (kiri)
                   marginLeft: isExportingMode ? '0' : 'auto', 
                   marginRight: isExportingMode ? '0' : 'auto',
                   padding: isExportingMode ? '0' : '40px',
                   backgroundColor: '#ffffff',
                   letterSpacing: isExportingMode ? '0.2px' : 'normal',
                   wordSpacing: isExportingMode ? '0.4px' : 'normal'
                 }}>
              
              {/* --- HEADER --- */}
              <div className="section-block" style={{ pageBreakInside: 'avoid' }}>
                {activeTab === 'rpp' ? (
                  <div style={{ textAlign: 'center', marginBottom: '15pt', width: '100%', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      {logoBase64 && <img src={logoBase64} alt="Logo" style={{ width: '85px', height: '85px', objectFit: 'contain' }} crossOrigin="anonymous" />}
                    </div>
                    <h1 className="font-bold uppercase m-0 mt-3 text-center leading-tight" style={{ fontSize: '15pt' }}>{namaSekolah}</h1>
                    <div style={{ width: '100%', height: '2pt', backgroundColor: 'black', marginTop: '10pt' }}></div>
                    <div style={{ width: '100%', height: '0.5pt', backgroundColor: 'black', marginTop: '2pt' }}></div>
                  </div>
                ) : (
                  <InstitutionalKop />
                )}
              </div>

              {/* RPP MAIN CONTENT */}
              {activeTab === 'rpp' ? (
                <div style={{ width: '100%', boxSizing: 'border-box' }}>
                  {/* Identitas Table */}
                  <div className="section-block" style={{ pageBreakInside: 'avoid' }}>
                    <table border={1} className="w-full border-collapse border border-black text-left" style={{ border: '1.5pt solid black', tableLayout: 'fixed', borderSpacing: 0, boxSizing: 'border-box' }}>
                      <tbody>
                        <tr className="header-bg" style={{ backgroundColor: '#b4c7e7', pageBreakAfter: 'avoid' }}>
                          <td colSpan={3} className="p-3 font-bold text-center uppercase text-[12px]" style={{ border: '1pt solid black' }}>
                            {getHeaderTitle()}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-black p-3 w-[36%] align-top space-y-1" style={{ border: '1pt solid black' }}>
                            <div className="mb-2 font-bold text-[12px]">{kota}, {tanggal}</div>
                            <div className="font-bold underline text-[12px]">Kepala Sekolah,</div>
                            <div className="h-16"></div>
                            <div className="font-bold underline text-[12px]">{namaKepala}</div>
                            <div className="text-[11px]">NBM: {nbmKepala}</div>
                          </td>
                          <td className="border border-black p-3 w-[24%] align-top font-bold bg-slate-50 text-[11px]" style={{ border: '1pt solid black' }}>
                            <div>Penyusun</div><div>Nomor NBM</div><div>Mata Pelajaran</div><div>Kelas/Semester</div><div>Tahun Ajaran</div><div>Alokasi Waktu</div><div>Fase</div>
                          </td>
                          <td className="border border-black p-3 w-[40%] align-top text-[11px]" style={{ border: '1pt solid black' }}>
                            <div>: {namaPenyusun}</div><div>: {nbmPenyusun}</div><div>: {displaySubject}</div><div>: {kelas} / {semester}</div><div>: {tahunAjaran}</div><div>: {alokasiWaktu}</div><div className="font-bold">: Fase D</div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Section-by-section with forced page-break-inside avoid */}
                  <div className="section-block" style={{ marginTop: '-1pt', pageBreakInside: 'avoid' }}>
                    <table className="w-full border-collapse border border-black" style={{ border: '1.5pt solid black', tableLayout: 'fixed', borderSpacing: 0, boxSizing: 'border-box' }}>
                      <tbody>
                        <tr className="header-bg" style={{ backgroundColor: '#b4c7e7', pageBreakAfter: 'avoid' }}>
                          <td className="p-2 font-bold uppercase text-center" style={{ border: '1pt solid black' }}>A. IDENTIFIKASI MATERI</td>
                        </tr>
                        <tr>
                          <td className="p-4" style={{ border: '1pt solid black' }}>{renderFormattedText(`**Target Peserta Didik:** ${result.identifikasi.pesertaDidik}\n**Materi Utama:** ${result.identifikasi.materi}\n**Dimensi Profil Pelajar Pancasila:** ${result.identifikasi.dimensiProfil}`)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="section-block" style={{ marginTop: '-1pt', pageBreakInside: 'avoid' }}>
                    <table className="w-full border-collapse border border-black" style={{ border: '1.5pt solid black', tableLayout: 'fixed', borderSpacing: 0, boxSizing: 'border-box' }}>
                      <tbody>
                        <tr className="header-bg" style={{ backgroundColor: '#b4c7e7', pageBreakAfter: 'avoid' }}>
                          <td className="p-2 font-bold uppercase text-center" style={{ border: '1pt solid black' }}>B. DESAIN PEMBELAJARAN</td>
                        </tr>
                        <tr>
                          <td className="p-4" style={{ border: '1pt solid black' }}>{renderFormattedText(`**Capaian Pembelajaran (CP):** ${result.desainPembelajaran.capaian}\n**Tujuan Pembelajaran (TP):** ${result.desainPembelajaran.tp}\n**Metode & Praktik Pedagogis:** ${result.desainPembelajaran.praktikPedagogis}`)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {isKBCVisible && (
                    <div className="section-block" style={{ marginTop: '-1pt', pageBreakInside: 'avoid' }}>
                      <table className="w-full border-collapse border border-black" style={{ border: '1.5pt solid black', tableLayout: 'fixed', borderSpacing: 0, boxSizing: 'border-box' }}>
                        <tbody>
                          <tr className="header-bg" style={{ backgroundColor: '#b4c7e7', pageBreakAfter: 'avoid' }}>
                            <td className="p-2 font-bold uppercase text-center" style={{ border: '1pt solid black' }}>C. KURIKULUM BERBASIS CINTA (KBC) INTEGRATED</td>
                          </tr>
                          <tr>
                            <td className="p-0" style={{ border: '1pt solid black' }}>
                              <table className="w-full border-none" style={{ tableLayout: 'fixed', borderSpacing: 0, boxSizing: 'border-box' }}>
                                <tbody>
                                  <tr style={{ borderBottom: '1pt solid black' }}>
                                    <td className="w-40 p-3 border-r border-black font-bold bg-slate-50 text-[11px]" style={{ borderRight: '1pt solid black' }}>Cinta Allah</td>
                                    <td className="p-3">{renderFormattedText(result.kurikulumCinta.cintaAllah)}</td>
                                  </tr>
                                  <tr style={{ borderBottom: '1pt solid black' }}>
                                    <td className="p-3 border-r border-black font-bold bg-slate-50 text-[11px]" style={{ borderRight: '1pt solid black' }}>Cinta Diri & Ilmu</td>
                                    <td className="p-3">{renderFormattedText(`${result.kurikulumCinta.cintaDiri}\n${result.kurikulumCinta.cintaIlmu}`)}</td>
                                  </tr>
                                  <tr>
                                    <td className="p-3 border-r border-black font-bold bg-slate-50 text-[11px]" style={{ borderRight: '1pt solid black' }}>Cinta Alam & Sesama</td>
                                    <td className="p-3">{renderFormattedText(`${result.kurikulumCinta.cintaAlam}\n${result.kurikulumCinta.cintaSesama}`)}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="section-block" style={{ marginTop: '-1pt', pageBreakInside: 'avoid' }}>
                    <table className="w-full border-collapse border border-black" style={{ border: '1.5pt solid black', tableLayout: 'fixed', borderSpacing: 0, boxSizing: 'border-box' }}>
                      <tbody>
                        <tr className="header-bg" style={{ backgroundColor: '#b4c7e7', pageBreakAfter: 'avoid' }}>
                          <td className="p-2 font-bold uppercase text-center" style={{ border: '1pt solid black' }}>{isKBCVisible ? 'D' : 'C'}. KEGIATAN PEMBELAJARAN</td>
                        </tr>
                        <tr>
                          <td className="p-0" style={{ border: '1pt solid black' }}>
                            <table className="w-full border-none" style={{ tableLayout: 'fixed', borderSpacing: 0, boxSizing: 'border-box' }}>
                              <tbody>
                                <tr style={{ borderBottom: '1pt solid black' }}>
                                  <td className="w-40 p-3 border-r border-black font-bold bg-slate-50 text-[11px]" style={{ borderRight: '1pt solid black' }}>Pendahuluan</td>
                                  <td className="p-3">{renderFormattedText(result.pengalamanBelajar.awal)}</td>
                                </tr>
                                <tr style={{ borderBottom: '1pt solid black' }}>
                                  <td className="w-40 p-3 border-r border-black font-bold bg-slate-50 text-[11px]" style={{ borderRight: '1pt solid black' }}>Kegiatan Inti</td>
                                  <td className="p-3">{renderFormattedText(result.pengalamanBelajar.inti)}</td>
                                </tr>
                                <tr>
                                  <td className="w-40 p-3 border-r border-black font-bold bg-slate-50 text-[11px]" style={{ borderRight: '1pt solid black' }}>Penutup</td>
                                  <td className="p-3">{renderFormattedText(result.pengalamanBelajar.penutup)}</td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="section-block" style={{ marginTop: '-1pt', pageBreakInside: 'avoid' }}>
                    <table className="w-full border-collapse border border-black" style={{ border: '1.5pt solid black', tableLayout: 'fixed', borderSpacing: 0, boxSizing: 'border-box' }}>
                      <tbody>
                        <tr className="header-bg" style={{ backgroundColor: '#b4c7e7', pageBreakAfter: 'avoid' }}>
                          <td className="p-2 font-bold uppercase text-center" style={{ border: '1pt solid black' }}>{isKBCVisible ? 'E' : 'D'}. ASESMEN & REFLEKSI</td>
                        </tr>
                        <tr>
                          <td className="p-0" style={{ border: '1pt solid black' }}>
                            <table className="w-full border-none" style={{ tableLayout: 'fixed', borderSpacing: 0, boxSizing: 'border-box' }}>
                              <tbody>
                                <tr style={{ borderBottom: '1pt solid black' }}>
                                  <td className="w-40 p-3 border-r border-black font-bold bg-slate-50 text-[11px]" style={{ borderRight: '1pt solid black' }}>Formatif</td>
                                  <td className="p-3">{renderFormattedText(result.asesmen.proses)}</td>
                                </tr>
                                <tr>
                                  <td className="w-40 p-3 border-r border-black font-bold bg-slate-50 text-[11px]" style={{ borderRight: '1pt solid black' }}>Sumatif</td>
                                  <td className="p-3">{renderFormattedText(result.asesmen.akhir)}</td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* ATTACHMENTS (LKPD, EVALUASI, DLL) */
                <div style={{ width: '100%', boxSizing: 'border-box' }}>
                  {/* Forced margin 1cm top for evaluations */}
                  <div className="section-block" style={{ paddingTop: isExportingMode ? '10mm' : '0' }}>
                    {activeTab !== 'materi' && (
                      <table border={1} className="w-full border-collapse border border-black mb-4" style={{ tableLayout: 'fixed', borderSpacing: 0, boxSizing: 'border-box' }}>
                          <tbody><tr className="header-bg" style={{ backgroundColor: '#b4c7e7' }}><td className="p-3 font-bold text-center uppercase text-[12px]" style={{ border: '1pt solid black' }}>{getHeaderTitle()}</td></tr></tbody>
                      </table>
                    )}
                  </div>
                  
                  {activeTab === 'evaluasi' ? (
                    <div className="mt-2 px-2">
                      <div className="section-block">
                        <IdentityTable />
                      </div>
                      <div className="mt-6 text-left">
                        <div className="section-block">
                          <div className="font-bold border-b-2 border-black mb-4 text-[13px] uppercase">Bagian I: Instrumen Pilihan Ganda</div>
                        </div>
                        <div className="space-y-4">
                          {result.evaluasi.pilgan.map((item, idx) => (
                            <div key={idx} className="mb-4 section-block" style={{ pageBreakInside: 'avoid' }}>
                              <div className="font-bold text-[12px] mb-1 flex gap-2 items-start">
                                <span className="shrink-0 min-w-[1.2rem]">{idx + 1}.</span>
                                <span className="flex-1">{item.soal}</span>
                                {isEditMode && (
                                  <button 
                                    onClick={() => handleGenerateImage(item.soal, idx, 'pilgan')}
                                    className="p-1 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition-all no-print shrink-0"
                                    title="Generate Gambar"
                                  >
                                    <ImageIcon size={12} />
                                  </button>
                                )}
                              </div>
                              {item.image && (
                                <div className="my-2 flex justify-center relative group">
                                  <img src={item.image} alt="Ilustrasi Soal" className="max-w-[200px] border border-slate-200 rounded shadow-sm" referrerPolicy="no-referrer" />
                                  {isEditMode && (
                                    <button 
                                      onClick={() => {
                                        const newRes = {...result};
                                        delete newRes.evaluasi.pilgan[idx].image;
                                        setResult(newRes);
                                      }}
                                      className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X size={10} />
                                    </button>
                                  )}
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-x-10 pl-5 text-[11px]">
                                <div className="flex gap-1"><span className="shrink-0">A.</span><span>{item.a}</span></div>
                                <div className="flex gap-1"><span className="shrink-0">C.</span><span>{item.c}</span></div>
                                <div className="flex gap-1"><span className="shrink-0">B.</span><span>{item.b}</span></div>
                                <div className="flex gap-1"><span className="shrink-0">D.</span><span>{item.d}</span></div>
                              </div>
                              {showAnswers && <div className="mt-1 text-blue-800 font-bold italic pl-5 text-[11px] bg-blue-50 py-1 rounded">Kunci Jawaban: {item.kunci?.toUpperCase()}</div>}
                            </div>
                          ))}
                        </div>
                        
                        <div className="section-block" style={{ pageBreakInside: 'avoid', marginTop: '20pt' }}>
                          <div className="font-bold border-b-2 border-black mb-4 mt-8 text-[13px] uppercase">Bagian II: Instrumen Essay</div>
                        </div>
                        <div className="space-y-8">
                          {result.evaluasi.essay.map((item, idx) => (
                            <div key={idx} className="mb-6 section-block" style={{ pageBreakInside: 'avoid' }}>
                              <div className="font-bold text-[12px] mb-2 flex gap-2 items-start">
                                <span className="shrink-0 min-w-[1.2rem]">{idx + 1}.</span>
                                <span className="flex-1">{item.soal}</span>
                                {isEditMode && (
                                  <button 
                                    onClick={() => handleGenerateImage(item.soal, idx, 'essay')}
                                    className="p-1 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition-all no-print shrink-0"
                                    title="Generate Gambar"
                                  >
                                    <ImageIcon size={12} />
                                  </button>
                                )}
                              </div>
                              {item.image && (
                                <div className="my-2 flex justify-center relative group">
                                  <img src={item.image} alt="Ilustrasi Soal" className="max-w-[200px] border border-slate-200 rounded shadow-sm" referrerPolicy="no-referrer" />
                                  {isEditMode && (
                                    <button 
                                      onClick={() => {
                                        const newRes = {...result};
                                        delete newRes.evaluasi.essay[idx].image;
                                        setResult(newRes);
                                      }}
                                      className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X size={10} />
                                    </button>
                                  )}
                                </div>
                              )}
                              <div className="h-24 border border-slate-400 mt-2 mb-2 w-full"></div>
                              {showAnswers && <div className="text-blue-800 text-[11px] font-bold italic bg-blue-50 p-2 rounded">Pedoman Jawaban: {item.kunci}</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 px-2">
                        <div className="section-block">
                          {(activeTab === 'lkpd_individu' || activeTab === 'lkpd_kelompok' || activeTab === 'penugasan') && (
                            <IdentityTable />
                          )}
                          <h2 className="text-center font-bold text-[16px] mb-6 uppercase underline decoration-2">
                            {getAttachmentData()?.judul || getHeaderTitle()}
                          </h2>
                        </div>
                        <div className={activeTab === 'materi' ? "p-2" : "border border-black p-8 min-h-[500px]"} style={activeTab === 'materi' ? { boxSizing: 'border-box' } : { border: '1.5pt solid black', boxSizing: 'border-box' }}>
                          {activeTab === 'instrumen' ? (
                            <table border={1} className="w-full border-collapse border border-black" style={{ border: '1pt solid black', tableLayout: 'fixed', borderSpacing: 0, boxSizing: 'border-box' }}>
                              <thead>
                                <tr className="bg-slate-100 font-bold text-[11px]">
                                  <td className="p-3 border border-black w-32" style={{ border: '1pt solid black' }}>Kriteria Penilaian</td>
                                  <td className="p-3 border border-black" style={{ border: '1pt solid black' }}>Sangat Baik</td>
                                  <td className="p-3 border border-black" style={{ border: '1pt solid black' }}>Baik</td>
                                  <td className="p-3 border border-black" style={{ border: '1pt solid black' }}>Cukup</td>
                                  <td className="p-3 border border-black" style={{ border: '1pt solid black' }}>Perlu Bimbingan</td>
                                </tr>
                              </thead>
                              <tbody>
                                {result.rubrikPenilaian?.map((row, idx) => (
                                  <tr key={idx} className="text-[10px] section-block" style={{ pageBreakInside: 'avoid' }}>
                                    <td className="p-3 border border-black font-bold bg-slate-50" style={{ border: '1pt solid black' }}>{row.kriteria}</td>
                                    <td className="p-3 border border-black" style={{ border: '1pt solid black' }}>{row.sangatBaik}</td>
                                    <td className="p-3 border border-black" style={{ border: '1pt solid black' }}>{row.baik}</td>
                                    <td className="p-3 border border-black" style={{ border: '1pt solid black' }}>{row.cukup}</td>
                                    <td className="p-3 border border-black" style={{ border: '1pt solid black' }}>{row.perluBimbingan}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : activeTab === 'kisi_kisi' ? (
                            <div className="space-y-4">
                              <div className="flex justify-end no-print mb-4">
                                {!isExportingMode && (
                                  <button 
                                    onClick={handleExportPDF} 
                                    disabled={isPdfLoading || !isLibraryReady}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors shadow-md ${
                                      isLibraryReady ? 'bg-cyan-600 text-white hover:bg-cyan-700' : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                    }`}
                                  >
                                    {isPdfLoading || !isLibraryReady ? <Loader2 size={14} className="animate-spin"/> : <Download size={14}/>}
                                    {isPdfLoading ? 'Mengekspor...' : (!isLibraryReady ? 'Menyiapkan...' : 'Unduh Kisi-kisi (PDF)')}
                                  </button>
                                )}
                              </div>
                              <table border={1} className="w-full border-collapse border border-black" style={{ border: '1pt solid black', tableLayout: 'fixed', borderSpacing: 0, boxSizing: 'border-box' }}>
                              <thead>
                                <tr className="bg-slate-100 font-bold text-[11px]">
                                  <td className="p-2 border border-black w-10 text-center" style={{ border: '1pt solid black' }}>No</td>
                                  <td className="p-2 border border-black" style={{ border: '1pt solid black' }}>Materi</td>
                                  <td className="p-2 border border-black" style={{ border: '1pt solid black' }}>Indikator Soal</td>
                                  <td className="p-2 border border-black w-16 text-center" style={{ border: '1pt solid black' }}>Level</td>
                                  <td className="p-2 border border-black w-16 text-center" style={{ border: '1pt solid black' }}>Bloom</td>
                                  <td className="p-2 border border-black w-20 text-center" style={{ border: '1pt solid black' }}>Bentuk</td>
                                </tr>
                              </thead>
                              <tbody>
                                {result.kisiKisi?.map((row, idx) => (
                                  <tr key={idx} className="text-[10px] section-block" style={{ pageBreakInside: 'avoid' }}>
                                    <td className="p-2 border border-black text-center" style={{ border: '1pt solid black' }}>{row.no}</td>
                                    <td className="p-2 border border-black" style={{ border: '1pt solid black' }}>{row.materi}</td>
                                    <td className="p-2 border border-black" style={{ border: '1pt solid black' }}>{row.indikator}</td>
                                    <td className="p-2 border border-black text-center" style={{ border: '1pt solid black' }}>{row.level}</td>
                                    <td className="p-2 border border-black text-center" style={{ border: '1pt solid black' }}>{row.bloom}</td>
                                    <td className="p-2 border border-black text-center" style={{ border: '1pt solid black' }}>{row.bentukSoal}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            </div>
                          ) : activeTab === 'prota' ? (
                            <div className="space-y-4">
                              <div className="flex justify-end no-print mb-4">
                                {!isExportingMode && (
                                  <button 
                                    onClick={handleExportPDF} 
                                    disabled={isPdfLoading || !isLibraryReady}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors shadow-md ${
                                      isLibraryReady ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                    }`}
                                  >
                                    {isPdfLoading || !isLibraryReady ? <Loader2 size={14} className="animate-spin"/> : <Download size={14}/>}
                                    {isPdfLoading ? 'Mengekspor...' : (!isLibraryReady ? 'Menyiapkan...' : 'Unduh Prota (PDF)')}
                                  </button>
                                )}
                              </div>
                              <table border={1} className="w-full border-collapse border border-black" style={{ border: '1pt solid black', tableLayout: 'fixed', borderSpacing: 0, boxSizing: 'border-box' }}>
                              <thead>
                                <tr className="bg-slate-100 font-bold text-[11px]">
                                  <td className="p-3 border border-black w-24 text-center" style={{ border: '1pt solid black' }}>Semester</td>
                                  <td className="p-3 border border-black" style={{ border: '1pt solid black' }}>Materi Pokok / Lingkup Materi</td>
                                  <td className="p-3 border border-black w-32 text-center" style={{ border: '1pt solid black' }}>Alokasi Waktu</td>
                                </tr>
                              </thead>
                              <tbody>
                                {result.prota?.map((row, idx) => (
                                  <tr key={idx} className="text-[11px] section-block" style={{ pageBreakInside: 'avoid' }}>
                                    <td className="p-3 border border-black text-center" style={{ border: '1pt solid black' }}>{row.semester}</td>
                                    <td className="p-3 border border-black" style={{ border: '1pt solid black' }}>{row.materi}</td>
                                    <td className="p-3 border border-black text-center" style={{ border: '1pt solid black' }}>{row.alokasiWaktu}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            </div>
                          ) : activeTab === 'prosem' ? (
                            <div className="space-y-4">
                              <div className="flex justify-end no-print mb-4">
                                {!isExportingMode && (
                                  <button 
                                    onClick={handleExportPDF} 
                                    disabled={isPdfLoading || !isLibraryReady}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors shadow-md ${
                                      isLibraryReady ? 'bg-teal-600 text-white hover:bg-teal-700' : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                    }`}
                                  >
                                    {isPdfLoading || !isLibraryReady ? <Loader2 size={14} className="animate-spin"/> : <Download size={14}/>}
                                    {isPdfLoading ? 'Mengekspor...' : (!isLibraryReady ? 'Menyiapkan...' : 'Unduh Prosem (PDF)')}
                                  </button>
                                )}
                              </div>
                              
                              {result.prosem && (
                                <div className="prosem-export-content">
                                  <div className="text-center font-bold text-lg mb-6 uppercase">PROGRAM SEMESTER (PROSEM)</div>
                                  
                                  <div className="grid grid-cols-2 gap-8 mb-4 text-[11px]">
                                    <div className="space-y-1">
                                      <div className="flex"><span className="w-32">Mata Pelajaran</span><span>: {displaySubject}</span></div>
                                      <div className="flex"><span className="w-32">Kelas</span><span>: {kelas}</span></div>
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex justify-end"><span className="w-32">Semester</span><span className="w-40">: {semester === 'Ganjil' ? 'I (Ganjil)' : 'II (Genap)'}</span></div>
                                      <div className="flex justify-end"><span className="w-32">Tahun Pelajaran</span><span className="w-40">: {tahunAjaran}</span></div>
                                    </div>
                                  </div>

                                  <table className="w-full border-collapse border border-black text-[9px]" style={{ border: '1pt solid black', tableLayout: 'fixed' }}>
                                    <thead>
                                      <tr className="bg-slate-100 font-bold">
                                        <th rowSpan={3} className="border border-black p-1 w-8" style={{ border: '1pt solid black' }}>No</th>
                                        <th rowSpan={3} className="border border-black p-1" style={{ border: '1pt solid black' }}>Kompetensi Dasar / Materi Pokok</th>
                                        <th rowSpan={3} className="border border-black p-1 w-12" style={{ border: '1pt solid black' }}>Alokasi Waktu (JP)</th>
                                        <th colSpan={ (semester === 'Ganjil' ? calendarGanjil : calendarGenap).reduce((acc, m) => acc + m.weeks.length, 0) } className="border border-black p-1 text-center" style={{ border: '1pt solid black' }}>Bulan</th>
                                      </tr>
                                      <tr className="bg-slate-50 font-bold">
                                        {(semester === 'Ganjil' ? calendarGanjil : calendarGenap).map((m, i) => (
                                          <th key={i} colSpan={m.weeks.length} className="border border-black p-1 text-center" style={{ border: '1pt solid black' }}>{m.month}</th>
                                        ))}
                                      </tr>
                                      <tr className="bg-slate-50">
                                        {(semester === 'Ganjil' ? calendarGanjil : calendarGenap).map((m) => 
                                          m.weeks.map((_, i) => (
                                            <th key={i} className="border border-black p-0.5 text-center w-5" style={{ border: '1pt solid black' }}>{i + 1}</th>
                                          ))
                                        )}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {result.prosem.map((row, idx) => (
                                        <tr key={idx} className="section-block" style={{ pageBreakInside: 'avoid' }}>
                                          <td className="border border-black p-1 text-center" style={{ border: '1pt solid black' }}>{idx + 1}</td>
                                          <td className="border border-black p-1" style={{ border: '1pt solid black' }}>{row.materi}</td>
                                          <td className="border border-black p-1 text-center" style={{ border: '1pt solid black' }}>{row.alokasiWaktu}</td>
                                          {(semester === 'Ganjil' ? calendarGanjil : calendarGenap).flatMap(m => m.weeks).map((_, vIdx) => {
                                            const val = row.jadwal[vIdx];
                                            return (
                                              <td key={vIdx} className={`border border-black p-0.5 text-center ${val === 'X' || val === 'V' ? 'bg-slate-400' : ''}`} style={{ border: '1pt solid black' }}>
                                                {val === 'X' || val === 'V' ? '' : val}
                                              </td>
                                            );
                                          })}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>

                                  <div className="mt-12 grid grid-cols-2 text-[11px]">
                                    <div className="text-center">
                                      <p>Mengetahui,</p>
                                      <p>Kepala Sekolah</p>
                                      <div className="h-20"></div>
                                      <p className="font-bold underline uppercase">{namaKepala}</p>
                                      <p>NBM. {nbmKepala}</p>
                                    </div>
                                    <div className="text-center">
                                      <p>{kota}, {tanggal}</p>
                                      <p>Guru Mata Pelajaran</p>
                                      <div className="h-20"></div>
                                      <p className="font-bold underline uppercase">{namaPenyusun}</p>
                                      <p>NBM. {nbmPenyusun}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : activeTab === 'mindmap' ? (
                            <div className="space-y-6 p-4">
                              <div className="flex justify-between items-center no-print mb-4">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                  <Sparkles className="text-purple-600" size={20}/> AI Mindmap Bagan
                                </h3>
                                {!isExportingMode && (
                                  <button 
                                    onClick={handleExportPDF} 
                                    disabled={!isLibraryReady}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors shadow-md ${
                                      isLibraryReady ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                    }`}
                                  >
                                    {isLibraryReady ? <Printer size={14}/> : <Loader2 size={14} className="animate-spin"/>}
                                    {isLibraryReady ? 'Cetak Mindmap' : 'Menyiapkan...'}
                                  </button>
                                )}
                              </div>
                              
                              <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-200 shadow-inner">
                                {result.mindmap ? (
                                  <MindmapNode node={result.mindmap} isExportingMode={isExportingMode} />
                                ) : (
                                  <div className="text-center py-10 text-slate-500 italic">Data mindmap tidak tersedia.</div>
                                )}
                              </div>
                              
                              <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100 text-[11px] text-blue-800 italic">
                                * Klik pada kotak materi untuk membuka atau menutup sub-materi yang berkaitan.
                              </div>
                            </div>
                          ) : (
                            <div className="text-[12px] leading-relaxed">
                              {renderFormattedText(getAttachmentData()?.isi || "Isi sedang dimuat...")}
                            </div>
                          )}
                        </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* REFRESH BUTTON */}
      {!isExportingMode && (
        <button 
          onClick={() => window.location.reload()}
          className="fixed bottom-6 right-6 p-2.5 bg-slate-800 text-white rounded-full shadow-2xl hover:bg-black transition-all active:scale-90 z-[1000] flex items-center justify-center"
          title="Reload Halaman"
        >
          <RefreshCw size={16} />
        </button>
      )}

      {!isExportingMode && (
        <footer className="bg-white border-t border-slate-200 py-6 text-center shadow-inner mt-10">
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center justify-center gap-2">
            WAKA AIK  &copy; {new Date().getFullYear()} • BY.AMINUDIN
          </p>
        </footer>
      )}
    </div>
  );
}
