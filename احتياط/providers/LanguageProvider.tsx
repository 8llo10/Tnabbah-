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
    chatTitle: "المساعد",
    chatWelcome: "مرحبًا بك، كيف أقدر أساعدك اليوم؟",
    chatInputPlaceholder: "اكتبي رسالتك...",
    chatLoginRequired: "لازم تسجلين دخول أولًا عشان أقدر أقرأ بيانات سيارتك.",
    chatNoAssistantReply:
      'ما وصلني رد من المساعد. تأكدي إن الـ workflow في n8n يرجّع رد عبر "Respond to Webhook".',
    chatTimeout:
      "انتهت مدة الانتظار. تأكدي إن الـ workflow في n8n شغّال Active.",
    chatNetworkError:
      "فشل الاتصال بالشبكة. تأكدي من:\n• إن الـ Workflow في n8n مفعّل Active\n• إن الرابط صحيح webhook وليس webhook-test",
    chatConnectionError: "تعذّر الاتصال بالمساعد.",

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
    walletIgnore: "تجاهل",
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

    connectionStep3Title: "اختيار اتصال البلوتوث",
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
    fullName: "الاسم الكامل",
    fullNamePlaceholder: "اكتب الاسم الكامل",
    registerButton: "تسجيل حساب جديد",
    registering: "جاري التسجيل...",
    alreadyHaveAccount: "لديك حساب بالفعل؟",

    enterFullName: "أدخل الاسم الكامل",
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
    enterEmail: "أدخلي البريد الإلكتروني",
    enterPassword: "أدخلي كلمة المرور",
    wrongEmailOrPassword: "البريد أو كلمة المرور غير صحيحة",
    verifyError: "تعذر التحقق من الحساب، حاولي مرة أخرى",
    unexpectedError: "صار خطأ غير متوقع، حاولي مرة أخرى",

    startWelcome: "مرحباً بك في",
    startBrand: "تنبه",
    startSubtitle: "لأن سيارتك تحتاج من ينتبه لها",
    languageButton: "En",

    home: "الرئيسية",
    wallet: "المحفظة",
    settings: "الإعدادات",
  },

  EN: {
    chatTitle: "Assistant",
    chatWelcome: "Welcome! How can I help you today?",
    chatInputPlaceholder: "Type your message...",
    chatLoginRequired: "Please log in first so I can read your car data.",
    chatNoAssistantReply:
      'I did not receive a reply from the assistant. Make sure the n8n workflow returns a response using "Respond to Webhook".',
    chatTimeout: "The request timed out. Make sure the n8n workflow is active.",
    chatNetworkError:
      "Network connection failed. Make sure:\n• The n8n workflow is active\n• The URL is a webhook URL, not webhook-test",
    chatConnectionError: "Could not connect to the assistant.",

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
    walletIgnore: "Ignore",
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
    fullName: "Full Name",
    fullNamePlaceholder: "Enter your full name",
    registerButton: "Create Account",
    registering: "Creating account...",
    alreadyHaveAccount: "Already have an account?",

    enterFullName: "Enter your full name",
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

  const loadLanguage = async () => {
    try {
      const localLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

      if (localLanguage === "EN" || localLanguage === "AR") {
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
        setLanguage(dbLanguage);
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, dbLanguage);
      }
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