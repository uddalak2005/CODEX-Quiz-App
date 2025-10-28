import jwt from "jsonwebtoken";

function verifyJWT(req, res, next) {
    const token = req.headers.authorisation?.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            message: "Unauthorised"
        })
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status("403").json({
                message: "Forbidden"
            })
        }

        req.user = {
            userId: decoded.user_id,
            email: decoded.email,
        }

        next();
    })

}

export default verifyJWT;