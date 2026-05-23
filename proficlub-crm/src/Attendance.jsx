import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'

function levenshtein(a, b) {
  a = a.toLowerCase().replace(/\s+/g, '')
  b = b.toLowerCase().replace(/\s+/g, '')
  const m = a.length, n = b.length
  const dp = Array.from({length: m+1}, (_, i) => Array.from({length: n+1}, (_, j) => i === 0 ? j : j === 0 ? i : 0))
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j-1], dp[i-1][j], dp[i][j-1])
  return dp[m][n]
}

function similarity(a, b) {
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 1
  return (maxLen - levenshtein(a, b)) / maxLen
}

// Shahar nomlarini normalize qilish (lotin↔kirill)
const CITY_MAP = {
  'toshkent': 'Тошкент', 'tashkent': 'Тошкент', 'ташкент': 'Тошкент',
  'samarqand': 'Самарқанд', 'samarkand': 'Самарқанд', 'самарқанд': 'Самарқанд', 'самарканд': 'Самарқанд',
  'buxoro': 'Бухоро', 'bukhara': 'Бухоро', 'бухоро': 'Бухоро',
  'namangan': 'Наманган', 'наманган': 'Наманган',
  'andijon': 'Андижон', 'andijan': 'Андижон', 'андижон': 'Андижон',
  'fargona': 'Фарғона', 'fergana': 'Фарғона', 'фаргона': 'Фарғона', 'фарғона': 'Фарғона',
  'qarshi': 'Қарши', 'karshi': 'Қарши', 'қарши': 'Қарши',
  'termiz': 'Термиз', 'термиз': 'Термиз',
  'nukus': 'Нукус', 'нукус': 'Нукус',
  'navoiy': 'Навоий', 'navoi': 'Навоий', 'навоий': 'Навоий',
  'jizzax': 'Жиззах', 'джизак': 'Жиззах', 'жиззах': 'Жиззах',
  'guliston': 'Гулистон', 'гулистон': 'Гулистон',
  'urganch': 'Урганч', 'urgench': 'Урганч', 'урганч': 'Урганч',
}

function normalizeCity(input) {
  const clean = input.toLowerCase().trim().replace(/\s+/g, '')
  if (CITY_MAP[clean]) return CITY_MAP[clean]
  // Fuzzy match against all known cities
  let best = null, bestScore = 0
  for (const [key, val] of Object.entries(CITY_MAP)) {
    const score = similarity(clean, key)
    if (score > bestScore) { bestScore = score; best = val }
  }
  if (bestScore >= 0.6) return best
  // Capitalize first letter as fallback
  return input.trim().charAt(0).toUpperCase() + input.trim().slice(1)
}

const PAGE = {
  minHeight: '100vh',
  background: 'linear-gradient(160deg, #1B5E20 0%, #2E7D32 60%, #66BB6A 100%)',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  padding: '20px 12px 40px',
  fontFamily: "'Segoe UI', Tahoma, sans-serif",
  boxSizing: 'border-box',
}

const CARD = {
  background: '#fff',
  borderRadius: 20,
  padding: '24px 20px',
  width: '100%',
  maxWidth: 420,
  boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
  boxSizing: 'border-box',
  marginTop: 16,
}

const INPUT = {
  width: '100%',
  padding: '16px',
  border: '2px solid #E0E0E0',
  borderRadius: 14,
  fontSize: 28,
  fontWeight: 800,
  fontFamily: 'inherit',
  outline: 'none',
  background: '#FAFAFA',
  boxSizing: 'border-box',
  color: '#1A1A2E',
  textAlign: 'center',
  letterSpacing: 8,
  WebkitAppearance: 'none',
}

const INPUT_CITY = {
  width: '100%',
  padding: '14px 16px',
  border: '2px solid #E0E0E0',
  borderRadius: 14,
  fontSize: 18,
  fontFamily: 'inherit',
  outline: 'none',
  background: '#FAFAFA',
  boxSizing: 'border-box',
  color: '#1A1A2E',
  textAlign: 'center',
  WebkitAppearance: 'none',
}

const BTN = (bg, disabled) => ({
  width: '100%',
  padding: '16px',
  background: disabled ? '#E0E0E0' : bg,
  color: disabled ? '#aaa' : '#fff',
  border: 'none',
  borderRadius: 14,
  fontWeight: 700,
  fontSize: 16,
  cursor: disabled ? 'not-allowed' : 'pointer',
  marginTop: 16,
  fontFamily: 'inherit',
  WebkitTapHighlightColor: 'transparent',
  touchAction: 'manipulation',
})

export default function Attendance() {
  const path = window.location.pathname
  const parts = path.split('/')
  const type = parts[2] // 'training' or 'praktikum'
  const entityId = parts[3]

  const [entity, setEntity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(1) // 1=city(training only), 2=id, 3=confirm, 4=done, 5=error
  const [cityInput, setCityInput] = useState('')
  const [detectedCity, setDetectedCity] = useState('')
  const [confirmCity, setConfirmCity] = useState(false)
  const [idInput, setIdInput] = useState('')
  const [employee, setEmployee] = useState(null)
  const [session, setSession] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [alreadyMarked, setAlreadyMarked] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        if (type === 'training') {
          const { data, error } = await supabase
            .from('trainings')
            .select('*')
            .eq('id', entityId)
            .single()
          if (error) throw error
          setEntity(data)
          setStep(1) // first ask city
        } else if (type === 'praktikum') {
          const { data, error } = await supabase
            .from('praktikum')
            .select('*')
            .eq('id', entityId)
            .single()
          if (error) throw error
          setEntity(data)
          setStep(2) // skip city step
        }
      } catch(e) {
        setStep(5)
        setError('Маълумот топилмади: ' + e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [type, entityId])

  async function handleCitySubmit() {
    if (!cityInput.trim()) return
    const normalized = normalizeCity(cityInput)
    setDetectedCity(normalized)
    // Check if session exists for this city
    const { data: sessions } = await supabase
      .from('sessions')
      .select('*')
      .eq('training_id', entityId)
    const found = sessions?.find(s => 
      similarity(
        s.city.toLowerCase().replace(/\s+/g,''),
        normalized.toLowerCase().replace(/\s+/g,'')
      ) >= 0.7
    )
    if (found) {
      setSession(found)
      setConfirmCity(true)
    } else {
      // No matching session found, show detected city and confirm
      setConfirmCity(true)
    }
  }

  async function handleIdSubmit() {
    if (idInput.length !== 3) return
    setError('')
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('emp_id', idInput)
        .single()
      if (error || !data) {
        setError(`${idInput} ID ли ходим топилмади. Қайта текширинг.`)
        return
      }
      setEmployee(data)
      setStep(3)
    } catch(e) {
      setError('Хатолик: ' + e.message)
    }
  }

  async function handleConfirm() {
    setSaving(true)
    setError('')
    try {
      if (type === 'training') {
        // Find or create session for this city
        let sessionId = session?.id
        if (!sessionId) {
          const { data: newSession, error: sErr } = await supabase
            .from('sessions')
            .insert({ training_id: entityId, city: detectedCity, date: new Date().toISOString().split('T')[0], trainer: '' })
            .select().single()
          if (sErr) throw sErr
          sessionId = newSession.id
        }
        // Check already marked
        const { data: existing } = await supabase
          .from('session_participants')
          .select('id')
          .eq('session_id', sessionId)
          .eq('employee_id', employee.id)
          .single()
        if (existing) {
          setAlreadyMarked(true)
          setStep(4)
          return
        }
        // Add to session_participants
        const { error: pErr } = await supabase
          .from('session_participants')
          .insert({ session_id: sessionId, employee_id: employee.id, score: null, passed: null, open_answers: [] })
        if (pErr) throw pErr
      } else {
        // Praktikum attendance
        const { data: existing } = await supabase
          .from('praktikum_participants')
          .select('id')
          .eq('praktikum_id', entityId)
          .eq('employee_id', employee.id)
          .single()
        if (existing) {
          setAlreadyMarked(true)
          setStep(4)
          return
        }
        const { error: pErr } = await supabase
          .from('praktikum_participants')
          .insert({ praktikum_id: entityId, employee_id: employee.id, star: false })
        if (pErr) throw pErr
      }
      setStep(4)
    } catch(e) {
      setError('Хатолик: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div style={{ ...PAGE, alignItems: 'center' }}>
      <div style={{ color: '#fff', fontSize: 18, fontFamily: 'inherit' }}>⏳ Юкланмоқда...</div>
    </div>
  )

  if (step === 5) return (
    <div style={{ ...PAGE, alignItems: 'center' }}>
      <div style={{ ...CARD, textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>❌</div>
        <h2 style={{ margin: '0 0 10px', fontSize: 20, fontWeight: 900, color: '#C62828' }}>Хатолик</h2>
        <p style={{ color: '#555', fontSize: 14 }}>{error}</p>
      </div>
    </div>
  )

  // Step 1 — City input (training only)
  if (step === 1) return (
    <div style={{ ...PAGE, alignItems: 'center' }}>
      <div style={CARD}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg,#1B5E20,#66BB6A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 12px' }}>📋</div>
          <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 900, color: '#1A1A2E' }}>{entity?.title}</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#888' }}>{entity?.date}</p>
        </div>

        {!confirmCity ? (
          <>
            <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 900, color: '#1A1A2E', textAlign: 'center' }}>Сиз қайси шаҳардасиз?</h2>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#888', textAlign: 'center' }}>Шаҳар номини ёзинг (исталган ҳарфда)</p>
            <input
              value={cityInput}
              onChange={e => setCityInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCitySubmit()}
              placeholder="Масалан: Toshkent"
              style={{ ...INPUT_CITY }}
              autoFocus
            />
            <button onClick={handleCitySubmit} disabled={!cityInput.trim()}
              style={BTN('linear-gradient(135deg,#1B5E20,#4CAF50)', !cityInput.trim())}>
              Давом этиш →
            </button>
          </>
        ) : (
          <>
            <h2 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 900, color: '#1A1A2E', textAlign: 'center' }}>
              Сиз шу шаҳарданмисиз?
            </h2>
            <div style={{ background: '#E8F5E9', border: '2px solid #A5D6A7', borderRadius: 14, padding: '20px', textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#1B5E20' }}>{detectedCity}</div>
              {session && <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>✓ Тизимда топилди</div>}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setStep(2) }}
                style={{ ...BTN('linear-gradient(135deg,#1B5E20,#4CAF50)', false), marginTop: 0, flex: 1 }}>
                ✅ Ҳа, тўғри
              </button>
              <button onClick={() => { setConfirmCity(false); setCityInput(''); setSession(null) }}
                style={{ flex: 1, padding: '16px', background: '#FFEBEE', color: '#C62828', border: '1.5px solid #FFCDD2', borderRadius: 14, fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', WebkitTapHighlightColor: 'transparent' }}>
                ❌ Йўқ
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )

  // Step 2 — ID input
  if (step === 2) return (
    <div style={{ ...PAGE, alignItems: 'center' }}>
      <div style={CARD}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: type === 'training' ? 'linear-gradient(135deg,#1B5E20,#66BB6A)' : 'linear-gradient(135deg,#F59E0B,#FCD34D)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 12px' }}>
            {type === 'training' ? '📋' : '⭐'}
          </div>
          <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 900, color: '#1A1A2E' }}>{entity?.title}</h1>
          {type === 'training' && detectedCity && (
            <div style={{ background: '#E8F5E9', borderRadius: 8, padding: '4px 12px', display: 'inline-block', marginTop: 4 }}>
              <span style={{ fontSize: 13, color: '#1B5E20', fontWeight: 700 }}>📍 {detectedCity}</span>
            </div>
          )}
        </div>

        <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 900, color: '#1A1A2E', textAlign: 'center' }}>ID рақамингизни киритинг</h2>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#888', textAlign: 'center' }}>3 та рақамли ID (масалан: 042)</p>

        <input
          value={idInput}
          onChange={e => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 3)
            setIdInput(val)
            setError('')
          }}
          onKeyDown={e => e.key === 'Enter' && idInput.length === 3 && handleIdSubmit()}
          placeholder="000"
          style={INPUT}
          inputMode="numeric"
          maxLength={3}
          autoFocus
        />

        {error && (
          <div style={{ background: '#FFEBEE', border: '1.5px solid #FFCDD2', borderRadius: 12, padding: '12px 16px', fontSize: 14, color: '#C62828', marginTop: 12, textAlign: 'center' }}>
            ⚠️ {error}
          </div>
        )}

        <button onClick={handleIdSubmit} disabled={idInput.length !== 3}
          style={BTN(type === 'training' ? 'linear-gradient(135deg,#1B5E20,#4CAF50)' : 'linear-gradient(135deg,#F59E0B,#FCD34D)', idInput.length !== 3)}>
          Текшириш →
        </button>

        {type === 'training' && (
          <button onClick={() => { setStep(1); setConfirmCity(false); setCityInput(''); setSession(null) }}
            style={{ width: '100%', padding: '12px', background: 'none', border: 'none', color: '#888', fontSize: 13, cursor: 'pointer', marginTop: 8, fontFamily: 'inherit' }}>
            ← Шаҳарни ўзгартириш
          </button>
        )}
      </div>
    </div>
  )

  // Step 3 — Confirm employee
  if (step === 3) return (
    <div style={{ ...PAGE, alignItems: 'center' }}>
      <div style={CARD}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 900, color: '#1A1A2E' }}>Маълумотларни тасдиқланг</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#888' }}>Сизми?</p>
        </div>

        <div style={{ background: '#F8F9FA', borderRadius: 16, padding: '20px', marginBottom: 16, textAlign: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg,#1565C0,#42A5F5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 auto 12px' }}>
            {employee?.name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#1A1A2E', marginBottom: 4 }}>{employee?.name}</div>
          <div style={{ fontSize: 14, color: '#888' }}>{employee?.role}</div>
          {employee?.data?.organization && (
            <div style={{ fontSize: 13, color: '#1565C0', fontWeight: 700, marginTop: 4 }}>{employee?.data?.organization}</div>
          )}
          <div style={{ fontSize: 28, fontWeight: 900, color: '#bbb', marginTop: 8, letterSpacing: 4 }}>#{employee?.emp_id}</div>
        </div>

        <div style={{ background: type === 'training' ? '#E8F5E9' : '#FFFBEB', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 13 }}>
          <div style={{ fontWeight: 700, color: type === 'training' ? '#1B5E20' : '#92400E' }}>
            {type === 'training' ? '📋' : '⭐'} {entity?.title}
          </div>
          {type === 'training' && detectedCity && (
            <div style={{ color: '#555', marginTop: 2 }}>📍 {detectedCity}</div>
          )}
        </div>

        {error && (
          <div style={{ background: '#FFEBEE', borderRadius: 12, padding: '12px', fontSize: 13, color: '#C62828', marginBottom: 12, textAlign: 'center' }}>
            ⚠️ {error}
          </div>
        )}

        <button onClick={handleConfirm} disabled={saving}
          style={BTN(type === 'training' ? 'linear-gradient(135deg,#1B5E20,#4CAF50)' : 'linear-gradient(135deg,#F59E0B,#FCD34D)', saving)}>
          {saving ? '⏳ Сақланмоқда...' : '✅ Ҳа, мен!'}
        </button>
        <button onClick={() => { setStep(2); setIdInput(''); setEmployee(null); setError('') }}
          style={{ width: '100%', padding: '12px', background: 'none', border: 'none', color: '#888', fontSize: 13, cursor: 'pointer', marginTop: 8, fontFamily: 'inherit' }}>
          ← Йўқ, ID ни қайта киритиш
        </button>
      </div>
    </div>
  )

  // Step 4 — Done
  return (
    <div style={{ ...PAGE, alignItems: 'center' }}>
      <div style={{ ...CARD, textAlign: 'center' }}>
        <div style={{ fontSize: 70, marginBottom: 12 }}>{alreadyMarked ? '⚠️' : '✅'}</div>
        <h2 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 900, color: '#1A1A2E' }}>
          {alreadyMarked ? 'Аллақачон белгиланган!' : 'Қатнашув қайд этилди!'}
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: 15, color: '#555', lineHeight: 1.6 }}>
          {alreadyMarked
            ? `${employee?.name}, сиз аллақачон бу ${type === 'training' ? 'тренингга' : 'практикумга'} қайд этилгансиз.`
            : `${employee?.name}, сизнинг қатнашувингиз муваффақиятли қайд этилди!`
          }
        </p>
        <div style={{ background: '#F8F9FA', borderRadius: 14, padding: '14px', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1A1A2E' }}>{entity?.title}</div>
          {type === 'training' && detectedCity && (
            <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>📍 {detectedCity}</div>
          )}
        </div>
        <button onClick={() => { setStep(type === 'training' ? 1 : 2); setIdInput(''); setEmployee(null); setError(''); setAlreadyMarked(false); setCityInput(''); setConfirmCity(false); setSession(null) }}
          style={{ background: '#E8F5E9', color: '#2E7D32', border: '1.5px solid #A5D6A7', borderRadius: 12, padding: '14px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', width: '100%', WebkitTapHighlightColor: 'transparent' }}>
          Бошқа ходим
        </button>
      </div>
    </div>
  )
}
