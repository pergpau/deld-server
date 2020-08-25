class apiError extends Error {
    constructor(statusCode, message, ...params) {
        super(...params);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.apiError);
          }
        
        this.statusCode = statusCode;
        this.message = message;
    }
};

class SQLError extends apiError {
    constructor(statusCode, message, sqlmessage = '', ...params) {
        super(statusCode, message, ...params);
        this.sqlmessage = sqlmessage;
    }
    toString() {
        return "SQL Error:" + this.message + this.sqlmessage
    }
};

const handleError = (err, res) => {
    const { statusCode, message } = err;
    console.log(err)
    res.status(statusCode).json({
        status: "error",
        statusCode,
        message
    });
};

module.exports = {
    apiError,
    handleError,
    SQLError
}