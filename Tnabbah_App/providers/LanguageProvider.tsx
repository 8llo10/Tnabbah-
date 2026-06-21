import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";

type Language = "AR" | "EN";

const LANGUAGE_STORAGE_KEY = "app_language";

const translations = {
  AR: {
    startIntroTitleBefore: "سلامتك",
    startIntroTitleAccent: "تبدأ",
    startIntroTitleAfter: "من سيارتك",
    startIntroSubtitle:
      "تابع حالة سيارتك، افهم التنبيهات، واحصل على تقارير ذكية تساعدك في الصيانة والسلامة",
    startIntroButton: "ابدأ الآن",

    startAuthTitleBefore: "مرحبًا بك في",
    startAuthTitleAccent: "تنبّه",
    startAuthSubtitle:
      "سجّل دخولك أو أنشئ حسابًا جديدًا لمتابعة حالة سيارتك",
    startLoginButton: "تسجيل الدخول",
    startCreateAccountButton: "إنشاء حساب جديد",

    startStepOne: "١ من ٢",
    startStepTwo: "٢ من ٢",
    chatTitle: "مساعد تنبّه",
    chatWelcome: "مرحبًا بك، كيف أقدر أساعدك اليوم؟",
    chatInputPlaceholder: "اكتب رسالتك...",
    chatLoginRequired: "سجّل الدخول أولًا عشان أقدر أقرأ بيانات سيارتك.",
    chatNoAssistantReply:
      'ما وصلني رد واضح من المساعد. حاولي مرة ثانية بعد قليل.',
    chatTimeout:
      "انتهت مدة الانتظار. تأكدي من اتصال الإنترنت وحاولي مرة ثانية.",
    chatNetworkError:
      "تعذر الاتصال بالمساعد من التطبيق. إذا كان الرابط يفتح في Safari، أعيدي بناء تطبيق iOS بعد تفعيل السماح بروابط HTTP.",
    chatConnectionError: "تعذّر الاتصال بالمساعد. التفاصيل:",

    walletTitle: "المحفظة",

    walletReportsTitle: "التقارير",
    walletReportsSubtitle: "تقارير الفحص المحفوظة وغير المحفوظة",
    walletFilterAll: "الكل",
    walletFilterSaved: "المحفوظة",
    walletFilterPending: "غير المحفوظة",
    walletLoadingReports: "جاري تحميل التقارير...",
    walletLoginRequired: "يجب تسجيل الدخول",
    walletNoReports: "لا توجد تقارير",
    walletPending: "غير محفوظ",
    walletSaved: "محفوظ",
    walletSaveReport: "حفظ التقرير",
    walletIgnore: "حذف",
    walletOpenReport: "فتح التقرير",

    walletMaintenanceTitle: "الصيانات الدورية",
    walletMaintenanceSubtitle: "اضغط على أي بطاقة لتحديث تاريخ الصيانة فوراً",
    walletLoadingMaintenance: "جاري تحميل الصيانات...",
    walletNotRegistered: "لم يُسجَّل",
    walletDaysLate: "يوم متأخر",
    walletRemaining: "متبقي",
    walletDay: "يوم",
    walletEvery: "كل",
    walletLastMaintenance: "آخر صيانة",
    walletNextDate: "الموعد القادم",
    walletUpdate: "تحديث",

    walletEngineOil: "زيت المحرك",
    walletTires: "الكفرات",
    walletBrakes: "الفرامل",
    walletAirFilter: "فلتر الهواء",
    walletBattery: "البطارية",

    walletDoneTitle: "تم",
    walletErrorTitle: "خطأ",
    walletSaveReportError: "فشل حفظ التقرير",
    walletRejectReportError: "تعذر تجاهل التقرير",
    walletMaintenanceUpdated: "تم تحديث الصيانة بنجاح",
    walletSaveMaintenanceError: "تعذر حفظ التعديل",
    walletMaintenanceSuccessTitle: "تم تحديث الصيانة",
    walletMaintenanceSuccessBody: "تم حفظ تاريخ الصيانة في المحفظة بنجاح.",
    walletMaintenanceSuccessBodyWithName: "تم حفظ تاريخ {name} في المحفظة بنجاح.",
    walletViewAll: "عرض الكل",
    walletShowLess: "عرض أقل",
    walletOpenReportButton: "عرض التقرير",
    walletReportLabel: "تقرير",
    walletHorizontalView: "عرض أفقي",
    walletVerticalView: "عرض رأسي",
    walletConfirmDate: "تأكيد التاريخ",
    walletCancelDate: "إلغاء",
    walletSelectLastMaintenanceDate: "اختر تاريخ آخر صيانة",

    connectionStepStartLabel: "إبدأ",
    connectionStepPrepareLabel: "جهّز",
    connectionStepChooseLabel: "اختر",

    connectionStep1Title: "ابدأ ربط القطعة",
    connectionStep1Subtitle:
      "اتّبع الخطوات التالية لتجهيز قطعة OBD وربطها بالتطبيق بطريقة سهلة وآمنة.",
    connectionStep1Button: "ابدأ الآن",

    connectionStep2Title: "جهّز القطعة",
    connectionStep2Subtitle:
      "ابدأ بتجهيز السيارة والقطعة حتى يتمكن التطبيق من التعرف عليها قبل اختيار طريقة الاتصال.",
    connectionStep2Button: "تم توصيل القطعة",

    connectionStep3Title: "اختر اتصال البلوتوث",
    connectionStep3Subtitle:
      "اضغط على اختيار جهاز OBD لعرض الأجهزة القريبة، ثم اختر القطعة المناسبة.",
    connectionStep3Button: "ربط الجهاز",

    connectionSkip: "تخطي",
    connectionConnecting: "جاري الربط...",

    connectionInstructionStartCar: "شغّل السيارة",
    connectionInstructionPlugObd: "ركّب القطعة في مدخل OBD",
    connectionInstructionWaitLight: "انتظر حتى تضيء لمبة القطعة",

    connectionBluetoothOff:
      "البلوتوث مقفل. فعّله من إعدادات الجوال ثم أعد المحاولة.",
    connectionBluetoothUnauthorized:
      "التطبيق لا يملك صلاحية البلوتوث. فعّل صلاحية البلوتوث للتطبيق.",
    connectionBluetoothUnsupported: "هذا الجهاز لا يدعم نوع البلوتوث المطلوب.",
    connectionBluetoothResetting:
      "البلوتوث يعيد التشغيل الآن. انتظر ثواني ثم أعد المحاولة.",
    connectionBluetoothNotReady:
      "البلوتوث غير جاهز الآن. انتظر ثواني ثم أعد المحاولة.",

    connectionNoBluetoothDevices:
      "ما ظهرت أجهزة بلوتوث قريبة. تأكد أن القطعة مركبة ولمبتها شغالة، ثم أعد البحث.",
    connectionBluetoothPermission:
      "فعّل إذن البلوتوث للتطبيق حتى نقدر نبحث عن القطعة.",
    connectionScanError: "صار خطأ أثناء البحث عن أجهزة البلوتوث.",
    connectionScanStartError: "تعذر تشغيل البحث عن البلوتوث.",
    connectionBluetoothDeviceFallback: "جهاز بلوتوث",

    connectionSelectDeviceFirst: "اختار جهاز البلوتوث أولًا",
    connectionConnectError:
      "تعذر الاتصال بالقطعة. قرّب الجوال من القطعة وتأكد أنها شغالة، ثم حاول مرة ثانية.",

    connectionAvailableDevices: "الأجهزة المتاحة",
    connectionSearching: "جاري البحث...",
    connectionSelectObdDevice: "اضغط لاختيار جهاز OBD",
    connectionDiscoveredDevices: "الأجهزة المكتشفة",
    connectionDeviceList: "قائمة الأجهزة",
    connectionRefreshSearching: "بحث...",
    connectionRefresh: "تحديث",
    connectionSearchingNearby: "نبحث عن أجهزة قريبة...",
    connectionNoDevicesFound:
      "ما ظهرت أجهزة. تأكد أن قطعة OBD مركبة وقريبة من الجوال، ثم اضغط هنا لإعادة البحث.",
    connectionDeviceId: "المعرّف",

    connectionObdPassword: "كلمة مرور القطعة",
    connectionObdPasswordPlaceholder: "اختياري: 0000 أو 1234",
    connectionObdPasswordNote:
      "أدخل كلمة مرور قطعة OBD نفسها. غالبًا تكون مكتوبة على القطعة أو في كتيّبها، مثل 0000 أو 1234.",

    newPasswordTitle: "تعيين كلمة مرور جديدة",
    newPasswordSubtitle: "اكتب كلمة مرور قوية ثم أعد كتابتها للتأكيد",
    newPasswordPlaceholder: "كلمة المرور الجديدة",
    confirmNewPasswordPlaceholder: "تأكيد كلمة المرور الجديدة",
    newPasswordRulesTitle: "شروط كلمة المرور",
    newPasswordRuleMinLength: "تكون 8 أحرف أو أكثر",
    newPasswordRuleLetter: "تحتوي على حرف واحد على الأقل",
    newPasswordRuleNumber: "تحتوي على رقم واحد على الأقل",
    newPasswordRuleMatch: "تطابق تأكيد كلمة المرور",
    saveNewPassword: "حفظ كلمة المرور",
    savingNewPassword: "جاري الحفظ...",
    newPasswordRequired: "اكتب كلمة المرور الجديدة",
    newPasswordRequirementsError: "كلمة المرور لا تحقق الشروط المطلوبة",
    confirmNewPasswordRequired: "أكد كلمة المرور الجديدة",
    newPasswordMismatch: "كلمة المرور وتأكيدها غير متطابقين",
    newPasswordSessionError: "صار خطأ في جلسة تغيير كلمة المرور، اطلب رمز جديد",
    newPasswordSessionExpired:
      "انتهت صلاحية رمز التحقق. اطلب رمزًا جديدًا ثم حاول مرة أخرى",
    newPasswordSaveError:
      "انتهت صلاحية رمز التحقق. اطلب رمزًا جديدًا ثم حاول مرة أخرى",
    newPasswordSavedSuccess: "تم تغيير كلمة المرور بنجاح",
    newPasswordUnexpectedError: "حدث خطأ غير متوقع، حاول مرة ثانية",

    resetOtpTitle: "إعادة تعيين كلمة المرور",
    resetOtpSubtitle:
      "أدخل الرمز المرسل إلى بريدك الإلكتروني للمتابعة وتعيين كلمة مرور جديدة",
    resetOtpEmailFallback: "البريد الإلكتروني",
    resetOtpContinue: "متابعة",
    resetOtpVerifying: "جاري التحقق...",
    resetOtpMissingEmail:
      "لم يتم العثور على البريد الإلكتروني، ارجع وأرسل الكود من جديد",
    resetOtpEnterCode: "أدخل رمز التحقق المكوّن من 8 أرقام",
    resetOtpInvalidCode: "رمز التحقق غير صحيح أو انتهت صلاحيته",
    resetOtpUnexpectedError: "حدث خطأ غير متوقع، حاول مرة ثانية",
    resetOtpEmailMissing: "البريد الإلكتروني غير موجود",
    resetOtpResendFailedLater:
      "تعذر إعادة إرسال الرمز الآن. تحقق من اتصالك بالإنترنت أو حاول بعد قليل",
    resetOtpResentMessage: "تم إعادة إرسال رمز التحقق إلى بريدك الإلكتروني",
    resetOtpResendError: "حدث خطأ أثناء إعادة إرسال الرمز",
    resetOtpResendAfter: "يمكنك إعادة الإرسال بعد",
    resetOtpSeconds: "ثانية",
    resetOtpWantResend: "هل تريد إعادة الإرسال؟",
    resetOtpResendCode: "إعادة إرسال رمز التحقق",
    resetOtpSending: "جاري الإرسال...",

    verifyEmailTitle: "تحقق من بريدك الإلكتروني",
    verifyEmailSubtitle:
      "أدخل الرمز المرسل إلى بريدك الإلكتروني\nلإكمال إنشاء الحساب",
    emailFallback: "البريد الإلكتروني",
    enterCode: "أدخل الرمز",
    verifyCode: "تأكيد الرمز",
    verifying: "جاري التحقق...",
    emailMissingRegisterAgain:
      "البريد الإلكتروني غير موجود، ارجع وسجل مرة أخرى",
    emailMissing: "البريد الإلكتروني غير موجود",
    enterOtpCode: "أدخل رمز التحقق المكوّن من 8 أرقام",
    invalidOtpCode: "رمز التحقق غير صحيح أو انتهت صلاحيته",
    verifyUnexpectedError: "صار خطأ غير متوقع، حاول مرة أخرى",
    resendAfter: "يمكنك إعادة الإرسال بعد",
    seconds: "ثانية",
    didNotReceiveCode: "لم يصلك الرمز؟",
    resendCode: "إعادة إرسال الرمز",
    resendingCode: "جاري الإرسال...",
    codeAlreadySent: "تم إرسال رمز مسبقًا، تحقق من بريدك الإلكتروني",
    resendCodeErrorLater: "تعذر إرسال رمز جديد، حاول بعد قليل",
    resendCodeErrorAgain: "تعذر إرسال رمز جديد، حاول مرة أخرى",
    newCodeSent: "تم إرسال رمز جديد إلى بريدك الإلكتروني",

    forgotPasswordTitle: "نسيت كلمة المرور؟",
    forgotPasswordSubtitle:
      "أدخل البريد الإلكتروني المرتبط بحسابك لإرسال كود إعادة تعيين كلمة المرور",
    sendCode: "إرسال الكود",
    sending: "جاري الإرسال...",
    enterForgotEmail: "الرجاء إدخال البريد الإلكتروني",
    enterValidForgotEmail: "الرجاء إدخال بريد إلكتروني صحيح",
    forgotEmailNotRegistered: "هذا البريد غير مسجل في التطبيق",
    forgotRateLimit: "تم إرسال محاولات كثيرة. انتظر قليلًا ثم حاول مرة أخرى",
    forgotSendError:
      "تعذر إرسال الكود الآن. تحقق من اتصالك بالإنترنت أو حاول بعد قليل",
    forgotUnexpectedError: "حدث خطأ غير متوقع. حاول مرة أخرى بعد قليل",
    codeSentTitle: "تم إرسال الكود",
    codeSentMessage: "تحقق من بريدك الإلكتروني لإدخال رمز إعادة التعيين.",
    codeSentHint: "سيتم نقلك تلقائيًا لإدخال الرمز",

    registerTitle: "إنشاء حساب جديد",
    registerSubtitle: "انضمّ إلى تنبّه وابدأ متابعة حالة سيارتك",
    fullName: "الاسم",
    fullNamePlaceholder: "اكتب الاسم",
    registerButton: "تسجيل حساب جديد",
    registering: "جارٍ إنشاء الحساب...",
    alreadyHaveAccount: "لديك حساب بالفعل؟",

    enterFullName: "أدخل الاسم",
    enterValidEmail: "أدخل بريد إلكتروني صحيح",
    writePassword: "اكتب كلمة المرور",
    passwordRequirementsError: "كلمة المرور لا تحقق المتطلبات",
    registerEmailError: "تعذر إنشاء الحساب، تحقق من البريد الإلكتروني",
    registerUnexpectedError: "صار خطأ غير متوقع، حاول مرة أخرى",

    passwordRulesTitle: "كلمة المرور يجب أن تحتوي على:",
    passwordRuleUppercase: "حرف كبير واحد على الأقل A-Z",
    passwordRuleLowercase: "حرف صغير واحد على الأقل a-z",
    passwordRuleSixDigits: "6 أرقام على الأقل من 0-9",
    passwordRuleSpecial: "رمز خاص واحد على الأقل مثل @ # ! %",

    login: "تسجيل الدخول",
    loggingIn: "جاري تسجيل الدخول...",
    welcomeBack: "مرحباً بعودتك إلى تنبّه",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    forgotPassword: "نسيت كلمة المرور؟",
    or: "أو",
    noAccount: "ليس لديك حساب؟",
    createAccount: "إنشاء حساب جديد",
    enterEmail: "أدخل البريد الإلكتروني",
    enterPassword: "أدخل كلمة المرور",
    wrongEmailOrPassword: "البريد أو كلمة المرور غير صحيحة",
    verifyError: "تعذر التحقق من الحساب، حاول مرة أخرى",
    unexpectedError: "صار خطأ غير متوقع، حاول مرة أخرى",

    startWelcome: "مرحباً بك في",
    startBrand: "تنبه",
    startSubtitle: "لأن سيارتك تحتاج من ينتبه لها",
    languageButton: "En",

    // Settings screen
    account: "الحساب",
    userId: "رقم الحساب",

    editAction: "تعديل",
    editName: "تعديل الاسم",
    editNameDesc: "تغيير الاسم الظاهر في الحساب",
    editEmail: "تعديل البريد الإلكتروني",
    editEmailDesc: "سيتم إرسال رابط تأكيد إلى البريد الإلكتروني الجديد",
    changePassword: "تغيير كلمة المرور",
    changePasswordDesc: "إرسال رمز تحقق قبل تغيير كلمة المرور",

    editNameTitle: "تعديل الاسم",
    editNameSubtitle: "أدخل الاسم الذي سيظهر في الحساب.",
    namePlaceholder: "الاسم",
    nameSavedTitle: "تم حفظ الاسم",
    nameSavedBody: "تم حفظ الاسم الجديد في الحساب.",

    editEmailTitle: "تعديل البريد الإلكتروني",
    editEmailSubtitle:
      "أدخل البريد الإلكتروني الجديد، وسيتم إرسال رابط تأكيد له.",
    newEmailPlaceholder: "البريد الإلكتروني الجديد",
    validEmailError: "أدخل بريدًا إلكترونيًا صحيحًا.",
    emailSameError: "أدخل بريدًا إلكترونيًا مختلفًا عن البريد الحالي.",
    emailChangeSentTitle: "تم إرسال رابط التأكيد",
    emailChangeSentBody:
      "افتح البريد الإلكتروني الجديد واضغط على رابط التأكيد لإكمال التغيير.",
    emailChangeError:
      "تعذر إرسال رابط التأكيد. تأكد من البريد الإلكتروني أو جرّب مرة أخرى.",
    emailChangeSuccessTitle: "تم تغيير البريد الإلكتروني",
    emailChangeSuccessBody: "تم تأكيد البريد الإلكتروني الجديد وتحديثه في الحساب.",
    emailChangeSuccessInstantTitle: "تم تغيير البريد الإلكتروني بنجاح",
    emailChangeSuccessInstantBody: "تم تحديث البريد الإلكتروني في حسابك.",
    emailChangeStaySettings:
      "بعد التأكيد ستعود إلى الإعدادات ويظهر البريد الجديد في الحساب.",
    emailAlreadyUsed: "هذا البريد الإلكتروني مستخدم في حساب آخر.",
    emailRateLimit: "تمت محاولات كثيرة. انتظر قليلًا ثم جرّب مرة أخرى.",
    emailResendQuestion: "لم يصلك رابط التأكيد؟",
    emailResendLink: "إعادة إرسال الرابط",
    emailResendAfter: "يمكنك إعادة الإرسال بعد {seconds} ثانية",
    emailResentNotice: "تم إرسال رابط التأكيد مرة أخرى.",
    emailResendError: "تعذر إعادة إرسال الرابط الآن. جرّب بعد قليل.",

    cars: "سياراتي",
    currentCar: "السيارة الحالية",
    noCar: "لا توجد سيارة متصلة الآن",
    totalCars: "عدد السيارات",
    carConnection: "اتصال السيارة الحالية",
    connected: "متصل",
    disconnected: "غير متصل",
    connectedNow: "متصلة الآن",
    noCarConnectedNow: "لا توجد سيارة متصلة الآن",
    currentConnectedCar: "السيارة المتصلة الآن",
    lastConnection: "آخر اتصال",
    noSavedCars:
      "لا توجد سيارات محفوظة بعد. اربط قطعة السيارة لإضافة أول سيارة.",
    lastConnectedCarFound:
      "تم العثور على آخر سيارة متصلة، وسيتم حفظها عند وصول أول تحديث اتصال.",
    setDefaultCar: "تعيين",
    renameCar: "تعديل",
    deleteCar: "حذف",
    switchingVehicle: "جاري تبديل السيارة...",
    couldNotSelectCar: "تعذر اختيار السيارة. تم الرجوع للاختيار السابق.",
    carNameUpdated: "تم تحديث اسم السيارة",
    couldNotUpdateCarName: "تعذر تحديث اسم السيارة.",
    carRemoved: "تم حذف السيارة من القائمة",
    couldNotDeleteCar: "تعذر حذف السيارة.",

    appSettings: "إعدادات التطبيق",
    notifications: "السماح بالإشعارات",
    notificationsDesc: "استلام تنبيهات الفحص والتذكيرات",
    notificationsOff: "الإشعارات متوقفة",
    notificationsOffDesc: "لن تصلك تنبيهات الفحص والتذكيرات",
    language: "اللغة",
    languageDesc: "لغة التطبيق الحالية: العربية",
    languageArabicActive: "لغة التطبيق الحالية: العربية",
    languageEnglishActive: "لغة التطبيق الحالية: الإنجليزية",
    appearance: "المظهر",
    lightMode: "الوضع الفاتح",
    lightModeDesc: "المظهر الفاتح مفعل الآن",
    darkMode: "الوضع الداكن",
    darkModeDesc: "المظهر الداكن مفعل الآن",

    notificationsDeniedTitle: "الإشعارات غير مفعّلة",
    notificationsDeniedBody:
      "فعّل الإشعارات من إعدادات الجهاز حتى تصل التنبيهات.",
    openSettings: "فتح الإعدادات",

    vehicleConnection: "اتصال السيارة",
    bluetoothSettings: "ربط قطعة السيارة",
    bluetoothSettingsDesc: "ربط أو تغيير قطعة السيارة",
    deviceStatus: "اتصال القطعة",
    scanStatus: "قراءة بيانات السيارة",
    dataConnection: "اتصال البيانات",
    scannerOn: "تعمل الآن",
    scannerOff: "متوقفة",
    pauseMonitoring: "إيقاف المتابعة مؤقتًا",
    pauseMonitoringDesc: "إيقاف قراءة بيانات السيارة مؤقتًا",
    endVehicleConnection: "إنهاء اتصال السيارة",
    endVehicleConnectionDesc: "فصل الجهاز وإيقاف قراءة البيانات",
    monitoringPaused: "تم إيقاف المتابعة مؤقتًا.",
    couldNotPauseMonitoring: "تعذر إيقاف المتابعة.",
    disconnectTitle: "إنهاء اتصال السيارة",
    disconnectMessage: "هل تريد إنهاء اتصال السيارة الآن؟",
    disconnectedDone: "تم إنهاء اتصال السيارة.",
    couldNotDisconnectVehicle: "تعذر إنهاء اتصال السيارة.",

    helpSupport: "المساعدة والدعم",
    help: "تواصل مع الدعم",
    helpDesc: "للاستفسارات أو الإبلاغ عن مشكلة في التطبيق",
    helpTitle: "المساعدة",
    helpIntro:
      "إذا واجهت مشكلة أو كان لديك استفسار، أرسل التفاصيل وسنساعدك في أقرب وقت.",
    supportEmailButton: "إرسال بريد للدعم",
    supportWhatsAppButton: "التواصل عبر واتساب",
    reportIssueButton: "الإبلاغ عن مشكلة",
    faqTitle: "الأسئلة الشائعة",
    faqConnectionQuestion: "كيف يتم توصيل قطعة السيارة؟",
    faqConnectionAnswer:
      "من صفحة الاتصال، اختر البلوتوث ثم اختر قطعة السيارة وابدأ الفحص.",
    faqNotificationsQuestion: "لماذا لا تظهر السيارة؟",
    faqNotificationsAnswer:
      "تأكد أن القطعة تعمل وأن البلوتوث والصلاحيات مفعّلة.",
    faqReportQuestion: "هل التطبيق يحفظ بيانات السيارة؟",
    faqReportAnswer:
      "يتم حفظ البيانات الضرورية فقط لتحسين التجربة وعرض التقارير.",

    logout: "تسجيل الخروج",
    loggingOut: "جاري تسجيل الخروج...",
    logoutTitle: "تسجيل الخروج",
    logoutMessage: "هل تريد تسجيل الخروج من الحساب؟",
    logoutError: "تعذر تسجيل الخروج. جرّب مرة أخرى.",

    deleteAccount: "حذف الحساب",
    deleteAccountDesc: "حذف نهائي للحساب ويتطلب كلمة المرور الحالية",
    deleteAccountTitle: "حذف الحساب",
    deleteAccountMessage:
      "سيؤدي حذف الحساب إلى إزالة الحساب وبياناته بشكل نهائي. لا يمكن التراجع عن هذه العملية أو استرجاع الحساب بعد الحذف.",
    deleteAccountConfirm: "حذف الحساب",
    deleteAccountDone: "تم حذف الحساب نهائيًا",
    currentPasswordRequired: "أدخل كلمة المرور الحالية.",
    currentPasswordConfirmLabel: "أدخل كلمة المرور الحالية للتأكيد",
    currentPasswordPlaceholder: "كلمة المرور الحالية",
    deleteAccountVerifyError: "حدث خطأ أثناء التحقق.",
    deleteCarTitle: "حذف السيارة",
    deleteCarMessage:
      "هل أنت متأكد؟ سيتم حذف السيارة من قائمتك، وإذا كانت متصلة سيتم فصل الاتصال وإيقاف المتابعة.",
    deleteCarConfirm: "حذف",
    carLabel: "سيارة",

    errorTitle: "حدث خطأ",
    done: "تم",
    ok: "حسنًا",
    cancel: "إلغاء",
    confirm: "تأكيد",
    save: "حفظ",
    saving: "جاري الحفظ...",
    nameLimitError: "الاسم يجب ألا يتجاوز 15 حرفًا.",
    updateNameError: "تعذر تحديث الاسم.",


    homeGreeting: "أهلًا بك في تنبّهـ",
    homeSubtitle: "سيارتك تتكلم، ونحن نترجمها لك",
    homeNotificationsTitle: "الإشعارات",
    homeNoNotifications: "لا توجد إشعارات جديدة حاليًا",
    homeMarkAsRead: "تمت القراءة",
    homeDeleteNotification: "حذف",
    homeScanTitle: " تنبَّه يراقب سيارتك ",
    homeCreateReport: "إفحص",
    homeVehicleStatus: "حالة السيارة",
    homeVehicleStatusPlaceholder: "سيتم عرض الحالة هنا",
    homeLastScan: "آخر فحص",
    homeNoScanYet: "لم يتم إنشاء فحص بعد",
    homeFaults: "الأعطال",
    homeCurrentFaults: "عدد الأعطال الحالية",
    homeVehicleReadings: "قراءات السيارة",
    homeVehicleInfo: "معلومات السيارة",
    homeRpmLabel: "دورات المحرك",
    homeCarIdLabel: "معرّف السيارة",
    homeVinLabel: "رقم الهيكل",
    homeSupportedLabel: "القراءات المدعومة",
    homeDtcLabel: "رموز الأعطال",
    homeMode09: "بيانات السيارة",
    homePidUnit: "قراءة",
    homeSpeed: "السرعة",
    homeSpeedUnit: "كم/س",
    homeVoltage: "الفولت",
    homeCoolantTemp: "حرارة المحرك",
    homeRpmUnit: "دورة/دقيقة",
    homeAvailable: "موجود",
    homeWaitingConnection: "بانتظار الاتصال",
    homeFaultsUnit: "أعطال",
    homeScanStatus: "حالة الفحص",
    homeScanResponse: "استجابة الفحص",
    homeLiveUpdate: "تحديث مباشر",
    homeLiveUpdateDesc:
      "القيم المعروضة هنا تتحدث تلقائيًا من السيارة. آخر قراءة تبقى ظاهرة حتى لو انقطع الاتصال، وتتغير الحالة إلى غير متصل.",
    homeNeedHelp: "هل تحتاج\nمساعدة؟",
    homeLoginRequiredScan: "يجب تسجيل الدخول قبل التحليل.",
    homeAlertTitle: "تنبيه",
    homeSelectCarFirst: "اختر سيارة أولًا أو وصّل قطعة السيارة.",
    homeScanFailed: "فشل تشغيل التحليل",

    home: "الرئيسية",
    wallet: "المحفظة",
    settings: "الإعدادات",

    walletNoVehicleTitle: "لا توجد سيارة مرتبطة بالحساب",
    walletNoVehicleMessage:
      "لم يتم العثور على أي سيارة مرتبطة بحسابك حالياً. ستظهر التقارير والصيانات بعد ربط السيارة واستخدامها، حيث يتم إنشاء البيانات بناءً على قراءات السيارة والكيلومترات المقطوعة.",
  },

  EN: {
    walletNoVehicleTitle: "No Vehicle Linked",
    walletNoVehicleMessage:
      "No vehicle is currently linked to your account. Reports and maintenance records will appear after connecting and using a vehicle, as data is generated based on vehicle readings and driven mileage.",
    startIntroTitleBefore: "Your safety",
    startIntroTitleAccent: "starts",
    startIntroTitleAfter: "with your car",
    startIntroSubtitle:
      "Monitor your car status, understand alerts, and get smart reports for maintenance and safety",
    startIntroButton: "Get Started",

    startAuthTitleBefore: "Welcome to",
    startAuthTitleAccent: "TNABBAH",
    startAuthSubtitle:
      "Sign in or create a new account to monitor your car status",
    startLoginButton: "Log In",
    startCreateAccountButton: "Create Account",

    startStepOne: "1 of 2",
    startStepTwo: "2 of 2",
    chatTitle: "Tnabbah Assistant",
    chatWelcome: "Welcome! How can I help you today?",
    chatInputPlaceholder: "Type your message...",
    chatLoginRequired: "Please log in first so I can read your car data.",
    chatNoAssistantReply:
      'I did not receive a clear reply from the assistant. Please try again shortly.',
    chatTimeout: "The request timed out. Please check your internet connection and try again.",
    chatNetworkError:
      "The app could not reach the assistant. If the URL opens in Safari, rebuild the iOS app after enabling HTTP access.",
    chatConnectionError: "Could not connect to the assistant. Details:",

    walletTitle: "Wallet",

    walletReportsTitle: "Reports",
    walletReportsSubtitle: "Saved and unsaved inspection reports",
    walletFilterAll: "All",
    walletFilterSaved: "Saved",
    walletFilterPending: "Unsaved",
    walletLoadingReports: "Loading reports...",
    walletLoginRequired: "Login is required",
    walletNoReports: "No reports found",
    walletPending: "Unsaved",
    walletSaved: "Saved",
    walletSaveReport: "Save Report",
    walletIgnore: "Remove",
    walletOpenReport: "Open Report",

    walletMaintenanceTitle: "Periodic Maintenance",
    walletMaintenanceSubtitle: "Tap any card to update the maintenance date",
    walletLoadingMaintenance: "Loading maintenance...",
    walletNotRegistered: "Not registered",
    walletDaysLate: "day late",
    walletRemaining: "Remaining",
    walletDay: "day",
    walletEvery: "Every",
    walletLastMaintenance: "Last maintenance",
    walletNextDate: "Next date",
    walletUpdate: "Update",

    walletEngineOil: "Engine Oil",
    walletTires: "Tires",
    walletBrakes: "Brakes",
    walletAirFilter: "Air Filter",
    walletBattery: "Battery",

    walletDoneTitle: "Done",
    walletErrorTitle: "Error",
    walletSaveReportError: "Failed to save the report",
    walletRejectReportError: "Could not ignore the report",
    walletMaintenanceUpdated: "Maintenance updated successfully",
    walletSaveMaintenanceError: "Could not save the change",
    walletMaintenanceSuccessTitle: "Maintenance updated",
    walletMaintenanceSuccessBody: "The maintenance date has been saved in your wallet successfully.",
    walletMaintenanceSuccessBodyWithName: "{name} date has been saved in your wallet successfully.",
    walletViewAll: "View all",
    walletShowLess: "Show less",
    walletOpenReportButton: "Open report",
    walletReportLabel: "Report",
    walletHorizontalView: "Horizontal view",
    walletVerticalView: "Vertical view",
    walletConfirmDate: "Confirm date",
    walletCancelDate: "Cancel",
    walletSelectLastMaintenanceDate: "Select the last maintenance date",

    connectionStepStartLabel: "Start",
    connectionStepPrepareLabel: "Prepare",
    connectionStepChooseLabel: "Choose",

    connectionStep1Title: "Start Connecting the Device",
    connectionStep1Subtitle:
      "Follow the next steps to prepare the OBD device and connect it to the app easily and safely.",
    connectionStep1Button: "Start Now",

    connectionStep2Title: "Prepare the Device",
    connectionStep2Subtitle:
      "Start by preparing the car and the device so the app can recognize it before choosing the connection method.",
    connectionStep2Button: "Device Connected",

    connectionStep3Title: "Choose Bluetooth Connection",
    connectionStep3Subtitle:
      "Tap Choose OBD Device to show nearby devices, then choose the suitable device.",
    connectionStep3Button: "Connect Device",

    connectionSkip: "Skip",
    connectionConnecting: "Connecting...",

    connectionInstructionStartCar: "Start the car",
    connectionInstructionPlugObd: "Place the device in the OBD port",
    connectionInstructionWaitLight: "Wait until the device light turns on",

    connectionBluetoothOff:
      "Bluetooth is off. Turn it on from your phone settings, then try again.",
    connectionBluetoothUnauthorized:
      "The app does not have Bluetooth permission. Turn on Bluetooth permission for the app.",
    connectionBluetoothUnsupported:
      "This device does not support the required Bluetooth type.",
    connectionBluetoothResetting:
      "Bluetooth is restarting now. Wait a few seconds, then try again.",
    connectionBluetoothNotReady:
      "Bluetooth is not ready now. Wait a few seconds, then try again.",

    connectionNoBluetoothDevices:
      "No nearby Bluetooth devices appeared. Make sure the device is connected and its light is on, then search again.",
    connectionBluetoothPermission:
      "Turn on Bluetooth permission for the app so we can search for the device.",
    connectionScanError: "An error happened while searching for Bluetooth devices.",
    connectionScanStartError: "Could not start the Bluetooth search.",
    connectionBluetoothDeviceFallback: "Bluetooth Device",

    connectionSelectDeviceFirst: "Choose a Bluetooth device first",
    connectionConnectError:
      "Could not connect to the device. Move your phone closer to the device, make sure it is on, then try again.",

    connectionAvailableDevices: "Available Devices",
    connectionSearching: "Searching...",
    connectionSelectObdDevice: "Tap to choose an OBD device",
    connectionDiscoveredDevices: "Found Devices",
    connectionDeviceList: "Device List",
    connectionRefreshSearching: "Searching...",
    connectionRefresh: "Refresh",
    connectionSearchingNearby: "Searching for nearby devices...",
    connectionNoDevicesFound:
      "No devices appeared. Make sure the OBD device is connected and close to your phone, then tap here to search again.",
    connectionDeviceId: "ID",

    connectionObdPassword: "Device Password",
    connectionObdPasswordPlaceholder: "Optional: 0000 or 1234",
    connectionObdPasswordNote:
      "Enter the password for the OBD device itself. It is usually written on the device or in its booklet, such as 0000 or 1234.",

    newPasswordTitle: "Set New Password",
    newPasswordSubtitle: "Enter a strong password, then retype it to confirm",
    newPasswordPlaceholder: "New password",
    confirmNewPasswordPlaceholder: "Confirm new password",
    newPasswordRulesTitle: "Password Requirements",
    newPasswordRuleMinLength: "At least 8 characters",
    newPasswordRuleLetter: "Contains at least one letter",
    newPasswordRuleNumber: "Contains at least one number",
    newPasswordRuleMatch: "Passwords match",
    saveNewPassword: "Save Password",
    savingNewPassword: "Saving...",
    newPasswordRequired: "Enter your new password",
    newPasswordRequirementsError:
      "Password does not meet the required conditions",
    confirmNewPasswordRequired: "Confirm your new password",
    newPasswordMismatch: "Password and confirmation do not match",
    newPasswordSessionError:
      "There was an issue with the password reset session. Please request a new code",
    newPasswordSessionExpired:
      "The verification code has expired. Please request a new code and try again",
    newPasswordSaveError:
      "The verification code has expired. Please request a new code and try again",
    newPasswordSavedSuccess: "Password changed successfully",
    newPasswordUnexpectedError: "Something went wrong. Please try again",

    resetOtpTitle: "Reset Password",
    resetOtpSubtitle:
      "Enter the code sent to your email to continue and set a new password",
    resetOtpEmailFallback: "Email",
    resetOtpContinue: "Continue",
    resetOtpVerifying: "Verifying...",
    resetOtpMissingEmail:
      "Email was not found. Please go back and request a new code",
    resetOtpEnterCode: "Enter the 8-digit verification code",
    resetOtpInvalidCode: "The verification code is incorrect or has expired",
    resetOtpUnexpectedError: "Something went wrong. Please try again",
    resetOtpEmailMissing: "Email is missing",
    resetOtpResendFailedLater:
      "Could not resend the code right now. Check your internet connection or try again later",
    resetOtpResentMessage: "The verification code has been resent to your email",
    resetOtpResendError: "An error occurred while resending the code",
    resetOtpResendAfter: "You can resend after",
    resetOtpSeconds: "seconds",
    resetOtpWantResend: "Do you want to resend?",
    resetOtpResendCode: "Resend Verification Code",
    resetOtpSending: "Sending...",

    verifyEmailTitle: "Verify Your Email",
    verifyEmailSubtitle:
      "Enter the code sent to your email\nto complete account creation",
    emailFallback: "Email",
    enterCode: "Enter the code",
    verifyCode: "Verify Code",
    verifying: "Verifying...",
    emailMissingRegisterAgain:
      "Email is missing. Please go back and register again",
    emailMissing: "Email is missing",
    enterOtpCode: "Enter the 8-digit verification code",
    invalidOtpCode: "The verification code is incorrect or has expired",
    verifyUnexpectedError: "Something went wrong. Please try again",
    resendAfter: "You can resend after",
    seconds: "seconds",
    didNotReceiveCode: "Didn’t receive the code?",
    resendCode: "Resend Code",
    resendingCode: "Sending...",
    codeAlreadySent: "A code was already sent. Please check your email",
    resendCodeErrorLater: "Could not send a new code. Please try again later",
    resendCodeErrorAgain: "Could not send a new code. Please try again",
    newCodeSent: "A new code has been sent to your email",

    forgotPasswordTitle: "Forgot Password?",
    forgotPasswordSubtitle:
      "Enter the email linked to your account to receive a password reset code",
    sendCode: "Send Code",
    sending: "Sending...",
    enterForgotEmail: "Please enter your email",
    enterValidForgotEmail: "Please enter a valid email",
    forgotEmailNotRegistered: "This email is not registered in the app",
    forgotRateLimit: "Too many attempts. Please wait a moment and try again",
    forgotSendError:
      "Could not send the code right now. Check your internet connection or try again later",
    forgotUnexpectedError: "Something went wrong. Please try again later",
    codeSentTitle: "Code Sent",
    codeSentMessage: "Check your email to enter the reset code.",
    codeSentHint: "You will be redirected automatically",

    registerTitle: "Create Account",
    registerSubtitle: "Join Tnabbah and start monitoring your car",
    fullName: "Name",
    fullNamePlaceholder: "Enter your name",
    registerButton: "Create Account",
    registering: "Creating account...",
    alreadyHaveAccount: "Already have an account?",

    enterFullName: "Enter your name",
    enterValidEmail: "Enter a valid email",
    writePassword: "Enter your password",
    passwordRequirementsError: "Password does not meet the requirements",
    registerEmailError: "Could not create account. Please check your email",
    registerUnexpectedError: "Something went wrong. Please try again",

    passwordRulesTitle: "Password must contain:",
    passwordRuleUppercase: "At least one uppercase letter A-Z",
    passwordRuleLowercase: "At least one lowercase letter a-z",
    passwordRuleSixDigits: "6 digits at least from 0-9",
    passwordRuleSpecial: "At least one special character such as @ # ! %",

    login: "Login",
    loggingIn: "Logging in...",
    welcomeBack: "Welcome back to Tnabbah",
    email: "Email",
    password: "Password",
    forgotPassword: "Forgot password?",
    or: "Or",
    noAccount: "Don’t have an account?",
    createAccount: "Create Account",
    enterEmail: "Enter your email",
    enterPassword: "Enter your password",
    wrongEmailOrPassword: "Email or password is incorrect",
    verifyError: "Could not verify your account. Please try again.",
    unexpectedError: "Something went wrong. Please try again.",

    startWelcome: "Welcome to",
    startBrand: "Tnabbah",
    startSubtitle: "Because your car needs someone to watch over it",
    languageButton: "عربي",

    // Settings screen
    account: "Account",
    userId: "Account ID",

    editAction: "Edit",
    editName: "Edit Name",
    editNameDesc: "Change the name shown on the account",
    editEmail: "Edit Email",
    editEmailDesc: "A confirmation link will be sent to the new\nemail address",
    changePassword: "Change Password",
    changePasswordDesc: "Send a verification code before changing\nthe password",

    editNameTitle: "Edit Name",
    editNameSubtitle: "Enter the name that will appear on the account.",
    namePlaceholder: "Name",
    nameSavedTitle: "Name saved",
    nameSavedBody: "The new name has been saved.",

    editEmailTitle: "Edit Email",
    editEmailSubtitle:
      "Enter the new email address. A confirmation link will be sent to it.",
    newEmailPlaceholder: "New email address",
    validEmailError: "Enter a valid email address.",
    emailSameError: "Enter an email address different from the current email.",
    emailChangeSentTitle: "Confirmation link sent",
    emailChangeSentBody:
      "Open the new email address and tap the confirmation link to complete the change.",
    emailChangeError:
      "Could not send the confirmation link. Check the email address or try again.",
    emailChangeSuccessTitle: "Email changed",
    emailChangeSuccessBody: "The new email has been confirmed and updated on your account.",
    emailChangeSuccessInstantTitle: "Email changed successfully",
    emailChangeSuccessInstantBody: "Your account email has been updated.",
    emailChangeStaySettings:
      "After confirmation, you will return to Settings and see the new email on your account.",
    emailAlreadyUsed: "This email address is already used by another account.",
    emailRateLimit: "Too many attempts. Please wait a moment and try again.",
    emailResendQuestion: "Didn’t receive the confirmation link?",
    emailResendLink: "Resend link",
    emailResendAfter: "You can resend after {seconds} seconds",
    emailResentNotice: "The confirmation link was sent again.",
    emailResendError: "Could not resend the link right now. Please try again later.",

    cars: "My Cars",
    currentCar: "Current Car",
    noCar: "No connected car",
    totalCars: "Total Cars",
    carConnection: "Current Car Connection",
    connected: "Connected",
    disconnected: "Disconnected",
    connectedNow: "Connected now",
    noCarConnectedNow: "No car is connected now",
    currentConnectedCar: "Connected car",
    lastConnection: "Last connection",
    noSavedCars: "No saved cars yet. Connect a device to add the first car.",
    lastConnectedCarFound:
      "Last connected car found. It will be saved when the next connection update arrives.",
    setDefaultCar: "Set",
    renameCar: "Edit",
    deleteCar: "Delete",
    switchingVehicle: "Switching vehicle...",
    couldNotSelectCar: "Could not select the car. The previous choice was restored.",
    carNameUpdated: "Car name updated",
    couldNotUpdateCarName: "Could not update car name.",
    carRemoved: "Car removed from list",
    couldNotDeleteCar: "Could not delete car.",

    appSettings: "App Settings",
    notifications: "Allow Notifications",
    notificationsDesc: "Receive inspection alerts and reminders",
    notificationsOff: "Notifications Off",
    notificationsOffDesc: "Inspection alerts and reminders will not be received",
    language: "Language",
    languageDesc: "Current app language: English",
    languageArabicActive: "Current app language: Arabic",
    languageEnglishActive: "Current app language: English",
    appearance: "Appearance",
    lightMode: "Light Mode",
    lightModeDesc: "Light mode is currently enabled",
    darkMode: "Dark Mode",
    darkModeDesc: "Dark mode is currently enabled",

    notificationsDeniedTitle: "Notifications disabled",
    notificationsDeniedBody:
      "Enable notifications from device settings to receive alerts.",
    openSettings: "Open Settings",

    vehicleConnection: "Car Connection",
    bluetoothSettings: "Connect Car Device",
    bluetoothSettingsDesc: "Connect or change the car device",
    deviceStatus: "Device Connection",
    scanStatus: "Car Data Reading",
    dataConnection: "Data Connection",
    scannerOn: "Running",
    scannerOff: "Stopped",
    pauseMonitoring: "Pause monitoring",
    pauseMonitoringDesc: "Temporarily stop reading vehicle data",
    endVehicleConnection: "End vehicle connection",
    endVehicleConnectionDesc: "Disconnect the device and stop reading data",
    monitoringPaused: "Monitoring has been paused.",
    couldNotPauseMonitoring: "Could not pause monitoring.",
    disconnectTitle: "End vehicle connection",
    disconnectMessage: "Do you want to end the vehicle connection now?",
    disconnectedDone: "Vehicle connection has been ended.",
    couldNotDisconnectVehicle: "Could not end vehicle connection.",

    helpSupport: "Help & Support",
    help: "Contact Support",
    helpDesc: "For questions or reporting an app issue",
    helpTitle: "Help",
    helpIntro:
      "If there is a question or an issue, send the details and we will help as soon as possible.",
    supportEmailButton: "Email Support",
    supportWhatsAppButton: "Contact via WhatsApp",
    reportIssueButton: "Report an Issue",
    faqTitle: "FAQs",
    faqConnectionQuestion: "How do I connect the car device?",
    faqConnectionAnswer:
      "Open the connection page, choose Bluetooth, select the car device, then start the scan.",
    faqNotificationsQuestion: "Why does my car not appear?",
    faqNotificationsAnswer:
      "Make sure the device is powered on and Bluetooth permissions are enabled.",
    faqReportQuestion: "Does the app save car data?",
    faqReportAnswer:
      "Only necessary data is saved to improve the experience and show reports.",

    logout: "Logout",
    loggingOut: "Logging out...",
    logoutTitle: "Logout",
    logoutMessage: "Do you want to log out of the account?",
    logoutError: "Could not log out. Please try again.",

    deleteAccount: "Delete Account",
    deleteAccountDesc: "Permanently deletes the account and requires\nthe current password",
    deleteAccountTitle: "Delete account",
    deleteAccountMessage:
      "Deleting the account will permanently remove the account and its data. This action cannot be undone and the account cannot be restored after deletion.",
    deleteAccountConfirm: "Delete account",
    deleteAccountDone: "Account deleted permanently",
    currentPasswordRequired: "Enter the current password.",
    currentPasswordConfirmLabel: "Enter the current password to confirm",
    currentPasswordPlaceholder: "Current password",
    deleteAccountVerifyError: "An error occurred during verification.",
    deleteCarTitle: "Delete car",
    deleteCarMessage:
      "Are you sure? This car will be removed from your list. If it is connected, the connection and monitoring will be stopped.",
    deleteCarConfirm: "Delete",
    carLabel: "Car",

    errorTitle: "Error",
    done: "Done",
    ok: "OK",
    cancel: "Cancel",
    confirm: "Confirm",
    save: "Save",
    saving: "Saving...",
    nameLimitError: "Name must be 15 characters or less.",
    updateNameError: "Could not update name.",


    homeGreeting: "Welcome to Tnabbah",
    homeSubtitle: "Your car speaks, and we translate it for you",
    homeNotificationsTitle: "Notifications",
    homeNoNotifications: "No new notifications right now",
    homeMarkAsRead: "Mark as read",
    homeDeleteNotification: "Delete",
    homeScanTitle: "Tnabbah Scan",
    homeCreateReport: "Scan",
    homeVehicleStatus: "Vehicle Status",
    homeVehicleStatusPlaceholder: "Status will appear here",
    homeLastScan: "Last Scan",
    homeNoScanYet: "No scan created yet",
    homeFaults: "Faults",
    homeCurrentFaults: "Current fault count",
    homeVehicleReadings: "Vehicle Readings",
    homeVehicleInfo: "Vehicle Information",
    homeRpmLabel: "RPM",
    homeCarIdLabel: "Car ID",
    homeVinLabel: "VIN",
    homeSupportedLabel: "Supported",
    homeDtcLabel: "DTC",
    homeMode09: "Mode 09",
    homePidUnit: "PID",
    homeSpeed: "Speed",
    homeSpeedUnit: "km/h",
    homeVoltage: "Voltage",
    homeCoolantTemp: "Engine Temperature",
    homeRpmUnit: "RPM",
    homeAvailable: "Available",
    homeWaitingConnection: "Waiting for connection",
    homeFaultsUnit: "Faults",
    homeScanStatus: "Scan Status",
    homeScanResponse: "Scan Response",
    homeLiveUpdate: "Live Update",
    homeLiveUpdateDesc:
      "The values shown here update automatically from the vehicle. The last reading stays visible if the connection drops, and the status changes to disconnected.",
    homeNeedHelp: "Need\nhelp?",
    homeLoginRequiredScan: "Please log in before running the scan.",
    homeAlertTitle: "Notice",
    homeSelectCarFirst: "Choose a car first or connect the car device.",
    homeScanFailed: "Could not start the scan",

    home: "Home",
    wallet: "Wallet",
    settings: "Settings",
  },
};

type LanguageContextValue = {
  language: Language;
  isArabic: boolean;
  t: typeof translations.AR;
  changeLanguage: (lang: Language) => Promise<void>;
  toggleLanguage: () => Promise<void>;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [language, setLanguage] = useState<Language>("AR");

  const realUserId = session?.user?.id;

  useEffect(() => {
    loadLanguage();
  }, [realUserId]);

  const syncAuthLanguageMetadata = async (lang: Language) => {
    try {
      if (!realUserId) return;

      const { error } = await supabase.auth.updateUser({
        data: {
          language: lang,
        },
      });

      if (error) {
        console.log("Update auth language error:", error.message);
        return;
      }

      await supabase.auth.refreshSession();
    } catch (error: any) {
      console.log("Sync auth language error:", error?.message || error);
    }
  };

  const loadLanguage = async () => {
    try {
      const localLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      let finalLanguage: Language = "AR";

      if (localLanguage === "EN" || localLanguage === "AR") {
        finalLanguage = localLanguage;
        setLanguage(localLanguage);
      }

      if (!realUserId) return;

      const { data, error } = await supabase
        .from("user_settings")
        .select("language")
        .eq("user_id", realUserId)
        .maybeSingle();

      if (!error && data?.language) {
        const dbLanguage: Language = data.language === "EN" ? "EN" : "AR";
        finalLanguage = dbLanguage;
        setLanguage(dbLanguage);
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, dbLanguage);
      } else if (!error && !data) {
        await supabase.from("user_settings").upsert(
          {
            user_id: realUserId,
            language: finalLanguage,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
      }

      await syncAuthLanguageMetadata(finalLanguage);
    } catch (error) {
      console.log("Load language error:", error);
    }
  };

  const changeLanguage = async (lang: Language) => {
    try {
      setLanguage(lang);
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);

      if (!realUserId) return;

      await supabase.from("user_settings").upsert(
        {
          user_id: realUserId,
          language: lang,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

      await syncAuthLanguageMetadata(lang);
    } catch (error) {
      console.log("Change language error:", error);
    }
  };

  const toggleLanguage = async () => {
    await changeLanguage(language === "AR" ? "EN" : "AR");
  };

  const value = useMemo(
    () => ({
      language,
      isArabic: language === "AR",
      t: translations[language],
      changeLanguage,
      toggleLanguage,
    }),
    [language]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
}
