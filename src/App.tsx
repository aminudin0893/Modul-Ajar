import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Loader2, Download, Settings2, Image as ImageIcon, 
  MapPin, Calendar, School, UserCheck, AlertTriangle, RefreshCw,
  Maximize2, FileText, Layout, Users, User, ClipboardList, PenTool, FileType, Eye, EyeOff, Copy,
  CheckCircle2, Printer, Upload
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

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
    pilgan: Array<{ soal: string; a: string; b: string; c: string; d: string; kunci: string }>;
    essay: Array<{ soal: string; kunci: string }>;
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
  const [showAnswers, setShowAnswers] = useState(false); 
  const [result, setResult] = useState<ResultData | null>(null);
  const [error, setError] = useState('');
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [userApiKey, setUserApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) setUserApiKey(savedKey);
  }, []);

  const saveApiKey = (key: string) => {
    setUserApiKey(key);
    localStorage.setItem('gemini_api_key', key);
  };

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

  useEffect(() => {
    const scripts = [
      { id: 'html2pdf-script', src: 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js' },
      { id: 'html2canvas-script', src: 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js' }
    ];
    scripts.forEach(s => {
      if (!document.getElementById(s.id)) {
        const script = document.createElement('script');
        script.id = s.id;
        script.src = s.src;
        script.async = true;
        document.body.appendChild(script);
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
    if (!topic.trim()) { setError('Mohon masukkan judul materi.'); return; }
    setIsLoading(true); 
    setError('');
    
    const apiKeyToUse = userApiKey || process.env.GEMINI_API_KEY || "";
    if (!apiKeyToUse) {
      setError("Kode aplikasi tidak ditemukan. Silakan masukkan kode pembelian anda di panel pengaturan.");
      setIsLoading(false);
      return;
    }

    const ai = new GoogleGenAI({ apiKey: apiKeyToUse });

    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Buat RPP MENDALAM Profesional Kurikulum Merdeka Fase D (SMP) untuk ${kelas}, materi: "${topic}", Mata Pelajaran: ${displaySubject}. 
        WAJIB:
        1. Gunakan Bahasa Indonesia formal yang sangat baik.
        2. Pastikan bagian "Target Peserta Didik" (identifikasi.pesertaDidik) secara eksplisit menyebutkan "${kelas}".
        3. LKPD Mandiri, LKPD Kelompok, dan Penugasan harus terisi dengan instruksi kerja atau butir pertanyaan yang sangat lengkap, sistematis, dan mendalam.
        4. PENTING: Untuk LKPD dan Penugasan, setiap butir instruksi/pertanyaan HARUS dipisahkan dengan baris baru (newline \\n) agar membentuk daftar yang rapi. Jangan menggabungkan beberapa nomor dalam satu paragraf.
        5. Tambahkan bagian "materiLengkap" yang berisi penjelasan konsep secara runtut, komunikatif, dan mendalam. Materi WAJIB dipecah menjadi beberapa sub-bab yang sistematis. Gunakan format paragraf standar dengan spasi antar paragraf yang jelas (gunakan double newline \\n\\n untuk antar paragraf).
        ${(displaySubject.toLowerCase().includes('al-islam') || displaySubject.toLowerCase().includes('agama islam')) ? 
          `KHUSUS untuk mata pelajaran ${displaySubject}, struktur "materiLengkap" HARUS mencakup: 
          - Pengertian
          - Dalil (Wajib mencakup ayat Al-Qur'an dan Hadits yang relevan, sertakan teks Arab asli beserta terjemahannya)
          - Hukum (jika ada kaitannya dengan materi)
          - Hikmah.
          Pastikan setiap sub-bab ini diisi secara lengkap, mendalam, dan bebas dari kesalahan pengetikan (typo).` : 
          `Untuk mata pelajaran ${displaySubject}, sesuaikan struktur "materiLengkap" agar mencakup konsep-konsep kunci secara lengkap, sistematis, mendalam, dan bebas dari kesalahan pengetikan (typo).`
        }
        6. Evaluasi: 10 Pilihan Ganda (A-D) dan 5 Essay berbobot tinggi.
        7. Integrasikan nilai-nilai keislaman dan kemuhammadiyahan dalam bagian Kurikulum Berbasis Cinta (KBC).
        Jawab dalam format JSON murni sesuai schema.`,
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
                    items: { type: Type.OBJECT, properties: { soal: { type: Type.STRING }, a: { type: Type.STRING }, b: { type: Type.STRING }, c: { type: Type.STRING }, d: { type: Type.STRING }, kunci: { type: Type.STRING } } }
                  },
                  essay: {
                    type: Type.ARRAY,
                    items: { type: Type.OBJECT, properties: { soal: { type: Type.STRING }, kunci: { type: Type.STRING } } }
                  }
                }
              }
            },
            required: ["identifikasi", "kurikulumCinta", "desainPembelajaran", "pengalamanBelajar", "asesmen", "materiLengkap", "lkpdIndividu", "lkpdKelompok", "penugasanIndividu", "rubrikPenilaian", "evaluasi"]
          }
        }
      });

      if (response.text) {
        setResult(JSON.parse(response.text));
        setActiveTab('rpp'); 
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
    setIsPdfLoading(true); 
    setIsExportingMode(true);
    
    const paperDim = paperFormat === 'a4' ? 'a4' : [210, 330];
    
    setTimeout(() => {
      const element = exportAreaRef.current;
      if (!element) return;
      
      const opt = {
        margin: [10, 10, 10, 10], // Margin 1cm keliling
        filename: `MODUL_${activeTab.toUpperCase()}_${topic.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 3, 
          useCORS: true, 
          logging: false,
          letterRendering: true,
          width: 718,
          windowWidth: 718,
          x: 0,
          y: 0,
          scrollX: 0,
          scrollY: 0,
        },
        jsPDF: { unit: 'mm', format: paperDim, orientation: 'portrait', compress: true },
        pagebreak: { mode: ['css', 'legacy'], avoid: ['tr', '.header-bg', '.section-block'] }
      };
      
      // @ts-ignore
      window.html2pdf().set(opt).from(element).save().then(() => {
        setIsPdfLoading(false); 
        setIsExportingMode(false);
      }).catch((err: any) => {
        console.error("PDF Export Error:", err);
        setIsPdfLoading(false);
        setIsExportingMode(false);
      });
    }, 800);
  };

  const handleExportImage = () => {
    // @ts-ignore
    if (!result || !window.html2canvas) return;
    setIsExportingMode(true);
    setTimeout(() => {
      const element = exportAreaRef.current;
      if (!element) return;
      // @ts-ignore
      window.html2canvas(element, { 
        scale: 4, 
        useCORS: true, 
        allowTaint: true,
        backgroundColor: '#ffffff',
        windowWidth: 1200,
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
        link.download = `IMG_${activeTab.toUpperCase()}_${topic.replace(/\s+/g, '_')}.jpg`;
        link.href = canvas.toDataURL("image/jpeg", 0.95);
        link.click();
        setIsExportingMode(false);
      });
    }, 500);
  };

  const exportToWord = (ext: string) => {
    if (!result || !exportAreaRef.current) return;
    const fileName = `RPP_${activeTab.toUpperCase()}_${topic.replace(/\s+/g, '_')}.${ext}`;
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><style>@page { margin: 2.0cm; } body { font-family: 'Times New Roman', serif; font-size: 11pt; } table { border-collapse: collapse; width: 100%; border: 1pt solid black; } th, td { border: 1pt solid black; padding: 8pt; vertical-align: top; } .header-bg { background-color: #b4c7e7; text-align: center; font-weight: bold; }</style></head><body>`;
    const footer = "</body></html>";
    const contentHtml = exportAreaRef.current.innerHTML;
    const blob = new Blob(['\ufeff', header + contentHtml + footer], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = fileName; link.click();
  };

  const getHeaderTitle = () => {
    switch(activeTab) {
      case 'rpp': return 'RENCANA PELAKSANAAN PEMBELAJARAN';
      case 'materi': return 'RINGKASAN MATERI PEMBELAJARAN';
      case 'lkpd_individu': return 'LEMBAR KERJA PESERTA DIDIK (MANDIRI)';
      case 'lkpd_kelompok': return 'LEMBAR KERJA PESERTA DIDIK (KELOMPOK)';
      case 'penugasan': return 'LEMBAR PENUGASAN TERSTRUKTUR';
      case 'instrumen': return 'RUBRIK KRITERIA & INSTRUMEN PENILAIAN';
      case 'evaluasi': return 'LEMBAR EVALUASI PEMBELAJARAN';
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
            <div className="relative flex items-center justify-between bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-200">
               {/* UPDATE INDICATOR */}
               <div className="absolute top-2 right-4 text-[9px] font-black text-slate-300 uppercase tracking-tighter">
                 Update 06.03.26
               </div>
               <div className="flex items-center gap-3">
                 <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md border border-slate-100 overflow-hidden p-1">
                    {logoBase64 ? (
                      <img src={logoBase64} alt="Logo" className="w-full h-full object-contain" crossOrigin="anonymous" />
                    ) : (
                      <School size={24} className="text-slate-300" />
                    )}
                 </div>
                 <div>
                   <h1 className="text-xl font-black text-slate-800 tracking-tight">WAKA AIK SMPMUSAPRO</h1>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SMP MUHAMMADIYAH 1 PROBOLINGGO</p>
                 </div>
               </div>
               <div className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-500">
                  <div className="flex items-center gap-1"><CheckCircle2 size={14} className="text-emerald-500" /> Kurikulum Merdeka</div>
                  <div className="flex items-center gap-1"><CheckCircle2 size={14} className="text-emerald-500" /> KBC Integrated</div>
               </div>
            </div>
          )}

          {/* CONTROL PANEL */}
          {!isExportingMode && (
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
                    <div className="space-y-1 pt-2">
                       <label className="text-[10px] font-black text-blue-600 uppercase ml-1">Judul Materi (Topic)</label>
                       <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="Contoh: Meneladani Asmaul Husna..." className="w-full p-3 border-2 border-blue-200 rounded-xl font-black text-lg focus:border-blue-500 focus:ring-0 transition-all bg-white" />
                    </div>

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
                  <button onClick={() => handleGenerate()} disabled={isLoading} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-black transition-all shadow-lg active:scale-[0.98] disabled:opacity-50">
                    {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles className="text-yellow-400" />} BUAT MODUL LENGKAP
                  </button>
                  {error && <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-center gap-2"><AlertTriangle size={14}/> {error}</div>}
                </div>
              </div>
            </div>
          )}

          {/* TAB NAVIGATION */}
          {result && !isExportingMode && (
            <div className="flex flex-wrap gap-2 justify-center bg-white p-3 rounded-2xl shadow-lg border border-slate-200 sticky top-4 z-50">
              <button onClick={() => setActiveTab('rpp')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all ${activeTab === 'rpp' ? 'bg-blue-600 text-white shadow-lg scale-105' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}><Layout size={12}/> Modul Utama</button>
              <button onClick={() => setActiveTab('materi')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all ${activeTab === 'materi' ? 'bg-amber-600 text-white shadow-lg scale-105' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}><ClipboardList size={12}/> Materi</button>
              <button onClick={() => setActiveTab('lkpd_individu')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all ${activeTab === 'lkpd_individu' ? 'bg-emerald-600 text-white shadow-lg scale-105' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}><User size={12}/> LKPD</button>
              <button onClick={() => setActiveTab('penugasan')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all ${activeTab === 'penugasan' ? 'bg-pink-600 text-white shadow-lg scale-105' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}><PenTool size={12}/> Tugas</button>
              <button onClick={() => setActiveTab('instrumen')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all ${activeTab === 'instrumen' ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}><ClipboardList size={12}/> Rubrik</button>
              <button onClick={() => setActiveTab('evaluasi')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all ${activeTab === 'evaluasi' ? 'bg-orange-600 text-white shadow-lg scale-105' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}><FileText size={12}/> Evaluasi</button>
              
              <div className="h-8 w-px bg-slate-200 mx-2 hidden lg:block"></div>
              
              <div className="flex gap-1">
                <button onClick={handleExportPDF} disabled={isPdfLoading} className="bg-red-600 text-white px-3 py-2 rounded-xl text-[10px] font-bold flex items-center gap-1 hover:bg-red-700 transition-all disabled:opacity-50">
                  {isPdfLoading ? <Loader2 size={12} className="animate-spin"/> : <Download size={12}/>} PDF
                </button>
                <button onClick={() => exportToWord('doc')} className="bg-slate-800 text-white px-3 py-2 rounded-xl text-[10px] font-bold flex items-center gap-1 hover:bg-black transition-all"><FileType size={12}/> Word</button>
                <button onClick={handleExportImage} className="bg-emerald-600 text-white px-3 py-2 rounded-xl text-[10px] font-bold flex items-center gap-1 hover:bg-emerald-700 transition-all"><ImageIcon size={12}/> JPG</button>
              </div>

              {activeTab === 'evaluasi' && (
                <button onClick={() => setShowAnswers(!showAnswers)} className={`ml-2 px-3 py-2 rounded-xl text-[10px] font-bold flex items-center gap-1 border transition-all ${showAnswers ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-slate-100 text-slate-500 border-slate-300'}`}>
                  {showAnswers ? <EyeOff size={12}/> : <Eye size={12}/>} {showAnswers ? 'Guru View' : 'Siswa View'}
                </button>
              )}
            </div>
          )}

          {/* PREVIEW AREA */}
          {result && (
            <div ref={exportAreaRef}
                 id="export-area"
                 className={`bg-white text-black font-serif transition-all ${isExportingMode ? 'p-0 shadow-none border-none' : 'p-10 shadow-2xl border border-slate-300 mb-20'}`} 
                 style={{ 
                   width: isExportingMode ? '190mm' : 'auto', 
                   maxWidth: isExportingMode ? '190mm' : '210mm',
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
                              <div className="font-bold text-[12px] mb-1 flex gap-2">
                                <span className="shrink-0 min-w-[1.2rem]">{idx + 1}.</span>
                                <span>{item.soal}</span>
                              </div>
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
                              <div className="font-bold text-[12px] mb-2 flex gap-2">
                                <span className="shrink-0 min-w-[1.2rem]">{idx + 1}.</span>
                                <span>{item.soal}</span>
                              </div>
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
