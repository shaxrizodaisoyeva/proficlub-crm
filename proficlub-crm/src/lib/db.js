import { supabase } from './supabase'

// ── EMPLOYEES ────────────────────────────────────────────────────────────────

export async function fetchEmployees() {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('name')
  
  if (error) throw error
  
  return data.map(row => ({
    id: row.id,
    name: row.name,
    role: row.role,
    // БУ ЕРДА organization НИ АНИҚ КЎРСАТИБ ЎТАМИЗ:
    organization: row.organization || row.data?.organization || '',
    examResults: row.exam_results ?? [],
    data: row.data, // Асосий data объектни ҳам сақлаб қоламиз
    ...row.data,
  }))
}

export async function createEmployee(emp) {
  const { name, role, examResults = [], ...rest } = emp
  const { data, error } = await supabase
    .from('employees')
    .insert({ name, role, exam_results: examResults, data: rest })
    .select()
    .single()
  if (error) throw error
  return { id: data.id, name: data.name, role: data.role, examResults: data.exam_results ?? [], ...data.data }
}

export async function updateEmployee(id, emp) {
  const { name, role, examResults = [], ...rest } = emp
  const { error } = await supabase
    .from('employees')
    .update({ name, role, exam_results: examResults, data: rest })
    .eq('id', id)
  if (error) throw error
}

export async function deleteEmployee(id) {
  const { error } = await supabase.from('employees').delete().eq('id', id)
  if (error) throw error
}

// ── TRAININGS ────────────────────────────────────────────────────────────────

export async function fetchTrainings() {
  const { data, error } = await supabase
    .from('trainings')
    .select('*')
    .order('date', { ascending: false })
  if (error) throw error
  return data.map(row => ({
  id: row.id,
  title: row.title,
  date: row.date,
  questions: row.questions ?? [],
  materials: row.materials ?? [],
  }))
}

export async function createTraining(tr) {
  const id = 't' + Date.now()
  const { data, error } = await supabase
    .from('trainings')
    .insert({ id, title: tr.title, date: tr.date, questions: tr.questions ?? [] })
    .select()
    .single()
  if (error) throw error
  return { id: data.id, title: data.title, date: data.date, questions: data.questions ?? [] }
}

export async function deleteTraining(id) {
  const { error } = await supabase.from('trainings').delete().eq('id', id)
  if (error) throw error
}

// ── BULK EXAM SAVE ────────────────────────────────────────────────────────────
// Takes an array of { empId, score, openAnswers } and updates each employee's exam_results

export async function saveBulkExamResults(training, updates) {
  // Fetch current exam_results for all affected employees
  const ids = updates.map(u => u.empId)
  const { data: rows, error } = await supabase
    .from('employees')
    .select('id, exam_results')
    .in('id', ids)
  if (error) throw error

  const promises = rows.map(row => {
    const update = updates.find(u => u.empId === row.id)
    if (!update) return Promise.resolve()
    const existing = (row.exam_results ?? []).filter(r => r.trainingId !== training.id)
    const newResult = {
      trainingId: training.id,
      date: training.date,
      mcScore: update.score,
      totalScore: update.score,
      passed: update.score >= 60,
      openAnswers: update.openAnswers ?? [],
    }
    return supabase
      .from('employees')
      .update({ exam_results: [...existing, newResult] })
      .eq('id', row.id)
  })
  await Promise.all(promises)
}

// ── SESSIONS ────────────────────────────────────────────────────────────────
export async function fetchSessions(trainingId) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*, session_participants(*, employees(id, name, role))')
    .eq('training_id', trainingId)
    .order('date')
  if (error) throw error
  return data
}

export async function createSession(trainingId, { city, date, trainer }) {
  const { data, error } = await supabase
    .from('sessions')
    .insert({ training_id: trainingId, city, date, trainer })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteSession(id) {
  const { error } = await supabase.from('sessions').delete().eq('id', id)
  if (error) throw error
}

export async function saveSessionParticipants(sessionId, participants) {
  // Delete existing first
  await supabase.from('session_participants').delete().eq('session_id', sessionId)
  if (!participants.length) return
  const { error } = await supabase
    .from('session_participants')
    .insert(participants.map(p => ({
      session_id: sessionId,
      employee_id: p.employeeId,
      score: p.score ?? null,
      passed: p.score != null ? p.score >= 70 : null,
      open_answers: p.openAnswers ?? [],
    })))
  if (error) throw error
}

// ── PRAKTIKUM ────────────────────────────────────────────────────────────────
export async function fetchPraktikum() {
  const { data, error } = await supabase
    .from('praktikum')
    .select('*, praktikum_participants(*, employees(id, name, role))')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createPraktikum(p) {
  const { data, error } = await supabase
    .from('praktikum')
    .insert({ title: p.title, date: p.date, description: p.description || null })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updatePraktikum(id, fields) {
  const { error } = await supabase
    .from('praktikum')
    .update(fields)
    .eq('id', id)
  if (error) throw error
}

export async function deletePraktikum(id) {
  const { error } = await supabase.from('praktikum').delete().eq('id', id)
  if (error) throw error
}

export async function addPraktikumParticipant(praktikumId, employeeId) {
  const { error } = await supabase
    .from('praktikum_participants')
    .insert({ praktikum_id: praktikumId, employee_id: employeeId, star: true })
  if (error) throw error
}

export async function updatePraktikumParticipant(id, fields) {
  const { error } = await supabase
    .from('praktikum_participants')
    .update(fields)
    .eq('id', id)
  if (error) throw error
}

export async function removePraktikumParticipant(id) {
  const { error } = await supabase
    .from('praktikum_participants')
    .delete()
    .eq('id', id)
  if (error) throw error
}
