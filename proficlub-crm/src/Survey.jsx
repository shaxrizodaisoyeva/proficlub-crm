import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'

const RATING_QUESTIONS = [
  { key: 'q1_value', text: 'Умумий қиймат: Тренинг сессияси фойдали бўлди ва вақтимга арзиди.' },
  { key: 'q2_value', text: 'Мавзуга мосlik: Қопланган мавзулар менинг кундалик ишим ва вазифаларимга тўғридан-тўғри тааллуқли.' },
  { key: 'q3_value', text: 'Аниқлик: Тренер материални тушунарли тушунтирди ва сессияни қизиқарли ўтказди.' },
  { key: 'q4_value', text: 'Тузилиш ва суръат: Тренингнинг тузилиши, вақти ва суръати мос эди.' },
]

const TEXT_QUESTIONS = [
  { key: 'q5_text', text: 'Асосий хулоса: Бугунги тренингнинг энг фойдали ёки қизиқарли қисми нима эди?' },
  { key: 'q6_text', text: 'Яхшилаш учун соҳалар: Тренингнинг қайси қисми тушунарсиз, жуда узун ёки камроқ фойдали эди?' },
  { key: 'q7_text', text: 'Ўзгартириш таклифлари: Кейинги сессияни яхшилаш учун нимани ўзгартиришимиз керак? (масалан, кўпроқ амалий мисоллар, бошқача суръат, кўпроқ интерактив саволлар ва ҳоказо)' },
  { key: 'q8_text', text: 'Келгуси мавзулар: Келгуси ойлик тренинг сессияларида раҳбарингиз қайси мавзу ёки кўникмаларни ёритишини хоҳлайсиз?' },
  { key: 'q9_text', text: 'Қўшимча фикрлар: Анонимлик шартida бошқа фикр, изоҳ ёки таклифларингиз борми?' },
]

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          style={{
            width: 44, height: 44, borderRadius: 10,
            border: '2px solid',
            borderColor: (hovered || value) >= n ? '#1976D2' : '#E0E0E0',
            background: (hovered || value) >= n ? '#1976D2' : '#fff',
            color: (hovered || value) >= n ? '#fff' : '#888',
            fontWeight: 800, fontSize: 16, cursor: 'pointer',
            transition: 'all 0.15s', fontFamily: 'inherit',
          }}
        >
          {n}
        </button>
      ))}
      {value > 0 && (
        <span style={{ fontSize: 12, color: '#888', alignSelf: 'center', marginLeft: 4 }}>
          {['', 'Умуман розимасман', 'Розимасман', 'Бетараф', 'Розиман', 'Тўлиқ розиман'][value]}
        </span>
      )}
    </div>
  )
}

export default function Survey() {
  const parts = window.location.pathname.split('/')
  const type = parts[2]   // 'training' or 'praktikum'
  const id = parts[3]

  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [answers, setAnswers] = useState({
    q1_value: 0, q2_value: 0, q3_value: 0, q4_value: 0,
    q5_text: '', q6_text: '', q7_text: '', q8_text: '', q9_text: '',
  })

  useEffect(() => {
    async function load() {
      try {
        if (type === 'training') {
          const { data } = await supabase.from('trainings').select('id, title, date').eq('id', id).single()
          setItem(data)
        } else {
          const { data } = await supabase.from('praktikum').select('id, title, date').eq('id', id).single()
          setItem(data)
        }
      } catch(e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [type, id])

  const ratingFilled = RATING_QUESTIONS.filter(q => answers[q.key] > 0).length
  const canSubmit = ratingFilled === 4

  async function handleSubmit() {
    if (!canSubmit) return
    setSaving(true)
    try {
      const payload = {
        type,
        q1_value: answers.q1_value,
        q2_value: answers.q2_value,
        q3_value: answers.q3_value,
        q4_value: answers.q4_value,
        q5_text: answers.q5_text || null,
        q6_text: answers.q6_text || null,
        q7_text: answers.q7_text || null,
        q8_text: answers.q8_text || null,
        q9_text: answers.q9_text || null,
      }
      if (type === 'training') payload.training_id = id
      else payload.praktikum_id = Number(id)

      await supabase.from('survey_responses').insert(payload)
      setSubmitted(true)
    } catch(e) { alert('Хатолик: ' + e.message) }
    finally { setSaving(false) }
  }

  // ── LOADING ──
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'Segoe UI, sans-serif' }}>
      <div style={{ width:36, height:36, border:'4px solid #E3F2FD', borderTop:'4px solid #1976D2', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  // ── NOT FOUND ──
  if (!item) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'Segoe UI, sans-serif', flexDirection:'column', color:'#888' }}>
      <div style={{ fontSize:48, marginBottom:12 }}>❌</div>
      <div style={{ fontSize:16, fontWeight:700 }}>Топилмади</div>
    </div>
  )

  // ── SUBMITTED ──
  if (submitted) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', fontFamily:'Segoe UI, sans-serif', background:'#F5F7FA', padding:20 }}>
      <div style={{ background:'#fff', borderRadius:20, padding:40, textAlign:'center', maxWidth:420, width:'100%', boxShadow:'0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize:64, marginBottom:16 }}>🎉</div>
        <h2 style={{ margin:'0 0 10px', color:'#2E7D32', fontSize:22 }}>Раҳмат!</h2>
        <p style={{ color:'#888', fontSize:14, margin:'0 0 20px', lineHeight:1.6 }}>
          Сизнинг фикрингиз сақланди.<br/>
          Иштирокингиз ва самимий жавобларингиз учун миннатдормиз.
        </p>
        <div style={{ background:'#E8F5E9', borderRadius:12, padding:'12px 16px', fontSize:13, color:'#2E7D32', fontWeight:600 }}>
          🔒 Жавоблар тўлиқ анонимдир
        </div>
      </div>
    </div>
  )

  // ── MAIN FORM ──
  return (
    <div style={{ minHeight:'100vh', background:'#F5F7FA', fontFamily:'Segoe UI, sans-serif', padding:'24px 16px 48px' }}>
      <div style={{ maxWidth:640, margin:'0 auto' }}>

        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,#1565C0,#42A5F5)', borderRadius:18, padding:'24px 28px', marginBottom:20, color:'#fff' }}>
          <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:8, opacity:0.85 }}>
            📋 {type === 'training' ? 'Тренинг' : 'Практикум'} — Анонимли Сўровнома
          </div>
          <h1 style={{ margin:'0 0 6px', fontSize:22, fontWeight:900 }}>{item.title}</h1>
          <div style={{ fontSize:13, opacity:0.85 }}>{item.date} · Жавоблар анонимдир</div>
        </div>

        {/* Progress bar */}
        <div style={{ background:'#fff', borderRadius:12, padding:'12px 18px', marginBottom:20, display:'flex', alignItems:'center', gap:12, boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ flex:1, height:8, background:'#F0F0F0', borderRadius:4, overflow:'hidden' }}>
            <div style={{ width:`${Math.round(ratingFilled/4*100)}%`, height:'100%', background:'#1976D2', borderRadius:4, transition:'width 0.3s' }} />
          </div>
          <span style={{ fontSize:12, fontWeight:700, color:'#1976D2', whiteSpace:'nowrap' }}>
            {ratingFilled}/4 мажбурий
          </span>
        </div>

        {/* PART 1 — Rating */}
        <div style={{ background:'#fff', borderRadius:16, padding:'20px 24px', marginBottom:16, boxShadow:'0 2px 10px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight:800, fontSize:15, marginBottom:4, color:'#1565C0' }}>
            📊 1-қисм: Умумий қониқиш ва мавзуга мослик
          </div>
          <div style={{ fontSize:12, color:'#888', marginBottom:18 }}>
            Қуйидаги фикрларни 1 дан 5 гача баҳоланг (1 = Умуман розимасман, 5 = Тўлиқ розиман). <span style={{ color:'#C62828' }}>*Мажбурий</span>
          </div>

          {RATING_QUESTIONS.map((q, i) => (
            <div key={q.key} style={{ marginBottom: i < RATING_QUESTIONS.length - 1 ? 24 : 0 }}>
              <div style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:6 }}>
                <span style={{ width:24, height:24, borderRadius:'50%', background: answers[q.key] > 0 ? '#1976D2' : '#E3F2FD', color: answers[q.key] > 0 ? '#fff' : '#1565C0', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:12, flexShrink:0, marginTop:1 }}>{i+1}</span>
                <div style={{ fontSize:14, color:'#1A1A2E', lineHeight:1.5, fontWeight:600 }}>{q.text}</div>
              </div>
              <StarRating
                value={answers[q.key]}
                onChange={v => setAnswers(p => ({...p, [q.key]: v}))}
              />
            </div>
          ))}
        </div>

        {/* PART 2 — Open text */}
        <div style={{ background:'#fff', borderRadius:16, padding:'20px 24px', marginBottom:16, boxShadow:'0 2px 10px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight:800, fontSize:15, marginBottom:4, color:'#1565C0' }}>
            ✏️ 2-қисм: Очиқ саволлар (Нимани ўзгартириш керак)
          </div>
          <div style={{ fontSize:12, color:'#888', marginBottom:18 }}>Ихтиёрий — хоҳласангиз жавоб беринг</div>

          {TEXT_QUESTIONS.slice(0, 4).map((q, i) => (
            <div key={q.key} style={{ marginBottom: i < 3 ? 20 : 0 }}>
              <div style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:8 }}>
                <span style={{ width:24, height:24, borderRadius:'50%', background:'#F0F4FF', color:'#1565C0', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:12, flexShrink:0, marginTop:1 }}>{i+1}</span>
                <div style={{ fontSize:14, color:'#1A1A2E', lineHeight:1.5, fontWeight:600 }}>{q.text}</div>
              </div>
              <textarea
                value={answers[q.key]}
                onChange={e => setAnswers(p => ({...p, [q.key]: e.target.value}))}
                rows={3}
                placeholder="Жавобингизни ёзинг..."
                style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #E0E0E0', borderRadius:10, fontSize:13, fontFamily:'inherit', resize:'vertical', outline:'none', background:'#FAFAFA', boxSizing:'border-box' }}
                onFocus={e => e.target.style.borderColor='#1976D2'}
                onBlur={e => e.target.style.borderColor='#E0E0E0'}
              />
            </div>
          ))}
        </div>

        {/* PART 3 — Additional */}
        <div style={{ background:'#fff', borderRadius:16, padding:'20px 24px', marginBottom:24, boxShadow:'0 2px 10px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight:800, fontSize:15, marginBottom:4, color:'#1565C0' }}>
            💬 3-қисм: Қўшимча фикрлар
          </div>
          <div style={{ fontSize:12, color:'#888', marginBottom:18 }}>Ихтиёрий</div>
          <div style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:8 }}>
            <span style={{ width:24, height:24, borderRadius:'50%', background:'#F0F4FF', color:'#1565C0', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:12, flexShrink:0, marginTop:1 }}>5</span>
            <div style={{ fontSize:14, color:'#1A1A2E', lineHeight:1.5, fontWeight:600 }}>{TEXT_QUESTIONS[4].text}</div>
          </div>
          <textarea
            value={answers.q9_text}
            onChange={e => setAnswers(p => ({...p, q9_text: e.target.value}))}
            rows={4}
            placeholder="Фикрларингизни ёзинг..."
            style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #E0E0E0', borderRadius:10, fontSize:13, fontFamily:'inherit', resize:'vertical', outline:'none', background:'#FAFAFA', boxSizing:'border-box' }}
            onFocus={e => e.target.style.borderColor='#1976D2'}
            onBlur={e => e.target.style.borderColor='#E0E0E0'}
          />
        </div>

        {/* Submit */}
        {!canSubmit && (
          <div style={{ background:'#FFF8E1', border:'1.5px solid #FFE082', borderRadius:12, padding:'10px 16px', marginBottom:14, fontSize:13, color:'#7B5800', fontWeight:600 }}>
            ⚠️ Юборишдан олдин 1-қисмдаги барча 4 та саволга жавоб беринг
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={saving || !canSubmit}
          style={{
            width:'100%', padding:'16px',
            background: canSubmit ? 'linear-gradient(135deg,#1565C0,#42A5F5)' : '#E0E0E0',
            color: canSubmit ? '#fff' : '#aaa',
            border:'none', borderRadius:14, fontWeight:800, fontSize:16,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            fontFamily:'inherit',
            boxShadow: canSubmit ? '0 4px 16px rgba(21,101,192,0.3)' : 'none',
            transition:'all 0.2s',
          }}
        >
          {saving ? '⏳ Юборилмоқда...' : '✅ Юбориш'}
        </button>

        <div style={{ textAlign:'center', fontSize:11, color:'#bbb', marginTop:14 }}>
          🔒 Жавоблар тўлиқ анонимдир. Сизнинг исмингиз ҳеч қаерда сақланмайди.
        </div>
      </div>
    </div>
  )
}
