import { Document } from "mongoose";
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
declare const _default: any;
export default _default;
//# sourceMappingURL=Note.d.ts.map