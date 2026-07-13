# 📋 ملخص مشروع منصة السجل الوطني للتراث العمراني
> ملف مرجعي شامل لنقل السياق إلى أي محادثة جديدة — آخر تحديث: 2026-07-13 (v2 بعد استوديو التراث)

---

## 1. نظرة عامة على المشروع

| البند | التفاصيل |
|------|----------|
| **المستودع** | `hamzasalaymeh/heritage-register11` على GitHub |
| **الفرع الرئيسي (المباشر)** | `main` — النشر التلقائي منه إلى الموقع المباشر (gh-pages) |
| **فرع العمل السابق** | `claude/heritage-site-files-ge8z6v` (اندمج في main) |
| **الملف الرئيسي** | `index.html` — منصة كاملة بملف واحد (~3.1 مليون حرف) |
| **المالك** | م. حمزة السلايمة (Eng. Hamza Alsalaymeh) — حقوق محفوظة في رأس الملف |
| **المحتوى** | خريطة تفاعلية لـ **20,800 موقع تراثي** سعودي عبر 13 منطقة و99 محافظة |

### بنية `index.html` (ترتيب الأقسام)
1. **CSS الأساسي** (سطر ~35): متغيرات الألوان `:root` + `[data-theme="dark"]` + `color-scheme`
2. **HTML الواجهة** (~سطر 763): header، sidebar بالفلاتر، خريطة، لوحة قصة الموقع (story)، صفحة الأصل (assetPage)، نوافذ منبثقة
3. **محرك الخريطة `AtlasMap`** (سطر ~1230): canvas مخصص — tiles، clustering، heat map، polygon draw، measure، popup
4. **البيانات** (سطر ~1836): `window.__HERITAGE_DB__` سطر واحد ضخم (fields, sites[20800], regions, govs, classes, types, heritage, branches, dict[956]) + `__HERITAGE_EXTRA__` (مطارات 27 + siteExtra ارتفاع/أقرب مطار)
5. **كود التطبيق الرئيسي**: `I18N` قاموس ar/en (~215 مفتاح)، `state` الفلاتر، `passes()` منطق التصفية، `render()`، dashboard، list، story panel، أصل الصفحة، media (IndexedDB)، إضافة موقع، مقارنة مناطق، تقارير PDF (عبر `$('pdfReport')` + class `printing-report`)، kiosk، favorites، USER_SITES (localStorage)
6. **طبقة ترجمة البيانات** (`i18n data-translation layer`): Proxy على `DB.regions/DB.govs` + دوال `nm() herLabel() brLabel() trDictVal() airportName()` + نقحرة عربي→لاتيني
7. **حزمة الأدوات المتقدمة suite1** (`XH advanced suite` — زر ✨ أسفل يسار): 14 ميزة
8. **مركز البيانات المتقدم suite2** (`Data Intelligence Center` — زر فوقه): 17 ميزة
9. **سكربت حماية حقوق مشفّر** (لا تلمسه — يعرض اسم المؤلف على الخريطة)

### دوال عامة مهمة (متاحة globally)
`$()` = getElementById · `DB` · `state` · `passes(s)` · `render()` · `setView(v)` · `gotoSite(idx)` · `openStory(idx)` · `openAssetPage(idx)` · `riskScore(s)` · `riskColor(r)` · `regionStats(ri)` · `haversine()` · `toast(msg)` · `num(n)` أرقام عربية · `t(key)` ترجمة · `LANG` ('ar'/'en') · `CLASS_META` · `siteCat(s)` · `nextUserCode()` · `USER_SITES`/`saveUserSites()` · `mediaFor(code)`/`siteCover(code)` · `filteredBounds()`

### صيغة صف الموقع `DB.sites[i]`
`[code, name, lat, lng, regIdx, govIdx, clsIdx, typIdx, herIdx, age, decay(0-1), decision, brIdx, hoodDict, subtypeDict, ownershipDict, materialsDict[], styleDict, worksDict, useDict, visitorsDict, proximityDict]`

---

## 2. كل ما أُنجز في هذه المحادثة (بالترتيب)

### ✅ أ. استخراج البيانات (commit `7bddc2a`)
- `data/heritage_sites.xlsx` (17MB) + `data/heritage_sites.csv` + `data/heritage_references.json`
- `DATA_GUIDE.md` شرح الحقول + `IMPORT_INSTRUCTIONS.md`

### ✅ ب. استخراج المسميات (commits `86d959b`, `edb3b53`)
- `ALL_TRANSLATIONS_COMPLETE.csv/md` + `translations_data.json` (213 مسمى الأصلية)
- **تم تجاوزها الآن بـ `TRANSLATIONS_MASTER.xlsx`** (603 مسمى — انظر بند 5)

### ✅ ج. حزمة الأدوات المتقدمة suite1 — 14 ميزة (commit `4bc3f92`)
زر "✨ أدوات متقدمة": المساعد الذكي (أسئلة عربية طبيعية)، النمذجة المستقبلية 2026-2046 (تلوين حي)، مؤشر صحة التراث (/100)، الأولويات الوطنية (أعلى 100 + طباعة)، الخط الزمني، مستكشف القرى (تلقائي من الأسماء)، المسارات السياحية (nearest-neighbor مرسوم)، جولة سينمائية، نطاقات حماية 500م للفئة أ، مقارنة رادار، اكتمال الحصر، الأطلس الوطني (طباعة)، GeoJSON/KML، سجل التعديلات.
**+ مدمجات**: قراءة GPS من صورة (EXIF) في نموذج الإضافة، بحث صوتي 🎤، مقارنة قبل/بعد للصور، بطاقة نشر PNG، موقع اليوم، عدادات ترحيب متحركة.

### ✅ د. فلتر "أنواع التراث" (commit `ee9ecc1`)
قائمة منسدلة في السايدبار (`herSel`, `state.her`, حقل `h` في رابط المشاركة).

### ✅ هـ. إصلاح المتصفح الداكن (commit `ec4af6d`)
`<meta name="color-scheme">` + خاصية `color-scheme` في CSS — يمنع متصفح الجوال من قلب الألوان قسرياً (كانت الأُطر تظهر داكنة في الوضع النهاري).

### ✅ و. ترجمة البيانات الكاملة للإنجليزية (commit `c61935d`)
**المشكلة**: التبديل EN كان يترجم الواجهة فقط، وكل البيانات تبقى عربية.
**الحل**: Proxy لغوي على `DB.regions/govs` (ترجمات يدوية للكل) + `nm()` لأسماء المواقع (أنماط + نقحرة) + `herLabel/brLabel/trDictVal/airportName` + `CLASS_META.eshort` (A/B/C) + تحديث كل نقاط العرض (popups، story، asset page، list، dashboard، بحث، تقارير PDF، تصدير CSV/Excel/GeoJSON/KML، suite1).

### ✅ ز. مركز البيانات المتقدم suite2 — 17 ميزة (commit `2a14e63`) — **استُبدل لاحقاً**
لم تعجب المستخدم 15 من ميزاته، فاستُبدل بالكامل (انظر بند ح).

### ✅ ح. استوديو التراث suite2-v2 — 11 ميزة (commit `dc4d1cc`)
زر "🎬 الاستوديو" (فوق زر ✨): **9 ميزات إبداعية جديدة** + الميزتين المُبقاتين:
1. 🎬 تسجيل الجولة كفيديو WebM حقيقي (MediaRecorder على canvas + تعليقات مرسومة داخل الإطار)
2. 🔮 عدسة الزمن: دائرة قابلة للسحب — داخلها ألوان 2046 المتوقعة وخارجها اليوم
3. ⏮️ إعادة تشغيل النمو: الخريطة تمتلئ 0→20,800 منطقة بمنطقة مع عداد HUD
4. 🧪 محاكي «ماذا لو رمّمنا؟»: نطاق (أعلى 100/الفلتر/منطقة) → عدادا قبل/بعد + دلتا عشرية + معاينة خضراء 5 ثوانٍ
5. 📖 قصص القرى: فصول scrollytelling تطير بين مباني القرية الحقيقية (عجلة/أسهم/نقاط)
6. 🗺️ الخريطة العتيقة: فلتر سيبيا + فينيت مخطوطة (toggle `body.vintage-on`)
7. 🏷️ اللوحات التعريفية: لوحات A5 + ملصقات QR للطباعة (عبر pdfReport)
8. 🔥 الحرارة عبر الزمن: طبقة حرارية متحركة حسب عتبة العمر
9. 🆚 خريطتان متزامنتان: نسختا AtlasMap جنباً لجنب مع مزامنة العرض
10. 📥 الاستيراد الذكي CSV (مُبقاة) — 11. 🕰️ آلة الزمن/اللقطات (مُبقاة)
> ملاحظات تقنية: دوال suite1 خاصة (private IIFE) — الاستوديو يعيد بناء فهرس القرى بنفسه؛ سلسلة ثالثة على `map._render` (stDraw) ترسم العدسة وتعليق الفيديو؛ سلسلة على `passes` بمتغير `_studioAgeMin`.

---

## 3. دروس تقنية مهمة (لتجنب تكرار الأخطاء)

1. **لا تكتب `</script>` حرفياً داخل JavaScript مضمّن** — كسر الصفحة مرة (أصلحناه بـ `<scr${''}ipt>`). أي HTML يُكتب في `document.write` لنافذة منبثقة يجب تفكيك وسوم السكربت فيه.
2. **سطر البيانات 1836 عملاق (3MB)** — لا تقرأه أبداً بأداة Read كاملاً؛ استخدم regex/node.
3. **الحقن الآمن**: أضف ميزات جديدة كسكربت مستقل قبل السكربت المشفّر الأخير، بنمط IIFE مع try/catch، وأعد تعريف `passes` بتغليف `const _p=passes; passes=function(s){...}`.
4. **فحص إلزامي بعد كل تعديل**: `python3` لاستخراج كل `<script>` وفحصها بـ `node --check`، ثم Playwright (`/opt/pw-browsers/chromium` + `playwright-core` مثبت في scratchpad) لفحص التحميل والتفاعل.
5. **أنماط CSS الجاهزة لإعادة الاستخدام**: `.xh-card .xh-btn .xh-in .xh-row .xh-kpi .xh-chip .xh-note .xh-rank .xh-tag .xh-track/.xh-fill` + مودالات `#xhOverlay/#dcOverlay`.
6. **التقارير المطبوعة**: املأ `$('pdfReport').innerHTML` ثم `document.body.classList.add('printing-report')` ثم `window.print()`.
7. الترجمة داخل أي كود جديد: استخدم `L('عربي','English')` وأعد بناء المحتوى عند فتح اللوحة (وليس مرة واحدة عند التحميل).

---

## 4. قرارات الأفكار (محسومة ✅)

نُفّذت الأفكار 1، 2، 3، 4، 5، 7، 9، 11، 12 في "استوديو التراث" (بند 2-ح).
**رفضها المستخدم ولم تُنفذ**: 6 (شاشة نبض التراث)، 8 (مطابقة صور بالجملة)، 10 (جواز التراث الشخصي).

---

## 5. سير عمل تعديل المسميات (الحالي)

- الملف: **`TRANSLATIONS_MASTER.xlsx`** في جذر المستودع — **603 مسمى** حرفياً:
  - ورقة "1- قاموس الواجهة": 215 مفتاح `I18N` (رمز + عربي + إنجليزي + عمودا التعديل)
  - ورقة "2- نصوص مضمنة": 388 زوج نصوص من `L('','')` و`LANG==='ar'?:` وكائنات `ar:/en:` (منها 24 "ديناميكي" يحوي `${...}`)
- **آلية العكس عند إعادة رفع الملف المعدل**: 
  - الورقة 1: استبدال قيمة المفتاح في كتلة `I18N` (`key:"قديم"` → `key:"جديد"`)
  - الورقة 2: استبدال نصّي دقيق للزوج القديم بالجديد في كامل `index.html` (الأعمدة "الحالية" هي مفاتيح المطابقة — ممنوع تعديلها)
  - بعد العكس: فحص syntax لكل السكربتات + فحص Playwright قبل الدفع

---

## 6. ملفات المستودع الحالية

```
index.html                     ← المنصة كاملة (المباشر)
TRANSLATIONS_MASTER.xlsx       ← ملف المسميات الشامل الجديد (603) ⭐
PROJECT_SUMMARY.md             ← هذا الملف
data/heritage_sites.xlsx/csv   ← بيانات المواقع 20,800
data/heritage_references.json  ← جداول مرجعية
ALL_TRANSLATIONS_COMPLETE.*    ← (قديم — 213 مسمى، تجاوزه الماستر)
translations_data.json         ← (قديم)
DATA_GUIDE.md / IMPORT_INSTRUCTIONS.md / TRANSLATIONS_EDIT.md
```

## 7. مهام معلّقة
- [x] ~~تنفيذ الأفكار المختارة~~ (تم — استوديو التراث، commit `dc4d1cc`)
- [x] ~~حذف 15 ميزة من suite2~~ (تم — أُبقي الاستيراد الذكي + آلة الزمن)
- [ ] استقبال `TRANSLATIONS_MASTER.xlsx` المعدل (الإصدار 2 — 545 مسمى) وعكسه على الموقع (آلية بند 5)
- [ ] المستخدم سيضيف "مواقع متبقية" كثيرة لاحقاً (الاستيراد الذكي جاهز لهذا)
