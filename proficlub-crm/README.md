# 💊 ПрофиКлуб CRM

React + Supabase асосидаги CRM тизими.
Маълумотлар базада сақланади — код ўзгармайди!

---

## 🚀 Жойлаштириш қадамлари (45 дақиқа)

### 1-қадам — GitHub (5 дақ)
1. [github.com](https://github.com) → Sign up → бепул аккаунт
2. **New repository** → nom: `proficlub-crm` → **Public** → Create
3. **"uploading an existing file"** → бу папкадаги барча файлларни юклаш → Commit

### 2-қадам — Supabase (10 дақ)
1. [supabase.com](https://supabase.com) → Start project → GitHub билан кириш
2. **New project** → nom: `proficlub-crm` → region: **Singapore** → Create
3. Лойиҳа яратилгандан сўнг: **Settings → API** — 2 та нарсани кўчиринг:
   - `Project URL` → `https://xxxx.supabase.co`
   - `anon public key` → `eyJhbGci...`
4. **SQL Editor** → `supabase-setup.sql` файлини очиб, барча мазмунни кириб → **Run**

### 3-қадам — Vercel (10 дақ)
1. [vercel.com](https://vercel.com) → Sign up → GitHub билан кириш
2. **Add New Project** → `proficlub-crm` репозиторияни танлаш → Import
3. **Environment Variables** бўлимига қўшиш:
   ```
   VITE_SUPABASE_URL       = https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY  = eyJhbGci...
   ```
4. **Deploy** → 2-3 дақиқа кутиш

### 4-қадам — Тайёр! 🎉
Сизга ҳавола берилади: `https://proficlub-crm.vercel.app`
- Ёрдамчиларингизга шу ҳаволани жўборинг
- Барчаси бир вақтда ишлаши мумкин
- Маълумотлар доимий сақланади

---

## 📁 Файллар тузилмаси

```
proficlub-crm/
├── src/
│   ├── lib/
│   │   ├── supabase.js     ← Supabase ulanish
│   │   └── db.js           ← Barcha DB operatsiyalar
│   ├── App.jsx             ← Asosiy CRM interfeysi
│   └── main.jsx            ← Entry point
├── supabase-setup.sql      ← Supabase SQL (bir marta ishlatiladi)
├── .env.example            ← Environment o'zgaruvchilar namunasi
├── vite.config.js
└── package.json
```

---

## ⚡ Маълумот қўшиш/ўзгартириш

**Ходим qўшish:** CRM → "+ Янги ходим" тугмаси
**Ходим таҳрирлаш:** Ходимни танлаб → "✏️ Таҳрирлаш"
**Имтиҳон натижаси:** Тренинглар → "⚡ Натижа киритиш"

Барча ўзгаришлар **Supabase базасида** сақланади.
Код ўзгармайди. Ҳеч қандай қайта deploy керак эмас.

---

## 💰 Нарх

| Хизмат   | Тариф | Нарх |
|----------|-------|------|
| GitHub   | Free  | $0   |
| Supabase | Free  | $0   |
| Vercel   | Free  | $0   |
| **Жами** |       | **$0** |
