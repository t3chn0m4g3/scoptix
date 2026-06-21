declare module "wappalyzer-core" {
  const Wappalyzer: {
    technologies: unknown;
    categories: unknown;
    setTechnologies(data: unknown): void;
    setCategories(data: unknown): void;
    analyze(input: {
      url?: string;
      headers?: Record<string, string[]>;
      cookies?: Record<string, string[]>;
      html?: string;
      scriptSrc?: string[];
      meta?: Record<string, string[]>;
      [k: string]: unknown;
    }): unknown[];
    resolve(detections: unknown[]): Array<{
      name: string;
      version?: string;
      confidence?: number;
      icon?: string;
      website?: string;
      cpe?: string;
      categories?: Array<{ id: number; name: string; slug?: string }>;
    }>;
  };
  export default Wappalyzer;
}
