import mongoose, { Document, Schema } from "mongoose";

export interface LinkData {
  url?: string;
  text?: string;
  index?: number;
  lastIndex?: number;
  image?: string;
  siteName?: string;
  description?: string;
}

export interface Note extends Document {
  user: string;
  title: string;
  content: string;
  labels: string[];
  isFavorite: boolean;
  updated: Date;
  image: string;
  archived: boolean;
  deleted: boolean;
  deletedDate: Date;
  created: Date;
  url: LinkData;
  expirationDate: Date;
}

const NoteSchema: Schema = new Schema({
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

export default mongoose.model<Note>("Note", NoteSchema);
