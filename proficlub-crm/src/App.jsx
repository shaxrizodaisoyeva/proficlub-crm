import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  fetchEmployees, createEmployee, updateEmployee, deleteEmployee, fetchEmployeesWithId,
  fetchTrainings, createTraining, deleteTraining, saveBulkExamResults,
  fetchSessions, createSession, deleteSession, saveSessionParticipants,
  fetchPraktikum, createPraktikum, updatePraktikum, deletePraktikum,
  addPraktikumParticipant, updatePraktikumParticipant, removePraktikumParticipant,
  fetchSales, uploadSalesBatch, deleteSalesByFilter, deleteAllSales, deleteAllPlanFakt,
  fetchPlanFakt, uploadPlanFaktBatch,
  uploadSalesMapping, fetchSalesMapping, updateSalesMappingRow, updateEmployeeSalesStats,
} from './lib/db'
import { supabase } from './lib/supabase'


const ROLES = ['Менежер','Савдо вакили','Оператор','Ҳайдовчи','Таҳлилчи','Администратор']
const ROLE_COLORS = {
  'Менежер':       { bg:'#E8F4FD', text:'#1565C0', dot:'#1976D2' },
  'Савдо вакили':  { bg:'#E8F5E9', text:'#2E7D32', dot:'#388E3C' },
  'Оператор':      { bg:'#F3E5F5', text:'#6A1B9A', dot:'#8E24AA' },
  'Ҳайдовчи':      { bg:'#FFF3E0', text:'#E65100', dot:'#F57C00' },
  'Таҳлилчи':      { bg:'#E0F2F1', text:'#00695C', dot:'#00897B' },
  'Администратор': { bg:'#FCE4EC', text:'#880E4F', dot:'#C2185B' },
}
const ROLE_FIELDS = {
  'Менежер': [
    { key:'organization',  label:'Ташкилот',                      type:'text' },
    { key:'birthDate',     label:'Туғилган санаси',               type:'date' },
    { key:'educationLevel',label:'Маълумоти',                     type:'text' },
    { key:'education',     label:'Таълим муассасаси',             type:'text' },
    { key:'specialty',     label:'Дипломдаги мутахассислик',      type:'text' },
    { key:'courses',       label:'Курслар / малака ошириш',       type:'text' },
    { key:'hireDate',      label:'Иш бошлаган сана',              type:'date' },
    { key:'sales6Month',   label:'Охирги 6 ой савдо (сўм)',       type:'text' },
    { key:'planPercent',   label:'Савдо режаси (%)',              type:'text' },
    { key:'promoList',     label:'Промоция дорилар (Excel)',       type:'excel' },
    { key:'teamSize',      label:'Жамоасидаги ходимлар сони',     type:'text' },
    { key:'staffTurnover', label:'Ходимлар алмашуви',             type:'text' },
  ],
   'Савдо вакили': [
    { key:'organization',  label:'Ташкилот',                      type:'text' },
    { key:'birthDate',     label:'Туғилган санаси',               type:'date' },
    { key:'educationLevel',label:'Маълумоти',                     type:'text' },
    { key:'education',     label:'Таълим муассасаси',             type:'text' },
    { key:'specialty',     label:'Дипломдаги мутахассислик',      type:'text' },
    { key:'courses',       label:'Курслар / малака ошириш',       type:'text' },
    { key:'hireDate',      label:'Иш бошлаган сана',              type:'date' },
    { key:'sales6Month',   label:'Охирги 6 ой савдо (сўм)',       type:'text' },
  ],
  'Оператор': [
    { key:'birthDate',       label:'Туғилган санаси',             type:'date' },
    { key:'education',       label:'Таълим муассасаси',           type:'text' },
    { key:'specialty',       label:'Дипломдаги мутахассислик',    type:'text' },
    { key:'courses',         label:'Курслар / малака ошириш',     type:'textarea' },
    { key:'hireDate',        label:'Иш бошлаган сана',            type:'date' },
    { key:'currentPosition', label:'Ҳозирги лавозими',           type:'text' },
    { key:'shift',           label:'Иш смена',                    type:'text' },
  ],
  'Ҳайдовчи': [
    { key:'birthDate',       label:'Туғилган санаси',             type:'date' },
    { key:'education',       label:'Таълим муассасаси',           type:'text' },
    { key:'hireDate',        label:'Иш бошлаган сана',            type:'date' },
    { key:'licenseCategory', label:'Ҳайдовчилик гувоҳномаси',    type:'text' },
    { key:'vehicleType',     label:'Транспорт тури',              type:'text' },
    { key:'region',          label:'Хизмат кўрсатувчи ҳудуд',    type:'text' },
  ],
  'Таҳлилчи': [
    { key:'birthDate',   label:'Туғилган санаси',                 type:'date' },
    { key:'education',   label:'Таълим муассасаси',               type:'text' },
    { key:'specialty',   label:'Дипломдаги мутахассислик',        type:'text' },
    { key:'courses',     label:'Курслар / малака ошириш',         type:'textarea' },
    { key:'hireDate',    label:'Иш бошлаган сана',                type:'date' },
    { key:'software',    label:'Ишлатадиган дастурлар',           type:'text' },
    { key:'reportType',  label:'Тайёрлайдиган ҳисоботлар',       type:'textarea' },
  ],
  'Администратор': [
    { key:'birthDate',       label:'Туғилган санаси',             type:'date' },
    { key:'education',       label:'Таълим муассасаси',           type:'text' },
    { key:'specialty',       label:'Дипломдаги мутахассислик',    type:'text' },
    { key:'courses',         label:'Курслар / малака ошириш',     type:'textarea' },
    { key:'hireDate',        label:'Иш бошлаган сана',            type:'date' },
    { key:'initialPosition', label:'Бошланғич лавозим',          type:'text' },
    { key:'currentPosition', label:'Ҳозирги лавозим',            type:'text' },
  ],
}

const FIRM_COLORS = {
  'PPS':     { bg:'#E3F2FD', text:'#0D47A1', border:'#90CAF9', dot:'#1565C0' },
  'IPS':     { bg:'#E8F5E9', text:'#1B5E20', border:'#A5D6A7', dot:'#2E7D32' },
  'PPHS-II': { bg:'#FFF3E0', text:'#E65100', border:'#FFCC80', dot:'#F57C00' },
}

function FirmBadge({ firm }) {
  if (!firm) return null
  const c = FIRM_COLORS[firm] || { bg:'#F5F5F5', text:'#555', border:'#E0E0E0', dot:'#999' }
  return (
    <span style={{ background:c.bg, color:c.text, border:`1.5px solid ${c.border}`, borderRadius:20, padding:'2px 10px', fontSize:10, fontWeight:800, display:'inline-flex', alignItems:'center', gap:4 }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:c.dot }} />{firm}
    </span>
  )
}

const scoreColor = s => !s && s !== 0 ? '#aaa' : s >= 85 ? '#2E7D32' : s >= 60 ? '#F57C00' : '#C62828'
const scoreBg    = s => !s && s !== 0 ? '#f0f0f0' : s >= 85 ? '#E8F5E9' : s >= 60 ? '#FFF8E1' : '#FFEBEE'

function Badge({ role }) {
  const c = ROLE_COLORS[role] || { bg:'#f0f0f0', text:'#555', dot:'#999' }
  return (
    <span style={{ background:c.bg, color:c.text, borderRadius:20, padding:'2px 10px', fontSize:11, fontWeight:700, display:'inline-flex', alignItems:'center', gap:4 }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:c.dot }} />{role}
    </span>
  )
}
function Avatar({ name, size = 40 }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()
  const hue = (name.charCodeAt(0)*37 + (name.charCodeAt(1)||0)*13) % 360
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:`hsl(${hue},52%,52%)`, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:size*0.35, flexShrink:0 }}>
      {initials}
    </div>
  )
}
function ScorePill({ score, passed }) {
  if (score == null) return null
  return <span style={{ background:scoreBg(score), color:scoreColor(score), borderRadius:20, padding:'2px 10px', fontSize:12, fontWeight:800 }}>{score}/100 {passed ? '✓' : '✗'}</span>
}
function MiniBar({ value, max, color }) {
  const pct = max > 0 ? Math.round((value/max)*100) : 0
  return <div style={{ flex:1, height:8, background:'#F0F0F0', borderRadius:4, overflow:'hidden' }}><div style={{ width:`${pct}%`, height:'100%', background:color, borderRadius:4 }} /></div>
}
function Spinner() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', minHeight:200 }}>
      <div style={{ width:36, height:36, border:'4px solid #E3F2FD', borderTop:'4px solid #1976D2', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
function Toast({ msg, type = 'success' }) {
  const bg = type === 'error' ? '#C62828' : '#2E7D32'
  return (
    <div style={{ position:'fixed', bottom:24, right:24, background:bg, color:'#fff', padding:'12px 20px', borderRadius:10, fontWeight:700, fontSize:14, zIndex:9999, boxShadow:'0 4px 16px rgba(0,0,0,0.2)', animation:'slideUp 0.3s ease' }}>
      {type === 'error' ? '❌ ' : '✅ '}{msg}
      <style>{`@keyframes slideUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  )
}

const SI   = { width:'100%', padding:'8px 12px', border:'1.5px solid #E0E0E0', borderRadius:8, fontSize:13, fontFamily:'inherit', outline:'none', background:'#FAFAFA', boxSizing:'border-box' }
const BTN  = (bg, color='#fff', extra={}) => ({ padding:'8px 16px', background:bg, color, border:'none', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:13, ...extra })
const CARD = { background:'#fff', borderRadius:14, padding:'18px 20px', boxShadow:'0 2px 10px rgba(0,0,0,0.06)', marginBottom:14 }
const LBL  = { fontSize:11, fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:0.5, marginBottom:5, display:'block' }

function DonutChart({ passed, failed }) {
  const total = passed + failed
  if (!total) return <div style={{ width:80, height:80, borderRadius:'50%', background:'#F0F0F0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#aaa' }}>—</div>
  const pct = passed/total, r=32, circ=2*Math.PI*r
  return (
    <div style={{ position:'relative', width:80, height:80 }}>
      <svg width={80} height={80} viewBox="0 0 80 80">
        <circle cx={40} cy={40} r={r} fill="none" stroke="#FFEBEE" strokeWidth={12} />
        <circle cx={40} cy={40} r={r} fill="none" stroke="#4CAF50" strokeWidth={12}
          strokeDasharray={`${circ*pct} ${circ}`} strokeDashoffset={circ*0.25} strokeLinecap="round" />
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <div style={{ fontSize:16, fontWeight:900, color:'#2E7D32' }}>{Math.round(pct*100)}%</div>
        <div style={{ fontSize:9, color:'#888' }}>ўтди</div>
      </div>
    </div>
  )
}

// ── PRAKTIKUM DASHBOARD ───────────────────────────────────────────────────────

async function exportTrainingsExcel(trainingsList, sessionsList, employees, filterType = 'all', selectedIds = [], showToast) {
  try {
    const XLSX = await import('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm')
    let targets = trainingsList
    let fileNameToken = 'barcha_treninglar'
    if (filterType === 'single' && selectedIds.length > 0) {
      targets = trainingsList.filter(t => t.id === selectedIds[0])
      fileNameToken = targets[0]?.title?.replace(/\s+/g,'_') || 'trening'
    } else if (filterType === 'multi' && selectedIds.length > 0) {
      targets = trainingsList.filter(t => selectedIds.includes(t.id))
      fileNameToken = 'tanlangan_treninglar'
    }

    // Fetch sessions for these trainings
    const { data: allSessions } = await supabase
      .from('sessions')
      .select('*, session_participants(*, employees(name, role))')
      .in('training_id', targets.map(t => t.id))

    const excelRows = employees.map(emp => {
      const row = {
        'Ходим': emp.name,
        'Лавозим': emp.role,
        'Ташкилот': emp.organization || '—',
      }
      let totalAttended = 0
      targets.forEach(t => {
        const tSessions = (allSessions || []).filter(s => s.training_id === t.id)
        const attended = tSessions.some(s =>
          (s.session_participants || []).some(p => p.employee_id === emp.id)
        )
        row[t.title] = attended ? '✓ Қатнашди' : '✗ Қатнашмади'
        if (attended) totalAttended++
      })
      row['Жами'] = totalAttended + ' / ' + targets.length
      return row
    })

    // Summary sheet
    const summaryRows = targets.map(t => {
      const tSessions = (allSessions || []).filter(s => s.training_id === t.id)
      const attendedIds = new Set()
      tSessions.forEach(s => (s.session_participants || []).forEach(p => attendedIds.add(p.employee_id)))
      return {
        'Тренинг': t.title,
        'Сана': t.date,
        'Иштирокчилар сони': attendedIds.size,
        'Жами ходимлар': employees.length,
        'Фоиз': employees.length > 0 ? Math.round(attendedIds.size / employees.length * 100) + '%' : '0%'
      }
    })

    const wb = XLSX.utils.book_new()
    const ws1 = XLSX.utils.json_to_sheet(excelRows)
    ws1['!cols'] = [{ wch: 28 }, { wch: 16 }, { wch: 12 }, ...targets.map(() => ({ wch: 20 })), { wch: 10 }]
    XLSX.utils.book_append_sheet(wb, ws1, 'Давомат')

    const ws2 = XLSX.utils.json_to_sheet(summaryRows)
    XLSX.utils.book_append_sheet(wb, ws2, 'Хулоса')

    XLSX.writeFile(wb, `davomat_${fileNameToken}_${new Date().toISOString().split('T')[0]}.xlsx`)
    if (showToast) showToast('Excel юкланди!')
  } catch(e) {
    if (showToast) showToast('Хатолик: ' + e.message, 'error')
  }
}

async function exportPraktikumExcel(prak, showToast) {
  try {
    const XLSX = await import('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm');
    const participants = prak.praktikum_participants || [];
    const rows = participants.map((p, idx) => {
      const emp = p.employees || {};
      return {
        'Т/р': idx + 1,
        'Иштирокчи Исми': emp.name || '—',
        'Лавозими': emp.role || '—',
        'Ташкилот': emp.organization || '—',
        'Балл': p.grade != null ? p.grade : 'Баҳоланмаган',
        'Ҳолати': p.star ? '⭐ Актив Практикумда' : 'Чиқди',
        'Фидбек': p.feedback || '—'
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Практикум Иштирокчилари');
    XLSX.writeFile(wb, `praktikum_${prak.title.toLowerCase().replace(/\s+/g, '_')}_hisobot.xlsx`);
    if (showToast) showToast('Практикум Excel жадвали юкланди!');
  } catch (e) { if (showToast) showToast('Хатолик юз берди: ' + e.message, 'error'); }
}

async function exportDashboardToPDF(elementId, titleToken = 'Dashboard') {
  const element = document.getElementById(elementId);
  if (!element) return;
  try {
    const html2pdf = (await import('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js')).default;
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `dashboard_${titleToken.toLowerCase().replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };
    html2pdf().set(opt).from(element).save();
  } catch (err) { window.print(); }
}

function PraktikumDashboard({ prak, employees, onDelete, onEdit, onRefresh, showToast, onShowQR }) {
  const [addingEmp, setAddingEmp] = useState(false)
  const [empSearch, setEmpSearch] = useState('')
  const [editingP, setEditingP]   = useState(null) // participant being edited

  const participants = prak.praktikum_participants || []
  const starCount    = participants.filter(p => p.star).length

  async function handleAddParticipant(empId) {
    try {
      await addPraktikumParticipant(prak.id, empId)
      await onRefresh()
      showToast('Иштирокчи қўшилди')
    } catch(e) { showToast('Хатолик: ' + e.message, 'error') }
  }

  async function handleRemoveParticipant(id) {
    try {
      await removePraktikumParticipant(id)
      await onRefresh()
      showToast('Иштирокчи ўчирилди')
    } catch(e) { showToast('Хатолик: ' + e.message, 'error') }
  }

  async function handleUpdateParticipant(id, fields) {
    try {
      await updatePraktikumParticipant(id, fields)
      await onRefresh()
      setEditingP(null)
      showToast('Сақланди')
    } catch(e) { showToast('Хатолик: ' + e.message, 'error') }
  }

  async function handleUploadHomework(participantId, file) {
    if (!file) return
    try {
      const ext = file.name.split('.').pop()
      const path = `praktikum/${prak.id}/${participantId}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('training-materials').upload(path, file)
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage.from('training-materials').getPublicUrl(path)
      await updatePraktikumParticipant(participantId, {
        homework_url: publicUrl,
        homework_name: file.name,
        submitted_at: new Date().toISOString(),
      })
      await onRefresh()
      showToast(`${file.name} юкланди`)
    } catch(e) { showToast('Хатолик: ' + e.message, 'error') }
  }

  const alreadyIds = participants.map(p => p.employee_id)
  const availableEmps = employees.filter(e =>
    !alreadyIds.includes(e.id) &&
    e.name.toLowerCase().includes(empSearch.toLowerCase())
  )

  return (
    <div id={`praktikum-container-pane-${prak.id}`}>
      {/* Header */}
      <div style={{ ...CARD, borderTop:'4px solid #F59E0B' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:10 }}>
          <div>
            <div style={{ fontSize:11, color:'#F59E0B', fontWeight:700, textTransform:'uppercase', letterSpacing:0.5, marginBottom:4 }}>⭐ Практикум</div>
            <h2 style={{ margin:'0 0 4px', fontSize:20 }}>{prak.title}</h2>
            <div style={{ fontSize:12, color:'#888' }}>{prak.date} · {participants.length} иштирокчи · {starCount} ⭐</div>
            {prak.description && <div style={{ fontSize:13, color:'#555', marginTop:6 }}>{prak.description}</div>}
          </div>
          <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
            <button onClick={()=>setAddingEmp(true)} style={{ ...BTN('#F59E0B') }}>+ Иштирокчи қўшиш</button>
            <button type="button" onClick={() => exportPraktikumExcel(prak, showToast)} style={{ ...BTN('#388E3C'), marginLeft: 6 }}>
              📥 Excel Журнал
            </button>
            <button type="button" onClick={() => exportDashboardToPDF(`praktikum-container-pane-${prak.id}`, prak.title)} style={{ ...BTN('#7B1FA2'), marginLeft: 6 }}>
              📄 PDF Ҳисобот
            </button>
            <button onClick={()=>onEdit(prak)} style={{ ...BTN('#F0F4FF','#1565C0'), border:'1.5px solid #BBDEFB' }}>✏️ Таҳрирлаш</button>
            <button onClick={()=>onDelete(prak.id)} style={{ ...BTN('#FFEBEE','#C62828'), border:'1.5px solid #FFCDD2' }}>🗑️</button>
            <button onClick={()=>onShowQR && onShowQR(prak)} style={{ ...BTN('#1B5E20') }}>📲 QR Давомат</button>
          </div>
        </div>
      </div>

      {(() => {
        const graded = participants.filter(p => p.grade != null && p.grade >= 60)
        const top3 = [...graded].sort((a,b) => b.grade - a.grade).slice(0,3)
        const avg = graded.length ? Math.round(graded.reduce((s,p)=>s+p.grade,0)/graded.length) : null
        if (!participants.length) return null
        return (
          <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
            <div style={{ ...CARD, marginBottom:0, flex:1, minWidth:120 }}>
              <div style={{ fontSize:11, color:'#888', fontWeight:700, textTransform:'uppercase', marginBottom:4 }}>Иштирокчилар</div>
              <div style={{ fontSize:26, fontWeight:900 }}>{participants.length}</div>
              <div style={{ fontSize:11, color:'#aaa' }}>{participants.filter(p=>p.star).length} ⭐ фаол</div>
            </div>
            <div style={{ ...CARD, marginBottom:0, flex:1, minWidth:120 }}>
              <div style={{ fontSize:11, color:'#888', fontWeight:700, textTransform:'uppercase', marginBottom:4 }}>Ўртача балл</div>
              <div style={{ fontSize:26, fontWeight:900, color:avg?scoreColor(avg):'#ccc' }}>{avg??'—'}</div>
              <div style={{ fontSize:11, color:'#aaa' }}>{graded.length} та баҳоланган</div>
            </div>
            {top3.length > 0 && (
              <div style={{ ...CARD, marginBottom:0, flex:2, minWidth:200 }}>
                <div style={{ fontSize:11, color:'#888', fontWeight:700, textTransform:'uppercase', marginBottom:10 }}>🥇 Top 3</div>
                {top3.map((p,i)=>{
                  const emp = p.employees
                  if (!emp) return null
                  return (
                    <div key={p.id} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                      <span style={{ width:20, height:20, borderRadius:'50%', background:['#FFD700','#C0C0C0','#CD7F32'][i], display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:'#fff', flexShrink:0 }}>{i+1}</span>
                      <Avatar name={emp.name} size={24} />
                      <span style={{ flex:1, fontSize:12, fontWeight:600 }}>{emp.name}</span>
                      <span style={{ background:scoreBg(p.grade), color:scoreColor(p.grade), borderRadius:20, padding:'2px 8px', fontSize:12, fontWeight:800 }}>{p.grade}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
}      )()}

      {/* Participants */}
      {participants.length === 0 ? (
        <div style={{ ...CARD, textAlign:'center', color:'#aaa', padding:40 }}>
          <div style={{ fontSize:36, marginBottom:10 }}>⭐</div>
          <div style={{ marginBottom:12 }}>Ҳали иштирокчи йўқ</div>
          <button onClick={()=>setAddingEmp(true)} style={BTN('#F59E0B')}>+ Иштирокчи қўшиш</button>
        </div>
      ) : participants.map(p => {
        const emp = p.employees
        if (!emp) return null
        const isEditing = editingP?.id === p.id
        return (
          <div key={p.id} style={{ ...CARD, borderLeft:`4px solid ${p.star ? '#F59E0B' : '#E0E0E0'}` }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
              <div style={{ position:'relative' }}>
                <Avatar name={emp.name} size={40} />
                {p.star && <span style={{ position:'absolute', top:-4, right:-4, fontSize:14 }}>⭐</span>}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:6 }}>
                  <span style={{ fontWeight:800, fontSize:14 }}>{emp.name}</span>
                  <Badge role={emp.role} />
                  {emp.organization && <FirmBadge firm={emp.organization} />}
                  {p.grade != null && <span style={{ background:scoreBg(p.grade), color:scoreColor(p.grade), borderRadius:20, padding:'2px 10px', fontSize:12, fontWeight:800 }}>{p.grade} балл</span>}
                </div>

                {/* Homework */}
                {p.homework_url ? (
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                    <a href={p.homework_url} target="_blank" rel="noreferrer" style={{ fontSize:12, color:'#1976D2', fontWeight:700, textDecoration:'none' }}>📎 {p.homework_name || 'Уй вазифаси'}</a>
                    <span style={{ fontSize:11, color:'#888' }}>{p.submitted_at ? new Date(p.submitted_at).toLocaleDateString() : ''}</span>
                  </div>
                ) : (
                  <div style={{ fontSize:12, color:'#aaa', marginBottom:6 }}>📭 Уй вазифаси юборилмаган</div>
                )}

                {/* Feedback */}
                {p.feedback && !isEditing && (
                  <div style={{ background:'#F8F9FA', borderRadius:8, padding:'7px 10px', fontSize:13, color:'#555', marginBottom:6 }}>
                    💬 {p.feedback}
                  </div>
                )}

                {/* Edit form */}
                {isEditing && (
                  <div style={{ background:'#F8F9FA', borderRadius:10, padding:12, marginBottom:8 }}>
                    <div style={{ display:'flex', gap:8, marginBottom:8, flexWrap:'wrap' }}>
                      <div style={{ flex:1 }}>
                        <label style={LBL}>Балл (0–100)</label>
                        <input type="number" min="0" max="100"
                          defaultValue={editingP.grade ?? ''}
                          onChange={e=>setEditingP(p=>({...p, grade: e.target.value ? Number(e.target.value) : null}))}
                          style={{ ...SI }} />
                      </div>
                      <div style={{ flex:1 }}>
                        <label style={LBL}>⭐ Ҳолати</label>
                        <select
                          defaultValue={editingP.star ? 'yes' : 'no'}
                          onChange={e=>setEditingP(p=>({...p, star: e.target.value === 'yes'}))}
                          style={{ ...SI }}>
                          <option value="yes">⭐ Практикумда</option>
                          <option value="no">Практикумдан чиқди</option>
                        </select>
                      </div>
                    </div>
                    <label style={LBL}>Изоҳ / Фидбек</label>
                    <textarea
                      defaultValue={editingP.feedback ?? ''}
                      onChange={e=>setEditingP(p=>({...p, feedback: e.target.value}))}
                      rows={2} style={{ ...SI, resize:'vertical', marginBottom:8 }} />
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={()=>handleUpdateParticipant(p.id, { grade:editingP.grade, star:editingP.star, feedback:editingP.feedback })}
                        style={{ ...BTN('#388E3C'), flex:1 }}>✅ Сақлаш</button>
                      <button onClick={()=>setEditingP(null)} style={{ ...BTN('#F5F7FA','#555'), flex:1, border:'1.5px solid #ddd' }}>Бекор</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              {!isEditing && (
                <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                  <button onClick={()=>setEditingP({...p})} style={{ ...BTN('#F0F4FF','#1565C0'), border:'1.5px solid #BBDEFB', padding:'5px 10px', fontSize:12 }}>✏️</button>
                  <label style={{ ...BTN('#E8F5E9','#2E7D32'), border:'1.5px solid #A5D6A7', padding:'5px 10px', fontSize:12, cursor:'pointer', textAlign:'center' }}>
                    📎
                    <input type="file" style={{ display:'none' }} onChange={e=>handleUploadHomework(p.id, e.target.files[0])} />
                  </label>
                  <button onClick={()=>handleRemoveParticipant(p.id)} style={{ ...BTN('#FFEBEE','#C62828'), border:'1.5px solid #FFCDD2', padding:'5px 10px', fontSize:12 }}>🗑️</button>
                </div>
              )}
            </div>
          </div>
        )
      })}

      {/* Add participant modal */}
      {addingEmp && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'#fff', borderRadius:16, padding:24, width:'100%', maxWidth:480, maxHeight:'80vh', overflowY:'auto' }}>
            <h3 style={{ margin:'0 0 14px', fontSize:17 }}>Иштирокчи қўшиш</h3>
            <input value={empSearch} onChange={e=>setEmpSearch(e.target.value)} placeholder="🔍 Қидириш..." style={{ ...SI, marginBottom:10 }} />
            <div style={{ maxHeight:300, overflowY:'auto', border:'1.5px solid #E0E0E0', borderRadius:8 }}>
              {availableEmps.length === 0
                ? <div style={{ padding:20, textAlign:'center', color:'#aaa' }}>Топилмади</div>
                : availableEmps.map(e => (
                  <div key={e.id} onClick={()=>{ handleAddParticipant(e.id); setAddingEmp(false); setEmpSearch('') }}
                    style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', cursor:'pointer', borderBottom:'1px solid #F5F5F5' }}
                    onMouseEnter={el=>el.currentTarget.style.background='#EEF4FF'}
                    onMouseLeave={el=>el.currentTarget.style.background='transparent'}>
                    <Avatar name={e.name} size={30} />
                    <div>
                      <div style={{ fontWeight:700, fontSize:13 }}>{e.name}</div>
                      <Badge role={e.role} />
                    </div>
                  </div>
                ))
              }
            </div>
            <button onClick={()=>{ setAddingEmp(false); setEmpSearch('') }} style={{ ...BTN('#F5F7FA','#555'), width:'100%', marginTop:12, border:'1.5px solid #ddd' }}>Бекор</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── SALES REPORT ─────────────────────────────────────────────────────────────
function SalesMappingPage({ showToast }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editVals, setEditVals] = useState({})
  const [filterUnmapped, setFilterUnmapped] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const { data: rows, error } = await supabase
        .from('sales_mapping')
        .select('*')
        .order('region')
        .order('komanda')
      if (error) throw error
      setData(rows || [])
    } catch(e) { showToast('Хатолик: ' + e.message, 'error') }
    finally { setLoading(false) }
  }
  async function handleSave(id) {
    try {
      const isMapped = !!(editVals.crm_menejer?.trim() && editVals.crm_savdo_vakili?.trim())
      await supabase.from('sales_mapping').update({ ...editVals, is_mapped: isMapped }).eq('id', id)

      // Also update sales table
      if (isMapped) {
        const row = data.find(d => d.id === id)
        await supabase.from('sales').update({
          crm_menejer: editVals.crm_menejer,
          crm_savdo_vakili: editVals.crm_savdo_vakili,
          is_mapped: true,
        }).eq('savdo_vakili', row.med_pred).eq('jamoa', row.komanda)
      }

      setEditingId(null)
      await loadData()
      showToast('Сақланди')
    } catch(e) { showToast('Хатолик: ' + e.message, 'error') }
  }

  const displayed = filterUnmapped ? data.filter(d => !d.is_mapped) : data
  const unmappedCount = data.filter(d => !d.is_mapped).length

  if (loading) return <Spinner />

  return (
    <div>
      <div style={{ ...CARD, borderTop:'4px solid #9C27B0' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10, marginBottom:14 }}>
          <div>
            <div style={{ fontWeight:800, fontSize:15 }}>🗂️ Савдо вакиллари мослаштириш</div>
            <div style={{ fontSize:13, color:'#888', marginTop:4 }}>
              Жами: {data.length} та · 
              <span style={{ color:'#C62828', fontWeight:700 }}> {unmappedCount} та мосланмаган</span> · 
              <span style={{ color:'#2E7D32', fontWeight:700 }}> {data.length - unmappedCount} та мосланган</span>
            </div>
          </div>
          <button onClick={() => setFilterUnmapped(p => !p)}
            style={{ ...BTN(filterUnmapped ? '#C62828' : '#F5F7FA', filterUnmapped ? '#fff' : '#555'), border:'1.5px solid #E0E0E0' }}>
            {filterUnmapped ? '🔴 Фақат мосланмаганлар' : 'Барчаси кўрсатиш'}
          </button>
        </div>
      </div>

      <div style={{ ...CARD, padding:0, overflow:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr style={{ background:'#F5F7FA', position:'sticky', top:0 }}>
              {['Ҳудуд','Жамоа','Мед. вакил (файлда)','Йетказиб берувчи','CRM Менежер','CRM Савдо вакили','Ҳолат',''].map(h=>(
                <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontWeight:700, fontSize:10, color:'#888', textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.map(row => {
              const isEditing = editingId === row.id
              const bg = row.is_mapped ? 'transparent' : 'rgba(239,83,80,0.06)'
              return (
                <tr key={row.id} style={{ borderTop:'1px solid #F0F0F0', background: isEditing ? '#FFFDE7' : bg }}>
                  <td style={{ padding:'8px 12px', color:'#555' }}>{row.region}</td>
                  <td style={{ padding:'8px 12px', fontWeight:600 }}>{row.komanda}</td>
                  <td style={{ padding:'8px 12px' }}>{row.med_pred}</td>
                  <td style={{ padding:'8px 12px', color:'#888' }}>{row.postavshik}</td>
                  <td style={{ padding:'8px 12px' }}>
                    {isEditing
                      ? <input value={editVals.crm_menejer || ''} onChange={e=>setEditVals(p=>({...p, crm_menejer: e.target.value}))}
                          style={{ ...SI, fontSize:12 }} placeholder="Менежер исм-фамилияси" />
                      : <span style={{ color: row.crm_menejer ? '#1A1A2E' : '#C62828', fontStyle: row.crm_menejer ? 'normal' : 'italic' }}>
                          {row.crm_menejer || 'Киритилмаган'}
                        </span>
                    }
                  </td>
                  <td style={{ padding:'8px 12px' }}>
                    {isEditing
                      ? <input value={editVals.crm_savdo_vakili || ''} onChange={e=>setEditVals(p=>({...p, crm_savdo_vakili: e.target.value}))}
                          style={{ ...SI, fontSize:12 }} placeholder="Савдо вакили исм-фамилияси" />
                      : <span style={{ color: row.crm_savdo_vakili ? '#1A1A2E' : '#C62828', fontStyle: row.crm_savdo_vakili ? 'normal' : 'italic' }}>
                          {row.crm_savdo_vakili || 'Киритилмаган'}
                        </span>
                    }
                  </td>
                  <td style={{ padding:'8px 12px' }}>
                    <span style={{ background: row.is_mapped ? '#E8F5E9' : '#FFEBEE', color: row.is_mapped ? '#2E7D32' : '#C62828', borderRadius:6, padding:'2px 8px', fontSize:11, fontWeight:700 }}>
                      {row.is_mapped ? '✓ Мосланган' : '✗ Мосланмаган'}
                    </span>
                  </td>
                  <td style={{ padding:'8px 12px' }}>
                    {isEditing
                      ? <div style={{ display:'flex', gap:4 }}>
                          <button onClick={() => handleSave(row.id)} style={{ ...BTN('#388E3C'), padding:'4px 10px', fontSize:11 }}>✅</button>
                          <button onClick={() => setEditingId(null)} style={{ ...BTN('#F5F7FA','#555'), padding:'4px 10px', fontSize:11, border:'1.5px solid #ddd' }}>✕</button>
                        </div>
                      : <button onClick={() => { setEditingId(row.id); setEditVals({ crm_menejer: row.crm_menejer, crm_savdo_vakili: row.crm_savdo_vakili }) }}
                          style={{ ...BTN('#F0F4FF','#1565C0'), border:'1.5px solid #BBDEFB', padding:'4px 10px', fontSize:11 }}>✏️</button>
                    }
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SalesReport({ fetchSales, showToast }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ yonalish:'', yil:'', oy:'', savdo_vakili:'', jamoa:'', onlyUnmapped:false })
  const [loaded, setLoaded] = useState(false)

  async function load() {
  setLoading(true)
  try {
    let query = supabase.from('sales').select('*').order('sana', { ascending: false }).limit(50000)
    if (filters.yonalish) query = query.eq('yonalish', filters.yonalish)
    if (filters.yil) query = query.eq('yil', Number(filters.yil))
    if (filters.oy) query = query.eq('oy', Number(filters.oy))
    if (filters.savdo_vakili) query = query.or(`savdo_vakili.ilike.%${filters.savdo_vakili}%,crm_savdo_vakili.ilike.%${filters.savdo_vakili}%`)
    if (filters.jamoa) query = query.or(`jamoa.ilike.%${filters.jamoa}%,crm_menejer.ilike.%${filters.jamoa}%`)
    if (filters.onlyUnmapped) query = query.eq('is_mapped', false)
    const { data: res, error } = await query
    if (error) throw error
    setData(res || [])
    setLoaded(true)
  } catch(e) { showToast('Хатолик: ' + e.message, 'error') }
  finally { setLoading(false) }
}

  async function exportExcel() {
    try {
      const XLSX = await import('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm')
      const ws = XLSX.utils.json_to_sheet(data.map(r=>({
        'Сана': r.sana,
        'Йўналиш': r.yonalish,
        'Шаҳар': r.shahar,
        'Жамоа (CRM)': r.crm_menejer || r.jamoa,
        'Савдо вакили (CRM)': r.crm_savdo_vakili || r.savdo_vakili,
        'Дори номи': r.dori_nomi,
        'Миқдор': r.miqdor,
        'Нарх': r.narx,
        'Сумма': r.summa,
        'Мосланган': r.is_mapped ? 'Ҳа' : 'Йўқ',
      })))
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Савдо')
      XLSX.writeFile(wb, 'savdo_hisobot.xlsx')
    } catch(e) { showToast('Export хатолик: ' + e.message, 'error') }
  }

  const totalSumma = data.reduce((s,r) => s + (r.summa||0), 0)

  return (
    <div>
      <div style={{ ...CARD, borderTop:'4px solid #1976D2' }}>
        <div style={{ fontWeight:800, fontSize:15, marginBottom:14 }}>📋 Савдо Ҳисоботи</div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:10 }}>
          <div><label style={LBL}>Йўналиш</label>
            <select value={filters.yonalish} onChange={e=>setFilters(p=>({...p,yonalish:e.target.value}))} style={{ ...SI, width:120 }}>
              <option value=''>Барчаси</option>
              {['PPS','IPS','RMF','PPHS-II','SAVA'].map(f=><option key={f}>{f}</option>)}
            </select>
          </div>
          <div><label style={LBL}>Йил</label>
            <select value={filters.yil} onChange={e=>setFilters(p=>({...p,yil:e.target.value}))} style={{ ...SI, width:100 }}>
              <option value=''>Барчаси</option>
              {[2024,2025,2026].map(y=><option key={y}>{y}</option>)}
            </select>
          </div>
          <div><label style={LBL}>Ой</label>
            <select value={filters.oy} onChange={e=>setFilters(p=>({...p,oy:e.target.value}))} style={{ ...SI, width:130 }}>
              <option value=''>Барчаси</option>
              {['1-Январь','2-Февраль','3-Март','4-Апрель','5-Май','6-Июнь','7-Июль','8-Август','9-Сентябрь','10-Октябрь','11-Ноябрь','12-Декабрь'].map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
            </select>
          </div>
          <div><label style={LBL}>Савдо вакили</label>
            <input value={filters.savdo_vakili} onChange={e=>setFilters(p=>({...p,savdo_vakili:e.target.value}))} placeholder="Исм..." style={{ ...SI, width:150 }} />
          </div>
          <div><label style={LBL}>Жамоа</label>
            <input value={filters.jamoa} onChange={e=>setFilters(p=>({...p,jamoa:e.target.value}))} placeholder="Жамоа..." style={{ ...SI, width:150 }} />
          </div>
          <div style={{ display:'flex', alignItems:'flex-end', paddingBottom:2 }}>
            <button onClick={()=>setFilters(p=>({...p,onlyUnmapped:!p.onlyUnmapped}))}
              style={{ ...BTN(filters.onlyUnmapped?'#C62828':'#F5F7FA', filters.onlyUnmapped?'#fff':'#555'), border:'1.5px solid #E0E0E0', fontSize:12 }}>
              {filters.onlyUnmapped ? '🔴 Мосланмаганлар' : 'Барчаси'}
            </button>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={load} disabled={loading} style={{ ...BTN('#1976D2') }}>{loading ? '⏳...' : '🔍 Кўрсатиш'}</button>
          {loaded && <button onClick={exportExcel} style={{ ...BTN('#388E3C') }}>📥 Excel</button>}
        </div>
      </div>

      {loaded && (
        <>
          <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
            <div style={{ ...CARD, marginBottom:0, flex:1, minWidth:150 }}>
              <div style={{ fontSize:11, color:'#888', fontWeight:700, textTransform:'uppercase', marginBottom:4 }}>Жами савдо</div>
              <div style={{ fontSize:22, fontWeight:900, color:'#2E7D32' }}>{(totalSumma/1000000).toFixed(1)} млн</div>
              <div style={{ fontSize:11, color:'#aaa' }}>{data.length} та қатор</div>
            </div>
          </div>

          <div style={{ ...CARD, padding:0, overflow:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead><tr style={{ background:'#F5F7FA', position:'sticky', top:0 }}>
                {['Сана','Йўналиш','Шаҳар','Жамоа (CRM)','Савдо вакили (CRM)','Дори номи','Миқдор','Нарх','Сумма'].map(h=>(
                  <th key={h} style={{ padding:'8px 10px', textAlign:'left', fontWeight:700, fontSize:10, color:'#888', textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{data.map((r,i)=>{
                const bg = r.is_mapped ? 'transparent' : 'rgba(239,83,80,0.08)'
                return (
                  <tr key={r.id||i} style={{ borderTop:'1px solid #F0F0F0', background: bg }}>
                    <td style={{ padding:'6px 10px', color:'#888', fontSize:11, whiteSpace:'nowrap' }}>{r.sana}</td>
                    <td style={{ padding:'6px 10px' }}>
                      <span style={{ background:'#F0F4FF', color:'#1565C0', borderRadius:6, padding:'2px 8px', fontSize:11, fontWeight:700 }}>{r.yonalish || r.firma || '—'}</span>
                    </td>
                    <td style={{ padding:'6px 10px', color:'#555' }}>{r.shahar}</td>
                    <td style={{ padding:'6px 10px', fontWeight:600 }}>
                      {r.crm_menejer
                        ? <span style={{ color:'#1A1A2E' }}>{r.crm_menejer}</span>
                        : <span style={{ color:'#C62828' }}>{r.jamoa || '—'}</span>
                      }
                    </td>
                    <td style={{ padding:'6px 10px' }}>
                      {r.crm_savdo_vakili
                        ? <span style={{ color:'#1A1A2E' }}>{r.crm_savdo_vakili}</span>
                        : <span style={{ color:'#C62828' }}>{r.savdo_vakili || '—'}</span>
                      }
                    </td>
                    <td style={{ padding:'6px 10px', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.dori_nomi}</td>
                    <td style={{ padding:'6px 10px', textAlign:'right' }}>{r.miqdor}</td>
                    <td style={{ padding:'6px 10px', textAlign:'right', color:'#888' }}>{r.narx?.toLocaleString()}</td>
                    <td style={{ padding:'6px 10px', textAlign:'right', fontWeight:700, color:'#2E7D32' }}>{r.summa?.toLocaleString()}</td>
                  </tr>
                )
              })}</tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

// ── PLAN FAKT REPORT ──────────────────────────────────────────────────────────
function PlanFaktReport({ fetchPlanFakt, showToast }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ yil:'', oy:'', menejer:'' })
  const [loaded, setLoaded] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const f = {}
      if (filters.yil) f.yil = Number(filters.yil)
      if (filters.oy) f.oy = Number(filters.oy)
      if (filters.menejer) f.menejer = filters.menejer
      const res = await fetchPlanFakt(f)
      setData(res)
      setLoaded(true)
    } catch(e) { showToast('Хатолик: ' + e.message, 'error') }
    finally { setLoading(false) }
  }

  async function exportExcel() {
    try {
      const XLSX = await import('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm')
      const ws = XLSX.utils.json_to_sheet(data.map(r=>({
        'Менежер': r.menejer, 'Ой': r.oy, 'Йил': r.yil, 'Жамоа': r.jamoa,
        'Дори номи': r.dori_nomi, 'Нарх': r.narx,
        'План миқдор': r.plan_miqdor, 'Сотиш А': r.sotish_a, 'Сотиш Б': r.sotish_b,
        'Жами миқдор': r.jami_miqdor, 'Фоиз': r.foiz,
        'План сумма': r.plan_summa, 'Сотиш сумма': r.sotish_summa,
      })))
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'План-Факт')
      XLSX.writeFile(wb, `plan_fakt_${filters.oy||'jami'}.xlsx`)
    } catch(e) { showToast('Export хатолик: ' + e.message, 'error') }
  }

  const byMenejer = data.reduce((acc, r) => {
    const key = r.menejer || '—'
    if (!acc[key]) acc[key] = { plan:0, fakt:0 }
    acc[key].plan += r.plan_summa || 0
    acc[key].fakt += r.sotish_summa || 0
    return acc
  }, {})

  return (
    <div>
      <div style={{ ...CARD, borderTop:'4px solid #F59E0B' }}>
        <div style={{ fontWeight:800, fontSize:15, marginBottom:14 }}>📊 План-Факт Ҳисоботи</div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:10 }}>
          <div>
            <label style={LBL}>Йил</label>
            <select value={filters.yil} onChange={e=>setFilters(p=>({...p,yil:e.target.value}))} style={{ ...SI, width:100 }}>
              <option value=''>Барчаси</option>
              {[2024,2025,2026].map(y=><option key={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label style={LBL}>Ой</label>
            <select value={filters.oy} onChange={e=>setFilters(p=>({...p,oy:e.target.value}))} style={{ ...SI, width:130 }}>
              <option value=''>Барчаси</option>
              {['1-Январь','2-Февраль','3-Март','4-Апрель','5-Май','6-Июнь','7-Июль','8-Август','9-Сентябрь','10-Октябрь','11-Ноябрь','12-Декабрь'].map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={LBL}>Менежер</label>
            <input value={filters.menejer} onChange={e=>setFilters(p=>({...p,menejer:e.target.value}))} placeholder="Исм..." style={{ ...SI, width:160 }} />
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={load} disabled={loading} style={{ ...BTN('#F59E0B') }}>{loading ? '⏳...' : '🔍 Кўрсатиш'}</button>
          {loaded && <button onClick={exportExcel} style={{ ...BTN('#388E3C') }}>📥 Excel юклаш</button>}
        </div>
      </div>

      {loaded && Object.keys(byMenejer).length > 0 && (
        <div style={{ ...CARD }}>
          <div style={{ fontWeight:800, fontSize:14, marginBottom:12 }}>Менежерлар бўйича</div>
          {Object.entries(byMenejer).sort((a,b)=>b[1].fakt-a[1].fakt).map(([name, v])=>{
            const pct = v.plan > 0 ? Math.round((v.fakt/v.plan)*100) : 0
            return (
              <div key={name} style={{ marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontWeight:700, fontSize:13 }}>{name}</span>
                  <span style={{ fontSize:12, fontWeight:700, color: pct>=100?'#2E7D32':pct>=70?'#F57C00':'#C62828' }}>{pct}%</span>
                </div>
                <div style={{ height:8, background:'#F0F0F0', borderRadius:4, overflow:'hidden' }}>
                  <div style={{ width:`${Math.min(pct,100)}%`, height:'100%', background:pct>=100?'#4CAF50':pct>=70?'#FFA726':'#EF5350', borderRadius:4 }} />
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#888', marginTop:2 }}>
                  <span>Факт: {(v.fakt/1000000).toFixed(1)} млн</span>
                  <span>План: {(v.plan/1000000).toFixed(1)} млн</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {loaded && (
        <div style={{ ...CARD, padding:0, overflow:'auto', maxHeight:400 }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead><tr style={{ background:'#F5F7FA', position:'sticky', top:0 }}>
              {['Менежер','Жамоа','Дори номи','План миқдор','Жами миқдор','%','План сумма','Сотиш сумма'].map(h=>(
                <th key={h} style={{ padding:'8px 10px', textAlign:'left', fontWeight:700, fontSize:10, color:'#888', textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>{data.slice(0,300).map((r,i)=>(
              <tr key={r.id||i} style={{ borderTop:'1px solid #F0F0F0', background:(r.foiz||0)<70?'rgba(239,83,80,0.03)':'transparent' }}>
                <td style={{ padding:'6px 10px', fontWeight:600 }}>{r.menejer}</td>
                <td style={{ padding:'6px 10px', color:'#555', fontSize:11 }}>{r.jamoa}</td>
                <td style={{ padding:'6px 10px', maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.dori_nomi}</td>
                <td style={{ padding:'6px 10px', textAlign:'right' }}>{r.plan_miqdor}</td>
                <td style={{ padding:'6px 10px', textAlign:'right' }}>{r.jami_miqdor}</td>
                <td style={{ padding:'6px 10px', textAlign:'right' }}>
                  <span style={{ background:(r.foiz||0)>=100?'#E8F5E9':(r.foiz||0)>=70?'#FFF8E1':'#FFEBEE', color:(r.foiz||0)>=100?'#2E7D32':(r.foiz||0)>=70?'#F57C00':'#C62828', borderRadius:6, padding:'2px 8px', fontSize:11, fontWeight:700 }}>{r.foiz||0}%</span>
                </td>
                <td style={{ padding:'6px 10px', textAlign:'right', color:'#888' }}>{r.plan_summa?.toLocaleString()}</td>
                <td style={{ padding:'6px 10px', textAlign:'right', fontWeight:700 }}>{r.sotish_summa?.toLocaleString()}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── SALES DASHBOARD ───────────────────────────────────────────────────────────
function SalesDashboard({ fetchSales, fetchPlanFakt, showToast }) {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(false)
  const [yil, setYil] = useState(new Date().getFullYear().toString())
  const [oy, setOy] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const f = {}
      if (yil) f.yil = Number(yil)
      if (oy) f.oy = Number(oy)
      const res = await fetchSales(f)
      setSales(res.filter(r=>r.tur!=='vozvrat'))
    } catch(e) { showToast('Хатолик: ' + e.message, 'error') }
    finally { setLoading(false) }
  }

  // Top menejerlar
  const byMenejer = sales.reduce((acc,r)=>{
    const k = r.crm_savdo_vakili || r.savdo_vakili || '—'
    acc[k] = (acc[k]||0) + (r.summa||0)
    return acc
  }, {})
  const topMenejer = Object.entries(byMenejer).sort((a,b)=>b[1]-a[1]).slice(0,10)

  // Top dorlar
  const byDori = sales.reduce((acc,r)=>{
    const k = r.dori_nomi||'—'
    if (!acc[k]) acc[k] = { miqdor:0, summa:0 }
    acc[k].miqdor += r.miqdor||0
    acc[k].summa += r.summa||0
    return acc
  }, {})
  const topDori = Object.entries(byDori).sort((a,b)=>b[1].miqdor-a[1].miqdor).slice(0,10)

  // Oylik dinamika
  const byOy = sales.reduce((acc,r)=>{
    const k = r.oy||0
    acc[k] = (acc[k]||0) + (r.summa||0)
    return acc
  }, {})
  const oylar = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек']
  const maxOy = Math.max(...Object.values(byOy), 1)

  const totalSumma = sales.reduce((s,r)=>s+(r.summa||0), 0)

 async function exportDashboard() {
    try {
      const XLSX = await import('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm')
      const wb = XLSX.utils.book_new()

      const ws1 = XLSX.utils.json_to_sheet((topMenejer || []).map(([name, summa], i) => {
        // Xavfsiz qidiruv
        const foundRow = (typeof data !== 'undefined' && Array.isArray(data)) 
          ? data.find(r => r.jamoa === name) 
          : null;
          
        const cleanName = foundRow?.crm_menejer || name;

        return { 
          '#': i + 1, 
          'Жамоа (CRM)': cleanName, 
          'Сумма': summa, 
          'млн': (summa / 1000000).toFixed(1) 
        };
      }))
      XLSX.utils.book_append_sheet(wb, ws1, 'Top Менежерлар')

      const ws2 = XLSX.utils.json_to_sheet((topDori || []).map(([name, v], i) => ({ '#': i + 1, 'Дори': name, 'Миқдор': v.miqdor, 'Сумма': v.summa })))
      XLSX.utils.book_append_sheet(wb, ws2, 'Top Дорилар')

      const ws3 = XLSX.utils.json_to_sheet(Object.entries(byOy || {}).map(([oy, summa]) => ({ 'Ой': oylar[Number(oy) - 1], 'Сумма': summa, 'млн': (summa / 1000000).toFixed(1) })))
      XLSX.utils.book_append_sheet(wb, ws3, 'Ойлик динамика')

      XLSX.writeFile(wb, `dashboard_${yil}.xlsx`)
    } catch (e) { showToast('Хатолик: ' + e.message, 'error') }
  }
  return (
    <div>
      <div style={{ ...CARD, borderTop:'4px solid #9C27B0' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
          <div style={{ fontWeight:800, fontSize:15 }}>🏆 Савдо Дашборди</div>
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            <select value={yil} onChange={e=>setYil(e.target.value)} style={{ ...SI, width:90 }}>
              {[2024,2025,2026].map(y=><option key={y}>{y}</option>)}
            </select>
            <select value={oy} onChange={e=>setOy(e.target.value)} style={{ ...SI, width:130 }}>
              <option value=''>Барча ойлар</option>
              {['1-Янв','2-Фев','3-Мар','4-Апр','5-Май','6-Июн','7-Июл','8-Авг','9-Сен','10-Окт','11-Ноя','12-Дек'].map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
            </select>
            <button onClick={loadData} style={{ ...BTN('#9C27B0') }}>🔄 Янгилаш</button>
            <button onClick={exportDashboard} style={{ ...BTN('#388E3C') }}>📥 Excel</button>
          </div>
        </div>
      </div>

      {loading ? <Spinner /> : (
        <>
          <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
            <div style={{ ...CARD, marginBottom:0, flex:1, minWidth:140 }}>
              <div style={{ fontSize:11, color:'#888', fontWeight:700, textTransform:'uppercase', marginBottom:4 }}>Жами савдо</div>
              <div style={{ fontSize:24, fontWeight:900, color:'#2E7D32' }}>{(totalSumma/1000000000).toFixed(2)} млрд</div>
            </div>
            <div style={{ ...CARD, marginBottom:0, flex:1, minWidth:140 }}>
              <div style={{ fontSize:11, color:'#888', fontWeight:700, textTransform:'uppercase', marginBottom:4 }}>Транзакциялар</div>
              <div style={{ fontSize:24, fontWeight:900, color:'#1565C0' }}>{sales.length.toLocaleString()}</div>
            </div>
            <div style={{ ...CARD, marginBottom:0, flex:1, minWidth:140 }}>
              <div style={{ fontSize:11, color:'#888', fontWeight:700, textTransform:'uppercase', marginBottom:4 }}>Фаол вакиллар</div>
              <div style={{ fontSize:24, fontWeight:900, color:'#9C27B0' }}>{Object.keys(byMenejer).length}</div>
            </div>
            <div style={{ ...CARD, marginBottom:0, flex:1, minWidth:140 }}>
              <div style={{ fontSize:11, color:'#888', fontWeight:700, textTransform:'uppercase', marginBottom:4 }}>Турлар сони</div>
              <div style={{ fontSize:24, fontWeight:900, color:'#F57C00' }}>{Object.keys(byDori).length}</div>
            </div>
          </div>

          {/* Oylik grafik */}
          <div style={{ ...CARD }}>
            <div style={{ fontWeight:800, fontSize:14, marginBottom:14 }}>📈 Ойлик динамика</div>
            <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:120 }}>
              {oylar.map((m,i)=>{
                const val = byOy[i+1]||0
                const h = maxOy > 0 ? Math.round((val/maxOy)*100) : 0
                return (
                  <div key={m} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                    <div style={{ fontSize:9, color:'#888', fontWeight:700 }}>{val>0?(val/1000000).toFixed(0)+'M':''}</div>
                    <div style={{ width:'100%', height:`${h}%`, minHeight:val>0?4:0, background:h>0?'#1976D2':'#F0F0F0', borderRadius:'4px 4px 0 0', transition:'height 0.3s' }} />
                    <div style={{ fontSize:9, color:'#888' }}>{m}</div>
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            {/* Top menejerlar */}
            <div style={{ ...CARD }}>
              <div style={{ fontWeight:800, fontSize:14, marginBottom:12 }}>🏆 Top 10 Менежер (сумма)</div>
              {topMenejer && topMenejer.map(([name, summa], i) => {
      
                // data mavjudligini va massivligini xavfsiz tekshiramiz
                const foundRow = (typeof data !== 'undefined' && Array.isArray(data)) 
                  ? data.find(r => r.jamoa === name) 
                  : null;
        
                const cleanName = foundRow?.crm_menejer || name;

                return (
                  <div key={name} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                    <span style={{ width:20, height:20, borderRadius:'50%', background:i<3?['#FFD700','#C0C0C0','#CD7F32'][i]:'#E0E0E0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:i<3?'#fff':'#666', flexShrink:0 }}>{i+1}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:700 }}>{cleanName}</div>
                      <div style={{ height:5, background:'#F0F0F0', borderRadius:3, marginTop:3 }}>
                        <div style={{ width:`${Math.round((summa/topMenejer[0][1])*100)}%`, height:'100%', background:'#1976D2', borderRadius:3 }} />
                      </div>
                    </div>
                    <span style={{ fontSize:12, fontWeight:800, color:'#2E7D32', whiteSpace:'nowrap' }}>{(summa/1000000).toFixed(1)}M</span>
                  </div>
                );
              })}
            </div>
            
            {/* Top dorlar */}
            <div style={{ ...CARD }}>
              <div style={{ fontWeight:800, fontSize:14, marginBottom:12 }}>💊 Top 10 Дори (миқдор)</div>
              {topDori.map(([name,v],i)=>(
                <div key={name} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                  <span style={{ width:20, height:20, borderRadius:'50%', background:i<3?['#FFD700','#C0C0C0','#CD7F32'][i]:'#E0E0E0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:i<3?'#fff':'#666', flexShrink:0 }}>{i+1}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
                    <div style={{ height:5, background:'#F0F0F0', borderRadius:3, marginTop:3 }}>
                      <div style={{ width:`${Math.round((v.miqdor/topDori[0][1].miqdor)*100)}%`, height:'100%', background:'#9C27B0', borderRadius:3 }} />
                    </div>
                  </div>
                  <span style={{ fontSize:12, fontWeight:800, color:'#9C27B0', whiteSpace:'nowrap' }}>{v.miqdor.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function TrainingDashboard({ training, employees, onBulkEntry, onDeleteTraining, onViewEmployee, onUploadMaterial, onEditTraining, showToast }) {
  const [tab, setTab] = useState('overview')
  const [sortBy, setSortBy] = useState('score_desc')
  const [sessions, setSessions] = useState([])
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [cityFilter, setCityFilter] = useState('all')
  const [addingSession, setAddingSession] = useState(false)
  const [editingSession, setEditingSession] = useState(null)
  const [newSession, setNewSession] = useState({ city:'', date:'', trainer:'', selectedEmps:[] })
  const [empSearch, setEmpSearch] = useState('')

  useEffect(() => {
    async function load() {
      setLoadingSessions(true)
      try {
        const data = await fetchSessions(training.id)
        setSessions(data)
      } catch(e) { console.error(e) }
      finally { setLoadingSessions(false) }
    }
    load()
  }, [training.id])

  async function handleDeleteSession(id) {
    try {
      await deleteSession(id)
      setSessions(p => p.filter(s => s.id !== id))
    } catch(e) { console.error(e) }
  }

  async function handleSaveSession() {
    try {
      let sessionId
      if (editingSession) {
        await supabase.from('sessions').update({ city:newSession.city, date:newSession.date, trainer:newSession.trainer }).eq('id', editingSession.id)
        sessionId = editingSession.id
      } else {
        const created = await createSession(training.id, { city:newSession.city, date:newSession.date, trainer:newSession.trainer })
        sessionId = created.id
      }
      await saveSessionParticipants(sessionId, newSession.selectedEmps.map(id => ({ employeeId: id })))
      const updated = await fetchSessions(training.id)
      setSessions(updated)
      setAddingSession(false)
      setEditingSession(null)
      setNewSession({ city:'', date:'', trainer:'', selectedEmps:[] })
      setEmpSearch('')
    } catch(e) { console.error(e) }
  }

  const results    = employees.map(e => ({ emp:e, res:e.examResults?.find(r=>r.trainingId===training.id) }))
  const withResult = results.filter(x=>x.res)
  const scores     = withResult.map(x=>x.res.totalScore)
  const passed     = withResult.filter(x=>x.res.passed)
  const avg        = scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : null
  const high       = scores.length ? Math.max(...scores) : null
  const low        = scores.length ? Math.min(...scores) : null
  const passRate   = withResult.length ? Math.round((passed.length/withResult.length)*100) : 0
  const sorted     = [...results].sort((a,b)=>sortBy==='score_desc'?(b.res?.totalScore??-1)-(a.res?.totalScore??-1):sortBy==='score_asc'?(a.res?.totalScore??999)-(b.res?.totalScore??999):a.emp.name.localeCompare(b.emp.name))
  const byRole     = ROLES.map(role=>{ const rs=withResult.filter(x=>x.emp.role===role).map(x=>x.res.totalScore); return {role,count:rs.length,avg:rs.length?Math.round(rs.reduce((a,b)=>a+b,0)/rs.length):null} }).filter(r=>r.count>0)
  const bandCounts = [[90,100,'#2E7D32'],[80,89,'#66BB6A'],[70,79,'#FFA726'],[60,69,'#EF5350'],[0,59,'#B71C1C']].map(([min,max,color])=>({ label:`${min}–${max}`, min, max, color, count:scores.filter(s=>s>=min&&s<=max).length }))
  const maxBand    = Math.max(...bandCounts.map(b=>b.count),1)

  const KPI = ({ icon, label, value, sub, color='#1A1A2E' }) => (
    <div style={{ background:'#fff', borderRadius:12, padding:'14px 18px', boxShadow:'0 2px 8px rgba(0,0,0,0.05)', flex:1, minWidth:110 }}>
      <div style={{ fontSize:20, marginBottom:4 }}>{icon}</div>
      <div style={{ fontSize:11, color:'#888', fontWeight:700, textTransform:'uppercase', letterSpacing:0.4, marginBottom:2 }}>{label}</div>
      <div style={{ fontSize:26, fontWeight:900, color, lineHeight:1 }}>{value??'—'}</div>
      {sub && <div style={{ fontSize:11, color:'#aaa', marginTop:3 }}>{sub}</div>}
    </div>
  )

  return (
    <div id={`training-dash-${training.id}`}>
      <div style={{ ...CARD, borderTop:'4px solid #1976D2' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:10 }}>
          <div>
            <div style={{ fontSize:11, color:'#1976D2', fontWeight:700, textTransform:'uppercase', letterSpacing:0.5, marginBottom:4 }}>Трениг Дашборди</div>
            <h2 style={{ margin:'0 0 4px', fontSize:20 }}>{training.title}</h2>
            <div style={{ fontSize:12, color:'#888' }}>{training.date} · {(training.questions||[]).length} та очиқ савол · {withResult.length}/{employees.length} натижа</div>
          </div>
          <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
            <button onClick={()=>onBulkEntry(training)} style={{ ...BTN('linear-gradient(135deg,#1565C0,#42A5F5)'), boxShadow:'0 2px 8px rgba(21,101,192,0.25)' }}>⚡ Натижа киритиш</button>
            <button onClick={()=>onEditTraining(training)} style={{ ...BTN('#F0F4FF','#1565C0'), border:'1.5px solid #BBDEFB' }}>✏️ Таҳрирлаш</button>
            <label style={{ ...BTN('#E8F5E9','#2E7D32'), border:'1.5px solid #A5D6A7', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6 }}>
              📎 Материал юклаш
              <input type="file" accept=".pdf,.pptx,.docx,.xlsx" style={{ display:'none' }} onChange={e=>onUploadMaterial(training, e.target.files[0])} />
            </label>
            <button onClick={()=>onDeleteTraining(training.id)} style={{ ...BTN('#FFEBEE','#C62828'), border:'1.5px solid #FFCDD2' }}>🗑️</button>
            <button onClick={()=>exportTrainingsExcel([training], sessions, employees, 'single', [training.id], showToast)} 
              style={{ ...BTN('#388E3C'), border:'none' }}>📥 Excel Давомат</button>
            <button onClick={()=>exportDashboardToPDF(`training-dash-${training.id}`, training.title)} 
              style={{ ...BTN('#7B1FA2'), border:'none' }}>📄 PDF</button>
          </div>
        </div>
      </div>

      {(training.materials||[]).length > 0 && (
        <div style={{ ...CARD, marginBottom:14 }}>
          <div style={{ fontWeight:800, fontSize:14, marginBottom:10 }}>📎 Юкланган материаллар</div>
          {(training.materials||[]).map((m,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom: i < training.materials.length-1 ? '1px solid #F5F5F5' : 'none' }}>
              <div style={{ width:36, height:36, borderRadius:8, background:'#F0F4FF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>
                {m.name.endsWith('.pdf') ? '📄' : m.name.endsWith('.pptx') ? '📊' : '📁'}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:13 }}>{m.name}</div>
                <div style={{ fontSize:11, color:'#888' }}>{m.size}</div>
              </div>
              <a href={m.url} target="_blank" rel="noreferrer" style={{ padding:'6px 12px', background:'#1976D2', color:'#fff', borderRadius:8, fontWeight:700, fontSize:12, textDecoration:'none' }}>⬇ Юклаш</a>
              <button onClick={async ()=>{
                const updatedMaterials = training.materials.filter((_,j)=>j!==i)
                await supabase.from('trainings').update({ materials: updatedMaterials }).eq('id', training.id)
              }} style={{ padding:'6px 10px', background:'#FFEBEE', color:'#C62828', border:'1.5px solid #FFCDD2', borderRadius:8, fontWeight:700, fontSize:12, cursor:'pointer' }}>🗑️</button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display:'flex', gap:6, marginBottom:14 }}>
        {[['overview','📊 Умумий'],['sessions','🏙️ Сессиялар'],['results','📋 Натижалар'],['answers','📝 Жавоблар'],['homework','📎 Уй вазифалари']].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={{ padding:'7px 16px', borderRadius:8, border:'none', fontWeight:700, cursor:'pointer', fontSize:12, background:tab===t?'#1976D2':'#fff', color:tab===t?'#fff':'#555', boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>{l}</button>
        ))}
      </div>

      {tab==='overview' && (withResult.length===0
        ? <div style={{ ...CARD, textAlign:'center', color:'#aaa', padding:50 }}><div style={{ fontSize:36, marginBottom:10 }}>📭</div><div style={{ marginBottom:12 }}>Ҳали натижа киритилмаган</div><button onClick={()=>onBulkEntry(training)} style={BTN('#1976D2')}>⚡ Натижаларни киритиш</button></div>
        : <>
            <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
              <KPI icon="📊" label="Ўртача балл" value={avg} sub={`${withResult.length} та киритилди`} color={scoreColor(avg)} />
              <KPI icon="🏆" label="Энг юқори" value={high} sub={[...withResult].sort((a,b)=>b.res.totalScore-a.res.totalScore)[0]?.emp.name.split(' ')[0]} color="#1565C0" />
              <KPI icon="⚠️" label="Энг паст" value={low} sub={[...withResult].sort((a,b)=>a.res.totalScore-b.res.totalScore)[0]?.emp.name.split(' ')[0]} color="#C62828" />
              <KPI icon="✅" label="Ўтиш даражаси" value={`${passRate}%`} sub={`${passed.length} та ўтди`} color={passRate>=70?'#2E7D32':'#C62828'} />
              <KPI icon="👥" label="Жами" value={withResult.length} sub={`${employees.length-withResult.length} та қолди`} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:10 }}>
              <div style={{ ...CARD, marginBottom:0, display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
                <div style={{ fontWeight:800, fontSize:14, alignSelf:'flex-start' }}>Ўтиш нисбати</div>
                <DonutChart passed={passed.length} failed={withResult.length-passed.length} />
                <div style={{ display:'flex', gap:14, fontSize:12 }}>
                  <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:10,height:10,borderRadius:'50%',background:'#4CAF50',display:'inline-block' }} />Ўтди: <b>{passed.length}</b></span>
                  <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:10,height:10,borderRadius:'50%',background:'#EF5350',display:'inline-block' }} />Ўтмади: <b>{withResult.length-passed.length}</b></span>
                </div>
              </div>
              <div style={{ ...CARD, marginBottom:0 }}>
                <div style={{ fontWeight:800, fontSize:14, marginBottom:14 }}>Балл тақсимоти</div>
                {bandCounts.map(b=>(
                  <div key={b.label} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:7 }}>
                    <span style={{ width:44, fontSize:11, fontWeight:700, color:b.color, textAlign:'right' }}>{b.label}</span>
                    <MiniBar value={b.count} max={maxBand} color={b.color} />
                    <span style={{ width:24, fontSize:12, fontWeight:800, color:b.count>0?b.color:'#ccc', textAlign:'right' }}>{b.count}</span>
                  </div>
                ))}
              </div>
              <div style={{ ...CARD, marginBottom:0 }}>
                <div style={{ fontWeight:800, fontSize:14, marginBottom:14 }}>Лавозим бўйича</div>
                {byRole.map(r=>(
                  <div key={r.role} style={{ marginBottom:10 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}><Badge role={r.role} /><span style={{ fontSize:13, fontWeight:800, color:scoreColor(r.avg) }}>{r.avg??'—'}</span></div>
                    <MiniBar value={r.avg} max={100} color={scoreColor(r.avg)} />
                    <div style={{ fontSize:10, color:'#aaa', marginTop:2 }}>{r.count} та ходим</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:10, marginTop:14 }}>
              {[{ label:'🥇 Top 3 иштирокчи', arr:[...withResult].filter(x=>x.res.totalScore>=60).sort((a,b)=>b.res.totalScore-a.res.totalScore).slice(0,3), border:'#4CAF50', titleColor:'#2E7D32', medals:['#FFD700','#C0C0C0','#CD7F32'] },
                { label:'⚠️ Эътибор талаб', arr:[...withResult].filter(x=>x.res.totalScore<50).sort((a,b)=>a.res.totalScore-b.res.totalScore).slice(0,3), border:'#EF5350', titleColor:'#C62828', medals:['#FFEBEE','#FFEBEE','#FFEBEE'], medalText:'#C62828' }
              ].map(({ label, arr, border, titleColor, medals, medalText='#fff' }) => (
                arr.length === 0 && label.includes('Эътибор') ? null :
                <div key={label} style={{ ...CARD, marginBottom:0, borderLeft:`4px solid ${border}` }}>
                  <div style={{ fontWeight:800, fontSize:14, marginBottom:12, color:titleColor }}>{label}</div>
                  {arr.map((x,i)=>(
                    <div key={x.emp.id} onClick={()=>onViewEmployee(x.emp.id)} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid #F5F5F5', cursor:'pointer' }}>
                      <span style={{ width:22,height:22,borderRadius:'50%',background:medals[i],display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:medalText,flexShrink:0 }}>{i+1}</span>
                      <Avatar name={x.emp.name} size={28} />
                      <div style={{ flex:1 }}><div style={{ fontWeight:700, fontSize:13 }}>{x.emp.name}</div><Badge role={x.emp.role} /></div>
                      <ScorePill score={x.res.totalScore} passed={x.res.passed} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
      )}

      {tab==='sessions' && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              <button onClick={()=>setCityFilter('all')} style={{ padding:'5px 12px', borderRadius:20, border:'1.5px solid', borderColor:cityFilter==='all'?'#1976D2':'#E0E0E0', background:cityFilter==='all'?'#1976D2':'#fff', color:cityFilter==='all'?'#fff':'#555', fontSize:11, fontWeight:700, cursor:'pointer' }}>Барчаси</button>
              {sessions.map(s=>(
                <button key={s.id} onClick={()=>setCityFilter(s.id)} style={{ padding:'5px 12px', borderRadius:20, border:'1.5px solid', borderColor:cityFilter===s.id?'#1976D2':'#E0E0E0', background:cityFilter===s.id?'#1976D2':'#fff', color:cityFilter===s.id?'#fff':'#555', fontSize:11, fontWeight:700, cursor:'pointer' }}>{s.city}</button>
              ))}
            </div>
            <button onClick={()=>setAddingSession(true)} style={{ ...BTN('#1976D2'), fontSize:12 }}>+ Шаҳар қўшиш</button>
          </div>
          {loadingSessions ? <Spinner /> : sessions.length === 0 ? (
            <div style={{ ...CARD, textAlign:'center', color:'#aaa', padding:40 }}>
              <div style={{ fontSize:36, marginBottom:10 }}>🏙️</div>
              <div style={{ marginBottom:12 }}>Ҳали сессия йўқ</div>
              <button onClick={()=>setAddingSession(true)} style={BTN('#1976D2')}>+ Шаҳар қўшиш</button>
            </div>
          ) : sessions.filter(s=>cityFilter==='all'||s.id===cityFilter).map(s=>(
            <div key={s.id} style={{ ...CARD, borderLeft:'4px solid #1976D2' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                <div>
                  <div style={{ fontWeight:800, fontSize:15 }}>🏙️ {s.city}</div>
                  <div style={{ fontSize:12, color:'#888', marginTop:2 }}>{s.date}</div>
                  {s.trainer && <div style={{ fontSize:12, color:'#1565C0', marginTop:2 }}>👤 Тренер: <b>{s.trainer}</b></div>}
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <span style={{ background:'#F0F4FF', color:'#1565C0', borderRadius:8, padding:'3px 10px', fontSize:12, fontWeight:700 }}>{s.session_participants?.length || 0} иштирокчи</span>
                  <button onClick={()=>onBulkEntry(training, s)} style={{ ...BTN('linear-gradient(135deg,#1565C0,#42A5F5)'), fontSize:11, padding:'4px 10px' }}>⚡ Натижа</button>
                  <button onClick={()=>{ setEditingSession(s); setNewSession({ city:s.city, date:s.date, trainer:s.trainer||'', selectedEmps:(s.session_participants||[]).map(p=>p.employee_id) }); setAddingSession(true) }} style={{ ...BTN('#F0F4FF','#1565C0'), border:'1.5px solid #BBDEFB', padding:'4px 8px' }}>✏️</button>
                  <button onClick={()=>handleDeleteSession(s.id)} style={{ ...BTN('#FFEBEE','#C62828'), border:'1.5px solid #FFCDD2', padding:'4px 8px' }}>🗑️</button>
                </div>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {(s.session_participants||[]).map(p=>(
                  <div key={p.id} onClick={()=>onViewEmployee(p.employee_id)} style={{ display:'flex', alignItems:'center', gap:6, background:'#F5F7FA', borderRadius:8, padding:'5px 10px', cursor:'pointer' }}>
                    <Avatar name={p.employees?.name||'?'} size={22} />
                    <span style={{ fontSize:12, fontWeight:600 }}>{p.employees?.name}</span>
                    {p.score!=null && <span style={{ fontSize:11, fontWeight:800, color:scoreColor(p.score) }}>{p.score}</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {addingSession && (
            <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
              <div style={{ background:'#fff', borderRadius:16, padding:24, width:'100%', maxWidth:560, maxHeight:'80vh', overflowY:'auto' }}>
                <h3 style={{ margin:'0 0 16px', fontSize:17 }}>{editingSession ? 'Сессияни таҳрирлаш' : 'Янги сессия қўшиш'}</h3>
                <label style={LBL}>Шаҳар</label>
                <input value={newSession.city} onChange={e=>setNewSession(p=>({...p,city:e.target.value}))} placeholder="Тошкент" style={{ ...SI, marginBottom:10 }} />
                <label style={LBL}>Сана</label>
                <input type="text" value={newSession.date} onChange={e=>setNewSession(p=>({...p,date:e.target.value}))} placeholder="2025-03-18" style={{ ...SI, marginBottom:10 }} />
                <label style={LBL}>Тренер</label>
                <input value={newSession.trainer} onChange={e=>setNewSession(p=>({...p,trainer:e.target.value}))} placeholder="Тренер исми" style={{ ...SI, marginBottom:10 }} />
                <label style={LBL}>Иштирокчилар ({newSession.selectedEmps.length} танланди)</label>
                <input value={empSearch} onChange={e=>setEmpSearch(e.target.value)} placeholder="🔍 Қидириш..." style={{ ...SI, marginBottom:8 }} />
                <div style={{ maxHeight:200, overflowY:'auto', border:'1.5px solid #E0E0E0', borderRadius:8, marginBottom:14 }}>
                  {employees.filter(e=>e.name.toLowerCase().includes(empSearch.toLowerCase())).map(e=>{
                    const checked = newSession.selectedEmps.includes(e.id)
                    return (
                      <div key={e.id} onClick={()=>setNewSession(p=>({ ...p, selectedEmps: checked ? p.selectedEmps.filter(id=>id!==e.id) : [...p.selectedEmps, e.id] }))} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', cursor:'pointer', background:checked?'#EEF4FF':'transparent', borderBottom:'1px solid #F5F5F5' }}>
                        <div style={{ width:16, height:16, borderRadius:4, border:'2px solid', borderColor:checked?'#1976D2':'#ccc', background:checked?'#1976D2':'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          {checked && <span style={{ color:'#fff', fontSize:10 }}>✓</span>}
                        </div>
                        <Avatar name={e.name} size={24} />
                        <span style={{ fontSize:13, fontWeight:600, flex:1 }}>{e.name}</span>
                        <Badge role={e.role} />
                      </div>
                    )
                  })}
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={handleSaveSession} disabled={!newSession.city||!newSession.date} style={{ ...BTN('#1976D2'), flex:1, opacity:newSession.city&&newSession.date?1:0.4 }}>Сақлаш</button>
                  <button onClick={()=>{ setAddingSession(false); setNewSession({ city:'', date:'', trainer:'', selectedEmps:[] }); setEmpSearch(''); setEditingSession(null) }} style={{ ...BTN('#F5F7FA','#555'), flex:1, border:'1.5px solid #ddd' }}>Бекор</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab==='results' && (
        <div>
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:10, gap:8, alignItems:'center' }}>
            <span style={{ fontSize:12, color:'#888' }}>Саралаш:</span>
            {[['score_desc','Балл ↓'],['score_asc','Балл ↑'],['name','Исм']].map(([v,l])=>(
              <button key={v} onClick={()=>setSortBy(v)} style={{ padding:'5px 12px', borderRadius:8, border:'1.5px solid', fontSize:12, fontWeight:700, cursor:'pointer', borderColor:sortBy===v?'#1976D2':'#E0E0E0', background:sortBy===v?'#1976D2':'#fff', color:sortBy===v?'#fff':'#555' }}>{l}</button>
            ))}
          </div>
          <div style={{ ...CARD, padding:0, overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead><tr style={{ background:'#F5F7FA' }}>
                {['#','Ходим','Лавозим','Балл','Ҳолат','Сана','Уй вазифаси'].map(h=>(
                  <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontWeight:700, fontSize:10, color:'#888', textTransform:'uppercase', letterSpacing:0.4 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{sorted.map(({emp,res},i)=>(
                <tr key={emp.id} onClick={()=>onViewEmployee(emp.id)} style={{ borderTop:'1px solid #F0F0F0', cursor:'pointer', background:res?(res.passed?'rgba(76,175,80,0.03)':'rgba(239,83,80,0.03)'):'transparent' }}>
                  <td style={{ padding:'9px 14px', color:'#bbb', fontSize:11 }}>{i+1}</td>
                  <td style={{ padding:'9px 14px' }}><div style={{ display:'flex', alignItems:'center', gap:8 }}><Avatar name={emp.name} size={26} /><span style={{ fontWeight:600 }}>{emp.name}</span></div></td>
                  <td style={{ padding:'9px 14px' }}><Badge role={emp.role} /></td>
                  <td style={{ padding:'9px 14px' }}>{res
                    ? <div style={{ display:'flex', alignItems:'center', gap:8 }}><span style={{ fontWeight:900, fontSize:15, color:scoreColor(res.totalScore) }}>{res.totalScore}</span><div style={{ width:60, height:6, background:'#F0F0F0', borderRadius:3, overflow:'hidden' }}><div style={{ width:`${res.totalScore}%`, height:'100%', background:scoreColor(res.totalScore), borderRadius:3 }} /></div></div>
                    : <span style={{ color:'#ddd' }}>—</span>}</td>
                  <td style={{ padding:'9px 14px' }}>{res ? <ScorePill score={res.totalScore} passed={res.passed} /> : <span style={{ fontSize:11, color:'#ccc' }}>Киритилмаган</span>}</td>
                  <td style={{ padding:'9px 14px', color:'#888', fontSize:12 }}>{res?.date||'—'}</td>
                  <td style={{ padding:'9px 14px' }}>
                    {res?.homeworkUrl
                      ? <a href={res.homeworkUrl} target="_blank" rel="noreferrer"
                          style={{ fontSize:12, color:'#1976D2', fontWeight:700, textDecoration:'none' }}>
                          📎 {res.homeworkName || 'Файл'}
                        </a>
                      : <span style={{ color:'#ccc', fontSize:11 }}>—</span>
                    }
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab==='answers' && (
        <div>
          {(training.questions||[]).length===0
            ? <div style={{ ...CARD, color:'#aaa', textAlign:'center', padding:40 }}>Бу тренингда очиқ савол йўқ</div>
            : (training.questions||[]).map((q,qi)=>(
              <div key={qi} style={CARD}>
                <div style={{ fontWeight:800, fontSize:14, marginBottom:14, padding:'8px 12px', background:'#F0F4FF', borderRadius:8, color:'#1565C0' }}>📌 Савол {qi+1}: {q}</div>
                {withResult.length===0 ? <div style={{ color:'#ccc' }}>Ҳали жавоб йўқ</div>
                  : [...withResult].sort((a,b)=>b.res.totalScore-a.res.totalScore).map(({emp,res})=>{
                    const ans = res.openAnswers?.find(x=>x.q===q)
                    return (
                      <div key={emp.id} style={{ display:'flex', gap:12, padding:'10px 0', borderBottom:'1px solid #F5F5F5', alignItems:'flex-start' }}>
                        <Avatar name={emp.name} size={28} />
                        <div style={{ flex:1 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}><span style={{ fontWeight:700, fontSize:12 }}>{emp.name}</span><Badge role={emp.role} /><ScorePill score={res.totalScore} passed={res.passed} /></div>
                          <div style={{ fontSize:13, color:ans?.a?'#1A1A2E':'#ccc', background:'#FAFAFA', borderRadius:7, padding:'7px 10px' }}>{ans?.a||'Жавоб киритилмаган'}</div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            ))}
        </div>
      )}
      {tab==='homework' && (
        <div>
          {withResult.filter(x=>x.res?.homeworkUrl).length === 0
          ? <div style={{ ...CARD, textAlign:'center', color:'#aaa', padding:40 }}>
              <div style={{ fontSize:36, marginBottom:10 }}>📭</div>
              <div>Ҳали уй вазифаси юкланмаган</div>
            </div>
          : withResult.filter(x=>x.res?.homeworkUrl).sort((a,b)=>a.emp.name.localeCompare(b.emp.name)).map(({emp,res})=>(
            <div key={emp.id} style={{ ...CARD, display:'flex', alignItems:'center', gap:12 }}>
              <Avatar name={emp.name} size={36} />
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:13 }}>{emp.name}</div>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:3 }}>
                  <Badge role={emp.role} />
                  {res.totalScore > 0 && <ScorePill score={res.totalScore} passed={res.passed} />}
                </div>
              </div>
              <a href={res.homeworkUrl} target="_blank" rel="noreferrer"
                style={{ display:'inline-flex', alignItems:'center', gap:6, background:'#E8F5E9', color:'#2E7D32', borderRadius:8, padding:'7px 14px', fontSize:12, fontWeight:700, textDecoration:'none', border:'1.5px solid #A5D6A7' }}>
                ⬇ {res.homeworkName || 'Юклаш'}
              </a>
            </div>
           ))
         }
       </div>
     )}
    </div>
  )
}

function BulkEntry({ training, employees, session, onSave, onCancel, onToast }) {
  const [scores, setScores] = useState({})
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(()=>{
    const init = {}
    employees.forEach(e=>{
      const ex = e.examResults?.find(r=>r.trainingId===training.id)
      if (ex) init[e.id] = { mcScore:ex.mcScore, openAnswers:ex.openAnswers?.reduce((a,x)=>({...a,[x.q]:x.a}),{})||{}, homeworkUrl:ex.homeworkUrl||'', homeworkName:ex.homeworkName||'' }
    })
    setScores(init)
  },[training.id, employees])

  const filledCount = Object.keys(scores).filter(id => {
    const s = scores[id];
    return (s?.mcScore !== '' && s?.mcScore != null) || 
         (!!s?.homeworkUrl) || 
         (s?.openAnswers && Object.values(s.openAnswers).some(ans => ans && ans.trim() !== ''));
  }).length;
  const sessionEmpIds = session?.session_participants?.map(p => p.employee_id) || null
  const allEmps = sessionEmpIds ? employees.filter(e => sessionEmpIds.includes(e.id)) : employees
  const filtered = allEmps.filter(e=>e.name.toLowerCase().includes(search.toLowerCase()))

  async function handleSave() {
    setSaving(true)
    try {
      const updates = Object.entries(scores)
        .filter(([, s]) => {
          const hasScore = s?.mcScore !== '' && s?.mcScore != null;
          const hasHomework = !!s?.homeworkUrl;
          const hasAnswers = s?.openAnswers && Object.values(s.openAnswers).some(ans => ans && ans.trim() !== '');
          return hasScore || hasHomework || hasAnswers;
        })
        .map(([empId, s]) => ({ 
          empId: Number(empId), 
          score: (s.mcScore !== '' && s.mcScore != null) ? Number(s.mcScore) : null,
          openAnswers: (training.questions || []).map(q => ({ q, a: s.openAnswers?.[q] || '' })), 
          homeworkUrl: s.homeworkUrl || '', 
          homeworkName: s.homeworkName || '' 
        }));
      await saveBulkExamResults(training, updates)
      onToast(`${updates.length} та натижа сақланди`)
      onSave()
    } catch(e) { onToast('Хатолик: ' + e.message, 'error') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ maxWidth:900 }}>
      <div style={{ ...CARD, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
        <div>
          <div style={{ fontSize:11, color:'#888', marginBottom:2, textTransform:'uppercase', fontWeight:700 }}>⚡ Оммавий натижа киритиш</div>
          <h2 style={{ margin:'0 0 2px', fontSize:17 }}>{training.title}</h2>
          <div style={{ fontSize:12, color:'#888' }}>{training.date} · <span style={{ color:'#1976D2', fontWeight:700 }}>{filledCount} та киритилди</span></div>
        </div>
        <div style={{ display:'flex', gap:7 }}>
          <button onClick={handleSave} disabled={saving||filledCount===0} style={{ ...BTN('#388E3C'), opacity:filledCount>0?1:0.5 }}>{saving ? 'Сақланяпти...' : `✅ ${filledCount} та сақлаш`}</button>
          <button onClick={onCancel} style={{ ...BTN('#F5F7FA','#555'), border:'1.5px solid #ddd' }}>← Орқага</button>
        </div>
      </div>
      <div style={{ background:'#FFF8E1', border:'1.5px solid #FFE082', borderRadius:10, padding:'10px 14px', marginBottom:14, fontSize:13, color:'#7B5800' }}>
        💡 Тест баллини киритинг (0–100). Ўтиш чегараси: <strong>60 балл</strong>.
      </div>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Ходим қидириш..." style={{ ...SI, marginBottom:12 }} />
      <div style={{ ...CARD, padding:0, overflow:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr style={{ background:'#F5F7FA' }}>
              <th style={{ padding:'10px 14px', textAlign:'left', fontSize:10, color:'#888', fontWeight:700, textTransform:'uppercase' }}>Ходим</th>
              <th style={{ padding:'10px 14px', textAlign:'left', fontSize:10, color:'#888', fontWeight:700, textTransform:'uppercase' }}>Балл</th>
              {(training.questions||[]).map((q,i)=>(
                <th key={i} style={{ padding:'10px 12px', textAlign:'left', fontSize:10, color:'#888', fontWeight:700, textTransform:'uppercase', minWidth:150 }}>
                  Савол {i+1}<div style={{ fontSize:9, color:'#ccc', fontWeight:400, maxWidth:130, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{q}</div>
                </th>
              ))}
              <th style={{ padding:'10px 12px', textAlign:'left', fontSize:10, color:'#888', fontWeight:700, textTransform:'uppercase', minWidth:160 }}>Уй вазифаси</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((emp,idx)=>{
              const sc = scores[emp.id] || {}
              const has = sc.mcScore !== '' && sc.mcScore != null
              const sn = Number(sc.mcScore)
              return (
                <tr key={emp.id} style={{ borderTop:'1px solid #F0F0F0', background:has?(sn>=60?'rgba(76,175,80,0.04)':'rgba(239,83,80,0.04)'):'transparent' }}>
                  <td style={{ padding:'7px 14px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:11, color:'#bbb', width:20 }}>{idx+1}</span>
                      <Avatar name={emp.name} size={28} />
                      <div><div style={{ fontWeight:600, fontSize:12 }}>{emp.name}</div><Badge role={emp.role} /></div>
                    </div>
                  </td>
                  <td style={{ padding:'7px 14px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <input type="number" min="0" max="100" value={sc.mcScore??''} onChange={e=>setScores(p=>({...p,[emp.id]:{...p[emp.id],mcScore:e.target.value}}))} placeholder="—"
                        style={{ width:64, padding:'6px 8px', border:'1.5px solid', borderColor:has?(sn>=60?'#A5D6A7':'#EF9A9A'):'#E0E0E0', borderRadius:7, fontSize:14, fontWeight:800, textAlign:'center', outline:'none', background:'#fff', color:has?scoreColor(sn):'#333' }} />
                      {has && <span style={{ fontSize:11, fontWeight:700, color:sn>=60?'#388E3C':'#C62828' }}>{sn>=60?'✓':'✗'}</span>}
                    </div>
                  </td>
                  {(training.questions||[]).map((q,i)=>(
                    <td key={i} style={{ padding:'7px 10px' }}>
                      <textarea rows={2} value={sc.openAnswers?.[q]||''} onChange={e=>setScores(p=>({...p,[emp.id]:{...p[emp.id],openAnswers:{...(p[emp.id]?.openAnswers||{}),[q]:e.target.value}}}))}
                        placeholder="Жавоб..." style={{ width:150, padding:'5px 8px', border:'1.5px solid #E0E0E0', borderRadius:7, fontSize:12, fontFamily:'inherit', resize:'none', outline:'none', background:'#FAFAFA' }} />
                    </td>
                  ))}
                  <td style={{ padding:'7px 10px' }}>
                    {scores[emp.id]?.homeworkUrl
                      ? <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <a href={scores[emp.id].homeworkUrl} target="_blank" rel="noreferrer"
                          style={{ fontSize:11, color:'#1976D2', fontWeight:700, maxWidth:100, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'block' }}>
                          📎 {scores[emp.id].homeworkName}
                        </a>
                        <button onClick={()=>setScores(p=>({...p,[emp.id]:{...p[emp.id],homeworkUrl:'',homeworkName:''}}))}
                          style={{ background:'#FFEBEE', color:'#C62828', border:'1.5px solid #FFCDD2', borderRadius:6, padding:'2px 6px', fontSize:10, cursor:'pointer' }}>✕</button>
                      </div>
                    : <label style={{ display:'inline-flex', alignItems:'center', gap:4, background:'#F0F4FF', color:'#1565C0', borderRadius:7, padding:'5px 8px', fontSize:11, fontWeight:700, cursor:'pointer', border:'1.5px solid #BBDEFB' }}>
                      📎 Юклаш
                      <input type="file" style={{ display:'none' }} onChange={async e => {
                        e.preventDefault();
                        const file = e.target.files[0];
                        if (!file) return;

                        try {
                          const fileExt = file.name.split('.').pop();
                          const fileName = `hw_${emp.id}_${Date.now()}.${fileExt}`;
                          const path = `homework/${training.id}/${emp.id}/${fileName}`;

                          const { error: upErr } = await supabase.storage
                            .from('training-materials')
                            .upload(path, file, { upsert: true });

                          if (upErr) throw upErr;

                          const { data: { publicUrl } } = supabase.storage
                            .from('training-materials')
                            .getPublicUrl(path);

                          setScores(p => ({
                            ...p,
                            [emp.id]: {
                              ...p[emp.id],
                              homeworkUrl: publicUrl,
                              homeworkName: file.name
                            }
                          }));

                          onToast('Файл юкланди', 'success');
                        } catch(err) { 
                          onToast('Хатолик: ' + err.message, 'error');
                        } finally {
                          e.target.value = ""; // Inputни тозалаш
                        }
                      }} />
                     </label>
                    }
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop:12, display:'flex', justifyContent:'flex-end' }}>
        <button onClick={handleSave} disabled={saving||filledCount===0} style={{ ...BTN('#388E3C'), padding:'11px 28px', fontSize:14, opacity:filledCount>0?1:0.5 }}>{saving?'Сақланяпти...':`✅ ${filledCount} та натижани сақлаш`}</button>
      </div>
    </div>
  )
}

function normalizeRegion(raw) {
  if (!raw) return ''
  const map = {
    'ташкент': 'Тошкент', 'тошкент': 'Тошкент', 'toshkent': 'Тошкент', 'tashkent': 'Тошкент',
    'андижон': 'Андижон', 'andijan': 'Андижон', 'andijon': 'Андижон',
    'фарғона': 'Фарғона', 'фаргона': 'Фарғона', 'fergana': 'Фарғона', 'fargona': 'Фарғона',
    'наманган': 'Наманган', 'namangan': 'Наманган',
    'самарқанд': 'Самарқанд', 'самарканд': 'Самарқанд', 'samarqand': 'Самарқанд', 'samarkand': 'Самарқанд',
    'бухоро': 'Бухоро', 'buxoro': 'Бухоро', 'bukhara': 'Бухоро',
    'навоий': 'Навоий', 'navoi': 'Навоий', 'navoiy': 'Навоий',
    'қашқадарё': 'Қашқадарё', 'кашкадарья': 'Қашқадарё', 'кашкадарьё': 'Қашқадарё', 'qashqadaryo': 'Қашқадарё',
    'сурхондарё': 'Сурхондарё', 'сурхандарья': 'Сурхондарё', 'surxondaryo': 'Сурхондарё',
    'жиззах': 'Жиззах', 'джизак': 'Жиззах', 'jizzax': 'Жиззах',
    'сирдарё': 'Сирдарё', 'сирдарье': 'Сирдарё', 'сирдарьё': 'Сирдарё', 'sirdaryo': 'Сирдарё', 'сирдаре': 'Сирдарё',
    'хоразм': 'Хоразм', 'xorazm': 'Хоразм', 'khorezm': 'Хоразм',
    'қорақалпоғистон': 'Қорақалпоғистон', 'каракалпакстан': 'Қорақалпоғистон',
    'тошкент вилояти': 'Тошкент вилояти', 'ташкентская': 'Тошкент вилояти',
  }
  const key = raw.toString().toLowerCase().trim()
  return map[key] || raw.toString().trim()
}

function normalizeRegionFromKomanda(komanda) {
  if (!komanda) return ''
  const lower = komanda.toLowerCase()
  const regionMap = {
    'тошкент': 'Тошкент', 'toshkent': 'Тошкент', 'ташкент': 'Тошкент',
    'андижон': 'Андижон', 'andijon': 'Андижон',
    'фарғона': 'Фарғона', 'фаргона': 'Фарғона', 'fergana': 'Фарғона',
    'наманган': 'Наманган', 'namangan': 'Наманган',
    'самарқанд': 'Самарқанд', 'самарканд': 'Самарқанд', 'samarqand': 'Самарқанд',
    'бухоро': 'Бухоро', 'buxoro': 'Бухоро',
    'навоий': 'Навоий', 'navoiy': 'Навоий',
    'қашқадарё': 'Қашқадарё', 'кашкадарья': 'Қашқадарё', 'qashqadaryo': 'Қашқадарё',
    'сурхондарё': 'Сурхондарё', 'surxondaryo': 'Сурхондарё',
    'жиззах': 'Жиззах', 'jizzax': 'Жиззах',
    'сирдарё': 'Сирдарё', 'sirdaryo': 'Сирдарё', 'сирдаре': 'Сирдарё',
    'хоразм': 'Хоразм', 'xorazm': 'Хоразм',
    'таш.обл': 'Тошкент вилояти', 'таш обл': 'Тошкент вилояти',
    'нукус': 'Нукус', 'nukus': 'Нукус',
    'термиз': 'Термиз', 'termiz': 'Термиз',
    'қарши': 'Қарши', 'qarshi': 'Қарши',
    'гулистон': 'Гулистон', 'guliston': 'Гулистон',
    'урганч': 'Урганч', 'urganch': 'Урганч',
  }
  for (const [key, val] of Object.entries(regionMap)) {
    if (lower.includes(key)) return val
  }
  // Try to extract first word before underscore
  const parts = komanda.split('_')
  if (parts[0]) return normalizeRegion(parts[0].trim())
  return ''
}

export default function App() {
  const [employees, setEmployees] = useState([])
  const [trainings, setTrainings] = useState([])
  const [praktikums, setPraktikums] = useState([])
  const [loading, setLoading]     = useState(true)
  const [toast, setToast]         = useState(null)
  const [page, setPage]           = useState('employees')
  const [selected, setSelected]   = useState(null)
  const [empTab, setEmpTab]       = useState('info')
  const [editing, setEditing]     = useState(false)
  const [editData, setEditData]   = useState({})
  const [adding, setAdding]       = useState(false)
  const [newEmp, setNewEmp]       = useState({ name:'', role:'Менежер' })
  const [search, setSearch]       = useState('')
  const [filterRole, setFilterRole] = useState('Барчаси')
  const [delConfirm, setDelConfirm] = useState(null)
  const [saving, setSaving]       = useState(false)
  const [selTraining, setSelTraining] = useState(null)
  const [bulkMode, setBulkMode]   = useState(false)
  const [selSession, setSelSession] = useState(null)
  const [showFilter, setShowFilter] = useState(false)
  const [filterFirm, setFilterFirm] = useState('')
  const [filterEduLevel, setFilterEduLevel] = useState('')
  const [filterSpecialty, setFilterSpecialty] = useState('')
  const [filterRegion, setFilterRegion] = useState('')
  const [filterSalesMin, setFilterSalesMin] = useState('')
  const [filterSalesMax, setFilterSalesMax] = useState('')
  const [filterPlanMin, setFilterPlanMin] = useState('')
  const [filterPlanMax, setFilterPlanMax] = useState('')
  const [filterHireDate, setFilterHireDate] = useState('')
  const [filterTeamSize, setFilterTeamSize] = useState('')
  const [filterTurnover, setFilterTurnover] = useState('')
  const [addingTr, setAddingTr]   = useState(false)
  const [editingTraining, setEditingTraining] = useState(null)
  const [newTr, setNewTr]         = useState({ title:'', date:'', questions:[''] })
  const [selectedTrIds, setSelectedTrIds] = useState([])
  // Praktikum states
  const [selPrak, setSelPrak]     = useState(null)
  // Sales states
  const [salesPage, setSalesPage] = useState('upload') // 'upload' | 'report' | 'dashboard'
  const [sales, setSales] = useState([])
  const [planFakt, setPlanFakt] = useState([])
  const [salesLoading, setSalesLoading] = useState(false)
  const [salesFilter, setSalesFilter] = useState({ firma:'', yil:'', oy:'', savdo_vakili:'', jamoa:'' })
  const [uploadStatus, setUploadStatus] = useState('')
  const [delYil, setDelYil] = useState('')
  const [delOy, setDelOy] = useState('')
  const [delFirma, setDelFirma] = useState('')
  const [addingPrak, setAddingPrak] = useState(false)
  const [editingPrak, setEditingPrak] = useState(null)
  const [newPrak, setNewPrak]     = useState({ title:'', date:'', description:'' })
  const [showQR, setShowQR] = useState(null)

  const showToast = useCallback((msg, type='success') => {
    setToast({ msg, type })
    setTimeout(()=>setToast(null), 3000)
  }, [])

  const load = useCallback(async () => {
  setLoading(true)
  try {
    const [emps, trs, praks] = await Promise.all([
      fetchEmployees(),
      fetchTrainings(),
      fetchPraktikum()
    ])
    setEmployees(emps)
    setTrainings(trs)
    setPraktikums(praks)
  } catch(e) { showToast('Маълумотларни юклаб бўлмади: ' + e.message, 'error') }
  finally { setLoading(false) }
}, [showToast])

  useEffect(()=>{ load() }, [load])

  const filtered = useMemo(()=>employees.filter(e=>{
  if (!e.name.toLowerCase().includes(search.toLowerCase())) return false
  if (filterRole !== 'Барчаси' && e.role !== filterRole) return false
  if (filterFirm && e.organization !== filterFirm) return false
  if (filterEduLevel && e.educationLevel !== filterEduLevel) return false
  if (filterSpecialty && !e.specialty?.toLowerCase().includes(filterSpecialty.toLowerCase())) return false
  if (filterRegion && e.region !== filterRegion) return false
  if (filterSalesMin) {
    const sales = parseInt((e.sales6Month||'').replace(/\s/g,''))
    if (isNaN(sales) || sales < parseInt(filterSalesMin)) return false
  }
  if (filterSalesMax) {
    const sales = parseInt((e.sales6Month||'').replace(/\s/g,''))
    if (isNaN(sales) || sales > parseInt(filterSalesMax)) return false
  }
  if (filterPlanMin) {
    const plan = parseInt((e.planPercent||'').replace('%',''))
    if (isNaN(plan) || plan < parseInt(filterPlanMin)) return false
  }
  if (filterPlanMax) {
    const plan = parseInt((e.planPercent||'').replace('%',''))
    if (isNaN(plan) || plan > parseInt(filterPlanMax)) return false
  }
  if (filterHireDate) {
    const year = e.hireDate ? e.hireDate.toString().substring(0, 4) : '';
    if (year !== filterHireDate) return false;
  }
  if (filterTeamSize) {
    const tSize = parseInt(e.teamSize || 0)
    if (isNaN(tSize) || tSize < parseInt(filterTeamSize)) return false
  }
  if (filterTurnover) {
    if (!e.staffTurnover && e.staffTurnover !== 0) {
      return false;
    }
    const rawValue = String(e.staffTurnover).replace(/\s/g, '');
    const turnoverNum = parseInt(rawValue);
    if (isNaN(turnoverNum) || turnoverNum > parseInt(filterTurnover)) {
      return false;
    }
  }
  return true
}), [employees, search, filterRole, filterFirm, filterEduLevel, filterSpecialty, filterRegion, filterSalesMin, filterSalesMax, filterPlanMin, filterPlanMax, filterPlanMax, filterHireDate, filterTeamSize, filterTurnover])


  const selEmp = selected ? employees.find(e=>e.id===selected) : null

  async function handleAddEmp() {
    if (!newEmp.name.trim()) return
    setSaving(true)
    try {
      const created = await createEmployee({ ...newEmp, examResults:[] })
      setEmployees(p=>[...p, created])
      setAdding(false); setNewEmp({ name:'', role:'Менежер' })
      setSelected(created.id); setEmpTab('info')
      showToast(`${created.name} қўшилди`)
    } catch(e) { showToast(e.message,'error') }
    finally { setSaving(false) }
  }

  async function handleSaveEdit() {
    setSaving(true)
    try {
      await updateEmployee(editData.id, editData)
      setEmployees(p=>p.map(e=>e.id===editData.id?editData:e))
      setEditing(false)
      showToast('Маълумотлар сақланди')
    } catch(e) { showToast(e.message,'error') }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    setSaving(true)
    try {
      await deleteEmployee(id)
      setEmployees(p=>p.filter(e=>e.id!==id))
      setSelected(null); setDelConfirm(null)
      showToast('Ходим ўчирилди')
    } catch(e) { showToast(e.message,'error') }
    finally { setSaving(false) }
  }

  async function handleAddTraining() {
    if (!newTr.title.trim()) return
    setSaving(true)
    let savedId = null
    let savedTitle = newTr.title
    try {
      if (editingTraining) {
        const questions = newTr.questions.filter(q=>q.trim())
        const { error } = await supabase.from('trainings').update({ title:newTr.title, date:newTr.date, questions }).eq('id', editingTraining.id)
        if (error) throw error
        setTrainings(p => p.map(t => t.id === editingTraining.id ? { ...t, title:newTr.title, date:newTr.date, questions } : t))
        setSelTraining(prev => ({ ...prev, title:newTr.title, date:newTr.date, questions }))
        showToast(`"${newTr.title}" янгиланди`)
        savedId = editingTraining.id
        setEditingTraining(null)
      } else {
        const created = await createTraining({ ...newTr, questions:newTr.questions.filter(q=>q.trim()) })
        setTrainings(p=>[created,...p])
        setSelTraining(created)
        showToast(`"${created.title}" тренинги яратилди`)
        savedId = created.id
      }
        setAddingTr(false)
        setNewTr({ title:'', date:'', questions:[''] })
        if (savedId) {
          setShowQR({ type:'training', id: savedId, title: savedTitle })
      }
    } catch(e) { showToast(e.message,'error') }
    finally { setSaving(false) }
  }
  async function handleDeleteTraining(id) {
    setSaving(true)
    try {
      await deleteTraining(id)
      setTrainings(p=>p.filter(t=>t.id!==id))
      setSelTraining(null)
      showToast('Тренинг ўчирилди')
    } catch(e) { showToast(e.message,'error') }
    finally { setSaving(false) }
  }

  async function handleUploadMaterial(training, file) {
    if (!file) return
    setSaving(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${training.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('training-materials').upload(path, file)
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('training-materials').getPublicUrl(path)
      const updatedMaterials = [...(training.materials || []), { name:file.name, size:`${(file.size/1024/1024).toFixed(1)} МБ`, url:publicUrl }]
      const { error: updateError } = await supabase.from('trainings').update({ materials:updatedMaterials }).eq('id', training.id)
      if (updateError) throw updateError
      setTrainings(p => p.map(t => t.id === training.id ? { ...t, materials:updatedMaterials } : t))
      setSelTraining(prev => ({ ...prev, materials:updatedMaterials }))
      showToast(`${file.name} юкланди`)
    } catch(e) { showToast('Хатолик: ' + e.message, 'error') }
    finally { setSaving(false) }
  }

  // Praktikum handlers
  async function handleSavePrak() {
    if (!newPrak.title.trim()) return
    setSaving(true)
    let savedId = null
    let savedTitle = newPrak.title
    try {
      if (editingPrak) {
        await updatePraktikum(editingPrak.id, { title:newPrak.title, date:newPrak.date, description:newPrak.description })
        showToast(`"${newPrak.title}" янгиланди`)
        setEditingPrak(null)
      } else {
        const created = await createPraktikum(newPrak)
        showToast(`"${created.title}" практикуми яратилди`)
        savedId = created.id
      }
      await load()
      setAddingPrak(false)
      setNewPrak({ title:'', date:'', description:'' })
      if (savedId) {
        setShowQR({ type:'praktikum', id: savedId, title: savedTitle })
      }
    } catch(e) { showToast(e.message,'error') }
    finally { setSaving(false) }
  }
  async function handleDeletePrak(id) {
    setSaving(true)
    try {
      await deletePraktikum(id)
      setPraktikums(p=>p.filter(x=>x.id!==id))
      setSelPrak(null)
      showToast('Практикум ўчирилди')
    } catch(e) { showToast(e.message,'error') }
    finally { setSaving(false) }
  }

  function handleBulkSaved() { setBulkMode(false); load() }
  function goToEmployee(id) { setSelected(id); setEmpTab('exams'); setPage('employees'); setBulkMode(false) }
  const navBtn = active => ({ padding:'6px 10px', background:active?'#1976D2':'transparent', color:active?'#fff':'#555', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:12 })

  return (
    <div style={{ display:'flex', height:'100vh', width:'100vw', fontFamily:"'Segoe UI', Tahoma, sans-serif", background:'#F5F7FA', color:'#1A1A2E', overflow:'hidden' }}>
      {/* SIDEBAR */}
      <div style={{ width:'clamp(200px, 18vw, 280px)', flexShrink:0, background:'#fff', borderRight:'1.5px solid #EBEBEB', display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'16px 14px 12px', borderBottom:'1.5px solid #EBEBEB' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:'linear-gradient(135deg,#1565C0,#42A5F5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>💊</div>
            <div>
              <div style={{ fontWeight:800, fontSize:14 }}>ПрофиКлуб CRM</div>
              <div style={{ fontSize:10, color:'#888', display:'flex', gap:6, flexWrap:'wrap', marginTop:2 }}>
                {['PPS','IPS','PPHS-II'].map(f=>{
                  const cnt = employees.filter(e=>e.organization===f).length
                  if (!cnt) return null
                  return <span key={f} style={{ background:FIRM_COLORS[f]?.bg, color:FIRM_COLORS[f]?.text, borderRadius:10, padding:'1px 6px', fontWeight:700, fontSize:10 }}>{f}: {cnt}</span>
                })}
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
            <button style={navBtn(page==='employees')} onClick={()=>{ setPage('employees'); setBulkMode(false) }}>👥 Ходимлар</button>
            <button style={navBtn(page==='exams')} onClick={()=>{ setPage('exams'); setBulkMode(false) }}>📋 Тренинглар</button>
            <button style={navBtn(page==='praktikum')} onClick={()=>{ setPage('praktikum'); setBulkMode(false) }}>⭐ Практикум</button>
            <button style={navBtn(page==='sales')} onClick={()=>{ setPage('sales'); setBulkMode(false) }}>📈 Савдо</button>
                  <button style={navBtn(false)} onClick={async ()=>{
                    const XLSX = await import('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm')
                    const { data } = await supabase.from('employees').select('emp_id, name, role, data').order('emp_id')
                    const rows = data.map(e => ({
                      'ID': e.emp_id,
                      'Исм-фамилия': e.name,
                      'Лавозим': e.role,
                      'Ташкилот': e.data?.organization || '',
                      'Телефон': e.data?.phone || '',
                      'Ҳудуд': e.data?.region || '',
                    }))
                    const ws = XLSX.utils.json_to_sheet(rows)
                    ws['!cols'] = [{wch:6},{wch:28},{wch:16},{wch:10},{wch:16},{wch:16}]
                    const wb = XLSX.utils.book_new()
                    XLSX.utils.book_append_sheet(wb, ws, 'Ходимлар рееstри')
                    XLSX.writeFile(wb, 'proficlub_reestr.xlsx')
                 }}>🪪 ID</button>
          </div>
        </div>

        {page==='employees' && <>
          <div style={{ padding:'10px 12px 6px' }}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Қидириш..." style={{ ...SI, marginBottom:8 }} />
            <button onClick={()=>setShowFilter(p=>!p)} style={{ ...BTN(showFilter?'#1976D2':'#F0F4FF', showFilter?'#fff':'#1565C0'), width:'100%', marginBottom:8, fontSize:12, border:'1.5px solid #BBDEFB' }}>
              🔽 Кенгайтирилган филтер {showFilter ? '▲' : '▼'}
            </button>
            {showFilter && (
              <div style={{ background:'#F8F9FA', borderRadius:10, padding:10, marginBottom:8, maxHeight: 280, overflowY: 'auto', border: '1px solid #eee', flexShrink: 0 }}>
                <label style={LBL}>Ташкилот</label>
                <select value={filterFirm} onChange={e=>setFilterFirm(e.target.value)} style={{ ...SI, marginBottom:8 }}>
                  <option value=''>Барчаси</option>
                  {[...new Set(employees.map(e=>e.organization).filter(Boolean))].sort().map(f=>(
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
                <label style={LBL}>Маълумоти</label>
                <select value={filterEduLevel} onChange={e=>setFilterEduLevel(e.target.value)} style={{ ...SI, marginBottom:8 }}>
                  <option value=''>Барчаси</option>
                  {['Олий','Ўрта махсус','Ўрта','Тугалланмаган олий'].map(v=>(
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
                <label style={LBL}>Мутахассислик</label>
                <input value={filterSpecialty} onChange={e=>setFilterSpecialty(e.target.value)} placeholder="Фармацевт..." style={{ ...SI, marginBottom:8 }} />
                <label style={LBL}>Ҳудуд</label>
                <select value={filterRegion} onChange={e=>setFilterRegion(e.target.value)} style={{ ...SI, marginBottom:8 }}>
                  <option value=''>Барчаси</option>
                  {[...new Set(employees.map(e=>e.region).filter(Boolean))].sort().map(r=>(
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <label style={LBL}>6 ой савдо (сўм)</label>
                <div style={{ display:'flex', gap:4, marginBottom:8 }}>
                  <input value={filterSalesMin} onChange={e=>setFilterSalesMin(e.target.value)} placeholder="дан (мин)" style={{ ...SI, flex:1 }} />
                  <input value={filterSalesMax} onChange={e=>setFilterSalesMax(e.target.value)} placeholder="гача (макс)" style={{ ...SI, flex:1 }} />
                </div>
                <label style={LBL}>Режа (%)</label>
                <div style={{ display:'flex', gap:4, marginBottom:8 }}>
                  <input value={filterPlanMin} onChange={e=>setFilterPlanMin(e.target.value)} placeholder="дан" style={{ ...SI, flex:1 }} />
                  <input value={filterPlanMax} onChange={e=>setFilterPlanMax(e.target.value)} placeholder="гача" style={{ ...SI, flex:1 }} />
                </div>
                <label style={LBL}>Иш бошлаган сана (дан)</label>
                <input type="number" value={filterHireDate} onChange={e=>setFilterHireDate(e.target.value)} style={{ ...SI, marginBottom:8 }} />

                <label style={LBL}>Жамоадаги ходимлар сони (мин)</label>
                <input type="number" value={filterTeamSize} onChange={e=>setFilterTeamSize(e.target.value)} placeholder="0" style={{ ...SI, marginBottom:8 }} />

                <label style={LBL}>Ходимлар алмашуви (макс)</label>
                <input type="number" value={filterTurnover} onChange={e=>setFilterTurnover(e.target.value)} placeholder="0" style={{ ...SI, marginBottom:8 }} />
                <button onClick={()=>{ setFilterFirm(''); setFilterEduLevel(''); setFilterSpecialty(''); setFilterRegion(''); setFilterSalesMin(''); setFilterSalesMax(''); setFilterPlanMin(''); setFilterPlanMax(''); setFilterHireDate(''); setFilterTeamSize(''); setFilterTurnover('') }}
                  style={{ ...BTN('#FFEBEE','#C62828'), width:'100%', fontSize:12, border:'1.5px solid #FFCDD2' }}>
                  🗑️ Филтрни тозалаш
                </button>
              </div>
            )}
            <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
              {['Барчаси',...ROLES].map(r=>(
                <button key={r} onClick={()=>setFilterRole(r)} style={{ padding:'3px 8px', borderRadius:20, border:'1.5px solid', fontSize:10, fontWeight:700, cursor:'pointer', borderColor:filterRole===r?'#1976D2':'#E0E0E0', background:filterRole===r?'#1976D2':'#fff', color:filterRole===r?'#fff':'#666' }}>{r}</button>
              ))}
            </div>
          </div>
          <div style={{ flex:1, overflowY:'auto' }}>
            {loading ? <Spinner /> : filtered.map(emp=>(
              <div key={emp.id} onClick={()=>{ setSelected(emp.id); setEditing(false); setEmpTab('info'); setAdding(false) }} style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 12px', cursor:'pointer', background:selected===emp.id?(FIRM_COLORS[emp.organization]?.bg||'#EEF4FF'):'transparent', borderLeft:`3px solid ${selected===emp.id?(FIRM_COLORS[emp.organization]?.dot||'#1976D2'):'transparent'}` }}>
                <Avatar name={emp.name} size={34} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:12, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                    {emp.name}{emp.emp_id ? <span style={{ color:'#aaa', fontWeight:400, fontSize:11 }}> ({emp.emp_id})</span> : ''}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:2, flexWrap:'wrap' }}>
                    <Badge role={emp.role} />
                    {emp.organization && <FirmBadge firm={emp.organization} />}
                    {emp.isStar && <span style={{ fontSize:11 }}>⭐</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding:12, borderTop:'1.5px solid #EBEBEB' }}>
            <button onClick={()=>{ setAdding(true); setSelected(null) }} style={{ ...BTN('linear-gradient(135deg,#1565C0,#42A5F5)'), width:'100%', padding:'10px' }}>+ Янги ходим</button>
          </div>
        </>}

        {page==='exams' && <>
          <div style={{ flex:1, overflowY:'auto', padding:'8px 0' }}>
            <div style={{ padding:'8px 14px 4px', fontSize:10, fontWeight:700, color:'#bbb', textTransform:'uppercase' }}>Тренинглар</div>
            {loading ? <Spinner /> : trainings.map(t=>{
              const count = employees.filter(e=>e.examResults?.some(r=>r.trainingId===t.id)).length
              return (
                <div key={t.id} onClick={()=>{ setSelTraining(t); setBulkMode(false) }} style={{ padding:'9px 14px', cursor:'pointer', borderLeft:selTraining?.id===t.id&&!bulkMode?'3px solid #1976D2':'3px solid transparent', background:selTraining?.id===t.id&&!bulkMode?'#EEF4FF':'transparent' }}>
                  <div style={{ fontWeight:700, fontSize:13 }}>{t.title}</div>
                  <div style={{ fontSize:11, color:'#888' }}>{t.date} · {count} натижа</div>
                </div>
              )
            })}
          </div>
          <div style={{ padding:12, borderTop:'1.5px solid #EBEBEB' }}>
            <button onClick={()=>{ setEditingTraining(null); setNewTr({ title:'', date:'', questions:[''] }); setAddingTr(true) }} style={{ ...BTN('#F0F4FF','#1565C0'), width:'100%', padding:'10px' }}>+ Янги тренинг</button>
          </div>
        </>}

        {page==='praktikum' && <>
          <div style={{ flex:1, overflowY:'auto', padding:'8px 0' }}>
            <div style={{ padding:'8px 14px 4px', fontSize:10, fontWeight:700, color:'#bbb', textTransform:'uppercase' }}>Практикумлар</div>
            {loading ? <Spinner /> : praktikums.map(p=>{
              const starCount = (p.praktikum_participants||[]).filter(x=>x.star).length
              return (
                <div key={p.id} onClick={()=>setSelPrak(p)} style={{ padding:'9px 14px', cursor:'pointer', borderLeft:selPrak?.id===p.id?'3px solid #F59E0B':'3px solid transparent', background:selPrak?.id===p.id?'#FFFBEB':'transparent' }}>
                  <div style={{ fontWeight:700, fontSize:13 }}>{p.title}</div>
                  <div style={{ fontSize:11, color:'#888' }}>{p.date} · {starCount} ⭐</div>
                </div>
              )
            })}
          </div>
          <div style={{ padding:12, borderTop:'1.5px solid #EBEBEB' }}>
            <button onClick={()=>{ setEditingPrak(null); setNewPrak({ title:'', date:'', description:'' }); setAddingPrak(true) }} style={{ ...BTN('#FEF3C7','#92400E'), width:'100%', padding:'10px', border:'1.5px solid #FDE68A' }}>+ Янги практикум</button>
          </div>
        </>}
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex:1, minWidth:0, overflowY:'auto', padding:'clamp(12px, 2vw, 24px)' }}>

        {/* Add employee */}
        {adding && (
          <div style={{ maxWidth:440, ...CARD }}>
            <h2 style={{ margin:'0 0 16px', fontSize:17 }}>Янги ходим қўшиш</h2>
            <label style={LBL}>Тўлиқ исми</label>
            <input value={newEmp.name} onChange={e=>setNewEmp(p=>({...p,name:e.target.value}))} placeholder="Фамилия Исм" style={{ ...SI, marginBottom:12 }} onKeyDown={e=>e.key==='Enter'&&handleAddEmp()} />
            <label style={LBL}>Лавозим</label>
            <select value={newEmp.role} onChange={e=>setNewEmp(p=>({...p,role:e.target.value}))} style={{ ...SI, marginBottom:20 }}>
              {ROLES.map(r=><option key={r}>{r}</option>)}
            </select>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={handleAddEmp} disabled={saving||!newEmp.name.trim()} style={{ ...BTN('#1976D2'), flex:1, opacity:newEmp.name.trim()?1:0.4 }}>{saving?'Сақланяпти...':'Сақлаш'}</button>
              <button onClick={()=>setAdding(false)} style={{ ...BTN('#F5F7FA','#555'), flex:1, border:'1.5px solid #ddd' }}>Бекор</button>
            </div>
          </div>
        )}

        {/* Employee detail */}
        {page==='employees' && selEmp && !adding && (()=>{
          const fields = ROLE_FIELDS[selEmp.role] || []
          return (
            <div>
              <div style={{ ...CARD, display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
                <Avatar name={selEmp.name} size={50} />
                <div style={{ flex:1 }}>
                  {editing
                    ? <input value={editData.name||''} onChange={e=>setEditData(p=>({...p,name:e.target.value}))} style={{ ...SI, fontSize:17, fontWeight:800, maxWidth:300 }} />
                    : <div style={{ fontSize:19, fontWeight:800 }}>{selEmp.name}</div>
                  }
                  <div style={{ marginTop:5, display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                    <Badge role={selEmp.role} />
                    {selEmp.organization && <FirmBadge firm={selEmp.organization} />}
                    {selEmp.hireDate && <span style={{ fontSize:11, color:'#888' }}>Иш бошлаган: {selEmp.hireDate}</span>}
                    {selEmp.emp_id && (
                      <span style={{ background:'#1A1A2E', color:'#fff', borderRadius:8, padding:'2px 10px', fontSize:12, fontWeight:900, letterSpacing:2 }}>
                        🪪 ID: {selEmp.emp_id}
                      </span>
                    )}
                    <span style={{ fontSize:11, color:'#888' }}>{selEmp.examResults?.length||0} та имтиҳон</span>
                    {praktikums.some(pr=>(pr.praktikum_participants||[]).some(p=>p.employee_id===selEmp.id&&p.star)) && <span style={{ fontSize:13 }}>⭐</span>}
                  </div>
                </div>
                <div style={{ display:'flex', gap:7 }}>
                  {!editing
                    ? <><button onClick={()=>{ setEditData({...selEmp}); setEditing(true) }} style={BTN('#1976D2')}>✏️ Таҳрирлаш</button>
                       <button onClick={async ()=>{
                         const newStar = !selEmp.isStar
                         await updateEmployee(selEmp.id, { ...selEmp, isStar: newStar })
                         setEmployees(p=>p.map(e=>e.id===selEmp.id?{...e,isStar:newStar}:e))
                         showToast(newStar ? '⭐ Практикум аъзоси белгиланди' : 'Практикум аъзолигидан чиқарилди')
                       }} style={{ ...BTN(selEmp.isStar?'#FEF3C7':'#F5F7FA', selEmp.isStar?'#92400E':'#888'), border:`1.5px solid ${selEmp.isStar?'#FDE68A':'#E0E0E0'}` }}>
                         {selEmp.isStar ? '⭐ Практикумда' : '☆ Практикумга қўшиш'}
                       </button>
                       <button onClick={()=>setDelConfirm(selEmp.id)} style={{ ...BTN('#FFF0F0','#C62828'), border:'1.5px solid #FFCDD2' }}>🗑️</button></>
                    : <><button onClick={handleSaveEdit} disabled={saving} style={BTN('#388E3C')}>{saving?'Сақланяпти...':'✅ Сақлаш'}</button><button onClick={()=>setEditing(false)} style={{ ...BTN('#F5F7FA','#555'), border:'1.5px solid #ddd' }}>❌ Бекор</button></>
                  }
                </div>
              </div>

              {delConfirm && (
                <div style={{ background:'#FFF8F8', border:'1.5px solid #FFCDD2', borderRadius:10, padding:'12px 16px', marginBottom:14, display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                  <span style={{ fontWeight:600, color:'#C62828', fontSize:13 }}>⚠️ {selEmp.name}ни ўчиришни тасдиқлайсизми?</span>
                  <button onClick={()=>handleDelete(delConfirm)} disabled={saving} style={BTN('#C62828')}>{saving?'...':'Ҳа, ўчириш'}</button>
                  <button onClick={()=>setDelConfirm(null)} style={{ ...BTN('#fff','#555'), border:'1.5px solid #ddd' }}>Бекор</button>
                </div>
              )}

              <div style={{ display:'flex', gap:6, marginBottom:14 }}>
                {[['info','📋 Маълумотлар'],[`exams`,`📊 Имтиҳонлар (${selEmp.examResults?.length||0})`],['praktikum','⭐ Практикум']].map(([t,l])=>(
                  <button key={t} onClick={()=>setEmpTab(t)} style={{ padding:'7px 16px', borderRadius:8, border:'none', fontWeight:700, cursor:'pointer', fontSize:12, background:empTab===t?'#1976D2':'#fff', color:empTab===t?'#fff':'#555', boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>{l}</button>
                ))}
              </div>

              {empTab==='info' && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:10 }}>
                  {fields.map(f=>{
                    const val = editing ? editData[f.key] : selEmp[f.key]
                    if (!editing && !val && f.key !== 'promoList') return null
                    return (
                      <div key={f.key} style={{ ...CARD, gridColumn:(f.type==='textarea'||f.type==='promo'||f.type==='excel')?'1/-1':'auto', marginBottom:0 }}>
                        <label style={LBL}>{f.label}</label>
                        {editing
                          ? f.type==='textarea'
                            ? <textarea value={editData[f.key]||''} onChange={e=>setEditData(p=>({...p,[f.key]:e.target.value}))} rows={3} style={{ ...SI, resize:'vertical' }} />
                            : f.type==='excel'
                            ? <div style={{ fontSize:12, color:'#888' }}>Таҳрирлаш режимида файлни алмаштириш учун Бекорни босиб, тўғридан юкланг</div>
                            : <input type={f.type==='date'?'date':f.type==='number'?'number':'text'} value={editData[f.key]||''} onChange={e=>setEditData(p=>({...p,[f.key]:e.target.value}))} style={SI} />
                          : f.key==='promoList'
                            ? <div>
                              {val && val.startsWith('http')
                                ? <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                                  <a href={val} target="_blank" rel="noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:6, background:'#E8F5E9', color:'#2E7D32', borderRadius:8, padding:'6px 12px', fontSize:12, fontWeight:700, textDecoration:'none', border:'1.5px solid #A5D6A7' }}>
                                    📊 Excel файлни кўриш
                                  </a>
                                  <button onClick={async ()=>{
                                    await updateEmployee(selEmp.id, { ...selEmp, promoList: '' })
                                    setEmployees(p=>p.map(e=>e.id===selEmp.id?{...e,promoList:''}:e))
                                    showToast('Файл ўчирилди')
                                  }} style={{ background:'#FFEBEE', color:'#C62828', border:'1.5px solid #FFCDD2', borderRadius:8, padding:'5px 10px', fontSize:12, fontWeight:700, cursor:'pointer' }}>🗑️ Ўчириш</button>
                                </div>
                                : <div style={{ color:'#aaa', fontSize:12, marginBottom:8 }}>📭 Файл юкланмаган</div>
                              }
                              <label style={{ display:'inline-flex', alignItems:'center', gap:6, background:'#F0F4FF', color:'#1565C0', borderRadius:8, padding:'6px 12px', fontSize:12, fontWeight:700, cursor:'pointer', border:'1.5px solid #BBDEFB' }}>
                                📎 Excel юклаш
                                <input type="file" accept=".xlsx,.xls,.csv" style={{ display:'none' }} onChange={async e=>{
                                  const file = e.target.files[0]
                                  if (!file) return
                                  try {
                                    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
                                    const path = `promo/${selEmp.id}/${Date.now()}_${safeName}`
                                    const { error: upErr } = await supabase.storage.from('training-materials').upload(path, file)
                                    if (upErr) throw upErr
                                    const { data: { publicUrl } } = supabase.storage.from('training-materials').getPublicUrl(path)
                                    await updateEmployee(selEmp.id, { ...selEmp, promoList: publicUrl })
                                    setEmployees(p=>p.map(emp=>emp.id===selEmp.id?{...emp,promoList:publicUrl}:emp))
                                    showToast(`${file.name} юкланди`)
                                  } catch(err) { showToast('Хатолик: ' + err.message, 'error') }
                                }} />
                              </label>
                            </div>
                            : <div style={{ fontSize:14, color:'#1A1A2E', whiteSpace:'pre-wrap', lineHeight:1.6 }}>{val}</div>
                        }
                      </div>
                    )
                  })}
                </div>
              )}

              {empTab==='exams' && (
                <div>
                  {!selEmp.examResults?.length && (
                    <div style={{ ...CARD, textAlign:'center', color:'#aaa', padding:36 }}>
                      <div style={{ fontSize:32, marginBottom:8 }}>📭</div>
                      <div style={{ marginBottom:12 }}>Ҳали имтиҳон натижаси йўқ</div>
                      <button onClick={()=>setPage('exams')} style={BTN('#1976D2')}>Тренинглар бўлимига ўтиш →</button>
                    </div>
                  )}
                  {selEmp.examResults?.map((r,i)=>{
                    const t = trainings.find(x=>x.id===r.trainingId)
                    return (
                      <div key={i} style={{ ...CARD, borderLeft:`4px solid ${r.passed?'#388E3C':'#C62828'}` }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                          <div><div style={{ fontWeight:800, fontSize:14 }}>{t?.title||r.trainingId}</div><div style={{ fontSize:11, color:'#888', marginTop:2 }}>{r.date}</div></div>
                          <ScorePill score={r.totalScore} passed={r.passed} />
                        </div>
                        <div style={{ display:'flex', gap:7, marginBottom:r.openAnswers?.length?10:0, flexWrap:'wrap' }}>
                          <span style={{ background:'#F0F4FF', color:'#1565C0', borderRadius:8, padding:'3px 10px', fontSize:12, fontWeight:700 }}>Тест: {r.mcScore}/100</span>
                          <span style={{ background:r.passed?'#E8F5E9':'#FFEBEE', color:r.passed?'#2E7D32':'#C62828', borderRadius:8, padding:'3px 10px', fontSize:12, fontWeight:700 }}>{r.passed?'Ўтди ✓':'Ўтмади ✗'}</span>
                        </div>
                        {r.openAnswers?.length>0 && (
                          <div>
                            <label style={LBL}>Очиқ савол жавоблари</label>
                            {r.openAnswers.map((qa,qi)=>(
                              <div key={qi} style={{ background:'#F8F9FA', borderRadius:8, padding:'9px 12px', marginBottom:5 }}>
                                <div style={{ fontSize:11, color:'#666', fontWeight:700, marginBottom:3 }}>С{qi+1}: {qa.q}</div>
                                <div style={{ fontSize:13 }}>{qa.a||<span style={{ color:'#ccc' }}>Жавоб йўқ</span>}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {empTab==='praktikum' && (
                <div>
                  {praktikums.filter(pr=>(pr.praktikum_participants||[]).some(p=>p.employee_id===selEmp.id)).length === 0
                    ? <div style={{ ...CARD, textAlign:'center', color:'#aaa', padding:36 }}>
                        <div style={{ fontSize:32, marginBottom:8 }}>⭐</div>
                        <div>Ҳали практикумда иштирок этмаган</div>
                      </div>
                    : praktikums.filter(pr=>(pr.praktikum_participants||[]).some(p=>p.employee_id===selEmp.id)).map(pr=>{
                        const p = (pr.praktikum_participants||[]).find(x=>x.employee_id===selEmp.id)
                        return (
                          <div key={pr.id} style={{ ...CARD, borderLeft:`4px solid ${p?.star?'#F59E0B':'#E0E0E0'}` }}>
                            <div style={{ fontWeight:800, fontSize:14, marginBottom:4 }}>{pr.title}</div>
                            <div style={{ fontSize:12, color:'#888', marginBottom:8 }}>{pr.date}</div>
                            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                              {p?.star && <span style={{ background:'#FFFBEB', color:'#B45309', borderRadius:8, padding:'2px 10px', fontSize:12, fontWeight:700 }}>⭐ Практикумда</span>}
                              {p?.grade != null && <span style={{ background:scoreBg(p.grade), color:scoreColor(p.grade), borderRadius:20, padding:'2px 10px', fontSize:12, fontWeight:800 }}>{p.grade} балл</span>}
                              {p?.homework_url && <a href={p.homework_url} target="_blank" rel="noreferrer" style={{ fontSize:12, color:'#1976D2', fontWeight:700, textDecoration:'none' }}>📎 {p.homework_name}</a>}
                            </div>
                            {p?.feedback && <div style={{ fontSize:13, color:'#555', marginTop:8, background:'#F8F9FA', borderRadius:8, padding:'7px 10px' }}>💬 {p.feedback}</div>}
                          </div>
                        )
                      })
                  }
                </div>
              )}
            </div>
          )
        })()}

        {page==='employees' && !selEmp && !adding && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'80%', color:'#ccc' }}>
            <div style={{ fontSize:48, marginBottom:10 }}>👈</div>
            <div style={{ fontSize:15, fontWeight:600 }}>Ходимни танланг</div>
            <div style={{ fontSize:13, marginTop:4 }}>Жами {employees.length} та ходим</div>
          </div>
        )}

        {/* TRAININGS PAGE */}
        {page==='exams' && !bulkMode && (
          <div>
            {addingTr && (
              <div style={{ maxWidth:500, ...CARD }}>
                <h2 style={{ margin:'0 0 14px', fontSize:17 }}>{editingTraining ? 'Тренингни таҳрирлаш' : 'Янги тренинг қўшиш'}</h2>
                <label style={LBL}>Тренинг номи</label>
                <input value={newTr.title} onChange={e=>setNewTr(p=>({...p,title:e.target.value}))} placeholder="Тренинг номи" style={{ ...SI, marginBottom:10 }} />
                <label style={LBL}>Сана</label>
                <input type="text" value={newTr.date} onChange={e=>setNewTr(p=>({...p,date:e.target.value}))} placeholder="2025-03-18" style={{ ...SI, marginBottom:10 }} />
                <label style={LBL}>Очиқ саволлар</label>
                {newTr.questions.map((q,i)=>(
                  <div key={i} style={{ display:'flex', gap:6, marginBottom:6 }}>
                    <input value={q} onChange={e=>{ const qs=[...newTr.questions]; qs[i]=e.target.value; setNewTr(p=>({...p,questions:qs})) }} placeholder={`${i+1}-савол`} style={{ ...SI, flex:1 }} />
                    {newTr.questions.length>1 && <button onClick={()=>setNewTr(p=>({...p,questions:p.questions.filter((_,j)=>j!==i)}))} style={{ ...BTN('#FFEBEE','#C62828'), padding:'6px 10px' }}>✕</button>}
                  </div>
                ))}
                <button onClick={()=>setNewTr(p=>({...p,questions:[...p.questions,'']}))} style={{ ...BTN('#F0F4FF','#1565C0'), marginBottom:14, fontSize:12 }}>+ Савол қўшиш</button>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={handleAddTraining} disabled={saving||!newTr.title.trim()} style={{ ...BTN('#1976D2'), flex:1, opacity:newTr.title.trim()?1:0.4 }}>{saving?'Сақланяпти...':'Сақлаш'}</button>
                  <button onClick={()=>{ setAddingTr(false); setEditingTraining(null); setNewTr({ title:'', date:'', questions:[''] }) }} style={{ ...BTN('#F5F7FA','#555'), flex:1, border:'1.5px solid #ddd' }}>Бекор</button>
                </div>
              </div>
            )}

            {selTraining
              ? <TrainingDashboard
                  training={trainings.find(t=>t.id===selTraining?.id)||selTraining}
                  employees={employees}
                  onBulkEntry={(t, session)=>{ setSelTraining(t); setSelSession(session || null); setBulkMode(true) }}
                  onDeleteTraining={handleDeleteTraining}
                  onViewEmployee={goToEmployee}
                  onUploadMaterial={handleUploadMaterial}
                  onEditTraining={t=>{ setEditingTraining(t); setNewTr({ title:t.title, date:t.date, questions:t.questions?.length?t.questions:[''] }); setAddingTr(true) }}
                  showToast={showToast}
                />
              : !addingTr && (
                <div>
                  <h2 style={{ marginTop:0, marginBottom:14, fontSize:17 }}>Барча тренинглар ({trainings.length})</h2>
                  <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
                    <button onClick={()=>exportTrainingsExcel(trainings, [], employees, 'all', [], showToast)}
                      style={{ ...BTN('#388E3C') }}>📥 Барча тренинглар Excel</button>
                    {selectedTrIds.length > 0 && (
                      <button onClick={()=>exportTrainingsExcel(trainings, [], employees, 'multi', selectedTrIds, showToast)}
                        style={{ ...BTN('#1976D2') }}>📥 Танланган ({selectedTrIds.length} та) Excel</button>
                    )}
                    {selectedTrIds.length > 0 && (
                      <button onClick={()=>setSelectedTrIds([])}
                        style={{ ...BTN('#F5F7FA','#555'), border:'1.5px solid #ddd' }}>✕ Бекор</button>
                     )}
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:12 }}>
                    {trainings.map(t=>{
                      const wr = employees.filter(e=>e.examResults?.some(r=>r.trainingId===t.id))
                      const sc2 = wr.map(e=>e.examResults.find(r=>r.trainingId===t.id).totalScore)
                      const avg2 = sc2.length ? Math.round(sc2.reduce((a,b)=>a+b,0)/sc2.length) : null
                      const pass2 = wr.filter(e=>e.examResults.find(r=>r.trainingId===t.id)?.passed).length
                      return (
                        <div key={t.id} style={{ ...CARD, cursor:'pointer', marginBottom:0, borderTop:'3px solid #1976D2', position:'relative' }}>
                          <div style={{ position:'absolute', top:10, right:10 }} onClick={e=>e.stopPropagation()}>
                            <input type="checkbox" checked={selectedTrIds.includes(t.id)}
                              onChange={e=>{ e.stopPropagation(); setSelectedTrIds(p => p.includes(t.id) ? p.filter(id=>id!==t.id) : [...p, t.id]) }}
                              style={{ width:16, height:16, cursor:'pointer' }} />
                          </div>
                          <div onClick={()=>setSelTraining(t)}>
                          <div style={{ fontWeight:800, fontSize:14, marginBottom:4 }}>{t.title}</div>
                          <div style={{ fontSize:11, color:'#888', marginBottom:10 }}>{t.date}</div>
                          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                            <span style={{ background:'#EEF4FF', color:'#1565C0', borderRadius:8, padding:'2px 8px', fontSize:11, fontWeight:700 }}>{wr.length} натижа</span>
                            {avg2!=null && <span style={{ background:scoreBg(avg2), color:scoreColor(avg2), borderRadius:8, padding:'2px 8px', fontSize:11, fontWeight:700 }}>Avg: {avg2}</span>}
                            {sc2.length>0 && <span style={{ background:'#E8F5E9', color:'#2E7D32', borderRadius:8, padding:'2px 8px', fontSize:11, fontWeight:700 }}>✓ {pass2}</span>}
                          </div>
                        </div>
                      </div>
                     )
                    })}
                    {trainings.length===0 && !addingTr && <div style={{ ...CARD, color:'#aaa', textAlign:'center', padding:40 }}>Ҳали тренинг йўқ.</div>}
                  </div>
                </div>
              )
            }
          </div>
        )}

        {page==='exams' && bulkMode && selTraining && (
          <BulkEntry
            training={selTraining}
            employees={employees}
            session={selSession}
            onSave={handleBulkSaved}
            onCancel={()=>{ setBulkMode(false); setSelSession(null) }}
            onToast={showToast}
          />
        )}

        {/* PRAKTIKUM PAGE */}
        {page==='praktikum' && (
          <div>
            {addingPrak && (
              <div style={{ maxWidth:500, ...CARD }}>
                <h2 style={{ margin:'0 0 14px', fontSize:17 }}>{editingPrak ? 'Практикумни таҳрирлаш' : 'Янги практикум'}</h2>
                <label style={LBL}>Номи</label>
                <input value={newPrak.title} onChange={e=>setNewPrak(p=>({...p,title:e.target.value}))} placeholder="Практикум номи" style={{ ...SI, marginBottom:10 }} />
                <label style={LBL}>Сана</label>
                <input type="text" value={newPrak.date} onChange={e=>setNewPrak(p=>({...p,date:e.target.value}))} placeholder="2025-03-18" style={{ ...SI, marginBottom:10 }} />
                <label style={LBL}>Тавсиф / Уй вазифаси (ихтиёрий)</label>
                <textarea value={newPrak.description} onChange={e=>setNewPrak(p=>({...p,description:e.target.value}))} rows={3} placeholder="Практикум тавсифи..." style={{ ...SI, resize:'vertical', marginBottom:14 }} />
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={handleSavePrak} disabled={saving||!newPrak.title.trim()} style={{ ...BTN('#F59E0B'), flex:1, opacity:newPrak.title.trim()?1:0.4 }}>{saving?'Сақланяпти...':'Сақлаш'}</button>
                  <button onClick={()=>{ setAddingPrak(false); setEditingPrak(null); setNewPrak({ title:'', date:'', description:'' }) }} style={{ ...BTN('#F5F7FA','#555'), flex:1, border:'1.5px solid #ddd' }}>Бекор</button>
                </div>
              </div>
            )}

            {selPrak
              ? <PraktikumDashboard
                  prak={praktikums.find(p=>p.id===selPrak.id)||selPrak}
                  employees={employees}
                  onDelete={handleDeletePrak}
                  onEdit={p=>{ setEditingPrak(p); setNewPrak({ title:p.title, date:p.date||'', description:p.description||'' }); setAddingPrak(true) }}
                  onRefresh={async ()=>{ const praks = await fetchPraktikum(); setPraktikums(praks); setSelPrak(praks.find(p=>p.id===selPrak.id)||null) }}
                  showToast={showToast}
                  onShowQR={p=>setShowQR({ type:'praktikum', id: p.id, title: p.title })}
                />
              : !addingPrak && (
                <div>
                  <h2 style={{ marginTop:0, marginBottom:14, fontSize:17 }}>Барча практикумлар ({praktikums.length})</h2>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:12 }}>
                    {praktikums.map(p=>{
                      const starCount = (p.praktikum_participants||[]).filter(x=>x.star).length
                      const total = (p.praktikum_participants||[]).length
                      return (
                        <div key={p.id} onClick={()=>setSelPrak(p)} style={{ ...CARD, cursor:'pointer', marginBottom:0, borderTop:'3px solid #F59E0B' }}>
                          <div style={{ fontWeight:800, fontSize:14, marginBottom:4 }}>{p.title}</div>
                          <div style={{ fontSize:11, color:'#888', marginBottom:10 }}>{p.date}</div>
                          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                            <span style={{ background:'#FFFBEB', color:'#92400E', borderRadius:8, padding:'2px 8px', fontSize:11, fontWeight:700 }}>{total} иштирокчи</span>
                            <span style={{ background:'#FFFBEB', color:'#B45309', borderRadius:8, padding:'2px 8px', fontSize:11, fontWeight:700 }}>{starCount} ⭐</span>
                          </div>
                        </div>
                      )
                    })}
                    {praktikums.length===0 && !addingPrak && <div style={{ ...CARD, color:'#aaa', textAlign:'center', padding:40 }}>Ҳали практикум йўқ.</div>}
                  </div>
                </div>
              )
            }
          </div>
        )}
        {page==='sales' && (
          <div>
            <div style={{ display:'flex', gap:6, marginBottom:18 }}>
              {[['upload','📥 Юклаш'],['mapping','🗂️ Мослаштириш'],['report','📋 Ҳисобот'],['dashboard','🏆 Дашборд']].map(([t,l])=>(
                <button key={t} onClick={()=>setSalesPage(t)} style={{ padding:'8px 18px', borderRadius:8, border:'none', fontWeight:700, cursor:'pointer', fontSize:13, background:salesPage===t?'#1976D2':'#fff', color:salesPage===t?'#fff':'#555', boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>{l}</button>
              ))}
            </div>

            {salesPage==='upload' && (
              <div style={{ maxWidth:700 }}>
                <div style={{ ...CARD, borderTop:'4px solid #1976D2' }}>
                  <h2 style={{ margin:'0 0 6px', fontSize:17 }}>📥 Маълумотларни юклаш</h2>
                  <div style={{ fontSize:13, color:'#888', marginBottom:16 }}>Аввал Рееstr файлини, сўнгра Савдо файлини юкланг.</div>

                  <label style={LBL}>1. Рееstr файли (Реестр_Сотрудников...)</label>
                  <label style={{ display:'flex', alignItems:'center', gap:10, background:'#F0F4FF', border:'2px dashed #BBDEFB', borderRadius:10, padding:'16px 20px', cursor:'pointer', marginBottom:14 }}>
                    <span style={{ fontSize:28 }}>📋</span>
                    <div>
                      <div style={{ fontWeight:700, fontSize:13, color:'#1565C0' }}>Рееstr Excel файлини танланг</div>
                      <div style={{ fontSize:11, color:'#888' }}>Реестр_Сотрудников файли</div>
                    </div>
                    <input type="file" accept=".xlsx,.xls" style={{ display:'none' }} onChange={async e=>{
                      const file = e.target.files[0]
                      if (!file) return
                      setSalesLoading(true)
                      setUploadStatus('Рееstr файли ўқилмоқда...')
                      try {
                        const XLSX = await import('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm')
                        const buf = await file.arrayBuffer()
                        const wb = XLSX.read(buf, { type:'array' })
                        const ws = wb.Sheets[wb.SheetNames[0]]
                        const raw = XLSX.utils.sheet_to_json(ws, { header:1 })
                        const rows = []
                        for (let i = 1; i < raw.length; i++) {
                          const r = raw[i]
                          if (!r || !r[2]) continue
                          rows.push({
                            med_pred: r[3]?.toString()?.trim() || '',
                            komanda: r[2]?.toString()?.trim() || '',
                            postavshik: r[4]?.toString()?.trim() || '',
                            region: normalizeRegion(r[1]?.toString()),
                            crm_menejer: r[6]?.toString()?.trim() || '',
                            crm_savdo_vakili: r[7]?.toString()?.trim() || '',
                            is_mapped: !!(r[6]?.toString()?.trim() && r[7]?.toString()?.trim()),
                          })
                        }
                        await uploadSalesMapping(rows)
                        setUploadStatus('✅ Рееstr юкланди: ' + rows.length + ' та қатор')
                        showToast('Рееstr юкланди')
                      } catch(err) {
                        setUploadStatus('❌ Хатолик: ' + err.message)
                      } finally {
                        setSalesLoading(false)
                        e.target.value = ''
                      }
                    }} />
                  </label>

                  <label style={LBL}>2. Савдо файли (Отчет_Продажа_Общая...)</label>
                  <label style={{ display:'flex', alignItems:'center', gap:10, background:'#F0F4FF', border:'2px dashed #BBDEFB', borderRadius:10, padding:'16px 20px', cursor:'pointer', marginBottom:14 }}>
                    <span style={{ fontSize:28 }}>📊</span>
                    <div>
                      <div style={{ fontWeight:700, fontSize:13, color:'#1565C0' }}>Савдо Excel файлини танланг</div>
                      <div style={{ fontSize:11, color:'#888' }}>Отчет_Продажа_Общая файли</div>
                    </div>
                    <input type="file" accept=".xlsx,.xls" style={{ display:'none' }} onChange={async e=>{
                      const file = e.target.files[0]
                      if (!file) return
                      setSalesLoading(true)
                      setUploadStatus('Савдо файли ўқилмоқда...')
                      try {
                        const XLSX = await import('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm')
                        const buf = await file.arrayBuffer()
                        const wb = XLSX.read(buf, { type:'array', cellDates:false })

                        // Load mapping
                        const { data: mapping } = await supabase.from('sales_mapping').select('*')

                        let allRows = []
                        for (const shName of ['Продажа','Возврат']) {
                          const ws = wb.Sheets[shName]
                          if (!ws) continue
                          const raw = XLSX.utils.sheet_to_json(ws, { header:1 })
                          const tur = shName === 'Возврат' ? 'vozvrat' : 'savdo'
                          for (let i = 2; i < raw.length; i++) {
                            const r = raw[i]
                            if (!r || !r[0]) continue
                            let sana = null
                            try {
                              if (r[3]) {
                                if (typeof r[3] === 'number') {
                                  // Excel serial date number
                                  const d = new Date(Date.UTC(1899, 11, 30) + r[3] * 86400000)
                                  sana = d
                                } else if (r[3] instanceof Date) {
                                  sana = r[3]
                                } else {
                                  const s = r[3].toString().trim().substring(0, 10)
                                  sana = new Date(s)
                                }
                                if (isNaN(sana?.getTime())) sana = null
                              }
                            } catch(e) { sana = null }
                            const medPred = r[5]?.toString()?.trim() || ''
                            const komanda = r[7]?.toString()?.trim() || ''
                            const postavshik = r[8]?.toString()?.trim() || ''
                            const regionRaw = r[6]?.toString()?.trim() || ''

                           // Find in mapping
                           const mapped = mapping?.find(m =>
                             m.med_pred?.toLowerCase() === medPred?.toLowerCase() &&
                             m.komanda?.toLowerCase() === komanda?.toLowerCase()
                           )

                           allRows.push({
                             yonalish: r[0]?.toString()?.trim() || '',
                             yil: r[1] ? Number(r[1]) : (sana ? sana.getFullYear() : null),
                             oy: r[2] ? Number(r[2]) : (sana ? sana.getMonth()+1 : null),
                             sana: sana ? sana.toISOString().split('T')[0] : null,
                             hisob_faktura: r[4]?.toString()?.trim() || '',
                             savdo_vakili: medPred,
                             shahar: normalizeRegion(regionRaw) || normalizeRegionFromKomanda(komanda),
                             jamoa: komanda,
                             yetkazib_beruvchi: postavshik,
                             tashkilot: r[9]?.toString()?.trim() || '',
                             ishlab_chiqaruvchi: r[10]?.toString()?.trim() || '',
                             dori_nomi: r[12]?.toString()?.trim() || '',
                             miqdor: r[13] ? Number(r[13]) : null,
                             narx: r[14] ? Number(r[14]) : null,
                             summa: r[15] ? Number(r[15]) : null,
                             tur,
                             crm_menejer: mapped?.crm_menejer || '',
                             crm_savdo_vakili: mapped?.crm_savdo_vakili || '',
                             is_mapped: !!(mapped?.crm_menejer && mapped?.crm_savdo_vakili),
                          })
                        }
                      }
                      setUploadStatus(allRows.length + ' та қатор топилди. Юкланмоқда...')
                      await uploadSalesBatch(allRows)
                      setUploadStatus('✅ ' + allRows.length + ' та қатор юкланди!')
                      showToast(allRows.length + ' та савдо юкланди')
                    } catch(err) {
                      setUploadStatus('❌ Хатолик: ' + err.message)
                    } finally {
                      setSalesLoading(false)
                      e.target.value = ''
                    }
                  }} />
                </label>

                {uploadStatus && (
                  <div style={{ background: uploadStatus.startsWith('✅') ? '#E8F5E9' : uploadStatus.startsWith('❌') ? '#FFEBEE' : '#FFF8E1', border:'1.5px solid', borderColor: uploadStatus.startsWith('✅') ? '#A5D6A7' : uploadStatus.startsWith('❌') ? '#FFCDD2' : '#FFE082', borderRadius:8, padding:'10px 14px', fontSize:13, fontWeight:600, color: uploadStatus.startsWith('✅') ? '#2E7D32' : uploadStatus.startsWith('❌') ? '#C62828' : '#7B5800', marginBottom:14 }}>
                    {uploadStatus}
                  </div>
                 )}

                 <div style={{ ...CARD, borderTop:'4px solid #C62828', marginTop:4 }}>
                   <div style={{ fontWeight:800, fontSize:15, marginBottom:6, color:'#C62828' }}>🗑️ Маълумотларни ўчириш</div>
                   <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
                     <div><label style={LBL}>Йил</label>
                       <select value={delYil} onChange={e=>setDelYil(e.target.value)} style={{ ...SI, width:100 }}>
                         <option value=''>—</option>
                         {[2024,2025,2026].map(y=><option key={y}>{y}</option>)}
                        </select>
                      </div>
                      <div><label style={LBL}>Ой</label>
                        <select value={delOy} onChange={e=>setDelOy(e.target.value)} style={{ ...SI, width:130 }}>
                          <option value=''>—</option>
                          {[1,2,3,4,5,6,7,8,9,10,11,12].map(m=><option key={m} value={m}>{m}-ой</option>)}
                        </select>
                      </div>
                      <div><label style={LBL}>Йўналиш</label>
                        <select value={delFirma} onChange={e=>setDelFirma(e.target.value)} style={{ ...SI, width:110 }}>
                          <option value=''>—</option>
                          {['PPS','IPS','RMF','PPHS-II','SAVA'].map(f=><option key={f}>{f}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      <button onClick={async ()=>{
                        if (!delYil && !delOy && !delFirma) { showToast('Камида биттасини танланг', 'error'); return }
                        if (!window.confirm('Ўчирилади?')) return
                        try {
                          await deleteSalesByFilter(delYil, delOy, delFirma)
                          showToast('Ўчирилди')
                          setDelYil(''); setDelOy(''); setDelFirma('')
                        } catch(e) { showToast('Хатолик: ' + e.message, 'error') }
                      }} style={{ ...BTN('#FFEBEE','#C62828'), border:'1.5px solid #FFCDD2' }}>🗑️ Савдони ўчириш</button>
                      <button onClick={async ()=>{
                        if (!window.confirm('БАРЧА план-факт ўчирилади?')) return
                        try { await deleteAllPlanFakt(); showToast('Ўчирилди') }
                        catch(e) { showToast('Хатолик: ' + e.message, 'error') }
                      }} style={{ ...BTN('#FFEBEE','#C62828'), border:'1.5px solid #FFCDD2' }}>🗑️ План-фактни ўчириш</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {salesPage==='mapping' && <SalesMappingPage showToast={showToast} />}
            {salesPage==='report' && <SalesReport fetchSales={fetchSales} showToast={showToast} employees={employees} />}
            {salesPage==='dashboard' && <SalesDashboard fetchSales={fetchSales} fetchPlanFakt={fetchPlanFakt} showToast={showToast} />}
          </div>
        )}
      </div>

      {showQR && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'#fff', borderRadius:20, padding:28, maxWidth:380, width:'100%', textAlign:'center', boxShadow:'0 8px 32px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize:13, color:'#888', marginBottom:6, textTransform:'uppercase', fontWeight:700, letterSpacing:0.5 }}>QR Код — Давомат</div>
            <h2 style={{ margin:'0 0 16px', fontSize:18 }}>{showQR.title}</h2>
            <img
              src={'https://api.qrserver.com/v1/create-qr-code/?size=220x220&color=1B5E20&bgcolor=ffffff&data=' + encodeURIComponent('https://proficlub-crm.vercel.app/attendance/' + showQR.type + '/' + showQR.id)}
              width={220} height={220}
              alt="QR"
              style={{ borderRadius:12, border:'1.5px solid #E0E0E0' }}
            />
            <div style={{ fontSize:12, color:'#aaa', marginTop:10, marginBottom:16, wordBreak:'break-all' }}>
              {'proficlub-crm.vercel.app/attendance/' + showQR.type + '/' + showQR.id}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <a
                href={'https://api.qrserver.com/v1/create-qr-code/?size=500x500&color=1B5E20&bgcolor=ffffff&data=' + encodeURIComponent('https://proficlub-crm.vercel.app/attendance/' + showQR.type + '/' + showQR.id)}
                download={'qr_' + showQR.title + '.png'}
                style={{ flex:1, padding:'12px', background:'#E8F5E9', color:'#1B5E20', borderRadius:12, fontWeight:700, fontSize:13, textDecoration:'none', border:'1.5px solid #A5D6A7' }}>
                📥 Юклаш
              </a>
              <button onClick={()=>setShowQR(null)}
                style={{ flex:1, padding:'12px', background:'#F5F7FA', color:'#555', border:'1.5px solid #E0E0E0', borderRadius:12, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                ✕ Ёпиш
              </button>
            </div>
          </div>
        </div>
      )}
      
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  )
}

