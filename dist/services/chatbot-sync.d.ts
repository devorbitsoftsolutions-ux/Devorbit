export declare function generateDynamicQA(): Promise<{
    question: string;
    answer: string;
    source: "static" | "service" | "portfolio" | "job" | "initiative" | "consulting" | "settings";
}[]>;
export declare function generatePDFText(): Promise<string>;
export declare function writeDatabaseJson(): Promise<{
    question: string;
    answer: string;
    source: "static" | "service" | "portfolio" | "job" | "initiative" | "consulting" | "settings";
}[]>;
//# sourceMappingURL=chatbot-sync.d.ts.map