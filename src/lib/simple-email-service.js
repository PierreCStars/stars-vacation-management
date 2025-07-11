"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSimpleEmail = sendSimpleEmail;
exports.sendGmailSMTP = sendGmailSMTP;
exports.sendResendEmail = sendResendEmail;
exports.sendCustomSMTP = sendCustomSMTP;
exports.sendEmailWithFallbacks = sendEmailWithFallbacks;
var nodemailer_1 = require("nodemailer");
// Simple email service using Nodemailer
function sendSimpleEmail(to, subject, body) {
    return __awaiter(this, void 0, void 0, function () {
        var testAccount, transporter, info, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    console.log('📧 Attempting to send email via Ethereal (test service)...');
                    console.log('📧 To:', to);
                    console.log('📧 Subject:', subject);
                    return [4 /*yield*/, nodemailer_1.default.createTestAccount()];
                case 1:
                    testAccount = _a.sent();
                    transporter = nodemailer_1.default.createTransport({
                        host: 'smtp.ethereal.email',
                        port: 587,
                        secure: false,
                        auth: {
                            user: testAccount.user,
                            pass: testAccount.pass,
                        },
                    });
                    return [4 /*yield*/, transporter.sendMail({
                            from: '"Vacation Management" <noreply@stars.mc>',
                            to: to.join(', '),
                            subject: subject,
                            html: body,
                        })];
                case 2:
                    info = _a.sent();
                    console.log('✅ Simple email sent successfully');
                    console.log('📧 Message ID:', info.messageId);
                    console.log('📧 Preview URL:', nodemailer_1.default.getTestMessageUrl(info));
                    return [2 /*return*/, { success: true, messageId: info.messageId, previewUrl: nodemailer_1.default.getTestMessageUrl(info) }];
                case 3:
                    error_1 = _a.sent();
                    console.error('❌ Simple email failed:', error_1);
                    return [2 /*return*/, { success: false, error: error_1 }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Alternative: Use Gmail SMTP (if you have Gmail credentials)
function sendGmailSMTP(to, subject, body) {
    return __awaiter(this, void 0, void 0, function () {
        var gmailUser, smtpPassword, transporter, info, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    console.log('📧 Attempting to send email via Gmail SMTP...');
                    console.log('📧 To:', to);
                    console.log('📧 Subject:', subject);
                    console.log('📧 Gmail User:', process.env.GMAIL_USER ? 'Set' : 'NOT SET');
                    console.log('📧 SMTP Password:', process.env.SMTP_PASSWORD ? 'Set' : 'NOT SET');
                    console.log('📧 SMTP User:', process.env.SMTP_USER ? 'Set' : 'NOT SET');
                    console.log('📧 SMTP From:', process.env.SMTP_FROM ? 'Set' : 'NOT SET');
                    gmailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
                    smtpPassword = process.env.SMTP_PASSWORD || process.env.GMAIL_APP_PASSWORD;
                    if (!gmailUser || !smtpPassword) {
                        console.error('❌ Gmail credentials not configured');
                        console.error('❌ Gmail User:', gmailUser ? 'Set' : 'NOT SET');
                        console.error('❌ SMTP Password:', smtpPassword ? 'Set' : 'NOT SET');
                        throw new Error('Gmail credentials not configured');
                    }
                    transporter = nodemailer_1.default.createTransport({
                        service: 'gmail',
                        auth: {
                            user: gmailUser,
                            pass: smtpPassword,
                        },
                    });
                    return [4 /*yield*/, transporter.sendMail({
                            from: process.env.SMTP_FROM || gmailUser,
                            to: to.join(', '),
                            subject: subject,
                            html: body,
                        })];
                case 1:
                    info = _a.sent();
                    console.log('✅ Gmail SMTP email sent successfully');
                    console.log('📧 Message ID:', info.messageId);
                    return [2 /*return*/, { success: true, messageId: info.messageId }];
                case 2:
                    error_2 = _a.sent();
                    console.error('❌ Gmail SMTP failed:', error_2);
                    return [2 /*return*/, { success: false, error: error_2 }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Alternative: Use Resend (more reliable)
function sendResendEmail(to, subject, body) {
    return __awaiter(this, void 0, void 0, function () {
        var response, error, result, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    console.log('📧 Attempting to send email via Resend...');
                    console.log('📧 To:', to);
                    console.log('📧 Subject:', subject);
                    if (!process.env.RESEND_API_KEY) {
                        console.error('❌ Resend API key not configured');
                        throw new Error('Resend API key not configured');
                    }
                    return [4 /*yield*/, fetch('https://api.resend.com/emails', {
                            method: 'POST',
                            headers: {
                                'Authorization': "Bearer ".concat(process.env.RESEND_API_KEY),
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                from: 'Vacation Management <onboarding@resend.dev>',
                                to: to,
                                subject: subject,
                                html: body,
                            }),
                        })];
                case 1:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.text()];
                case 2:
                    error = _a.sent();
                    throw new Error("Resend API error: ".concat(error));
                case 3: return [4 /*yield*/, response.json()];
                case 4:
                    result = _a.sent();
                    console.log('✅ Resend email sent successfully');
                    console.log('📧 Message ID:', result.id);
                    return [2 /*return*/, { success: true, messageId: result.id }];
                case 5:
                    error_3 = _a.sent();
                    console.error('❌ Resend email failed:', error_3);
                    return [2 /*return*/, { success: false, error: error_3 }];
                case 6: return [2 /*return*/];
            }
        });
    });
}
// Custom SMTP (using environment variables)
function sendCustomSMTP(to, subject, body) {
    return __awaiter(this, void 0, void 0, function () {
        var transporter, info, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    console.log('📧 Attempting to send email via Custom SMTP...');
                    console.log('📧 To:', to);
                    console.log('📧 Subject:', subject);
                    console.log('📧 SMTP Host:', process.env.SMTP_HOST);
                    console.log('📧 SMTP Port:', process.env.SMTP_PORT);
                    console.log('📧 SMTP User:', process.env.SMTP_USER ? 'Set' : 'NOT SET');
                    console.log('📧 SMTP From:', process.env.SMTP_FROM ? 'Set' : 'NOT SET');
                    transporter = nodemailer_1.default.createTransport({
                        host: process.env.SMTP_HOST,
                        port: Number(process.env.SMTP_PORT),
                        secure: process.env.SMTP_SECURE === 'true',
                        auth: {
                            user: process.env.SMTP_USER,
                            pass: process.env.SMTP_PASSWORD,
                        },
                    });
                    return [4 /*yield*/, transporter.sendMail({
                            from: process.env.SMTP_FROM,
                            to: to.join(', '),
                            subject: subject,
                            html: body,
                        })];
                case 1:
                    info = _a.sent();
                    console.log('✅ Custom SMTP email sent successfully');
                    console.log('📧 Message ID:', info.messageId);
                    return [2 /*return*/, { success: true, messageId: info.messageId }];
                case 2:
                    error_4 = _a.sent();
                    console.error('❌ Custom SMTP failed:', error_4);
                    return [2 /*return*/, { success: false, error: error_4 }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Enhanced email service with multiple fallbacks
function sendEmailWithFallbacks(to, subject, body) {
    return __awaiter(this, void 0, void 0, function () {
        var smtpResult, error_5, resendResult, error_6, gmailResult, error_7, etherealResult, error_8;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('📧 Starting email send with fallbacks...');
                    console.log('📧 To:', to);
                    console.log('📧 Subject:', subject);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, sendCustomSMTP(to, subject, body)];
                case 2:
                    smtpResult = _a.sent();
                    if (smtpResult.success) {
                        console.log('✅ Email sent successfully via Custom SMTP');
                        return [2 /*return*/, smtpResult];
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_5 = _a.sent();
                    console.log('⚠️ Custom SMTP failed, trying Resend...');
                    return [3 /*break*/, 4];
                case 4:
                    _a.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, sendResendEmail(to, subject, body)];
                case 5:
                    resendResult = _a.sent();
                    if (resendResult.success) {
                        console.log('✅ Email sent successfully via Resend');
                        return [2 /*return*/, resendResult];
                    }
                    return [3 /*break*/, 7];
                case 6:
                    error_6 = _a.sent();
                    console.log('⚠️ Resend failed, trying Gmail SMTP...');
                    return [3 /*break*/, 7];
                case 7:
                    _a.trys.push([7, 9, , 10]);
                    return [4 /*yield*/, sendGmailSMTP(to, subject, body)];
                case 8:
                    gmailResult = _a.sent();
                    if (gmailResult.success) {
                        console.log('✅ Email sent successfully via Gmail SMTP');
                        return [2 /*return*/, gmailResult];
                    }
                    return [3 /*break*/, 10];
                case 9:
                    error_7 = _a.sent();
                    console.log('⚠️ Gmail SMTP failed, trying Ethereal...');
                    return [3 /*break*/, 10];
                case 10:
                    _a.trys.push([10, 12, , 13]);
                    return [4 /*yield*/, sendSimpleEmail(to, subject, body)];
                case 11:
                    etherealResult = _a.sent();
                    if (etherealResult.success) {
                        console.log('✅ Email sent successfully via Ethereal (test service)');
                        console.log('📧 Preview URL:', etherealResult.previewUrl);
                        return [2 /*return*/, etherealResult];
                    }
                    return [3 /*break*/, 13];
                case 12:
                    error_8 = _a.sent();
                    console.log('⚠️ Ethereal failed...');
                    return [3 /*break*/, 13];
                case 13:
                    // Final fallback: console log
                    console.log('❌ All email services failed, logging to console:');
                    console.log('=== EMAIL NOTIFICATION ===');
                    console.log('To:', to.join(', '));
                    console.log('Subject:', subject);
                    console.log('Body:', body);
                    console.log('========================');
                    return [2 /*return*/, {
                            success: false,
                            error: 'All email services failed',
                            fallback: 'Logged to console'
                        }];
            }
        });
    });
}
