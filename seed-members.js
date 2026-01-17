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
var client_1 = require("@prisma/client");
var fs_1 = require("fs");
var csv_parser_1 = require("csv-parser");
var bcryptjs_1 = require("bcryptjs");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var hash, results;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, bcryptjs_1.default.hash("2025ACM", 10)];
                case 1:
                    hash = _a.sent();
                    results = [];
                    // ✅ Direct relative path (no variable)
                    fs_1.default.createReadStream("prisma/seed/members.csv")
                        .pipe((0, csv_parser_1.default)({
                        // Normalize headers → lowercase + single spaces
                        mapHeaders: function (_a) {
                            var header = _a.header;
                            return header.trim().toLowerCase().replace(/\s+/g, " ");
                        },
                    }))
                        .on("data", function (data) { return results.push(data); })
                        .on("end", function () { return __awaiter(_this, void 0, void 0, function () {
                        var inserted, _i, results_1, m, email, studentId, err_1;
                        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
                        return __generator(this, function (_m) {
                            switch (_m.label) {
                                case 0:
                                    console.log("\uD83D\uDCCA Parsed ".concat(results.length, " members"));
                                    console.log("🧩 Headers detected:", Object.keys(results[0]));
                                    inserted = 0;
                                    console.log("First row sample:", results[0]);
                                    console.log("All headers:", Object.keys(results[0]));
                                    _i = 0, results_1 = results;
                                    _m.label = 1;
                                case 1:
                                    if (!(_i < results_1.length)) return [3 /*break*/, 6];
                                    m = results_1[_i];
                                    email = (_a = m["personal email address"]) === null || _a === void 0 ? void 0 : _a.trim();
                                    studentId = (_b = m["student id"]) === null || _b === void 0 ? void 0 : _b.trim();
                                    if (!email) {
                                        console.warn("\u26A0\uFE0F Skipping ".concat(studentId || "(no ID)", " - No personal email"));
                                        return [3 /*break*/, 5];
                                    }
                                    _m.label = 2;
                                case 2:
                                    _m.trys.push([2, 4, , 5]);
                                    return [4 /*yield*/, prisma.user.create({
                                            data: {
                                                firstName: ((_c = m["first name"]) === null || _c === void 0 ? void 0 : _c.trim()) || "",
                                                middleName: ((_d = m["middle name"]) === null || _d === void 0 ? void 0 : _d.trim()) || "",
                                                lastName: ((_e = m["surname"]) === null || _e === void 0 ? void 0 : _e.trim()) || "",
                                                personalEmail: email,
                                                schoolEmail: ((_f = m["fit email"]) === null || _f === void 0 ? void 0 : _f.trim()) || "",
                                                contactNumber: ((_g = m["contact no."]) === null || _g === void 0 ? void 0 : _g.trim()) || "",
                                                facebookLink: ((_h = m["facbook link"]) === null || _h === void 0 ? void 0 : _h.trim()) || "",
                                                discordName: ((_j = m["discord username"]) === null || _j === void 0 ? void 0 : _j.trim()) || "",
                                                studentId: studentId,
                                                yearLevel: parseInt(m["year level"]) || 0,
                                                degreeProgram: ((_k = m["degree program"]) === null || _k === void 0 ? void 0 : _k.trim()) || "",
                                                password: hash,
                                            },
                                        })];
                                case 3:
                                    _m.sent();
                                    inserted++;
                                    if (inserted % 50 === 0) {
                                        console.log("\u2705 Inserted ".concat(inserted, "/").concat(results.length, " members..."));
                                    }
                                    return [3 /*break*/, 5];
                                case 4:
                                    err_1 = _m.sent();
                                    console.error("\u274C Failed to insert ".concat(studentId, " (").concat(email, "):"), ((_l = err_1.meta) === null || _l === void 0 ? void 0 : _l.target) || err_1.message);
                                    return [3 /*break*/, 5];
                                case 5:
                                    _i++;
                                    return [3 /*break*/, 1];
                                case 6:
                                    console.log("\uD83C\uDF89 Done! Successfully inserted ".concat(inserted, "/").concat(results.length, " members."));
                                    return [4 /*yield*/, prisma.$disconnect()];
                                case 7:
                                    _m.sent();
                                    process.exit();
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(function (err) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.error("❌ Seeder error:", err);
                return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                process.exit(1);
                return [2 /*return*/];
        }
    });
}); });
