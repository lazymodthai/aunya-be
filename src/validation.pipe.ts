import { MSG_MASTER } from "@/message/msg-master";
import { ArgumentMetadata, BadRequestException, PipeTransform, ValidationPipe } from "@nestjs/common"
export class GlobalValidationPipe extends ValidationPipe {
    public async transform(value, metadata: ArgumentMetadata) {
        try {
            return await super.transform(value, metadata)
        } catch (e) {
            if (e instanceof BadRequestException) {
                const response = e.getResponse() as any;
                if (typeof response === 'object' && response.message && Array.isArray(response.message)) {
                    // Combine the specific validation messages from class-validator
                    const specificMessages = response.message.join(', ');

                    // Create a new error object that includes both the standard message and the specific details
                    const errorPayload = {
                        ...MSG_MASTER.INVALID_PARAMETERS,
                        // description: `${MSG_MASTER.INVALID_PARAMETERS.description}: ${specificMessages}`
                        description: `${specificMessages}`
                    };
                    throw new BadRequestException(errorPayload);
                }
            }
            // Re-throw the original exception if it's not a validation error we want to handle
            throw e;
        }
    }
}
export class RemoveEmptyStringPipe implements PipeTransform {
    transform(value: any) {
        if (!value || typeof value !== 'object') return value;
        Object.keys(value).forEach(key => {
            const v = value[key];
            if (
                v === '' ||
                v === null ||
                v === undefined ||
                (typeof v === 'string' && v.trim() === '') ||
                v === 'null' ||
                v === 'undefined'
            ) {
                value[key] = undefined;
            }
        });

        return value;
    }
}