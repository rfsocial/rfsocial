const {body, validationResult} = require("express-validator");

const validateMessage = [
    body('text')
        .isEmpty().withMessage('Az üzenet nem lehet üres.')
        .isString().withMessage('Az üzenet nem szöveg.')
        .isLength({max: 1000}).withMessage('Az üzenet maximum 1000 karakter lehet.'),

    body('attachment')
        .optional()
        .isString().withMessage('A melléklet nem szöveg.'),

    body('sender_id')
        .notEmpty().withMessage('A küldő id nem lehet üres.')
        .isInt().withMessage('A küldő id nem szám.'),

    body('chat_id')
        .notEmpty().withMessage('A chat id nem lehet üres.')
        .isInt().withMessage('A chat id nem szám.'),

    body('date')
        .notEmpty().withMessage('Az üzenet dátuma nem lehet üres.')
        .isDate().withMessage('Az üzenet dátuma nem dátum.'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }
        next();
    }
];
module.exports = validateMessage;
