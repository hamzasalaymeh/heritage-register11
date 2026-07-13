# maps each I18N key -> (Sub-location AR, Sub-location EN) grouped for readability
CATS = [
    # (sub_ar, sub_en, [keys...])
    ("العلامة والبحث العام", "Brand & global search", ['brand','search_ph','reg_name','credit_by']),
    ("مؤشرات لوحة التحليلات (KPI)", "Dashboard KPIs", ['overview','kpi_total','kpi_visible','kpi_regions','kpi_govs']),
    ("الفلاتر الجانبية", "Sidebar filters", ['filters','region_lbl','gov_lbl','type_lbl','her_lbl','all_her','cat_lbl','cat_all',
        'cls_title','decay_title','decayflt_lbl','urgent','all_regions','all_govs','all_types']),
    ("مبدّل العرض (خريطة/تحليلات/قائمة)", "View switcher", ['v_map','v_dash','v_list']),
    ("ترتيب وعناوين القائمة", "List sort & headers", ['sort_by','sort_name','sort_decay','sort_age','sort_region','sort_risk',
        'lh_name','lh_region','lh_class','lh_decay']),
    ("مصطلحات عامة للأصل", "General asset terms", ['class_m','heritage_m','years_u','basic_info','survey_info','assets',
        'none','open','yr','bldg','zone']),
    ("صفحة الأصل التراثي", "Asset page", ['qr_share','ap_back','ap_print','ap_share','ap_card','pdf_report',
        'detail_title','full_page','share','copied','exported']),
    ("مقارنة المناطق", "Region comparison", ['compare_regions','compare_title','vs','compare_pick']),
    ("المفضّلة والعرض المشترك", "Favorites & shared view", ['fav','faved','view_favs','view_copied','t_share_view']),
    ("وضع العرض التقديمي (Kiosk)", "Kiosk mode", ['t_kiosk','kiosk_running','kiosk_stop']),
    ("إدارة الوسائط (صور ومستندات)", "Media management", ['media_photos','media_docs','media_add_photo','media_add_doc',
        'media_edit','media_delete','media_set_cover','media_cover','media_no_photos','media_manage','media_done',
        'media_open','media_view_doc']),
    ("محرر الصور", "Photo editor", ['ed_title','ed_rotate_l','ed_rotate_r','ed_bright','ed_contrast','ed_crop',
        'ed_save','ed_cancel','ed_reset']),
    ("رسائل الحفظ والحذف العامة", "General save/delete messages", ['saved_ok','deleted','dl','remove']),
    ("إضافة موقع جديد", "Add new site form", ['add_site','add_site_hint','as_title','as_name','as_region','as_gov',
        'as_type','as_class','as_heritage','as_age','as_decay','as_coords','as_save','as_cancel','as_pick',
        'as_saved','as_name_req','as_coords_req','as_user_badge','as_delete','as_del_confirm']),
    ("الخريطة الحرارية", "Heat map", ['heat_map','heat_on','heat_off']),
    ("رسم منطقة وإحصائياتها", "Region draw & stats", ['region_draw','region_hint','region_calc','region_clear',
        'region_close','region_stats','region_count','region_avg_decay','region_by_class','region_by_gov',
        'region_none','region_need3','region_profile']),
    ("مفتاح الخريطة (Legend)", "Map legend", ['legend','legend_class','legend_type','legend_cluster',
        'lg_a','lg_b','lg_c','lg_u','lg_bldg','lg_zone','lg_cluster_d']),
    ("شاشة الترحيب", "Welcome screen", ['welcome_title','welcome_sub','wf1_t','wf1_d','wf2_t','wf2_d',
        'wf3_t','wf3_d','welcome_start']),
    ("أدوات شريط الخريطة العلوي", "Map toolbar", ['nearby','group_gov','ungroup','snapshot','measure',
        'measure_on','measure_clear','dist','export','export_excel','reset','reset_done',
        't_heat','t_random','t_fit','t_fs','b_standard','b_sat','b_terrain']),
    ("رمز QR والمشاركة", "QR code & sharing", ['qr_title','qr_desc']),
    ("رسائل عامة للتحميل والحالة", "Loading & status messages", ['loading','page_soon']),
    ("حقول بيانات الموقع (الاستمارة)", "Site data fields", ['region_m','gov_m','type_m','her_m','age_m',
        'decision_m','branch_m','coords_m','code_m','cls_m','decay_lbl','hood_m','subtype_m','ownership_m',
        'materials_m','style_m','works_m','use_m','visitors_m','proximity_m']),
    ("السياق الجغرافي (الارتفاع والمطار)", "Geo context (elevation & airport)", ['elev_m','airport_m',
        'airport_dist','km_u','m_u','geo_context','airports_layer','elev_approx_note']),
    ("الصور والمستندات في صفحة الأصل", "Photos & docs on asset page", ['photos_title','add_photos','no_photos',
        'photo_added','form_title','upload_form','no_form','form_added']),
    ("رسائل التخزين المحلي", "Local storage messages", ['storage_off','storage_fail']),
]

KEY2SUB = {}
for sub_ar, sub_en, keys in CATS:
    for k in keys:
        KEY2SUB[k] = (sub_ar, sub_en)

def sub_for_key(key):
    return KEY2SUB.get(key, ("عام / غير مصنّف", "General / uncategorized"))
