import { Request, Response, NextFunction } from 'express';
interface ValidationRule {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    enum?: string[];
    format?: 'email' | 'url';
    pattern?: RegExp;
}
interface ValidationSchema {
    body?: Record<string, ValidationRule>;
    query?: Record<string, ValidationRule>;
    params?: Record<string, ValidationRule>;
}
export declare const validateRequest: (schema: ValidationSchema) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export {};
//# sourceMappingURL=validateRequest.d.ts.map