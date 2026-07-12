# 📥 إعادة استيراد البيانات المعدلة
## How to Re-import Modified Data Back to the Website

---

### الخطوات (Steps):

#### 1️⃣ تحضير ملفات JSON المعدلة
بعد تعديل البيانات في Excel أو CSV:

```javascript
// أولاً: تحويل CSV أو Excel إلى JSON
// استخدم Python أو Node.js:

const fs = require('fs');
const csv = require('csv-parse/sync');

// اقرأ الملف
const content = fs.readFileSync('heritage_sites.csv', 'utf8');
const records = csv.parse(content, {
  columns: true,
  skip_empty_lines: true
});

// تحويل إلى صيغة الموقع
const sites = records.map(row => [
  parseInt(row.code),
  row.name,
  parseFloat(row.lat),
  parseFloat(row.lng),
  // ... إلخ
]);

fs.writeFileSync('new_sites.json', JSON.stringify(sites));
```

#### 2️⃣ تحديث ملف index.html
في ملف `index.html`، ابحث عن:
```html
<script>window.__HERITAGE_DB__={...}</script>
```

استبدل البيانات القديمة بالجديدة:
```html
<script>window.__HERITAGE_DB__={
  "fields": [...],
  "sites": [...], // ← ضع البيانات الجديدة هنا
  "regions": [...],
  ...
}</script>
```

#### 3️⃣ اختبر التحديثات
- افتح الموقع في المتصفح
- تحقق من ظهور المواقع الجديدة
- اختبر الفلاتر والبحث

#### 4️⃣ ادفع التغييرات (Git)
```bash
git add index.html
git commit -m "Update heritage sites data - added new locations"
git push origin claude/heritage-site-files-ge8z6v
```

---

### نصائح مهمة:

✅ **حافظ على الترتيب الأصلي للحقول** - لا تغير ترتيب الأعمدة

✅ **استخدم أرقام فريدة للـ code** - كل موقع يجب أن يكون له رقم فريد

✅ **للإحداثيات:** استخدم الصيغة العشرية فقط (مثال: 20.00451)

✅ **في حالة الأخطاء:** عد للملف الأصلي واستخرج البيانات مرة أخرى

---

### مثال سريع (Python):

```python
import pandas as pd
import json

# اقرأ Excel أو CSV
df = pd.read_csv('heritage_sites.csv')

# تحويل إلى JSON
data = df.values.tolist()
with open('sites.json', 'w') as f:
    json.dump(data, f)

print(f"✓ Converted {len(df)} sites")
```

---

**هل تحتاج مساعدة في التعديل؟**
جهز البيانات المعدلة وسأساعدك في تحديث الموقع!
