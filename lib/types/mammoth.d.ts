declare module "mammoth" {
  interface ExtractRawTextResult {
    value: string;
    messages: any[];
  }

  export function extractRawText(options: {
    path: string;
  }): Promise<ExtractRawTextResult>;
}
