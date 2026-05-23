import { useState } from 'react'
import { supabase } from './lib/supabase'

const ROLES = [
  { value: 'Менежер', label: '👔 Менежер', color: '#1565C0', bg: '#E8F4FD' },
  { value: 'Савдо вакили', label: '🤝 Савдо вакили', color: '#2E7D32', bg: '#E8F5E9' },
  { value: 'Оператор', label: '💻 Оператор', color: '#6A1B9A', bg: '#F3E5F5' },
  { value: 'Ҳайдовчи', label: '🚗 Ҳайдовчи', color: '#E65100', bg: '#FFF3E0' },
  { value: 'Таҳлилчи', label: '📊 Таҳлилчи', color: '#00695C', bg: '#E0F2F1' },
  { value: 'Администратор', label: '🗂️ Администратор', color: '#880E4F', bg: '#FCE4EC' },
]

const FIELDS = {
  'Менежер': [
    { key: 'organization', label: 'Ташкилот', type: 'select', options: ['PPS', 'IPS', 'PPHS-II'], placeholder: 'Масалан: PPS', required: true },
    { key: 'birthDate', label: 'Туғилган санаси', type: 'date', placeholder: 'Масалан: 1990-05-15', required: true },
    { key: 'phone', label: 'Телефон рақами', type: 'text', placeholder: 'Масалан: +998 90 123 45 67', required: true },
    { key: 'region', label: 'Вилоят / Ҳудуд', type: 'select', options: ['Тошкент', 'Тошкент вилояти', 'Самарқанд', 'Бухоро', 'Наманган', 'Андижон', 'Фарғона', 'Қашқадарё', 'Сурхондарё', 'Навоий', 'Жиззах', 'Сирдарё', 'Хоразм', 'Қорақалпоғистон'], placeholder: 'Масалан: Тошкент', required: true },
    { key: 'educationLevel', label: 'Маълумот даражаси', type: 'select', options: ['Олий', 'Ўрта махсус', 'Ўрта', 'Тугалланмаган олий'], placeholder: 'Масалан: Олий', required: true },
    { key: 'education', label: 'Таълим муассасаси', type: 'text', placeholder: 'Масалан: Тошкент фармацевтика институти', required: false },
    { key: 'specialty', label: 'Дипломдаги мутахассислик', type: 'text', placeholder: 'Масалан: Фармацевт, Биолог, Тиббиёт', required: false },
    { key: 'hireDate', label: 'Ишга кирган сана', type: 'date', placeholder: 'Масалан: 2022-01-15', required: true },
    { key: 'teamSize', label: 'Жамоасидаги ходимлар сони', type: 'number', placeholder: 'Масалан: 8', required: false },
  ],
  'Савдо вакили': [
    { key: 'organization', label: 'Ташкилот', type: 'select', options: ['PPS', 'IPS', 'PPHS-II'], placeholder: 'Масалан: IPS', required: true },
    { key: 'birthDate', label: 'Туғилган санаси', type: 'date', placeholder: 'Масалан: 1995-03-20', required: true },
    { key: 'phone', label: 'Телефон рақами', type: 'text', placeholder: 'Масалан: +998 93 456 78 90', required: true },
    { key: 'region', label: 'Вилоят / Ҳудуд', type: 'select', options: ['Тошкент', 'Тошкент вилояти', 'Самарқанд', 'Бухоро', 'Наманган', 'Андижон', 'Фарғона', 'Қашқадарё', 'Сурхондарё', 'Навоий', 'Жиззах', 'Сирдарё', 'Хоразм', 'Қорақалпоғистон'], placeholder: 'Масалан: Андижон', required: true },
    { key: 'educationLevel', label: 'Маълумот даражаси', type: 'select', options: ['Олий', 'Ўрта махсус', 'Ўрта', 'Тугалланмаган олий'], placeholder: 'Масалан: Олий', required: true },
    { key: 'education', label: 'Таълим муассасаси', type: 'text', placeholder: 'Масалан: СамДУ Биология факультети', required: false },
    { key: 'specialty', label: 'Дипломдаги мутахассислик', type: 'text', placeholder: 'Масалан: Биолог', required: false },
    { key: 'hireDate', label: 'Ишга кирган сана', type: 'date', placeholder: 'Масалан: 2023-06-01', required: true },
  ],
  'Оператор': [
    { key: 'organization', label: 'Ташкилот', type: 'select', options: ['PPS', 'IPS', 'PPHS-II'], placeholder: 'Масалан: PPS', required: true },
    { key: 'birthDate', label: 'Туғилган санаси', type: 'date', placeholder: 'Масалан: 1998-11-10', required: true },
    { key: 'phone', label: 'Телефон рақами', type: 'text', placeholder: 'Масалан: +998 99 111 22 33', required: true },
    { key: 'educationLevel', label: 'Маълумот даражаси', type: 'select', options: ['Олий', 'Ўрта махсус', 'Ўрта', 'Тугалланмаган олий'], placeholder: 'Масалан: Ўрта махсус', required: true },
    { key: 'education', label: 'Таълим муассасаси', type: 'text', placeholder: 'Масалан: Тошкент коллежи', required: false },
    { key: 'hireDate', label: 'Ишга кирган сана', type: 'date', placeholder: 'Масалан: 2024-01-10', required: true },
    { key: 'shift', label: 'Иш смена', type: 'select', options: ['Кундузги', 'Кечки', 'Тунги'], placeholder: 'Масалан: Кундузги', required: false },
  ],
  'Ҳайдовчи': [
    { key: 'organization', label: 'Ташкилот', type: 'select', options: ['PPS', 'IPS', 'PPHS-II'], placeholder: 'Масалан: PPHS-II', required: true },
    { key: 'birthDate', label: 'Туғилган санаси', type: 'date', placeholder: 'Масалан: 1985-07-25', required: true },
    { key: 'phone', label: 'Телефон рақами', type: 'text', placeholder: 'Масалан: +998 91 777 88 99', required: true },
    { key: 'licenseCategory', label: 'Ҳайдовчилик гувоҳномаси тоифаси', type: 'text', placeholder: 'Масалан: B, C', required: true },
    { key: 'vehicleType', label: 'Транспорт тури', type: 'text', placeholder: 'Масалан: Nexia 3, Дамас', required: false },
    { key: 'region', label: 'Хизмат кўрсатувчи ҳудуд', type: 'select', options: ['Тошкент', 'Тошкент вилояти', 'Самарқанд', 'Бухоро', 'Наманган', 'Андижон', 'Фарғона', 'Қашқадарё', 'Сурхондарё', 'Навоий', 'Жиззах', 'Сирдарё', 'Хоразм', 'Қорақалпоғистон'], placeholder: 'Масалан: Тошкент', required: true },
    { key: 'hireDate', label: 'Ишга кирган сана', type: 'date', placeholder: 'Масалан: 2021-03-01', required: true },
  ],
  'Таҳлилчи': [
    { key: 'organization', label: 'Ташкилот', type: 'select', options: ['PPS', 'IPS', 'PPHS-II'], placeholder: 'Масалан: IPS', required: true },
    { key: 'birthDate', label: 'Туғилган санаси', type: 'date', placeholder: 'Масалан: 1992-04-18', required: true },
    { key: 'phone', label: 'Телефон рақами', type: 'text', placeholder: 'Масалан: +998 97 333 44 55', required: true },
    { key: 'educationLevel', label: 'Маълумот даражаси', type: 'select', options: ['Олий', 'Ўрта махсус', 'Ўрта', 'Тугалланмаган олий'], placeholder: 'Масалан: Олий', required: true },
    { key: 'education', label: 'Таълим муассасаси', type: 'text', placeholder: 'Масалан: ТАТУ Иқтисодиёт факультети', required: false },
    { key: 'specialty', label: 'Мутахассислик', type: 'text', placeholder: 'Масалан: Иқтисодчи', required: false },
    { key: 'hireDate', label: 'Ишга кирган сана', type: 'date', placeholder: 'Масалан: 2023-09-01', required: true },
    { key: 'software', label: 'Ишлатадиган дастурлар', type: 'text', placeholder: 'Масалан: Excel, 1C, Power BI', required: false },
  ],
  'Администратор': [
    { key: 'organization', label: 'Ташкилот', type: 'select', options: ['PPS', 'IPS', 'PPHS-II'], placeholder: 'Масалан: PPS', required: true },
    { key: 'birthDate', label: 'Туғилган санаси', type: 'date', placeholder: 'Масалан: 1993-08-30', required: true },
    { key: 'phone', label: 'Телефон рақами', type: 'text', placeholder: 'Масалан: +998 90 222 33 44', required: true },
    { key: 'educationLevel', label: 'Маълумот даражаси', type: 'select', options: ['Олий', 'Ўрта махсус', 'Ўрта', 'Тугалланмаган олий'], placeholder: 'Масалан: Олий', required: true },
    { key: 'education', label: 'Таълим муассасаси', type: 'text', placeholder: 'Масалан: ТошДУ', required: false },
    { key: 'hireDate', label: 'Ишга кирган сана', type: 'date', placeholder: 'Масалан: 2022-11-01', required: true },
    { key: 'currentPosition', label: 'Ҳозирги лавозим', type: 'text', placeholder: 'Масалан: Бош администратор', required: false },
  ],
}

const SI = {
  width: '100%',
  padding: '12px 14px',
  border: '1.5px solid #E0E0E0',
  borderRadius: 10,
  fontSize: 14,
  fontFamily: 'inherit',
  outline: 'none',
  background: '#FAFAFA',
  boxSizing: 'border-box',
  color: '#1A1A2E',
}

export default function Register() {
  const [step, setStep] = useState(1) // 1=role, 2=name, 3=fields, 4=done
  const [role, setRole] = useState('')
  const [name, setName] = useState('')
  const [formData, setFormData] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fields = FIELDS[role] || []
  const roleInfo = ROLES.find(r => r.value === role)

  function handleFieldChange(key, value) {
    setFormData(p => ({ ...p, [key]: value }))
  }

  async function handleSubmit() {
    // Validate required fields
    const missing = fields.filter(f => f.required && !formData[f.key])
    if (missing.length > 0) {
      setError(`Илтимос, қуйидаги майдонларни тўлдиринг: ${missing.map(f => f.label).join(', ')}`)
      return
    }
    if (!name.trim()) {
      setError('Исм-фамилия киритилмаган')
      return
    }

    setSaving(true)
    setError('')
    try {
      const { organization, ...rest } = formData
      await supabase.from('employees').insert({
        name: name.trim(),
        role,
        exam_results: [],
        data: {
          ...rest,
          organization: organization || '',
        },
      })
      setStep(4)
    } catch (e) {
      setError('Хатолик юз берди: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  // Step 1 — Role selection
  if (step === 1) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0D47A1 0%, #1976D2 50%, #42A5F5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '32px 28px', width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg,#1565C0,#42A5F5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 14px' }}>💊</div>
          <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 900, color: '#1A1A2E' }}>ПрофиКлуб</h1>
          <p style={{ margin: 0, fontSize: 14, color: '#888' }}>Тизимга қўшилиш учун лавозимингизни танланг</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {ROLES.map(r => (
            <button key={r.value} onClick={() => { setRole(r.value); setStep(2) }}
              style={{ background: r.bg, border: `2px solid transparent`, borderRadius: 12, padding: '14px 10px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s', fontFamily: 'inherit' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = r.color; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.transform = 'translateY(0)' }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{r.label.split(' ')[0]}</div>
              <div style={{ fontWeight: 700, fontSize: 13, color: r.color }}>{r.label.split(' ').slice(1).join(' ')}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  // Step 2 — Name
  if (step === 2) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0D47A1 0%, #1976D2 50%, #42A5F5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '32px 28px', width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 13, marginBottom: 20, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>← Орқага</button>

        <div style={{ background: roleInfo?.bg, borderRadius: 10, padding: '10px 14px', marginBottom: 24, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: roleInfo?.color }}>{roleInfo?.label}</span>
        </div>

        <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 900, color: '#1A1A2E' }}>Исм-фамилияингизни киритинг</h2>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: '#888' }}>Тўлиқ исм ва фамилияни кирилл ҳарфларида ёзинг</p>

        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, display: 'block' }}>Тўлиқ исм-фамилия *</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Масалан: Каримов Акбар Тўлқинович"
            style={{ ...SI, fontSize: 16 }}
            autoFocus
          />
          <div style={{ fontSize: 11, color: '#aaa', marginTop: 5 }}>💡 Аввал фамилия, кейин исм ёзинг</div>
        </div>

        <button
          onClick={() => { if (name.trim()) setStep(3) else setError('Исм-фамилия киритинг') }}
          disabled={!name.trim()}
          style={{ width: '100%', padding: '14px', background: name.trim() ? `linear-gradient(135deg, ${roleInfo?.color}, #42A5F5)` : '#E0E0E0', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: name.trim() ? 'pointer' : 'not-allowed', marginTop: 16, fontFamily: 'inherit' }}>
          Давом этиш →
        </button>
        {error && <div style={{ color: '#C62828', fontSize: 13, marginTop: 10, textAlign: 'center' }}>{error}</div>}
      </div>
    </div>
  )

  // Step 3 — Fields
  if (step === 3) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0D47A1 0%, #1976D2 50%, #42A5F5 100%)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px 20px 40px', fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '32px 28px', width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', marginTop: 20 }}>
        <button onClick={() => setStep(2)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 13, marginBottom: 16, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>← Орқага</button>

        <div style={{ marginBottom: 24 }}>
          <div style={{ background: roleInfo?.bg, borderRadius: 10, padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: roleInfo?.color }}>{roleInfo?.label}</span>
          </div>
          <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 900, color: '#1A1A2E' }}>{name}</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#888' }}>Маълумотларни тўлдиринг. * белгили майдонлар мажбурий.</p>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
          {[1,2,3].map(s => (
            <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= 3 ? roleInfo?.color : '#E0E0E0' }} />
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {fields.map(f => (
            <div key={f.key}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, display: 'block' }}>
                {f.label} {f.required ? '*' : <span style={{ color: '#bbb', fontWeight: 400, textTransform: 'none' }}>(ихтиёрий)</span>}
              </label>
              {f.type === 'select' ? (
                <select value={formData[f.key] || ''} onChange={e => handleFieldChange(f.key, e.target.value)} style={{ ...SI }}>
                  <option value=''>— Танланг —</option>
                  {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : f.type === 'date' ? (
                <div>
                  <input type="date" value={formData[f.key] || ''} onChange={e => handleFieldChange(f.key, e.target.value)} style={{ ...SI }} />
                  <div style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>💡 {f.placeholder}</div>
                </div>
              ) : f.type === 'number' ? (
                <div>
                  <input type="number" value={formData[f.key] || ''} onChange={e => handleFieldChange(f.key, e.target.value)} placeholder={f.placeholder} style={{ ...SI }} />
                </div>
              ) : (
                <div>
                  <input type="text" value={formData[f.key] || ''} onChange={e => handleFieldChange(f.key, e.target.value)} placeholder={f.placeholder} style={{ ...SI }} />
                </div>
              )}
            </div>
          ))}
        </div>

        {error && (
          <div style={{ background: '#FFEBEE', border: '1.5px solid #FFCDD2', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#C62828', marginTop: 16 }}>
            ⚠️ {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{ width: '100%', padding: '14px', background: saving ? '#E0E0E0' : `linear-gradient(135deg, ${roleInfo?.color || '#1565C0'}, #42A5F5)`, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: saving ? 'not-allowed' : 'pointer', marginTop: 24, fontFamily: 'inherit' }}>
          {saving ? '⏳ Юборилмоқда...' : '✅ Маълумотларни юбориш'}
        </button>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#bbb', marginTop: 14, marginBottom: 0 }}>
          Маълумотларингиз ПрофиКлуб CRM тизимига қўшилади ва тасдиқланади
        </p>
      </div>
    </div>
  )

  // Step 4 — Success
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #66BB6A 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '40px 28px', width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
        <h2 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 900, color: '#1A1A2E' }}>Муваффақиятли юборилди!</h2>
        <p style={{ margin: '0 0 20px', fontSize: 14, color: '#555', lineHeight: 1.6 }}>
          <strong>{name}</strong>, маълумотларингиз қабул қилинди.<br />
          Тизим администратори маълумотларингизни кўриб чиқади ва тасдиқлайди.
        </p>
        <div style={{ background: '#F0F4FF', borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: '#1565C0', fontWeight: 600 }}>📋 Навбатдаги қадам</div>
          <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>Администратор маълумотларингизни текшириб, тасдиқлагандан сўнг сиз тизимда фаол ҳолатга ўтасиз.</div>
        </div>
        <button onClick={() => { setStep(1); setRole(''); setName(''); setFormData({}); setError('') }}
          style={{ background: '#E8F5E9', color: '#2E7D32', border: '1.5px solid #A5D6A7', borderRadius: 10, padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
          Бошқа ходим қўшиш
        </button>
      </div>
    </div>
  )
}
