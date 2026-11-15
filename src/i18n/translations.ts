import type { Language } from '../types/agrishift';

export interface TranslationDictionary {
  appTitle: string;
  navPlan: string;
  navMap: string;
  navNasa: string;
  navCrops: string;
  heroTitle: string;
  heroSubtitle: string;
  heroStep1: string;
  heroStep2: string;
  heroStep3: string;
  stepLocation: string;
  stepCrops: string;
  stepWaterSoil: string;
  stepResult: string;
  useMyLocation: string;
  locating: string;
  drawField: string;
  finishDraw: string;
  undoPoint: string;
  clearField: string;
  drawHint: string;
  areaLabel: string;
  feddanUnit: string;
  kiratUnit: string;
  hectareUnit: string;
  governoratesLabel: string;
  pickCropsHint: string;
  undecidedCrop: string;
  lastCropQuestion: string;
  noneLabel: string;
  fieldSizeLabel: string;
  totalWaterNeeded: string;
  irrigationMethod: string;
  flood: string;
  drip: string;
  sprinkler: string;
  pivot: string;
  waterSource: string;
  canal: string;
  groundwater: string;
  soilType: string;
  clay: string;
  loamy: string;
  sandy: string;
  salinityLevel: string;
  fresh: string;
  moderate: string;
  saline: string;
  nextBtn: string;
  backBtn: string;
  showPlanBtn: string;
  restartBtn: string;
  strategyBalanced: string;
  strategyWater: string;
  strategySoil: string;
  planTitle: string;
  decisionSupportNote: string;
  alternativesTitle: string;
  swapCrop: string;
  basedOnNasa: string;
  nasaCaveat: string;
  demoBanner: string;
  liveBanner: string;
  partialBanner: string;
  layerTrueColor: string;
  layerNdvi: string;
  layerHeat: string;
  layerMoisture: string;
  basemapSatellite: string;
  basemapNasa: string;
  layerDate: string;
  layerOpacity: string;
  legendDry: string;
  legendLush: string;
  legendCool: string;
  legendHot: string;
  legendMoist: string;
  nasaPageTitle: string;
  nasaPageSubtitle: string;
  statusLive: string;
  statusEstimated: string;
  statusDemo: string;
  statusUnavailable: string;
  metricRain: string;
  metricHeat: string;
  metricSoilWet: string;
  metricNdvi: string;
  metricEt0: string;
  metricStressDays: string;
  ndviTrendRising: string;
  ndviTrendStable: string;
  ndviTrendFalling: string;
  reasonNitrogen: string;
  reasonSequence: string;
  reasonWaterSaver: string;
  reasonHeatTolerant: string;
  reasonSalinitySafe: string;
  reasonSoilMatch: string;
  reasonMoistureFit: string;
  reasonPolicyCheck: string;
  evRain: string;
  evHeat: string;
  evSoil: string;
  evNdvi: string;
  evEt0: string;
  cropsPageTitle: string;
  cropsPageSubtitle: string;
  waterLow: string;
  waterMedium: string;
  waterHigh: string;
  goodAfter: string;
  goodBefore: string;
  expertReviewTag: string;
  footerAck: string;
  digitsArabic: string;
  digitsWestern: string;
  tileErrorHint: string;
  resetFarm: string;
  seasonWinter: string;
  seasonSummer: string;
  seasonNili: string;
  chartNdviTitle: string;
  chartWaterTitle: string;
  climatologyChartTitle: string;
  ruleTraceTitle: string;
  rejectedPlans: string;
  regionAll: string;
  regionDelta: string;
  regionValley: string;
  regionOasis: string;
  riceAllowed: string;
  riceRestricted: string;
  sowHarvestBar: string;
  savePlot: string;
  savedPlots: string;
  plotSavedMsg: string;
  printPlan: string;
  refreshNasa: string;
  compareStrategies: string;
  waterScoreLabel: string;
  soilScoreLabel: string;
  climateScoreLabel: string;
  lowWaterFilter: string;
  salineFilter: string;
}

export const TRANSLATIONS: Record<Language, TranslationDictionary> = {
  arz: {
    appTitle: 'AgriShift',
    navPlan: 'خطة أرضك',
    navMap: 'خريطة القمر',
    navNasa: 'بيانات ناسا',
    navCrops: 'دليل المحاصيل',
    heroTitle: 'اعرف تزرع إيه بصور القمر الصناعي',
    heroSubtitle: 'اختار بالصور — من غير كلام كتير',
    heroStep1: 'شاور على أرضك',
    heroStep2: 'اختار الزرع',
    heroStep3: 'خد دورتك',
    stepLocation: 'أرضك فين؟',
    stepCrops: 'بتزرع إيه؟',
    stepWaterSoil: 'الميّه والأرض',
    stepResult: 'دورة أرضك',
    useMyLocation: 'مكاني الحالي',
    locating: 'بنجيب مكانك...',
    drawField: 'ارسم حدود الأرض',
    finishDraw: 'خلصت الرسم',
    undoPoint: 'تراجع نقطة',
    clearField: 'امسح الرسم',
    drawHint: 'دوس على أركان أرضك في الخريطة',
    areaLabel: 'المساحة',
    feddanUnit: 'فدان',
    kiratUnit: 'قيراط',
    hectareUnit: 'هكتار',
    governoratesLabel: 'المحافظات',
    pickCropsHint: 'دوس على صور الزرع اللي يهمك',
    undecidedCrop: 'لسه ما قررتش',
    lastCropQuestion: 'كان مزروع إيه الموسم اللي فات؟',
    noneLabel: 'مش مهم / مفيش',
    fieldSizeLabel: 'مساحة الأرض بالفدان',
    totalWaterNeeded: 'ميّه الأرض كلها في السنة',
    irrigationMethod: 'الري',
    flood: 'غمر',
    drip: 'تنقيط',
    sprinkler: 'رش',
    pivot: 'محوري',
    waterSource: 'مصدر الميّه',
    canal: 'ترعة',
    groundwater: 'بير / جوفية',
    soilType: 'نوع التربة',
    clay: 'طينية',
    loamy: 'طفلية',
    sandy: 'رملية',
    salinityLevel: 'الملوحة',
    fresh: 'عذبة',
    moderate: 'متوسطة',
    saline: 'مالحة',
    nextBtn: 'اللي بعده',
    backBtn: 'ارجع',
    showPlanBtn: 'طلّع الخطة',
    restartBtn: 'ابدأ من الأول',
    strategyBalanced: 'متوازنة',
    strategyWater: 'توفير الميّه',
    strategySoil: 'صحة التربة',
    planTitle: 'دورة أرضك المقترحة',
    decisionSupportNote: 'مساعدة قرار زراعي — مش بديل عن المهندس الزراعي',
    alternativesTitle: 'بدائل',
    swapCrop: 'بدّل',
    basedOnNasa: 'اتبنت على:',
    nasaCaveat: 'القمر بيقيس مساحة كبيرة حوالين أرضك، فاتأكد من أرضك بنفسك',
    demoBanner: 'بيانات تجريبية — مش من القمر الصناعي دلوقتي',
    liveBanner: 'بيانات ناسا حية من القمر الصناعي',
    partialBanner: 'بعض قراءات ناسا متاحة وبعضها تقديري',
    layerTrueColor: 'صورة طبيعية',
    layerNdvi: 'خضار الزرع',
    layerHeat: 'سخونة الأرض',
    layerMoisture: 'رطوبة التربة',
    basemapSatellite: 'قمر صناعي',
    basemapNasa: 'ناسا GIBS',
    layerDate: 'تاريخ الصورة',
    layerOpacity: 'شفافية الطبقة',
    legendDry: 'أرض فاضية',
    legendLush: 'زرع قوي',
    legendCool: 'جو لطيف',
    legendHot: 'حر عالي',
    legendMoist: 'تربة مروية',
    nasaPageTitle: 'بيانات ناسا اللي استخدمناها',
    nasaPageSubtitle: 'كل رقم في الخطة جه منين وإيه حدوده',
    statusLive: 'مباشر',
    statusEstimated: 'تقديري',
    statusDemo: 'تجريبي',
    statusUnavailable: 'غير متاح',
    metricRain: 'المطر',
    metricHeat: 'الحرارة',
    metricSoilWet: 'رطوبة التربة',
    metricNdvi: 'خضار NDVI',
    metricEt0: 'البخر ET0',
    metricStressDays: 'أيام حر شديد',
    ndviTrendRising: 'بيزيد',
    ndviTrendStable: 'ثابت',
    ndviTrendFalling: 'بيقل',
    reasonNitrogen: 'بيثبت أزوت',
    reasonSequence: 'تتابع ممتاز',
    reasonWaterSaver: 'موفر ميّه',
    reasonHeatTolerant: 'يتحمل الحر',
    reasonSalinitySafe: 'يناسب الملوحة',
    reasonSoilMatch: 'يناسب التربة',
    reasonMoistureFit: 'مناسب للرطوبة',
    reasonPolicyCheck: 'راجع الإدارة الزراعية',
    evRain: 'مطر ناسا',
    evHeat: 'حرارة ناسا',
    evSoil: 'رطوبة التربة',
    evNdvi: 'خضار القمر',
    evEt0: 'حساب البخر',
    cropsPageTitle: 'دليل المحاصيل المصرية',
    cropsPageSubtitle: 'المواعيد والميّه والتربة لكل محصول',
    waterLow: 'ميّه قليلة',
    waterMedium: 'ميّه متوسطة',
    waterHigh: 'ميّه كتير',
    goodAfter: 'ممتاز بعد:',
    goodBefore: 'يزرع بعده:',
    expertReviewTag: 'يحتاج مراجعة خبير',
    footerAck: 'بيانات الأرض والطقس من مصادر NASA Earthdata المفتوحة (لا يعني اعتماداً رسمياً من ناسا)',
    digitsArabic: '١٢٣',
    digitsWestern: '123',
    tileErrorHint: 'شبكة الخرائط بطيئة — تقدر تكمل اختيار المحافظة',
    resetFarm: 'تصفير',
    seasonWinter: 'شتوي',
    seasonSummer: 'صيفي',
    seasonNili: 'نيلي',
    chartNdviTitle: 'مؤشر خضار الزرع (MODIS NDVI)',
    chartWaterTitle: 'البخر اليومي والمطر (POWER + FAO-56)',
    climatologyChartTitle: 'متوسط مناخ ناسا السنوي (12 شهر)',
    ruleTraceTitle: 'ازاي المحرك اختار المحاصيل',
    rejectedPlans: 'خطط مرفوضة بالقواعد',
    regionAll: 'الكل',
    regionDelta: 'الدلتا',
    regionValley: 'الصعيد والوادي',
    regionOasis: 'الواحات وسيناء',
    riceAllowed: 'منطقة أرز مسموحة',
    riceRestricted: 'الأرز ممنوع إدارياً هنا',
    sowHarvestBar: 'الزراعة والحصاد',
    savePlot: 'احفظ الأرض',
    savedPlots: 'أراضيّي',
    plotSavedMsg: 'اتحفظت',
    printPlan: 'اطبع الخطة',
    refreshNasa: 'تحديث القمر',
    compareStrategies: 'مقارنة الخطط',
    waterScoreLabel: 'توفير الميّه',
    soilScoreLabel: 'صحة التربة',
    climateScoreLabel: 'ملائمة الجو',
    lowWaterFilter: 'موفر ميّه',
    salineFilter: 'يتحمل الملوحة',
  },
  ar: {
    appTitle: 'AgriShift',
    navPlan: 'تخطيط الدورة',
    navMap: 'خريطة الأقمار',
    navNasa: 'بيانات ناسا',
    navCrops: 'دليل المحاصيل',
    heroTitle: 'تخطيط الدورة الزراعية ببيانات الأقمار الصناعية',
    heroSubtitle: 'تحديد بصري سريع للموقع والمحاصيل والري',
    heroStep1: 'تحديد الحقل',
    heroStep2: 'اختيار المحاصيل',
    heroStep3: 'عرض الخطة',
    stepLocation: 'أين تقع أرضك؟',
    stepCrops: 'ماذا تزرع؟',
    stepWaterSoil: 'المياه والتربة',
    stepResult: 'الدورة المقترحة',
    useMyLocation: 'موقعي الحالي',
    locating: 'جاري التحديد...',
    drawField: 'رسم حدود الحقل',
    finishDraw: 'إنهاء الرسم',
    undoPoint: 'تراجع نقطة',
    clearField: 'مسح الرسم',
    drawHint: 'انقر على زوايا الحقل في الخريطة',
    areaLabel: 'المساحة',
    feddanUnit: 'فدان',
    kiratUnit: 'قيراط',
    hectareUnit: 'هكتار',
    governoratesLabel: 'المحافظات',
    pickCropsHint: 'اختر المحاصيل المطلوبة بالصور',
    undecidedCrop: 'لم أقرر بعد',
    lastCropQuestion: 'ما المحصول السابق في الأرض؟',
    noneLabel: 'غير محدد',
    fieldSizeLabel: 'مساحة الحقل بالفدان',
    totalWaterNeeded: 'إجمالي الاحتياج المائي السنوي',
    irrigationMethod: 'طريقة الري',
    flood: 'غمر',
    drip: 'تنقيط',
    sprinkler: 'رش',
    pivot: 'محوري',
    waterSource: 'مصدر المياه',
    canal: 'ترعة',
    groundwater: 'مياه جوفية',
    soilType: 'نوع التربة',
    clay: 'طينية',
    loamy: 'طفلية',
    sandy: 'رملية',
    salinityLevel: 'درجة الملوحة',
    fresh: 'عذبة',
    moderate: 'متوسطة',
    saline: 'مالحة',
    nextBtn: 'التالي',
    backBtn: 'السابق',
    showPlanBtn: 'عرض الخطة',
    restartBtn: 'بدء جديد',
    strategyBalanced: 'متوازنة',
    strategyWater: 'توفير المياه',
    strategySoil: 'صحة التربة',
    planTitle: 'الدورة الزراعية المقترحة',
    decisionSupportNote: 'أداة دعم قرار — لا تغني عن استشارة المهندس الزراعي',
    alternativesTitle: 'بدائل مقترحة',
    swapCrop: 'تبديل',
    basedOnNasa: 'مبنية على:',
    nasaCaveat: 'يقيس القمر الصناعي نطاقاً واسعاً حول الحقل، يرجى التحقق ميدانياً',
    demoBanner: 'بيانات تجريبية — تعذر الاتصال بخوادم القمر الصناعي حالياً',
    liveBanner: 'بيانات ناسا حية من الأقمار الصناعية',
    partialBanner: 'بعض قراءات ناسا مباشرة وبعضها تقديري',
    layerTrueColor: 'صورة طبيعية',
    layerNdvi: 'الغطاء النباتي',
    layerHeat: 'حرارة السطح',
    layerMoisture: 'رطوبة التربة',
    basemapSatellite: 'قمر صناعي',
    basemapNasa: 'طبقات ناسا',
    layerDate: 'تاريخ الرصد',
    layerOpacity: 'الشفافية',
    legendDry: 'تربة جافة',
    legendLush: 'غطاء كثيف',
    legendCool: 'معتدل',
    legendHot: 'حرارة مرتفعة',
    legendMoist: 'رطوبة عالية',
    nasaPageTitle: 'بيانات ناسا المستخدمة',
    nasaPageSubtitle: 'المصادر والدقة والحدود العلمية لكل مؤشر',
    statusLive: 'مباشر',
    statusEstimated: 'تقديري',
    statusDemo: 'تجريبي',
    statusUnavailable: 'غير متاح',
    metricRain: 'الأمطار',
    metricHeat: 'الحرارة',
    metricSoilWet: 'رطوبة التربة',
    metricNdvi: 'مؤشر الخضرة',
    metricEt0: 'البخر نتح ET0',
    metricStressDays: 'أيام الإجهاد الحراري',
    ndviTrendRising: 'صاعد',
    ndviTrendStable: 'مستقر',
    ndviTrendFalling: 'هابط',
    reasonNitrogen: 'تثبيت النيتروجين',
    reasonSequence: 'تعاقب زراعي سليم',
    reasonWaterSaver: 'موفر للمياه',
    reasonHeatTolerant: 'متحمل للحرارة',
    reasonSalinitySafe: 'مناسب للملوحة',
    reasonSoilMatch: 'ملائم للتربة',
    reasonMoistureFit: 'موافق للرطوبة',
    reasonPolicyCheck: 'راجع الإدارة الزراعية',
    evRain: 'أمطار ناسا',
    evHeat: 'حرارة ناسا',
    evSoil: 'رطوبة التربة',
    evNdvi: 'خضرة القمر',
    evEt0: 'تقدير البخر',
    cropsPageTitle: 'دليل المحاصيل المصرية',
    cropsPageSubtitle: 'المواسم والاحتياج المائي وملائمة التربة',
    waterLow: 'استهلاك منخفض',
    waterMedium: 'استهلاك متوسط',
    waterHigh: 'استهلاك مرتفع',
    goodAfter: 'يفضل بعد:',
    goodBefore: 'يمهد لـ:',
    expertReviewTag: 'قيد المراجعة البحثية',
    footerAck: 'تعتمد القراءات على بيانات NASA Earthdata المفتوحة دون تمثيل رسمي للوكالة',
    digitsArabic: '١٢٣',
    digitsWestern: '123',
    tileErrorHint: 'خرائط الأقمار بطيئة — يمكنك اختيار المحافظة مباشرة',
    resetFarm: 'إعادة ضبط',
    seasonWinter: 'شتوي',
    seasonSummer: 'صيفي',
    seasonNili: 'نيلي',
    chartNdviTitle: 'السلسلة الزمنية لمؤشر الخضرة (MODIS NDVI)',
    chartWaterTitle: 'البخر نتح والمطر اليومي (POWER + FAO-56)',
    climatologyChartTitle: 'المعدل المناخي السنوي من ناسا (12 شهراً)',
    ruleTraceTitle: 'سجل قواعد اختيار الدورة',
    rejectedPlans: 'خطط مستبعدة',
    regionAll: 'الكل',
    regionDelta: 'الدلتا',
    regionValley: 'الصعيد والوادي',
    regionOasis: 'الواحات وسيناء',
    riceAllowed: 'نطاق زراعة أرز مصرح به',
    riceRestricted: 'زراعة الأرز مقيدة إدارياً هنا',
    sowHarvestBar: 'الزراعة والحصاد',
    savePlot: 'حفظ الحقل',
    savedPlots: 'حقولي المحفوظة',
    plotSavedMsg: 'تم الحفظ',
    printPlan: 'طباعة الخطة',
    refreshNasa: 'تحديث القمر',
    compareStrategies: 'مقارنة الاستراتيجيات',
    waterScoreLabel: 'كفاءة المياه',
    soilScoreLabel: 'صحة التربة',
    climateScoreLabel: 'الملاءمة المناخية',
    lowWaterFilter: 'قليل المياه',
    salineFilter: 'مقاوم للملوحة',
  },
  en: {
    appTitle: 'AgriShift',
    navPlan: 'Field Plan',
    navMap: 'Satellite Map',
    navNasa: 'NASA Data',
    navCrops: 'Crop Atlas',
    heroTitle: 'Visual Crop Rotation from NASA Satellites',
    heroSubtitle: 'Picture-first planning for Egyptian farms',
    heroStep1: 'Pin Field',
    heroStep2: 'Pick Crops',
    heroStep3: 'Get Rotation',
    stepLocation: 'Where is your field?',
    stepCrops: 'What do you grow?',
    stepWaterSoil: 'Water & Soil',
    stepResult: 'Your Rotation Plan',
    useMyLocation: 'My GPS',
    locating: 'Locating...',
    drawField: 'Draw Field',
    finishDraw: 'Finish Drawing',
    undoPoint: 'Undo Point',
    clearField: 'Clear Field',
    drawHint: 'Tap field corners on the satellite map',
    areaLabel: 'Area',
    feddanUnit: 'Feddan',
    kiratUnit: 'Kirat',
    hectareUnit: 'ha',
    governoratesLabel: 'Governorates',
    pickCropsHint: 'Tap crop pictures you prefer',
    undecidedCrop: 'Undecided',
    lastCropQuestion: 'What grew here last season?',
    noneLabel: 'Skip / None',
    fieldSizeLabel: 'Field Size (Feddans)',
    totalWaterNeeded: 'Total Annual Field Water',
    irrigationMethod: 'Irrigation',
    flood: 'Flood',
    drip: 'Drip',
    sprinkler: 'Sprinkler',
    pivot: 'Pivot',
    waterSource: 'Water Source',
    canal: 'Canal',
    groundwater: 'Groundwater',
    soilType: 'Soil Type',
    clay: 'Clay',
    loamy: 'Loamy',
    sandy: 'Sandy',
    salinityLevel: 'Salinity',
    fresh: 'Fresh',
    moderate: 'Moderate',
    saline: 'Saline',
    nextBtn: 'Next',
    backBtn: 'Back',
    showPlanBtn: 'Build Plan',
    restartBtn: 'Start Over',
    strategyBalanced: 'Balanced',
    strategyWater: 'Save Water',
    strategySoil: 'Soil Health',
    planTitle: 'Recommended Rotation',
    decisionSupportNote: 'Decision support only — confirm with your local agronomist',
    alternativesTitle: 'Alternatives',
    swapCrop: 'Swap',
    basedOnNasa: 'Built from:',
    nasaCaveat: 'Satellites measure a wide area around your farm — verify in the field',
    demoBanner: 'Demo Data — Live NASA satellite feeds unreachable right now',
    liveBanner: 'Live NASA Satellite Observations',
    partialBanner: 'Mixed Live & Estimated NASA Feeds',
    layerTrueColor: 'True Color',
    layerNdvi: 'Vegetation NDVI',
    layerHeat: 'Surface Heat',
    layerMoisture: 'Soil Moisture',
    basemapSatellite: 'Satellite',
    basemapNasa: 'NASA GIBS',
    layerDate: 'Observation Date',
    layerOpacity: 'Layer Opacity',
    legendDry: 'Bare Soil',
    legendLush: 'Dense Green',
    legendCool: 'Cooler',
    legendHot: 'Heat Stress',
    legendMoist: 'Wet Soil',
    nasaPageTitle: 'NASA Data We Used',
    nasaPageSubtitle: 'Full transparency on sources, dates, and limits',
    statusLive: 'Live',
    statusEstimated: 'Estimated',
    statusDemo: 'Demo',
    statusUnavailable: 'Unavailable',
    metricRain: 'Rain',
    metricHeat: 'Heat',
    metricSoilWet: 'Soil Moisture',
    metricNdvi: 'NDVI Green',
    metricEt0: 'ET0 Loss',
    metricStressDays: 'Heat Days',
    ndviTrendRising: 'Rising',
    ndviTrendStable: 'Stable',
    ndviTrendFalling: 'Falling',
    reasonNitrogen: 'Nitrogen Fixer',
    reasonSequence: 'Good Sequence',
    reasonWaterSaver: 'Water Saver',
    reasonHeatTolerant: 'Heat Hardy',
    reasonSalinitySafe: 'Salinity Fit',
    reasonSoilMatch: 'Soil Match',
    reasonMoistureFit: 'Moisture Fit',
    reasonPolicyCheck: 'Check Directorate',
    evRain: 'NASA Rain',
    evHeat: 'NASA Heat',
    evSoil: 'Soil Wetness',
    evNdvi: 'MODIS NDVI',
    evEt0: 'FAO-56 ET0',
    cropsPageTitle: 'Egyptian Crop Atlas',
    cropsPageSubtitle: 'Visual seasons, water use & soil compatibility',
    waterLow: 'Low Water',
    waterMedium: 'Medium Water',
    waterHigh: 'High Water',
    goodAfter: 'Good after:',
    goodBefore: 'Followed by:',
    expertReviewTag: 'Needs expert review',
    footerAck: 'Powered by open NASA Earthdata observations (not endorsed by NASA)',
    digitsArabic: '١٢٣',
    digitsWestern: '123',
    tileErrorHint: 'Map tiles slow — pick any governorate chip to continue',
    resetFarm: 'Reset',
    seasonWinter: 'Winter',
    seasonSummer: 'Summer',
    seasonNili: 'Nili',
    chartNdviTitle: 'MODIS NDVI Vegetation Series',
    chartWaterTitle: 'Daily ET0 vs Rainfall (POWER + FAO-56)',
    climatologyChartTitle: 'NASA 12-Month Climate Normal',
    ruleTraceTitle: 'Engine Rule Trace',
    rejectedPlans: 'Rejected sequences',
    regionAll: 'All',
    regionDelta: 'Delta',
    regionValley: 'Nile Valley',
    regionOasis: 'Oases & Sinai',
    riceAllowed: 'Rice Zone Permitted',
    riceRestricted: 'Rice Zoning Restricted',
    sowHarvestBar: 'Sow & Harvest',
    savePlot: 'Save Field',
    savedPlots: 'My Fields',
    plotSavedMsg: 'Saved',
    printPlan: 'Print Plan',
    refreshNasa: 'Refresh NASA',
    compareStrategies: 'Compare Plans',
    waterScoreLabel: 'Water Saved',
    soilScoreLabel: 'Soil Health',
    climateScoreLabel: 'Climate Fit',
    lowWaterFilter: 'Low Water',
    salineFilter: 'Salt Tolerant',
  },
};
