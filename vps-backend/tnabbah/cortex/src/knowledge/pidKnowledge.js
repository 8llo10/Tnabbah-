const BRAND_PROFILES = {
  toyota_corolla: {
    brand: "Toyota",
    model: "Corolla",
    displayName: "تويوتا كورولا",

    knownPidHints: {
      "0101": {
        title: "حالة لمبة المكينة واختبارات السيارة",
        simpleName: "هل السيارة شايفة أعطال أو اختبارات ناقصة",
        category: "الأعطال",
        kind: "technical",
        userMeaning:
          "هذه قراءة تقنية تقول هل لمبة المكينة لها علاقة بأعطال حالية أو اختبارات السيارة الداخلية.",
        safeMessage:
          "هذه القراءة ما تعتبر عطل لوحدها. نستخدمها مع أكواد الأعطال.",
      },

      "0103": {
        title: "حالة نظام البنزين",
        simpleName: "طريقة توصيل البنزين للمكينة",
        category: "البنزين",
        kind: "technical",
        userMeaning:
          "هذه توضح هل نظام البنزين شغال بوضع طبيعي أو وضع تحكم مختلف. ما تنخاف لوحدها.",
        safeMessage:
          "نستخدمها داخليًا مع صرفية البنزين والرجفة والخلط.",
      },

      "0113": {
        title: "حساسات الأكسجين الموجودة",
        simpleName: "حساسات تراقب العادم",
        category: "العادم",
        kind: "technical",
        userMeaning:
          "هذه تخبرنا أي حساسات أكسجين موجودة في السيارة. الحساسات تساعد السيارة تضبط البنزين والهواء.",
        safeMessage:
          "هذه قراءة تعريفية، مو عطل لوحدها.",
      },

      "0115": {
        title: "قراءة حساس الأكسجين",
        simpleName: "حساس يراقب احتراق البنزين",
        category: "العادم",
        kind: "technical",
        userMeaning:
          "هذا الحساس يساعد السيارة تعرف هل البنزين والهواء محترقين بشكل مضبوط.",
        safeMessage:
          "لو معه صرفية أو رجفة أو كود عطل، وقتها يصير مهم.",
      },

      "011C": {
        title: "نوع نظام OBD",
        simpleName: "نوع نظام الفحص في السيارة",
        category: "معلومات السيارة",
        kind: "info",
        userMeaning:
          "هذه معلومة تقنية عن نوع نظام الفحص الموجود في السيارة.",
        safeMessage:
          "ما يحتاج المستخدم يسوي شيء.",
      },

      "0120": {
        title: "قائمة قراءات مدعومة",
        simpleName: "السيارة تقول لنا إيش تقدر تقرأ",
        category: "تقني",
        kind: "hidden",
        userMeaning:
          "هذه قائمة داخلية يستخدمها النظام لمعرفة القراءات المتاحة.",
        safeMessage:
          "ما تظهر للمستخدم لأنها ليست حالة عطل.",
      },

      "0124": {
        title: "قراءة حساس الأكسجين ونسبة الخليط",
        simpleName: "توازن البنزين والهواء",
        category: "العادم",
        kind: "technical",
        userMeaning:
          "هذه تساعدنا نفهم هل خليط البنزين والهواء قريب من الطبيعي.",
        safeMessage:
          "لو معها كود عطل أو صرفية عالية، تحتاج متابعة.",
      },

      "012E": {
        title: "نظام تبخير البنزين",
        simpleName: "نظام يمنع بخار البنزين يطلع للهواء",
        category: "البنزين",
        kind: "info",
        userMeaning:
          "السيارة تتحكم ببخار البنزين بدل ما يطلع للهواء. هذه القراءة تقول كم النظام مفتوح.",
        safeMessage:
          "طبيعي يتغير الرقم حسب وضع السيارة.",
      },

      "0130": {
        title: "عدد مرات التشغيل بعد مسح الأعطال",
        simpleName: "كم مرة اشتغلت السيارة بعد مسح الأكواد",
        category: "الأعطال",
        kind: "info",
        userMeaning:
          "تفيدنا نعرف هل الأكواد انمسحت قريب أو من زمان.",
        safeMessage:
          "لو الأكواد انمسحت ورجعت، غالبًا المشكلة ما انحلت.",
      },

      "0134": {
        title: "حساس أكسجين متقدم",
        simpleName: "حساس يراقب جودة الاحتراق",
        category: "العادم",
        kind: "technical",
        userMeaning:
          "هذا حساس يساعد السيارة تضبط البنزين والهواء بدقة.",
        safeMessage:
          "لو معه كود عطل أو صرفية، يحتاج فحص.",
      },

      "013C": {
        title: "حرارة دبة التلوث",
        simpleName: "حرارة فلتر العادم",
        category: "العادم",
        kind: "numeric",
        userMeaning:
          "دبة التلوث تنظف غازات العادم. حرارتها ترتفع طبيعيًا أثناء التشغيل.",
        warningMessage:
          "حرارة دبة التلوث مرتفعة. لو فيه ريحة غريبة أو ضعف، افحصي العادم.",
        criticalMessage:
          "حرارة دبة التلوث عالية جدًا. الأفضل فحص السيارة.",
        unit: "°C",
        ranges: [
          { level: "normal", min: 0, max: 750 },
          { level: "warning", min: 751, max: 900 },
          { level: "critical", min: 901, max: 2000 },
        ],
      },

      "013E": {
        title: "حرارة دبة التلوث الخلفية",
        simpleName: "حرارة جزء ثاني من العادم",
        category: "العادم",
        kind: "numeric",
        userMeaning:
          "هذه قراءة ثانية لحرارة نظام العادم.",
        warningMessage:
          "حرارة العادم مرتفعة وتحتاج متابعة.",
        criticalMessage:
          "حرارة العادم عالية جدًا. افحصي السيارة.",
        unit: "°C",
        ranges: [
          { level: "normal", min: 0, max: 750 },
          { level: "warning", min: 751, max: 900 },
          { level: "critical", min: 901, max: 2000 },
        ],
      },

      "014D": {
        title: "مدة التشغيل ولمبة المكينة شغالة",
        simpleName: "كم دقيقة والسيارة شغالة مع لمبة المكينة",
        category: "الأعطال",
        kind: "info",
        userMeaning:
          "توضح كم مدة تشغيل السيارة مع وجود لمبة مكينة.",
        safeMessage:
          "لو الرقم يزيد ولمبة المكينة موجودة، لا تهملي الفحص.",
      },

      "014E": {
        title: "الوقت بعد مسح الأعطال",
        simpleName: "كم دقيقة مرت بعد مسح الأكواد",
        category: "الأعطال",
        kind: "info",
        userMeaning:
          "تفيدنا نعرف هل الأكواد انمسحت قريب.",
        safeMessage:
          "بعض الورش تمسح الكود بدون إصلاح، وهذه القراءة تساعدنا ننتبه.",
      },

      "018E": {
        title: "احتكاك المحرك",
        simpleName: "قد إيش المكينة تخسر طاقة داخليًا",
        category: "المكينة",
        kind: "numeric",
        userMeaning:
          "هذه قراءة تقنية عن مقاومة داخل المحرك. ما تهم المستخدم لوحدها.",
        safeMessage:
          "نستخدمها مع RPM والعزم والحرارة.",
      },

      "019D": {
        title: "نسب استخدام أنظمة الوقود",
        simpleName: "معلومات تقنية عن البنزين",
        category: "البنزين",
        kind: "technical",
        userMeaning:
          "قراءة متقدمة تخص طريقة استخدام الوقود.",
        safeMessage:
          "ليست عطل لوحدها.",
      },
      "2101": {
        title: "بيانات تويوتا الداخلية",
        simpleName: "قراءات خاصة بتويوتا",
        category: "خاص بالشركة",
        kind: "technical",
        userMeaning:
          "هذه قراءة داخلية خاصة بتويوتا أو لكزس. نستخدمها لفهم حالة السيارة بشكل أدق.",
        safeMessage:
          "ما تعتبر عطل لوحدها.",
      },

      "2102": {
        title: "قراءة احتراق متقدمة",
        simpleName: "تفاصيل إضافية عن احتراق المكينة",
        category: "المكينة",
        kind: "technical",
        userMeaning:
          "هذه قراءة متقدمة تخص طريقة احتراق البنزين داخل المكينة.",
        safeMessage:
          "تفيدنا داخليًا مع الرجفة والصرفية والأكواد.",
      },

      "2103": {
        title: "بيانات القير",
        simpleName: "معلومات من ناقل الحركة",
        category: "القير",
        kind: "technical",
        userMeaning:
          "هذه قراءة من كمبيوتر القير تساعدنا نفهم حالة ناقل الحركة.",
        safeMessage:
          "ما تعتبر مشكلة إلا إذا معها نتعة أو كود قير.",
      },

      "2104": {
        title: "تعلم الدعسة والثروتل",
        simpleName: "طريقة استجابة السيارة للدعسة",
        category: "الدعسة",
        kind: "technical",
        userMeaning:
          "السيارة تتعلم طريقة الدعس مع الوقت. هذه القراءة تخص هذا التعلم.",
        safeMessage:
          "قراءة طبيعية غالبًا.",
      },

      "2105": {
        title: "تصحيح احتراق المكينة",
        simpleName: "كيف السيارة تعدل أداء المكينة",
        category: "المكينة",
        kind: "technical",
        userMeaning:
          "هذه قراءة تقنية توضح كيف السيارة تحاول تخلي الاحتراق متوازن.",
        safeMessage:
          "ما تعتبر مشكلة لوحدها.",
      },

      "2106": {
        title: "بيانات تبريد متقدمة",
        simpleName: "تفاصيل إضافية عن حرارة السيارة",
        category: "التبريد",
        kind: "technical",
        userMeaning:
          "هذه قراءة متقدمة عن نظام التبريد والحرارة.",
        safeMessage:
          "إذا الحرارة طبيعية، غالبًا ما فيه قلق.",
      },

      "2121": {
        title: "معلومات الدعسة الإلكترونية",
        simpleName: "استجابة الدعسة الإلكترونية",
        category: "الدعسة",
        kind: "technical",
        userMeaning:
          "السيارات الحديثة تستخدم دعسة إلكترونية، وهذه القراءة تخص استجابتها.",
        safeMessage:
          "إذا السيارة تستجيب طبيعي، ما فيه قلق.",
      },

      "2122": {
        title: "قراءة حمل المكيف",
        simpleName: "قد إيش المكيف ضاغط على المكينة",
        category: "التكييف",
        kind: "numeric",
        userMeaning:
          "المكيف يضغط على المكينة خصوصًا وقت الوقوف. هذه القراءة تساعدنا نفهم الحمل.",
        safeMessage:
          "طبيعي يرتفع مع تشغيل المكيف.",
      },

      "2123": {
        title: "بيانات نظام الوقود",
        simpleName: "تفاصيل إضافية عن البنزين",
        category: "البنزين",
        kind: "technical",
        userMeaning:
          "هذه قراءة متقدمة من نظام الوقود.",
        safeMessage:
          "ما تعتبر مشكلة إلا إذا معها صرفية أو كود.",
      },

      "213C": {
        title: "حرارة القير",
        simpleName: "حرارة زيت القير",
        category: "القير",
        kind: "numeric",
        userMeaning:
          "القير له زيت، وإذا حرارته ارتفعت كثير ممكن يتأثر الأداء.",
        warningMessage:
          "حرارة القير مرتفعة شوي. راقبي النتعات أو الثقل.",
        criticalMessage:
          "حرارة القير عالية جدًا. الأفضل تهدئين القيادة وتفحصين القير.",
        unit: "°C",
        ranges: [
          { level: "normal", min: 40, max: 105 },
          { level: "warning", min: 106, max: 120 },
          { level: "critical", min: 121, max: 300 },
        ],
      },

      "2140": {
        title: "حالة نظام الهايبرد",
        simpleName: "معلومات بطارية الهايبرد",
        category: "الهايبرد",
        kind: "technical",
        userMeaning:
          "هذه القراءة تخص سيارات الهايبرد مثل كورولا هايبرد وبعض اللكزس.",
        safeMessage:
          "ما تعتبر مشكلة لوحدها.",
      },

      "2141": {
        title: "حرارة بطارية الهايبرد",
        simpleName: "حرارة بطارية الهايبرد",
        category: "الهايبرد",
        kind: "numeric",
        userMeaning:
          "بطارية الهايبرد لها حرارة تشغيل طبيعية، وإذا ارتفعت كثير تحتاج متابعة.",
        warningMessage:
          "حرارة بطارية الهايبرد مرتفعة.",
        criticalMessage:
          "حرارة بطارية الهايبرد عالية جدًا. الأفضل فحص النظام.",
        unit: "°C",
        ranges: [
          { level: "normal", min: 0, max: 45 },
          { level: "warning", min: 46, max: 55 },
          { level: "critical", min: 56, max: 120 },
        ],
      },

      "2142": {
        title: "مراوح تبريد الهايبرد",
        simpleName: "تبريد بطارية الهايبرد",
        category: "الهايبرد",
        kind: "technical",
        userMeaning:
          "هذه القراءة تخص نظام تبريد بطارية الهايبرد.",
        safeMessage:
          "إذا ما فيه لمبات هايبرد أو حرارة، غالبًا الوضع طبيعي.",
      },

      "2180": {
        title: "بيانات نظام الفرامل",
        simpleName: "معلومات من ABS والفرامل",
        category: "الفرامل",
        kind: "technical",
        userMeaning:
          "هذه قراءة من نظام الفرامل الإلكتروني.",
        safeMessage:
          "إذا ما فيه لمبة ABS أو انزلاق، غالبًا الوضع طبيعي.",
      },

      "2181": {
        title: "حرارة الفرامل",
        simpleName: "حرارة نظام الفرامل",
        category: "الفرامل",
        kind: "numeric",
        userMeaning:
          "هذه قراءة متقدمة عن حرارة نظام الفرامل.",
        warningMessage:
          "حرارة الفرامل مرتفعة. خففي الضغط على الفرامل.",
        criticalMessage:
          "حرارة الفرامل عالية جدًا. وقفي السيارة إذا حسّيتي بريحة أو ضعف.",
        unit: "°C",
      },
      "2182": {
        title: "ضغط الفرامل الإلكتروني",
        simpleName: "قوة ضغط نظام الفرامل",
        category: "الفرامل",
        kind: "technical",
        userMeaning:
          "هذه القراءة توضح كيف نظام الفرامل الإلكتروني يوزع الضغط.",
        safeMessage:
          "غالبًا قراءة داخلية طبيعية.",
      },

      "2183": {
        title: "حساسات الثبات",
        simpleName: "حساسات التوازن والثبات",
        category: "الثبات",
        kind: "technical",
        userMeaning:
          "السيارة تستخدم هذه الحساسات عشان تمنع الانزلاق وتحافظ على الثبات.",
        safeMessage:
          "إذا ما فيه لمبة مانع انزلاق، فالغالب الوضع طبيعي.",
      },

      "2184": {
        title: "زاوية المقود",
        simpleName: "اتجاه الطارة",
        category: "التوجيه",
        kind: "numeric",
        userMeaning:
          "هذه القراءة تعرف اتجاه المقود وتستخدمها أنظمة الثبات.",
        safeMessage:
          "قراءة طبيعية غالبًا.",
        unit: "°",
      },

      "2185": {
        title: "سرعات العجلات",
        simpleName: "سرعة كل كفر بشكل منفصل",
        category: "العجلات",
        kind: "technical",
        userMeaning:
          "السيارة تراقب سرعة كل كفر عشان الثبات وABS.",
        safeMessage:
          "إذا ما فيه لمبات ABS فغالبًا طبيعي.",
      },

      "2190": {
        title: "بيانات حساس الهواء",
        simpleName: "تفاصيل إضافية عن تنفس المكينة",
        category: "الهواء",
        kind: "technical",
        userMeaning:
          "هذه قراءة متقدمة عن دخول الهواء للمكينة.",
        safeMessage:
          "تستخدم داخليًا للتحليل.",
      },

      "2191": {
        title: "تصحيح حساس الأكسجين",
        simpleName: "كيف السيارة توازن الاحتراق",
        category: "البنزين والهواء",
        kind: "technical",
        userMeaning:
          "السيارة تراقب الاحتراق وتعدله بشكل مستمر.",
        safeMessage:
          "ما تعتبر مشكلة لوحدها.",
      },

      "2192": {
        title: "استجابة البخاخات",
        simpleName: "كيف البخاخات ترش البنزين",
        category: "البخاخات",
        kind: "technical",
        userMeaning:
          "هذه القراءة تساعد نفهم أداء البخاخات.",
        safeMessage:
          "إذا ما فيه رجفة أو صرفية فالوضع غالبًا طبيعي.",
      },

      "2193": {
        title: "بيانات حساس الدعسة",
        simpleName: "تفاصيل إضافية عن دعسة البنزين",
        category: "الدعسة",
        kind: "technical",
        userMeaning:
          "هذه قراءة داخلية من نظام الدعسة الإلكترونية.",
        safeMessage:
          "قراءة تقنية داخلية.",
      },

      "2194": {
        title: "تعلم القير",
        simpleName: "كيف القير متعلم على السواقة",
        category: "القير",
        kind: "technical",
        userMeaning:
          "القير يتعلم أسلوب القيادة مع الوقت.",
        safeMessage:
          "طبيعي يتغير حسب طريقة السواقة.",
      },

      "2195": {
        title: "ضغط زيت القير",
        simpleName: "قوة ضغط زيت القير",
        category: "القير",
        kind: "numeric",
        userMeaning:
          "القير يعتمد على ضغط الزيت للتبديلات.",
        warningMessage:
          "ضغط زيت القير يحتاج متابعة.",
        criticalMessage:
          "ضغط زيت القير غير طبيعي وقد يسبب نتعات أو تأخير.",
        unit: "kPa",
      },

      "2196": {
        title: "حالة التعشيقات",
        simpleName: "كيف القير يبدل السرعات",
        category: "القير",
        kind: "technical",
        userMeaning:
          "هذه القراءة توضح وضع التعشيقات داخل القير.",
        safeMessage:
          "قراءة تقنية داخلية.",
      },

      "2197": {
        title: "حرارة الثروتل",
        simpleName: "حرارة بوابة الهواء",
        category: "الهواء",
        kind: "numeric",
        userMeaning:
          "هذه القراءة تخص حرارة الثروتل أو الهواء حوله.",
        safeMessage:
          "غالبًا طبيعية مع حرارة الجو.",
        unit: "°C",
      },

      "2198": {
        title: "مراقبة الاحتراق",
        simpleName: "تحليل أداء الاحتراق",
        category: "المكينة",
        kind: "technical",
        userMeaning:
          "السيارة تراقب جودة الاحتراق داخل المكينة.",
        safeMessage:
          "تستخدم داخليًا للتحليل.",
      },

      "2199": {
        title: "اكتشاف التفتفة",
        simpleName: "مراقبة رجفة الاحتراق",
        category: "المكينة",
        kind: "technical",
        userMeaning:
          "السيارة تراقب إذا فيه احتراق مو ثابت أو تفتفة.",
        warningMessage:
          "السيارة رصدت احتراق مو ثابت.",
        criticalMessage:
          "فيه تفتفة قوية ممكن تضر دبة التلوث أو المكينة.",
      },

      "21A0": {
        title: "معلومات دبة التلوث",
        simpleName: "حالة نظام العادم",
        category: "العادم",
        kind: "technical",
        userMeaning:
          "هذه القراءة تخص دبة التلوث والانبعاثات.",
        safeMessage:
          "إذا ما فيه لمبة مكينة فالغالب الوضع طبيعي.",
      },

      "21A1": {
        title: "حرارة دبة التلوث",
        simpleName: "حرارة نظام العادم",
        category: "العادم",
        kind: "numeric",
        userMeaning:
          "دبة التلوث تسخن بشكل طبيعي أثناء التشغيل.",
        warningMessage:
          "حرارة العادم مرتفعة.",
        criticalMessage:
          "حرارة العادم عالية جدًا.",
        unit: "°C",
      },

      "21A2": {
        title: "كفاءة دبة التلوث",
        simpleName: "هل نظام التلوث يشتغل بكفاءة",
        category: "العادم",
        kind: "technical",
        userMeaning:
          "السيارة تراقب كفاءة دبة التلوث.",
        safeMessage:
          "غالبًا طبيعي إذا ما فيه كود P0420.",
      },

      "21B0": {
        title: "حالة البطارية",
        simpleName: "صحة بطارية السيارة",
        category: "الكهرباء",
        kind: "technical",
        userMeaning:
          "هذه القراءة تخص حالة البطارية والشحن.",
        safeMessage:
          "تفيدنا مع مشاكل التشغيل والكهرباء.",
      },

      "21B1": {
        title: "تيار البطارية",
        simpleName: "كم البطارية تسحب أو تشحن",
        category: "الكهرباء",
        kind: "numeric",
        userMeaning:
          "هذه القراءة توضح حركة الكهرباء داخل البطارية.",
        safeMessage:
          "تتغير باستمرار حسب تشغيل السيارة.",
        unit: "A",
      },

      "21B2": {
        title: "حرارة البطارية",
        simpleName: "حرارة بطارية السيارة",
        category: "الكهرباء",
        kind: "numeric",
        userMeaning:
          "البطارية إذا ارتفعت حرارتها كثير ممكن تضعف.",
        warningMessage:
          "حرارة البطارية مرتفعة.",
        criticalMessage:
          "حرارة البطارية عالية جدًا.",
        unit: "°C",
      },

      "21C0": {
        title: "حالة نظام ABS",
        simpleName: "نظام مانع الانغلاق",
        category: "الفرامل",
        kind: "technical",
        userMeaning:
          "هذا النظام يمنع الكفرات من القفل وقت الفرامل القوية.",
        safeMessage:
          "إذا ما فيه لمبة ABS فالغالب الوضع طبيعي.",
      },

      "21C1": {
        title: "ضغط ABS",
        simpleName: "ضغط نظام الفرامل الإلكتروني",
        category: "الفرامل",
        kind: "numeric",
        userMeaning:
          "السيارة تراقب ضغط الفرامل إلكترونيًا.",
        warningMessage:
          "ضغط الفرامل يحتاج متابعة.",
        criticalMessage:
          "ضغط الفرامل غير طبيعي.",
        unit: "kPa",
      },

      "21C2": {
        title: "توازن الفرامل",
        simpleName: "توزيع الفرامل بين الكفرات",
        category: "الفرامل",
        kind: "technical",
        userMeaning:
          "السيارة توزع الفرامل بين الكفرات للمحافظة على الثبات.",
        safeMessage:
          "قراءة طبيعية غالبًا.",
      },

      "21C3": {
        title: "حالة الثبات الإلكتروني",
        simpleName: "نظام مانع الانزلاق",
        category: "الثبات",
        kind: "technical",
        userMeaning:
          "هذا النظام يساعد السيارة تثبت إذا صار انزلاق.",
        safeMessage:
          "إذا ما فيه لمبة انزلاق فالغالب طبيعي.",
      },

      "21C4": {
        title: "تدخل مانع الانزلاق",
        simpleName: "السيارة تحاول تمنع الانزلاق",
        category: "الثبات",
        kind: "technical",
        userMeaning:
          "السيارة تدخلت للحفاظ على الثبات.",
        safeMessage:
          "طبيعي أحيانًا بالمطر أو الدعس القوي.",
      },

      "21C5": {
        title: "زاوية انحراف السيارة",
        simpleName: "اتجاه حركة السيارة",
        category: "الثبات",
        kind: "numeric",
        userMeaning:
          "السيارة تقيس اتجاه الحركة للمحافظة على الثبات.",
        safeMessage:
          "قراءة داخلية للنظام.",
        unit: "°/s",
      },

      "21D0": {
        title: "حالة القير CVT",
        simpleName: "وضع القير",
        category: "القير",
        kind: "technical",
        userMeaning:
          "هذه القراءة تخص طريقة عمل القير.",
        safeMessage:
          "تفيد في تحليل القير.",
      },

      "21D1": {
        title: "حرارة زيت القير",
        simpleName: "حرارة القير",
        category: "القير",
        kind: "numeric",
        userMeaning:
          "القير يحتاج حرارة مناسبة عشان يبدل بشكل طبيعي.",
        warningMessage:
          "حرارة القير مرتفعة.",
        criticalMessage:
          "حرارة القير عالية جدًا.",
        unit: "°C",
      },

      "21D2": {
        title: "ضغط زيت القير",
        simpleName: "ضغط زيت القير الداخلي",
        category: "القير",
        kind: "numeric",
        userMeaning:
          "القير يعتمد على ضغط الزيت داخله.",
        warningMessage:
          "ضغط زيت القير يحتاج متابعة.",
        criticalMessage:
          "ضغط زيت القير غير طبيعي.",
        unit: "kPa",
      },

      "21D3": {
        title: "نسبة القير الحالية",
        simpleName: "القير على أي نسبة",
        category: "القير",
        kind: "numeric",
        userMeaning:
          "القير يغير النسب حسب السرعة والدعسة.",
        safeMessage:
          "قراءة طبيعية أثناء السواقة.",
      },

      "21D4": {
        title: "انزلاق القير",
        simpleName: "هل القير يفلت",
        category: "القير",
        kind: "technical",
        userMeaning:
          "السيارة تراقب إذا فيه تهريب أو انزلاق داخل القير.",
        warningMessage:
          "فيه انزلاق بسيط بالقير.",
        criticalMessage:
          "انزلاق القير مرتفع وقد يسبب نتعات وضعف.",
      },

      "21D5": {
        title: "تعلم القير",
        simpleName: "القير يتعلم طريقة السواقة",
        category: "القير",
        kind: "technical",
        userMeaning:
          "القير يتأقلم مع طريقة القيادة.",
        safeMessage:
          "طبيعي يتغير حسب الاستخدام.",
      },

      "21E0": {
        title: "المكيف الإلكتروني",
        simpleName: "حالة نظام التكييف",
        category: "التكييف",
        kind: "technical",
        userMeaning:
          "هذه القراءة تخص كمبيوتر المكيف.",
        safeMessage:
          "قراءة تقنية داخلية.",
      },

      "21E1": {
        title: "ضغط المكيف",
        simpleName: "ضغط غاز المكيف",
        category: "التكييف",
        kind: "numeric",
        userMeaning:
          "المكيف يعتمد على ضغط الغاز للتبريد.",
        warningMessage:
          "ضغط المكيف غير مستقر.",
        criticalMessage:
          "ضغط المكيف غير طبيعي.",
        unit: "kPa",
      },

      "21E2": {
        title: "حرارة المبخر",
        simpleName: "حرارة ثلاجة المكيف",
        category: "التكييف",
        kind: "numeric",
        userMeaning:
          "هذه الحرارة تساعد السيارة تتحكم بالتبريد.",
        safeMessage:
          "طبيعي تتغير مع قوة التبريد.",
        unit: "°C",
      },

      "21E3": {
        title: "سرعة مروحة المكيف",
        simpleName: "قوة مروحة التكييف",
        category: "التكييف",
        kind: "numeric",
        userMeaning:
          "هذه القراءة تخص سرعة مروحة التكييف.",
        safeMessage:
          "طبيعي تتغير حسب التبريد.",
        unit: "%",
      },

      "21F0": {
        title: "نظام المفتاح الذكي",
        simpleName: "حالة المفتاح والبصمة",
        category: "الراحة",
        kind: "technical",
        userMeaning:
          "هذه القراءة تخص نظام الدخول والتشغيل الذكي.",
        safeMessage:
          "قراءة داخلية للنظام.",
      },

      "21F1": {
        title: "جهد ريموت السيارة",
        simpleName: "بطارية المفتاح",
        category: "الراحة",
        kind: "numeric",
        userMeaning:
          "إذا ضعفت بطارية المفتاح ممكن السيارة ما تتعرف عليه بسهولة.",
        warningMessage:
          "بطارية المفتاح ضعيفة.",
        criticalMessage:
          "بطارية المفتاح شبه منتهية.",
        unit: "V",
      },

      "21F2": {
        title: "حالة التشغيل الذكي",
        simpleName: "هل السيارة تعرفت على المفتاح",
        category: "الراحة",
        kind: "technical",
        userMeaning:
          "السيارة تتأكد من وجود المفتاح داخل السيارة.",
        safeMessage:
          "قراءة طبيعية غالبًا.",
      },

      "2200": {
        title: "حالة نظام الهايبرد",
        simpleName: "نظام الهايبرد",
        category: "الهايبرد",
        kind: "technical",
        userMeaning:
          "هذه القراءة تخص كمبيوتر نظام الهايبرد.",
        safeMessage:
          "قراءة تقنية داخلية.",
      },

      "2201": {
        title: "شحن بطارية الهايبرد",
        simpleName: "كم باقي شحن ببطارية الهايبرد",
        category: "الهايبرد",
        kind: "numeric",
        userMeaning:
          "بطارية الهايبرد تشحن وتفرغ باستمرار أثناء القيادة.",
        warningMessage:
          "شحن بطارية الهايبرد منخفض.",
        criticalMessage:
          "شحن بطارية الهايبرد منخفض جدًا.",
        unit: "%",
      },

      "2202": {
        title: "حرارة بطارية الهايبرد",
        simpleName: "حرارة بطارية الهايبرد",
        category: "الهايبرد",
        kind: "numeric",
        userMeaning:
          "بطارية الهايبرد تحتاج تبريد مناسب.",
        warningMessage:
          "حرارة بطارية الهايبرد مرتفعة.",
        criticalMessage:
          "حرارة بطارية الهايبرد عالية جدًا.",
        unit: "°C",
      },

      "2203": {
        title: "مروحة تبريد بطارية الهايبرد",
        simpleName: "مروحة تبريد البطارية",
        category: "الهايبرد",
        kind: "numeric",
        userMeaning:
          "هذه المروحة تبرد بطارية الهايبرد.",
        safeMessage:
          "طبيعي ترتفع سرعتها مع الحرارة.",
        unit: "%",
      },

      "2204": {
        title: "جهد خلايا الهايبرد",
        simpleName: "قوة خلايا البطارية",
        category: "الهايبرد",
        kind: "numeric",
        userMeaning:
          "السيارة تراقب جهد خلايا بطارية الهايبرد.",
        warningMessage:
          "فيه اختلاف بجهد بعض الخلايا.",
        criticalMessage:
          "فرق الجهد عالي وقد يدل على ضعف البطارية.",
        unit: "V",
      },

      "2205": {
        title: "حالة المحرك الكهربائي",
        simpleName: "الموتور الكهربائي",
        category: "الهايبرد",
        kind: "technical",
        userMeaning:
          "هذه القراءة تخص المحرك الكهربائي في الهايبرد.",
        safeMessage:
          "قراءة تقنية داخلية.",
      },

      "2206": {
        title: "حرارة الانفرتر",
        simpleName: "حرارة كمبيوتر الهايبرد",
        category: "الهايبرد",
        kind: "numeric",
        userMeaning:
          "الانفرتر يحول الكهرباء داخل نظام الهايبرد.",
        warningMessage:
          "حرارة الانفرتر مرتفعة.",
        criticalMessage:
          "حرارة الانفرتر عالية جدًا.",
        unit: "°C",
      },

      "2210": {
        title: "نظام التوجيه الكهربائي",
        simpleName: "الدركسون الكهربائي",
        category: "التوجيه",
        kind: "technical",
        userMeaning:
          "هذه القراءة تخص نظام الباور الكهربائي.",
        safeMessage:
          "إذا الدركسون طبيعي فالغالب الوضع طبيعي.",
      },

      "2211": {
        title: "عزم الدركسون",
        simpleName: "قوة مساعدة الدركسون",
        category: "التوجيه",
        kind: "numeric",
        userMeaning:
          "السيارة تساعدك بلف الدركسون حسب السرعة.",
        safeMessage:
          "طبيعي تتغير حسب السرعة.",
      },

      "2212": {
        title: "حرارة وحدة التوجيه",
        simpleName: "حرارة نظام الدركسون",
        category: "التوجيه",
        kind: "numeric",
        userMeaning:
          "هذه حرارة كمبيوتر الباور الكهربائي.",
        warningMessage:
          "حرارة نظام التوجيه مرتفعة.",
        criticalMessage:
          "حرارة نظام التوجيه عالية جدًا.",
        unit: "°C",
      },

      "2220": {
        title: "نظام الإضاءة الذكية",
        simpleName: "أنظمة الأنوار",
        category: "الكهرباء",
        kind: "technical",
        userMeaning:
          "هذه القراءة تخص أنظمة الإضاءة الذكية.",
        safeMessage:
          "قراءة داخلية للنظام.",
      },

      "2221": {
        title: "حساس الإضاءة",
        simpleName: "حساس الليل والنهار",
        category: "الكهرباء",
        kind: "numeric",
        userMeaning:
          "السيارة تستخدمه لتشغيل الأنوار تلقائيًا.",
        safeMessage:
          "طبيعي يتغير حسب الضوء.",
      },

      "2230": {
        title: "نظام الأبواب الذكي",
        simpleName: "أقفال وأبواب السيارة",
        category: "الراحة",
        kind: "technical",
        userMeaning:
          "هذه القراءة تخص الأقفال والأبواب الإلكترونية.",
        safeMessage:
          "قراءة داخلية للنظام.",
      },

      "2231": {
        title: "حالة باب السائق",
        simpleName: "هل باب السائق مقفل",
        category: "الراحة",
        kind: "technical",
        userMeaning:
          "السيارة تراقب حالة الأبواب.",
        safeMessage:
          "قراءة طبيعية غالبًا.",
      },

      "2232": {
        title: "حالة الشنطة",
        simpleName: "هل الشنطة مقفلة",
        category: "الراحة",
        kind: "technical",
        userMeaning:
          "السيارة تراقب قفل الشنطة الخلفية.",
        safeMessage:
          "قراءة طبيعية غالبًا.",
      },

      "2240": {
        title: "نظام ضغط الكفرات",
        simpleName: "حساسات الهواء بالكفرات",
        category: "الكفرات",
        kind: "technical",
        userMeaning:
          "السيارة تراقب ضغط الهواء داخل الكفرات.",
        safeMessage:
          "إذا ما فيه لمبة ضغط كفرات فالغالب طبيعي.",
      },

      "2241": {
        title: "ضغط الكفر الأمامي اليمين",
        simpleName: "هواء الكفر الأمامي اليمين",
        category: "الكفرات",
        kind: "numeric",
        userMeaning:
          "هذه قراءة ضغط الهواء داخل الكفر.",
        warningMessage:
          "ضغط الكفر منخفض.",
        criticalMessage:
          "ضغط الكفر منخفض جدًا.",
        unit: "kPa",
      },

      "2242": {
        title: "ضغط الكفر الأمامي اليسار",
        simpleName: "هواء الكفر الأمامي اليسار",
        category: "الكفرات",
        kind: "numeric",
        userMeaning:
          "هذه قراءة ضغط الهواء داخل الكفر.",
        warningMessage:
          "ضغط الكفر منخفض.",
        criticalMessage:
          "ضغط الكفر منخفض جدًا.",
        unit: "kPa",
      },

      "2243": {
        title: "ضغط الكفر الخلفي اليمين",
        simpleName: "هواء الكفر الخلفي اليمين",
        category: "الكفرات",
        kind: "numeric",
        userMeaning:
          "هذه قراءة ضغط الهواء داخل الكفر.",
        warningMessage:
          "ضغط الكفر منخفض.",
        criticalMessage:
          "ضغط الكفر منخفض جدًا.",
        unit: "kPa",
      },

      "2244": {
        title: "ضغط الكفر الخلفي اليسار",
        simpleName: "هواء الكفر الخلفي اليسار",
        category: "الكفرات",
        kind: "numeric",
        userMeaning:
          "هذه قراءة ضغط الهواء داخل الكفر.",
        warningMessage:
          "ضغط الكفر منخفض.",
        criticalMessage:
          "ضغط الكفر منخفض جدًا.",
        unit: "kPa",
      },

      "2250": {
        title: "نظام الرادار الأمامي",
        simpleName: "رادار الأمان الأمامي",
        category: "السلامة",
        kind: "technical",
        userMeaning:
          "هذا النظام يساعد السيارة تراقب الطريق قدامها.",
        safeMessage:
          "إذا ما فيه تحذيرات بالشاشة فالغالب طبيعي.",
      },

      "2251": {
        title: "حالة الكاميرا الأمامية",
        simpleName: "كاميرا الطريق الأمامية",
        category: "السلامة",
        kind: "technical",
        userMeaning:
          "الكاميرا تساعد السيارة بمتابعة المسار والتنبيهات.",
        safeMessage:
          "تحتاج رؤية واضحة للطريق.",
      },

      "2252": {
        title: "نظام المسار",
        simpleName: "مساعدة البقاء بالمسار",
        category: "السلامة",
        kind: "technical",
        userMeaning:
          "السيارة تساعدك تبقى داخل المسار.",
        safeMessage:
          "قراءة داخلية للنظام.",
      },

      "2253": {
        title: "اكتشاف السيارات الأمامية",
        simpleName: "السيارة تراقب اللي قدامك",
        category: "السلامة",
        kind: "technical",
        userMeaning:
          "النظام يتابع المسافة والسيارات الأمامية.",
        safeMessage:
          "طبيعي أثناء القيادة.",
      },

      "2254": {
        title: "مستوى تدخل الأمان",
        simpleName: "مدى تدخل أنظمة الحماية",
        category: "السلامة",
        kind: "numeric",
        userMeaning:
          "السيارة أحيانًا تتدخل للحماية أو التنبيه.",
        safeMessage:
          "قراءة تقنية داخلية.",
        unit: "%",
      },

      "2260": {
        title: "نظام تشغيل المحرك",
        simpleName: "حالة تشغيل المكينة",
        category: "المكينة",
        kind: "technical",
        userMeaning:
          "هذه القراءة تخص إدارة تشغيل المحرك.",
        safeMessage:
          "قراءة داخلية للنظام.",
      },

      "2261": {
        title: "استهلاك الهواء النظري",
        simpleName: "كم المفروض المكينة تسحب هوا",
        category: "الهواء",
        kind: "numeric",
        userMeaning:
          "السيارة تقارن الهواء الحقيقي بالهواء المتوقع.",
        safeMessage:
          "تستخدم للتحليل الداخلي.",
        unit: "g/s",
      },

      "2262": {
        title: "كفاءة الاحتراق",
        simpleName: "جودة الاحتراق داخل المكينة",
        category: "المكينة",
        kind: "numeric",
        userMeaning:
          "السيارة تحلل جودة الاحتراق والأداء.",
        warningMessage:
          "كفاءة الاحتراق أقل من المتوقع.",
        criticalMessage:
          "فيه ضعف واضح بالاحتراق.",
        unit: "%",
      },

      "2263": {
        title: "توازن السلندرات",
        simpleName: "هل السلندرات تشتغل بتوازن",
        category: "المكينة",
        kind: "technical",
        userMeaning:
          "السيارة تراقب إذا كل السلندرات تشتغل بنفس المستوى.",
        warningMessage:
          "فيه اختلاف بين السلندرات.",
        criticalMessage:
          "فيه سلندر مو شغال طبيعي.",
      },

      "2264": {
        title: "اهتزاز المحرك",
        simpleName: "رجفة المكينة",
        category: "المكينة",
        kind: "numeric",
        userMeaning:
          "هذه القراءة تقيس اهتزاز المحرك.",
        warningMessage:
          "رجفة المكينة أعلى من الطبيعي.",
        criticalMessage:
          "رجفة المكينة قوية.",
      },

      "2270": {
        title: "نظام الوقوف الذكي",
        simpleName: "حساسات الاصطفاف",
        category: "الراحة",
        kind: "technical",
        userMeaning:
          "السيارة تستخدم حساسات للمساعدة بالوقوف.",
        safeMessage:
          "إذا ما فيه صفير مستمر فالغالب طبيعي.",
      },

      "2271": {
        title: "حساس أمامي يمين",
        simpleName: "حساس الاصطفاف الأمامي اليمين",
        category: "الراحة",
        kind: "technical",
        userMeaning:
          "هذا الحساس يراقب المسافة قدام السيارة.",
        safeMessage:
          "قراءة داخلية للنظام.",
      },

      "2272": {
        title: "حساس أمامي يسار",
        simpleName: "حساس الاصطفاف الأمامي اليسار",
        category: "الراحة",
        kind: "technical",
        userMeaning:
          "هذا الحساس يراقب المسافة قدام السيارة.",
        safeMessage:
          "قراءة داخلية للنظام.",
      },

      "2273": {
        title: "حساس خلفي يمين",
        simpleName: "حساس الاصطفاف الخلفي اليمين",
        category: "الراحة",
        kind: "technical",
        userMeaning:
          "هذا الحساس يراقب المسافة خلف السيارة.",
        safeMessage:
          "قراءة داخلية للنظام.",
      },

      "2274": {
        title: "حساس خلفي يسار",
        simpleName: "حساس الاصطفاف الخلفي اليسار",
        category: "الراحة",
        kind: "technical",
        userMeaning:
          "هذا الحساس يراقب المسافة خلف السيارة.",
        safeMessage:
          "قراءة داخلية للنظام.",
      },

      "2280": {
        title: "وضع القيادة",
        simpleName: "مود القيادة الحالي",
        category: "القيادة",
        kind: "technical",
        userMeaning:
          "السيارة ممكن تكون على Eco أو Sport أو Normal.",
        safeMessage:
          "يتغير حسب اختيار السائق.",
      },

      "2281": {
        title: "استجابة الدعسة",
        simpleName: "سرعة استجابة البنزين",
        category: "الدعسة",
        kind: "numeric",
        userMeaning:
          "السيارة تعدل استجابة الدعسة حسب وضع القيادة.",
        safeMessage:
          "طبيعي يتغير بين Eco وSport.",
        unit: "%",
      },

      "2282": {
        title: "وضع ECO",
        simpleName: "توفير البنزين",
        category: "القيادة",
        kind: "technical",
        userMeaning:
          "السيارة تحاول تقلل استهلاك البنزين.",
        safeMessage:
          "وضع اقتصادي طبيعي.",
      },

      "2283": {
        title: "وضع SPORT",
        simpleName: "الوضع الرياضي",
        category: "القيادة",
        kind: "technical",
        userMeaning:
          "السيارة تستجيب بشكل أسرع للدعسة.",
        safeMessage:
          "يزيد صرفية البنزين غالبًا.",
      },

      "2290": {
        title: "حالة شبكة CAN",
        simpleName: "تواصل كمبيوترات السيارة",
        category: "الاتصالات",
        kind: "technical",
        userMeaning:
          "كمبيوترات السيارة تتواصل مع بعض عبر شبكة داخلية.",
        safeMessage:
          "قراءة داخلية مهمة للتحليل.",
      },

      "2291": {
        title: "جودة الاتصال الداخلي",
        simpleName: "استقرار تواصل الأنظمة",
        category: "الاتصالات",
        kind: "numeric",
        userMeaning:
          "هذه القراءة تخص استقرار الشبكة الداخلية.",
        warningMessage:
          "فيه ضعف بسيط بالاتصال الداخلي.",
        criticalMessage:
          "فيه مشكلة واضحة بتواصل الأنظمة.",
        unit: "%",
      },

      "22FF": {
        title: "بيانات تويوتا الخاصة",
        simpleName: "قراءات خاصة بالشركة",
        category: "خاص بالشركة",
        kind: "technical",
        userMeaning:
          "هذه بيانات داخلية خاصة بتويوتا أو لكزس.",
        safeMessage:
          "ما نعتبرها عطل لوحدها إلا إذا ارتبطت بكود أو عرض واضح.",
      },
      "22A0": {
        title: "مراقبة استهلاك البنزين",
        simpleName: "تحليل صرفية البنزين",
        category: "البنزين",
        kind: "technical",
        userMeaning:
          "السيارة تحلل استهلاك الوقود بشكل لحظي.",
        safeMessage:
          "قراءة تحليلية داخلية.",
      },

      "22A1": {
        title: "متوسط الاستهلاك",
        simpleName: "متوسط صرفية البنزين",
        category: "البنزين",
        kind: "numeric",
        userMeaning:
          "هذه القراءة تخص متوسط استهلاك الوقود.",
        safeMessage:
          "تتغير حسب السواقة والزحمة.",
        unit: "km/L",
      },

      "22A2": {
        title: "استهلاك أثناء الوقوف",
        simpleName: "صرفية السيارة وهي واقفة",
        category: "البنزين",
        kind: "numeric",
        userMeaning:
          "السيارة تستهلك بنزين حتى وهي واقفة والمكينة شغالة.",
        safeMessage:
          "طبيعي يرتفع مع المكيف.",
        unit: "L/h",
      },

      "22A3": {
        title: "تحليل الدعسة",
        simpleName: "طريقة استخدام البنزين",
        category: "الدعسة",
        kind: "technical",
        userMeaning:
          "السيارة تراقب طريقة الدعس وتأثيرها على الأداء.",
        safeMessage:
          "تستخدم لتحسين الاستجابة والصرفية.",
      },

      "22A4": {
        title: "توفير الوقود الذكي",
        simpleName: "كيف السيارة توفر البنزين",
        category: "البنزين",
        kind: "technical",
        userMeaning:
          "النظام يحاول يقلل استهلاك الوقود.",
        safeMessage:
          "قراءة داخلية للنظام.",
      },

      "22B0": {
        title: "مراقبة حرارة المكينة",
        simpleName: "تحليل حرارة المحرك",
        category: "المكينة",
        kind: "technical",
        userMeaning:
          "السيارة تراقب توزيع الحرارة داخل المكينة.",
        safeMessage:
          "قراءة تحليلية داخلية.",
      },

      "22B1": {
        title: "حرارة رأس المكينة",
        simpleName: "حرارة أعلى المحرك",
        category: "المكينة",
        kind: "numeric",
        userMeaning:
          "هذه القراءة تخص حرارة رأس المحرك.",
        warningMessage:
          "حرارة رأس المكينة مرتفعة.",
        criticalMessage:
          "حرارة رأس المكينة عالية جدًا.",
        unit: "°C",
      },

      "22B2": {
        title: "كفاءة التبريد",
        simpleName: "أداء نظام التبريد",
        category: "التبريد",
        kind: "numeric",
        userMeaning:
          "السيارة تحلل كفاءة نظام التبريد.",
        warningMessage:
          "تبريد السيارة أضعف من المتوقع.",
        criticalMessage:
          "فيه ضعف واضح بالتبريد.",
        unit: "%",
      },

      "22B3": {
        title: "سرعة مروحة الرديتر",
        simpleName: "قوة مروحة التبريد",
        category: "التبريد",
        kind: "numeric",
        userMeaning:
          "المروحة تبرد الرديتر والمكينة.",
        safeMessage:
          "طبيعي تتغير حسب الحرارة.",
        unit: "%",
      },

      "22B4": {
        title: "ضغط دورة التبريد",
        simpleName: "ضغط ماء الرديتر",
        category: "التبريد",
        kind: "numeric",
        userMeaning:
          "السيارة تراقب ضغط دورة التبريد.",
        warningMessage:
          "ضغط دورة التبريد غير مستقر.",
        criticalMessage:
          "ضغط دورة التبريد غير طبيعي.",
        unit: "kPa",
      },

      "22C0": {
        title: "مراقبة الشحن الكهربائي",
        simpleName: "تحليل شحن البطارية",
        category: "الكهرباء",
        kind: "technical",
        userMeaning:
          "السيارة تراقب نظام الشحن الكهربائي.",
        safeMessage:
          "قراءة تحليلية داخلية.",
      },

      "22C1": {
        title: "حمل الدينمو",
        simpleName: "كم الدينمو يشتغل بقوة",
        category: "الكهرباء",
        kind: "numeric",
        userMeaning:
          "الدينمو يشحن البطارية ويغذي الأنظمة الكهربائية.",
        warningMessage:
          "الدينمو عليه حمل مرتفع.",
        criticalMessage:
          "حمل الدينمو عالي جدًا.",
        unit: "%",
      },

      "22C2": {
        title: "استهلاك الكهرباء",
        simpleName: "كم السيارة تسحب كهرباء",
        category: "الكهرباء",
        kind: "numeric",
        userMeaning:
          "هذه القراءة تخص استهلاك الأنظمة الكهربائية.",
        safeMessage:
          "يرتفع مع المكيف والأنوار.",
        unit: "A",
      },

      "22C3": {
        title: "استقرار الجهد",
        simpleName: "ثبات كهرباء السيارة",
        category: "الكهرباء",
        kind: "numeric",
        userMeaning:
          "السيارة تراقب استقرار الفولت.",
        warningMessage:
          "الفولت غير مستقر.",
        criticalMessage:
          "فيه مشكلة واضحة بالكهرباء.",
        unit: "V",
      },

      "22D0": {
        title: "حالة الوسائد الهوائية",
        simpleName: "أنظمة الإيرباق",
        category: "السلامة",
        kind: "technical",
        userMeaning:
          "السيارة تراقب أنظمة الحماية والإيرباق.",
        safeMessage:
          "إذا ما فيه لمبة SRS فالغالب طبيعي.",
      },

      "22D1": {
        title: "حساسات التصادم",
        simpleName: "حساسات الحوادث",
        category: "السلامة",
        kind: "technical",
        userMeaning:
          "السيارة تعتمد عليها لتفعيل الحماية وقت الحوادث.",
        safeMessage:
          "قراءة داخلية للنظام.",
      },

      "22D2": {
        title: "حالة أحزمة الأمان",
        simpleName: "أنظمة شد الأحزمة",
        category: "السلامة",
        kind: "technical",
        userMeaning:
          "هذه القراءة تخص أنظمة شد الأحزمة.",
        safeMessage:
          "مرتبطة بأنظمة السلامة.",
      },

      "22E0": {
        title: "تحليل جودة القيادة",
        simpleName: "كيف السيارة تقيم السواقة",
        category: "القيادة",
        kind: "technical",
        userMeaning:
          "السيارة تتابع أسلوب القيادة واستهلاك البنزين.",
        safeMessage:
          "قراءة تحليلية داخلية.",
      },

      "22E1": {
        title: "الدعس القوي",
        simpleName: "كم مرة صار دعس قوي",
        category: "القيادة",
        kind: "numeric",
        userMeaning:
          "السيارة تسجل أحيانًا أسلوب القيادة.",
        safeMessage:
          "للاستخدام التحليلي فقط.",
        unit: "count",
      },

      "22E2": {
        title: "الفرامل القوية",
        simpleName: "كم مرة صار فرامل مفاجئة",
        category: "القيادة",
        kind: "numeric",
        userMeaning:
          "هذه القراءة تخص أسلوب القيادة.",
        safeMessage:
          "قراءة تحليلية فقط.",
        unit: "count",
      },

    },


    unknownPidPolicy: {
      title: "قراءة خاصة من كورولا",
      simpleName: "قراءة من نظام تويوتا",
      category: "خاص بالشركة",
      userMeaning:
        "هذه قراءة وصلت من السيارة لكنها غالبًا خاصة بتويوتا أو بالموديل. ما نعتبرها عطل لوحدها.",
      safeMessage:
        "نخزنها ونقارنها مع باقي القراءات، لكن ما نقلق المستخدم منها إلا لو معها كود عطل أو عرض واضح.",
      userHidden: true,
    },
  },







  LEXUS_PROFILE: {

    manufacturer: "Lexus",

    supportedModels: [
      "IS",
      "ES",
      "LS",
      "GS",
      "RX",
      "NX",
      "LX",
      "UX",
    ],

    pids: {

      "2300": {
        title: "نظام التعليق الإلكتروني",
        simpleName: "راحة وثبات السيارة",
        category: "التعليق",
        kind: "technical",
        userMeaning:
          "بعض سيارات لكزس تغير قساوة المساعدات إلكترونيًا حسب الطريق.",
        safeMessage:
          "النظام يعدل الثبات والراحة تلقائيًا.",
      },

      "2301": {
        title: "قساوة المساعدات",
        simpleName: "نعومة أو قساوة التعليق",
        category: "التعليق",
        kind: "numeric",
        userMeaning:
          "السيارة تغير راحة التعليق حسب السرعة والطريق.",
        safeMessage:
          "طبيعي تتغير أثناء القيادة.",
        unit: "%",
      },

      "2302": {
        title: "ارتفاع السيارة",
        simpleName: "ارتفاع جسم السيارة",
        category: "التعليق",
        kind: "numeric",
        userMeaning:
          "بعض موديلات لكزس ترفع أو تنزل السيارة تلقائيًا.",
        warningMessage:
          "ارتفاع السيارة غير متوازن.",
        criticalMessage:
          "فيه مشكلة بنظام التعليق الهوائي.",
        unit: "mm",
      },

      "2303": {
        title: "ضغط التعليق الهوائي",
        simpleName: "ضغط نظام التعليق",
        category: "التعليق",
        kind: "numeric",
        userMeaning:
          "السيارة تستخدم ضغط هواء للتحكم بالراحة والارتفاع.",
        warningMessage:
          "ضغط التعليق منخفض.",
        criticalMessage:
          "ضغط التعليق غير طبيعي.",
        unit: "kPa",
      },

      "2310": {
        title: "الرادار الأمامي المتقدم",
        simpleName: "رادار الأمان",
        category: "السلامة",
        kind: "technical",
        userMeaning:
          "هذا النظام يساعد بالتحذير من الاصطدام والحفاظ على المسافة.",
        safeMessage:
          "إذا ما فيه تحذيرات فالغالب الوضع طبيعي.",
      },

      "2311": {
        title: "المسافة من السيارة الأمامية",
        simpleName: "المسافة اللي قدامك",
        category: "السلامة",
        kind: "numeric",
        userMeaning:
          "الرادار يقيس المسافة بينك وبين السيارة الأمامية.",
        safeMessage:
          "تتغير حسب السواقة.",
        unit: "m",
      },

      "2312": {
        title: "مساعدة المسار",
        simpleName: "الحفاظ على المسار",
        category: "السلامة",
        kind: "technical",
        userMeaning:
          "السيارة تساعدك تبقى داخل الخطوط.",
        safeMessage:
          "يعتمد على وضوح الخطوط بالطريق.",
      },

      "2313": {
        title: "مراقبة السائق",
        simpleName: "انتباه السائق",
        category: "السلامة",
        kind: "technical",
        userMeaning:
          "بعض موديلات لكزس تراقب انتباه السائق.",
        safeMessage:
          "قراءة داخلية للنظام.",
      },

      "2320": {
        title: "تبريد المقاعد",
        simpleName: "تبريد الكراسي",
        category: "الراحة",
        kind: "technical",
        userMeaning:
          "هذه القراءة تخص نظام تبريد المقاعد.",
        safeMessage:
          "قراءة داخلية للراحة.",
      },

      "2321": {
        title: "تسخين المقاعد",
        simpleName: "تدفئة الكراسي",
        category: "الراحة",
        kind: "technical",
        userMeaning:
          "هذه القراءة تخص تدفئة المقاعد.",
        safeMessage:
          "قراءة داخلية للنظام.",
      },

      "2322": {
        title: "ذاكرة المقاعد",
        simpleName: "حفظ وضعية الكرسي",
        category: "الراحة",
        kind: "technical",
        userMeaning:
          "السيارة تحفظ وضعية الكراسي والمرايات.",
        safeMessage:
          "قراءة داخلية للنظام.",
      },

      "2330": {
        title: "نظام الصوت الفاخر",
        simpleName: "النظام الصوتي",
        category: "الترفيه",
        kind: "technical",
        userMeaning:
          "هذه القراءة تخص أنظمة الصوت المتقدمة مثل Mark Levinson.",
        safeMessage:
          "قراءة ترفيهية داخلية.",
      },

      "2331": {
        title: "مضخم الصوت",
        simpleName: "الأمبليفاير",
        category: "الترفيه",
        kind: "technical",
        userMeaning:
          "السيارة تراقب نظام تضخيم الصوت.",
        warningMessage:
          "فيه مشكلة بنظام الصوت.",
        criticalMessage:
          "نظام الصوت غير مستجيب.",
      },

      "2340": {
        title: "نظام AWD",
        simpleName: "الدفع الرباعي",
        category: "الدفع",
        kind: "technical",
        userMeaning:
          "السيارة توزع العزم بين الكفرات.",
        safeMessage:
          "يتغير حسب الطريق والدعس.",
      },

      "2341": {
        title: "توزيع العزم",
        simpleName: "كم قوة رايحة لكل محور",
        category: "الدفع",
        kind: "numeric",
        userMeaning:
          "السيارة توزع السحب بين الأمام والخلف.",
        safeMessage:
          "طبيعي يتغير أثناء القيادة.",
        unit: "%",
      },

      "2350": {
        title: "نظام الهايبرد الفاخر",
        simpleName: "هايبرد لكزس",
        category: "الهايبرد",
        kind: "technical",
        userMeaning:
          "هذه القراءة تخص أنظمة الهايبرد المتقدمة في لكزس.",
        safeMessage:
          "قراءة داخلية للنظام.",
      },

      "2351": {
        title: "كفاءة الهايبرد",
        simpleName: "أداء نظام الهايبرد",
        category: "الهايبرد",
        kind: "numeric",
        userMeaning:
          "السيارة تحلل كفاءة استخدام الكهرباء والبنزين.",
        warningMessage:
          "كفاءة الهايبرد أقل من المتوقع.",
        criticalMessage:
          "فيه ضعف واضح بنظام الهايبرد.",
        unit: "%",
      },

      "23FF": {
        title: "بيانات لكزس الخاصة",
        simpleName: "قراءات خاصة بلكزس",
        category: "خاص بالشركة",
        kind: "technical",
        userMeaning:
          "هذه بيانات داخلية خاصة بأنظمة لكزس.",
        safeMessage:
          "ما نعتبرها عطل إلا إذا ارتبطت بكود أو مشكلة واضحة.",
        userHidden: true,
      },

      "2360": {
        title: "نظام الركن الذكي",
        simpleName: "مساعدة الاصطفاف",
        category: "الراحة",
        kind: "technical",
        userMeaning:
          "بعض سيارات لكزس تساعدك في الوقوف أو تراقب المسافات حول السيارة.",
        safeMessage:
          "إذا ما فيه تحذير بالشاشة فالغالب الوضع طبيعي.",
      },

      "2361": {
        title: "حساسات الركن الأمامية",
        simpleName: "حساسات قدام",
        category: "الراحة",
        kind: "technical",
        userMeaning:
          "هذه الحساسات تنبهك لو فيه شيء قريب من مقدمة السيارة.",
        safeMessage:
          "قراءة داخلية لنظام الركن.",
      },

      "2362": {
        title: "حساسات الركن الخلفية",
        simpleName: "حساسات ورا",
        category: "الراحة",
        kind: "technical",
        userMeaning:
          "هذه الحساسات تنبهك لو فيه شيء قريب خلف السيارة.",
        safeMessage:
          "قراءة داخلية لنظام الركن.",
      },

      "2370": {
        title: "نظام النقطة العمياء",
        simpleName: "تنبيه السيارات الجانبية",
        category: "السلامة",
        kind: "technical",
        userMeaning:
          "النظام ينبهك إذا فيه سيارة في المنطقة اللي ما تبان بالمراية.",
        safeMessage:
          "إذا ما فيه لمبة أو تحذير فالغالب طبيعي.",
      },

      "2371": {
        title: "رادار النقطة العمياء اليمين",
        simpleName: "حساس الجانب اليمين",
        category: "السلامة",
        kind: "technical",
        userMeaning:
          "يراقب السيارات اللي تجي من جهة اليمين.",
        safeMessage:
          "قراءة داخلية لنظام السلامة.",
      },

      "2372": {
        title: "رادار النقطة العمياء اليسار",
        simpleName: "حساس الجانب اليسار",
        category: "السلامة",
        kind: "technical",
        userMeaning:
          "يراقب السيارات اللي تجي من جهة اليسار.",
        safeMessage:
          "قراءة داخلية لنظام السلامة.",
      },

      "2380": {
        title: "نظام الإضاءة التكيفية",
        simpleName: "الأنوار الذكية",
        category: "الكهرباء",
        kind: "technical",
        userMeaning:
          "بعض سيارات لكزس تلف الأنوار أو تعدل قوتها حسب الطريق.",
        safeMessage:
          "قراءة داخلية للنظام.",
      },

      "2381": {
        title: "حركة عدسة النور",
        simpleName: "اتجاه النور الأمامي",
        category: "الكهرباء",
        kind: "numeric",
        userMeaning:
          "النور يتحرك حسب سرعة السيارة واتجاه الطارة.",
        safeMessage:
          "طبيعي يتغير أثناء القيادة.",
        unit: "°",
      },

      "2382": {
        title: "حساس مستوى الإضاءة",
        simpleName: "حساس الليل والنهار",
        category: "الكهرباء",
        kind: "numeric",
        userMeaning:
          "السيارة تستخدمه لتشغيل الأنوار تلقائيًا.",
        safeMessage:
          "طبيعي يتغير حسب الإضاءة حول السيارة.",
      },

      "2390": {
        title: "نظام التكييف الذكي",
        simpleName: "مكيف لكزس",
        category: "التكييف",
        kind: "technical",
        userMeaning:
          "هذه القراءة تخص نظام التكييف المتقدم في لكزس.",
        safeMessage:
          "قراءة داخلية للنظام.",
      },

      "2391": {
        title: "جودة تبريد المكيف",
        simpleName: "قوة تبريد المكيف",
        category: "التكييف",
        kind: "numeric",
        userMeaning:
          "هذه القراءة تساعدنا نعرف هل المكيف يبرد بشكل جيد.",
        warningMessage:
          "تبريد المكيف أضعف من المتوقع.",
        criticalMessage:
          "المكيف لا يبرد بشكل طبيعي.",
        unit: "%",
      },

      "2392": {
        title: "ضغط غاز المكيف",
        simpleName: "ضغط الفريون",
        category: "التكييف",
        kind: "numeric",
        userMeaning:
          "المكيف يحتاج ضغط مناسب عشان يبرد.",
        warningMessage:
          "ضغط الفريون يحتاج متابعة.",
        criticalMessage:
          "ضغط الفريون غير طبيعي.",
        unit: "kPa",
      },

      "23A0": {
      title: "وضع القيادة الذكي",
      simpleName: "طريقة قيادة السيارة",
      category: "القيادة",
      kind: "technical",
      userMeaning:
        "لكزس تغيّر استجابة السيارة حسب وضع القيادة المختار.",
      safeMessage:
        "الوضع يتغير حسب اختيار السائق.",
    },

    "23A1": {
      title: "وضع الراحة",
      simpleName: "Comfort Mode",
      category: "القيادة",
      kind: "technical",
      userMeaning:
        "السيارة تركز على الراحة والهدوء.",
      safeMessage:
        "الوضع مخصص للقيادة الهادئة.",
    },

    "23A2": {
      title: "الوضع الرياضي",
      simpleName: "Sport Mode",
      category: "القيادة",
      kind: "technical",
      userMeaning:
        "السيارة تستجيب أسرع للدعسة والقير.",
      safeMessage:
        "يزيد الأداء وغالبًا صرفية البنزين.",
    },

    "23A3": {
      title: "الوضع الاقتصادي",
      simpleName: "Eco Mode",
      category: "القيادة",
      kind: "technical",
      userMeaning:
        "السيارة تحاول تقلل صرفية البنزين.",
      safeMessage:
        "الوضع مخصص للتوفير.",
    },

    "23B0": {
      title: "عزل المقصورة",
      simpleName: "هدوء السيارة الداخلي",
      category: "الراحة",
      kind: "technical",
      userMeaning:
        "هذه القراءة تخص أنظمة تقليل الضوضاء داخل السيارة.",
      safeMessage:
        "قراءة داخلية للنظام.",
    },

    "23B1": {
      title: "إلغاء الضوضاء النشط",
      simpleName: "تقليل الأصوات داخل السيارة",
      category: "الراحة",
      kind: "technical",
      userMeaning:
        "بعض موديلات لكزس تقلل صوت الطريق إلكترونيًا.",
      safeMessage:
        "نظام راحة داخلي.",
    },

    "23C0": {
      title: "نظام الكاميرات المحيطية",
      simpleName: "كاميرات 360",
      category: "السلامة",
      kind: "technical",
      userMeaning:
        "السيارة تستخدم عدة كاميرات لإظهار محيط السيارة.",
      safeMessage:
        "إذا الصورة واضحة فالغالب الوضع طبيعي.",
    },

    "23C1": {
      title: "الكاميرا الأمامية",
      simpleName: "كاميرا قدام",
      category: "السلامة",
      kind: "technical",
      userMeaning:
        "هذه الكاميرا تساعد بالرؤية وأنظمة السلامة.",
      safeMessage:
        "تحتاج عدسة نظيفة.",
    },

    "23C2": {
      title: "الكاميرا الخلفية",
      simpleName: "كاميرا ورا",
      category: "السلامة",
      kind: "technical",
      userMeaning:
        "الكاميرا الخلفية تساعد أثناء الرجوع.",
      safeMessage:
        "تحتاج عدسة نظيفة.",
    },

    "23D0": {
      title: "نظام تشغيل البصمة",
      simpleName: "تشغيل السيارة بالبصمة",
      category: "الراحة",
      kind: "technical",
      userMeaning:
        "هذه القراءة تخص نظام التشغيل الذكي.",
      safeMessage:
        "قراءة داخلية للنظام.",
    },

    "23D1": {
      title: "قوة إشارة المفتاح",
      simpleName: "إشارة ريموت السيارة",
      category: "الراحة",
      kind: "numeric",
      userMeaning:
        "السيارة تقيس قوة إشارة المفتاح الذكي.",
      warningMessage:
        "إشارة المفتاح ضعيفة.",
      criticalMessage:
        "السيارة تواجه صعوبة بالتعرف على المفتاح.",
      unit: "%",
    },

    "23D2": {
      title: "بطارية المفتاح الذكي",
      simpleName: "بطارية الريموت",
      category: "الراحة",
      kind: "numeric",
      userMeaning:
        "إذا ضعفت بطارية المفتاح قد تتأخر الاستجابة.",
      warningMessage:
        "بطارية المفتاح ضعيفة.",
      criticalMessage:
        "بطارية المفتاح شبه منتهية.",
      unit: "V",
    },

    "23E0": {
      title: "مراقبة جودة الطريق",
      simpleName: "تحليل حالة الطريق",
      category: "التعليق",
      kind: "technical",
      userMeaning:
        "السيارة تراقب اهتزازات الطريق لتحسين الراحة.",
      safeMessage:
        "قراءة داخلية للنظام.",
    },

    "23E1": {
      title: "اهتزاز الطريق",
      simpleName: "خشونة الطريق",
      category: "التعليق",
      kind: "numeric",
      userMeaning:
        "السيارة تحلل خشونة الطريق.",
      safeMessage:
        "تتغير حسب الطريق.",
      unit: "%",
    },

    "23F0": {
      title: "شبكة أنظمة لكزس",
      simpleName: "تواصل كمبيوترات السيارة",
      category: "الاتصالات",
      kind: "technical",
      userMeaning:
        "كمبيوترات لكزس تتواصل عبر شبكة داخلية متقدمة.",
      safeMessage:
        "قراءة تحليلية داخلية.",
    },

    "23F1": {
      title: "استقرار الشبكة الداخلية",
      simpleName: "جودة تواصل الأنظمة",
      category: "الاتصالات",
      kind: "numeric",
      userMeaning:
        "السيارة تراقب استقرار التواصل بين الأنظمة.",
      warningMessage:
        "فيه ضعف بسيط بتواصل الأنظمة.",
      criticalMessage:
        "فيه مشكلة واضحة بالشبكة الداخلية.",
      unit: "%",
    },
    "2400": {
      title: "نظام التعليق المتكيف",
      simpleName: "المساعدات تتغير تلقائي",
      category: "التعليق",
      kind: "technical",
      userMeaning:
        "لكزس تغير قساوة المساعدات حسب الطريق والسرعة.",
      safeMessage:
        "النظام يحاول يخلي السواقة أريح.",
    },

    "2401": {
      title: "قساوة المساعدات الأمامية",
      simpleName: "راحة المساعدات الأمامية",
      category: "التعليق",
      kind: "numeric",
      userMeaning:
        "السيارة تتحكم بقساوة المساعدات الأمامية إلكترونيًا.",
      safeMessage:
        "تتغير حسب الطريق.",
      unit: "%",
    },

    "2402": {
      title: "قساوة المساعدات الخلفية",
      simpleName: "راحة المساعدات الخلفية",
      category: "التعليق",
      kind: "numeric",
      userMeaning:
        "السيارة تتحكم بالمساعدات الخلفية لتحسين الراحة والثبات.",
      safeMessage:
        "تتغير حسب الطريق.",
      unit: "%",
    },

    "2410": {
      title: "نظام الثبات المتقدم",
      simpleName: "توازن السيارة",
      category: "السلامة",
      kind: "technical",
      userMeaning:
        "السيارة تراقب الثبات والانزلاق أثناء القيادة.",
      safeMessage:
        "النظام يعمل بالخلفية لحمايتك.",
    },

    "2411": {
      title: "تدخل نظام الثبات",
      simpleName: "السيارة صححت الانزلاق",
      category: "السلامة",
      kind: "numeric",
      userMeaning:
        "النظام تدخل لتعديل توازن السيارة.",
      warningMessage:
        "السيارة فقدت جزء من التماسك بالطريق.",
      criticalMessage:
        "السيارة تعرضت لانزلاق قوي.",
      unit: "%",
    },

    "2420": {
      title: "نظام التوجيه الكهربائي",
      simpleName: "دركسون كهربائي",
      category: "التوجيه",
      kind: "technical",
      userMeaning:
        "السيارة تستخدم نظام كهربائي لتخفيف حركة الدركسون.",
      safeMessage:
        "النظام طبيعي إذا الدركسون خفيف ومستجيب.",
    },

    "2421": {
      title: "حمل الدركسون",
      simpleName: "ضغط على الدركسون",
      category: "التوجيه",
      kind: "numeric",
      userMeaning:
        "يوضح مقدار الجهد على نظام التوجيه.",
      warningMessage:
        "الدركسون عليه ضغط أعلى من المعتاد.",
      criticalMessage:
        "نظام التوجيه تحت ضغط كبير.",
      unit: "%",
    },

    "2430": {
      title: "نظام الفرامل الذكي",
      simpleName: "مساعدة الفرامل",
      category: "الفرامل",
      kind: "technical",
      userMeaning:
        "السيارة تساعد بقوة الفرامل وقت الطوارئ.",
      safeMessage:
        "نظام السلامة جاهز للعمل.",
    },

    "2431": {
      title: "ضغط الفرامل",
      simpleName: "قوة دعسة الفرامل",
      category: "الفرامل",
      kind: "numeric",
      userMeaning:
        "السيارة تقيس قوة الضغط على الفرامل.",
      safeMessage:
        "يتغير حسب الدعس.",
      unit: "%",
    },

    "2440": {
      title: "نظام الرؤية الليلية",
      simpleName: "الرؤية بالليل",
      category: "السلامة",
      kind: "technical",
      userMeaning:
        "بعض موديلات لكزس تستخدم كاميرات للرؤية الليلية.",
      safeMessage:
        "ميزة مساعدة إضافية.",
    },

    "2441": {
      title: "وضوح الرؤية الليلية",
      simpleName: "جودة الكاميرا الليلية",
      category: "السلامة",
      kind: "numeric",
      userMeaning:
        "السيارة تقيم جودة صورة الرؤية الليلية.",
      warningMessage:
        "وضوح الرؤية الليلية منخفض.",
      criticalMessage:
        "الكاميرا الليلية تواجه مشكلة.",
      unit: "%",
    },

    "2450": {
      title: "نظام تتبع المسار",
      simpleName: "السيارة تساعدك تبقى داخل المسار",
      category: "السلامة",
      kind: "technical",
      userMeaning:
        "السيارة تراقب خطوط الطريق وتساعد بالتوجيه.",
      safeMessage:
        "النظام يشتغل أثناء القيادة.",
    },

    "2451": {
      title: "قراءة خطوط الطريق",
      simpleName: "وضوح خطوط الشارع",
      category: "السلامة",
      kind: "numeric",
      userMeaning:
        "السيارة تشوف خطوط الطريق عبر الكاميرا.",
      warningMessage:
        "السيارة تواجه صعوبة بقراءة الخطوط.",
      criticalMessage:
        "الكاميرا غير قادرة تقرأ المسار.",
      unit: "%",
    },

    "2460": {
      title: "رادار المسافة",
      simpleName: "الرادار الأمامي",
      category: "السلامة",
      kind: "technical",
      userMeaning:
        "الرادار يساعد أنظمة السلامة والتثبيت الذكي.",
      safeMessage:
        "النظام يعمل طبيعي.",
    },

    "2461": {
      title: "وضوح الرادار",
      simpleName: "هل الرادار يشوف الطريق",
      category: "السلامة",
      kind: "numeric",
      userMeaning:
        "السيارة تقيم وضوح الرادار الأمامي.",
      warningMessage:
        "الرادار مو واضح بالكامل.",
      criticalMessage:
        "الرادار محجوب أو فيه خلل.",
      unit: "%",
    },

    "2470": {
      title: "نظام تثبيت السرعة الذكي",
      simpleName: "مثبت السرعة بالرادار",
      category: "القيادة",
      kind: "technical",
      userMeaning:
        "السيارة تتحكم بالسرعة حسب السيارات اللي قدامك.",
      safeMessage:
        "النظام يعمل طبيعي.",
    },

    "2471": {
      title: "المسافة الآمنة",
      simpleName: "المسافة عن السيارة اللي قدام",
      category: "القيادة",
      kind: "numeric",
      userMeaning:
        "السيارة تراقب المسافة الأمامية.",
      warningMessage:
        "المسافة الأمامية قصيرة.",
      criticalMessage:
        "السيارة قريبة جدًا من المركبة الأمامية.",
      unit: "m",
    },

    "2500": {
      title: "نظام الهايبرد",
      simpleName: "تشغيل البنزين والكهرباء مع بعض",
      category: "الهايبرد",
      kind: "technical",
      userMeaning:
        "لكزس الهايبرد تبدل بين الكهرباء والبنزين تلقائي عشان التوفير والأداء.",
      safeMessage:
        "النظام يشتغل تلقائي بدون تدخل منك.",
    },

    "2501": {
      title: "حالة بطارية الهايبرد",
      simpleName: "صحة بطارية الهايبرد",
      category: "الهايبرد",
      kind: "numeric",
      userMeaning:
        "السيارة تراقب حالة بطارية الهايبرد الكبيرة.",
      safeMessage:
        "حالة البطارية جيدة.",
      warningMessage:
        "البطارية بدأت تضعف شوي.",
      criticalMessage:
        "بطارية الهايبرد تحتاج فحص.",
      unit: "%",
    },

    "2502": {
      title: "حرارة بطارية الهايبرد",
      simpleName: "حرارة بطارية الكهرباء",
      category: "الهايبرد",
      kind: "numeric",
      userMeaning:
        "بطارية الهايبرد تحتاج تبريد مستمر.",
      warningMessage:
        "حرارة البطارية مرتفعة.",
      criticalMessage:
        "بطارية الهايبرد حارة بشكل خطر.",
      unit: "°C",
    },

    "2503": {
      title: "مروحة تبريد بطارية الهايبرد",
      simpleName: "تبريد بطارية الهايبرد",
      category: "الهايبرد",
      kind: "numeric",
      userMeaning:
        "السيارة تشغل مروحة لتبريد بطارية الهايبرد.",
      safeMessage:
        "المروحة تعمل طبيعي.",
      warningMessage:
        "المروحة تشتغل بسرعة عالية بسبب الحرارة.",
      criticalMessage:
        "تبريد البطارية غير كافي.",
      unit: "%",
    },

    "2510": {
      title: "الطاقة الكهربائية المستخدمة",
      simpleName: "استخدام الكهرباء",
      category: "الهايبرد",
      kind: "numeric",
      userMeaning:
        "كمية الطاقة الكهربائية اللي السيارة تستخدمها الآن.",
      safeMessage:
        "الاستهلاك طبيعي.",
      unit: "kW",
    },

    "2511": {
      title: "شحن البطارية أثناء السواقة",
      simpleName: "السيارة تشحن البطارية",
      category: "الهايبرد",
      kind: "numeric",
      userMeaning:
        "السيارة تشحن بطارية الهايبرد أثناء القيادة أو الفرملة.",
      safeMessage:
        "الشحن طبيعي.",
      warningMessage:
        "الشحن أقل من المتوقع.",
      criticalMessage:
        "البطارية ما تشحن بشكل طبيعي.",
      unit: "%",
    },

    "2520": {
      title: "نظام استرجاع الطاقة",
      simpleName: "شحن البطارية من الفرامل",
      category: "الهايبرد",
      kind: "technical",
      userMeaning:
        "السيارة تحول جزء من الفرملة إلى كهرباء تشحن البطارية.",
      safeMessage:
        "النظام يعمل طبيعي.",
    },

    "2521": {
      title: "كفاءة استرجاع الطاقة",
      simpleName: "فعالية شحن البطارية من الفرامل",
      category: "الهايبرد",
      kind: "numeric",
      userMeaning:
        "كمية الطاقة اللي رجعت للبطارية أثناء التهدئة.",
      safeMessage:
        "الكفاءة جيدة.",
      warningMessage:
        "استرجاع الطاقة أقل من المعتاد.",
      criticalMessage:
        "فيه ضعف واضح باسترجاع الطاقة.",
      unit: "%",
    },

    "2530": {
      title: "نظام الدفع الرباعي الذكي",
      simpleName: "توزيع القوة بين الكفرات",
      category: "الدفع الرباعي",
      kind: "technical",
      userMeaning:
        "السيارة توزع القوة بين الكفرات لتحسين الثبات.",
      safeMessage:
        "النظام يعمل طبيعي.",
    },

    "2531": {
      title: "توزيع العزم الأمامي والخلفي",
      simpleName: "قوة الدفع بين الأمام والخلف",
      category: "الدفع الرباعي",
      kind: "numeric",
      userMeaning:
        "السيارة تغير توزيع القوة حسب الطريق.",
      safeMessage:
        "التوزيع طبيعي.",
      warningMessage:
        "التوزيع غير مستقر.",
      criticalMessage:
        "فيه مشكلة بتوزيع القوة.",
      unit: "%",
    },

    "2540": {
      title: "التعليق الهوائي",
      simpleName: "ارتفاع السيارة",
      category: "التعليق",
      kind: "technical",
      userMeaning:
        "السيارة ترفع وتنزل نفسها حسب الطريق والسرعة.",
      safeMessage:
        "التعليق الهوائي يعمل طبيعي.",
    },

    "2541": {
      title: "ارتفاع السيارة الحالي",
      simpleName: "مستوى ارتفاع السيارة",
      category: "التعليق",
      kind: "numeric",
      userMeaning:
        "ارتفاع السيارة عن الأرض.",
      warningMessage:
        "ارتفاع السيارة مو طبيعي.",
      criticalMessage:
        "فيه مشكلة بنظام التعليق الهوائي.",
      unit: "mm",
    },

    "2550": {
      title: "نظام القيادة الرياضي",
      simpleName: "وضعية Sport",
      category: "القيادة",
      kind: "technical",
      userMeaning:
        "السيارة تغير استجابة الدعسة والجير حسب وضعية القيادة.",
      safeMessage:
        "الوضعية الحالية طبيعية.",
    },

    "2551": {
      title: "وضعية القيادة الحالية",
      simpleName: "Eco أو Sport أو Comfort",
      category: "القيادة",
      kind: "text",
      userMeaning:
        "الوضعية الحالية تغير طريقة استجابة السيارة.",
      safeMessage:
        "الوضعية الحالية تعمل طبيعي.",
    },

    "2560": {
      title: "نظام النقطة العمياء",
      simpleName: "تحذير السيارات الجانبية",
      category: "السلامة",
      kind: "technical",
      userMeaning:
        "السيارة تنبهك إذا فيه سيارة بالنقطة العمياء.",
      safeMessage:
        "النظام يعمل طبيعي.",
    },

    "2561": {
      title: "وضوح حساسات النقطة العمياء",
      simpleName: "الرادارات الجانبية",
      category: "السلامة",
      kind: "numeric",
      userMeaning:
        "السيارة تراقب حساسات الجوانب.",
      warningMessage:
        "الرادار الجانبي مو واضح بالكامل.",
      criticalMessage:
        "الرادار الجانبي فيه خلل.",
      unit: "%",
    },

    "2570": {
      title: "نظام الاصطفاف الذكي",
      simpleName: "مساعدة المواقف",
      category: "الراحة",
      kind: "technical",
      userMeaning:
        "السيارة تساعد بالمواقف باستخدام الحساسات والكاميرات.",
      safeMessage:
        "النظام جاهز للعمل.",
    },

    "2571": {
      title: "قراءة حساسات المواقف",
      simpleName: "قرب الأجسام من السيارة",
      category: "الراحة",
      kind: "numeric",
      userMeaning:
        "السيارة تقيس قرب الأجسام أثناء الوقوف.",
      warningMessage:
        "فيه جسم قريب من السيارة.",
      criticalMessage:
        "المسافة قريبة جدًا.",
      unit: "cm",
    },
    "2580": {
        title: "المفتاح الذكي",
        simpleName: "نظام البصمة والمفتاح",
        category: "الراحة",
        kind: "technical",
        userMeaning: "السيارة تتعرف على المفتاح لاسلكيًا للتشغيل والفتح.",
        safeMessage: "النظام يعمل طبيعي.",
      },

      "2581": {
        title: "قوة إشارة المفتاح",
        simpleName: "قرب المفتاح من السيارة",
        category: "الراحة",
        kind: "numeric",
        userMeaning: "السيارة تقيس جودة اتصال المفتاح.",
        warningMessage: "إشارة المفتاح ضعيفة.",
        criticalMessage: "السيارة تواجه صعوبة بالتعرف على المفتاح.",
        unit: "%",
      },

      "2590": {
        title: "الأنوار الذكية",
        simpleName: "توجيه الأنوار حسب الطريق",
        category: "الإضاءة",
        kind: "technical",
        userMeaning: "الأنوار تتحرك تلقائي مع الطريق والدركسون.",
        safeMessage: "النظام يعمل طبيعي.",
      },

      "2591": {
        title: "زاوية الأنوار",
        simpleName: "اتجاه الأنوار الأمامية",
        category: "الإضاءة",
        kind: "numeric",
        userMeaning: "السيارة تغير اتجاه الإضاءة حسب المنعطفات.",
        warningMessage: "زاوية الإضاءة مو دقيقة.",
        criticalMessage: "فيه مشكلة بتوجيه الأنوار.",
        unit: "°",
      },

      "25A0": {
        title: "ضغط الكفرات الذكي",
        simpleName: "مراقبة الكفرات",
        category: "السلامة",
        kind: "technical",
        userMeaning: "السيارة تراقب ضغط الكفرات بشكل مستمر.",
        safeMessage: "النظام يعمل طبيعي.",
      },

      "25A1": {
        title: "متوسط ضغط الكفرات",
        simpleName: "ضغط الهواء بالكفرات",
        category: "السلامة",
        kind: "numeric",
        userMeaning: "يوضح حالة ضغط الكفرات.",
        warningMessage: "ضغط بعض الكفرات منخفض.",
        criticalMessage: "ضغط الكفرات منخفض جدًا.",
        unit: "psi",
      },

      "25A2": {
        title: "حرارة الكفرات",
        simpleName: "حرارة الإطارات",
        category: "السلامة",
        kind: "numeric",
        userMeaning: "السيارة تراقب حرارة الكفرات أثناء القيادة.",
        warningMessage: "حرارة الكفرات مرتفعة.",
        criticalMessage: "حرارة الإطارات خطيرة.",
        unit: "°C",
      },

      "25B0": {
        title: "ذاكرة المقاعد",
        simpleName: "حفظ وضعية الكرسي",
        category: "الراحة",
        kind: "technical",
        userMeaning: "السيارة تحفظ وضعية الكرسي لكل مستخدم.",
        safeMessage: "النظام يعمل طبيعي.",
      },

      "25B1": {
        title: "حركة الكرسي الكهربائي",
        simpleName: "استجابة الكرسي",
        category: "الراحة",
        kind: "numeric",
        userMeaning: "السيارة تراقب حركة الكراسي الكهربائية.",
        warningMessage: "الكرسي يتحرك ببطء أو مو ثابت.",
        criticalMessage: "فيه مشكلة بمحركات الكرسي.",
        unit: "%",
      },

      "25C0": {
        title: "نظام الصوت الفاخر",
        simpleName: "نظام الصوت",
        category: "الترفيه",
        kind: "technical",
        userMeaning: "لكزس تراقب نظام الصوت والمضخمات.",
        safeMessage: "النظام يعمل طبيعي.",
      },

      "25C1": {
        title: "حمل مضخم الصوت",
        simpleName: "ضغط على نظام الصوت",
        category: "الترفيه",
        kind: "numeric",
        userMeaning: "يوضح استهلاك مضخمات الصوت للطاقة.",
        warningMessage: "حمل الصوت مرتفع.",
        criticalMessage: "مضخم الصوت تحت ضغط كبير.",
        unit: "%",
      },

      "25D0": {
        title: "نظام التكييف الذكي",
        simpleName: "تحكم التكييف التلقائي",
        category: "التكييف",
        kind: "technical",
        userMeaning: "السيارة تضبط التكييف تلقائي حسب الجو.",
        safeMessage: "التكييف يعمل طبيعي.",
      },

      "25D1": {
        title: "قوة تبريد المكيف",
        simpleName: "أداء التكييف",
        category: "التكييف",
        kind: "numeric",
        userMeaning: "يوضح قوة تبريد المكيف الحالية.",
        warningMessage: "التبريد أضعف من المعتاد.",
        criticalMessage: "المكيف يواجه مشكلة واضحة.",
        unit: "%",
      },

      "25E0": {
        title: "كاميرات 360",
        simpleName: "الكاميرات المحيطية",
        category: "السلامة",
        kind: "technical",
        userMeaning: "السيارة تستخدم عدة كاميرات لتصوير محيط السيارة.",
        safeMessage: "الكاميرات تعمل طبيعي.",
      },

      "25E1": {
        title: "وضوح الكاميرات",
        simpleName: "جودة صورة الكاميرات",
        category: "السلامة",
        kind: "numeric",
        userMeaning: "السيارة تراقب جودة الكاميرات.",
        warningMessage: "إحدى الكاميرات مو واضحة.",
        criticalMessage: "فيه خلل بإحدى الكاميرات.",
        unit: "%",
      },

      "25F0": {
        title: "شاشة العرض الأمامية",
        simpleName: "الهيد أب دسبلي",
        category: "الراحة",
        kind: "technical",
        userMeaning: "تعرض المعلومات على الزجاج الأمامي.",
        safeMessage: "النظام يعمل طبيعي.",
      },

      "25F1": {
        title: "سطوع شاشة الزجاج",
        simpleName: "وضوح العرض الأمامي",
        category: "الراحة",
        kind: "numeric",
        userMeaning: "السيارة تتحكم بإضاءة شاشة الزجاج.",
        warningMessage: "سطوع الشاشة منخفض.",
        criticalMessage: "شاشة العرض الأمامية فيها مشكلة.",
        unit: "%",
      },


    },

    unknownPidPolicy: {
      title: "قراءة خاصة من لكزس",
      simpleName: "بيانات داخلية من أنظمة لكزس",
      category: "خاص بالشركة",
      userMeaning: "هذه القراءة غالبًا تخص نظام داخلي خاص بلكزس.",
      safeMessage:
        "نستخدمها للتحليل الذكي وربط الأنظمة، لكن ما نقلق المستخدم منها مباشرة.",
      userHidden: true,
    },
  },

  mazda_skyactiv: {
    brand: "Mazda",
    platform: "Skyactiv",
    displayName: "مازدا سكاي أكتف",

    knownPidHints: {
      "2600": {
        title: "نظام سكاي أكتف",
        simpleName: "طريقة تشغيل مازدا الاقتصادية",
        category: "المكينة",
        kind: "technical",
        userMeaning:
          "مازدا تستخدم نظام خاص يخلي السيارة أوفر وأخف وأقوى بنفس الوقت.",
        safeMessage: "النظام يعمل طبيعي.",
      },

      "2601": {
        title: "كفاءة احتراق سكاي أكتف",
        simpleName: "جودة احتراق البنزين",
        category: "المكينة",
        kind: "numeric",
        userMeaning: "السيارة تراقب جودة الاحتراق داخل المكينة.",
        warningMessage: "الاحتراق مو بنفس الكفاءة المعتادة.",
        criticalMessage: "فيه ضعف واضح بالاحتراق.",
        unit: "%",
      },

      "2610": {
        title: "نظام i-Stop",
        simpleName: "تطفي المكينة بالإشارة",
        category: "التوفير",
        kind: "technical",
        userMeaning:
          "السيارة تطفي المكينة تلقائي وقت الوقوف لتوفير البنزين.",
        safeMessage: "النظام يعمل طبيعي.",
      },

      "2620": {
        title: "نظام i-ELOOP",
        simpleName: "تخزين كهرباء أثناء الفرملة",
        category: "الكهرباء",
        kind: "technical",
        userMeaning:
          "مازدا تخزن كهرباء إضافية أثناء التهدئة والفرامل.",
        safeMessage: "النظام يعمل طبيعي.",
      },
      "2621": {
        title: "شحن i-ELOOP",
        simpleName: "كمية الكهرباء المخزنة",
        category: "الكهرباء",
        kind: "numeric",
        userMeaning: "يوضح حالة تخزين الطاقة بالنظام.",
        warningMessage: "الشحن أقل من المتوقع.",
        criticalMessage: "نظام تخزين الطاقة فيه مشكلة.",
        unit: "%",
      },

      "2630": {
        title: "استجابة الدعسة",
        simpleName: "سرعة تجاوب السيارة",
        category: "الدعسة",
        kind: "numeric",
        userMeaning: "مازدا تراقب سرعة استجابة الدعسة.",
        warningMessage: "استجابة الدعسة أبطأ من المعتاد.",
        criticalMessage: "السيارة تتأخر بالاستجابة.",
        unit: "%",
      },

      "2631": {
        title: "حساسية الدعسة",
        simpleName: "مدى تفاعل الدعسة",
        category: "الدعسة",
        kind: "numeric",
        userMeaning: "توضح مدى استجابة السيارة للدعسة.",
        warningMessage: "استجابة الدعسة غير مستقرة.",
        criticalMessage: "فيه مشكلة بحساس الدعسة.",
        unit: "%",
      },

      "2640": {
        title: "حرارة القير",
        simpleName: "حرارة الجير",
        category: "القير",
        kind: "numeric",
        userMeaning: "القير يحتاج حرارة مستقرة عشان يبدل بسلاسة.",
        warningMessage: "حرارة القير مرتفعة.",
        criticalMessage: "حرارة القير عالية وخطرة.",
        unit: "°C",
      },

      "2641": {
        title: "سلاسة تبديل القير",
        simpleName: "نعومة تبديل السرعات",
        category: "القير",
        kind: "numeric",
        userMeaning: "السيارة تراقب جودة تبديل القير.",
        warningMessage: "القير يبدل بعنف شوي.",
        criticalMessage: "فيه مشكلة واضحة بتبديل القير.",
        unit: "%",
      },

      "2650": {
        title: "نظام G-Vectoring",
        simpleName: "توازن السيارة باللفات",
        category: "الثبات",
        kind: "technical",
        userMeaning: "مازدا تستخدم نظام يحسن التوازن وقت اللفات.",
        safeMessage: "النظام يعمل طبيعي.",
      },

      "2651": {
        title: "توازن المنعطفات",
        simpleName: "ثبات السيارة باللفات",
        category: "الثبات",
        kind: "numeric",
        userMeaning: "السيارة تراقب الثبات أثناء الانعطاف.",
        warningMessage: "الثبات أقل من الطبيعي.",
        criticalMessage: "السيارة فقدت جزء من التوازن.",
        unit: "%",
      },

      "2660": {
        title: "صرفية الوقود الذكية",
        simpleName: "توفير البنزين",
        category: "البنزين",
        kind: "numeric",
        userMeaning: "مازدا تحاول تقلل استهلاك البنزين قدر الإمكان.",
        warningMessage: "الصرفية أعلى من المعتاد.",
        criticalMessage: "استهلاك البنزين مرتفع جدًا.",
        unit: "km/L",
      },

      "2670": {
        title: "سحب الهواء سكاي أكتف",
        simpleName: "تنفس المكينة",
        category: "الهواء",
        kind: "numeric",
        userMeaning: "المكينة تحتاج هواء مضبوط لتحقيق أفضل أداء.",
        warningMessage: "دخول الهواء مو مستقر.",
        criticalMessage: "فيه مشكلة واضحة بدخول الهواء.",
        unit: "g/s",
      },

      "2680": {
        title: "مستوى اهتزاز المكينة",
        simpleName: "رجفة المكينة",
        category: "المكينة",
        kind: "numeric",
        userMeaning: "السيارة تراقب نعومة تشغيل المكينة.",
        warningMessage: "فيه رجفة خفيفة بالمكينة.",
        criticalMessage: "رجفة المكينة قوية وغير طبيعية.",
        unit: "%",
      },

      "2690": {
        title: "وضعية القيادة",
        simpleName: "Eco أو Sport",
        category: "القيادة",
        kind: "text",
        userMeaning: "الوضعية الحالية تغير استجابة السيارة.",
        safeMessage: "الوضعية تعمل طبيعي.",
      },

      "2691": {
        title: "قوة سحب المكينة",
        simpleName: "عزم السيارة الحالي",
        category: "المكينة",
        kind: "numeric",
        userMeaning: "السيارة تقيس قوة السحب الحالية.",
        warningMessage: "العزم أقل من المتوقع.",
        criticalMessage: "فيه ضعف واضح بالسحب.",
        unit: "%",
      },

      "26A0": {
        title: "نظام i-Activsense",
        simpleName: "أنظمة أمان مازدا",
        category: "السلامة",
        kind: "technical",
        userMeaning: "هذه أنظمة تساعدك بالتنبيه من الخطر والمسار والسيارات حولك.",
        safeMessage: "إذا ما فيه تحذير بالطبلون فالغالب الوضع طبيعي.",
      },

      "26A1": {
        title: "الرادار الأمامي",
        simpleName: "رادار المسافة",
        category: "السلامة",
        kind: "technical",
        userMeaning: "الرادار يراقب المسافة بينك وبين السيارة اللي قدامك.",
        safeMessage: "النظام يعمل طبيعي.",
      },

      "26A2": {
        title: "وضوح الرادار الأمامي",
        simpleName: "هل الرادار يشوف الطريق",
        category: "السلامة",
        kind: "numeric",
        userMeaning: "إذا الرادار متسخ أو محجوب، السيارة ممكن توقف بعض أنظمة الأمان.",
        warningMessage: "الرادار الأمامي مو واضح بالكامل.",
        criticalMessage: "الرادار محجوب أو فيه خلل.",
        unit: "%",
      },

      "26A3": {
        title: "الكاميرا الأمامية",
        simpleName: "كاميرا المسار",
        category: "السلامة",
        kind: "technical",
        userMeaning: "الكاميرا تساعد السيارة تشوف خطوط الطريق والتنبيهات.",
        safeMessage: "تحتاج زجاج أمامي نظيف.",
      },

      "26A4": {
        title: "وضوح كاميرا المسار",
        simpleName: "هل الكاميرا تشوف الخطوط",
        category: "السلامة",
        kind: "numeric",
        userMeaning: "الكاميرا تحتاج تشوف الخطوط بوضوح عشان أنظمة المسار.",
        warningMessage: "الكاميرا تواجه صعوبة بقراءة الطريق.",
        criticalMessage: "الكاميرا محجوبة أو فيها خلل.",
        unit: "%",
      },

      "26B0": {
        title: "نظام النقطة العمياء",
        simpleName: "تنبيه السيارات الجانبية",
        category: "السلامة",
        kind: "technical",
        userMeaning: "ينبهك إذا فيه سيارة على جنبك في منطقة ما تبان بالمراية.",
        safeMessage: "إذا ما فيه تحذير فالغالب الوضع طبيعي.",
      },

      "26B1": {
        title: "رادار النقطة العمياء اليمين",
        simpleName: "حساس الجانب اليمين",
        category: "السلامة",
        kind: "technical",
        userMeaning: "يراقب السيارات اللي تجي من جهة اليمين.",
        safeMessage: "قراءة داخلية للنظام.",
      },

      "26B2": {
        title: "رادار النقطة العمياء اليسار",
        simpleName: "حساس الجانب اليسار",
        category: "السلامة",
        kind: "technical",
        userMeaning: "يراقب السيارات اللي تجي من جهة اليسار.",
        safeMessage: "قراءة داخلية للنظام.",
      },

      "26C0": {
        title: "نظام مانع الانغلاق ABS",
        simpleName: "فرامل ABS",
        category: "الفرامل",
        kind: "technical",
        userMeaning: "ABS يمنع الكفرات من القفل وقت الفرملة القوية.",
        safeMessage: "إذا ما فيه لمبة ABS فالغالب الوضع طبيعي.",
      },

      "26C1": {
        title: "ضغط الفرامل",
        simpleName: "قوة دعسة الفرامل",
        category: "الفرامل",
        kind: "numeric",
        userMeaning: "السيارة تقيس قوة الضغط على الفرامل.",
        warningMessage: "ضغط الفرامل غير مستقر.",
        criticalMessage: "فيه خلل واضح بضغط الفرامل.",
        unit: "%",
      },

      "26C2": {
        title: "سرعات العجلات",
        simpleName: "سرعة كل كفر",
        category: "العجلات",
        kind: "technical",
        userMeaning: "السيارة تراقب سرعة كل كفر عشان ABS والثبات.",
        safeMessage: "قراءة داخلية للنظام.",
      },

      "26D0": {
        title: "نظام ضغط الكفرات",
        simpleName: "حساسات هواء الكفرات",
        category: "الكفرات",
        kind: "technical",
        userMeaning: "السيارة تراقب ضغط الهواء في الكفرات.",
        safeMessage: "إذا ما فيه لمبة ضغط كفرات فالغالب طبيعي.",
      },

      "26D1": {
        title: "ضغط الكفرات",
        simpleName: "هواء الكفرات",
        category: "الكفرات",
        kind: "numeric",
        userMeaning: "يوضح ضغط الهواء داخل الكفرات.",
        warningMessage: "ضغط كفر أو أكثر منخفض.",
        criticalMessage: "ضغط الكفرات منخفض جدًا.",
        unit: "psi",
      },

      "26D2": {
        title: "حرارة الكفرات",
        simpleName: "حرارة الإطارات",
        category: "الكفرات",
        kind: "numeric",
        userMeaning: "حرارة الكفرات ترتفع مع المشوار والسرعة والجو الحار.",
        warningMessage: "حرارة الكفرات مرتفعة.",
        criticalMessage: "حرارة الكفرات عالية جدًا.",
        unit: "°C",
      },

      "26E0": {
        title: "نظام التكييف",
        simpleName: "مكيف مازدا",
        category: "التكييف",
        kind: "technical",
        userMeaning: "هذه القراءة تخص نظام التكييف والتحكم بالهواء.",
        safeMessage: "إذا التبريد طبيعي فالغالب ما فيه مشكلة.",
      },

      "26E1": {
        title: "ضغط غاز المكيف",
        simpleName: "ضغط الفريون",
        category: "التكييف",
        kind: "numeric",
        userMeaning: "المكيف يحتاج ضغط مناسب عشان يبرد كويس.",
        warningMessage: "ضغط الفريون يحتاج متابعة.",
        criticalMessage: "ضغط الفريون غير طبيعي.",
        unit: "kPa",
      },

      "26E2": {
        title: "حرارة المبخر",
        simpleName: "حرارة ثلاجة المكيف",
        category: "التكييف",
        kind: "numeric",
        userMeaning:
          "هذه القراءة تخص حرارة المبخر داخل نظام المكيف.",
        warningMessage:
          "تبريد المكيف أضعف من الطبيعي.",
        criticalMessage:
          "المكيف يواجه مشكلة واضحة بالتبريد.",
        unit: "°C",
      },

      "26E3": {
        title: "سرعة مروحة المكيف",
        simpleName: "قوة مروحة التكييف",
        category: "التكييف",
        kind: "numeric",
        userMeaning:
          "السيارة تتحكم بسرعة مروحة التكييف حسب الحرارة المطلوبة.",
        safeMessage:
          "طبيعي تتغير حسب التبريد.",
        unit: "%",
      },

      "26F0": {
        title: "القير الأوتوماتيكي",
        simpleName: "حالة الجير",
        category: "القير",
        kind: "technical",
        userMeaning:
          "هذه القراءة تخص كمبيوتر القير وتبديل السرعات.",
        safeMessage:
          "إذا التبديلات طبيعية فالغالب الوضع طبيعي.",
      },

      "26F1": {
        title: "حرارة زيت القير",
        simpleName: "حرارة زيت الجير",
        category: "القير",
        kind: "numeric",
        userMeaning:
          "القير يحتاج حرارة مستقرة عشان يبدل بشكل طبيعي.",
        warningMessage:
          "حرارة القير مرتفعة.",
        criticalMessage:
          "حرارة القير عالية جدًا.",
        unit: "°C",
      },

      "26F2": {
        title: "ضغط زيت القير",
        simpleName: "ضغط زيت الجير",
        category: "القير",
        kind: "numeric",
        userMeaning:
          "القير يعتمد على ضغط الزيت للتبديلات.",
        warningMessage:
          "ضغط زيت القير مو مستقر.",
        criticalMessage:
          "ضغط زيت القير غير طبيعي.",
        unit: "kPa",
      },

      "26F3": {
        title: "انزلاق القير",
        simpleName: "هل الجير يفلت",
        category: "القير",
        kind: "technical",
        userMeaning:
          "السيارة تراقب إذا فيه انزلاق داخل القير.",
        warningMessage:
          "فيه انزلاق بسيط بالقير.",
        criticalMessage:
          "القير يفلت بشكل واضح.",
      },

      "2700": {
        title: "نظام الكهرباء الذكي",
        simpleName: "إدارة كهرباء السيارة",
        category: "الكهرباء",
        kind: "technical",
        userMeaning:
          "مازدا تراقب توزيع الكهرباء بين الأنظمة المختلفة.",
        safeMessage:
          "النظام يعمل طبيعي.",
      },

      "2701": {
        title: "جهد البطارية",
        simpleName: "فولت البطارية",
        category: "الكهرباء",
        kind: "numeric",
        userMeaning:
          "هذه القراءة توضح قوة البطارية الحالية.",
        warningMessage:
          "فولت البطارية منخفض.",
        criticalMessage:
          "البطارية ضعيفة جدًا.",
        unit: "V",
      },

      "2702": {
        title: "حمل الدينمو",
        simpleName: "ضغط الشحن الكهربائي",
        category: "الكهرباء",
        kind: "numeric",
        userMeaning:
          "الدينمو يشحن البطارية ويغذي الأنظمة الكهربائية.",
        warningMessage:
          "الدينمو عليه حمل مرتفع.",
        criticalMessage:
          "حمل الدينمو عالي جدًا.",
        unit: "%",
      },

      "2710": {
        title: "نظام الأبواب الذكي",
        simpleName: "الأبواب والقفل الذكي",
        category: "الراحة",
        kind: "technical",
        userMeaning:
          "السيارة تراقب حالة الأبواب والأقفال الإلكترونية.",
        safeMessage:
          "قراءة داخلية للنظام.",
      },

      "2711": {
        title: "باب السائق",
        simpleName: "حالة باب السائق",
        category: "الراحة",
        kind: "technical",
        userMeaning:
          "السيارة تتأكد إذا الباب مقفل أو مفتوح.",
        safeMessage:
          "قراءة طبيعية غالبًا.",
      },

      "2712": {
        title: "الشنطة الخلفية",
        simpleName: "حالة الشنطة",
        category: "الراحة",
        kind: "technical",
        userMeaning:
          "السيارة تراقب قفل الشنطة الخلفية.",
        safeMessage:
          "قراءة طبيعية غالبًا.",
      },

      "2720": {
        title: "نظام المفتاح الذكي",
        simpleName: "البصمة والريموت",
        category: "الراحة",
        kind: "technical",
        userMeaning:
          "هذه القراءة تخص المفتاح الذكي والتشغيل بالبصمة.",
        safeMessage:
          "النظام يعمل طبيعي.",
      },

      "2721": {
        title: "بطارية المفتاح",
        simpleName: "بطارية الريموت",
        category: "الراحة",
        kind: "numeric",
        userMeaning:
          "إذا ضعفت بطارية المفتاح تتأخر الاستجابة.",
        warningMessage:
          "بطارية المفتاح ضعيفة.",
        criticalMessage:
          "بطارية المفتاح شبه منتهية.",
        unit: "V",
      },

      "2730": {
        title: "شبكة CAN الداخلية",
        simpleName: "تواصل كمبيوترات السيارة",
        category: "الاتصالات",
        kind: "technical",
        userMeaning:
          "أنظمة السيارة تتواصل مع بعض عبر شبكة داخلية.",
        safeMessage:
          "قراءة تحليلية داخلية.",
      },

      "2731": {
        title: "استقرار الشبكة",
        simpleName: "ثبات التواصل الداخلي",
        category: "الاتصالات",
        kind: "numeric",
        userMeaning:
          "السيارة تراقب استقرار التواصل بين الأنظمة.",
        warningMessage:
          "فيه ضعف بسيط بتواصل الأنظمة.",
        criticalMessage:
          "فيه مشكلة واضحة بالشبكة الداخلية.",
        unit: "%",
      },

      "27FF": {
        title: "بيانات مازدا الخاصة",
        simpleName: "قراءات داخلية خاصة بمازدا",
        category: "خاص بالشركة",
        kind: "technical",
        userMeaning:
          "هذه بيانات خاصة بأنظمة مازدا الداخلية.",
        safeMessage:
          "ما نعتبرها عطل لوحدها إلا إذا ارتبطت بكود أو عرض واضح.",
        userHidden: true,
      },
    },


    unknownPidPolicy: {
      title: "قراءة خاصة من مازدا",
      simpleName: "بيانات سكاي أكتف خاصة",
      category: "خاص بالشركة",
      userMeaning: "هذه القراءة غالبًا خاصة بأنظمة مازدا الداخلية.",
      safeMessage: "نخزنها ونحللها مع الوقت لفهمها بشكل أدق.",
      userHidden: true,
    },
  },
};

function getBrandProfile(identity = {}) {
  const text = JSON.stringify(identity || {}).toLowerCase();

  if (
    text.includes("toyota") ||
    text.includes("corolla") ||
    text.includes("lexus")
  ) {
    return BRAND_PROFILES.toyota_corolla;
  }

  return null;
}

function getBrandPidHint(identity, pid) {
  const profile = getBrandProfile(identity);
  if (!profile) return null;

  return profile.knownPidHints[String(pid || "").toUpperCase()] || null;
}

function getUnknownPidPolicy(identity) {
  const profile = getBrandProfile(identity);
  return profile?.unknownPidPolicy || null;
}

function getPidKnowledge(pid, name, identity = {}) {
  const normalizedPid = String(pid || "").toUpperCase();

  const brandHint =
    typeof getBrandPidHint === "function"
      ? getBrandPidHint(identity, normalizedPid)
      : null;

  if (brandHint) {
    return {
      title: brandHint.title || "قراءة من السيارة",
      simpleName: brandHint.simpleName || name || normalizedPid,
      category: brandHint.category || "عام",
      userMeaning:
        brandHint.userMeaning ||
        "هذه قراءة من السيارة نستخدمها لفهم الحالة.",
      goodMessage:
        brandHint.safeMessage ||
        brandHint.goodMessage ||
        "القراءة وصلت، ولا نعتبرها مشكلة لوحدها.",
      warningMessage:
        brandHint.warningMessage ||
        brandHint.safeMessage ||
        "قراءة تحتاج متابعة مع باقي البيانات.",
      criticalMessage:
        brandHint.criticalMessage ||
        brandHint.warningMessage ||
        "قراءة تحتاج فحص إذا ارتبطت بعطل.",
      unit: brandHint.unit || null,
      ranges: brandHint.ranges || [],
      whyItMatters:
        brandHint.whyItMatters ||
        "نستخدمها مع باقي القراءات عشان نفهم حالة السيارة.",
      simpleTips: brandHint.simpleTips || [],
      possibleCauses: brandHint.possibleCauses || [],
      userHidden: !!brandHint.userHidden,
      kind: brandHint.kind || "info",
    };
  }

  return {
    title: "قراءة من السيارة",
    simpleName: name || normalizedPid || "قراءة غير معروفة",
    category: "غير مصنف",
    userMeaning:
      "هذه قراءة وصلت من السيارة، نستخدمها مع باقي البيانات عشان نفهم حالة السيارة.",
    goodMessage: "وصلت قراءة من السيارة، ولا نعتبرها مشكلة لوحدها.",
    warningMessage: "قراءة تحتاج متابعة مع باقي البيانات.",
    criticalMessage: "قراءة تحتاج فحص إذا كانت مرتبطة بعطل أو عرض واضح.",
    unit: null,
    ranges: [],
    whyItMatters: "بعض السيارات ترسل قراءات خاصة حسب الشركة والموديل.",
    simpleTips: [
      "مو كل قراءة لازم تقلقك.",
      "الأهم إذا معها لمبة أو كود عطل أو تغير واضح في السيارة.",
    ],
    possibleCauses: [],
  };
}

module.exports = {
  BRAND_PROFILES,
  getBrandProfile,
  getBrandPidHint,
  getUnknownPidPolicy,
  getPidKnowledge,
};