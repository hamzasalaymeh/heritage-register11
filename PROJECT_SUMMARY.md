# 📋 ملخص مشروع منصة السجل الوطني للتراث العمراني
> ملف مرجعي شامل لنقل السياق إلى أي محادثة جديدة — آخر تحديث: 2026-07-13

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

### ✅ ز. مركز البيانات المتقدم suite2 — 17 ميزة (commit `2a14e63`)
زر "🛢 مركز البيانات": اكتشافات تلقائية، فحص الجودة (كشف 4063 مجموعة تكرار!)، تقدير التكلفة، الجدول الحي، **الاستيراد الذكي CSV**، **آلة الزمن (لقطات)**، حماية بكلمة مرور، عرض JSON، مخاطر بيئية، موسوعة الطرز، العصور، لوحة تنفيذية، مولّد شرائح، أطلس المحافظات، المواقع المهملة، صور تاريخية (Google Earth)، استعلام متقدم.

> ⚠️ **قرار المستخدم الحالي**: لم تعجبه ميزات suite2 **ما عدا الاستيراد الذكي وآلة الزمن** — الباقي (15 ميزة) مطلوب **حذفه** واستبداله بأفكار من القائمة الجديدة (بند 4).

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

## 4. الأفكار المطروحة حالياً (بانتظار اختيار المستخدم)

بديلاً عن ميزات suite2 المحذوفة:
1. 🎬 تسجيل الجولة السينمائية كفيديو WebM (MediaRecorder على canvas)
2. 🔮 عدسة الزمن: دائرة تُظهر ألوان 2046 داخلها والحاضر خارجها
3. ⏮️ إعادة تشغيل نمو السجل (ظهور تدريجي متحرك 0→20,800)
4. 🧪 محاكي "ماذا لو رمّمنا؟" (اختر مواقع → شاهد مؤشر الصحة يقفز)
5. 📖 قصص تفاعلية بالتمرير StoryMaps لكل قرية
6. 📺 شاشة "نبض التراث" الحية للوبي والمعارض
7. 🗺️ الخريطة العتيقة (طراز مخطوطة سيبيا)
8. 📸 مطابقة صور ميدانية بالجملة عبر GPS بأقرب موقع
9. 🏷️ مولّد لوحات تعريفية ميدانية + ملصقات QR للطباعة
10. 🛂 جواز التراث الشخصي (أختام وشارات)
11. 🔥 خريطة حرارية زمنية متحركة عبر العصور
12. 🗺️|🗺️ خريطتان متزامنتان جنباً إلى جنب

**ترشيح Claude**: 1 + 4 + 6 + 8 + 9.

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
- [ ] المستخدم يختار الأفكار الجديدة من بند 4 → تنفيذها
- [ ] حذف 15 ميزة من suite2 (إبقاء: الاستيراد الذكي + آلة الزمن فقط)
- [ ] استقبال `TRANSLATIONS_MASTER.xlsx` المعدل وعكسه على الموقع (آلية بند 5)
- [ ] المستخدم سيضيف "مواقع متبقية" كثيرة لاحقاً (الاستيراد الذكي جاهز لهذا)
