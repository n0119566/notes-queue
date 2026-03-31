"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const NoteSchema = new mongoose_1.Schema({
    user: { type: String, required: true },
    title: { type: String, required: false, trim: true, maxlength: 255 },
    content: { type: String, required: true, trim: true, maxlength: 10000 },
    labels: { type: [String], default: [], required: false },
    isFavorite: { type: Boolean, default: false },
    image: { type: String, required: false },
    archived: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false },
    deletedDate: { type: Date, required: false },
    expirationDate: { type: Date, required: false },
    url: {
        type: {
            url: { type: String },
            text: { type: String },
            index: { type: Number },
            lastIndex: { type: Number },
            image: { type: String },
            siteName: { type: String },
            description: { type: String },
        },
        required: false,
    },
    updated: { type: Date, default: Date.now },
    created: { type: Date, default: Date.now },
});
exports.default = mongoose_1.default.model("Note", NoteSchema);
//# sourceMappingURL=Note.js.map