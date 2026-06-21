import { ZodError } from 'zod';
export const validate = (schema, source = 'body') => async (req, _res, next) => {
    try {
        req[source] = await schema.parseAsync(req[source]);
        next();
    }
    catch (error) {
        if (error instanceof ZodError) {
            next(error);
        }
        else {
            next(error);
        }
    }
};
//# sourceMappingURL=validate.js.map