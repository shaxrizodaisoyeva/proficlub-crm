import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'

const RATING_QUESTIONS = [
  { key: 'q1_value', label: 'Фойдалилик', text: 'Бу тренинг менинг иш самарамни ошириши учун фойдали бўлди.' },
  { key: 'q2_value', label: 'Тушунарлилик', text: 'Материал аниқ ва тушунарли тарзда тушунтирилди.' },
  { key: 'q3_value', label: 'Амалийлик', text: 'Тренингда ўрганилган нарсаларни ишда қўллай оламан.' },
  { key: 'q4_value', label: 'Ташкиллаштириш', text: 'Тренингнинг вақти, давомийлиги ва тузилиши мени қониқтирди.' },
]

const TEXT_QUESTIONS = [
  { key: 'q5_text', label: 'Энг фойдали қисм', text: 'Бугунги тренингнинг сизга энг кўп наф берган қисми қайси бўлди?' },
  { key: 'q6_text', label: 'Яхшилаш керак', text: 'Тренингнинг қайси қисмини яхшилаш ёки ўзгартириш керак деб ўйлайсиз?' },
  { key: 'q7_text', label: 'Келгуси мавзулар', text: 'Кейинги тренингларда қайси мавзуларни кўришни хоҳлайсиз?' },
  { key: 'q8_text', label: 'Қўшимча фикр', text: 'Тренинг ёки иш жараёни ҳақида бошқа фикр ва таклифларингиз борми?' },
]

function RatingButtons({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  const labels = ['', 'Умуман розимасман', 'Розимасман', 'Бетараф', 'Розиман', 'Тўлиқ розиман']
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            style={{
              width: 48, height: 48, borderRadius: 12,
              border: '2px solid',
              borderColor: (hovered || value) >= n ? '#1976D2' : '#E0E0E0',
              background: (hovered || value) >= n ? '#1976D2' : '#fff',
              color: (hovered || value) >= n ? '#fff' : '#aaa',
              fontWeight: 800, fontSize: 18, cursor: 'pointer',
              transition: 'all 0.15s', fontFamily: 'inherit',
              boxShadow: value === n ? '0 2px 8px rgba(25,118,210,0.3)' : 'none',
            }}
          >
            {n}
          </button>
        ))}
      </div>
      {(hovered || value) > 0 && (
        <div style={{ fontSize: 12, color: '#1976D2', fontWeight: 600, marginTop: 6 }}>
          {labels[hovered || value]}
        </div>
      )}
    </div>
  )
}

export default function Survey() {
  const parts = window.location.pathname.split('/')
  const type = parts[2]
  const id = parts[3]

  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [answers, setAnswers] = useState({
    q1_value: 0, q2_value: 0, q3_value: 0, q4_value: 0,
    q5_text: '', q6_text: '', q7_text: '', q8_text: '',
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    async function load() {
      try {
        const table = type === 'training' ? 'trainings' : 'praktikum'
        const { data } = await supabase.from(table).select('id, title, date').eq('id', id).single()
        setItem(data)
      } catch(e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [type, id])

  const ratingFilled = RATING_QUESTIONS.filter(q => answers[q.key] > 0).length
  const textFilled = TEXT_QUESTIONS.filter(q => answers[q.key].trim().length > 0).length
  const totalFilled = ratingFilled + textFilled
  const totalQuestions = 8

  function validate() {
    const errs = {}
    RATING_QUESTIONS.forEach(q => { if (!answers[q.key]) errs[q.key] = true })
    TEXT_QUESTIONS.forEach(q => { if (!answers[q.key].trim()) errs[q.key] = true })
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setSaving(true)
    try {
      const payload = {
        type,
        q1_value: answers.q1_value,
        q2_value: answers.q2_value,
        q3_value: answers.q3_value,
        q4_value: answers.q4_value,
        q5_text: answers.q5_text,
        q6_text: answers.q6_text,
        q7_text: answers.q7_text,
        q8_text: answers.q8_text,
        q9_text: null,
      }
      if (type === 'training') payload.training_id = id
      else payload.praktikum_id = Number(id)
      await supabase.from('survey_responses').insert(payload)
      setSubmitted(true)
    } catch(e) { alert('Хатолик: ' + e.message) }
    finally { setSaving(false) }
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'Segoe UI, sans-serif' }}>
      <div style={{ width:36, height:36, border:'4px solid #E3F2FD', borderTop:'4px solid #1976D2', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!item) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'Segoe UI, sans-serif', flexDirection:'column', color:'#888' }}>
      <div style={{ fontSize:48, marginBottom:12 }}>❌</div>
      <div style={{ fontSize:16, fontWeight:700 }}>Топилмади</div>
    </div>
  )

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

  return (
    <div style={{ minHeight:'100vh', background:'#F5F7FA', fontFamily:'Segoe UI, sans-serif', padding:'24px 16px 60px' }}>
      <div style={{ maxWidth:620, margin:'0 auto' }}>

        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,#1565C0,#42A5F5)', borderRadius:18, padding:'24px 28px', marginBottom:20, color:'#fff' }}>
          <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:8, opacity:0.85 }}>
            📋 {type === 'training' ? 'Тренинг' : 'Практикум'} — Аноним Сўровнома
          </div>
          <h1 style={{ margin:'0 0 6px', fontSize:22, fontWeight:900 }}>{item.title}</h1>
          <div style={{ fontSize:13, opacity:0.85 }}>{item.date} · Барча саволлар мажбурий · Жавоблар анонимдир</div>
        </div>

        {/* Progress */}
        <div style={{ background:'#fff', borderRadius:12, padding:'12px 18px', marginBottom:20, display:'flex', alignItems:'center', gap:12, boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ flex:1, height:8, background:'#F0F0F0', borderRadius:4, overflow:'hidden' }}>
            <div style={{ width:`${Math.round(totalFilled/totalQuestions*100)}%`, height:'100%', background:'#1976D2', borderRadius:4, transition:'width 0.3s' }} />
          </div>
          <span style={{ fontSize:12, fontWeight:700, color:'#1976D2', whiteSpace:'nowrap' }}>
            {totalFilled} / {totalQuestions}
          </span>
        </div>

        {/* PART 1 — Rating */}
        <div style={{ background:'#fff', borderRadius:16, padding:'22px 24px', marginBottom:16, boxShadow:'0 2px 10px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight:800, fontSize:15, marginBottom:4, color:'#1565C0' }}>⭐ 1-қисм: Баҳолаш</div>
          <div style={{ fontSize:12, color:'#888', marginBottom:20 }}>1 = Умуман розимасман · 5 = Тўлиқ розиман</div>

          {RATING_QUESTIONS.map((q, i) => (
            <div key={q.key} style={{ marginBottom: i < RATING_QUESTIONS.length - 1 ? 28 : 0 }}>
              <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                <span style={{
                  width:26, height:26, borderRadius:'50%', flexShrink:0, marginTop:1,
                  background: answers[q.key] > 0 ? '#1976D2' : errors[q.key] ? '#FFEBEE' : '#E3F2FD',
                  color: answers[q.key] > 0 ? '#fff' : errors[q.key] ? '#C62828' : '#1565C0',
                  display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:12,
                }}>{i+1}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, color:'#1A1A2E', lineHeight:1.5, fontWeight:600 }}>
                    <span style={{ color:'#1565C0', fontWeight:800 }}>{q.label}:</span> {q.text}
                  </div>
                  {errors[q.key] && <div style={{ fontSize:11, color:'#C62828', marginTop:4 }}>⚠️ Илтимос баҳо беринг</div>}
                  <RatingButtons
                    value={answers[q.key]}
                    onChange={v => { setAnswers(p => ({...p, [q.key]: v})); setErrors(p => ({...p, [q.key]: false})) }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* PART 2 — Open questions */}
        <div style={{ background:'#fff', borderRadius:16, padding:'22px 24px', marginBottom:16, boxShadow:'0 2px 10px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight:800, fontSize:15, marginBottom:4, color:'#1565C0' }}>✏️ 2-қисм: Очиқ саволлар</div>
          <div style={{ fontSize:12, color:'#888', marginBottom:20 }}>Барча саволларга жавоб беринг</div>

          {TEXT_QUESTIONS.slice(0, 3).map((q, i) => (
            <div key={q.key} style={{ marginBottom: 22 }}>
              <div style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:8 }}>
                <span style={{
                  width:26, height:26, borderRadius:'50%', flexShrink:0, marginTop:1,
                  background: answers[q.key].trim() ? '#1976D2' : errors[q.key] ? '#FFEBEE' : '#E3F2FD',
                  color: answers[q.key].trim() ? '#fff' : errors[q.key] ? '#C62828' : '#1565C0',
                  display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:12,
                }}>{i+5}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, color:'#1A1A2E', lineHeight:1.5, fontWeight:600 }}>
                    <span style={{ color:'#1565C0', fontWeight:800 }}>{q.label}:</span> {q.text}
                  </div>
                  {errors[q.key] && <div style={{ fontSize:11, color:'#C62828', marginTop:4 }}>⚠️ Илтимос жавоб ёзинг</div>}
                </div>
              </div>
              <textarea
                value={answers[q.key]}
                onChange={e => { setAnswers(p => ({...p, [q.key]: e.target.value})); setErrors(p => ({...p, [q.key]: false})) }}
                rows={3}
                placeholder="Жавобингизни ёзинг..."
                style={{ width:'100%', padding:'10px 14px', border:`1.5px solid ${errors[q.key]?'#EF9A9A':'#E0E0E0'}`, borderRadius:10, fontSize:13, fontFamily:'inherit', resize:'vertical', outline:'none', background:'#FAFAFA', boxSizing:'border-box' }}
                onFocus={e => e.target.style.borderColor='#1976D2'}
                onBlur={e => e.target.style.borderColor=errors[q.key]?'#EF9A9A':'#E0E0E0'}
              />
            </div>
          ))}
        </div>

        {/* PART 3 — Additional */}
        <div style={{ background:'#fff', borderRadius:16, padding:'22px 24px', marginBottom:24, boxShadow:'0 2px 10px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight:800, fontSize:15, marginBottom:4, color:'#1565C0' }}>💬 3-қисм: Умумий</div>
          <div style={{ fontSize:12, color:'#888', marginBottom:20 }}>Қўшимча фикр ва таклифлар</div>

          <div style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:8 }}>
            <span style={{
              width:26, height:26, borderRadius:'50%', flexShrink:0, marginTop:1,
              background: answers.q8_text.trim() ? '#1976D2' : errors.q8_text ? '#FFEBEE' : '#E3F2FD',
              color: answers.q8_text.trim() ? '#fff' : errors.q8_text ? '#C62828' : '#1565C0',
              display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:12,
            }}>8</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, color:'#1A1A2E', lineHeight:1.5, fontWeight:600 }}>
                <span style={{ color:'#1565C0', fontWeight:800 }}>{TEXT_QUESTIONS[3].label}:</span> {TEXT_QUESTIONS[3].text}
              </div>
              {errors.q8_text && <div style={{ fontSize:11, color:'#C62828', marginTop:4 }}>⚠️ Илтимос жавоб ёзинг</div>}
            </div>
          </div>
          <textarea
            value={answers.q8_text}
            onChange={e => { setAnswers(p => ({...p, q8_text: e.target.value})); setErrors(p => ({...p, q8_text: false})) }}
            rows={4}
            placeholder="Фикрларингизни ёзинг..."
            style={{ width:'100%', padding:'10px 14px', border:`1.5px solid ${errors.q8_text?'#EF9A9A':'#E0E0E0'}`, borderRadius:10, fontSize:13, fontFamily:'inherit', resize:'vertical', outline:'none', background:'#FAFAFA', boxSizing:'border-box' }}
            onFocus={e => e.target.style.borderColor='#1976D2'}
            onBlur={e => e.target.style.borderColor=errors.q8_text?'#EF9A9A':'#E0E0E0'}
          />
        </div>

        {/* Validation warning */}
        {Object.keys(errors).some(k => errors[k]) && (
          <div style={{ background:'#FFEBEE', border:'1.5px solid #FFCDD2', borderRadius:12, padding:'12px 16px', marginBottom:16, fontSize:13, color:'#C62828', fontWeight:600 }}>
            ⚠️ Барча саволларга жавоб беринг
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{
            width:'100%', padding:'16px',
            background: 'linear-gradient(135deg,#1565C0,#42A5F5)',
            color: '#fff', border:'none', borderRadius:14,
            fontWeight:800, fontSize:16, cursor:'pointer',
            fontFamily:'inherit',
            boxShadow: '0 4px 16px rgba(21,101,192,0.3)',
            opacity: saving ? 0.7 : 1,
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
