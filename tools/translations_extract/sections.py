# line ranges -> (Main Section AR, Main Section EN, Sub-location default AR/EN)
# ranges are [start,end) by 1-indexed line number
SECTIONS = [
    (1, 1230, "الإعداد العام (الألوان والهوية)", "Global setup (colors & identity)"),
    (1230, 1840, "محرك الخريطة (AtlasMap)", "Map engine (AtlasMap)"),
    (1840, 1916, "تصنيفات التراث والبيانات الأساسية", "Heritage taxonomy & core data"),
    (1916, 1997, "قاموس الواجهة I18N", "Interface dictionary I18N"),
    (1997, 2080, "الخريطة الرئيسية", "Main map"),
    (2080, 2140, "حدود القرى على الخريطة", "Village boundaries on map"),
    (2140, 2207, "حالة الفلاتر", "Filter state"),
    (2207, 2233, "محرك العرض (Render)", "Render engine"),
    (2233, 2250, "مبدّل العرض (خريطة / تحليلات / قائمة)", "View switcher (Map/Dashboard/List)"),
    (2250, 2364, "لوحة التحليلات (Dashboard)", "Dashboard"),
    (2364, 2435, "عرض القائمة", "List view"),
    (2435, 2683, "الإحصائيات والرسوم البيانية", "Stats & charts"),
    (2683, 2833, "صفحة الأصل التراثي المخصّصة", "Dedicated asset page"),
    (2833, 3024, "إدارة الوسائط (صور ومستندات)", "Media management (photos & docs)"),
    (3024, 3118, "إضافة موقع جديد", "Add new site"),
    (3118, 3129, "الخريطة الحرارية", "Heat map"),
    (3129, 3215, "رسم منطقة وإحصائياتها", "Region draw & statistics"),
    (3215, 3269, "تقرير PDF الرسمي", "Official PDF report"),
    (3269, 3399, "مقارنة المناطق", "Region comparison"),
    (3399, 3491, "المفضّلة", "Favorites"),
    (3491, 3525, "رابط مشاركة حالة الفلاتر", "Shareable filter link"),
    (3525, 3564, "وضع العرض التقديمي (Kiosk)", "Kiosk / presentation mode"),
    (3564, 3761, "المرفقات (صور واستمارة Word)", "Attachments (photos & Word form)"),
    (3761, 3801, "تحميل البيانات (Boot)", "Data boot / load"),
    (3801, 4021, "طبقة ترجمة البيانات", "Data translation layer"),
    (4021, 4162, "واجهة حزمة الأدوات المتقدمة", "Advanced suite UI"),
    (4162, 4303, "حزمة الأدوات المتقدمة — قائمة الميزات (١٤)", "Advanced features suite — feature list (14)"),
    # 4303-4413 = SMART ASSISTANT -> EXCLUDED per user request
    (4413, 4464, "الأدوات المتقدمة ← النمذجة المستقبلية", "Advanced tools ← Decay projection"),
    (4464, 4508, "الأدوات المتقدمة ← مؤشر صحة التراث", "Advanced tools ← Heritage health index"),
    (4508, 4544, "الأدوات المتقدمة ← الأولويات الوطنية", "Advanced tools ← National priorities"),
    (4544, 4589, "الأدوات المتقدمة ← الخط الزمني", "Advanced tools ← Timeline"),
    (4589, 4629, "الأدوات المتقدمة ← مستكشف القرى", "Advanced tools ← Village explorer"),
    (4629, 4685, "الأدوات المتقدمة ← المسارات السياحية", "Advanced tools ← Tourist routes"),
    (4685, 4719, "الأدوات المتقدمة ← جولة سينمائية", "Advanced tools ← Cinematic tour"),
    (4719, 4733, "الأدوات المتقدمة ← نطاقات الحماية", "Advanced tools ← Protection buffers"),
    (4733, 4797, "الأدوات المتقدمة ← مقارنة رادار", "Advanced tools ← Radar compare"),
    (4797, 4823, "الأدوات المتقدمة ← اكتمال الحصر", "Advanced tools ← Survey progress"),
    (4823, 4864, "الأدوات المتقدمة ← الأطلس الوطني", "Advanced tools ← National atlas"),
    (4864, 4892, "الأدوات المتقدمة ← تصدير GeoJSON / KML", "Advanced tools ← GeoJSON/KML export"),
    (4892, 4949, "الأدوات المتقدمة ← سجل التعديلات", "Advanced tools ← Audit log"),
    (4949, 4983, "الواجهة الثابتة (الأزرار العائمة والأشرطة)", "Static UI (floating buttons & bars)"),
    (4983, 5016, "عدادات الترحيب المتحركة", "Welcome animated counters"),
    (5016, 5043, "موقع اليوم", "Site of the day"),
    (5043, 5073, "البحث الصوتي", "Voice search"),
    (5073, 5148, "قراءة GPS من الصورة (EXIF)", "EXIF GPS from photo"),
    (5148, 5181, "مقارنة قبل/بعد", "Before/After comparison"),
    (5181, 5297, "بطاقة المشاركة", "Share card generator"),
    (5297, 5329, "واجهة أدوات البيانات", "Data tools UI"),
    (5329, 5372, "استوديو التراث — قائمة الميزات (الاستيراد الذكي وآلة الزمن)", "Heritage studio — feature list (Smart import & Time machine)"),
    (5372, 5485, "الاستيراد الذكي (CSV)", "Smart importer (CSV)"),
    (5485, 5527, "آلة الزمن (لقطات الإحصاءات)", "Time machine (stat snapshots)"),
    (5527, 6000, "الواجهة الثابتة الختامية", "Closing static UI"),
]

# Smart assistant section to EXCLUDE entirely
EXCLUDE_RANGES = [(4303, 4413)]

def section_for_line(lineno):
    for a,b,ar,en in SECTIONS:
        if a <= lineno < b:
            return ar,en
    return "غير مصنّف","Unclassified"

def is_excluded(lineno):
    for a,b in EXCLUDE_RANGES:
        if a <= lineno < b:
            return True
    return False
