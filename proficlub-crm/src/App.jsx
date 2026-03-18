import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  fetchEmployees, createEmployee, updateEmployee, deleteEmployee,
  fetchTrainings, createTraining, deleteTraining, saveBulkExamResults,
} from './lib/db'

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const ROLES = ['Менежер','МП','Оператор','Ҳайдовчи','Таҳлилчи','Администратор']
const ROLE_COLORS = {
  'Менежер':       { bg:'#E8F4FD', text:'#1565C0', dot:'#1976D2' },
  'МП':            { bg:'#E8F5E9', text:'#2E7D32', dot:'#388E3C' },
  'Оператор':      { bg:'#F3E5F5', text:'#6A1B9A', dot:'#8E24AA' },
  'Ҳайдовчи':      { bg:'#FFF3E0', text:'#E65100', dot:'#F57C00' },
  'Таҳлилчи':      { bg:'#E0F2F1', text:'#00695C', dot:'#00897B' },
  'Администратор': { bg:'#FCE4EC', text:'#880E4F', dot:'#C2185B' },
}
const ROLE_FIELDS = {
  'Менежер': [
    { key:'birthDate',     label:'Туғилган санаси',                    type:'date' },
    { key:'education',     label:'Таълим муассасаси',                  type:'text' },
    { key:'specialty',     label:'Дипломдаги мутахассислик',           type:'text' },
    { key:'courses',       label:'Курслар / малака ошириш',            type:'text' },
    { key:'hireDate',      label:'Иш бошлаган сана',                   type:'date' },
    { key:'sales6Month',   label:'Охирги 6 ой савдо (сўм)',            type:'text' },
    { key:'planPercent',   label:'Савдо режаси (%)',                   type:'number' },
    { key:'promoList',     label:'Промоция дорилар рўйхати',           type:'textarea' },
    { key:'teamSize',      label:'Жамоасидаги ходимлар сони',          type:'number' },
    { key:'staffTurnover', label:'Ходимлар алмашуви',                  type:'text' },
  ],
  'МП': [
    { key:'birthDate',     label:'Туғилган санаси',                    type:'date' },
    { key:'education',     label:'Таълим муассасаси',                  type:'text' },
    { key:'specialty',     label:'Дипломдаги мутахассислик',           type:'text' },
    { key:'courses',       label:'Курслар / малака ошириш',            type:'textarea' },
    { key:'hireDate',      label:'Иш бошлаган сана',                   type:'date' },
    { key:'sales6Month',   label:'Охирги 6 ой савдо (сўм)',            type:'text' },
    { key:'staffTurnover', label:'Ходимлар алмашуви',                  type:'textarea' },
  ],
  'Оператор': [
    { key:'birthDate',        label:'Туғилган санаси',                 type:'date' },
    { key:'education',        label:'Таълим муассасаси',               type:'text' },
    { key:'specialty',        label:'Дипломдаги мутахассислик',        type:'text' },
    { key:'courses',          label:'Курслар / малака ошириш',         type:'textarea' },
    { key:'hireDate',         label:'Иш бошлаган сана',                type:'date' },
    { key:'currentPosition',  label:'Ҳозирги лавозими',               type:'text' },
    { key:'shift',            label:'Иш смена',                        type:'text' },
  ],
  'Ҳайдовчи': [
    { key:'birthDate',        label:'Туғилган санаси',                 type:'date' },
    { key:'education',        label:'Таълим муассасаси',               type:'text' },
    { key:'hireDate',         label:'Иш бошлаган сана',                type:'date' },
    { key:'licenseCategory',  label:'Ҳайдовчилик гувоҳномаси',        type:'text' },
    { key:'vehicleType',      label:'Транспорт тури',                  type:'text' },
    { key:'region',           label:'Хизмат кўрсатувчи ҳудуд',        type:'text' },
  ],
  'Таҳлилчи': [
    { key:'birthDate',    label:'Туғилган санаси',                     type:'date' },
    { key:'education',    label:'Таълим муассасаси',                   type:'text' },
    { key:'specialty',    label:'Дипломдаги мутахассислик',            type:'text' },
    { key:'courses',      label:'Курслар / малака ошириш',             type:'textarea' },
    { key:'hireDate',     label:'Иш бошлаган сана',                    type:'date' },
    { key:'software',     label:'Ишлатадиган дастурлар',               type:'text' },
    { key:'reportType',   label:'Тайёрлайдиган ҳисоботлар',           type:'textarea' },
  ],
  'Администратор': [
    { key:'birthDate',        label:'Туғилган санаси',                 type:'date' },
    { key:'education',        label:'Таълим муассасаси',               type:'text' },
    { key:'specialty',        label:'Дипломдаги мутахассислик',        type:'text' },
    { key:'courses',          label:'Курслар / малака ошириш',         type:'textarea' },
    { key:'hireDate',         label:'Иш бошлаган сана',                type:'date' },
    { key:'initialPosition',  label:'Бошланғич лавозим',              type:'text' },
    { key:'currentPosition',  label:'Ҳозирги лавозим',                type:'text' },
  ],
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
const scoreColor = s => !s && s !== 0 ? '#aaa' : s >= 85 ? '#2E7D32' : s >= 70 ? '#F57C00' : '#C62828'
const scoreBg    = s => !s && s !== 0 ? '#f0f0f0' : s >= 85 ? '#E8F5E9' : s >= 70 ? '#FFF8E1' : '#FFEBEE'

// ── SMALL UI ──────────────────────────────────────────────────────────────────
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

// ── STYLES ────────────────────────────────────────────────────────────────────
const SI   = { width:'100%', padding:'8px 12px', border:'1.5px solid #E0E0E0', borderRadius:8, fontSize:13, fontFamily:'inherit', outline:'none', background:'#FAFAFA', boxSizing:'border-box' }
const BTN  = (bg, color='#fff', extra={}) => ({ padding:'8px 16px', background:bg, color, border:'none', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:13, ...extra })
const CARD = { background:'#fff', borderRadius:14, padding:'18px 20px', boxShadow:'0 2px 10px rgba(0,0,0,0.06)', marginBottom:14 }
const LBL  = { fontSize:11, fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:0.5, marginBottom:5, display:'block' }

// ── TRAINING DASHBOARD ────────────────────────────────────────────────────────
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

function TrainingDashboard({ training, employees, onBulkEntry, onDeleteTraining, onViewEmployee }) {
  const [tab, setTab] = useState('overview')
  const [sortBy, setSortBy] = useState('score_desc')

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
    <div>
      <div style={{ ...CARD, borderTop:'4px solid #1976D2' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:10 }}>
          <div>
            <div style={{ fontSize:11, color:'#1976D2', fontWeight:700, textTransform:'uppercase', letterSpacing:0.5, marginBottom:4 }}>Трениг Дашборди</div>
            <h2 style={{ margin:'0 0 4px', fontSize:20 }}>{training.title}</h2>
            <div style={{ fontSize:12, color:'#888' }}>{training.date} · {(training.questions||[]).length} та очиқ савол · {withResult.length}/{employees.length} натижа</div>
          </div>
          <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
            <button onClick={()=>onBulkEntry(training)} style={{ ...BTN('linear-gradient(135deg,#1565C0,#42A5F5)'), boxShadow:'0 2px 8px rgba(21,101,192,0.25)' }}>⚡ Натижа киритиш</button>
            <button onClick={()=>onDeleteTraining(training.id)} style={{ ...BTN('#FFEBEE','#C62828'), border:'1.5px solid #FFCDD2' }}>🗑️</button>
          </div>
        </div>
      </div>

      <div style={{ display:'flex', gap:6, marginBottom:14 }}>
        {[['overview','📊 Умумий'],['results','📋 Натижалар'],['answers','📝 Жавоблар']].map(([t,l])=>(
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
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:10 }}>
              {[{ label:'🥇 Top 3 иштирокчи', arr:[...withResult].sort((a,b)=>b.res.totalScore-a.res.totalScore).slice(0,3), border:'#4CAF50', titleColor:'#2E7D32', medals:['#FFD700','#C0C0C0','#CD7F32'] },
                { label:'⚠️ Эътибор талаб', arr:[...withResult].sort((a,b)=>a.res.totalScore-b.res.totalScore).slice(0,3), border:'#EF5350', titleColor:'#C62828', medals:['#FFEBEE','#FFEBEE','#FFEBEE'], medalText:'#C62828' }
              ].map(({ label, arr, border, titleColor, medals, medalText='#fff' }) => (
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
                {['#','Ходим','Лавозим','Балл','Ҳолат','Сана'].map(h=>(
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
    </div>
  )
}

// ── BULK ENTRY ────────────────────────────────────────────────────────────────
function BulkEntry({ training, employees, onSave, onCancel, onToast }) {
  const [scores, setScores]   = useState({})
  const [search, setSearch]   = useState('')
  const [saving, setSaving]   = useState(false)

  useEffect(()=>{
    const init = {}
    employees.forEach(e=>{
      const ex = e.examResults?.find(r=>r.trainingId===training.id)
      if (ex) init[e.id] = { mcScore:ex.mcScore, openAnswers:ex.openAnswers?.reduce((a,x)=>({...a,[x.q]:x.a}),{})||{} }
    })
    setScores(init)
  },[training.id, employees])

  const filledCount = Object.keys(scores).filter(id=>scores[id]?.mcScore!==''&&scores[id]?.mcScore!=null).length
  const filtered = employees.filter(e=>e.name.toLowerCase().includes(search.toLowerCase()))

  async function handleSave() {
    setSaving(true)
    try {
      const updates = Object.entries(scores)
        .filter(([,s])=>s?.mcScore!==''&&s?.mcScore!=null)
        .map(([empId,s])=>({
          empId: Number(empId),
          score: Number(s.mcScore),
          openAnswers: (training.questions||[]).map(q=>({ q, a:s.openAnswers?.[q]||'' })),
        }))
      await saveBulkExamResults(training, updates)
      onToast(`${updates.length} та натижа сақланди`)
      onSave()
    } catch(e) {
      onToast('Хатолик: ' + e.message, 'error')
    } finally {
      setSaving(false)
    }
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
          <button onClick={handleSave} disabled={saving||filledCount===0} style={{ ...BTN('#388E3C'), opacity:filledCount>0?1:0.5, boxShadow:'0 2px 8px rgba(56,142,60,0.25)' }}>{saving ? 'Сақланяпти...' : `✅ ${filledCount} та сақлаш`}</button>
          <button onClick={onCancel} style={{ ...BTN('#F5F7FA','#555'), border:'1.5px solid #ddd' }}>← Орқага</button>
        </div>
      </div>
      <div style={{ background:'#FFF8E1', border:'1.5px solid #FFE082', borderRadius:10, padding:'10px 14px', marginBottom:14, fontSize:13, color:'#7B5800' }}>
        💡 Тест баллини киритинг (0–100). Ўтиш чегараси: <strong>70 балл</strong>.
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
            </tr>
          </thead>
          <tbody>
            {filtered.map((emp,idx)=>{
              const sc = scores[emp.id] || {}
              const has = sc.mcScore !== '' && sc.mcScore != null
              const sn  = Number(sc.mcScore)
              return (
                <tr key={emp.id} style={{ borderTop:'1px solid #F0F0F0', background:has?(sn>=70?'rgba(76,175,80,0.04)':'rgba(239,83,80,0.04)'):'transparent' }}>
                  <td style={{ padding:'7px 14px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:11, color:'#bbb', width:20 }}>{idx+1}</span>
                      <Avatar name={emp.name} size={28} />
                      <div><div style={{ fontWeight:600, fontSize:12 }}>{emp.name}</div><Badge role={emp.role} /></div>
                    </div>
                  </td>
                  <td style={{ padding:'7px 14px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <input type="number" min="0" max="100"
                        value={sc.mcScore??''}
                        onChange={e=>setScores(p=>({...p,[emp.id]:{...p[emp.id],mcScore:e.target.value}}))}
                        placeholder="—"
                        style={{ width:64, padding:'6px 8px', border:'1.5px solid', borderColor:has?(sn>=70?'#A5D6A7':'#EF9A9A'):'#E0E0E0', borderRadius:7, fontSize:14, fontWeight:800, textAlign:'center', outline:'none', background:'#fff', color:has?scoreColor(sn):'#333' }} />
                      {has && <span style={{ fontSize:11, fontWeight:700, color:sn>=70?'#388E3C':'#C62828' }}>{sn>=70?'✓':'✗'}</span>}
                    </div>
                  </td>
                  {(training.questions||[]).map((q,i)=>(
                    <td key={i} style={{ padding:'7px 10px' }}>
                      <textarea rows={2} value={sc.openAnswers?.[q]||''}
                        onChange={e=>setScores(p=>({...p,[emp.id]:{...p[emp.id],openAnswers:{...(p[emp.id]?.openAnswers||{}),[q]:e.target.value}}}))}
                        placeholder="Жавоб..." style={{ width:150, padding:'5px 8px', border:'1.5px solid #E0E0E0', borderRadius:7, fontSize:12, fontFamily:'inherit', resize:'none', outline:'none', background:'#FAFAFA' }} />
                    </td>
                  ))}
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

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [employees, setEmployees] = useState([])
  const [trainings, setTrainings] = useState([])
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
  const [addingTr, setAddingTr]   = useState(false)
  const [newTr, setNewTr]         = useState({ title:'', date:'', questions:[''] })

  const showToast = useCallback((msg, type='success') => {
    setToast({ msg, type })
    setTimeout(()=>setToast(null), 3000)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [emps, trs] = await Promise.all([fetchEmployees(), fetchTrainings()])
      setEmployees(emps)
      setTrainings(trs)
    } catch(e) {
      showToast('Маълумотларни юклаб бўлмади: ' + e.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(()=>{ load() }, [load])

  const filtered = useMemo(()=>employees.filter(e=>
    e.name.toLowerCase().includes(search.toLowerCase()) &&
    (filterRole==='Барчаси' || e.role===filterRole)
  ), [employees, search, filterRole])

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
    try {
      const created = await createTraining({ ...newTr, questions:newTr.questions.filter(q=>q.trim()) })
      setTrainings(p=>[created,...p])
      setAddingTr(false); setNewTr({ title:'', date:'', questions:[''] })
      setSelTraining(created)
      showToast(`"${created.title}" тренинги яратилди`)
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

  function handleBulkSaved() {
    setBulkMode(false)
    load() // reload all employees to get fresh exam results
  }

  function goToEmployee(id) {
    setSelected(id); setEmpTab('exams'); setPage('employees'); setBulkMode(false)
  }

  const navBtn = active => ({ padding:'8px 14px', background:active?'#1976D2':'transparent', color:active?'#fff':'#555', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:13 })

  return (
    <div style={{ display:'flex', height:'100vh', fontFamily:"'Segoe UI', Tahoma, sans-serif", background:'#F5F7FA', color:'#1A1A2E' }}>

      {/* ── SIDEBAR ── */}
      <div style={{ width:272, minWidth:272, background:'#fff', borderRight:'1.5px solid #EBEBEB', display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'16px 14px 12px', borderBottom:'1.5px solid #EBEBEB' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:'linear-gradient(135deg,#1565C0,#42A5F5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>💊</div>
            <div><div style={{ fontWeight:800, fontSize:14 }}>ПрофиКлуб CRM</div><div style={{ fontSize:10, color:'#888' }}>Ходимлар базаси · {employees.length} та</div></div>
          </div>
          <div style={{ display:'flex', gap:4 }}>
            <button style={navBtn(page==='employees')} onClick={()=>{ setPage('employees'); setBulkMode(false) }}>👥 Ходимлар</button>
            <button style={navBtn(page==='exams')} onClick={()=>{ setPage('exams'); setBulkMode(false) }}>📋 Тренинглар</button>
          </div>
        </div>

        {page==='employees' && <>
          <div style={{ padding:'10px 12px 6px' }}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Қидириш..." style={{ ...SI, marginBottom:8 }} />
            <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
              {['Барчаси',...ROLES].map(r=>(
                <button key={r} onClick={()=>setFilterRole(r)} style={{ padding:'3px 8px', borderRadius:20, border:'1.5px solid', fontSize:10, fontWeight:700, cursor:'pointer', borderColor:filterRole===r?'#1976D2':'#E0E0E0', background:filterRole===r?'#1976D2':'#fff', color:filterRole===r?'#fff':'#666' }}>{r}</button>
              ))}
            </div>
          </div>
          <div style={{ flex:1, overflowY:'auto' }}>
            {loading ? <Spinner /> : filtered.map(emp=>{
              const last = emp.examResults?.slice(-1)[0]
              return (
                <div key={emp.id} onClick={()=>{ setSelected(emp.id); setEditing(false); setEmpTab('info'); setAdding(false) }} style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 12px', cursor:'pointer', background:selected===emp.id?'#EEF4FF':'transparent', borderLeft:selected===emp.id?'3px solid #1976D2':'3px solid transparent' }}>
                  <Avatar name={emp.name} size={34} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:12, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{emp.name}</div>
                    <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:2 }}><Badge role={emp.role} />{last && <span style={{ fontSize:10, fontWeight:700, color:scoreColor(last.totalScore) }}>{last.totalScore}</span>}</div>
                  </div>
                </div>
              )
            })}
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
            <button onClick={()=>setAddingTr(true)} style={{ ...BTN('#F0F4FF','#1565C0'), width:'100%', padding:'10px' }}>+ Янги тренинг</button>
          </div>
        </>}
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex:1, overflowY:'auto', padding:22 }}>

        {/* Add Employee */}
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

        {/* Employee Detail */}
        {page==='employees' && selEmp && !adding && (()=>{
          const fields = ROLE_FIELDS[selEmp.role] || []
          return (
            <div>
              <div style={{ ...CARD, display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
                <Avatar name={selEmp.name} size={50} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:19, fontWeight:800 }}>{selEmp.name}</div>
                  <div style={{ marginTop:5, display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                    <Badge role={selEmp.role} />
                    {selEmp.hireDate && <span style={{ fontSize:11, color:'#888' }}>Иш бошлаган: {selEmp.hireDate}</span>}
                    <span style={{ fontSize:11, color:'#888' }}>{selEmp.examResults?.length||0} та имтиҳон</span>
                  </div>
                </div>
                <div style={{ display:'flex', gap:7 }}>
                  {!editing
                    ? <><button onClick={()=>{ setEditData({...selEmp}); setEditing(true) }} style={BTN('#1976D2')}>✏️ Таҳрирлаш</button><button onClick={()=>setDelConfirm(selEmp.id)} style={{ ...BTN('#FFF0F0','#C62828'), border:'1.5px solid #FFCDD2' }}>🗑️</button></>
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
                {[['info','📋 Маълумотлар'],[`exams`,`📊 Имтиҳонлар (${selEmp.examResults?.length||0})`]].map(([t,l])=>(
                  <button key={t} onClick={()=>setEmpTab(t)} style={{ padding:'7px 16px', borderRadius:8, border:'none', fontWeight:700, cursor:'pointer', fontSize:12, background:empTab===t?'#1976D2':'#fff', color:empTab===t?'#fff':'#555', boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>{l}</button>
                ))}
              </div>

              {empTab==='info' && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:10 }}>
                  {fields.map(f=>{
                    const val = editing ? editData[f.key] : selEmp[f.key]
                    if (!editing && !val) return null
                    return (
                      <div key={f.key} style={{ ...CARD, gridColumn:f.type==='textarea'?'1/-1':'auto', marginBottom:0 }}>
                        <label style={LBL}>{f.label}</label>
                        {editing
                          ? f.type==='textarea'
                            ? <textarea value={editData[f.key]||''} onChange={e=>setEditData(p=>({...p,[f.key]:e.target.value}))} rows={3} style={{ ...SI, resize:'vertical' }} />
                            : <input type={f.type==='date'?'date':f.type==='number'?'number':'text'} value={editData[f.key]||''} onChange={e=>setEditData(p=>({...p,[f.key]:e.target.value}))} style={SI} />
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
            </div>
          )
        })()}

        {/* Empty state */}
        {page==='employees' && !selEmp && !adding && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'80%', color:'#ccc' }}>
            <div style={{ fontSize:48, marginBottom:10 }}>👈</div>
            <div style={{ fontSize:15, fontWeight:600 }}>Ходимни танланг</div>
            <div style={{ fontSize:13, marginTop:4 }}>Жами {employees.length} та ходим</div>
          </div>
        )}

        {/* EXAMS PAGE */}
        {page==='exams' && !bulkMode && (
          <div>
            {addingTr && (
              <div style={{ maxWidth:500, ...CARD }}>
                <h2 style={{ margin:'0 0 14px', fontSize:17 }}>Янги тренинг қўшиш</h2>
                <label style={LBL}>Тренинг номи</label>
                <input value={newTr.title} onChange={e=>setNewTr(p=>({...p,title:e.target.value}))} placeholder="Тренинг номи" style={{ ...SI, marginBottom:10 }} />
                <label style={LBL}>Сана</label>
                <input type="date" value={newTr.date} onChange={e=>setNewTr(p=>({...p,date:e.target.value}))} style={{ ...SI, marginBottom:10 }} />
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
                  <button onClick={()=>setAddingTr(false)} style={{ ...BTN('#F5F7FA','#555'), flex:1, border:'1.5px solid #ddd' }}>Бекор</button>
                </div>
              </div>
            )}

            {selTraining
              ? <TrainingDashboard
                  training={selTraining}
                  employees={employees}
                  onBulkEntry={t=>{ setSelTraining(t); setBulkMode(true) }}
                  onDeleteTraining={handleDeleteTraining}
                  onViewEmployee={goToEmployee}
                />
              : !addingTr && (
                <div>
                  <h2 style={{ marginTop:0, marginBottom:14, fontSize:17 }}>Барча тренинглар ({trainings.length})</h2>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:12 }}>
                    {trainings.map(t=>{
                      const wr  = employees.filter(e=>e.examResults?.some(r=>r.trainingId===t.id))
                      const sc2 = wr.map(e=>e.examResults.find(r=>r.trainingId===t.id).totalScore)
                      const avg2 = sc2.length ? Math.round(sc2.reduce((a,b)=>a+b,0)/sc2.length) : null
                      const pass2 = wr.filter(e=>e.examResults.find(r=>r.trainingId===t.id)?.passed).length
                      return (
                        <div key={t.id} onClick={()=>setSelTraining(t)} style={{ ...CARD, cursor:'pointer', marginBottom:0, borderTop:'3px solid #1976D2' }}>
                          <div style={{ fontWeight:800, fontSize:14, marginBottom:4 }}>{t.title}</div>
                          <div style={{ fontSize:11, color:'#888', marginBottom:10 }}>{t.date}</div>
                          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                            <span style={{ background:'#EEF4FF', color:'#1565C0', borderRadius:8, padding:'2px 8px', fontSize:11, fontWeight:700 }}>{wr.length} натижа</span>
                            {avg2!=null && <span style={{ background:scoreBg(avg2), color:scoreColor(avg2), borderRadius:8, padding:'2px 8px', fontSize:11, fontWeight:700 }}>Avg: {avg2}</span>}
                            {sc2.length>0 && <span style={{ background:'#E8F5E9', color:'#2E7D32', borderRadius:8, padding:'2px 8px', fontSize:11, fontWeight:700 }}>✓ {pass2}</span>}
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

        {/* BULK ENTRY */}
        {page==='exams' && bulkMode && selTraining && (
          <BulkEntry
            training={selTraining}
            employees={employees}
            onSave={handleBulkSaved}
            onCancel={()=>setBulkMode(false)}
            onToast={showToast}
          />
        )}
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  )
}
