class AppError extends Error {
    constructor(status = 500, message, error = []) {
        super(message);
        this.statusCode = status;
        this.errors = Array.isArray(error) ? error : [error];
    }
}

export default AppError;