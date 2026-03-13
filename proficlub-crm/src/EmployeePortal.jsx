import { useState, useEffect } from "react";

// ── SAMPLE DATA ───────────────────────────────────────────────────────────────
const SAMPLE_EMPLOYEES = [
  {
    id: 1, name: "Абдуллаева Зарина", role: "МП", birthDate: "1995-04-12",
    hireDate: "2022-04-10", education: "Тошкент Фармацевтика институти",
    specialty: "Фармация", phone: "+998 90 123 45 67",
    examResults: [
      { trainingId: 1, totalScore: 85, passed: true, date: "2024-03-10", mcScore: 85, openAnswers: [{ q: "Корпоратив этика нима?", a: "Ходимлар ҳуқуқини ҳимоя қилиш." }] },
      { trainingId: 2, totalScore: 92, passed: true, date: "2024-01-25", mcScore: 92, openAnswers: [{ q: "Маҳсулот тавсифи?", a: "Юқори сифатли дори воситалари." }] },
    ]
  },
  {
    id: 2, name: "Азизов Жонибек", role: "Менежер", birthDate: "1990-07-23",
    hireDate: "2021-03-15", education: "ТошДТУ", specialty: "Менежмент",
    phone: "+998 91 234 56 78",
    examResults: [
      { trainingId: 1, totalScore: 75, passed: true, date: "2024-03-10", mcScore: 75, openAnswers: [{ q: "Корпоратив этика нима?", a: "Ишда маданиятли хулқ-атвор." }] },
    ]
  },
  {
    id: 3, name: "Алиев Жамшид", role: "МП", birthDate: "1993-11-05",
    hireDate: "2022-08-01", education: "СамДУ", specialty: "Биология",
    phone: "+998 93 345 67 89",
    examResults: [
      { trainingId: 1, totalScore: 87, passed: true, date: "2024-03-10", mcScore: 87, openAnswers: [] },
      { trainingId: 3, totalScore: 90, passed: true, date: "2023-11-15", mcScore: 90, openAnswers: [] },
    ]
  },
  {
    id: 4, name: "Алимова Феруза", role: "Администратор", birthDate: "1988-02-28",
    hireDate: "2020-06-01", education: "ТошДУ", specialty: "Иқтисодиёт",
    phone: "+998 94 456 78 90",
    examResults: [
      { trainingId: 1, totalScore: 91, passed: true, date: "2024-03-10", mcScore: 91, openAnswers: [] },
      { trainingId: 2, totalScore: 88, passed: true, date: "2024-01-25", mcScore: 88, openAnswers: [] },
      { trainingId: 3, totalScore: 94, passed: true, date: "2023-11-15", mcScore: 94, openAnswers: [] },
    ]
  },
  {
    id: 5, name: "Каримова Дилноза", role: "МП", birthDate: "1997-09-14",
    hireDate: "2023-02-20", education: "АндДУ", specialty: "Фармация",
    phone: "+998 95 567 89 01",
    examResults: [
      { trainingId: 2, totalScore: 79, passed: true, date: "2024-01-25", mcScore: 79, openAnswers: [] },
    ]
  },
];

const SAMPLE_TRAININGS = [
  {
    id: 1, title: "Корпоратив этика ва хулқ-атвор", date: "2024-03-05",
    status: "completed", questions: ["Корпоратив этика нима?", "Можаро вазиятида қандай?"],
    materials: [
      { name: "Корпоратив этика қўлланма.pdf", size: "2.4 МБ", url: "#" },
      { name: "Презентация слайдлар.pptx", size: "5.1 МБ", url: "#" },
    ],
    homework: false,
  },
  {
    id: 2, title: "Маҳсулот билими тренинги", date: "2024-01-20",
    status: "completed", questions: ["Маҳсулот тавсифи?"],
    materials: [
      { name: "Дори воситалари каталоги.pdf", size: "8.7 МБ", url: "#" },
    ],
    homework: false,
  },
  {
    id: 3, title: "Клиник тақдимот кўникмалари", date: "2023-11-10",
    status: "completed", questions: ["Врач билан суҳбатда қандай ёндашув?"],
    materials: [],
    homework: false,
  },
  {
    id: 4, title: "Самарали савдо техникаси", date: "2026-04-15",
    status: "upcoming", questions: [],
    materials: [
      { name: "Дастурий материал.pdf", size: "3.2 МБ", url: "#" },
    ],
    homework: true,
    homeworkDesc: "Ўз ҳудудингиздаги охирги ой савдо натижалари таҳлилини тайёрланг (1-2 бет).",
    homeworkDeadline: "2026-04-10",
  },
  {
    id: 5, title: "Рақамли маркетинг асослари", date: "2026-05-20",
    status: "upcoming", questions: [],
    materials: [],
    homework: false,
  },
];

// ── HELPERS ───────────────────────────────────────────────────────────────────
const ROLE_COLORS = {
  'Менежер':       { bg: '#E8F4FD', text: '#1565C0', dot: '#1976D2' },
  'МП':            { bg: '#E8F5E9', text: '#2E7D32', dot: '#388E3C' },
  'Оператор':      { bg: '#F3E5F5', text: '#6A1B9A', dot: '#8E24AA' },
  'Ҳайдовчи':      { bg: '#FFF3E0', text: '#E65100', dot: '#F57C00' },
  'Таҳлилчи':      { bg: '#E0F2F1', text: '#00695C', dot: '#00897B' },
  'Администратор': { bg: '#FCE4EC', text: '#880E4F', dot: '#C2185B' },
};

const scoreColor = s => s >= 85 ? '#2E7D32' : s >= 70 ? '#F57C00' : '#C62828';
const scoreBg    = s => s >= 85 ? '#E8F5E9' : s >= 70 ? '#FFF8E1' : '#FFEBEE';

function Avatar({ name, size = 44 }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const hue = (name.charCodeAt(0) * 37 + (name.charCodeAt(1) || 0) * 13) % 360;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: `hsl(${hue},52%,52%)`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: size * 0.35, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function Badge({ role }) {
  const c = ROLE_COLORS[role] || { bg: '#f0f0f0', text: '#555', dot: '#999' };
  return (
    <span style={{ background: c.bg, color: c.text, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot }} />{role}
    </span>
  );
}

// ── LOGIN SCREEN ──────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [name, setName]   = useState('');
  const [dob, setDob]     = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleLogin() {
    setError('');
    setLoading(true);
    setTimeout(() => {
    let formattedDob = dob.trim();
    if (/^\d{8}$/.test(formattedDob)) {
        formattedDob = `${formattedDob.slice(4)}-${formattedDob.slice(2,4)}-${formattedDob.slice(0,2)}`;
     }
    const found = SAMPLE_EMPLOYEES.find(
      e => e.name.toLowerCase().trim() === name.toLowerCase().trim() && e.birthDate === formattedDob
     );
      if (found) {
        onLogin(found);
      } else {
        setError('Исм ёки туғилган сана нотўғри. Қайта уриниб кўринг.');
      }
      setLoading(false);
    }, 600);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg, #0D47A1 0%, #1565C0 40%, #1E88E5 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>
      {/* Logo */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 14px', border: '1.5px solid rgba(255,255,255,0.2)' }}>💊</div>
        <div style={{ color: '#fff', fontWeight: 900, fontSize: 22, letterSpacing: 0.5 }}>ПрофиКлуб</div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 }}>Ходим шахсий кабинети</div>
      </div>

      {/* Card */}
      <div style={{ background: '#fff', borderRadius: 20, padding: '28px 24px', width: '100%', maxWidth: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 18, color: '#1A1A2E', fontWeight: 800 }}>Кириш</h2>

        <label style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>Тўлиқ исм-фамилия</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Фамилия Исм"
          style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #E0E0E0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: 14, background: '#FAFAFA' }}
        />

        <label style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>Туғилган сана</label>
        <input
          type="text"
          value={dob}
          onChange={e => setDob(e.target.value)}
          placeholder="12041995"
          style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #E0E0E0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: 20, background: '#FAFAFA' }}
        />

        {error && (
          <div style={{ background: '#FFEBEE', border: '1.5px solid #FFCDD2', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#C62828', fontWeight: 600 }}>
            ⚠️ {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={!name.trim() || !dob || loading}
          style={{ width: '100%', padding: '13px', background: !name.trim() || !dob ? '#E0E0E0' : 'linear-gradient(135deg,#1565C0,#42A5F5)', color: !name.trim() || !dob ? '#aaa' : '#fff', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 15, cursor: !name.trim() || !dob ? 'default' : 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
        >
          {loading ? 'Текширилmoqda...' : 'Кириш →'}
        </button>

        <div style={{ marginTop: 16, padding: '12px 14px', background: '#F0F4FF', borderRadius: 10, fontSize: 12, color: '#1565C0' }}>
          💡 <strong>Намуна:</strong> Абдуллаева Зарина / 1995-04-12
        </div>
      </div>
    </div>
  );
}

// ── BOTTOM NAV ────────────────────────────────────────────────────────────────
function BottomNav({ tab, setTab }) {
  const items = [
    { id: 'home',      icon: '🏠', label: 'Бош саҳифа' },
    { id: 'trainings', icon: '📋', label: 'Тренинглар' },
    { id: 'results',   icon: '📊', label: 'Натижалар' },
    { id: 'profile',   icon: '👤', label: 'Профил' },
  ];
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1.5px solid #EBEBEB', display: 'flex', zIndex: 100, paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {items.map(item => (
        <button key={item.id} onClick={() => setTab(item.id)} style={{ flex: 1, padding: '10px 4px 8px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <span style={{ fontSize: 20 }}>{item.icon}</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: tab === item.id ? '#1976D2' : '#aaa', fontFamily: 'inherit' }}>{item.label}</span>
          {tab === item.id && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#1976D2' }} />}
        </button>
      ))}
    </div>
  );
}

// ── HOME TAB ──────────────────────────────────────────────────────────────────
function HomeTab({ employee, trainings, onNavigate }) {
  const upcoming = trainings.filter(t => t.status === 'upcoming');
  const completed = trainings.filter(t => t.status === 'completed');
  const myResults = employee.examResults || [];
  const avgScore = myResults.length
    ? Math.round(myResults.reduce((a, b) => a + b.totalScore, 0) / myResults.length)
    : null;
  const passCount = myResults.filter(r => r.passed).length;

  const nextTraining = upcoming[0];
  const daysUntil = nextTraining
    ? Math.ceil((new Date(nextTraining.date) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div style={{ padding: '16px 16px 80px' }}>
      {/* Welcome */}
      <div style={{ background: 'linear-gradient(135deg,#1565C0,#42A5F5)', borderRadius: 18, padding: '20px', marginBottom: 16, color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <Avatar name={employee.name} size={50} />
          <div>
            <div style={{ fontWeight: 900, fontSize: 16 }}>{employee.name}</div>
            <Badge role={employee.role} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 900 }}>{avgScore ?? '—'}</div>
            <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>Ўртача балл</div>
          </div>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 900 }}>{passCount}</div>
            <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>Ўтилган тренинг</div>
          </div>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 900 }}>{upcoming.length}</div>
            <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>Келгуси тренинг</div>
          </div>
        </div>
      </div>

      {/* Next training */}
      {nextTraining && (
        <div style={{ background: '#FFF8E1', border: '1.5px solid #FFE082', borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#F57C00', textTransform: 'uppercase', marginBottom: 6 }}>⏰ Навбатдаги тренинг</div>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#1A1A2E', marginBottom: 4 }}>{nextTraining.title}</div>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>{nextTraining.date} · {daysUntil} кун қолди</div>
          {nextTraining.homework && (
            <div style={{ background: '#FFF3E0', borderRadius: 8, padding: '8px 10px', fontSize: 12, color: '#E65100', fontWeight: 600 }}>
              📝 Уй вазифаси: {nextTraining.homeworkDesc}
              <div style={{ fontSize: 11, color: '#F57C00', marginTop: 3 }}>Муддат: {nextTraining.homeworkDeadline}</div>
            </div>
          )}
          <button onClick={() => onNavigate('trainings')} style={{ marginTop: 10, padding: '8px 14px', background: '#1976D2', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Батафсил →</button>
        </div>
      )}

      {/* Recent results */}
      {myResults.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#1A1A2E', marginBottom: 10 }}>Сўнгги натижалар</div>
          {myResults.slice(-3).reverse().map((r, i) => {
            const t = trainings.find(x => x.id === r.trainingId);
            return (
              <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', marginBottom: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 10, borderLeft: `4px solid ${r.passed ? '#388E3C' : '#C62828'}` }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{t?.title || 'Тренинг'}</div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{r.date}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 900, fontSize: 18, color: scoreColor(r.totalScore) }}>{r.totalScore}</div>
                  <div style={{ fontSize: 10, color: r.passed ? '#388E3C' : '#C62828', fontWeight: 700 }}>{r.passed ? '✓ Ўтди' : '✗ Ўтмади'}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── TRAININGS TAB ─────────────────────────────────────────────────────────────
function TrainingsTab({ employee, trainings }) {
  const [selected, setSelected] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? trainings
    : filter === 'upcoming' ? trainings.filter(t => t.status === 'upcoming')
    : trainings.filter(t => t.status === 'completed');

  if (selected) {
    const t = selected;
    const myResult = employee.examResults?.find(r => r.trainingId === t.id);
    const uploaded = uploadedFiles[t.id];

    return (
      <div style={{ padding: '16px 16px 80px' }}>
        <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#1976D2', fontWeight: 700, fontSize: 14, cursor: 'pointer', padding: '0 0 14px', fontFamily: 'inherit' }}>← Орқага</button>

        <div style={{ background: '#fff', borderRadius: 14, padding: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', marginBottom: 14, borderTop: `4px solid ${t.status === 'upcoming' ? '#F57C00' : '#1976D2'}` }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: t.status === 'upcoming' ? '#F57C00' : '#1976D2', textTransform: 'uppercase', marginBottom: 6 }}>
            {t.status === 'upcoming' ? '⏰ Кутилмоқда' : '✅ Ўтказилган'}
          </div>
          <div style={{ fontWeight: 900, fontSize: 17, marginBottom: 4 }}>{t.title}</div>
          <div style={{ fontSize: 12, color: '#888' }}>{t.date}</div>
        </div>

        {/* My result */}
        {myResult && (
          <div style={{ background: myResult.passed ? '#E8F5E9' : '#FFEBEE', borderRadius: 14, padding: '14px 16px', marginBottom: 14, border: `1.5px solid ${myResult.passed ? '#A5D6A7' : '#FFCDD2'}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: myResult.passed ? '#2E7D32' : '#C62828', marginBottom: 8 }}>Менинг натижам</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: scoreColor(myResult.totalScore) }}>{myResult.totalScore}</div>
              <div>
                <div style={{ fontWeight: 700, color: myResult.passed ? '#2E7D32' : '#C62828', fontSize: 14 }}>{myResult.passed ? '✓ Ўтдим' : '✗ Ўтмадим'}</div>
                <div style={{ fontSize: 12, color: '#888' }}>{myResult.date}</div>
              </div>
            </div>
            {myResult.openAnswers?.filter(a => a.a).map((qa, i) => (
              <div key={i} style={{ marginTop: 10, background: 'rgba(255,255,255,0.7)', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontSize: 11, color: '#666', fontWeight: 700, marginBottom: 3 }}>С{i + 1}: {qa.q}</div>
                <div style={{ fontSize: 13 }}>{qa.a}</div>
              </div>
            ))}
          </div>
        )}

        {/* Materials */}
        {t.materials?.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>📎 Тренинг материаллари</div>
            {t.materials.map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < t.materials.length - 1 ? '1px solid #F5F5F5' : 'none' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: '#F0F4FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  {m.name.endsWith('.pdf') ? '📄' : '📊'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{m.size}</div>
                </div>
                <button style={{ padding: '7px 12px', background: '#1976D2', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>⬇ Юклаш</button>
              </div>
            ))}
          </div>
        )}

        {/* Homework */}
        {t.homework && (
          <div style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>📝 Уй вазифаси</div>
            <div style={{ fontSize: 13, color: '#1A1A2E', marginBottom: 6, lineHeight: 1.6 }}>{t.homeworkDesc}</div>
            <div style={{ fontSize: 12, color: '#F57C00', fontWeight: 700, marginBottom: 14 }}>Муддат: {t.homeworkDeadline}</div>
            {uploaded ? (
              <div style={{ background: '#E8F5E9', border: '1.5px solid #A5D6A7', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#2E7D32', fontWeight: 700 }}>
                ✅ Юборилди: {uploaded}
              </div>
            ) : (
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', background: '#F0F4FF', border: '2px dashed #90CAF9', borderRadius: 10, cursor: 'pointer', color: '#1565C0', fontWeight: 700, fontSize: 13 }}>
                <input type="file" style={{ display: 'none' }} onChange={e => {
                  if (e.target.files[0]) setUploadedFiles(p => ({ ...p, [t.id]: e.target.files[0].name }));
                }} />
                📤 Файл юклаш
              </label>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 16px 80px' }}>
      <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 14 }}>Тренинглар</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[['all', 'Барчаси'], ['upcoming', 'Кутилмоқда'], ['completed', 'Ўтказилган']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{ padding: '6px 12px', borderRadius: 20, border: '1.5px solid', borderColor: filter === v ? '#1976D2' : '#E0E0E0', background: filter === v ? '#1976D2' : '#fff', color: filter === v ? '#fff' : '#555', fontWeight: 700, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>{l}</button>
        ))}
      </div>
      {filtered.map(t => {
        const myResult = employee.examResults?.find(r => r.trainingId === t.id);
        return (
          <div key={t.id} onClick={() => setSelected(t)} style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', marginBottom: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer', borderLeft: `4px solid ${t.status === 'upcoming' ? '#F57C00' : '#1976D2'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: t.status === 'upcoming' ? '#F57C00' : '#888', textTransform: 'uppercase', marginBottom: 4 }}>
                  {t.status === 'upcoming' ? '⏰ Кутилмоқда' : '✅ Ўтказилган'} · {t.date}
                </div>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{t.title}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  {t.materials?.length > 0 && <span style={{ fontSize: 10, background: '#F0F4FF', color: '#1565C0', borderRadius: 6, padding: '2px 7px', fontWeight: 700 }}>📎 {t.materials.length} материал</span>}
                  {t.homework && <span style={{ fontSize: 10, background: '#FFF3E0', color: '#E65100', borderRadius: 6, padding: '2px 7px', fontWeight: 700 }}>📝 Уй вазифаси</span>}
                </div>
              </div>
              {myResult && (
                <div style={{ textAlign: 'right', marginLeft: 10 }}>
                  <div style={{ fontWeight: 900, fontSize: 20, color: scoreColor(myResult.totalScore) }}>{myResult.totalScore}</div>
                  <div style={{ fontSize: 10, color: myResult.passed ? '#388E3C' : '#C62828', fontWeight: 700 }}>{myResult.passed ? '✓ Ўтди' : '✗ Ўтмади'}</div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── RESULTS TAB ───────────────────────────────────────────────────────────────
function ResultsTab({ employee, trainings }) {
  const results = employee.examResults || [];
  const avg = results.length ? Math.round(results.reduce((a, b) => a + b.totalScore, 0) / results.length) : null;
  const passed = results.filter(r => r.passed).length;

  return (
    <div style={{ padding: '16px 16px 80px' }}>
      <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 14 }}>Натижаларим</div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'Ўртача балл', value: avg ?? '—', color: avg ? scoreColor(avg) : '#aaa' },
          { label: 'Ўтилди', value: passed, color: '#2E7D32' },
          { label: 'Жами', value: results.length, color: '#1565C0' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '12px 10px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: '#888', fontWeight: 700, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {results.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
          <div>Ҳали натижа йўқ</div>
        </div>
      ) : (
        [...results].reverse().map((r, i) => {
          const t = trainings.find(x => x.id === r.trainingId);
          return (
            <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', marginBottom: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderLeft: `4px solid ${r.passed ? '#388E3C' : '#C62828'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>{t?.title || 'Тренинг'}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{r.date}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 900, fontSize: 24, color: scoreColor(r.totalScore) }}>{r.totalScore}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: r.passed ? '#388E3C' : '#C62828' }}>{r.passed ? '✓ Ўтди' : '✗ Ўтмади'}</div>
                </div>
              </div>
              {/* Score bar */}
              <div style={{ marginTop: 10, height: 6, background: '#F0F0F0', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${r.totalScore}%`, height: '100%', background: scoreColor(r.totalScore), borderRadius: 3, transition: 'width 0.5s' }} />
              </div>
              {r.openAnswers?.filter(a => a.a).length > 0 && (
                <div style={{ marginTop: 10 }}>
                  {r.openAnswers.filter(a => a.a).map((qa, qi) => (
                    <div key={qi} style={{ background: '#FAFAFA', borderRadius: 8, padding: '8px 10px', marginTop: 6 }}>
                      <div style={{ fontSize: 11, color: '#888', fontWeight: 700, marginBottom: 2 }}>С{qi + 1}: {qa.q}</div>
                      <div style={{ fontSize: 13, color: '#1A1A2E' }}>{qa.a}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

// ── PROFILE TAB ───────────────────────────────────────────────────────────────
function ProfileTab({ employee, onLogout }) {
  const fields = [
    { label: 'Лавозим', value: employee.role },
    { label: 'Иш бошлаган сана', value: employee.hireDate },
    { label: 'Таълим муассасаси', value: employee.education },
    { label: 'Мутахассислик', value: employee.specialty },
    { label: 'Телефон', value: employee.phone },
  ].filter(f => f.value);

  return (
    <div style={{ padding: '16px 16px 80px' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#1565C0,#42A5F5)', borderRadius: 18, padding: '20px 16px', marginBottom: 16, textAlign: 'center', color: '#fff' }}>
        <Avatar name={employee.name} size={64} />
        <div style={{ fontWeight: 900, fontSize: 18, marginTop: 10 }}>{employee.name}</div>
        <div style={{ marginTop: 6 }}><Badge role={employee.role} /></div>
      </div>

      {/* Info */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '4px 0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: 14 }}>
        {fields.map((f, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '13px 16px', borderBottom: i < fields.length - 1 ? '1px solid #F5F5F5' : 'none' }}>
            <span style={{ fontSize: 13, color: '#888', fontWeight: 600 }}>{f.label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E', textAlign: 'right', maxWidth: '60%' }}>{f.value}</span>
          </div>
        ))}
      </div>

      <button onClick={onLogout} style={{ width: '100%', padding: '13px', background: '#FFEBEE', color: '#C62828', border: '1.5px solid #FFCDD2', borderRadius: 12, fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
        Чиқиш →
      </button>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function EmployeePortal() {
  const [employee, setEmployee] = useState(null);
  const [tab, setTab] = useState('home');

  function handleNavigate(t) { setTab(t); }

  if (!employee) {
    return <LoginScreen onLogin={emp => { setEmployee(emp); setTab('home'); }} />;
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#F5F7FA', fontFamily: "'Segoe UI', Tahoma, sans-serif", color: '#1A1A2E', position: 'relative' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1.5px solid #EBEBEB', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg,#1565C0,#42A5F5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>💊</div>
        <div style={{ fontWeight: 800, fontSize: 14 }}>ПрофиКлуб</div>
        <div style={{ marginLeft: 'auto' }}><Avatar name={employee.name} size={30} /></div>
      </div>

      {/* Content */}
      {tab === 'home'      && <HomeTab employee={employee} trainings={SAMPLE_TRAININGS} onNavigate={handleNavigate} />}
      {tab === 'trainings' && <TrainingsTab employee={employee} trainings={SAMPLE_TRAININGS} />}
      {tab === 'results'   && <ResultsTab employee={employee} trainings={SAMPLE_TRAININGS} />}
      {tab === 'profile'   && <ProfileTab employee={employee} onLogout={() => setEmployee(null)} />}

      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}
