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
    { key: 'phone', label: 'Телефон рақами', type: 'tel', placeholder: '+998 90 123 45 67', required: true },
    { key: 'region', label: 'Вилоят / Ҳудуд', type: 'select', options: ['Тошкент', 'Тошкент вилояти', 'Самарқанд', 'Бухоро', 'Наманган', 'Андижон', 'Фарғона', 'Қашқадарё', 'Сурхондарё', 'Навоий', 'Жиззах', 'Сирдарё', 'Хоразм', 'Қорақалпоғистон'], required: true },
    { key: 'educationLevel', label: 'Маълумот даражаси', type: 'select', options: ['Олий', 'Ўрта махсус', 'Ўрта', 'Тугалланмаган олий'], required: true },
    { key: 'education', label: 'Таълим муассасаси', type: 'text', placeholder: 'Масалан: Тошкент фармацевтика институти', required: false },
    { key: 'specialty', label: 'Дипломдаги мутахассислик', type: 'text', placeholder: 'Масалан: Фармацевт', required: false },
    { key: 'hireDate', label: 'Ишга кирган сана', type: 'date', required: true },
    { key: 'teamSize', label: 'Жамоасидаги ходимлар сони', type: 'number', placeholder: 'Масалан: 8', required: false },
  ],
  'Савдо вакили': [
    { key: 'organization', label: 'Ташкилот', type: 'select', options: ['PPS', 'IPS', 'PPHS-II'], required: true },
    { key: 'birthDate', label: 'Туғилган санаси', type: 'date', required: true },
    { key: 'phone', label: 'Телефон рақами', type: 'tel', placeholder: '+998 93 456 78 90', required: true },
    { key: 'region', label: 'Вилоят / Ҳудуд', type: 'select', options: ['Тошкент', 'Тошкент вилояти', 'Самарқанд', 'Бухоро', 'Наманган', 'Андижон', 'Фарғона', 'Қашқадарё', 'Сурхондарё', 'Навоий', 'Жиззах', 'Сирдарё', 'Хоразм', 'Қорақалпоғистон'], required: true },
    { key: 'educationLevel', label: 'Маълумот даражаси', type: 'select', options: ['Олий', 'Ўрта махсус', 'Ўрта', 'Тугалланмаган олий'], required: true },
    { key: 'education', label: 'Таълим муассасаси', type: 'text', placeholder: 'Масалан: СамДУ Биология факультети', required: false },
    { key: 'specialty', label: 'Дипломдаги мутахассислик', type: 'text', placeholder: 'Масалан: Биолог', required: false },
    { key: 'hireDate', label: 'Ишга кирган сана', type: 'date', required: true },
  ],
  'Оператор': [
    { key: 'organization', label: 'Ташкилот', type: 'select', options: ['PPS', 'IPS', 'PPHS-II'], required: true },
    { key: 'birthDate', label: 'Туғилган санаси', type: 'date', required: true },
    { key: 'phone', label: 'Телефон рақами', type: 'tel', placeholder: '+998 99 111 22 33', required: true },
    { key: 'educationLevel', label: 'Маълумот даражаси', type: 'select', options: ['Олий', 'Ўрта махсус', 'Ўрта', 'Тугалланмаган олий'], required: true },
    { key: 'education', label: 'Таълим муассасаси', type: 'text', placeholder: 'Масалан: Тошкент коллежи', required: false },
    { key: 'hireDate', label: 'Ишга кирган сана', type: 'date', required: true },
    { key: 'shift', label: 'Иш смена', type: 'select', options: ['Кундузги', 'Кечки', 'Тунги'], required: false },
  ],
  'Ҳайдовчи': [
    { key: 'organization', label: 'Ташкилот', type: 'select', options: ['PPS', 'IPS', 'PPHS-II'], required: true },
    { key: 'birthDate', label: 'Туғилган санаси', type: 'date', required: true },
    { key: 'phone', label: 'Телефон рақами', type: 'tel', placeholder: '+998 91 777 88 99', required: true },
    { key: 'licenseCategory', label: 'Ҳайдовчилик гувоҳномаси тоифаси', type: 'text', placeholder: 'Масалан: B, C', required: true },
    { key: 'vehicleType', label: 'Транспорт тури', type: 'text', placeholder: 'Масалан: Nexia 3', required: false },
    { key: 'region', label: 'Хизмат кўрсатувчи ҳудуд', type: 'select', options: ['Тошкент', 'Тошкент вилояти', 'Самарқанд', 'Бухоро', 'Наманган', 'Андижон', 'Фарғона', 'Қашқадарё', 'Сурхондарё', 'Навоий', 'Жиззах', 'Сирдарё', 'Хоразм', 'Қорақалпоғистон'], required: true },
    { key: 'hireDate', label: 'Ишга кирган сана', type: 'date', required: true },
  ],
  'Таҳлилчи': [
    { key: 'organization', label: 'Ташкилот', type: 'select', options: ['PPS', 'IPS', 'PPHS-II'], required: true },
    { key: 'birthDate', label: 'Туғилган санаси', type: 'date', required: true },
    { key: 'phone', label: 'Телефон рақами', type: 'tel', placeholder: '+998 97 333 44 55', required: true },
    { key: 'educationLevel', label: 'Маълумот даражаси', type: 'select', options: ['Олий', 'Ўрта махсус', 'Ўрта', 'Тугалланмаган олий'], required: true },
    { key: 'education', label: 'Таълим муассасаси', type: 'text', placeholder: 'Масалан: ТАТУ', required: false },
    { key: 'specialty', label: 'Мутахассислик', type: 'text', placeholder: 'Масалан: Иқтисодчи', required: false },
    { key: 'hireDate', label: 'Ишга кирган сана', type: 'date', required: true },
    { key: 'software', label: 'Ишлатадиган дастурлар', type: 'text', placeholder: 'Масалан: Excel, 1C, Power BI', required: false },
  ],
  'Администратор': [
    { key: 'organization', label: 'Ташкилот', type: 'select', options: ['PPS', 'IPS', 'PPHS-II'], required: true },
    { key: 'birthDate', label: 'Туғилган санаси', type: 'date', required: true },
    { key: 'phone', label: 'Телефон рақами', type: 'tel', placeholder: '+998 90 222 33 44', required: true },
    { key: 'educationLevel', label: 'Маълумот даражаси', type: 'select', options: ['Олий', 'Ўрта махсус', 'Ўрта', 'Тугалланмаган олий'], required: true },
    { key: 'education', label: 'Таълим муассасаси', type: 'text', placeholder: 'Масалан: ТошДУ', required: false },
    { key: 'hireDate', label: 'Ишга кирган сана', type: 'date', required: true },
    { key: 'currentPosition', label: 'Ҳозирги лавозим', type: 'text', placeholder: 'Масалан: Бош администратор', required: false },
  ],
}

const PAGE = {
  minHeight: '100vh',
  background: 'linear-gradient(160deg, #0D47A1 0%, #1976D2 60%, #42A5F5 100%)',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  padding: '16px 12px 40px',
  fontFamily: "'Segoe UI', Tahoma, sans-serif",
  boxSizing: 'border-box',
}

const CARD = {
  background: '#fff',
  borderRadius: 20,
  padding: '24px 20px',
  width: '100%',
  maxWidth: 480,
  boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
  boxSizing: 'border-box',
}

const INPUT = {
  width: '100%',
  padding: '14px 16px',
  border: '1.5px solid #E0E0E0',
  borderRadius: 12,
  fontSize: 16,
  fontFamily: 'inherit',
  outline: 'none',
  background: '#FAFAFA',
  boxSizing: 'border-box',
  color: '#1A1A2E',
  WebkitAppearance: 'none',
  appearance: 'none',
}

const LBL = {
  fontSize: 12,
  fontWeight: 700,
  color: '#888',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  marginBottom: 6,
  display: 'block',
}

const BTN = (bg, disabled) => ({
  width: '100%',
  padding: '16px',
  background: disabled ? '#E0E0E0' : bg,
  color: '#fff',
  border: 'none',
  borderRadius: 14,
  fontWeight: 700,
  fontSize: 16,
  cursor: disabled ? 'not-allowed' : 'pointer',
  marginTop: 20,
  fontFamily: 'inherit',
  WebkitTapHighlightColor: 'transparent',
  touchAction: 'manipulation',
})

export default function Register() {
  const [step, setStep] = useState(1)
  const [role, setRole] = useState('')
  const [name, setName] = useState('')
  const [formData, setFormData] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fields = FIELDS[role] || []
  const roleInfo = ROLES.find(r => r.value === role)

  function handleFieldChange(key, value) {
    setFormData(p => ({ ...p, [key]: value }))
    setError('')
  }

  async function handleSubmit() {
    const missing = fields.filter(f => f.required && !formData[f.key])
    if (missing.length > 0) {
      setError(`Тўлдиринг: ${missing.map(f => f.label).join(', ')}`)
      window.scrollTo(0, document.body.scrollHeight)
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
        data: { ...rest, organization: organization || '' },
      })
      setStep(4)
      window.scrollTo(0, 0)
    } catch (e) {
      setError('Хатолик: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  if (step === 1) return (
    <div style={{ ...PAGE, alignItems: 'center' }}>
      <div style={CARD}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: 'linear-gradient(135deg,#1565C0,#42A5F5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 12px' }}>💊</div>
          <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 900, color: '#1A1A2E' }}>ПрофиКлуб CRM</h1>
          <p style={{ margin: 0, fontSize: 14, color: '#888', lineHeight: 1.5 }}>Тизимга қўшилиш учун лавозимингизни танланг</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {ROLES.map(r => (
            <button key={r.value} onClick={() => { setRole(r.value); setStep(2) }}
              style={{ background: r.bg, border: `2px solid ${r.bg}`, borderRadius: 14, padding: '16px 10px', cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit', WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}>
              <div style={{ fontSize: 26, marginBottom: 6 }}>{r.label.split(' ')[0]}</div>
              <div style={{ fontWeight: 700, fontSize: 13, color: r.color, lineHeight: 1.3 }}>{r.label.split(' ').slice(1).join(' ')}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  if (step === 2) return (
    <div style={{ ...PAGE, alignItems: 'center' }}>
      <div style={CARD}>
        <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 14, marginBottom: 20, padding: 0, display: 'flex', alignItems: 'center', gap: 6, WebkitTapHighlightColor: 'transparent' }}>
          ← Орқага
        </button>
        <div style={{ background: roleInfo?.bg, borderRadius: 10, padding: '8px 14px', marginBottom: 20, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: roleInfo?.color }}>{roleInfo?.label}</span>
        </div>
        <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 900, color: '#1A1A2E' }}>Исм-фамилияингиз</h2>
        <p style={{ margin: '0 0 20px', fontSize: 14, color: '#888' }}>Кирилл ҳарфларида тўлиқ ёзинг</p>
        <label style={LBL}>Тўлиқ исм-фамилия *</label>
        <input
          value={name}
          onChange={e => { setName(e.target.value); setError('') }}
          placeholder="Масалан: Каримов Акбар Тўлқинович"
          style={{ ...INPUT }}
          autoComplete="name"
          autoFocus
        />
        <div style={{ fontSize: 12, color: '#aaa', marginTop: 6 }}>💡 Аввал фамилия, кейин исм ёзинг</div>
        {error && <div style={{ color: '#C62828', fontSize: 13, marginTop: 10 }}>{error}</div>}
        <button onClick={() => { if (name.trim()) { setStep(3) } else { setError('Исм-фамилия киритинг') } }}
          style={BTN(`linear-gradient(135deg, ${roleInfo?.color}, #42A5F5)`, !name.trim())}>
          Давом этиш →
        </button>
      </div>
    </div>
  )

  if (step === 3) return (
    <div style={PAGE}>
      <div style={CARD}>
        <button onClick={() => setStep(2)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 14, marginBottom: 16, padding: 0, display: 'flex', alignItems: 'center', gap: 6, WebkitTapHighlightColor: 'transparent' }}>
          ← Орқага
        </button>
        <div style={{ background: roleInfo?.bg, borderRadius: 10, padding: '8px 14px', marginBottom: 12, display: 'inline-flex', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: roleInfo?.color }}>{roleInfo?.label}</span>
        </div>
        <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 900, color: '#1A1A2E' }}>{name}</h2>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: '#888' }}>* белгили майдонларни тўлдириш мажбурий</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {fields.map(f => (
            <div key={f.key}>
              <label style={LBL}>
                {f.label} {f.required ? <span style={{ color: '#C62828' }}>*</span> : <span style={{ color: '#bbb', fontWeight: 400, fontSize: 11, textTransform: 'none' }}>(ихтиёрий)</span>}
              </label>
              {f.type === 'select' ? (
                <div style={{ position: 'relative' }}>
                  <select value={formData[f.key] || ''} onChange={e => handleFieldChange(f.key, e.target.value)}
                    style={{ ...INPUT, paddingRight: 40 }}>
                    <option value=''>— Танланг —</option>
                    {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#888', fontSize: 12 }}>▼</span>
                </div>
              ) : (
                <div>
                  <input
                    type={f.type}
                    inputMode={f.type === 'tel' ? 'tel' : f.type === 'number' ? 'numeric' : 'text'}
                    value={formData[f.key] || ''}
                    onChange={e => handleFieldChange(f.key, e.target.value)}
                    placeholder={f.placeholder || ''}
                    style={INPUT}
                    autoComplete={f.type === 'tel' ? 'tel' : 'off'}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {error && (
          <div style={{ background: '#FFEBEE', border: '1.5px solid #FFCDD2', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#C62828', marginTop: 20, lineHeight: 1.5 }}>
            ⚠️ {error}
          </div>
        )}

        <button onClick={handleSubmit} disabled={saving}
          style={BTN(`linear-gradient(135deg, ${roleInfo?.color || '#1565C0'}, #42A5F5)`, saving)}>
          {saving ? '⏳ Юборилмоқда...' : '✅ Маълумотларни юбориш'}
        </button>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#bbb', marginTop: 14, marginBottom: 0, lineHeight: 1.5 }}>
          Маълумотларингиз ПрофиКлуб CRM тизимига сақланади
        </p>
      </div>
    </div>
  )

  return (
    <div style={{ ...PAGE, alignItems: 'center' }}>
      <div style={{ ...CARD, textAlign: 'center' }}>
        <div style={{ fontSize: 70, marginBottom: 16 }}>✅</div>
        <h2 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 900, color: '#1A1A2E' }}>Муваффақиятли!</h2>
        <p style={{ margin: '0 0 20px', fontSize: 15, color: '#555', lineHeight: 1.6 }}>
          <strong>{name}</strong>, маълумотларингиз тизимга қўшилди.
        </p>
        <div style={{ background: '#F0F4FF', borderRadius: 14, padding: '16px', marginBottom: 20, textAlign: 'left' }}>
          <div style={{ fontSize: 13, color: '#1565C0', fontWeight: 700, marginBottom: 4 }}>📋 Кейинги қадам</div>
          <div style={{ fontSize: 13, color: '#555', lineHeight: 1.6 }}>Администратор маълумотларингизни текшириши мумкин. Хатолик бўлса тузатади.</div>
        </div>
        <button onClick={() => { setStep(1); setRole(''); setName(''); setFormData({}); setError('') }}
          style={{ background: '#E8F5E9', color: '#2E7D32', border: '1.5px solid #A5D6A7', borderRadius: 12, padding: '14px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', width: '100%', WebkitTapHighlightColor: 'transparent' }}>
          Бошқа ходим қўшиш
        </button>
      </div>
    </div>
  )
}
